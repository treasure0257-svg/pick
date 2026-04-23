import { h } from '../utils/dom.js';
import { Header } from '../components/Header.js';
import { BottomNav } from '../components/BottomNav.js';
import { Footer } from '../components/Footer.js';
import { PlacesMap } from '../components/PlacesMap.js';
import { PICK_DATA } from '../data.js';
import { AppState, STORAGE_KEYS, recommend, savePlace, isSaved } from '../App.js';
import { regionLabel, subregionLabel, REGIONS } from '../regions.js';
import { multiKeywordSearch, keywordSearch, normalizeKakaoPlace, cachePlaces } from '../services/kakaoLocal.js';
import { naverLocalSearch, normalizeNaverPlace, getPlaceImage, getBlogCount } from '../services/naverLocal.js';
import { applyAllPreferences } from '../utils/preference-filter.js';

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

function renderCard(p, index, router, userCoord, mapApi, fromContext) {
  const catMeta = KAKAO_CAT_BADGE[p.category] || null;
  const iconName = catMeta?.icon || 'place';
  const categoryBadge = catMeta?.label || p.categoryLabel || '장소';
  // 풀 카테고리 패스 정리 (예: "음식점 > 카페 > 전문점 > 커피전문점")
  const categoryPath = (p.categoryFull || '').split('>').map(s => s.trim()).filter(Boolean).join(' › ');

  const distanceKm = userCoord && Number.isFinite(p.lat) && Number.isFinite(p.lng)
    ? haversineKm(userCoord.lat, userCoord.lng, p.lat, p.lng)
    : null;
  const distanceText = distanceKm != null ? `나로부터 ${formatDistance(distanceKm)}` : '';

  // 랭크/태그 산정 — 번호 대신 직관적 시그널
  // · index 0~2 → 🥇🥈🥉 (Kakao 관련도 정렬 기준 상위)
  // · 500m 이내 → 📍 근처
  // · index 3~9 → 🔥 인기
  // · 그 외 → 뱃지 없음
  let rankBadge = null;
  if (index === 0)      rankBadge = { emoji: '🥇', label: '1위', cls: 'bg-amber-100 text-amber-800 ring-1 ring-amber-300' };
  else if (index === 1) rankBadge = { emoji: '🥈', label: '2위', cls: 'bg-slate-100 text-slate-700 ring-1 ring-slate-300' };
  else if (index === 2) rankBadge = { emoji: '🥉', label: '3위', cls: 'bg-orange-100 text-orange-800 ring-1 ring-orange-300' };
  else if (distanceKm != null && distanceKm < 0.5) rankBadge = { emoji: '📍', label: '근처', cls: 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300' };
  else if (index < 10)  rankBadge = { emoji: '🔥', label: '인기', cls: 'bg-rose-100 text-rose-800 ring-1 ring-rose-300' };

  const saveBtn = makeSaveBtn(p, router);

  const detailHref = `#/place?id=${encodeURIComponent(p.id)}${fromContext ? `&from=${encodeURIComponent(fromContext)}` : ''}`;
  const card = h('a', {
    href: detailHref,
    className: 'card-lift block bg-surfaceContainerLowest rounded-2xl p-4 md:p-5 transition-all hover:shadow-[0px_8px_20px_rgba(45,51,53,0.08)]'
  },
    h('div', { className: 'flex gap-4' },
      // Left: numbered badge over thumbnail (skeleton → Naver image 또는 아이콘 fallback)
      (function () {
        const shimmer = h('div', {
          className: 'absolute inset-0 z-20 pick-shimmer'
        });
        const thumb = h('div', {
          className: 'w-20 h-20 md:w-24 md:h-24 rounded-xl bg-gradient-to-br from-primaryContainer/60 via-primaryContainer/30 to-primary-dim/20 flex items-center justify-center text-primary relative overflow-hidden'
        },
          h('span', { className: 'material-symbols-outlined text-[32px] z-0 opacity-70' }, iconName),
          shimmer
        );
        // Naver 이미지 fetch → 성공/실패에 따라 shimmer 제거 + img overlay
        getPlaceImage(p.name)
          .then(url => {
            if (url) {
              const img = h('img', {
                src: url,
                alt: p.name,
                loading: 'lazy',
                referrerPolicy: 'no-referrer',
                className: 'absolute inset-0 w-full h-full object-cover z-10 opacity-0 transition-opacity duration-300',
                onLoad: (e) => { e.target.style.opacity = '1'; shimmer.remove(); },
                onError: (e) => { e.target.remove(); shimmer.remove(); }
              });
              thumb.appendChild(img);
            } else {
              shimmer.remove();
            }
          })
          .catch(() => shimmer.remove());

        return h('div', { className: 'flex-none w-20 md:w-24 flex flex-col items-center gap-2' },
          rankBadge
            ? h('span', {
                className: `inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-headline font-bold ${rankBadge.cls}`,
                title: rankBadge.label
              },
                h('span', {}, rankBadge.emoji),
                h('span', {}, rankBadge.label)
              )
            : h('span', { className: 'h-[22px]' }), // spacer (정렬 일관성)
          thumb
        );
      })(),
      // Right: all place info
      h('div', { className: 'flex-grow min-w-0' },
        h('div', { className: 'flex items-center gap-2 flex-wrap' },
          h('span', { className: 'font-label text-[10px] uppercase tracking-widest text-primary bg-primaryContainer px-2 py-0.5 rounded-full' }, categoryBadge),
          distanceText
            ? h('span', { className: 'font-label text-[11px] text-onSurfaceVariant inline-flex items-center gap-0.5' },
                h('span', { className: 'material-symbols-outlined text-[13px]' }, 'my_location'),
                distanceText
              )
            : null,
          (function () {
            // 블로그 후기 수 chip — 비동기 로드, 0이면 자동 숨김
            const chip = h('span', {
              className: 'font-label text-[11px] text-emerald-700 inline-flex items-center gap-0.5 opacity-0 transition-opacity'
            },
              h('span', { className: 'material-symbols-outlined text-[13px]' }, 'edit_note'),
              h('span', { 'data-blog-count': '' }, '...')
            );
            const blogQuery = `${p.name} ${p.address ? p.address.split(' ').slice(0, 2).join(' ') : ''}`.trim();
            getBlogCount(blogQuery).then(n => {
              if (n > 0) {
                const txt = n >= 10000
                  ? `블로그 ${(n / 10000).toFixed(1)}만건`
                  : n >= 1000
                    ? `블로그 ${(n / 1000).toFixed(1)}k건`
                    : `블로그 ${n}건`;
                chip.querySelector('[data-blog-count]').textContent = txt;
                chip.style.opacity = '1';
              } else {
                chip.remove();
              }
            }).catch(() => chip.remove());
            return chip;
          })()
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
        // Action row: save + 카카오맵 별점/후기 link + "자세히" chevron
        h('div', { className: 'flex items-center gap-2 mt-3 flex-wrap' },
          saveBtn,
          p.placeUrl
            ? h('button', {
                className: 'inline-flex items-center gap-0.5 text-[11px] font-medium text-amber-800 bg-amber-50 px-2 py-1 rounded-full hover:bg-amber-100 transition-colors',
                title: '카카오맵에서 별점·후기 보기',
                onClick: (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.open(p.placeUrl, '_blank', 'noopener,noreferrer');
                }
              },
                h('span', { className: 'material-symbols-outlined text-[13px]', style: { fontVariationSettings: "'FILL' 1" } }, 'star'),
                '별점·후기'
              )
            : null,
          h('span', { className: 'ml-auto inline-flex items-center gap-0.5 text-xs font-medium text-primary' },
            '자세히',
            h('span', { className: 'material-symbols-outlined text-[16px]' }, 'chevron_right')
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

// 카테고리별 확장 키워드 — Kakao Local 키워드 검색에서 다양한 결과 확보용.
// 관광 명소가 부족한 게 가장 큰 불만이라 즐길거리 쪽 키워드를 대폭 늘림.
const SEARCH_KEYWORDS = {
  food: [
    '맛집', '한식', '한정식', '고기', '삼겹살', '갈비',
    '일식', '초밥', '라멘', '회', '중식', '양식', '파스타', '피자',
    '아시안', '쌀국수', '치킨', '분식', '떡볶이', '족발',
    '국밥', '냉면', '술집', '이자카야', '포차'
  ],
  cafe: ['카페', '디저트', '베이커리', '브런치', '와플', '케이크', '커피'],
  attraction: [
    '관광', '명소', '박물관', '미술관', '공원', '전시관', '랜드마크', '가볼만한곳',
    '체험관', '테마파크', '수족관', '동물원', '한옥마을', '전통시장', '전망대'
  ],
  lodging: ['호텔', '펜션', '게스트하우스', '리조트', '한옥스테이', '풀빌라', '글램핑', '모텔']
};

function buildQueriesForArea(regionL, subL, subregion) {
  const queries = new Set();
  const areaTerms = [subL];
  if (subregion?.keywords?.length) {
    for (const kw of subregion.keywords) {
      if (kw && !areaTerms.includes(kw)) areaTerms.push(kw);
    }
  }
  for (const a of areaTerms) {
    for (const group of Object.values(SEARCH_KEYWORDS)) {
      for (const kw of group) queries.add(`${a} ${kw}`);
    }
  }
  return Array.from(queries);
}

function buildQueriesForRegion(regionL) {
  const queries = [];
  for (const group of Object.values(SEARCH_KEYWORDS)) {
    for (const kw of group) queries.push(`${regionL} ${kw}`);
  }
  return queries;
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
  container.appendChild(Footer());
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
        h('a', { href: '#/mypage', className: 'inline-flex items-center gap-2 bg-secondaryContainer text-onSecondaryContainer font-body text-sm font-semibold py-2.5 px-4 rounded-xl hover:bg-secondaryFixedDim transition-colors' },
          h('span', { className: 'material-symbols-outlined text-[18px]' }, 'tune'), '취향 조정'
        )
      )
    )
  );

  const listSection = h('section', {});
  const listHeader = h('div', { className: 'flex items-center justify-between mb-5' },
    h('h2', { className: 'font-headline text-lg font-bold text-onSurface' }, '장소'),
    h('span', { className: 'font-label text-xs text-onSurfaceVariant' }, '맛집 · 카페 · 명소')
  );
  // Landmark filter — 사용자가 현재 보이는 건물명을 검색해 그 주변만 필터링
  const landmarkChipSlot = h('div', { className: 'flex flex-wrap gap-2 mb-3 empty:hidden' });
  const landmarkInput = h('input', {
    type: 'text',
    placeholder: '어디에 계신가요? 현재 눈 앞에 보이는 것을 검색해보세요!',
    className: 'flex-grow min-w-0 px-4 py-3 rounded-xl border border-surfaceContainerHighest bg-surfaceContainerLowest text-sm font-body text-onSurface placeholder:text-onSurfaceVariant focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors'
  });
  const landmarkBtn = h('button', {
    type: 'submit',
    className: 'flex-none inline-flex items-center gap-1 px-4 py-3 rounded-xl bg-primary text-onPrimary text-sm font-body font-semibold hover:opacity-90 transition-opacity disabled:opacity-50'
  },
    h('span', { className: 'material-symbols-outlined text-[18px]' }, 'near_me'),
    '주변 보기'
  );
  const landmarkForm = h('form', { className: 'flex gap-2 mb-4' }, landmarkInput, landmarkBtn);
  // Category tabs (populated after Kakao results come in)
  const tabsBar = h('div', { className: 'flex items-center gap-2 mb-5 flex-wrap' });
  listSection.appendChild(listHeader);
  listSection.appendChild(landmarkForm);
  listSection.appendChild(landmarkChipSlot);
  listSection.appendChild(tabsBar);

  // Desktop에서 grid (md이상), mobile에서 세로 single column
  const resultList = h('div', { className: 'grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5' });
  listSection.appendChild(resultList);

  const mapCol = h('aside', { className: 'hidden md:block md:sticky md:top-[88px] md:self-start' });

  const grid = h('div', { className: 'grid md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-5 md:gap-7' },
    listSection, mapCol
  );
  main.appendChild(grid);

  // One-day course banner (아래에 고정, Kakao flow만 노출)
  const courseSlot = h('section', { className: 'mt-10 md:mt-14' });
  main.appendChild(courseSlot);

  // Mobile FAB — 리스트 ↔ 지도 전환 (모바일 전용)
  let mobileMapOverlay = null;
  function openMobileMap(mapApi) {
    if (mobileMapOverlay) return;
    const closeBtn = h('button', {
      className: 'absolute top-4 left-4 z-20 bg-white text-onSurface font-body text-sm font-medium py-2 px-4 rounded-full shadow-md inline-flex items-center gap-1.5',
      onClick: () => closeMobileMap()
    },
      h('span', { className: 'material-symbols-outlined text-[18px]' }, 'arrow_back'),
      '목록으로'
    );
    const mapClone = mapApi ? PlacesMap({ places: mapApi._places || [] }) : null;
    const mapEl = mapClone ? mapClone.el : h('div', { className: 'p-10 text-center' }, '지도 데이터 없음');
    mobileMapOverlay = h('div', {
      className: 'md:hidden fixed inset-0 z-[90] bg-background flex flex-col'
    },
      closeBtn,
      h('div', { className: 'flex-grow relative' }, mapEl)
    );
    document.body.appendChild(mobileMapOverlay);
  }
  function closeMobileMap() {
    if (mobileMapOverlay) { mobileMapOverlay.remove(); mobileMapOverlay = null; }
  }
  const fab = h('button', {
    className: 'md:hidden fixed bottom-24 right-5 z-40 w-14 h-14 rounded-full bg-primary text-onPrimary shadow-[0px_6px_20px_rgba(124,58,237,0.35)] flex items-center justify-center hover:scale-105 transition-transform',
    title: '지도 보기',
    style: { display: 'none' }
  },
    h('span', { className: 'material-symbols-outlined' }, 'map')
  );
  container.appendChild(fab);

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

  const fromContext = region ? (area ? `region:${region}:${area}` : `region:${region}`) : null;

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
      resultList.appendChild(renderCard(p, idx, router, userCoord, mapApi, fromContext));
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

  const TABS = [
    { id: 'all',  label: '전체',     icon: 'apps',        match: null   },
    { id: 'FD6',  label: '맛집',     icon: 'restaurant',  match: 'FD6'  },
    { id: 'CE7',  label: '카페',     icon: 'local_cafe',  match: 'CE7'  },
    { id: 'AT4',  label: '즐길거리', icon: 'attractions', match: 'AT4'  },
    { id: 'AD5',  label: '숙소',     icon: 'hotel',       match: 'AD5'  }
  ];

  // 맛집(FD6) 서브 분류. Kakao category_name 2번째 세그먼트 기반.
  const CUISINE_GROUPS = [
    { id: 'all',     label: '전체 맛집' },
    { id: 'korean',  label: '한식',     match: (c) => c === '한식' },
    { id: 'meat',    label: '고기·구이', match: (c) => c && (c.includes('고기') || c === '육류,고기요리' || c === '구이') },
    { id: 'jp',      label: '일식·회',   match: (c) => c === '일식' || (c && c.includes('회')) },
    { id: 'cn',      label: '중식',     match: (c) => c === '중식' },
    { id: 'western', label: '양식',     match: (c) => c === '양식' },
    { id: 'asian',   label: '아시안',   match: (c) => c === '아시아음식' },
    { id: 'chicken', label: '치킨·분식', match: (c) => c === '치킨' || c === '분식' || c === '패스트푸드' },
    { id: 'bar',     label: '술집',     match: (c) => c === '술집' || c === '주점' || c === '포차' || (c && c.includes('이자카야')) }
  ];

  function cuisineOf(place) {
    if (place.category !== 'FD6') return null;
    const parts = (place.categoryFull || '').split('>').map(s => s.trim());
    const second = parts[1] || '';
    for (const g of CUISINE_GROUPS) {
      if (g.match && g.match(second)) return g.id;
    }
    return 'other';
  }

  function renderTabs(allPlaces, activeId, onSelect, activeCuisine, onCuisine) {
    tabsBar.innerHTML = '';
    // Top row: main categories
    const topRow = h('div', { className: 'flex items-center gap-2 flex-wrap' });
    TABS.forEach(t => {
      const count = t.match
        ? allPlaces.filter(p => p.category === t.match).length
        : allPlaces.length;
      const isActive = t.id === activeId;
      const btn = h('button', {
        className: `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-body font-medium transition-colors ${
          isActive
            ? 'bg-primary text-onPrimary'
            : 'bg-surfaceContainerLowest text-onSurface hover:bg-surfaceContainer'
        }`,
        onClick: () => onSelect(t.id)
      },
        h('span', { className: 'material-symbols-outlined text-[16px]' }, t.icon),
        t.label,
        h('span', {
          className: `font-label text-[10px] ${isActive ? 'text-onPrimary/80' : 'text-onSurfaceVariant'}`
        }, String(count))
      );
      topRow.appendChild(btn);
    });
    tabsBar.appendChild(topRow);

    // Sub row: cuisine groups (only when 맛집 tab active)
    if (activeId === 'FD6') {
      const foodOnly = allPlaces.filter(p => p.category === 'FD6');
      const cuisineCounts = {};
      foodOnly.forEach(p => {
        const cid = cuisineOf(p);
        if (cid) cuisineCounts[cid] = (cuisineCounts[cid] || 0) + 1;
      });
      const subRow = h('div', { className: 'flex items-center gap-1.5 flex-wrap pl-2 border-l-2 border-primary/20 ml-1' });
      CUISINE_GROUPS.forEach(g => {
        const count = g.id === 'all' ? foodOnly.length : (cuisineCounts[g.id] || 0);
        if (g.id !== 'all' && count === 0) return; // 결과에 없는 sub는 숨김
        const isActive = activeCuisine === g.id;
        const btn = h('button', {
          className: `inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-body font-medium transition-colors ${
            isActive
              ? 'bg-red-600 text-white'
              : 'bg-red-50 text-red-800 hover:bg-red-100'
          }`,
          onClick: () => onCuisine(g.id)
        },
          g.label,
          h('span', { className: 'font-label text-[10px] opacity-80' }, String(count))
        );
        subRow.appendChild(btn);
      });
      // "기타" if there are uncategorized
      if ((cuisineCounts['other'] || 0) > 0) {
        const isActive = activeCuisine === 'other';
        const btn = h('button', {
          className: `inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-body font-medium transition-colors ${
            isActive
              ? 'bg-red-600 text-white'
              : 'bg-red-50 text-red-800 hover:bg-red-100'
          }`,
          onClick: () => onCuisine('other')
        }, '기타', h('span', { className: 'font-label text-[10px] opacity-80' }, String(cuisineCounts['other'])));
        subRow.appendChild(btn);
      }
      tabsBar.appendChild(subRow);
    }
  }

  function pickOneFromCategory(list, catCode) {
    const pool = list.filter(p => p.category === catCode);
    if (pool.length === 0) return null;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function renderCourse(allPlaces) {
    let course = {
      FD6: pickOneFromCategory(allPlaces, 'FD6'),
      CE7: pickOneFromCategory(allPlaces, 'CE7'),
      AT4: pickOneFromCategory(allPlaces, 'AT4')
    };

    function renderSlot(p, fallback, kind) {
      const kindMeta = {
        FD6: { icon: 'restaurant',  label: '밥',       color: 'bg-red-100 text-red-700' },
        CE7: { icon: 'local_cafe',  label: '카페',     color: 'bg-amber-100 text-amber-800' },
        AT4: { icon: 'attractions', label: '즐길거리', color: 'bg-emerald-100 text-emerald-800' }
      }[kind];
      if (!p) {
        return h('div', {
          className: 'flex-1 p-5 rounded-2xl bg-surfaceContainerLowest border border-dashed border-surfaceContainerHighest text-center'
        },
          h('div', { className: `inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold mb-2 ${kindMeta.color}` },
            h('span', { className: 'material-symbols-outlined text-[14px]' }, kindMeta.icon),
            kindMeta.label
          ),
          h('p', { className: 'font-body text-sm text-onSurfaceVariant' }, fallback)
        );
      }
      return h('a', {
        href: p.placeUrl || '#',
        target: p.placeUrl ? '_blank' : undefined,
        rel: 'noopener',
        className: 'flex-1 block p-5 rounded-2xl bg-surfaceContainerLowest hover:-translate-y-0.5 hover:shadow-[0px_8px_20px_rgba(45,51,53,0.08)] transition-all'
      },
        h('div', { className: `inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold mb-2 ${kindMeta.color}` },
          h('span', { className: 'material-symbols-outlined text-[14px]' }, kindMeta.icon),
          kindMeta.label
        ),
        h('h4', { className: 'font-headline font-bold text-base text-onSurface truncate' }, p.name),
        h('p', { className: 'font-body text-xs text-onSurfaceVariant mt-1 truncate' }, p.address || '')
      );
    }

    function paint() {
      courseSlot.innerHTML = '';
      const wrap = h('div', { className: 'bg-gradient-to-br from-primary-dim/10 to-secondaryContainer/30 rounded-[2rem] p-6 md:p-8' });

      wrap.appendChild(
        h('div', { className: 'flex items-center justify-between mb-5 gap-3 flex-wrap' },
          h('div', {},
            h('span', { className: 'font-label text-xs text-primary uppercase tracking-widest' }, '하루 코스 추천'),
            h('h3', { className: 'font-headline text-xl md:text-2xl font-extrabold text-onSurface mt-1' }, '밥 → 카페 → 즐길거리')
          ),
          h('button', {
            className: 'inline-flex items-center gap-1 bg-surfaceContainerLowest hover:bg-surfaceContainer transition text-onSurface font-body text-sm font-medium py-2 px-4 rounded-full',
            onClick: () => {
              course = {
                FD6: pickOneFromCategory(allPlaces, 'FD6'),
                CE7: pickOneFromCategory(allPlaces, 'CE7'),
                AT4: pickOneFromCategory(allPlaces, 'AT4')
              };
              paint();
            }
          },
            h('span', { className: 'material-symbols-outlined text-[18px]' }, 'shuffle'),
            '다른 조합'
          )
        )
      );

      const row = h('div', { className: 'flex flex-col md:flex-row items-stretch gap-3 md:gap-4' });
      row.appendChild(renderSlot(course.FD6, '이 지역에 맛집이 아직 없어요.', 'FD6'));
      row.appendChild(h('div', { className: 'flex md:flex-none items-center justify-center text-primary' },
        h('span', { className: 'material-symbols-outlined text-2xl md:rotate-0 rotate-90' }, 'east')
      ));
      row.appendChild(renderSlot(course.CE7, '이 지역에 카페가 아직 없어요.', 'CE7'));
      row.appendChild(h('div', { className: 'flex md:flex-none items-center justify-center text-primary' },
        h('span', { className: 'material-symbols-outlined text-2xl md:rotate-0 rotate-90' }, 'east')
      ));
      row.appendChild(renderSlot(course.AT4, '이 지역에 즐길거리가 아직 없어요.', 'AT4'));

      wrap.appendChild(row);
      courseSlot.appendChild(wrap);
    }
    paint();
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
        // Kakao + Naver 병렬 호출
        const [kakaoRaw, naverRaw] = await Promise.all([
          multiKeywordSearch(queries, { size: 15 }),
          Promise.allSettled(queries.map(q => naverLocalSearch(q, 5)))
            .then(rs => rs.filter(r => r.status === 'fulfilled').flatMap(r => r.value))
        ]);

        // 정규화 + 이름 기반 dedupe (Kakao가 authoritative, 이미 있으면 skip)
        const kakaoPlaces = kakaoRaw.map(normalizeKakaoPlace);
        const naverPlaces = naverRaw.map(normalizeNaverPlace);
        const normKey = (s) => (s || '').replace(/\s/g, '').toLowerCase();
        const seen = new Set(kakaoPlaces.map(p => normKey(p.name)));
        const uniqueNaver = naverPlaces.filter(p => {
          const k = normKey(p.name);
          if (seen.has(k)) return false;
          seen.add(k);
          return true;
        });
        const allPlaces = [...kakaoPlaces, ...uniqueNaver].slice(0, 1000);
        cachePlaces(allPlaces);

        // Side map (starts with all places)
        const mapApi = PlacesMap({ places: allPlaces });
        mapApi._places = allPlaces; // mobile clone 용으로 places 보관
        mapCol.innerHTML = '';
        mapCol.appendChild(mapApi.el);

        // FAB 노출 + 핸들러 바인딩
        fab.style.display = 'flex';
        fab.onclick = () => openMobileMap(mapApi);

        // Tab state → filters list + map
        let activeTab = 'all';
        let activeCuisine = 'all';
        let landmark = null; // { name, lat, lng, radiusKm }

        function renderLandmarkChip() {
          landmarkChipSlot.innerHTML = '';
          if (landmark) {
            landmarkChipSlot.appendChild(
              h('span', {
                className: 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primaryContainer text-onPrimaryContainer text-xs font-body font-medium'
              },
                h('span', { className: 'material-symbols-outlined text-[15px]' }, 'near_me'),
                `${landmark.name} 주변 ${landmark.radiusKm}km`,
                h('button', {
                  className: 'ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-onPrimaryContainer/10',
                  title: '필터 해제',
                  onClick: () => { landmark = null; landmarkInput.value = ''; applyTab(); }
                },
                  h('span', { className: 'material-symbols-outlined text-[14px]' }, 'close')
                )
              )
            );
          }

          // 취향 활성 chip
          const prefs = AppState.get(STORAGE_KEYS.preferences, {});
          const activePrefSummary = [];
          if (prefs.dietary?.length) {
            const dietLabels = prefs.dietary.map(d => {
              const item = (PICK_DATA.dietary || []).find(x => x.id === d);
              return item?.label || d;
            });
            activePrefSummary.push(...dietLabels);
          }
          if (prefs.spice === 'mild') activePrefSummary.push('순한맛');
          if (prefs.spice === 'hot')  activePrefSummary.push('매운맛 OK');
          if (prefs.companion) {
            const c = (PICK_DATA.companions || []).find(x => x.id === prefs.companion);
            if (c) activePrefSummary.push(c.label + ' 모드');
          }
          if (activePrefSummary.length > 0) {
            landmarkChipSlot.appendChild(
              h('a', {
                href: '#/mypage',
                className: 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondaryContainer text-onSecondaryContainer text-xs font-body font-medium hover:opacity-80 transition-opacity'
              },
                h('span', { className: 'material-symbols-outlined text-[15px]' }, 'tune'),
                activePrefSummary.join(' · '),
                h('span', { className: 'material-symbols-outlined text-[13px] opacity-60' }, 'edit')
              )
            );
          }
        }

        function applyTab() {
          const tab = TABS.find(t => t.id === activeTab);
          let filtered = tab.match ? allPlaces.filter(p => p.category === tab.match) : allPlaces;
          if (activeTab === 'FD6' && activeCuisine !== 'all') {
            filtered = filtered.filter(p => cuisineOf(p) === activeCuisine);
          }
          if (landmark) {
            filtered = filtered.filter(p =>
              Number.isFinite(p.lat) && Number.isFinite(p.lng) &&
              haversineKm(landmark.lat, landmark.lng, p.lat, p.lng) <= landmark.radiusKm
            );
          }
          // 사용자 취향 적용 (식이 제한 필터 + 매운맛 필터 + 동행 가중치 정렬)
          const prefs = AppState.get(STORAGE_KEYS.preferences, {});
          filtered = applyAllPreferences(filtered, prefs);
          renderTabs(
            allPlaces,
            activeTab,
            (id) => { activeTab = id; activeCuisine = 'all'; applyTab(); },
            activeCuisine,
            (cid) => { activeCuisine = cid; applyTab(); }
          );
          renderLandmarkChip();
          renderPlaces(filtered, mapApi);
          mapApi.setPlaces(filtered);
          mapApi._places = filtered;
        }

        // 랜드마크 검색 폼 활성화
        landmarkForm.onsubmit = async (e) => {
          e.preventDefault();
          const q = landmarkInput.value.trim();
          if (!q) return;
          landmarkBtn.disabled = true;
          const orig = landmarkBtn.innerHTML;
          landmarkBtn.innerHTML = '검색 중…';
          try {
            // 현재 region 한정으로 정확도 향상 (예: '서울 강남경찰서')
            const result = await keywordSearch(`${regionLabel(region)} ${q}`, { size: 1 });
            const first = result?.[0];
            if (!first) {
              router.showToast(`"${q}" 위치를 찾지 못했어요. 다른 이름으로 시도해보세요.`);
              return;
            }
            landmark = {
              name: first.place_name,
              lat: parseFloat(first.y),
              lng: parseFloat(first.x),
              radiusKm: 1
            };
            applyTab();
            router.showToast(`📍 ${landmark.name} 주변 1km 표시`);
          } catch (err) {
            router.showToast('검색 중 오류가 발생했어요.');
            console.error(err);
          } finally {
            landmarkBtn.disabled = false;
            landmarkBtn.innerHTML = orig;
          }
        };
        applyTab();

        // One-day course always from full set
        renderCourse(allPlaces);
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
