
// Utility functions for Subway Surfers–style 2D runner
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function rectIntersect(r1, r2) {
  return (
    r1.x < r2.x + r2.w &&
    r1.x + r1.w > r2.x &&
    r1.y < r2.y + r2.h &&
    r1.y + r1.h > r2.y
  );
}

function spawnInLane(lanes, width, height) {
  const laneIndex = randInt(0, lanes.length - 1);
  return {
    x: lanes[laneIndex],
    y: -height,
    w: width,
    h: height
  };
}

function drawCenteredText(ctx, text, font, color, canvas) {
  ctx.font = font;
  ctx.fillStyle = color;
  const textWidth = ctx.measureText(text).width;
  ctx.fillText(text, (canvas.width - textWidth) / 2, canvas.height / 2);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function formatScore(score) {
  return score.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');
const speedEl = document.getElementById('speed');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const restartBtn = document.getElementById('restartBtn');

const lanes = [canvas.width / 2 - 100, canvas.width / 2 - 25, canvas.width / 2 + 50];
let player = { lane: 1, x: lanes[1], y: canvas.height - 120, w: 50, h: 80, vy: 0, jumping: false };
// Load character image
let speed = 4; // slower initial speed
let score = 0;
let best = 0;
let obstacles = [];
let coins = [];
let gameOver = false;
let gravity = 1.2;

let running = false;
let rafId = null;

function resetGame() {
  player.lane = 1;
  player.x = lanes[1];
  player.y = canvas.height - 120;
  player.vy = 0;
  player.jumping = false;
  speed = 4; // reset to slow speed
  score = 0;
  obstacles = [];
  coins = [];
  gameOver = false;
  scoreEl.textContent = formatScore(score);
  speedEl.textContent = (speed / 7).toFixed(1) + "x";
}

function spawnObstacle() {
  const laneIndex = randInt(0, 2);
  obstacles.push({ x: lanes[laneIndex], y: -80, w: 50, h: 50 });
}

function spawnCoin() {
  const laneIndex = randInt(0, 2);
  coins.push({ x: lanes[laneIndex] + 15, y: -30, w: 20, h: 20 });
}

function update() {
  if (gameOver) return;

  score++;
  speed = clamp(4 + Math.floor(score / 1000), 4, 10); // slower scaling
  speedEl.textContent = (speed / 7).toFixed(1) + "x";

  obstacles.forEach(o => o.y += speed);
  coins.forEach(c => c.y += speed);

  obstacles = obstacles.filter(o => o.y < canvas.height);
  coins = coins.filter(c => c.y < canvas.height);

  // Player jump physics
  if (player.jumping) {
    player.y += player.vy;
    player.vy += gravity;
    if (player.y >= canvas.height - 120) {
      player.y = canvas.height - 120;
      player.vy = 0;
      player.jumping = false;
    }
  }

  // Collision detection
  obstacles.forEach(o => {
    if (rectIntersect(player, o)) {
      gameOver = true;
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
      if (score > best) best = score;
      bestEl.textContent = formatScore(best);
    }
  });

  coins.forEach((c, i) => {
    if (rectIntersect(player, c)) {
      score += 100;
      coins.splice(i, 1);
    }
  });

  if (Math.random() < 0.02) spawnObstacle();
  if (Math.random() < 0.015) spawnCoin();

  scoreEl.textContent = formatScore(score);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw lanes
  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = "#fff";
  ctx.fillRect(lanes[0] + 50, 0, 8, canvas.height);
  ctx.fillRect(lanes[1] + 50, 0, 8, canvas.height);
  ctx.restore();

  // Draw player as blue rectangle
  ctx.save();
  ctx.fillStyle = "#60d6e8";
  ctx.fillRect(player.x, player.y, player.w, player.h);
  ctx.restore();

  // Draw obstacles
  ctx.save();
  ctx.fillStyle = "#ffcb6b";
  obstacles.forEach(o => ctx.fillRect(o.x, o.y, o.w, o.h));
  ctx.restore();

  // Draw coins
  ctx.save();
  ctx.fillStyle = "#ffd54a";
  coins.forEach(c => {
    ctx.beginPath();
    ctx.arc(c.x + 10, c.y + 10, 10, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();

  // Game Over overlay
  if (gameOver) {
    ctx.save();
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = "#222";
    ctx.fillRect(0, canvas.height / 2 - 80, canvas.width, 160);
    ctx.globalAlpha = 1;
    ctx.font = "bold 40px Arial";
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2);
    ctx.font = "bold 24px Arial";
    ctx.fillText(`Score: ${formatScore(score)}`, canvas.width / 2, canvas.height / 2 + 40);
    ctx.fillText("Press Restart", canvas.width / 2, canvas.height / 2 + 80);
    ctx.restore();
  }
}

function gameLoop() {
  if (!running) return;
  update();
  draw();
  rafId = requestAnimationFrame(gameLoop);
}

// Button event listeners
startBtn.onclick = () => {
  if (!running && !gameOver) {
    running = true;
    rafId = requestAnimationFrame(gameLoop);
  }
};
stopBtn.onclick = () => {
  running = false;
  if (rafId) cancelAnimationFrame(rafId);
};
restartBtn.onclick = () => {
  resetGame();
  draw();
  running = true;
  gameOver = false;
  rafId = requestAnimationFrame(gameLoop);
};

// Keyboard controls (only when running)
document.addEventListener('keydown', e => {
  if (!running || gameOver) return;
  if (e.key === 'ArrowLeft' && player.lane > 0) {
    player.lane--;
    player.x = lanes[player.lane];
  }
  if (e.key === 'ArrowRight' && player.lane < 2) {
    player.lane++;
    player.x = lanes[player.lane];
  }
  if (e.key === ' ' && !player.jumping) {
    player.vy = -18;
    player.jumping = true;
  }
});

resetGame();
draw();