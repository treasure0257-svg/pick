import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { AppState, STORAGE_KEYS } from './App.js';

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

let currentUser = null;

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
      // Create document with current local state
      await setDoc(userRef, {
        preferences: AppState.get(STORAGE_KEYS.preferences, {}),
        saved: AppState.get(STORAGE_KEYS.saved, [])
      });
    }
  } catch (e) {
    console.error("Firestore sync error", e);
  }
}

export function initAuth(onChangeCb) {
  onAuthStateChanged(auth, async (user) => {
    currentUser = user;
    if (user) await syncUserData(user);
    onChangeCb(user);
  });
}

export async function loginGoogle() {
  const provider = new GoogleAuthProvider();
  try {
    await signInWithPopup(auth, provider);
  } catch (e) {
    console.error("Login failed", e);
  }
}

export async function logout() {
  await signOut(auth);
}

// Intercept AppState to save to Firestore if logged in
const originalSet = AppState.set;
AppState.set = function(key, value) {
  originalSet(key, value);
  if (currentUser && (key === STORAGE_KEYS.preferences || key === STORAGE_KEYS.saved)) {
    const field = key === STORAGE_KEYS.preferences ? 'preferences' : 'saved';
    setDoc(doc(db, 'users', currentUser.uid), { [field]: value }, { merge: true })
      .catch(e => console.error("Save to Firestore failed", e));
  }
};
