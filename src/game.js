/**
 * game.js
 * Main game loop, world definition, and rendering.
 */

const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

// ── World ────────────────────────────────────────────────────────────────────

const WORLD_WIDTH  = 1600;
const WORLD_HEIGHT = 600;

// Platforms: {x, y, w, h, color}
const platforms = [
    // Ground
    { x: 0,    y: 540, w: 1600, h: 60,  color: '#27ae60' },
    // Floating platforms
    { x: 200,  y: 420, w: 160,  h: 20,  color: '#8e44ad' },
    { x: 450,  y: 350, w: 120,  h: 20,  color: '#8e44ad' },
    { x: 650,  y: 280, w: 140,  h: 20,  color: '#8e44ad' },
    { x: 880,  y: 360, w: 100,  h: 20,  color: '#8e44ad' },
    { x: 1050, y: 270, w: 180,  h: 20,  color: '#8e44ad' },
    { x: 1300, y: 400, w: 130,  h: 20,  color: '#8e44ad' },
];

// Stars in the background
const stars = Array.from({ length: 80 }, () => ({
    x: Math.random() * WORLD_WIDTH,
    y: Math.random() * 400,
    r: Math.random() * 2 + 0.5,
}));

// Coins
const coins = [
    { x: 260, y: 390 }, { x: 500, y: 320 }, { x: 700, y: 250 },
    { x: 930, y: 330 }, { x: 1100, y: 240 }, { x: 1350, y: 370 },
    { x: 750, y: 500 }, { x: 1200, y: 500 },
].map(c => ({ ...c, collected: false, r: 10 }));

// ── Camera ───────────────────────────────────────────────────────────────────

const camera = { x: 0 };

function updateCamera() {
    const targetX = Player.x - canvas.width / 2 + 16;
    camera.x += (targetX - camera.x) * 0.1;
    camera.x = Math.max(0, Math.min(camera.x, WORLD_WIDTH - canvas.width));
}

// ── Score ────────────────────────────────────────────────────────────────────

let score = 0;

function checkCoins() {
    for (const coin of coins) {
        if (coin.collected) continue;
        const cx = coin.x + coin.r;
        const cy = coin.y + coin.r;
        if (
            cx > Player.x && cx < Player.x + PLAYER_WIDTH &&
            cy > Player.y && cy < Player.y + PLAYER_HEIGHT
        ) {
            coin.collected = true;
            score += 10;
        }
    }
}

// ── Render ───────────────────────────────────────────────────────────────────

function drawBackground() {
    // Sky gradient
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#1a1a2e');
    grad.addColorStop(1, '#16213e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Stars (parallax: move at 20 % of camera speed)
    ctx.fillStyle = '#fff';
    for (const s of stars) {
        const sx = ((s.x - camera.x * 0.2) % canvas.width + canvas.width) % canvas.width;
        ctx.beginPath();
        ctx.arc(sx, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawPlatforms() {
    for (const p of platforms) {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - camera.x, p.y, p.w, p.h);

        // Highlight top edge
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.fillRect(p.x - camera.x, p.y, p.w, 4);
    }
}

function drawCoins(t) {
    for (const coin of coins) {
        if (coin.collected) continue;
        const bob = Math.sin(t * 3 + coin.x * 0.02) * 4;
        const cx  = coin.x - camera.x + coin.r;
        const cy  = coin.y + bob;

        ctx.shadowBlur  = 12;
        ctx.shadowColor = '#f1c40f';
        ctx.fillStyle   = '#f1c40f';
        ctx.beginPath();
        ctx.arc(cx, cy, coin.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#e67e22';
        ctx.font      = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('$', cx, cy + 4);
    }
}

function drawHUD() {
    ctx.fillStyle    = 'rgba(0,0,0,0.45)';
    ctx.fillRect(8, 8, 180, 40);
    ctx.fillStyle    = '#f1c40f';
    ctx.font         = 'bold 20px sans-serif';
    ctx.textAlign    = 'left';
    ctx.fillText(`Score: ${score}`, 18, 34);

    // Controls hint (only once at start)
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font      = '13px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('Arrow keys / WASD + Space to jump', canvas.width - 10, canvas.height - 10);
}

// ── Game loop ─────────────────────────────────────────────────────────────────

let lastTime = null;

function loop(timestamp) {
    if (lastTime === null) lastTime = timestamp;
    const dt = Math.min((timestamp - lastTime) / 1000, 0.05); // cap at 50 ms
    lastTime = timestamp;

    Player.update(dt, platforms);
    updateCamera();
    checkCoins();

    // Draw
    drawBackground();
    ctx.save();
    // translate by fractional pixel for smoother camera
    ctx.translate(-Math.round(camera.x), 0);
    drawPlatforms();
    drawCoins(timestamp / 1000);
    Player.draw(ctx);
    ctx.restore();

    drawHUD();

    requestAnimationFrame(loop);
}

// ── Init ──────────────────────────────────────────────────────────────────────

Input.init();
Player.init(100, 460);
requestAnimationFrame(loop);
