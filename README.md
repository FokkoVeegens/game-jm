# game-jasmijn

A browser-based 2D platformer built with pure HTML5, CSS, and JavaScript.  
No web server, build tools, or dependencies required — just open `index.html` in your browser.

## How to play

1. **Download / clone** the repository.
2. Open `index.html` directly in any modern browser (Chrome, Firefox, Edge, Safari).
3. Use the keyboard to control your character:

| Key | Action |
|-----|--------|
| `←` / `A` | Move left |
| `→` / `D` | Move right |
| `↑` / `W` / `Space` | Jump |

Collect all the gold coins to increase your score!

## Project structure

```
game-jasmijn/
├── index.html      # Entry point — open this in your browser
├── src/
│   ├── input.js    # Keyboard input tracker
│   ├── player.js   # Player entity (movement, rendering)
│   └── game.js     # Game loop, world, camera, coins, HUD
├── .gitignore
├── LICENSE
└── README.md
```

## Technical details

- Uses the **HTML5 Canvas API** for rendering.
- Works entirely from the local filesystem (`file://` protocol) — no server needed.
- No external libraries or build step.

## License

MIT — see [LICENSE](LICENSE).
