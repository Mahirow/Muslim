// ============================================================
//  TAB 5 — EDUCATION & RAMADAN
//  - Islamic Studies Hub (Fiqh / Seerah / Aqeedah readers)
//  - Sunnah Fasting Calendar (Mondays, Thursdays, White Days)
//  - Kids Madrasa Quiz Builder (10+ questions, live score)
//  - Duas library (30 authentic supplications + 126 online)
//  - Hadith library (Ummah API · 9 collections + search)
//  - Asma-ul-Husna — the 99 Names of Allah
//  - Events & Islamic months
// ============================================================
import { store, vibrate, toast, esc, islamicDayNum, successSound, failSound } from '../lib.js';
import { STUDIES, QUIZ_QUESTIONS, DUAS_LIBRARY } from '../data.js';
import {
  fetchHadithCollections,
  fetchHadithCollection,
  fetchHadith,
  searchHadith,
  randomHadith,
  fetchAsmaUlHusna,
  fetchOnlineDuas,
  fetchIslamicMonths,
  fetchBabyNames,
  fetchMoonPhases,
} from '../ummah-api.js';

const QUIZ_KEY = 'noor.quiz';
const SOUND_KEY = 'noor.sound';

let quiz = store.get(QUIZ_KEY, { best: 0 });
let soundOn = store.get(SOUND_KEY, true);
let calYear = new Date().getFullYear();
let articleStack = [];

export function mount(el) {
  el.innerHTML = `
    <div class="seg seg-scroll">
      <button class="seg-btn active" data-view="learn">📚 Learn</button>
      <button class="seg-btn" data-view="hadith">📜 Hadith</button>
      <button class="seg-btn" data-view="names">﷽ 99 Names</button>
      <button class="seg-btn" data-view="baby">👶 Baby Names</button>
      <button class="seg-btn" data-view="duas">🤲 Duas</button>
      <button class="seg-btn" data-view="fasting">🗓️ Fasting</button>
      <button class="seg-btn" data-view="quiz">🎯 Quiz</button>
      <button class="seg-btn" data-view="events">🎉 Events</button>
    </div>
    <div id="eduView"></div>
  `;
  el.querySelectorAll('.seg-btn').forEach((b) =>
    b.addEventListener('click', () => switchView(el, b.dataset.view))
  );
  renderLearn(el);

  // Cross-app deep links: jump to a Learn sub-view from Home / Search
  window.addEventListener('noor-learn-view', (e) => {
    const v = (e && e.detail && e.detail.view) || 'learn';
    switchView(el, v);
  });
}

function switchView(el, view) {
  el.querySelectorAll('.seg-btn').forEach((b) => b.classList.toggle('active', b.dataset.view === view));
  if (view === 'learn') renderLearn(el);
  else if (view === 'hadith') renderHadith(el);
  else if (view === 'names') renderNames(el);
  else if (view === 'baby') renderBabyNames(el);
  else if (view === 'duas') renderDuas(el);
  else if (view === 'fasting') renderFasting(el);
  else if (view === 'quiz') renderQuiz(el);
  else if (view === 'events') renderEvents(el);
}

/* ============================================================
   Studies hub
   ============================================================ */
const CAT_META = {
  fiqh: { label: 'Fiqh · Daily Rules', ar: 'الفقه', emoji: '🕌' },
  seerah: { label: 'Seerah · Prophetic History', ar: 'السيرة', emoji: '🌙' },
  aqeedah: { label: 'Aqeedah · Core Beliefs', ar: 'العقيدة', emoji: '📿' },
};

function renderLearn(el) {
  const host = el.querySelector('#eduView');
  if (articleStack.length) { renderArticle(el, articleStack[articleStack.length - 1]); return; }
  const cats = ['fiqh', 'seerah', 'aqeedah'];
  const articles = (c) => STUDIES.filter((a) => a.cat === c);
  host.innerHTML = `
    ${cats.map((c) => {
      const arts = articles(c);
      const meta = CAT_META[c];
      return `
      <div class="card">
        <div class="study-card ${c}" data-ar="${meta.ar}" style="margin-bottom:10px">
          <h4>${meta.emoji} ${esc(meta.label)}</h4>
          <p>${arts.length} comprehensive lessons · ${esc(meta.ar)}</p>
          <span class="study-meta">Tap to read ▸</span>
        </div>
        <div class="study-sub">
          ${arts.map((a) => `
            <button class="btn btn-ghost" data-art="${a.id}" style="justify-content:flex-start">
              <span style="font-family:var(--font-ar);color:var(--emerald-3);font-size:1.05rem;margin-right:4px">${a.ar}</span>
              <span style="flex:1;text-align:left">${esc(a.title)}</span>
            </button>`).join('')}
        </div>
      </div>`;
    }).join('')}
  `;
  host.querySelectorAll('.study-card').forEach((card) => {
    card.addEventListener('click', () => {
      const c = card.classList.contains('fiqh') ? 'fiqh' : card.classList.contains('seerah') ? 'seerah' : 'aqeedah';
      const first = articles(c)[0];
      if (first) openArticle(el, first.id);
    });
  });
  host.querySelectorAll('[data-art]').forEach((b) => {
    b.addEventListener('click', () => openArticle(el, b.dataset.art));
  });
}

function openArticle(el, id) {
  const art = STUDIES.find((a) => a.id === id);
  if (!art) return;
  articleStack.push(art);
  renderArticle(el, art);
}

function renderArticle(el, art) {
  const host = el.querySelector('#eduView');
  const meta = CAT_META[art.cat];
  host.innerHTML = `
    <div class="card">
      <div class="reader-head">
        <button class="back-btn" id="artBack" aria-label="Back">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>
        </button>
        <div class="reader-title"><h3>${esc(meta.label)}</h3><p>Lesson · ${esc(meta.ar)}</p></div>
      </div>
      <div class="article-head">
        <div class="ar">${art.ar}</div>
        <h3>${esc(art.title)}</h3>
        <span class="chip chip-gold cat-chip">${meta.emoji} ${meta.label}</span>
      </div>
      <div class="article-body">
        <div class="intro">${esc(art.intro)}</div>
        ${art.sections.map((s) => `
          <div class="article-sec">
            <h4>${esc(s.h)}</h4>
            ${s.t.map((p) => `<p>${esc(p)}</p>`).join('')}
          </div>`).join('')}
      </div>
      <div class="footer-note">May Allah increase us in beneficial knowledge. <b>آمين</b></div>
    </div>`;
  host.querySelector('#artBack').addEventListener('click', () => {
    articleStack.pop();
    renderLearn(el);
  });
}

/* ============================================================
   Sunnah fasting calendar
   ============================================================ */
function renderFasting(el) {
  const host = el.querySelector('#eduView');
  host.innerHTML = `
    <div class="card">
      <div class="card-head">
        <span class="card-ico">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18"/><path d="M9.5 15.5l1.8 1.8 3.2-3.6"/></svg>
        </span>
        <div><div class="card-title">Sunnah Fasting Calendar</div><div class="card-sub">Mondays · Thursdays · White Days (13–15 of each lunar month)</div></div>
      </div>
      <div class="cal-year-nav">
        <button id="calPrev" aria-label="Previous year">‹</button>
        <span class="yr" id="calYear">${calYear}</span>
        <button id="calNext" aria-label="Next year">›</button>
      </div>
      <div class="cal-legend">
        <span><span class="legend-dot ld-white"></span>White Days (13·14·15)</span>
        <span><span class="legend-dot ld-mt"></span>Monday / Thursday</span>
        <span><span class="legend-dot ld-both"></span>Both</span>
        <span><span class="legend-dot ld-today"></span>Today</span>
      </div>
      <div id="calGrid"></div>
      <div class="cal-note" style="margin-top:12px">🗓️ Islamic dates follow the Umm al-Qura calculation. White days depend on actual moon sighting — confirm locally. Fasting Mondays &amp; Thursdays is a confirmed Sunnah year-round.</div>
    </div>
    <div class="card">
      <div class="card-head">
        <span class="card-ico gold">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21c-4-2.5-7-6-7-10a7 7 0 0 1 14 0c0 4-3 7.5-7 10z"/><path d="M9.5 11.5c1.4 0 2.3-.8 2.8-2 .5 1.2 1.4 2 2.8 2-1.4 0-2.3.8-2.8 2-.5-1.2-1.4-2-2.8-2z"/></svg>
        </span>
        <div><div class="card-title">How the calendar works</div><div class="card-sub">Optimal voluntary fasting days</div></div>
      </div>
      <div class="remedy-action">The Prophet ﷺ used to fast Mondays and Thursdays, and instructed fasting the three <b>White Days</b> (13th, 14th, 15th) of every lunar month — when the moon is full and bright. Combining both on one day is doubly rewarded. In Ramadan, the calendar automatically highlights your full fasting month of 29–30 days.</div>
    </div>
  `;

  renderCalGrid(el);
  host.querySelector('#calPrev').addEventListener('click', () => { calYear--; renderCalGrid(el); });
  host.querySelector('#calNext').addEventListener('click', () => { calYear++; renderCalGrid(el); });
}

function renderCalGrid(el) {
  const host = el.querySelector('#calGrid');
  document.getElementById('calYear').textContent = calYear;
  const months = [];
  for (let m = 0; m < 12; m++) {
    const daysInMonth = new Date(calYear, m + 1, 0).getDate();
    const firstDow = new Date(calYear, m, 1).getDay(); // 0=Sun
    const cells = [];
    for (let pad = 0; pad < firstDow; pad++) cells.push('<div class="cal-day blank"></div>');
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(calYear, m, d);
      const isWhite = [13, 14, 15].includes(islamicDayNum(date));
      const isMT = date.getDay() === 1 || date.getDay() === 4; // Mon, Thu
      const isToday = date.toDateString() === new Date().toDateString();
      let cls = '';
      if (isWhite && isMT) cls = 'both';
      else if (isWhite) cls = 'white';
      else if (isMT) cls = 'mt';
      if (isToday) cls += ' today';
      const islamicD = islamicDayNum(date);
      cells.push(`<div class="cal-day ${cls.trim()}" title="${date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })} · Islamic day ${islamicD ?? '?'}"><span>${d}</span>${islamicD ? `<span class="islamic-d">${islamicD}</span>` : ''}</div>`);
    }
    const monthDate = new Date(calYear, m, 1);
    months.push(`
      <div class="cal-month">
        <h5>${monthDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })} <span>${daysInMonth} days</span></h5>
        <div class="cal-dow">${['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((x) => `<span>${x}</span>`).join('')}</div>
        <div class="cal-grid">${cells.join('')}</div>
      </div>`);
  }
  host.innerHTML = months.join('');
}

/* ============================================================
   Kids madrasa quiz
   ============================================================ */
function renderQuiz(el) {
  const host = el.querySelector('#eduView');
  const state = { idx: 0, score: 0, locked: false };
  host.innerHTML = `
    <div class="card">
      <div class="card-head">
        <span class="card-ico">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 9.5 12 4.5l9.5 5L12 14.5z"/><path d="M6.5 11.8v4.5c0 1.4 2.5 3 5.5 3s5.5-1.6 5.5-3v-4.5"/></svg>
        </span>
        <div><div class="card-title">Kids Madrasa Quiz</div><div class="card-sub">${QUIZ_QUESTIONS.length} questions · Islamic history &amp; ethics</div></div>
      </div>
      <div class="quiz-top">
        <span class="quiz-score" id="quizScore">Score 0</span>
        <button class="quiz-sound" id="quizSound" aria-label="Toggle sound">${soundOn ? '🔊' : '🔇'}</button>
      </div>
      <div class="quiz-progress" id="quizDots"></div>
      <div id="quizBody"></div>
    </div>`;

  host.querySelector('#quizSound').addEventListener('click', () => {
    soundOn = !soundOn;
    store.set(SOUND_KEY, soundOn);
    host.querySelector('#quizSound').textContent = soundOn ? '🔊' : '🔇';
  });

  renderQuestion(el, state);
}

function renderQuestion(el, state) {
  const body = el.querySelector('#quizBody');
  if (state.idx >= QUIZ_QUESTIONS.length) return renderQuizEnd(el, state);
  const q = QUIZ_QUESTIONS[state.idx];
  el.querySelector('#quizScore').textContent = `Score ${state.score}`;
  el.querySelector('#quizDots').innerHTML = QUIZ_QUESTIONS.map((_, i) =>
    `<span class="q-dot ${i < state.idx ? 'done' : ''} ${i === state.idx ? 'cur' : ''}"></span>`).join('');
  body.innerHTML = `
    <div class="quiz-q">${esc(q.q)}</div>
    <div class="quiz-opts">
      ${q.opts.map((o, i) => `
        <button class="quiz-opt" data-i="${i}">
          <span class="q-key">${['A', 'B', 'C', 'D'][i]}</span>${esc(o)}
        </button>`).join('')}
    </div>
    <div id="quizInfo"></div>`;

  body.querySelectorAll('.quiz-opt').forEach((opt) => {
    opt.addEventListener('click', () => {
      if (state.locked) return;
      state.locked = true;
      const pick = parseInt(opt.dataset.i, 10);
      const correct = pick === q.a;
      body.querySelectorAll('.quiz-opt').forEach((o) => {
        o.disabled = true;
        const i = parseInt(o.dataset.i, 10);
        if (i === q.a) o.classList.add('correct');
        else if (i === pick) o.classList.add('wrong');
      });
      if (correct) {
        state.score++;
        vibrate([20, 30]);
        if (soundOn) successSound();
      } else {
        vibrate([60, 40]);
        if (soundOn) failSound();
      }
      el.querySelector('#quizScore').textContent = `Score ${state.score}`;
      el.querySelector('#quizInfo').innerHTML = `<div class="quiz-info"><b>${correct ? '✅ Correct!' : '❌ Not quite.'}</b> ${esc(q.info)}</div>`;
      setTimeout(() => {
        state.idx++;
        state.locked = false;
        renderQuestion(el, state);
      }, 1600);
    });
  });
}

function renderQuizEnd(el, state) {
  const pct = Math.round((state.score / QUIZ_QUESTIONS.length) * 100);
  if (state.score > quiz.best) {
    quiz.best = state.score;
    store.set(QUIZ_KEY, quiz);
  }
  const emoji = pct >= 80 ? '🏆' : pct >= 50 ? '🌟' : '💪';
  const msg = pct >= 80 ? `Masha'Allah! Outstanding — you're a madrasa star!` : pct >= 50 ? 'Good job! Keep learning and you will shine.' : "Well done for trying! Review the questions and try again.";
  el.querySelector('#quizScore').textContent = `Best ${quiz.best}/${QUIZ_QUESTIONS.length}`;
  el.querySelector('#quizDots').innerHTML = QUIZ_QUESTIONS.map(() => `<span class="q-dot done"></span>`).join('');
  el.querySelector('#quizBody').innerHTML = `
    <div class="quiz-end">
      <div class="qe-emoji">${emoji}</div>
      <div class="qe-score">${state.score} / ${QUIZ_QUESTIONS.length}</div>
      <div class="qe-msg">${msg}<br/>Personal best: ${quiz.best}/${QUIZ_QUESTIONS.length}</div>
      <button class="btn btn-gold" id="quizRestart">Play again 🔄</button>
    </div>`;
  el.querySelector('#quizRestart').addEventListener('click', () => renderQuiz(el));
}

/* ============================================================
   Duas library
   ============================================================ */
const DUA_CAT_EMOJI = {
  morning: '🌅', evening: '🌆', sleep: '🌙', waking: '☀️', eating: '🍽️',
  home: '🏠', mosque: '🕌', travel: '🧳', hardship: '🤲', forgiveness: '💚', general: '📿',
  wudu: '💧', prayer: '🕌', after_prayer: '📿', food: '🍽️', parents: '👨‍👩‍👧', knowledge: '📚', money: '💰', rain: '🌧️',
};

// Online duas fetched from Ummah API (126), merged into the local library
let onlineDuas = null;
let duasSource = 'local'; // 'local' | 'online'

async function renderDuas(el) {
  const host = el.querySelector('#eduView');
  const list = (cat, q, source) => {
    const src = source === 'online' && onlineDuas ? onlineDuas : DUAS_LIBRARY;
    const query = (q || '').trim().toLowerCase();
    const rows = src.filter((d) =>
      (cat === 'all' || d.cat === cat) &&
      (!query ||
        d.title.toLowerCase().includes(query) ||
        d.ar.includes(query) ||
        d.en.toLowerCase().includes(query) ||
        d.latin.toLowerCase().includes(query) ||
        (d.src || '').toLowerCase().includes(query))
    );
    return rows.map(duaCard).join('') || '<div class="empty">No du\'a matches your search 🤲</div>';
  };
  const source = onlineDuas && duasSource === 'online' ? onlineDuas : DUAS_LIBRARY;
  const cats = ['all', ...new Set(source.map((d) => d.cat))];
  const chips = (cur) => `
    <div class="dua-chips">
      ${cats.map((c) => `<button class="dua-chip ${cur === c ? 'on' : ''}" data-cat="${c}">${c === 'all' ? '✨ All' : `${DUA_CAT_EMOJI[c] || '📿'} ${c[0].toUpperCase() + c.slice(1)}`}</button>`).join('')}
    </div>`;
  host.innerHTML = `
    <div class="card">
      <div class="card-head">
        <span class="card-ico">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21c-4-2.5-7-6-7-10a7 7 0 0 1 14 0c0 4-3 7.5-7 10z"/><path d="M9.5 11.5c1.4 0 2.3-.8 2.8-2 .5 1.2 1.4 2 2.8 2-1.4 0-2.3.8-2.8 2-.5-1.2-1.4-2-2.8-2z"/></svg>
        </span>
        <div><div class="card-title">Du'a Collection</div><div class="card-sub">${source.length} authentic supplications · tap to expand</div></div>
      </div>
      <div class="dua-toggle">
        <button class="dua-src-btn ${duasSource === 'local' ? 'on' : ''}" id="duaSrcLocal">📖 Curated (${DUAS_LIBRARY.length})</button>
        <button class="dua-src-btn ${duasSource === 'online' ? 'on' : ''}" id="duaSrcOnline">🌐 Online (${onlineDuas ? onlineDuas.length : '126'})</button>
      </div>
      <div class="searchbar">
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
        <input class="input" id="duaSearch" type="search" placeholder="Search a du'a — e.g. forgiveness, travel, sleep…" autocomplete="off" />
      </div>
      ${chips('all')}
      <div id="duaList">${list('all', '', duasSource)}</div>
    </div>`;

  let cat = 'all';
  const listHost = host.querySelector('#duaList');
  host.querySelectorAll('.dua-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      cat = chip.dataset.cat;
      host.querySelectorAll('.dua-chip').forEach((c) => c.classList.toggle('on', c === chip));
      listHost.innerHTML = list(cat, host.querySelector('#duaSearch').value, duasSource);
      wireDuas(listHost);
    });
  });
  host.querySelector('#duaSearch').addEventListener('input', (e) => {
    listHost.innerHTML = list(cat, e.target.value, duasSource);
    wireDuas(listHost);
  });
  host.querySelector('#duaSrcLocal').addEventListener('click', () => {
    duasSource = 'local';
    renderDuas(el);
  });
  host.querySelector('#duaSrcOnline').addEventListener('click', async () => {
    if (!onlineDuas) {
      try {
        toast('Loading the full du\'a collection…', 'info');
        const d = await fetchOnlineDuas();
        onlineDuas = (d.duas || []).map((x) => ({
          id: 'online-' + x.id,
          cat: x.category || 'general',
          title: x.title,
          ar: x.arabic,
          en: x.translation,
          latin: x.transliteration,
          src: x.source || 'Authentic source' + (x.repeat ? ' · repeat ' + x.repeat : ''),
        }));
      } catch {
        toast('Could not load online duas — check your connection', 'error');
        return;
      }
    }
    duasSource = 'online';
    renderDuas(el);
  });
  wireDuas(listHost);
}

function duaCard(d) {
  return `
    <div class="dua-card" data-id="${d.id}">
      <button class="dua-head" aria-expanded="false">
        <span class="dua-emoji">${DUA_CAT_EMOJI[d.cat] || '📿'}</span>
        <span class="dua-head-main">
          <span class="dua-title">${esc(d.title)}</span>
          <span class="dua-meta">${esc(d.latin.slice(0, 42))}…</span>
        </span>
        <span class="dua-chev">▾</span>
      </button>
      <div class="dua-body">
        <div class="dua-ar">${d.ar}</div>
        <div class="dua-latin">${esc(d.latin)}</div>
        <div class="dua-en">“${esc(d.en)}”</div>
        <div class="dua-src">📖 ${esc(d.src || 'Authentic source')}</div>
      </div>
    </div>`;
}

function wireDuas(host) {
  host.querySelectorAll('.dua-card').forEach((card) => {
    const head = card.querySelector('.dua-head');
    head.addEventListener('click', () => {
      const open = card.classList.toggle('open');
      head.setAttribute('aria-expanded', String(open));
      // accordion behaviour — close siblings for tidy reading
      card.parentElement.querySelectorAll('.dua-card.open').forEach((c) => {
        if (c !== card) {
          c.classList.remove('open');
          c.querySelector('.dua-head').setAttribute('aria-expanded', 'false');
        }
      });
      if (open) card.querySelector('.dua-body').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
  });
}

/* ============================================================
   Hadith library — collections → browse → read (Ummah API)
   ============================================================ */
const HADITH_LIMIT = 15;
let hadithState = { key: '', page: 1, totalPages: 1, list: [], q: '' };

async function renderHadith(el) {
  const host = el.querySelector('#eduView');
  host.innerHTML = `
    <div class="card">
      <div class="card-head">
        <span class="card-ico">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6c-2-1.6-4.5-2.2-7-2.2v15c2.5 0 5 .6 7 2.2 2-1.6 4.5-2.2 7-2.2v-15c-2.5 0-5 .6-7 2.2z"/><path d="M12 6v15"/></svg>
        </span>
        <div><div class="card-title">Hadith Library</div><div class="card-sub">9 authentic collections · live from Ummah API</div></div>
      </div>
      <div id="hadithBody"><div class="empty"><div class="spinner"></div>Loading hadith collections…</div></div>
    </div>`;

  const body = host.querySelector('#hadithBody');
  try {
    const cols = await fetchHadithCollections();
    hadithState = { key: '', page: 1, totalPages: 1, list: [], q: '' };
    body.innerHTML = `
      <div class="hadith-tools">
        <div class="searchbar" style="flex:1;margin-bottom:0">
          <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
          <input class="input" id="hadithSearch" type="search" placeholder="Search all hadith…" autocomplete="off" />
        </div>
        <button class="btn btn-gold btn-sm" id="hadithRandom" style="flex:none">🎲 Random</button>
      </div>
      <div class="collection-grid">
        ${cols.map(collectionCard).join('')}
      </div>
      <div class="field-hint" style="margin-top:10px">Tap a collection to browse its hadiths. ${cols.length} collections · texts in Arabic + English.</div>`;

    body.querySelectorAll('.collection-card').forEach((c) =>
      c.addEventListener('click', () => {
        hadithState.key = c.dataset.key;
        hadithState.page = 1;
        hadithState.q = '';
        renderHadithBrowse(el);
      })
    );
    const searchInput = body.querySelector('#hadithSearch');
    let searchTimer = null;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        const q = e.target.value.trim();
        if (!q) return renderHadithBrowse(el);
        hadithState.q = q;
        renderHadithSearch(el, q);
      }, 450);
    });
    body.querySelector('#hadithRandom').addEventListener('click', async () => {
      body.querySelector('#hadithRandom').disabled = true;
      try {
        const h = await randomHadith();
        renderHadithRead(el, h);
      } catch {
        toast('Could not fetch a random hadith', 'error');
      } finally {
        const b = body.querySelector('#hadithRandom');
        if (b) b.disabled = false;
      }
    });
  } catch {
    body.innerHTML = `
      <div class="error-box">
        Could not reach the hadith API — check your connection.<br/>
        <button class="btn btn-emerald btn-sm" id="retryHadith">Try again</button>
      </div>`;
    body.querySelector('#retryHadith')?.addEventListener('click', () => renderHadith(el));
  }
}

function collectionCard(c) {
  return `
    <button class="collection-card" data-key="${esc(c.key)}">
      <span class="collection-ar">${esc(c.arabic_name || '')}</span>
      <span class="collection-name">${esc(c.name)}</span>
      <span class="collection-meta">${esc(c.author)} · ${c.total_hadiths || c.total_hadiths === 0 ? c.total_hadiths : '—'} hadiths</span>
      <span class="chip chip-gold">${esc(c.reliability || 'Authentic')}</span>
    </button>`;
}

async function renderHadithBrowse(el) {
  const body = el.querySelector('#hadithBody');
  if (!body) return;
  body.innerHTML = `<div class="empty"><div class="spinner"></div>Loading hadiths…</div>`;
  try {
    const d = await fetchHadithCollection(hadithState.key, hadithState.page, HADITH_LIMIT);
    hadithState.list = d.hadiths || [];
    hadithState.totalPages = d.total_pages || 1;
    body.innerHTML = `
      <div class="reader-head">
        <button class="back-btn" id="hadBack" aria-label="Back to collections">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>
        </button>
        <div class="reader-title"><h3>${esc(d.collection_name || hadithState.key)}</h3><p>${d.total ? d.total.toLocaleString() : ''} hadiths · page ${hadithState.page} / ${hadithState.totalPages}</p></div>
      </div>
      <div class="hadith-tools">
        <div class="searchbar" style="flex:1;margin-bottom:0">
          <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
          <input class="input" id="hadSearchColl" type="search" placeholder="Search this collection…" autocomplete="off" />
        </div>
        <button class="btn btn-gold btn-sm" id="hadRandomHere" style="flex:none">🎲 Random</button>
      </div>
      <div class="hadith-list" id="hadithList">${hadithState.list.map(hadithRow).join('')}</div>
      <div class="hadith-pager">
        <button class="btn btn-ghost btn-sm" id="hadPrev" ${hadithState.page <= 1 ? 'disabled' : ''}>‹ Prev</button>
        <span class="hadith-page">${hadithState.page} / ${hadithState.totalPages}</span>
        <button class="btn btn-ghost btn-sm" id="hadNext" ${hadithState.page >= hadithState.totalPages ? 'disabled' : ''}>Next ›</button>
      </div>`;
    body.querySelector('#hadBack').addEventListener('click', () => renderHadith(el));
    wireHadithRows(body);
    body.querySelector('#hadPrev').addEventListener('click', () => {
      hadithState.page--;
      renderHadithBrowse(el);
    });
    body.querySelector('#hadNext').addEventListener('click', () => {
      hadithState.page++;
      renderHadithBrowse(el);
    });
    body.querySelector('#hadRandomHere').addEventListener('click', async () => {
      const h = await randomHadith();
      renderHadithRead(el, h);
    });
    let t = null;
    body.querySelector('#hadSearchColl').addEventListener('input', (e) => {
      clearTimeout(t);
      t = setTimeout(() => {
        const q = e.target.value.trim();
        if (q) renderHadithSearch(el, q, hadithState.key);
        else renderHadithBrowse(el);
      }, 450);
    });
  } catch {
    body.innerHTML = `<div class="error-box">Could not load this collection — check your connection.<br/><button class="btn btn-emerald btn-sm" id="hadRetry">Try again</button></div>`;
    body.querySelector('#hadRetry')?.addEventListener('click', () => renderHadithBrowse(el));
  }
}

function hadithRow(h) {
  const preview = String(h.english || h.arabic || '').slice(0, 110);
  return `
    <button class="hadith-row" data-id="${esc(h.id)}">
      <span class="hadith-num">${h.hadithnumber}</span>
      <span class="hadith-main">
        <span class="hadith-preview">${esc(preview)}${preview.length >= 110 ? '…' : ''}</span>
        <span class="hadith-meta">${esc(h.collection_name || '')} · ${h.grade ? esc(h.grade) : ''}</span>
      </span>
      <span class="surah-chev">›</span>
    </button>`;
}

function wireHadithRows(host) {
  const panel = host.closest('.tab-panel');
  host.querySelectorAll('.hadith-row').forEach((row) =>
    row.addEventListener('click', async () => {
      try {
        const h = await fetchHadith(row.dataset.id);
        renderHadithRead(panel, h);
      } catch {
        toast('Could not open this hadith', 'error');
      }
    })
  );
}

async function renderHadithSearch(el, q, collectionKey) {
  const body = el.querySelector('#hadithBody');
  if (!body) return;
  body.innerHTML = `<div class="empty"><div class="spinner"></div>Searching “${esc(q)}”…</div>`;
  try {
    const d = await searchHadith(q, 20);
    const rows = d.hadiths || [];
    if (!rows.length) {
      body.innerHTML = `<div class="empty">No hadith found for “${esc(q)}”.</div>`;
      return;
    }
    body.innerHTML = `
      <div class="reader-head">
        <button class="back-btn" id="hadBack" aria-label="Back">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>
        </button>
        <div class="reader-title"><h3>Search results</h3><p>${rows.length} hadiths for “${esc(q)}”</p></div>
      </div>
      <div class="hadith-list">${rows.map(hadithRow).join('')}</div>`;
    wireHadithRows(body);
    body.querySelector('#hadBack').addEventListener('click', () => {
      hadithState.q = '';
      if (hadithState.key) renderHadithBrowse(el);
      else renderHadith(el);
    });
  } catch {
    body.innerHTML = `<div class="error-box">Search failed — check your connection.</div>`;
  }
}

function renderHadithRead(el, h) {
  const host = el.querySelector('#eduView');
  const body = el.querySelector('#hadithBody');
  const source = body || host;
  source.innerHTML = `
    <div class="card">
      <div class="reader-head">
        <button class="back-btn" id="hadBack" aria-label="Back">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>
        </button>
        <div class="reader-title"><h3>${esc(h.collection_name || 'Hadith')} · ${h.hadithnumber}</h3><p>${h.grade ? 'Grade: ' + esc(h.grade) : ''}</p></div>
      </div>
      <div class="hadith-ar">${h.arabic || ''}</div>
      <div class="hadith-en">${esc(h.english || '')}</div>
      <div class="hadith-ref">📖 ${esc(h.collection_name || '')} · Hadith ${h.hadithnumber}${h.grade ? ' · ' + esc(h.grade) : ''}</div>
      <div class="hadith-actions">
        <button class="btn btn-emerald btn-sm" id="hadAgain">🎲 Another random</button>
      </div>
    </div>`;
  const back = source.querySelector('#hadBack');
  back.addEventListener('click', () => {
    if (hadithState.q) renderHadithSearch(el, hadithState.q);
    else if (hadithState.key) renderHadithBrowse(el);
    else renderHadith(el);
  });
  source.querySelector('#hadAgain')?.addEventListener('click', async () => {
    const h2 = await randomHadith();
    renderHadithRead(el, h2);
  });
}

/* ============================================================
   Asma-ul-Husna — 99 Names of Allah (Ummah API)
   ============================================================ */
let asma = null;

async function renderNames(el) {
  const host = el.querySelector('#eduView');
  host.innerHTML = `
    <div class="card">
      <div class="card-head">
        <span class="card-ico gold">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.8 4.6L18.5 9l-4.7 1.4L12 15l-1.8-4.6L5.5 9l4.7-1.4z"/><path d="M18.5 15l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z"/></svg>
        </span>
        <div><div class="card-title">Asma-ul-Husna · 99 Names</div><div class="card-sub">The Most Beautiful Names of Allah · live</div></div>
      </div>
      <div class="searchbar">
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
        <input class="input" id="asmaSearch" type="search" placeholder="Search a Name — e.g. Ar-Rahman, mercy…" autocomplete="off" />
      </div>
      <div id="asmaList"><div class="empty"><div class="spinner"></div>Loading the 99 Names…</div></div>
    </div>`;
  const listHost = host.querySelector('#asmaList');
  try {
    if (!asma) asma = await fetchAsmaUlHusna();
    const render = (q) => {
      const query = (q || '').trim().toLowerCase();
      const rows = asma.filter((n) =>
        !query ||
        String(n.number).includes(query) ||
        n.transliteration.toLowerCase().includes(query) ||
        n.english.toLowerCase().includes(query) ||
        (n.meaning || '').toLowerCase().includes(query) ||
        n.arabic.includes(query)
      );
      listHost.innerHTML = rows.length
        ? rows.map((n) => `
          <button class="asma-card">
            <span class="asma-num">${n.number}</span>
            <span class="asma-body">
              <span class="asma-ar">${n.arabic}</span>
              <span class="asma-name">${esc(n.transliteration)}</span>
              <span class="asma-en">${esc(n.english)}</span>
              ${n.meaning ? `<span class="asma-meaning">${esc(n.meaning)}</span>` : ''}
            </span>
          </button>`).join('')
        : `<div class="empty">No Name matches “${esc(q)}”.</div>`;
    };
    render('');
    host.querySelector('#asmaSearch').addEventListener('input', (e) => render(e.target.value));
  } catch {
    listHost.innerHTML = `<div class="error-box">Could not load the 99 Names — check your connection.<br/><button class="btn btn-emerald btn-sm" id="retryAsma">Try again</button></div>`;
    host.querySelector('#retryAsma')?.addEventListener('click', () => renderNames(el));
  }
}

/* ============================================================
   Islamic baby names — searchable, gender filter (Ummah API)
   ============================================================ */
let babyNames = null;
let babyFilter = 'all';

async function renderBabyNames(el) {
  const host = el.querySelector('#eduView');
  host.innerHTML = `
    <div class="card">
      <div class="card-head">
        <span class="card-ico">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5"/></svg>
        </span>
        <div><div class="card-title">Islamic Baby Names</div><div class="card-sub">Beautiful names with meanings · live from Ummah API</div></div>
      </div>
      <div class="dua-toggle" style="margin-bottom:10px">
        <button class="dua-src-btn on" data-g="all">✨ All</button>
        <button class="dua-src-btn" data-g="male">👦 Boys</button>
        <button class="dua-src-btn" data-g="female">👧 Girls</button>
      </div>
      <div class="searchbar">
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
        <input class="input" id="babySearch" type="search" placeholder="Search — e.g. Maryam, Yusuf, mercy…" autocomplete="off" />
      </div>
      <div id="babyList"><div class="empty"><div class="spinner"></div>Loading names…</div></div>
      <div class="field-hint" style="margin-top:10px">The Prophet ﷺ said: “You will be called by your names on the Day of Resurrection — so choose good names.” (Abu Dawud)</div>
    </div>`;
  const listHost = host.querySelector('#babyList');
  const render = () => {
    const q = (host.querySelector('#babySearch').value || '').trim().toLowerCase();
    const rows = babyNames.filter((n) =>
      (babyFilter === 'all' || n.gender === babyFilter) &&
      (!q ||
        n.name.toLowerCase().includes(q) ||
        n.arabic.includes(q) ||
        (n.meaning || '').toLowerCase().includes(q) ||
        (n.origin || '').toLowerCase().includes(q))
    );
    listHost.innerHTML = rows.length
      ? rows.map((n) => `
        <div class="baby-name">
          <span class="baby-ar">${n.arabic}</span>
          <div class="baby-main">
            <div class="baby-name-row">
              <b>${esc(n.name)}</b>
              <span class="chip ${n.gender === 'male' ? 'chip-meccan' : 'chip-medinan'}">${n.gender === 'male' ? '👦 Boy' : '👧 Girl'}</span>
            </div>
            <div class="baby-meaning">${esc(n.meaning || '')}</div>
            <div class="baby-meta">${esc(n.origin || '')}${n.root ? ' · root ' + esc(n.root) : ''}</div>
            ${n.note ? `<div class="baby-note">${esc(n.note)}</div>` : ''}
          </div>
        </div>`).join('')
      : `<div class="empty">No names match your search.</div>`;
  };
  try {
    if (!babyNames) babyNames = await fetchBabyNames();
    render();
    host.querySelector('#babySearch').addEventListener('input', render);
    host.querySelectorAll('.dua-toggle .dua-src-btn').forEach((b) =>
      b.addEventListener('click', () => {
        babyFilter = b.dataset.g;
        host.querySelectorAll('.dua-toggle .dua-src-btn').forEach((x) => x.classList.toggle('on', x === b));
        render();
      })
    );
  } catch {
    listHost.innerHTML = `<div class="error-box">Could not load names — check your connection.<br/><button class="btn btn-emerald btn-sm" id="retryBaby">Try again</button></div>`;
    host.querySelector('#retryBaby')?.addEventListener('click', () => renderBabyNames(el));
  }
}

/* ============================================================
   Events — key Islamic dates + personal events
   ============================================================ */
const EVENTS_KEY = 'noor.events.mine';
const EVENTS_CACHE_KEY = 'noor.events.cache';
const H2G_BASE = 'https://api.aladhan.com/v1/hToG';

const KEY_DATES = [
  { id: 'hijri-new-year', name: 'Islamic New Year', ar: 'رأس السنة الهجرية', emoji: '📅', month: 1, day: 1, note: '1 Muharram — the Hijri calendar turns a new year.' },
  { id: 'ashura', name: 'Day of Ashura', ar: 'عاشوراء', emoji: '🤲', month: 1, day: 10, note: "Fasting it expiates the past year of sins (Muslim). Also marks the exodus of Musa (AS)." },
  { id: 'mawlid', name: 'Mawlid an-Nabi', ar: 'المولد النبوي', emoji: '🕊️', month: 3, day: 12, note: "The Prophet's ﷺ birth month — a time to reflect on his life and character." },
  { id: 'isra', name: "Isra wal-Mi'raj", ar: 'الإسراء والمعراج', emoji: '🐎', month: 7, day: 27, note: 'The night journey to Jerusalem and the ascension to the heavens.' },
  { id: 'nisf-shaaban', name: "Nisf Sha'ban", ar: 'نصف شعبان', emoji: '🌕', month: 8, day: 15, note: "The 15th of Sha'ban — a night many Muslims seek forgiveness and pray." },
  { id: 'ramadan', name: 'Ramadan begins', ar: 'رمضان', emoji: '🌙', month: 9, day: 1, note: 'First day of the blessed month of fasting.' },
  { id: 'qadr', name: 'Laylat al-Qadr (27th)', ar: 'ليلة القدر', emoji: '✨', month: 9, day: 27, note: 'Night of Power — better than a thousand months. Seek it in the last ten nights.' },
  { id: 'fitr', name: 'Eid al-Fitr', ar: 'عيد الفطر', emoji: '🎉', month: 10, day: 1, note: 'Festival of breaking the fast. Zakat al-Fitr is due before the Eid prayer.' },
  { id: 'hajj', name: 'Hajj begins (8 Dhul-Hijjah)', ar: 'الحج', emoji: '🕋', month: 12, day: 8, note: 'Pilgrimage season opens — millions gather in Makkah.' },
  { id: 'arafah', name: 'Day of Arafah', ar: 'يوم عرفة', emoji: '⛰️', month: 12, day: 9, note: 'The greatest day of the year. Fasting it expiates two years of sins (non-pilgrims).' },
  { id: 'adha', name: 'Eid al-Adha', ar: 'عيد الأضحى', emoji: '🐑', month: 12, day: 10, note: "Festival of sacrifice — remember Ibrahim's (AS) obedience." },
];

let myEvents = store.get(EVENTS_KEY, []);
if (!Array.isArray(myEvents)) myEvents = [];

function currentHijriYear() {
  try {
    const y = parseInt(
      new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { year: 'numeric' }).format(new Date()),
      10
    );
    return y || 1448;
  } catch {
    return 1448;
  }
}

async function renderEvents(el) {
  const host = el.querySelector('#eduView');
  host.innerHTML = `
    <div class="card">
      <div class="card-head">
        <span class="card-ico">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18"/><path d="M9.5 15.5l1.8 1.8 3.2-3.6"/></svg>
        </span>
        <div><div class="card-title">Key Islamic Dates</div><div class="card-sub">Computed from the Umm al-Qura calendar · Hijri ${currentHijriYear()}</div></div>
      </div>
      <div id="keyDates"><div class="empty"><div class="spinner"></div>Calculating Islamic dates…</div></div>
    </div>

    <div class="card">
      <div class="card-head">
        <span class="card-ico gold">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21c-4-2.5-7-6-7-10a7 7 0 0 1 14 0c0 4-3 7.5-7 10z"/><path d="M9.5 11.5c1.4 0 2.3-.8 2.8-2 .5 1.2 1.4 2 2.8 2-1.4 0-2.3.8-2.8 2-.5-1.2-1.4-2-2.8-2z"/></svg>
        </span>
        <div><div class="card-title">The 12 Islamic Months</div><div class="card-sub">Names, Arabic &amp; significance · live from Ummah API</div></div>
      </div>
      <div id="islamicMonths"><div class="empty"><div class="spinner"></div>Loading months…</div></div>
    </div>

    <div class="card">
      <div class="card-head">
        <span class="card-ico gold">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a9 9 0 1 0 9 9c0-1.5-.4-3-1-4.2"/><path d="M12 7v5l3 2"/></svg>
        </span>
        <div><div class="card-title">New Moons &amp; Crescent Sighting</div><div class="card-sub">Astronomical new moon dates — the start of each lunar month 🌙</div></div>
      </div>
      <div id="moonPhases"><div class="empty"><div class="spinner"></div>Loading moon phases…</div></div>
    </div>

    <div class="card">
      <div class="card-head">
        <span class="card-ico gold">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v3M16 2v3M3 8h18M5 5h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z"/><path d="M8 14h.01M12 14h.01M16 14h.01"/></svg>
        </span>
        <div><div class="card-title">My Events</div><div class="card-sub">Reminders you add · saved on this device</div></div>
      </div>
      <div class="event-form">
        <div class="event-form-row">
          <div class="field" style="flex:2">
            <label class="field-label" for="evTitle">Event title</label>
            <input class="input" id="evTitle" type="text" placeholder="e.g. Taraweeh at Central Mosque" autocomplete="off" />
          </div>
          <div class="field" style="flex:1">
            <label class="field-label" for="evDate">Date</label>
            <input class="input" id="evDate" type="date" />
          </div>
        </div>
        <div class="event-form-row">
          <div class="field" style="flex:1">
            <label class="field-label" for="evNote">Note (optional)</label>
            <input class="input" id="evNote" type="text" placeholder="e.g. bring a donation" autocomplete="off" />
          </div>
          <button class="btn btn-gold btn-sm" id="evAdd" style="margin-top:22px">+ Add</button>
        </div>
      </div>
      <div id="myEventsList"></div>
    </div>

    <div class="card">
      <div class="card-head">
        <span class="card-ico">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21a9 9 0 1 1 9-9"/><path d="M12 15a3 3 0 1 0-3-3"/><path d="M15 21l1.5 1.5L21 18"/></svg>
        </span>
        <div><div class="card-title">Discover Events Near You</div><div class="card-sub">Masjid programs · lectures · community gatherings</div></div>
      </div>
      <button class="btn btn-emerald btn-block" id="eventsDiscoverBtn">🎉 Find Islamic events near me</button>
      <div class="field-hint" style="margin-top:8px">Opens a live search in your area — talks, courses, iftars and more. Also try asking your local masjid for its programme.</div>
    </div>
  `;

  el.querySelector('#evAdd').addEventListener('click', () => addMyEvent(el));
  el.querySelector('#evDate').addEventListener('keydown', (e) => { if (e.key === 'Enter') addMyEvent(el); });
  el.querySelector('#eventsDiscoverBtn').addEventListener('click', () => {
    const url = 'https://www.google.com/search?q=' + encodeURIComponent('islamic events and masjid programmes near me');
    window.open(url, '_blank', 'noopener');
    toast('Opening events search', 'success');
  });

  renderMyEvents(el);
  loadKeyDates(el);
  loadIslamicMonths(el);
  loadMoonPhases(el);
}

/* ---- new moon phases (Ummah API) ---- */
async function loadMoonPhases(el) {
  const host = el.querySelector('#moonPhases');
  if (!host) return;
  const year = new Date().getFullYear();
  try {
    const moons = await fetchMoonPhases(year);
    const today = new Date().toISOString().slice(0, 10);
    const fmt = (m) => {
      const d = m.new_moon || {};
      const h = d.hijri || {};
      return {
        date: d.date || '',
        time: d.time_utc || '',
        hijri: `${h.day} ${h.month_name || ''} ${h.year}`.trim(),
      };
    };
    const list = moons.map(fmt).filter((x) => x.date);
    const next = list.find((x) => x.date >= today);
    host.innerHTML = `
      ${next ? `
        <div class="event-next">
          <span class="event-next-label">Next new moon</span>
          <span class="event-next-emoji">🌑</span>
          <div class="event-next-main">
            <b>${esc(next.date)} · ${esc(next.time)} UTC</b>
            <span>Hijri ${esc(next.hijri)} · ${countdownLabel(daysUntil(next.date))} · sighting usually 1–2 days later</span>
          </div>
        </div>` : ''}
      <div class="moon-list">
        ${list.map((x) => `
          <div class="moon-row">
            <span class="moon-dot"></span>
            <span class="moon-date">${esc(x.date)} <small>${esc(x.time)} UTC</small></span>
            <span class="moon-hijri">🌙 ${esc(x.hijri)}</span>
          </div>`).join('')}
      </div>
      <div class="field-hint" style="margin-top:10px">New moon (conjunction) times for ${year}. Actual month start depends on verified local sighting — always confirm with your local authority.</div>
    `;
  } catch {
    host.innerHTML = '<div class="empty">Could not load moon phases — offline.</div>';
  }
}

/* ---- islamic months reference (Ummah API) ---- */
async function loadIslamicMonths(el) {
  const host = el.querySelector('#islamicMonths');
  if (!host) return;
  try {
    const months = await fetchIslamicMonths();
    host.innerHTML = months
      .map(
        (m) => `
        <div class="month-row">
          <span class="month-num">${m.number}</span>
          <div class="month-main">
            <div class="month-name">${esc(m.name_english)} <span class="month-ar">${esc(m.name_arabic)}</span></div>
            <div class="month-desc">${esc(m.significance || '')}</div>
          </div>
        </div>`
      )
      .join('');
  } catch {
    host.innerHTML = '<div class="empty">Could not load Islamic months — offline.</div>';
  }
}

/* ---- key islamic dates via Aladhan hToG ---- */
async function fetchHijriDate(day, month, hyear) {
  const ddmm = `${String(day).padStart(2, '0')}-${String(month).padStart(2, '0')}`;
  const key = `${ddmm}-${hyear}`;
  const cache = store.get(EVENTS_CACHE_KEY, {});
  const hit = cache[key];
  if (hit && hit.ts > Date.now() - 1000 * 60 * 60 * 24 * 3) return hit;
  const res = await fetch(`${H2G_BASE}?date=${key}&adjustment=1`);
  if (!res.ok) throw new Error('network');
  const j = await res.json();
  if (j.code !== 200 || !j.data || !j.data.gregorian) throw new Error('payload');
  const g = j.data.gregorian;
  const out = { iso: g.date, display: `${g.day} ${g.month.en} ${g.year}`, ts: Date.now() };
  cache[key] = out;
  store.set(EVENTS_CACHE_KEY, cache);
  return out;
}

function daysUntil(iso) {
  const d = new Date(iso + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((d - today) / 86400000);
}

function countdownLabel(days) {
  if (days === 0) return '<span class="event-today">● today</span>';
  if (days < 0) return `<span class="event-past">${Math.abs(days)}d ago</span>`;
  if (days < 30) return `<span class="event-soon">in ${days} day${days === 1 ? '' : 's'}</span>`;
  return `in ${days} days`;
}

async function loadKeyDates(el) {
  const host = el.querySelector('#keyDates');
  const hyear = currentHijriYear();
  const todayIso = new Date().toISOString().slice(0, 10);
  let rows = [];
  try {
    for (const e of KEY_DATES) {
      let g = await fetchHijriDate(e.day, e.month, hyear);
      if (g.iso < todayIso) {
        try { g = await fetchHijriDate(e.day, e.month, hyear + 1); } catch { /* keep this year's */ }
      }
      rows.push({ ...e, iso: g.iso, display: g.display });
    }
    rows.sort((a, b) => a.iso.localeCompare(b.iso));
    const next = rows.find((r) => r.iso >= todayIso);
    host.innerHTML = `
      ${next ? `
        <div class="event-next">
          <span class="event-next-label">Next up</span>
          <span class="event-next-emoji">${next.emoji}</span>
          <div class="event-next-main">
            <b>${esc(next.name)}</b>
            <span>${esc(next.display)} · ${countdownLabel(daysUntil(next.iso))}</span>
          </div>
        </div>` : ''}
      ${rows.map((r) => {
        const d = daysUntil(r.iso);
        return `
        <div class="event-row">
          <span class="event-emoji">${r.emoji}</span>
          <div class="event-main">
            <div class="event-title">${esc(r.name)} <span class="event-ar">${r.ar}</span></div>
            <div class="event-meta">${esc(r.display)} · ${countdownLabel(d)}</div>
            <div class="event-note">${esc(r.note)}</div>
          </div>
        </div>`;
      }).join('')}
      <div class="field-hint" style="margin-top:10px">Dates from the Umm al-Qura calculation (${hyear} / ${hyear + 1} AH). The start of months depends on actual moon sighting — confirm locally.</div>
    `;
  } catch {
    host.innerHTML = `
      <div class="error-box">
        Could not reach the calendar API — check your connection.<br/>
        <button class="btn btn-emerald btn-sm" id="retryKeyDates">Try again</button>
      </div>`;
    host.querySelector('#retryKeyDates')?.addEventListener('click', () => loadKeyDates(el));
  }
}

/* ---- personal events ---- */
function saveMyEvents(el) {
  store.set(EVENTS_KEY, myEvents);
  renderMyEvents(el);
}

function renderMyEvents(el) {
  const host = el.querySelector('#myEventsList');
  if (!host) return;
  const list = myEvents.slice().sort((a, b) => a.date.localeCompare(b.date));
  const todayIso = new Date().toISOString().slice(0, 10);
  host.innerHTML = list.length
    ? list.map((e) => {
        const d = daysUntil(e.date);
        const dd = e.date.slice(8);
        const mm = new Date(e.date + 'T00:00:00').toLocaleDateString('en-GB', { month: 'short' });
        return `
        <div class="event-row mine${d < 0 ? ' past' : ''}">
          <span class="event-date-badge"><b>${dd}</b>${mm}</span>
          <div class="event-main">
            <div class="event-title">${esc(e.title)}</div>
            <div class="event-meta">${d < 0 ? 'passed' : countdownLabel(d)}${e.note ? ' · ' + esc(e.note) : ''}</div>
          </div>
          <button class="event-del" data-id="${e.id}" aria-label="Remove event">✕</button>
        </div>`;
      }).join('')
    : `<div class="empty">No personal events yet — add a reminder for Eid, a lecture or anything upcoming. 📅</div>`;
  host.querySelectorAll('.event-del').forEach((b) => {
    b.addEventListener('click', () => {
      myEvents = myEvents.filter((e) => e.id !== b.dataset.id);
      saveMyEvents(el);
      toast('Event removed', 'info');
    });
  });
}

function addMyEvent(el) {
  const title = el.querySelector('#evTitle').value.trim();
  const date = el.querySelector('#evDate').value;
  const note = el.querySelector('#evNote').value.trim();
  if (!title || !date) return toast('Add a title and a date first', 'error');
  myEvents.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5), title, date, note });
  el.querySelector('#evTitle').value = '';
  el.querySelector('#evDate').value = '';
  el.querySelector('#evNote').value = '';
  vibrate([18, 26]);
  successSound();
  saveMyEvents(el);
  toast('Event added — may Allah make it a blessed day', 'success');
}
