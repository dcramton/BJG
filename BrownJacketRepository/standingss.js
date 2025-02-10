// api url 
// const sapi_url = "https://yo6lbyfxd1.execute-api.us-east-1.amazonaws.com/prod";
const sapi_url = "https://yo6lbyfxd1.execute-api.us-east-1.amazonaws.com/prod/getgames";
// const sproxyurl = "https://cors-anywhere.herokuapp.com/";
console.log("start of Stableford");
// Create table headers
let stab = 
	`<tr id="title">
	     <th style="padding:8px">Player</th>
	     <th>Ave. Stableford Points</th>
    </tr>`;

// Define function to get scores from database
async function getsapi(url) { 
	
	// Storing response 
	const sresponse = await fetch(url); 
	
	// Storing data in form of JSON 
	var sdata = await sresponse.json(); 
	console.log(sdata);
	if (sresponse) { 
		hideloader(); 
	} 

// Call function to create and sort table
	showSs(sdata); 
}

// Calling function to get scores 
// getsapi(sproxyurl + sapi_url);
getsapi(sapi_url);

// Function to hide the loader 
function hideloader() { 
	document.getElementById('loading').style.display = 'none'; 
}

// Function to round off Stableford averages	
	let roundOff = (num, places) => {
	const x = Math.pow(10,places);
	return Math.round(num * x) / x;
	};	// Close let loop for roundOff function

// Function to define innerHTML for HTML table 
async function showSs(sdata) {

// Send request for input from JSON file to get player names
	const playerlist = new Request('playersbj.json')
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
	stab +=
	`
	<tr><td style="text-align:left">${data.members[p].nickname}</td><td>${save[p]}</td></tr>	
	`;

}	// Close let loop to create initial table

// Build unsorted HTML table
	document.getElementById("spointstable").innerHTML = stab;

// Sort table
	var table, rows, switching, i, x, y, shouldSwitch;
	table = document.getElementById("spointstable");
	switching = true;
	while (switching) {
	    switching = false;
	    rows = table.rows;
	    for (i = 1; i < (rows.length - 1); i++) {
	      shouldSwitch = false;
	      x = rows[i].getElementsByTagName("td")[1];
	      y = rows[i + 1].getElementsByTagName("td")[1];
	      if (Number(x.innerHTML) < Number(y.innerHTML)) {
	        shouldSwitch = true;
	        break;
	      }
	    }
		if (shouldSwitch) {
			rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
			switching = true;
		}	// Close 'if' loop to switch rows
	}		// Close 'while' loop for switching function
	});		// Close function to create initial table
}			// Close fetch to get players	