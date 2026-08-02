// ============================================================
//  lib.js — lightweight shared utilities (no dependencies)
// ============================================================

export const $ = (sel, el = document) => el.querySelector(sel);
export const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));

// ---- localStorage JSON helpers (all app state persists here) ----
export const store = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v === null ? fallback : JSON.parse(v);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('localStorage write failed', e);
    }
    // optional hook so cloud sync can react to every write
    if (typeof store.afterSet === 'function') {
      try {
        store.afterSet(key, value);
      } catch (e) {
        console.warn('afterSet hook failed', e);
      }
    }
  },
  afterSet: null,
  del(key) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  },
};

export const vibrate = (ms = 12) => {
  try {
    if (navigator.vibrate) navigator.vibrate(ms);
  } catch {
    /* unsupported */
  }
};

// ---- toast notifications ----
let toastTimer = null;
export function toast(msg, type = 'info') {
  let el = $('#noorToast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'noorToast';
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.className = 'toast toast--' + type + ' toast--show';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('toast--show'), 2400);
}

// ---- tiny WebAudio tones (success / error sounds — zero assets) ----
export function playTone(freqs, dur = 0.13, type = 'sine') {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ac = new AC();
    freqs.forEach((f, i) => {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = type;
      o.frequency.value = f;
      o.connect(g);
      g.connect(ac.destination);
      const t = ac.currentTime + i * (dur + 0.03);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.18, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.start(t);
      o.stop(t + dur + 0.05);
    });
    setTimeout(() => ac.close().catch(() => {}), dur * 12 + 500);
  } catch {
    /* audio blocked */
  }
}

export function successSound() {
  playTone([660, 880], 0.14);
}
export function failSound() {
  playTone([196, 160], 0.2, 'square');
}
export function chimeSound() {
  playTone([523.25, 659.25, 783.99], 0.18);
}

// ---- dates ----
export function gregorianToday() {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());
}

export function hijriToday() {
  try {
    return new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date());
  } catch {
    try {
      return new Intl.DateTimeFormat('en-u-ca-islamic', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(new Date());
    } catch {
      return '';
    }
  }
}

export function islamicDayNum(date) {
  try {
    const f = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { day: 'numeric' });
    return parseInt(f.format(date), 10);
  } catch {
    try {
      const f = new Intl.DateTimeFormat('en-u-ca-islamic', { day: 'numeric' });
      return parseInt(f.format(date), 10);
    } catch {
      return null;
    }
  }
}

// ---- Arabic normalization (for Hifz word-matching) ----
const TASHKEEL = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u08E0-\u08FF\u0640]/g;
export function normalizeArabic(s) {
  return String(s || '')
    .replace(TASHKEEL, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/[،؛.!؟,;:()"'«»]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function wordsOf(text) {
  return normalizeArabic(text).split(' ').filter(Boolean);
}

// ---- HTML escaping ----
export function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c]));
}

// ---- currency formatting ----
export function money(n) {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return '$' + Number(n).toFixed(2);
  }
}

// ---- simple fraction math [num, den] ----
export function fracAdd(a, b) {
  return [a[0] * b[1] + b[0] * a[1], a[1] * b[1]];
}
export function fracSub(a, b) {
  return [a[0] * b[1] - b[0] * a[1], a[1] * b[1]];
}
export function fracMul(a, b) {
  return [a[0] * b[0], a[1] * b[1]];
}
export function fracSimplify([n, d]) {
  const g = gcd(Math.abs(n), Math.abs(d)) || 1;
  return [n / g, d / g];
}
export function fracVal([n, d]) {
  return n / d;
}
function gcd(a, b) {
  return b ? gcd(b, a % b) : a;
}
export function fmtFrac([n, d]) {
  const [a, b] = fracSimplify([n, d]);
  if (b === 1) return String(a);
  return `${a}/${b}`;
}

// ---- day of year (for daily quote rotation) ----
export function dayOfYear(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date - start) / 86400000);
}

// ---- daily activity log (powers the Ibadah Week analytics) ----
export function todayKey(date = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
}

export function trackDay(kind, n = 1) {
  const log = store.get('noor.activity', {});
  const key = todayKey();
  if (!log[key] || typeof log[key] !== 'object') log[key] = {};
  log[key][kind] = (log[key][kind] || 0) + n;
  store.set('noor.activity', log);
}

/** Last n days of activity, oldest first. */
export function lastNDays(n) {
  const log = store.get('noor.activity', {});
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = todayKey(d);
    const rec = log[key] || {};
    out.push({
      key,
      label: d.toLocaleDateString('en-GB', { weekday: 'short' }).slice(0, 2),
      adhkar: rec.adhkar || 0,
      habits: rec.habits || 0,
      tasbih: rec.tasbih || 0,
      prayers: rec.prayers || 0,
      dua: rec.dua || 0,
    });
  }
  return out;
}
