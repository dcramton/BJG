// Define games table
let tab = "";
var players, plength;

// url for API for BrownJacketGetGames
const api_url = "https://yo6lbyfxd1.execute-api.us-east-1.amazonaws.com/prod/getgames";

const CONFIG = {
    DATE_FORMAT: "YYYY-MM-DD",
    HOLES_DEFAULT: 18,
    MONTHS_ENABLED: ["05", "06", "07", "08", "09", "10", "11"],
    TABLE_ID: "games",
    TABLE_CLASS: "gamelog-table"
};

// *** Functions ***
async function getapi(url) {
    console.log("Inside function to get games");
    showLoader();

    try {
        const myHeaders = new Headers();	
        myHeaders.append('Content-Type', "application/json"); 
        
        const requestOptions = {
            method: 'GET',
            headers: myHeaders,
            redirect: 'follow'
        };

        console.log("Calling API at:", url);
        const response = await fetch(url, requestOptions);
        console.log("Response status:", response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Response data:", data);

        hideloader();
        show(data);

    } catch (error) {
        console.error('Error fetching data:', error);
        document.getElementById("games").innerHTML = 
            `<div class="error-message">Unable to load games data. Please try again later.</div>`;
        hideloader();
    }
}

function showLoader() {
    document.getElementById('loading').style.display = 'block';
}

function hideloader() {
    const loader = document.getElementById('loading');
    if (loader) {
        loader.style.display = 'none';
        loader.style.visibility = 'hidden';
        loader.classList.remove('spinner-border');
    }
}

function formatMonthName(monthNum) {
    const months = {
        "05": "May",
        "06": "June",
        "07": "July",
        "08": "August",
        "09": "September",
        "10": "October",
        "11": "November"
    };
    return months[monthNum] || monthNum;
}

function formatDate(dateString) {
    const month = dateString.slice(0,2);
    const day = dateString.slice(3,5);
    return `${formatMonthName(month)} ${day}`;
}

// Function to create games table 
function show(data) {
    console.log("Function called to create games table");
    
    if (!data || !data.games) {
        console.error('Invalid data format');
        document.getElementById("games").innerHTML = 
            `<div class="error-message">Invalid game data format received.</div>`;
        return;
    }

    // Sort the games array by date
    data.games.sort((a, b) => {
        const dateA = String(a.uuid);
        const dateB = String(b.uuid);
        return dateA.localeCompare(dateB);
    });

    // Start building the table
    tab = `
        <col>
        <colgroup span="2"></colgroup>
        <tr>
            <th rowspan="2" style="width:10%" class="gamedate">Date</th>
            <th rowspan="2" class="holes">Holes</th>
    `;

    // Add player names from JSON file
    fetch('/static/playersbj.json')
        .then(response => response.json())
        .then(players => {
            window.plength = players.members.length;
            window.players = players;
            
            // Add player columns
            players.members.forEach(player => {
                tab += `<th colspan="2" scope="colgroup">${player.nickname}</th>`;
            });

            tab += '</tr><tr>';

            // Add score type headers (BJ/SF)
            players.members.forEach(() => {
                tab += `
                    <th scope="col">BJ</th>
                    <th scope="col">SF</th>
                `;
            });

            // Initialize score totals
            const stot = new Array(players.members.length).fill(0);

            // Group games by month
            let currentMonth = '';
            
            // Add game rows
            data.games.forEach(game => {
                const mdraw = String(game.uuid);
                const mdtext = mdraw.replace("2024-",'').slice(0,5);
                const mdmon = mdtext.slice(0,2);
                const mdday = mdtext.slice(3,5);
                const monthName = formatMonthName(mdmon);

                // Add month header if month changes
                if (monthName !== currentMonth) {
                    tab += `
                        <tr class="month-header">
                            <td colspan="${2 + (players.members.length * 2)}">${monthName}</td>
                        </tr>
                    `;
                    currentMonth = monthName;
                }

                // Add game row
                tab += `
                    <tr class="month-rows gamelog">
                        <td class="gamedate">${formatDate(mdtext)}</td>
                        <td>${game.holes}</td>
                `;

                // Add scores
                players.members.forEach((_, index) => {
                    const bscore = game.bscores[index] || "";
                    const sscore = game.sscores[index] || "";
                    if (sscore > 0) {
                        stot[index] += (game.holes/18);
                    }
                    tab += `
                        <td>${bscore}</td>
                        <td>${sscore}</td>
                    `;
                });

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
        })
        .catch(error => {
            console.error('Error processing player data:', error);
            document.getElementById("games").innerHTML = 
                `<div class="error-message">Error loading player data. Please try again later.</div>`;
        });
}

// *** Event Listeners ***
document.addEventListener('DOMContentLoaded', function () {
    console.log("DOM fully loaded and parsed");
    showLoader();
    getapi(api_url);

    // Add event delegation for month headers
    document.getElementById('games').addEventListener('click', (e) => {
        if (e.target.closest('.month-header')) {
            toggleMonth(e.target.closest('.month-header'));
        }
    });
});

function toggleMonth(header) {
    if (!header) return;
    
    header.classList.toggle('collapsed');
    let rows = header.nextElementSibling;
    
    while (rows && rows.classList.contains('month-rows')) {
        rows.classList.toggle('collapsed');
        rows = rows.nextElementSibling;
    }
}

// Force hide spinner after window load
window.addEventListener('load', function() {
    setTimeout(function() {
        hideloader();
    }, 500);
});
