import { h } from '../utils/dom.js';
import { Header } from '../components/Header.js';
import { BottomNav } from '../components/BottomNav.js';
import { Footer } from '../components/Footer.js';
import { PICK_DATA } from '../data.js';
import { AppState, STORAGE_KEYS, unsavePlace } from '../App.js';
import { auth } from '../firebase-setup.js';
import { getCachedPlace } from '../services/kakaoLocal.js';
import { categoryMeta, makeSaveBtn } from '../utils/place-ui.js';

export function SavedView({ router }) {
  const container = h('div', { className: 'flex flex-col min-h-screen' },
    Header(router),
    h('div', { className: 'bg-surfaceContainer h-[1px] w-full' })
  );

  const main = h('main', { className: 'flex-grow max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 md:py-14 pb-32 md:pb-14' });
  container.appendChild(main);
  container.appendChild(Footer());
  container.appendChild(BottomNav(router));

  main.appendChild(
    h('div', { className: 'mb-10 flex items-end justify-between' },
      h('div', {},
        h('h1', { className: 'font-headline text-[2.5rem] md:text-[3rem] leading-tight tracking-tight font-extrabold text-onSurface' }, '저장됨'),
        h('p', { className: 'font-body text-onSurfaceVariant mt-2' }, '나중에 가볼 곳으로 보관해둔 장소들입니다.')
      )
    )
  );

  const savedIds = AppState.get(STORAGE_KEYS.saved, []);
  // 정적 PICK_DATA + Kakao/Naver 캐시에서 조회 (최근 방문한 장소는 캐시에 있음)
  const savedPlaces = savedIds
    .map(id => {
      const cached = getCachedPlace(id);
      if (cached) return cached;
      const local = PICK_DATA.places.find(p => p.id === id);
      if (local) {
        return {
          id: local.id, name: local.name, address: local.address || '',
          category: null, categoryLabel: '', image: local.image || null,
          phone: '', placeUrl: null, lat: local.lat, lng: local.lng,
          blurb: local.blurb || ''
        };
      }
      return null;
    })
    .filter(Boolean);

  const isLoggedIn = Boolean(auth?.currentUser);

  if (savedPlaces.length === 0) {
    main.appendChild(
      h('div', { className: 'text-center py-16 md:py-24 bg-surfaceContainerLowest rounded-3xl border border-dashed border-surfaceContainerHighest px-6' },
        // 큰 일러스트 느낌
        h('div', { className: 'relative w-24 h-24 md:w-32 md:h-32 mx-auto mb-6' },
          h('div', { className: 'absolute inset-0 bg-gradient-to-br from-primary-dim/20 to-primaryContainer/40 rounded-full blur-xl' }),
          h('div', { className: 'relative w-full h-full rounded-full bg-gradient-to-br from-primaryContainer to-primary-dim/40 flex items-center justify-center text-primary shadow-inner' },
            h('span', { className: 'material-symbols-outlined text-[56px] md:text-[72px]' }, 'bookmark')
          )
        ),
        h('h3', { className: 'font-headline text-2xl md:text-3xl font-extrabold text-onSurface' }, '저장된 핫플이 없어요 텅~'),
        h('p', { className: 'font-body text-onSurfaceVariant mt-3 max-w-md mx-auto leading-relaxed' },
          '마음에 드는 장소를 발견하면 카드의 ',
          h('span', { className: 'inline-flex items-center gap-0.5 mx-1 px-1.5 py-0.5 rounded-md bg-surfaceContainer text-primary font-semibold text-xs' },
            h('span', { className: 'material-symbols-outlined text-[14px]' }, 'bookmark_add'), '저장'
          ),
          '버튼을 눌러 나만의 컬렉션을 만들어보세요.'
        ),

        isLoggedIn
          ? h('a', {
              href: '#/',
              className: 'inline-flex items-center gap-2 mt-8 bg-primary text-onPrimary font-body font-semibold py-3 px-8 rounded-full hover:shadow-md transition-all'
            },
              h('span', { className: 'material-symbols-outlined' }, 'explore'),
              '추천 장소 둘러보기'
            )
          : h('div', { className: 'mt-8 flex flex-col items-center gap-2' },
              h('a', {
                href: '#/login',
                className: 'inline-flex items-center gap-2 bg-primary text-onPrimary font-body font-semibold py-3 px-8 rounded-full hover:shadow-md transition-all'
              },
                h('span', { className: 'material-symbols-outlined' }, 'login'),
                '1초 만에 로그인하고 나만의 컬렉션 만들기'
              ),
              h('p', { className: 'font-label text-xs text-onSurfaceVariant' },
                '로그인 없이도 저장 가능하지만, 로그인하면 기기 간 동기화됩니다.'
              )
            )
      )
    );
    return container;
  }

  // 저장된 장소 그리드
  const grid = h('div', { className: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6' });

  savedPlaces.forEach(p => {
    const cat = categoryMeta(p.category);
    const card = h('article', {
      className: 'card-lift bg-surfaceContainerLowest rounded-2xl overflow-hidden flex flex-col group relative'
    },
      h('div', { className: 'relative h-40 md:h-48 overflow-hidden bg-gradient-to-br from-primaryContainer/60 via-primaryContainer/30 to-primary-dim/30 flex items-center justify-center text-primary' },
        p.image
          ? h('img', { src: p.image, loading: 'lazy', className: 'w-full h-full object-cover group-hover:scale-105 transition-transform duration-700' })
          : h('span', { className: 'material-symbols-outlined text-[48px] opacity-70' }, cat.icon),
        h('button', {
          className: 'absolute top-3 right-3 w-10 h-10 rounded-full bg-white/90 backdrop-blur flex items-center justify-center text-primary shadow-sm hover:scale-110 transition-transform',
          title: '저장 취소',
          onClick: (e) => {
            e.preventDefault();
            e.stopPropagation();
            unsavePlace(p.id);
            card.remove();
            router.showToast('저장 취소되었습니다.');
            if (grid.children.length === 0) router.navigate('#/saved');
          }
        },
          h('span', { className: 'material-symbols-outlined', style: { fontVariationSettings: "'FILL' 1" } }, 'bookmark')
        )
      ),
      h('a', {
        href: `#/place?id=${encodeURIComponent(p.id)}`,
        className: 'p-5 flex-grow flex flex-col'
      },
        h('span', {
          className: `inline-flex self-start items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${cat.accent} mb-2`
        },
          h('span', { className: 'material-symbols-outlined text-[13px]' }, cat.icon),
          p.categoryLabel || cat.label
        ),
        h('h3', { className: 'font-headline text-lg font-bold text-onSurface truncate' }, p.name),
        h('p', { className: 'font-body text-xs text-onSurfaceVariant mt-1 truncate' }, p.address || p.blurb || '')
      )
    );
    grid.appendChild(card);
  });
  main.appendChild(grid);

  return container;
}
