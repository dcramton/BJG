import { getPlayers, getGames, showLoader, hideLoader } from "./commonscripts.js";
console.log("start of Brown Jacket Points");

const REGULAR_SEASON_CUTOFF = '0922';
const DECIMAL_PLACES = 1;
const BJP_TABLE_ID = "bjpointstable"; 
let plength=0;

const BJP_TABLE_HEADER = `
<tr>
    <th colspan="2" style="text-align:center">Regular Season Standings</th>
</tr>
<tr id="title">
    <th style="padding:8px">Player</th>
    <th class="numeric" style="text-align:center">BJG Points</th>
</tr>`;

// Main Functions
async function showBJgames(playerData, gamesData) {
    try {
        console.log("Inside function to show Regular Season Standings");
        if (!gamesData?.games) {
            throw new Error('Invalid game data format');
        }

        if (!playerData?.players_bj?.players) {
            throw new Error('Invalid player data format');
        }

        plength = playerData.players_bj.players.length;
        const bscores = calculateBJScores(gamesData, plength);
        const tableRows = buildTableRows(playerData, bscores);
        updateTable(tableRows);  
    } catch (error) {
        console.error('Error in showBJgames:', error);
        document.getElementById("games").innerHTML = 
            `<div class="error-message">${error.message}</div>`;
    }
}
function calculateBJScores(gamesData, plength) {
    const btot = Array(plength).fill(0);
    
    return gamesData.games
        .filter(game => Number(parseGameDate(game.uuid)) < Number(REGULAR_SEASON_CUTOFF))
        .reduce((scores, game) => {
            if (game.bscores?.length) {
                game.bscores.forEach((score, index) => {
                    scores[index] += processScore(score);
                });
            }
            return scores;
        }, btot)
        .map(score => score.toFixed(DECIMAL_PLACES));
}
function buildTableRows(playerData, bscores) {
        
        if (!playerData || !playerData.players_bj || !playerData.players_bj.players) {
            console.error("Invalid player data structure:", playerData);
            return '';
        }
        
        // Use the correct data structure
        return playerData.players_bj.players.map((player, index) => `
            <tr>
                <td>${player.nickname}</td>
                <td class="numeric">${bscores[index]}</td>
            </tr>`
        ).join('');
    }
function updateTable(tableContent) {
    const tableElement = document.getElementById(BJP_TABLE_ID);
    if (!tableElement) {
        console.error("Table element not found");
        return;
    }

    const tempTable = document.createElement('table');
    tempTable.innerHTML = BJP_TABLE_HEADER + tableContent;

    const [headerRow1, headerRow2, ...dataRows] = Array.from(tempTable.rows);

    // Sort data rows
    const sortedDataRows = dataRows.sort((a, b) => {
        const aValue = parseFloat(a.querySelector('td:nth-child(2)').textContent) || 0;
        const bValue = parseFloat(b.querySelector('td:nth-child(2)').textContent) || 0;
        return bValue - aValue;
    });

    // Store rankings
    window.regularSeasonRankings = sortedDataRows.map((row, index) => ({
        playerName: row.querySelector('td').textContent,
        rank: index + 1
    }));

    tableElement.innerHTML = `
        ${headerRow1.outerHTML}
        ${headerRow2.outerHTML}
        ${sortedDataRows.map(row => row.outerHTML).join('')}
    `;
    tableElement.className = "standings-table";
}

// Helper Functions 
function processScore(bscore) {
    return bscore === "" || bscore === undefined ? 0 : Number(bscore);
}
function parseGameDate(uuid) {
    try {
        const [year, month, date] = uuid.split("-");
        if (!year || !month || !date) {
            throw new Error(`Invalid UUID format: ${uuid}`);
        }
        return `${month}${date}`;
    } catch (error) {
        console.error(`Error parsing game date: ${error.message}`);
        return '0000';
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    try {
        showLoader();
        const [playerData, gamesData] = await Promise.all([
            getPlayers(),
            getGames()
        ]);
        
        if (gamesData) {
            await showBJgames(playerData, gamesData);
        }
    } catch (error) {
        console.error('Error in main flow:', error);
    } finally {
        hideLoader();
    }
});

