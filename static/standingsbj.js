import { getPlayers, getGames, showLoader, hideLoader } from "./commonscripts.js";
import { updateFedExStandings } from './standingsfx.js';
export let regularSeasonRankings = null;
export function onRankingsUpdated(callback) {
    regularSeasonRankings = callback;
}
console.log("start of Brown Jacket Points");

const DECIMAL_PLACES = 1;
const BJP_TABLE_ID = "bjpointstable"; 
let plength=0, fedExStartDate;


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
//        console.log("Inside function to show Regular Season Standings");
        if (!gamesData?.games) {
            throw new Error('Invalid game data format');
        }

        if (!playerData?.players_bj?.players) {
            throw new Error('Invalid player data format');
        }

        if (!fedExStartDate) {
            throw new Error('FedEx start date not set');
        }

        plength = playerData.players_bj.players.length;
        const bscores = calculateBJScores(gamesData, plength);
        const tableRows = buildTableRows(playerData, bscores.scores);
        updateTable(tableRows, bscores);  // Pass bscores as second parameter
    } catch (error) {
        console.error('Error in showBJgames:', error);
        document.getElementById("games").innerHTML = 
            `<div class="error-message">${error.message}</div>`;
    }
}
function calculateBJScores(gamesData, plength) {
    const btot = Array(plength).fill(0);
    
    // Calculate regular season scores
    const regularSeasonScores = gamesData.games
        .filter(game => {
            const gameDate = parseGameDate(game.uuid);
            return Number(gameDate) < Number(fedExStartDate);
        })
        .reduce((scores, game) => {
            if (game.bscores?.length) {
                game.bscores.forEach((score, index) => {
                    scores[index] += processScore(score);
                });
            }
            return scores;
        }, btot)
        .map(score => Number(score.toFixed(DECIMAL_PLACES)));

    // Create array with [score, playerIndex] pairs for ranking
    const scoreWithIndex = regularSeasonScores.map((score, index) => ({
        score,
        playerIndex: index
    }));

    // Sort by score (descending) to get rankings
    scoreWithIndex.sort((a, b) => b.score - a.score);

    // Create rankings array where index is playerIndex and value is their rank
    const rankings = new Array(plength).fill(0);
    scoreWithIndex.forEach((item, rank) => {
        rankings[item.playerIndex] = rank;
    });

//    console.log('Regular season scores:', regularSeasonScores);
//    console.log('Regular season rankings:', rankings);

    return {
        scores: regularSeasonScores,
        rankings: rankings
    };
}
function buildTableRows(playerData, scores) {
//    console.log("Inside buildTableRows function");
//    console.log("Scores:", scores); // Debug log

    if (!playerData || !playerData.players_bj || !playerData.players_bj.players) {
        console.error("Invalid player data structure:", playerData);
        return '';
    }

    return playerData.players_bj.players.map((player, index) => `
        <tr>
            <td>${player.nickname}</td>
            <td class="numeric">${scores[index] || 0}</td>
        </tr>`
    ).join('');
}
function updateTable(tableContent, bscores) {
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

    // Keep the original rankings map creation
    regularSeasonRankings = sortedDataRows.map((row, index) => ({
        playerName: row.querySelector('td').textContent,
        rank: index + 1
    }));

    // Store rankings globally for FedEx calculations
    regularSeasonRankings = bscores.rankings;
//    console.log('Stored regular season rankings:', regularSeasonRankings);

    tableElement.innerHTML = `
        ${headerRow1.outerHTML}
        ${headerRow2.outerHTML}
        ${sortedDataRows.map(row => row.outerHTML).join('')}
    `;
    tableElement.className = "standings-table";
    updateFedExStandings();
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
async function fetchDates() {
    try {
        const response = await fetch('https://yo6lbyfxd1.execute-api.us-east-1.amazonaws.com/prod/dates', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
     //   console.log("Dates response:", data);
        
        // Find the FedEx date in the array
        const fedExDate = data.dates.find(item => item.datename === 'FedEx');
        if (fedExDate) {
            // Extract month and day from the date string
            const date = new Date(fedExDate.date);
            date.setDate(date.getDate() + 1); // Add one day
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            fedExStartDate = `${month}${day}`;
//            console.log('FedEx start date set to:', fedExStartDate);
            
            // Show fedexContainer if after the start date
            const today = new Date();
            if (today >= date) {
                document.getElementById('fedexContainer').style.display = 'block';
            }
        }
        
        return fedExStartDate;

    } catch (error) {
        console.error('Error fetching FedEx start date:', error);
        // Fallback date if fetch fails
        fedExStartDate = '0922'; // Default to September 22
        return fedExStartDate;
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    try {
        showLoader();

        await fetchDates();
//        console.log('Dates fetched, fedExStartDate:', fedExStartDate);

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