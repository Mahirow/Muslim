// ============================================================
//  TAB 1 — HOME: Daily basics, habits & spiritual tools
// ============================================================
import { store, vibrate, toast, successSound, playTone, dayOfYear, esc, trackDay, lastNDays, hijriToday, gregorianToday } from '../lib.js';
import { promptInstall, switchTab } from '../main.js';
import { DAILY_QUOTES, ADHKAR_MORNING, ADHKAR_EVENING, SUNNAH_HABITS, EMOTION_REMEDIES, DHIKR_LIST } from '../data.js';
import { randomAyah, randomHadith } from '../ummah-api.js';

const ADH_M_KEY = 'noor.adhkar.m';
const ADH_E_KEY = 'noor.adhkar.e';
const HAB_KEY = 'noor.habits';
const TASB_KEY = 'noor.tasbih';
const QUOTE_KEY = 'noor.quote.idx';

let quoteIdx = (store.get(QUOTE_KEY, dayOfYear(new Date()) % DAILY_QUOTES.length) + dayOfYear(new Date())) % DAILY_QUOTES.length;
// tasbih state: per-dhikr counts keyed by id + shared target + selected dhikr
let tasbih = store.get(TASB_KEY, { counts: {}, target: 33, sel: 'subhan' });
if (!tasbih.counts) tasbih.counts = {};
if (typeof tasbih.count === 'number' && !tasbih.counts.subhan) {
  // migrate legacy single-counter shape { count, target }
  tasbih.counts.subhan = tasbih.count;
  tasbih.sel = 'subhan';
}
let adhkar = { m: store.get(ADH_M_KEY, {}), e: store.get(ADH_E_KEY, {}) };
let habits = store.get(HAB_KEY, {});
let adhView = 'm';
let emotions = {};

export function mount(el) {
  el.innerHTML = `
    <div class="hero" data-view="today">
      <div class="hero-top">
        <span class="hero-logo" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21a9 9 0 1 1 6.4-15.3"/><path d="M15 3l.9 2.1L18 6l-2.1.9L15 9l-.9-2.1L12 6l2.1-.9z" fill="currentColor" stroke="none"/></svg>
        </span>
        <div class="hero-brand">
          <h2 class="hero-title">Noor <span>نور</span></h2>
          <p class="hero-tag">Your Private, Ad-Free Islamic Companion</p>
        </div>
      </div>
      <p class="hero-sub">Track morning &amp; evening Adhkar, build Sunnah habits, and elevate your spiritual life — offline, completely private, zero ads.</p>
      <div class="hero-cta">
        <button class="btn btn-gold" id="heroInstall">📲 Install App</button>
        <button class="btn btn-ghost" id="heroExplore">⬇ Explore Features</button>
      </div>
      <div class="hero-meta">
        <span class="hero-date">☪ <span id="heroHijri"></span></span>
        <span class="hero-privacy">🔒 100% private · 🚫 no ads</span>
      </div>
    </div>

    <div class="seg seg-scroll">
      <button class="seg-btn active" data-view="today">☀️ Today</button>
      <button class="seg-btn" data-view="adhkar">📿 Adhkar</button>
      <button class="seg-btn" data-view="tasbih">🔢 Tasbih</button>
      <button class="seg-btn" data-view="habits">✅ Sunnah Habits</button>
      <button class="seg-btn" data-view="remedy">💚 Spiritual Lows</button>
      <button class="seg-btn" data-view="week">📊 My Week</button>
    </div>

    <div class="card quote-card" data-view="today">
      <div class="card-head">
        <span class="card-ico gold">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M8 3v3m4-3v3M4 9h16M6 5h12a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z"/><path d="M8 13h8M8 16.5h5"/></svg>
        </span>
        <div><div class="card-title">Daily Motivation</div><div class="card-sub">A verse or hadith for your day</div></div>
        <button class="quote-share-btn" id="qShareHead" title="Download the card as a shareable image">📤 Share</button>
      </div>
      <div id="quoteBody"></div>
      <div class="quote-nav">
        <button id="qPrev" aria-label="Previous">‹</button>
        <span class="quote-dots" id="qDots"></span>
        <button id="qNext" aria-label="Next">›</button>
      </div>
      <div class="quote-extra">
        <button class="quote-extra-btn" id="qRandomAyah">🎲 Random Ayah</button>
        <button class="quote-extra-btn" id="qRandomHadith">📜 Random Hadith</button>
        <button class="quote-extra-btn" id="qShare" title="Download the card as a shareable image">🖼️ Share as image</button>
      </div>
    </div>

    <div class="card" id="featuresCard" data-view="today">
      <div class="card-head">
        <span class="card-ico gold">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="2"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2"/></svg>
        </span>
        <div><div class="card-title">What's Inside Noor</div><div class="card-sub">Tap any tile to jump straight into it</div></div>
      </div>
      <div class="feature-grid">
        <button class="feature-tile" data-tab="quran">
          <span class="ft-ico">📖</span>
          <b>Quran &amp; Hifz</b>
          <span>114 surahs · audio · tafsir · voice hifz tester</span>
        </button>
        <button class="feature-tile" data-tab="prayer">
          <span class="ft-ico">🕌</span>
          <b>Prayer &amp; Mosque</b>
          <span>Auto times · Qibla compass · nearby mosques</span>
        </button>
        <button class="feature-tile" data-tab="finance">
          <span class="ft-ico">💰</span>
          <b>Finance &amp; Zakat</b>
          <span>Zakat · sadaqah · inheritance · halal check</span>
        </button>
        <button class="feature-tile" data-tab="education">
          <span class="ft-ico">📚</span>
          <b>Learn &amp; Duas</b>
          <span>Hadith · 99 Names · duas · events · more</span>
        </button>
      </div>
    </div>

    <div class="card trust-card" data-view="today">
      <div class="card-head">
        <span class="card-ico gold">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 3v5c0 4.6-3 8.4-7 10-4-1.6-7-5.4-7-10V6z"/><path d="M9 12l2 2 4-4"/></svg>
        </span>
        <div><div class="card-title">Authentic &amp; Transparent</div><div class="card-sub">Where every word comes from — and what we do with your data</div></div>
      </div>
      <div class="trust-list">
        <div class="trust-item"><b>📖 Qur'an text &amp; audio</b><span>Official public APIs — Quran.com &amp; AlQuran.Cloud. Every ayah shows its surah:ayah reference.</span></div>
        <div class="trust-item"><b>📜 Hadith</b><span>Graded collections — Bukhari, Muslim, Abu Dawud, Tirmidhi, Ibn Majah &amp; more. Source and grade shown on every hadith.</span></div>
        <div class="trust-item"><b>🕌 Prayer times</b><span>Standard calculation methods (MWL, ISNA, Egypt, Makkah…) — you pick your locality's method.</span></div>
        <div class="trust-item"><b>🔒 Your privacy</b><span>No account needed. Everything stays on your device — cloud backup only if you sign in.</span></div>
      </div>
    </div>

    <div class="card" data-view="adhkar">
      <div class="card-head">
        <span class="card-ico">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21c-4-2.5-7-6-7-10a7 7 0 0 1 14 0c0 4-3 7.5-7 10z"/><circle cx="12" cy="11" r="2.4"/></svg>
        </span>
        <div><div class="card-title">Adhkar Checklist</div><div class="card-sub">Morning & evening remembrances</div></div>
      </div>
      <div class="adhkar-toggle">
        <button id="adhM" class="on">🌅 Morning</button>
        <button id="adhE">🌙 Evening</button>
      </div>
      <div class="progress" style="margin-bottom:10px"><div class="progress-bar" id="adhProg"></div></div>
      <div class="adhkar-list" id="adhList"></div>
      <button class="btn btn-ghost btn-block btn-sm" id="adhReset" style="margin-top:10px">Reset this section</button>
    </div>

    <div class="card" data-view="tasbih">
      <div class="card-head">
        <span class="card-ico gold">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M6 6l1.8 1.8M16.2 16.2 18 18M18 6l-1.8 1.8M7.8 16.2 6 18"/><circle cx="12" cy="12" r="4.2"/></svg>
        </span>
        <div><div class="card-title">Digital Tasbih</div><div class="card-sub">16 dhikr to choose · tap · vibrates · autosaves</div></div>
      </div>
      <div class="tasbih-wrap">
        <div class="dhikr-chips" id="dhikrChips"></div>
        <div class="tasbih-count" id="tasbCount">${tasbih.counts[tasbih.sel] || 0}</div>
        <div class="tasbih-target-label" id="tasbTargetLabel">target ${tasbih.target === 0 ? '∞ continuous' : tasbih.target}</div>
        <div class="progress tasbih-progress"><div class="progress-bar" id="tasbProg" style="width:${tasbih.target ? Math.min(100, ((tasbih.counts[tasbih.sel] || 0) % tasbih.target) / tasbih.target * 100) : 0}%"></div></div>
        <button class="tasbih-btn" id="tasbBtn" aria-label="Count dhikr">
          <span class="tasbih-word" id="tasbWord"></span>
          <span class="tasbih-en" id="tasbEn"></span>
        </button>
        <div class="tasbih-controls">
          <select class="select" id="tasbTarget" style="width:150px">
            <option value="33" ${tasbih.target === 33 ? 'selected' : ''}>Target · 33</option>
            <option value="99" ${tasbih.target === 99 ? 'selected' : ''}>Target · 99</option>
            <option value="100" ${tasbih.target === 100 ? 'selected' : ''}>Target · 100</option>
            <option value="0" ${tasbih.target === 0 ? 'selected' : ''}>Continuous ∞</option>
          </select>
          <button class="btn btn-danger btn-sm" id="tasbReset">Reset</button>
        </div>
      </div>
    </div>

    <div class="card" data-view="habits">
      <div class="card-head">
        <span class="card-ico">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.8 4.6L18.5 9l-4.7 1.4L12 15l-1.8-4.6L5.5 9l4.7-1.4z"/><path d="M18.5 15l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z"/></svg>
        </span>
        <div><div class="card-title">Daily Sunnah Habits</div><div class="card-sub">16 prophetic habits to check off</div></div>
      </div>
      <div class="progress" style="margin-bottom:10px"><div class="progress-bar" id="habProg"></div></div>
      <div class="adhkar-list" id="habList"></div>
      <button class="btn btn-ghost btn-block btn-sm" id="habReset" style="margin-top:10px">Reset today's habits</button>
    </div>

    <div class="card" data-view="remedy">
      <div class="card-head">
        <span class="card-ico gold">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21a9 9 0 1 0-9-9c0 3 1.5 5 4 6.5L6 21l3.5-2.3c.8.2 1.6.3 2.5.3z"/><path d="M9 11.5c1.5 0 2.5-.8 3-2 .5 1.2 1.5 2 3 2-1.5 0-2.5.8-3 2-.5-1.2-1.5-2-3-2z"/></svg>
        </span>
        <div><div class="card-title">Spiritual Lows Reset</div><div class="card-sub">Pick an emotion — get a targeted remedy</div></div>
      </div>
      <div class="emotion-grid" id="emotionGrid"></div>
      <div id="remedyBox"></div>
    </div>

    <div class="card" data-view="week">
      <div class="card-head">
        <span class="card-ico">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V10m5 10V4m5 16v-7m5 7V7"/></svg>
        </span>
        <div><div class="card-title">My Ibadah Week</div><div class="card-sub">Your worship activity · last 7 days</div></div>
      </div>
      <div id="ibadahWeek"></div>
    </div>

    <div class="card install-card" id="installCard" data-view="today" hidden>
      <div class="card-head">
        <span class="card-ico">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v11m0 0 4-4m-4 4-4-4"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></svg>
        </span>
        <div><div class="card-title">Install Noor</div><div class="card-sub">Get instant access — free, private &amp; works completely offline</div></div>
      </div>
      <div id="installBody"></div>
    </div>

    <div class="footer-note" data-view="today">
      🔒 100% private — your progress stays on this device. No ads, no tracking.<br/>May Allah accept every deed. <b>آمين</b>
    </div>
  `;

  // ---- quotes ----
  renderQuote();
  el.querySelector('#qPrev').addEventListener('click', () => cycleQuote(-1));
  el.querySelector('#qNext').addEventListener('click', () => cycleQuote(1));
  el.querySelector('#qRandomAyah').addEventListener('click', () => showRandomAyah(el));
  el.querySelector('#qRandomHadith').addEventListener('click', () => showRandomHadith(el));
  el.querySelector('#qShare').addEventListener('click', shareQuoteCard);
  el.querySelector('#qShareHead').addEventListener('click', shareQuoteCard);

  // ---- hero CTA ----
  const heroHijri = el.querySelector('#heroHijri');
  if (heroHijri) heroHijri.textContent = hijriToday() || gregorianToday();
  el.querySelector('#heroInstall').addEventListener('click', async () => {
    if (window.noorInstallable === true) {
      const ok = await promptInstall();
      if (!ok) toast('Install prompt not available on this browser yet — try Chrome or Edge', 'info');
      return;
    }
    const card = el.querySelector('#installCard');
    if (card && !card.hidden) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    else toast('Tap the browser menu ⋮ → “Add to Home Screen”', 'info');
  });
  el.querySelector('#heroExplore').addEventListener('click', () => {
    const f = el.querySelector('#featuresCard');
    if (f) f.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  el.querySelectorAll('.feature-tile').forEach((t) =>
    t.addEventListener('click', () => switchTab(t.dataset.tab))
  );

  // ---- adhkar ----
  el.querySelector('#adhM').addEventListener('click', () => setAdhView('m', el));
  el.querySelector('#adhE').addEventListener('click', () => setAdhView('e', el));
  el.querySelector('#adhReset').addEventListener('click', () => {
    adhkar[adhView] = {};
    store.set(adhView === 'm' ? ADH_M_KEY : ADH_E_KEY, {});
    renderAdhkar(el);
    toast('Section reset', 'info');
  });
  renderAdhkar(el);

  // ---- habits ----
  renderHabits(el);
  el.querySelector('#habReset').addEventListener('click', () => {
    habits = {};
    store.set(HAB_KEY, habits);
    renderHabits(el);
    toast('Habits reset', 'info');
  });

  // ---- tasbih ----
  const selDhikr = () => DHIKR_LIST.find((d) => d.id === tasbih.sel) || DHIKR_LIST[0];
  const renderDhikrChips = () => {
    const host = el.querySelector('#dhikrChips');
    host.innerHTML = DHIKR_LIST.map((d) => `
      <button class="dhikr-chip ${d.id === tasbih.sel ? 'on' : ''}" data-id="${d.id}" aria-pressed="${d.id === tasbih.sel}">${esc(d.latin)}</button>`).join('');
    host.querySelectorAll('.dhikr-chip').forEach((c) =>
      c.addEventListener('click', () => {
        tasbih.sel = c.dataset.id;
        store.set(TASB_KEY, tasbih);
        renderDhikrChips();
        updateTasbih(el);
        vibrate(6);
        const d = DHIKR_LIST.find((x) => x.id === tasbih.sel);
        if (d) toast(d.en, 'success');
      })
    );
  };
  renderDhikrChips();
  updateTasbih(el);
  const btn = el.querySelector('#tasbBtn');
  btn.addEventListener('click', tapTasbih(el));
  el.querySelector('#tasbReset').addEventListener('click', () => {
    tasbih.counts[tasbih.sel] = 0;
    store.set(TASB_KEY, tasbih);
    updateTasbih(el);
  });
  el.querySelector('#tasbTarget').addEventListener('change', (e) => {
    tasbih.target = parseInt(e.target.value, 10);
    store.set(TASB_KEY, tasbih);
    updateTasbih(el);
    toast(tasbih.target ? `Target set to ${tasbih.target}` : 'Continuous mode — no target', 'success');
  });

  // ---- ibadah week analytics ----
  renderIbadahWeek(el);

  // ---- emotions ----
  Object.keys(EMOTION_REMEDIES).forEach((k) => {
    const chip = document.createElement('button');
    chip.className = 'emotion-chip';
    chip.textContent = EMOTION_REMEDIES[k].label;
    chip.dataset.k = k;
    chip.addEventListener('click', () => {
      emotions.selected = k;
      el.querySelectorAll('.emotion-chip').forEach((c) => c.classList.toggle('on', c.dataset.k === k));
      renderRemedy(el);
    });
    el.querySelector('#emotionGrid').appendChild(chip);
  });
  if (emotions.selected) {
    const c = el.querySelector(`.emotion-chip[data-k="${emotions.selected}"]`);
    if (c) c.classList.add('on');
    renderRemedy(el);
  }


  // ---- segment tabs (Today / Adhkar / Tasbih / Habits / Remedy / Week) ----
  const showGroup = (view) => {
    el.querySelectorAll('.card[data-view], .hero[data-view]').forEach((c) => {
      c.hidden = c.dataset.view !== view;
    });
    el.querySelectorAll('.footer-note[data-view]').forEach((f) => {
      f.hidden = f.dataset.view !== view;
    });
  };
  el.querySelectorAll('.seg-btn').forEach((b) =>
    b.addEventListener('click', () => {
      el.querySelectorAll('.seg-btn').forEach((x) => x.classList.toggle('active', x === b));
      showGroup(b.dataset.view);
    })
  );
  showGroup('today');

  // ---- install card (runs after showGroup so it keeps control of its own visibility) ----
  renderInstallCard(el);
  window.addEventListener('noor-install-ready', () => renderInstallCard(el));
}

/* ---------------- install app ---------------- */
function renderInstallCard(el) {
  const card = el.querySelector('#installCard');
  if (!card) return;
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
  const standalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;
  const heroInstall = el.querySelector('#heroInstall');
  if (standalone) {
    card.hidden = true;
    if (heroInstall) heroInstall.hidden = true;
    return;
  }
  card.hidden = false;
  if (heroInstall) heroInstall.hidden = false;
  const body = el.querySelector('#installBody');
  if (isIOS) {
    body.innerHTML = `
      <div class="remedy" style="border-color:var(--line)">
        <div class="remedy-action">On iPhone / iPad:<br/><b>1.</b> Tap the <b>Share</b> button in Safari<br/><b>2.</b> Choose <b>“Add to Home Screen”</b><br/><b>3.</b> Tap <b>Add</b> — Noor appears on your home screen like a real app, ready offline.</div>
      </div>`;
    return;
  }
  const installable = window.noorInstallable === true;
  if (installable) {
    body.innerHTML = `
      <button class="btn btn-gold btn-block" id="installBtn">⬇️ Install Noor app</button>
      <div class="field-hint" style="margin-top:8px">100% free · private · works completely offline — prayer times, adhkar and Hifz everywhere you go.</div>`;
    body.querySelector('#installBtn').addEventListener('click', async () => {
      const ok = await promptInstall();
      if (!ok) toast('Install prompt not available on this browser yet — try Chrome or Edge', 'info');
    });
  } else {
    body.innerHTML = `
      <div class="remedy" style="border-color:var(--line)">
        <div class="remedy-action">Two taps: open the browser menu <b>(⋮)</b> → <b>“Add to Home Screen”</b> or <b>“Install app”</b>. Noor becomes a real app — free, private, works offline.</div>
      </div>`;
  }
}

/* ---------------- quotes ---------------- */
function renderQuote() {
  const q = DAILY_QUOTES[quoteIdx];
  const body = document.getElementById('quoteBody');
  body.innerHTML = `
    <div class="quote-ar">${q.ar}</div>
    <div class="quote-en">“${esc(q.en)}”</div>
    <div class="quote-ref">${esc(q.ref)}</div>
  `;
  document.getElementById('qDots').textContent = `${quoteIdx + 1} / ${DAILY_QUOTES.length} · today's rotation`;
}
function cycleQuote(dir) {
  quoteIdx = (quoteIdx + dir + DAILY_QUOTES.length) % DAILY_QUOTES.length;
  store.set(QUOTE_KEY, quoteIdx);
  const body = document.getElementById('quoteBody');
  body.style.animation = 'none';
  void body.offsetWidth;
  body.style.animation = 'fadeUp 0.35s ease';
  renderQuote();
}

/* ---------------- daily motivation → shareable image ---------------- */
function wrapCtxText(ctx, text, maxWidth) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (line && ctx.measureText(test).width > maxWidth) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawSparkle(ctx, cx, cy, r) {
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.lineTo(cx + r * 0.28, cy - r * 0.28);
  ctx.lineTo(cx + r, cy);
  ctx.lineTo(cx + r * 0.28, cy + r * 0.28);
  ctx.lineTo(cx, cy + r);
  ctx.lineTo(cx - r * 0.28, cy + r * 0.28);
  ctx.lineTo(cx - r, cy);
  ctx.lineTo(cx - r * 0.28, cy - r * 0.28);
  ctx.closePath();
  ctx.fill();
}

function drawDiamond(ctx, cx, cy, r) {
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.lineTo(cx + r, cy);
  ctx.lineTo(cx, cy + r);
  ctx.lineTo(cx - r, cy);
  ctx.closePath();
  ctx.fill();
}

function drawStar(ctx, cx, cy, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.42;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const px = cx + Math.cos(a) * rad;
    const py = cy + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

function drawQuoteCard(ar, en, ref) {
  const W = 1080;
  const H = 1350;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const x = c.getContext('2d');

  const EMERALD = '#064e3b';
  const GOLD_SOFT = '#f0b75e';
  const CREAM = '#f7f1e3';

  // ---- layered background: deep emerald + gold & mint ambient glows (mirrors the app shell) ----
  const bg = x.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#0b5c45');
  bg.addColorStop(0.5, EMERALD);
  bg.addColorStop(1, '#033327');
  x.fillStyle = bg;
  x.fillRect(0, 0, W, H);

  // ambient glows
  const goldGlow = x.createRadialGradient(W * 0.86, -60, 10, W * 0.86, -60, 560);
  goldGlow.addColorStop(0, 'rgba(251,191,36,0.30)');
  goldGlow.addColorStop(1, 'rgba(251,191,36,0)');
  x.fillStyle = goldGlow;
  x.fillRect(0, 0, W, H);

  const mintGlow = x.createRadialGradient(-40, H + 60, 10, -40, H + 60, 620);
  mintGlow.addColorStop(0, 'rgba(110,231,183,0.22)');
  mintGlow.addColorStop(1, 'rgba(110,231,183,0)');
  x.fillStyle = mintGlow;
  x.fillRect(0, 0, W, H);

  // faint sparkle texture
  x.fillStyle = 'rgba(255,255,255,0.06)';
  [[160, 260], [925, 470], [150, 900], [940, 1060], [320, 1215], [800, 140], [510, 66], [60, 560], [990, 700], [90, 1180]].forEach(([sx, sy]) => drawSparkle(x, sx, sy, 9));

  // soft gold frame with outer glow
  x.shadowColor = 'rgba(2,44,34,0.8)';
  x.shadowBlur = 30;
  x.strokeStyle = 'rgba(240,183,94,0.55)';
  x.lineWidth = 2;
  x.strokeRect(40, 40, W - 80, H - 80);
  x.shadowBlur = 0;
  x.strokeStyle = 'rgba(240,183,94,0.25)';
  x.lineWidth = 1;
  x.strokeRect(58, 58, W - 116, H - 116);
  x.fillStyle = GOLD_SOFT;
  [[40, 40], [W - 40, 40], [40, H - 40], [W - 40, H - 40]].forEach(([cx, cy]) => drawDiamond(x, cx, cy, 10));

  // ---- gold-gradient emblem (crescent + star) with soft glow ----
  const goldGrad = x.createLinearGradient(W / 2 - 90, 120, W / 2 + 130, 320);
  goldGrad.addColorStop(0, '#fde68a');
  goldGrad.addColorStop(0.55, '#fbbf24');
  goldGrad.addColorStop(1, '#d97706');

  const mx = 470;
  const my = 230;
  const mr = 54;
  x.shadowColor = 'rgba(251,191,36,0.55)';
  x.shadowBlur = 46;
  x.fillStyle = goldGrad;
  x.beginPath();
  x.arc(mx, my, mr, 0, Math.PI * 2);
  x.fill();
  x.globalCompositeOperation = 'destination-out';
  x.beginPath();
  x.arc(mx + 26, my - 17, mr - 14, 0, Math.PI * 2);
  x.fill();
  x.globalCompositeOperation = 'source-over';
  x.fillStyle = '#0a5c44';
  x.beginPath();
  x.arc(mx + 26, my - 17, mr - 14, 0, Math.PI * 2);
  x.fill();
  x.shadowBlur = 0;
  drawStar(x, 602, 198, 30, '#fde68a');

  // wordmark (gold gradient)
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.fillStyle = goldGrad;
  x.font = '700 48px "Segoe UI", system-ui, sans-serif';
  x.fillText('N O O R', W / 2, 336);

  // divider under wordmark
  x.strokeStyle = 'rgba(240,183,94,0.6)';
  x.lineWidth = 2;
  x.beginPath();
  x.moveTo(W / 2 - 150, 380);
  x.lineTo(W / 2 - 26, 380);
  x.stroke();
  x.beginPath();
  x.moveTo(W / 2 + 26, 380);
  x.lineTo(W / 2 + 150, 380);
  x.stroke();
  drawDiamond(x, W / 2, 380, 7);

  // ================= frosted glass panel =================
  const panel = { x: 70, y: 440, w: W - 140, h: H - 440 - 150 };
  const radius = 42;

  // capture current art, blur it, and clip to the panel => frosted glass
  const off = document.createElement('canvas');
  off.width = W;
  off.height = H;
  const o = off.getContext('2d');
  o.drawImage(c, 0, 0);

  const rr = (px, py, pw, ph, pr) => {
    const p = new Path2D();
    p.moveTo(px + pr, py);
    p.arcTo(px + pw, py, px + pw, py + ph, pr);
    p.arcTo(px + pw, py + ph, px, py + ph, pr);
    p.arcTo(px, py + ph, px, py, pr);
    p.arcTo(px, py, px + pw, py, pr);
    p.closePath();
    return p;
  };
  const panelPath = rr(panel.x, panel.y, panel.w, panel.h, radius);

  // frosted backdrop: blurred copy of the art behind the glass
  if (x.filter && typeof x.filter === 'string') {
    try {
      x.save();
      x.filter = 'blur(22px) saturate(1.5)';
      x.clip(panelPath);
      x.drawImage(off, 0, 0);
      x.restore();
    } catch (e) { /* older engines: fall through to tint-only glass */ }
  } else {
    x.fillStyle = 'rgba(255,255,255,0.10)';
    x.fill(panelPath);
  }

  // glass tint gradient
  const tint = x.createLinearGradient(0, panel.y, 0, panel.y + panel.h);
  tint.addColorStop(0, 'rgba(255,255,255,0.16)');
  tint.addColorStop(0.4, 'rgba(255,255,255,0.07)');
  tint.addColorStop(1, 'rgba(255,255,255,0.12)');
  x.fillStyle = tint;
  x.fill(panelPath);

  // glass border + top highlight
  x.strokeStyle = 'rgba(255,255,255,0.30)';
  x.lineWidth = 2.5;
  x.stroke(panelPath);
  x.save();
  x.clip(panelPath);
  x.fillStyle = 'rgba(255,255,255,0.12)';
  x.beginPath();
  x.ellipse(W / 2, panel.y + 14, panel.w * 0.6, 26, 0, 0, Math.PI * 2);
  x.fill();
  x.restore();

  // ================= content inside the glass =================
  let y = panel.y + 58;
  x.textBaseline = 'top';

  // Arabic (right-aligned)
  if (ar) {
    let size = 54;
    let lines = [];
    for (let pass = 0; pass < 3; pass++) {
      x.font = size + 'px "Noto Naskh Arabic","Amiri","Scheherazade New","Traditional Arabic",serif';
      lines = wrapCtxText(x, ar, panel.w - 110);
      if (lines.length <= 5 || size <= 34) break;
      size -= 7;
    }
    x.fillStyle = CREAM;
    x.textAlign = 'right';
    const lh = Math.round(size * 1.6);
    for (const line of lines) {
      x.fillText(line, panel.x + panel.w - 55, y);
      y += lh;
    }
    // ornament under arabic
    y += 8;
    x.strokeStyle = 'rgba(240,183,94,0.6)';
    x.lineWidth = 2;
    x.beginPath();
    x.moveTo(W / 2 - 140, y);
    x.lineTo(W / 2 - 24, y);
    x.stroke();
    x.beginPath();
    x.moveTo(W / 2 + 24, y);
    x.lineTo(W / 2 + 140, y);
    x.stroke();
    drawDiamond(x, W / 2, y, 7);
    y += 62;
  }

  // English (centered, elegant)
  if (en) {
    const plain = String(en).replace(/^[“”"']+|[“”"']+$/g, '');
    let size = 42;
    let lines = [];
    for (let pass = 0; pass < 3; pass++) {
      x.font = 'italic ' + size + 'px Georgia, "Times New Roman", serif';
      lines = wrapCtxText(x, plain, panel.w - 120);
      if (lines.length <= 5 || size <= 28) break;
      size -= 5;
    }
    const lh = Math.round(size * 1.5);
    // decorative opening quote
    x.fillStyle = GOLD_SOFT;
    x.font = 'italic 80px Georgia, serif';
    x.textAlign = 'center';
    x.fillText('\u201C', W / 2, y - lh * 0.3);
    x.fillStyle = CREAM;
    x.font = 'italic ' + size + 'px Georgia, "Times New Roman", serif';
    for (const line of lines) {
      x.fillText(line, W / 2, y);
      y += lh;
    }
    y += 32;
  }

  // reference — frosted gold pill
  if (ref) {
    x.font = '600 30px "Segoe UI", system-ui, sans-serif';
    const tw = x.measureText(ref).width;
    const pillW = Math.min(tw + 64, panel.w - 40);
    const pillH = 56;
    const pillY = Math.min(Math.max(y, panel.y + panel.h - 110), panel.y + panel.h - 72);
    const pillX = (W - pillW) / 2;
    const pillPath = rr(pillX, pillY, pillW, pillH, pillH / 2);
    x.fillStyle = 'rgba(251,191,36,0.18)';
    x.fill(pillPath);
    x.strokeStyle = 'rgba(251,191,36,0.6)';
    x.lineWidth = 2;
    x.stroke(pillPath);
    x.fillStyle = '#fde68a';
    x.textBaseline = 'middle';
    x.fillText(ref, W / 2, pillY + pillH / 2);
    x.textBaseline = 'top';
  }

  // footer ornament + watermark
  x.strokeStyle = 'rgba(240,183,94,0.5)';
  x.lineWidth = 1.5;
  x.beginPath();
  x.moveTo(W / 2 - 90, H - 92);
  x.lineTo(W / 2 - 18, H - 92);
  x.stroke();
  x.beginPath();
  x.moveTo(W / 2 + 18, H - 92);
  x.lineTo(W / 2 + 90, H - 92);
  x.stroke();
  drawDiamond(x, W / 2, H - 92, 5);
  x.fillStyle = 'rgba(247,241,227,0.6)';
  x.font = '600 26px "Segoe UI", system-ui, sans-serif';
  x.textAlign = 'center';
  x.fillText('Noor \u00B7 Muslim Companion', W / 2, H - 58);

  return c;
}

function downloadBlob(blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'noor-daily-motivation.png';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  toast('Image saved — ready to share! \uD83D\uDCE4', 'success');
}

function dataURLtoBlob(dataUrl) {
  const parts = dataUrl.split(',');
  const mime = parts[0].match(/:(.*?);/)[1];
  const bin = atob(parts[1]);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

function shareQuoteCard() {
  const read = (sel) => {
    const n = document.querySelector('#quoteBody ' + sel);
    return n ? n.textContent.trim() : '';
  };
  const ar = read('.quote-ar');
  const en = read('.quote-en');
  const ref = read('.quote-ref');
  if (!ar && !en) {
    toast('Nothing to share yet — open a quote first', 'info');
    return;
  }
  const canvas = drawQuoteCard(ar, en, ref);
  const done = (blob) => {
    if (!blob) {
      toast('Could not create the image on this device', 'error');
      return;
    }
    const file = new File([blob], 'noor-daily-motivation.png', { type: 'image/png' });
    const shareData = { files: [file], title: 'Noor — Daily Motivation' };
    if (navigator.canShare && navigator.canShare(shareData)) {
      navigator.share(shareData).then(() => vibrate(10)).catch(() => downloadBlob(blob));
      return;
    }
    downloadBlob(blob);
  };
  if (canvas.toBlob) {
    canvas.toBlob(done, 'image/png');
  } else {
    done(dataURLtoBlob(canvas.toDataURL('image/png')));
  }
}

/* ---------------- live random ayah / hadith (Ummah API) ---------------- */
async function showRandomAyah(el) {
  const btn = el.querySelector('#qRandomAyah');
  const body = document.getElementById('quoteBody');
  if (btn) btn.disabled = true;
  body.style.animation = 'none';
  void body.offsetWidth;
  body.style.animation = 'fadeUp 0.35s ease';
  body.innerHTML = `<div class="empty" style="padding:14px"><div class="spinner"></div>Fetching a random ayah…</div>`;
  try {
    const d = await randomAyah();
    const s = d.surah || {};
    const v = d.verse || {};
    const trans = (v.translations && v.translations.sahih_international) || '';
    body.innerHTML = `
      <div class="quote-ar">${v.arabic || ''}</div>
      <div class="quote-en">“${esc(trans)}”</div>
      <div class="quote-ref">${s.number}:${v.ayah} · ${esc(s.name_english)} · ${esc(s.name_translation || '')}</div>
    `;
    document.getElementById('qDots').textContent = 'Random ayah · tap the card buttons again for more';
    vibrate(8);
    trackDay('dua');
  } catch {
    body.innerHTML = `<div class="quote-en">Could not reach the Quran API — check your connection and try again.</div>`;
  } finally {
    if (btn) btn.disabled = false;
  }
}

async function showRandomHadith(el) {
  const btn = el.querySelector('#qRandomHadith');
  const body = document.getElementById('quoteBody');
  if (btn) btn.disabled = true;
  body.style.animation = 'none';
  void body.offsetWidth;
  body.style.animation = 'fadeUp 0.35s ease';
  body.innerHTML = `<div class="empty" style="padding:14px"><div class="spinner"></div>Fetching a random hadith…</div>`;
  try {
    const h = await randomHadith();
    body.innerHTML = `
      <div class="quote-ar" style="font-size:1.12rem">${h.arabic || ''}</div>
      <div class="quote-en">“${esc(h.english || '')}”</div>
      <div class="quote-ref">${esc(h.collection_name || 'Hadith')} · #${h.hadithnumber}${h.grade ? ' · ' + esc(h.grade) : ''}</div>
    `;
    document.getElementById('qDots').textContent = 'Random hadith · sourced live';
    vibrate(8);
    trackDay('dua');
  } catch {
    body.innerHTML = `<div class="quote-en">Could not reach the hadith API — check your connection and try again.</div>`;
  } finally {
    if (btn) btn.disabled = false;
  }
}

/* ---------------- adhkar ---------------- */
function setAdhView(v, el) {
  adhView = v;
  el.querySelector('#adhM').classList.toggle('on', v === 'm');
  el.querySelector('#adhE').classList.toggle('on', v === 'e');
  renderAdhkar(el);
}
function renderAdhkar(el) {
  const list = ADHKAR_MORNING.map((i) => ({ ...i, key: ADH_M_KEY, map: adhkar.m }));
  if (adhView === 'e') list.length = 0, list.push(...ADHKAR_EVENING.map((i) => ({ ...i, key: ADH_E_KEY, map: adhkar.e })));
  const host = el.querySelector('#adhList');
  host.innerHTML = list.map((it) => {
    const done = !!it.map[it.id];
    return `
      <label class="cbx-row ${done ? 'done' : ''}" data-id="${it.id}">
        <span class="cbx-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 12.5l5 5 10-11"/></svg>
        </span>
        <span class="cbx-body">
          <span class="cbx-title">${esc(it.t)}<span class="cbx-count">×${it.n}</span></span>
          <span class="cbx-ar">${it.ar}</span>
          <span class="cbx-en">${esc(it.en)}</span>
          <span class="cbx-ref">${esc(it.ref)}</span>
        </span>
      </label>`;
  }).join('');
  host.querySelectorAll('.cbx-row').forEach((row) => {
    row.addEventListener('click', () => {
      const id = row.dataset.id;
      const map = adhView === 'm' ? adhkar.m : adhkar.e;
      const key = adhView === 'm' ? ADH_M_KEY : ADH_E_KEY;
      map[id] = !map[id];
      store.set(key, map);
      row.classList.toggle('done', !!map[id]);
      if (map[id]) { vibrate(8); successSound(); trackDay('adhkar'); renderIbadahWeek(el); } else { vibrate(4); }
      updateAdhProg(el);
    });
  });
  updateAdhProg(el);
}
function updateAdhProg(el) {
  const arr = adhView === 'm' ? ADHKAR_MORNING : ADHKAR_EVENING;
  const map = adhView === 'm' ? adhkar.m : adhkar.e;
  const done = arr.filter((i) => map[i.id]).length;
  const pct = arr.length ? Math.round((done / arr.length) * 100) : 0;
  el.querySelector('#adhProg').style.width = pct + '%';
}

/* ---------------- habits ---------------- */
function renderHabits(el) {
  const host = el.querySelector('#habList');
  host.innerHTML = SUNNAH_HABITS.map((it) => {
    const done = !!habits[it.id];
    return `
      <label class="cbx-row ${done ? 'done' : ''}" data-id="${it.id}">
        <span class="cbx-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 12.5l5 5 10-11"/></svg>
        </span>
        <span class="cbx-body">
          <span class="cbx-title">${esc(it.t)}</span>
          <span class="cbx-ar">${it.ar}</span>
          <span class="cbx-en">${esc(it.en)}</span>
        </span>
      </label>`;
  }).join('');
  host.querySelectorAll('.cbx-row').forEach((row) => {
    row.addEventListener('click', () => {
      const id = row.dataset.id;
      habits[id] = !habits[id];
      store.set(HAB_KEY, habits);
      row.classList.toggle('done', !!habits[id]);
      if (habits[id]) { vibrate(8); successSound(); trackDay('habits'); renderIbadahWeek(el); } else { vibrate(4); }
      updateHabProg(el);
    });
  });
  updateHabProg(el);
}
function updateHabProg(el) {
  const done = SUNNAH_HABITS.filter((i) => habits[i.id]).length;
  el.querySelector('#habProg').style.width = Math.round((done / SUNNAH_HABITS.length) * 100) + '%';
}

/* ---------------- tasbih ---------------- */
function tapTasbih(el) {
  return () => {
    const cur = tasbih.counts[tasbih.sel] || 0;
    tasbih.counts[tasbih.sel] = cur + 1;
    store.set(TASB_KEY, tasbih);
    vibrate(14);
    updateTasbih(el);
    if ((cur + 1) % 33 === 0) { trackDay('tasbih', 33); renderIbadahWeek(el); }
    if (tasbih.target > 0 && (cur + 1) % tasbih.target === 0) {
      vibrate([30, 50, 60]);
      playTone([523.25, 659.25, 783.99], 0.16);
      const btn = el.querySelector('#tasbBtn');
      btn.classList.add('celebrate');
      setTimeout(() => btn.classList.remove('celebrate'), 950);
      toast(`Masha'Allah! ${tasbih.target} complete`, 'success');
    }
  };
}
function updateTasbih(el) {
  const d = DHIKR_LIST.find((x) => x.id === tasbih.sel) || DHIKR_LIST[0];
  const cur = tasbih.counts[tasbih.sel] || 0;
  el.querySelector('#tasbWord').textContent = d.ar;
  el.querySelector('#tasbEn').textContent = d.en;
  el.querySelector('#tasbCount').textContent = cur;
  el.querySelector('#tasbTargetLabel').textContent = tasbih.target ? `target ${tasbih.target}` : 'continuous ∞';
  const inCycle = tasbih.target ? cur % tasbih.target : 0;
  el.querySelector('#tasbProg').style.width = (tasbih.target ? Math.min(100, (inCycle / tasbih.target) * 100) : 0) + '%';
}

/* ---------------- ibadah week analytics ---------------- */
const IBAH_COLORS = ['#047857', '#d97706', '#0f766e', '#b45309', '#10b981'];
function renderIbadahWeek(el) {
  const host = el.querySelector('#ibadahWeek');
  if (!host) return;
  const days = lastNDays(7);
  const max = Math.max(1, ...days.map((d) => d.adhkar + d.habits + d.tasbih + d.prayers + d.dua));
  const total = days.reduce((s, d) => s + d.adhkar + d.habits + d.tasbih + d.prayers + d.dua, 0);
  const kinds = [
    { k: 'adhkar', label: 'Adhkar' },
    { k: 'habits', label: 'Habits' },
    { k: 'prayers', label: 'Prayers' },
    { k: 'dua', label: 'Duas' },
    { k: 'tasbih', label: 'Tasbih (33s)' },
  ];
  host.innerHTML = `
    <div class="ibadah-bars">
      ${days.map((d) => {
        const v = d.adhkar + d.habits + d.tasbih + d.prayers + d.dua;
        const h = Math.round((v / max) * 100);
        return `
        <div class="ibadah-col">
          <span class="ibadah-val">${v || ''}</span>
          <div class="ibadah-bar-wrap">
            <div class="ibadah-bar${v ? ' filled' : ''}" style="height:${v ? h : 3}%"></div>
          </div>
          <span class="ibadah-day">${d.label}</span>
        </div>`;
      }).join('')}
    </div>
    <div class="ibadah-total">${total} acts of worship recorded this week · ${Math.round((days[6]?.adhkar + days[6]?.habits + days[6]?.tasbih + days[6]?.prayers + days[6]?.dua || 0))} today</div>
    <div class="ibadah-legend">${kinds.map((k, i) => `<span><i style="background:${IBAH_COLORS[i]}"></i>${k.label}</span>`).join('')}</div>
    <div class="field-hint">Every adhkar item, habit and 33-count of tasbih you complete is recorded here — your deeds don't go unseen. 🤲</div>
  `;
}

/* ---------------- spiritual lows ---------------- */
function renderRemedy(el) {
  const box = el.querySelector('#remedyBox');
  const r = EMOTION_REMEDIES[emotions.selected];
  if (!r) { box.innerHTML = ''; return; }
  box.innerHTML = `
    <div class="remedy">
      <div class="remedy-sec">
        <div class="remedy-label">Quranic remedy</div>
        <div class="remedy-ar">${r.verse.ar}</div>
        <div class="remedy-en">“${esc(r.verse.en)}”</div>
        <div class="remedy-ref">${esc(r.verse.ref)}</div>
      </div>
      <div class="remedy-sec">
        <div class="remedy-label">Authentic du'a</div>
        <div class="remedy-ar">${r.dua.ar}</div>
        <div class="remedy-en">“${esc(r.dua.en)}”</div>
        <div class="remedy-ref">${esc(r.dua.ref)}</div>
      </div>
      <div class="remedy-sec">
        <div class="remedy-label">Practical step</div>
        <div class="remedy-action">${esc(r.action)}</div>
      </div>
    </div>`;
}
