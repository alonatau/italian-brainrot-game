// localStorage-backed save: personal best, money bank, and bought upgrades.
const KEY = 'brainrot_save_v1';

const DEFAULT = {
  best: 0,                                   // highest power ever reached
  money: 0,                                  // money carried across runs (spendable in Shop)
  upgrades: { speed: 0, magnet: 0, gift: 0, start: 0 },
};

let state = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(DEFAULT);
    const s = JSON.parse(raw);
    return { ...structuredClone(DEFAULT), ...s, upgrades: { ...DEFAULT.upgrades, ...(s.upgrades || {}) } };
  } catch { return structuredClone(DEFAULT); }
}

function persist() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {} }

export const save = {
  best: () => state.best,
  money: () => state.money,
  upgrades: () => ({ ...state.upgrades }),
  setBest(v) { if (v > state.best) { state.best = Math.round(v); persist(); } },
  setMoney(v) { state.money = Math.max(0, Math.round(v)); persist(); },
  addUpgrade(key) { state.upgrades[key] = (state.upgrades[key] || 0) + 1; persist(); },
};
