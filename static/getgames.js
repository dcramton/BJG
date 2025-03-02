

// Define games table
let tab = "";
var players, plength;

// url for API for BrownJacketGetGames
const api_url = "https://yo6lbyfxd1.execute-api.us-east-1.amazonaws.com/prod/getgames";
const CONFIG = {
    DATE_FORMAT: "YYYY-MM-DD",
    HOLES_DEFAULT: 18,
    MONTHS_ENABLED: ["05", "06", "07", "08", "09", "10"],
    TABLE_ID: "games",
    TABLE_CLASS: "gamelog-table"
};

// Call function to get games
console.log("Call function to get games");

//	getapi(proxyurl + api_url);
// getapi(api_url); 

// Define function to get games 
async function getapi(url) {
    console.log("Inside function to get games");		
    setTimeout(hideloader, 8000);
    try {
  		const myHeaders = new Headers();	
		myHeaders.append('Content-Type', "application/json"); 
		const requestOptions = {
			method: 'GET',
			headers: myHeaders,
			redirect: 'follow'
		};

		const response = await fetch(url, requestOptions);
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		const data = await response.json();
		
		if (response) {
			hideloader();
		}
		
		show(data);
	} catch (error) {
		console.error('Error fetching data:', error);
		// Add user-friendly error handling
		document.getElementById("games").innerHTML = 
			`<div class="error-message">Unable to load games data. Please try again later.</div>`;
        hideloader();
        }
}

function showLoader() {
    document.getElementById('loading').style.display = 'block';
}
function hideloader() { 
    console.log("Hiding loader");
    
    // Try multiple approaches to hide the spinner
    const loader = document.getElementById('loading');
    if (loader) {
        loader.style.display = 'none';
        loader.style.visibility = 'hidden';
        loader.classList.remove('spinner-border');
        console.log("Loader hidden by ID");
    }
    
    // Try targeting by class in case ID is wrong
    const spinners = document.getElementsByClassName('spinner-border');
    for (let i = 0; i < spinners.length; i++) {
        spinners[i].style.display = 'none';
        spinners[i].style.visibility = 'hidden';
        console.log("Spinner hidden by class");
    }
    
    // Try targeting any element with 'spinner' in the class
    const allSpinners = document.querySelectorAll('[class*="spinner"]');
    for (let i = 0; i < allSpinners.length; i++) {
        allSpinners[i].style.display = 'none';
        allSpinners[i].style.visibility = 'hidden';
        console.log("Generic spinner hidden");
    }
}




// Add a utility function for date formatting
function formatMonthName(monthNum) {
    const months = {
        "05": "May",
        "06": "June",
        "07": "July",
        "08": "August",
        "09": "September",
        "10": "October"
    };
    return months[monthNum] || monthNum;
}

function formatDate(dateString) {
    const month = dateString.slice(0,2);
    const day = dateString.slice(3,5);
    return `${formatMonthName(month)} ${day}`;
}


// Function create games table 
function show(data) {
    console.log("Function called to create games table");
    setTimeout(hideloader, 10000);
    
    if (!data || !data.games) {
        console.error('Invalid data format');
        hideloader(); // Hide loader on error
        document.getElementById("games").innerHTML = 
            `<div class="error-message">Invalid game data format received.</div>`;
        return;
    }

    // Sort the games array by date first
    data.games.sort((a, b) => {
        const dateA = String(a.uuid);
        const dateB = String(b.uuid);
        return dateA.localeCompare(dateB);
    });

    // Start header row
    tab += 
        `<col>
         <colgroup span="2"></colgroup>
         <tr>
            <th rowspan="2" style="width:10%" class="gamedate">Date</th>
            <th rowspan="2" class="holes">Holes</th>  
        `;

    // Add player names to first header row
    const playerlist = new Request('/static/playersbj.json')
    fetch (playerlist)
      .then(response => response.json())
      .then(players => {
        window.plength = players.members.length;
        window.players = players;    
        let playertot = players.members.length;
        for(let i = 0; i < playertot; i++) {
            tab +=`
            <th colspan="2" scope="colgroup">${players.members[i].nickname}</th>
            `;
        }
        tab +=
        `</tr>
        <tr>
        `;

        // Add 2nd row of headers
        var stot = new Array(playertot);
        for (let p =0; p < playertot; p++) {
            stot[p]=0;
            tab +=                    
            `<th scope="col">BJ</th>
             <th scope="col">SF</th>
            `;
        }
        `</tr>`;
        
        console.log("Headers created");
        
        // Initialize combo for all combinations
        var combo = new Array();
        for (var p = 0; p < playertot; p++) {
            combo[p] = new Array();
        }

        // Group games by month
        let currentMonth = '';
        let monthRows = '';
        
        // Loop to access all games 
        console.log("Begin loop to access all games");
        for (var game of data.games) {
            // Convert date to text format            
            var mdraw, mdtext, mdtextlong, mdmon, mdday;
            mdraw = String(game.uuid);
            mdtextlong = mdraw.replace("2024-",'');
            mdtext = mdtextlong.slice(0,5);
            mdmon = mdtext.slice(0,2);
            mdday = mdtext.slice(3,5);

            let monthName = '';
            if (mdmon == "05") monthName = "May";
            if (mdmon == "06") monthName = "June";
            if (mdmon == "07") monthName = "July";
            if (mdmon == "08") monthName = "August";
            if (mdmon == "09") monthName = "September";
            if (mdmon == "10") monthName = "October";

            // If month changes, add month header
            if (monthName !== currentMonth) {
                if (currentMonth !== '') {
                    tab += monthRows;
                }
                currentMonth = monthName;
                tab += `
                    <tr class="month-header">
                        <td colspan="${2 + (playertot * 2)}">${monthName}</td>
                    </tr>
                `;
                monthRows = '';
            }

            if (mdmon == "05") {mdtext = "May " + mdday}
            if (mdmon == "06") {mdtext = "Jun " + mdday}
            if (mdmon == "07") {mdtext = "Jul " + mdday}
            if (mdmon == "08") {mdtext = "Aug " + mdday}
            if (mdmon == "09") {mdtext = "Sep " + mdday}
            if (mdmon == "10") {mdtext = "Oct " + mdday}

            // Add game row to month group
            monthRows += `<tr class="month-rows gamelog"> 
                <td class="gamedate">${mdtext}</td>
                <td>${game.holes}</td>`;

            // Begin loop to enter game scores to table 
            for (let p1 = 0; p1 < playertot; p1++) {
                if (game.bscores[p1] === undefined) game.bscores[p1]="";
                if (game.sscores[p1] === undefined) game.sscores[p1]="";
                let increment = (game.holes/18);
                if (game.sscores[p1] > 0) stot[p1] = stot[p1] + increment;

                monthRows +=` 
                <td>${game.bscores[p1]}</td>
                <td>${game.sscores[p1]}</td>
                `;
            }
            monthRows += '</tr>';
        }
        
        // Add final month's rows
        tab += monthRows;

        // Add row for total games played by each player
        console.log("Add totals");
        tab +=`</tr>
            <tr>
            <tr><td colspan="2">Games Played</td>`;
            
        for (let i = 0; i < playertot; i++) {
            tab +=`
            <td colspan="2">${stot[i].toFixed(1)}</td>`;
        }
        tab += `</tr>`;

        // Setting innerHTML as tab variable
        console.log("Setting table HTML");
        document.getElementById("games").innerHTML = tab; 

        // Add the CSS class to the table
        let gameTable = document.getElementById('games');
        gameTable.className = 'gamelog-table';
    })
    .catch(error => {   
        console.error('Error processing player data:', error);
        document.getElementById("games").innerHTML = 
            `<div class="error-message">Error loading player data. Please try again later.</div>`;
        hideloader(); // Make sure to hide loader on error
    });
    
    // At the very end of your show function, after the fetch chain
    console.log("Table rendering complete");
    hideloader(); // Ensure spinner is hidden after rendering

} // close function


// Add this at the end of getgames.js
document.addEventListener('DOMContentLoaded', function () {
    console.log("DOM fully loaded and parsed");
    showLoader();
    setTimeout(hideloader, 5000);

    // Initialize the API call
    getapi(api_url);
    
    // Add event delegation for month headers
    document.getElementById('games').addEventListener('click', (e) => {
        if (e.target.closest('.month-header')) {
            toggleMonth(e.target.closest('.month-header'));
        }
    });
});


// Use DocumentFragment for better performance
function renderTable(data) {
    const fragment = document.createDocumentFragment();
    const table = document.createElement('table');
    table.id = CONFIG.TABLE_ID;
    table.className = CONFIG.TABLE_CLASS;
    
    // Build table content
    table.innerHTML = data.tableContent;
    
    fragment.appendChild(table);
    document.getElementById(CONFIG.TABLE_ID).replaceWith(fragment);
}

function toggleMonth(header) {
    if (!header) return;
    
    header.classList.toggle('collapsed');
    let rows = header.nextElementSibling;
    
    // Add animation class for smooth transitions
    while (rows && rows.classList.contains('month-rows')) {
        rows.classList.toggle('collapsed');
        rows = rows.nextElementSibling;
    }
}

// Add this at the very end of your file
window.addEventListener('load', function() {
    // Force hide spinner after window fully loads
    setTimeout(function() {
        const spinner = document.getElementById('loading');
        if (spinner) {
            spinner.style.display = 'none';
            spinner.style.visibility = 'hidden';
            spinner.classList.remove('spinner-border');
            console.log("Spinner forcibly hidden by window load event");
        }
    }, 500); // Short timeout to ensure this runs after other code
});

