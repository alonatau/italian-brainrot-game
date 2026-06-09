import { CHARACTERS } from './characters.js';
import { Game } from './game.js';

const $ = (id) => document.getElementById(id);

// ---- menu: build character picker -----------------------------------------
let selectedChar = CHARACTERS.find((c) => c.playable) || CHARACTERS[0];

const grid = $('charGrid');
for (const c of CHARACTERS.filter((c) => c.playable)) {
  const cell = document.createElement('div');
  cell.className = 'char-cell' + (c === selectedChar ? ' sel' : '');
  cell.innerHTML =
    `<div class="char-swatch" style="background:${c.color}"></div>` +
    `<div class="char-name">${c.name}</div>`;
  cell.addEventListener('click', () => {
    selectedChar = c;
    document.querySelectorAll('.char-cell').forEach((el) => el.classList.remove('sel'));
    cell.classList.add('sel');
  });
  grid.appendChild(cell);
}

// ---- HUD glue --------------------------------------------------------------
const ui = {
  onStats(size, score, stamina) {
    $('sizeVal').textContent = size;
    $('scoreVal').textContent = score;
    $('sprintFill').style.width = `${Math.round(stamina * 100)}%`;
  },
  onLeaderboard(rows) {
    $('lbList').innerHTML = rows
      .map((r, i) =>
        `<li class="${r.me ? 'me' : ''}"><span class="rank">${i + 1}</span>` +
        `<span class="nm">${escapeHtml(r.name)}</span><span class="sz">${r.size}</span></li>`)
      .join('');
  },
  onEat(name) { toast(`Devoured ${name}!`, 'good'); },
  onDeath(killer, score, size) {
    $('deadSub').textContent = `${killer} ate you. You devoured ${score} and reached size ${Math.floor(size * 10) / 10}.`;
    $('hud').classList.add('hidden');
    $('dead').classList.remove('hidden');
  },
};

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (m) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}

let toastTimer;
function toast(text, kind) {
  const el = document.createElement('div');
  el.className = `toast ${kind || ''}`;
  el.textContent = text;
  $('feed').appendChild(el);
  setTimeout(() => el.remove(), 1600);
}

// ---- boot game -------------------------------------------------------------
const game = new Game($('app'), ui);

async function play() {
  $('menu').classList.add('hidden');
  $('dead').classList.add('hidden');
  $('hud').classList.remove('hidden');
  const name = ($('playerName').value || 'Player').trim().slice(0, 14);
  await game.start(selectedChar, name);
}

$('playBtn').addEventListener('click', play);
$('respawnBtn').addEventListener('click', () => {
  $('dead').classList.add('hidden');
  $('hud').classList.remove('hidden');
  game.respawnPlayer();
});

// Re-grab pointer lock on click if the player tabbed away
$('app').addEventListener('click', () => {
  if (game.running && !game.controls.locked) game.controls.requestLock();
});
