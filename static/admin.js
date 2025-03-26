// Begin admin.js
import { getPlayers, getGames, showLoader, hideLoader } from "./commonscripts.js";
const bjapi_url = "https://yo6lbyfxd1.execute-api.us-east-1.amazonaws.com/prod/";
const cognitoDomain = 'https://us-east-1ahoz6qpqh.auth.us-east-1.amazoncognito.com';
const clientId = '7iafa06ln6h47pv38r164jrldl';
const redirectUri = window.location.hostname === 'localhost' 
    ? `http://${window.location.host}/templates/admin.html`
    : 'https://cramton.ca/templates/admin.html';

// Function to get Cognito sign-in URL

document.addEventListener('DOMContentLoaded', async function() {
    console.log("Page loaded, checking authentication...");
    showLoader();

    try {
        // Check if we have a code from Cognito redirect
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');

        if (code) {
            // Exchange code for token
            const tokens = await exchangeCodeForToken(code);
            localStorage.setItem('idToken', tokens.id_token);
            
            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);
            
            showAdminInterface();
        } else if (!localStorage.getItem('idToken')) {
            // No token, redirect to login
            window.location.href = getSignInUrl();
        } else {
            // Have token, show admin interface
            showAdminInterface();
        }
    } catch (error) {
        console.error("Authentication error:", error);
        localStorage.removeItem('idToken');
        window.location.href = getSignInUrl();
    } finally {
        hideLoader();
    }
});
const getSignInUrl = () => {
    return `${cognitoDomain}/oauth2/authorize?` + 
        `client_id=${clientId}&` +
        `response_type=code&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}`;
};
async function exchangeCodeForToken(code) {
    console.log('Exchanging code for token:', code);
    if (!code) {
        throw new Error('No authorization code provided');
    }

    try {
        const clientCredentials = btoa(`${clientId}:1jip94i19uf34q5c993cgf2mfrqi6nujavojeomojvd5808ng0s6`);
        
        const bodyParams = new URLSearchParams({
            'grant_type': 'authorization_code',
            'client_id': clientId,
            'code': code,
            'redirect_uri': redirectUri
        });

        console.log('Token exchange request details:', {
            url: `${cognitoDomain}/oauth2/token`,
            redirectUri: redirectUri,
            code: code.substring(0, 10) + '...',
            bodyParams: bodyParams.toString()
        });

        const response = await fetch(`${cognitoDomain}/oauth2/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${clientCredentials}`
            },
            body: bodyParams
        });
        
        const responseText = await response.text();
        console.log('Token exchange response:', {
            status: response.status,
            statusText: response.statusText,
            body: responseText
        });

        if (!response.ok) {
            throw new Error(`Token exchange failed: ${response.status} ${response.statusText} - ${responseText}`);
        }

        const data = JSON.parse(responseText);
        console.log('Token exchange response data:', data);
        
        if (!data.id_token) {
            throw new Error('No ID token received in response');
        }

        return data;

    } catch (error) {
        console.error('Error exchanging code for token:', error);
        throw error;
    }
}
//Authorization section
// Function to show authentication form
function showAuthForm() {
    document.getElementById('auth').style.display = 'block';
    document.getElementById('adminContent').style.display = 'none';
}
// Update logout function
window.logout = function() {
    localStorage.removeItem('idToken');
    window.location.href = '/templates/admin.html';
}
// Function to show admin interface
function showAdminInterface() {
    // Hide auth element, show admin content
    document.getElementById('auth').style.display = 'none';
    document.getElementById('adminContent').style.display = 'block';
    
    // Add event listeners to the buttons
    document.getElementById('managePlayersBtn').addEventListener('click', managePlayersButtonForm);
    document.getElementById('addPlayerBtn').addEventListener('click', addPlayerForm);
    document.getElementById('loadPlayersBtn').addEventListener('click', loadPlayersForm);
    document.getElementById('editGameBtn').addEventListener('click', editGameForm);
    document.getElementById('editKeyDatesBtn').addEventListener('click', editKeyDatesForm);

    
    console.log('Admin interface shown');
}


// Player management section
async function managePlayersButtonForm() {
    // Get the container where players will be displayed
    const playerContainer = document.getElementById('playerManagementArea');
    if (!playerContainer) {
        console.error('Player management area not found');
        return;
    }

    // If table is already visible, hide it
    if (playerContainer.style.display === 'block') {
        const playerContainer = document.getElementById('playerManagementArea');
        if (playerContainer) {
            playerContainer.style.display = 'none';
            playerContainer.innerHTML = ''; 
        }
        return;
    }

    try {
        // Clear existing content
        playerContainer.innerHTML = '';

        // Show the container
        playerContainer.style.display = 'block';

        showLoader();

        // Fetch players
        const playerData = await getPlayers();
        const players = playerData.players_all.players;
        console.log("Players:", players);

        // Create a table to display players
        const table = document.createElement('table');
        table.className = 'player-table';
        
        // Add table header
        const header = table.createTHead();
        const headerRow = header.insertRow();
        ['Player','Status', 'Actions'].forEach(text => {
            const th = document.createElement('th');
            th.textContent = text;
            headerRow.appendChild(th);
        });

        // Add player rows
        const tbody = table.createTBody();
        console.log('Players type:', typeof players, 'Players value:', players);

        players.forEach(player => {
            const row = tbody.insertRow();
            
            // Player name cell
            const nameCell = row.insertCell();
            nameCell.textContent = player.nickname;

            // Player name cell
            const statusCell = row.insertCell();
            const statusSelect = document.createElement('select');
            statusSelect.className = 'status-select';
          
            // Create options for Y and N
            const options = ['Y', 'N'];
            options.forEach(option => {
                const optionElement = document.createElement('option');
                optionElement.value = option;
                optionElement.textContent = option;
                if (option === player.legacy) {
                    optionElement.selected = true;
                }
                statusSelect.appendChild(optionElement);
            });

            // Add change event listener to the dropdown
            statusSelect.addEventListener('change', async (e) => {
                const newStatus = e.target.value;
                const oldStatus = player.legacy;
                
                // Debug logging
                console.log('Current localStorage state:', {
                    idToken: !!localStorage.getItem('idToken'),
                    authenticated: localStorage.getItem('authenticated')
                });
                
                // Add confirmation popup
                if (confirm(`Are you sure you want to change ${player.nickname}'s legacy status from ${oldStatus} to ${newStatus}?`)) {
                    console.log(`Attempting to update ${player.nickname} (ID: ${player.id}) legacy status to ${newStatus}`);
                    try {
                        await changePlayerStatus(player.id, newStatus);
                        console.log(`Successfully updated ${player.nickname}'s legacy status to ${newStatus}`);
                    } catch (error) {
                        console.error('Error updating status:', error);
                        alert('Failed to update status. Please try again.');
                        // Reset to original value if update failed
                        e.target.value = oldStatus;
                    }
                } else {
                    // If user cancels, revert the select back to its original value
                    e.target.value = oldStatus;
                }

            });
            
            statusCell.appendChild(statusSelect);

            // Actions cell
            const actionsCell = row.insertCell();
            
            // Remove button
            const removeButton = document.createElement('button');
            removeButton.textContent = 'Remove';
            removeButton.className = 'remove-btn';
            removeButton.addEventListener('click', () => removePlayer(player.id));
            
            actionsCell.appendChild(removeButton);
        });

        // Add the table to the container
        playerContainer.appendChild(table);

        hideLoader();

    } catch (error) {
        console.error('Error loading players:', error);
        playerContainer.innerHTML = '<p class="error">Error loading players. Please try again.</p>';
        hideLoader();    
    }
}

async function changePlayerStatus(id, newLegacyStatus) {
    console.log('Starting changePlayerStatus function....', {id, newLegacyStatus});
    console.log('Player ID:', id);
    try {
        const token = localStorage.getItem('idToken');
        console.log('Token state:', {
            tokenExists: !!token,
            tokenLength: token ? token.length : 0,
            authenticated: localStorage.getItem('authenticated')
        });
        
        if (!token) {
            throw new Error('No authentication token found');
        }


        const putapiurl = `${bjapi_url}players/${id}`;
        console.log('API base URL:', bjapi_url);
        console.log('PUT API URL:', putapiurl);
        console.log('Request headers:', {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token.substring(0,10)}...` // Log first 10 chars of token for safety
        });
        console.log('Request body:', {legacy: newLegacyStatus});

        const response = await fetch(putapiurl, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                legacy: newLegacyStatus
            })
        });

        const responseText = await response.text();
        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));
        console.log('Response body:', responseText);

        if (!response.ok) {
            throw new Error(`Failed to update player: ${response.status} ${response.statusText}\nResponse: ${responseText}`);
        }

        return responseText ? JSON.parse(responseText) : null;
    } catch (error) {
        console.error('Error updating player:', error);
        throw error;
    }
}

async function removePlayer(id) {
    console.log('Starting removePlayer function....', {id});
    if (!confirm('Are you sure you want to delete this player?')) {
        return;
    }

    console.log('Player ID:', id);
    try {
        const token = localStorage.getItem('idToken');
        console.log('Token state:', {
            tokenExists: !!token,
            tokenLength: token ? token.length : 0,
            authenticated: localStorage.getItem('authenticated')
        });
        
        if (!token) {
            throw new Error('No authentication token found');
        }
    
        const deleteApiUrl = `${bjapi_url}players/${id}`;

        console.log('API base URL:', bjapi_url);
        console.log('PUT API URL:', deleteApiUrl);
        console.log('Request headers:', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token.substring(0,10)}...` // Log first 10 chars of token for safety
            }
        });
        console.log('Request body:', {id: id});
        const response = await fetch(deleteApiUrl, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                id: id
            })
            
        });
        
        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));
        
        const responseText = await response.text();
        console.log('Response body:', responseText);

        if (response.ok) {
            managePlayersButtonForm(); // Refresh the player list
        } else {
            throw new Error('Failed to delete player');
        }
    } catch (error) {
        console.error('Error deleting player:', error);
        alert('Error deleting player. Please try again.');
    }
}

async function addPlayerForm() {
    console.log('Starting addPlayer function....')

    const newPlayerContainer = document.getElementById('newPlayerManagementArea');
    if (!newPlayerContainer) {
        console.error('New player management area not found');
        return;
    }

    // If form is already visible, hide it
    if (newPlayerContainer.style.display === 'block' ) {
        console.log('Form is already visible, hiding it');
        const newPlayerContainer = document.getElementById('newPlayerManagementArea');
        if (newPlayerContainer) {
            newPlayerContainer.style.display = 'none';
            newPlayerContainer.innerHTML = '';
        }
        return;
    }

    try {
        console.log('New player management area found');
        newPlayerContainer.innerHTML = '';
        newPlayerContainer.style.display = 'block';
        showLoader();

        // Create and show the add player form
        const formHTML = `
            <div id="addPlayerForm" class="card">
                <div class="card-body">
                    <h4>Add New Player</h4>
                    <form id="playerForm">
                        <div class="form-group">
                            <label for="firstName">First Name:</label>
                            <input type="text" id="firstName" class="form-control" required>
                        </div>
                        <div class="form-group">
                            <label for="lastName">Last Name:</label>
                            <input type="text" id="lastName" class="form-control" required>
                        </div>
                        <div class="form-group">
                            <label for="nickName">Nickname:</label>
                            <input type="text" id="nickName" class="form-control">
                        </div>
                        <div class="form-group">
                            <label for="legacy">Legacy:</label>
                            <select id="legacy" class="form-control">
                                <option value="Y">Y</option>
                                <option value="N" selected>N</option>
                            </select>
                        </div>
                        <button type="submit" class="btn btn-primary mt-3">Submit</button>
                    </form>
                </div>
            </div>
        `;

        newPlayerContainer.innerHTML = formHTML;

        document.getElementById('playerForm').addEventListener('submit', async (e) => {
            e.preventDefault(); // Prevent form from submitting normally
            await addPlayer(); // Call addPlayer function
        });

        hideLoader();

    } catch (error) {
        console.error('Error setting up add player form:', error);
        hideLoader();
    }
}

async function addPlayer() {
    console.log('Starting addPlayer function....')

    try {
        const token = localStorage.getItem('idToken');
        console.log('Token state:', {
            tokenExists: !!token,
            tokenLength: token ? token.length : 0,
            authenticated: localStorage.getItem('authenticated')
        });
        
        if (!token) {
            throw new Error('No authentication token found');
        }

        const postApiUrl = `${bjapi_url}players/`;
        const playerData = await getPlayers();
        const existingPlayers = playerData.players_all;
        console.log('Existing players', existingPlayers);
        const playerCount = existingPlayers.players.length;
        const newPlayerNumber = playerCount + 1;
        console.log('New player number', newPlayerNumber);

        const newPlayerData = {
            id: `player${newPlayerNumber}`,
            firstName: document.getElementById('firstName').value,
            lastName: document.getElementById('lastName').value,
            nickname: document.getElementById('nickName').value,
            legacy: document.getElementById('legacy').value
        };
        console.log('New player data', newPlayerData);

        const response = await fetch(postApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(newPlayerData)
        });
        
        if (response.ok) {
            console.log('Player added successfully', response);
            alert('Player added successfully!');
            const newPlayerContainer = document.getElementById('newPlayerManagementArea');
            newPlayerContainer.style.display = 'none';
            newPlayerContainer.innerHTML = '';
        } else {
            throw new Error('Failed to add player');
        }

    } catch (error) {
        console.error('Error adding player:', error);
        alert('Error adding player. Please try again.');
    } finally {
        hideLoader();
    }
}

async function loadPlayersForm() {
    console.log('Starting loadPlayersForm function....');

    const loadPlayersContainer = document.getElementById('loadPlayersArea');
    if (!loadPlayersContainer) {
        console.error('Load players area not found');
        return;
    }

    // Toggle visibility logic
    if (loadPlayersContainer.style.display === 'block') {
        console.log('Form is already visible, hiding it');
        loadPlayersContainer.style.display = 'none';
        loadPlayersContainer.innerHTML = '';
        return;
    }

    try {
        loadPlayersContainer.innerHTML = '';
        loadPlayersContainer.style.display = 'block';
        showLoader();

        // Create and show the load players form
        const formHTML = `
            <div id="loadPlayersForm" class="card">
                <div class="card-body">
                    <h4>Load Players from JSON</h4>
                    <form id="playersFileForm">
                        <div class="form-group">
                            <label for="playerFile">Select JSON File:</label>
                            <input type="file" 
                                   id="playerFile" 
                                   class="form-control" 
                                   accept=".json"
                                   required>
                        </div>
                        <button type="submit" class="btn btn-primary mt-3">Load Players</button>
                    </form>
                </div>
            </div>
        `;

        loadPlayersContainer.innerHTML = formHTML;

        // Add submit event listener to the form
        document.getElementById('playersFileForm').addEventListener('submit', async (e) => {
            e.preventDefault(); // Prevent form from submitting normally
            await loadPlayers(); // Call loadPlayers function
        });

        hideLoader();

    } catch (error) {
        console.error('Error setting up load players form:', error);
        hideLoader();
    }
}

async function loadPlayers() {
    console.log('Starting loadPlayers function....');

    try {
        const token = localStorage.getItem('idToken');
        if (!token) {
            throw new Error('No authentication token found');
        }

        const fileInput = document.getElementById('playerFile');
        const file = fileInput.files[0];

        if (!file) {
            alert('Please select a file');
            return;
        }

        showLoader();

        const reader = new FileReader();
        
        reader.onload = async function(event) {
            try {
                const data = JSON.parse(event.target.result);
                
                // Validate file structure
                if (!data || !data.members || !Array.isArray(data.members)) {
                    throw new Error('Invalid file format: Expected a members array');
                }

                console.log("Loaded data:", data);

                // Process each member in the array
                for (const member of data.members) {
                    const memberData = {
                        id: member.id,
                        firstName: member.firstName,
                        lastName: member.lastName,
                        nickname: member.nickname,
                        legacy: member.legacy
                    };

//                    console.log("Processing member:", memberData);

                    const response = await fetch(`${bjapi_url}players`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify(memberData)
                    });

                    if (!response.ok) {
                        const responseText = await response.text();
                        throw new Error(`Failed to add player ${member.firstName} ${member.lastName}: ${responseText}`);
                    }

//                    console.log(`Successfully added player: ${member.firstName} ${member.lastName}`);
                }

                alert('All players loaded successfully!');
                
                // Clear and hide the form after successful submission
                const loadPlayersContainer = document.getElementById('loadPlayersArea');
                loadPlayersContainer.style.display = 'none';
                loadPlayersContainer.innerHTML = '';

            } catch (error) {
                console.error('Error processing file:', error);
                alert('Error processing file: ' + error.message);
            }
        };

        reader.onerror = function(error) {
            console.error('Error reading file:', error);
            alert('Error reading file');
        };

        reader.readAsText(file);

    } catch (error) {
        console.error('Error loading players:', error);
        alert('Error loading players: ' + error.message);
    } finally {
        hideLoader();
    }
}


// Games management section
async function editGameForm() {
}

// Dates management section
async function editKeyDatesForm() {
    console.log('Starting editKeyDatesForm function....');

    const keyDatesContainer = document.getElementById('editKeyDatesArea');
    if (!keyDatesContainer) {
        console.error('Key dates area not found');
        return;
    }

    // Toggle visibility logic
    if (keyDatesContainer.style.display === 'block') {
        console.log('Form is already visible, hiding it');
        keyDatesContainer.style.display = 'none';
        keyDatesContainer.innerHTML = '';
        return;
    }

    try {
        keyDatesContainer.innerHTML = '';
        keyDatesContainer.style.display = 'block';
        showLoader();

        // Create and show the key dates form
        const formHTML = `
            <div id="editKeyDatesForm" class="card">
                <div class="card-body">
                    <h4>Edit Key  Dates</h4>
                    <form id="keyDatesForm">
                        <div class="form-group">
                            <label for="fedExStart">FedEx Start Date:</label>
                            <input type="date" 
                                   id="fedExStart" 
                                   class="form-control" 
                                   required>
                        </div>
                        <div class="form-group">
                            <label for="seasonStart">Season Start Date:</label>
                            <input type="date" 
                                   id="seasonStart" 
                                   class="form-control" 
                                   required>
                        </div>
                        <div class="form-group">
                            <label for="seasonEnd">Season End Date:</label>
                            <input type="date" 
                                   id="seasonEnd" 
                                   class="form-control" 
                                   required>
                        </div>

                        <button type="submit" class="btn btn-primary mt-3">Update Dates</button>
                    </form>
                </div>
            </div>
        `;

        keyDatesContainer.innerHTML = formHTML;

        // Add submit event listener to the form
        document.getElementById('keyDatesForm').addEventListener('submit', async (e) => {
            e.preventDefault(); // Prevent form from submitting normally
            await editKeyDates(); // Call editKeyDates function
        });

        hideLoader();

    } catch (error) {
        console.error('Error setting up key dates form:', error);
        hideLoader();
    }
}

async function editKeyDates() {
    console.log('Starting editKeyDates function....');

    try {
        const token = localStorage.getItem('idToken');
        if (!token) {
            throw new Error('No authentication token found');
        }

        showLoader();

        // Gather form data
        const keyDatesData = {
            fedExStart: document.getElementById('fedExStart').value,
            seasonStart: document.getElementById('seasonStart').value,
            seasonEnd: document.getElementById('seasonEnd').value
        };

        // Validate dates
        const regDate = new Date(keyDatesData.fedExStart);
        const startDate = new Date(keyDatesData.seasonStart);
        const endDate = new Date(keyDatesData.seasonEnd);

        console.log("Updating key dates:", keyDatesData);

        // Send to backend
        const response = await fetch(`${bjapi_url}dates`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(keyDatesData)
        });

        if (!response.ok) {
            const responseText = await response.text();
            throw new Error(`Failed to update key dates: ${responseText}`);
        }

        alert('Key dates updated successfully!');
        
        // Clear and hide the form after successful submission
        const keyDatesContainer = document.getElementById('editKeyDatesArea');
        keyDatesContainer.style.display = 'none';
        keyDatesContainer.innerHTML = '';

    } catch (error) {
        console.error('Error updating key dates:', error);
        alert('Error updating key dates: ' + error.message);
    } finally {
        hideLoader();
    }
}

