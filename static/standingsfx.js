import { getPlayers, getGames, showLoader, hideLoader } from "./commonscripts.js";
import { regularSeasonRankings } from './standingsbj.js';
export async function updateFedExStandings() {
    if (!regularSeasonRankings) {
        console.log('Rankings not yet available');
        return;
    }

    try {
        const [playerData, gamesData] = await Promise.all([
            getPlayers(),
            getGames()
        ]);
        
        if (gamesData) {
            await showFXgames(playerData, gamesData);
        }
    } catch (error) {
        console.error('Error updating FedEx standings:', error);
    }
}
console.log("start of FedEx Points");

const DECIMAL_PLACES = 1;
const FX_TABLE_ID = "fxpointstable"; 
let plength=0, fedExStartDate;

const FX_TABLE_HEADER = `
    <tr>
        <th colspan="2" style="text-align:center" class="header">FedEx Cup Standings</th>
    </tr>
    <tr id="title">
        <th style="padding:8px" class="header">Player</th>
        <th class="numeric header" style="text-align:center">FedEx Cup Points</th>
    </tr>`;

// Main Functions
async function showFXgames(playerData, gamesData) {
    try {
//        console.log("Inside function to show FX Standings");
//        console.log("Current Regular Season Rankings:", regularSeasonRankings);  // Debug log
        if (!gamesData?.games) {
            throw new Error('Invalid game data format');
        }

        if (!playerData?.players_bj?.players) {
            throw new Error('Invalid player data format');
        }

        if (!regularSeasonRankings) {
            throw new Error('Regular season rankings not available');
        }

        plength = playerData.players_bj.players.length;
        const fxscores = calculateFXScores(gamesData, plength, playerData);
//        console.log('FX scores calculated:', fxscores);
        const tableRows = buildFXTableRows(playerData, fxscores);
//        console.log('Built table rows:', tableRows);
        updateFXTable(tableRows);
        document.getElementById('fedexContainer').style.display = 'block';
    } catch (error) {
        console.error('Error in showFXgames:', error);
    }
}

function calculateFXScores(gamesData, plength, playerData) {
//    console.log('Regular season rankings being used:', regularSeasonRankings);
//    console.log('Player data being used:', playerData);
//    console.log('Games data being used:', gamesData);
    const fxtot = Array(plength).fill(0);
    
    // Calculate base FedEx scores
    const baseScores = gamesData.games
        .filter(game => {
            const gameDate = parseGameDate(game.uuid);
//            console.log(`Game ${game.uuid}: date ${gameDate}, comparing to ${fedExStartDate}`); // Debug log
            return Number(gameDate) >= Number(fedExStartDate);
        })
        .reduce((scores, game) => {
//            console.log('Processing game:', game); // Debug log
//            console.log('Scores:', game.bscores); // Debug log
            if (game.bscores?.length) {
//                console.log('Processing game:', game); // Debug log
                game.bscores.forEach((score, index) => {
                    // Add debug logging
//                    console.log(`Processing score for player ${index}: ${score}`);
                    scores[index] += processScore(score);
                });
            }
            return scores;
        }, [...fxtot]); // Create a new array to avoid reference issues

//    console.log('Base scores after calculation:', baseScores); // Debug log

    // Apply ranking bonuses
    const adjustedScores = baseScores.map((score, playerIndex) => {
        const ranking = regularSeasonRankings[playerIndex];
        const playerName = playerData.players_bj.players[playerIndex].nickname; // Get player name
        const bonus = calculateRankingBonus(ranking, playerName); // Pass player name
        const finalScore = Number(score) + Number(bonus);
        return finalScore;
    });

//    console.log('Final adjusted scores:', adjustedScores); // Debug log

    return {
        fxscores: adjustedScores.map(score => Number(score.toFixed(DECIMAL_PLACES))),
        baseScores: baseScores.map(score => Number(score.toFixed(DECIMAL_PLACES)))
    };
}
  
function buildFXTableRows(playerData, fxscores) {
    if (!playerData || !playerData.players_bj || !playerData.players_bj.players) {
        console.error("Invalid player data structure:", playerData);
        return '';
    }

//    console.log('Building FX table with scores:', fxscores);
//    console.log('Using rankings:', regularSeasonRankings);

    // Create array of player data with scores
    const playerScores = playerData.players_bj.players.map((player, index) => ({
        nickname: player.nickname,
        totalScore: fxscores.fxscores[index] || 0,
        baseScore: fxscores.baseScores[index] || 0,
        rank: regularSeasonRankings[index] + 1
    }));

    // Sort by totalScore in descending order
    playerScores.sort((a, b) => b.totalScore - a.totalScore);

    // Generate table rows from sorted data
    return playerScores.map(player => `
        <tr>
            <td>${player.nickname}</td>
            <td class="numeric">${player.totalScore.toFixed(DECIMAL_PLACES)}</td>
        </tr>`
    ).join('');
}


function updateFXTable(tableContent) {
    const container = document.getElementById('fedexContainer');
    const tableElement = document.getElementById('fxpointstable');
    
    if (!tableElement || !container) {
        console.error("FedEx table or container element not found");
        return;
    }

    // Make the container visible
    container.style.display = 'block';

    // Add table header and content
    tableElement.innerHTML = `
        <tr>
            <th colspan="4">FedEx Cup Standings</th>
        </tr>
        <tr>
            <th>Player</th>
            <th>Total Points</th>
        </tr>
        ${tableContent}
    `;
    
    tableElement.className = "standings-table";
//    console.log('FedEx table updated with content:', tableContent);
}

// Helper Functions 
function processScore(score) {
    if (score === "" || score === undefined || score === null) {
        return 0;
    }
    return Number(score) || 0; // Convert to number, return 0 if NaN
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
        console.log("Dates response:", data);
        
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
        }
        
        return fedExStartDate;

    } catch (error) {
        console.error('Error fetching FedEx start date:', error);
        // Fallback date if fetch fails
        fedExStartDate = '0922'; // Default to September 22
        return fedExStartDate;
    }
}
function calculateRankingBonus(ranking, playerName) {
    // Make sure ranking is a number
    const rank = Number(ranking);
    if (isNaN(rank)) {
        console.warn(`Invalid ranking value: ${ranking}`);
        return 0;
    }

    // Calculate bonus differently for even and odd number of players
    const isEven = plength % 2 === 0;
    let bonus;

    if (isEven) {
        // For even number of players (e.g., 12 players)
        // First place (rank 0) gets +6, last place gets -6
        // No player gets 0
        const halfLength = plength / 2;
        if (rank < halfLength) {
            // Top half of players
            bonus = 6 - rank;
        } else {
            // Bottom half of players
            bonus = -(rank - halfLength + 1);
        }
    } else {
        // For odd number of players (e.g., 7 players)
        // First place (rank 0) gets +3, middle player gets 0, last place gets -3
        const halfLength = Math.floor(plength / 2);
        bonus = halfLength - rank;
    }

//    console.log(`Player: ${playerName}, Rank: ${rank}, Bonus: ${bonus} (plength: ${plength}, isEven: ${isEven})`);
    
    return bonus;
}


// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await fetchDates();
//        console.log('Dates fetched, fedExStartDate:', fedExStartDate);
        
        // Only try to update if rankings are available
        if (regularSeasonRankings) {
            await updateFedExStandings();
        } else {
//            console.log('Waiting for rankings to be available');
        }
    } catch (error) {
        console.error('Error in main flow:', error);
    }
});