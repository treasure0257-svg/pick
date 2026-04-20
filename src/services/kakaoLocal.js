// Kakao Maps JS SDK 의 services 라이브러리를 동적 로드하고, 키워드/카테고리 기반
// 장소 검색을 Promise 기반 API로 감싼다. 브라우저에서 직접 호출 가능 (KA 헤더 자동 처리).
//
// 사전 요건:
// - VITE_KAKAO_JS_KEY 환경변수
// - 해당 Kakao 앱에서 "카카오맵" 사용 설정 ON (OPEN_MAP_AND_LOCAL 활성화)
// - Web 플랫폼 도메인에 실행 origin 등록 (pick-concierge.web.app 등)

const SDK_BASE = 'https://dapi.kakao.com/v2/maps/sdk.js';

let sdkPromise = null;

export function ensureKakaoServices() {
  if (window.kakao?.maps?.services?.Places) return Promise.resolve();
  if (sdkPromise) return sdkPromise;

  const key = import.meta.env.VITE_KAKAO_JS_KEY;
  if (!key || key === 'REPLACE_ME') {
    return Promise.reject(new Error('VITE_KAKAO_JS_KEY is missing'));
  }

  sdkPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-kakao-maps-sdk]');
    const onReady = () => {
      if (window.kakao?.maps?.load) {
        window.kakao.maps.load(() => resolve());
      } else {
        reject(new Error('Kakao SDK loaded but maps.load missing'));
      }
    };

    if (existing) {
      existing.addEventListener('load', onReady, { once: true });
      existing.addEventListener('error', () => reject(new Error('Kakao SDK load failed')), { once: true });
      return;
    }

    const s = document.createElement('script');
    s.src = `${SDK_BASE}?appkey=${key}&autoload=false&libraries=services`;
    s.async = true;
    s.dataset.kakaoMapsSdk = '1';
    s.onload = onReady;
    s.onerror = () => reject(new Error('Kakao SDK load failed'));
    document.head.appendChild(s);
  });

  return sdkPromise;
}

// Kakao 카테고리 그룹 코드 (우리 앱에서 쓰는 카테고리와 매핑)
export const KAKAO_CATEGORY = {
  food:      'FD6', // 음식점 → 맛집
  cafe:      'CE7', // 카페
  attraction:'AT4', // 관광명소
  culture:   'CT1', // 문화시설
  lodging:   'AD5'  // 숙박
};

// 우리 앱의 category id → Kakao category_group_code 매핑 (검색 힌트로 사용)
export const LOCAL_CATEGORY_MAP = {
  food:    'FD6',
  cafe:    'CE7',
  date:    null,   // 카테고리 코드 없음 → 키워드 검색
  outdoor: 'AT4',
  active:  null,
  culture: 'CT1',
  travel:  'AT4'
};

function dedupe(list) {
  const seen = new Set();
  return list.filter(p => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });
}

// 키워드로 검색. options: { size(1-15), page(1-45), rect("lng1,lat1,lng2,lat2") }
export async function keywordSearch(query, options = {}) {
  await ensureKakaoServices();
  return new Promise((resolve, reject) => {
    const places = new window.kakao.maps.services.Places();
    places.keywordSearch(query, (data, status) => {
      if (status === window.kakao.maps.services.Status.OK) resolve(data);
      else if (status === window.kakao.maps.services.Status.ZERO_RESULT) resolve([]);
      else reject(new Error('Kakao keywordSearch: ' + status));
    }, { size: 15, ...options });
  });
}

// 여러 키워드 한꺼번에 → dedupe해서 반환
export async function multiKeywordSearch(queries, options = {}) {
  const results = await Promise.allSettled(queries.map(q => keywordSearch(q, options)));
  const combined = [];
  for (const r of results) {
    if (r.status === 'fulfilled') combined.push(...r.value);
  }
  return dedupe(combined);
}

// Kakao place → 우리 앱 내부 공통 스키마로 정규화 (saved 키 호환)
export function normalizeKakaoPlace(kp) {
  return {
    id: 'kakao:' + kp.id,
    source: 'kakao',
    kakaoId: kp.id,
    name: kp.place_name,
    address: kp.road_address_name || kp.address_name,
    addressLegacy: kp.address_name,
    phone: kp.phone || '',
    category: kp.category_group_code || '',
    categoryLabel: kp.category_group_name || '',
    categoryFull: kp.category_name || '',
    lat: parseFloat(kp.y),
    lng: parseFloat(kp.x),
    placeUrl: kp.place_url,
    image: null,
    blurb: kp.category_name ? kp.category_name.split('>').slice(-1)[0].trim() : ''
  };
}
