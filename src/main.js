import { CHARACTERS } from './characters.js';
import { Game } from './game.js';
import { injectIcons } from './icons.js';

const $ = (id) => document.getElementById(id);
injectIcons();

// ---- number formatting (1.2K / 3.4M / 1.0B) -------------------------------
function fmt(n) {
  n = Math.round(n);
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return String(n);
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (m) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}

// ---- menu: character picker -----------------------------------------------
let selectedChar = CHARACTERS.find((c) => c.playable) || CHARACTERS[0];
const grid = $('charGrid');
for (const c of CHARACTERS.filter((c) => c.playable)) {
  const cell = document.createElement('div');
  cell.className = 'char-cell' + (c === selectedChar ? ' sel' : '');
  cell.innerHTML = `<div class="char-swatch" style="background:${c.color}"></div><div class="char-name">${c.name}</div>`;
  cell.addEventListener('click', () => {
    selectedChar = c;
    document.querySelectorAll('.char-cell').forEach((el) => el.classList.remove('sel'));
    cell.classList.add('sel');
  });
  grid.appendChild(cell);
}

// ---- transient UI helpers --------------------------------------------------
function toast(text, kind) {
  const el = document.createElement('div');
  el.className = `toast ${kind || ''}`;
  el.textContent = text;
  $('feed').appendChild(el);
  setTimeout(() => el.remove(), 1600);
}
let bannerTimer;
function banner(line1, line2) {
  const b = $('banner');
  b.innerHTML = `<div class="b1">${line1}</div>${line2 ? `<div class="b2">${line2}</div>` : ''}`;
  b.classList.remove('hidden');
  clearTimeout(bannerTimer);
  bannerTimer = setTimeout(() => b.classList.add('hidden'), 4000);
}

// ---- HUD update glue -------------------------------------------------------
const ui = {
  onStats(power, money) {
    $('powerVal').textContent = fmt(power);
    $('moneyVal').textContent = fmt(money);
  },
  onSizeToBeat(name, power) {
    $('stbName').textContent = name || "you're #1!";
    $('stbNum').textContent = fmt(power);
  },
  onGift(secs) {
    const s = Math.max(0, Math.ceil(secs));
    $('giftTime').textContent = `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  },
  onBoosts(b) {
    const speedBtn = document.querySelector('[data-action="speed"]');
    const powBtn = document.querySelector('[data-action="powerx2"]');
    const killBtn = document.querySelector('[data-action="kill"]');
    speedBtn.classList.toggle('on', b.speed > 0);
    powBtn.classList.toggle('on', b.power > 0);
    killBtn.disabled = b.killCd > 0;
  },
  onLeaderboard(rows) {
    $('leaderboard').innerHTML = rows.map((r) =>
      `<li class="${r.me ? 'me' : ''}">` +
      `<span class="rank">${r.rank}</span>` +
      `<span class="av" style="background:${r.color}"></span>` +
      `<span class="nm">${escapeHtml(r.name)}</span>` +
      `<span class="val">${fmt(r.power)}</span></li>`).join('');
  },
  onEat(text) { toast(text, 'good'); },
  onDeath(killer, killerPower, myPower) {
    $('deadSub').textContent = `${killer} ate you at ${fmt(killerPower)} power. You reached ${fmt(myPower)}.`;
    $('hud').classList.add('hidden');
    $('banner').classList.add('hidden');
    $('dead').classList.remove('hidden');
  },
};

// ---- boot game -------------------------------------------------------------
const game = new Game($('app'), ui);

function shieldBanner() {
  banner('Your shield is removed!', 'Avoid other players with more Power to not get eaten!');
}

async function play() {
  $('menu').classList.add('hidden');
  $('dead').classList.add('hidden');
  $('hud').classList.remove('hidden');
  const name = ($('playerName').value || 'Player').trim().slice(0, 14);
  await game.start(selectedChar, name);
  setTimeout(shieldBanner, 600);
}

$('playBtn').addEventListener('click', play);
$('respawnBtn').addEventListener('click', () => {
  $('dead').classList.add('hidden');
  $('hud').classList.remove('hidden');
  game.respawnPlayer();
  setTimeout(shieldBanner, 400);
});

// re-grab pointer lock on click
$('app').addEventListener('click', () => {
  if (game.running && !game.controls.locked) game.controls.requestLock();
});

// ---- HUD button actions ----------------------------------------------------
// +power buttons (counter + right-side buys)
document.querySelectorAll('[data-add]').forEach((btn) => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const n = Number(btn.getAttribute('data-add'));
    game.addPower(n);
    toast(`+${fmt(n)} power!`, 'good');
  });
});

const actions = {
  speed() { game.activateSpeed(); toast('Speed x2 for 8s!', 'good'); },
  powerx2() { game.activatePower(); toast('Power x2 for 8s!', 'good'); },
  kill() { const n = game.killAll(); toast(n ? `Kill All! Devoured ${n}.` : 'Kill All on cooldown', n ? 'good' : 'bad'); },
  auto() {
    const on = game.toggleAuto();
    document.querySelector('[data-action="auto"]').classList.toggle('on', on);
    toast(on ? 'Auto Collect ON' : 'Auto Collect OFF', 'good');
  },
  async skin() {
    // cycle to the next playable character live
    const list = CHARACTERS.filter((c) => c.playable);
    const i = list.indexOf(selectedChar);
    selectedChar = list[(i + 1) % list.length];
    await game.changeSkin(selectedChar);
    toast(`Skin: ${selectedChar.name}`, 'good');
  },
  shop() { actions.skin(); },
  spin() { const n = 1000 + Math.floor(Math.random() * 9000); game.addPower(n); toast(`Spin won +${fmt(n)} power!`, 'good'); },
  daily() { game.addPower(3000); toast('Daily reward: +3,000 power!', 'good'); },
  ugc() { toast('UGC store not in this build', 'bad'); },
  aura() { toast('Auras coming soon', 'bad'); },
  pass() { toast('Game Pass not in this build', 'bad'); },
  invite() { toast('Share the link to invite friends!', 'good'); },
};

document.querySelectorAll('[data-action]').forEach((btn) => {
  btn.addEventListener('click', (e) => { e.stopPropagation(); actions[btn.getAttribute('data-action')]?.(); });
});

$('settingsBtn').addEventListener('click', (e) => { e.stopPropagation(); toast('Settings coming soon', 'bad'); });
