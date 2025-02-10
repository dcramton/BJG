// Define availability table
//

var yeardates = 170; // Number of calendar days from first game to last game (width of top row)
var yeardays = 24 // Number of weeks from first to last inclusive (count of number of cells in second row)
var yeargames = 49; // Number of game dates in the year (count of number of cells in third row)
var firstdate = new Date(2023, 4, 12); // May = '04'
var plength;
var pcode = new Array();
var p2code = new Array();
var dateval = new Array();
var date_cell = new Array();
var member = new Array();
var player_row = new Array();
var month_cell, month_row, monthtable, monthtablebody, monthname, month_name;
var dayname_cell, dayname_row, dayname_name, daynamename, daynumber_cell, daynumbername, daynumber_row;
var playernamecell, playername;


// url for API to GET BrownJacketAvailaility
  const getavail_api_url = "https://yo6lbyfxd1.execute-api.us-east-1.amazonaws.com/prod/getavailability";
//  const proxyurl = "https://cors-anywhere.herokuapp.com/";

// Call function to get availability
console.log("Call function to get availability");
//	getapi(proxyurl + getavail_api_url);
	getapi(getavail_api_url); 

// Define function to get availability 
async function getapi(url) {
  console.log("Inside function to get availability");	
	var myHeaders = new Headers();	
	myHeaders.append('Content-Type', "application/json"); 
	var requestOptions = {
	method: 'GET',
//	mode: 'no-cors',
	headers: myHeaders,
	redirect: 'follow'
	};
//	const response = await fetch(url);
// 'data' is existing availability data
  console.log("just before fetch");
	const response = await fetch(url, requestOptions);
  console.log("in between fetch");	
	var data = await response.json();
  console.log("just after fetch");		
	console.log(data);
	if (response) {hideloader();}
	
  //  Initialize arrays
  window.plength = data.players.length;  
  for(let p = 0; p < plength; p++) {
    pcode[p] = "";
    p2code[p] = "";
    player_row[p] = "";    
    member[p] = "";    
    dateval[p]= new Array();
    date_cell[p] = new Array();
  }
  for (let p = 0; p < plength; p++) {
    for (let g = 0; g < yeargames; g++) {  
      dateval[p][g] = 0;
      date_cell[p][g] = "-";
      member[p] = "";
    }
  }  	

// Call function to create availability table
  console.log("Call function to create dates table");
	month(data); 
} //	Close of function to get availability

// Function to hide the loader 
function hideloader() { 
	document.getElementById('loading').style.display = 'none';
}


// Build table starting with headers
async function month(data) {
  console.log("Inside function to build table");
  console.log(data);

// Add player names to first header row
  var currentcolor = 'tan';
  var datenum = firstdate.getDate();
  var monthnum = firstdate.getMonth();  
  var msecs = firstdate.getTime();

  // get the reference for the body
  var monthbody = document.getElementsByTagName("body")[0];

  // creates <table> and <tbody> elements
  monthtable = document.createElement("table");
  monthtablebody = document.createElement("tbody");

  //  create first header row with month names
  console.log("Create first header row with month names");  
  month_row = document.createElement("tr");
  //  blank cell
  month_cell = document.createElement("th");
  month_cell.rowSpan="3";    
  monthname = document.createTextNode("Player");
  month_cell.appendChild(monthname);
  month_row.appendChild(month_cell);
  
  month_cell = document.createElement("th");
  month_cell.colSpan="6";
  month_name = document.createTextNode("May (Tim)");
  month_cell.appendChild(month_name);
  month_row.appendChild(month_cell);
  
  month_cell = document.createElement("th");
  month_cell.colSpan="8";
  monthname = document.createTextNode("June ()");
  month_cell.appendChild(monthname);
  month_row.appendChild(month_cell);
  
  month_cell = document.createElement("th");
  month_cell.colSpan="9";
  month_name = document.createTextNode("July (Steve)");
  month_cell.appendChild(month_name);
  month_row.appendChild(month_cell);
  
  month_cell = document.createElement("th");
  month_cell.colSpan="9";
  month_name = document.createTextNode("August ()");
  month_cell.appendChild(month_name);
  month_row.appendChild(month_cell);
  
  month_cell = document.createElement("th");
  month_cell.colSpan="9";
  monthname = document.createTextNode("September ()");
  month_cell.appendChild(monthname);
  month_row.appendChild(month_cell);
  
  month_cell = document.createElement("th");
  month_cell.colSpan="8";
  month_name = document.createTextNode("October ()");
  month_cell.appendChild(month_name);
  month_row.appendChild(month_cell);
  
  monthtablebody.appendChild(month_row);


  //  create second header row with day names
  dayname_row = document.createElement("tr");
  
  for(let j = 0; j < yeardays; j++) {     
    dayname_cell = document.createElement("th");
    daynamename = document.createTextNode("Sat");
    dayname_cell.appendChild(daynamename);
    dayname_row.appendChild(dayname_cell);
    
    dayname_cell = document.createElement("th");
    dayname_name = document.createTextNode("Wed");
    dayname_cell.appendChild(dayname_name);
    dayname_row.appendChild(dayname_cell);
  }
  
    dayname_cell = document.createElement("th");
    daynamename = document.createTextNode("Sat");
    dayname_cell.appendChild(daynamename);
    dayname_row.appendChild(dayname_cell);

  monthtablebody.appendChild(dayname_row);


//  create third header row with day numbers
  daynumber_row = document.createElement("tr");

  for(let j = 0; j < yeardates; j++) {     
      daynumber_cell = document.createElement("th");
      let nextdate = firstdate.getTime() + (24 * 60 *60 * 1000 * j);
      let datenumfull = new Date(nextdate);
      let datenum = datenumfull.getDate();
      let daynum = datenumfull.getDay();
//      console.log(daynum);
      
      if (daynum == 3 || daynum == 6) {
//        console.log(daynum);
        daynumbername = document.createTextNode(datenum);
        daynumber_cell.appendChild(daynumbername);
        daynumber_row.appendChild(daynumber_cell);
      }
  }
  monthtablebody.appendChild(daynumber_row);    

// Build table with existing availability

console.log("just before loop");
console.log(plength);
// Start each row with player names
  for(let p = 0; p < plength; p++) {
//    console.log(data.players[p].nickname);
    member[p] = data.players[p].nickname;
    // creates a <tr> element
    player_row[p] = document.createElement("tr");
    playernamecell = document.createElement("td");
    playername = document.createTextNode(data.players[p].nickname);
    playernamecell.appendChild(playername);
    player_row[p].appendChild(playernamecell);        

// Build remaining cells with colour codes for availability
  for(let g = 0; g < yeargames; g++) {
//    console.log(p, g, data.players[p].dates[g]);
    let date = data.players[p].dates[g];
//    console.log(date);
    
// Convert any undefined cells to blank
console.log(typeof date);
// console.log(typeof data.player[p].dates[g]);
    if (typeof date === 'undefined') {
      console.log("undefined cell found");
      date = "-";
    }
//    console.log(date);

// Build "code" for each player's availability to see if it's been changed
    pcode[p] = pcode[p] + date;

    // creates a <td> element
    date_cell[p][g] = document.createElement("td");
    // creates a Text Node
    dateval[p][g] = document.createTextNode(date);

    if (date == "Y") {
      date_cell[p][g].style.backgroundColor = "green";
    }
    if (date == "N") {
      date_cell[p][g].style.backgroundColor = "red";
    }  

    // Add listener to change availability status
    date_cell[p][g].addEventListener("click", function() {
      console.log("Inside function to set background colour");
      let currentcolor = date_cell[p][g].style.backgroundColor;
      let currentvalue = dateval[p][g];
      console.log(currentcolor, currentvalue);
      
      if (currentcolor == '') {
//        console.log("inside if currentcolor is blank");
//        console.log(date_cell[p][g]);
        date_cell[p][g].style.backgroundColor = 'green';
        date_cell[p][g].innerHTML= "Y";
        return;
      }
      if (currentcolor == 'green') {
//        console.log("inside if currentcolor is green");
//        console.log(date_cell[p][g]);
        date_cell[p][g].style.backgroundColor = 'red'; 
        date_cell[p][g].innerHTML= "N"; 
        return;}
      if (currentcolor == 'red') {
//        console.log("inside if currentcolor is red");
//        console.log(date_cell[p][g]);       
        date_cell[p][g].style.backgroundColor = ''; 
        date_cell[p][g].innerHTML= "-";      
        return;}
      }); //  Close background colour change function  
    

    // appends the Text Node we created into the cell <td>
    date_cell[p][g].appendChild(dateval[p][g]);
    // appends the cell <td> into the row <tr>
    player_row[p].appendChild(date_cell[p][g]);
  } // Close 'for' loop for each player

  // appends the row <tr> into <tbody>
    monthtablebody.appendChild(player_row[p]);
  } //  Close loop for table


  // appends <tbody> into <table>
  monthtable.appendChild(monthtablebody);
//  console.log(monthtablebody);
  // appends <table> into <body>
  monthbody.appendChild(monthtable);
//  console.log(monthbody);  
  // sets the border attribute of monthtable to 2;
  monthtable.setAttribute("border","2");
//  console.log(monthtable);    


} //Close 'month' function




// Check which games are changed and then write to database

function SubmitAvailaility() {

//  Start by checking which games are changed
  var changetot = 0;
  var changegame = 0;
  var changemsg = "You can only update one player's availability at a time";
  var confirmmsg = "";  
  console.log(plength);
  console.log(member[1]);
//  console.log(date_cell[1][1].innerHTML);

  //  Initialize arrays
  for(let p = 0; p < plength; p++) {p2code[p] = ""}
  
  //  Check to see which player was updated by rebuilding pcodes
  //  Build validation code from possibly updated table
  for (let p = 0; p < plength; p++) {
    console.log("inside loop to build validation codes");
    for(let g = 0; g < yeargames; g++) {
//      if (date_cell[p][g].innerHTML == "") {date_cell[p][g].innerHTML = "-"}
      let date = date_cell[p][g].innerHTML;
      p2code[p] = p2code[p] + date;
    }
      console.log(member[p],p2code[p]);
  }

  //  Compare validation codes
  for (let p = 0; p < plength; p++) {
    console.log("inside loop to compare player codes");    
    console.log(pcode[p],"   ", p2code[p]);
    if (p2code[p] === pcode[p]) {
      console.log("no changes");
    }
    else if (p2code[p] !== pcode[p]) {
      console.log("changes");
      changegame = p;
      changetot = changetot + 1;
      if (changetot > 1) {
        changemsg = confirm(changemsg);
        return;
      
      } // Close if to send message if more than one player's availaility has changed
    } // Close loop to see if more than one player's availaility has changed
   } //Close loop to compare each playyer's validation codes
   if (changetot == 0) return;
  console.log("move to write to database"); 

// Write game to database via API Gateway  
  console.log("Starting function to write availability to database");
  // Convert data to fetch required format
  var dates = new Array();
  for (let g=0; g < yeargames; g++) {
    dates[g] = date_cell[changegame][g].innerHTML;
    console.log(member[changegame], dates[g]);
  }
  console.log(dates);

  // Create javascript object with game data
  var obj = {"nickname":member[changegame], "dates":dates
  };
  console.log(obj);
  
  var raw = JSON.stringify(obj);
  console.log(raw);
  
  
  // urls for API Gateway stage
  var putapiurl = "https://yo6lbyfxd1.execute-api.us-east-1.amazonaws.com/prod/-updateavailaility";
  
  // Prepare data for Fetch
  var myHeaders = new Headers();  
  myHeaders.append('Content-Type', "application/json"); 
  var requestOptions = {
      method: 'POST',
//      mode: 'no-cors',
      headers: myHeaders,
      body: raw,
      redirect: 'follow'
  };
  console.log(member[changegame]);
  console.log(requestOptions);

  // Use fetch to PUT the game score into Dynamodb through the API Gateway and Lambda  
  fetch(putapiurl, requestOptions)
  .then(response => response.text())
  .then(result => (JSON.parse(result).body))
  .catch(error => console.log('error', error));
  confirmmsg = confirm("Availability for " + member[changegame] + " updated successfully");
  var sucmsg = "Availability for " + member[changegame] + " updated successfully"; 
  console.log("Success message is \n", sucmsg);
//  msg = confirm(sucmsg);  
}