console.log("start of FedEx Points");
const FedEx = {

    TABLE_ID: "fxpointstable",
    api_url: "https://yo6lbyfxd1.execute-api.us-east-1.amazonaws.com/prod/getgames",

    FX_TABLE_HEADER: `
        <tr>
            <th colspan="2" style="text-align:center" class="header">FedEx Cup Standings</th>
        </tr>
        <tr id="title">
            <th style="padding:8px" class="header">Player</th>
            <th class="numeric header" style="text-align:center">FedEx Cup Points</th>
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
        return `<tbody>${players.map((member, index) => `
            <tr>
                <td>${member.nickname}</td>
                <td>${fscores[index]}</td>
            </tr>`
        ).join('')}</tbody>`;
    },

    updateTable(tableContent) {
        const tableElement = document.getElementById(this.TABLE_ID);
        if (!tableElement) {
            console.error("Table element not found");
            return;
        }
    
        // Add the standings-table class to the table element
        tableElement.className = 'standings-table';
        
        // Create temporary table for sorting
        const tempTable = document.createElement('table');
        tempTable.innerHTML = tableContent;  // Just add the content, not the header
    
        // Get all rows from tbody
        let rows = Array.from(tempTable.getElementsByTagName('tbody')[0].rows);
        
        // Sort the rows
        rows.sort((a, b) => {
            const aValue = parseFloat(a.getElementsByTagName("td")[1].innerHTML) || 0;
            const bValue = parseFloat(b.getElementsByTagName("td")[1].innerHTML) || 0;
            return bValue - aValue;
        });
    
        // Store rankings after sort
        window.regularSeasonRankings = rows.map((row, index) => {
            const playerName = row.getElementsByTagName("td")[0].innerText;
            return {
                playerName: playerName,
                rank: index + 1
            };
        });
    
        // Construct final table content with header once and sorted body
        tableElement.innerHTML = this.FX_TABLE_HEADER + 
                               `<tbody>${rows.map(row => row.outerHTML).join('')}</tbody>`;
    },
    
    showFedex(fxdata) {
        if (!fxdata || !fxdata.games) {
            console.error('Invalid game data received');
            return;
        }
    
//        console.log("Checking regularSeasonRankings:", window.regularSeasonRankings);
       
        // Function to wait for rankings to be available
        const waitForRankings = (maxAttempts = 10) => {
            return new Promise((resolve, reject) => {
                let attempts = 0;
                const checkRankings = () => {
//                    console.log("Checking for rankings, attempt:", attempts + 1);
                    if (window.regularSeasonRankings) {
//                        console.log("Rankings found:", window.regularSeasonRankings);
                        // Create reversed rankings
                        const totalPlayers = window.regularSeasonRankings.length;
                        const reversedRankings = window.regularSeasonRankings.map(ranking => ({
                            ...ranking,
                            rank: totalPlayers - ranking.rank + 1
                        }));
//                        console.log("Reversed rankings:", reversedRankings);
                        resolve(reversedRankings);
                    } else if (attempts >= maxAttempts) {
                        reject(new Error("Regular season rankings not available after maximum attempts"));
                    } else {
                        attempts++;
                        setTimeout(checkRankings, 500);
                    }
                };
                checkRankings();
            });
        };
        
        waitForRankings()
        .then(() => fetch('/static/playersbj.json'))
        .then(response => response.json())
        .then(data => {
            const fscores = this.calculatePlayerScores(fxdata, data.members.length);
//            console.log(data.members.length);
            
            // Apply ranking bonus with reversed rankings
            const adjustedScores = fscores.map((score, index) => {
                const playerName = data.members[index].nickname;
                const playerRanking = window.regularSeasonRankings.find(
                    r => r.playerName === playerName
                );
                
                if (playerRanking) {
                    const reversedRank = window.regularSeasonRankings.length - playerRanking.rank + 1;
                    const rankingBonus = reversedRank - window.regularSeasonRankings.length/2;
                    
                     if (playerRanking.rank > window.regularSeasonRankings.length/2) {
                        return (parseFloat(score) + rankingBonus - 1).toFixed(DECIMAL_PLACES);
                    } else {
                        return (parseFloat(score) + rankingBonus).toFixed(DECIMAL_PLACES);
                    }
                }
                return score;
            });
    
            const tableRows = this.buildTableRows(data.members, adjustedScores);
            this.updateTable(tableRows);
        })
        .catch(error => {
            console.error('Error processing FedEx standings:', error);
        });
    
    },
    
    
     
    init: async function() {
//        console.log("FedEx init starting...");  // Add this line
        try {
            const response = await fetch(this.api_url);
//            console.log("API response:", response);  // Add this line
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const fxdata = await response.json();
//            console.log("FedEx data received:", fxdata);  // Add this line
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
//    console.log("DOM Content Loaded - initializing FedEx");
    FedEx.init();
});
