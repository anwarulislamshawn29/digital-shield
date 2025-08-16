// file: notes.js

document.addEventListener('DOMContentLoaded', async () => {
    // Check for unlock token before proceeding
    const { isUnlocked, unlockTimestamp } = await chrome.storage.session.get(['isUnlocked', 'unlockTimestamp']);
    const now = Date.now();

    // Allow access if unlocked within the last 60 seconds
    if (!isUnlocked || (now - unlockTimestamp > 60000)) {
        document.body.innerHTML = `<div style="text-align: center; padding: 2rem; font-family: 'Inter', sans-serif;">Access Denied. Please unlock this feature from the main extension popup.</div>`;
        // Invalidate the token
        chrome.storage.session.remove('isUnlocked');
        return;
    }

    // --- Original Notes Functionality ---
    const noteTextarea = document.getElementById('note-textarea');
    const saveButton = document.getElementById('save-button');
    const saveStatus = document.getElementById('save-status');

    const loadNotes = () => {
        chrome.storage.local.get(['userNotes'], (result) => {
            if (result.userNotes) {
                noteTextarea.value = result.userNotes;
            }
        });
    };

    const saveNotes = () => {
        const notes = noteTextarea.value;
        chrome.storage.local.set({ userNotes: notes }, () => {
            saveStatus.style.opacity = '1';
            setTimeout(() => {
                saveStatus.style.opacity = '0';
            }, 2000);
        });
    };

    saveButton.addEventListener('click', saveNotes);
    loadNotes();
});
