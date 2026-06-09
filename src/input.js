// Keyboard + mouse-look (pointer lock) controller for a third-person orbit camera.
import * as THREE from 'three';

export class Controls {
  constructor(domElement) {
    this.dom = domElement;
    this.keys = new Set();
    this.yaw = 0;            // camera orbit around player (radians)
    this.pitch = 0.5;        // camera tilt
    this.locked = false;
    this.sensitivity = 0.0025;

    this._onKeyDown = (e) => { this.keys.add(e.code); };
    this._onKeyUp = (e) => { this.keys.delete(e.code); };
    this._onMouseMove = (e) => {
      if (!this.locked) return;
      this.yaw -= e.movementX * this.sensitivity;
      this.pitch -= e.movementY * this.sensitivity;
      this.pitch = Math.max(0.05, Math.min(1.25, this.pitch));
    };
    this._onLockChange = () => { this.locked = document.pointerLockElement === this.dom; };

    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
    document.addEventListener('mousemove', this._onMouseMove);
    document.addEventListener('pointerlockchange', this._onLockChange);
  }

  requestLock() { this.dom.requestPointerLock?.(); }
  releaseLock() { if (document.pointerLockElement) document.exitPointerLock?.(); }

  // Returns a normalized movement vector in WORLD space, relative to camera yaw.
  moveVector() {
    let f = 0, s = 0;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) f += 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) f -= 1;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) s -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) s += 1;
    if (f === 0 && s === 0) return null;
    // forward is -z rotated by yaw
    const sin = Math.sin(this.yaw), cos = Math.cos(this.yaw);
    const v = new THREE.Vector3(
      s * cos - f * sin,
      0,
      -f * cos - s * sin
    );
    return v.normalize();
  }

  get sprinting() { return this.keys.has('ShiftLeft') || this.keys.has('ShiftRight'); }

  dispose() {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    document.removeEventListener('mousemove', this._onMouseMove);
    document.removeEventListener('pointerlockchange', this._onLockChange);
  }
}
