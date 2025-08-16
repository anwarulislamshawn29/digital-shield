(() => {
    // Constants for configuration
    const CONFIG = {
        FEATURE_KEY: 'darkMode',
        STYLE_ID: 'digital-shield-dark-mode-style',
        DARK_MODE_CSS: `
            html {
                filter: invert(1) hue-rotate(180deg) !important;
            }
            img, picture, video {
                filter: invert(1) hue-rotate(180deg) !important;
            }
        `
    };

    // State management
    let isDarkModeEnabled = false;

    // Utility to create or remove stylesheet
    const toggleStylesheet = (enable) => {
        try {
            const existingStyle = document.getElementById(CONFIG.STYLE_ID);
            
            if (enable && !existingStyle) {
                const styleElement = document.createElement('style');
                styleElement.id = CONFIG.STYLE_ID;
                styleElement.textContent = CONFIG.DARK_MODE_CSS;
                document.head.appendChild(styleElement);
            } else if (!enable && existingStyle) {
                existingStyle.remove();
            }
        } catch (error) {
            console.error('Failed to toggle dark mode stylesheet:', error);
        }
    };

    // Initialize dark mode from storage
    const initializeDarkMode = () => {
        chrome.storage.sync.get(CONFIG.FEATURE_KEY, (settings) => {
            try {
                isDarkModeEnabled = !!settings[CONFIG.FEATURE_KEY];
                toggleStylesheet(isDarkModeEnabled);
            } catch (error) {
                console.error('Failed to initialize dark mode:', error);
            }
        });
    };

    // Handle storage changes
    const handleStorageChange = (changes, area) => {
        if (area === 'sync' && changes[CONFIG.FEATURE_KEY]) {
            try {
                isDarkModeEnabled = !!changes[CONFIG.FEATURE_KEY].newValue;
                toggleStylesheet(isDarkModeEnabled);
            } catch (error) {
                console.error('Failed to handle dark mode change:', error);
            }
        }
    };

    // Setup: Initialize and set up listener
    try {
        initializeDarkMode();
        chrome.storage.onChanged.addListener(handleStorageChange);
    } catch (error) {
        console.error('Failed to setup dark mode:', error);
    }
})();