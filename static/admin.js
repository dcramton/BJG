// Begin admin.js
// console.log("start admin.js");
// console.log("version 0304f");

// Show login form when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Check for authentication code in URL (Cognito redirect)
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    // If code exists, process it
    if (code) {
        // Exchange code for tokens with Cognito
        exchangeCodeForToken(code)
            .then(response => {
                // Store tokens
                localStorage.setItem('accessToken', response.access_token);
                localStorage.setItem('idToken', response.id_token);
                localStorage.setItem('authenticated', 'true');
                
                // Show admin content
                showAdminInterface();
            })
            .catch(error => {
                console.error("Authentication error:", error);
                showAuthForm();
            });
    } else {
        // Check if already authenticated
        const isAuthenticated = localStorage.getItem('authenticated') === 'true';
        if (isAuthenticated) {
            showAdminInterface();
        } else {
            showAuthForm();
        }
    }
});

// Function to show authentication form
function showAuthForm() {
    document.getElementById('auth').style.display = 'block';
    document.getElementById('adminContent').style.display = 'none';
}

// Function to show admin interface
function showAdminInterface() {
    document.getElementById('auth').style.display = 'none';
    document.getElementById('adminContent').style.display = 'block';
    document.getElementById('playerManagement').classList.remove('hidden');
    document.getElementById('keyDateEntry').classList.remove('hidden');

    loadGameDates();
}

// Function to exchange code for token with Cognito
function exchangeCodeForToken(code) {
    // This needs to be implemented based on your Cognito setup
    // You'll need to make a POST request to the Cognito token endpoint
    
    // Example implementation (you'll need to adjust this for your specific Cognito setup)
    return fetch('https://us-east-1ahoz6qpqh.auth.us-east-1.amazoncognito.com/oauth2/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            'grant_type': 'authorization_code',
            'client_id': '7iafa06ln6h47pv38r164jrldl',
            'code': code,
            'redirect_uri': 'https://cramton.ca/templates/admin.html'
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Token exchange failed');
        }
        return response.json();
    });
}

// Update logout function
function logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('idToken');
    localStorage.removeItem('authenticated');
    showAuthForm();
}

// Function to load existing game days when page loads
async function loadGameDates() {
    console.log("loadGameDates function called");
    const accessToken = localStorage.getItem('accessToken');

    if (!accessToken) {
        console.error('No access token found');
        return;
    }

    console.log("Access token found");

    try {
        const response = await fetch('https://yo6lbyfxd1.execute-api.us-east-1.amazonaws.com/prod/dates', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
        });

        const datesEntered = await response.json();
//        console.log("Dates currently in database:", datesEntered);
//        console.log("games:", datesEntered.games);

// Load Close Date default date
        const datenameOpen = 'Open'; 
        const gameOpen = datesEntered.games.find(game => game.datename === datenameOpen);

        if (gameOpen) {
//            console.log(`Game Open for ${datenameOpen}:`, gameOpen);
//            console.log("Game Open date:", gameOpen.date);
            const openDateInput = document.querySelector('#gameOpen input[type="date"]');
            openDateInput.value = gameOpen.date; // Assuming the date is stored in the 'date' field
        } else {
            console.log(`No game Open found for ${datenameOpen}`);
        }

// Load Close Date default date
        const datenameClose = 'Close'; 
        const gameClose = datesEntered.games.find(game => game.datename === datenameClose);
        if (gameClose) {
//            console.log(`Game Close for ${datenameClose}:`, gameClose);
//            console.log("Game Close date:", gameClose.date);
            const closeDateInput = document.querySelector('#gameClose input[type="date"]');
            closeDateInput.value = gameClose.date; // Assuming the date is stored in the 'date' field
        } else {
            console.log(`No game Close found for ${datenameClose}`);
        }

// Load FedEx Start Date default date
        const datenameFedEx = 'FedEx'; 
        const gameFedEx = datesEntered.games.find(game => game.datename === datenameFedEx);
        if (gameFedEx) {
//            console.log(`Game FedEx for ${datenameFedEx}:`, gameFedEx);
//            console.log("FedEx start date:", gameFedEx.date);
            const fedexDateInput = document.querySelector('#gameFedEx input[type="date"]');
            fedexDateInput.value = gameFedEx.date; // Assuming the date is stored in the 'date' field
        } else {
            console.log(`No game FedEx found for ${datenameFedEx}`);
        }

// Load Exluded Dates
        const datenameExclude = 'Exclude'; 
        const gameExclude = datesEntered.games.find(game => game.datename === datenameExclude);
        if (gameExclude) {
//            console.log(`Exclude Date ${datenameExclude}:`, gameExclude);
        //    console.log("FedEx start date:", gameFedEx.date);
            const excludeDateInput = document.querySelector('#gameExclude input[type="date"]');
            excludeDateInput.value = gameExclude.date; // Assuming the date is stored in the 'date' field
        } else {
            console.log(`No Exclude date found for ${datenameExclude}`);
        }
// Load Game Days

    } catch (error) {
        console.error('Error loading game days:', error);
    }
}

async function addPlayer() {
    console.log("addPlayer function called");
    const token = localStorage.getItem('accessToken');
    
    if (!token) {
        console.error('No access token found');
        alert('Please login first');
        return;
    }

    // First, fetch the current players to count them
    try {
        const countResponse = await fetch('/static/players.json', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
        if (!countResponse.ok) {
            throw new Error(`Failed to fetch players: ${countResponse.statusText}`);
        }

        const existingPlayers = await countResponse.json();
        // Access the members array and get its length
        const playerCount = existingPlayers.members.length;
        const newPlayerNumber = playerCount + 1;
        console.log(playerCount, newPlayerNumber);
    
        const playerData = {
            id: `player${newPlayerNumber}`,
            firstName: document.getElementById('firstName').value,
            lastName: document.getElementById('lastName').value,
            nickname: document.getElementById('nickName').value
        };
        console.log("Player data object:", playerData);
    
        const response = await fetch('https://yo6lbyfxd1.execute-api.us-east-1.amazonaws.com/prod/addnewplayer', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify(playerData)
        });

        // Add response debugging
        console.log("Response status:", response.status);
        const responseText = await response.text(); // Get raw response text
        console.log("Raw response:", responseText);

        // Parse the response text as JSON
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            console.error("Response was not JSON:", e);
            throw new Error(`Unexpected response format: ${responseText}`);
        }

        if (!response.ok) {
            console.error("Server error response:", responseText);
            throw new Error(`HTTP error! status: ${response.status}, message: ${data.message || responseText}`);
        }

        if (data.status === 'success') {
            document.getElementById('firstName').value = '';
            document.getElementById('lastName').value = '';
            document.getElementById('nickName').value = '';
            alert('Player added successfully');
        } else {
            throw new Error(data.message || 'Unknown error');
        }
    } catch (error) {
    //    console.error('Error:', error);
    //    alert('Failed to add player: ' + error.message);
    }
}

async function loadPlayers() {
    const fileInput = document.getElementById('playerFile');
    const file = fileInput.files[0];
    
    if (!token) {
        console.error('No access token found');
        alert('Please login first');
        return;
    }

    if (!file) {
        alert('Please select a file');
        return;
    }

    const reader = new FileReader();
    reader.onload = async function(event) {
        try {
            const players = JSON.parse(event.target.result);
            console.log("Loaded players:", players);

            const accessToken = localStorage.getItem('accessToken');
            if (!accessToken) {
                alert('Please login first');
                return;
            }

            for (const player of players) {
                const playerData = {
                    id: `player${player.id}`,
                    firstName: player.firstName,
                    lastName: player.lastName,
                    nickname: player.nickname
                };
                console.log("Player data object:", playerData);

                const response = await fetch('https://yo6lbyfxd1.execute-api.us-east-1.amazonaws.com/prod/addnewplayer', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${accessToken}`
                    },
                    body: JSON.stringify(playerData)
                });

                const responseText = await response.text(); // Get raw response text
                console.log("Raw response:", responseText);

                let data;
                try {
                    data = JSON.parse(responseText);
                } catch (e) {
                    console.error("Response was not JSON:", e);
                    throw new Error(`Unexpected response format: ${responseText}`);
                }

                if (!response.ok) {
                    console.error("Server error response:", responseText);
                    throw new Error(`HTTP error! status: ${response.status}, message: ${data.message || responseText}`);
                }

                if (data.status === 'success') {
                    console.log(`Player ${player.firstName} ${player.lastName} added successfully`);
                } else {
                    throw new Error(data.message || 'Unknown error');
                }
            }

            alert('All players added successfully');
        } catch (error) {
            console.error('Error loading players:', error);
            alert('Failed to load players: ' + error.message);
        }
    };

    reader.readAsText(file);
}

async function addGameDate(dateType) {
    console.log("addGameDate function called");
    const token = localStorage.getItem('accessToken');
    
    if (!token) {
        console.error('No access token found');
        alert('Please login first');
        return;
    }
    
    // Get the input element based on dateType
    const dateInput = document.querySelector(`#game${dateType} input[type="date"]`);
    if (!dateInput || !dateInput.value) {
        alert('Please select a date');
        return;
    }
    console.log("Date input:", dateInput.value, dateType);

    const dateData = {
        date: dateInput.value,
        type: dateType,
        description: getDateTypeDescription(dateType)
    };

    console.log("Date data:", dateData);

    try {
        const response = await fetch('https://yo6lbyfxd1.execute-api.us-east-1.amazonaws.com/prod/dates', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify(dateData)
        });

        const responseText = await response.text(); // Get raw response text
        console.log("Raw response:", responseText);

        const data = JSON.parse(responseText);
        console.log(dateData.description, dateData.date, dateData.type, " date added successfully!");
        
        if (response.ok) {
            alert(`${dateData.description} date added successfully!`);
            dateInput.value = ''; // Clear the input
        } else {
            alert(`Error: ${data.message}`);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error submitting date data. Please try again.');
    }
}

// Helper function to get description based on date type
function getDateTypeDescription(dateType) {
    switch(dateType) {
        case 'Open':
            return 'Opening Day';
        case 'Close':
            return 'Closing Day';
        case 'FedEx':
            return 'FedEx Season Start';
        case 'Exclude':
            return 'Excluded Date';
        case 'Game Days':
            return 'Game Days';    
        default:
            return 'Game Day';
    }
}

async function addExcludeDay(dateType) {
    const token = localStorage.getItem('accessToken');
    
    if (!token) {
        console.error('No access token found');
        alert('Please login first');
        return;
    }

    const dateInput = document.querySelector(`#game${dateType} input[type="date"]`);
    if (!dateInput || !dateInput.value) {
        alert('Please select a date');
        return;
    }

    console.log("Exclude Date input:", dateInput.value, dateType);

    const excludedateData = {
        date: dateInput.value,
        type: dateType,
        description: getDateTypeDescription(dateType)
    };

    console.log("Date data:", excludedateData);

        try {
            const response = await fetch('https://yo6lbyfxd1.execute-api.us-east-1.amazonaws.com/prod/dates', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify(excludedateData)
            });

            const responseText = await response.text(); // Get raw response text
            console.log("Raw response:", responseText);

            const data = JSON.parse(responseText);
            console.log(excludedateData.description, excludedateData.date, excludedateData.type, " date added successfully!");
        

            if (response.ok) {
                alert(`${excludedateData.description} date added successfully!`);
                dateInput.value = ''; // Clear the input
            } else {
                alert(`Error: ${data.message}`);
            }

        } catch (error) {
            console.error('Error:', error);
            alert('Error submitting Exclude Day data. Please try again.');
        }
}

async function updateGameDays() {
    const token = localStorage.getItem('accessToken');
    
    if (!token) {
        console.error('No access token found');
        alert('Please login first');
        return;
    }

    // Get selected days
    const selectElement = document.getElementById('gameDays');
    const selectedDays = Array.from(selectElement.selectedOptions).map(option => parseInt(option.value));

    if (selectedDays.length === 0) {
        alert('Please select at least one game day');
        return;
    }

    console.log("Selected Days are:", selectedDays);

    // Array to map day numbers to day names
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // Iterate over each selected day and send it to the Lambda function
    selectedDays.forEach(async (day, index) => {
        const dayName = dayNames[day];
        const dayData = {
            date: dayName,
            type: `gameDay${index + 1}` // Append a counter value to make each input distinct
        };
        console.log("Day data:", dayData);

        try {
            const response = await fetch('https://yo6lbyfxd1.execute-api.us-east-1.amazonaws.com/prod/dates', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify(dayData)
            });

            const responseText = await response.text(); // Get raw response text
            console.log("Raw response:", responseText);

            const data = JSON.parse(responseText);
            console.log(dayName, " day added successfully!");

            if (response.ok) {
                alert(`BJG Game Day ${dayName} added successfully!`);
            } else {
                alert(`Error: ${data.message}`);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error submitting day data. Please try again.');
        }
    });
}

async function submitData() {
    console.log("submitData function called");
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
        alert('Please login first');
        return;
    }

    const players = Array.from(document.querySelectorAll('#playerList input'))
        .map(input => input.value)
        .filter(value => value.trim() !== '');

    const gameOpen = Array.from(document.querySelectorAll('#gameOpen input'))
        .map(input => input.value)
        .filter(value => value !== '');

    const gameClose = Array.from(document.querySelectorAll('#gameClose input'))
    .map(input => input.value)
    .filter(value => value !== '');

    const gameExclude = Array.from(document.querySelectorAll('#gameExclude input'))
    .map(input => input.value)
    .filter(value => value !== '');

    const gameFedEx = Array.from(document.querySelectorAll('#gameFedEx input'))
    .map(input => input.value)
    .filter(value => value !== '');

    const gameDays = Array.from(document.querySelectorAll('#gameDays input'))
    .map(input => input.value)
    .filter(value => value !== '');

    const scheduleData = {
        players: players,
        gameOpen: gameOpen,
        gameClose: gameClose,
        gameExclude: gameExclude,
        gameFedEx: FedEx,
        gameDays:gameDays
    };

    try {
        const response = await fetch('https://yo6lbyfxd1.execute-api.us-east-1.amazonaws.com/prod/dates', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify(scheduleData)
        });

        console.log(scheduleData);
        
        if (response.ok) {
            alert('Schedule saved successfully');
        } else {
            const error = await response.json();
            alert(`Failed to save schedule: ${error.message}`);
        }
    } catch (error) {
        console.error('Save error:', error);
        alert('Failed to save schedule');
    }
}
