import { h } from '../utils/dom.js';
import { Header } from '../components/Header.js';
import { loginGoogle, loginKakao, loginNaver } from '../firebase-setup.js';

export function LoginView({ router }) {
  const statusLine = h('p', {
    className: 'hidden text-center text-sm mt-6 font-body'
  });

  function setStatus(msg, kind = 'info') {
    statusLine.classList.remove('hidden', 'text-red-600', 'text-primary', 'text-onSurfaceVariant');
    statusLine.textContent = msg;
    statusLine.classList.add(
      kind === 'error' ? 'text-red-600'
        : kind === 'success' ? 'text-primary'
          : 'text-onSurfaceVariant'
    );
  }

  function guard(fn, label, opts = {}) {
    return async () => {
      try {
        setStatus(`${label} 로그인 중…`);
        await fn();
        if (opts.redirect !== false) {
          setStatus(`${label} 로그인 성공 — 이동합니다.`, 'success');
          setTimeout(() => router.navigate('#/'), 500);
        }
      } catch (e) {
        console.error(e);
        const msg = e?.message || '알 수 없는 오류';
        setStatus(`${label} 로그인 실패: ${msg}`, 'error');
      }
    };
  }

  const card = h('section', {
    className: 'w-full max-w-md bg-surfaceContainerLowest rounded-[2rem] p-8 md:p-10 shadow-[0px_12px_32px_rgba(45,51,53,0.06)]'
  },
    h('div', { className: 'flex justify-center mb-6' },
      h('img', { src: '/logo.png', alt: '정해줘', className: 'w-14 h-14 rounded-2xl' })
    ),
    h('h1', {
      className: 'font-headline text-[2rem] leading-tight tracking-tight font-extrabold text-onSurface text-center'
    },
      '간편하게 ',
      h('span', { className: 'text-primary' }, '시작하세요.')
    ),
    h('p', {
      className: 'font-body text-sm text-onSurfaceVariant text-center mt-2 mb-8 leading-relaxed'
    },
      h('span', { className: 'block' }, '소셜 계정 하나로 간편하게 시작하세요.'),
      h('span', { className: 'block' }, '몇 번의 선택으로 오늘 갈 곳이 정해집니다.')
    ),

    h('div', { className: 'flex flex-col gap-3' },
      h('button', {
        onClick: guard(loginGoogle, 'Google'),
        className: 'w-full flex items-center justify-center gap-3 bg-white border border-surfaceContainer hover:bg-surfaceContainerLow transition text-onSurface font-body font-medium py-3.5 px-4 rounded-xl'
      },
        h('img', {
          src: 'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg',
          alt: 'Google', className: 'w-5 h-5'
        }),
        'Google로 계속하기'
      ),
      h('button', {
        onClick: guard(loginKakao, 'Kakao'),
        className: 'w-full flex items-center justify-center gap-3 bg-[#FEE500] hover:brightness-95 transition text-[#191919] font-body font-medium py-3.5 px-4 rounded-xl'
      },
        h('img', { src: '/kakao-icon.svg', alt: 'Kakao', className: 'w-5 h-5' }),
        '카카오로 계속하기'
      ),
      h('button', {
        onClick: guard(loginNaver, 'Naver'),
        className: 'w-full flex items-center justify-center gap-3 bg-[#03C75A] hover:brightness-95 transition text-white font-body font-medium py-3.5 px-4 rounded-xl'
      },
        h('span', { className: 'font-bold text-lg' }, 'N'),
        '네이버로 계속하기'
      )
    ),

    statusLine,
    h('div', { id: 'naverIdLogin', className: 'hidden' })
  );

  return h('div', { className: 'flex flex-col min-h-screen' },
    Header(router),
    h('div', { className: 'bg-surfaceContainer h-[1px] w-full' }),
    h('main', {
      className: 'flex-grow flex items-center justify-center px-4 py-10 md:py-20 relative'
    }, card)
  );
}
