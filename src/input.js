/**
 * input.js
 * Tracks which keyboard keys are currently held down,
 * and which on-screen touch buttons are active.
 */

const Input = {
    keys: {},

    /** Virtual button states set by the on-screen touch controls. */
    touch: {
        left:  false,
        right: false,
        up:    false,
        slap:  false,
    },

    init() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
        });
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        this._initTouch();
    },

    /** Bind the on-screen buttons to the touch state. */
    _initTouch() {
        const map = {
            'btn-left':  'left',
            'btn-right': 'right',
            'btn-up':    'up',
            'btn-slap':  'slap',
        };

        for (const [id, action] of Object.entries(map)) {
            const el = document.getElementById(id);
            if (!el) continue;

            const press = (e) => {
                e.preventDefault();
                this.touch[action] = true;
                el.classList.add('active');
            };
            const release = (e) => {
                e.preventDefault();
                this.touch[action] = false;
                el.classList.remove('active');
            };

            el.addEventListener('touchstart',  press,   { passive: false });
            el.addEventListener('touchend',    release, { passive: false });
            el.addEventListener('touchcancel', release, { passive: false });

            // Mouse fallback so touch controls are testable on desktop
            el.addEventListener('mousedown',  press);
            el.addEventListener('mouseup',    release);
            el.addEventListener('mouseleave', release);
        }
    },

    isDown(code) {
        if (this.keys[code]) return true;
        // Map touch buttons to the expected key codes
        if (code === 'ArrowLeft'  || code === 'KeyA') return this.touch.left;
        if (code === 'ArrowRight' || code === 'KeyD') return this.touch.right;
        if (code === 'ArrowUp'    || code === 'KeyW') return this.touch.up;
        if (code === 'Space'      || code === 'KeyX') return this.touch.slap;
        return false;
    }
};
