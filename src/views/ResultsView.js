import { h } from '../utils/dom.js';
import { Header } from '../components/Header.js';
import { BottomNav } from '../components/BottomNav.js';
import { PlacesMap } from '../components/PlacesMap.js';
import { PICK_DATA } from '../data.js';
import { AppState, STORAGE_KEYS, recommend, savePlace, isSaved } from '../App.js';
import { regionLabel, subregionLabel, REGIONS } from '../regions.js';
import { multiKeywordSearch, normalizeKakaoPlace } from '../services/kakaoLocal.js';

const KAKAO_CAT_BADGE = {
  FD6: { icon: 'restaurant',     label: '맛집' },
  CE7: { icon: 'local_cafe',     label: '카페' },
  AT4: { icon: 'attractions',    label: '명소' },
  CT1: { icon: 'theater_comedy', label: '문화' },
  AD5: { icon: 'hotel',          label: '숙박' }
};

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const toRad = (d) => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function formatDistance(km) {
  if (!Number.isFinite(km)) return '';
  if (km < 1) return `${Math.round(km * 1000)}m`;
  if (km < 10) return `${km.toFixed(1)}km`;
  return `${Math.round(km)}km`;
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

function renderCard(p, index, router, userCoord, mapApi) {
  const catMeta = KAKAO_CAT_BADGE[p.category] || null;
  const iconName = catMeta?.icon || 'place';
  const categoryBadge = catMeta?.label || p.categoryLabel || '장소';
  // 풀 카테고리 패스 정리 (예: "음식점 > 카페 > 전문점 > 커피전문점")
  const categoryPath = (p.categoryFull || '').split('>').map(s => s.trim()).filter(Boolean).join(' › ');

  const distanceText = userCoord && Number.isFinite(p.lat) && Number.isFinite(p.lng)
    ? `나로부터 ${formatDistance(haversineKm(userCoord.lat, userCoord.lng, p.lat, p.lng))}`
    : '';

  const saveBtn = makeSaveBtn(p, router);

  const card = h('article', {
    className: 'card-lift bg-surfaceContainerLowest rounded-2xl p-4 md:p-5 transition-all'
  },
    h('div', { className: 'flex gap-4' },
      // Left: numbered badge over icon
      h('div', { className: 'flex-none w-14 md:w-16 flex flex-col items-center gap-2' },
        h('span', { className: 'inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary text-onPrimary font-headline text-sm font-bold' }, String(index + 1)),
        h('div', { className: 'w-12 h-12 md:w-14 md:h-14 rounded-xl bg-primaryContainer/50 flex items-center justify-center text-primary' },
          h('span', { className: 'material-symbols-outlined text-[28px]' }, iconName)
        )
      ),
      // Right: all place info
      h('div', { className: 'flex-grow min-w-0' },
        h('div', { className: 'flex items-center gap-2 flex-wrap' },
          h('span', { className: 'font-label text-[10px] uppercase tracking-widest text-primary bg-primaryContainer px-2 py-0.5 rounded-full' }, categoryBadge),
          distanceText
            ? h('span', { className: 'font-label text-[11px] text-onSurfaceVariant inline-flex items-center gap-0.5' },
                h('span', { className: 'material-symbols-outlined text-[13px]' }, 'my_location'),
                distanceText
              )
            : null
        ),
        h('h3', { className: 'font-headline text-base md:text-lg font-bold text-onSurface mt-1.5 truncate' }, p.name),
        categoryPath
          ? h('p', { className: 'font-label text-[11px] text-onSurfaceVariant mt-0.5 truncate' }, categoryPath)
          : null,
        // Addresses
        h('div', { className: 'mt-2 space-y-0.5' },
          p.address
            ? h('p', { className: 'font-body text-xs md:text-sm text-onSurface flex items-start gap-1' },
                h('span', { className: 'material-symbols-outlined text-[16px] text-onSurfaceVariant mt-0.5 flex-none' }, 'location_on'),
                h('span', { className: 'break-keep' }, p.address)
              )
            : null,
          p.addressLegacy && p.addressLegacy !== p.address
            ? h('p', { className: 'font-body text-[11px] text-onSurfaceVariant pl-5 break-keep' }, `지번: ${p.addressLegacy}`)
            : null,
          p.phone
            ? h('p', { className: 'font-body text-xs text-onSurfaceVariant flex items-center gap-1' },
                h('span', { className: 'material-symbols-outlined text-[16px] flex-none' }, 'call'),
                h('a', { href: `tel:${p.phone}`, className: 'hover:text-primary' }, p.phone)
              )
            : null
        ),
        // Action row
        h('div', { className: 'flex items-center gap-3 mt-3 flex-wrap' },
          saveBtn,
          p.placeUrl
            ? h('a', {
                href: p.placeUrl, target: '_blank', rel: 'noopener',
                className: 'text-onSurfaceVariant hover:text-primary transition-colors inline-flex items-center gap-1 text-xs font-medium'
              },
                h('span', { className: 'material-symbols-outlined text-[18px]' }, 'reviews'),
                '사진·리뷰'
              )
            : null,
          h('a', {
              href: `https://map.kakao.com/link/to/${encodeURIComponent(p.name)},${p.lat},${p.lng}`,
              target: '_blank', rel: 'noopener',
              className: 'text-onSurfaceVariant hover:text-primary transition-colors inline-flex items-center gap-1 text-xs font-medium'
            },
              h('span', { className: 'material-symbols-outlined text-[18px]' }, 'directions'),
              '길찾기'
            )
        )
      )
    )
  );

  // Hover ↔ map pin 연동
  if (mapApi) {
    card.addEventListener('mouseenter', () => {
      mapApi.highlight(p.id);
      mapApi.panTo(p.id);
    });
    card.addEventListener('mouseleave', () => mapApi.clearHighlight());
  }

  return card;
}

function buildQueriesForArea(regionL, subL, subregion) {
  const queries = new Set();
  const areaTerms = [subL];
  if (subregion?.keywords?.length) {
    const first = subregion.keywords[0];
    if (first && !areaTerms.includes(first)) areaTerms.push(first);
  }
  for (const a of areaTerms) {
    for (const c of ['맛집', '카페', '명소']) queries.add(`${a} ${c}`);
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

  const isKakaoFlow = Boolean(region);

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
    desc = `${regionL} ${subL}의 실시간 카카오맵 장소입니다. 카드에 마우스 올리면 지도에서 위치를 확인할 수 있어요.`;
  } else if (region) {
    const label = regionLabel(region);
    heading = `${label}에서 놀기`;
    sourceLabel = '지역 기반';
    desc = `${label}의 실시간 카카오맵 장소입니다.`;
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

  const main = h('main', { className: 'flex-grow max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 md:py-12 pb-32 md:pb-12' });
  container.appendChild(main);
  container.appendChild(BottomNav(router));

  main.appendChild(
    h('div', { className: 'mb-6 md:mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4' },
      h('div', {},
        h('span', { className: 'font-label text-sm text-onSurfaceVariant' }, sourceLabel),
        h('h1', { className: 'font-headline text-[1.75rem] md:text-[2.25rem] leading-tight tracking-tight font-extrabold text-onSurface mt-1.5' }, heading),
        h('p', { className: 'font-body text-sm md:text-base text-onSurfaceVariant mt-2 max-w-2xl' }, desc)
      ),
      h('div', { className: 'flex gap-2 flex-wrap' },
        region
          ? h('a', { href: `#/region?id=${region}`, className: 'inline-flex items-center gap-2 bg-surfaceContainerLowest text-onSurface font-body text-sm font-medium py-2.5 px-4 rounded-xl hover:bg-surfaceContainer transition-colors' },
              h('span', { className: 'material-symbols-outlined text-[18px]' }, 'arrow_back'),
              `${regionLabel(region)} 세부지역`
            )
          : h('a', { href: '#/', className: 'inline-flex items-center gap-2 bg-surfaceContainerLowest text-onSurface font-body text-sm font-medium py-2.5 px-4 rounded-xl hover:bg-surfaceContainer transition-colors' },
              h('span', { className: 'material-symbols-outlined text-[18px]' }, 'arrow_back'), '홈'
            ),
        h('a', { href: '#/preferences', className: 'inline-flex items-center gap-2 bg-secondaryContainer text-onSecondaryContainer font-body text-sm font-semibold py-2.5 px-4 rounded-xl hover:bg-secondaryFixedDim transition-colors' },
          h('span', { className: 'material-symbols-outlined text-[18px]' }, 'tune'), '취향 조정'
        )
      )
    )
  );

  const listSection = h('section', {});
  const listHeader = h('div', { className: 'flex items-center justify-between mb-3' },
    h('h2', { className: 'font-headline text-lg font-bold text-onSurface' }, '장소'),
    h('span', { className: 'font-label text-xs text-onSurfaceVariant' }, '맛집 · 카페 · 명소')
  );
  listSection.appendChild(listHeader);

  const resultList = h('div', { className: 'flex flex-col gap-3' });
  listSection.appendChild(resultList);

  const mapCol = h('aside', { className: 'md:sticky md:top-[88px] md:self-start' });

  const grid = h('div', { className: 'grid md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-5 md:gap-7' },
    listSection, mapCol
  );
  main.appendChild(grid);

  let userCoord = null;
  if (isKakaoFlow && 'geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        userCoord = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        // 위치 허용이 늦게 오면 이미 렌더된 카드엔 반영 안 되지만, 다음 세션에 캐시되어 적용됨
      },
      () => { /* 사용자 거부 — 그냥 거리 표시 없이 진행 */ },
      { maximumAge: 300000, timeout: 5000 }
    );
  }

  function renderPlaces(places, mapApi) {
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
    places.forEach((p, idx) => {
      resultList.appendChild(renderCard(p, idx, router, userCoord, mapApi));
    });
    listHeader.querySelector('span').textContent = `총 ${places.length}곳 · 맛집·카페·명소`;
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
        const places = raw.slice(0, 30).map(normalizeKakaoPlace);

        // Side map
        const mapApi = PlacesMap({ places });
        mapCol.innerHTML = '';
        mapCol.appendChild(mapApi.el);

        renderPlaces(places, mapApi);
      } catch (e) {
        console.error('[ResultsView Kakao]', e);
        resultList.innerHTML = '';
        resultList.appendChild(
          h('div', { className: 'p-6 bg-surfaceContainerLowest rounded-2xl border border-dashed border-red-300' },
            h('p', { className: 'text-red-600 font-body text-sm' }, '장소를 불러오지 못했어요: ' + (e.message || '알 수 없는 오류'))
          )
        );
      }
    })();
  } else {
    // 하드코딩 플로우: preferences / category / place
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
    const normalized = staticResults.map(p => ({
      id: p.id,
      source: 'local',
      name: p.name,
      address: p.address || '',
      addressLegacy: '',
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
    renderPlaces(normalized, null);
    // 하드코딩 플로우에서는 side map 대신 안내 문구
    mapCol.appendChild(
      h('div', { className: 'rounded-2xl bg-surfaceContainerLowest p-6 text-center text-onSurfaceVariant font-body text-sm' },
        h('span', { className: 'material-symbols-outlined text-2xl mb-2 block' }, 'map'),
        '지역을 선택하시면 카카오맵 실시간 데이터와 위치 지도를 볼 수 있습니다.'
      )
    );
  }

  return container;
}
