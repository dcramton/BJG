import { getPlayers, getGames, showLoader, hideLoader } from "./commonscripts.js";

const currentYear = new Date().getFullYear();

async function showGames(playerData, gamesData) {
    console.log("Function called to create games table");
//    console.log("Player data :", playerData);
//    console.log("Games data :", gamesData);
//    console.log("Test player :, ", playerData.players_bj.players[2].nickname)
    
    if (!gamesData || !gamesData.games) {
        console.error('Invalid data format');
        document.getElementById("games").innerHTML = 
            `<div class="error-message">Invalid game data format received.</div>`;
        return;
    }

    // Sort the games array by date
    gamesData.games.sort((a, b) => {
        const dateA = String(a.uuid).slice(0, 10); // Gets YYYY-MM-DD portion
        const dateB = String(b.uuid).slice(0, 10); // Gets YYYY-MM-DD portion
        return dateB.localeCompare(dateA); // For descending order (newest first)
    });

    // Start building the table
    let tab = `
        <col>
        <colgroup span="2"></colgroup>
        <tr>
            <th rowspan="2" style="width:10%">Game Date</th>
            <th rowspan="2" class="holes">Holes</th>
    `;

    let plength = playerData.players_bj.players.length;

    // Add player columns
    for(let p = 0; p < plength; p++) {
        tab += `<th colspan="2" scope="colgroup">${playerData.players_bj.players[p].nickname}</th>`;
    };

    tab += '</tr><tr>';

    // Add score type headers (BJ/SF)
    for(let p = 0; p < plength; p++) {
        tab += `
            <th scope="col">BJ</th>
            <th scope="col">SF</th>
        `;
    };

    // Initialize score totals
    const stot = new Array(plength).fill(0);

    // Group games by month
    let currentMonth = '';
    
    // Add game rows
    gamesData.games.forEach(game => {
        const dateString = String(game.uuid);
        const month = dateString.slice(5,7);
        const day = dateString.slice(8,10);
        const date = new Date(currentYear, parseInt(month) - 1, parseInt(day));
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const monthName = date.toLocaleDateString('en-US', { month: 'short' });
        const monthNameFull = date.toLocaleDateString('en-US', { month: 'long' });

        // Add month header if month changes
        if (monthName !== currentMonth) {
            tab += `
                <tr class="month-header">
                    <td colspan="${2 + (plength * 2)}">${monthNameFull}</td>
                </tr>
            `;
            currentMonth = monthName;
        }

        // Add game row
        tab += `
            <tr class="month-rows gamelog">
                <td class="gamedate">${monthName} ${day.padStart(2, '0')}</td>
                <td>${game.holes}</td>
        `;

        // Add scores
        for(let p = 0; p < plength; p++) {
            const bscore = game.bscores[p] || "";
            const sscore = game.sscores[p] || "";
            if (sscore > 0) {
                stot[p] += (game.holes/18);
            }
            tab += `
                <td>${bscore}</td>
                <td>${sscore}</td>
            `;
        };

        tab += '</tr>';
    });

    // Add totals row
    tab += `
        <tr>
            <td colspan="2">Games Played</td>
            ${stot.map(total => `<td colspan="2">${total.toFixed(1)}</td>`).join('')}
        </tr>
    `;

    // Set table HTML and class
    const gameTable = document.getElementById("games");
    gameTable.innerHTML = tab;
    gameTable.className = 'gamelog-table';
}    

function toggleMonth(header) {
    if (!header) return;
    
    header.classList.toggle('collapsed');
    let rows = header.nextElementSibling;
    
    while (rows && rows.classList.contains('month-rows')) {
        rows.classList.toggle('collapsed');
        rows = rows.nextElementSibling;
    }
}

// *** Event Listeners ***
document.addEventListener('DOMContentLoaded', async function () {
//    console.log("DOM fully loaded and parsed");
    showLoader();

    try {
        const playerData = await getPlayers();
        const gamesData = await getGames(playerData);
        if (gamesData) {
            showGames(playerData, gamesData);
        }
    } catch (error) {
        console.error('Error in main flow:', error);
    }
    hideLoader();

    // Add event delegation for month headers
    document.getElementById('games').addEventListener('click', (e) => {
        if (e.target.closest('.month-header')) {
            toggleMonth(e.target.closest('.month-header'));
        }
    });
});