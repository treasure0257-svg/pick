// Unified auth facade. Depends on:
//   firebase-app-compat.js, firebase-auth-compat.js (Google + session)
//   Kakao SDK 2.7.x (loaded on demand)
//   Naver ID Login JS SDK 2.0.x (loaded on demand)
//   firebase-config.js — user-supplied keys
//
// Consumers:
//   PickAuth.init()                   // call once per page
//   PickAuth.onChange(cb)             // cb({ user, provider }|null)
//   PickAuth.currentUser()            // returns the cached unified user or null
//   PickAuth.signInGoogle/Kakao/Naver()
//   PickAuth.signOut()

(function () {
  const KAKAO_SDK = "https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js";
  const NAVER_SDK = "https://static.nid.naver.com/js/naveridlogin_js_sdk_2.0.2.js";
  const FB_APP    = "https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js";
  const FB_AUTH   = "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js";

  const KAKAO_USER_KEY = "pick.kakaoUser";
  const NAVER_USER_KEY = "pick.naverUser";

  let fbInitialized = false;
  let kakaoInitialized = false;
  let naverInitialized = false;
  let naverLogin = null;
  const listeners = new Set();
  let currentCachedUser = null;

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[data-auth-src="${src}"]`);
      if (existing) { existing.addEventListener("load", resolve, { once: true }); return; }
      const s = document.createElement("script");
      s.src = src; s.async = true; s.dataset.authSrc = src;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("Failed to load " + src));
      document.head.appendChild(s);
    });
  }

  async function ensureFirebase() {
    if (fbInitialized) return;
    if (!window.firebase) {
      await loadScript(FB_APP);
      await loadScript(FB_AUTH);
    }
    const cfg = window.PICK_FIREBASE_CONFIG || {};
    if (cfg.apiKey === "REPLACE_ME" || !cfg.apiKey) {
      console.warn("[PickAuth] Firebase config is still a placeholder. See SETUP.md.");
    }
    if (!firebase.apps.length) firebase.initializeApp(cfg);
    firebase.auth().onAuthStateChanged((fbUser) => {
      if (fbUser) {
        if (fbUser.isAnonymous) return;
        setCurrent(toUnifiedFromFirebase(fbUser));
      } else if (!(loadKakao() || loadNaver())) {
        setCurrent(null);
      }
    });
    fbInitialized = true;
  }

  async function ensureKakao() {
    if (kakaoInitialized) return;
    if (!window.Kakao) await loadScript(KAKAO_SDK);
    if (!window.Kakao.isInitialized()) {
      const key = window.PICK_KAKAO_JS_KEY;
      if (!key || key === "REPLACE_ME") {
        console.warn("[PickAuth] Kakao JS key is a placeholder. See SETUP.md.");
      } else {
        window.Kakao.init(key);
      }
    }
    kakaoInitialized = true;
  }

  async function ensureNaver() {
    if (naverInitialized) return;
    if (!window.naver?.LoginWithNaverId) await loadScript(NAVER_SDK);
    const clientId = window.PICK_NAVER_CLIENT_ID;
    if (!clientId || clientId === "REPLACE_ME") {
      console.warn("[PickAuth] Naver client ID is a placeholder. See SETUP.md.");
    }
    naverLogin = new window.naver.LoginWithNaverId({
      clientId: clientId || "REPLACE_ME",
      callbackUrl: location.origin + location.pathname,
      isPopup: false,
      callbackHandle: true
    });
    naverLogin.init();
    naverInitialized = true;

    // Complete login if we landed back with tokens in the URL hash.
    if (location.hash.includes("access_token")) {
      await new Promise((resolve) => {
        naverLogin.getLoginStatus((status) => {
          if (status && naverLogin.user) {
            const unified = toUnifiedFromNaver(naverLogin.user);
            localStorage.setItem(NAVER_USER_KEY, JSON.stringify(unified));
            setCurrent(unified);
            history.replaceState(null, "", location.pathname);
          }
          resolve();
        });
      });
    }
  }

  function toUnifiedFromFirebase(fbUser) {
    const provider = (fbUser.providerData[0]?.providerId || "firebase");
    return {
      uid:         fbUser.uid,
      provider:    provider.includes("google") ? "google" : provider,
      displayName: fbUser.displayName || "",
      email:       fbUser.email || "",
      photoURL:    fbUser.photoURL || ""
    };
  }

  function toUnifiedFromKakao(kUser) {
    const acc = kUser.kakao_account || {};
    const profile = acc.profile || kUser.properties || {};
    return {
      uid:         "kakao:" + kUser.id,
      provider:    "kakao",
      displayName: profile.nickname || profile.nickName || "",
      email:       acc.email || "",
      photoURL:    profile.profile_image_url || profile.profile_image || ""
    };
  }

  function toUnifiedFromNaver(nUser) {
    return {
      uid:         "naver:" + (nUser.id || nUser.getId?.() || ""),
      provider:    "naver",
      displayName: nUser.name || nUser.nickname || nUser.getName?.() || "",
      email:       nUser.email || nUser.getEmail?.() || "",
      photoURL:    nUser.profile_image || nUser.getProfileImage?.() || ""
    };
  }

  function setCurrent(user) {
    currentCachedUser = user;
    listeners.forEach(cb => { try { cb(user); } catch (e) { console.error(e); } });
  }

  function loadKakao() {
    const raw = localStorage.getItem(KAKAO_USER_KEY);
    if (!raw) return false;
    try { setCurrent(JSON.parse(raw)); return true; } catch { return false; }
  }

  function loadNaver() {
    const raw = localStorage.getItem(NAVER_USER_KEY);
    if (!raw) return false;
    try { setCurrent(JSON.parse(raw)); return true; } catch { return false; }
  }

  const PickAuth = {
    async init() {
      try { await ensureFirebase(); } catch (e) { console.error("[PickAuth] Firebase init failed", e); }
      // Hydrate from local providers first; Firebase will override on state change.
      if (!currentCachedUser) loadKakao();
      if (!currentCachedUser) loadNaver();
      // If the URL came back from a Naver redirect, finish that flow now.
      if (location.hash.includes("access_token")) {
        try { await ensureNaver(); } catch (e) { console.error(e); }
      }
    },

    onChange(cb) {
      listeners.add(cb);
      try { cb(currentCachedUser); } catch {}
      return () => listeners.delete(cb);
    },

    currentUser() { return currentCachedUser; },

    async signInGoogle() {
      await ensureFirebase();
      const provider = new firebase.auth.GoogleAuthProvider();
      await firebase.auth().signInWithPopup(provider);
    },

    async signInKakao() {
      await ensureKakao();
      if (!window.Kakao.Auth) throw new Error("Kakao SDK unavailable");
      await new Promise((resolve, reject) => {
        window.Kakao.Auth.login({
          scope: "profile_nickname profile_image account_email",
          success: resolve,
          fail: reject
        });
      });
      const kUser = await new Promise((resolve, reject) => {
        window.Kakao.API.request({ url: "/v2/user/me", success: resolve, fail: reject });
      });
      const unified = toUnifiedFromKakao(kUser);
      localStorage.setItem(KAKAO_USER_KEY, JSON.stringify(unified));
      setCurrent(unified);
    },

    async signInNaver() {
      await ensureNaver();
      if (!naverLogin) throw new Error("Naver SDK unavailable");
      naverLogin.authorize(); // redirects browser to Naver login; returns via callback
    },

    async signOut() {
      if (currentCachedUser?.provider === "kakao") {
        try { await ensureKakao(); } catch {}
        if (window.Kakao?.Auth?.getAccessToken?.()) {
          await new Promise((r) => window.Kakao.Auth.logout(r));
        }
        localStorage.removeItem(KAKAO_USER_KEY);
      }
      if (currentCachedUser?.provider === "naver") {
        localStorage.removeItem(NAVER_USER_KEY);
        if (naverLogin?.logout) { try { naverLogin.logout(); } catch {} }
      }
      try {
        await ensureFirebase();
        if (firebase.auth().currentUser) await firebase.auth().signOut();
      } catch {}
      setCurrent(null);
    }
  };

  window.PickAuth = PickAuth;
})();
