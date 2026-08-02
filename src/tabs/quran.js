// ============================================================
//  TAB 2 — QURAN & HIFZ
//  - 114 surah directory (fetched from alquran.cloud)
//  - Dual reading & listening engine (Arabic + English + audio)
//  - AI Smart Hifz voice tester (Web Speech API, ar-SA / ar-AE)
// ============================================================
import { fetchSurahs, fetchSurahDetail } from '../quran-api.js';
import { store, vibrate, toast, esc, wordsOf, normalizeArabic } from '../lib.js';
import { searchQuran, randomAyah, fetchTafsirSources, fetchTafsir, fetchJuz } from '../ummah-api.js';

let surahs = [];            // 114 surah list
let current = null;         // current surah detail
let audioEl = null;
let playing = { active: false, index: -1, timer: null };
let hifz = {
  surahNumber: '',
  official: [],
  rec: null,
  recording: false,
  langIdx: 0,
  okCount: 0,
};

const LANGS = ['ar-SA', 'ar-AE'];

export function mount(el) {
  el.innerHTML = `
    <div class="seg seg-scroll">
      <button class="seg-btn active" data-view="surahs">📖 Surahs</button>
      <button class="seg-btn" data-view="juz">📚 Juz</button>
      <button class="seg-btn" data-view="search">🔍 Search</button>
      <button class="seg-btn" data-view="tafsir">📜 Tafsir</button>
      <button class="seg-btn" data-view="hifz">🎙️ Hifz</button>
    </div>
    <div id="quranView"></div>
  `;
  el.querySelectorAll('.seg-btn').forEach((b) =>
    b.addEventListener('click', () => switchView(el, b.dataset.view))
  );
  renderSurahs(el);
  ensureAudio();
}

function switchView(el, view) {
  el.querySelectorAll('.seg-btn').forEach((b) => b.classList.toggle('active', b.dataset.view === view));
  if (view === 'surahs') renderSurahs(el);
  else if (view === 'juz') renderJuz(el);
  else if (view === 'search') renderSearch(el);
  else if (view === 'tafsir') renderTafsir(el);
  else renderHifz(el);
}

/* ============================================================
   Surah directory
   ============================================================ */
async function renderSurahs(el) {
  const host = el.querySelector('#quranView');
  host.innerHTML = `
    <div class="card">
      <div class="card-head">
        <span class="card-ico">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6c-2-1.6-4.5-2.2-7-2.2v15c2.5 0 5 .6 7 2.2 2-1.6 4.5-2.2 7-2.2v-15c-2.5 0-5 .6-7 2.2z"/><path d="M12 6v15"/></svg>
        </span>
        <div><div class="card-title">The 114 Surahs</div><div class="card-sub">Loaded live from quran.com — no hardcoded text</div></div>
      </div>
      <div class="searchbar">
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
        <input class="input" id="surahSearch" type="search" placeholder="Search by name or number…" autocomplete="off" />
      </div>
      <button class="btn btn-ghost btn-block btn-sm" id="randomAyahBtn" style="margin-bottom:10px">🎲 Random ayah of the moment</button>
      <div id="surahList"><div class="empty"><div class="spinner"></div>Connecting to quran.com…</div></div>
    </div>`;

  const listHost = host.querySelector('#surahList');
  host.querySelector('#randomAyahBtn').addEventListener('click', async () => {
    const btn = host.querySelector('#randomAyahBtn');
    btn.disabled = true;
    try {
      const d = await randomAyah();
      const s = d.surah || {};
      const v = d.verse || {};
      const trans = (v.translations && v.translations.sahih_international) || '';
      listHost.innerHTML = `
        <div class="card" style="box-shadow:none">
          <div class="random-ayah-ref">${s.number}:${v.ayah} · ${esc(s.name_english)} · ${esc(s.name_translation || '')}</div>
          <div class="quote-ar" style="margin:10px 0">${v.arabic || ''}</div>
          <div class="quote-en">“${esc(trans)}”</div>
          <button class="btn btn-gold btn-block btn-sm" id="openThisAyah" style="margin-top:10px">📖 Open in reader</button>
        </div>`;
      host.querySelector('#openThisAyah').addEventListener('click', () => {
        openSurah(parseInt(s.number, 10), parseInt(v.ayah, 10));
      });
    } catch {
      toast('Could not fetch a random ayah', 'error');
    } finally {
      btn.disabled = false;
    }
  });
  host.querySelector('#surahSearch').addEventListener('input', (e) => {
    const q = e.target.value.trim().toLowerCase();
    const rows = surahs
      .filter((s) =>
        !q ||
        String(s.number) === q.replace('#', '') ||
        s.englishName.toLowerCase().includes(q) ||
        (s.translation || '').toLowerCase().includes(q) ||
        s.name.includes(q)
      );
    listHost.innerHTML = rows.map(surahRow).join('') || emptyHtml('No surah matches “' + esc(e.target.value.trim()) + '”');
    wireRows(listHost);
  });

  try {
    if (!surahs.length) surahs = await fetchSurahs();
    listHost.innerHTML = surahs.map(surahRow).join('');
    wireRows(listHost);
    toast(`Loaded ${surahs.length} surahs from quran.com`, 'success');
  } catch (err) {
    listHost.innerHTML = `
      <div class="error-box">
        Could not reach the Quran API — check your connection.<br/>
        <button class="btn btn-emerald btn-sm" id="retrySurahs">Try again</button>
      </div>`;
    host.querySelector('#retrySurahs').addEventListener('click', () => {
      store.del('noor.surahs');
      renderSurahs(el);
    });
  }
}

function surahRow(s) {
  return `
    <button class="surah-row" data-n="${s.number}">
      <span class="surah-num">${s.number}</span>
      <span class="surah-main">
        <span class="surah-name"><span class="ar">${s.name}</span>${esc(s.englishName)}</span>
        <span class="surah-sub">
          <span class="chip ${s.type === 'Meccan' ? 'chip-meccan' : 'chip-medinan'}">${s.type}</span>
          <span>${s.ayahs} verses</span>
          <span>${esc(s.translation || '')}</span>
        </span>
      </span>
      <span class="surah-chev">›</span>
    </button>`;
}

function wireRows(host) {
  host.querySelectorAll('.surah-row').forEach((row) =>
    row.addEventListener('click', () => openSurah(parseInt(row.dataset.n, 10)))
  );
}

function emptyHtml(msg) {
  return `<div class="empty">${msg}</div>`;
}

/* ============================================================
   Juz reading (Ummah API — Arabic + Sahih International)
   ============================================================ */
async function renderJuz(el) {
  const host = el.querySelector('#quranView');
  host.innerHTML = `
    <div class="card">
      <div class="card-head">
        <span class="card-ico">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6c-2-1.6-4.5-2.2-7-2.2v15c2.5 0 5 .6 7 2.2 2-1.6 4.5-2.2 7-2.2v-15c-2.5 0-5 .6-7 2.2z"/><path d="M12 6v15"/></svg>
        </span>
        <div><div class="card-title">Read by Juz</div><div class="card-sub">One-thirtieth of the Quran · Arabic + Sahih International</div></div>
      </div>
      <div class="hifz-pick">
        <select class="select" id="juzSelect">${Array.from({ length: 30 }, (_, i) => `<option value="${i + 1}">Juz ${i + 1}</option>`).join('')}</select>
        <button class="btn btn-gold btn-sm" id="juzGo">Read</button>
      </div>
      <div class="field-hint" style="margin-top:8px">Perfect for Tarawih &amp; Khatm plans — read one juz a day to complete the Quran in a month. 🌙</div>
      <div id="juzBody"><div class="empty">Pick a juz and press <b>Read</b>.</div></div>
    </div>`;
  const go = host.querySelector('#juzGo');
  const load = async () => {
    const n = parseInt(host.querySelector('#juzSelect').value, 10);
    const body = host.querySelector('#juzBody');
    body.innerHTML = `<div class="empty"><div class="spinner"></div>Fetching Juz ${n}…</div>`;
    try {
      const d = await fetchJuz(n);
      const verses = d.verses || [];
      if (!verses.length) throw new Error('empty');
      let lastSurah = '';
      body.innerHTML = `
        <div class="juz-head"><span class="juz-badge">Juz ${n}</span><span>${verses.length} verses · ${esc(d.verses_mapping && Object.keys(d.verses_mapping).length ? Object.keys(d.verses_mapping).length + ' surahs' : '')}</span></div>
        ${verses.map((v) => {
          const sName = v.surah_name || '';
          const head = sName !== lastSurah ? `<div class="juz-surah-divider">${esc(sName)}</div>` : '';
          lastSurah = sName;
          const trans = (v.translations && (v.translations.sahih_international || v.translations.pickthall || v.translations.yusuf_ali)) || '';
          return `
            ${head}
            <div class="ayah" style="border-bottom:1px dashed var(--line);padding-bottom:12px;margin-bottom:12px">
              <span class="ayah-num">${esc(v.verse_key)}</span>
              <div class="ayah-ar">${v.arabic || ''}</div>
              <div class="ayah-en">${esc(trans)}</div>
            </div>`;
        }).join('')}`;
      body.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch {
      body.innerHTML = `<div class="error-box">Could not load Juz ${n} — check your connection.<br/><button class="btn btn-emerald btn-sm" id="juzRetry">Try again</button></div>`;
      body.querySelector('#juzRetry')?.addEventListener('click', load);
    }
  };
  go.addEventListener('click', load);
}

/* ============================================================
   Quran search (Ummah API)
   ============================================================ */
async function renderSearch(el) {
  const host = el.querySelector('#quranView');
  host.innerHTML = `
    <div class="card">
      <div class="card-head">
        <span class="card-ico">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
        </span>
        <div><div class="card-title">Search the Quran</div><div class="card-sub">Full-text search across Arabic + translations · Ummah API</div></div>
      </div>
      <div class="searchbar">
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
        <input class="input" id="quranSearch" type="search" placeholder="e.g. mercy, light, patience, رحمة…" autocomplete="off" />
      </div>
      <div id="qSearchResults">
        <div class="empty">Type a word or concept — e.g. <b>mercy</b>, <b>patience</b>, <b>sabr</b>, <b>jannah</b> — and tap a result to read it in the full reader.</div>
      </div>
    </div>`;
  const resultsHost = host.querySelector('#qSearchResults');
  let timer = null;
  host.querySelector('#quranSearch').addEventListener('input', (e) => {
    clearTimeout(timer);
    const q = e.target.value.trim();
    if (q.length < 2) {
      resultsHost.innerHTML = `<div class="empty">Keep typing… results appear instantly.</div>`;
      return;
    }
    timer = setTimeout(async () => {
      resultsHost.innerHTML = `<div class="empty"><div class="spinner"></div>Searching “${esc(q)}”…</div>`;
      try {
        const d = await searchQuran(q, 20);
        const results = d.results || [];
        if (!results.length) {
          resultsHost.innerHTML = `<div class="empty">No verses match “${esc(q)}”. Try an English or Arabic keyword.</div>`;
          return;
        }
        resultsHost.innerHTML = results.map((r) => `
          <button class="qsearch-row" data-s="${r.surah_number}" data-a="${r.ayah}">
            <span class="qsearch-ref">${r.surah_number}:${r.ayah} <span class="qsearch-surah">${esc(r.surah_name)}</span></span>
            <span class="qsearch-ar">${r.arabic || ''}</span>
            <span class="qsearch-en">${esc(r.translation || '')}</span>
          </button>`).join('');
        resultsHost.querySelectorAll('.qsearch-row').forEach((row) => {
          row.addEventListener('click', () => {
            openSurah(parseInt(row.dataset.s, 10), parseInt(row.dataset.a, 10));
          });
        });
      } catch {
        resultsHost.innerHTML = `<div class="error-box">Search failed — check your connection.</div>`;
      }
    }, 400);
  });
}

/* ============================================================
   Tafsir browser (Ummah API — Ibn Kathir, Ma'arif, Muyassar)
   ============================================================ */
async function renderTafsir(el) {
  const host = el.querySelector('#quranView');
  host.innerHTML = `
    <div class="card">
      <div class="card-head">
        <span class="card-ico gold">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/></svg>
        </span>
        <div><div class="card-title">Tafsir — Commentary</div><div class="card-sub">Ibn Kathir · Ma'arif · Muyassar · Ummah API</div></div>
      </div>
      <div class="auto-grid">
        <div class="field">
          <label class="field-label" for="tafsirSurah">Surah</label>
          <select class="select" id="tafsirSurah"><option value="">Loading…</option></select>
        </div>
        <div class="field">
          <label class="field-label" for="tafsirAyah">Ayah number</label>
          <input class="input" id="tafsirAyah" type="number" min="1" placeholder="1" />
        </div>
      </div>
      <div class="field">
        <label class="field-label" for="tafsirSource">Commentary source</label>
        <select class="select" id="tafsirSource"></select>
      </div>
      <button class="btn btn-gold btn-block" id="tafsirGo">Fetch tafsir</button>
      <div id="tafsirResult"><div class="empty">Pick a surah &amp; ayah, then press Fetch — or tap <b>📖 Tafsir</b> under any verse in the reader.</div></div>
    </div>`;

  try {
    if (!surahs.length) surahs = await fetchSurahs();
    const sel = host.querySelector('#tafsirSurah');
    sel.innerHTML = surahs.map((s) => `<option value="${s.number}">${s.number}. ${esc(s.englishName)}</option>`).join('');
    const srcSel = host.querySelector('#tafsirSource');
    const sources = await fetchTafsirSources();
    srcSel.innerHTML = sources.map((t) => `<option value="${esc(t.key)}">${esc(t.name)}${t.language === 'arabic' ? ' · العربية' : ''}</option>`).join('');
    host.querySelector('#tafsirGo').addEventListener('click', async () => {
      const s = parseInt(sel.value, 10);
      const a = parseInt(host.querySelector('#tafsirAyah').value, 10);
      const key = srcSel.value;
      const box = host.querySelector('#tafsirResult');
      if (!s || !a || a < 1) return toast('Pick a surah and a valid ayah number', 'error');
      box.innerHTML = `<div class="empty"><div class="spinner"></div>Loading tafsir of ${s}:${a}…</div>`;
      try {
        const d = await fetchTafsir(s, a, key);
        const t = d.tafsir || {};
        box.innerHTML = `
          <div class="tafsir-label">📖 ${esc(t.name || 'Tafsir')} · ${esc(t.author || '')} · ${s}:${a}</div>
          <div class="tafsir-text">${esc(t.text || 'No commentary available for this ayah.')}</div>
        `;
        box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } catch {
        box.innerHTML = `<div class="error-box">Could not load tafsir — check your connection.</div>`;
      }
    });
  } catch {
    host.querySelector('#tafsirResult').innerHTML = `<div class="error-box">Could not load tafsir sources — check your connection.</div>`;
  }
}

/* ============================================================
   Reader + audio player
   ============================================================ */
async function openSurah(number, jumpAyah = null) {
  const host = document.querySelector('#quranView');
  stopPlayback();
  host.innerHTML = `
    <div class="card">
      <div class="reader-head">
        <button class="back-btn" id="backList" aria-label="Back">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>
        </button>
        <div class="reader-title"><h3><span class="ar" id="rArName">…</span><span id="rEnName">Surah</span></h3><p id="rMeta">Loading from quran.com…</p></div>
      </div>
      <div class="audio-bar">
        <button class="audio-play" id="playBtn" aria-label="Play surah">
          <svg id="playIco" viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M7 4.5v15l13-7.5z"/></svg>
        </button>
        <div class="audio-info">
          <div class="audio-title">Alafasy recitation · streaming</div>
          <div class="audio-status" id="audioStatus">Tap play to listen while you read</div>
          <div class="audio-seek"><span id="audioSeek"></span></div>
        </div>
      </div>
      <div id="ayahList"><div class="empty"><div class="spinner"></div>Fetching Arabic · English · audio (quran.com)…</div></div>
    </div>`;

  host.querySelector('#backList').addEventListener('click', () => renderSurahs(getTabHost()));

  try {
    current = await fetchSurahDetail(number);
    document.getElementById('rArName').textContent = current.name;
    document.getElementById('rEnName').textContent = current.englishName;
    document.getElementById('rMeta').textContent = `${current.englishNameTranslation} · ${current.revelationType} · ${current.numberOfAyahs} verses`;
    renderAyahs();
    wirePlay();
    if (jumpAyah) {
      const idx = current.ayahs.findIndex((a) => a.num === jumpAyah);
      if (idx >= 0) {
        const node = document.getElementById('ayahList').children[idx];
        if (node) {
          node.scrollIntoView({ block: 'center', behavior: 'smooth' });
          node.classList.add('ayah-flash');
          setTimeout(() => node.classList.remove('ayah-flash'), 2200);
        }
      }
    }
  } catch {
    const box = host.querySelector('#ayahList');
    box.innerHTML = `
      <div class="error-box">
        Could not load Surah ${number}. Please check your connection.<br/>
        <button class="btn btn-emerald btn-sm" id="retrySurah">Try again</button>
      </div>`;
    box.querySelector('#retrySurah').addEventListener('click', () => openSurah(number));
  }
}

function renderAyahs() {
  document.getElementById('ayahList').innerHTML = current.ayahs.map(
    (a, i) => `
      <div class="ayah" data-i="${i}" data-audio="${esc(a.audio)}">
        <span class="ayah-num">${a.num}</span>
        <div class="ayah-ar">${a.ar}</div>
        <div class="ayah-en">${esc(a.en)}</div>
        <div class="ayah-actions">
          <button class="ayah-tafsir-btn" data-i="${i}" aria-label="Tafsir of this ayah">📖 Tafsir</button>
          <span class="ayah-ar-note">tap the verse to play audio</span>
        </div>
      </div>`
  ).join('');
  document.querySelectorAll('#ayahList .ayah').forEach((node) => {
    node.addEventListener('click', () => {
      const i = parseInt(node.dataset.i, 10);
      playFrom(i);
    });
  });
  document.querySelectorAll('.ayah-tafsir-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const i = parseInt(btn.dataset.i, 10);
      toggleAyahTafsir(btn, i);
    });
  });
}

/* ---------------- per-ayah tafsir ---------------- */
async function toggleAyahTafsir(btn, i) {
  const ayah = current.ayahs[i];
  if (!ayah) return;
  const wrap = document.getElementById('ayahList');
  let box = wrap.children[i] && wrap.children[i].querySelector('.ayah-tafsir');
  if (box) {
    box.remove();
    btn.classList.remove('on');
    return;
  }
  btn.classList.add('on');
  const node = wrap.children[i];
  const div = document.createElement('div');
  div.className = 'ayah-tafsir';
  div.innerHTML = `<div class="empty"><div class="spinner"></div>Loading Ibn Kathir tafsir…</div>`;
  node.appendChild(div);
  try {
    const d = await fetchTafsir(current.number, ayah.num, 'ibn_kathir');
    const t = d.tafsir || {};
    div.innerHTML = `
      <div class="tafsir-label">📖 Tafsir · ${esc(t.name || 'Ibn Kathir')} · ${current.number}:${ayah.num}</div>
      <div class="tafsir-text">${esc(t.text || 'No commentary available for this ayah.')}</div>
    `;
  } catch {
    div.innerHTML = `<div class="error-box" style="font-size:0.78rem">Could not load tafsir — check your connection.</div>`;
  }
}

/* ---------------- audio engine ---------------- */
function ensureAudio() {
  if (!audioEl) {
    audioEl = document.createElement('audio');
    audioEl.preload = 'none';
    audioEl.addEventListener('ended', () => {
      if (playing.active && current) {
        playFrom(playing.index + 1);
      }
    });
  }
}
function playFrom(i) {
  if (!current || !current.ayahs[i]) return stopPlayback();
  const ayah = current.ayahs[i];
  if (!ayah.audio) {
    toast('No audio stream for this ayah', 'error');
    return;
  }
  stopPlayback(false);
  playing.active = true;
  playing.index = i;
  audioEl.src = ayah.audio;
  audioEl.play().catch(() => toast('Audio blocked — tap play again', 'error'));
  updatePlayUI();
  document.querySelectorAll('#ayahList .ayah').forEach((n, idx) => n.classList.toggle('playing', idx === i));
  document.getElementById('ayahList').children[i]?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  clearInterval(playing.timer);
  playing.timer = setInterval(updateSeek, 500);
}
function stopPlayback(ui = true) {
  clearInterval(playing.timer);
  playing.active = false;
  playing.index = -1;
  if (audioEl) {
    audioEl.pause();
    audioEl.removeAttribute('src');
  }
  if (ui) {
    const st = document.getElementById('audioStatus');
    const seek = document.getElementById('audioSeek');
    if (st) st.textContent = 'Tap play to listen while you read';
    if (seek) seek.style.width = '0%';
    const ico = document.getElementById('playIco');
    if (ico) ico.innerHTML = '<path d="M7 4.5v15l13-7.5z"/>';
    document.querySelectorAll('#ayahList .ayah.playing').forEach((n) => n.classList.remove('playing'));
  }
}
function wirePlay() {
  document.getElementById('playBtn').addEventListener('click', () => {
    if (playing.active) { stopPlayback(); return; }
    playFrom(playing.index >= 0 ? playing.index : 0);
  });
}
function updatePlayUI() {
  const ico = document.getElementById('playIco');
  const st = document.getElementById('audioStatus');
  if (ico) ico.innerHTML = '<path d="M7 4.5v15h4v-15zM14 4.5v15h4v-15z"/>';
  if (st && current) st.textContent = `Playing ayah ${current.ayahs[playing.index].num} of ${current.numberOfAyahs}`;
}
function updateSeek() {
  const seek = document.getElementById('audioSeek');
  if (seek && audioEl && audioEl.duration) {
    seek.style.width = Math.min(100, (audioEl.currentTime / audioEl.duration) * 100) + '%';
  }
}

/* ============================================================
   Hifz voice tester (Web Speech API)
   ============================================================ */
async function renderHifz(el) {
  const host = el.querySelector('#quranView');
  host.innerHTML = `
    <div class="card">
      <div class="card-head">
        <span class="card-ico gold">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>
        </span>
        <div><div class="card-title">Hifz Voice Tester</div><div class="card-sub">Recite from memory — errors light up red</div></div>
      </div>
      <div class="hifz-pick">
        <select class="select" id="hifzSurah"><option value="">Select surah…</option></select>
        <button class="btn btn-emerald btn-sm" id="hifzLoad">Load</button>
      </div>
      <div id="hifzBody">
        <div class="empty">Pick a surah and press Load to fetch its official text.</div>
      </div>
    </div>
    <div class="footer-note">
      Works best in Chrome / Android with the Web Speech API.<br/>Supported languages: <b>العربية ar-SA · ar-AE</b>
    </div>`;

  try {
    if (!surahs.length) surahs = await fetchSurahs();
    const sel = host.querySelector('#hifzSurah');
    surahs.forEach((s) => {
      const o = document.createElement('option');
      o.value = s.number;
      o.textContent = `${s.number}. ${s.englishName} (${s.name})`;
      sel.appendChild(o);
    });
    if (hifz.surahNumber) sel.value = hifz.surahNumber;
    sel.addEventListener('change', () => {
      hifz.surahNumber = sel.value;
      stopHifz();
      host.querySelector('#hifzBody').innerHTML = `<div class="empty">Press <b>Load</b> to fetch the official text of Surah ${sel.value}.</div>`;
    });
    host.querySelector('#hifzLoad').addEventListener('click', async () => {
      if (!hifz.surahNumber) return toast('Pick a surah first', 'error');
      await loadHifzText(el);
    });
    if (hifz.surahNumber) loadHifzText(el);
  } catch {
    host.querySelector('#hifzBody').innerHTML = `<div class="error-box">Could not load surah list. Check your connection and retry.</div>`;
  }
}

async function loadHifzText(el) {
  const host = el.querySelector('#quranView');
  const body = host.querySelector('#hifzBody');
  body.innerHTML = `<div class="empty"><div class="spinner"></div>Fetching official Arabic text of Surah ${hifz.surahNumber}…</div>`;
  try {
    const detail = await fetchSurahDetail(parseInt(hifz.surahNumber, 10));
    hifz.official = detail.ayahs.flatMap((a) => wordsOf(a.ar));
    hifz.okCount = 0;
    body.innerHTML = `
      <div class="hifz-canvas" id="hifzCanvas"><div class="empty" style="padding:10px">Press the mic button and recite from memory — your spoken words will appear here.</div></div>
      <div class="hifz-stats">
        <span>Correctly sequenced: <b id="hifzOk">0</b> / ${hifz.official.length}</span>
        <span id="hifzLang">ar-SA</span>
      </div>
      <button class="mic-btn" id="hifzMic">
        <span class="mic-dot"></span> Tap to Record &amp; Recite Hifz
      </button>
      <button class="btn btn-ghost btn-block btn-sm" id="hifzReset" style="margin-top:10px">Start over</button>
    `;
    const mic = body.querySelector('#hifzMic');
    mic.addEventListener('click', toggleHifzMic(el));
    body.querySelector('#hifzReset').addEventListener('click', () => {
      hifz.okCount = 0;
      hifz.official = detail.ayahs.flatMap((a) => wordsOf(a.ar));
      const c = body.querySelector('#hifzCanvas');
      c.innerHTML = `<div class="empty" style="padding:10px">Ready — recite from memory now.</div>`;
      updateHifzStats(el);
    });
  } catch {
    body.innerHTML = `<div class="error-box">Could not fetch Surah ${hifz.surahNumber}. Check your connection.</div>`;
  }
}

function getSpeechRecognition() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  return SR ? new SR() : null;
}

function toggleHifzMic(el) {
  const host = el.querySelector('#quranView');
  const body = host.querySelector('#hifzBody');
  if (hifz.recording) { stopHifz(); return; }
  if (!hifz.official.length) return toast('Load a surah first', 'error');
  if (!getSpeechRecognition()) {
    return toast('Speech recognition is not supported in this browser — try Chrome on Android', 'error');
  }
  startHifz(el, body);
}

function startHifz(el, body) {
  const canvas = body.querySelector('#hifzCanvas');
  const micBtn = body.querySelector('#hifzMic');
  const rec = getSpeechRecognition();
  if (!rec) return;
  hifz.rec = rec;
  hifz.recording = true;
  hifz.langIdx = 0;
  let transcript = '';
  const official = hifz.official;

  rec.lang = LANGS[hifz.langIdx];
  rec.continuous = true;
  rec.interimResults = true;
  rec.maxAlternatives = 1;

  // Hide the reading text — blank slate canvas
  canvas.classList.add('recording');
  canvas.innerHTML = '<div class="empty" style="padding:8px">Listening… recite from memory 🎙️</div>';
  micBtn.classList.add('live');
  micBtn.innerHTML = '<span class="mic-dot"></span> Listening… tap to stop';
  document.getElementById('hifzLang').textContent = LANGS[hifz.langIdx];

  let okCount = hifz.okCount;

  rec.onresult = (ev) => {
    transcript = '';
    for (let i = 0; i < ev.results.length; i++) {
      const r = ev.results[i];
      transcript += r[0].transcript + (r.isFinal ? ' ' : '');
    }
    const spoken = normalizeArabic(transcript).split(' ').filter(Boolean);

    // Sequential comparison against official array order
    const seq = [];
    let i = 0;
    for (const w of spoken) {
      const expected = official[i] ? normalizeArabic(official[i]) : null;
      if (expected && w === expected) {
        seq.push({ w, cls: 'ok' });
        i++;
      } else {
        seq.push({ w, cls: 'err' }); // deviation → bright red
      }
    }
    okCount = i;
    hifz.okCount = i;

    const tail = seq.slice(-46);
    canvas.innerHTML = tail.map((t) => `<span class="hifz-word ${t.cls}">${esc(t.w)}</span>`).join(' ');
    canvas.scrollTop = canvas.scrollHeight;
    updateHifzStats(el, okCount);
    if (okCount >= official.length) {
      vibrate([40, 60, 40]);
      toast('Masha’Allah — you recited the full surah! 🎉', 'success');
      stopHifz();
    }
  };

  rec.onerror = (e) => {
    if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
      toast('Microphone access denied — enable it in browser settings', 'error');
      stopHifz();
    } else if (e.error === 'language-not-supported') {
      hifz.langIdx++;
      if (hifz.langIdx < LANGS.length) {
        rec.lang = LANGS[hifz.langIdx];
        document.getElementById('hifzLang').textContent = LANGS[hifz.langIdx];
        try { rec.start(); } catch { /* noop */ }
      } else {
        toast('Arabic recognition unavailable on this browser', 'error');
        stopHifz();
      }
    } else if (e.error === 'no-speech') {
      canvas.innerHTML = '<div class="empty" style="padding:8px">No speech heard — speak closer to the mic and try again.</div>';
    } else if (e.error === 'audio-capture') {
      toast('No microphone found on this device', 'error');
      stopHifz();
    }
  };

  rec.onend = () => {
    if (hifz.recording) {
      try { rec.start(); } catch { /* restart refused */ }
    }
  };

  try { rec.start(); } catch { toast('Could not start recognition', 'error'); }
}

function stopHifz() {
  if (!hifz.rec) return;
  hifz.recording = false;
  try { hifz.rec.stop(); } catch { /* noop */ }
  hifz.rec = null;
  const micBtn = document.querySelector('#hifzMic');
  const canvas = document.querySelector('#hifzCanvas');
  if (micBtn) {
    micBtn.classList.remove('live');
    micBtn.innerHTML = '<span class="mic-dot"></span> Tap to Record &amp; Recite Hifz';
  }
  if (canvas) canvas.classList.remove('recording');
}

function updateHifzStats(el, ok) {
  const b = el.querySelector('#hifzOk') || document.getElementById('hifzOk');
  if (b) b.textContent = ok != null ? ok : hifz.okCount;
}

function getTabHost() {
  return document.querySelector('#quranView') || document.querySelector('#content');
}
