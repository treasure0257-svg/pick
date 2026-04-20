import { h } from '../utils/dom.js';
import { Header } from '../components/Header.js';
import { BottomNav } from '../components/BottomNav.js';
import { PICK_DATA } from '../data.js';
import { AppState, STORAGE_KEYS, recommend, savePlace, isSaved } from '../App.js';
import { placesInRegion, regionLabel } from '../regions.js';

export function ResultsView({ router, params }) {
  const source = params.get('source');
  const category = params.get('category');
  const placeId = params.get('place');
  const region = params.get('region');
  const prefs = AppState.get(STORAGE_KEYS.preferences, {});

  let results = [];
  let heading = "이번 주말 맞춤형 추천";
  let desc = "당신의 취향에 맞춰 선별된 경험, 소음에서 벗어나 휴식을 즐겨보세요.";
  let sourceLabel = "당신을 위한 큐레이션";

  if (placeId) {
    const single = PICK_DATA.places.find(p => p.id === placeId);
    results = single ? [single] : [];
    heading = single?.name || "선택한 장소";
    sourceLabel = "상세 보기";
    desc = "골라주신 장소, 지도에서 바로 확인하세요.";
  } else if (region) {
    results = placesInRegion(PICK_DATA.places, region);
    const label = regionLabel(region);
    heading = `${label}에서 놀기`;
    sourceLabel = "지역 기반";
    desc = results.length
      ? `${label}에서 즐길 수 있는 ${results.length}곳을 모았어요.`
      : `${label}은(는) 아직 준비 중입니다. 곧 채워드릴게요.`;
  } else if (category) {
    const cat = PICK_DATA.categories.find(c => c.id === category);
    results = PICK_DATA.places.filter(p => p.category === category).slice(0, 8);
    heading = `${cat?.label || "카테고리"} 추천`;
    sourceLabel = "카테고리 빠른 시작";
    desc = "선택하신 카테고리에서 추천도가 높은 순으로 보여드려요.";
  } else if (source === "preferences") {
    results = recommend(prefs, 8);
    heading = "당신만을 위한 선택";
    sourceLabel = "취향 기반 추천";
    desc = "방금 설정하신 취향을 기반으로 선별했어요.";
  } else {
    results = recommend(prefs, 8);
  }

  const container = h('div', { className: 'flex flex-col min-h-screen' },
    Header(router),
    h('div', { className: 'bg-surfaceContainer h-[1px] w-full' })
  );

  const main = h('main', { className: 'flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 md:py-14 pb-32 md:pb-14' });
  container.appendChild(main);
  container.appendChild(BottomNav(router));

  // Header Section
  main.appendChild(
    h('div', { className: 'mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4' },
      h('div', {},
        h('span', { className: 'font-label text-sm text-onSurfaceVariant' }, sourceLabel),
        h('h1', { className: 'font-headline text-[2.5rem] md:text-[3rem] leading-tight tracking-tight font-extrabold text-onSurface mt-2' }, heading),
        h('p', { className: 'font-body text-onSurfaceVariant mt-3 max-w-2xl' }, desc)
      ),
      h('div', { className: 'flex gap-2' },
        h('a', { href: '#/', className: 'inline-flex items-center gap-2 bg-surfaceContainerLowest text-onSurface font-body font-medium py-3 px-5 rounded-xl hover:bg-surfaceContainer transition-colors' },
          h('span', { className: 'material-symbols-outlined text-[18px]' }, 'arrow_back'), '지역 다시'
        ),
        h('a', { href: '#/preferences', className: 'inline-flex items-center gap-2 bg-secondaryContainer text-onSecondaryContainer font-body font-semibold py-3 px-5 rounded-xl hover:bg-secondaryFixedDim transition-colors' },
          h('span', { className: 'material-symbols-outlined text-[18px]' }, 'tune'), '취향 조정'
        )
      )
    )
  );

  // Main grid (Map + List)
  const mapSection = h('section', { className: 'bg-surfaceContainerLowest rounded-[2rem] overflow-hidden min-h-[500px] md:min-h-[640px] relative' });
  const mapContainer = h('div', { id: 'map', className: 'w-full h-full min-h-[500px] md:min-h-[640px] bg-surfaceContainerLow flex items-center justify-center' });
  
  // Placeholder Map Content
  const mapPlaceholder = h('div', { className: 'text-center p-10 max-w-md' },
    h('span', { className: 'material-symbols-outlined text-primary text-5xl' }, 'map'),
    h('h3', { className: 'font-headline text-xl font-bold text-onSurface mt-4' }, 'Google Maps 준비중'),
    h('p', { className: 'font-body text-sm text-onSurfaceVariant mt-2' }, 'API 키를 .env 에 넣으면 지도가 로드됩니다. 아래 링크를 눌러 위치를 확인하세요.'),
    h('ul', { className: 'mt-6 text-left space-y-2' },
      ...results.slice(0, 5).map(p => 
        h('li', { className: 'flex items-start gap-2 text-sm' },
          h('span', { className: 'material-symbols-outlined text-primary text-[18px] mt-0.5' }, 'push_pin'),
          h('a', { 
            href: `https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`,
            target: '_blank',
            className: 'hover:text-primary transition-colors'
          }, p.name)
        )
      )
    )
  );
  mapContainer.appendChild(mapPlaceholder);
  mapSection.appendChild(mapContainer);

  const listSection = h('section', {});
  listSection.appendChild(h('h2', { className: 'font-headline text-xl font-bold text-onSurface mb-4' }, '큐레이션된 선택'));

  const resultList = h('div', { className: 'flex flex-col gap-4' });

  // EMPTY STATE
  if (results.length === 0) {
    resultList.appendChild(
      h('div', { className: 'text-center p-10 bg-surfaceContainerLowest rounded-2xl border border-dashed border-surfaceContainerHighest' },
        h('span', { className: 'material-symbols-outlined text-4xl text-onSurfaceVariant mb-2' }, 'search_off'),
        h('h3', { className: 'font-headline text-lg font-bold text-onSurface' }, region ? '이 지역은 준비 중입니다' : '조건에 맞는 결과가 없어요'),
        h('p', { className: 'font-body text-sm text-onSurfaceVariant mt-2' }, region ? '실제 장소 데이터는 순차적으로 추가됩니다. 다른 지역이나 취향 설정으로 먼저 둘러보세요.' : '취향 설정에서 카테고리나 필터를 조금 완화해보세요.')
      )
    );
  } else {
    results.forEach(p => {
      const catLabel = PICK_DATA.categories.find(c => c.id === p.category)?.label || '';
      const drinksMeta = {
        dry: { icon: "no_drinks", label: "술 없이" },
        optional: { icon: "local_cafe", label: "가볍게" },
        party: { icon: "local_bar", label: "한잔 모드" }
      };
      const dm = drinksMeta[p.drinks];
      
      const isPlaceSaved = isSaved(p.id);
      
      const saveBtn = h('button', { 
        className: `transition-colors inline-flex items-center gap-1 text-xs font-medium ${isPlaceSaved ? 'text-primary' : 'text-onSurfaceVariant hover:text-primary'}`,
        onClick: (e) => {
          if (!isSaved(p.id)) {
            savePlace(p.id);
            saveBtn.className = 'text-primary transition-colors inline-flex items-center gap-1 text-xs font-medium';
            saveBtn.innerHTML = `<span class="material-symbols-outlined text-[18px]" style="font-variation-settings:'FILL' 1;">bookmark</span>저장됨`;
            router.showToast('장소를 저장했습니다.', 'success');
          } else {
            router.showToast('이미 저장된 장소입니다.', 'info');
          }
        }
      },
        h('span', { 
          className: 'material-symbols-outlined text-[18px]',
          style: isPlaceSaved ? { fontVariationSettings: "'FILL' 1" } : {}
        }, isPlaceSaved ? 'bookmark' : 'bookmark_add'),
        isPlaceSaved ? '저장됨' : '저장'
      );

      const card = h('article', { className: 'card-lift bg-surfaceContainerLowest rounded-2xl overflow-hidden flex' },
        h('img', { src: p.image, loading: 'lazy', className: 'w-28 h-28 md:w-36 md:h-auto object-cover flex-none' }),
        h('div', { className: 'flex-grow p-4 md:p-5 flex flex-col' },
          h('div', { className: 'flex items-center justify-between gap-2' },
            h('span', { className: 'font-label text-xs text-primary uppercase tracking-widest' }, catLabel),
            h('span', { className: 'font-label text-xs text-onSurfaceVariant' }, `★ ${p.rating}`)
          ),
          h('h3', { className: 'font-headline text-lg font-bold text-onSurface mt-1' }, p.name),
          h('p', { className: 'font-body text-sm text-onSurfaceVariant mt-1 leading-relaxed flex-grow' }, p.blurb),
          h('div', { className: 'flex items-center gap-2 mt-2 flex-wrap' },
            dm ? h('span', { className: 'inline-flex items-center gap-1 bg-surfaceVariant text-onSurfaceVariant font-label text-[11px] px-2 py-0.5 rounded-full' },
              h('span', { className: 'material-symbols-outlined text-[14px]' }, dm.icon), dm.label
            ) : null
          ),
          h('div', { className: 'flex items-center gap-2 mt-3' },
            saveBtn,
            h('a', { 
              href: `https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`,
              target: '_blank',
              className: 'text-onSurfaceVariant hover:text-primary transition-colors inline-flex items-center gap-1 text-xs font-medium'
            },
              h('span', { className: 'material-symbols-outlined text-[18px]' }, 'location_on'), '지도 열기'
            )
          )
        )
      );
      resultList.appendChild(card);
    });
  }
  listSection.appendChild(resultList);

  const grid = h('div', { className: 'grid md:grid-cols-[1fr,420px] gap-8' }, mapSection, listSection);
  main.appendChild(grid);

  return container;
}
