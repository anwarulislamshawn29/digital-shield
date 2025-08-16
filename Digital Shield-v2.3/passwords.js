// file: passwords.js

document.addEventListener('DOMContentLoaded', async () => {
    // Check for unlock token before proceeding
    const { isUnlocked, unlockTimestamp } = await chrome.storage.session.get(['isUnlocked', 'unlockTimestamp']);
    const now = Date.now();

    // Allow access if unlocked within the last 60 seconds
    if (!isUnlocked || (now - unlockTimestamp > 60000)) {
        document.body.innerHTML = `<div style="text-align: center; padding: 2rem; font-family: 'Inter', sans-serif; color: white;">Access Denied. Please unlock this feature from the main extension popup.</div>`;
        // Invalidate the token
        chrome.storage.session.remove('isUnlocked');
        return;
    }

    // --- Original Password Manager Functionality ---
    const form = document.getElementById('add-credential-form');
    const websiteInput = document.getElementById('website-input');
    const usernameInput = document.getElementById('username-input');
    const passwordInput = document.getElementById('password-input');
    const generatePasswordBtn = document.getElementById('generate-password-btn');
    const credentialList = document.getElementById('credential-list');
    const notificationModal = document.getElementById('notification-modal');
    const notificationMessage = document.getElementById('notification-message');
    
    const STORAGE_KEY = 'digitalShieldPasswords';

    async function loadCredentials() {
        const result = await chrome.storage.local.get([STORAGE_KEY]);
        const credentials = result[STORAGE_KEY] || [];
        
        credentialList.innerHTML = '';
        if (credentials.length === 0) {
            credentialList.innerHTML = `<li style="text-align: center; color: var(--text-secondary-dark);">No credentials saved yet.</li>`;
            return;
        }

        credentials.forEach(cred => {
            const listItem = document.createElement('li');
            listItem.className = 'credential-item';
            listItem.dataset.id = cred.id;
            
            listItem.innerHTML = `
                <div class="credential-info">
                    <div class="website">${cred.website}</div>
                    <div class="username">${cred.username}</div>
                </div>
                <div class="credential-actions">
                    <button class="action-btn copy-username-btn" title="Copy Username"><i class="fas fa-user"></i></button>
                    <button class="action-btn copy-password-btn" title="Copy Password"><i class="fas fa-key"></i></button>
                    <button class="action-btn delete-btn" title="Delete Credential"><i class="fas fa-trash-alt"></i></button>
                </div>
            `;
            credentialList.appendChild(listItem);
        });
    }

    async function saveCredentials(credentials) {
        await chrome.storage.local.set({ [STORAGE_KEY]: credentials });
    }

    function generatePassword() {
        const length = 16;
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
        let password = "";
        for (let i = 0; i < length; ++i) {
            password += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        return password;
    }

    function showNotification(message) {
        if (!notificationModal || !notificationMessage) return;
        notificationMessage.textContent = message;
        notificationModal.classList.add('show');
        setTimeout(() => {
            notificationModal.classList.remove('show');
        }, 2000);
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const result = await chrome.storage.local.get([STORAGE_KEY]);
        const credentials = result[STORAGE_KEY] || [];

        credentials.push({
            id: `cred_${Date.now()}`,
            website: websiteInput.value.trim(),
            username: usernameInput.value.trim(),
            password: passwordInput.value
        });

        await saveCredentials(credentials);
        form.reset();
        showNotification('Credential Saved!');
        loadCredentials();
    });

    credentialList.addEventListener('click', async (e) => {
        const target = e.target.closest('.action-btn');
        if (!target) return;

        const listItem = target.closest('.credential-item');
        const id = listItem.dataset.id;
        const result = await chrome.storage.local.get([STORAGE_KEY]);
        const credentials = result[STORAGE_KEY] || [];
        const cred = credentials.find(c => c.id === id);

        if (target.classList.contains('copy-username-btn')) {
            navigator.clipboard.writeText(cred.username);
            showNotification('Username copied!');
        } else if (target.classList.contains('copy-password-btn')) {
            navigator.clipboard.writeText(cred.password);
            showNotification('Password copied!');
        } else if (target.classList.contains('delete-btn')) {
            const updatedCredentials = credentials.filter(c => c.id !== id);
            await saveCredentials(updatedCredentials);
            showNotification('Credential deleted!');
            loadCredentials();
        }
    });

    generatePasswordBtn.addEventListener('click', () => {
        passwordInput.type = 'text';
        passwordInput.value = generatePassword();
        showNotification('New password generated!');
    });

    passwordInput.addEventListener('focus', () => {
        if (passwordInput.type === 'text') {
            passwordInput.type = 'password';
        }
    });

    loadCredentials();
});
