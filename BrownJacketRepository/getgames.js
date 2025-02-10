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
	for (var p = 0; p < playertot; p++) {
		combo[p] = new Array();
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

	// Begin loop to enter game scores to table 
	
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

		}	//	Close of 'p1' loop through players within each game
}	// Close of 'of' loop of games	
			

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

//	Sort games by date
// Setting innerHTML as tab variable
	console.log("Sort by date");
	document.getElementById("games").innerHTML = tab; 
 
// Sort games
	var table, rows, switching, i, x, y, shouldSwitch, xtexts, ytexts;
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