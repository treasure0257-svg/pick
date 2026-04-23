import { h } from '../utils/dom.js';

// Centered modal overlay. content는 DOM 노드 또는 그 함수.
// ESC / 배경 클릭 / 닫기 버튼으로 close.
export function openModal({ title, content }) {
  const contentEl = typeof content === 'function' ? content() : content;

  const closeBtn = h('button', {
    className: 'absolute top-3 right-3 w-9 h-9 rounded-full bg-surfaceContainerLow hover:bg-surfaceContainer flex items-center justify-center text-onSurface transition-colors z-10',
    title: '닫기',
    onClick: () => close()
  },
    h('span', { className: 'material-symbols-outlined' }, 'close')
  );

  const panel = h('div', {
    className: 'relative bg-surface rounded-2xl shadow-[0px_24px_80px_rgba(0,0,0,0.35)] max-w-xl w-full max-h-[85vh] overflow-y-auto',
    onClick: (e) => e.stopPropagation()
  },
    closeBtn,
    h('div', { className: 'p-6 md:p-7' },
      title
        ? h('h2', { className: 'font-headline text-xl md:text-2xl font-extrabold text-onSurface pr-10 mb-4 border-b border-surfaceContainer pb-3' }, title)
        : null,
      contentEl
    )
  );

  const backdrop = h('div', {
    className: 'fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4',
    onClick: () => close()
  }, panel);

  function close() {
    backdrop.remove();
    document.body.style.overflow = '';
    document.removeEventListener('keydown', onKey);
  }
  function onKey(e) { if (e.key === 'Escape') close(); }
  document.addEventListener('keydown', onKey);
  document.body.style.overflow = 'hidden';
  document.body.appendChild(backdrop);

  return { close };
}
