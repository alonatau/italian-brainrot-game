# Drop your 3D character models here

1. Export each Italian Brainrot character as a **.glb** file (GLTF binary).
   Most tools (Blender, Meshy, Spline, Tripo) export .glb directly.
2. Put the file in **this folder**. Example: `tralalero.glb`.
3. Open `src/characters.js` and set the matching `model:` field, e.g.
   `{ id: 'tralalero', ..., model: 'tralalero.glb' }`.
4. Refresh the game. If a model is missing or fails, that character falls
   back to a colored blocky placeholder, so the game always runs.

Tips:
- The game auto-scales every model to ~2 units tall and drops its feet to the
  ground, so size differences between your files don't matter.
- If one imports rotated or floating, tweak `modelScale` / `yOffset` in
  `src/characters.js` for just that character.
- Keep files reasonably small (under ~5 MB each) so the game loads fast.
