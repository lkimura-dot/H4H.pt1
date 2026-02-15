import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js';
import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
} from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js';

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
  user: null,
  username: null,
};

// DOM elements
const authPanel = document.getElementById('auth-panel');
const dashboard = document.getElementById('dashboard');
const authForm = document.getElementById('auth-form');
const registerBtn = document.getElementById('register-btn');
const authMessage = document.getElementById('auth-message');
const currentUserEl = document.getElementById('current-user');
const logoutBtn = document.getElementById('logout-btn');

const storeKey = 'focusforge-state-v1';
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

if (!window.FIREBASE_CONFIG || window.FIREBASE_CONFIG.apiKey?.startsWith('REPLACE_')) {
  authMessage.textContent = 'Please set firebase-config.js with your Firebase project settings.';
}

const app = initializeApp(window.FIREBASE_CONFIG);
const auth = getAuth(app);
const db = getFirestore(app);

// Helpers
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

function formatSeconds(seconds) {
  const s = String(seconds % 60).padStart(2, '0');
  const m = String(Math.floor(seconds / 60) % 60).padStart(2, '0');
  const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

function applyProgress(progress) {
  const safe = { ...defaultProgress(), ...progress };
  state.totalSeconds = safe.totalSeconds ?? 0;
  state.focusSeconds = safe.focusSeconds ?? 0;
  state.distractionCount = safe.distractionCount ?? 0;
  state.points = safe.points ?? 0;
  state.owned = Array.isArray(safe.owned) ? safe.owned : [];
  state.equipped = safe.equipped ?? defaultProgress().equipped;
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

// Firebase persistence
async function loadProgress(uid) {
  const docRef = doc(db, 'progress', uid);
  const snap = await getDoc(docRef);
  return snap.exists() ? { ...defaultProgress(), ...snap.data() } : defaultProgress();
}

async function saveProgress() {
  if (!state.user) return;
  const docRef = doc(db, 'progress', state.user.uid);
  await setDoc(docRef, serializeProgress(), { merge: true });
}

function queueSaveProgress() {
  saveProgress().catch(() => {
    authMessage.textContent = 'Unable to save progress right now. Check Firebase rules/network.';
  });
}

// LocalStorage persistence
function saveState() {
  localStorage.setItem(storeKey, JSON.stringify(serializeProgress()));
}

function loadState() {
  const raw = localStorage.getItem(storeKey);
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw);
    applyProgress(parsed);
  } catch {
    localStorage.removeItem(storeKey);
  }
}

// UI updates
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
  saveState();
  queueSaveProgress();
  refreshStats();
  updateAvatar();
  renderShop();
}

function equipItem(item) {
  if (!ownItem(item.id)) return;
  state.equipped[item.slot] = item.id;
  saveState();
  queueSaveProgress();
  updateAvatar();
  renderShop();
}

function renderShop() {
  shopItemsEl.innerHTML = '';
  shopCatalog.forEach((item) => {
    const card = document.createElement('article');
    card.className = 'item';
    const owned = ownItem(item.id);
    const isEquipped = state.equipped[item.slot] === item.id;
    card.innerHTML = `<h3>${item.icon} ${item.name}</h3><p>Cost: ${item.cost} pts</p>`;
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

// Activity tracking
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

  const inactiveDuration = Date.now() - state.inactiveSince;
  if (inactiveDuration >= INACTIVITY_LIMIT_MS && !state.inactivityModalOpen) {
    state.distractionCount += 1;
    state.inactivityModalOpen = true;
    inactivityModal.showModal();
    refreshStats();
    queueSaveProgress();
    saveState();
    return true;
  }
  return state.inactivityModalOpen;
}

// Timer
function tick() {
  if (!state.user && !state.username) return;
  state.totalSeconds += 1;
  const distracted = checkInactivity();
  if (!distracted) {
    state.focusSeconds += 1;
    state.points += POINTS_PER_FOCUS_SECOND;
  }
  refreshStats();
  renderShop();
  if (state.totalSeconds % 10 === 0) queueSaveProgress();
}

function setLoggedInUI(loggedIn) {
  authPanel.classList.toggle('hidden', loggedIn);
  dashboard.classList.toggle('hidden', !loggedIn);
}

// Event listeners
authForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  await handleLogin('login');
});

registerBtn.addEventListener('click', async () => await handleLogin('register'));
logoutBtn.addEventListener('click', async () => {
  try {
    await saveProgress();
    await signOut(auth);
  } catch {}
  state.username = null;
  applyProgress(defaultProgress());
  setLoggedInUI(false);
  refreshStats();
  renderShop();
  updateAvatar();
});

['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll', 'focus'].forEach((eventName) => {
  window.addEventListener(eventName, onActiveSignal, { passive: true });
});

document.addEventListener('visibilitychange', () => { if (!document.hidden) onActiveSignal(); });
window.addEventListener('beforeunload', () => queueSaveProgress());
refocusBtn.addEventListener('click', onActiveSignal);

// Initialize
loadState();
refreshStats();
renderShop();
updateAvatar();
setInterval(tick, TICK_MS);

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
  } catch {
    applyProgress(defaultProgress());
    authMessage.textContent = 'Could not load Firebase progress. Check Firestore setup/rules.';
  }

  refreshStats();
  renderShop();
  updateAvatar();
});