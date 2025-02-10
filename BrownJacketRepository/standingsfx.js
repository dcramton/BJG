

// api url 
const fapi_url = "https://yo6lbyfxd1.execute-api.us-east-1.amazonaws.com/prod/getgames";

console.log("start of Fedex.2");
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

		var data;
		const playerlist = await fetch ('playersbj.json')
		.then(response => response.json());
		data = playerlist;
			let plength = data.members.length;


			// Initialize arrays for totals
			var fbtot = new Array(plength).fill(0);
			var rbtot = new Array(plength).fill(0);
			var roundrbtot = new Array(plength).fill(0);
			var roundfbtot = new Array(plength).fill(0);		
//			var roundfbtot = [-2, 5, -4, 2, -6, 1, 4, 6, -5, -1, -3, 3];

			var fxname = [];
			var rname = [];
			var gamedate, year, month, date, datecode;

			// Loop through each game, seeing which players were in that game bu
			// looking for a BJ score for them in that game.
			// Add that BJ score to that player's total.
			// BJ scores will be added to either a Regular Season counter (roundrbtot)
			// or a Fedex season counter (roundfbtot)
			// 
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
							
						fbtot[p] = fbtot[p] + Number(game.bscores[p]);
						roundfbtot[p] = fbtot[p].toFixed(1);
						
					}	// Close 'for' 'p' loop through players within each game
				}	// Close 'if' for testing whether game is regular season or fedex
				else {
					console.log("reg season game");
					// Loop through each player, within each game		
					for (let p =0; p < plength; p++) {
						
					// Convert blank and undefined scores to 0			
						if (game.bscores[p] == "") {game.bscores[p] = 0;}
						else if (game.bscores[p] == undefined) {game.bscores[p] = 0;}
			
						// Add current bscore to total
							
						rbtot[p] = rbtot[p] + Number(game.bscores[p]);
						roundrbtot[p] = rbtot[p].toFixed(1);
						
					}	// Close 'for' 'p' loop through players within each game					
				}	
			}	// Close 'for' 'game' loop through games
			console.table(roundrbtot);
			console.table(roundfbtot);
			
			//	*** Regular Season calculation
			// Create array for regular season standings
			for ( var i = 0; i < plength; i++ ) {
			  rname.push( [ roundrbtot[i], data.members[i].nickname ] );
			}			
			// Sort table
			rname.sort(sortFunction);
			function sortFunction(a,b){
				if (Number(a,[0]) === Number(b[0] )) {
					return 0;
				}
				else {
					return (Number(a[0]) < Number(b[0])) ? -1 : 1;
				}
			}
			rname.reverse(); // Reverse the sort to make the highest total at the top			

//			console.table(roundrbtot);
//			console.table(roundfbtot);


			// Calculate Fedex adjustment values based on Regular Season final standing
			let rnameflat = rname.flat();
			var regind;
			var radjust = [];
			console.table(rnameflat);
			for (var i = 0; i < plength; i++ ) {
				regind = rnameflat.indexOf(data.members[i].nickname);
				console.log(regind);
				console.log(roundrbtot[i]);
				if (regind < 10 ) {
				radjust[i] = ((13 - regind)/2);
				}
				else if (regind < 14) {
				radjust[i] = 0;
				}				
				else {
				radjust[i] = ((11 - regind)/2);	
				}
				console.log(data.members[i].nickname, radjust[i]);
			}
			
//			console.table(radjust);
//			console.table(roundfbtot);
			
			// *** Fedex season calculation
			// Create array with player name and BJ total
			for ( var i = 0; i < plength; i++ ) {
				roundfbtot[i] = Number(roundfbtot[i]);
				roundfbtot[i] = roundfbtot[i] + radjust[i];
				fxname.push( [ roundfbtot[i], data.members[i].nickname ] );
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
//			console.table(fxname);
//			console.log(fxname.indexOf(2.5));


			// Add rows to Brown Jacket points table with player 'nickname' and total fedex points
			for (let p =0; p < plength; p++) {
				fedextab +=
					`
					<tr><td style="text-align:left" style="padding-left:200px">${fxname[p][1]}</td><td>${fxname[p][0]}</td></tr>	
					`;
				}	// Close 'for' 'p' loop to create table		
		
		// Build sorted HTML table
			document.getElementById("fedexpointstable").innerHTML = fedextab; 
		
	}