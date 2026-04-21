import { h } from '../utils/dom.js';
import { openSearchModal } from './SearchModal.js';

export function Header(router) {
  const navLinks = [
    { name: '홈', path: '#/' },
    { name: '취향 설정', path: '#/preferences' },
    { name: '저장됨', path: '#/saved' }
  ];

  const currentPath = window.location.hash || '#/';

  return h('header', { className: 'bg-surface text-primary font-headline font-semibold tracking-tight sticky top-0 z-50 flex justify-between items-center w-full px-4 md:px-6 py-4 gap-3' },
    h('a', { href: '#/', className: 'flex items-center gap-3 flex-none' },
      h('img', { src: '/logo.png', alt: '정해줘', className: 'w-9 h-9 rounded-xl' }),
      h('span', { className: 'text-xl font-bold tracking-tight' }, '정해줘')
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
    h('div', { className: 'flex items-center gap-2' },
      // 🔍 검색 아이콘 — 모든 페이지에서 접근 가능
      h('button', {
        onClick: () => openSearchModal(router),
        title: '검색',
        className: 'w-9 h-9 rounded-full hover:bg-surfaceContainer transition-colors flex items-center justify-center text-onSurfaceVariant hover:text-primary'
      },
        h('span', { className: 'material-symbols-outlined text-[22px]' }, 'search')
      ),
      h('div', { id: 'auth-slot', className: 'flex items-center gap-2' })
    )
  );
}
