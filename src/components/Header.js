import { h } from '../utils/dom.js';

export function Header(router) {
  const navLinks = [
    { name: '홈', path: '#/' },
    { name: '취향 설정', path: '#/preferences' },
    { name: '저장됨', path: '#/saved' }
  ];

  const currentPath = window.location.hash || '#/';

  return h('header', { className: 'bg-surface text-primary font-headline font-semibold tracking-tight sticky top-0 z-50 flex justify-between items-center w-full px-6 py-4' },
    h('a', { href: '#/', className: 'flex items-center gap-3' },
      h('span', { className: 'material-symbols-outlined text-2xl' }, 'spa'),
      h('span', { className: 'text-xl font-bold tracking-tight' }, 'The Concierge')
    ),
    h('nav', { className: 'hidden md:flex items-center gap-6' },
      ...navLinks.map(link => 
        h('a', { 
          href: link.path, 
          className: currentPath === link.path 
            ? 'text-primary font-bold rounded-lg px-3 py-1'
            : 'text-onSurfaceVariant hover:bg-surfaceContainer rounded-lg px-3 py-1 transition-colors'
        }, link.name)
      )
    ),
    h('div', { id: 'auth-slot', className: 'flex items-center gap-2' }) // Placeholder for auth
  );
}
