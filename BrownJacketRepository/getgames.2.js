// Define games table
let tab = "";
var players, plength;

// url for API for BrownJacketGetGames
	const api_url = "https://yo6lbyfxd1.execute-api.us-east-1.amazonaws.com/prod/getgames";
//	const proxyurl = "https://cors-anywhere.herokuapp.com/";
//	const proxyurl = " ";

// Call function to get games
console.log("");
console.log("");
console.log("");
console.log("New run");
console.log("Call function to get games");
//	getapi(proxyurl + api_url);
	getapi(api_url); 

// Define function to get games 
async function getapi(url) {
  console.log("Inside function to get games");	
	var myHeaders = new Headers();	
	myHeaders.append('Content-Type', "application/json"); 
	var requestOptions = {
	method: 'GET',
//	mode: 'no-cors',
	headers: myHeaders,
	redirect: 'follow'
	};
//	const response = await fetch(url);
// 'data' is existing games data	
	console.log("just before fetch");
	const response = await fetch(url, requestOptions);
	console.log("in between fetch");	
	var data = await response.json();
	console.log("just after fetch");		
	console.log(data);
	if (response) {hideloader();}
	
// Call function to create games table
	console.log("Call function to create games table");
	show(data);
} //	Close of function to get games

// Function to hide the loader 
function hideloader() { 
	document.getElementById('loading').style.display = 'none'; 
}

// Function create games table 
function show(data) {
	console.log("Function called to create games table");
	console.log(data);

// Start header row
	tab += 
		`<col>
		 <colgroup span="2"></colgroup>
		 <tr>
		    <th rowspan="2" style="width:10%" class="gamedate">Date</th>
		    <th rowspan="2" class="holes">Holes</th>  
		`;

// Add player names to first header row
	const playerlist = new Request('players.json')
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
	var maxcombo = 0, maxcombo2 = 0, p1max = 0, p2max = 1, p1max2 = 0, p2max2 = 1, maxcombobackup = 0, p1max2backup = 0, p2max2backup = 1;
	var mincombo = 999, mincombo2 = 999, p1min = 0, p2min = 0, p1min2 = 0, p2min2 = 0, mincombobackup = 999, p1min2backup = 999, p2min2backup = 999;
	for (var p = 0; p < playertot; p++) {
		combo[p] = new Array();
	}
//	console.log("Combo array initialized ",combo);
	
	for (var p1 = 0; p1 < playertot; p1++) {
		for (var p2 = 0; p2 < playertot; p2++) {
			combo[p1][p2] = 0;
		}
	}	
//	console.log("Outer Combo array initialized ",combo);

// Loop to access all games 
	console.log("Begin loop to access all games");
for (var game of data.games) {
//		console.log(game);
			
// Convert date to text format			
	var mdraw, mdtext, mdtextlong, mdmon, mdday;
	mdraw = String(game.uuid);
    mdtextlong = mdraw.replace("2024-",'');
    mdtext = mdtextlong.slice(0,5);
    mdmon = mdtext.slice(0,2);
    mdday = mdtext.slice(3,5);
	if (mdmon == "05") {mdtext = "May " + mdday}
	if (mdmon == "06") {mdtext = "Jun " + mdday}
	if (mdmon == "07") {mdtext = "Jul " + mdday}
	if (mdmon == "08") {mdtext = "Aug " + mdday}
	if (mdmon == "09") {mdtext = "Sep " + mdday}
	if (mdmon == "10") {mdtext = "Oct " + mdday}

// Add scores to table
	tab += `<tr class="gamelog"> 
		<td class="gamedate">${mdtext}</td>
		<td>${game.holes}</td>
		`;

	// Begin loop to enter game scores to table and count games played together
	// "game.bscores[p1]" is the BJ score for p1 for the game being assessed from the game database/table
	// "game.sscores[p1]" is the Stableford score for p1 for the game being assessed from the game database/table
	
	for (let p1 = 0; p1 < playertot; p1++) {						// p1 is loop counter through players for each game
//		console.log("Begin loop to count games played together");
		if (game.bscores[p1] === undefined) game.bscores[p1]="";	// for each player, convert any empty BJ score to blank so table displays nothing	
		if (game.sscores[p1] === undefined) game.sscores[p1]="";	// also convert empty Stableford to blank
		let increment = (game.holes/18);
		if (game.sscores[p1] > 0) stot[p1] = stot[p1] + increment;		// if Stablefored score is >0, then player was in that game, so increase games played counter by 1 for current player		
//		console.log(mdtext, game.holes, p1, game.sscores[p1], stot[p1]);
		
		// write the BJ and Stableford scores for each player into the table
		tab +=`	
		<td>${game.bscores[p1]}</td>
		<td>${game.sscores[p1]}</td>
		`;

		// Nested loop below looks at the game for each player from outer loop (p1) then for each of these players loops through the other players looking for valid combos
		// These are identified when both p1 and p2 have a valid Stableford score
		// "game.sscores[p1]" is the Stableford score for p1 for the game being assessed from the game database/table
		// "game.sscores[p2]" is the Stableford score for p2 for the game being assessed from the game database/table		

		for (let p2 = 0; p2 < playertot; p2++) {						// p2 is loop counter for the other players in the game, for each p1
			if (game.sscores[p1] === undefined) game.sscores[p1]="";	// make sure any empty Stableford score for outer loop players are blank
			if (game.sscores[p2] === undefined) game.sscores[p2]="";	// convert empty Stableford score for inner loop player to blank
//			if (game.sscores[p1] == "") game.sscores[p1]=0;				// if outer loop score is blank set score value to 0
//			if (game.sscores[p2] == "") game.sscores[p2]=0;				// if inner loop score is blank set score value to 0

			// Inner loop looking for valid combos (both players have Stableford scores)
			// "combo[p1][p2]" is an array which counts the total number of games p1 and p2 have played together. Each element in the array is initialized at 0 and is increased by 1 when a combo game is identified
			// "maxcombo" and "maxcombo2" are variables which keep track of the most and second most number of combos of any pair of players. These are initialized at 0 and increased whenever a combo array item is greater than an existing max.

			if (p2 > p1 && game.sscores[p1] !=0 && game.sscores[p2] !=0) {	// avoid double counting combos by only assessing games where p2 > p1, and only count games where both players have a Stableford score (=combo game)

//				console.log("");
				console.log("******* Valid game found for ",players.members[p1].nickname, "and", players.members[p2].nickname); 
				console.log(mdtext,players.members[p1].nickname, game.sscores[p1],players.members[p2].nickname,game.sscores[p2]);
				combo[p1][p2] += 1;									// if combo game, increase counter for games played between these two players
//				console.log("Current combo for",players.members[p1].nickname , "and", players.members[p2].nickname, "is now increased to :",combo[p1][p2]);
//				console.log("valid combo. cc",combo[p1][p2], p1,p2,"mc",maxcombo,p1max, p2max,"mc2", maxcombo2, p1max2, p2max2,"bmc2",maxcombobackup, p1max2backup, p2max2backup);	

				if (combo[p1][p2] > maxcombo2) {					// check if total games played between these two players is greater than the current total for the second most games played between any two players
					
//					console.log("if cc > mc2. cc",combo[p1][p2], p1,p2,"mc",maxcombo,p1max, p2max,"mc2", maxcombo2, p1max2, p2max2,"bmc2",maxcombobackup, p1max2backup, p2max2backup);				
					maxcombobackup = maxcombo2;						// make a backup of the #2 game in case the players are duplicates
					p1max2backup = p1max2;
					p2max2backup = p2max2;
					maxcombo2 = combo[p1][p2];						// since this combo is higher than the #2 game, replace the #2 game with this one, but we will revert back if the players are duplicates
					p1max2 = p1;									
					p2max2 = p2;
					
					console.log("changed 2nd max. cc",combo[p1][p2], p1,p2,"mc",maxcombo,p1max, p2max,"mc2", maxcombo2, p1max2, p2max2,"bmc2",maxcombobackup, p1max2backup, p2max2backup);
					
					if (p1 == p1max && p2 == p2max) {				// check if the players are duplicates with the #1 game
						maxcombo2 = maxcombobackup;					// if they are duplicates, replace the #2 game with the backup
						p1max2 = p1max2backup;
						p2max2 = p2max2backup;
//						console.log("inside same players. cc",combo[p1][p2], p1,p2,"mc",maxcombo,p1max, p2max,"mc2", maxcombo2, p1max2, p2max2,"bmc2",maxcombobackup, p1max2backup, p2max2backup);
					}
					
					if (combo[p1][p2] > maxcombo) {					// check if this combo is greater than the #1 game
						if (p1 == p1max && p2 == p2max) {			// check to see if these are the same two players as the existing #1 game
//							console.log("inside max with same players");
							maxcombo = combo[p1][p2];				// if it is the same two player, just update the combo total
						console.log("max changed. cc",combo[p1][p2], p1,p2,"mc",maxcombo,p1max, p2max,"mc2", maxcombo2, p1max2, p2max2,"bmc2",maxcombobackup, p1max2backup, p2max2backup);	
						} else {									// if it is two new players 
							maxcombo2 = maxcombo;					// move the #1 game into the #2 slot
							p1max2 = p1max;							
							p2max2 = p2max;
							maxcombo = combo[p1][p2];				// replace the #1 game with this combo
							p1max = p1;										
							p2max = p2;								
						console.log("max changed. cc",combo[p1][p2], p1,p2,"mc",maxcombo,p1max, p2max,"mc2", maxcombo2, p1max2, p2max2,"bmc2",maxcombobackup, p1max2backup, p2max2backup);
//						console.log("maxes have now been changed.","Most games played:",maxcombo, "Second most games played:",maxcombo2, "p1max:", p1max, "p2max:", p2max, "p1max2:", p1max2, "p2max2:", p2max2, "p1:",players.members[p1].nickname, "p2:",players.members[p2].nickname);
						}	// Close 'else'
					}	//	Close 'if' current combo is greater than max combo
				}	//	Close 'if' current combo is greater than max combo 2
				
			}	//	Close if combo game

		}	//	Close 'p2' loop. Now each of the 'other' players has been checked for each of p1
		
	}	//	Close of 'p1' loop through players within each game
}	// Close of 'of' loop of games	
			
// Now start the process to look for the players who have played the least together. This time the number of games played for each combo has already been calculated in the loop above. 
			console.log("");
			console.log("Now start the process to look for the players who have played the least together.");			

for (var game of data.games) {			
	for (let p1 = 0; p1 < playertot; p1++) {						// p1 is loop counter through players for each game
		for (let p2 = 0; p2 < playertot; p2++) {						// p2 is loop counter for the other players in the game, for each p1
			
			if (p2 > p1) {											// avoid double counting combos by only assessing games where p2 > p1					
				console.log("inside min loop. cc",combo[p1][p2], p1,p2,"mc",mincombo,p1min, p2min,"mc2", mincombo2, p1min2, p2min2,"bmc2",mincombobackup, p1min2backup, p2min2backup);
				if (combo[p1][p2] < mincombo2) {					// check if the new combo for these two players is lower than the current total for the second least number of games played between any two players. 
					console.log("beginning of min loop.");																	// "mincombos" are initialized at 999, so at first any combo[p1][p2] will be lower, so that combo will set the mincombos to 0.
					mincombobackup = mincombo2;						// make a backup of the #2 game in case the players are duplicates
					p1min2backup = p1min2;
					p2min2backup = p2min2;
					mincombo2 = combo[p1][p2];						// since this combo is lower than the #2 game, replace the #2 game with this one, but we will revert back if the players are duplicates
					p1min2 = p1;									
					p2min2 = p2;									
					console.log("min combo 2 has changed. cc",combo[p1][p2], p1,p2,"mincombo",mincombo,p1min, p2min,"mincombo2", mincombo2, p1min2, p2min2,"bmincombo2",mincombobackup, p1min2backup, p2min2backup);				
					if (p1 == p1min && p2 == p2min) {					// check if the players are duplicates with the #1 game
						console.log("current players are duplicates of the mincombo game.");
						mincombo2 = mincombobackup;						// if they are duplicates, replace the #2 game with the backup
						p1min2 = p1min2backup;
						p2min2 = p2min2backup;
						console.log("inside same players. cc",combo[p1][p2], p1,p2,"mincombo",mincombo,p1min, p2min,"mincombo2", mincombo2, p1min2, p2min2,"bmincombo2",mincombobackup, p1min2backup, p2min2backup);
					}
	
	
					if (combo[p1][p2] < mincombo) {						// check if this combo is lower than the #1 game
						console.log("current combo is lower than mincombo.");
						if (p1 == p1min && p2 == p2min) {				// check to see if these are the same two players as the existing #1 game
								console.log("inside min with same players");
							mincombo = combo[p1][p2];					// if it is the same two player, just update the combo total
						} else {										// if it is two new players 
							mincombo2 = mincombo;						// move the #1 game into the #2 slot
							p1min2 = p1min;							
							p2min2 = p2min;
							mincombo = combo[p1][p2];					// replace the #1 game with this combo
							p1min = p1;										
							p2min = p2;								
						console.log("min changed. cc",combo[p1][p2], p1,p2,"mincombo",mincombo,p1min, p2min,"mincombo2", mincombo2, p1min2, p2min2,"bmincombo2",mincombobackup, p1min2backup, p2min2backup);
//						console.log("mins have now been changed.","Least games played:",mincombo, "Second least games played:",mincombo2, "p1min:", p1min, "p2min:", p2min, "p1min2:", p1min2, "p2min2:", p2min2, "p1:",players.members[p1].nickname, "p2:",players.members[p2].nickname);
						}	// Close 'else';		
					}	//	Close 'if' mincombo is increased
				}	// Close if mincombo is less than min combo 2
//			console.log(playertot, mdday, "cc", combo[p1][p2], p1, p2, "scores", game.sscores[p1], game.sscores[p2], "mc1", mincombo, p1min, p2min,"mc2", mincombo2, p1min2, p2min2);
				
			}	//	Close if combo game
			
//	console.log(playertot, mdday, combo[p1][p2], p1, p2, game.sscores[p1], game.sscores[p2],combo[p1][p2], "mc1", mincombo, p1min, p2min,"mc2", mincombo2, p1min2, p2min2);
//			if (game.sscores[p1] == 0) game.sscores[p1]="";	// change '0' to blank
//			if (game.sscores[p2] == 0) game.sscores[p2]="";	// change '0' to blank
			

		}	//	Close 'p2' loop. Now each of the 'other' players has been checked for each of p1
		
	}	//	Close of 'p1' loop through players within each game			

}	// Close of 'of' loop of games



console.log(combo);

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

// Clean-up routine for early in the season to show different 'Most Games Played Together'
if (p1max == p1max2) {p1max2 = 2}
if (p2max == p2max2) {p2max2 = 3}

//	Create table with Most Games Played Together
	console.log("Create tables for games played together");
	let maxcombotable = 
		`<tr>
			<th style:width="20%">Players</th>
			<th>Games Together</th>
		</tr>
		<tr>
			<td>${players.members[p1max].nickname} and ${players.members[p2max].nickname}</td>
			<td>${maxcombo}</td>
		</tr>
		<tr>
			<td>${players.members[p1max2].nickname} and ${players.members[p2max2].nickname}</td>
			<td>${maxcombo2}</td>
		</tr>
		`;
	  document.getElementById("maxcombotable").innerHTML = maxcombotable;

// Clean-up routine for early in the season to prevent mincombo values of '999' to be shown.

if (mincombo == 999) {mincombo = 0; p1min = 0; p2min = 1}
if (mincombo2 == 999) {mincombo2 = 0; p1min2 = 2; p2min2 = 3}

//	Create table with Least Games Played Together
	let mincombotable = 
		`<tr>
			<th>Players</th>
			<th>Games Together</th>
		</tr>
		<tr>
			<td>${players.members[p1min].nickname} and ${players.members[p2min].nickname}</td>
			<td>${mincombo}</td>
		</tr>
		<tr>
			<td>${players.members[p1min2].nickname} and ${players.members[p2min2].nickname}</td>
			<td>${mincombo2}</td>
		</tr>
		`;
	  document.getElementById("mincombotable").innerHTML = mincombotable;

//	Sort games by date
// Setting innerHTML as tab variable
	console.log("Sort by date");
	document.getElementById("games").innerHTML = tab; 
 
// Sort games
	var table, rows, switching, i, x, y, shouldSwitch, xtexts, ytexts, xmon, ymon;
	table = document.getElementById("games");
	switching = true;
	while (switching) {
	    switching = false;
	    rows = table.rows;
	    for (i = 2; i < (rows.length - 3); i++) {
	    	shouldSwitch = false;
	    	x = rows[i].getElementsByTagName("td")[0];
			var xtext = String(x.innerHTML);
			xtext = xtext.slice(0,6);
	    	xtexts = xtext.replace("-",'');
	    	xtexts = xtexts.replace("May ","05");
			xtexts = xtexts.replace("Jun ","06");
			xtexts = xtexts.replace("Jul ","07");
			xtexts = xtexts.replace("Aug ","08");
			xtexts = xtexts.replace("Sep ","09");
			xtexts = xtexts.replace("Oct ","10");
	    	var xnum = Number(xtexts);
	    	
			y = rows[i+1].getElementsByTagName("td")[0];
			var ytext = String(y.innerHTML);
			ytext = ytext.slice(0,6);
	    	ytexts = ytext.replace("-",'');
	    	ytexts = ytexts.replace("May ","05");
			ytexts = ytexts.replace("Jun ","06");
			ytexts = ytexts.replace("Jul ","07");
			ytexts = ytexts.replace("Aug ","08");
			ytexts = ytexts.replace("Sep ","09");
			ytexts = ytexts.replace("Oct ","10");	
	    	var ynum = Number(ytexts);
	    	
	    	if (xnum > ynum) {
	    		shouldSwitch = true;
	    		break;
	    	}
	    }
		if (shouldSwitch) {
			rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
			switching = true;
		}
	}	// close sort
  });	// close fetch
	  	
}	// close function