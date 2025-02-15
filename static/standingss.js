// api url 
// const sapi_url = "https://yo6lbyfxd1.execute-api.us-east-1.amazonaws.com/prod";
// const api_url = "https://yo6lbyfxd1.execute-api.us-east-1.amazonaws.com/prod/getgames";
// const sproxyurl = "https://cors-anywhere.herokuapp.com/";
console.log("start of Stableford");
// Create table headers
let stab = `<thead>
    <tr>
        <th colspan="2" style="text-align:center">Average Stableford Score Standings</th>
    </tr>
    <tr id="title">
        <th>Player</th>
        <th class="numeric" style="text-align:center">A.S.S.</th>
    </tr>
</thead><tbody>`;


	
// Define function to get scores from database
async function getsapi(url) { 
	try {	
		const sresponse = await fetch(url); 
	
		if (!sresponse.ok) {
			throw new Error(`HTTP error! status: ${sresponse.status}`);
		}
		
		const sdata = await sresponse.json(); 
		hideloader(); 
		showSs(sdata); 
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

// Function to round off Stableford averages	
let roundOff = (num, places) => {
const x = Math.pow(10,places);
return Math.round(num * x) / x;
};	// Close let loop for roundOff function


async function showSs(sdata) {
	if (!sdata || !sdata.games) {
        console.error('Invalid game data received');
        return;
    }

// Send request for input from JSON file to get player names
	const playerlist = new Request('/static/playersbj.json')
	fetch (playerlist)
	  .then(response => response.json())
	  .then(data => {
	  	let plength = data.members.length;

// Initialize arrays for totals and averages to 0
	var gametot = new Array(plength).fill(0);
	var stot = new Array(plength).fill(0);
	var save = new Array(plength).fill(0);
//	var plength = 13;

// Loop through each game
	for (let game of sdata.games) {
		
// Loop through each player, within each game		
		for (let p =0; p < plength; p++) {
			
// Convert blank and undefined scores to 0			
			if (game.sscores[p] == "") {
				game.sscores[p] = 0;

			}	// Close if to assign 0 to blank scores
			else if (game.sscores[p] == undefined) {
				game.sscores[p] = 0;
			}	// Close of if to assign 0 to undefined scores
			
// Increment games played total and Stablefored total for each non-zero Stableford entry
			if (game.sscores[p] != 0) {
				gametot[p] = gametot[p] + Number(game.holes) / 18;

			} // Close 'if' loop to increment games played total
			stot[p] = stot[p] + Number(game.sscores[p]);
			
		}	// Close 'for' loop through players within each game
	}	// Close 'for' loop through games
	
// Calculate Stableford average for each player
	for (let p =0; p < plength; p++) {
		save[p] = (stot[p] / gametot[p]).toFixed(1);
		if (isNaN(save[p])) {save[p]=0}
//		if (isNaN(save[p])) {continue;}
// Add rows to Stableford table with player 'nickname' and average Stableford
		stab += `<tr><td>${data.members[p].nickname}</td><td class="numeric">${save[p]}</td></tr>`;
	
}	// Close let loop to create initial table

// Build unsorted HTML table
document.getElementById("spointstable").innerHTML = stab + '</tbody>';
const tableElement = document.getElementById("spointstable");
tableElement.className = "standings-table";

// Sort table
var table, rows, switching, i, x, y, shouldSwitch;
table = document.getElementById("spointstable");
switching = true;
while (switching) {
    switching = false;
    rows = table.rows;
    for (i = 2; i < (rows.length - 1); i++) {  // Start from 2 to skip both header rows
        shouldSwitch = false;
        const currentRow = rows[i].getElementsByTagName("td");
        const nextRow = rows[i + 1].getElementsByTagName("td");
        
        // Check if both rows have the necessary td elements
        if (currentRow.length > 1 && nextRow.length > 1) {
            x = currentRow[1];
            y = nextRow[1];
            if (Number(x.innerHTML) < Number(y.innerHTML)) {
                shouldSwitch = true;
                break;
            }
        }
    }
    if (shouldSwitch) {
        rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
        switching = true;
    }
}
		// Close 'while' loop for switching function
	});		// Close function to create initial table
}			// Close fetch to get players	

// Initialize
getsapi(api_url);
