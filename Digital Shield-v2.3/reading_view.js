// File: reading_view.js
// This script is injected into the page to provide the reading view functionality.

(() => {
    const READING_VIEW_ID = 'reading-view-btn';
    const EXIT_BUTTON_ID = 'digital-shield-exit-reading-view';

    // Function to toggle the reading view
    function toggleReadingView() {
        if (document.getElementById(READING_VIEW_ID)) {
            exitReadingView();
        } else {
            enterReadingView();
        }
    }

    // Function to enter the reading view
    function enterReadingView() {
        // Simple heuristic to find the main content of the page
        let mainContent = document.querySelector('article, main, [role="main"]');
        if (!mainContent) {
            // Fallback to finding the element with the most paragraph tags
            const allElements = document.body.getElementsByTagName('*');
            let maxParagraphs = 0;
            for (let el of allElements) {
                const pCount = el.getElementsByTagName('p').length;
                if (pCount > maxParagraphs) {
                    maxParagraphs = pCount;
                    mainContent = el;
                }
            }
        }
        
        if (!mainContent) {
            mainContent = document.body; // Final fallback
        }

        const clonedContent = mainContent.cloneNode(true);

        const readingViewContainer = document.createElement('div');
        readingViewContainer.id = READING_VIEW_ID;
        readingViewContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: #f9f9f9;
            color: #333;
            z-index: 9999999;
            overflow-y: scroll;
            padding: 40px;
            box-sizing: border-box;
            font-family: 'Georgia', serif;
            line-height: 1.8;
            font-size: 18px;
        `;

        const contentWrapper = document.createElement('div');
        contentWrapper.style.cssText = `
            max-width: 800px;
            margin: 0 auto;
        `;
        
        const exitButton = document.createElement('button');
        exitButton.id = EXIT_BUTTON_ID;
        exitButton.textContent = 'Exit Reading View';
        exitButton.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 10px 20px;
            background-color: #333;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            z-index: 10000000;
            font-family: 'Inter', sans-serif;
        `;
        exitButton.onclick = exitReadingView;

        contentWrapper.appendChild(clonedContent);
        readingViewContainer.appendChild(contentWrapper);
        document.body.appendChild(readingViewContainer);
        document.body.appendChild(exitButton);
        document.body.style.overflow = 'hidden'; // Hide original body scroll
    }

    // Function to exit the reading view
    function exitReadingView() {
        const readingView = document.getElementById(READING_VIEW_ID);
        const exitButton = document.getElementById(EXIT_BUTTON_ID);
        if (readingView) {
            readingView.remove();
        }
        if (exitButton) {
            exitButton.remove();
        }
        document.body.style.overflow = 'auto'; // Restore original body scroll
    }

    // Listen for messages from the popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'toggle_reading_view') {
            toggleReadingView();
            sendResponse({ status: 'done' });
        }
        return true;
    });

})();
