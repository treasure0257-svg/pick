import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { AppState, STORAGE_KEYS } from './App.js';

// --- Firebase ---
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// --- Multi-provider unified state ---
const KAKAO_SDK = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js';
const NAVER_SDK = 'https://static.nid.naver.com/js/naveridlogin_js_sdk_2.0.2.js';
const KAKAO_STORAGE = 'pick.kakaoUser';
const NAVER_STORAGE = 'pick.naverUser';

let currentUser = null;
let authCallback = null;
let naverLogin = null;

function notifyAuthChange(user) {
  currentUser = user;
  if (authCallback) authCallback(user);
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[data-auth-src="${src}"]`);
    if (existing) { existing.addEventListener('load', resolve, { once: true }); return; }
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.dataset.authSrc = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Failed to load ' + src));
    document.head.appendChild(s);
  });
}

function unifiedFromFirebase(u) {
  return {
    uid: u.uid,
    provider: 'google',
    displayName: u.displayName || '',
    email: u.email || '',
    photoURL: u.photoURL || ''
  };
}

function unifiedFromKakao(k) {
  const acc = k.kakao_account || {};
  const profile = acc.profile || k.properties || {};
  return {
    uid: 'kakao:' + k.id,
    provider: 'kakao',
    displayName: profile.nickname || profile.nickName || '',
    email: acc.email || '',
    photoURL: profile.profile_image_url || profile.profile_image || ''
  };
}

function unifiedFromNaver(n) {
  return {
    uid: 'naver:' + (n.id || ''),
    provider: 'naver',
    displayName: n.name || n.nickname || '',
    email: n.email || '',
    photoURL: n.profile_image || ''
  };
}

// --- Firestore sync (Firebase users only; Kakao/Naver remain localStorage-only for v0.2) ---
export async function syncUserData(user) {
  if (!user) return;
  const userRef = doc(db, 'users', user.uid);
  try {
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data();
      if (data.preferences) AppState.set(STORAGE_KEYS.preferences, data.preferences);
      if (data.saved) AppState.set(STORAGE_KEYS.saved, data.saved);
    } else {
      await setDoc(userRef, {
        preferences: AppState.get(STORAGE_KEYS.preferences, {}),
        saved: AppState.get(STORAGE_KEYS.saved, [])
      });
    }
  } catch (e) {
    console.error('Firestore sync error', e);
  }
}

// --- Init: subscribe Firebase + hydrate Kakao/Naver from localStorage + finish Naver callback ---
export function initAuth(onChangeCb) {
  authCallback = onChangeCb;

  onAuthStateChanged(auth, async (fbUser) => {
    if (fbUser) {
      notifyAuthChange(unifiedFromFirebase(fbUser));
      await syncUserData(fbUser);
    } else {
      const rawK = localStorage.getItem(KAKAO_STORAGE);
      const rawN = localStorage.getItem(NAVER_STORAGE);
      if (rawK) { try { notifyAuthChange(JSON.parse(rawK)); return; } catch {} }
      if (rawN) { try { notifyAuthChange(JSON.parse(rawN)); return; } catch {} }
      notifyAuthChange(null);
    }
  });

  // Hydrate immediately so header doesn't flash "logged out" for returning Kakao/Naver users
  const rawK = localStorage.getItem(KAKAO_STORAGE);
  const rawN = localStorage.getItem(NAVER_STORAGE);
  if (rawK) { try { notifyAuthChange(JSON.parse(rawK)); } catch {} }
  else if (rawN) { try { notifyAuthChange(JSON.parse(rawN)); } catch {} }

  // Finalize Naver login if URL returned with access_token
  if (location.hash.includes('access_token=')) {
    ensureNaver().catch((e) => console.error('Naver callback handling failed', e));
  }
}

// --- Google ---
export async function loginGoogle() {
  const provider = new GoogleAuthProvider();
  await signInWithPopup(auth, provider);
}

// --- Kakao ---
async function ensureKakao() {
  if (!window.Kakao) await loadScript(KAKAO_SDK);
  if (!window.Kakao.isInitialized()) {
    const key = import.meta.env.VITE_KAKAO_JS_KEY;
    if (!key || key === 'REPLACE_ME') {
      throw new Error('Kakao JS 키가 등록되지 않았습니다');
    }
    window.Kakao.init(key);
  }
}

export async function loginKakao() {
  await ensureKakao();
  await new Promise((resolve, reject) => {
    window.Kakao.Auth.login({
      scope: 'profile_nickname profile_image',
      success: resolve,
      fail: reject
    });
  });
  const kUser = await new Promise((resolve, reject) => {
    window.Kakao.API.request({ url: '/v2/user/me', success: resolve, fail: reject });
  });
  const unified = unifiedFromKakao(kUser);
  localStorage.setItem(KAKAO_STORAGE, JSON.stringify(unified));
  notifyAuthChange(unified);
}

// --- Naver ---
async function ensureNaver() {
  if (!window.naver?.LoginWithNaverId) await loadScript(NAVER_SDK);
  const clientId = import.meta.env.VITE_NAVER_CLIENT_ID;
  if (!naverLogin) {
    naverLogin = new window.naver.LoginWithNaverId({
      clientId: clientId || 'REPLACE_ME',
      callbackUrl: location.origin + '/',
      isPopup: false,
      callbackHandle: true
    });
    try { naverLogin.init(); } catch (e) { console.warn('Naver init error', e); }
  }
  if (location.hash.includes('access_token=')) {
    await new Promise((resolve) => {
      naverLogin.getLoginStatus((status) => {
        if (status && naverLogin.user) {
          const unified = unifiedFromNaver(naverLogin.user);
          localStorage.setItem(NAVER_STORAGE, JSON.stringify(unified));
          notifyAuthChange(unified);
          history.replaceState(null, '', location.pathname);
        }
        resolve();
      });
    });
  }
}

export async function loginNaver() {
  const clientId = import.meta.env.VITE_NAVER_CLIENT_ID;
  if (!clientId || clientId === 'REPLACE_ME') {
    throw new Error('Naver Client ID가 아직 등록되지 않았습니다 (추후 연결 예정)');
  }
  await ensureNaver();
  if (!naverLogin) throw new Error('Naver SDK 로드 실패');
  naverLogin.authorize(); // browser redirects
}

// --- Logout (all providers) ---
export async function logout() {
  if (currentUser?.provider === 'kakao') {
    try {
      if (window.Kakao?.Auth?.getAccessToken?.()) {
        await new Promise((r) => window.Kakao.Auth.logout(r));
      }
    } catch (e) { console.warn('Kakao logout error', e); }
    localStorage.removeItem(KAKAO_STORAGE);
  }
  if (currentUser?.provider === 'naver') {
    localStorage.removeItem(NAVER_STORAGE);
    try { naverLogin?.logout?.(); } catch {}
  }
  try {
    if (auth.currentUser) await signOut(auth);
  } catch (e) { console.warn('Firebase signOut error', e); }
  notifyAuthChange(null);
}

// --- Firestore save hook (fires only when Firebase user is active) ---
const originalSet = AppState.set;
AppState.set = function (key, value) {
  originalSet(key, value);
  if (auth.currentUser && (key === STORAGE_KEYS.preferences || key === STORAGE_KEYS.saved)) {
    const field = key === STORAGE_KEYS.preferences ? 'preferences' : 'saved';
    setDoc(doc(db, 'users', auth.currentUser.uid), { [field]: value }, { merge: true })
      .catch((e) => console.error('Save to Firestore failed', e));
  }
};
