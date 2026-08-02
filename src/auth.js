// ============================================================
//  auth.js — Cloud account + sync (Firebase Auth + Firestore)
//  Email/password & Google sign-in. Every `noor.*` user key
//  (adhkar, habits, tasbih, zakat, sadaqah, settings, …) is
//  backed up to the user's own Firestore document and restored
//  on any device. Firebase is lazy-loaded only when needed so
//  the app stays ultra-lightweight for entry-level phones.
// ============================================================
import { store, toast, esc } from './lib.js';

const SESSION_KEY = 'noor.session';
const SYNC_KEY = 'noor.sync.meta';

// Regenerable caches & location data that should never be synced
const EXCLUDE = new Set([
  'noor.surahs',          // 7-day surah directory cache
  'noor.salah.times',     // daily prayer times cache
  'noor.salah.lastAlert', // transient alert flag
  'noor.qibla',           // derived from geolocation
  'noor.events.cache',    // calendar cache
]);

let firebaseLoaded = false;
let app = null;
let auth = null;
let db = null;
let currentUser = null;
let restoring = false; // suppress auto-sync while applying a restore
let syncTimer = null;
let dirty = false;
let authReady = false; // onAuthStateChanged listener attached
let bootRestore = true; // suppress toast/close during silent boot restore

/* ---------------- config (Vite exposes VITE_* to the client) ---------------- */
function env(name) {
  const e = import.meta.env || {};
  return e['VITE_' + name] || e[name] || '';
}
function cfg() {
  const projectId = env('FIREBASE_PROJECT_ID');
  return {
    apiKey: env('FIREBASE_API_KEY'),
    authDomain: env('FIREBASE_AUTH_DOMAIN'),
    projectId,
    storageBucket: env('FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: env('FIREBASE_MESSAGING_SENDER_ID'),
    appId: env('FIREBASE_APP_ID'),
  };
}
export const hasFirebaseConfig = () =>
  !!(cfg().apiKey && cfg().authDomain && cfg().projectId);

async function loadFirebase() {
  if (firebaseLoaded) return;
  const c = cfg();
  const [{ initializeApp }, { getAuth }, { getFirestore }] = await Promise.all([
    import('firebase/app'),
    import('firebase/auth'),
    import('firebase/firestore'),
  ]);
  app = initializeApp(c);
  auth = getAuth(app, { authDomain: c.authDomain || c.projectId + '.firebaseapp.com' });
  db = getFirestore(app);
  firebaseLoaded = true;
}

/* ---------------- data snapshot helpers ---------------- */
function collectData() {
  const out = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k || !k.startsWith('noor.') || EXCLUDE.has(k)) continue;
    try {
      out[k] = JSON.parse(localStorage.getItem(k));
    } catch {
      /* skip corrupt entry */
    }
  }
  return out;
}
function applyData(data) {
  Object.entries(data || {}).forEach(([k, v]) => {
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch {
      /* quota or corrupt */
    }
  });
}
const dataCount = (d) => Object.keys(d || {}).length;

/* ---------------- cloud push / pull ---------------- */
async function pushBackup() {
  const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
  await setDoc(
    doc(db, 'users', currentUser.uid),
    { data: collectData(), updatedAt: serverTimestamp() },
    { merge: true }
  );
  store.set(SYNC_KEY, { lastSyncAt: Date.now(), uid: currentUser.uid });
}

async function pullBackup() {
  const { doc, getDoc } = await import('firebase/firestore');
  const snap = await getDoc(doc(db, 'users', currentUser.uid));
  return snap.exists() ? snap.data() : null;
}

export async function wipeCloud() {
  if (!firebaseLoaded || !currentUser || !db) return;
  try {
    const { doc, deleteDoc } = await import('firebase/firestore');
    await deleteDoc(doc(db, 'users', currentUser.uid));
    store.del(SYNC_KEY);
  } catch (e) {
    console.warn('cloud wipe failed', e);
  }
}

/* ---------------- auto-sync on every write ---------------- */
function onAnyWrite() {
  if (restoring || !currentUser) return;
  dirty = true;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(flushSync, 2500);
}
async function flushSync() {
  if (!dirty || !currentUser) return;
  dirty = false;
  try {
    await pushBackup();
  } catch (e) {
    console.warn('auto-sync failed', e);
    dirty = true; // retry on next write
  }
}

/* ---------------- first sync after sign-in ---------------- */
async function firstSync() {
  try {
    const cloud = await pullBackup();
    const local = collectData();
    const localCount = dataCount(local);
    const cloudCount = cloud ? dataCount(cloud.data) : 0;
    const meta = store.get(SYNC_KEY, {});
    const cloudMs = cloud && cloud.updatedAt && cloud.updatedAt.toMillis
      ? cloud.updatedAt.toMillis()
      : 0;
    const cloudNewer = cloudMs > (meta.lastSyncAt || 0) + 5000;

    if (cloudCount && !localCount) {
      // Fresh device with existing cloud backup → restore silently
      restoring = true;
      applyData(cloud.data);
      restoring = false;
      toast('Cloud backup restored ✨', 'success');
      setTimeout(() => location.reload(), 900);
    } else if (cloudCount && cloudNewer && localCount) {
      askRestore(cloud.data); // newer backup exists → let the user choose
    } else {
      await pushBackup();
      if (!cloudCount) toast('First cloud backup saved ☁️', 'success');
    }
  } catch (e) {
    console.warn('first sync failed', e);
  }
}

function askRestore(data) {
  const ok = window.confirm(
    'A newer cloud backup was found on this account.\n\n' +
      'Tap OK to restore it to this device (current device data is replaced).\n' +
      'Tap Cancel to keep this device\u2019s data and back it up instead.'
  );
  if (ok) {
    restoring = true;
    applyData(data);
    restoring = false;
    toast('Cloud backup restored ✨', 'success');
    setTimeout(() => location.reload(), 900);
  } else {
    pushBackup().then(() => toast('This device\u2019s data was backed up ☁️', 'success'));
  }
}

/* ---------------- auth actions ---------------- */
async function signInEmail(email, pass) {
  const { signInWithEmailAndPassword } = await import('firebase/auth');
  await signInWithEmailAndPassword(auth, email, pass);
}
async function createEmail(email, pass) {
  const { createUserWithEmailAndPassword } = await import('firebase/auth');
  await createUserWithEmailAndPassword(auth, email, pass);
}
async function signInGoogle() {
  const { signInWithPopup, GoogleAuthProvider } = await import('firebase/auth');
  await signInWithPopup(auth, new GoogleAuthProvider());
}
async function signOutUser() {
  const { signOut } = await import('firebase/auth');
  await signOut(auth);
}

const ERR_MSG = {
  'auth/email-already-in-use': 'An account with that email already exists — try signing in.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/weak-password': 'Password should be at least 6 characters.',
  'auth/user-not-found': 'No account found with that email — create one first.',
  'auth/wrong-password': 'Incorrect password. Please try again.',
  'auth/invalid-credential': 'Incorrect email or password.',
  'auth/too-many-requests': 'Too many attempts — please wait a minute and try again.',
  'auth/popup-closed-by-user': 'Google sign-in was cancelled.',
  'auth/network-request-failed': 'Network error — check your connection and retry.',
  'auth/unauthorized-domain': 'This domain is not allowed yet — add it in Firebase → Authentication → Settings → Authorized domains, then reload.',
  'auth/operation-not-allowed': 'Email/Google sign-in is disabled — enable it in Firebase → Authentication → Sign-in methods.',
  'auth/account-exists-with-different-credential': 'An account already exists with this email using another sign-in method — sign in with that method instead.',
};
function friendlyErr(e) {
  return ERR_MSG[e && e.code] || (e && e.message ? e.message : 'Something went wrong. Please try again.');
}

/* ---------------- account button in the header ---------------- */
let btnWired = false;
function wireButton() {
  if (btnWired) return;
  btnWired = true;
  const btn = document.getElementById('acctBtn');
  if (!btn) return;
  btn.addEventListener('click', openAccount);
}
function updateButton() {
  const btn = document.getElementById('acctBtn');
  if (!btn) return;
  if (currentUser) {
    btn.classList.add('signed');
    const i = document.getElementById('acctInitial');
    if (i) i.textContent = (currentUser.email || 'u').slice(0, 1).toUpperCase();
    const d = document.getElementById('acctDot');
    if (d) {
      d.classList.add('on');
      d.title = 'Cloud sync is on';
    }
  } else {
    btn.classList.remove('signed');
    const i = document.getElementById('acctInitial');
    if (i) i.textContent = '☪';
    const d = document.getElementById('acctDot');
    if (d) {
      d.classList.remove('on');
      d.title = 'Sign in for cloud backup';
    }
  }
}

/* ---------------- account modal ---------------- */
function ensureModal() {
  if (document.getElementById('acctOverlay')) return;
  const ov = document.createElement('div');
  ov.className = 'acct-overlay';
  ov.id = 'acctOverlay';
  ov.innerHTML = `
    <div class="acct-sheet" role="dialog" aria-modal="true">
      <button class="acct-close" id="acctClose" aria-label="Close">✕</button>
      <div class="acct-head">
        <span class="acct-logo" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21a9 9 0 1 1 6.4-15.3"/><path d="M15 3l.9 2.1L18 6l-2.1.9L15 9l-.9-2.1L12 6l2.1-.9z"/></svg>
        </span>
        <h3 class="acct-title" id="acctTitle">Cloud Account</h3>
        <p class="acct-sub">Your adhkar, tasbih, habits and settings — backed up and restored on any device.</p>
      </div>
      <div id="acctBody"></div>
    </div>`;
  document.body.appendChild(ov);
  ov.addEventListener('click', (e) => {
    if (e.target === ov) closeModal();
  });
  ov.querySelector('#acctClose').addEventListener('click', closeModal);
}
function closeModal() {
  const ov = document.getElementById('acctOverlay');
  if (ov) ov.remove();
}

let mode = 'in'; // 'in' | 'up'
function renderAccount() {
  ensureModal();
  const body = document.getElementById('acctBody');
  if (!body) return;

  if (!hasFirebaseConfig()) {
    body.innerHTML = `
      <div class="acct-box acct-warn">
        Cloud sync is not configured yet.<br/><br/>
        Paste your Firebase web-app keys into the project's <b>Keys</b> tab and reload:<br/>
        <code>VITE_FIREBASE_API_KEY</code><br/>
        <code>VITE_FIREBASE_AUTH_DOMAIN</code><br/>
        <code>VITE_FIREBASE_PROJECT_ID</code>
      </div>`;
    return;
  }

  if (!currentUser) {
    body.innerHTML = `
      <div class="acct-field">
        <label class="field-label" for="acctEmail">Email</label>
        <input class="input" type="email" id="acctEmail" autocomplete="email" placeholder="you@example.com" />
      </div>
      <div class="acct-field">
        <label class="field-label" for="acctPass">Password</label>
        <input class="input" type="password" id="acctPass" autocomplete="${mode === 'up' ? 'new-password' : 'current-password'}" placeholder="••••••••" />
      </div>
      <div class="acct-err" id="acctErr" hidden></div>
      <button class="btn btn-gold btn-block" id="acctSubmit">${mode === 'up' ? 'Create account' : 'Sign in'}</button>
      <button class="btn btn-ghost btn-block" id="acctGoogle" style="margin-top:8px">
        <svg viewBox="0 0 24 24" width="16" height="16" style="vertical-align:-3px;margin-right:6px" aria-hidden="true"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A11 11 0 0 0 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
        Continue with Google
      </button>
      <button class="acct-link" id="acctToggle">${mode === 'up' ? 'Already have an account? Sign in' : 'New here? Create a free account'}</button>
      <p class="acct-note">🔒 Your password is handled by Firebase — Noor never sees it. Cloud sync is encrypted in transit and your document is private to your account.</p>`;

    const errEl = body.querySelector('#acctErr');
    const showErr = (m) => {
      errEl.hidden = false;
      errEl.textContent = m;
    };
    const emailEl = body.querySelector('#acctEmail');
    const passEl = body.querySelector('#acctPass');
    const busy = (b) => {
      body.querySelector('#acctSubmit').disabled = b;
      body.querySelector('#acctGoogle').disabled = b;
      body.querySelector('#acctSubmit').textContent =
        b ? (mode === 'up' ? 'Creating account…' : 'Signing in…') : (mode === 'up' ? 'Create account' : 'Sign in');
    };
    const doEmail = async () => {
      const email = emailEl.value.trim();
      const pass = passEl.value;
      if (!email || !pass) return showErr('Please enter your email and password.');
      errEl.hidden = true;
      busy(true);
      try {
        bootRestore = false; // explicit user action
        await ensureAuthListener();
        if (mode === 'up') await createEmail(email, pass);
        else await signInEmail(email, pass);
      } catch (e) {
        busy(false);
        showErr(friendlyErr(e));
      }
    };
    body.querySelector('#acctSubmit').addEventListener('click', doEmail);
    passEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') doEmail();
    });
    body.querySelector('#acctGoogle').addEventListener('click', async () => {
      errEl.hidden = true;
      busy(true);
      try {
        bootRestore = false; // explicit user action
        await ensureAuthListener();
        await signInGoogle();
      } catch (e) {
        busy(false);
        showErr(friendlyErr(e));
      }
    });
    body.querySelector('#acctToggle').addEventListener('click', () => {
      mode = mode === 'up' ? 'in' : 'up';
      renderAccount();
    });
    return;
  }

  // signed in
  const meta = store.get(SYNC_KEY, {});
  const last =
    meta.lastSyncAt && meta.uid === currentUser.uid
      ? 'Last backup: ' + new Date(meta.lastSyncAt).toLocaleString()
      : 'Ready for first backup';
  body.innerHTML = `
    <div class="acct-user">
      <span class="acct-avatar">${esc((currentUser.email || 'u').slice(0, 1).toUpperCase())}</span>
      <div class="acct-user-info">
        <b>${esc(currentUser.email || 'Signed in')}</b>
        <span class="acct-muted">${esc(last)}</span>
      </div>
    </div>
    <button class="btn btn-emerald btn-block" id="acctBackup">☁️ Back up now</button>
    <button class="btn btn-ghost btn-block" id="acctRestore" style="margin-top:8px">⬇️ Restore backup to this device</button>
    <button class="btn btn-danger btn-block btn-sm" id="acctSignOut" style="margin-top:10px">Sign out</button>
    <p class="acct-note">Every change you make is auto-synced to your cloud backup within a few seconds.</p>`;
  body.querySelector('#acctBackup').addEventListener('click', async () => {
    try {
      await pushBackup();
      toast('Backed up to cloud ☁️', 'success');
    } catch {
      toast('Backup failed — check your connection', 'error');
    }
  });
  body.querySelector('#acctRestore').addEventListener('click', async () => {
    try {
      const cloud = await pullBackup();
      if (!cloud || !dataCount(cloud.data)) return toast('No cloud backup found yet', 'info');
      if (!window.confirm('Replace this device\u2019s data with the cloud backup?')) return;
      restoring = true;
      applyData(cloud.data);
      restoring = false;
      toast('Cloud backup restored ✨', 'success');
      setTimeout(() => location.reload(), 900);
    } catch {
      toast('Restore failed — check your connection', 'error');
    }
  });
  body.querySelector('#acctSignOut').addEventListener('click', async () => {
    try {
      await signOutUser();
      closeModal();
      toast('Signed out. Your device data stays here.', 'info');
    } catch {
      toast('Could not sign out', 'error');
    }
  });
}

export function openAccount() {
  mode = 'in';
  renderAccount();
}

/* ---------------- shared auth-state handling ---------------- */
async function handleAuthState(user) {
  currentUser = user;
  if (user) {
    store.set(SESSION_KEY, { email: user.email || '', uid: user.uid, at: Date.now() });
    if (!bootRestore) {
      closeModal();
      toast('Signed in ☁️', 'success');
    }
    bootRestore = false;
    await firstSync();
  } else {
    currentUser = null;
    store.del(SESSION_KEY);
  }
  updateButton();
}

/** Load Firebase once and attach the auth listener (idempotent). */
async function ensureAuthListener() {
  if (authReady) return;
  await loadFirebase();
  const { onAuthStateChanged } = await import('firebase/auth');
  onAuthStateChanged(auth, (user) => handleAuthState(user));
  authReady = true;
}

/* ---------------- init (called once from main.js) ---------------- */
export async function initAuth() {
  store.afterSet = onAnyWrite;
  wireButton();
  updateButton();
  if (!hasFirebaseConfig()) return;
  const hasSession = !!store.get(SESSION_KEY, null);
  if (!hasSession) return;
  try {
    await ensureAuthListener(); // silent boot restore of a saved session
  } catch (e) {
    console.warn('firebase init failed', e);
  }
}
