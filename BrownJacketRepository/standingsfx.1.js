

// api url 
const fapi_url = "https://yo6lbyfxd1.execute-api.us-east-1.amazonaws.com/prod/getgames";

console.log("start of Fedex");
// Create table headers
let fedextab = 
	`<tr id="title">
	     <th style="padding:8px">Player</th>
	     <th>Brown Jacket Points</th>
    </tr>`;

	// Defining async function 
	async function getapi(url) { 
		
		// Storing response
		/*global fetch*/
		const response = await fetch(url); 
		console.log(" before fetch in fedex");
		
		// Storing data in form of JSON 
		var fedexdata = await response.json(); 
		console.log(fedexdata); 
		if (response) { 
			hideloader(); 
		} 
		showFedex(fedexdata); 
	} 
	
	// Calling function to get scores 
	getapi(fapi_url); 
	
	// Function to hide the loader 
	function hideloader() {document.getElementById('loading').style.display = 'none';}
	
	// Function to define innerHTML for HTML table 
	async function showFedex(fedexdata) {
			
		// Send request for input from JSON file to get player names
		/* global Request */
		const playerlist = new Request('playersbj.json');
		fetch (playerlist)
		.then(response => response.json())
		.then(data => {
			let plength = data.members.length;

		// Send request for input from JSON file to get Regular Season results
		/* global Request */
//			const regseason = new Request('regfinal.json');
//			fetch (regseason)
//			.then(response => response.json())
//			.then(data => {
//			  	let rslength = data.regstandings.length;
//			  	console.log(rslength);
//			});
				  	
			// Initialize arrays for totals
			var btot = new Array(plength).fill(0);
			var roundbtot = [-2, 5, -4, 2, -6, 1, 4, 6, -5, -1, -3, 3];
//    ["Jamie", 6 ],
//    ["Ben", 5 ],
//    ["George", 4 ],
//    ["Tim", 3 ],    
//    ["Bruce W", 2 ], 
//    [ "Derek",1 ],
//    [ "Paul",-1 ],
//    [ "Art",-2 ],
//    ["Steve",-3 ],
//    [ "Bruce M",-4 ],
//    ["Michael",-5 ],
//    [ "David", -6 ]       
  

//				var roundbtot = new Array(plength).fill(0);
			var fxname = [];
			var gamedate, year, month, date, datecode;

		// Loop through each game
			for (let game of fedexdata.games) {
		// Check date of game to see if it is Fedex or Regular Season		
				let dateString = game.uuid;
				[year, month, date] = dateString.split("-");
				let datecode = month.concat("", date);
				
				if (Number(datecode) >= 0922 ) {	// if not a fedex game, skip
					console.log("fedex game");
				
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
		// Create array with player name and BJ total
			for ( var i = 0; i < plength; i++ ) {
			  fxname.push( [ roundbtot[i], data.members[i].nickname ] );
			}

		// Sort table
			fxname.sort(sortFunction);
			function sortFunction(a,b){
				if (Number(a,[0]) === Number(b[0] )) {
					return 0;
				}
				else {
					return (Number(a[0]) < Number(b[0])) ? -1 : 1;
				}
			}
			fxname.reverse(); // Reverse the sort to make the highest total at the top

		// Add rows to Brown Jacket points table with player 'nickname' and total fedex points
			for (let p =0; p < plength; p++) {
				fedextab +=
					`
					<tr><td style="text-align:left" style="padding-left:200px">${fxname[p][1]}</td><td>${fxname[p][0]}</td></tr>	
					`;
				}	// Close 'for' 'p' loop to create table		
		
		// Build sorted HTML table
			document.getElementById("fedexpointstable").innerHTML = fedextab; 
		
		});		// Close fetch from Playerlist
//			});		// Close fetch from RegSeason
		
	}