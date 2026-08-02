// ============================================================
//  quran-api.js — dynamic connection to the free public
//  Quran.com API (api.quran.com/v4) as the PRIMARY source for
//  all surahs, reading, listening and Hifz, with AlQuran Cloud
//  (alquran.cloud) kept as an automatic fallback.
//  No Quran text is hardcoded — everything is fetched live.
// ============================================================
import { store } from './lib.js';

const QURANCOM = 'https://api.quran.com/api/v4';
const CLOUD = 'https://api.alquran.cloud/v1';
const AUDIO_BASE = 'https://verses.quran.com';
const TRANSLATION_SLUG = 'en-sahih-international'; // Saheeh International
const RECITER_ID = 7; // default: Mishary Rashid Alafasy (Murattal)

// In-memory cache of fetched surah details (per session, keyed by reciter)
const detailCache = new Map();

/**
 * Fetch the available reciters (quran.com recitation resources) so the
 * reader can offer a chooser. Free, live, no hardcoded IDs.
 */
export async function fetchRecitations() {
  const json = await getJSON(`${QURANCOM}/resources/recitations?language=en`);
  const recs = json.recitations || [];
  if (!recs.length) throw new Error('No recitations');
  return recs.map((r) => ({ id: r.id, reciter_name: r.reciter_name, style: r.style || '' }));
}

/** Simple GET wrapper with timeout for robustness. */
export async function getJSON(url, timeoutMs = 20000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

/* ============================================================
   Surah directory — all 114 surahs
   ============================================================ */
async function fetchSurahsQuranCom() {
  const json = await getJSON(`${QURANCOM}/chapters?language=en`);
  if (!Array.isArray(json.chapters) || json.chapters.length !== 114) {
    throw new Error('Unexpected chapters payload');
  }
  return json.chapters.map((c) => ({
    number: c.id,
    name: c.name_arabic,
    englishName: c.name_simple,
    translation: (c.translated_name && c.translated_name.name) || '',
    ayahs: c.verses_count,
    type: c.revelation_place === 'makkah' ? 'Meccan' : 'Medinan',
  }));
}

async function fetchSurahsCloud() {
  const json = await getJSON(`${CLOUD}/surah`);
  if (!json.data) throw new Error('Unexpected API response');
  return json.data.map((s) => ({
    number: s.number,
    name: s.name,
    englishName: s.englishName,
    translation: s.englishNameTranslation,
    ayahs: s.numberOfAyahs,
    type: s.revelationType,
  }));
}

/**
 * Fetch the complete list of all 114 surahs.
 * Quran.com first, AlQuran Cloud as fallback.
 * Cached in localStorage for ~7 days so the directory loads instantly offline.
 */
export async function fetchSurahs(force = false) {
  const cached = store.get('noor.surahs', null);
  if (
    cached &&
    Array.isArray(cached.d) &&
    cached.d.length === 114 &&
    !force &&
    Date.now() - cached.t < 7 * 86400000
  ) {
    return cached.d;
  }
  let list;
  try {
    list = await fetchSurahsQuranCom();
  } catch {
    list = await fetchSurahsCloud();
  }
  store.set('noor.surahs', { t: Date.now(), d: list });
  return list;
}

/* ============================================================
   Surah detail — Arabic (Uthmani) + English + ayah audio
   ============================================================ */
const stripHtml = (s) => String(s || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

async function fetchSurahDetailQuranCom(number, reciterId) {
  const [verseJson, transJson, audioJson] = await Promise.all([
    getJSON(`${QURANCOM}/quran/verses/uthmani?chapter_number=${number}`),
    getJSON(`${QURANCOM}/quran/translations/${TRANSLATION_SLUG}?chapter_number=${number}`),
    getJSON(`${QURANCOM}/quran/recitations/${reciterId}?chapter_number=${number}`),
  ]);

  const verses = verseJson.verses || [];
  const translations = transJson.translations || [];
  const audioFiles = audioJson.audio_files || [];

  const enByKey = {};
  translations.forEach((t, i) => {
    if (verses[i]) enByKey[verses[i].verse_key] = stripHtml(t.text);
  });
  const audioByKey = {};
  audioFiles.forEach((a) => {
    audioByKey[a.verse_key] = AUDIO_BASE + '/' + a.url;
  });

  if (!verses.length) throw new Error('No verses returned');

  const ayahs = verses.map((v) => {
    const num = parseInt(String(v.verse_key).split(':')[1], 10);
    return {
      num,
      ar: String(v.text_uthmani || '').trim(),
      en: enByKey[v.verse_key] || '',
      audio: audioByKey[v.verse_key] || '',
    };
  });

  // Chapter metadata (name, revelation type) from the directory endpoint
  let meta = { name: '', englishName: '', translation: '', type: '' };
  try {
    const ch = await getJSON(`${QURANCOM}/chapters/${number}?language=en`);
    const c = ch.chapter;
    if (c) {
      meta = {
        name: c.name_arabic,
        englishName: c.name_simple,
        translation: (c.translated_name && c.translated_name.name) || '',
        type: c.revelation_place === 'makkah' ? 'Meccan' : 'Medinan',
      };
    }
  } catch { /* metadata is optional */ }

  return {
    number,
    name: meta.name,
    englishName: meta.englishName,
    englishNameTranslation: meta.translation,
    revelationType: meta.type,
    numberOfAyahs: ayahs.length,
    ayahs,
  };
}

async function fetchSurahDetailCloud(number) {
  const json = await getJSON(
    `${CLOUD}/surah/${number}/editions/quran-uthmani,en.sahih,ar.alafasy`
  );
  if (!Array.isArray(json.data)) throw new Error('Unexpected API response');
  const byId = {};
  json.data.forEach((e) => {
    byId[e.edition.identifier] = e;
  });
  const ar = byId['quran-uthmani'];
  const en = byId['en.sahih'];
  const aud = byId['ar.alafasy'];
  if (!ar || !en) throw new Error('Edition missing from response');

  const ayahs = ar.ayahs.map((a, i) => ({
    num: a.numberInSurah,
    ar: a.text,
    en: en.ayahs[i] ? en.ayahs[i].text : '',
    audio: aud && aud.ayahs[i] ? aud.ayahs[i].audio || '' : '',
  }));

  return {
    number,
    name: ar.surah.name,
    englishName: ar.surah.englishName,
    englishNameTranslation: ar.surah.englishNameTranslation,
    revelationType: ar.surah.revelationType,
    numberOfAyahs: ar.surah.numberOfAyahs,
    ayahs,
  };
}

/**
 * Fetch one surah: Arabic text, English translation and ayah-by-ayah
 * audio streams for the chosen reciter. Quran.com primary, AlQuran
 * Cloud automatic fallback (fallback audio stays on alafasy).
 */
export async function fetchSurahDetail(number, force = false, reciterId = RECITER_ID) {
  const key = number + ':' + reciterId;
  if (detailCache.has(key) && !force) return detailCache.get(key);
  let detail;
  try {
    detail = await fetchSurahDetailQuranCom(number, reciterId);
  } catch {
    detail = await fetchSurahDetailCloud(number);
  }
  detailCache.set(key, detail);
  return detail;
}
