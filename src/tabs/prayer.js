// ============================================================
//  TAB 3 — PRAYER & MOSQUE
//  - Automatic prayer times (Aladhan API: GPS or city search)
//  - Mathematical Qibla finder (haversine bearing + needle)
//  - Silent Mode automatic timer (5 prayer inputs + countdown)
//  - Traveler's Prayer / Musafir calculator (83 km)
//  - Mosque finder via Google Maps link
// ============================================================
import { store, vibrate, toast, esc, chimeSound } from '../lib.js';
import { fetchPrayerMonth } from '../ummah-api.js';

const KAABA = { lat: 21.4225, lng: 39.8262 };
const TIME_KEY = 'noor.salah.times';
const ALERT_KEY = 'noor.salah.lastAlert';
const AUTO_KEY = 'noor.salah.auto';
const METHOD_KEY = 'noor.salah.method';
const ALERTS_KEY = 'noor.salah.notif';

const ALADHAN_BASE = 'https://api.aladhan.com/v1';
const METHODS = [
  { id: 3, label: 'Muslim World League' },
  { id: 2, label: 'ISNA (North America)' },
  { id: 4, label: 'Umm Al-Qura (Makkah)' },
  { id: 5, label: 'Egyptian General Authority' },
  { id: 1, label: 'University of Karachi' },
  { id: 12, label: 'Diyanet (Turkey)' },
  { id: 8, label: 'Kuwait' },
  { id: 9, label: 'Qatar' },
  { id: 15, label: 'Dubai (UAE)' },
];
const DEFAULT_METHOD = 3;

const PRAYERS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
const PRAYER_NAMES = { fajr: 'Fajr', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha' };
const API_KEYS = { Fajr: 'fajr', Dhuhr: 'dhuhr', Asr: 'asr', Maghrib: 'maghrib', Isha: 'isha' };

const defaultTimes = { fajr: '05:12', dhuhr: '12:47', asr: '16:05', maghrib: '19:10', isha: '20:40' };

let times = { ...defaultTimes, ...store.get(TIME_KEY, {}) };
let auto = store.get(AUTO_KEY, null);   // { date, place, method, lat, lng } or { date, place, method, city, country }
let method = store.get(METHOD_KEY, DEFAULT_METHOD);
let clockTimer = null;
let watchId = null;
let refreshing = false;
let alertsOn = store.get(ALERTS_KEY, false);

export function mount(el) {
  el.innerHTML = `
    <div class="seg seg-scroll">
      <button class="seg-btn active" data-view="times">🕌 Times</button>
      <button class="seg-btn" data-view="qibla">🧭 Qibla</button>
      <button class="seg-btn" data-view="timetable">🗓️ Timetable</button>
      <button class="seg-btn" data-view="travel">🧳 Travel</button>
    </div>

    <div class="card" data-view="times">
      <div class="card-head">
        <span class="card-ico gold">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/><path d="M12 3v2"/><path d="M5 12H3M21 12h-2"/></svg>
        </span>
        <div><div class="card-title">Automatic Prayer Times</div><div class="card-sub">Aladhan API · calculated for your exact location</div></div>
      </div>
      <div class="auto-status" id="autoStatus"></div>
      <button class="btn btn-emerald btn-block" id="autoLocate" style="margin-top:10px">📍 Use my location</button>
      <details class="field" style="margin-top:10px">
        <summary style="cursor:pointer;font-size:0.86rem;font-weight:700;color:var(--emerald-text);margin-bottom:8px">Search by city · change method ⚙️</summary>
        <div class="auto-grid">
          <div class="field">
            <label class="field-label" for="autoCity">City</label>
            <input class="input" id="autoCity" type="text" placeholder="e.g. London" autocomplete="off" />
          </div>
          <div class="field">
            <label class="field-label" for="autoCountry">Country</label>
            <input class="input" id="autoCountry" type="text" placeholder="e.g. United Kingdom" autocomplete="off" />
          </div>
        </div>
        <div class="field">
          <label class="field-label" for="autoMethod">Calculation method</label>
          <select class="select" id="autoMethod"></select>
        </div>
        <button class="btn btn-gold btn-block btn-sm" id="autoCityBtn">Fetch times for this city</button>
      </details>
      <div class="silent-note" style="margin-top:10px">⏱️ Auto times feed the countdown &amp; silent-mode alerts below — you can still override them manually anytime.</div>
    </div>

    <div class="card" data-view="times">
      <div class="card-head">
        <span class="card-ico gold">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6"/><path d="M10.3 21a2 2 0 0 0 3.4 0"/></svg>
        </span>
        <div><div class="card-title">Prayer Alerts</div><div class="card-sub">Browser notifications at every prayer time</div></div>
      </div>
      <div class="notif-row">
        <div class="notif-info">
          <div class="notif-state" id="notifState">🔕 Alerts are OFF</div>
          <div class="notif-desc" id="notifDesc">Get a notification when each prayer time arrives — even while the app is open in the background.</div>
        </div>
        <button class="notif-switch" id="notifSwitch" role="switch" aria-checked="false" aria-label="Toggle prayer alerts"><span></span></button>
      </div>
    </div>

    <div class="card" data-view="qibla">
      <div class="card-head">
        <span class="card-ico">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-1.6 4.4-4.4 1.6 1.6-4.4z"/></svg>
        </span>
        <div><div class="card-title">Qibla Finder</div><div class="card-sub">Mathematical bearing to the Kaaba</div></div>
      </div>
      <div class="qibla-stage">
        <div class="heading-num" id="qiblaHeading">—°</div>
        <div class="heading-unit">degrees from true north</div>
        <div class="compass-wrap">
          <div class="compass-ring"></div>
          <div id="compassTicks"></div>
          <div class="needle-wrap" id="needleWrap" style="transform:rotate(0deg)">
            <div class="needle"><div class="n-body"></div><div class="s-body"></div><div class="hub"></div></div>
          </div>
        </div>
        <div class="qibla-coords" id="qiblaCoords">Location unknown</div>
        <button class="btn btn-emerald btn-block" id="qiblaBtn" style="margin-top:12px">
          📍 Use my location to find Qibla
        </button>
        <details class="field" style="margin-top:10px">
          <summary style="cursor:pointer;font-size:0.86rem;font-weight:700;color:var(--emerald-text)">⌨️ No GPS? Enter coordinates manually</summary>
          <div class="auto-grid">
            <div class="field">
              <label class="field-label" for="qiblaLat">Latitude</label>
              <input class="input" id="qiblaLat" type="number" inputmode="decimal" step="any" placeholder="e.g. 24.7136" />
            </div>
            <div class="field">
              <label class="field-label" for="qiblaLng">Longitude</label>
              <input class="input" id="qiblaLng" type="number" inputmode="decimal" step="any" placeholder="e.g. 46.6753" />
            </div>
          </div>
          <button class="btn btn-gold btn-block btn-sm" id="qiblaManualBtn">Set Qibla from coordinates</button>
        </details>
        <div class="qibla-note" id="qiblaNote">On a phone, hold the device flat — the needle follows your compass and points straight to the Kaaba.</div>
      </div>
    </div>

    <div class="card" data-view="times">
      <div class="card-head">
        <span class="card-ico gold">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
        </span>
        <div><div class="card-title">Silent Mode Timer</div><div class="card-sub">Auto or manual times — get alerted to go silent</div></div>
      </div>
      <div id="scheduleList"></div>
      <div class="countdown-big" id="countdownBig">--:--:--</div>
      <div class="countdown-label" id="countdownLabel">until the next congregational prayer</div>
      <details class="field">
        <summary style="cursor:pointer;font-size:0.86rem;font-weight:700;color:var(--emerald-text);margin-bottom:8px">Edit today's prayer times ✏️</summary>
        <div id="timeInputs"></div>
        <button class="btn btn-emerald btn-sm" id="saveTimes" style="margin-top:8px">Save times</button>
      </details>
      <div class="silent-note">🔕 When a prayer time arrives, Noor shows an alert reminding you to switch your phone to silent before the congregational prayer.</div>
    </div>

    <div class="card" data-view="travel">
      <div class="card-head">
        <span class="card-ico">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18M5 21V9l7-5 7 5v12M9 21v-6h6v6"/></svg>
        </span>
        <div><div class="card-title">Musafir Calculator</div><div class="card-sub">Traveler's prayer — Qasr & Jam' guide</div></div>
      </div>
      <div class="field">
        <label class="field-label" for="kmInput">Travel distance (km)</label>
        <input class="input" id="kmInput" type="number" inputmode="decimal" min="0" placeholder="e.g. 120" />
      </div>
      <button class="btn btn-gold btn-block" id="kmBtn">Calculate journey ruling</button>
      <div id="kmResult" style="margin-top:12px"></div>
    </div>

    <div class="card" data-view="travel">
      <div class="card-head">
        <span class="card-ico gold">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21a9 9 0 1 1 9-9"/><path d="M12 15a3 3 0 1 0-3-3"/><path d="M15 21l1.5 1.5L21 18"/></svg>
        </span>
        <div><div class="card-title">Mosque Finder</div><div class="card-sub">Nearest mosques on Google Maps</div></div>
      </div>
      <button class="btn btn-emerald btn-block" id="mosqueBtn">🕌 Find mosques near me</button>
      <details class="field" style="margin-top:10px">
        <summary style="cursor:pointer;font-size:0.86rem;font-weight:700;color:var(--emerald-text)">⌨️ No GPS? Enter coordinates manually</summary>
        <div class="auto-grid">
          <div class="field">
            <label class="field-label" for="mosqueLat">Latitude</label>
            <input class="input" id="mosqueLat" type="number" inputmode="decimal" step="any" placeholder="e.g. 24.7136" />
          </div>
          <div class="field">
            <label class="field-label" for="mosqueLng">Longitude</label>
            <input class="input" id="mosqueLng" type="number" inputmode="decimal" step="any" placeholder="e.g. 46.6753" />
          </div>
        </div>
        <button class="btn btn-gold btn-block btn-sm" id="mosqueManualBtn">Open mosques from coordinates</button>
      </details>
      <div class="qibla-coords" id="mosqueCoords" style="margin-top:10px"></div>
    </div>

    <div class="card" data-view="travel">
      <div class="card-head">
        <span class="card-ico">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3.2"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3M4.9 4.9l2.1 2.1m9.9 9.9 2.1 2.1m0-14.1-2.1 2.1m-9.9 9.9-2.1 2.1"/></svg>
        </span>
        <div><div class="card-title">Discover Nearby</div><div class="card-sub">Halal food · mosques · Islamic events</div></div>
      </div>
      <div class="discover-grid">
        <button class="discover-btn" data-q="halal restaurants">
          <span class="discover-emoji">🍽️</span>
          <span class="discover-label">Halal Food</span>
          <span class="discover-sub">Restaurants &amp; eateries</span>
        </button>
        <button class="discover-btn" data-q="mosques">
          <span class="discover-emoji">🕌</span>
          <span class="discover-label">Mosques</span>
          <span class="discover-sub">Places of prayer</span>
        </button>
        <button class="discover-btn" data-q="islamic events">
          <span class="discover-emoji">🎉</span>
          <span class="discover-label">Events</span>
          <span class="discover-sub">Classes &amp; gatherings</span>
        </button>
      </div>
      <div class="qibla-coords" id="discoverCoords" style="margin-top:10px"></div>
    </div>

    <div class="card" data-view="timetable">
      <div class="card-head">
        <span class="card-ico gold">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18"/><path d="M9.5 15.5l1.8 1.8 3.2-3.6"/></svg>
        </span>
        <div><div class="card-title">Monthly Prayer Timetable</div><div class="card-sub">Full month of prayer times for your location · Ummah API</div></div>
      </div>
      <div class="auto-grid">
        <div class="field">
          <label class="field-label" for="monthSel">Month</label>
          <select class="select" id="monthSel"></select>
        </div>
        <div class="field">
          <label class="field-label" for="yearSel">Year</label>
          <select class="select" id="yearSel"></select>
        </div>
      </div>
      <button class="btn btn-gold btn-block" id="monthGo">Generate monthly timetable</button>
      <div id="monthBody"><div class="empty">Uses the location saved by <b>📍 Use my location</b> or the Qibla finder. Tap the button above to build a printable month grid.</div></div>
    </div>
  `;

  // ---- auto prayer times ----
  const mSel = el.querySelector('#autoMethod');
  METHODS.forEach((m) => {
    const o = document.createElement('option');
    o.value = m.id;
    o.textContent = m.label;
    mSel.appendChild(o);
  });
  mSel.value = method;
  el.querySelector('#autoLocate').addEventListener('click', useLocation);
  el.querySelector('#autoCityBtn').addEventListener('click', useCity);
  mSel.addEventListener('change', () => {
    method = parseInt(mSel.value, 10);
    store.set(METHOD_KEY, method);
    if (auto) refetchAuto();
  });
  renderAutoStatus(el);
  refreshAutoIfStale(el);

  // ---- prayer alerts ----
  renderNotifUI(el);
  el.querySelector('#notifSwitch').addEventListener('click', () => toggleAlerts(el));

  // ---- qibla ----
  buildTicks(el);
  el.querySelector('#qiblaBtn').addEventListener('click', findQibla);
  el.querySelector('#qiblaManualBtn').addEventListener('click', () => {
    const lat = parseFloat(el.querySelector('#qiblaLat').value);
    const lng = parseFloat(el.querySelector('#qiblaLng').value);
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return toast('Enter valid coordinates (lat −90…90, lng −180…180)', 'error');
    }
    const bearing = qiblaBearing(lat, lng);
    store.set('noor.qibla', { lat, lng, bearing: Math.round(bearing) });
    renderQibla(lat, lng, bearing);
    toast(`Qibla is ${Math.round(bearing)}° from true north`, 'success');
    startCompass();
  });
  // Restore last known qibla so the needle is never blank
  const savedQ = store.get('noor.qibla', null);
  if (savedQ) renderQibla(savedQ.lat, savedQ.lng, savedQ.bearing);

  // ---- silent mode ----
  renderTimesInputs(el);
  renderSchedule();
  startClock();
  el.querySelector('#saveTimes').addEventListener('click', () => {
    PRAYERS.forEach((p) => {
      const v = el.querySelector(`#time-${p}`).value;
      if (v) times[p] = v;
    });
    store.set(TIME_KEY, times);
    // Manual override switches off auto mode
    auto = null;
    store.del(AUTO_KEY);
    renderAutoStatus(el);
    renderSchedule();
    toast('Prayer times saved (manual)', 'success');
  });

  // ---- musafir / mosque ----
  el.querySelector('#kmBtn').addEventListener('click', calcMusafir);
  el.querySelector('#mosqueBtn').addEventListener('click', findMosques);
  el.querySelector('#mosqueManualBtn').addEventListener('click', () => {
    const lat = parseFloat(el.querySelector('#mosqueLat').value);
    const lng = parseFloat(el.querySelector('#mosqueLng').value);
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return toast('Enter valid coordinates (lat −90…90, lng −180…180)', 'error');
    }
    const url = `https://www.google.com/maps/search/mosques+near+me/@${lat},${lng},14z`;
    document.getElementById('mosqueCoords').textContent = `📍 ${lat.toFixed(4)}, ${lng.toFixed(4)} · opening Google Maps…`;
    window.open(url, '_blank', 'noopener');
    toast('Opening mosques near you', 'success');
  });

  // ---- discover nearby ----
  el.querySelectorAll('.discover-btn').forEach((b) =>
    b.addEventListener('click', () => discoverNearby(el, b.dataset.q))
  );

  // ---- monthly timetable ----
  const monthSel = el.querySelector('#monthSel');
  const yearSel = el.querySelector('#yearSel');
  const nowD = new Date();
  monthSel.innerHTML = Array.from({ length: 12 }, (_, i) => {
    const m = i + 1;
    return `<option value="${m}">${new Date(nowD.getFullYear(), i, 1).toLocaleDateString('en-GB', { month: 'long' })}</option>`;
  }).join('');
  monthSel.value = nowD.getMonth() + 1;
  for (let y = nowD.getFullYear() - 1; y <= nowD.getFullYear() + 2; y++) {
    const o = document.createElement('option');
    o.value = y;
    o.textContent = y;
    yearSel.appendChild(o);
  }
  yearSel.value = nowD.getFullYear();
  el.querySelector('#monthGo').addEventListener('click', () => renderMonthTimes(el));

  // ---- segment tabs (Times / Qibla / Timetable / Travel) ----
  const showGroup = (view) => {
    el.querySelectorAll('.card[data-view]').forEach((c) => {
      c.hidden = c.dataset.view !== view;
    });
  };
  el.querySelectorAll('.seg-btn').forEach((b) =>
    b.addEventListener('click', () => {
      el.querySelectorAll('.seg-btn').forEach((x) => x.classList.toggle('active', x === b));
      showGroup(b.dataset.view);
    })
  );
  showGroup('times');

  stopWatch();
  startWatch();
}

/* ---------------- monthly timetable (Ummah API) ---------------- */
async function renderMonthTimes(el) {
  const body = el.querySelector('#monthBody');
  const month = parseInt(el.querySelector('#monthSel').value, 10);
  const year = parseInt(el.querySelector('#yearSel').value, 10);
  // Prefer the auto-mode location (GPS or city), then the Qibla fix
  let lat = null;
  let lng = null;
  if (auto && auto.lat != null) { lat = auto.lat; lng = auto.lng; }
  if (lat == null) {
    const q = store.get('noor.qibla', null);
    if (q) { lat = q.lat; lng = q.lng; }
  }
  if (lat == null) {
    toast('Set a location first — use 📍 Use my location above', 'error');
    return;
  }
  const btn = el.querySelector('#monthGo');
  if (btn) btn.disabled = true;
  body.innerHTML = `<div class="empty"><div class="spinner"></div>Calculating ${new Date(year, month - 1, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })} for ${lat.toFixed(3)}, ${lng.toFixed(3)}…</div>`;
  try {
    const d = await fetchPrayerMonth(lat, lng, month, year);
    const days = d.days || [];
    const todayStr = new Date().toISOString().slice(0, 10);
    const cols = [
      ['fajr', 'Fajr'],
      ['sunrise', 'Sunrise'],
      ['dhuhr', 'Dhuhr'],
      ['asr', 'Asr'],
      ['maghrib', 'Maghrib'],
      ['isha', 'Isha'],
    ];
    body.innerHTML = `
      <div class="month-meta">${esc(d.month_name || '')} ${year} · ${esc(d.calculation_method || '')} · ${esc(d.madhab || '')} · ${esc(d.timezone || '')}</div>
      <div class="month-grid">
        <div class="month-row month-head"><span class="mday">Day</span>${cols.map((c) => `<span>${c[1]}</span>`).join('')}</div>
        ${days.map((day) => {
          const pt = day.prayer_times || {};
          const isToday = day.date === todayStr;
          return `
            <div class="month-row${isToday ? ' today' : ''}">
              <span class="mday">${day.day}<small>${isToday ? '●' : day.day_name ? day.day_name.slice(0, 2) : ''}</small></span>
              ${cols.map(([k]) => `<span>${esc(pt[k] || '—')}</span>`).join('')}
            </div>`;
        }).join('')}
      </div>
      <div class="field-hint" style="margin-top:10px">Tap a day's row isn't needed — this is a quick-reference grid. Times follow ${esc(d.calculation_method || 'the selected method')} and may differ slightly from local masjid schedules.</div>
    `;
  } catch {
    body.innerHTML = `<div class="error-box">Could not fetch the monthly timetable — check your connection.</div>`;
  } finally {
    if (btn) btn.disabled = false;
  }
}

/* ============================================================
   Automatic prayer times — Aladhan API
   ============================================================ */
function todayDDMMYYYY() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getDate())}-${p(d.getMonth() + 1)}-${d.getFullYear()}`;
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function methodLabel() {
  const m = METHODS.find((x) => x.id === method);
  return m ? m.label : 'Custom';
}

async function fetchTimings(q) {
  const byCity = !!q.city;
  const params = new URLSearchParams();
  Object.entries(q).forEach(([k, v]) => v != null && v !== '' && params.set(k, v));
  const url = `${ALADHAN_BASE}/${byCity ? 'timingsByCity' : 'timings'}${byCity ? '' : '/' + todayDDMMYYYY()}?${params}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('network ' + res.status);
  const j = await res.json();
  if (j.code !== 200 || !j.data || !j.data.timings) throw new Error('bad payload');
  return j.data;
}

function saveAuto(config, data) {
  Object.entries(API_KEYS).forEach(([api, local]) => {
    if (data.timings[api]) times[local] = data.timings[api].slice(0, 5);
  });
  store.set(TIME_KEY, times);
  auto = { date: todayStr(), method, ...config };
  store.set(AUTO_KEY, auto);
  const el = rootEl();
  if (el) {
    renderTimesInputs(el);
    renderSchedule();
    renderAutoStatus(el);
  }
}

function rootEl() {
  return document.getElementById('panel-prayer');
}

function renderAutoStatus(el) {
  const host = el.querySelector('#autoStatus');
  if (!host) return;
  if (auto) {
    host.innerHTML = `
      <div class="auto-status-head">
        <span class="auto-chip">● Auto</span>
        <span class="auto-method">${esc(methodLabel())}</span>
      </div>
      <div class="auto-place">${esc(auto.place || '')}</div>
      <div class="auto-updated">Updated ${esc(auto.date)} · refreshes automatically each day</div>`;
  } else {
    host.innerHTML = `
      <div class="auto-status-head"><span class="auto-chip manual">✎ Manual</span></div>
      <div class="auto-place">Manually entered times are in use. Use your location or a city above for an accurate daily schedule.</div>`;
  }
}

async function refetchAuto() {
  if (!auto || refreshing) return;
  refreshing = true;
  try {
    const q = auto.lat != null
      ? { latitude: auto.lat, longitude: auto.lng, method }
      : { city: auto.city, country: auto.country || '', method };
    const data = await fetchTimings(q);
    saveAuto({ place: auto.place, ...(auto.lat != null ? { lat: auto.lat, lng: auto.lng } : { city: auto.city, country: auto.country }) }, data);
  } catch { /* offline — keep stored times */ }
  refreshing = false;
}

function refreshAutoIfStale(el) {
  if (!auto || auto.date === todayStr()) return;
  refetchAuto();
}

function useLocation() {
  if (!navigator.geolocation) return toast('Geolocation not supported', 'error');
  const btn = document.getElementById('autoLocate');
  if (!btn) return;
  btn.disabled = true;
  btn.textContent = '📍 Locating…';
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const { latitude, longitude } = pos.coords;
      // Reuse the fix for the Qibla compass when no fix exists yet
      if (!store.get('noor.qibla', null)) {
        store.set('noor.qibla', { lat: latitude, lng: longitude, bearing: Math.round(qiblaBearing(latitude, longitude)) });
      }
      try {
        const data = await fetchTimings({ latitude, longitude, method });
        saveAuto({ place: `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`, lat: latitude, lng: longitude }, data);
        toast('Auto prayer times fetched', 'success');
      } catch {
        toast('Could not fetch times — check your connection', 'error');
      } finally {
        btn.disabled = false;
        btn.textContent = '📍 Use my location';
      }
    },
    (err) => {
      btn.disabled = false;
      btn.textContent = '📍 Use my location';
      toast(err.code === 1 ? 'Location denied — search by city instead' : 'Could not get location', 'error');
    },
    { enableHighAccuracy: true, timeout: 12000 }
  );
}

async function useCity() {
  const city = document.getElementById('autoCity').value.trim();
  const country = document.getElementById('autoCountry').value.trim();
  if (!city) return toast('Enter a city name first', 'error');
  const btn = document.getElementById('autoCityBtn');
  if (!btn) return;
  btn.disabled = true;
  try {
    const data = await fetchTimings({ city, country, method });
    saveAuto({ place: `${city}${country ? ', ' + country : ''}`, city, country }, data);
    toast(`Times fetched for ${city}`, 'success');
  } catch {
    toast('City not found or offline — check the name & connection', 'error');
  } finally {
    btn.disabled = false;
  }
}

/* ---------------- qibla ---------------- */
function buildTicks(el) {
  const wrap = el.querySelector('#compassTicks');
  let ticks = '';
  let cardinals = '';
  for (let i = 0; i < 24; i++) {
    const deg = i * 15;
    const major = i % 6 === 0;
    ticks += `<span class="compass-tick${major ? ' major' : ''}" style="transform:rotate(${deg}deg)"></span>`;
    if (major) {
      const label = ['N', 'E', 'S', 'W'][i / 6];
      cardinals += `<b class="${label.toLowerCase()}">${label}</b>`;
    }
  }
  wrap.innerHTML = ticks + `<span class="compass-card">${cardinals}</span>`;
}

function qiblaBearing(lat, lng) {
  const toRad = (d) => (d * Math.PI) / 180;
  const toDeg = (r) => (r * 180) / Math.PI;
  const φ1 = toRad(lat);
  const φ2 = toRad(KAABA.lat);
  const Δλ = toRad(KAABA.lng - lng);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

function findQibla() {
  if (!navigator.geolocation) return toast('Geolocation not supported', 'error');
  toast('Getting your location…', 'info');
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      const bearing = qiblaBearing(latitude, longitude);
      store.set('noor.qibla', { lat: latitude, lng: longitude, bearing: Math.round(bearing) });
      renderQibla(latitude, longitude, bearing);
      toast(`Qibla is ${Math.round(bearing)}° from true north`, 'success');
      startCompass();
    },
    (err) => {
      toast(err.code === 1 ? 'Location permission denied — enter coordinates manually below' : 'Could not get GPS — enter coordinates manually below', 'error');
      const lat = document.getElementById('qiblaLat');
      if (lat) lat.scrollIntoView({ behavior: 'smooth', block: 'center' });
    },
    { enableHighAccuracy: true, timeout: 12000 }
  );
}

function renderQibla(lat, lng, bearing) {
  document.getElementById('qiblaHeading').textContent = Math.round(bearing) + '°';
  document.getElementById('qiblaCoords').textContent = `📍 ${lat.toFixed(4)}, ${lng.toFixed(4)} · Kaaba 21.4225, 39.8262`;
  const needle = document.getElementById('needleWrap');
  needle.style.transition = 'transform 0.9s cubic-bezier(0.3,0.8,0.3,1)';
  needle.style.transform = `rotate(${bearing}deg)`;
}

function startCompass() {
  stopWatch();
  if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
    DeviceOrientationEvent.requestPermission()
      .then((state) => {
        if (state === 'granted') watchOrientation();
      })
      .catch(() => toast('Compass unavailable — showing north-relative bearing', 'info'));
  } else {
    watchOrientation();
  }
}

function watchOrientation() {
  window.addEventListener('deviceorientationabsolute', onOrient, { passive: true });
  window.addEventListener('deviceorientation', onOrient, { passive: true });
}

function onOrient(e) {
  const heading = e.webkitCompassHeading != null ? e.webkitCompassHeading : e.alpha;
  if (heading == null) return;
  const q = store.get('noor.qibla', null);
  if (!q) return;
  const needle = document.getElementById('needleWrap');
  if (needle) {
    needle.style.transition = 'transform 0.25s linear';
    needle.style.transform = `rotate(${(q.bearing - heading + 360) % 360}deg)`;
  }
}

function stopWatch() {
  window.removeEventListener('deviceorientationabsolute', onOrient);
  window.removeEventListener('deviceorientation', onOrient);
  if (watchId != null) { navigator.geolocation.clearWatch(watchId); watchId = null; }
}
function startWatch() {
  if (navigator.geolocation) {
    try {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const q = store.get('noor.qibla', null);
          if (q) {
            const b = qiblaBearing(pos.coords.latitude, pos.coords.longitude);
            store.set('noor.qibla', { lat: pos.coords.latitude, lng: pos.coords.longitude, bearing: Math.round(b) });
            renderQibla(pos.coords.latitude, pos.coords.longitude, b);
          }
        },
        () => { /* silent */ },
        { enableHighAccuracy: false, maximumAge: 60000 }
      );
    } catch { /* noop */ }
  }
}

/* ---------------- silent mode timer ---------------- */
function renderTimesInputs(el) {
  const host = el.querySelector('#timeInputs');
  host.innerHTML = PRAYERS.map(
    (p) => `
      <div class="field">
        <label class="field-label" for="time-${p}">${PRAYER_NAMES[p]}</label>
        <input class="input" type="time" id="time-${p}" value="${esc(times[p])}" />
      </div>`
  ).join('');
}

function renderSchedule() {
  const now = new Date();
  const next = nextPrayer();
  const host = document.getElementById('scheduleList');
  if (!host) return;
  host.innerHTML = PRAYERS.map((p) => {
    const isNext = next && next.name === p;
    const t = times[p];
    const [h, m] = t.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    let rel = 'passed';
    if (d > now) rel = `in ${fmtShort(d - now)}`;
    else if (isNext) rel = 'next';
    return `
      <div class="schedule-row ${isNext ? 'next' : ''}">
        <div><div class="sch-name">${PRAYER_NAMES[p]}</div><div class="sch-next">${rel}</div></div>
        <div class="sch-time">${t}</div>
      </div>`;
  }).join('');
}

function nextPrayer() {
  const now = new Date();
  let best = null;
  let bestName = null;
  PRAYERS.forEach((p) => {
    const [h, m] = times[p].split(':').map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    if (d <= now) d.setDate(d.getDate() + 1);
    if (!best || d < best) { best = d; bestName = p; }
  });
  return { name: bestName, at: best };
}

function fmtShort(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h ? `${h}h ${m}m` : `${m}m`;
}

function startClock() {
  clearInterval(clockTimer);
  const tick = () => {
    const now = new Date();
    const next = nextPrayer();
    const diff = next.at - now;
    const s = Math.max(0, Math.floor(diff / 1000));
    const hh = String(Math.floor(s / 3600)).padStart(2, '0');
    const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    const big = document.getElementById('countdownBig');
    const label = document.getElementById('countdownLabel');
    if (big) big.textContent = `${hh}:${mm}:${ss}`;
    if (label) label.textContent = `until ${PRAYER_NAMES[next.name]} · ${times[next.name]}`;
    renderSchedule();
    // Prayer time arrived → silent-mode alert (once per prayer per day)
    if (diff <= 0 && diff > -1000) {
      const key = `${new Date().toISOString().slice(0, 10)}:${next.name}`;
      if (store.get(ALERT_KEY, '') !== key) {
        store.set(ALERT_KEY, key);
        showSilentAlert(PRAYER_NAMES[next.name], times[next.name]);
        showBrowserAlert(PRAYER_NAMES[next.name], times[next.name]);
      }
    }
    // New day → refresh auto times once
    if (auto && auto.date !== todayStr() && !refreshing) refetchAuto();
  };
  tick();
  clockTimer = setInterval(tick, 1000);
}

function showSilentAlert(name, time) {
  vibrate([200, 100, 200]);
  chimeSound();
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay show';
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-ico">🕌</div>
      <div class="modal-title">Time for ${name} prayer (${time})</div>
      <div class="modal-text">Set your device to <b>silent</b> now — it's time for the congregational prayer.<br/><br/>🔕 <b>Silence the ringer &amp; notifications</b></div>
      <button class="btn btn-emerald btn-block" id="silentOk">Done — going silent</button>
    </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) dismiss(); });
  overlay.querySelector('#silentOk').addEventListener('click', dismiss);
  function dismiss() { overlay.remove(); }
}

/* ---------------- prayer browser notifications ---------------- */
function renderNotifUI(el) {
  const sw = el.querySelector('#notifSwitch');
  if (!sw) return;
  sw.classList.toggle('on', alertsOn);
  sw.setAttribute('aria-checked', String(alertsOn));
  const state = el.querySelector('#notifState');
  const desc = el.querySelector('#notifDesc');
  if (state) state.textContent = alertsOn ? '🔔 Alerts are ON' : '🔕 Alerts are OFF';
  if (desc) {
    desc.textContent = alertsOn
      ? 'You will get a notification at every prayer time. Keep browser notifications allowed for this site.'
      : 'Get a notification when each prayer time arrives — even while the app is open in the background.';
  }
}

function toggleAlerts(el) {
  if (alertsOn) {
    alertsOn = false;
    store.set(ALERTS_KEY, false);
    renderNotifUI(el);
    toast('Prayer alerts turned off', 'info');
    return;
  }
  if (!('Notification' in window)) {
    toast('This browser does not support notifications', 'error');
    return;
  }
  if (Notification.permission === 'denied') {
    toast('Notifications are blocked by the browser — allow them in the site settings first', 'error');
    return;
  }
  if (Notification.permission === 'granted') {
    alertsOn = true;
    store.set(ALERTS_KEY, true);
    renderNotifUI(el);
    toast('Prayer alerts turned on — jazaakAllahu khayran', 'success');
    return;
  }
  Notification.requestPermission().then((perm) => {
    if (perm === 'granted') {
      alertsOn = true;
      store.set(ALERTS_KEY, true);
      renderNotifUI(el);
      toast('Prayer alerts turned on — jazaakAllahu khayran', 'success');
    } else {
      toast('Permission not granted — you can enable alerts later', 'error');
    }
  });
}

function showBrowserAlert(name, time) {
  if (!alertsOn || !('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    const n = new Notification(`🕌 ${name} prayer · ${time}`, {
      body: `It's time for ${name}. Remember to silence your phone before the congregational prayer.`,
      icon: 'icons/icon-192.png',
      tag: 'noor-prayer-' + name,
      renotify: true,
    });
    n.onclick = () => { window.focus(); n.close(); };
    setTimeout(() => n.close(), 60000);
  } catch {
    /* notifications unavailable */
  }
}

/* ---------------- discover nearby ---------------- */
function openNearbyMap(query, lat, lng) {
  const url = lat != null
    ? `https://www.google.com/maps/search/${encodeURIComponent(query)}+near+me/@${lat},${lng},14z`
    : `https://www.google.com/search?q=${encodeURIComponent(query)}+near+me`;
  window.open(url, '_blank', 'noopener');
}

function discoverNearby(el, q) {
  const saved = store.get('noor.qibla', null);
  const coordsHost = document.getElementById('discoverCoords');
  const open = (lat, lng) => {
    if (coordsHost && lat != null) coordsHost.textContent = `📍 ${lat.toFixed(4)}, ${lng.toFixed(4)} · opening ${q} near you…`;
    openNearbyMap(q, lat, lng);
    toast(`Opening ${q} near you`, 'success');
  };
  if (saved) { open(saved.lat, saved.lng); return; }
  if (!navigator.geolocation) { open(null, null); return; }
  toast('Finding your GPS position…', 'info');
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      store.set('noor.qibla', { lat: latitude, lng: longitude, bearing: Math.round(qiblaBearing(latitude, longitude)) });
      open(latitude, longitude);
    },
    () => {
      if (coordsHost) coordsHost.textContent = '';
      open(null, null);
      toast('Could not get GPS — opening a web search instead', 'info');
    },
    { enableHighAccuracy: true, timeout: 12000 }
  );
}

/* ---------------- musafir calculator ---------------- */
function calcMusafir() {
  const km = parseFloat(document.getElementById('kmInput').value);
  const box = document.getElementById('kmResult');
  if (isNaN(km) || km < 0) {
    box.innerHTML = `<div class="empty">Enter a valid distance in kilometres.</div>`;
    return;
  }
  if (km >= 83) {
    box.innerHTML = `
      <div class="remedy">
        <div class="remedy-sec">
          <div class="remedy-label">✓ Valid journey (safar) — ${km} km ≥ 83 km</div>
          <div class="remedy-action">Your journey meets the travel distance recognised by most scholars (≈83 km / 48 miles). The following allowances apply from the moment you leave your locality until you return.</div>
        </div>
        <ol class="steps">
          <li><b>Qasr — shorten the prayers.</b> Reduce <span class="ar-step">الظهر</span> Dhuhr, <span class="ar-step">العصر</span> Asr and <span class="ar-step">العشاء</span> Isha from 4 rak'ahs to <b>2 rak'ahs</b>. <b>Fajr and Maghrib are never shortened.</b></li>
          <li><b>Jam' — combine prayers.</b> You may combine Dhuhr + Asr, and Maghrib + Isha — either at the earlier time (Jam' Taqdeem) or the later time (Jam' Ta'kheer), with the intention of combining.</li>
          <li><b>Make the intention.</b> At the opening takbir of the first shortened prayer, intend "Qasr" in your heart — it is the majority view that this intention is required.</li>
          <li><b>Duration.</b> The allowance continues while travelling and while staying less than ~4 days (scholarly view) at your destination. If you plan to stay longer, pray in full.</li>
          <li><b>Evidence.</b> Ibn 'Umar said: "I accompanied the Prophet ﷺ and he never prayed more than two rak'ahs during travel." (Bukhari &amp; Muslim)</li>
        </ol>
      </div>`;
  } else {
    box.innerHTML = `
      <div class="remedy">
        <div class="remedy-sec">
          <div class="remedy-label">Below the travel threshold — ${km} km &lt; 83 km</div>
          <div class="remedy-action">This distance does not qualify as a journey (safar) for shortening prayers. <b>Pray in full — 4 rak'ahs for Dhuhr, Asr and Isha.</b> When your journey reaches 83 km or more, the Qasr and Jam' allowances apply. May Allah make your travels easy. 🤲</div>
        </div>
      </div>`;
  }
  box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/* ---------------- mosque finder ---------------- */
function findMosques() {
  if (!navigator.geolocation) return toast('Geolocation not supported', 'error');
  toast('Finding your GPS position…', 'info');
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      const url = `https://www.google.com/maps/search/mosques+near+me/@${latitude},${longitude},14z`;
      document.getElementById('mosqueCoords').textContent = `📍 ${latitude.toFixed(4)}, ${longitude.toFixed(4)} · opening Google Maps…`;
      window.open(url, '_blank', 'noopener');
      toast('Opening mosques near you', 'success');
    },
    () => {
      document.getElementById('mosqueCoords').textContent = '';
      toast('Location unavailable — use the manual coordinates below or enable GPS', 'error');
      const lat = document.getElementById('mosqueLat');
      if (lat) lat.scrollIntoView({ behavior: 'smooth', block: 'center' });
    },
    { enableHighAccuracy: true, timeout: 12000 }
  );
}
