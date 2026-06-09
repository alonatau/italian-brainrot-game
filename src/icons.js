// Simple inline SVG icons (24x24). Used instead of emojis throughout the HUD.
// Each returns an SVG string; fill/stroke use currentColor so CSS controls color.

const wrap = (inner, opts = {}) =>
  `<svg viewBox="0 0 24 24" width="${opts.w || 24}" height="${opts.h || 24}" ` +
  `fill="${opts.fill || 'none'}" stroke="${opts.stroke || 'currentColor'}" ` +
  `stroke-width="${opts.sw || 2}" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;

export const ICONS = {
  // flexed-arm "power" icon
  power: wrap('<path d="M5 13c0-4 3-7 7-7 3 0 5 2 5 4s-2 3-2 5 2 3 2 5H8c0-2 1-3 1-5s-4-3-4-7Z" fill="currentColor" stroke="none"/><circle cx="12" cy="7" r="1.4" fill="#1a1205" stroke="none"/>'),

  money: wrap('<rect x="2.5" y="6" width="19" height="12" rx="2" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="3" fill="#0b5d2a"/><path d="M12 9.5v5M10.8 13.2c.3.5.8.8 1.4.8.8 0 1.3-.5 1.3-1.1 0-1.4-2.5-.9-2.5-2.3 0-.6.5-1 1.2-1 .5 0 1 .2 1.2.6" stroke="#0b5d2a"/>'),

  plus: wrap('<path d="M12 5v14M5 12h14" stroke-width="3"/>'),

  shop: wrap('<path d="M4 9h16l-1-4H5L4 9Z" fill="currentColor" stroke="none"/><path d="M5 9v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9" /><path d="M9 19v-5h6v5"/>'),

  spin: wrap('<circle cx="12" cy="12" r="9" fill="currentColor" stroke="none"/><path d="M12 3v9l6 4" stroke="#1a1205"/><circle cx="12" cy="12" r="1.6" fill="#1a1205" stroke="none"/>'),

  star: wrap('<path d="m12 3 2.6 5.6L20.5 9l-4.5 4 1.3 6L12 16l-5.3 3 1.3-6-4.5-4 5.9-.4L12 3Z" fill="currentColor" stroke="none"/>'),

  shark: wrap('<path d="M3 14c4 1 7 1 10-1 1 3 3 4 5 4-1-2-1-3 0-5 1.5-1 3-1 3-1-2-1-3-2-4-4-3-2-7-2-10 1-1-2-2-3-3-4 .5 3 .5 5-1 7 1 .5 2 2 3 4Z" fill="currentColor" stroke="none"/><circle cx="15" cy="12" r="0.9" fill="#0b3d4a" stroke="none"/>'),

  sparkle: wrap('<path d="M12 2v6M12 16v6M2 12h6M16 12h6" /><path d="m6 6 3 3M15 15l3 3M18 6l-3 3M9 15l-3 3"/>'),

  calendar: wrap('<rect x="3.5" y="5" width="17" height="16" rx="2" fill="currentColor" stroke="none"/><path d="M3.5 9h17M8 3v4M16 3v4" stroke="#1a1205"/><text x="12" y="17" font-size="7" font-weight="bold" fill="#1a1205" text-anchor="middle" stroke="none">31</text>'),

  hexpass: wrap('<path d="M12 2 21 7v10l-9 5-9-5V7l9-5Z" fill="currentColor" stroke="none"/><text x="12" y="15.5" font-size="9" font-weight="bold" fill="#1a1205" text-anchor="middle" stroke="none">P</text>'),

  invite: wrap('<circle cx="9" cy="8" r="3.2" fill="currentColor" stroke="none"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" fill="currentColor" stroke="none"/><path d="M18 8v6M15 11h6"/>'),

  gift: wrap('<rect x="3.5" y="9" width="17" height="11" rx="1.5" fill="currentColor" stroke="none"/><path d="M3.5 13h17M12 9v11" stroke="#b3261e"/><path d="M12 9c-1-3-5-3-5-1s4 1 5 1Zm0 0c1-3 5-3 5-1s-4 1-5 1Z" fill="#ffd23f" stroke="none"/>'),

  burger: wrap('<path d="M4 9c0-3 4-5 8-5s8 2 8 5H4Z" fill="currentColor" stroke="none"/><path d="M3.5 11.5h17M3.5 15.5h17" /><path d="M4 18c0 1.5 1 2.5 3 2.5h10c2 0 3-1 3-2.5H4Z" fill="currentColor" stroke="none"/>'),

  gear: wrap('<circle cx="12" cy="12" r="3.2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>'),
};

// Replace any element that has a data-icon="name" attribute with that SVG.
export function injectIcons(root = document) {
  root.querySelectorAll('[data-icon]').forEach((el) => {
    const name = el.getAttribute('data-icon');
    if (ICONS[name]) el.innerHTML = ICONS[name];
  });
}
