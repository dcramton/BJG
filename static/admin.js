// Begin admin.js
console.log("start admin.js");
// Show login form when page loads
document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
        // Store tokens
        localStorage.setItem('authenticated', 'true');
        document.getElementById('loginForm').classList.add('hidden');
        document.getElementById('playerManagement').classList.remove('hidden');

        showadmin();
    }
    function showadmin() {
        // Enable all buttons in the admin.html file
        const buttons = document.querySelectorAll('button');
        buttons.forEach(button => {
            button.disabled = false;
        });

        // Show the admin content
        document.getElementById('content').style.display = 'block';
    }
});

// Function to load existing game days when page loads
async function loadGameDays() {
    try {
        const response = await fetch('/static/dates.json');
        const data = await response.json();
        console.log(response);
        
        if (data.dates && data.dates.gamedays) {
            const selectElement = document.getElementById('gameDays');
            data.dates.gamedays.forEach(day => {
                selectElement.options[day].selected = true;
            });
        }
    } catch (error) {
        console.error('Error loading game days:', error);
    }
}

async function addPlayer() {
    console.log("addPlayer function called");
    const accessToken = localStorage.getItem('accessToken');
    
    if (!accessToken) {
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

async function addGameDate(dateType) {
    console.log("addGameDate function called");
    const accessToken = localStorage.getItem('accessToken');
    
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
            return 'Exempt Date';
        case 'Game Days':
            return 'Game Days';    
        default:
            return 'Game Day';
    }
}

async function updateGameDays() {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
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
                alert(`Day ${dayName} added successfully!`);
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
