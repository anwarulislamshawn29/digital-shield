// file: blocked.js

document.addEventListener('DOMContentLoaded', () => {
    const blockedDomainEl = document.getElementById('blocked-domain');
    const customMessageEl = document.getElementById('custom-message');

    // Get the blocked domain from the URL query parameter
    const urlParams = new URLSearchParams(window.location.search);
    const blockedDomain = urlParams.get('domain');

    if (blockedDomain) {
        blockedDomainEl.textContent = blockedDomain;
    }

    // Load the custom message from storage
    chrome.storage.sync.get('firewallBlockMessage', (data) => {
        if (data.firewallBlockMessage) {
            // Inject the custom message, replacing the placeholder for the domain
            customMessageEl.innerHTML = data.firewallBlockMessage.replace('{domain}', `<strong id="blocked-domain">${blockedDomain || 'this site'}</strong>`);
        }
    });
});
