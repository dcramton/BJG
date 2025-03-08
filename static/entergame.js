// Script to enter scores

//import Amplify, { Auth } from 'aws-amplify';
//import awsconfig from './aws-exports';
//Amplify.configure(awsconfig);

// Messages
var msg = "";
var datmsg = "You must enter a Game Date. Score not entered.";
var noscoresmsg = "No games entered. Score not entered.";  
var bjoctmsg = "Brown Jacket score must be between -24 and +24. Score not entered.";
var bjmsg = "Brown Jacket score must be between -12 and +12. Score not entered.";
var smsg = "18 hole Stableford score must be between 0 and 48. Score not entered.";
var totmsg = "Brown Jacket total for the group must add up to 0. Score not entered.";
var octmsg = "Welcome to the the final day! Hope it went well and it wasn't too cold. Score entered successfully.";
var result;

// Set score limits
var bhigh=12, blow=-12, shigh=48;

//  Initialize 'data' which will be returned from playerlist fetch
var data, plength;

// Create initial page with form to enter games

// Create headers
let gametable = 
  `<tr id="title">
  <th>Player</th>
  <th>Brown Jacket Score</th>
  <th>Stableford Score</th>  
  </tr>`;

// Get players from JSON file by calling 'GetPlayers' function which returns players as 'data'
GetPlayers().then((data) => {
  window.plength = data.members.length;
  window.data = data;

  let gametable = 
    `<tr id="title">
    <th>Player</th>
    <th>Brown Jacket Score</th>
    <th>Stableford Score</th>  
    </tr>`;

  for(let p = 0; p < plength; p++) {
    gametable += 
    `
    <tr>
    <td>${data.members[p].nickname}</td>
    <td><input type="number" class="bjpoints" min="-24" max="24"></td>
    <td><input type="number" class="spoints" min="0" max="48"></td>
    </tr>
    `;
  }

//  console.log(gametable); // Log the generated table HTML
  document.getElementById("enterscores").innerHTML = gametable;
  console.log("Table set in HTML"); // Confirm the table is set
});


//  FUNCTIONS

// ***** Main Program  **************

// Master function activated when Submit Scores button pressed
function SubmitScores(holes = "holes") {
  
  // Get scores and number of holes played input from input table
  var gamedate = document.getElementById('gamedate');
  var holes = document.getElementById('holes').value;
  var bscores = document.getElementsByClassName('bjpoints');
  var sscores = document.getElementsByClassName('spoints');

//"CheckDate function"
  CheckDate(gamedate, holes);
  if (result == 'end') {return}
  
//"CheckBJTot function"
  CheckBJTot(bscores, sscores);
    if (result == 'end') {return}
  
//"CheckRange function"
  CheckRange(bscores, sscores, holes, data);
    if (result == 'end') {return}
  
//"WriteGame function"
  WriteGame(bscores, sscores, holes, gamedate);
  
}   //  End of master function

// ****** Functions  **************

function GetPlayers() {
  const playerlist = new Request('/static/playersbj.json');
  return fetch(playerlist)
    .then((response) => {
      return response.json().then((data) => {
        return data;
      }).catch((err) => {
        console.log(err);
      });
    });
  } // Close GetPlayers function

function CheckDate(date, holes){
  // Check to see if a date has been entered  
  if (date.value == "") {
    console.log("Date not entered");
    datmsg = confirm(datmsg); result = 'end'; return;
  } else {
    console.log("Date is present");
    //  Gamedate is present, now run CheckOct function check to see if the game was played in October
    CheckOct(date, holes);
    result = 'continue';
  } // Close 'else' for valid date
} // Close function

function CheckOct(date, holes){
  let sucmsg = "";
  var datenum = new Date(date.value);
  var month = datenum.getMonth();
  var day = datenum.getDay();
  // Check to see if it's October and change limits and message if necessary
  if (month == 9 && day > 24) {
    console.log("Final day game. Limits increased.");
    return bhigh = 24, blow = -24, bjmsg = bjoctmsg, sucmsg = octmsg;
  }
} // Close CheckDate function

function CheckBJTot(bscores,sscores){
  // Validate that Brown Jacket total is 0  
  let bjtot=Number(0); 
  let stot=Number(0);
  let bjfixed=Number(0);
  // Loop through each of the players to add to game totals
  for (var i = 0; i < window.plength; i++) { 
    let bval = Number(bscores[i].value);
    let sval = Number(sscores[i].value);
    if (bval !=0) {
      bjtot = bjtot + bval;
      console.log("bjtot", bjtot, bval);
      bjfixed = bjtot.toPrecision(6);
      console.log("fixed", bjfixed);
      bjtot = Number(bjfixed);
    } // Close of 'if' 'not 0' to add score to bj validation total
    if (sval !=0) {
      stot = stot + sval;
    }  // Close of 'if' 'not 0' to add score to s validation total
  }   // Close of 'for' 'i' loop to add all scores
  // Assess totals for validity and either send warning message or continue
  if (stot == 0) {
    console.log("No scores entered");
    noscoresmsg = confirm(noscoresmsg); result = 'end'; return;
  } else if 
    (bjtot != 0) {
    console.log("Brown Jacket total is not 0");
    totmsg = confirm(totmsg); result = 'end'; return;
  } else {
    console.log("Validated that Brown Jacket total is 0");
    result = 'continue';
  }
} // Close BJTot function

function CheckRange(bscores, sscores, holes, data){
  console.log("Checking ranges");
  var confirmmsg = "You are about to enter the following " + holes + " hole score. \nIf correct, please select OK, otherwise select Cancel and re-enter the score:\n";
  //Validate scores are in range
  // Loop through each player
  for (var i = 0; i < window.plength; i++) {
    let bval = Number(bscores[i].value);
    let sval = Number(sscores[i].value) * 18 / holes;
    if (bval >bhigh || bval < blow) {
      console.log("Brown Jacket score is out of range.");
      bjmsg = confirm(bjmsg); result = 'end'; return;
    } else if (
      sval > shigh) {
        console.log("Stableford score is out of range.");
        smsg = confirm(smsg); result = 'end'; return;
      }
    else if (sval >0) {
      // Score is now validated
      console.log("Validated that scores are all in range");
      var newline;
      newline = "\n " + data.members[i].nickname + " had " + bval + " and " + sval;
      confirmmsg = confirmmsg + newline;
    } // Close 'if' valid and write message row
  }   // Close for 'i' to loop through players
  console.log("Confirm message is ", confirmmsg);
  
  // Display confirmation message
  msg = confirm(confirmmsg);
  if (msg == false) {
    console.log(msg, "Score not validated by scorer");
    result = 'end';
    return;
  } else {
    console.log("Score validated by scorer and ready to move to Write Game.");
  return;
  } // Close of confirm message
} // Close CheckRange function

function WriteGame(bscores, sscores, holes, gamedate) {
  // Write game to database via API Gateway  
  console.log("Starting function to write game to database");
  // Get Brown Jacket Scores, Stableford scores, Holes Played and Game Date from input table  
  // Convert data to fetch required format
  var bval = new Array();
  for (let i=0; i < bscores.length; i++) {
    bval[i] = (bscores[i].value).toString();
    console.log(bval[i]);
  }
  var sval = new Array();
  for (let i=0; i < sscores.length; i++) {
    sval[i] = (sscores[i].value).toString();
  }
  
  // Create javascript object with game data  
  var obj = {"gamedate":gamedate.value, "holes":holes
  ,"bscores":bval,"sscores":sval
  };
  console.log(obj);
  
  var raw = JSON.stringify(obj);
  console.log(raw);
  
  
  // urls for API Gateway stage
  var putapiurl = "https://yo6lbyfxd1.execute-api.us-east-1.amazonaws.com/prod";
  
  // Prepare data for Fetch
  var myHeaders = new Headers();  
  myHeaders.append('Content-Type', "application/json"); 
  var requestOptions = {
      method: 'POST',
      headers: myHeaders,
      body: raw,
      redirect: 'follow'
  };
  console.log(requestOptions);

  // Use fetch to PUT the game score into Dynamodb through the API Gateway and Lambda  
  fetch(putapiurl, requestOptions)
  .then(response => response.text())
  .then(result => (JSON.parse(result).body))
  .catch(error => console.log('error', error));
  var sucmsg = holes + " hole score entered successfully"; 
  console.log("Success message is \n", sucmsg);
  msg = confirm(sucmsg);
} // Close WriteGame function