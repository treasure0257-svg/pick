import './style.css';
import { Router } from './router.js';

// 다크 모드 초기화 — 사용자 저장값 우선, 없으면 시스템 설정 따름.
(function initTheme() {
  try {
    const saved = localStorage.getItem('pick.theme'); // 'light' | 'dark' | null
    let dark;
    if (saved === 'dark') dark = true;
    else if (saved === 'light') dark = false;
    else dark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
    document.documentElement.classList.toggle('dark', dark);
  } catch { /* noop */ }
})();
import { HomeView } from './views/HomeView.js';
import { ResultsView } from './views/ResultsView.js';
import { SavedView } from './views/SavedView.js';
import { LoginView } from './views/LoginView.js';
import { RegionView } from './views/RegionView.js';
import { PlaceDetailView } from './views/PlaceDetailView.js';
import { AboutView } from './views/AboutView.js';
import { GuideView } from './views/GuideView.js';
import { PrivacyView } from './views/PrivacyView.js';
import { TermsView } from './views/TermsView.js';
import { MyPageView } from './views/MyPageView.js';
import { initAuth } from './firebase-setup.js';
import { h } from './utils/dom.js';

const routes = [
  { path: '#/', component: HomeView },
  // v0.4: 취향 설정 페이지는 MyPageView 안으로 흡수됨 — 외부 링크 호환 위해 redirect
  { path: '#/preferences', component: ({ router }) => {
      router.navigate('#/mypage');
      return document.createElement('div');
    }
  },
  { path: '#/region', component: RegionView },
  { path: '#/results', component: ResultsView },
  { path: '#/place', component: PlaceDetailView },
  { path: '#/saved', component: SavedView },
  { path: '#/login', component: LoginView },
  { path: '#/about', component: AboutView },
  { path: '#/guide', component: GuideView },
  { path: '#/privacy', component: PrivacyView },
  { path: '#/terms', component: TermsView },
  { path: '#/mypage', component: MyPageView }
];

const appRouter = new Router(routes);
appRouter.init();

// 헤더의 #auth-slot 은 라우트 이동마다 새로 생성되므로,
// 마지막으로 알려진 사용자 상태를 캐시했다가 매 navigation 직후 재적용한다.
let latestAuthUser = null;

function makeThemeToggle() {
  const btn = h('button', {
    type: 'button',
    title: '다크 모드 전환',
    'aria-label': '다크 모드 전환'
  });
  function paint() {
    const dark = document.documentElement.classList.contains('dark');
    btn.className = 'inline-flex items-center justify-center w-9 h-9 rounded-full bg-surfaceContainerLow hover:bg-surfaceContainer text-onSurface transition-colors';
    btn.innerHTML = '';
    btn.appendChild(h('span', { className: 'material-symbols-outlined text-[20px]' }, dark ? 'light_mode' : 'dark_mode'));
  }
  btn.addEventListener('click', () => {
    const next = !document.documentElement.classList.contains('dark');
    document.documentElement.classList.toggle('dark', next);
    try { localStorage.setItem('pick.theme', next ? 'dark' : 'light'); } catch {}
    // 모든 헤더의 toggle 아이콘 갱신
    document.querySelectorAll('[data-theme-toggle]').forEach(el => {
      const isDark = next;
      el.innerHTML = '';
      el.appendChild(h('span', { className: 'material-symbols-outlined text-[20px]' }, isDark ? 'light_mode' : 'dark_mode'));
    });
  });
  paint();
  btn.setAttribute('data-theme-toggle', '');
  return btn;
}

function updateAuthUI(user) {
  latestAuthUser = user;
  const slots = document.querySelectorAll('#auth-slot');
  slots.forEach(slot => {
    slot.innerHTML = '';

    // 다크 모드 토글 — 로그인 여부 무관, 항상 가장 왼쪽에 노출
    slot.appendChild(makeThemeToggle());

    if (user) {
      // 데스크톱 한정: '마이페이지' 텍스트 링크 → 프로필 사진 묶음으로 표시 (왼→오른쪽)
      const myPageLink = h('a', {
        href: '#/mypage',
        className: 'hidden md:inline-flex items-center text-sm font-medium text-onSurface hover:text-primary transition-colors no-underline px-2'
      }, '마이페이지');
      slot.appendChild(myPageLink);

      // 프로필 클릭 → 마이페이지 (로그아웃은 마이페이지 안에 분리)
      const profileLink = h('a', {
        href: '#/mypage',
        className: 'flex items-center gap-2 px-3 py-1.5 rounded-full bg-surfaceContainerLow hover:bg-surfaceContainer transition-colors no-underline',
        title: '마이페이지'
      },
        user.photoURL
          ? h('img', { src: user.photoURL, className: 'w-6 h-6 rounded-full object-cover', alt: user.displayName || '프로필' })
          : h('span', { className: 'material-symbols-outlined text-[20px] text-onSurface' }, 'person'),
        h('span', { className: 'text-sm font-medium text-onSurface hidden sm:inline max-w-[120px] truncate' },
          user.displayName || '마이페이지'
        )
      );
      slot.appendChild(profileLink);
    } else {
      const loginBtn = h('a', {
        href: '#/login',
        className: 'flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary text-onPrimary hover:shadow-md transition-all font-medium text-sm no-underline'
      }, '로그인');
      slot.appendChild(loginBtn);
    }
  });
}

initAuth(updateAuthUI);

// 라우트 이동 후 새 Header의 빈 auth-slot에 캐시된 사용자 정보를 즉시 다시 칠한다.
// (이렇게 안 하면 새로고침 전까진 헤더가 비어있어 보임)
window.addEventListener('hashchange', () => {
  // Router.handleRoute가 동기적으로 새 DOM을 그리고 끝난 직후에 실행되도록 microtask 큐로 미룸
  queueMicrotask(() => updateAuthUI(latestAuthUser));
});
