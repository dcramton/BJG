import { getPlayers, getGames, showLoader, hideLoader } from "./commonscripts.js";

// Initialization

// Messages
var totmsg = "Brown Jacket total for the group must add up to 0. Score not entered.";

var plength
const bhigh = 12;        // Brown Jacket regular high limit
const blow = -12;        // Brown Jacket regular low limit
const shigh = 40;        // Stableford high limit
const bdubhigh = 24;     // Brown Jacket double points high limit
const bdublow = -24;     // Brown Jacket double points low limit, bhigh=12, blow=-12, shigh=48, bdubhigh=24, bdublow=-24;

// Main Functions
function showTable(playerData) {
  console.log("Starting showTable function");
  plength = playerData.players_bj.players.length;

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
    <td>${playerData.players_bj.players[p].nickname}</td>
    <td><input type="number" class="bjpoints" min="-24" max="24"></td>
    <td><input type="number" class="spoints" min="0" max="48"></td>
    </tr>
    `;
  }

// Log the generated table HTML
  document.getElementById("enterscores").innerHTML = gametable;
//  console.log("Table set in HTML"); // Confirm the table is set
  hideLoader();
}

async function validateScores(gamedate, holes, bscores, sscores) {
  // Combine your validation functions
  if (!gamedate) {
      alert("You must enter a Game Date. Score not entered.");
      return false;
  }

  const bjScoresNumeric = bscores.map(Number);
  console.log("BJ Scores:", bjScoresNumeric); // Debug log

  const bjtotal = bjScoresNumeric.reduce((sum, score) => sum + score, 0);
  console.log("BJ Total:", bjtotal); // Debug log
  if (bjtotal !== 0) {
      alert(totmsg);
      return false;
  }

  const currentYear = new Date(gamedate).getFullYear();
  const doublePointsDate = new Date(currentYear, 9, 25); // Month is 0-based, so 9 = October
  const gameDate = new Date(gamedate);

  console.log("Game Date:", gameDate); // Debug log
  console.log("Double Points Date:", doublePointsDate); // Debug log

  // Check BJ scores range based on date
  if (gameDate >= doublePointsDate) {
    console.log("Double Points Period"); // Debug log
    const invalidBJScores = bjScoresNumeric.some(score => score < bdublow || score > bdubhigh);
    if (invalidBJScores) {
        alert(`Brown Jacket scores must be between ${bdublow} and ${bdubhigh} for Double Points games`);
        return false;
    }
} else {
    console.log("Regular Period"); // Debug log
    const invalidBJScores = bjScoresNumeric.some(score => score < blow || score > bhigh);
    if (invalidBJScores) {
        console.log("Invalid scores found:", bjScoresNumeric.filter(score => score < blow || score > bhigh)); // Debug log
        alert(`Brown Jacket scores must be between ${blow} and ${bhigh}`);
        return false;
    }
}

const sScoresNumeric = sscores.map(Number);
const invalidStablefordScores = sScoresNumeric.some(score => score < 0 || score > shigh);
if (invalidStablefordScores) {
    alert("Stableford scores must be between 0 and 48");
    return false;
}

  return true;
}

async function submitScores(gamedate, holes, bscores, sscores) {
    console.log("Starting submitScores function");
    
    const gameData = {
      gamedate,
      holes,
      bscores: bscores.map(String),
      sscores: sscores.map(String)
  };
  console.log("Submitting scores data:", gameData);  
  
    var putapiurl = "https://yo6lbyfxd1.execute-api.us-east-1.amazonaws.com/prod/games";

  try {
      const response = await fetch(putapiurl, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify(gameData)
      });

      if (!response.ok) {
          throw new Error('Network response was not ok');
      }

      const result = await response.json();
      alert(`${holes} hole score entered successfully`);
  } catch (error) {
      console.error('Error:', error);
      alert('Error submitting scores');
  }
}

// Event Listeners 
document.addEventListener('DOMContentLoaded', async function () {
  console.log("DOM fully loaded and parsed");
  showLoader();

  const form = document.getElementById('gameForm');
  form.addEventListener('submit', async function(e) {
      e.preventDefault(); // Prevent default form submission
      
      // Get all form data
      const formData = new FormData(form);
      const gamedate = formData.get('gamedate');
      const holes = formData.get('holes');
      
      // Get scores from table
      const bscores = Array.from(document.getElementsByClassName('bjpoints'))
          .map(input => Number(input.value));
      const sscores = Array.from(document.getElementsByClassName('spoints'))
          .map(input => Number(input.value));

      // Validate and submit
      if (await validateScores(gamedate, holes, bscores, sscores)) {
          await submitScores(gamedate, holes, bscores, sscores);
      }
  });

  try {
      const playerData = await getPlayers();
      if (playerData) {
          showTable(playerData);
      }
  } catch (error) {
      console.error('Error in main flow:', error);
  } finally {
  hideLoader();
  }
});