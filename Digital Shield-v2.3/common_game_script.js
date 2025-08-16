// file: common_game_script.js
document.addEventListener('DOMContentLoaded', () => {
    const backButton = document.getElementById('back-button');

    if (backButton) {
        backButton.addEventListener('click', () => {
            // Define the original, fixed size for the game menu window
            const menuWindow = {
                url: chrome.runtime.getURL('games_menu.html'),
                type: 'popup',
                width: 820,
                height: 480
            };

            // Create the new menu window at the correct size
            chrome.windows.create(menuWindow);

            // Close the current game window
            window.close();
        });
    }
});