// ============================================================
//  TAB 4 — ISLAMIC FINANCE & LIFESTYLE
//  - Dynamic Zakat calculator (2.5% over nisab, live prices)
//  - Sadaqah & donations tracker (monthly goal + history)
//  - Inheritance share estimator (standard Fara'id)
//  - Islamic baby names registry (46 names, live filter)
//  - Halal E-number checker (50 additives)
//  Each feature is its own segment tab — no page reloads.
// ============================================================
import { store, toast, esc, money, vibrate, successSound, fracAdd, fracSub, fracMul, fracVal, fmtFrac } from '../lib.js';
import { BABY_NAMES, E_NUMBERS } from '../data.js';
import { fetchZakatPrices } from '../ummah-api.js';

const ZAK_KEY = 'noor.zakat';
const INH_KEY = 'noor.inherit';
const NAME_KEY = 'noor.names.search';
const ENUM_KEY = 'noor.enum.search';
const SADAQAH_KEY = 'noor.sadaqah';

const zakatDefaults = { cash: '', gold: '', crypto: '', inventory: '', debts: '', nisab: 5000 };

const SADAQAH_CAUSES = [
  'General Sadaqah',
  'Zakat al-Fitr',
  'Mosque / Masjid',
  'Orphans & Widows',
  'Water Well',
  'Food Relief',
  'Education',
  'Medical / Health',
  'Quran Distribution',
  'Other',
];
const SADAQAH_QUICK = [1, 5, 10, 25, 50, 100];
const sadaqahDefaults = () => ({ goal: 100, entries: [] });
let sadaqah = store.get(SADAQAH_KEY, sadaqahDefaults());
if (!Array.isArray(sadaqah.entries)) sadaqah.entries = [];

// explicit id map — fixes the old `#zakInventory` crash (input id is `zakInv`)
const ZAK_FIELDS = [
  ['cash', 'zakCash'],
  ['gold', 'zakGold'],
  ['crypto', 'zakCrypto'],
  ['inventory', 'zakInv'],
  ['debts', 'zakDebts'],
  ['nisab', 'zakNisab'],
];

export function mount(el) {
  el.innerHTML = `
    <div class="seg seg-scroll">
      <button class="seg-btn active" data-view="zakat">💰 Zakat</button>
      <button class="seg-btn" data-view="sadaqah">🤲 Sadaqah</button>
      <button class="seg-btn" data-view="inherit">🧬 Inheritance</button>
      <button class="seg-btn" data-view="names">👶 Names</button>
      <button class="seg-btn" data-view="enum">🔍 E-Numbers</button>
    </div>
    <div id="finView"></div>
  `;
  el.querySelectorAll('.seg-btn').forEach((b) =>
    b.addEventListener('click', () => switchView(el, b.dataset.view))
  );
  renderZakat(el);
}

function switchView(el, view) {
  el.querySelectorAll('.seg-btn').forEach((b) => b.classList.toggle('active', b.dataset.view === view));
  if (view === 'zakat') renderZakat(el);
  else if (view === 'sadaqah') renderSadaqahView(el);
  else if (view === 'inherit') renderInheritance(el);
  else if (view === 'names') renderNamesView(el);
  else renderEnumsView(el);
}

/* ---------------- zakat ---------------- */
function renderZakat(el) {
  const host = el.querySelector('#finView');
  host.innerHTML = `
    <div class="card">
      <div class="card-head">
        <span class="card-ico">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v10M15 9.5c-.6-1-1.8-1.5-3-1.5-1.4 0-2.5.7-2.5 1.8 0 2.6 5.5 1.3 5.5 3.8 0 1.1-1.2 1.9-3 1.9-1.3 0-2.4-.5-3-1.5"/></svg>
        </span>
        <div><div class="card-title">Zakat on Wealth</div><div class="card-sub">2.5% due when assets exceed nisab</div></div>
      </div>
      <div class="field">
        <label class="field-label">Total cash (bank + hand) — $</label>
        <input class="input" type="number" inputmode="decimal" min="0" id="zakCash" placeholder="0.00" />
      </div>
      <div class="field">
        <label class="field-label">Gold & silver owned — $</label>
        <input class="input" type="number" inputmode="decimal" min="0" id="zakGold" placeholder="0.00" />
      </div>
      <div class="field">
        <label class="field-label">Cryptocurrency & stocks — $</label>
        <input class="input" type="number" inputmode="decimal" min="0" id="zakCrypto" placeholder="0.00" />
      </div>
      <div class="field">
        <label class="field-label">Active business inventory value — $</label>
        <input class="input" type="number" inputmode="decimal" min="0" id="zakInv" placeholder="0.00" />
      </div>
      <div class="field">
        <label class="field-label">Personal short-term debts (subtract) — $</label>
        <input class="input" type="number" inputmode="decimal" min="0" id="zakDebts" placeholder="0.00" />
      </div>
      <div class="field">
        <label class="field-label">Nisab threshold (≈ value of 85g gold) — $</label>
        <input class="input" type="number" inputmode="decimal" min="0" id="zakNisab" />
        <span class="field-hint" id="zakNisabHint">Pre-filled baseline — update to today's gold rate in your currency.</span>
        <button class="btn btn-ghost btn-sm" id="zakLiveNisab" style="margin-top:7px">🪙 Fetch today's nisab (gold · silver)</button>
      </div>
      <button class="btn btn-gold btn-block" id="zakBtn">Calculate my Zakat</button>
      <div id="zakResult"></div>
    </div>`;

  // restore saved inputs using the explicit id map
  const z = { ...zakatDefaults, ...store.get(ZAK_KEY, {}) };
  ZAK_FIELDS.forEach(([key, id]) => { host.querySelector('#' + id).value = z[key]; });

  host.querySelector('#zakBtn').addEventListener('click', calcZakat);
  host.querySelector('#zakLiveNisab').addEventListener('click', async () => {
    const btn = host.querySelector('#zakLiveNisab');
    btn.disabled = true;
    btn.textContent = 'Fetching live prices…';
    try {
      const p = await fetchZakatPrices();
      const goldNisab = p.nisab_gold_value;
      const silverNisab = p.nisab_silver_value;
      const nisabInput = host.querySelector('#zakNisab');
      nisabInput.value = Math.round(goldNisab);
      const v = {};
      ZAK_FIELDS.forEach(([key, id]) => { v[key] = host.querySelector('#' + id).value; });
      store.set(ZAK_KEY, v);
      const hint = host.querySelector('#zakNisabHint');
      if (hint) {
        hint.textContent = `Gold nisab (85g) ${money(goldNisab)} · Silver nisab (595g) ${money(silverNisab)} · spot ${p.currency || 'USD'} (${p.as_of ? p.as_of.slice(0, 10) : 'today'})`;
      }
      successSound();
      toast(`Nisab set to ${money(goldNisab)} (gold 85g)`, 'success');
    } catch {
      toast('Could not fetch live prices — check your connection', 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = "🪙 Fetch today's nisab (gold · silver)";
    }
  });
  ZAK_FIELDS.forEach(([key, id]) => {
    host.querySelector('#' + id).addEventListener('input', () => {
      const v = {};
      ZAK_FIELDS.forEach(([k, id2]) => { v[k] = host.querySelector('#' + id2).value; });
      store.set(ZAK_KEY, v);
    });
  });
}

/* ---------------- zakat calculation ---------------- */
function calcZakat() {
  const host = document.getElementById('finView');
  const g = (id) => parseFloat((host.querySelector('#' + id) || {}).value) || 0;
  const cash = g('zakCash');
  const gold = g('zakGold');
  const crypto = g('zakCrypto');
  const inventory = g('zakInv');
  const debts = g('zakDebts');
  const nisab = g('zakNisab') || zakatDefaults.nisab;
  const box = host.querySelector('#zakResult');

  const totalAssets = cash + gold + crypto + inventory;
  const netWealth = Math.max(0, totalAssets - debts);

  if (totalAssets <= 0) {
    box.innerHTML = `<div class="empty">Enter your assets first to calculate zakat.</div>`;
    return;
  }

  if (netWealth < nisab) {
    box.innerHTML = `
      <div class="zakat-none">
        <b>No zakat due</b> on ${money(netWealth)} — your net wealth is below the nisab threshold of ${money(nisab)}.<br/>
        <span style="font-size:0.78rem;color:var(--muted)">Keep growing it — zakat becomes obligatory once it exceeds nisab.</span>
      </div>`;
    vibrate(8);
    box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    return;
  }

  const zakat = netWealth * 0.025;
  box.innerHTML = `
    <div class="zakat-badge">
      <div class="zb-label">Zakat due (2.5%)</div>
      <div class="zb-amount">${money(zakat)}</div>
      <div class="zb-sub">on net wealth ${money(netWealth)} · nisab ${money(nisab)}</div>
    </div>
    <div class="field-hint" style="margin-top:8px;text-align:center">Give it before the year completes on your wealth — and remember, it purifies what remains. 🤲</div>`;
  vibrate([20, 30]);
  successSound();
  box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/* ---------------- sadaqah / donations ---------------- */
function renderSadaqahView(el) {
  const host = el.querySelector('#finView');
  host.innerHTML = `
    <div class="card">
      <div class="card-head">
        <span class="card-ico">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 5H9l-7 7 9 9 9-9z"/><circle cx="16.5" cy="7.5" r="1.5"/><path d="M4 11h6"/></svg>
        </span>
        <div><div class="card-title">Sadaqah & Donations Tracker</div><div class="card-sub">Every good deed multiplies · charity tracker</div></div>
      </div>
      <div class="sadaqah-top">
        <div class="field" style="flex:1">
          <label class="field-label" for="sadGoal">Monthly goal — $</label>
          <input class="input" type="number" inputmode="decimal" min="0" id="sadGoal" placeholder="100" />
        </div>
        <button class="btn btn-emerald btn-sm" id="sadGoalBtn" style="margin-top:22px">Set</button>
      </div>
      <div class="progress" style="margin-bottom:6px"><div class="progress-bar" id="sadProg"></div></div>
      <div class="sadaqah-stats" id="sadStats"></div>
      <div class="sadaqah-quick" id="sadQuick"></div>
      <div class="sadaqah-add">
        <div class="field" style="flex:1">
          <label class="field-label" for="sadAmount">Amount — $</label>
          <input class="input" type="number" inputmode="decimal" min="0" id="sadAmount" placeholder="10.00" />
        </div>
        <div class="field" style="flex:1">
          <label class="field-label" for="sadCause">Cause</label>
          <select class="select" id="sadCause"></select>
        </div>
        <button class="btn btn-gold btn-sm" id="sadAdd" style="margin-top:22px">+ Give</button>
      </div>
      <div class="sadaqah-history" id="sadHistory"></div>
      <div class="sadaqah-note">📿 “The example of those who spend in the way of Allah is like a seed that grows seven ears — each ear a hundred grains.” <b>Quran 2:261</b></div>
    </div>`;
  host.querySelector('#sadGoal').value = sadaqah.goal || 100;
  renderSadaqah(el);
  host.querySelector('#sadGoalBtn').addEventListener('click', () => {
    const g = parseFloat(host.querySelector('#sadGoal').value) || 0;
    sadaqah.goal = g;
    saveSadaqah(el);
    toast(g ? `Monthly goal set to ${money(g)}` : 'Goal cleared — tracking total only', 'success');
  });
  host.querySelector('#sadAdd').addEventListener('click', () => addSadaqah(el));
  host.querySelector('#sadAmount').addEventListener('keydown', (e) => { if (e.key === 'Enter') addSadaqah(el); });
  host.querySelectorAll('#sadQuick button').forEach((b) => {
    b.addEventListener('click', () => {
      host.querySelector('#sadAmount').value = b.dataset.v;
      vibrate(6);
    });
  });
}

function saveSadaqah(el) {
  store.set(SADAQAH_KEY, sadaqah);
  renderSadaqah(el);
}

function renderSadaqah(el) {
  const host = el.querySelector('#finView');
  // populate cause select
  const sel = host.querySelector('#sadCause');
  if (sel && !sel.children.length) {
    SADAQAH_CAUSES.forEach((c) => {
      const o = document.createElement('option');
      o.value = c;
      o.textContent = c;
      sel.appendChild(o);
    });
  }
  // quick chips
  const qh = host.querySelector('#sadQuick');
  if (qh && !qh.children.length) {
    qh.innerHTML = SADAQAH_QUICK.map((v) => `<button class="chip chip-gold" data-v="${v}" style="cursor:pointer;border:none;font-size:0.8rem;padding:7px 13px">$${v}</button>`).join('');
    qh.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
      host.querySelector('#sadAmount').value = b.dataset.v;
      vibrate(6);
    }));
  }
  // stats + progress
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const entries = sadaqah.entries || [];
  const monthTotal = entries.filter((e) => e.mk === monthKey).reduce((s, e) => s + e.amount, 0);
  const allTotal = entries.reduce((s, e) => s + e.amount, 0);
  const goal = sadaqah.goal || 0;
  const pct = goal ? Math.min(100, Math.round((monthTotal / goal) * 100)) : 0;
  const prog = host.querySelector('#sadProg');
  if (prog) prog.style.width = pct + '%';
  const stats = host.querySelector('#sadStats');
  if (stats) {
    stats.innerHTML = `
      <div class="sadaqah-stat"><b>${money(monthTotal)}</b><span>this month${goal ? ` of ${money(goal)}` : ''}</span></div>
      <div class="sadaqah-stat"><b>${money(allTotal)}</b><span>all time</span></div>
      <div class="sadaqah-stat"><b>${entries.length}</b><span>donations</span></div>`;
  }
  // history
  const hist = host.querySelector('#sadHistory');
  if (hist) {
    const recent = entries.slice().sort((a, b) => b.ts - a.ts).slice(0, 15);
    hist.innerHTML = recent.length
      ? `<div class="sadaqah-h-title">Recent giving</div>` + recent.map((e) => `
          <div class="sadaqah-row">
            <span class="sadaqah-amt">${money(e.amount)}</span>
            <span class="sadaqah-cause">${esc(e.cause)}</span>
            <span class="sadaqah-date">${esc(e.date)}</span>
            <button class="sadaqah-del" data-id="${e.id}" aria-label="Remove">✕</button>
          </div>`).join('')
      : `<div class="empty">No donations logged yet. Give even a date or a smile — it all counts. 🤲</div>`;
    hist.querySelectorAll('.sadaqah-del').forEach((b) => {
      b.addEventListener('click', () => {
        sadaqah.entries = sadaqah.entries.filter((e) => e.id !== b.dataset.id);
        saveSadaqah(el);
        toast('Entry removed', 'info');
      });
    });
  }
}

function addSadaqah(el) {
  const host = el.querySelector('#finView');
  const amount = parseFloat(host.querySelector('#sadAmount').value);
  if (isNaN(amount) || amount <= 0) return toast('Enter a valid amount first', 'error');
  const cause = host.querySelector('#sadCause').value || 'General Sadaqah';
  const now = new Date();
  const d = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(now);
  sadaqah.entries = sadaqah.entries || [];
  sadaqah.entries.push({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    amount,
    cause,
    date: d,
    mk: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
    ts: Date.now(),
  });
  host.querySelector('#sadAmount').value = '';
  vibrate([20, 30]);
  successSound();
  saveSadaqah(el);
  const goal = sadaqah.goal || 0;
  const monthTotal = sadaqah.entries.filter((e) => e.mk === `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`).reduce((s, e) => s + e.amount, 0);
  if (goal && monthTotal >= goal) toast(`Masha'Allah! You reached your ${money(goal)} monthly goal 🎉`, 'success');
  else toast(`JazakAllahu khayran — ${money(amount)} logged`, 'success');
}

/* ---------------- inheritance ---------------- */
function renderInheritance(el) {
  const host = el.querySelector('#finView');
  const inh = store.get(INH_KEY, {});
  host.innerHTML = `
    <div class="card">
      <div class="card-head">
        <span class="card-ico gold">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4h18v14H3z"/><path d="M3 9h18M7 14h4"/></svg>
        </span>
        <div><div class="card-title">Inheritance Estimator</div><div class="card-sub">Standard Fara'id shares for core relatives</div></div>
      </div>
      <div class="field">
        <label class="field-label">Estate value (after debts & will) — $</label>
        <input class="input" type="number" inputmode="decimal" min="0" id="inhEstate" placeholder="0.00" value="${esc(inh.estate ?? '')}" />
      </div>
      <div class="field">
        <label class="field-label">Surviving spouse</label>
        <select class="select" id="inhSpouse">
          <option value="none" ${inh.spouse === 'none' || !inh.spouse ? 'selected' : ''}>None</option>
          <option value="wife" ${inh.spouse === 'wife' ? 'selected' : ''}>Wife</option>
          <option value="husband" ${inh.spouse === 'husband' ? 'selected' : ''}>Husband</option>
        </select>
      </div>
      <div class="spouse-grid">
        <div class="field">
          <label class="field-label">Sons</label>
          <input class="input" type="number" inputmode="numeric" min="0" max="20" id="inhSons" value="${esc(inh.sons ?? 0)}" />
        </div>
        <div class="field">
          <label class="field-label">Daughters</label>
          <input class="input" type="number" inputmode="numeric" min="0" max="20" id="inhDaughters" value="${esc(inh.daughters ?? 0)}" />
        </div>
      </div>
      <div class="spouse-grid" id="inhParent">
        <label class="cbx-row ${inh.mother ? 'done' : ''}" id="inhMother"><span class="cbx-box"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 12.5l5 5 10-11"/></svg></span><span class="cbx-body"><span class="cbx-title">Mother is alive</span></span></label>
        <label class="cbx-row ${inh.father ? 'done' : ''}" id="inhFather"><span class="cbx-box"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 12.5l5 5 10-11"/></svg></span><span class="cbx-body"><span class="cbx-title">Father is alive</span></span></label>
      </div>
      <button class="btn btn-emerald btn-block" id="inhBtn" style="margin-top:6px">Calculate shares</button>
      <div id="inhResult"></div>
    </div>`;

  const inhSave = () => {
    const state = {
      estate: host.querySelector('#inhEstate').value,
      spouse: host.querySelector('#inhSpouse').value,
      sons: host.querySelector('#inhSons').value,
      daughters: host.querySelector('#inhDaughters').value,
      mother: !!host.querySelector('#inhMother').classList.contains('done'),
      father: !!host.querySelector('#inhFather').classList.contains('done'),
    };
    store.set(INH_KEY, state);
  };
  ['inhMother', 'inhFather'].forEach((rowId) => {
    const row = host.querySelector('#' + rowId);
    row.addEventListener('click', () => {
      row.classList.toggle('done');
      vibrate(8);
      inhSave();
    });
  });
  host.querySelector('#inhBtn').addEventListener('click', calcInheritance);
  ['#inhEstate', '#inhSpouse', '#inhSons', '#inhDaughters'].forEach((sel) =>
    host.querySelector(sel).addEventListener('input', inhSave)
  );
}

function calcInheritance() {
  const estate = parseFloat(document.getElementById('inhEstate').value) || 0;
  const spouse = document.getElementById('inhSpouse').value;
  const sons = parseInt(document.getElementById('inhSons').value, 10) || 0;
  const daughters = parseInt(document.getElementById('inhDaughters').value, 10) || 0;
  const box = document.getElementById('inhResult');

  const motherAlive = !!document.getElementById('inhMother')?.classList.contains('done');
  const fatherAlive = !!document.getElementById('inhFather')?.classList.contains('done');

  if (estate <= 0) {
    box.innerHTML = `<div class="empty">Enter the estate value first.</div>`;
    return;
  }
  const kids = sons + daughters > 0;
  const shares = []; // { name, frac }
  if (spouse === 'wife') shares.push({ name: 'Wife', frac: kids ? [1, 8] : [1, 4] });
  if (spouse === 'husband') shares.push({ name: 'Husband', frac: kids ? [1, 4] : [1, 2] });
  if (motherAlive) shares.push({ name: 'Mother', frac: kids ? [1, 6] : [1, 3] });
  if (fatherAlive && kids) shares.push({ name: 'Father', frac: [1, 6] });

  let used = [0, 1];
  shares.forEach((s) => { used = fracAdd(used, s.frac); });
  const remaining = fracSub([1, 1], used);

  if (kids) {
    const boyUnits = sons * 2;
    const girlUnits = daughters;
    const units = boyUnits + girlUnits;
    if (units > 0) {
      shares.push({ name: 'Sons', frac: fracMul(remaining, [boyUnits, units]) });
      shares.push({ name: 'Daughters', frac: fracMul(remaining, [girlUnits, units]) });
    } else if (fracVal(remaining) > 0) {
      shares.push({ name: 'Other legal heirs (closest relatives)', frac: remaining });
    }
  } else if (fatherAlive) {
    shares.push({ name: 'Father', frac: remaining });
  } else if (fracVal(remaining) > 0) {
    shares.push({ name: 'Other legal heirs (closest relatives)', frac: remaining });
  }

  box.innerHTML = `
    <table class="inher-table">
      <thead><tr><th>Heir</th><th>Share</th><th>%</th><th>Amount</th></tr></thead>
      <tbody>
        ${shares.map((s) => {
          const pct = fracVal(s.frac) * 100;
          return `<tr><td>${esc(s.name)}</td><td>${fmtFrac(s.frac)}</td><td class="pct">${pct.toFixed(2)}%</td><td class="amt">${money(estate * fracVal(s.frac))}</td></tr>`;
        }).join('')}
        <tr class="inher-total"><td>Total estate</td><td>1</td><td class="pct">100%</td><td class="amt">${money(estate)}</td></tr>
      </tbody>
    </table>
    <div class="inher-note">Estimates standard Fara'id cases (debts and bequests assumed already settled). Complex estates — siblings, grandparents, multiple wives, wills — should be referred to a qualified scholar.</div>`;
  box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/* ---------------- baby names ---------------- */
function renderNamesView(el) {
  const host = el.querySelector('#finView');
  host.innerHTML = `
    <div class="card">
      <div class="card-head">
        <span class="card-ico">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="9"/></svg>
        </span>
        <div><div class="card-title">Islamic Baby Names</div><div class="card-sub">${BABY_NAMES.length} authentic names with meanings</div></div>
      </div>
      <div class="searchbar">
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
        <input class="input" id="nameSearch" type="search" placeholder="Search a name or meaning…" autocomplete="off" />
      </div>
      <div id="nameList" style="max-height:62dvh;overflow-y:auto;padding-right:2px"></div>
    </div>`;
  host.querySelector('#nameSearch').value = store.get(NAME_KEY, '');
  renderNames(el);
  host.querySelector('#nameSearch').addEventListener('input', (e) => {
    store.set(NAME_KEY, e.target.value);
    renderNames(el);
  });
}

function renderNames(el) {
  const host = el.querySelector('#finView');
  const q = (host.querySelector('#nameSearch').value || '').trim().toLowerCase();
  const listHost = host.querySelector('#nameList');
  const list = BABY_NAMES.filter(
    (n) =>
      !q ||
      n.n.toLowerCase().includes(q) ||
      n.ar.includes(q) ||
      n.m.toLowerCase().includes(q)
  );
  listHost.innerHTML = list.length
    ? list.map((n) => `
        <div class="name-row">
          <div class="name-ar">${n.ar}</div>
          <div class="name-body">
            <div class="name-title">${esc(n.n)} <span class="chip ${n.g === 'boy' ? 'chip-boy' : 'chip-girl'}">${n.g === 'boy' ? 'Boy' : 'Girl'}</span></div>
            <div class="name-meaning">${esc(n.m)}</div>
          </div>
        </div>`).join('')
    : `<div class="empty">No names match “${esc(q)}”.</div>`;
}

/* ---------------- E-numbers ---------------- */
const STATUS_LABEL = { halal: ['HALAL', 'badge-halal'], haram: ['HARAM', 'badge-haram'], mushbooh: ['MUSHBOOH / DOUBTFUL', 'badge-mushbooh'] };

function renderEnumsView(el) {
  const host = el.querySelector('#finView');
  host.innerHTML = `
    <div class="card">
      <div class="card-head">
        <span class="card-ico gold">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6"/><path d="M13 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6"/><path d="M12 3v18"/></svg>
        </span>
        <div><div class="card-title">Halal E-Number Checker</div><div class="card-sub">${E_NUMBERS.length} additives indexed · type e.g. "E471"</div></div>
      </div>
      <div class="searchbar">
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
        <input class="input" id="enumSearch" type="search" placeholder="Search E-number or name…" autocomplete="off" />
      </div>
      <div class="enum-list" id="enumList"></div>
    </div>`;
  host.querySelector('#enumSearch').value = store.get(ENUM_KEY, '');
  renderEnums(el);
  host.querySelector('#enumSearch').addEventListener('input', (e) => {
    store.set(ENUM_KEY, e.target.value);
    renderEnums(el);
  });
}

function renderEnums(el) {
  const host = el.querySelector('#finView');
  const q = (host.querySelector('#enumSearch').value || '').trim().toLowerCase().replace(/^e/, '');
  const listHost = host.querySelector('#enumList');
  const list = E_NUMBERS.filter(
    (e) =>
      !q ||
      e.c.toLowerCase().replace(/^e/, '').includes(q) ||
      e.n.toLowerCase().includes(q)
  );
  listHost.innerHTML = list.length
    ? list.map((e) => {
        const [label, cls] = STATUS_LABEL[e.s];
        return `
        <div class="enum-row">
          <div class="enum-code">${e.c}</div>
          <div class="enum-body">
            <div class="enum-name">${esc(e.n)} <span class="badge ${cls}">${label}</span></div>
            <div class="enum-desc">${esc(e.d)}</div>
          </div>
        </div>`;
      }).join('')
    : `<div class="empty">No additives match — try “E471”, “471” or “gelatin”.</div>`;
}
