/**
 * game.js
 * Main game loop, world definition, and rendering.
 */

const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

// ── World ─────────────────────────────────────────────────────────────────────

const WORLD_WIDTH  = 1600;
const WORLD_HEIGHT = 600;

// Platforms: {x, y, w, h, color}
// Index 0 = ocean floor; 1–6 = coral/rock ledges
const platforms = [
    { x: 0,    y: 540, w: 1600, h: 60,  color: '#c39a6b' },  // ocean floor
    { x: 200,  y: 420, w: 160,  h: 20,  color: '#e67e22' },  // coral ledge
    { x: 450,  y: 350, w: 120,  h: 20,  color: '#e67e22' },
    { x: 650,  y: 280, w: 140,  h: 20,  color: '#e67e22' },
    { x: 880,  y: 360, w: 100,  h: 20,  color: '#e67e22' },
    { x: 1050, y: 270, w: 180,  h: 20,  color: '#e67e22' },
    { x: 1300, y: 400, w: 130,  h: 20,  color: '#e67e22' },
];

// Rising bubbles (background decoration)
const bubbles = Array.from({ length: 60 }, () => ({
    x:     Math.random() * WORLD_WIDTH,
    y:     Math.random() * WORLD_HEIGHT,
    r:     Math.random() * 3 + 1,
    speed: Math.random() * 25 + 10,
}));

// ── Monsters ──────────────────────────────────────────────────────────────────
// Each monster walks back and forth on one platform (by platform index).
// Level 1: simple enemies — one hit to defeat.

const MONSTER_SPEED = 55;  // px/s
const MONSTER_W     = 34;
const MONSTER_H     = 30;

const monsterDefs = [
    { platformIdx: 0, offsetX: 150 },
    { platformIdx: 0, offsetX: 600 },
    { platformIdx: 0, offsetX: 1100 },
    { platformIdx: 0, offsetX: 1450 },
    { platformIdx: 1, offsetX:  20 },
    { platformIdx: 2, offsetX:  20 },
    { platformIdx: 3, offsetX:  30 },
    { platformIdx: 4, offsetX:  10 },
    { platformIdx: 5, offsetX:  40 },
    { platformIdx: 6, offsetX:  20 },
];

function createMonsters() {
    return monsterDefs.map(def => {
        const p = platforms[def.platformIdx];
        return {
            x:           p.x + def.offsetX,
            y:           p.y - MONSTER_H,
            w:           MONSTER_W,
            h:           MONSTER_H,
            alive:       true,
            dir:         1,
            platformIdx: def.platformIdx,
        };
    });
}

let monsters = createMonsters();

function updateMonsters(dt) {
    for (const m of monsters) {
        if (!m.alive) continue;
        m.x += m.dir * MONSTER_SPEED * dt;
        const p = platforms[m.platformIdx];
        if (m.x < p.x)              { m.x = p.x;              m.dir =  1; }
        if (m.x + m.w > p.x + p.w) { m.x = p.x + p.w - m.w; m.dir = -1; }
    }
}

// ── Collision helpers ─────────────────────────────────────────────────────────

function rectsOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x &&
           a.y < b.y + b.h && a.y + a.h > b.y;
}

function checkMonsterCollisions() {
    const slap   = Player.getSlapHitbox();
    const dolphin = { x: Player.x, y: Player.y, w: DOLPHIN_WIDTH, h: DOLPHIN_HEIGHT };

    for (const m of monsters) {
        if (!m.alive) continue;

        // Tail-slap hitbox (world-space) defeats the monster
        if (slap && rectsOverlap(slap, m)) {
            m.alive = false;
            Player.score += 10;
            continue;
        }

        // Dolphin body touching monster without slapping → lose a life
        if (rectsOverlap(dolphin, m)) {
            Player.takeDamage();
        }
    }
}

// ── Camera ────────────────────────────────────────────────────────────────────

const camera = { x: 0 };

function updateCamera() {
    const targetX = Player.x - canvas.width / 2 + DOLPHIN_WIDTH / 2;
    camera.x += (targetX - camera.x) * 0.1;
    camera.x = Math.max(0, Math.min(camera.x, WORLD_WIDTH - canvas.width));
}

// ── Render ────────────────────────────────────────────────────────────────────

function drawBackground() {
    // Deep ocean gradient
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#0a1628');
    grad.addColorStop(1, '#0d3b6e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Rising bubbles (parallax: 30 % of camera speed)
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    for (const b of bubbles) {
        const bx = ((b.x - camera.x * 0.3) % canvas.width + canvas.width) % canvas.width;
        ctx.beginPath();
        ctx.arc(bx, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
    }
}

function updateBubbles(dt) {
    for (const b of bubbles) {
        b.y -= b.speed * dt;
        if (b.y + b.r < 0) {
            b.y = WORLD_HEIGHT + b.r;
            b.x = Math.random() * WORLD_WIDTH;
        }
    }
}

function drawCoral(wx, wy) {
    // Three coral branches at world position (wx, wy)
    ctx.lineWidth = 4;
    ctx.lineCap   = 'round';
    for (let i = -1; i <= 1; i++) {
        const bx  = wx + i * 9;
        const tip = wy - 15 - Math.abs(i) * 4;
        ctx.strokeStyle = '#e91e63';
        ctx.beginPath();
        ctx.moveTo(bx, wy);
        ctx.lineTo(bx, tip);
        ctx.stroke();
        ctx.fillStyle = '#f48fb1';
        ctx.beginPath();
        ctx.arc(bx, tip - 3, 3.5, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawPlatforms() {
    for (const p of platforms) {
        // Main platform body (world-space; ctx is already translated)
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.w, p.h);

        // Highlight top edge
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillRect(p.x, p.y, p.w, 4);

        // Coral decoration on the ocean floor
        if (p.h >= 60) {
            for (let sx = p.x + 40; sx < p.x + p.w - 20; sx += 80) {
                drawCoral(sx, p.y);
            }
        }
    }
}

function drawMonster(m) {
    if (!m.alive) return;

    // World-space centre (ctx already translated by camera)
    const cx = m.x + m.w / 2;
    const cy = m.y + m.h / 2;
    const r  = Math.min(m.w, m.h) / 2;

    // Spiky outline
    const spikes = 8;
    ctx.fillStyle = '#c0392b';
    for (let i = 0; i < spikes; i++) {
        const a  = (i / spikes) * Math.PI * 2;
        const a2 = a + Math.PI / spikes;
        const a3 = a + (2 * Math.PI) / spikes;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a)  * r * 0.85, cy + Math.sin(a)  * r * 0.85);
        ctx.lineTo(cx + Math.cos(a2) * (r + 7),  cy + Math.sin(a2) * (r + 7));
        ctx.lineTo(cx + Math.cos(a3) * r * 0.85, cy + Math.sin(a3) * r * 0.85);
        ctx.closePath();
        ctx.fill();
    }

    // Body
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    // Eyes (look in movement direction)
    const eo = m.dir * 4;
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(cx + eo - 4, cy - 3, 4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + eo + 4, cy - 3, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath(); ctx.arc(cx + eo - 3 + m.dir, cy - 3, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + eo + 5 + m.dir, cy - 3, 2, 0, Math.PI * 2); ctx.fill();

    // Angry eyebrows
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx + eo - 7, cy - 8); ctx.lineTo(cx + eo - 1, cy - 6); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + eo + 1, cy - 6); ctx.lineTo(cx + eo + 7, cy - 8); ctx.stroke();
}

function drawHUD() {
    ctx.save();

    // Hearts (3 total; grey when lost)
    ctx.font         = '24px sans-serif';
    ctx.textBaseline = 'top';
    ctx.textAlign    = 'left';
    for (let i = 0; i < 3; i++) {
        ctx.fillStyle = i < Player.lives ? '#e74c3c' : 'rgba(255,255,255,0.2)';
        ctx.fillText('❤', 12 + i * 32, 12);
    }

    // Score
    ctx.fillStyle    = '#f1c40f';
    ctx.font         = 'bold 20px sans-serif';
    ctx.textAlign    = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText(`Score: ${Player.score}`, canvas.width - 12, 14);

    // Controls hint
    ctx.fillStyle    = 'rgba(255,255,255,0.45)';
    ctx.font         = '12px sans-serif';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(
        'Pijltjes/WASD bewegen  ·  Omhoog zwemmen  ·  Spatie/X slaan',
        canvas.width / 2, canvas.height - 8
    );

    ctx.restore();
}

// ── Game Over ─────────────────────────────────────────────────────────────────

let gameOver      = false;
let gameOverTimer = 0;
const GAME_OVER_RESTART_DELAY = 1.0; // seconds before restart input is accepted

function drawGameOver() {
    ctx.save();

    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillStyle = '#e74c3c';
    ctx.font      = 'bold 64px sans-serif';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 44);

    ctx.fillStyle = '#fff';
    ctx.font      = '28px sans-serif';
    ctx.fillText(`Score: ${Player.score}`, canvas.width / 2, canvas.height / 2 + 16);

    if (gameOverTimer >= GAME_OVER_RESTART_DELAY) {
        ctx.fillStyle = '#f1c40f';
        ctx.font      = '22px sans-serif';
        ctx.fillText(
            'Druk op Spatie of Enter om opnieuw te beginnen',
            canvas.width / 2, canvas.height / 2 + 68
        );
    }

    ctx.restore();
}

function resetGame() {
    monsters      = createMonsters();
    gameOver      = false;
    gameOverTimer = 0;
    camera.x      = 0;
    Player.init(100, 480);
}

// ── Game loop ─────────────────────────────────────────────────────────────────

let lastTime = null;

function loop(timestamp) {
    if (lastTime === null) lastTime = timestamp;
    const dt = Math.min((timestamp - lastTime) / 1000, 0.05); // cap at 50 ms
    lastTime = timestamp;

    if (gameOver) {
        gameOverTimer += dt;
        updateBubbles(dt);
        drawBackground();
        drawGameOver();

        // Accept restart only after the delay (prevents instant restart from held key)
        if (gameOverTimer >= GAME_OVER_RESTART_DELAY &&
            (Input.isDown('Space') || Input.isDown('Enter'))) {
            resetGame();
        }
        requestAnimationFrame(loop);
        return;
    }

    // Update
    Player.update(dt, platforms);
    updateCamera();
    updateBubbles(dt);
    updateMonsters(dt);
    checkMonsterCollisions();

    if (Player.lives <= 0) {
        gameOver      = true;
        gameOverTimer = 0;
    }

    // Draw
    drawBackground();
    ctx.save();
    ctx.translate(-Math.round(camera.x), 0);
    drawPlatforms();
    for (const m of monsters) drawMonster(m);
    Player.draw(ctx);
    ctx.restore();

    drawHUD();

    requestAnimationFrame(loop);
}

// ── Init ──────────────────────────────────────────────────────────────────────

Input.init();
Player.init(100, 480);
requestAnimationFrame(loop);
