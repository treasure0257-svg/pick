import { h } from '../utils/dom.js';

export function BottomNav(router) {
  const navLinks = [
    { name: '홈', path: '#/', icon: 'home' },
    { name: '저장됨', path: '#/saved', icon: 'bookmark' },
    { name: '마이', path: '#/mypage', icon: 'person' }
  ];

  const currentPath = window.location.hash || '#/';

  return h('nav', { className: 'md:hidden bg-surface/95 backdrop-blur-xl text-primary text-[11px] font-label font-medium uppercase tracking-wider fixed bottom-0 left-0 w-full z-50 rounded-t-[1.5rem] shadow-[0px_-4px_24px_rgba(45,51,53,0.06)] flex justify-around items-end px-4 pt-2 pb-5' },
    ...navLinks.map(link => {
      const isActive = currentPath === link.path || (link.path !== '#/' && currentPath.startsWith(link.path));
      return h('a', {
        href: link.path,
        className: isActive
          ? 'flex flex-col items-center justify-end text-primary px-4 pt-2 pb-1 relative'
          : 'flex flex-col items-center justify-end text-onSurfaceVariant px-4 pt-2 pb-1 hover:text-onSurface transition-colors'
      },
        // 활성 인디케이터 (상단 짧은 막대)
        isActive
          ? h('span', { className: 'absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] rounded-b-full bg-primary' })
          : null,
        h('span', {
          className: `material-symbols-outlined mb-0.5 transition-all ${isActive ? 'text-[26px] scale-110' : 'text-[22px]'}`,
          style: isActive ? { fontVariationSettings: "'FILL' 1" } : {}
        }, link.icon),
        h('span', { className: isActive ? 'font-bold normal-case text-[12px]' : 'normal-case text-[11px]' }, link.name)
      );
    })
  );
}
