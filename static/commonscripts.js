const bjapi_url = "https://yo6lbyfxd1.execute-api.us-east-1.amazonaws.com/prod/";

export async function getPlayers() {
//  Function to get players from backend, through API
//  Returns an object containing two properties:
//  'players_bj' (an object with a sorted 'players' array of active players) and
//  'players_all' (an object with a sorted 'players' array of all players).

//  console.log("getPlayer function in commonscripts.js starting...");
    showLoader();
 
    try {
        const myHeaders = new Headers();	
        myHeaders.append('Content-Type', "application/json"); 
        
        const requestOptions = {
            method: 'GET',
            headers: myHeaders,
            redirect: 'follow'
        };
        let bjapi_players_url = bjapi_url + "players";
        const response = await fetch(bjapi_players_url, requestOptions);
//        console.log("Response status:", response.status);
    
        if (!response.ok) {
            throw new Error(`Failed to fetch players: ${response.status}`);
        }
        
        const playerData = await response.json();
//        console.log("Players fetched successfully:", playerData);
        const players_bj = {
            players: playerData.players.filter(player => player.legacy === 'N')
        };

        players_bj.players.sort((a, b) => a.nickname.localeCompare(b.nickname));
        playerData.players.sort((a, b) => a.nickname.localeCompare(b.nickname));
//        console.log("Players sorted:", players_bj);
//        console.log("Players fetched successfully:", playerData);

        return {
        players_bj: players_bj,
        players_all: playerData
        };
 
    } catch (error) {
      console.error('Error fetching players:', error);
      hideLoader();
    }
  }

export async function getGames() {
//  Function to get games from backend, through API
//  Returns an object containing two properties:    
//  'getGames' (an object with a 'games' array of active games)

//    console.log("Fetching games...");
    showLoader();

    try {
        const myHeaders = new Headers();	
        myHeaders.append('Content-Type', "application/json"); 
        
        const requestOptions = {
            method: 'GET',
            headers: myHeaders,
            redirect: 'follow'
        };

        let bjapi_games_url = bjapi_url + "games";
        const response = await fetch(bjapi_games_url, requestOptions);
    //        console.log("Response status:", response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const gamesData = await response.json();
//        console.log("Response data (unsorted):", gamesData);
        gamesData.games.sort((a, b) => {
            const dateA = String(a.uuid);
            const dateB = String(b.uuid);
            return dateA.localeCompare(dateB);
        });
//        console.log("Response data (sorted):", gamesData);
        hideLoader();
        return(gamesData);
        

    } catch (error) {
        console.error('Error fetching data:', error);
        document.getElementById("games").innerHTML = 
            `<div class="error-message">Unable to load games data. Please try again later.</div>`;
        hideLoader();
        return null;
    }
}

export async function getDates() {
showLoader();
//    console.log("Fetching dates...");
  
    try {
        const myHeaders = new Headers();	
        myHeaders.append('Content-Type', "application/json"); 
        
        const requestOptions = {
            method: 'GET',
            headers: myHeaders,
            redirect: 'follow'
        };
        let bjapi_dates_url = bjapi_url + "dates";
        const response = await fetch(bjapi_dates_url, requestOptions);
//        console.log("Response status:", response.status);
    
        if (!response.ok) {
            throw new Error(`Failed to fetch dates: ${response.status}`);
        }
        
        const dateData = await response.json();
//        console.log("Dates fetched successfully:", dateData);
        const excludeDates = [];
        const gameDays = [];
        const bookings = [];

        const keyDates = {
            closeDate: dateData.dates.find(d => d.datename === 'Close')?.date || null,
            openDate: dateData.dates.find(d => d.datename === 'Open')?.date || null,
            fedExDate: dateData.dates.find(d => d.datename === 'fedEx')?.date || null
        };
//        console.log("Key dates:", keyDates);

        dateData.dates.forEach(entry => {
//            console.log('Processing entry:', entry);
            if (entry.datename === 'Exclude') {
                if (entry.date1) excludeDates.push(entry.date1);
                if (entry.date2) excludeDates.push(entry.date2);
                if (entry.date3) excludeDates.push(entry.date3);
            }
            if (entry.datename === 'GameDay') {
                if (entry.GameDay1) gameDays.push(entry.GameDay1);
                if (entry.GameDay2) gameDays.push(entry.GameDay2);
            }
            if (entry.datename === 'Bookings') {
                if (entry.apr) bookings.push(entry.apr);
                if (entry.may) bookings.push(entry.may);
                if (entry.jun) bookings.push(entry.jun);
                if (entry.jul) bookings.push(entry.jul);
                if (entry.aug) bookings.push(entry.aug);
                if (entry.sep) bookings.push(entry.sep);
                if (entry.oct) bookings.push(entry.oct);
                if (entry.nov) bookings.push(entry.nov);
          }
        });

//        console.log('Raw date data:', dateData);
    //    console.log('Exclude dates array:', excludeDates);
        return { keyDates, excludeDates, gameDays, bookings};
 
    } catch (error) {
      console.error('Error fetching players:', error);
      hideLoader();
    }
  }

// Helper Functions 
export function showLoader() {
//    console.log("showLoader function in commonscripts.js starting...");
    document.getElementById('loading').style.display = 'block';
}

export function hideLoader() {
    const loader = document.getElementById('loading');
    if (loader) {
        loader.style.display = 'none';
    }
}