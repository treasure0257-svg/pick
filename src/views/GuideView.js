import { h } from '../utils/dom.js';
import { Header } from '../components/Header.js';
import { BottomNav } from '../components/BottomNav.js';
import { Footer } from '../components/Footer.js';

const STEPS = [
  { icon: 'home',         title: '1. 홈에서 지역 선택', desc: '17개 시·도 타일 중 가고 싶은 지역을 누르거나 검색창에 직접 입력하세요.' },
  { icon: 'map',          title: '2. 세부 권역 고르기', desc: '시·도 안에서 더 좁은 권역(예: 서울 → 강남·서초 / 홍대·마포)을 선택합니다.' },
  { icon: 'restaurant',   title: '3. 카테고리 탭으로 좁히기', desc: '맛집·카페·즐길거리·숙소 탭 중 원하는 카테고리를 누르면 자동으로 필터됩니다.' },
  { icon: 'near_me',      title: '4. 랜드마크 주변 검색', desc: '"강남경찰서" 처럼 눈 앞에 보이는 건물명을 입력하면 그 주변 1km만 따로 볼 수 있어요.' },
  { icon: 'bookmark',     title: '5. 마음에 들면 저장',   desc: '카드의 저장 버튼을 누르면 "저장됨" 메뉴에 보관됩니다. 로그인 시 기기 간 동기화.' },
  { icon: 'tune',         title: '6. 취향 설정',          desc: '카테고리·무드·예산·기간·음주 선택 → 취향 점수에 맞춘 추천 결과를 받습니다.' }
];

export function GuideView({ router }) {
  const container = h('div', { className: 'flex flex-col min-h-screen' },
    Header(router),
    h('div', { className: 'bg-surfaceContainer h-[1px] w-full' })
  );

  const main = h('main', { className: 'flex-grow max-w-3xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 md:py-16' },
    h('span', { className: 'font-label text-sm text-onSurfaceVariant' }, 'Guide'),
    h('h1', { className: 'font-headline text-3xl md:text-4xl font-extrabold text-onSurface mt-2' }, '사용가이드'),
    h('p', { className: 'font-body text-onSurfaceVariant mt-4' }, '정해줘를 처음 쓰는 분들을 위한 6단계 가이드.'),
    h('ol', { className: 'mt-10 space-y-5' },
      ...STEPS.map(s =>
        h('li', { className: 'flex gap-4 bg-surfaceContainerLowest rounded-2xl p-5' },
          h('div', { className: 'flex-none w-12 h-12 rounded-full bg-primaryContainer text-primary flex items-center justify-center' },
            h('span', { className: 'material-symbols-outlined' }, s.icon)
          ),
          h('div', {},
            h('h3', { className: 'font-headline font-bold text-onSurface' }, s.title),
            h('p', { className: 'font-body text-sm text-onSurfaceVariant mt-1 leading-relaxed' }, s.desc)
          )
        )
      )
    ),
    h('a', {
      href: '#/',
      className: 'inline-flex items-center gap-2 mt-10 bg-primary text-onPrimary font-body font-semibold py-3 px-6 rounded-full hover:shadow-md transition-all'
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
