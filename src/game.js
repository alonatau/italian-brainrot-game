import * as THREE from 'three';
import { CHARACTERS } from './characters.js';
import { loadCharacterModel } from './loader.js';
import { Controls } from './input.js';

const ARENA = 75;          // half-extent of the play field (150 x 150)
const FOOD_COUNT = 170;
const BOT_COUNT = 11;      // + the player = 12 on the leaderboard
const BOT_NAMES = [
  'Giorgio', 'Luca', 'Marco', 'Sofia', 'Enzo', 'Nico', 'Bruno',
  'Pippo', 'Rocco', 'Gino', 'Vito', 'Aldo', 'Remo', 'Toto', 'Beppe',
];

// growth helpers -------------------------------------------------------------
const visualScale = (size) => 0.7 * Math.cbrt(size);
const collRadius  = (size) => 0.6 * visualScale(size);
const moveSpeed   = (size) => 9 / (0.8 + 0.18 * visualScale(size));
const camDist     = (size) => 7 + 3.2 * visualScale(size);

function makeNameSprite(text, color) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 64;
  const ctx = c.getContext('2d');
  ctx.font = 'bold 34px Trebuchet MS, sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(0,0,0,0.85)';
  ctx.strokeText(text, 128, 34);
  ctx.fillStyle = color || '#ffffff';
  ctx.fillText(text, 128, 34);
  const tex = new THREE.CanvasTexture(c);
  tex.minFilter = THREE.LinearFilter;
  const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }));
  spr.scale.set(3.2, 0.8, 1);
  spr.renderOrder = 999;
  return spr;
}

class Entity {
  constructor(char, name, isPlayer) {
    this.char = char;
    this.name = name;
    this.isPlayer = isPlayer;
    this.size = 1;
    this.score = 0;
    this.alive = true;
    this.pos = new THREE.Vector3();
    this.facing = Math.random() * Math.PI * 2;
    this.group = new THREE.Group();
    this.model = null;
    this.label = makeNameSprite(name, isPlayer ? '#ffd23f' : '#ffffff');
    this.group.add(this.label);
    // bot AI scratch
    this.wanderTarget = null;
    this.repathIn = 0;
  }

  async loadModel() {
    this.model = await loadCharacterModel(this.char);
    this.group.add(this.model);
    this.applyScale();
  }

  applyScale() {
    const s = visualScale(this.size);
    if (this.model) this.model.scale.setScalar(s);
    this.label.position.set(0, 2.2 * s + 0.6, 0);
    const ls = 1 + 0.25 * (s - 0.7);
    this.label.scale.set(3.2 * ls, 0.8 * ls, 1);
  }

  spawnAt(x, z, size = 1) {
    this.pos.set(x, 0, z);
    this.size = size;
    this.alive = true;
    this.group.position.copy(this.pos);
    this.group.visible = true;
    this.applyScale();
  }
}

export class Game {
  constructor(canvasParent, ui) {
    this.ui = ui;                 // { onDeath(killerName, score), onStats(size,score), onLeaderboard(rows) }
    this.entities = [];
    this.foods = [];
    this.player = null;
    this.running = false;
    this.clock = new THREE.Clock();
    this._lbTimer = 0;

    // renderer / scene / camera
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    canvasParent.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x8fd3ff);
    this.scene.fog = new THREE.Fog(0x8fd3ff, 90, 200);

    this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 500);
    this.controls = new Controls(this.renderer.domElement);

    this._buildWorld();
    this._resize();
    window.addEventListener('resize', () => this._resize());
    this.renderer.setAnimationLoop(() => this._frame());
  }

  _resize() {
    const w = innerWidth, h = innerHeight;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  _buildWorld() {
    // light
    const sun = new THREE.DirectionalLight(0xfff4e0, 2.1);
    sun.position.set(40, 70, 30);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    const d = 100;
    Object.assign(sun.shadow.camera, { left: -d, right: d, top: d, bottom: -d, near: 1, far: 250 });
    this.scene.add(sun);
    this.scene.add(new THREE.HemisphereLight(0xbfe3ff, 0x3a5a2a, 0.8));

    // ground (Roblox-y bright grass)
    const ground = new THREE.Mesh(
      new THREE.BoxGeometry(ARENA * 2, 1, ARENA * 2),
      new THREE.MeshStandardMaterial({ color: 0x6fc04a, roughness: 1 })
    );
    ground.position.y = -0.5;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // grid stripes for that studs look
    const grid = new THREE.GridHelper(ARENA * 2, 30, 0x4f9a33, 0x57a83a);
    grid.position.y = 0.02;
    this.scene.add(grid);

    // boundary walls
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xffd23f, roughness: 0.8 });
    const wallH = 4;
    for (const [x, z, w, dpt] of [
      [0, ARENA, ARENA * 2, 1], [0, -ARENA, ARENA * 2, 1],
      [ARENA, 0, 1, ARENA * 2], [-ARENA, 0, 1, ARENA * 2],
    ]) {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(w, wallH, dpt), wallMat);
      wall.position.set(x, wallH / 2, z);
      wall.castShadow = true; wall.receiveShadow = true;
      this.scene.add(wall);
    }

    // scattered blocky scenery (trees / rocks) for depth
    this._scenery();
    this._buildFood();
  }

  _scenery() {
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x7a4a22, roughness: 1 });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x3f9e3f, roughness: 1 });
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x9aa3ad, roughness: 1 });
    for (let i = 0; i < 26; i++) {
      const x = (Math.random() * 2 - 1) * (ARENA - 6);
      const z = (Math.random() * 2 - 1) * (ARENA - 6);
      if (Math.random() < 0.7) {
        const t = new THREE.Group();
        const trunk = new THREE.Mesh(new THREE.BoxGeometry(0.8, 2.4, 0.8), trunkMat);
        trunk.position.y = 1.2;
        const leaf = new THREE.Mesh(new THREE.BoxGeometry(3, 3, 3), leafMat);
        leaf.position.y = 3.6;
        t.add(trunk, leaf);
        t.position.set(x, 0, z);
        t.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
        this.scene.add(t);
      } else {
        const r = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.6, 2.2), rockMat);
        r.position.set(x, 0.8, z);
        r.castShadow = true; r.receiveShadow = true;
        this.scene.add(r);
      }
    }
  }

  _buildFood() {
    const colors = [0xff5a5a, 0xffd23f, 0x43d675, 0x3aa0ff, 0xff8ad8, 0xff9b3a];
    const geo = new THREE.BoxGeometry(0.7, 0.7, 0.7);
    for (let i = 0; i < FOOD_COUNT; i++) {
      const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
        color: colors[i % colors.length], emissive: colors[i % colors.length],
        emissiveIntensity: 0.35, roughness: 0.4,
      }));
      m.castShadow = true;
      this._placeFood(m);
      m.userData.spin = Math.random() * 2 + 1;
      this.scene.add(m);
      this.foods.push(m);
    }
  }

  _placeFood(m) {
    m.position.set(
      (Math.random() * 2 - 1) * (ARENA - 3),
      0.6 + Math.random() * 0.4,
      (Math.random() * 2 - 1) * (ARENA - 3)
    );
  }

  // ---- lifecycle ----------------------------------------------------------
  async start(playerChar, playerName) {
    // clear any prior entities
    for (const e of this.entities) this.scene.remove(e.group);
    this.entities = [];

    // player
    this.player = new Entity(playerChar, playerName || 'Player', true);
    await this.player.loadModel();
    this.scene.add(this.player.group);
    this.player.spawnAt(0, 0, 1);
    this.entities.push(this.player);

    // bots
    const names = [...BOT_NAMES].sort(() => Math.random() - 0.5);
    for (let i = 0; i < BOT_COUNT; i++) {
      const char = CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
      const bot = new Entity(char, names[i % names.length], false);
      await bot.loadModel();
      this.scene.add(bot.group);
      const ang = (i / BOT_COUNT) * Math.PI * 2;
      bot.spawnAt(Math.cos(ang) * 40, Math.sin(ang) * 40, 0.7 + Math.random() * 2.2);
      this.entities.push(bot);
    }

    this.running = true;
    this.controls.requestLock();
    this.clock.getDelta();
  }

  stop() { this.running = false; this.controls.releaseLock(); }

  respawnPlayer() {
    const p = this.player;
    p.score = 0;
    const x = (Math.random() * 2 - 1) * (ARENA - 10);
    const z = (Math.random() * 2 - 1) * (ARENA - 10);
    p.spawnAt(x, z, 1);
    this.running = true;
    this.controls.requestLock();
    this.clock.getDelta();
  }

  // ---- main loop ----------------------------------------------------------
  _frame() {
    const dt = Math.min(this.clock.getDelta(), 0.05);
    if (this.running) {
      this._updatePlayer(dt);
      this._updateBots(dt);
      this._resolveEating();
      this._updateCamera(dt);
      this._hud(dt);
    }
    // food spin always
    for (const f of this.foods) f.rotation.y += f.userData.spin * dt;
    this.renderer.render(this.scene, this.camera);
  }

  _updatePlayer(dt) {
    const p = this.player;
    if (!p.alive) return;
    const dir = this.controls.moveVector();
    let speed = moveSpeed(p.size);
    if (this.controls.sprinting && this._stamina > 0.05) { speed *= 1.5; this._stamina -= dt / 3; }
    else this._stamina = Math.min(1, (this._stamina ?? 1) + dt / 6);

    if (dir) {
      p.pos.addScaledVector(dir, speed * dt);
      p.facing = Math.atan2(dir.x, dir.z);
    }
    this._clamp(p);
    p.group.position.copy(p.pos);
    if (p.model) p.model.rotation.y = p.facing;
    this._eatFood(p);
  }

  _updateBots(dt) {
    for (const e of this.entities) {
      if (e.isPlayer || !e.alive) continue;
      // perceive: nearest food, nearest threat, nearest prey
      let prey = null, threat = null, dPrey = 1e9, dThreat = 1e9;
      for (const o of this.entities) {
        if (o === e || !o.alive) continue;
        const dist = e.pos.distanceTo(o.pos);
        if (dist > 28) continue;
        if (o.size > e.size * 1.12 && dist < dThreat) { threat = o; dThreat = dist; }
        else if (e.size > o.size * 1.12 && dist < dPrey) { prey = o; dPrey = dist; }
      }

      let target;
      if (threat) {
        // flee
        target = e.pos.clone().add(e.pos.clone().sub(threat.pos).setY(0).normalize().multiplyScalar(10));
      } else if (prey) {
        target = prey.pos;
      } else {
        // wander toward nearest food
        e.repathIn -= dt;
        if (!e.wanderTarget || e.repathIn <= 0) {
          e.wanderTarget = this._nearestFoodPos(e.pos) ||
            new THREE.Vector3((Math.random() * 2 - 1) * ARENA, 0, (Math.random() * 2 - 1) * ARENA);
          e.repathIn = 1.5;
        }
        target = e.wanderTarget;
      }

      const to = target.clone().sub(e.pos).setY(0);
      if (to.lengthSq() > 0.04) {
        to.normalize();
        e.pos.addScaledVector(to, moveSpeed(e.size) * (threat ? 1.05 : 0.85) * dt);
        e.facing = Math.atan2(to.x, to.z);
      }
      this._clamp(e);
      e.group.position.copy(e.pos);
      if (e.model) e.model.rotation.y = e.facing;
      this._eatFood(e);
    }
  }

  _nearestFoodPos(pos) {
    let best = null, bd = 1e9;
    for (const f of this.foods) {
      const d = pos.distanceToSquared(f.position);
      if (d < bd) { bd = d; best = f; }
    }
    return best ? best.position.clone() : null;
  }

  _eatFood(e) {
    const r = collRadius(e.size) + 0.5;
    for (const f of this.foods) {
      const dx = f.position.x - e.pos.x, dz = f.position.z - e.pos.z;
      if (dx * dx + dz * dz < r * r) {
        e.size += 0.2;
        e.applyScale();
        this._placeFood(f);
      }
    }
  }

  _resolveEating() {
    for (const a of this.entities) {
      if (!a.alive) continue;
      for (const b of this.entities) {
        if (a === b || !b.alive) continue;
        if (a.size <= b.size * 1.12) continue; // a must be clearly bigger
        const ra = collRadius(a.size);
        if (a.pos.distanceTo(b.pos) < ra) {
          // a eats b
          a.size += b.size * 0.55;
          a.score += 1;
          a.applyScale();
          b.alive = false;
          b.group.visible = false;
          if (b.isPlayer) {
            this.running = false;
            this.controls.releaseLock();
            this.ui.onDeath(a.name, b.score, b.size);
          } else if (a.isPlayer) {
            this.ui.onEat(b.name);
            this._respawnBot(b);
          } else {
            this._respawnBot(b);
          }
        }
      }
    }
  }

  _respawnBot(b) {
    setTimeout(() => {
      const x = (Math.random() * 2 - 1) * (ARENA - 8);
      const z = (Math.random() * 2 - 1) * (ARENA - 8);
      b.char = CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
      b.spawnAt(x, z, 0.7 + Math.random() * 1.5);
    }, 1500);
  }

  _clamp(e) {
    const r = collRadius(e.size);
    const lim = ARENA - 1 - r;
    e.pos.x = Math.max(-lim, Math.min(lim, e.pos.x));
    e.pos.z = Math.max(-lim, Math.min(lim, e.pos.z));
  }

  _updateCamera() {
    const p = this.player;
    const dist = camDist(p.size);
    const cy = this.controls.yaw, cp = this.controls.pitch;
    const h = dist * Math.sin(cp);
    const horiz = dist * Math.cos(cp);
    const cam = new THREE.Vector3(
      p.pos.x + Math.sin(cy) * horiz,
      p.pos.y + h + 1.5,
      p.pos.z + Math.cos(cy) * horiz
    );
    this.camera.position.lerp(cam, 0.2);
    this.camera.lookAt(p.pos.x, p.pos.y + 1.2 * visualScale(p.size), p.pos.z);
  }

  _hud(dt) {
    const p = this.player;
    this.ui.onStats(Math.floor(p.size * 10) / 10, p.score, this._stamina ?? 1);
    this._lbTimer -= dt;
    if (this._lbTimer <= 0) {
      this._lbTimer = 0.3;
      const rows = this.entities
        .filter((e) => e.alive)
        .sort((a, b) => b.size - a.size)
        .slice(0, 8)
        .map((e) => ({ name: e.name, size: Math.floor(e.size * 10) / 10, me: e.isPlayer }));
      this.ui.onLeaderboard(rows);
    }
  }
}
