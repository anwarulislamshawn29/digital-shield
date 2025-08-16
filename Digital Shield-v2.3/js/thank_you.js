document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('settings-link').addEventListener('click', (e) => {
        e.preventDefault();
        // This will open the settings page if the user clicks the button
        browser.runtime.sendMessage({ action: 'open_settings' });
    });
});