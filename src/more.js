// ============================================================
//  more.js — the "More" sheet
//  One calm place for: Saved, Appearance (theme · font size),
//  Data & account, and About / sources / privacy.
// ============================================================
import { store, toast } from './lib.js';
import { switchTab, setThemeMode, setFontSize } from './main.js';

let overlay = null;

const ICONS = {
  book: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6c-2-1.6-4.5-2.2-7-2.2v15c2.5 0 5 .6 7 2.2 2-1.6 4.5-2.2 7-2.2v-15c-2.5 0-5 .6-7 2.2z"/><path d="M12 6v15"/></svg>',
  moon: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
  type: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7V5h16v2M12 5v14M9 19h6"/></svg>',
  cloud: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 19a4.5 4.5 0 0 1-.4-9 6 6 0 0 1 11.6 1.5 3.75 3.75 0 0 1-.7 7.5z"/><path d="M8 15.5 12 19l4-3.5"/></svg>',
  disk: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5.5" rx="8" ry="3"/><path d="M4 5.5v13c0 1.7 3.6 3 8 3s8-1.3 8-3v-13"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/></svg>',
  info: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>',
  shield: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 3v5c0 4.6-3 8.4-7 10-4-1.6-7-5.4-7-10V6z"/><path d="M9 12l2 2 4-4"/></svg>',
  heart: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20.5s-7.5-4.7-7.5-10A4.5 4.5 0 0 1 12 8a4.5 4.5 0 0 1 7.5 2.5c0 5.3-7.5 10-7.5 10z"/></svg>',
};

function row(icon, title, sub, onClick) {
  const b = document.createElement('button');
  b.className = 'more-row';
  b.innerHTML = `
    <span class="more-row-ico">${icon}</span>
    <span class="more-row-main"><span class="more-row-title">${title}</span>${sub ? `<span class="more-row-sub">${sub}</span>` : ''}</span>
    <span class="more-row-arrow">›</span>`;
  b.addEventListener('click', onClick);
  return b;
}

function build() {
  overlay = document.createElement('div');
  overlay.className = 'more-overlay';
  overlay.id = 'moreOverlay';
  overlay.innerHTML = `<div class="more-sheet" id="moreSheet" role="dialog" aria-label="More">
    <div class="more-head">
      <span class="more-row-ico" style="width:40px;height:40px">${ICONS.moon}</span>
      <div><div class="more-title">More</div><div class="more-sub">Saved · appearance · data · about</div></div>
      <button class="more-close" id="moreClose" aria-label="Close">✕</button>
    </div>
    <div id="moreBody"></div>
  </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeMore();
  });
  overlay.querySelector('#moreClose').addEventListener('click', closeMore);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMore();
  });
}

const group = (label, els) => {
  const g = document.createElement('div');
  g.className = 'more-group';
  g.innerHTML = `<div class="more-group-label">${label}</div>`;
  const rows = document.createElement('div');
  rows.className = 'more-group';
  rows.style.marginTop = '0';
  els.forEach((e) => rows.appendChild(e));
  g.appendChild(rows);
  return g;
};

function renderBody() {
  const body = overlay.querySelector('#moreBody');
  body.innerHTML = '';
  const theme = store.get('noor.theme', 'system');
  const font = store.get('noor.font', 'normal');

  // ---- Saved ----
  const savedRow = row(ICONS.book, 'Saved & bookmarks', 'Ayahs you saved — tap to open', () => {
    closeMore();
    switchTab('quran');
    window.dispatchEvent(new CustomEvent('noor-quran-view', { detail: { view: 'saved' } }));
  });
  body.appendChild(group('Saved', [savedRow]));

  // ---- Appearance ----
  const themeRow = document.createElement('div');
  themeRow.className = 'more-row';
  themeRow.style.flexDirection = 'column';
  themeRow.style.alignItems = 'stretch';
  themeRow.style.cursor = 'default';
  themeRow.innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;width:100%">
      <span class="more-row-ico">${ICONS.moon}</span>
      <span class="more-row-main"><span class="more-row-title">Appearance</span><span class="more-row-sub">Theme</span></span>
    </div>
    <div class="more-seg" id="themeSeg">
      <button data-m="light" class="${theme === 'light' ? 'on' : ''}">Light</button>
      <button data-m="dark" class="${theme === 'dark' ? 'on' : ''}">Dark</button>
      <button data-m="system" class="${theme === 'system' ? 'on' : ''}">System</button>
    </div>`;
  themeRow.querySelectorAll('#themeSeg button').forEach((b) =>
    b.addEventListener('click', () => {
      setThemeMode(b.dataset.m);
      themeRow.querySelectorAll('#themeSeg button').forEach((x) => x.classList.toggle('on', x === b));
    })
  );

  const fontRow = document.createElement('div');
  fontRow.className = 'more-row';
  fontRow.style.flexDirection = 'column';
  fontRow.style.alignItems = 'stretch';
  fontRow.style.cursor = 'default';
  fontRow.innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;width:100%">
      <span class="more-row-ico">${ICONS.type}</span>
      <span class="more-row-main"><span class="more-row-title">Text size</span><span class="more-row-sub">Font size across the app</span></span>
    </div>
    <div class="more-seg" id="fontSeg">
      <button data-f="small" class="${font === 'small' ? 'on' : ''}">A</button>
      <button data-f="normal" class="${font === 'normal' ? 'on' : ''}">A</button>
      <button data-f="large" class="${font === 'large' ? 'on' : ''}">A</button>
    </div>`;
  fontRow.querySelectorAll('#fontSeg button').forEach((b, i) => {
    b.style.fontSize = ['0.72rem', '0.85rem', '1.05rem'][i];
    b.addEventListener('click', () => {
      setFontSize(b.dataset.f);
      fontRow.querySelectorAll('#fontSeg button').forEach((x) => x.classList.toggle('on', x === b));
    });
  });
  body.appendChild(group('Appearance', [themeRow, fontRow]));

  // ---- Data ----
  const accountRow = row(ICONS.cloud, 'Account & cloud backup', 'Sign in to sync your data safely', async () => {
    closeMore();
    try {
      const auth = await import('./auth.js');
      auth.openAccount();
    } catch {
      toast('Account is unavailable right now', 'error');
    }
  });
  const storageRow = row(ICONS.disk, 'Storage used', 'Checking…', () => showStorage(storageRow));
  body.appendChild(group('Data', [accountRow, storageRow]));
  showStorage(storageRow);

  // ---- About ----
  const aboutRow = row(ICONS.info, 'About Noor', 'Version 1.0 · made for worship, offline-first', () => {
    toast('Noor v1.0 — your daily worship companion', 'info');
  });
  const sourcesRow = row(ICONS.shield, 'Sources & trust', 'Quran.com · AlQuran.Cloud · Ummah API · Aladhan · graded hadith', () => {
    closeMore();
    switchTab('home');
  });
  const feedbackRow = row(ICONS.heart, 'Feedback', 'Report an issue or suggest a feature', () => {
    window.open('mailto:noor@example.com?subject=Noor%20feedback', '_self');
  });
  body.appendChild(group('About', [aboutRow, sourcesRow, feedbackRow]));
}

async function showStorage(rowEl) {
  try {
    if (navigator.storage && navigator.storage.estimate) {
      const est = await navigator.storage.estimate();
      const used = (est.usage || 0) / 1048576;
      const sub = rowEl.querySelector('.more-row-sub');
      if (sub) sub.textContent = `${used < 1 ? '< 1' : used.toFixed(1)} MB on this device`;
    }
  } catch { /* ignore */ }
}

export function openMore() {
  if (!overlay || !document.body.contains(overlay)) build();
  renderBody();
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

export function closeMore() {
  if (!overlay) return;
  overlay.classList.remove('open');
  document.body.style.overflow = '';
  setTimeout(() => {
    if (overlay && document.body.contains(overlay)) overlay.remove();
    overlay = null;
  }, 320);
}
