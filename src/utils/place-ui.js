// 장소 카드·디테일에서 공유되는 UI 헬퍼.

import { h } from './dom.js';
import { isSaved, savePlace } from '../App.js';

export function makeSaveBtn(p, router, { variant = 'link' } = {}) {
  const btn = h('button', { type: 'button' });
  function sync() {
    const saved = isSaved(p.id);
    if (variant === 'button') {
      btn.className = `inline-flex items-center justify-center gap-1 px-4 py-2.5 rounded-full text-sm font-body font-semibold transition-colors ${
        saved ? 'bg-primary text-onPrimary' : 'bg-surfaceContainerLowest text-onSurface hover:bg-surfaceContainer'
      }`;
    } else {
      btn.className = `transition-colors inline-flex items-center gap-1 text-xs font-medium ${saved ? 'text-primary' : 'text-onSurfaceVariant hover:text-primary'}`;
    }
    btn.innerHTML = '';
    btn.appendChild(h('span', {
      className: variant === 'button' ? 'material-symbols-outlined text-[18px]' : 'material-symbols-outlined text-[18px]',
      style: saved ? { fontVariationSettings: "'FILL' 1" } : {}
    }, saved ? 'bookmark' : 'bookmark_add'));
    btn.appendChild(document.createTextNode(saved ? '저장됨' : '저장'));
  }
  sync();
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isSaved(p.id)) {
      savePlace(p.id);
      sync();
      router?.showToast?.('장소를 저장했습니다.', 'success');
    } else {
      router?.showToast?.('이미 저장된 장소입니다.', 'info');
    }
  });
  return btn;
}

export function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const toRad = (d) => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function formatDistance(km) {
  if (!Number.isFinite(km)) return '';
  if (km < 1) return `${Math.round(km * 1000)}m`;
  if (km < 10) return `${km.toFixed(1)}km`;
  return `${Math.round(km)}km`;
}

export const KAKAO_CAT_META = {
  FD6: { icon: 'restaurant',     label: '맛집',     accent: 'bg-red-100 text-red-700' },
  CE7: { icon: 'local_cafe',     label: '카페',     accent: 'bg-amber-100 text-amber-800' },
  AT4: { icon: 'attractions',    label: '즐길거리', accent: 'bg-emerald-100 text-emerald-800' },
  CT1: { icon: 'theater_comedy', label: '문화',     accent: 'bg-violet-100 text-violet-700' },
  AD5: { icon: 'hotel',          label: '숙박',     accent: 'bg-sky-100 text-sky-700' }
};

export function categoryMeta(catCode) {
  return KAKAO_CAT_META[catCode] || { icon: 'place', label: '장소', accent: 'bg-surfaceContainer text-onSurfaceVariant' };
}
