// Header의 🔍 아이콘에서 열리는 전역 검색 모달.
// 지역명/장소 키워드 입력 → 지역이면 region 드릴다운으로, 일반 키워드면 region 없이 results 로 이동 (키워드 검색 placeholder).

import { h } from '../utils/dom.js';
import { REGIONS } from '../regions.js';

export function openSearchModal(router) {
  if (document.getElementById('pick-search-modal')) return;

  const input = h('input', {
    type: 'search',
    autofocus: true,
    placeholder: '지역명·장소·키워드 검색 (예: 서울, 홍대 카페)',
    className: 'w-full bg-transparent outline-none font-body text-lg text-onSurface placeholder:text-onSurfaceVariant/60 py-2'
  });

  const suggestList = h('div', { className: 'mt-4 max-h-[50vh] overflow-y-auto' });

  function renderSuggestions() {
    const q = input.value.trim().toLowerCase();
    suggestList.innerHTML = '';
    const matches = q
      ? REGIONS.filter(r => r.label.toLowerCase().includes(q) || r.id.toLowerCase().includes(q))
      : REGIONS;
    if (matches.length === 0) {
      suggestList.appendChild(
        h('div', { className: 'py-6 text-center text-onSurfaceVariant font-body text-sm' },
          `"${q}" 로 검색할 지역이 없어요. 그냥 키워드로 다른 지역을 시도해보세요.`)
      );
      return;
    }
    matches.forEach(r => {
      const row = h('a', {
        href: `#/region?id=${r.id}`,
        onClick: () => close(),
        className: 'flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-surfaceContainerLow transition-colors'
      },
        h('span', { className: 'material-symbols-outlined text-primary' }, r.icon),
        h('span', { className: 'font-body font-medium text-onSurface flex-grow' }, r.label),
        h('span', { className: 'font-label text-xs text-onSurfaceVariant' }, r.hint)
      );
      suggestList.appendChild(row);
    });
  }

  input.addEventListener('input', renderSuggestions);

  function close() {
    document.getElementById('pick-search-modal')?.remove();
    document.removeEventListener('keydown', onEsc);
  }

  function onEsc(e) { if (e.key === 'Escape') close(); }
  document.addEventListener('keydown', onEsc);

  const overlay = h('div', {
    id: 'pick-search-modal',
    className: 'fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-start justify-center p-4 pt-20 md:pt-32',
    onClick: (e) => { if (e.target === overlay) close(); }
  },
    h('div', { className: 'w-full max-w-xl bg-surfaceContainerLowest rounded-[2rem] shadow-2xl p-5 md:p-6' },
      h('div', { className: 'flex items-center gap-3 border-b border-surfaceContainer pb-3' },
        h('span', { className: 'material-symbols-outlined text-onSurfaceVariant text-2xl flex-none' }, 'search'),
        input,
        h('button', {
          onClick: close,
          className: 'flex-none w-8 h-8 rounded-full hover:bg-surfaceContainer transition-colors flex items-center justify-center'
        },
          h('span', { className: 'material-symbols-outlined text-onSurfaceVariant text-[20px]' }, 'close')
        )
      ),
      suggestList
    )
  );

  document.body.appendChild(overlay);
  renderSuggestions();
  // autofocus 보장
  queueMicrotask(() => input.focus());
}
