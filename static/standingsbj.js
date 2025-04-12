import { getPlayers, getGames, getDates, showLoader, hideLoader } from "./commonscripts.js";
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
async function showBJgames(playerData, gamesData, datesData) {
//    console.log("Inside showBJgames function");
//    console.log("playerData:", playerData);
//    console.log("gamesData:", gamesData);
//    console.log("datesData:", datesData);
//    console.log("fedExStartDate:", datesData.keyDates.fedExDate);
    const fedExDate = datesData.keyDates.fedExDate;
    try {
//        console.log("Inside function to show Regular Season Standings");
        if (!gamesData?.games) {
            throw new Error('Invalid game data format');
        }

        if (!playerData?.players_bj?.players) {
            throw new Error('Invalid player data format');
        }

        if (!fedExDate) {
            throw new Error('FedEx start date not set');
        }

        plength = playerData.players_bj.players.length;
        const bscores = calculateBJScores(gamesData, fedExDate, plength);
        const tableRows = buildTableRows(playerData, bscores.scores);
        updateTable(tableRows, bscores);  // Pass bscores as second parameter
    } catch (error) {
        console.error('Error in showBJgames:', error);
        document.getElementById("games").innerHTML = 
            `<div class="error-message">${error.message}</div>`;
    }
}
function calculateBJScores(gamesData, fedExDate, plength) {
//    console.log("Inside calculateBJScores function");
    const btot = Array(plength).fill(0);
//    console.log('Initial btot array:', btot);
//   console.log('gamesData', gamesData);
//    console.log('fedExDate', fedExDate);
//    console.log('gameDate',gamesData.games[0].uuid.slice(0,10));
//    console.log('games', gamesData.games);
//    console.log('Total games:', gamesData.games.length);
    
    // Calculate regular season scores
    const regularSeasonScores = gamesData.games
        .filter(game => {
            const gameDate = game.uuid.slice(0,10);
//            console.log(`Comparing game date ${gameDate} with fedEx date ${fedExDate}`);
            
            // Convert strings to Date objects for proper comparison
            const gameDateObj = new Date(gameDate);
            const fedExDateObj = new Date(fedExDate);
            
            const isBeforeFedEx = gameDateObj < fedExDateObj;
//            console.log(`Game ${gameDate} included: ${isBeforeFedEx}`);
            return isBeforeFedEx;
        })
    
        .reduce((scores, game) => {
//            console.log('Processing game:', game.uuid);
//            console.log('Game bscores:', game.bscores);
            if (game.bscores?.length) {
                game.bscores.forEach((score, index) => {
                    const processedScore = processScore(score);
                    scores[index] += processedScore;
//                    console.log(`Player ${index}: score ${score} processed to ${processedScore}, running total: ${scores[index]}`);
                });
            } else {
//                console.log('No bscores found for game:', game.uuid);
            }
//            console.log('Current totals:', scores);
            return scores;
        }, btot)
        .map(score => Number(score.toFixed(DECIMAL_PLACES)));
    
//    console.log('Final regular season scores:', regularSeasonScores);
    return {
        scores: regularSeasonScores,
        rankings: regularSeasonScores.map((score, index) => ({
            score,
            playerIndex: index
        })).sort((a, b) => b.score - a.score)
        .map((item, rank) => item.playerIndex)
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

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    try {
        showLoader();

        const [playerData, gamesData, datesData] = await Promise.all([
            getPlayers(),
            getGames(),
            getDates()
        ]);
        
        if (gamesData) {
            await showBJgames(playerData, gamesData, datesData);
        }
    } catch (error) {
        console.error('Error in main flow:', error);
    } finally {
        hideLoader();
    }
});