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

// 행정구역 code 앞 2자리 → 시·도 id.
// southkorea/southkorea-maps 2018 데이터가 사용하는 레거시 KOSTAT 코드 체계:
// Seoul 11, Busan 21, Daegu 22, Incheon 23, Gwangju 24, Daejeon 25, Ulsan 26,
// Sejong 29, Gyeonggi 31, Gangwon 32, Chungbuk 33, Chungnam 34,
// Jeonbuk 35, Jeonnam 36, Gyeongbuk 37, Gyeongnam 38, Jeju 39
const ID_TO_PREFIX = {
  seoul: '11', busan: '21', daegu: '22', incheon: '23', gwangju: '24',
  daejeon: '25', ulsan: '26', sejong: '29', gyeonggi: '31', gangwon: '32',
  chungbuk: '33', chungnam: '34', jeonbuk: '35', jeonnam: '36',
  gyeongbuk: '37', gyeongnam: '38', jeju: '39'
};

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
  const mapEl = h('div', { className: 'w-full h-full', style: { minHeight: '420px' } });

  const loadingEl = h('div', {
    className: 'absolute inset-0 flex items-center justify-center bg-surfaceContainerLow text-onSurfaceVariant font-body text-sm gap-2'
  },
    h('span', { className: 'material-symbols-outlined text-xl animate-pulse' }, 'map'),
    '지도 로딩 중…'
  );

  const wrapper = h('div', {
    className: 'relative rounded-2xl overflow-hidden border border-surfaceContainer h-full min-h-[420px]'
  }, mapEl, loadingEl);

  // subId → L.Path[] (GeoJSON layer contains many sub-layers; we index them)
  const subLayers = new Map();
  let currentlyHighlighted = null;

  function styleFor(subId, isHot) {
    // 서브에 매칭된 구/군 (데이터 분포 대상)
    if (subId) {
      return isHot
        ? { color: '#FFFFFF', weight: 2, fillColor: '#7C3AED', fillOpacity: 0.95 }
        : { color: '#FFFFFF', weight: 1.5, fillColor: '#2563EB', fillOpacity: 0.88 };
    }
    // 매칭 안 되는 구/군은 한 톤 약한 파란색
    return { color: '#FFFFFF', weight: 1.5, fillColor: '#60A5FA', fillOpacity: 0.72 };
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

      // 타일 없는 정적 테마 지도 (배경은 컨테이너 색)
      const map = L.map(mapEl, {
        zoomControl: false,
        scrollWheelZoom: false,
        dragging: false,
        doubleClickZoom: false,
        touchZoom: false,
        boxZoom: false,
        keyboard: false,
        attributionControl: false,
        zoomSnap: 0.25
      });

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
          }
        }
      }).addTo(map);

      // 해당 시·도 전체가 한눈에 들어오게 맞춤
      map.fitBounds(geoLayer.getBounds(), { padding: [12, 12] });

      // 각 구/군별로 이름 라벨을 중심에 영구 표시
      features.forEach(feature => {
        const center = L.geoJSON(feature).getBounds().getCenter();
        const name = feature.properties?.name || '';
        if (!name) return;
        const labelIcon = L.divIcon({
          className: 'region-feature-label-wrap',
          html: `<span class="region-feature-label">${name}</span>`,
          iconSize: [0, 0]
        });
        L.marker(center, { icon: labelIcon, interactive: false, keyboard: false }).addTo(map);
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
