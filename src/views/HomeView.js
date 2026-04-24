import { h } from '../utils/dom.js';
import { Header } from '../components/Header.js';
import { BottomNav } from '../components/BottomNav.js';
import { Footer } from '../components/Footer.js';
import { WeatherWidget } from '../components/WeatherWidget.js';
import { PICK_DATA } from '../data.js';
import { REGIONS, countPlacesByRegion, regionFromAddress } from '../regions.js';
import { AppState, STORAGE_KEYS, getRecentRegions } from '../App.js';

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
      const tile = h('a', {
        href: `#/region?id=${r.id}`,
        className: 'group relative block aspect-square rounded-2xl overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-[0px_12px_28px_rgba(45,51,53,0.12)]'
      },
        h('img', {
          src: r.image,
          alt: r.label,
          loading: 'lazy',
          className: 'absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700'
        }),
        h('div', { className: 'absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent' }),
        h('div', { className: 'absolute inset-x-0 bottom-0 p-3 md:p-4 flex flex-col gap-0.5 text-white' },
          h('span', { className: 'font-headline font-bold text-base md:text-lg leading-tight drop-shadow' }, r.label),
          h('span', { className: 'font-label text-[11px] text-white/80 truncate' }, r.hint)
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
        const row = h('a', {
          href: `#/region?id=${r.id}`,
          className: 'flex items-center gap-3 px-5 py-3 hover:bg-surfaceContainerLow transition-colors'
        },
          h('span', { className: 'material-symbols-outlined text-primary' }, r.icon),
          h('span', { className: 'font-body font-medium text-onSurface flex-grow' }, r.label),
          h('span', { className: 'font-label text-xs text-onSurfaceVariant' }, r.hint)
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

    // Full-width hanok hero
    h('section', {
      className: 'relative w-full overflow-hidden',
      style: { minHeight: '480px' }
    },
      // 라이트 모드: 경복궁 주간 / 다크 모드: 반포대교 야경 — Tailwind dark: prefix 로 자동 swap
      h('img', {
        src: '/hero-hanok.jpg',
        alt: '한옥 전경',
        className: 'absolute inset-0 w-full h-full object-cover dark:hidden'
      }),
      h('img', {
        src: '/hero-hanok-night.jpg',
        alt: '서울 야경 — 반포대교 무지개분수',
        className: 'absolute inset-0 w-full h-full object-cover hidden dark:block'
      }),
      h('div', { className: 'absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/60 dark:from-black/35 dark:via-black/20 dark:to-black/55' }),
      h('div', { className: 'relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 md:pt-20 pb-10 md:pb-16' },
        h('div', { className: 'text-center text-white' },
          h('span', { className: 'inline-block bg-white/15 backdrop-blur-sm text-white text-xs font-medium px-3 py-1 rounded-full mb-4 border border-white/20' },
            '바쁜 현대인을 위한 정보집합소'
          ),
          h('h1', { className: 'font-headline text-[2.75rem] md:text-[3.5rem] leading-[1.05] tracking-[-0.02em] font-extrabold whitespace-nowrap drop-shadow-lg' },
            h('span', { className: 'text-[#C4B5FD]' }, '어디로'), ' 갈까요?'
          ),
          h('p', { className: 'font-body text-base md:text-lg text-white/90 mt-4 max-w-md mx-auto leading-relaxed drop-shadow' },
            h('span', { className: 'block' }, '지역을 고르거나 장소·키워드로 검색하세요.'),
            h('span', { className: 'block' }, '당신의 소중한 하루가 결정됩니다.')
          )
        ),
        h('div', { className: 'mt-8 md:mt-10 max-w-3xl mx-auto' },
          h('div', {
            className: 'relative flex items-center bg-white rounded-[2rem] shadow-[0px_12px_32px_rgba(0,0,0,0.2)] pl-6 pr-2 focus-within:ring-2 focus-within:ring-primary/40'
          },
            h('span', { className: 'material-symbols-outlined text-onSurfaceVariant text-2xl flex-none' }, 'search'),
            searchInput
          ),
          searchResults
        )
      )
    ),

    h('main', { className: 'flex-grow w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14 pb-32 md:pb-16' },

      // 최근 본 권역 chip — 데이터가 있을 때만 노출
      (function () {
        const recent = getRecentRegions();
        if (recent.length === 0) return null;
        const wrap = h('section', { className: 'mb-8 md:mb-10' });
        wrap.appendChild(h('div', { className: 'flex items-center gap-2 mb-3' },
          h('span', { className: 'material-symbols-outlined text-[18px] text-onSurfaceVariant' }, 'history'),
          h('h2', { className: 'font-headline text-sm font-bold text-onSurfaceVariant uppercase tracking-wider' }, '최근 본 권역')
        ));
        const chips = h('div', { className: 'flex flex-wrap gap-2' });
        recent.forEach(key => {
          const [rid, aid] = key.split(':');
          const r = REGIONS.find(x => x.id === rid);
          if (!r) return;
          const sub = aid ? r.subregions?.find(s => s.id === aid) : null;
          const label = sub ? `${r.label} · ${sub.label}` : r.label;
          const href = sub ? `#/results?region=${rid}&area=${aid}` : `#/region?id=${rid}`;
          chips.appendChild(
            h('a', {
              href,
              className: 'inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full text-sm font-body bg-surfaceContainerLowest text-onSurface border border-surfaceContainerHighest hover:border-primary/40 transition-colors'
            },
              h('span', { className: 'material-symbols-outlined text-[16px] text-onSurfaceVariant' }, sub ? 'place' : (r.icon || 'location_city')),
              label
            )
          );
        });
        wrap.appendChild(chips);
        return wrap;
      })(),

      // 오늘 누구랑? + 날씨 위젯(가로 pill) — 타이틀 옆 inline 배치
      (function () {
        const wrap = h('section', { className: 'mb-10 md:mb-14' });
        // 타이틀 + 가로 pill 날씨 한 줄 (mobile 은 wrap)
        const titleRow = h('div', { className: 'flex flex-wrap items-center gap-x-4 gap-y-2' },
          h('h2', { className: 'font-headline text-xl md:text-2xl font-extrabold text-onSurface tracking-tight' }, '오늘 누구랑 가세요?'),
          WeatherWidget({ compact: true })
        );
        const subCopy = h('div', { className: 'flex items-center justify-between gap-3 mt-1' },
          h('p', { className: 'font-body text-xs md:text-sm text-onSurfaceVariant' }, '동행을 알려주면 그에 맞는 장소를 우선 추천해드려요.'),
          h('a', { href: '#/mypage', className: 'hidden md:inline-flex items-center gap-1 text-xs text-onSurfaceVariant hover:text-primary flex-none' },
            '더 자세한 취향',
            h('span', { className: 'material-symbols-outlined text-[14px]' }, 'chevron_right')
          )
        );
        const chipsRow = h('div', { className: 'flex flex-wrap gap-2 md:gap-3 mt-5' });

        function renderChips() {
          chipsRow.innerHTML = '';
          const prefs = AppState.get(STORAGE_KEYS.preferences, {}) || {};
          const current = prefs.companion || null;
          PICK_DATA.companions.forEach(c => {
            const selected = current === c.id;
            const btn = h('button', {
              className: `inline-flex items-center gap-1.5 py-2.5 px-4 rounded-full font-body text-sm font-medium transition-colors border ${
                selected
                  ? 'bg-primary text-onPrimary border-primary shadow-sm'
                  : 'bg-surfaceContainerLowest text-onSurface border-surfaceContainerHighest hover:border-primary/40'
              }`,
              onClick: () => {
                const next = AppState.get(STORAGE_KEYS.preferences, {}) || {};
                next.companion = selected ? null : c.id; // 같은 거 다시 누르면 해제
                AppState.set(STORAGE_KEYS.preferences, next);
                renderChips();
              }
            },
              h('span', { className: 'material-symbols-outlined text-[18px]' }, c.icon),
              c.label
            );
            chipsRow.appendChild(btn);
          });
        }
        renderChips();

        // 새 레이아웃 (단일 컬럼): 타이틀+inline 날씨 → 서브카피 → chip → 빠른 필터
        wrap.appendChild(titleRow);
        wrap.appendChild(subCopy);
        wrap.appendChild(chipsRow);

        // 빠른 필터 row — 반려동물 동반 토글 (즉시 저장)
        (function () {
          const filterRow = h('div', { className: 'mt-3 flex items-center gap-2 flex-wrap' });
          filterRow.appendChild(
            h('span', { className: 'font-label text-[11px] uppercase tracking-wider text-onSurfaceVariant mr-1' }, '빠른 필터')
          );
          const petBtn = h('button', { type: 'button' });
          function paintPet() {
            const on = !!(AppState.get(STORAGE_KEYS.preferences, {}) || {}).petFriendly;
            petBtn.className = `inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full font-body text-xs font-medium transition-colors border ${
              on
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-surfaceContainerLowest text-onSurface border-surfaceContainerHighest hover:border-emerald-500/40'
            }`;
            petBtn.innerHTML = '';
            petBtn.appendChild(h('span', { className: 'material-symbols-outlined text-[16px]', style: on ? { fontVariationSettings: "'FILL' 1" } : {} }, 'pets'));
            petBtn.appendChild(h('span', {}, on ? '반려동물 동반 ON' : '반려동물 동반'));
          }
          petBtn.addEventListener('click', () => {
            const next = AppState.get(STORAGE_KEYS.preferences, {}) || {};
            next.petFriendly = !next.petFriendly;
            AppState.set(STORAGE_KEYS.preferences, next);
            paintPet();
            router.showToast(next.petFriendly ? '🐾 반려동물 동반 업체만 표시' : '반려동물 필터 해제');
          });
          paintPet();
          filterRow.appendChild(petBtn);
          wrap.appendChild(filterRow);
        })();

        return wrap;
      })(),

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
              '식이·예산·무드를 설정하면 ', h('br', { className: 'hidden md:block' }),
              '맞춤 추천을 드려요.'
            ),
            h('p', { className: 'font-body text-sm md:text-base text-onSurfaceVariant mt-3 leading-relaxed' },
              '마이페이지에서 언제든 수정할 수 있어요.'
            )
          ),
          h('a', {
            href: '#/mypage',
            className: 'inline-flex items-center justify-center gap-2 bg-gradient-to-br from-primary to-primary-dim text-onPrimary font-body font-semibold py-4 px-8 rounded-xl hover:shadow-[0px_12px_32px_rgba(45,51,53,0.12)] transition-all duration-300 hover:-translate-y-0.5 flex-none'
          },
            h('span', { className: 'material-symbols-outlined' }, 'tune'),
            '마이페이지에서 설정'
          )
        )
      )
    ),

    Footer(),
    BottomNav(router)
  );
}
