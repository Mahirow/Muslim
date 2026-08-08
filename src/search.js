// ============================================================
//  search.js — universal Noor search
//  One input that searches across the Qur'an, hadith,
//  Names of Allah and duas — with sources shown, recent
//  searches remembered, and an "Ask Noor AI" fallback.
// ============================================================
import { store, esc } from './lib.js';
import { switchTab } from './main.js';
import { searchQuran, searchHadith, fetchAsmaUlHusna, fetchOnlineDuas } from './ummah-api.js';

const RECENT_KEY = 'noor.search.recent';
let overlay = null;
let timer = null;
let currentQuery = '';

function openAI(text) {
  closeSearch();
  const fab = document.getElementById('aiFab');
  if (fab) fab.classList.add('active');
  import('./ai-chat.js').then((chat) => {
    chat.openChat(text);
  }).catch(() => {});
}

function recents() {
  return store.get(RECENT_KEY, []);
}
function addRecent(q) {
  const q2 = q.trim();
  if (!q2) return;
  const list = [q2, ...recents().filter((x) => x !== q2)].slice(0, 6);
  store.set(RECENT_KEY, list);
}

function renderRecents() {
  const host = overlay.querySelector('#searchRecents');
  const list = recents();
  host.innerHTML = list.length
    ? list.map((q) => `<button class="search-recent" data-q="${esc(q)}">${esc(q)}</button>`).join('')
    : '';
  host.querySelectorAll('.search-recent').forEach((b) =>
    b.addEventListener('click', () => {
      const inp = overlay.querySelector('#searchInput');
      inp.value = b.dataset.q;
      runQuery(b.dataset.q);
    })
  );
}

function renderResults(html) {
  overlay.querySelector('#searchResults').innerHTML = html;
}

function group(label, itemsHtml) {
  if (!itemsHtml) return '';
  return `<div class="sr-group"><div class="sr-group-label">${label}</div>${itemsHtml}</div>`;
}

function item({ ref, title, ar, snippet, onClick }) {
  const b = document.createElement('button');
  b.className = 'sr-item';
  b.innerHTML = `
    ${ref ? `<span class="sr-ref">${ref}</span>` : ''}
    ${title ? `<span class="sr-title">${title}</span>` : ''}
    ${ar ? `<div class="sr-ar">${ar}</div>` : ''}
    ${snippet ? `<span class="sr-snippet">${snippet}</span>` : ''}`;
  b.addEventListener('click', onClick);
  return b.outerHTML;
}

async function runQuery(raw) {
  const q = raw.trim();
  currentQuery = q;
  if (q.length < 2) {
    renderRecents();
    renderResults(`<div class="search-empty">Search the Qur'an, hadith, duas and Names of Allah.<br/>Try <b>patience</b>, <b>mercy</b>, <b>sabr</b>, <b>jannah</b>…</div>`);
    return;
  }
  addRecent(q);
  renderRecents();
  renderResults(`<div class="empty"><div class="spinner"></div>Searching “${esc(q)}”…</div>`);

  const sources = await Promise.allSettled([
    searchQuran(q, 8).catch(() => null),
    searchHadith(q, 6).catch(() => null),
    fetchAsmaUlHusna().then((names) =>
      (names || []).filter((n) =>
        (n.transliteration || '').toLowerCase().includes(q.toLowerCase()) ||
        (n.meaning || '').toLowerCase().includes(q.toLowerCase()) ||
        (n.en || '').toLowerCase().includes(q.toLowerCase())
      ).slice(0, 5)
    ).catch(() => []),
    fetchOnlineDuas().then((d) => {
      const duas = d.duas || [];
      return duas
        .filter((x) =>
          (x.title || '').toLowerCase().includes(q.toLowerCase()) ||
          (x.category || '').toLowerCase().includes(q.toLowerCase()) ||
          (x.translation || '').toLowerCase().includes(q.toLowerCase()) ||
          (x.arabic || '').includes(q)
        )
        .slice(0, 5);
    }).catch(() => []),
  ]);

  const quran = sources[0].status === 'fulfilled' ? (sources[0].value?.results || []) : [];
  const hadith = sources[1].status === 'fulfilled' ? (sources[1].value?.results || []) : [];
  const names = sources[2].status === 'fulfilled' ? sources[2].value : [];
  const duas = sources[3].status === 'fulfilled' ? sources[3].value : [];

  const quranHtml = quran.map((r) => item({
    ref: `${r.surah_number}:${r.ayah} · ${esc(r.surah_name || '')}`,
    ar: r.arabic || '',
    snippet: r.translation ? `“${esc(r.translation)}”` : '',
    onClick: () => {
      closeSearch();
      switchTab('quran').then(() =>
        window.dispatchEvent(new CustomEvent('noor-open-surah', { detail: { s: r.surah_number, a: r.ayah } }))
      );
    },
  })).join('');

  const hadithHtml = hadith.map((h) => item({
    ref: h.collection ? esc(h.collection) : (h.book ? esc(h.book) : 'Hadith'),
    title: esc((h.text || '').slice(0, 140)) + (h.text && h.text.length > 140 ? '…' : ''),
    onClick: () => {
      closeSearch();
      switchTab('education');
      window.dispatchEvent(new CustomEvent('noor-learn-view', { detail: { view: 'hadith' } }));
    },
  })).join('');

  const namesHtml = names.map((n) => item({
    ref: esc(String(n.id || '')) ? `${n.id}. ` : '',
    title: esc(n.transliteration || ''),
    ar: n.arabic || '',
    snippet: esc(n.meaning || ''),
    onClick: () => {
      closeSearch();
      switchTab('education');
      window.dispatchEvent(new CustomEvent('noor-learn-view', { detail: { view: 'names' } }));
    },
  })).join('');

  const duasHtml = duas.map((d) => item({
    ref: esc(d.category || 'Dua'),
    title: esc(d.title || ''),
    snippet: esc((d.translation || '').slice(0, 110)),
    onClick: () => {
      closeSearch();
      switchTab('education');
      window.dispatchEvent(new CustomEvent('noor-learn-view', { detail: { view: 'duas' } }));
    },
  })).join('');

  const total = quran.length + hadith.length + names.length + duas.length;
  if (!total) {
    renderResults(`
      <div class="search-empty">
        No direct matches for “${esc(q)}”.<br/>
        Noor AI can still answer it from the Qur'an, hadith and trusted sources.
      </div>`);
    return;
  }

  renderResults(`
    ${group("Qur'an", quranHtml)}
    ${group('Hadith', hadithHtml)}
    ${group('Names of Allah', namesHtml)}
    ${group('Duas', duasHtml)}
    <button class="search-ai-cta" id="searchAskAI">
      <span class="ai-logo"><svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21a9 9 0 1 1 6.4-15.3"/><path d="M15 3l.9 2.1L18 6l-2.1.9L15 9l-.9-2.1L12 6l2.1-.9z"/></svg></span>
      <span style="flex:1"><b>Ask Noor AI</b><span>“${esc(q)}” — with sources</span></span>
      <span class="more-row-arrow">›</span>
    </button>`);
  const aiBtn = overlay.querySelector('#searchAskAI');
  if (aiBtn) aiBtn.addEventListener('click', () => openAI(q));
}

function build() {
  overlay = document.createElement('div');
  overlay.className = 'search-overlay';
  overlay.id = 'searchOverlay';
  overlay.innerHTML = `
    <div class="search-top">
      <div class="search-bar">
        <button class="search-back" id="searchBack" aria-label="Close search">
          <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>
        </button>
        <div class="search-input-wrap">
          <input class="search-input" id="searchInput" type="search" placeholder="Search Noor…" autocomplete="off" enterkeyhint="search" aria-label="Search Noor" />
          <button class="search-clear" id="searchClear" aria-label="Clear">✕</button>
        </div>
      </div>
      <div class="search-hint">Qur'an · hadith · duas · Names of Allah — with sources</div>
    </div>
    <div class="search-recents" id="searchRecents"></div>
    <div class="search-results" id="searchResults"></div>`;
  document.body.appendChild(overlay);

  const inp = overlay.querySelector('#searchInput');
  overlay.querySelector('#searchBack').addEventListener('click', closeSearch);
  overlay.querySelector('#searchClear').addEventListener('click', () => {
    inp.value = '';
    currentQuery = '';
    runQuery('');
    inp.focus();
  });
  inp.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(() => runQuery(inp.value), 320);
  });
  inp.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      clearTimeout(timer);
      runQuery(inp.value);
    }
    if (e.key === 'Escape') closeSearch();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSearch();
  });
}

export function openSearch() {
  if (!overlay || !document.body.contains(overlay)) build();
  renderRecents();
  const inp = overlay.querySelector('#searchInput');
  inp.value = currentQuery;
  runQuery(currentQuery);
  document.body.style.overflow = 'hidden';
  requestAnimationFrame(() => inp.focus());
}

export function closeSearch() {
  if (!overlay) return;
  overlay.remove();
  overlay = null;
  clearTimeout(timer);
  document.body.style.overflow = '';
}
