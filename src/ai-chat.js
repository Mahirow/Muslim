// ============================================================
//  ai-chat.js — Noor AI assistant (Google Gemini)
//  Floating chat: answers from the app's own Islamic APIs via
//  function calling, and falls back to Google Search grounding
//  (with cited sources) when the tools don't cover a question.
//  Also: voice input, personal stats mode, rate-limit guard.
//  Lazy-loaded — the main bundle stays small until first tap.
// ============================================================
import { store, esc, vibrate, toast, lastNDays } from './lib.js';
import {
  searchQuran,
  searchHadith,
  fetchTafsir,
  fetchOnlineDuas,
  fetchAsmaUlHusna,
  fetchZakatPrices,
} from './ummah-api.js';

const CHAT_KEY = 'noor.ai.chat';
const USAGE_KEY = 'noor.ai.usage';
const env = (n) => (import.meta.env || {})['VITE_' + n] || (import.meta.env || {})[n] || '';
const API_KEY = env('GEMINI_API_KEY');
const MODEL = env('GEMINI_MODEL') || 'gemini-flash-latest';
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

// Gemini free-tier rate limits (guarded via localStorage)
const RPM_LIMIT = 15; // requests per minute (free tier)
const RPD_LIMIT = 150; // requests per day (free tier)
const WARN_PCT = 0.8; // warn when 80% used

const SUGGESTIONS = [
  'What is the dua for travelling?',
  'Find a hadith about kindness',
  'What does Surah Al-Ikhlas mean?',
  'Tell me about Ar-Rahman, one of the 99 Names',
  'How much zakat do I owe?',
  'Summarise my week of worship',
];

/* ---------------- rate-limit guard ---------------- */
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function getUsage() {
  const u = store.get(USAGE_KEY, { day: todayStr(), calls: [], daily: 0, quotaAt: 0 });
  if (u.day !== todayStr()) {
    u.day = todayStr();
    u.calls = [];
    u.daily = 0;
  }
  return u;
}
function recordCall() {
  const u = getUsage();
  const now = Date.now();
  u.calls = u.calls.filter((t) => now - t < 60000); // keep this minute
  u.calls.push(now);
  u.daily = (u.daily || 0) + 1;
  store.set(USAGE_KEY, u);
}
// Returns { allow, msg? } — blocks when the free tier is exhausted
function checkLimit() {
  const u = getUsage();
  const now = Date.now();
  const inMinute = u.calls.filter((t) => now - t < 60000).length;
  const inDay = u.daily || 0;
  if (inMinute >= RPM_LIMIT) {
    return { allow: false, msg: `You've hit the free-tier limit of ${RPM_LIMIT} requests per minute. Wait a moment and try again — or upgrade your Gemini plan for higher limits.` };
  }
  if (inDay >= RPD_LIMIT) {
    return { allow: false, msg: `You've reached the free-tier daily limit of ${RPD_LIMIT} requests. It resets at midnight — or upgrade your Gemini plan.` };
  }
  if (now - (u.quotaAt || 0) < 60000) {
    return {
      allow: false,
      msg: "Google's free-tier limit was just reached. Wait about a minute and try again — or upgrade your Gemini plan for higher limits.",
    };
  }
  if (inMinute >= Math.round(RPM_LIMIT * WARN_PCT)) {
    return { allow: true, msg: `Heads up: you've made ${inMinute} requests in the last minute (free tier allows ${RPM_LIMIT}/min).` };
  }
  return { allow: true, msg: '' };
}

/* ---------------- Gemini function declarations (app's own APIs) ---------------- */
const FUNC_TOOLS = [
  {
    functionDeclarations: [
      {
        name: 'searchQuran',
        description: 'Search the Quran by keyword/topic and return matching verses with references.',
        parameters: {
          type: 'OBJECT',
          properties: { query: { type: 'STRING', description: 'English keyword or topic, e.g. mercy, patience' } },
          required: ['query'],
        },
      },
      {
        name: 'searchHadith',
        description: 'Search authentic hadith collections by keyword and return hadith texts with references.',
        parameters: {
          type: 'OBJECT',
          properties: { query: { type: 'STRING', description: 'English keyword, e.g. kindness, fasting' } },
          required: ['query'],
        },
      },
      {
        name: 'getTafsir',
        description: 'Fetch the tafsir (commentary) of one Quranic verse.',
        parameters: {
          type: 'OBJECT',
          properties: {
            surah: { type: 'INTEGER', description: 'Surah number 1-114' },
            ayah: { type: 'INTEGER', description: 'Ayah number within the surah' },
          },
          required: ['surah', 'ayah'],
        },
      },
      {
        name: 'getDuas',
        description: 'Get authentic duas/supplications for a context (morning, evening, travel, eating, etc).',
        parameters: {
          type: 'OBJECT',
          properties: { context: { type: 'STRING', description: 'e.g. morning, evening, travel, eating, sleeping' } },
          required: ['context'],
        },
      },
      {
        name: 'getAsma',
        description: 'Get one or more of the 99 Names of Allah (Asma ul Husna) with their meaning.',
        parameters: {
          type: 'OBJECT',
          properties: { query: { type: 'STRING', description: 'Optional keyword to filter names, e.g. mercy, rahman' } },
        },
      },
      {
        name: 'getZakatInfo',
        description: 'Get today\'s zakat nisab thresholds (gold & silver) and a quick 2.5% calculation.',
        parameters: { type: 'OBJECT', properties: {} },
      },
      {
        name: 'getPersonalStats',
        description: 'Read the user\'s own saved app data: last 7 days of worship activity (adhkar, habits, tasbih, prayers, duas), tasbih totals, sadaqah log and zakat settings. Use when the user asks about their own progress or numbers.',
        parameters: { type: 'OBJECT', properties: {} },
      },
    ],
  },
];

/* ---------------- tool executors (run against ummah-api / localStorage) ---------------- */
async function runTool(name, args = {}) {
  switch (name) {
    case 'searchQuran': {
      const d = await searchQuran(args.query || 'mercy', 4);
      const results = (d && d.results) || [];
      return results.map((r) => ({
        ref: `${r.surah_name} ${r.surah_number}:${r.ayah}`,
        arabic: r.arabic,
        transliteration: r.transliteration || '',
        english: (r.translations && r.translations.sahih_international) || r.matches || '',
      }));
    }
    case 'searchHadith': {
      const d = await searchHadith(args.query || 'kindness', 4);
      const hadiths = (d && d.hadiths) || [];
      return hadiths.map((h) => ({
        number: h.hadithnumber,
        collection: h.collection || h.collection_name || 'Hadith',
        english: h.english,
        grade: h.grade || '',
      }));
    }
    case 'getTafsir': {
      const d = await fetchTafsir(args.surah || 1, args.ayah || 1, 'muyassar');
      return d && d.tafsir
        ? { surah: args.surah, ayah: args.ayah, name: d.tafsir.name, author: d.tafsir.author, text: d.tafsir.text }
        : { error: 'Tafsir not found' };
    }
    case 'getDuas': {
      const ctx = (args.context || 'morning').toLowerCase();
      const d = await fetchOnlineDuas();
      const list = (d && d.duas) || [];
      const byCat = list.filter((x) => String(x.category || '').toLowerCase().includes(ctx));
      const pick = (byCat.length ? byCat : list).slice(0, 3);
      return pick.map((x) => ({
        category: x.category,
        title: x.title,
        arabic: x.arabic,
        translation: x.translation,
        source: x.source,
      }));
    }
    case 'getAsma': {
      const names = await fetchAsmaUlHusna();
      const q = String(args.query || '').toLowerCase();
      const list = q
        ? names.filter((n) => (n.english || '').toLowerCase().includes(q) || (n.meaning || '').toLowerCase().includes(q))
        : names.slice(0, 5);
      return list.map((n) => ({ number: n.number, arabic: n.arabic, english: n.english, meaning: n.meaning }));
    }
    case 'getZakatInfo': {
      const p = await fetchZakatPrices();
      return {
        currency: p.currency,
        gold_nisab: p.nisab_gold_value,
        silver_nisab: p.nisab_silver_value,
        as_of: p.as_of,
        note: 'Zakat due = 2.5% of net wealth above nisab.',
      };
    }
    case 'getPersonalStats': {
      const days = lastNDays(7);
      const total = days.reduce((s, d) => s + d.adhkar + d.habits + d.tasbih + d.prayers + d.dua, 0);
      const today = days[days.length - 1] || { adhkar: 0, habits: 0, tasbih: 0, prayers: 0, dua: 0 };
      const tasbih = store.get('noor.tasbih', { counts: {}, target: 33, sel: 'subhan' });
      const tasbihTotal = Object.values(tasbih.counts || {}).reduce((a, b) => a + b, 0);
      const sadaqah = store.get('noor.sadaqah', { goal: 100, entries: [] });
      const sadAll = (sadaqah.entries || []).reduce((s, e) => s + e.amount, 0);
      const sadCount = (sadaqah.entries || []).length;
      const zakat = store.get('noor.zakat', {});
      return {
        last_7_days: days.map((d) => ({
          day: d.label, adhkar: d.adhkar, habits: d.habits, tasbih: d.tasbih, prayers: d.prayers, duas: d.dua,
        })),
        week_total_acts: total,
        today,
        tasbih_total_count: tasbihTotal,
        sadaqah_total_given: sadAll,
        sadaqah_donation_count: sadCount,
        zakat_saved_inputs: zakat,
      };
    }
    default:
      return { error: 'Unknown tool' };
  }
}

/* ---------------- Gemini REST call (with function-calling loop) ---------------- */
const SYSTEM_PROMPT = `You are "Noor AI", the wise and gentle assistant inside the Noor Muslim Companion app.
You help Muslims with Quran, hadith, tafsir, duas, the 99 Names of Allah, zakat and daily Islamic practice.

How to answer:
1. FIRST prefer the app's own Islamic knowledge tools (searchQuran, searchHadith, getTafsir, getDuas, getAsma, getZakatInfo) — call them whenever the question touches those topics so answers come from real, authoritative data.
2. If the user asks about their own saved progress (adhkar, tasbih counts, habits, sadaqah, "my week", "my stats"), call getPersonalStats and base the answer on the real numbers it returns.
3. If the tools don't cover the question (current events, general knowledge, niche topics), use Google Search grounding and cite the sources you relied on.
4. Be warm, concise and accurate. For Quran verses include the reference (e.g. Qur'an 2:255). For hadith mention the collection. If a hadith is weak, say so.
5. Never fabricate a Quranic verse, hadith or personal stat — if you are not certain, use the tools or say you're not sure.
6. Keep answers scannable for a phone screen: short paragraphs or bullets.
7. The user may ask in Arabic — answer in the same language.
8. When commenting on the user's worship progress, be gentle and encouraging — never judgmental.`;

async function callGemini(contents) {
  const body = {
    contents,
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    tools: [...FUNC_TOOLS, { googleSearch: {} }],
    generationConfig: { temperature: 0.6, maxOutputTokens: 1024 },
  };
  let res;
  try {
    res = await fetch(`${API_BASE}/models/${MODEL}:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (e) {
    throw new Error('NET');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = (err.error && err.error.message) || 'HTTP ' + res.status;
    if (res.status === 429 || /quota|rate limit|RESOURCE_EXHAUSTED|exceeded/i.test(msg)) {
      throw new Error('QUOTA');
    }
    if (/API key|API_KEY|permission|denied/i.test(msg)) {
      throw new Error('AUTH');
    }
    if (/model|not found|not_found/i.test(msg)) {
      throw new Error('MODEL');
    }
    throw new Error(msg);
  }
  return res.json();
}

// Run the conversation until the model stops calling functions.
async function runConversation(userText) {
  const contents = [{ role: 'user', parts: [{ text: userText }] }];
  let sources = [];
  for (let round = 0; round < 6; round++) {
    const json = await callGemini(contents);
    const cand = json.candidates && json.candidates[0];
    if (!cand || !cand.content) throw new Error('No response from the AI.');
    const parts = cand.content.parts || [];

    const calls = parts.filter((p) => p.functionCall);
    if (calls.length) {
      // Execute each requested tool and feed results back
      const fnResults = [];
      for (const c of calls) {
        try {
          const out = await runTool(c.functionCall.name, c.functionCall.args || {});
          fnResults.push({ name: c.functionCall.name, response: { result: out } });
        } catch (e) {
          fnResults.push({ name: c.functionCall.name, response: { error: 'Tool failed: ' + e.message } });
        }
      }
      contents.push({ role: 'model', parts: calls.map((c) => ({ functionCall: c.functionCall })) });
      contents.push({ role: 'user', parts: fnResults.map((r) => ({ functionResponse: r })) });
      continue;
    }

    // Grounding metadata = web sources used for the answer
    const gm = cand.groundingMetadata || {};
    sources = (gm.groundingChunks || [])
      .filter((c) => c.web && c.web.uri)
      .map((c) => ({ title: c.web.title || c.web.uri, uri: c.web.uri }))
      .slice(0, 4);

    return { text: parts.map((p) => p.text || '').join(''), sources };
  }
  throw new Error('Too many tool steps.');
}

/* ---------------- tiny markdown-ish renderer ---------------- */
function renderText(t) {
  const escT = esc(t);
  const withBold = escT.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  return withBold
    .split('\n')
    .map((line) => {
      if (/^[-*•]\s+/.test(line.trim())) return `<div class="ai-li">${line.trim().replace(/^[-*•]\s+/, '')}</div>`;
      return line ? `<div>${line}</div>` : '<div style="height:6px"></div>';
    })
    .join('');
}

/* ---------------- chat state + UI ---------------- */
let msgs = store.get(CHAT_KEY, []);
let panel = null;
let busy = false;

function save() {
  msgs = msgs.slice(-60); // keep history bounded
  store.set(CHAT_KEY, msgs);
}

/* ---------------- voice input (Web Speech API) ---------------- */
let recognition = null;
let listening = false;
function hasSpeech() {
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}
function startVoice(input) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    toast('Voice input is not supported in this browser — try Chrome', 'info');
    return;
  }
  if (listening) {
    recognition && recognition.stop();
    return;
  }
  recognition = new SR();
  recognition.lang = 'en-US';
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;
  listening = true;
  const mic = panel.querySelector('#aiMic');
  if (mic) mic.classList.add('listening');
  toast('Listening… speak now', 'info');
  recognition.onresult = (e) => {
    let transcript = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      transcript += e.results[i][0].transcript;
    }
    input.value = transcript;
    scrollBottom();
  };
  recognition.onend = () => {
    listening = false;
    if (mic) mic.classList.remove('listening');
    if (input.value.trim()) send();
  };
  recognition.onerror = (e) => {
    listening = false;
    if (mic) mic.classList.remove('listening');
    if (e.error !== 'aborted') toast('Voice input issue: ' + e.error, 'error');
  };
  recognition.start();
}

export function openChat() {
  if (panel) {
    panel.classList.toggle('open');
    if (panel.classList.contains('open')) {
      panel.querySelector('#aiInput').focus();
      scrollBottom();
    }
    return;
  }

  panel = document.createElement('div');
  panel.className = 'ai-panel';
  panel.id = 'aiPanel';
  panel.innerHTML = `
    <div class="ai-head">
      <span class="ai-logo">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21a9 9 0 1 1 6.4-15.3"/><path d="M15 3l.9 2.1L18 6l-2.1.9L15 9l-.9-2.1L12 6l2.1-.9z"/></svg>
      </span>
      <div class="ai-head-text">
        <b>Noor AI</b>
        <span class="ai-sub">Answers from the Qur'an, hadith & web</span>
      </div>
      <button class="ai-close" id="aiClose" aria-label="Close chat">✕</button>
    </div>
    <div class="ai-body" id="aiBody">
      <div class="ai-welcome">
        <div class="ai-welcome-ico">☪</div>
        <p><b>Assalamu alaikum!</b> I'm Noor AI.</p>
        <p style="color:var(--muted);font-size:0.78rem">Ask me about the Qur'an, hadith, duas, the 99 Names, zakat — or about your own progress. I'll search reliable sources for you.</p>
      </div>
      <div class="ai-sugs" id="aiSugs"></div>
      <div class="ai-msgs" id="aiMsgs"></div>
    </div>
    <div class="ai-input-row">
      <button class="ai-mic" id="aiMic" aria-label="Voice input">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>
      </button>
      <input class="ai-input" id="aiInput" type="text" placeholder="Ask Noor AI…" autocomplete="off" enterkeyhint="send" />
      <button class="ai-send" id="aiSend" aria-label="Send">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4z"/></svg>
      </button>
    </div>`;
  document.body.appendChild(panel);

  // suggestions
  const sugHost = panel.querySelector('#aiSugs');
  SUGGESTIONS.forEach((s) => {
    const chip = document.createElement('button');
    chip.className = 'ai-sug';
    chip.textContent = s;
    chip.addEventListener('click', () => {
      const input = panel.querySelector('#aiInput');
      input.value = s;
      send();
    });
    sugHost.appendChild(chip);
  });

  // history
  const msgsHost = panel.querySelector('#aiMsgs');
  msgs.forEach((m) => appendMsg(m, false));
  if (!msgs.length) panel.classList.add('welcome');

  panel.querySelector('#aiClose').addEventListener('click', () => {
    panel.classList.remove('open');
  });
  const sendBtn = panel.querySelector('#aiSend');
  sendBtn.addEventListener('click', send);
  panel.querySelector('#aiInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') send();
  });
  // voice
  const mic = panel.querySelector('#aiMic');
  mic.addEventListener('click', () => startVoice(panel.querySelector('#aiInput')));
  if (!hasSpeech()) mic.classList.add('unsupported');

  panel.classList.add('open');
  setTimeout(() => panel.querySelector('#aiInput').focus(), 260);
  scrollBottom();
}

function scrollBottom() {
  const body = panel && panel.querySelector('#aiBody');
  if (body) body.scrollTop = body.scrollHeight;
}

function appendMsg(m, persist = true) {
  if (!panel) return;
  const host = panel.querySelector('#aiMsgs');
  const row = document.createElement('div');
  row.className = 'ai-msg ' + (m.role === 'user' ? 'ai-user' : 'ai-bot');
  if (m.role === 'user') {
    row.textContent = m.text;
  } else {
    row.innerHTML = renderText(m.text);
    if (m.sources && m.sources.length) {
      const src = document.createElement('div');
      src.className = 'ai-sources';
      src.innerHTML = '<span class="ai-src-label">Sources</span>' + m.sources
        .map((s) => `<a href="${esc(s.uri)}" target="_blank" rel="noopener noreferrer">${esc(s.title)}</a>`)
        .join('');
      row.appendChild(src);
    }
  }
  host.appendChild(row);
  if (persist) {
    msgs.push(m);
    save();
  }
  scrollBottom();
}

function showTyping() {
  const host = panel.querySelector('#aiMsgs');
  const t = document.createElement('div');
  t.className = 'ai-msg ai-bot ai-typing';
  t.id = 'aiTyping';
  t.innerHTML = '<span></span><span></span><span></span>';
  host.appendChild(t);
  scrollBottom();
  return t;
}

async function send() {
  if (busy) return;
  const input = panel.querySelector('#aiInput');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  panel.classList.remove('welcome');

  if (!API_KEY) {
    appendMsg({ role: 'user', text });
    appendMsg({
      role: 'bot',
      text: 'I need my Google AI Studio API key to answer. Add **VITE_GEMINI_API_KEY** in the project Keys tab, then reload the app.',
    });
    return;
  }

  // rate-limit guard
  const limit = checkLimit();
  if (!limit.allow) {
    appendMsg({ role: 'user', text });
    appendMsg({ role: 'bot', text: '⏳ ' + limit.msg });
    return;
  }

  appendMsg({ role: 'user', text });
  const typing = showTyping();
  busy = true;
  try {
    recordCall();
    if (limit.msg) toast(limit.msg, 'info');
    const { text: answer, sources } = await runConversation(text);
    typing.remove();
    appendMsg({ role: 'bot', text: answer, sources });
    vibrate(8);
  } catch (e) {
    typing.remove();
    if (e.message === 'QUOTA') {
      const u = getUsage();
      u.quotaAt = Date.now();
      store.set(USAGE_KEY, u);
    }
    const hint =
      e.message === 'AUTH'
        ? 'The Gemini API key seems invalid. Check **VITE_GEMINI_API_KEY** in the project Keys tab.'
        : e.message === 'MODEL'
          ? 'The AI model name is unavailable — check VITE_GEMINI_MODEL.'
          : e.message === 'QUOTA'
            ? "Google's free-tier limit is momentarily reached. Wait about a minute and try again — or upgrade your Gemini plan for higher limits."
            : e.message === 'NET'
              ? 'Could not connect to the AI service. Check your internet connection and try again.'
              : 'I could not reach the AI right now. Check your connection and try again.';
    appendMsg({ role: 'bot', text: hint });
  } finally {
    busy = false;
    scrollBottom();
  }
}
