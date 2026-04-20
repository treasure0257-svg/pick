// Kakao Map에 장소 여러 개를 번호 핀으로 표시. list ↔ map 연동용 메서드 제공.
//
// const map = PlacesMap({ places });
// map.panTo(placeId); map.highlight(placeId);
// container.appendChild(map.el);

import { h } from '../utils/dom.js';
import { ensureKakaoServices } from '../services/kakaoLocal.js';

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
  const overlaysById = new Map();
  let currentHighlight = null;

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
    clearHighlight() { api.highlight(null); }
  };

  (async () => {
    try {
      await ensureKakaoServices();
      const kakao = window.kakao;

      const valid = places.filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lng));
      if (valid.length === 0) {
        loading.textContent = '표시할 장소 좌표가 없어요';
        return;
      }

      const firstLatLng = new kakao.maps.LatLng(valid[0].lat, valid[0].lng);
      map = new kakao.maps.Map(mapEl, { center: firstLatLng, level: 5 });

      const bounds = new kakao.maps.LatLngBounds();

      valid.forEach((p, idx) => {
        const position = new kakao.maps.LatLng(p.lat, p.lng);
        bounds.extend(position);

        const badge = document.createElement('div');
        badge.className = 'places-map-pin';
        badge.textContent = String(idx + 1);
        badge.title = p.name;

        new kakao.maps.CustomOverlay({
          map,
          position,
          content: badge,
          yAnchor: 1,
          xAnchor: 0.5
        });

        overlaysById.set(p.id, { el: badge, position });
      });

      map.setBounds(bounds, 40, 40, 40, 40);
      loading.classList.add('hidden');
    } catch (e) {
      console.error('[PlacesMap]', e);
      loading.textContent = '지도를 불러오지 못했어요';
    }
  })();

  return api;
}
