document.addEventListener('DOMContentLoaded', () => {
    const promptSentenceEl = document.getElementById('prompt-sentence');
    const wordTagsEl = document.getElementById('word-tags');
    const storyArea = document.getElementById('story-area');
    const resultArea = document.getElementById('result-area');
    const finishBtn = document.getElementById('finish-btn');
    const playAgainBtn = document.getElementById('play-again-btn');
    const storyInput = document.getElementById('story-input');

    const prompts = [
        "This tracker knows I secretly bought a...",
        "My digital footprint revealed a weird interest in...",
        "An ad tried to sell me a...",
        "I cleared my cookies after searching for..."
    ];

    const words = ["password", "server", "algorithm", "parrot", "cloud", "firewall", "pajamas", "encryption", "tinfoil hat", "data", "robot", "cache"];

    function getRandomItem(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    function generateNewRound() {
        // Show and hide the correct containers
        storyArea.style.display = 'block';
        resultArea.style.display = 'none';
        storyInput.value = ''; // Clear textarea

        // Generate new prompt
        promptSentenceEl.textContent = getRandomItem(prompts);

        // Generate 3 unique random words
        wordTagsEl.innerHTML = '';
        const selectedWords = new Set();
        while (selectedWords.size < 3) {
            selectedWords.add(getRandomItem(words));
        }

        selectedWords.forEach(word => {
            const tag = document.createElement('div');
            tag.className = 'tag';
            tag.textContent = word;
            wordTagsEl.appendChild(tag);
        });
    }

    finishBtn.addEventListener('click', () => {
        storyArea.style.display = 'none';
        resultArea.style.display = 'block';
    });

    playAgainBtn.addEventListener('click', generateNewRound);

    // Start the first round
    generateNewRound();
});