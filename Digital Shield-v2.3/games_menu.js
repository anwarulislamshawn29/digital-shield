// file: games_menu.js

document.addEventListener('DOMContentLoaded', () => {
    // Define the custom window sizes for each game
    const gameDimensions = {
        'dino_game.html': { width: 800, height: 450 },
        'word_game.html': { width: 640, height: 580 },
        'story_game.html': { width: 700, height: 600 },
        'wordle_game.html': { width: 600, height: 800 } // Taller window for Wordle
    };

    const gameCards = document.querySelectorAll('.game-card');

    gameCards.forEach(card => {
        card.addEventListener('click', () => {
            const gameUrl = card.dataset.url;
            const dimensions = gameDimensions[gameUrl] || { width: 820, height: 480 }; // Default size

            // Create the new game window with specific dimensions
            chrome.windows.create({
                url: chrome.runtime.getURL(gameUrl),
                type: 'popup',
                width: dimensions.width,
                height: dimensions.height
            });

            // Close the menu window
            window.close();
        });
    });
});