// config.js

export const CONFIG = {
    API_URL: 'https://yo6lbyfxd1.execute-api.us-east-1.amazonaws.com/prod/getavailability',
    yearDates: 169,
    yearDays: 24,
    yearGames: 49,
    firstDate: new Date(2025, 4, 11),
    dateFormat: 'YYYY-MM-DD',
    
    api: {
        baseUrl: 'https://yo6lbyfxd1.execute-api.us-east-1.amazonaws.com/prod',
        endpoints: {
            getAvailability: '/getavailability',
            updateAvailability: '/updateavailability'
        }
    },

    ui: {
        styles: {
            colors: {
                available: '#90EE90',
                unavailable: '#FFB6C1',
                unknown: '#FFFFFF',
                hover: '#f0f0f0',
                border: '#ccc'
            },
            calendar: {
                cellWidth: '40px',
                cellHeight: '40px',
                cellPadding: '8px'
            }
        },
        loadingIndicator: {
            message: 'Loading...',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            zIndex: 1000
        }
    },
    player: {
        defaultStatus: 'unknown',
        availabilityStates: ['unknown', 'available', 'unavailable'],
        maxPlayers: 100
    },
    validation: {
        hashLength: 8,
        requiredFields: ['date', 'status', 'player']
    }
};

// For environment-specific settings, we'll hardcode them for now
export const ENV_CONFIG = {
    environment: 'development',
    isProduction: false,
    apiKey: null,
    debug: true
};

export const MESSAGES = {
    errors: {
        noPlayer: 'No player selected',
        invalidChanges: 'Invalid changes detected',
        saveFailed: 'Error saving changes. Please try again.',
        apiError: 'Error connecting to the server'
    },
    success: {
        changesSaved: 'Changes saved successfully'
    },
    confirmations: {
        submitChanges: 'Are you sure you want to submit these changes?'
    }
};

export const CSS_CLASSES = {
    calendar: {
        container: 'calendar-month',
        table: 'calendar',
        gameDate: 'game-date',
        available: 'available',
        unavailable: 'unavailable',
        unknown: 'unknown'
    },
    loading: {
        container: 'loading',
        visible: 'loading-visible'
    }
};

// Freeze all configurations to prevent modifications
Object.freeze(CONFIG);
Object.freeze(ENV_CONFIG);
Object.freeze(MESSAGES);
Object.freeze(CSS_CLASSES);
