import { CHARACTERS } from './characters.js';
import { Game } from './game.js';
import { injectIcons } from './icons.js';
import { save } from './save.js';
import * as audio from './audio.js';

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

// ---- menu: best line + character picker -----------------------------------
function refreshBest() {
  const b = save.best();
  const el = $('bestLine');
  if (b > 0) { el.textContent = `Personal best: ${fmt(b)} power  •  bank: ${fmt(save.money())} money`; el.classList.remove('hidden'); }
}
refreshBest();

let selectedChar = CHARACTERS.find((c) => c.playable) || CHARACTERS[0];
function buildPicker(container, onPick) {
  container.innerHTML = '';
  for (const c of CHARACTERS.filter((c) => c.playable)) {
    const cell = document.createElement('div');
    cell.className = 'char-cell' + (c === selectedChar ? ' sel' : '');
    cell.innerHTML = `<div class="char-swatch" style="background:${c.color}"></div><div class="char-name">${c.name}</div>`;
    cell.addEventListener('click', () => {
      selectedChar = c;
      container.querySelectorAll('.char-cell').forEach((el) => el.classList.remove('sel'));
      cell.classList.add('sel');
      onPick?.(c);
    });
    container.appendChild(cell);
  }
}
buildPicker($('charGrid'));

// ---- transient UI ----------------------------------------------------------
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

// ---- minimap ---------------------------------------------------------------
const mmCtx = $('minimap').getContext('2d');
function drawMinimap(data) {
  const S = 170, pad = 8, span = S - pad * 2;
  mmCtx.clearRect(0, 0, S, S);
  const map = (v) => pad + ((v + data.arena) / (data.arena * 2)) * span;
  for (const d of data.dots) {
    mmCtx.beginPath();
    mmCtx.fillStyle = d.me ? '#ffd23f' : d.color;
    mmCtx.arc(map(d.x), map(d.z), d.me ? 5 : Math.min(6, d.r), 0, Math.PI * 2);
    mmCtx.fill();
    if (d.me) { mmCtx.lineWidth = 2; mmCtx.strokeStyle = '#fff'; mmCtx.stroke(); }
  }
}

// ---- HUD glue --------------------------------------------------------------
const ui = {
  onStats(power, money) { $('powerVal').textContent = fmt(power); $('moneyVal').textContent = fmt(money); },
  onSizeToBeat(name, power) { $('stbName').textContent = name || "you're #1!"; $('stbNum').textContent = fmt(power); },
  onGift(secs) {
    const s = Math.max(0, Math.ceil(secs));
    $('giftTime').textContent = `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  },
  onBoosts(b) {
    document.querySelector('[data-action="speed"]').classList.toggle('on', b.speed > 0);
    document.querySelector('[data-action="powerx2"]').classList.toggle('on', b.power > 0);
    document.querySelector('[data-action="kill"]').disabled = b.killCd > 0;
  },
  onMinimap: drawMinimap,
  onLeaderboard(rows) {
    $('leaderboard').innerHTML = rows.map((r) =>
      `<li class="${r.me ? 'me' : ''}"><span class="rank">${r.rank}</span>` +
      `<span class="av" style="background:${r.color}"></span>` +
      `<span class="nm">${escapeHtml(r.name)}</span><span class="val">${fmt(r.power)}</span></li>`).join('');
  },
  onEat(text) { toast(text, 'good'); },
  onWin(power) { banner("You're the #1 Brainrot!", `${fmt(power)} power — now hold the crown!`); },
  onDeath(killer, killerPower, myPower) {
    save.setBest(game.bestThisLife);
    save.setMoney(game.money);
    const best = save.best();
    $('deadSub').innerHTML = `${escapeHtml(killer)} ate you at ${fmt(killerPower)} power.<br>You reached ${fmt(myPower)}. Best ever: <b>${fmt(best)}</b>.`;
    $('hud').classList.add('hidden');
    $('banner').classList.add('hidden');
    $('dead').classList.remove('hidden');
  },
};

// ---- boot game -------------------------------------------------------------
const game = new Game($('app'), ui);

function shieldBanner() { banner('Your shield is removed!', 'Avoid other players with more Power to not get eaten!'); }

async function play() {
  audio.init(); audio.startMusic();
  $('menu').classList.add('hidden');
  $('dead').classList.add('hidden');
  $('hud').classList.remove('hidden');
  const name = ($('playerName').value || 'Player').trim().slice(0, 14);
  await game.start(selectedChar, name, save.upgrades());
  setTimeout(shieldBanner, 600);
}

$('playBtn').addEventListener('click', play);
$('respawnBtn').addEventListener('click', () => {
  $('dead').classList.add('hidden');
  $('hud').classList.remove('hidden');
  game.respawnPlayer();
  setTimeout(shieldBanner, 400);
});
$('app').addEventListener('click', () => { if (game.running && !game.controls.locked) game.controls.requestLock(); });

// ---- modals ----------------------------------------------------------------
function openModal(id) { $(id).classList.remove('hidden'); game.controls.releaseLock(); }
function closeModal(id) { $(id).classList.add('hidden'); if (game.running) game.controls.requestLock(); }
document.querySelectorAll('[data-close]').forEach((b) =>
  b.addEventListener('click', (e) => { e.stopPropagation(); closeModal(b.closest('.modal').id); }));
document.querySelectorAll('.modal').forEach((m) =>
  m.addEventListener('click', (e) => { if (e.target === m) closeModal(m.id); }));

// Shop ----------------------------------------------------------------------
const SHOP = [
  { key: 'speed',  name: 'Move Speed',  desc: '+6% movement speed', base: 200 },
  { key: 'magnet', name: 'Magnet Range', desc: 'Wider food pickup radius', base: 300 },
  { key: 'gift',   name: 'Faster Gifts', desc: '-15s on the gift timer', base: 500 },
  { key: 'start',  name: 'Head Start',  desc: '+250 starting power', base: 800 },
];
const cost = (item) => item.base * (game.upgrades[item.key] + 1);

function renderShop() {
  $('shopMoney').textContent = fmt(game.money);
  $('shopList').innerHTML = SHOP.map((it) => {
    const lvl = game.upgrades[it.key];
    const c = cost(it);
    const can = game.money >= c;
    return `<div class="shop-item">` +
      `<div class="si-info"><div class="si-name">${it.name}</div>` +
      `<div class="si-desc">${it.desc}</div><div class="si-lvl">Level ${lvl}</div></div>` +
      `<button class="shop-buy" data-buy="${it.key}" ${can ? '' : 'disabled'}>${fmt(c)}</button></div>`;
  }).join('');
  $('shopList').querySelectorAll('[data-buy]').forEach((b) =>
    b.addEventListener('click', (e) => { e.stopPropagation(); buyUpgrade(b.getAttribute('data-buy')); }));
}
function buyUpgrade(key) {
  const item = SHOP.find((i) => i.key === key);
  const c = cost(item);
  if (game.money < c) return;
  game.money -= c;
  game.upgrades[key] += 1;
  save.setMoney(game.money);
  save.addUpgrade(key);
  audio.sfx.buy();
  toast(`${item.name} → Lv ${game.upgrades[key]}`, 'good');
  renderShop();
}
function openShop() { renderShop(); openModal('shop'); }

// Skin picker ---------------------------------------------------------------
function openSkin() {
  buildPicker($('skinGrid'), async (c) => { await game.changeSkin(c); audio.sfx.click(); });
  openModal('skinModal');
}

// ---- HUD button actions ----------------------------------------------------
document.querySelectorAll('[data-add]').forEach((btn) => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const n = Number(btn.getAttribute('data-add'));
    game.addPower(n); audio.sfx.buy();
    toast(`+${fmt(n)} power!`, 'good');
  });
});
document.querySelectorAll('[data-add-money]').forEach((btn) =>
  btn.addEventListener('click', (e) => { e.stopPropagation(); openShop(); }));

const actions = {
  speed() { if (game.activateSpeed()) toast('Speed x2 for 8s!', 'good'); else toast('Speed on cooldown', 'bad'); },
  powerx2() { if (game.activatePower()) toast('Power x2 for 8s!', 'good'); else toast('Power x2 on cooldown', 'bad'); },
  kill() { const n = game.killAll(); toast(n ? `Kill All! Devoured ${n}.` : 'Kill All on cooldown', n ? 'good' : 'bad'); },
  auto() { document.querySelector('[data-action="auto"]').classList.toggle('on', game.toggleAuto()); },
  shop() { openShop(); },
  skin() { openSkin(); },
  spin() { const n = 1000 + Math.floor(Math.random() * 9000); game.addPower(n); audio.sfx.gift(); toast(`Spin won +${fmt(n)} power!`, 'good'); },
  daily() { game.addPower(3000); audio.sfx.gift(); toast('Daily reward: +3,000 power!', 'good'); },
  ugc() { toast('UGC store not in this build', 'bad'); },
  aura() { toast('Auras coming soon', 'bad'); },
  pass() { toast('Game Pass not in this build', 'bad'); },
  invite() { toast('Share the link to invite friends!', 'good'); },
};
document.querySelectorAll('[data-action]').forEach((btn) =>
  btn.addEventListener('click', (e) => { e.stopPropagation(); actions[btn.getAttribute('data-action')]?.(); }));

// settings = mute toggle
$('settingsBtn').addEventListener('click', (e) => {
  e.stopPropagation();
  const m = !audio.isMuted(); audio.setMuted(m);
  toast(m ? 'Sound off' : 'Sound on', 'good');
});

// keyboard shortcuts for boosts (1 speed, 2 power, 3 kill, B shop, M mute)
window.addEventListener('keydown', (e) => {
  if (!game.running) return;
  if (e.code === 'Digit1') actions.speed();
  else if (e.code === 'Digit2') actions.powerx2();
  else if (e.code === 'Digit3') actions.kill();
  else if (e.code === 'KeyB') openShop();
});
