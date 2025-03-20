// Begin admin.js
// console.log("start admin.js");
// console.log("version 0304f");

document.addEventListener('DOMContentLoaded', async function() {
    // Set up dynamic sign-in URL
    const signInLink = document.querySelector('#auth a'); // Select the sign-in link inside the auth div
    if (signInLink) {
        const redirectUri = window.location.hostname === 'localhost' 
            ? `http://${window.location.host}/templates/admin.html`
            : 'https://cramton.ca/templates/admin.html';
            
        signInLink.href = `https://us-east-1ahoz6qpqh.auth.us-east-1.amazoncognito.com/login?client_id=7iafa06ln6h47pv38r164jrldl&response_type=code&scope=email+openid+phone&redirect_uri=${encodeURIComponent(redirectUri)}`;
        console.log("Actual redirect URI being used:", redirectUri);

        console.log("Sign-in link set to:", signInLink.href);
    }
    
    // Check for authentication code in URL (Cognito redirect)
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    // If code exists, process it
    if (code) {
        try {
            // Exchange code for tokens with Cognito
            const response = await exchangeCodeForToken(code);
            
            // Store tokens
            localStorage.setItem('idToken', response.id_token);
            localStorage.setItem('authenticated', 'true');
            
            // Show admin content
            showAdminInterface();
        } catch (error) {
            console.error("Authentication error:", error);
            showAuthForm();
        }
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
    const adminContent = document.getElementById('adminContent');
    adminContent.style.display = 'block';
    
    const adminChildren = adminContent.children;
    for (let i = 0; i < adminChildren.length; i++) {
        adminChildren[i].classList.remove('hidden');
    }
    
//    console.log("Admin interface displayed, content children count:", adminChildren.length);
    


    loadGameDates();
}

// Function to exchange code for token with Cognito
async function exchangeCodeForToken(code) {
    try {
        console.log("Attempting to exchange code for token...");
        
        // Use the same redirect URI logic as in the sign-in link
        const redirectUri = window.location.hostname === 'localhost' 
            ? `http://${window.location.host}/templates/admin.html`
            : 'https://cramton.ca/templates/admin.html';
            
        console.log("Using redirect URI for token exchange:", redirectUri);

        // Create base64 encoded client credentials
        const clientCredentials = btoa(`7iafa06ln6h47pv38r164jrldl:1jip94i19uf34q5c993cgf2mfrqi6nujavojeomojvd5808ng0s6`);
        
        const response = await fetch('https://us-east-1ahoz6qpqh.auth.us-east-1.amazoncognito.com/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${clientCredentials}`
            },
            body: new URLSearchParams({
                'grant_type': 'authorization_code',
                'client_id': '7iafa06ln6h47pv38r164jrldl',
                'code': code,
                'redirect_uri': redirectUri
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error("Token exchange error response:", errorText);
            throw new Error(`Token exchange failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Token exchange successful");
        return data;
    } catch (error) {
        console.error('Error exchanging code for token:', error);
        throw error;
    }
}

// Update logout function
function logout() {
    localStorage.removeItem('idToken');
    localStorage.removeItem('authenticated');
    showAuthForm();
}

// Rest of your admin.js file...


// Function to load existing game days when page loads
async function loadGameDates() {
//    console.log("loadGameDates function called");
    const idToken = localStorage.getItem('idToken');

    if (!idToken) {
        console.error('No access token found');
        return;
    }

//    console.log("Access token found");

    try {
        const response = await fetch('https://yo6lbyfxd1.execute-api.us-east-1.amazonaws.com/prod/dates', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`
            },
        });

        const datesEntered = await response.json();
        console.log("Dates currently in database:", datesEntered);

        // Check if datesEntered has the expected structure
        if (!datesEntered || !datesEntered.dates || !Array.isArray(datesEntered.dates)) {
            console.error('Unexpected data format:', datesEntered);
            return;
        }

        // Load Open Date default date
        const datenameOpen = 'Open'; 
        const gameOpen = datesEntered.dates.find(dates => dates.datename === datenameOpen);
//        console.log("Game Open date:", gameOpen);

        if (gameOpen) {
//            console.log(`Game Open for ${datenameOpen}:`, gameOpen);
//            console.log("Game Open date:", gameOpen.date);
            const openDateInput = document.querySelector('#gameOpen input[type="date"]');
            if (openDateInput) {
                openDateInput.value = gameOpen.date; 
            }
        } else {
            console.log(`No game Open found for ${datenameOpen}`);
        }

        // Load Close Date default date
        const datenameClose = 'Close'; 
        const gameClose = datesEntered.dates.find(dates => dates.datename === datenameClose);
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
        const gameFedEx = datesEntered.dates.find(dates => dates.datename === datenameFedEx);
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
        const gameExclude = datesEntered.dates.find(dates => dates.datename === datenameExclude);
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


async function loadPlayers() {
    const fileInput = document.getElementById('playerFile');
    const file = fileInput.files[0];
    const token = localStorage.getItem('idToken');
    
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
            const data = JSON.parse(event.target.result);
            // Check if the data has the expected structure
            if (!data || !data.members || !Array.isArray(data.members)) {
                throw new Error('Invalid file format: Expected a members array');
            }

            console.log("Loaded data:", data);

            const idToken = localStorage.getItem('idToken');
            if (!idToken) {
                alert('Please login first');
                return;
            }

            // Process each member in the members array
            for (const member of data.members) {
                const memberData = {
                    id: member.id,
                    firstName: member.firstName,
                    lastName: member.lastName,
                    nickname: member.nickname,
                    legacy: member.legacy
                };
                console.log("Sending member data:", memberData);

                try {
                    const response = await fetch('https://yo6lbyfxd1.execute-api.us-east-1.amazonaws.com/prod/addnewplayer', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${idToken}`
                        },
                        body: JSON.stringify(memberData)
                    });

                    // Log the raw response for debugging
                    const responseText = await response.text();
                    console.log(`Response for ${member.firstName} ${member.lastName}:`, {
                        status: response.status,
                        statusText: response.statusText,
                        responseText: responseText
                    });

                    // Try to parse the response as JSON
                    let responseData;
                    try {
                        responseData = JSON.parse(responseText);
                    } catch (e) {
                        console.log("Response is not JSON:", responseText);
                        // If response is not JSON but status is OK, consider it a success
                        if (response.ok) {
                            console.log(`Player ${member.firstName} ${member.lastName} added successfully`);
                            continue;
                        } else {
                            throw new Error(`Invalid response format: ${responseText}`);
                        }
                    }

                    // Check response status
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}, message: ${responseData?.message || responseText}`);
                    }

                    // If we got here, consider it a success
                    console.log(`Player ${member.firstName} ${member.lastName} added successfully`);

                } catch (error) {
                    console.error(`Error adding player ${member.firstName} ${member.lastName}:`, error);
                    throw error;
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
    const token = localStorage.getItem('idToken');
    
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
                'Authorization': `Bearer ${token}`
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
    const token = localStorage.getItem('idToken');
    
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
                    'Authorization': `Bearer ${token}`
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
    const token = localStorage.getItem('idToken');
    
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
                    'Authorization': `Bearer ${idToken}`
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

async function createNewGameTable() {
    const currentYear = new Date().getFullYear();
    const tableNameGames = `BJG_Games_${currentYear}`;
    
    // Get the ID token from localStorage
    const idToken = localStorage.getItem('idToken');
    
    // Parse the token to get the payload
    const payload = JSON.parse(atob(idToken.split('.')[1]));
    const issuer = payload.iss;
    
    // Extract the User Pool ID from the issuer
    const userPoolId = issuer.split('/').pop();
    const region = 'us-east-1';
    
    // Set up the provider name
    const providerName = `cognito-idp.${region}.amazonaws.com/${userPoolId}`;
    
    // Set up the logins object
    const logins = {};
    logins[providerName] = idToken;
    
    // Configure AWS SDK
    AWS.config.region = region;
    AWS.config.credentials = new AWS.CognitoIdentityCredentials({
        IdentityPoolId: 'us-east-1:fdb064dd-9a8f-42bc-b7e3-0a50d88633b1',
        Logins: logins
    });
    
    return new Promise((resolve, reject) => {
        AWS.config.credentials.get(function(err) {
            if (err) {
                console.log('Error getting credentials:', err);
                reject(err);
                return;
            } 

            console.log('Successfully logged in!');
            const dynamodb = new AWS.DynamoDB();

            // First, list all tables and check for exact case match
            dynamodb.listTables({}, function(err, data) {
                if (err) {
                    console.log('Error listing tables:', err);
                    reject(err);
                    return;
                }

                // Check for exact case match
                const tableExists = data.TableNames.some(name => name === tableNameGames);
                
                if (tableExists) {
                    console.log(`Table ${tableNameGames} already exists (exact match)`);
                    resolve({ TableDescription: { TableName: tableNameGames, TableStatus: 'ACTIVE' } });
                } else {
                    // Table doesn't exist with exact case, create it
                    console.log(`Table ${tableNameGames} does not exist with exact case, creating...`);
                    
                    const createParams = {
                        TableName: tableNameGames,
                        AttributeDefinitions: [
                            {
                                AttributeName: "uuid",
                                AttributeType: "S"
                            }
                        ],
                        KeySchema: [
                            {
                                AttributeName: "uuid",
                                KeyType: "HASH"
                            }
                        ],
                        BillingMode: "PAY_PER_REQUEST"
                    };

                    dynamodb.createTable(createParams, function(createErr, createData) {
                        if (createErr) {
                            console.log('Error creating table:', createErr);
                            reject(createErr);
                        } else {
                            console.log(`Table ${tableNameGames} created successfully:`, createData);
                            resolve(createData);
                        }
                    });
                }
            });
        });
    });
}

async function createNewDatesTable() {
    const currentYear = new Date().getFullYear();
    const tableNameDates = `BJG_Dates_${currentYear}`;
    
    // Get the ID token from localStorage
    const idToken = localStorage.getItem('idToken');
    
    // Parse the token to get the payload
    const payload = JSON.parse(atob(idToken.split('.')[1]));
    const issuer = payload.iss;
    
    // Extract the User Pool ID from the issuer
    const userPoolId = issuer.split('/').pop();
    const region = 'us-east-1';
    
    // Set up the provider name
    const providerName = `cognito-idp.${region}.amazonaws.com/${userPoolId}`;
    
    // Set up the logins object
    const logins = {};
    logins[providerName] = idToken;
    
    // Configure AWS SDK
    AWS.config.region = region;
    AWS.config.credentials = new AWS.CognitoIdentityCredentials({
        IdentityPoolId: 'us-east-1:fdb064dd-9a8f-42bc-b7e3-0a50d88633b1',
        Logins: logins
    });
    
    return new Promise((resolve, reject) => {
        AWS.config.credentials.get(function(err) {
            if (err) {
                console.log('Error getting credentials:', err);
                reject(err);
                return;
            } 

            console.log('Successfully logged in!');
            const dynamodb = new AWS.DynamoDB();

            // First, list all tables and check for exact case match
            dynamodb.listTables({}, function(err, data) {
                if (err) {
                    console.log('Error listing tables:', err);
                    reject(err);
                    return;
                }

                // Check for exact case match
                const tableExists = data.TableNames.some(name => name === tableNameDates);
                
                if (tableExists) {
                    console.log(`Table ${tableNameDates} already exists (exact match)`);
                    resolve({ TableDescription: { TableName: tableNameDates, TableStatus: 'ACTIVE' } });
                } else {
                    // Table doesn't exist with exact case, create it
                    console.log(`Table ${tableNameDates} does not exist with exact case, creating...`);
                 
                        const createParams = {
                            TableName: tableNameDates,
                            AttributeDefinitions: [
                                {
                                    AttributeName: "datename",
                                    AttributeType: "S"
                                }
                            ],
                            KeySchema: [
                                {
                                    AttributeName: "datename",
                                    KeyType: "HASH"
                                }
                            ],
                            BillingMode: "PAY_PER_REQUEST"
                        };

                        dynamodb.createTable(createParams, function(createErr, createData) {
                            if (createErr) {
                                console.log('Error creating table:', createErr);
                                reject(createErr);
                            } else {
                                console.log(`Table ${tableNameDates} created successfully:`, createData);
                                resolve(createData);
                            }
                        });
                    }
                });
            });
        });
    }

async function createNewAvailTable() {
    const currentYear = new Date().getFullYear();
    const tableNameAvail = `BJG_Avail_${currentYear}`;
    
    // Get the ID token from localStorage
    const idToken = localStorage.getItem('idToken');
    
    // Parse the token to get the payload
    const payload = JSON.parse(atob(idToken.split('.')[1]));
    const issuer = payload.iss;
    
    // Extract the User Pool ID from the issuer
    const userPoolId = issuer.split('/').pop();
    const region = 'us-east-1';
    
    // Set up the provider name
    const providerName = `cognito-idp.${region}.amazonaws.com/${userPoolId}`;
    
    // Set up the logins object
    const logins = {};
    logins[providerName] = idToken;
    
    // Configure AWS SDK
    AWS.config.region = region;
    AWS.config.credentials = new AWS.CognitoIdentityCredentials({
        IdentityPoolId: 'us-east-1:fdb064dd-9a8f-42bc-b7e3-0a50d88633b1',
        Logins: logins
    });
    
    return new Promise((resolve, reject) => {
        AWS.config.credentials.get(function(err) {
            if (err) {
                console.log('Error getting credentials:', err);
                reject(err);
                return;
            } 

            console.log('Successfully logged in!');
            const dynamodb = new AWS.DynamoDB();

            // First, list all tables and check for exact case match
            dynamodb.listTables({}, function(err, data) {
                if (err) {
                    console.log('Error listing tables:', err);
                    reject(err);
                    return;
                }

                // Check for exact case match
                const tableExists = data.TableNames.some(name => name === tableNameAvail);
                
                if (tableExists) {
                    console.log(`Table ${tableNameAvail} already exists (exact match)`);
                    resolve({ TableDescription: { TableName: tableNameAvail, TableStatus: 'ACTIVE' } });
                } else {
                    // Table doesn't exist with exact case, create it
                    console.log(`Table ${tableNameAvail} does not exist with exact case, creating...`);
                    
                    const createParams = {
                        TableName: tableNameAvail,
                        AttributeDefinitions: [
                            {
                                AttributeName: "nickname",
                                AttributeType: "S"
                            }
                        ],
                        KeySchema: [
                            {
                                AttributeName: "nickname",
                                KeyType: "HASH"
                            }
                        ],
                        BillingMode: "PAY_PER_REQUEST"
                    };

                    dynamodb.createTable(createParams, function(createErr, createData) {
                        if (createErr) {
                            console.log('Error creating table:', createErr);
                            reject(createErr);
                        } else {
                            console.log(`Table ${tableNameAvail} created successfully:`, createData);
                            resolve(createData);
                        }
                    });
                }
            });
        });
    });
}

async function submitData() {
    console.log("submitData function called");
    const idToken = localStorage.getItem('idToken');
    if (!idToken) {
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
                'Authorization': `Bearer ${idToken}`
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

// Get the current year from the existing code
const currentYear = new Date().getFullYear();

// Modal elements
const playerModal = document.getElementById('playerModal');
const editPlayerModal = document.getElementById('editPlayerModal');
const playerList = document.querySelector('.player-list');
const closeBtns = document.querySelectorAll('.close');

// Add a button to your page to open the player management modal
const managePlayersBtn = document.createElement('button');
managePlayersBtn.textContent = 'Manage Players';
managePlayersBtn.onclick = showPlayerManagementModal;
document.querySelector('#adminContent').appendChild(managePlayersBtn);

// Close modal when clicking (x) or outside
closeBtns.forEach(btn => {
    btn.onclick = function() {
        playerModal.style.display = 'none';
        editPlayerModal.style.display = 'none';
    }
});

window.onclick = function(event) {
    if (event.target === playerModal || event.target === editPlayerModal) {
        playerModal.style.display = 'none';
        editPlayerModal.style.display = 'none';
    }
}

async function showPlayerManagementModal() {
    try {
        const response = await fetch('/api/players');
        const players = await response.json();
        
        playerList.innerHTML = ''; // Clear existing list
        
        players.forEach(player => {
            const playerItem = document.createElement('div');
            playerItem.className = 'player-item';
            playerItem.innerHTML = `
                <span>${player.name} (${player.email})</span>
                <div class="player-actions">
                    <button class="edit-btn" onclick="editPlayer(${player.id})">Edit</button>
                    <button class="delete-btn" onclick="deletePlayer(${player.id})">Delete</button>
                </div>
            `;
            playerList.appendChild(playerItem);
        });
        
        playerModal.style.display = 'block';
    } catch (error) {
        console.error('Error loading players:', error);
        alert('Error loading players. Please try again.');
    }
}

async function editPlayer(playerId) {
    try {
        const response = await fetch(`/api/players/${playerId}`);
        const player = await response.json();
        
        document.getElementById('editPlayerId').value = player.id;
        document.getElementById('editPlayerName').value = player.name;
        document.getElementById('editPlayerEmail').value = player.email;
        
        playerModal.style.display = 'none';
        editPlayerModal.style.display = 'block';
    } catch (error) {
        console.error('Error loading player details:', error);
        alert('Error loading player details. Please try again.');
    }
}

document.getElementById('editPlayerForm').onsubmit = async function(e) {
    e.preventDefault();
    
    const playerId = document.getElementById('editPlayerId').value;
    const playerData = {
        name: document.getElementById('editPlayerName').value,
        email: document.getElementById('editPlayerEmail').value
    };
    
    try {
        const response = await fetch(`/api/players/${playerId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(playerData)
        });
        
        if (response.ok) {
            editPlayerModal.style.display = 'none';
            showPlayerManagementModal(); // Refresh the player list
        } else {
            throw new Error('Failed to update player');
        }
    } catch (error) {
        console.error('Error updating player:', error);
        alert('Error updating player. Please try again.');
    }
};

async function deletePlayer(playerId) {
    if (!confirm('Are you sure you want to delete this player?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/players/${playerId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showPlayerManagementModal(); // Refresh the player list
        } else {
            throw new Error('Failed to delete player');
        }
    } catch (error) {
        console.error('Error deleting player:', error);
        alert('Error deleting player. Please try again.');
    }
}

