// api url 
const bjapi_url = "https://yo6lbyfxd1.execute-api.us-east-1.amazonaws.com/prod/getgames";
console.log("start of BJP");

// Build the table
// Create table headers
let bjtab = 
	`<tr id="title">
	     <th style="padding:8px">Player</th>
	     <th>Brown Jacket Points</th>
    </tr>`;

// Defining async function to get game data
async function getapi(url) { 
	
	// Storing response 
	const response = await fetch(url); 
	console.log("before fetch in bj");
	
	// Storing data in form of JSON 
	var bjdata = await response.json(); 
	console.log(bjdata); 
	if (response) { 
		hideloader(); 
	} 
	showBjs(bjdata); 
} 
// Calling function to get scores 
getapi(bjapi_url); 

// Function to hide the loader 
function hideloader() {document.getElementById('loading').style.display = 'none';}

// Function to define innerHTML for HTML table 
function showBjs(bjdata) {
	
// Send request for input from JSON file to get player names
	const playerlist = new Request('playersbj.json');
	fetch (playerlist)
	  .then(response => response.json())
	  .then(data => {
	  	let plength = data.members.length;
	  	console.log(plength);
	  	
// Initialize arrays for totals and averages to 0
	var btot = new Array(plength).fill(0);
	var roundbtot = new Array(plength).fill(0);	
	var gamedate, year, month, date, datecode;	

// Loop through each game
	for (let game of bjdata.games) {
		
		// Check date of game to see if it is Fedex or Regular Season		
				let dateString = game.uuid;
				[year, month, date] = dateString.split("-");
				let datecode = month.concat("", date);
				
				if (Number(datecode) <= 0922 ) {	// if not a regular season game, skip
					console.log("regular season game");		
		
// Loop through each player, within each game		
		for (let p =0; p < plength; p++) {
			
// Convert blank and undefined scores to 0			
			if (game.bscores[p] == "") {game.bscores[p] = 0;}
			else if (game.bscores[p] == undefined) {game.bscores[p] = 0;}

			// Add current bscore to total
			btot[p] = btot[p] + Number(game.bscores[p]);
			roundbtot[p] = btot[p].toFixed(1);

		}	// Close 'for' 'p' loop through players within each game
	}	// Close 'for' 'game' loop through games			
}
// Add rows to Brown Jacket points table with player 'nickname' and total BJ points
	for (let p =0; p < plength; p++) {
		bjtab +=
			`
			<tr><td style="text-align:left" style="padding-left:200px">${data.members[p].nickname}</td><td>${roundbtot[p]}</td></tr>	
			`;		
	}	// Close 'for' 'p' loop to create initial table		

// Build unsorted HTML table
	document.getElementById("bjpointstable").innerHTML = bjtab; 

// Sort table
	var table, rows, switching, i, x, y, shouldSwitch;
	table = document.getElementById("bjpointstable");
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
} 