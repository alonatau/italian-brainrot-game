// Tiny WebAudio synth — all sound effects + music are generated in code,
// so there are no audio files to ship. Call init() from a user gesture.
let ctx = null;
let master = null;
let muted = false;
let musicTimer = null;

export function init() {
  if (ctx) return;
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  master = ctx.createGain();
  master.gain.value = 0.5;
  master.connect(ctx.destination);
}

function resume() { if (ctx && ctx.state === 'suspended') ctx.resume(); }

// one beep with an ADSR-ish envelope
function beep({ freq = 440, type = 'sine', dur = 0.12, vol = 0.25, slide = 0, delay = 0 }) {
  if (!ctx || muted) return;
  resume();
  const t0 = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g); g.connect(master);
  osc.start(t0); osc.stop(t0 + dur + 0.02);
}

export const sfx = {
  eat()    { beep({ freq: 520 + Math.random() * 80, type: 'square', dur: 0.07, vol: 0.12, slide: 180 }); },
  bigEat() { beep({ freq: 300, type: 'sawtooth', dur: 0.18, vol: 0.28, slide: 260 });
             beep({ freq: 440, type: 'square', dur: 0.16, vol: 0.18, slide: 220, delay: 0.04 }); },
  boost()  { beep({ freq: 400, type: 'square', dur: 0.12, vol: 0.2, slide: 500 });
             beep({ freq: 700, type: 'square', dur: 0.12, vol: 0.15, slide: 400, delay: 0.08 }); },
  buy()    { beep({ freq: 880, type: 'triangle', dur: 0.09, vol: 0.2 });
             beep({ freq: 1180, type: 'triangle', dur: 0.1, vol: 0.18, delay: 0.07 }); },
  click()  { beep({ freq: 660, type: 'square', dur: 0.05, vol: 0.12 }); },
  gift()   { [523, 659, 784, 1047].forEach((f, i) => beep({ freq: f, type: 'triangle', dur: 0.14, vol: 0.2, delay: i * 0.09 })); },
  death()  { beep({ freq: 360, type: 'sawtooth', dur: 0.5, vol: 0.3, slide: -260 }); },
  win()    { [523, 659, 784, 1047, 1319].forEach((f, i) => beep({ freq: f, type: 'square', dur: 0.18, vol: 0.22, delay: i * 0.11 })); },
};

// gentle background loop (a slow major arpeggio)
const NOTES = [261.6, 329.6, 392.0, 523.3, 392.0, 329.6];
export function startMusic() {
  if (!ctx || musicTimer) return;
  let i = 0;
  const step = () => {
    if (!muted) beep({ freq: NOTES[i % NOTES.length] / 2, type: 'triangle', dur: 0.4, vol: 0.05 });
    i++;
    musicTimer = setTimeout(step, 460);
  };
  step();
}
export function stopMusic() { clearTimeout(musicTimer); musicTimer = null; }

export function setMuted(m) { muted = m; if (master) master.gain.value = m ? 0 : 0.5; }
export function isMuted() { return muted; }
