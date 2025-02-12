const bjapi_url = "https://yo6lbyfxd1.execute-api.us-east-1.amazonaws.com/prod/getgames";
console.log("start of Brown Jacket Points");
const REGULAR_SEASON_CUTOFF = '0922';
const DECIMAL_PLACES = 1;
const BJP_TABLE_ID = "bjpointstable"; 

const BJP_TABLE_HEADER = `
<tr>
    <th colspan="2" style="text-align:center">Regular Season Standings</th>
</tr>
<tr id="title">
    <th style="padding:8px">Player</th>
    <th class="numeric" style="text-align:center">BJG Points</th>
</tr>`

function calculatePlayerScores(bjdata, playerCount) {
    const btot = new Array(playerCount).fill(0);
    const roundbtot = new Array(playerCount).fill(0);

    bjdata.games.forEach(game => {
        const datecode = parseGameDate(game.uuid);  // removed 'this.'
        
        if (Number(datecode) < Number(REGULAR_SEASON_CUTOFF)) {
            if (game.bscores && Array.isArray(game.bscores)) {
                for (let p = 0; p < playerCount; p++) {
                    const score = processScore(game.bscores[p]);  // removed 'this.'
                    btot[p] += score;
                    roundbtot[p] = btot[p].toFixed(DECIMAL_PLACES);
                }
            } else {
                console.warn(`Missing or invalid bscores for game: ${game.uuid}`);
            }
        }
    });

    return roundbtot;
}

function processScore(bscore) {
    if (bscore === "" || bscore === undefined) {
        return 0;
    }
    return Number(bscore);
}

function parseGameDate(uuid) {
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
}


async function getapi(url) { 
    try {
        const response = await fetch(url); 
                
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const bjdata = await response.json(); 
        hideloader(); 
        showBjs(bjdata); 
    } catch (error) {
        console.error('Error fetching game data:', error);
        document.getElementById('loading').textContent = 'Error loading data';
    }
} 

function hideloader() {
    const loader = document.getElementById('loading');
    if (loader) {
        loader.style.display = 'none';
    }
}

function calculatePlayerScores(bjdata, playerCount) {
    const btot = new Array(playerCount).fill(0);
    const roundbtot = new Array(playerCount).fill(0);

    bjdata.games.forEach(game => {
        const datecode = parseGameDate(game.uuid);  // removed 'this.'
        
        if (Number(datecode) < Number(REGULAR_SEASON_CUTOFF)) {
            if (game.bscores && Array.isArray(game.bscores)) {
                for (let p = 0; p < playerCount; p++) {
                    const score = processScore(game.bscores[p]);  // removed 'this.'
                    btot[p] += score;
                    roundbtot[p] = btot[p].toFixed(DECIMAL_PLACES);
                }
            } else {
                console.warn(`Missing or invalid bscores for game: ${game.uuid}`);
            }
        }
    });

    return roundbtot;
}

function updateTable(tableContent) {
    const tableElement = document.getElementById(BJP_TABLE_ID);
    if (!tableElement) {
        console.error("Table element not found");
        return;
    }

    // First, create a temporary table to parse the content
    const tempTable = document.createElement('table');
    tempTable.innerHTML = BJP_TABLE_HEADER + tableContent;

    // Convert rows to array and sort
    let rows = Array.from(tempTable.rows);
    
    // Separate header rows (first two rows) and data rows
    let headerRows = rows.slice(0, 2);
    let dataRows = rows.slice(2);

    // Sort only the data rows
    dataRows.sort((a, b) => {
        if (!a.getElementsByTagName("td")[1] || !b.getElementsByTagName("td")[1]) {
            return 0; // Skip if elements don't exist
        }
        const aValue = parseFloat(a.getElementsByTagName("td")[1].innerHTML) || 0;
        const bValue = parseFloat(b.getElementsByTagName("td")[1].innerHTML) || 0;
        return bValue - aValue; // Sort in descending order
    });

    // Store rankings after sort
    window.regularSeasonRankings = dataRows.map((row, index) => {
        const playerName = row.getElementsByTagName("td")[0].innerText;
//        console.log(`Storing ranking: ${playerName} at position ${index}`);
        return {
            playerName: playerName,
            rank: index + 1
        };
    });

    console.log("Regular Season Rankings:", window.regularSeasonRankings);

    // Build the sorted table HTML
    const sortedTableContent = headerRows.map(row => row.outerHTML).join('') + 
                             dataRows.map(row => row.outerHTML).join('');
    
    // Update the actual table
    tableElement.innerHTML = sortedTableContent;
    tableElement.className = "standings-table";
}


function buildTableRows(players, bscores) {
    return players.map((member, index) => `
        <tr>
            <td>${member.nickname}</td>
            <td class="numeric">${bscores[index]}</td>
        </tr>`
    ).join('');
}

function showBjs(bjdata) {
    if (!bjdata || !bjdata.games) {
        console.error('Invalid game data received');
        return;
    }

    fetch('/static/playersbj.json')
        .then(response => response.json())
        .then(data => {
            const bscores = calculatePlayerScores(bjdata, data.members.length);
            const tableRows = buildTableRows(data.members, bscores);
            updateTable(tableRows);  // Note: now only passing the body rows
        })
        .catch(error => {
            console.error('Error loading player data:', error);
        });
}

// Initialize
getapi(bjapi_url);
