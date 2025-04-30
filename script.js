const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const settingsPanel = document.getElementById('settingsPanel');
const startButton = document.getElementById('startButton');
const hideSettingsButton = document.getElementById('hideSettings');
const dinoImageInput = document.getElementById('dinoImage');
const scoreBoard = document.getElementById('scoreBoard');
const leaderboard = document.getElementById('leaderboard');
const scoresList = document.getElementById('scoresList');

let dinoImg = new Image();
dinoImg.src = 'https://i.imgur.com/AA6R4KQ.png'; // Default dino image

let game;
let animationId;
let score = 0;
let highScores = JSON.parse(localStorage.getItem('leaderboard')) || [];

// Settings
let settings = {
    dinoImage: dinoImg,
    obstacleFrequency: 150, // Lower means more frequent obstacles
    levelThreshold: 1000, // Score threshold for level up
};

// Handle Dino Image Upload
dinoImageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            dinoImg.src = event.target.result;
            settings.dinoImage = dinoImg;
        };
        reader.readAsDataURL(file);
    }
});

// Hide Settings
hideSettingsButton.addEventListener('click', () => {
    settingsPanel.style.display = 'none';
});

// Start Game
startButton.addEventListener('click', () => {
    startButton.style.display = 'none';
    hideSettingsButton.style.display = 'none';
    settingsPanel.style.display = 'none';
    startGame();
});

// Game Variables
const canvasWidth = canvas.width = window.innerWidth;
const canvasHeight = canvas.height = window.innerHeight;

const GRAVITY = 0.5;
const DINO_WIDTH = 50;
const DINO_HEIGHT = 50;
const OBSTACLE_WIDTH = 30;
const OBSTACLE_HEIGHT = 50;

// Dino Object
const dino = {
    x: 50,
    y: canvasHeight - DINO_HEIGHT - 10,
    width: DINO_WIDTH,
    height: DINO_HEIGHT,
    dy: 0,
    jumpStrength: 10,
    isJumping: false,
    draw: function() {
        ctx.drawImage(settings.dinoImage, this.x, this.y, this.width, this.height);
    },
    update: function() {
        if (this.isJumping) {
            this.dy -= GRAVITY;
            this.y -= this.dy;
            if (this.y >= canvasHeight - this.height - 10) {
                this.y = canvasHeight - this.height - 10;
                this.isJumping = false;
                this.dy = 0;
            }
        }
    },
    jump: function() {
        if (!this.isJumping) {
            this.isJumping = true;
            this.dy = this.jumpStrength;
        }
    }
};

// Obstacle Object
class Obstacle {
    constructor() {
        this.width = OBSTACLE_WIDTH;
        this.height = OBSTACLE_HEIGHT;
        this.x = canvasWidth;
        this.y = canvasHeight - this.height - 10;
        this.color = '#ff69b4'; // Pink
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    update() {
        this.x -= 5;
    }
}

// Generate Clouds
const clouds = [];
const cloudColors = ['#ffffff', '#f0f0f0', '#ffffffcc'];

function createCloud() {
    const size = Math.random() * 50 + 20;
    clouds.push({
        x: canvasWidth + size,
        y: Math.random() * canvasHeight / 2,
        size: size,
        speed: Math.random() * 2 + 1,
        color: cloudColors[Math.floor(Math.random() * cloudColors.length)]
    });
}

function drawClouds() {
    ctx.fillStyle = '#ffffff';
    for (let cloud of clouds) {
        ctx.beginPath();
        ctx.arc(cloud.x, cloud.y, cloud.size, 0, Math.PI * 2);
        ctx.fillStyle = cloud.color;
        ctx.fill();
        ctx.closePath();
    }
}

function updateClouds() {
    for (let cloud of clouds) {
        cloud.x -= cloud.speed;
    }
    // Remove clouds that are off the screen
    clouds.filter(cloud => cloud.x + cloud.size > 0);
}

// Handle Collision
function isCollision(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
}

// Game Loop
function gameLoop() {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    // Update Background
    updateBackground();
    // Draw Clouds
    drawClouds();
    updateClouds();

    // Update and Draw Dino
    dino.update();
    dino.draw();

    // Update and Draw Obstacles
    for (let obstacle of game.obstacles) {
        obstacle.update();
        obstacle.draw();
        if (isCollision(dino, obstacle)) {
            endGame();
        }
    }

    // Update Score
    score += 1;
    scoreBoard.innerHTML = `Score: ${score}`;

    // Level Up Logic
    if (score % settings.levelThreshold === 0) {
        levelUp();
    }

    animationId = requestAnimationFrame(gameLoop);
}

// Update Background Based on Score
function updateBackground() {
    const level = Math.floor(score / settings.levelThreshold) + 1;
    if (level % 2 === 0) {
        canvas.style.background = '#87ceeb'; // Light blue
    } else {
        canvas.style.background = '#2c3e50'; // Dark blue
    }
}

// Level Up Function
function levelUp() {
    settings.obstacleFrequency = Math.max(50, settings.obstacleFrequency - 10); // Increase difficulty
    // Optionally, change background or other properties
}

// Start Game
function startGame() {
    game = {
        obstacles: [],
        frame: 0
    };
    score = 0;
    scoreBoard.innerHTML = `Score: ${score}`;
    dino.y = canvasHeight - DINO_HEIGHT - 10;
    dino.isJumping = false;
    dino.dy = 0;
    animationId = requestAnimationFrame(gameLoop);
}

// End Game
function endGame() {
    cancelAnimationFrame(animationId);
    // Save Score
    highScores.push(score);
    highScores.sort((a, b) => b - a);
    highScores = highScores.slice(0, 5);
    localStorage.setItem('leaderboard', JSON.stringify(highScores));
    // Show Leaderboard
    scoresList.innerHTML = '';
    for (let i = 0; i < highScores.length; i++) {
        const li = document.createElement('li');
        li.textContent = `No. ${i + 1}: ${highScores[i]}`;
        scoresList.appendChild(li);
    }
    // Reset Button
    startButton.style.display = 'block';
    hideSettingsButton.style.display = 'block';
    settingsPanel.style.display = 'flex';
}

// Handle Jump
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
        dino.jump();
    }
});

// Handle Click to Jump
canvas.addEventListener('click', () => {
    dino.jump();
});

// Spawn Obstacles
function spawnObstacle() {
    game.obstacles.push(new Obstacle());
}

// Update Obstacles
function updateObstacles() {
    for (let obstacle of game.obstacles) {
        obstacle.update();
        if (obstacle.x + obstacle.width < 0) {
            game.obstacles.splice(game.obstacles.indexOf(obstacle), 1);
        }
    }
}

// Game Loop with Obstacle Spawning
function gameLoop() {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    // Update Background
    updateBackground();
    // Draw Clouds
    drawClouds();
    updateClouds();

    // Update and Draw Dino
    dino.update();
    dino.draw();

    // Update and Draw Obstacles
    for (let obstacle of game.obstacles) {
        obstacle.update();
        obstacle.draw();
        if (isCollision(dino, obstacle)) {
            endGame();
        }
    }

    // Update Score
    score += 1;
    scoreBoard.innerHTML = `Score: ${score}`;

    // Spawn Obstacles
    if (game.frame % settings.obstacleFrequency === 0) {
        spawnObstacle();
    }
    game.frame += 1;

    animationId = requestAnimationFrame(gameLoop);
}

// Initialize Game
function initialize() {
    settingsPanel.style.display = 'flex';
    startButton.style.display = 'block';
    hideSettingsButton.style.display = 'block';
    leaderboard.style.display = 'block';
    scoresList.innerHTML = '';
    for (let i = 0; i < highScores.length; i++) {
        const li = document.createElement('li');
        li.textContent = `No. ${i + 1}: ${highScores[i]}`;
        scoresList.appendChild(li);
    }
    // Make the game responsive
    window.addEventListener('resize', handleResize);
    handleResize();
}

function handleResize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    dino.y = canvasHeight - DINO_HEIGHT - 10;
}

// Initialize
initialize();