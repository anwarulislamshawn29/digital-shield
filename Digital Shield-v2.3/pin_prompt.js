// file: pin_prompt.js

document.addEventListener('DOMContentLoaded', () => {
    const pinInputs = document.querySelectorAll('.pin-input');
    const errorMessage = document.getElementById('error-message');
    const forgotPinLink = document.getElementById('forgot-pin-link');

    const urlParams = new URLSearchParams(window.location.search);
    const targetPage = urlParams.get('target');

    // Function to hash text using SHA-256
    async function hashText(text) {
        const encoder = new TextEncoder();
        const data = encoder.encode(text);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // Function to verify the entered PIN
    async function verifyPin() {
        const enteredPin = Array.from(pinInputs).map(input => input.value).join('');
        if (enteredPin.length !== 4) return;

        const hashedPin = await hashText(enteredPin);
        
        chrome.storage.sync.get('securityPin', async (data) => {
            if (data.securityPin && data.securityPin === hashedPin) {
                // On success, set a session token to grant access
                await chrome.storage.session.set({ isUnlocked: true, unlockTimestamp: Date.now() });
                
                // Open the target page and close the prompt
                chrome.windows.create({ url: chrome.runtime.getURL(targetPage), type: 'popup', width: 500, height: 600 });
                window.close();
            } else {
                errorMessage.textContent = 'Incorrect PIN. Please try again.';
                pinInputs.forEach(input => input.value = '');
                pinInputs[0].focus();
            }
        });
    }

    // Auto-focus and auto-tab logic for PIN inputs
    pinInputs.forEach((input, index) => {
        input.addEventListener('input', () => {
            if (input.value && index < pinInputs.length - 1) {
                pinInputs[index + 1].focus();
            }
            if (Array.from(pinInputs).every(i => i.value)) {
                verifyPin();
            }
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !input.value && index > 0) {
                pinInputs[index - 1].focus();
            }
        });
    });

    // Handle forgot PIN link click
    forgotPinLink.addEventListener('click', (e) => {
        e.preventDefault();
        chrome.windows.create({ url: chrome.runtime.getURL('security_setup.html?recover=true'), type: 'popup', width: 450, height: 550 });
        window.close();
    });

    // Set initial focus
    pinInputs[0].focus();
});
