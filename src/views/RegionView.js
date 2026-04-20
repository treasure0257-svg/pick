import { h } from '../utils/dom.js';
import { Header } from '../components/Header.js';
import { BottomNav } from '../components/BottomNav.js';
import { PICK_DATA } from '../data.js';
import { REGIONS, countPlacesBySubregion, placesInRegion } from '../regions.js';

export function RegionView({ router, params }) {
  const id = params.get('id');
  const region = REGIONS.find(r => r.id === id);

  // Unknown region → back to home
  if (!region) {
    queueMicrotask(() => router.navigate('#/'));
    return h('div');
  }

  // No subregions defined → redirect to flat results
  if (!region.subregions || region.subregions.length === 0) {
    queueMicrotask(() => router.navigate(`#/results?region=${id}`));
    return h('div');
  }

  const regionCount = placesInRegion(PICK_DATA.places, id).length;
  const subCounts = countPlacesBySubregion(PICK_DATA.places, id);

  const container = h('div', { className: 'flex flex-col min-h-screen' },
    Header(router),
    h('div', { className: 'bg-surfaceContainer h-[1px] w-full' })
  );

  // Hero banner using the region's landmark photo
  container.appendChild(
    h('section', { className: 'relative w-full overflow-hidden', style: { minHeight: '280px' } },
      h('img', { src: region.image, alt: region.label, className: 'absolute inset-0 w-full h-full object-cover' }),
      h('div', { className: 'absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/60' }),
      h('div', { className: 'relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14' },
        h('a', {
          href: '#/',
          className: 'inline-flex items-center gap-1 text-white/90 text-sm font-body hover:text-white mb-4'
        },
          h('span', { className: 'material-symbols-outlined text-[18px]' }, 'arrow_back'),
          '전체 지역'
        ),
        h('h1', {
          className: 'font-headline text-[2.5rem] md:text-[3rem] font-extrabold text-white tracking-tight drop-shadow-lg'
        }, region.label),
        h('p', { className: 'font-body text-sm md:text-base text-white/85 mt-2 drop-shadow' }, region.hint)
      )
    )
  );

  const main = h('main', {
    className: 'flex-grow w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 pb-32 md:pb-12'
  });
  container.appendChild(main);

  // Top bar: "이 지역 전체 보기" shortcut
  main.appendChild(
    h('div', { className: 'flex items-center justify-between mb-6 md:mb-8' },
      h('h2', {
        className: 'font-headline text-xl md:text-2xl font-extrabold text-onSurface tracking-tight'
      }, '세부 지역으로 좁혀보세요'),
      regionCount > 0
        ? h('a', {
            href: `#/results?region=${id}`,
            className: 'inline-flex items-center gap-1.5 bg-surfaceContainerLowest hover:bg-surfaceContainer transition text-onSurface font-body text-sm font-medium py-2 px-4 rounded-full'
          },
            h('span', { className: 'material-symbols-outlined text-[18px]' }, 'list'),
            `전체 ${regionCount}곳 보기`
          )
        : h('span', { className: 'font-label text-xs text-onSurfaceVariant' }, '실제 데이터 준비 중')
    )
  );

  // Sub-region grid
  const subGrid = h('div', {
    className: 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4'
  });

  region.subregions.forEach(sub => {
    const count = subCounts[sub.id] || 0;
    const isEmpty = count === 0;

    const tile = h('a', {
      href: isEmpty ? '#' : `#/results?region=${id}&area=${sub.id}`,
      onClick: isEmpty
        ? (e) => { e.preventDefault(); router.showToast(`${sub.label}은(는) 준비 중입니다.`, 'info'); }
        : null,
      className: `group relative flex flex-col gap-1 p-4 md:p-5 rounded-2xl transition-all ${
        isEmpty
          ? 'bg-surfaceContainerLow text-onSurfaceVariant cursor-default opacity-60'
          : 'bg-surfaceContainerLowest text-onSurface hover:-translate-y-0.5 hover:shadow-[0px_8px_20px_rgba(45,51,53,0.08)]'
      }`
    },
      h('div', { className: 'flex items-center justify-between' },
        h('span', { className: 'font-headline font-bold text-base md:text-lg' }, sub.label),
        h('span', { className: 'font-label text-[11px] text-onSurfaceVariant flex-none ml-2' },
          isEmpty ? '준비 중' : `${count}곳`
        )
      ),
      h('p', { className: 'font-body text-xs md:text-sm text-onSurfaceVariant leading-snug' }, sub.hint)
    );
    subGrid.appendChild(tile);
  });

  main.appendChild(subGrid);

  container.appendChild(BottomNav(router));
  return container;
}
