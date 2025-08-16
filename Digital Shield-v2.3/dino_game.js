document.addEventListener('DOMContentLoaded', () => {
    const gameWorld = document.getElementById('game-world');
    const player = document.getElementById('player');
    const scoreElement = document.getElementById('score');
    const gameOverMessage = document.getElementById('game-over');

    const GROUND_HEIGHT = 30;
    const JUMP_HEIGHT = 150;
    const JUMP_SPEED = 16;
    const SCORE_INTERVAL = 100;
    const BOSS_SCORE_TRIGGER = 1000;

    let isJumping = false;
    let isDucking = false;
    let isGameOver = false;
    let score = 0;
    let highScore = 0; // NEW: High score variable
    let gameSpeed = 8;
    let spawnTimeout;
    let scoreInterval;
    let bossActive = false;

    // --- NEW: Load high score from local storage ---
    function loadHighScore() {
        const savedScore = localStorage.getItem('trackerRunHighScore');
        highScore = savedScore ? parseInt(savedScore, 10) : 0;
    }

    function jump(e) {
        if (e.code !== 'Space' && e.type !== 'click') return;
        if (isGameOver) {
            restartGame();
            return;
        }
        if (!isJumping && !isDucking) {
            isJumping = true;
            player.classList.remove('player-run');
            let position = GROUND_HEIGHT;
            const upInterval = setInterval(() => {
                if (position >= JUMP_HEIGHT) {
                    clearInterval(upInterval);
                    const downInterval = setInterval(() => {
                        if (position <= GROUND_HEIGHT) {
                            clearInterval(downInterval);
                            isJumping = false;
                            if (!isGameOver) player.classList.add('player-run');
                        }
                        position -= 5;
                        player.style.bottom = position + 'px';
                    }, JUMP_SPEED);
                }
                position += 5;
                player.style.bottom = position + 'px';
            }, JUMP_SPEED);
        }
    }

    function duck(e) {
        if (isGameOver || isJumping) return;
        if (e.code === 'ArrowDown') {
            if (!isDucking) {
                isDucking = true;
                player.classList.add('player-duck');
                player.classList.remove('player-run');
            }
        }
    }
    function standUp(e) {
        if (e.code === 'ArrowDown') {
            isDucking = false;
            player.classList.remove('player-duck');
            player.classList.add('player-run');
        }
    }

    function createObstacle() {
        if (isGameOver || bossActive) return;
        const obstacle = document.createElement('div');
        obstacle.classList.add('obstacle');
        const typeChance = Math.random();
        if (typeChance > 0.85) { obstacle.classList.add('type-flying-low'); } 
        else if (typeChance > 0.65) { obstacle.classList.add('type-flying'); } 
        else if (typeChance > 0.3) { obstacle.classList.add('type-tall'); } 
        else { obstacle.classList.add('type-short'); }
        obstacle.style.left = '750px';
        gameWorld.appendChild(obstacle);
        moveObstacle(obstacle, gameSpeed);
    }
    
    function spawnBoss() {
        bossActive = true;
        const boss = document.createElement('div');
        boss.classList.add('obstacle', 'type-boss');
        boss.style.left = '750px';
        boss.style.animation = 'flying-wobble 3s ease-in-out infinite'; 
        gameWorld.appendChild(boss);
        moveObstacle(boss, gameSpeed * 0.8, () => {
            bossActive = false;
            spawnObstacleLoop();
        });
    }

    function moveObstacle(obstacle, speed, onComplete) {
        let obstaclePosition = 750;
        const obstacleTimer = setInterval(() => {
            if (isGameOver) { clearInterval(obstacleTimer); return; }
            if (detectCollision(player, obstacle)) {
                endGame();
                clearInterval(obstacleTimer);
                return;
            }
            if (obstaclePosition < -100) {
                clearInterval(obstacleTimer);
                obstacle.remove();
                if (onComplete) onComplete();
                return;
            }
            obstaclePosition -= speed;
            obstacle.style.left = obstaclePosition + 'px';
        }, 20);
    }
    
    function spawnObstacleLoop() {
        if (isGameOver || bossActive) return;
        const randomDelay = Math.random() * 1500 + 1000;
        spawnTimeout = setTimeout(() => {
            createObstacle();
            spawnObstacleLoop();
        }, randomDelay);
    }

    function updateScore() {
        score++;
        scoreElement.textContent = score;
        if (score % 200 === 0) { gameSpeed += 0.5; }
        if (score > 0 && score % BOSS_SCORE_TRIGGER === 0 && !bossActive) {
            clearTimeout(spawnTimeout);
            spawnBoss();
        }
    }

    function endGame() {
        isGameOver = true;
        clearTimeout(spawnTimeout);
        clearInterval(scoreInterval);

        // --- NEW: Check for high score and trigger confetti ---
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('trackerRunHighScore', highScore);
            triggerConfetti();
            gameOverMessage.querySelector('p').textContent = "NEW HIGH SCORE!";
        } else {
            gameOverMessage.querySelector('p').textContent = "GAME OVER";
        }
        
        gameOverMessage.querySelector('span').textContent = `Score: ${score} | High Score: ${highScore}`;
        gameOverMessage.style.display = 'block';
        player.classList.remove('player-run');
        player.classList.remove('player-duck');
    }

    function restartGame() {
        isGameOver = false;
        bossActive = false;
        gameOverMessage.style.display = 'none';
        score = 0;
        gameSpeed = 8;
        scoreElement.textContent = score;
        document.querySelectorAll('.obstacle').forEach(obs => obs.remove());
        startGame();
    }

    function startGame() {
        loadHighScore(); // Load high score at the start
        player.classList.add('player-run');
        scoreInterval = setInterval(updateScore, SCORE_INTERVAL);
        spawnObstacleLoop();
    }

    function detectCollision(a, b) {
        const aRect = a.getBoundingClientRect();
        const bRect = b.getBoundingClientRect();
        return !(bRect.left > aRect.right || bRect.right < aRect.left || bRect.top > aRect.bottom || bRect.bottom < aRect.top);
    }

    startGame();
    document.addEventListener('keydown', duck);
    document.addEventListener('keyup', standUp);
    document.addEventListener('keydown', jump);
    gameWorld.addEventListener('click', jump);
});