import { h } from '../utils/dom.js';
import { Header } from '../components/Header.js';
import { BottomNav } from '../components/BottomNav.js';
import { RegionMap } from '../components/RegionMap.js';
import { Footer } from '../components/Footer.js';
import { PICK_DATA } from '../data.js';
import { REGIONS, countPlacesBySubregion, placesInRegion, featuredFor } from '../regions.js';
import { keywordSearch, normalizeKakaoPlace, cachePlaces } from '../services/kakaoLocal.js';

export function RegionView({ router, params }) {
  const id = params.get('id');
  const region = REGIONS.find(r => r.id === id);

  if (!region) {
    queueMicrotask(() => router.navigate('#/'));
    return h('div');
  }
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

  // Region hero banner
  container.appendChild(
    h('section', { className: 'relative w-full overflow-hidden', style: { minHeight: '220px' } },
      h('img', { src: region.image, alt: region.label, className: 'absolute inset-0 w-full h-full object-cover' }),
      h('div', { className: 'absolute inset-0 bg-gradient-to-b from-black/40 via-black/25 to-black/60' }),
      h('div', { className: 'relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12' },
        h('a', {
          href: '#/',
          className: 'inline-flex items-center gap-1 text-white/90 text-sm font-body hover:text-white mb-3'
        },
          h('span', { className: 'material-symbols-outlined text-[18px]' }, 'arrow_back'),
          '전체 지역'
        ),
        h('h1', {
          className: 'font-headline text-[2.25rem] md:text-[2.75rem] font-extrabold text-white tracking-tight drop-shadow-lg'
        }, region.label),
        h('p', { className: 'font-body text-sm md:text-base text-white/85 mt-1 drop-shadow' }, region.hint)
      )
    )
  );

  const main = h('main', {
    className: 'flex-grow w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 pb-32 md:pb-12'
  });
  container.appendChild(main);

  // Featured (대표 명소) section — 지역별 큐레이션 장소를 Kakao에서 fetch 해 horizontal scroll 카드로
  const featuredNames = featuredFor(id);
  if (featuredNames.length > 0) {
    const section = h('section', { className: 'mb-10 md:mb-12' });
    section.appendChild(
      h('div', { className: 'flex items-end justify-between mb-4' },
        h('div', {},
          h('span', { className: 'font-label text-xs text-primary uppercase tracking-widest' }, '✨ 이 지역 대표 명소'),
          h('h2', { className: 'font-headline text-xl md:text-2xl font-extrabold text-onSurface tracking-tight mt-1' },
            `${region.label}에서 놓치면 안 되는 곳`
          )
        )
      )
    );

    const scroll = h('div', {
      className: 'flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory'
    });
    section.appendChild(scroll);
    // 로딩 플레이스홀더
    const skeletons = featuredNames.map(() =>
      h('div', {
        className: 'flex-none w-64 h-40 rounded-2xl bg-surfaceContainerLow animate-pulse snap-start'
      })
    );
    skeletons.forEach(s => scroll.appendChild(s));
    main.appendChild(section);

    // Kakao에서 각 명소 개별 검색 (병렬)
    Promise.allSettled(featuredNames.map(name =>
      keywordSearch(`${region.label} ${name}`, { size: 1 })
    )).then(results => {
      scroll.innerHTML = '';
      const places = [];
      results.forEach((r, i) => {
        if (r.status === 'fulfilled' && r.value.length > 0) {
          places.push({ curatedName: featuredNames[i], place: normalizeKakaoPlace(r.value[0]) });
        }
      });
      cachePlaces(places.map(x => x.place));

      if (places.length === 0) {
        scroll.appendChild(
          h('div', { className: 'w-full p-6 text-center text-onSurfaceVariant font-body text-sm' },
            '대표 명소 정보를 불러오지 못했어요.'
          )
        );
        return;
      }

      places.forEach(({ curatedName, place: p }, cardIdx) => {
        // cardIdx는 성공한 것만 누적이라 큐레이션 원본 index와 다를 수 있음. 원본 index를 찾는다.
        const origIdx = featuredNames.indexOf(curatedName);
        const photoPath = origIdx >= 0 ? `/data/featured/${id}_${origIdx}.jpg` : null;

        // Background layer: gradient fallback이 항상 깔려있고 img가 그 위에 overlay.
        // img 로드 실패 시 onerror 로 self-hide → 그라데이션이 보이게 됨.
        const photoImg = photoPath
          ? h('img', {
              src: photoPath,
              alt: curatedName,
              loading: 'lazy',
              className: 'absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105',
              onError: (e) => { e.target.style.display = 'none'; }
            })
          : null;

        const card = h('a', {
          href: `#/place?id=${encodeURIComponent(p.id)}&from=${encodeURIComponent('region:' + id)}`,
          className: 'group flex-none w-64 h-40 relative rounded-2xl overflow-hidden snap-start bg-primaryContainer/40 transition-all hover:-translate-y-0.5 hover:shadow-[0px_10px_24px_rgba(45,51,53,0.14)]'
        },
          // Fallback gradient (always rendered, visible if img fails)
          h('div', {
            className: 'absolute inset-0 bg-gradient-to-br from-primary/50 via-primary/30 to-primary-dim/40'
          }),
          photoImg,
          // Darkening overlay on top (for text readability)
          h('div', { className: 'absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent' }),
          h('div', { className: 'absolute top-3 left-3' },
            h('span', { className: 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/90 text-primary' },
              h('span', { className: 'material-symbols-outlined text-[14px]' }, 'star'),
              '대표'
            )
          ),
          h('div', { className: 'absolute inset-x-0 bottom-0 p-4 text-white' },
            h('h3', { className: 'font-headline font-bold text-base leading-tight drop-shadow truncate' }, curatedName),
            h('p', { className: 'font-label text-[11px] text-white/85 truncate mt-0.5' }, p.address || '')
          )
        );
        scroll.appendChild(card);
      });
    }).catch(e => {
      console.error('[Featured]', e);
    });
  }

  // Top bar
  main.appendChild(
    h('div', { className: 'flex items-center justify-between mb-5 md:mb-7' },
      h('h2', {
        className: 'font-headline text-xl md:text-2xl font-extrabold text-onSurface tracking-tight'
      }, '세부 지역으로 좁혀보세요'),
      h('a', {
        href: `#/results?region=${id}`,
        className: 'inline-flex items-center gap-1.5 bg-surfaceContainerLowest hover:bg-surfaceContainer transition text-onSurface font-body text-sm font-medium py-2 px-4 rounded-full'
      },
        h('span', { className: 'material-symbols-outlined text-[18px]' }, 'list'),
        `${region.label} 전체 보기`
      )
    )
  );

  // 2-column: sub-region tile grid (left) + map (right)
  const subGrid = h('div', { className: 'grid grid-cols-1 sm:grid-cols-2 gap-3' });
  const mapSlot = h('div', {
    className: 'bg-surfaceContainerLowest rounded-2xl overflow-hidden min-h-[420px] md:min-h-[520px] h-full relative'
  });

  const layout = h('div', {
    className: 'grid md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-4 md:gap-6'
  }, subGrid, mapSlot);
  main.appendChild(layout);

  const tileById = new Map();

  // Instantiate the map with a hover callback that highlights the matching tile
  const mapApi = RegionMap({
    regionId: id,
    subregions: region.subregions,
    onSubHover: (subId) => {
      tileById.forEach((el, key) => {
        if (key === subId) el.classList.add('ring-2', 'ring-primary/60', 'bg-primaryContainer');
        else el.classList.remove('ring-2', 'ring-primary/60', 'bg-primaryContainer');
      });
    }
  });
  mapSlot.appendChild(mapApi.el);

  region.subregions.forEach(sub => {
    const tile = h('a', {
      href: `#/results?region=${id}&area=${sub.id}`,
      className: 'group relative flex flex-col gap-1 p-4 rounded-2xl transition-all bg-surfaceContainerLowest text-onSurface hover:shadow-[0px_6px_18px_rgba(45,51,53,0.08)]'
    },
      h('span', { className: 'font-headline font-bold text-base' }, sub.label),
      h('p', { className: 'font-body text-xs text-onSurfaceVariant leading-snug' }, sub.hint)
    );

    tile.addEventListener('mouseenter', () => mapApi.highlightSub(sub.id));
    tile.addEventListener('mouseleave', () => mapApi.clearHighlight());

    tileById.set(sub.id, tile);
    subGrid.appendChild(tile);
  });

  container.appendChild(Footer());
  container.appendChild(BottomNav(router));
  return container;
}
