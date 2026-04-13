/**
 * player.js
 * Represents the player character.
 */

const PLAYER_SPEED  = 200; // pixels per second
const JUMP_FORCE    = -500;
const GRAVITY       = 900; // pixels per second²
const PLAYER_WIDTH  = 32;
const PLAYER_HEIGHT = 48;

const Player = {
    x: 100,
    y: 300,
    vx: 0,
    vy: 0,
    onGround: false,
    color: '#e74c3c',

    init(startX, startY) {
        this.x  = startX;
        this.y  = startY;
        this.vx = 0;
        this.vy = 0;
        this.onGround = false;
    },

    update(dt, platforms) {
        // Horizontal movement
        this.vx = 0;
        if (Input.isDown('ArrowLeft')  || Input.isDown('KeyA')) this.vx = -PLAYER_SPEED;
        if (Input.isDown('ArrowRight') || Input.isDown('KeyD')) this.vx =  PLAYER_SPEED;

        // Jump
        if ((Input.isDown('ArrowUp') || Input.isDown('KeyW') || Input.isDown('Space')) && this.onGround) {
            this.vy = JUMP_FORCE;
            this.onGround = false;
        }

        // Apply gravity
        this.vy += GRAVITY * dt;

        // Move
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Resolve platform collisions
        this.onGround = false;
        for (const p of platforms) {
            if (
                this.x + PLAYER_WIDTH  > p.x &&
                this.x                 < p.x + p.w &&
                this.y + PLAYER_HEIGHT > p.y &&
                // +1 px tolerance prevents tunnelling at very low speeds
                this.y + PLAYER_HEIGHT < p.y + p.h + Math.abs(this.vy * dt) + 1
            ) {
                this.y  = p.y - PLAYER_HEIGHT;
                this.vy = 0;
                this.onGround = true;
            }
        }

        // World boundary (left/right)
        if (this.x < 0) this.x = 0;
    },

    draw(ctx) {
        // Body
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, PLAYER_WIDTH, PLAYER_HEIGHT);

        // Eyes
        ctx.fillStyle = '#fff';
        ctx.fillRect(this.x + 6,  this.y + 10, 8,  8);
        ctx.fillRect(this.x + 18, this.y + 10, 8,  8);
        ctx.fillStyle = '#222';
        ctx.fillRect(this.x + 8,  this.y + 12, 4,  4);
        ctx.fillRect(this.x + 20, this.y + 12, 4,  4);

        // Smile
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x + PLAYER_WIDTH / 2, this.y + 30, 8, 0, Math.PI);
        ctx.stroke();
    }
};
