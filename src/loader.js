import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const gltfLoader = new GLTFLoader();
const cache = new Map(); // model filename -> loaded THREE.Group (template)

// Build a chunky Roblox-style blocky avatar in the given color.
// Used until a real .glb is dropped in for the character.
function buildPlaceholder(color) {
  const g = new THREE.Group();
  const col = new THREE.Color(color);
  const mat = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, metalness: 0.05 });
  const skin = mat(col);
  const dark = mat(col.clone().multiplyScalar(0.6));
  const face = mat(0x1d2330);

  // torso
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.0, 0.5), skin);
  torso.position.y = 1.1; g.add(torso);
  // head
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.7), skin);
  head.position.y = 1.95; g.add(head);
  // eyes (so it has a "front")
  for (const x of [-0.16, 0.16]) {
    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.18, 0.05), face);
    eye.position.set(x, 1.98, 0.36); g.add(eye);
  }
  // arms
  for (const x of [-0.62, 0.62]) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.95, 0.32), dark);
    arm.position.set(x, 1.1, 0); g.add(arm);
  }
  // legs
  for (const x of [-0.24, 0.24]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.9, 0.36), dark);
    leg.position.set(x, 0.45, 0); g.add(leg);
  }
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  g.userData.isPlaceholder = true;
  return g;
}

// Normalize a loaded scene so its feet sit at y=0 and it stands ~2 units tall,
// then apply the character's manual scale/offset tweaks.
function normalize(scene, char) {
  const box = new THREE.Box3().setFromObject(scene);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size); box.getCenter(center);
  const targetHeight = 2.0;
  const s = (size.y > 0 ? targetHeight / size.y : 1) * (char.modelScale || 1);
  scene.scale.setScalar(s);
  // recenter horizontally, drop feet to ground
  scene.position.x = -center.x * s;
  scene.position.z = -center.z * s;
  scene.position.y = -box.min.y * s + (char.yOffset || 0);
  scene.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
}

// Returns a Promise<THREE.Group> ready to drop in the scene.
// Always resolves (falls back to placeholder on any failure).
export async function loadCharacterModel(char) {
  if (!char.model) return buildPlaceholder(char.color);
  const url = `/assets/characters/${char.model}`;
  try {
    let template = cache.get(char.model);
    if (!template) {
      const gltf = await gltfLoader.loadAsync(url);
      template = gltf.scene;
      normalize(template, char);
      cache.set(char.model, template);
    }
    const inst = template.clone(true);
    // wrap so callers always get a fresh group at origin
    const wrap = new THREE.Group();
    wrap.add(inst);
    return wrap;
  } catch (e) {
    console.warn(`[loader] could not load ${url}, using placeholder.`, e);
    return buildPlaceholder(char.color);
  }
}
