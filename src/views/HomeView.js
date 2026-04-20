import { h } from '../utils/dom.js';
import { Header } from '../components/Header.js';
import { BottomNav } from '../components/BottomNav.js';
import { PICK_DATA } from '../data.js';
import { REGIONS, countPlacesByRegion, regionFromAddress } from '../regions.js';

export function HomeView({ router }) {
  const counts = countPlacesByRegion(PICK_DATA.places);

  const searchInput = h('input', {
    type: 'search',
    placeholder: '지역·장소·키워드 검색 (예: 서울, 성수 카페, 데이트)',
    className: 'w-full bg-transparent outline-none font-body text-base md:text-lg text-onSurface placeholder:text-onSurfaceVariant/60 py-4 pr-4'
  });

  const searchResults = h('div', {
    className: 'mt-4 bg-surfaceContainerLowest rounded-2xl shadow-[0px_8px_24px_rgba(45,51,53,0.08)] overflow-hidden hidden'
  });

  const regionGrid = h('div', {
    className: 'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4'
  });

  function matchScore(query, place) {
    const q = query.toLowerCase();
    const region = regionFromAddress(place.address);
    const regionLabel = REGIONS.find(r => r.id === region)?.label || '';
    const haystack = [
      place.name, place.blurb, place.address, regionLabel,
      ...(place.moods || []).map(id => PICK_DATA.moods.find(m => m.id === id)?.label || ''),
      PICK_DATA.categories.find(c => c.id === place.category)?.label || ''
    ].join(' ').toLowerCase();
    return haystack.includes(q) ? 1 : 0;
  }

  function renderRegionGrid(filterLabelQuery = '') {
    regionGrid.innerHTML = '';
    const q = filterLabelQuery.trim().toLowerCase();
    const visible = q
      ? REGIONS.filter(r => r.label.toLowerCase().includes(q) || r.id.toLowerCase().includes(q))
      : REGIONS;

    visible.forEach(r => {
      const count = counts[r.id] || 0;
      const isEmpty = count === 0;
      const tile = h('a', {
        href: isEmpty ? '#' : `#/results?region=${r.id}`,
        onClick: isEmpty ? (e) => { e.preventDefault(); router.showToast(`${r.label}은(는) 준비 중입니다.`, 'info'); } : null,
        className: `group relative block aspect-square rounded-2xl overflow-hidden transition-all ${
          isEmpty
            ? 'opacity-55 cursor-default'
            : 'hover:-translate-y-0.5 hover:shadow-[0px_12px_28px_rgba(45,51,53,0.12)]'
        }`
      },
        h('img', {
          src: r.image,
          alt: r.label,
          loading: 'lazy',
          className: `absolute inset-0 w-full h-full object-cover ${isEmpty ? 'grayscale' : 'group-hover:scale-105 transition-transform duration-700'}`
        }),
        h('div', { className: 'absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent' }),
        h('div', { className: 'absolute inset-x-0 bottom-0 p-3 md:p-4 flex flex-col gap-0.5 text-white' },
          h('span', { className: 'font-headline font-bold text-base md:text-lg leading-tight drop-shadow' }, r.label),
          h('span', { className: 'font-label text-[11px] text-white/80 truncate' },
            isEmpty ? '준비 중' : `${count}곳 · ${r.hint}`
          )
        )
      );
      regionGrid.appendChild(tile);
    });

    if (visible.length === 0) {
      regionGrid.appendChild(
        h('div', { className: 'col-span-full text-center py-8 text-onSurfaceVariant font-body text-sm' },
          `"${filterLabelQuery}"과(와) 일치하는 지역이 없습니다.`)
      );
    }
  }

  function renderSearch() {
    const q = searchInput.value.trim();
    searchResults.innerHTML = '';

    if (!q) {
      searchResults.classList.add('hidden');
      renderRegionGrid('');
      return;
    }

    const placeMatches = PICK_DATA.places.filter(p => matchScore(q, p) > 0).slice(0, 6);
    const regionMatches = REGIONS.filter(r =>
      r.label.toLowerCase().includes(q.toLowerCase()) ||
      r.id.toLowerCase().includes(q.toLowerCase())
    );

    renderRegionGrid(q);

    if (placeMatches.length === 0 && regionMatches.length === 0) {
      searchResults.classList.remove('hidden');
      searchResults.appendChild(
        h('div', { className: 'p-6 text-center text-onSurfaceVariant font-body text-sm' },
          `"${q}" 관련 결과가 아직 없어요. 데이터는 점차 늘어납니다.`)
      );
      return;
    }

    searchResults.classList.remove('hidden');

    if (regionMatches.length > 0) {
      searchResults.appendChild(
        h('div', { className: 'px-5 pt-4 pb-2 font-label text-xs text-onSurfaceVariant uppercase tracking-widest' }, '지역')
      );
      regionMatches.forEach(r => {
        const count = counts[r.id] || 0;
        const row = h('a', {
          href: count > 0 ? `#/results?region=${r.id}` : '#',
          onClick: count === 0 ? (e) => { e.preventDefault(); router.showToast(`${r.label}은(는) 준비 중입니다.`, 'info'); } : null,
          className: 'flex items-center gap-3 px-5 py-3 hover:bg-surfaceContainerLow transition-colors'
        },
          h('span', { className: 'material-symbols-outlined text-primary' }, r.icon),
          h('span', { className: 'font-body font-medium text-onSurface flex-grow' }, r.label),
          h('span', { className: 'font-label text-xs text-onSurfaceVariant' },
            count > 0 ? `${count}곳` : '준비 중'
          )
        );
        searchResults.appendChild(row);
      });
    }

    if (placeMatches.length > 0) {
      searchResults.appendChild(
        h('div', { className: 'px-5 pt-4 pb-2 font-label text-xs text-onSurfaceVariant uppercase tracking-widest' }, '장소')
      );
      placeMatches.forEach(p => {
        const row = h('a', {
          href: `#/results?place=${p.id}`,
          className: 'flex items-center gap-4 px-5 py-3 hover:bg-surfaceContainerLow transition-colors'
        },
          h('img', { src: p.image, alt: p.name, className: 'w-12 h-12 rounded-lg object-cover flex-none' }),
          h('div', { className: 'flex-grow min-w-0' },
            h('div', { className: 'font-body font-semibold text-onSurface truncate' }, p.name),
            h('div', { className: 'font-label text-xs text-onSurfaceVariant truncate' }, p.address)
          ),
          h('span', { className: 'font-label text-xs text-onSurfaceVariant flex-none' }, `★ ${p.rating}`)
        );
        searchResults.appendChild(row);
      });
    }
  }

  searchInput.addEventListener('input', renderSearch);
  renderRegionGrid('');

  return h('div', { className: 'flex flex-col min-h-screen' },
    Header(router),
    h('div', { className: 'bg-surfaceContainer h-[1px] w-full' }),

    h('main', { className: 'flex-grow w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 pb-32 md:pb-16' },

      h('section', { className: 'text-center mb-10 md:mb-14' },
        h('span', { className: 'inline-block bg-secondaryContainer text-onSecondaryContainer text-xs font-medium px-3 py-1 rounded-full mb-4' },
          '바쁜 현대인을 위한 정보집합소'
        ),
        h('h1', { className: 'font-headline text-[2.5rem] md:text-[3.25rem] leading-[1.05] tracking-[-0.02em] font-extrabold text-onSurface' },
          h('span', { className: 'text-primary' }, '어디로'), ' 갈지 고민 중이신가요?'
        ),
        h('p', { className: 'font-body text-base md:text-lg text-onSurfaceVariant mt-4 max-w-xl mx-auto leading-relaxed' },
          '지역을 고르거나, 장소·키워드로 검색하세요. 당신의 소중한 하루가 결정됩니다.'
        )
      ),

      h('section', { className: 'mb-10 md:mb-14' },
        h('div', {
          className: 'relative flex items-center bg-surfaceContainerLowest rounded-[2rem] shadow-[0px_8px_24px_rgba(45,51,53,0.06)] pl-6 pr-2 focus-within:ring-2 focus-within:ring-primary/30'
        },
          h('span', { className: 'material-symbols-outlined text-onSurfaceVariant text-2xl flex-none' }, 'search'),
          searchInput
        ),
        searchResults
      ),

      h('section', { className: 'mb-12 md:mb-16' },
        h('div', { className: 'flex items-end justify-between mb-5' },
          h('h2', { className: 'font-headline text-xl md:text-2xl font-extrabold text-onSurface tracking-tight' }, '지역으로 고르기'),
          h('span', { className: 'font-label text-xs text-onSurfaceVariant' }, '전국 17개 시·도')
        ),
        regionGrid
      ),

      h('section', {},
        h('div', { className: 'bg-surfaceContainerLowest rounded-[2rem] p-8 md:p-10 flex flex-col md:flex-row md:items-center gap-6 md:gap-10' },
          h('div', { className: 'flex-grow' },
            h('span', { className: 'font-label text-xs text-primary uppercase tracking-widest' }, '취향으로 좁히기'),
            h('h3', { className: 'font-headline text-2xl md:text-3xl font-bold text-onSurface mt-2 tracking-tight' },
              '카테고리·무드·예산을 정하면 ', h('br', { className: 'hidden md:block' }),
              '맞춤 추천을 드려요.'
            ),
            h('p', { className: 'font-body text-sm md:text-base text-onSurfaceVariant mt-3 leading-relaxed' },
              '몇 가지 질문으로 당신의 오늘을 좁혀갑니다.'
            )
          ),
          h('a', {
            href: '#/preferences',
            className: 'inline-flex items-center justify-center gap-2 bg-gradient-to-br from-primary to-primary-dim text-onPrimary font-body font-semibold py-4 px-8 rounded-xl hover:shadow-[0px_12px_32px_rgba(45,51,53,0.12)] transition-all duration-300 hover:-translate-y-0.5 flex-none'
          },
            h('span', { className: 'material-symbols-outlined' }, 'tune'),
            '취향 설정 시작'
          )
        )
      )
    ),

    BottomNav(router)
  );
}
