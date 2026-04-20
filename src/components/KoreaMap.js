// Leaflet + OpenStreetMap 기반 한국 지도.
// API 키 불필요, CDN 의존 없음 (leaflet npm 패키지로 번들). 17개 시·도 중심에 라벨 마커를 찍고
// 클릭 시 #/region?id=<id> 로 이동.

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { h } from '../utils/dom.js';
import { REGIONS, countPlacesByRegion } from '../regions.js';
import { PICK_DATA } from '../data.js';

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

export function KoreaMap({ router } = {}) {
  const mapEl = h('div', {
    className: 'w-full h-full',
    style: { minHeight: '320px' }
  });

  const wrapper = h('div', {
    className: 'relative rounded-2xl overflow-hidden border border-surfaceContainer'
  }, mapEl);

  queueMicrotask(() => {
    try {
      const map = L.map(mapEl, {
        center: [36.3, 127.8],
        zoom: 7,
        minZoom: 6,
        maxZoom: 12,
        scrollWheelZoom: false,
        zoomControl: true,
        attributionControl: true
      });

      // 부드러운 톤의 OSM 타일 (CartoDB Positron)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap, &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19
      }).addTo(map);

      const counts = countPlacesByRegion(PICK_DATA.places);

      REGIONS.forEach(r => {
        const coord = REGION_COORDS[r.id];
        if (!coord) return;
        const count = counts[r.id] || 0;
        const isEmpty = count === 0;

        const badgeHtml = isEmpty
          ? `<span class="pick-pin pick-pin--empty">${r.label}</span>`
          : `<span class="pick-pin pick-pin--active">${r.label}<span class="pick-pin__count">${count}</span></span>`;

        const icon = L.divIcon({
          className: 'pick-pin-wrap',
          html: badgeHtml,
          iconSize: [0, 0], // 실제 크기는 HTML로 결정
          iconAnchor: [0, 0]
        });

        const marker = L.marker(coord, { icon, title: r.label }).addTo(map);
        marker.on('click', () => {
          router?.navigate?.(`#/region?id=${r.id}`) ?? (location.hash = `#/region?id=${r.id}`);
        });
      });
    } catch (e) {
      console.error('[KoreaMap]', e);
      wrapper.appendChild(h('div', {
        className: 'absolute inset-0 flex items-center justify-center bg-surfaceContainerLow text-onSurfaceVariant font-body text-sm'
      }, '지도를 불러오지 못했어요.'));
    }
  });

  return wrapper;
}
