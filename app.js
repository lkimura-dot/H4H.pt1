<<<<<<< HEAD
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js';
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
} from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js';

=======
>>>>>>> origin/main
const TICK_MS = 1000;
const INACTIVITY_LIMIT_MS = 60 * 1000;
const POINTS_PER_FOCUS_SECOND = 0.5;

const state = {
  totalSeconds: 0,
  focusSeconds: 0,
  distractionCount: 0,
  points: 0,
  owned: [],
  equipped: { hat: '', outfit: '', accessory: '' },
  inactiveSince: null,
  inactivityModalOpen: false,
<<<<<<< HEAD
  user: null,
=======
  username: null,
>>>>>>> origin/main
};

const authPanel = document.getElementById('auth-panel');
const dashboard = document.getElementById('dashboard');
const authForm = document.getElementById('auth-form');
const registerBtn = document.getElementById('register-btn');
const authMessage = document.getElementById('auth-message');
const currentUserEl = document.getElementById('current-user');
const logoutBtn = document.getElementById('logout-btn');

<<<<<<< HEAD
=======
};

const storeKey = 'focusforge-state-v1';
>>>>>>> origin/main
const screenTimeEl = document.getElementById('screen-time');
const focusTimeEl = document.getElementById('focus-time');
const distractionCountEl = document.getElementById('distraction-count');
const pointsEl = document.getElementById('points');
const shopItemsEl = document.getElementById('shop-items');
const inactivityModal = document.getElementById('inactivity-modal');
const refocusBtn = document.getElementById('refocus-btn');
const avatarEls = {
  hat: document.getElementById('avatar-hat'),
  outfit: document.getElementById('avatar-outfit'),
  accessory: document.getElementById('avatar-accessory'),
};

const shopCatalog = [
  { id: 'hat-crown', slot: 'hat', icon: '👑', name: 'Focus Crown', cost: 40 },
  { id: 'hat-beanie', slot: 'hat', icon: '🧢', name: 'Chill Beanie', cost: 25 },
  { id: 'outfit-hoodie', slot: 'outfit', icon: '🧥', name: 'Study Hoodie', cost: 35 },
  { id: 'outfit-robe', slot: 'outfit', icon: '🥋', name: 'Power Robe', cost: 50 },
  { id: 'acc-star', slot: 'accessory', icon: '⭐', name: 'Star Pin', cost: 20 },
  { id: 'acc-headphones', slot: 'accessory', icon: '🎧', name: 'Headphones', cost: 30 },
];

<<<<<<< HEAD
if (!window.FIREBASE_CONFIG || window.FIREBASE_CONFIG.apiKey?.startsWith('REPLACE_')) {
  authMessage.textContent = 'Please set firebase-config.js with your Firebase project settings.';
}

const app = initializeApp(window.FIREBASE_CONFIG);
const auth = getAuth(app);
const db = getFirestore(app);

function defaultProgress() {
  return {
    totalSeconds: 0,
    focusSeconds: 0,
    distractionCount: 0,
    points: 0,
    owned: [],
    equipped: { hat: '', outfit: '', accessory: '' },
  };
}

=======
>>>>>>> origin/main
function formatSeconds(seconds) {
  const s = String(seconds % 60).padStart(2, '0');
  const m = String(Math.floor(seconds / 60) % 60).padStart(2, '0');
  const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

function applyProgress(progress) {
<<<<<<< HEAD
  const safe = { ...defaultProgress(), ...progress };
  state.totalSeconds = safe.totalSeconds;
  state.focusSeconds = safe.focusSeconds;
  state.distractionCount = safe.distractionCount;
  state.points = safe.points;
  state.owned = Array.isArray(safe.owned) ? safe.owned : [];
  state.equipped = safe.equipped ?? defaultProgress().equipped;
=======
  state.totalSeconds = progress.totalSeconds ?? 0;
  state.focusSeconds = progress.focusSeconds ?? 0;
  state.distractionCount = progress.distractionCount ?? 0;
  state.points = progress.points ?? 0;
  state.owned = Array.isArray(progress.owned) ? progress.owned : [];
  state.equipped = progress.equipped ?? { hat: '', outfit: '', accessory: '' };
>>>>>>> origin/main
}

function serializeProgress() {
  return {
    totalSeconds: state.totalSeconds,
    focusSeconds: state.focusSeconds,
    distractionCount: state.distractionCount,
    points: state.points,
    owned: state.owned,
    equipped: state.equipped,
  };
}

<<<<<<< HEAD
async function loadProgress(uid) {
  const docRef = doc(db, 'progress', uid);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return defaultProgress();
  return { ...defaultProgress(), ...snap.data() };
}

async function saveProgress() {
  if (!state.user) return;
  const docRef = doc(db, 'progress', state.user.uid);
  await setDoc(docRef, serializeProgress(), { merge: true });
}

function queueSaveProgress() {
  if (!state.user) return;
  saveProgress().catch(() => {
    authMessage.textContent = 'Unable to save progress right now. Check Firebase rules/network.';
  });
=======
async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

async function saveProgress() {
  if (!state.username) return;
  try {
    await api('/api/progress', {
      method: 'POST',
      body: JSON.stringify({ progress: serializeProgress() }),
    });
  } catch {
    // silent background sync failure
  }
}

function saveProgressBeacon() {
  if (!state.username || !navigator.sendBeacon) return;
  const blob = new Blob([JSON.stringify({ progress: serializeProgress() })], {
    type: 'application/json',
  });
  navigator.sendBeacon('/api/progress/beacon', blob);
}

function saveState() {
  localStorage.setItem(
    storeKey,
    JSON.stringify({
      totalSeconds: state.totalSeconds,
      focusSeconds: state.focusSeconds,
      distractionCount: state.distractionCount,
      points: state.points,
      owned: state.owned,
      equipped: state.equipped,
    }),
  );
}

function loadState() {
  const raw = localStorage.getItem(storeKey);
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw);
    state.totalSeconds = parsed.totalSeconds ?? 0;
    state.focusSeconds = parsed.focusSeconds ?? 0;
    state.distractionCount = parsed.distractionCount ?? 0;
    state.points = parsed.points ?? 0;
    state.owned = Array.isArray(parsed.owned) ? parsed.owned : [];
    state.equipped = parsed.equipped ?? state.equipped;
  } catch {
    localStorage.removeItem(storeKey);
  }
>>>>>>> origin/main
}

function updateAvatar() {
  Object.entries(avatarEls).forEach(([slot, el]) => {
    const item = shopCatalog.find((catalogItem) => catalogItem.id === state.equipped[slot]);
    el.textContent = item ? item.icon : '';
  });
}

function refreshStats() {
  screenTimeEl.textContent = formatSeconds(state.totalSeconds);
  focusTimeEl.textContent = formatSeconds(state.focusSeconds);
  distractionCountEl.textContent = state.distractionCount;
  pointsEl.textContent = Math.floor(state.points);
}

function ownItem(itemId) {
  return state.owned.includes(itemId);
}

function buyItem(item) {
  if (ownItem(item.id) || state.points < item.cost) return;
  state.points -= item.cost;
  state.owned.push(item.id);
  state.equipped[item.slot] = item.id;
  renderShop();
  refreshStats();
  updateAvatar();
<<<<<<< HEAD
  queueSaveProgress();
=======
  saveProgress();
  if (ownItem(item.id) || state.points < item.cost) {
    return;
  }
  state.points -= item.cost;
  state.owned.push(item.id);
  state.equipped[item.slot] = item.id;
  saveState();
  renderShop();
  refreshStats();
  updateAvatar();
>>>>>>> origin/main
}

function equipItem(item) {
  if (!ownItem(item.id)) return;
  state.equipped[item.slot] = item.id;
  renderShop();
  updateAvatar();
<<<<<<< HEAD
  queueSaveProgress();
=======
  saveProgress();
  saveState();
  renderShop();
  updateAvatar();
>>>>>>> origin/main
}

function renderShop() {
  shopItemsEl.innerHTML = '';
  shopCatalog.forEach((item) => {
    const card = document.createElement('article');
    card.className = 'item';

    const owned = ownItem(item.id);
    const isEquipped = state.equipped[item.slot] === item.id;

    card.innerHTML = `<h3>${item.icon} ${item.name}</h3><p>Cost: ${item.cost} pts</p>`;
<<<<<<< HEAD
=======
    card.innerHTML = `
      <h3>${item.icon} ${item.name}</h3>
      <p>Cost: ${item.cost} pts</p>
    `;
>>>>>>> origin/main

    const button = document.createElement('button');
    if (!owned) {
      button.textContent = state.points >= item.cost ? 'Buy' : 'Not enough points';
      button.disabled = state.points < item.cost;
      button.addEventListener('click', () => buyItem(item));
    } else {
      button.textContent = isEquipped ? 'Equipped' : 'Equip';
      button.disabled = isEquipped;
      button.addEventListener('click', () => equipItem(item));
    }

    card.appendChild(button);
    shopItemsEl.appendChild(card);
  });
}

function onActiveSignal() {
  state.inactiveSince = null;
  if (state.inactivityModalOpen) {
    inactivityModal.close();
    state.inactivityModalOpen = false;
  }
}

function checkInactivity() {
  if (document.hidden && !state.inactiveSince) {
    state.inactiveSince = Date.now();
  }
  if (!state.inactiveSince) return false;
<<<<<<< HEAD
=======
  if (document.hidden) {
    if (!state.inactiveSince) {
      state.inactiveSince = Date.now();
    }
  }

  if (!state.inactiveSince) {
    return false;
  }
>>>>>>> origin/main

  const inactiveDuration = Date.now() - state.inactiveSince;
  if (inactiveDuration >= INACTIVITY_LIMIT_MS && !state.inactivityModalOpen) {
    state.distractionCount += 1;
    state.inactivityModalOpen = true;
    inactivityModal.showModal();
    refreshStats();
<<<<<<< HEAD
    queueSaveProgress();
=======
    saveProgress();
    saveState();
>>>>>>> origin/main
    return true;
  }
  return state.inactivityModalOpen;
}

function tick() {
<<<<<<< HEAD
  if (!state.user) return;
=======
  if (!state.username) return;
>>>>>>> origin/main
  state.totalSeconds += 1;
  const distracted = checkInactivity();
  if (!distracted) {
    state.focusSeconds += 1;
    state.points += POINTS_PER_FOCUS_SECOND;
  }
  refreshStats();
  renderShop();
<<<<<<< HEAD
  if (state.totalSeconds % 10 === 0) queueSaveProgress();
=======
  if (state.totalSeconds % 10 === 0) saveProgress();
>>>>>>> origin/main
}

function setLoggedInUI(loggedIn) {
  authPanel.classList.toggle('hidden', loggedIn);
  dashboard.classList.toggle('hidden', !loggedIn);
}

async function handleLogin(mode) {
<<<<<<< HEAD
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  authMessage.textContent = '';

  try {
    if (mode === 'register') {
      await createUserWithEmailAndPassword(auth, email, password);
      authMessage.textContent = 'Registered successfully.';
      return;
    }

    await signInWithEmailAndPassword(auth, email, password);
=======
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  try {
    if (mode === 'register') {
      await api('/api/register', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      authMessage.textContent = 'Registered successfully. Now logging you in...';
    }

    const loginData = await api('/api/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    state.username = loginData.username;
    applyProgress(loginData.progress || {});
    currentUserEl.textContent = state.username;
    setLoggedInUI(true);
    refreshStats();
    renderShop();
    updateAvatar();
    authMessage.textContent = '';
>>>>>>> origin/main
  } catch (error) {
    authMessage.textContent = error.message;
  }
}

authForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  await handleLogin('login');
});

registerBtn.addEventListener('click', async () => {
  await handleLogin('register');
});

logoutBtn.addEventListener('click', async () => {
<<<<<<< HEAD
  try {
    await saveProgress();
  } catch {
    // ignore save failure on logout
  }
  await signOut(auth);
});

=======
  await saveProgress();
  try {
    await api('/api/logout', { method: 'POST' });
  } catch {
    // ignore
  }
  state.username = null;
  applyProgress({});
  setLoggedInUI(false);
  refreshStats();
  renderShop();
  updateAvatar();
});

  saveState();
}

>>>>>>> origin/main
['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll', 'focus'].forEach((eventName) => {
  window.addEventListener(eventName, onActiveSignal, { passive: true });
});

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) onActiveSignal();
});

<<<<<<< HEAD
window.addEventListener('beforeunload', () => {
  queueSaveProgress();
});

refocusBtn.addEventListener('click', onActiveSignal);

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    state.user = null;
    applyProgress(defaultProgress());
    setLoggedInUI(false);
    refreshStats();
    renderShop();
    updateAvatar();
    currentUserEl.textContent = '';
    return;
  }

  state.user = user;
  currentUserEl.textContent = user.email;
  setLoggedInUI(true);

  try {
    const progress = await loadProgress(user.uid);
    applyProgress(progress);
    authMessage.textContent = '';
  } catch {
    applyProgress(defaultProgress());
    authMessage.textContent = 'Could not load Firebase progress. Check Firestore setup/rules.';
=======
window.addEventListener('beforeunload', saveProgressBeacon);

refocusBtn.addEventListener('click', onActiveSignal);

(async function bootstrap() {
  try {
    const session = await api('/api/session');
    state.username = session.username;
    applyProgress(session.progress || {});
    currentUserEl.textContent = state.username;
    setLoggedInUI(true);
  } catch {
    setLoggedInUI(false);
>>>>>>> origin/main
  }

  refreshStats();
  renderShop();
  updateAvatar();
<<<<<<< HEAD
});

=======
  setInterval(tick, TICK_MS);
})();
  if (!document.hidden) {
    onActiveSignal();
  }
});

refocusBtn.addEventListener('click', onActiveSignal);

loadState();
>>>>>>> origin/main
refreshStats();
renderShop();
updateAvatar();
setInterval(tick, TICK_MS);
