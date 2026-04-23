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

const PREFIX_TO_SIDO_LABEL = {
  '11': '서울', '21': '부산', '22': '대구', '23': '인천', '24': '광주',
  '25': '대전', '26': '울산', '29': '세종', '31': '경기', '32': '강원',
  '33': '충북', '34': '충남', '35': '전북', '36': '전남',
  '37': '경북', '38': '경남', '39': '제주'
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
  const mapEl = h('div', {
    className: 'w-full h-full',
    style: { minHeight: '420px', background: 'transparent' }
  });

  const loadingEl = h('div', {
    className: 'absolute inset-0 flex items-center justify-center text-onSurfaceVariant font-body text-sm gap-2'
  },
    h('span', { className: 'material-symbols-outlined text-xl animate-pulse' }, 'map'),
    '지도 로딩 중…'
  );

  // 부드러운 하늘·바다 톤 배경 — 기존 회색 대신 지도 느낌을 살려줌
  const wrapper = h('div', {
    className: 'relative rounded-2xl overflow-hidden border border-surfaceContainer h-full min-h-[420px] bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50'
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

  // 주변 시·도용 뮤트 스타일 — 맥락만 주고 시선은 타겟으로 유지
  const neighborStyle = {
    color: '#CBD5E1', weight: 0.8, fillColor: '#E2E8F0', fillOpacity: 0.55
  };

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
      const targetFeatures = prefix
        ? geo.features.filter(f => (f.properties.code || '').startsWith(prefix))
        : geo.features;

      if (targetFeatures.length === 0) {
        loadingEl.classList.add('hidden');
        wrapper.appendChild(
          h('div', {
            className: 'absolute inset-0 flex items-center justify-center text-onSurfaceVariant font-body text-sm'
          }, '이 지역의 지도 데이터가 없어요')
        );
        return;
      }

      // 타깃 바운즈 계산 후 약간 확장 → 주변 시·도 feature 를 찾아 맥락으로 그려줌
      const targetBounds = L.geoJSON({ type: 'FeatureCollection', features: targetFeatures }).getBounds();
      const neighborBounds = targetBounds.pad(0.45);
      const neighborFeatures = prefix
        ? geo.features.filter(f => {
            const code = f.properties.code || '';
            if (code.startsWith(prefix)) return false;
            try {
              return neighborBounds.intersects(L.geoJSON(f).getBounds());
            } catch { return false; }
          })
        : [];

      // 타일 없는 정적 테마 지도 (배경은 wrapper 그라데이션)
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

      // 1) 주변 시·도 (뮤트, 인터랙션 없음) — 먼저 그려서 타겟 아래 배치
      if (neighborFeatures.length > 0) {
        L.geoJSON({ type: 'FeatureCollection', features: neighborFeatures }, {
          style: () => neighborStyle,
          interactive: false
        }).addTo(map);
      }

      // 2) 타겟 시·도 — 상위 레이어로 포커스
      const geoLayer = L.geoJSON({ type: 'FeatureCollection', features: targetFeatures }, {
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

      // 타겟 중심 + 살짝 여유 (주변 맥락 feature 가 살짝 보이도록)
      map.fitBounds(geoLayer.getBounds(), { padding: [24, 24] });

      // 타겟 구/군 이름 라벨
      targetFeatures.forEach(feature => {
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

      // 주변 시·도 이름 라벨 (작고 연하게) — 맥락용
      const seenSidoCodes = new Set();
      neighborFeatures.forEach(feature => {
        const code = (feature.properties.code || '').slice(0, 2);
        if (!code || seenSidoCodes.has(code)) return;
        // 각 주변 시·도의 첫 번째 feature 에만 시·도 단위 라벨 표시
        seenSidoCodes.add(code);
        const sidoLabel = PREFIX_TO_SIDO_LABEL[code];
        if (!sidoLabel) return;
        const siblingFeatures = neighborFeatures.filter(f => (f.properties.code || '').startsWith(code));
        const center = L.geoJSON({ type: 'FeatureCollection', features: siblingFeatures }).getBounds().getCenter();
        const labelIcon = L.divIcon({
          className: 'region-feature-label-wrap',
          html: `<span class="region-neighbor-label">${sidoLabel}</span>`,
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
