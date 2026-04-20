import { h } from '../utils/dom.js';

export function BottomNav(router) {
  const navLinks = [
    { name: '홈', path: '#/', icon: 'home' },
    { name: '취향', path: '#/preferences', icon: 'tune' },
    { name: '토너먼트', path: '#/tournament', icon: 'swords' },
    { name: '저장됨', path: '#/saved', icon: 'bookmark' }
  ];

  const currentPath = window.location.hash || '#/';

  return h('nav', { className: 'md:hidden bg-surface/80 backdrop-blur-xl text-primary text-[11px] font-label font-medium uppercase tracking-wider fixed bottom-0 left-0 w-full z-50 rounded-t-[1.5rem] shadow-[0px_-4px_24px_rgba(45,51,53,0.04)] flex justify-around items-center px-4 pt-3 pb-6' },
    ...navLinks.map(link => {
      const isActive = currentPath === link.path || (link.path !== '#/' && currentPath.startsWith(link.path));
      return h('a', { 
        href: link.path, 
        className: isActive 
          ? 'flex flex-col items-center text-primary bg-primary/10 rounded-2xl px-4 py-2'
          : 'flex flex-col items-center text-onSurfaceVariant px-4 py-2'
      },
        h('span', { 
          className: 'material-symbols-outlined mb-1',
          style: isActive ? { fontVariationSettings: "'FILL' 1" } : {}
        }, link.icon),
        h('span', {}, link.name)
      );
    })
  );
}
