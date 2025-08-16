document.addEventListener('DOMContentLoaded', () => {
    const errorMessageElement = document.getElementById('error-message');
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    
    errorMessageElement.textContent = `Reason: ${error || 'Unknown error.'}`;
    
    document.getElementById('settings-link').addEventListener('click', (e) => {
        e.preventDefault();
        chrome.runtime.sendMessage({ action: 'open_settings' });
    });
});