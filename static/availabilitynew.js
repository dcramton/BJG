// 1. IMPORTS

import { CONFIG, ENV_CONFIG, MESSAGES, CSS_CLASSES } from './config.js';
console.log("******** Begining availabilitytranspose.js *********************");


// 2. CLASS DEFINITIONS
class EventCalendar {
    constructor(events, savedAvailabilityMap = new Map(), userId) {
        this.events = [];
        this.players = [];
        this.userId = userId;
        this.availabilityMap = new Map();
        this.hasUnsavedChanges = false;
        console.log('EventCalendar initialized');
    }

    // Add single event to the calendar
    addEvent(date, title) {
        const event = {
            id: crypto.randomUUID(),
            date: new Date(date),
            title: title
        };
        this.events.push(event);
        return event;
    }

    // Method to fetch exempt dates - add this inside the class
    async getExemptDatesFromJson() {
        try {
            const response = await fetch('/static/dates.json');
            const data = await response.json();
            return data.dates.exempt || [];
        } catch (error) {
            console.error('Error fetching exempt dates:', error);
            return [];
        }
    }

    async loadPlayerData() {
        try {
            const response = await fetch('/static/players.json');
            const data = await response.json();
            this.players = data.members.map(player => ({
                id: player.id,
                nickname: player.nickname
            }));
            console.log('Players loaded:', this.players);
        } catch (error) {
            console.error('Error loading player data:', error);
            this.players = [];
        }
    }

    // Add recurring events to the calendar
    async addRecurringEvents(eventStartDate, eventEndDate, title, options = {}) {
        console.log('Starting addRecurringEvents...');
        
        try {
            // Get dates from dates.json
            const response = await fetch('/static/dates.json');
            const datesData = await response.json();
            console.log('Raw dates data:', datesData);

            
            // Map the dates.json values to our parameters
            const startDate = new Date(datesData.dates.opening || eventStartDate || `${currentYear}-05-01`);
            const endDate = new Date(datesData.dates.closing || eventEndDate || `${currentYear}-11-30`);
            endDate.setDate(endDate.getDate() + 1);
            const currentDate = new Date(startDate);
        
            console.log('Date range:', {
                start: startDate.toISOString(),
                end: endDate.toISOString()
            });
        
            const daysOfWeek = datesData.dates.gamedays || [3, 6];
            console.log('Game days:', daysOfWeek);
        
            // Get exempt dates from dates.json
            const exemptDates = datesData.dates.exempt || [];
            console.log('Exempt dates loaded:', exemptDates);
            
            // Convert exempt dates to timestamp for comparison
            const excludeDates = exemptDates.map(date => {
                // Parse the date string and adjust for timezone
                const [year, month, day] = date.split('-').map(Number);
                // month-1 because JavaScript months are 0-based
                return new Date(year, month-1, day).setHours(0, 0, 0, 0);
            });
    
            let eventCount = 0;
            while (currentDate <= endDate) {
                const dayOfWeek = currentDate.getDay();
                const currentTimestamp = currentDate.setHours(0, 0, 0, 0);
                
                if (daysOfWeek.includes(dayOfWeek) && 
                    !excludeDates.includes(currentTimestamp)) {
//                    console.log('Using dayOfWeek:', dayOfWeek, 'from daysOfWeek:', daysOfWeek);
                    
                    const event = {
                        id: crypto.randomUUID(),
                        date: new Date(currentDate.getTime()),
                        title: title
                    };   
        
                    this.events.push(event);
                    eventCount++;
                }
                currentDate.setDate(currentDate.getDate() + 1);
            }
        
            console.log(`Added ${eventCount} events to calendar`);
            console.log('First few events:', this.events.slice(0, 3));
            
        } catch (error) {
            console.error('Error in addRecurringEvents:', error);
            throw error;
        }
    }
    
    

    renderCalendar() {
        console.log('Starting renderCalendar');
        if (!this.events.length) {
            console.error('No events to display');
            return document.createElement('div');
        }
    
        // Create container div
        const container = document.createElement('div');
        container.className = 'availability-calendar';
    
        // Sort events by date
        const sortedEvents = [...this.events].sort((a, b) => a.date - b.date);
    
        // Group events by month
        const eventsByMonth = {};
        sortedEvents.forEach(event => {
            const monthYear = event.date.toLocaleString('default', { month: 'long', year: 'numeric' });
            if (!eventsByMonth[monthYear]) {
                eventsByMonth[monthYear] = [];
            }
            eventsByMonth[monthYear].push(event);
        });
    
        // Create table for all months
        const table = document.createElement('table');
        table.className = 'availability-calendar';
    
        // Create header row
        const headerRow = document.createElement('tr');
        const cornerCell = document.createElement('td');
        headerRow.appendChild(cornerCell);
    
        // Add player nicknames to header
        this.players.forEach(player => {
            const td = document.createElement('td');
            td.textContent = player.nickname || `Player(${player.id})`;
            headerRow.appendChild(td);
        });
        table.appendChild(headerRow);
    
        // Create month sections
        Object.entries(eventsByMonth).forEach(([monthYear, monthEvents]) => {
            // Add month header row
            const monthRow = document.createElement('tr');
            monthRow.className = 'monthLabel collapsed';
            
            const monthCell = document.createElement('td');
            monthCell.colSpan = this.players.length + 1; // +1 for the date column
            
            const monthHeader = document.createElement('h3');
            monthHeader.textContent = monthYear;
            monthCell.appendChild(monthHeader);
            
            monthRow.appendChild(monthCell);
            table.appendChild(monthRow);
    
            // Create rows for each event in this month
            monthEvents.forEach(event => {
                const row = document.createElement('tr');
                row.classList.add('month-rows'); // Make sure we're using the correct class
                row.style.display = 'none'; // Start hidden

                // Add date cell
                const dateCell = document.createElement('td');
                const dayOfWeek = event.date.toLocaleString('default', { weekday: 'short' });
                dateCell.textContent = `${event.date.toLocaleDateString()} (${dayOfWeek})`;
                row.appendChild(dateCell);
            
                 // Add availability cells for each player
                this.players.forEach(player => {
                    const td = document.createElement('td');
                    const button = document.createElement('button');
                    const key = `${player.id}-${event.id}`;
                    const availability = this.availabilityMap.get(key);
                    const status = availability ? availability.status : '-';
                    
                    button.className = `status-${status}`;
                    button.textContent = status;
                    button.dataset.eventId = event.id;
                    button.dataset.playerId = player.id;
                    
                    button.addEventListener('click', () => {
                        const currentStatus = button.textContent;
                        const newStatus = this.cycleStatus(currentStatus);
                        this.setAvailability(player.id, event.id, newStatus);
                        button.className = `status-${newStatus}`;
                        button.textContent = newStatus;
                        console.log(`Status changed from ${currentStatus} to ${newStatus}`);
                    });
                    
                    td.appendChild(button);
                    row.appendChild(td);
                });

            
                table.appendChild(row);
            });
        });
    
        // Add click handlers for month labels
        table.querySelectorAll('.monthLabel').forEach(monthLabel => {
            monthLabel.addEventListener('click', () => {
                console.log('Month label clicked');
                monthLabel.classList.toggle('collapsed');
                
                // Get all following month-rows until next monthLabel
                let currentElement = monthLabel.nextElementSibling;
                while (currentElement && !currentElement.classList.contains('monthLabel')) {
                    if (currentElement.classList.contains('month-rows')) {
                        if (monthLabel.classList.contains('collapsed')) {
                            currentElement.style.display = 'none';
                        } else {
                            currentElement.style.display = '';
                        }
                    }
                    currentElement = currentElement.nextElementSibling;
                }
            });
        });
    
        container.appendChild(table);
        return container;
    }
    
   
    addUser(nickname, id) {
        this.players.push({ id, nickname });
    }

    setInitialAvailability(availabilityData) {
        if (!Array.isArray(availabilityData)) {
            console.warn('Availability data is not an array:', availabilityData);
            return;
        }
    
        availabilityData.forEach(record => {
            if (record.userId && record.date && record.status) {
                // Find matching event
                const event = this.events.find(e => {
                    const eventDate = new Date(e.date);
                    const eventDateStr = eventDate.toISOString().split('T')[0];
                    return record.date === eventDateStr;
                });
    
                if (event) {
                    const key = `${record.userId}-${event.id}`;
                    this.availabilityMap.set(key, { status: record.status });
//                    console.log(`Set initial availability for ${key} to ${record.status}`);
                }
            }
        });
    }
    
    getAvailability(userId, eventId) {
        const key = `${userId}-${eventId}`;
        return this.availabilityMap.get(key) || { status: '-' }; // Default to '-'
    }

    setAvailability(userId, eventId, status) {
        const key = `${userId}-${eventId}`;
        this.availabilityMap.set(key, { status });
        this.hasUnsavedChanges = true;
        console.log(`Set availability for ${key} to ${status}`);
    }

    cycleStatus(currentStatus) {
        const states = ['-', 'Y', 'N', 'M'];
        const currentIndex = states.indexOf(currentStatus);
        const nextIndex = (currentIndex + 1) % states.length;
        return states[nextIndex];
    }

    async saveChanges() {
        if (!this.hasUnsavedChanges) {
            console.log('No changes to save');
            return;
        }

        try {
            // Convert availabilityMap to the format expected by the backend
            console.log('Current availabilityMap:', this.availabilityMap);
            console.log('AvailabilityMap size:', this.availabilityMap.size);

            const updates = [];
            this.availabilityMap.forEach((value, key) => {
                console.log('Processing key:', key, 'value:', value);
                const [userId, eventId] = key.split('-');
                console.log('Split key - userId:', userId, 'eventId:', eventId);

                // Debug the event search
                console.log('Looking for eventId:', eventId);
                console.log('Event IDs in this.events:', this.events.map(e => e.id));
                console.log('Types of IDs - searching for:', typeof eventId, 'in events:', typeof this.events[0]?.id);
                
                const event = this.events.find(e => e.id.startsWith(eventId));
                console.log('Looking for eventId:', eventId, 'Found event:', event);
                
                if (event) {
                    updates.push({
                        userId: userId,
                        date: event.date.toISOString().split('T')[0], // Format: YYYY-MM-DD
                        status: value.status
                    });
                } else {
                    console.warn(`Failed to find event ${eventId} in events array of length ${this.events.length}`);
                }
            });

            console.log('Final updates array:', updates);

            if (updates.length === 0) {
                console.warn('No updates collected - check if availabilityMap is being populated');
                return;
            }
            // Use the DatabaseConnection instance to save
            const response = await api.updateAvailability(updates);
            
            if (response.success) {
                this.hasUnsavedChanges = false;
                showConfirmation('Calendar updated successfully!');
                return true;
            } else {
                throw new Error('Failed to save changes');
            }
        } catch (error) {
            console.error('Error saving changes:', error);
            throw error;
        }
    }

}
class DatabaseConnection {
    constructor(apiUrl) {
        this.apiUrl = apiUrl;
        this.headers = {
            'Content-Type': 'application/json'
        };
        // Log the initialization
/*
        console.log('DatabaseConnection initialized with:', {
            apiUrl: this.apiUrl,
            headers: this.headers
        });
*/

    }

    validateUpdate(update) {
        // Check if all required fields are present
        if (!update.userId || !update.date || !update.status) {
            throw new Error('Missing required fields');
        }

        // Validate date format (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(update.date)) {
            throw new Error('Invalid date format. Use YYYY-MM-DD');
        }

        // Validate status
        const validStatuses = ['Y', 'N', 'M', '-'];
        if (!validStatuses.includes(update.status)) {
            throw new Error('Invalid status. Must be Y, N, M, or -');
        }

        return true;
    }

    extractUsersFromAvailability(availabilityData) {
        console.log('Extracting players from:', availabilityData);
        
        if (!availabilityData || !Array.isArray(availabilityData)) {
            console.log('No availability data to extract players from');
            return [];
        }

        // Get unique players
        const uniqueUsers = new Map();
        
        availabilityData.forEach(item => {
            if (item && item.player) {
                uniqueUsers.set(item.userId, {
                    id: item.userId,
                    name: item.userId
                });
            }
        });

        const players = Array.from(uniqueUsers.values());
        console.log('Extracted players:', players);
        return players;
    }

    async getUsers() {
        try {
            // Use the getavailability endpoint instead
            const response = await fetch(`${this.apiUrl}/availability`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
    
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
    
            const data = await response.json();
            console.log('Raw availability data for players:', data);
    
            // Extract unique players from the availability data
            const uniqueUsers = new Map(); // Using Map to ensure uniqueness by user ID
            
            if (Array.isArray(data)) {
                data.forEach(item => {
                    if (item.userId) {  
                        uniqueUsers.set(item.userId, {
                            id: item.userId,
                            name: item.userId
                        });
                    }
                });
            }
    
            const players = Array.from(uniqueUsers.values());
            console.log('Extracted players:', players);
            return players;
    
        } catch (error) {
            console.error('Error fetching players from availability:', error);
            return [];
        }
    }

    async getAvailability() {
        try {
            console.log('Starting getAvailability() method...');
            const response = await fetch(`${this.apiUrl}/availability/`, {
                method: 'GET',
                headers: this.headers
            });
    
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('Error response:', errorData);
                throw new Error(`HTTP error! status: ${response.status}`);
            }
    
            const data = await response.json();
/*            console.log('Raw availability data from API:', data);
           console.log('Type of data:', typeof data);
           console.log('Is Array?', Array.isArray(data));
            if (Array.isArray(data)) {
                console.log('Array length:', data.length);
                console.log('First item:', data[0]);
            }
*/
            return data;
        } catch (error) {
            console.error('Error fetching availability:', error);
            return [];
        }
    }

    async updateAvailability(updates) {
        try {
            const results = [];
            for (const update of updates) {
                const formattedUpdate = {
                    userId: update.userId,
                    date: update.date,
                    status: update.status
                };
    
                console.log('Sending update:', formattedUpdate);
    
                const response = await fetch(`${this.apiUrl}/availability`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formattedUpdate) // Send single update
                });
            
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    console.error('Error response:', errorData);
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                results.push(await response.json());
                
            }

            return { success: true, results };

        } catch (error) {
            console.error('Error updating availability:', error);
            throw error;
        }
    }    
}


// 3. UTILITY FUNCTIONS
function preventFormSubmission(event) {
    event.preventDefault();
    return false;
}
function showError(message) {
    const errorDiv = document.getElementById('error-container') 
        || document.createElement('div');
    errorDiv.id = 'error-container';
    errorDiv.textContent = message;
    errorDiv.style.color = 'red';
    document.body.insertBefore(errorDiv, document.body.firstChild);
}
function hideLoading() {
    // Hide your loading indicator
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
}
function showLoading() {
    // Add your loading indicator logic
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
        loadingElement.style.display = 'block';
    }
}
function getNextRows(monthLabel) {
    const rows = [];
    let current = monthLabel.nextElementSibling;
    while (current && !current.classList.contains('monthLabel')) {
        rows.push(current);
        current = current.nextElementSibling;
    }
    return rows;
}
function handleAsyncOperation(operation) {
    return async (...args) => {
        try {
            const result = await operation(...args);
            return result;
        } catch (error) {
            console.error(`Operation failed: ${error.message}`);
            // You might want to show this error to the user
            throw error;
        }
    };
}
function logApiEndpoints() {
    console.log('API Endpoints Configuration:');
    console.log('Base URL:', api.apiUrl);
    console.log('Users endpoint:', `${api.apiUrl}/players`);
    console.log('Availability endpoint:', `${api.apiUrl}/availability`);
    console.log('Headers:', api.headers);
}
function validatePlayersData(playersData) {
    if (!playersData || !playersData.members) {
        throw new Error('Invalid players data structure - missing members array');
    }
    
    const players = playersData.members;
    if (!Array.isArray(players)) {
        throw new Error('Players members must be an array');
    }
    
    return players.map(player => {
        if (!player.id || !player.nickname) {
            throw new Error('Each player must have an id and nickname');
        }
        return {
            nickname: player.nickname,
            id: player.id,
            initials: player.initials // Including initials in case you want to use them
        };
    });
}
function showConfirmation(message) {
    const confirmationDiv = document.getElementById('confirmation-container') || document.createElement('div');
    confirmationDiv.id = 'confirmation-container';
    confirmationDiv.textContent = message;
    confirmationDiv.style.color = 'green';
    confirmationDiv.style.position = 'fixed';
    confirmationDiv.style.top = '10px';
    confirmationDiv.style.right = '10px';
    confirmationDiv.style.backgroundColor = 'white';
    confirmationDiv.style.border = '1px solid green';
    confirmationDiv.style.padding = '10px';
    confirmationDiv.style.zIndex = '1000';
    document.body.appendChild(confirmationDiv);

    // Automatically hide the confirmation message after 3 seconds
    setTimeout(() => {
        confirmationDiv.remove();
    }, 3000);
}


// 4. INITIALIZATION FUNCTIONS

// Modified initialization function

async function simpleTest() {
    try {
//        console.log('Starting simple test...');
        const response = await fetch('https://yo6lbyfxd1.execute-api.us-east-1.amazonaws.com/prod/availability', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
//       console.log('Simple test response:', response);
        const data = await response.json();
//        console.log('Simple test data:', data);
    } catch (error) {
        console.error('Simple test failed:', error);
    }
}

// Add this function to fetch dates from dates.json
async function getExemptDatesFromJson() {
    try {
        const response = await fetch('/static/dates.json');
        const data = await response.json();
        return data.dates.exempt || [];
    } catch (error) {
        console.error('Error fetching exempt dates:', error);
        return [];
    }
}

async function initializeCalendar() {
    try {
        console.log('Starting calendar initialization...');
        showLoading();
        
        // Load players from players.json
        try {
            const response = await fetch('/static/players.json');  // Adjust path if needed
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const playersData = await response.json();
 //           console.log('Loaded players data:', playersData);

            // Create calendar instance if it doesn't exist
            if (!window.calendar) {
                window.calendar = new EventCalendar();
            }
            
            // Add players to calendar
            if (playersData && playersData.members && playersData.members.length > 0) {
                const validatedPlayers = validatePlayersData(playersData);
                validatedPlayers.forEach(player => {
                    calendar.addUser(player.nickname, player.id || player.nickname); // Use name as ID if no ID provided
                });
//               console.log('Players added to calendar:', calendar.players);
            } else {
//                console.warn('No players found in players.json');
            }
        } catch (error) {
            console.error('Error loading players.json:', error);
            throw error;
        }

        // First add recurring events so they exist before setting availability
        const response = await fetch('/static/dates.json?v=' + new Date().getTime());
        const datesData = await response.json();
        console.log('Gamedays from JSON:', datesData.dates.gamedays);
        
        calendar.addRecurringEvents(
            null, 
            null, 
            'Game Day',
            {
                daysOfWeek: datesData.dates.gamedays,
                customExcludeDates: datesData.dates.exempt
            }
        );
        
        
        // Get availability data first
        const availabilityData = await api.getAvailability();

/*
        console.log('Availability data structure:', {
            isArray: Array.isArray(availabilityData),
            length: availabilityData?.length,
            firstItem: availabilityData?.[0],
            keys: availabilityData?.[0] ? Object.keys(availabilityData[0]) : null
        });
*/
        // Set initial availability
        calendar.setInitialAvailability(availabilityData);
  //      console.log('Initial availability set');
        
        // Debug: Check a few random entries
        if (calendar.events.length > 0 && calendar.players.length > 0) {
            const testEvent = calendar.events[0];
            const testPlayer = calendar.players[0];
/*
            console.log('Test availability check:', {
                player: testPlayer.id,
                event: testEvent.id,
                availability: calendar.getAvailability(testPlayer.id, testEvent.id)
            });

*/
        }

        const calendarContainer = document.getElementById('calendar-container');
        if (!calendarContainer) {
            console.error('Calendar container is null');
            return;
        }
        
        if (!calendar.players.length) {
            console.error('No players loaded');
            return;
        }

 //       console.log('Found calendar container, about to render');
        calendarContainer.innerHTML = '';
        const calendarElement = calendar.renderCalendar();
        calendarContainer.appendChild(calendarElement);
 //       console.log('Calendar rendered successfully');

    } catch (error) {
        console.error('Failed to initialize calendar:', error);
        showError('Failed to load calendar data. Please check your connection and try again.');
    } finally {
        hideLoading();
    }
}

// 5.   CREATE INSTANCES
const calendar = new EventCalendar();
const api = new DatabaseConnection('https://yo6lbyfxd1.execute-api.us-east-1.amazonaws.com/prod');


// 6. EVENT LISTENERS 
// Initialize when the page loads
document.addEventListener('DOMContentLoaded', async (event) => {
    console.clear();
    console.log('Starting calendar initialization...');
    
    // First, verify the save button exists
    const saveButton = document.getElementById('save-availability');
    console.log('Save button found:', saveButton); // Debug log
    
    const container = document.getElementById('calendar-container');
    if (!container) {
        console.error('Calendar container not found in DOM');
        return;
    }

    try {
        // Use the existing global calendar instance instead of creating a new one
        // Remove this line: const calendar = new EventCalendar();
        
        // Load player data first
        console.log('Loading player data...');
        await calendar.loadPlayerData();
        
        // Add recurring events
        console.log('Adding recurring events...');
        await calendar.addRecurringEvents();
        
        // Initialize rest of calendar
        console.log('Getting availability data...');
        const availabilityData = await api.getAvailability();
        console.log('Availability data received:', availabilityData);
        
        calendar.setInitialAvailability(availabilityData);
        
        // Render calendar
        console.log('Rendering calendar...');
        const calendarElement = calendar.renderCalendar();
        container.appendChild(calendarElement);

        // Add save button handler
        if (saveButton) {
            saveButton.addEventListener('click', async () => {
                try {
                    console.log('Save button clicked');
                    if (!calendar.hasUnsavedChanges) {
                        console.log('No changes to save');
                        return;
                    }
                    
                    const result = await calendar.saveChanges();
                    if (result) {
                        console.log('Changes saved successfully');
                    } else {
                        console.error('Save failed');
                    }
                } catch (error) {
                    console.error('Error saving changes:', error);
                }
            });
        } else {
            console.error('Save button not found in DOM');
        }

        console.log('Calendar initialization complete');
    } catch (error) {
        console.error('Calendar initialization failed:', error);
        showError('Failed to initialize the calendar.');
    }
});


// 7. STYLES   
const styles = `
    button.status-- {
        background-color: #f0f0f0;
    }
    button.status-Y {
        background-color: #90EE90;
    }
    button.status-N {
        background-color: #FFB6C1;
    }
    button.status-M {
        background-color: #FFE4B5;
    }
`;

document.head.appendChild(document.createElement('style')).textContent = styles;