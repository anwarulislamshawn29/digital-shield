// file: tab_locker.js

(() => {
    // Avoid re-injecting the lock screen if it already exists
    if (document.getElementById('digital-shield-lock-overlay')) {
        return;
    }

    // --- Helper Function to Hash PIN ---
    async function hashText(text) {
        const encoder = new TextEncoder();
        const data = encoder.encode(text);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // --- Create the Lock Screen UI ---
    const overlay = document.createElement('div');
    overlay.id = 'digital-shield-lock-overlay';
    overlay.innerHTML = `
        <div class="dsl-container">
            <i class="fas fa-lock dsl-icon"></i>
            <h1 class="dsl-title">Tab Locked</h1>
            <p class="dsl-subtitle">Enter your 4-digit PIN to unlock this tab.</p>
            <div class="dsl-pin-inputs">
                <input type="password" class="dsl-pin-input" maxlength="1" pattern="[0-9]*" inputmode="numeric">
                <input type="password" class="dsl-pin-input" maxlength="1" pattern="[0-9]*" inputmode="numeric">
                <input type="password" class="dsl-pin-input" maxlength="1" pattern="[0-9]*" inputmode="numeric">
                <input type="password" class="dsl-pin-input" maxlength="1" pattern="[0-9]*" inputmode="numeric">
            </div>
            <div class="dsl-error-message" id="dsl-error-message"></div>
        </div>
    `;
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden'; // Prevent scrolling of the original page

    const pinInputs = overlay.querySelectorAll('.dsl-pin-input');
    const errorMessage = overlay.querySelector('#dsl-error-message');

    // --- PIN Verification Logic ---
    async function verifyPin() {
        const enteredPin = Array.from(pinInputs).map(input => input.value).join('');
        if (enteredPin.length !== 4) return;

        const hashedPin = await hashText(enteredPin);
        
        // Ask the background script to verify the PIN
        chrome.runtime.sendMessage({ action: 'verify_pin_for_unlock', hashedPin }, (response) => {
            if (response && response.unlocked) {
                // On success, remove the overlay
                overlay.remove();
                document.body.style.overflow = 'auto';
            } else {
                errorMessage.textContent = 'Incorrect PIN. Please try again.';
                pinInputs.forEach(input => input.value = '');
                pinInputs[0].focus();
            }
        });
    }

    // --- Event Listeners for PIN Inputs ---
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

    pinInputs[0].focus();
})();
