// Kakao Map 위에 선택된 시·도의 행정구역 경계를 overlay polygon 으로 그려서,
// 실제 지도 타일(도로·랜드마크)을 배경으로 깔고 선택된 권역을 강조한다.
// 바깥 tile ↔ polygon 간 양방향 호버 API 는 이전과 동일.
//
// 사용:
//   const map = RegionMap({ regionId, subregions, onSubHover });
//   map.highlightSub('hongdae');
//   map.clearHighlight();
//   container.appendChild(map.el);

import * as topojson from 'topojson-client';
import { h } from '../utils/dom.js';
import { ensureKakaoServices } from '../services/kakaoLocal.js';

const TOPO_URL = '/data/korea-municipalities.topo.json';

// 행정구역 code 앞 2자리 → 시·도 id (southkorea/southkorea-maps 2018 레거시 KOSTAT).
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

// feature 의 municipality 이름이 subregion 키워드에 매칭되면 그 sub.id 반환
function subIdForFeature(feature, subregions) {
  const name = feature.properties.name || '';
  for (const sub of subregions || []) {
    for (const kw of sub.keywords || []) {
      if (name.includes(kw)) return sub.id;
    }
  }
  return null;
}

// GeoJSON Polygon/MultiPolygon 의 outer rings → [lat,lng] 배열 리스트
function featureToRings(feature) {
  const geom = feature.geometry;
  if (!geom) return [];
  if (geom.type === 'Polygon') {
    // coordinates: [outer, hole1, hole2, ...]
    return [geom.coordinates[0]];
  }
  if (geom.type === 'MultiPolygon') {
    // coordinates: [polygon1, polygon2, ...] where each polygon = [outer, ...holes]
    return geom.coordinates.map(poly => poly[0]);
  }
  return [];
}

const TARGET_STYLE = {
  strokeWeight: 1.5,
  strokeColor: '#FFFFFF',
  strokeOpacity: 0.95,
  strokeStyle: 'solid',
  fillColor: '#2563EB',
  fillOpacity: 0.38
};

const TARGET_HOT_STYLE = {
  strokeWeight: 2,
  strokeColor: '#FFFFFF',
  strokeOpacity: 1,
  strokeStyle: 'solid',
  fillColor: '#7C3AED',
  fillOpacity: 0.7
};

export function RegionMap({ regionId, subregions = [], onSubHover } = {}) {
  const mapEl = h('div', { className: 'w-full h-full', style: { minHeight: '420px' } });

  const loadingEl = h('div', {
    className: 'absolute inset-0 flex items-center justify-center bg-surfaceContainerLow text-onSurfaceVariant font-body text-sm gap-2 z-10'
  },
    h('span', { className: 'material-symbols-outlined text-xl animate-pulse' }, 'map'),
    '지도 로딩 중…'
  );

  const wrapper = h('div', {
    className: 'relative rounded-2xl overflow-hidden border border-surfaceContainer h-full min-h-[420px]'
  }, mapEl, loadingEl);

  // subId → kakao.maps.Polygon[]
  const subPolygons = new Map();
  let currentlyHighlighted = null;

  function paintSub(subId, isHot) {
    const polys = subPolygons.get(subId);
    if (!polys) return;
    const opts = isHot ? TARGET_HOT_STYLE : TARGET_STYLE;
    polys.forEach(p => p.setOptions(opts));
  }

  const api = {
    el: wrapper,
    highlightSub(subId) {
      if (currentlyHighlighted === subId) return;
      if (currentlyHighlighted) paintSub(currentlyHighlighted, false);
      if (subId) paintSub(subId, true);
      currentlyHighlighted = subId || null;
    },
    clearHighlight() {
      if (currentlyHighlighted) paintSub(currentlyHighlighted, false);
      currentlyHighlighted = null;
    }
  };

  (async () => {
    try {
      await ensureKakaoServices();
      const kakao = window.kakao;

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
            className: 'absolute inset-0 flex items-center justify-center bg-surfaceContainerLow text-onSurfaceVariant font-body text-sm'
          }, '이 지역의 지도 데이터가 없어요')
        );
        return;
      }

      // 초기 center/level — 타겟 bounds 계산 후 setBounds 로 덮어씀
      const map = new kakao.maps.Map(mapEl, {
        center: new kakao.maps.LatLng(36.5, 127.8),
        level: 10,
        draggable: true,
        scrollwheel: true,
        disableDoubleClickZoom: false
      });

      const overallBounds = new kakao.maps.LatLngBounds();

      // 타겟 시·도 municipality polygon 들을 overlay 로 추가
      targetFeatures.forEach(feature => {
        const rings = featureToRings(feature);
        if (rings.length === 0) return;
        const subId = subIdForFeature(feature, subregions);

        rings.forEach(ring => {
          const path = ring.map(([lng, lat]) => {
            const ll = new kakao.maps.LatLng(lat, lng);
            overallBounds.extend(ll);
            return ll;
          });
          const polygon = new kakao.maps.Polygon({
            map,
            path,
            ...TARGET_STYLE
          });

          if (subId) {
            if (!subPolygons.has(subId)) subPolygons.set(subId, []);
            subPolygons.get(subId).push(polygon);

            kakao.maps.event.addListener(polygon, 'mouseover', () => {
              api.highlightSub(subId);
              onSubHover?.(subId);
            });
            kakao.maps.event.addListener(polygon, 'mouseout', () => {
              api.clearHighlight();
              onSubHover?.(null);
            });
          }
        });

        // 각 구/군 이름 라벨을 feature 중심에 CustomOverlay 로 표시
        const centerBounds = new kakao.maps.LatLngBounds();
        rings.forEach(ring => ring.forEach(([lng, lat]) => centerBounds.extend(new kakao.maps.LatLng(lat, lng))));
        const center = centerBounds.getCenter();
        const name = feature.properties?.name || '';
        if (name) {
          const badge = document.createElement('span');
          badge.className = 'region-feature-label';
          badge.textContent = name;
          new kakao.maps.CustomOverlay({
            map, position: center, content: badge, yAnchor: 0.5, xAnchor: 0.5, zIndex: 3
          });
        }
      });

      // 타겟 전체가 한눈에 들어오도록 — 좌우 여백 넉넉히
      // container 가 최초 렌더에서 0 사이즈이면 Kakao 의 setBounds 가 기본 center 에 머무름.
      // 즉시 한 번 적용 + ResizeObserver 로 실제 사이즈가 들어왔을 때 relayout + 재fit.
      if (!overallBounds.isEmpty()) {
        const applyFit = () => {
          map.relayout();
          map.setBounds(overallBounds, 24, 24, 24, 24);
        };
        applyFit();
        let retried = false;
        const ro = new ResizeObserver((entries) => {
          if (retried) return;
          const rect = entries[0].contentRect;
          if (rect.width > 50 && rect.height > 50) {
            retried = true;
            applyFit();
            ro.disconnect();
          }
        });
        ro.observe(mapEl);
      }

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
