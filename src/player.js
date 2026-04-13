/**
 * player.js
 * Represents the dolphin player.
 */

const DOLPHIN_SPEED       = 200;   // px/s horizontal
const SWIM_ACCEL          = 700;   // px/s² upward acceleration when key held
const SWIM_MAX_UP         = -300;  // maximum upward velocity
const GRAVITY             = 320;   // px/s² downward pull
const DOLPHIN_WIDTH       = 60;
const DOLPHIN_HEIGHT      = 30;

const SLAP_DURATION       = 0.25;  // seconds the tail-slap hitbox is active
const SLAP_REACH          = 55;    // px the hitbox extends in front of the snout
const INVINCIBLE_DURATION = 1.5;   // seconds of blinking invincibility after a hit

const Player = {
    x: 100,
    y: 300,
    vx: 0,
    vy: 0,
    onGround: false,
    facingRight: true,

    lives: 3,
    score: 0,

    isSlapping:  false,
    slapTimer:   0,
    slapKeyHeld: false,   // prevents holding Space from repeating the slap

    isInvincible:    false,
    invincibleTimer: 0,

    init(startX, startY) {
        this.x               = startX;
        this.y               = startY;
        this.vx              = 0;
        this.vy              = 0;
        this.onGround        = false;
        this.facingRight     = true;
        this.lives           = 3;
        this.score           = 0;
        this.isSlapping      = false;
        this.slapTimer       = 0;
        this.slapKeyHeld     = false;
        this.isInvincible    = false;
        this.invincibleTimer = 0;
    },

    update(dt, platforms) {
        // Horizontal movement
        this.vx = 0;
        if (Input.isDown('ArrowLeft')  || Input.isDown('KeyA')) { this.vx = -DOLPHIN_SPEED; this.facingRight = false; }
        else if (Input.isDown('ArrowRight') || Input.isDown('KeyD')) { this.vx =  DOLPHIN_SPEED; this.facingRight = true;  }

        // Swim upward (hold key for continuous upward acceleration)
        if (Input.isDown('ArrowUp') || Input.isDown('KeyW')) {
            this.vy -= SWIM_ACCEL * dt;
            if (this.vy < SWIM_MAX_UP) this.vy = SWIM_MAX_UP;
        }

        // Tail slap — triggered once per key-press (Space or X)
        const slapKey = Input.isDown('Space') || Input.isDown('KeyX');
        if (slapKey && !this.slapKeyHeld) {
            this.isSlapping = true;
            this.slapTimer  = SLAP_DURATION;
        }
        this.slapKeyHeld = slapKey;

        if (this.isSlapping) {
            this.slapTimer -= dt;
            if (this.slapTimer <= 0) this.isSlapping = false;
        }

        // Invincibility cooldown (after taking damage)
        if (this.isInvincible) {
            this.invincibleTimer -= dt;
            if (this.invincibleTimer <= 0) this.isInvincible = false;
        }

        // Gravity
        this.vy += GRAVITY * dt;

        // Move
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Platform collisions (land on top surface only)
        this.onGround = false;
        for (const p of platforms) {
            if (
                this.x + DOLPHIN_WIDTH  > p.x &&
                this.x                  < p.x + p.w &&
                this.y + DOLPHIN_HEIGHT > p.y &&
                this.y + DOLPHIN_HEIGHT < p.y + p.h + Math.abs(this.vy * dt) + 1
            ) {
                this.y        = p.y - DOLPHIN_HEIGHT;
                this.vy       = 0;
                this.onGround = true;
            }
        }

        // World bounds
        if (this.x < 0) this.x = 0;
        if (this.y < 0) { this.y = 0; this.vy = 0; }
    },

    /** Returns the world-space hitbox rect for the active slap, or null. */
    getSlapHitbox() {
        if (!this.isSlapping) return null;
        if (this.facingRight) {
            return { x: this.x + DOLPHIN_WIDTH, y: this.y - 8, w: SLAP_REACH, h: DOLPHIN_HEIGHT + 16 };
        } else {
            return { x: this.x - SLAP_REACH,    y: this.y - 8, w: SLAP_REACH, h: DOLPHIN_HEIGHT + 16 };
        }
    },

    takeDamage() {
        if (this.isInvincible) return;
        this.lives           = Math.max(0, this.lives - 1);
        this.isInvincible    = true;
        this.invincibleTimer = INVINCIBLE_DURATION;
    },

    draw(ctx) {
        // Blink every ~125 ms while invincible
        if (this.isInvincible && Math.floor(this.invincibleTimer * 8) % 2 === 0) return;

        ctx.save();

        const cx = this.x + DOLPHIN_WIDTH / 2;
        const cy = this.y + DOLPHIN_HEIGHT / 2;

        // Mirror horizontally when facing left so we always draw as right-facing
        if (!this.facingRight) {
            ctx.translate(2 * cx, 0);
            ctx.scale(-1, 1);
        }

        const x = this.x; // left edge in (possibly mirrored) drawing space

        // Body (blue-grey ellipse)
        ctx.fillStyle = '#5dade2';
        ctx.beginPath();
        ctx.ellipse(x + 30, cy, 30, 15, 0, 0, Math.PI * 2);
        ctx.fill();

        // Belly (lighter underside)
        ctx.fillStyle = '#d6eaf8';
        ctx.beginPath();
        ctx.ellipse(x + 28, cy + 4, 20, 9, 0, 0, Math.PI * 2);
        ctx.fill();

        // Tail fin (forked, at the back — left when facing right)
        ctx.fillStyle = '#2980b9';
        ctx.beginPath();
        ctx.moveTo(x + 6,  cy);
        ctx.lineTo(x - 10, cy - 14);
        ctx.lineTo(x - 4,  cy);
        ctx.lineTo(x - 10, cy + 14);
        ctx.closePath();
        ctx.fill();

        // Dorsal fin (top)
        ctx.fillStyle = '#2980b9';
        ctx.beginPath();
        ctx.moveTo(x + 24, cy - 15);
        ctx.lineTo(x + 34, cy - 28);
        ctx.lineTo(x + 44, cy - 15);
        ctx.closePath();
        ctx.fill();

        // Snout (front — right when facing right)
        ctx.fillStyle = '#5dade2';
        ctx.beginPath();
        ctx.moveTo(x + 54, cy - 4);
        ctx.lineTo(x + 72, cy);
        ctx.lineTo(x + 54, cy + 4);
        ctx.closePath();
        ctx.fill();

        // Eye
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x + 46, cy - 4, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0d1a30';
        ctx.beginPath();
        ctx.arc(x + 47, cy - 4, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x + 48, cy - 6, 1.2, 0, Math.PI * 2);
        ctx.fill();

        // Tail-slap swoosh arc (drawn in front of the snout)
        if (this.isSlapping) {
            const t     = 1 - this.slapTimer / SLAP_DURATION;
            const alpha = 1 - t * 0.75;
            ctx.strokeStyle = `rgba(241, 196, 15, ${alpha})`;
            ctx.lineWidth   = 4;
            ctx.lineCap     = 'round';
            ctx.beginPath();
            ctx.arc(x + 58, cy, 38, -Math.PI * 0.55 + t * 0.15, Math.PI * 0.55 - t * 0.15);
            ctx.stroke();
        }

        ctx.restore();
    }
};
