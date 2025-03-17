import { getPlayers, getGames, showLoader, hideLoader } from "./commonscripts.js";
console.log("start of Stableford");

const SP_TABLE_ID = "spointstable"; 
const DECIMAL_PLACES = 1;
var plength=0

const SP_TABLE_HEADER = `
    <tr>
        <th colspan="2" style="text-align:center">Average Stableford Score Standings</th>
    </tr>
    <tr id="title">
        <th>Player</th>
        <th class="numeric" style="text-align:center">A.S.S.</th>
    </tr>`

// Main Functions

async function showSgames(playerData, gamesData) {
	try {
//		console.log("Inside function to show Stableford Standings");
		if (!gamesData?.games) {
			throw new Error('Invalid game data format');
		}

		if (!playerData?.players_bj?.players) {
			throw new Error('Invalid player data format');
		}

		plength = playerData.players_bj.players.length;
		const sscores = calculateSFScores(gamesData, plength);
		const tableRows = buildTableRows(playerData, sscores);
		updateTable(tableRows);  
		} catch (error) {
			console.error('Error in showFXgames:', error);
			document.getElementById("games").innerHTML = 
				`<div class="error-message">${error.message}</div>`;
				throw error; 
		}
}
function calculateSFScores(gamesData, plength) {
    // Initialize arrays
    const gameStats = {
        gamesPlayed: Array(plength).fill(0),
        totalPoints: Array(plength).fill(0),
        averagePoints: Array(plength).fill(0)
    };

    // Process all games
    gamesData.games.forEach((game, gameIndex) => {

        // Check if sscores exists and is an array
        if (!Array.isArray(game.sscores)) {
            console.warn(`Invalid sscores for game ${gameIndex + 1}:`, game.sscores);
            return; // Skip this game
        }

        // Process each player's scores
        game.sscores.forEach((score, playerIndex) => {
            // Normalize the score
            const normalizedScore = normalizeStablefordScore(score);
            
            // If there's a valid score and holes is defined
            if (normalizedScore !== 0 && game.holes) {
                // Calculate fraction of game played (holes/18)
                const gameFraction = Number(game.holes) / 18;
                gameStats.gamesPlayed[playerIndex] += gameFraction;
                gameStats.totalPoints[playerIndex] += normalizedScore;

            }
        });
    });

    // Calculate averages
    gameStats.averagePoints = gameStats.totalPoints.map((total, index) => {
        const average = total / gameStats.gamesPlayed[index];
        return isFinite(average) ? Number(average.toFixed(1)) : 0;
    });

    return gameStats;
}
function buildTableRows(playerData, gameStats) {

	if (!playerData || !playerData.players_bj || !playerData.players_bj.players) {
		console.error("Invalid player data structure:", playerData);
		return '';
	}
	
	// Use the correct data structure
	return playerData.players_bj.players.map((player, index) => `
		<tr>
			<td>${player.nickname}</td>
			<td class="numeric">${gameStats.averagePoints[index]}</td>
		</tr>`
	).join('');
}
function updateTable(tableContent) {
	const tableElement = document.getElementById(SP_TABLE_ID);
	if (!tableElement) {
		console.error("Table element not found");
		return;
	}

	const tempTable = document.createElement('table');
	tempTable.innerHTML = SP_TABLE_HEADER + tableContent;

	const [headerRow1, headerRow2, ...dataRows] = Array.from(tempTable.rows);

	// Sort data rows
    const sortedDataRows = dataRows.sort((a, b) => {
        const aValue = parseFloat(a.querySelector('td:nth-child(2)').textContent) || 0;
        const bValue = parseFloat(b.querySelector('td:nth-child(2)').textContent) || 0;
        return bValue - aValue;
    });

	// Store rankings after sort
    window.stablefordRankings = sortedDataRows.map((row, index) => ({
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

// Helper function to normalize Stableford scores
function normalizeStablefordScore(score) {
    if (score === "" || score === undefined) {
        return 0;
    }
    return Number(score);
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
			await showSgames(playerData, gamesData);
		}
	} catch (error) {
		console.error('Error in main flow:', error);
	} finally {
		hideLoader();
	}
});
