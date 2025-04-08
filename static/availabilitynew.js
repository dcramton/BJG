// 1. IMPORTS
import { getPlayers, getDates, showLoader, hideLoader } from "./commonscripts.js";
const bjapi_url = "https://yo6lbyfxd1.execute-api.us-east-1.amazonaws.com/prod/";

// 2. CLASS DEFINITIONS
class EventCalendar {
    constructor() {
        this.events = [];
        this.players = [];
//        this.userId = userId;
        this.availabilityMap = new Map();
        this.eventIndex = new Map()
        this.hasUnsavedChanges = false;
        this.dbConnection = new DatabaseConnection(bjapi_url); 
    }

    async loadPlayerData() {
        console.log('Loading player data...');
        try {
            const playerData = await getPlayers(); // Using imported getPlayers function
            this.players = playerData.players_all.players.map(player => ({
                id: player.id,
                nickname: player.nickname
            }));
            console.log('Players loaded:', this.players);
        } catch (error) {
            console.error('Error loading player data:', error);
            this.players = [];
        }
}

    async addDefinedEvents(title) {
        console.log('Adding recurring events...');
        try {
            const dateData = await getDates();
            console.log('Date data:', dateData);

            if (!dateData?.keyDates?.openDate || !dateData?.keyDates?.closeDate) {
                throw new Error('Invalid date data: missing required dates');
            }

            console.log('Date data:', dateData);
            let currentDate = new Date(dateData.keyDates.openDate);
            let finalDate = new Date(dateData.keyDates.closeDate);
            const excludeDates = dateData.keyDates.excludeDates || [];
            const gameDays = dateData.keyDates.gameDays || [];
            const daysOfWeek = [3, 6];

            console.log('Key dates:', dateData.keyDates);
            console.log('Excluced dates:', dateData.excludeDates);
           
            while (currentDate <= finalDate) {
                const dayOfWeek = currentDate.getDay();
//                console.log('Current day of week:', dayOfWeek);
                if (daysOfWeek.includes(dayOfWeek) && 
                    !dateData.excludeDates.includes(currentDate.toISOString().split('T')[0])) {
                    const event = {
                        id: crypto.randomUUID(),
                        date: new Date(currentDate),
                        title: title
                    };
                    this.events.push(event);
                }
                currentDate.setDate(currentDate.getDate() + 1);
            }
//            console.log('Events added:', this.events);
        } catch (error) {
            console.error('Error in addDefinedEvents:', error);
        }
    }

    async createEventIndex() {
//        console.log('Creating event index...');
        this.eventIndex.clear(); // Clear any existing entries
        this.events.forEach((event, index) => {
            this.eventIndex.set(event.id, index);
//            console.log(`Mapping event ID ${event.id} to index ${index}`);
        });
//        console.log('Event index created:', this.eventIndex, 'Events:', this.events);
    }

    async loadAvailabilityData() {    
        console.log('Fetching availability...');
        const myHeaders = new Headers();	
        myHeaders.append('Content-Type', "application/json"); 
        const requestOptions = {
            method: 'GET',
            headers: myHeaders,
            redirect: 'follow'
        };
        let bjapi_avail_url = bjapi_url + "availability";
        try {
            const response = await fetch(bjapi_avail_url, requestOptions); 
    
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
    
            const data = await response.json();
            const players = data.players;
            console.log('Players with availability:', players);

            players.forEach(player => {
                const nickname = player.nickname;
                const dates = player.dates || {};
//                console.log(`Processing player: ${nickname}, Dates:`, dates);
                
                Object.entries(dates).forEach(([dateIndex, status]) => {
                    const event = this.events[dateIndex];
//                    console.log(`Processing event for player ${nickname} and date index ${dateIndex}:`, event);
                    if (event) {
                        const key = `${nickname}-${event.id}`;
                        this.availabilityMap.set(key, { status: status.S });
                    }
                });
            });
    
            console.log('Final availability map:', this.availabilityMap);
        } catch (error) {
            console.error('Error loading availability:', error);
        }
    }

    renderCalendar() {

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
            const monthYear = event.date.toLocaleString('default', { month: 'short', year: 'numeric' });
            if (!eventsByMonth[monthYear]) {
                eventsByMonth[monthYear] = [];
            }
            eventsByMonth[monthYear].push(event);
        });
    
        // Create table for all months
        const table = document.createElement('table');
        table.className = 'availability-calendar';
    
        // Create header row
        console.log("=== HEADER ROW CREATION ===");
        const headerRow = document.createElement('tr');
        const cornerCell = document.createElement('td');0
        cornerCell.textContent = 'Date';
        cornerCell.className = 'debug-col-0';  // Add debug class
        headerRow.appendChild(cornerCell);
        console.log("Column 0: Date (corner cell)");

//      console.log('Players', this.players);
    
        // Add player nicknames to header
        this.players.forEach((player, index) => {
            const td = document.createElement('td');
            td.textContent = player.nickname || `Player(${player.id})`;
            td.className = `debug-col-${index + 1}`;  // Add debug class
            headerRow.appendChild(td);
            console.log(`Column ${index + 1}: ${player.nickname}`);
        });
        table.appendChild(headerRow);

        const spacerRow = document.createElement('tr');
        spacerRow.className = 'availability-header-spacer';
        table.appendChild(spacerRow);

        console.log("=== HEADER ROW STRUCTURE ===");
        console.log("Header row cell count:", headerRow.cells.length);
    
        // Create month sections
        Object.entries(eventsByMonth).forEach(([monthYear, monthEvents]) => {
            // Add month header row
            const monthRow = document.createElement('tr');
            monthRow.className = 'monthLabel collapsed';
            
            const monthCell = document.createElement('td');
//            monthCell.colSpan = this.players.length + 1;  // +1 for the date column
            
            const monthHeader = document.createElement('h3');
            monthHeader.textContent = monthYear;
            monthCell.appendChild(monthHeader);
            
            monthRow.appendChild(monthCell);
            table.appendChild(monthRow);
    
//        console.log('Availabilty Map: ', this.availabilityMap);
//            console.log('Header row players:', this.players.map(p => p.nickname));
            // Create rows for each event in this month
            monthEvents.forEach((event, eventIndex) => {
                console.log(`\n=== DATA ROW ${eventIndex + 1} ===`);
                const row = document.createElement('tr');
                row.classList.add('month-rows'); // Make sure we're using the correct class
                row.style.display = 'none'; // Start hidden

                // Add date cell
                const dateCell = document.createElement('td');
                dateCell.colSpan = 1; 
                console.log('First cell colspan:', dateCell.getAttribute('colspan'));
                console.log('First cell computed style:', window.getComputedStyle(dateCell));
                const dayOfWeek = event.date.toLocaleString('default', { weekday: 'short' });
                dateCell.textContent = `${event.date.toLocaleDateString()} (${dayOfWeek})`;
                dateCell.className = 'debug-col-0';  // Add debug class
                row.appendChild(dateCell);
                console.log(`Column 0: ${dateCell.textContent} (date cell)`);
            
//             console.log('Event:', event);
//                console.log('dateCell:', dateCell);

                 // Add availability cells for each player
                this.players.forEach((player, index) => {
                    const td = document.createElement('td');
//                    if(row.cells[0]) {
//                       console.log(`First cell in row ${index} has colspan:`, row.cells[0].getAttribute('colspan'));
//                    }
                    td.className = `debug-col-${index + 1}`;  // Add debug class
                    const button = document.createElement('button');
                    const key = `${player.nickname}-${event.id}`;

/*                    console.log(`Rendering cell for ${key}`, {
                        hasAvailability: this.availabilityMap.has(key),
                        availabilityValue: this.availabilityMap.get(key)
                    });
*/                    
                    const availability = this.availabilityMap.get(key);
                    const status = availability ? availability.status : '-';
//                    console.log(`Column ${index + 1}: ${player.nickname} (Status: ${status})`);
                    button.className = `status-${status}`;
                    button.textContent = status;
                    button.dataset.eventId = event.id;
                    button.dataset.playerId = player.id;
                    
                    button.addEventListener('click', () => {
                        const currentStatus = button.textContent;
                        const newStatus = this.cycleStatus(currentStatus);
//                        console.log('Setting availability:', {
//                            playerId: player.nickname,
//                            eventId: event.id,
//                            newStatus: newStatus
//                        });
                        this.setAvailability(player.nickname, event.id, newStatus);
                        button.className = `status-${newStatus}`;
                        button.textContent = newStatus;
                        this.hasUnsavedChanges = true;
                    });
                    
                    td.appendChild(button);
                    row.appendChild(td);
                });
            
            // Add debug lines here, just before appending the row
//            console.log(`\n=== DATA ROW ${eventIndex + 1} STRUCTURE ===`);
//            console.log("Data row cell count:", row.cells.length);
//            Array.from(row.cells).slice(0, 3).forEach((cell, i) => {
//                console.log(`Cell ${i} content:`, cell.textContent || cell.innerHTML);
//            });

             table.appendChild(row);
            });
        });
    
        // Add click handlers for month labels
        table.querySelectorAll('.monthLabel').forEach(monthLabel => {
            monthLabel.addEventListener('click', () => {
//                console.log('Month label clicked');
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
  
    setAvailability(userId, eventId, status) {
        console.log('Setting availability:', { userId, eventId, status });
        const key = `${userId}-${eventId}`;
        console.log('setAvailability:', {
            key: key,
            status: status,
            eventId: eventId,
            indexForEvent: this.eventIndex.get(eventId)
        });
        this.availabilityMap.set(key, { status });
        this.hasUnsavedChanges = true;
//        console.log(`Set availability for ${key} to ${status}`);
    }

    cycleStatus(currentStatus) {
        console.log('Cycling status from:', currentStatus);
        const states = ['-', 'Y', 'N'];
        const currentIndex = states.indexOf(currentStatus);
        const nextIndex = (currentIndex + 1) % states.length;
        console.log('Cycled status to:', states[nextIndex]);
        return states[nextIndex];
    }

    async saveChanges() {
        console.log('Saving changes...');
        if (!this.hasUnsavedChanges) return;
    
        // Group availability data by nickname
        const updatesByPlayer = new Map();
    
        this.availabilityMap.forEach((value, key) => {
            const nickname = key.substring(0, key.indexOf('-'));
            const eventId = key.substring(key.indexOf('-') + 1);
            
            // Initialize player's dates map if it doesn't exist
            if (!updatesByPlayer.has(nickname)) {
                updatesByPlayer.set(nickname, {
                    nickname: nickname,
                    dates: {}
                });
            }
            
            const playerUpdate = updatesByPlayer.get(nickname);
            const index = this.eventIndex.get(eventId);
//            console.log(`Processing update for ${nickname} with eventId ${eventId} and index ${index}`);
            
            if (index !== undefined) {
                playerUpdate.dates[index] = { "S": value.status };
//                console.log(`Adding date entry for ${nickname}: index ${index}, status ${value.status}`);
//                console.log('Current dates object for', nickname, ':', playerUpdate.dates);
            } else {
                console.warn(`No index found for eventId: ${eventId}`);
            }
        });
    
        // Save updates for each player
        try {
            for (const update of updatesByPlayer.values()) {
                console.log('Saving update for player:', update.nickname, update);
                await this.dbConnection.updateAvailability(update);
            }
            return { success: true };
        } catch (error) {
            console.error('Error saving changes:', error);
            throw error;
        }
    }
    
         
    }
class DatabaseConnection {

    validateUpdate(update) {
        console.log('Validating...');
        console.log('Update data:', update);
    
        // Check if required fields exist
        if (!update.nickname || !update.dates) {
            throw new Error('Missing required fields');
        }
    
        // Validate dates object structure
        if (typeof update.dates !== 'object') {
            throw new Error('Dates must be an object');
        }
    
        // Validate each date entry
        Object.entries(update.dates).forEach(([index, statusObj]) => {
            // Check if index is a valid number
            if (isNaN(parseInt(index))) {
                throw new Error('Invalid date index');
            }
    
            // Check if status object has correct structure
            if (!statusObj || !statusObj.S) {
                throw new Error('Invalid status object structure');
            }
    
            // Validate status value
            const validStatuses = ['Y', 'N', 'M', '-'];
            if (!validStatuses.includes(statusObj.S)) {
                throw new Error('Invalid status. Must be Y, N, M, or -');
            }
        });
    
        return true;
    }
    
    
    async updateAvailability(update) {          
        console.log('Updating availability...');
        console.log('Update data before validation:', update);
        this.validateUpdate(update);
        console.log('Update data after validation:', update);

        try {
            let bjapi_avail_url = bjapi_url + "availability";
            const response = await fetch(bjapi_avail_url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    nickname: update.nickname,
                    dates: update.dates
                })
            });
    
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('Update result:', result);
            return { success: true, result };
        } catch (error) {
            console.error('Error updating availability:', error);
            throw error;
        }
    }
}

// 3. UTILITY FUNCTIONS
function showError(message) {
    const errorDiv = document.getElementById('error-container') 
        || document.createElement('div');
    errorDiv.id = 'error-container';
    errorDiv.textContent = message;
    errorDiv.style.color = 'red';
    document.body.insertBefore(errorDiv, document.body.firstChild);
}
function hideloader() { 
//    console.log("Hiding loader");
    
    // Try multiple approaches to hide the spinner
    const loader = document.getElementById('loading');
    if (loader) {
        loader.style.display = 'none';
        loader.style.visibility = 'hidden';
//        console.log("Loader hidden by ID");
    }
    
    // Try targeting by class in case ID is wrong
    const spinners = document.getElementsByClassName('spinner-border');
    for (let i = 0; i < spinners.length; i++) {
        spinners[i].style.display = 'none';
        spinners[i].style.visibility = 'hidden';
    }
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

// 4. EVENT LISTENERS 
// Initialize when the page loads
document.addEventListener('DOMContentLoaded', async () => {
    const saveButton = document.getElementById('save-availability');
    const container = document.getElementById('calendar-container');
    
    try {
        // Create calendar instance
        const calendar = new EventCalendar();   

        // Load players first
        await calendar.loadPlayerData();
        
        // Create all game dates
        await calendar.addDefinedEvents();
   
        // Create index mapping
        calendar.createEventIndex();

        // Load availability data
        await calendar.loadAvailabilityData();
        
        console.log('Calendar state before render:', {
            events: calendar.events.length,
            players: calendar.players.length,
            availabilityEntries: calendar.availabilityMap.size
        });
        
        // Render the calendar
        const calendarElement = calendar.renderCalendar();
        container.appendChild(calendarElement);

        // Add save button handler
        if (saveButton) {
            console.log('Save button found:', saveButton);
            saveButton.addEventListener('click', async () => {
                console.log('Save button clicked');
                try {
                    if (!calendar.hasUnsavedChanges) {
                        showConfirmation('No changes to save');
                        return;
                    
                    }
                    const result = await calendar.saveChanges();
                    if (result && result.success) {
                        showConfirmation('Changes saved successfully');
                        calendar.hasUnsavedChanges = false;
                    }
                } catch (error) {
                    console.error('Error saving changes:', error);
                    showError('Failed to save changes');
                }
            });
        }
    } catch (error) {
        console.error('Calendar initialization failed:', error);
        showError('Failed to initialize the calendar.');
    } finally {
        hideloader();
    }
});

// 5. STYLES   
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