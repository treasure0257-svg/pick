// Kakao Map에 장소 여러 개를 카테고리 색상 핀으로 표시. list ↔ map 연동용 메서드 제공.
//
// const map = PlacesMap({ places });
// map.panTo(placeId); map.highlight(placeId); map.setPlaces(newPlaces);
// container.appendChild(map.el);

import { h } from '../utils/dom.js';
import { ensureKakaoServices } from '../services/kakaoLocal.js';

const CATEGORY_COLORS = {
  FD6: '#EF4444', // 맛집 red
  CE7: '#B45309', // 카페 brown
  AT4: '#10B981', // 명소 green
  CT1: '#8B5CF6', // 문화 purple
  AD5: '#0EA5E9', // 숙박 blue
  DEFAULT: '#6366F1'
};

export function PlacesMap({ places = [] } = {}) {
  const mapEl = h('div', { className: 'w-full h-full', style: { minHeight: '420px' } });
  const loading = h('div', {
    className: 'absolute inset-0 flex items-center justify-center bg-surfaceContainerLow text-onSurfaceVariant font-body text-sm gap-2'
  },
    h('span', { className: 'material-symbols-outlined text-xl animate-pulse' }, 'map'),
    '지도 로딩 중…'
  );
  const wrapper = h('div', {
    className: 'relative rounded-2xl overflow-hidden border border-surfaceContainer h-full min-h-[420px] bg-surfaceContainerLow'
  }, mapEl, loading);

  let map = null;
  const overlays = []; // [{ placeId, el, overlay, position }]
  const overlaysById = new Map();
  let currentHighlight = null;
  let sdkReady = null;

  function clearOverlays() {
    overlays.forEach(({ overlay }) => overlay.setMap(null));
    overlays.length = 0;
    overlaysById.clear();
  }

  function addPlaces(list) {
    if (!map) return;
    const kakao = window.kakao;
    const valid = list.filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lng));
    const bounds = new kakao.maps.LatLngBounds();

    valid.forEach(p => {
      const position = new kakao.maps.LatLng(p.lat, p.lng);
      bounds.extend(position);

      const color = CATEGORY_COLORS[p.category] || CATEGORY_COLORS.DEFAULT;
      const icon = p.category === 'FD6' ? 'restaurant'
                 : p.category === 'CE7' ? 'local_cafe'
                 : p.category === 'AT4' ? 'attractions'
                 : p.category === 'CT1' ? 'theater_comedy'
                 : p.category === 'AD5' ? 'hotel'
                 : 'place';

      const badge = document.createElement('div');
      badge.className = 'places-map-pin';
      badge.style.background = color;
      badge.innerHTML = `<span class="material-symbols-outlined" style="font-size:15px;">${icon}</span>`;
      badge.title = p.name;

      const overlay = new kakao.maps.CustomOverlay({
        map, position, content: badge, yAnchor: 1, xAnchor: 0.5
      });
      overlays.push({ placeId: p.id, el: badge, overlay, position });
      overlaysById.set(p.id, { el: badge, position });
    });

    if (valid.length > 0) map.setBounds(bounds, 40, 40, 40, 40);
  }

  const api = {
    el: wrapper,
    panTo(placeId) {
      const rec = overlaysById.get(placeId);
      if (!rec || !map) return;
      map.panTo(rec.position);
    },
    highlight(placeId) {
      if (currentHighlight === placeId) return;
      if (currentHighlight) {
        const prev = overlaysById.get(currentHighlight);
        if (prev?.el) prev.el.classList.remove('is-hot');
      }
      if (placeId) {
        const cur = overlaysById.get(placeId);
        if (cur?.el) cur.el.classList.add('is-hot');
      }
      currentHighlight = placeId || null;
    },
    clearHighlight() { api.highlight(null); },
    setPlaces(list) {
      if (!sdkReady) return;
      sdkReady.then(() => {
        clearOverlays();
        addPlaces(list);
      });
    }
  };

  sdkReady = (async () => {
    try {
      await ensureKakaoServices();
      const kakao = window.kakao;

      if (places.length === 0) {
        loading.textContent = '표시할 장소가 없어요';
        return;
      }

      const first = places.find(p => Number.isFinite(p.lat) && Number.isFinite(p.lng));
      const center = first ? new kakao.maps.LatLng(first.lat, first.lng) : new kakao.maps.LatLng(36.3, 127.8);
      map = new kakao.maps.Map(mapEl, { center, level: 5 });

      addPlaces(places);
      loading.classList.add('hidden');
    } catch (e) {
      console.error('[PlacesMap]', e);
      loading.textContent = '지도를 불러오지 못했어요';
    }
  })();

  return api;
}
