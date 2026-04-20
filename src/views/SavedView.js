import { h } from '../utils/dom.js';
import { Header } from '../components/Header.js';
import { BottomNav } from '../components/BottomNav.js';
import { PICK_DATA } from '../data.js';
import { AppState, STORAGE_KEYS, unsavePlace } from '../App.js';

export function SavedView({ router }) {
  const container = h('div', { className: 'flex flex-col min-h-screen' },
    Header(router),
    h('div', { className: 'bg-surfaceContainer h-[1px] w-full' })
  );

  const main = h('main', { className: 'flex-grow max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 md:py-14 pb-32 md:pb-14' });
  container.appendChild(main);
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
  const savedPlaces = savedIds.map(id => PICK_DATA.places.find(p => p.id === id)).filter(Boolean);

  const grid = h('div', { className: 'grid sm:grid-cols-2 lg:grid-cols-3 gap-6' });

  if (savedPlaces.length === 0) {
    main.appendChild(
      h('div', { className: 'text-center py-20 bg-surfaceContainerLowest rounded-3xl border border-dashed border-surfaceContainerHighest' },
        h('span', { className: 'material-symbols-outlined text-5xl text-onSurfaceVariant mb-4' }, 'bookmark_border'),
        h('h3', { className: 'font-headline text-xl font-bold text-onSurface' }, '저장된 장소가 없어요'),
        h('p', { className: 'font-body text-onSurfaceVariant mt-2 max-w-sm mx-auto' }, '마음에 드는 장소를 발견하면 북마크 아이콘을 눌러 이곳에 저장해보세요.'),
        h('a', { href: '#/', className: 'inline-flex items-center gap-2 mt-6 bg-secondaryContainer text-onSecondaryContainer font-body font-semibold py-3 px-6 rounded-xl hover:bg-secondaryFixedDim transition-colors' },
          '추천 받으러 가기'
        )
      )
    );
  } else {
    savedPlaces.forEach(p => {
      const catLabel = PICK_DATA.categories.find(c => c.id === p.category)?.label || '';
      
      const card = h('article', { className: 'card-lift bg-surfaceContainerLowest rounded-2xl overflow-hidden flex flex-col group relative' },
        h('div', { className: 'relative h-48 overflow-hidden' },
          h('img', { src: p.image, loading: 'lazy', className: 'w-full h-full object-cover group-hover:scale-105 transition-transform duration-700' }),
          h('button', { 
            className: 'absolute top-4 right-4 w-10 h-10 rounded-full bg-surface/80 backdrop-blur flex items-center justify-center text-primary shadow-sm hover:scale-110 transition-transform',
            title: '저장 취소',
            onClick: () => {
              unsavePlace(p.id);
              card.remove();
              router.showToast('저장 취소되었습니다.');
              // Check if empty
              if (grid.children.length === 0) {
                router.navigate('#/saved'); // reload view to show empty state
              }
            }
          }, h('span', { className: 'material-symbols-outlined', style: { fontVariationSettings: "'FILL' 1" } }, 'bookmark'))
        ),
        h('div', { className: 'p-6 flex-grow flex flex-col' },
          h('span', { className: 'font-label text-xs text-primary uppercase tracking-widest' }, catLabel),
          h('h3', { className: 'font-headline text-xl font-bold text-onSurface mt-1' }, p.name),
          h('p', { className: 'font-body text-sm text-onSurfaceVariant mt-2 line-clamp-2 flex-grow' }, p.blurb),
          h('div', { className: 'mt-4 pt-4 border-t border-surfaceContainer' },
            h('a', { 
              href: `https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`,
              target: '_blank',
              className: 'text-onSurfaceVariant hover:text-primary transition-colors inline-flex items-center gap-2 text-sm font-medium w-full justify-center'
            }, h('span', { className: 'material-symbols-outlined text-[18px]' }, 'map'), '길찾기')
          )
        )
      );
      grid.appendChild(card);
    });
    main.appendChild(grid);
  }

  return container;
}
