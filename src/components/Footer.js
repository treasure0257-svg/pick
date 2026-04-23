import { h } from '../utils/dom.js';

const LINKS = [
  { label: '소개',         href: '#/about' },
  { label: '사용가이드',   href: '#/guide' },
  { label: '문의',         href: 'mailto:it@neotis.co.kr' },
  { label: '개인정보처리방침', href: '#/privacy' },
  { label: '이용약관',     href: '#/terms' }
];

export function Footer() {
  const year = new Date().getFullYear();
  return h('footer', {
    className: 'mt-16 md:mt-24 mb-24 md:mb-0 border-t border-surfaceContainer bg-surfaceContainerLowest text-onSurfaceVariant'
  },
    h('div', { className: 'max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12 flex flex-col items-center gap-4 text-center' },
      h('nav', { className: 'flex items-center gap-2 md:gap-3 flex-wrap justify-center font-body text-sm' },
        ...LINKS.flatMap((link, i) => {
          const items = [
            h('a', {
              href: link.href,
              className: 'hover:text-primary transition-colors px-1'
            }, link.label)
          ];
          if (i < LINKS.length - 1) {
            items.push(h('span', { className: 'text-onSurfaceVariant/40 select-none' }, '·'));
          }
          return items;
        })
      ),
      h('p', { className: 'font-headline text-base md:text-lg text-onSurface flex items-center gap-3 mt-2' },
        h('span', {}, '여행을 떠나요'),
        h('span', { className: 'text-onSurfaceVariant/40' }, '|'),
        h('a', { href: '#/', className: 'hover:text-primary transition-colors' }, '숙소 검색')
      ),
      h('p', { className: 'font-label text-xs text-onSurfaceVariant/70 mt-4' },
        `© ${year} Neotis · 정해줘 · pick-concierge.web.app`
      )
    )
  );
}
