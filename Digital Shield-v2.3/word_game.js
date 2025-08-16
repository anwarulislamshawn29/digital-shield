document.addEventListener('DOMContentLoaded', () => {
    const wordForm = document.getElementById('word-form');
    const inputScreen = document.getElementById('input-screen');
    const resultScreen = document.getElementById('result-screen');
    const finalPasswordEl = document.getElementById('final-password');
    const passwordRatingEl = document.getElementById('password-rating');
    const playAgainBtn = document.getElementById('play-again-btn');

    wordForm.addEventListener('submit', function(event) {
        event.preventDefault();

        const adjective = document.getElementById('adj').value;
        const noun = document.getElementById('noun').value;
        const number = document.getElementById('num').value;
        const symbol = document.getElementById('symbol').value.charAt(0) || '!';

        // Templates for funny passwords
        const templates = [
            { pass: `${adjective}${noun}${number}${symbol}`, rating: 'Rating: Predictably Weak' },
            { pass: `The${adjective}Tinfoil${noun}##${number}`, rating: 'Rating: Mildly Paranoid' },
            { pass: `${noun}Loves${adjective}Cookies${number * 2}`, rating: 'Rating: Deliciously Insecure' },
            { pass: `Xx_${noun.toUpperCase()}_xX${symbol}${number}`, rating: 'Rating: Straight Outta 2005' }
        ];

        // Pick a random template
        const randomTemplate = templates[Math.floor(Math.random() * templates.length)];

        finalPasswordEl.textContent = randomTemplate.pass;
        passwordRatingEl.textContent = randomTemplate.rating;

        inputScreen.style.display = 'none';
        resultScreen.style.display = 'block';
    });

    playAgainBtn.addEventListener('click', () => {
        resultScreen.style.display = 'none';
        inputScreen.style.display = 'block';
        wordForm.reset();
    });
});