import { h } from '../utils/dom.js';

// Desktop nav 정리: 홈/저장됨 제거 (홈은 로고 클릭, 저장됨은 마이페이지에서 접근).
// 마이페이지 링크는 main.js updateAuthUI 에서 프로필 버튼 옆에 함께 렌더 — 로그인 상태일 때만 노출.

export function Header() {
  return h('header', { className: 'bg-surface text-primary font-headline font-semibold tracking-tight sticky top-0 z-50 flex justify-between items-center w-full px-6 py-4' },
    h('a', { href: '#/', className: 'flex items-center gap-3' },
      h('img', { src: '/logo.png', alt: '정해줘', className: 'w-9 h-9 rounded-xl' }),
      h('span', { className: 'text-xl font-bold tracking-tight' }, '정해줘')
    ),
    h('div', { id: 'auth-slot', className: 'flex items-center gap-3' })
  );
}
