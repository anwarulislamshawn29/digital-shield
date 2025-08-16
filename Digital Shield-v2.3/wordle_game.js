document.addEventListener('DOMContentLoaded', () => {
    const board = document.getElementById('board');
    const keyboardContainer = document.getElementById('keyboard');
    const toastContainer = document.getElementById('toast-container');
    
    // Privacy-themed word list
    const wordList = ["ADMIN", "AGENT", "BLOCK", "CACHE", "CRACK", "DEBUG", "EMAIL", "ERASE", "GUARD", "INPUT", "LOGIN", "PROXY", "QUERY", "ROBOT", "ROUTE", "SCOPE", "SHELL", "TRACE", "TRACK", "TRUST", "VIRUS", "TOKEN", "PIXEL", "AUDIT"];
    let secretWord = wordList[Math.floor(Math.random() * wordList.length)];
    console.log("Secret Word:", secretWord); // For debugging

    const NUM_GUESSES = 6;
    const WORD_LENGTH = 5;
    let currentRow = 0;
    let currentCol = 0;
    let guesses = Array(NUM_GUESSES).fill(null).map(() => Array(WORD_LENGTH).fill(''));
    let isGameOver = false;

    function initialize() {
        createBoard();
        createKeyboard();
        document.addEventListener('keydown', handleKeyPress);
    }

    function createBoard() {
        for (let r = 0; r < NUM_GUESSES; r++) {
            const rowEl = document.createElement('div');
            rowEl.className = 'row';
            for (let c = 0; c < WORD_LENGTH; c++) {
                const tile = document.createElement('div');
                tile.className = 'tile';
                tile.id = `tile-${r}-${c}`;
                rowEl.appendChild(tile);
            }
            board.appendChild(rowEl);
        }
    }

    function createKeyboard() {
        const keys = [
            'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P',
            'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L',
            'ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '«'
        ];
        const keyRows = [keys.slice(0, 10), keys.slice(10, 19), keys.slice(19)];
        
        keyRows.forEach(row => {
            const rowEl = document.createElement('div');
            rowEl.className = 'keyboard-row';
            row.forEach(key => {
                const keyEl = document.createElement('button');
                keyEl.className = 'key';
                keyEl.textContent = key;
                keyEl.id = `key-${key}`;
                if (key === 'ENTER' || key === '«') {
                    keyEl.classList.add('large');
                }
                keyEl.addEventListener('click', () => handleKeyPress({ key: key }));
                rowEl.appendChild(keyEl);
            });
            keyboardContainer.appendChild(rowEl);
        });
    }

    function handleKeyPress(e) {
        if (isGameOver) return;
        
        const key = e.key.toUpperCase();
        if (key.length === 1 && key >= 'A' && key <= 'Z') {
            addLetter(key);
        } else if (key === 'BACKSPACE' || e.key === '«') {
            removeLetter();
        } else if (key === 'ENTER') {
            submitGuess();
        }
    }

    function addLetter(letter) {
        if (currentCol < WORD_LENGTH) {
            guesses[currentRow][currentCol] = letter;
            const tile = document.getElementById(`tile-${currentRow}-${currentCol}`);
            tile.textContent = letter;
            tile.classList.add('filled');
            currentCol++;
        }
    }

    function removeLetter() {
        if (currentCol > 0) {
            currentCol--;
            guesses[currentRow][currentCol] = '';
            const tile = document.getElementById(`tile-${currentRow}-${currentCol}`);
            tile.textContent = '';
            tile.classList.remove('filled');
        }
    }

    function submitGuess() {
        if (currentCol !== WORD_LENGTH) {
            showToast("Not enough letters");
            return;
        }

        const guess = guesses[currentRow].join('');
        if (!wordList.includes(guess) && guess !== secretWord) { // Allow guessing the secret word even if not in list
            showToast("Opps! Wrong guess! Try again!");
            return;
        }

        flipTiles(guess);
    }

    function flipTiles(guess) {
        const rowTiles = document.querySelectorAll(`.row:nth-child(${currentRow + 1}) .tile`);
        let checkSecretWord = secretWord;
        let guessArray = Array.from(guess);

        // First pass for correct letters
        guessArray.forEach((letter, index) => {
            if (letter === secretWord[index]) {
                rowTiles[index].dataset.state = 'correct';
                checkSecretWord = checkSecretWord.replace(letter, ' ');
            }
        });

        // Second pass for present letters
        guessArray.forEach((letter, index) => {
            if (rowTiles[index].dataset.state) return;
            if (checkSecretWord.includes(letter)) {
                rowTiles[index].dataset.state = 'present';
                checkSecretWord = checkSecretWord.replace(letter, ' ');
            } else {
                rowTiles[index].dataset.state = 'absent';
            }
        });

        rowTiles.forEach((tile, index) => {
            setTimeout(() => {
                tile.classList.add('flip-in');
                tile.classList.add(tile.dataset.state);
                updateKeyboard(tile.textContent, tile.dataset.state);
            }, index * 200);
        });

        checkWinLose(guess, rowTiles);
    }

    function checkWinLose(guess, tiles) {
        setTimeout(() => {
            if (guess === secretWord) {
                showToast("You Win!", 3000);
                isGameOver = true;
                triggerConfetti();
            } else if (currentRow >= NUM_GUESSES - 1) {
                showToast(`The word was: ${secretWord}`, 5000);
                isGameOver = true;
            } else {
                currentRow++;
                currentCol = 0;
            }
        }, WORD_LENGTH * 200);
    }

    function updateKeyboard(letter, state) {
        const key = document.getElementById(`key-${letter}`);
        if (!key) return;

        const currentState = key.dataset.state;
        if (currentState === 'correct') return;
        if (currentState === 'present' && state !== 'correct') return;
        
        key.classList.add(state);
        key.dataset.state = state;
    }

    function showToast(message, duration = 1000) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        toastContainer.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            toast.addEventListener('transitionend', () => toast.remove());
        }, duration);
    }

    initialize();
});