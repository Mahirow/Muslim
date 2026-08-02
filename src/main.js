// ============================================================
//  main.js — app shell
//  Instant client-side tab switching (no reloads) with lazy
//  mounting per tab. All state persists via localStorage.
//  Also: dark mode theme, PWA service worker + install prompt.
// ============================================================
import './styles.css';
import './features-round2.css';
import { store, hijriToday, gregorianToday } from './lib.js';
import { initAuth } from './auth.js';

// Lazy per-tab chunks: only the active tab's code is downloaded,
// so the initial load is small and the splash shows a fast first paint.
const TABS = {
  home: () => import('./tabs/home.js'),
  quran: () => import('./tabs/quran.js'),
  prayer: () => import('./tabs/prayer.js'),
  finance: () => import('./tabs/finance.js'),
  education: () => import('./tabs/education.js'),
};
const TAB_KEY = 'noor.tab';
const THEME_KEY = 'noor.theme';

const content = document.getElementById('content');
const mounted = {};

// Build one <section> per tab; only mount the module on first show.
Object.keys(TABS).forEach((name) => {
  const panel = document.createElement('section');
  panel.className = 'tab-panel';
  panel.id = 'panel-' + name;
  panel.dataset.tab = name;
  content.appendChild(panel);
});

export async function switchTab(name, persist = true) {
  if (!TABS[name]) name = 'home';
  Object.keys(TABS).forEach((n) => {
    const panel = document.getElementById('panel-' + n);
    const btn = document.querySelector(`.nav-btn[data-tab="${n}"]`);
    const active = n === name;
    panel.classList.toggle('active', active);
    if (btn) btn.classList.toggle('active', active);
  });
  if (persist) store.set(TAB_KEY, name);
  const panel = document.getElementById('panel-' + name);
  if (!mounted[name]) {
    try {
      const mod = await TABS[name]();
      mod.mount(panel);
      mounted[name] = true;
    } catch (e) {
      console.error('Tab mount failed:', name, e);
      panel.innerHTML = `<div class="card"><div class="error-box">Something went wrong loading this tab. Please refresh.</div></div>`;
      mounted[name] = true;
    }
  }
  window.scrollTo({ top: 0 });
}

// Header: today's dates
function setHeaderDates() {
  const chip = document.getElementById('hijriDate');
  if (chip) {
    chip.textContent = hijriToday() || gregorianToday();
    chip.title = gregorianToday();
  }
}

// Bottom nav wiring
document.querySelectorAll('.nav-btn').forEach((btn) => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

// Noor AI — floating chat button (lazy-loads the chat chunk on first tap)
document.getElementById('aiFab').addEventListener('click', async () => {
  const fab = document.getElementById('aiFab');
  fab.classList.toggle('active');
  try {
    const chat = await import('./ai-chat.js');
    chat.openChat();
  } catch (e) {
    console.error('AI chat failed to load:', e);
    fab.classList.remove('active');
  }
});

// ============================================================
//  Dark mode — persisted theme with system-preference default
// ============================================================
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = theme === 'dark' ? '#08352a' : '#064e3b';
}

function initTheme() {
  let theme = store.get(THEME_KEY, null);
  if (!theme) {
    theme =
      window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
  }
  applyTheme(theme);
  const btn = document.getElementById('themeToggle');
  if (btn) {
    const sync = () => btn.classList.toggle('is-dark', document.documentElement.getAttribute('data-theme') === 'dark');
    sync();
    btn.addEventListener('click', () => {
      const next =
        document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      store.set(THEME_KEY, next);
      applyTheme(next);
      sync();
    });
  }
}
initTheme();

// Cloud account + sync (lazy-loads Firebase only if a session exists)
initAuth();

// ============================================================
//  PWA — service worker + install prompt
// ============================================================
let deferredPrompt = null;

// Expose whether the app is running in installed/standalone mode
export function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}

// Trigger the native install prompt (used by the Home install card)
export async function promptInstall() {
  if (!deferredPrompt) return false;
  try {
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    return true;
  } catch {
    return false;
  }
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .catch((err) => console.warn('SW registration failed:', err));
  });
}

window.noorInstallable = false;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  window.noorInstallable = true;
  window.dispatchEvent(new CustomEvent('noor-install-ready', { detail: { installable: true } }));
});

window.addEventListener('appinstalled', () => {
  deferredPrompt = null;
  window.noorInstallable = false;
  window.dispatchEvent(new CustomEvent('noor-install-ready', { detail: { installable: false } }));
});

// Restore last tab (validated) or default to home
const lastTab = store.get(TAB_KEY, 'home');
switchTab(TABS[lastTab] ? lastTab : 'home', false).then(() => {
  // Remove the boot splash once the first tab is on screen
  const splash = document.getElementById('bootSplash');
  if (splash) splash.remove();
});
setHeaderDates();
