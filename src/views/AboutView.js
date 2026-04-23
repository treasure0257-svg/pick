import { h } from '../utils/dom.js';
import { Header } from '../components/Header.js';
import { BottomNav } from '../components/BottomNav.js';
import { Footer } from '../components/Footer.js';

export function AboutView({ router }) {
  const container = h('div', { className: 'flex flex-col min-h-screen' },
    Header(router),
    h('div', { className: 'bg-surfaceContainer h-[1px] w-full' })
  );

  const main = h('main', { className: 'flex-grow max-w-3xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 md:py-16' },
    h('span', { className: 'font-label text-sm text-onSurfaceVariant' }, 'About'),
    h('h1', { className: 'font-headline text-3xl md:text-4xl font-extrabold text-onSurface mt-2' }, '소개'),
    h('p', { className: 'font-body text-onSurfaceVariant mt-4 text-base leading-relaxed' },
      '"정해줘"는 결정장애를 위한 디지털 컨시어지에서 출발한, 바쁜 현대인을 위한 정보집합소입니다. ',
      '전국 17개 시·도의 실시간 맛집·카페·관광지·숙소 데이터를 ',
      '지역과 키워드, 그리고 취향으로 좁혀 오늘 어디로 갈지 대신 정해드립니다.'
    ),
    h('section', { className: 'mt-10 grid gap-6 md:grid-cols-2' },
      h('div', { className: 'bg-surfaceContainerLowest rounded-2xl p-6' },
        h('h2', { className: 'font-headline font-bold text-lg text-onSurface' }, '미션'),
        h('p', { className: 'font-body text-sm text-onSurfaceVariant mt-2 leading-relaxed' },
          '주말마다 "어디 가지?" 에 들이는 시간을 1시간에서 1분으로 줄인다.'
        )
      ),
      h('div', { className: 'bg-surfaceContainerLowest rounded-2xl p-6' },
        h('h2', { className: 'font-headline font-bold text-lg text-onSurface' }, '데이터'),
        h('p', { className: 'font-body text-sm text-onSurfaceVariant mt-2 leading-relaxed' },
          'Kakao Local API + Naver Local/Image/Blog 를 기반으로 권역마다 수백 개 장소를 실시간으로 가져옵니다.'
        )
      )
    ),
    h('p', { className: 'font-body text-sm text-onSurfaceVariant mt-10' },
      '운영: ', h('a', { href: 'mailto:it@neotis.co.kr', className: 'text-primary hover:underline' }, 'Neotis · it@neotis.co.kr')
    )
  );

  container.appendChild(main);
  container.appendChild(Footer());
  container.appendChild(BottomNav(router));
  return container;
}
