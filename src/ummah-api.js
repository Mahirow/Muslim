// ============================================================
//  ummah-api.js — unified client for the Ummah API
//  Base: https://ummahapi.com/api  ·  Auth: X-API-Key header
//  Used for: Hadith library, Asma-ul-Husna (99 Names), Quran
//  search & random verse, Tafsir, live Zakat nisab prices,
//  online Du'a collection and Islamic months.
//  Every network call is small and cached — the app stays
//  ultra-lightweight for entry-level mobile devices.
// ============================================================
import { store } from './lib.js';

const BASE = 'https://ummahapi.com/api';
const KEY = 'umh_bcd4a9d570c6619ba8854cb5512b443baf28314d';

/** GET with the API key header + timeout + basic error handling. */
export async function getJSON(path, params = {}, timeoutMs = 20000) {
  const qs = new URLSearchParams(params).toString();
  const url = `${BASE}${path}${qs ? '?' + qs : ''}`;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'X-API-Key': KEY },
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const json = await res.json();
    if (!json || json.success !== true) throw new Error('Bad payload');
    return json;
  } finally {
    clearTimeout(t);
  }
}

/** GET + parse into the `data` payload. */
async function data(path, params, timeout) {
  const json = await getJSON(path, params, timeout);
  return json.data;
}

/* ---------------- tiny localStorage cache ---------------- */
const CACHE_TTL = 7 * 86400000; // 7 days
function cacheGet(key) {
  const c = store.get(key, null);
  if (c && c.t && Date.now() - c.t < CACHE_TTL) return c.d;
  return null;
}
function cacheSet(key, d) {
  store.set(key, { t: Date.now(), d });
}

/* ============================================================
   Hadith — collections, browse, one hadith, search, random
   ============================================================ */
export async function fetchHadithCollections(force = false) {
  if (!force) {
    const c = cacheGet('ummah.hadith.collections');
    if (c) return c;
  }
  const d = await data('/hadith/collections');
  cacheSet('ummah.hadith.collections', d.collections || []);
  return d.collections || [];
}

export function fetchHadithCollection(key, page = 1, limit = 15) {
  return data(`/hadith/${encodeURIComponent(key)}`, { page, limit });
}

export function fetchHadith(id) {
  return data(`/hadith/${encodeURIComponent(id)}`);
}

export function searchHadith(q, limit = 20) {
  return data('/hadith/search', { q, limit });
}

export function randomHadith() {
  return data('/hadith/random');
}

/* ============================================================
   Asma-ul-Husna — 99 Names of Allah
   ============================================================ */
export async function fetchAsmaUlHusna(force = false) {
  if (!force) {
    const c = cacheGet('ummah.asma');
    if (c) return c;
  }
  const d = await data('/asma-ul-husna');
  const names = d.names || [];
  cacheSet('ummah.asma', names);
  return names;
}

/* ============================================================
   Quran — search, random verse
   ============================================================ */
export function searchQuran(q, limit = 20) {
  return data('/quran/search', { q, limit });
}

export function randomAyah() {
  return data('/quran/random');
}

/* ============================================================
   Tafsir — sources list + one ayah commentary
   ============================================================ */
export async function fetchTafsirSources(force = false) {
  if (!force) {
    const c = cacheGet('ummah.tafsir.sources');
    if (c) return c;
  }
  const d = await data('/tafsir');
  const list = d.tafasir || [];
  cacheSet('ummah.tafsir.sources', list);
  return list;
}

export function fetchTafsir(surah, ayah, tafsirKey = 'ibn_kathir') {
  return data(`/tafsir/${encodeURIComponent(tafsirKey)}/surah/${surah}/ayah/${ayah}`);
}

/* ============================================================
   Zakat — live nisab prices
   ============================================================ */
export async function fetchZakatPrices(force = false) {
  if (!force) {
    const c = cacheGet('ummah.zakat.prices');
    if (c) return c;
  }
  const d = await data('/zakat/prices');
  cacheSet('ummah.zakat.prices', d);
  return d;
}

/* ============================================================
   Duas — full online collection (126 duas, categorised)
   ============================================================ */
export async function fetchOnlineDuas(force = false) {
  if (!force) {
    const c = cacheGet('ummah.duas');
    if (c) return c;
  }
  const d = await data('/duas');
  const out = { categories: d.categories || [], duas: d.duas || [] };
  cacheSet('ummah.duas', out);
  return out;
}

/* ============================================================
   Islamic months — significance reference
   ============================================================ */
export async function fetchIslamicMonths(force = false) {
  if (!force) {
    const c = cacheGet('ummah.months');
    if (c) return c;
  }
  const d = await data('/islamic-months');
  const months = d.months || [];
  cacheSet('ummah.months', months);
  return months;
}

/* ============================================================
   Quran — Juz reading (30 juz, full verses)
   ============================================================ */
export function fetchJuz(n) {
  return data(`/quran/juz/${n}`);
}

/* ============================================================
   Islamic baby names — searchable, gender filter
   ============================================================ */
export async function fetchBabyNames(force = false) {
  if (!force) {
    const c = cacheGet('ummah.names');
    if (c) return c;
  }
  const d = await data('/names', { limit: 500 });
  const names = d.names || [];
  cacheSet('ummah.names', names);
  return names;
}

/* ============================================================
   Moon — new moons / phases for a hijri-aware calendar
   ============================================================ */
export async function fetchMoonPhases(year, force = false) {
  const cacheKey = 'ummah.moon.' + year;
  if (!force) {
    const c = cacheGet(cacheKey);
    if (c) return c;
  }
  const d = await data('/moon/phases', { year });
  const moons = d.new_moons || [];
  cacheSet(cacheKey, moons);
  return moons;
}

/* ============================================================
   Prayer — full month timetable for coordinates
   ============================================================ */
export function fetchPrayerMonth(lat, lng, month, year) {
  return data('/prayer-times/month', { latitude: lat, longitude: lng, month, year });
}
