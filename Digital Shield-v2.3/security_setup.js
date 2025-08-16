// file: security_setup.js

document.addEventListener('DOMContentLoaded', () => {
    const setupSection = document.getElementById('setup-section');
    const recoverySection = document.getElementById('recovery-section');
    const headerTitle = document.getElementById('header-title');
    const errorMessage = document.getElementById('error-message');
    const successMessage = document.getElementById('success-message');

    // Setup Form Elements
    const setupForm = document.getElementById('setup-form');
    const newPinInput = document.getElementById('new-pin');
    const confirmPinInput = document.getElementById('confirm-pin');
    const questionSelect = document.getElementById('security-question');
    const answerInput = document.getElementById('security-answer');

    // Recovery Form Elements
    const recoveryForm = document.getElementById('recovery-form');
    const questionDisplay = document.getElementById('security-question-display');
    const recoveryAnswerInput = document.getElementById('recovery-answer');
    const recoveryNewPinInput = document.getElementById('recovery-new-pin');
    const recoveryConfirmPinInput = document.getElementById('recovery-confirm-pin');

    const questionMap = {
        "mother_maiden_name": "What is your mother's maiden name?",
        "first_pet_name": "What was the name of your first pet?",
        "childhood_street": "What street did you grow up on?"
    };

    // --- Helper Functions ---
    async function hashText(text) {
        const encoder = new TextEncoder();
        const data = encoder.encode(text.trim().toLowerCase());
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    function showMessage(element, message, duration = 3000) {
        element.textContent = message;
        element.style.display = 'block';
        setTimeout(() => { element.style.display = 'none'; }, duration);
    }

    // --- Main Logic ---
    async function initialize() {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('recover') === 'true') {
            setupSection.style.display = 'none';
            recoverySection.style.display = 'block';
            headerTitle.innerHTML = '<i class="fas fa-key"></i> PIN Recovery';
            
            const { securityQuestionKey } = await chrome.storage.sync.get('securityQuestionKey');
            if (securityQuestionKey) {
                questionDisplay.textContent = questionMap[securityQuestionKey];
            } else {
                questionDisplay.textContent = 'No security question found.';
            }
        } else {
            const { securityPin } = await chrome.storage.sync.get('securityPin');
            if (securityPin) {
                headerTitle.innerHTML = '<i class="fas fa-user-shield"></i> Change PIN';
            }
        }
    }

    // --- Event Listeners ---
    setupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newPin = newPinInput.value;
        const confirmPin = confirmPinInput.value;
        const questionKey = questionSelect.value;
        const answer = answerInput.value;

        if (newPin.length !== 4 || !/^\d+$/.test(newPin)) {
            return showMessage(errorMessage, 'PIN must be 4 digits.');
        }
        if (newPin !== confirmPin) {
            return showMessage(errorMessage, 'PINs do not match.');
        }
        if (!answer.trim()) {
            return showMessage(errorMessage, 'Security answer cannot be empty.');
        }

        const hashedPin = await hashText(newPin);
        const hashedAnswer = await hashText(answer);

        await chrome.storage.sync.set({
            securityPin: hashedPin,
            securityQuestionKey: questionKey,
            securityAnswerHash: hashedAnswer
        });

        // FIXED: Automatically unlock the session and handle redirection
        await chrome.storage.session.set({ isUnlocked: true, unlockTimestamp: Date.now() });

        const urlParams = new URLSearchParams(window.location.search);
        const targetPage = urlParams.get('target');

        if (targetPage === 'tablock') {
            // If the goal was to lock a tab, show a success modal and lock the tab.
            showMessage(successMessage, 'PIN Setup Successful!', 10000);
            chrome.tabs.query({ active: true, currentWindow: false }, (tabs) => {
                // Find the last active tab that isn't the extension UI
                const lastActiveTab = tabs.find(t => !t.url.startsWith('chrome-extension://'));
                if (lastActiveTab) {
                    chrome.runtime.sendMessage({ action: 'lock_tab', tabId: lastActiveTab.id });
                }
            });
            setTimeout(() => window.close(), 2000);

        } else if (targetPage) {
            // If the goal was to open a page like notes or passwords
            showMessage(successMessage, 'Success! Redirecting you...', 2000);
            setTimeout(() => {
                chrome.windows.create({ url: chrome.runtime.getURL(targetPage), type: 'popup', width: 500, height: 600 });
                window.close();
            }, 2000);

        } else {
            // Default case if no target was specified
            showMessage(successMessage, 'Security settings saved! You can close this window.');
            setupForm.reset();
        }
    });

    recoveryForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const answer = recoveryAnswerInput.value;
        const newPin = recoveryNewPinInput.value;
        const confirmPin = recoveryConfirmPinInput.value;

        const { securityAnswerHash } = await chrome.storage.sync.get('securityAnswerHash');
        const hashedAnswer = await hashText(answer);

        if (hashedAnswer !== securityAnswerHash) {
            return showMessage(errorMessage, 'Security answer is incorrect.');
        }
        if (newPin.length !== 4 || !/^\d+$/.test(newPin)) {
            return showMessage(errorMessage, 'New PIN must be 4 digits.');
        }
        if (newPin !== confirmPin) {
            return showMessage(errorMessage, 'New PINs do not match.');
        }

        const hashedPin = await hashText(newPin);
        await chrome.storage.sync.set({ securityPin: hashedPin });

        showMessage(successMessage, 'PIN has been reset! You can close this window.');
        recoveryForm.reset();
    });

    initialize();
});
