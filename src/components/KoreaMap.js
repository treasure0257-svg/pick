// Kakao Maps 기반 한국 지도. 17개 시·도 중심에 라벨 마커를 찍고, 클릭 시
// #/region?id=<id> 로 이동. Kakao Maps SDK는 카카오 로그인과 별개지만 같은 JS 키를 사용한다
// (Web 플랫폼 도메인은 Kakao Developers 콘솔에서 이미 등록돼 있어야 함).

import { h } from '../utils/dom.js';
import { REGIONS, countPlacesByRegion } from '../regions.js';
import { PICK_DATA } from '../data.js';

const SDK_BASE = 'https://dapi.kakao.com/v2/maps/sdk.js';

// 각 시·도의 대표 좌표 (주요 시청 또는 지리적 중심).
const REGION_COORDS = {
  seoul:     [37.5665, 126.9780],
  gyeonggi:  [37.2750, 127.0095],
  incheon:   [37.4563, 126.7052],
  gangwon:   [37.8228, 128.1555],
  chungbuk:  [36.6357, 127.4914],
  chungnam:  [36.6010, 126.6608],
  sejong:    [36.4800, 127.2890],
  daejeon:   [36.3504, 127.3845],
  jeonbuk:   [35.8242, 127.1480],
  jeonnam:   [34.9906, 126.4796],
  gwangju:   [35.1595, 126.8526],
  gyeongbuk: [36.5684, 128.7295],
  gyeongnam: [35.2280, 128.6811],
  daegu:     [35.8714, 128.6014],
  ulsan:     [35.5384, 129.3114],
  busan:     [35.1796, 129.0756],
  jeju:      [33.4996, 126.5312]
};

let sdkLoadPromise = null;
function loadKakaoMapsSdk() {
  if (window.kakao?.maps) return Promise.resolve();
  if (sdkLoadPromise) return sdkLoadPromise;

  const key = import.meta.env.VITE_KAKAO_JS_KEY;
  if (!key || key === 'REPLACE_ME') {
    return Promise.reject(new Error('VITE_KAKAO_JS_KEY is missing'));
  }

  sdkLoadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-kakao-maps-sdk]');
    const onReady = () => {
      // autoload=false 이므로 kakao.maps.load 로 진입 대기
      if (window.kakao && window.kakao.maps && window.kakao.maps.load) {
        window.kakao.maps.load(() => resolve());
      } else {
        reject(new Error('Kakao Maps SDK loaded but kakao.maps.load missing'));
      }
    };

    if (existing) {
      existing.addEventListener('load', onReady, { once: true });
      existing.addEventListener('error', () => reject(new Error('Kakao Maps SDK load failed')), { once: true });
      return;
    }

    const s = document.createElement('script');
    s.src = `${SDK_BASE}?appkey=${key}&autoload=false&libraries=services`;
    s.async = true;
    s.dataset.kakaoMapsSdk = '1';
    s.onload = onReady;
    s.onerror = () => reject(new Error('Kakao Maps SDK load failed'));
    document.head.appendChild(s);
  });

  return sdkLoadPromise;
}

export function KoreaMap({ router, onError } = {}) {
  const mapEl = h('div', {
    className: 'w-full h-full',
    style: { minHeight: '320px' }
  });

  const loading = h('div', {
    className: 'absolute inset-0 flex items-center justify-center bg-surfaceContainerLow text-onSurfaceVariant font-body text-sm'
  },
    h('span', { className: 'material-symbols-outlined text-2xl mr-2 animate-pulse' }, 'map'),
    '지도 로딩 중…'
  );

  const fallback = h('div', {
    className: 'hidden absolute inset-0 flex items-center justify-center bg-surfaceContainerLow text-onSurfaceVariant font-body text-sm px-6 text-center'
  });

  const wrapper = h('div', {
    className: 'relative rounded-2xl overflow-hidden border border-surfaceContainer'
  },
    mapEl,
    loading,
    fallback
  );

  // Init (deferred so the DOM node is attached first)
  queueMicrotask(async () => {
    try {
      await loadKakaoMapsSdk();
      const kakao = window.kakao;

      const map = new kakao.maps.Map(mapEl, {
        center: new kakao.maps.LatLng(36.3, 127.8),
        level: 13,
        draggable: true,
        scrollwheel: false
      });

      const counts = countPlacesByRegion(PICK_DATA.places);

      REGIONS.forEach(r => {
        const coord = REGION_COORDS[r.id];
        if (!coord) return;
        const [lat, lng] = coord;
        const position = new kakao.maps.LatLng(lat, lng);
        const count = counts[r.id] || 0;
        const isEmpty = count === 0;

        // 커스텀 오버레이: 배지 형태 라벨 + 카운트
        const content = document.createElement('a');
        content.href = `#/region?id=${r.id}`;
        content.setAttribute('aria-label', `${r.label} ${isEmpty ? '준비 중' : `${count}곳`}`);
        content.className = `inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-body font-semibold text-xs shadow-md transition-transform hover:-translate-y-0.5 ${
          isEmpty
            ? 'bg-white/90 text-onSurfaceVariant border border-surfaceContainer'
            : 'bg-primary text-onPrimary'
        }`;
        content.textContent = r.label;
        if (!isEmpty) {
          const badge = document.createElement('span');
          badge.className = 'bg-white/90 text-primary rounded-full w-4 h-4 inline-flex items-center justify-center text-[10px] font-bold';
          badge.textContent = String(count);
          content.appendChild(badge);
        }

        new kakao.maps.CustomOverlay({
          map,
          position,
          content,
          yAnchor: 0.5,
          xAnchor: 0.5
        });
      });

      loading.classList.add('hidden');
    } catch (e) {
      console.error('[KoreaMap]', e);
      loading.classList.add('hidden');
      fallback.classList.remove('hidden');
      fallback.textContent = '지도를 불러오지 못했어요. 네트워크나 Kakao 앱 키 설정을 확인해주세요.';
      onError?.(e);
    }
  });

  return wrapper;
}
