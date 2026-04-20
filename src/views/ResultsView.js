import { h } from '../utils/dom.js';
import { Header } from '../components/Header.js';
import { BottomNav } from '../components/BottomNav.js';
import { PICK_DATA } from '../data.js';
import { AppState, STORAGE_KEYS, recommend, savePlace, isSaved } from '../App.js';
import { regionLabel, subregionLabel, REGIONS } from '../regions.js';
import { multiKeywordSearch, LOCAL_CATEGORY_MAP, normalizeKakaoPlace } from '../services/kakaoLocal.js';

// 카테고리별 배지 아이콘 (Kakao place의 category_group_code 기반)
const KAKAO_CAT_BADGE = {
  FD6: { icon: 'restaurant',   label: '맛집' },
  CE7: { icon: 'local_cafe',   label: '카페' },
  AT4: { icon: 'attractions',  label: '명소' },
  CT1: { icon: 'theater_comedy', label: '문화' },
  AD5: { icon: 'hotel',        label: '숙박' }
};

function renderCard(p, router, saveBtn) {
  const cat = KAKAO_CAT_BADGE[p.category] || null;
  const iconName = cat?.icon || 'place';
  const categoryLabelDisplay = p.categoryLabel || (cat?.label) || (p.categoryFull?.split('>').slice(-1)[0].trim() || '');

  const card = h('article', {
    className: 'card-lift bg-surfaceContainerLowest rounded-2xl overflow-hidden flex'
  },
    h('div', { className: 'flex-none w-24 md:w-32 bg-primaryContainer/50 flex items-center justify-center text-primary' },
      h('span', { className: 'material-symbols-outlined text-[40px] md:text-[48px]' }, iconName)
    ),
    h('div', { className: 'flex-grow p-4 md:p-5 flex flex-col min-w-0' },
      h('div', { className: 'flex items-center justify-between gap-2' },
        h('span', { className: 'font-label text-xs text-primary uppercase tracking-widest' }, categoryLabelDisplay || '장소'),
      ),
      h('h3', { className: 'font-headline text-base md:text-lg font-bold text-onSurface mt-1 truncate' }, p.name),
      h('p', { className: 'font-body text-xs md:text-sm text-onSurfaceVariant mt-1 truncate' }, p.address || p.blurb || ''),
      p.phone
        ? h('p', { className: 'font-body text-xs text-onSurfaceVariant mt-1' }, `☎ ${p.phone}`)
        : null,
      h('div', { className: 'flex items-center gap-3 mt-3 flex-wrap' },
        saveBtn,
        p.placeUrl
          ? h('a', {
              href: p.placeUrl, target: '_blank', rel: 'noopener',
              className: 'text-onSurfaceVariant hover:text-primary transition-colors inline-flex items-center gap-1 text-xs font-medium'
            },
              h('span', { className: 'material-symbols-outlined text-[18px]' }, 'open_in_new'), '카카오맵'
            )
          : null,
        h('a', {
            href: `https://map.kakao.com/?sName=내위치&eName=${encodeURIComponent(p.name)}`,
            target: '_blank', rel: 'noopener',
            className: 'text-onSurfaceVariant hover:text-primary transition-colors inline-flex items-center gap-1 text-xs font-medium'
          },
            h('span', { className: 'material-symbols-outlined text-[18px]' }, 'directions'), '길찾기'
          )
      )
    )
  );

  return card;
}

function makeSaveBtn(p, router) {
  const btn = h('button', { className: 'transition-colors inline-flex items-center gap-1 text-xs font-medium' });
  function sync() {
    const saved = isSaved(p.id);
    btn.className = `transition-colors inline-flex items-center gap-1 text-xs font-medium ${saved ? 'text-primary' : 'text-onSurfaceVariant hover:text-primary'}`;
    btn.innerHTML = '';
    btn.appendChild(h('span', {
      className: 'material-symbols-outlined text-[18px]',
      style: saved ? { fontVariationSettings: "'FILL' 1" } : {}
    }, saved ? 'bookmark' : 'bookmark_add'));
    btn.appendChild(document.createTextNode(saved ? '저장됨' : '저장'));
  }
  sync();
  btn.addEventListener('click', () => {
    if (!isSaved(p.id)) {
      savePlace(p.id);
      sync();
      router.showToast('장소를 저장했습니다.', 'success');
    } else {
      router.showToast('이미 저장된 장소입니다.', 'info');
    }
  });
  return btn;
}

// 서브 지역 keywords + 카테고리 레이블을 조합해 Kakao 검색 쿼리 생성
function buildQueriesForArea(regionL, subL, subregion) {
  const queries = new Set();
  const areaTerms = [subL];
  // 대표 구·동 키워드 1-2개 추가 (너무 많으면 중복 호출)
  if (subregion?.keywords?.length) {
    const first = subregion.keywords[0];
    if (first && !areaTerms.includes(first)) areaTerms.push(first);
  }
  const categories = ['맛집', '카페', '명소'];
  for (const a of areaTerms) {
    for (const c of categories) queries.add(`${a} ${c}`);
  }
  return Array.from(queries);
}

function buildQueriesForRegion(regionL) {
  return ['맛집', '카페', '명소'].map(c => `${regionL} ${c}`);
}

export function ResultsView({ router, params }) {
  const source = params.get('source');
  const category = params.get('category');
  const placeId = params.get('place');
  const region = params.get('region');
  const area = params.get('area');
  const prefs = AppState.get(STORAGE_KEYS.preferences, {});

  const isKakaoFlow = Boolean(region); // region 파라미터 있으면 실시간 Kakao 검색

  let heading = '이번 주말 맞춤형 추천';
  let desc = '당신의 취향에 맞춰 선별된 경험.';
  let sourceLabel = '당신을 위한 큐레이션';

  if (placeId) {
    const single = PICK_DATA.places.find(p => p.id === placeId);
    heading = single?.name || '선택한 장소';
    sourceLabel = '상세 보기';
    desc = '골라주신 장소, 지도에서 바로 확인하세요.';
  } else if (region && area) {
    const regionL = regionLabel(region);
    const subL = subregionLabel(region, area);
    heading = `${subL}에서 놀기`;
    sourceLabel = `${regionL} · 세부 지역`;
    desc = `${regionL} ${subL}의 실시간 카카오맵 장소 데이터입니다.`;
  } else if (region) {
    const label = regionLabel(region);
    heading = `${label}에서 놀기`;
    sourceLabel = '지역 기반';
    desc = `${label}의 실시간 카카오맵 장소 데이터입니다.`;
  } else if (category) {
    const cat = PICK_DATA.categories.find(c => c.id === category);
    heading = `${cat?.label || '카테고리'} 추천`;
    sourceLabel = '카테고리 빠른 시작';
    desc = '선택하신 카테고리에서 추천도가 높은 순으로 보여드려요.';
  } else if (source === 'preferences') {
    heading = '당신만을 위한 선택';
    sourceLabel = '취향 기반 추천';
    desc = '방금 설정하신 취향을 기반으로 선별했어요.';
  }

  const container = h('div', { className: 'flex flex-col min-h-screen' },
    Header(router),
    h('div', { className: 'bg-surfaceContainer h-[1px] w-full' })
  );

  const main = h('main', { className: 'flex-grow max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 md:py-14 pb-32 md:pb-14' });
  container.appendChild(main);
  container.appendChild(BottomNav(router));

  main.appendChild(
    h('div', { className: 'mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4' },
      h('div', {},
        h('span', { className: 'font-label text-sm text-onSurfaceVariant' }, sourceLabel),
        h('h1', { className: 'font-headline text-[2rem] md:text-[2.5rem] leading-tight tracking-tight font-extrabold text-onSurface mt-2' }, heading),
        h('p', { className: 'font-body text-onSurfaceVariant mt-3 max-w-2xl' }, desc)
      ),
      h('div', { className: 'flex gap-2 flex-wrap' },
        region
          ? h('a', { href: `#/region?id=${region}`, className: 'inline-flex items-center gap-2 bg-surfaceContainerLowest text-onSurface font-body font-medium py-3 px-5 rounded-xl hover:bg-surfaceContainer transition-colors' },
              h('span', { className: 'material-symbols-outlined text-[18px]' }, 'arrow_back'),
              `${regionLabel(region)} 세부지역`
            )
          : h('a', { href: '#/', className: 'inline-flex items-center gap-2 bg-surfaceContainerLowest text-onSurface font-body font-medium py-3 px-5 rounded-xl hover:bg-surfaceContainer transition-colors' },
              h('span', { className: 'material-symbols-outlined text-[18px]' }, 'arrow_back'), '홈'
            ),
        h('a', { href: '#/preferences', className: 'inline-flex items-center gap-2 bg-secondaryContainer text-onSecondaryContainer font-body font-semibold py-3 px-5 rounded-xl hover:bg-secondaryFixedDim transition-colors' },
          h('span', { className: 'material-symbols-outlined text-[18px]' }, 'tune'), '취향 조정'
        )
      )
    )
  );

  const listSection = h('section', {});
  const listHeader = h('div', { className: 'flex items-center justify-between mb-4' },
    h('h2', { className: 'font-headline text-xl font-bold text-onSurface' }, '장소'),
    h('span', { className: 'font-label text-xs text-onSurfaceVariant' }, '맛집 · 카페 · 명소 위주')
  );
  listSection.appendChild(listHeader);

  const resultList = h('div', { className: 'flex flex-col gap-3' });
  listSection.appendChild(resultList);
  main.appendChild(listSection);

  function renderPlaces(places) {
    resultList.innerHTML = '';
    if (places.length === 0) {
      resultList.appendChild(
        h('div', { className: 'text-center p-10 bg-surfaceContainerLowest rounded-2xl border border-dashed border-surfaceContainerHighest' },
          h('span', { className: 'material-symbols-outlined text-4xl text-onSurfaceVariant mb-2' }, 'search_off'),
          h('h3', { className: 'font-headline text-lg font-bold text-onSurface' }, '결과가 없어요'),
          h('p', { className: 'font-body text-sm text-onSurfaceVariant mt-2' }, '다른 지역·세부 지역으로 이동하거나 취향 설정으로 범위를 바꿔보세요.')
        )
      );
      return;
    }
    for (const p of places) {
      const saveBtn = makeSaveBtn(p, router);
      resultList.appendChild(renderCard(p, router, saveBtn));
    }
    // 맨 위에 개수 배지
    listHeader.querySelector('span').textContent = `총 ${places.length}곳`;
  }

  function renderLoading() {
    resultList.innerHTML = '';
    resultList.appendChild(
      h('div', { className: 'text-center p-10 text-onSurfaceVariant font-body text-sm' },
        h('span', { className: 'material-symbols-outlined text-2xl animate-pulse mb-2 block mx-auto' }, 'travel_explore'),
        '카카오맵에서 장소를 불러오는 중…'
      )
    );
  }

  function renderError(msg) {
    resultList.innerHTML = '';
    resultList.appendChild(
      h('div', { className: 'p-6 bg-surfaceContainerLowest rounded-2xl border border-dashed border-red-300' },
        h('p', { className: 'text-red-600 font-body text-sm' }, '장소를 불러오지 못했어요: ' + msg)
      )
    );
  }

  if (isKakaoFlow) {
    renderLoading();
    (async () => {
      try {
        const regionL = regionLabel(region);
        let queries;
        if (area) {
          const regionObj = REGIONS.find(r => r.id === region);
          const subregion = regionObj?.subregions?.find(s => s.id === area);
          queries = buildQueriesForArea(regionL, subregionLabel(region, area), subregion);
        } else {
          queries = buildQueriesForRegion(regionL);
        }
        const raw = await multiKeywordSearch(queries, { size: 10 });
        // rating 없으니 카테고리 순으로 정렬: 카페/맛집/명소 골고루
        const places = raw.slice(0, 36).map(normalizeKakaoPlace);
        renderPlaces(places);
      } catch (e) {
        console.error('[ResultsView Kakao]', e);
        renderError(e.message || '알 수 없는 오류');
      }
    })();
  } else {
    // 기존 하드코딩 플로우 (preferences / category / place / no-param)
    let staticResults = [];
    if (placeId) {
      const single = PICK_DATA.places.find(p => p.id === placeId);
      staticResults = single ? [single] : [];
    } else if (category) {
      staticResults = PICK_DATA.places.filter(p => p.category === category).slice(0, 8);
    } else if (source === 'preferences') {
      staticResults = recommend(prefs, 8);
    } else {
      staticResults = recommend(prefs, 8);
    }
    // 로컬 place → 공통 스키마로 변환 (card 렌더링 공유)
    const normalized = staticResults.map(p => ({
      id: p.id,
      source: 'local',
      name: p.name,
      address: p.address || '',
      phone: '',
      category: null,
      categoryLabel: PICK_DATA.categories.find(c => c.id === p.category)?.label || '',
      categoryFull: '',
      lat: p.lat,
      lng: p.lng,
      placeUrl: null,
      image: p.image,
      blurb: p.blurb || ''
    }));
    renderPlaces(normalized);
  }

  return container;
}
