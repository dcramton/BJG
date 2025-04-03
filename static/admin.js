// Begin admin.js
import { getPlayers, getGames, getDates, showLoader, hideLoader } from "./commonscripts.js";
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
    document.getElementById('editExcludeDatesBtn').addEventListener('click', editExcludeDatesForm);
    document.getElementById('editGameDaysBtn').addEventListener('click', editGameDaysForm);
    document.getElementById('buildGamesTblBtn').addEventListener('click', createNewGameTable);
    document.getElementById('buildDatesTblBtn').addEventListener('click', createNewDatesTable);
    document.getElementById('buildAvailTblBtn').addEventListener('click', createNewAvailTable);

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
    // DISABLED UNTIL SCORING DATA FORMAT ISSUE IS RESOLVED
    return;
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
    console.log('Starting editGameForm function....');

    const editGameContainer = document.getElementById('editGameArea');
    if (!editGameContainer) {
        console.error('Edit game area not found');
        return;
    }

    // Toggle visibility logic
    if (editGameContainer.style.display === 'block') {
        console.log('Form is already visible, hiding it');
        editGameContainer.style.display = 'none';
        editGameContainer.innerHTML = '';
        return;
    }

    try {
        editGameContainer.innerHTML = '';
        editGameContainer.style.display = 'block';
        showLoader();

        // Create and show the game days form
        const formHTML = `
            <div id="editEditGameForm" class="card">
                <div class="card-body">
                    <form id="editGameForm">
                        <div class="form-group">
                            <label for="gameDate">Date of game to edit:</label>
                            <input type="date" 
                                   id="gameDate" 
                                   class="form-control">
                        </div>
                         <button type="submit" class="btn btn-primary mt-3">Get games from this date</button>
                    </form>
                </div>
            </div>
        `;

        editGameContainer.innerHTML = formHTML;
        console.log('gameDate', gameDate);


        // Set the selected values based on existing game days
        if (editGame && editGame.length > 0) {
            document.getElementById('gameDate').value = editGame[0];
        }

        // Add submit event listener to the form
        document.getElementById('editGameForm').addEventListener('submit', async (e) => {
            e.preventDefault(); // Prevent form from submitting normally
            await editGame(); // Call editEditGame function
        });

        hideLoader();

    } catch (error) {
        console.error('Error setting up game days form:', error);
        hideLoader();
    }
}
async function editGame() {
    console.log('Starting editGame function....');

    try {
        const token = localStorage.getItem('idToken');
        if (!token) {
            throw new Error('No authentication token found');
        }

        showLoader();

        const playerData = await getPlayers();
        console.log("Getting players:", playerData);
        const players_bj = playerData.players_bj.players;
        console.log("Players_bj:", players_bj);
        
        // Gather form data
        const gameDate = document.getElementById('gameDate').value;
        console.log('gameDate', gameDate);
        const gamesData = await getGames();
        console.log("Getting games:", gamesData);
        console.log("bscores", gamesData.games[0].bscores);

        // Extract games which match the gameDate
        const matchingGames = gamesData.games.filter(game => {
            const gameDateTime = game.uuid.substring(0,10);
            return gameDateTime === gameDate;
        });

        // Hide the entire card container
        const editGameFormCard = document.getElementById('editEditGameForm');
        if (editGameFormCard) {
            editGameFormCard.style.display = 'none';
        }

        // For each matching game, extract players with positive sscores and their corresponding bscores
        const gameOptions = matchingGames.map(game => {
            const playerDetails = [];
            // Loop through each player's scores
            game.sscores.forEach((sscore, index) => {
                if (sscore > 0) {
                    const sscore = game.sscores[index];
                    playerDetails.push({
                        nickname: playerData.players_bj.players[index].nickname,
                        bscore: game.bscores[index],
                        sscore: sscore
                    });
                }
            });

            return {
                uuid: game.uuid,
                holes: game.holes,
                players: playerDetails
            };
        });

        console.log("Processed game options:", gameOptions);
        
        if (matchingGames.length === 0) {
            alert('No games found for the selected date');
            return;
        }

        // Create select box for matching games
        const selectHTML = `
            <div class="form-group mt-3">
                <h4>Select Games to Edit:</h4>
                <div class="games-list">
                    ${gameOptions.map(game => `
                        <div class="form-check mb-2">
                            <input type="checkbox" 
                                class="form-check-input game-checkbox" 
                                id="${game.uuid}" 
                                value="${game.uuid}">
                            <label class="form-check-label" for="${game.uuid}">
                                ${game.uuid.substring(0,10)} : ${game.players.map(player => 
                                    `${player.nickname} (BJ: ${player.bscore}, SF: ${player.sscore})`
                                ).join(' / ')}
                            </label>
                        </div>
                    `).join('')}
                </div>
                <button id="editSelectedGame" class="btn btn-primary mt-3">Edit Selected Game</button>
                <button id="deleteSelectedGame" class="btn btn-primary mt-3">Delete Selected Game</button>
                </div>
        `;
    
        // Display the select box
        const editGameContainer = document.getElementById('editGameArea');
        editGameContainer.insertAdjacentHTML('beforeend', selectHTML);

        // Add event listener for the edit button
        document.getElementById('editSelectedGame').addEventListener('click', async () => {
            const selectedCheckboxes = document.querySelectorAll('.game-checkbox:checked');
            const selectedGameIds = Array.from(selectedCheckboxes).map(checkbox => checkbox.value);
            
            if (selectedGameIds.length === 0) {
                alert('Please select at least one game to edit');
                return;
            }
        
            const selectedGameDetails = gameOptions.filter(game => 
                selectedGameIds.includes(game.uuid)
            ).map(game => ({
                date: game.uuid.substring(0,10),
                players: game.players.map(player => ({
                    nickname: player.nickname,
                    bscore: player.bscore,
                    sscore: player.sscore
                }))
            }));
            
            // Here you can add the code to display the edit form for the selected games
            await displayGameEditForm(selectedGameDetails);
        });
        // Add event listener for the delete button
        document.getElementById('deleteSelectedGame').addEventListener('click', async () => {
            const selectedCheckboxes = document.querySelectorAll('.game-checkbox:checked');
            const selectedGameIds = Array.from(selectedCheckboxes).map(checkbox => checkbox.value);
            
            if (selectedGameIds.length === 0) {
                alert('Please select at least one game to delete');
                return;
            }
        
            if (confirm('Are you sure you want to delete this game? This action cannot be undone.')) {
                await deleteGame(selectedGameIds[0]);
            }
        });

    } catch (error) {
    console.error('Error deleting game:', error);
    alert('Error deleteing game: ' + error.message);
    } finally {
    hideLoader();
    }
}
async function displayGameEditForm(gameDetails) {
    console.log('Starting displayGameEditForm function....');
    console.log('Game details to edit:', gameDetails);

    // Create a container with the enterscores class
    const editFormContainer = document.createElement('div');
    editFormContainer.className = 'enterscores';

    const editFormHTML = `
        <table id="enterscores">
            <thead>
                <tr>
                    <th>Player</th>
                    <th>Brown Jacket Score</th>
                    <th>Stableford Score</th>  
                </tr>
            </thead>
            <tbody>
                ${gameDetails[0].players.map(player => `
                    <tr>
                        <td>${player.nickname}</td>
                        <td>
                            <input type="number" 
                                   class="bjpoints" 
                                   min="-24" 
                                   max="24" 
                                   value="${player.bscore}">
                        </td>
                        <td>
                            <input type="number" 
                                   class="spoints" 
                                   min="0" 
                                   max="48" 
                                   value="${player.sscore}">
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    editFormContainer.innerHTML = editFormHTML;
    
    // Replace or append the form
    const editGameContainer = document.getElementById('editGameArea');
    // Remove any existing form
    const existingForm = editGameContainer.querySelector('.enterscores');
    if (existingForm) {
        existingForm.remove();
    }
    editGameContainer.appendChild(editFormContainer);

    // Add save button with appropriate styling
    const saveButton = document.createElement('button');
    saveButton.id = 'saveGameChanges';
    saveButton.className = 'save-button';
    saveButton.textContent = 'Save Changes';
    editFormContainer.appendChild(saveButton);

    // Add event listener for save button
    saveButton.addEventListener('click', async () => {
        const updatedScores = Array.from(editGameContainer.querySelectorAll('tr')).slice(1).map(row => ({
            nickname: row.cells[0].textContent,
            bscore: parseInt(row.querySelector('.bjpoints').value),
            sscore: parseInt(row.querySelector('.spoints').value)
        }));
        
        console.log('Updated scores:', updatedScores);
        // Implement the API call to save the changes
    });
}
async function deleteGame(uuid) {
    console.log('Starting deleteGame function....', {uuid});
    if (!confirm('Are you sure you want to delete this game?')) {
        return;
    }

    try {
        const token = localStorage.getItem('idToken');
//        console.log('Token state:', {
//            tokenExists: !!token,
//            tokenLength: token ? token.length : 0,
//            authenticated: localStorage.getItem('authenticated')
//        });
        
        if (!token) {
            throw new Error('No authentication token found');
        }

        showLoader();
        
        const deleteApiUrl = `${bjapi_url}games/`;
        const response = await fetch(deleteApiUrl, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                uuid: uuid
            })
        });
        

        if (response.ok) {
            // Clear and hide the game selection area
            const editGameContainer = document.getElementById('editGameArea');
            editGameContainer.style.display = 'none';
            editGameContainer.innerHTML = '';
            
            alert('Game successfully deleted');
            return;
        } else {
            throw new Error('Failed to delete game');
        }
    } catch (error) {
        console.error('Error deleting game:', error);
        alert('Error deleting game. Please try again.');
    } finally {
        hideLoader();
    }
}
async function saveGameChanges() {}

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

        // Fetch current dates
        const dateData = await getDates();
        const keyDates = dateData.keyDates;
        console.log('Key dates:', keyDates);

        // Create and show the key dates form
        const formHTML = `
            <div id="editKeyDatesForm" class="card">
                <div class="card-body">
                    <h4>Edit Key  Dates</h4>
                    <form id="keyDatesForm">
                        <div class="form-group">
                            <label for="fedExStart">FedEx Start Date:</label>
                            <input type="date" 
                                   id="fedExDate" 
                                   class="form-control"
                                   value="${keyDates.fedExDate || ''}" 
                                   required>
                        </div>
                        <div class="form-group">
                            <label for="seasonStart">Season Start Date:</label>
                            <input type="date" 
                                   id="openDate" 
                                   class="form-control" 
                                   value="${keyDates.openDate || ''}"
                                   required>
                        </div>
                        <div class="form-group">
                            <label for="seasonEnd">Season End Date:</label>
                            <input type="date" 
                                   id="closeDate" 
                                   class="form-control" 
                                   value="${keyDates.closeDate || ''}"
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
            openDate: document.getElementById('openDate').value,
            closeDate: document.getElementById('closeDate').value,
            fedExDate: document.getElementById('fedExDate').value
        };

        console.log("Updating key dates:", keyDatesData);

        // Log the full request details
        const apiUrl = `${bjapi_url}dates`; // Make sure this matches your API endpoint
        console.log("API URL:", apiUrl);
        console.log("Request method: PUT");
        console.log("Request headers:", {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token.substring(0, 10)}...` // Only log part of token for security
        });
        console.log("Request body:", JSON.stringify(keyDatesData));

        const response = await fetch(apiUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                body: JSON.stringify(keyDatesData)
            })    
        });

        console.log("Response status:", response.status);
        console.log("Response headers:", Object.fromEntries(response.headers.entries()));
        
        const responseText = await response.text();
        console.log("Raw response:", responseText);

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

async function editExcludeDatesForm() {
    console.log('Starting editExcludeDatesForm function....');

    const excludeDatesContainer = document.getElementById('editExcludeDatesArea');
    if (!excludeDatesContainer) {
        console.error('Exclude dates area not found');
        return;
    }

    // Toggle visibility logic
    if (excludeDatesContainer.style.display === 'block') {
        console.log('Form is already visible, hiding it');
        excludeDatesContainer.style.display = 'none';
        excludeDatesContainer.innerHTML = '';
        return;
    }

    try {
        excludeDatesContainer.innerHTML = '';
        excludeDatesContainer.style.display = 'block';
        showLoader();

        // Fetch current dates
        const dateData = await getDates();
        const exDates = dateData.excludeDates;
        console.log('Exclude dates:', exDates);

        // Create and show the key dates form
        const formHTML = `
            <div id="editExcludeDatesForm" class="card">
                <div class="card-body">
                    <h4>Dates to Exclude from Calendar</h4>
                    <form id="excludeDatesForm">
                        <div class="form-group">
                            <label for="excludeDate1">Excluded Date 1:</label>
                            <input type="date" 
                                   id="excludeDate1" 
                                   class="form-control"
                                   value="${exDates[0] || ''}" 
                                   required>
                        </div>
                        <div class="form-group">
                            <label for="excludeDate2">Excluded Date 2:</label>
                            <input type="date" 
                                   id="excludeDate2" 
                                   class="form-control"
                                   value="${exDates[1] || ''}" 
                                   required>
                        </div>
                        <div class="form-group">
                            <label for="excludeDate3">Excluded Date 3:</label>
                            <input type="date" 
                                   id="excludeDate3" 
                                   class="form-control"
                                   value="${exDates[2] || ''}" 
                                   >
                        </div>

                        <button type="submit" class="btn btn-primary mt-3">Update Dates</button>
                    </form>
                </div>
            </div>
        `;

        excludeDatesContainer.innerHTML = formHTML;

        // Add submit event listener to the form
        document.getElementById('excludeDatesForm').addEventListener('submit', async (e) => {
            e.preventDefault(); // Prevent form from submitting normally
            await editExcludeDates(); // Call editExcludeDates function
        });

        hideLoader();

    } catch (error) {
        console.error('Error setting up key dates form:', error);
        hideLoader();
    }
}

async function editExcludeDates() {
    console.log('Starting editExcludeDates function....');

    try {
        const token = localStorage.getItem('idToken');
        if (!token) {
            throw new Error('No authentication token found');
        }

        showLoader();
        
        // Gather form data
        const exDates = {
            excludeDate1: document.getElementById('excludeDate1').value,
            excludeDate2: document.getElementById('excludeDate2').value,
            excludeDate3: document.getElementById('excludeDate3').value,
        };

        console.log("Updating excluded dates:", exDates);

        // Log the full request details
        const apiUrl = `${bjapi_url}dates`; // Make sure this matches your API endpoint
        console.log("API URL:", apiUrl);
        console.log("Request method: PUT");
        console.log("Request headers:", {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token.substring(0, 10)}...` // Only log part of token for security
        });
        console.log("Request body:", JSON.stringify(exDates));

        const response = await fetch(apiUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                body: JSON.stringify(exDates)
            })    
        });

        console.log("Response status:", response.status);
        console.log("Response headers:", Object.fromEntries(response.headers.entries()));
        
        const responseText = await response.text();
        console.log("Raw response:", responseText);

        if (!response.ok) {
            const responseText = await response.text();
            throw new Error(`Failed to update key dates: ${responseText}`);
        }

        alert('Key dates updated successfully!');
        
        // Clear and hide the form after successful submission
        const excludeDatesContainer = document.getElementById('editExcludeDatesArea');
        excludeDatesContainer.style.display = 'none';
        excludeDatesContainer.innerHTML = '';

    } catch (error) {
        console.error('Error updating excluded dates:', error);
        alert('Error updating excluded dates: ' + error.message);
    } finally {
        hideLoader();
    }
}

async function editGameDaysForm() {
    console.log('Starting editGameDaysForm function....');

    const gameDaysContainer = document.getElementById('editGameDaysArea');
    if (!gameDaysContainer) {
        console.error('Exclude dates area not found');
        return;
    }

    // Toggle visibility logic
    if (gameDaysContainer.style.display === 'block') {
        console.log('Form is already visible, hiding it');
        gameDaysContainer.style.display = 'none';
        gameDaysContainer.innerHTML = '';
        return;
    }

    try {
        gameDaysContainer.innerHTML = '';
        gameDaysContainer.style.display = 'block';
        showLoader();

        // Fetch current dates
        const dateData = await getDates();
        const gameDays = dateData.gameDays;
        console.log('Game days:', gameDays);

            // Array of days for select options
            const daysOfWeek = [
            { value: 0, label: 'Sunday' },
            { value: 1, label: 'Monday' },
            { value: 2, label: 'Tuesday' },
            { value: 3, label: 'Wednesday' },
            { value: 4, label: 'Thursday' },
            { value: 5, label: 'Friday' },
            { value: 6, label: 'Saturday' }
        ];

        const selectOptions = daysOfWeek
        .map(day => `<option value="${day.value}">${day.label}</option>`)
        .join('');

        // Create and show the game days form
        const formHTML = `
            <div id="editGameDaysForm" class="card">
                <div class="card-body">
                    <h4>Days of the Week to Schedule Games</h4>
                    <form id="gameDaysForm">
                        <div class="form-group">
                            <label for="gameDay1">Game Day 1:</label>
                            <select id="gameDay1" class="form-control" required>
                                ${selectOptions}
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="gameDay2">Game Day 2:</label>
                            <select id="gameDay2" class="form-control" required>
                                ${selectOptions}
                            </select>
                        </div>
                        <button type="submit" class="btn btn-primary mt-3">Update Game Days</button>
                    </form>
                </div>
            </div>
        `;

        gameDaysContainer.innerHTML = formHTML;

        // Set the selected values based on existing game days
        if (gameDays && gameDays.length > 0) {
            document.getElementById('gameDay1').value = gameDays[0];
            if (gameDays.length > 1) {
                document.getElementById('gameDay2').value = gameDays[1];
            }
        }

        // Add submit event listener to the form
        document.getElementById('gameDaysForm').addEventListener('submit', async (e) => {
            e.preventDefault(); // Prevent form from submitting normally
            await editGameDays(); // Call editGameDays function
        });

        hideLoader();

    } catch (error) {
        console.error('Error setting up game days form:', error);
        hideLoader();
    }
}

async function editGameDays() {
    console.log('Starting editGameDays function....');

    try {
        const token = localStorage.getItem('idToken');
        if (!token) {
            throw new Error('No authentication token found');
        }

        showLoader();
        
        // Gather form data
        const gameDays = {
            gameDay1: document.getElementById('gameDay1').value,
            gameDay2: document.getElementById('gameDay2').value
        };

        console.log("Updating game days:", gameDays);

        // Log the full request details
        const apiUrl = `${bjapi_url}dates`; // Make sure this matches your API endpoint
        console.log("API URL:", apiUrl);
        console.log("Request method: PUT");
        console.log("Request headers:", {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token.substring(0, 10)}...` // Only log part of token for security
        });
        console.log("Request body:", JSON.stringify(gameDays));

        const response = await fetch(apiUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                body: JSON.stringify(gameDays)
            })    
        });

        console.log("Response status:", response.status);
        console.log("Response headers:", Object.fromEntries(response.headers.entries()));
        
        const responseText = await response.text();
        console.log("Raw response:", responseText);

        if (!response.ok) {
            const responseText = await response.text();
            throw new Error(`Failed to update key dates: ${responseText}`);
        }

        alert('Game days updated successfully!');
        
        // Clear and hide the form after successful submission
        const gameDaysContainer = document.getElementById('editGameDaysArea');
        gameDaysContainer.style.display = 'none';
        gameDaysContainer.innerHTML = '';

    } catch (error) {
        console.error('Error updating game days:', error);
        alert('Error updating game days: ' + error.message);
    } finally {
        hideLoader();
    }
}

// Table management section
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