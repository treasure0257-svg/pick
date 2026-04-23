import './style.css';
import { Router } from './router.js';
import { HomeView } from './views/HomeView.js';
import { PreferencesView } from './views/PreferencesView.js';
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
  { path: '#/preferences', component: PreferencesView },
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

function updateAuthUI(user) {
  const slots = document.querySelectorAll('#auth-slot');
  slots.forEach(slot => {
    slot.innerHTML = '';
    if (user) {
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
