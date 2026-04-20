import './style.css';
import { Router } from './router.js';
import { HomeView } from './views/HomeView.js';
import { PreferencesView } from './views/PreferencesView.js';
import { TournamentView } from './views/TournamentView.js';
import { ResultsView } from './views/ResultsView.js';
import { SavedView } from './views/SavedView.js';
import { initAuth, loginGoogle, logout, auth } from './firebase-setup.js';
import { h } from './utils/dom.js';

const routes = [
  { path: '#/', component: HomeView },
  { path: '#/preferences', component: PreferencesView },
  { path: '#/tournament', component: TournamentView },
  { path: '#/results', component: ResultsView },
  { path: '#/saved', component: SavedView }
];

const appRouter = new Router(routes);
appRouter.init();

// Global Auth UI logic
function updateAuthUI(user) {
  const slots = document.querySelectorAll('#auth-slot');
  slots.forEach(slot => {
    slot.innerHTML = '';
    if (user) {
      const profileBtn = h('button', { 
        className: 'flex items-center gap-2 px-3 py-1.5 rounded-full bg-surfaceContainerLow hover:bg-surfaceContainer transition-colors',
        onClick: () => logout()
      }, 
        user.photoURL ? h('img', { src: user.photoURL, className: 'w-6 h-6 rounded-full' }) : h('span', { className: 'material-symbols-outlined text-[20px]' }, 'person'),
        h('span', { className: 'text-sm font-medium hidden sm:inline' }, '로그아웃')
      );
      slot.appendChild(profileBtn);
    } else {
      const loginBtn = h('button', {
        className: 'flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary text-onPrimary hover:shadow-md transition-all font-medium text-sm',
        onClick: () => loginGoogle()
      }, 'Google 로그인');
      slot.appendChild(loginBtn);
    }
  });
}

initAuth(updateAuthUI);
