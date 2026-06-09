# Be a Italian Brainrot (web clone)

A web remake of the Roblox game **Be a Italian Brainrot** — an eat-and-grow
simulator. You play a brainrot character, eat food to grow, devour smaller
players, and run from bigger ones. Single-player with AI bots, desktop browser,
built with Three.js.

## Run it
```bash
npm install
npm run dev      # opens a local dev server, usually http://localhost:5173
```

## Controls
- **WASD / Arrow keys** — move
- **Mouse** — look around (click the game once to capture the mouse)
- **Shift** — sprint (drains the green stamina bar)

## Goal
Eat glowing food cubes to grow. When you are clearly bigger than another
character you can run into them to eat them (+1 EATEN, big size boost). If
someone bigger catches you, you get devoured — then hit PLAY AGAIN.

## Add your own 3D characters
See `public/assets/characters/README.md`. Short version: export `.glb`, drop it
in that folder, and point to it from `src/characters.js`. Until then every
character uses a colored blocky placeholder.

## Project map
- `src/characters.js` — the character list (EDIT THIS for your models)
- `src/game.js` — world, entities, eating, bots, camera, leaderboard
- `src/loader.js` — loads your `.glb` or builds a placeholder
- `src/input.js` — keyboard + mouse-look controls
- `src/main.js` — menu, HUD, and glue
