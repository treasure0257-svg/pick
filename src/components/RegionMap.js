// 시·도 하나의 행정구역 경계를 Leaflet에 그리고, 바깥 tile ↔ 지도 폴리곤 간 양방향 호버
// 연동을 제공한다.
//
// 사용:
//   const map = RegionMap({ regionId, subregions, onSubHover });
//   map.highlightSub('hongdae');
//   map.clearHighlight();
//   container.appendChild(map.el);

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import * as topojson from 'topojson-client';
import { h } from '../utils/dom.js';

const TOPO_URL = '/data/korea-municipalities.topo.json';

// 행정구역 code 앞 2자리 → 시·도 id
const PROVINCE_CODE_PREFIX = {
  '11': 'seoul',
  '26': 'busan',
  '27': 'daegu',
  '28': 'incheon',
  '29': 'gwangju',
  '30': 'daejeon',
  '31': 'ulsan',
  '36': 'sejong',
  '41': 'gyeonggi',
  '42': 'gangwon',
  '43': 'chungbuk',
  '44': 'chungnam',
  '45': 'jeonbuk',
  '46': 'jeonnam',
  '47': 'gyeongbuk',
  '48': 'gyeongnam',
  '50': 'jeju'
};
const ID_TO_PREFIX = Object.fromEntries(
  Object.entries(PROVINCE_CODE_PREFIX).map(([k, v]) => [v, k])
);

let topoCachePromise = null;
function loadTopo() {
  if (!topoCachePromise) {
    topoCachePromise = fetch(TOPO_URL).then(r => r.json());
  }
  return topoCachePromise;
}

// Find which subregion a municipality feature belongs to by keyword matching against its name.
function subIdForFeature(feature, subregions) {
  const name = feature.properties.name || '';
  for (const sub of subregions || []) {
    for (const kw of sub.keywords || []) {
      if (name.includes(kw)) return sub.id;
    }
  }
  return null;
}

export function RegionMap({ regionId, subregions = [], onSubHover } = {}) {
  const mapEl = h('div', { className: 'w-full h-full', style: { minHeight: '320px' } });

  const loadingEl = h('div', {
    className: 'absolute inset-0 flex items-center justify-center bg-surfaceContainerLow text-onSurfaceVariant font-body text-sm gap-2'
  },
    h('span', { className: 'material-symbols-outlined text-xl animate-pulse' }, 'map'),
    '지도 로딩 중…'
  );

  const wrapper = h('div', {
    className: 'relative rounded-2xl overflow-hidden border border-surfaceContainer h-full min-h-[320px]'
  }, mapEl, loadingEl);

  // subId → L.Path[] (GeoJSON layer contains many sub-layers; we index them)
  const subLayers = new Map();
  let currentlyHighlighted = null;

  function styleFor(subId, isHot) {
    if (!subId) {
      return { color: '#94A3B8', weight: 1, fillColor: '#E2E8F0', fillOpacity: 0.35 };
    }
    return isHot
      ? { color: '#7C3AED', weight: 2.5, fillColor: '#A78BFA', fillOpacity: 0.65 }
      : { color: '#7C3AED', weight: 1, fillColor: '#C4B5FD', fillOpacity: 0.35 };
  }

  function paint(subId, isHot) {
    const layers = subLayers.get(subId);
    if (!layers) return;
    const s = styleFor(subId, isHot);
    layers.forEach(l => l.setStyle(s));
  }

  const api = {
    el: wrapper,
    highlightSub(subId) {
      if (currentlyHighlighted === subId) return;
      if (currentlyHighlighted) paint(currentlyHighlighted, false);
      if (subId) paint(subId, true);
      currentlyHighlighted = subId || null;
    },
    clearHighlight() {
      if (currentlyHighlighted) paint(currentlyHighlighted, false);
      currentlyHighlighted = null;
    }
  };

  (async () => {
    try {
      const topo = await loadTopo();
      const objKey = Object.keys(topo.objects)[0];
      const geo = topojson.feature(topo, topo.objects[objKey]);

      const prefix = ID_TO_PREFIX[regionId];
      const features = prefix
        ? geo.features.filter(f => (f.properties.code || '').startsWith(prefix))
        : geo.features;

      if (features.length === 0) {
        loadingEl.classList.add('hidden');
        wrapper.appendChild(
          h('div', {
            className: 'absolute inset-0 flex items-center justify-center bg-surfaceContainerLow text-onSurfaceVariant font-body text-sm'
          }, '이 지역의 지도 데이터가 없어요')
        );
        return;
      }

      const map = L.map(mapEl, {
        zoomControl: false,
        scrollWheelZoom: false,
        dragging: true,
        doubleClickZoom: false,
        keyboard: false,
        attributionControl: false
      });

      // 2-layer: 회색 베이스 (라벨 없음) + 표준 OSM (한국어 라벨 오버레이)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
        subdomains: 'abcd',
        maxZoom: 19,
        opacity: 0.55
      }).addTo(map);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        subdomains: 'abc',
        maxZoom: 19,
        opacity: 0.5
      }).addTo(map);

      const geoLayer = L.geoJSON({ type: 'FeatureCollection', features }, {
        style: (feature) => {
          const subId = subIdForFeature(feature, subregions);
          return styleFor(subId, false);
        },
        onEachFeature: (feature, layer) => {
          const subId = subIdForFeature(feature, subregions);

          if (subId) {
            if (!subLayers.has(subId)) subLayers.set(subId, []);
            subLayers.get(subId).push(layer);

            layer.on('mouseover', () => {
              api.highlightSub(subId);
              onSubHover?.(subId);
            });
            layer.on('mouseout', () => {
              api.clearHighlight();
              onSubHover?.(null);
            });
          } else {
            // 매칭 안된 구/군은 짧은 호버 툴팁 (이름만)
            layer.bindTooltip(feature.properties.name, {
              direction: 'top', offset: [0, -4], className: 'region-map-tooltip'
            });
          }
        }
      }).addTo(map);

      map.fitBounds(geoLayer.getBounds(), { padding: [12, 12] });

      // 각 sub별로 그룹 중심에 영구 라벨 마커 추가
      subLayers.forEach((layers, subId) => {
        const sub = subregions.find(s => s.id === subId);
        if (!sub || layers.length === 0) return;
        const bounds = layers.reduce((acc, l) => {
          const b = l.getBounds();
          return acc ? acc.extend(b) : L.latLngBounds(b.getSouthWest(), b.getNorthEast());
        }, null);
        if (!bounds) return;
        const center = bounds.getCenter();

        const labelIcon = L.divIcon({
          className: 'region-sub-label-wrap',
          html: `<span class="region-sub-label">${sub.label}</span>`,
          iconSize: [0, 0]
        });
        const marker = L.marker(center, { icon: labelIcon, interactive: false, keyboard: false });
        marker.addTo(map);
      });

      loadingEl.classList.add('hidden');
    } catch (e) {
      console.error('[RegionMap]', e);
      loadingEl.classList.add('hidden');
      wrapper.appendChild(
        h('div', {
          className: 'absolute inset-0 flex items-center justify-center bg-surfaceContainerLow text-onSurfaceVariant font-body text-sm px-4 text-center'
        }, '지도를 불러오지 못했어요. 새로고침해주세요.')
      );
    }
  })();

  return api;
}
