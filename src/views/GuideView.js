import { h } from '../utils/dom.js';
import { Header } from '../components/Header.js';
import { BottomNav } from '../components/BottomNav.js';
import { Footer } from '../components/Footer.js';
import { renderGuideContent } from '../components/info-modals.js';

export function GuideView({ router }) {
  const container = h('div', { className: 'flex flex-col min-h-screen' },
    Header(router),
    h('div', { className: 'bg-surfaceContainer h-[1px] w-full' })
  );

  const main = h('main', { className: 'flex-grow max-w-3xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 md:py-16' },
    h('span', { className: 'font-label text-sm text-onSurfaceVariant' }, 'Guide'),
    h('h1', { className: 'font-headline text-3xl md:text-4xl font-extrabold text-onSurface mt-2 mb-6' }, '사용가이드'),
    renderGuideContent(),
    h('a', {
      href: '#/',
      className: 'inline-flex items-center gap-2 mt-8 bg-primary text-onPrimary font-body font-semibold py-3 px-6 rounded-full hover:shadow-md transition-all'
    },
      h('span', { className: 'material-symbols-outlined' }, 'arrow_back'),
      '홈에서 시작하기'
    )
  );

  container.appendChild(main);
  container.appendChild(Footer());
  container.appendChild(BottomNav(router));
  return container;
}
