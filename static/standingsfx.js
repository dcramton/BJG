console.log("start of FedEx Points");
const FedEx = {

    api_url: "https://yo6lbyfxd1.execute-api.us-east-1.amazonaws.com/prod/getgames",

    FX_TABLE_HEADER: `
        <tr>
            <th colspan="2" style="text-align:center">FedEx Cup Standings</th>
        </tr>
        <tr id="title">
            <th style="padding:8px">Player</th>
            <th class="numeric" style="text-align:center">FedEx Cup Points</th>
        </tr>`,
    
    processScore: function(score) {
        if (score === "" || score === undefined) {
            return 0;
        }
        return Number(score);
    },

    parseGameDate: function(uuid) {
        try {
            const [year, month, date] = uuid.split("-");
            if (!year || !month || !date) {
                throw new Error(`Invalid UUID format: ${uuid}`);
            }
            return month.concat("", date);
        } catch (error) {
            console.error(`Error parsing game date: ${error.message}`);
            return '0000';
        }
    },

    calculatePlayerScores: function(fxdata, playerCount) {
//        console.log("FedEx Data received:", fxdata); // Check the incoming data
        const ftot = new Array(playerCount).fill(0);
        const roundftot = new Array(playerCount).fill(0);
    
        fxdata.games.forEach(game => {
            const datecode = this.parseGameDate(game.uuid);
//          console.log("Complete game object:", JSON.stringify(game, null, 2)); // This will show all properties
//          console.log("Game:", game);
//          console.log("fscores:", game.bscores);
//          console.log(datecode, REGULAR_SEASON_CUTOFF);
            
            if (Number(datecode) >= Number(REGULAR_SEASON_CUTOFF)) {
                if (game.bscores && Array.isArray(game.bscores)) {
                    for (let p = 0; p < playerCount; p++) {
                        const score = this.processScore(game.bscores[p]);
//                        console.log(datecode, `Player ${p} score:`, score); // Check individual scores
                        ftot[p] += score;
                        roundftot[p] = ftot[p].toFixed(DECIMAL_PLACES);
                    }
                } else {
                    console.warn(`Missing or invalid fscores for game: ${game.uuid}`);
                }
            }
        });
    
//        console.log("Final scores:", roundftot); // Check final calculated scores
        return roundftot;
    },
    

    buildTableRows: function(players, fscores) {
        return players.map((member, index) => `
            <tr>
                <td>${member.nickname}</td>
                <td class="numeric">${fscores[index]}</td>
            </tr>`
        ).join('');
    },

    updateTable: function(tableContent) {
        const tableElement = document.getElementById("fedexpointstable");
        if (!tableElement) {
            console.error("Table element not found");
            return;
        }
    
        tableElement.innerHTML = tableContent;
        
        let rows = Array.from(tableElement.rows);
        const headerRow1 = rows.shift();  // First header row
        const headerRow2 = rows.shift();  // Second header row
        
        rows.sort((a, b) => {
            const aValue = parseFloat(a.getElementsByTagName("td")[1].innerHTML);
            const bValue = parseFloat(b.getElementsByTagName("td")[1].innerHTML);
            
            if (isNaN(aValue) || isNaN(bValue)) {
                console.warn('Invalid numeric values found during sort');
                return 0;
            }
            
            return bValue - aValue;
        });
    
        // Create new table HTML with both headers
        let newTableHTML = '<thead>' +
            headerRow1.outerHTML +
            headerRow2.outerHTML +
            '</thead><tbody>';
        
        // Add sorted rows
        rows.forEach(row => {
            newTableHTML += row.outerHTML;
        });
        newTableHTML += '</tbody>';
    
        // Set the new HTML
        tableElement.innerHTML = newTableHTML;
        tableElement.className = "standings-table";
    },
    
    showFedex: function(fxdata) {
        console.log("showFedex called with data:", fxdata);
        if (!fxdata || !fxdata.games) {
            console.error('Invalid game data received');
            return;
        }
    
        // First, fetch the player data
        fetch('/static/playersbj.json')
        .then(response => response.json())
        .then(data => {
            console.log("Player data loaded:", data);
            // Calculate scores
            const fscores = this.calculatePlayerScores(fxdata, data.members.length);
            console.log("Calculated scores:", fscores);
            
            // Build and update table directly without waiting for rankings
            const tableRows = this.buildTableRows(data.members, fscores);
//            console.log("Built table rows:", tableRows);
            this.updateTable(this.FX_TABLE_HEADER + tableRows);
        })
        .catch(error => {
            console.error('Error processing FedEx standings:', error);
        });
    },
    
    
    init: async function() {
        console.log("FedEx init starting...");  // Add this line
        try {
            const response = await fetch(this.api_url);
            console.log("API response:", response);  // Add this line
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const fxdata = await response.json();
            console.log("FedEx data received:", fxdata);  // Add this line
            hideloader();
            this.showFedex(fxdata);
        } catch (error) {
            console.error('Error fetching game data:', error);
            document.getElementById('loading').textContent = 'Error loading data';
        }
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Content Loaded - initializing FedEx");
    FedEx.init();
});
