// 1. IMPORTS
import { getPlayers, getDates, showLoader, hideLoader } from "./commonscripts.js";

console.log("Starting availabilitynew.js");
// console.log("Player data:", playerData);
// console.log("Dates data:", dateData);


// 2. CLASS DEFINITIONS
class EventCalendar {
    constructor(events, savedAvailabilityMap = new Map(), userId) {
        this.events = [];
        this.players = [];
//        this.userId = userId;
        this.availabilityMap = new Map();
        this.eventIndex = new Map()
        this.hasUnsavedChanges = false;
    }
    createEventIndex() {
        this.eventIndex.clear(); // Clear any existing entries
        this.events.forEach((event, index) => {
            this.eventIndex.set(event.id, index);
//            console.log(`Mapping event ID ${event.id} to index ${index}`);
        });
        console.log('Event index created:', this.eventIndex);
    }
    
    addEvent(date, title) {
        const event = {
            id: crypto.randomUUID(),
            date: new Date(date),
            title: title
        };
        this.events.push(event);
        return event;
    }

    async getExemptDatesFromJson() {

        try {
            const response = await getDates();
            const data = await response.json();
//            return datesData.dates.exempt || [];
            return datesData;
        } catch (error) {
            console.error('Error fetching exempt dates:', error);
            return [];
        }
    }

// In the EventCalendar class, modify the loadPlayerData method:
    async loadPlayerData() {
        try {
            const playerData = await getPlayers(); // Using imported getPlayers function
            // Use players_bj.players array since that's the active player list
            this.players = playerData.players_bj.players.map(player => ({
                id: player.id,
                nickname: player.nickname
            }));
            console.log('Players loaded:', this.players);
        } catch (error) {
            console.error('Error loading player data:', error);
            this.players = [];
        }
}


    async loadAvailabilityData() {
        try {
            const players = await api.getAvailability();
            console.log('Players with availability:', players);
            
            // Simple loop to populate availabilityMap
            players.forEach(player => {
                const nickname = player.nickname;
                const dates = player.dates || {};
                
                Object.entries(dates).forEach(([dateIndex, status]) => {
                    const event = this.events[dateIndex];
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

    async addRecurringEvents(eventStartDate, eventEndDate, title, datesData) {
        console.log('Adding recurring events...');
        console.log('datesData:', datesData);
        try {
            const response = await fetch('/static/dates.json');
            const datesData = await response.json();
            
            const startDate = new Date(datesData.dates.opening || eventStartDate);
            const endDate = new Date(datesData.dates.closing || eventEndDate);
            const daysOfWeek = datesData.dates.gamedays || [3, 6];
            const exemptDates = datesData.dates.exempt || [];
            
            let currentDate = new Date(startDate);
            
            while (currentDate <= endDate) {
                const dayOfWeek = currentDate.getDay();
                if (daysOfWeek.includes(dayOfWeek) && 
                    !exemptDates.includes(currentDate.toISOString().split('T')[0])) {
                    const event = {
                        id: crypto.randomUUID(),
                        date: new Date(currentDate),
                        title: title
                    };
                    this.events.push(event);
                }
                currentDate.setDate(currentDate.getDate() + 1);
            }
            
            // Create index mapping after adding all events
            this.createEventIndex();
            console.log('Events array:', this.events);
        } catch (error) {
            console.error('Error in addRecurringEvents:', error);
        }
    }
          
    renderCalendar() {
//  console.log('Starting renderCalendar');
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
        const headerRow = document.createElement('tr');
        const cornerCell = document.createElement('td');
        headerRow.appendChild(cornerCell);
    
        // Add player nicknames to header
        this.players.forEach(player => {
            const td = document.createElement('td');
            td.textContent = player.nickname || `Player(${player.id})`;
            headerRow.appendChild(td);
//            console.log('Player:', player);
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
    
//        console.log('Availabilty Map: ', this.availabilityMap);

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
            
 //             console.log('Event:', event);
//                console.log('dateCell:', dateCell);

                 // Add availability cells for each player
                this.players.forEach(player => {
                    const td = document.createElement('td');
                    const button = document.createElement('button');
                    const key = `${player.nickname}-${event.id}`;

/*                    console.log(`Rendering cell for ${key}`, {
                        hasAvailability: this.availabilityMap.has(key),
                        availabilityValue: this.availabilityMap.get(key)
                    });
*/                    
                    const availability = this.availabilityMap.get(key);
                    const status = availability ? availability.status : '-';
//                    console.log('key: ', key, 'availability: ', availability, 'status :',status);
                    button.className = `status-${status}`;
                    button.textContent = status;
                    button.dataset.eventId = event.id;
                    button.dataset.playerId = player.id;
                    
                    button.addEventListener('click', () => {
                        const currentStatus = button.textContent;
                        const newStatus = this.cycleStatus(currentStatus);
                        console.log('Setting availability:', {
                            playerId: player.nickname,
                            eventId: event.id,
                            newStatus: newStatus
                        });
                        this.setAvailability(player.nickname, event.id, newStatus);
                        button.className = `status-${newStatus}`;
                        button.textContent = newStatus;
                        this.hasUnsavedChanges = true;
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
       
    addUser(nickname, id) {
        this.players.push({ id, nickname });
    }

    setInitialAvailability(availabilityData) {
        console.log('Setting initial availability with:', availabilityData);
        
        if (!availabilityData || !Array.isArray(availabilityData)) {
            console.warn('No availability data to set');
            return;
        }
    
        availabilityData.forEach(playerData => {
            const nickname = playerData.nickname;
            const dates = playerData.dates || {};
            
//            console.log(`Processing player ${nickname} with dates:`, dates);
            
            // Convert the dates object to availabilityMap entries
            Object.entries(dates).forEach(([index, statusObj]) => {
                const event = this.events[parseInt(index)];
                if (event) {
                    const key = `${nickname}-${event.id}`;
                    const status = statusObj.S || '-';
//                    console.log(`Setting availability for ${key} to ${status}`);
                    this.availabilityMap.set(key, { status });
                }
            });
        });
        
        console.log('Final availabilityMap:', this.availabilityMap);
    }
    
    setAvailability(userId, eventId, status) {
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
        const states = ['-', 'Y', 'N', 'M'];
        const currentIndex = states.indexOf(currentStatus);
        const nextIndex = (currentIndex + 1) % states.length;
        return states[nextIndex];
    }

    async saveChanges() {
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
//                console.log('Saving update for player:', update.nickname, update);
                await api.updateAvailability(update);
            }
            return { success: true };
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

    async getAvailability() {
        try {
            const response = await fetch(`${this.apiUrl}/availability/`, {
                method: 'GET',
                headers: this.headers
            });
    
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
    
            const data = await response.json();
            console.log('Raw data from backend:', data.players);
            return data.players;  // Just return the players array directly
        } catch (error) {
            console.error('Error fetching availability:', error);
            return [];
        }
    }
    
    async updateAvailability(update) {
        try {
            const response = await fetch(`${this.apiUrl}/availability`, {
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

// 5.   CREATE INSTANCES
// Where the calendar is created (likely in your initialization code)

const api = new DatabaseConnection('https://yo6lbyfxd1.execute-api.us-east-1.amazonaws.com/prod');

// 6. EVENT LISTENERS 
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
        await calendar.addRecurringEvents();
   
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
            saveButton.addEventListener('click', async () => {
                try {
                    if (!calendar.hasUnsavedChanges) return;
                    
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