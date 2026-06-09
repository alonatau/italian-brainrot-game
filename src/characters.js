// =============================================================================
//  CHARACTER MANIFEST  —  this is the ONE file you edit when your 3D models are ready.
// =============================================================================
//
//  HOW TO ADD YOUR OWN MODEL:
//    1. Export your character as a .glb file (GLTF binary).
//    2. Drop it in:  public/assets/characters/   e.g.  tralalero.glb
//    3. In the entry below, set:   model: 'tralalero.glb'
//    4. That's it. If `model` is empty/missing, the game draws a blocky
//       placeholder in the character's `color` so everything still works.
//
//  FIELDS:
//    id          unique key (no spaces)
//    name        shown in the menu + leaderboard
//    color       placeholder color + UI accent (hex)
//    model       filename inside public/assets/characters/  (optional for now)
//    modelScale  multiply if your GLB imports too big/small (default 1)
//    yOffset     lift/drop the model so its feet sit on the ground (default 0)
//    playable    show it as a pickable skin in the menu (bots can use any)
// =============================================================================

export const CHARACTERS = [
  { id: 'tralalero',  name: 'Tralalero Tralala',   color: '#3aa0ff', model: '', modelScale: 1, yOffset: 0, playable: true },
  { id: 'bombardiro', name: 'Bombardiro Crocodilo', color: '#5a7d3a', model: '', modelScale: 1, yOffset: 0, playable: true },
  { id: 'tungtung',   name: 'Tung Tung Tung Sahur', color: '#8a5a2b', model: '', modelScale: 1, yOffset: 0, playable: true },
  { id: 'ballerina',  name: 'Ballerina Cappuccina', color: '#d9a066', model: '', modelScale: 1, yOffset: 0, playable: true },
  { id: 'brrbrr',     name: 'Brr Brr Patapim',      color: '#9b6a3f', model: '', modelScale: 1, yOffset: 0, playable: true },
  { id: 'lirili',     name: 'Lirilì Larilà',        color: '#c9c2b0', model: '', modelScale: 1, yOffset: 0, playable: true },
  { id: 'cappuccino', name: 'Cappuccino Assassino', color: '#6b4a2f', model: '', modelScale: 1, yOffset: 0, playable: true },
  { id: 'chimpanzini',name: 'Chimpanzini Bananini', color: '#f2c849', model: '', modelScale: 1, yOffset: 0, playable: true },
  { id: 'bombombini', name: 'Bombombini Gusini',    color: '#7fbf7f', model: '', modelScale: 1, yOffset: 0, playable: true },
  { id: 'trippi',     name: 'Trippi Troppi',        color: '#5fb0b0', model: '', modelScale: 1, yOffset: 0, playable: true },
  { id: 'frigo',      name: 'Frigo Camelo',         color: '#cfd8dc', model: '', modelScale: 1, yOffset: 0, playable: true },
  { id: 'glorbo',     name: 'Glorbo Fruttodrillo',  color: '#7bc043', model: '', modelScale: 1, yOffset: 0, playable: true },
];

export const byId = (id) => CHARACTERS.find((c) => c.id === id) || CHARACTERS[0];
