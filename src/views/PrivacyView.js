import { h } from '../utils/dom.js';
import { Header } from '../components/Header.js';
import { BottomNav } from '../components/BottomNav.js';
import { Footer } from '../components/Footer.js';

export function PrivacyView({ router }) {
  const container = h('div', { className: 'flex flex-col min-h-screen' },
    Header(router),
    h('div', { className: 'bg-surfaceContainer h-[1px] w-full' })
  );

  const main = h('main', { className: 'flex-grow max-w-3xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 md:py-16' },
    h('span', { className: 'font-label text-sm text-onSurfaceVariant' }, 'Privacy'),
    h('h1', { className: 'font-headline text-3xl md:text-4xl font-extrabold text-onSurface mt-2' }, '개인정보처리방침'),
    h('p', { className: 'font-body text-xs text-onSurfaceVariant mt-2' }, '시행일자: 2026-04-23'),

    h('section', { className: 'mt-10 space-y-8 font-body text-sm md:text-base text-onSurface leading-relaxed' },
      h('div', {},
        h('h2', { className: 'font-headline font-bold text-lg' }, '1. 수집하는 개인정보 항목'),
        h('p', { className: 'mt-2 text-onSurfaceVariant' }, '정해줘는 다음 정보를 수집합니다:'),
        h('ul', { className: 'list-disc pl-5 mt-2 text-onSurfaceVariant space-y-1' },
          h('li', {}, '로그인 시: 이메일, 표시 이름, 프로필 사진(선택) — Google/Kakao/Naver OAuth 제공'),
          h('li', {}, '서비스 이용 시: 저장한 장소 목록, 취향 설정 값(카테고리·무드·예산·기간·음주)'),
          h('li', {}, '선택 사항: 위치 정보(거리 표시용 — 브라우저 권한 동의 시에만 일시 사용, 저장 안 함)')
        )
      ),
      h('div', {},
        h('h2', { className: 'font-headline font-bold text-lg' }, '2. 개인정보의 보유 및 이용기간'),
        h('p', { className: 'mt-2 text-onSurfaceVariant' },
          '회원 탈퇴 시 즉시 파기. Firestore의 `users/{uid}` 문서는 로그아웃 후에도 유지되며, ',
          '계정 삭제 요청 시 it@neotis.co.kr 로 메일 주시면 7일 이내 영구 삭제됩니다.'
        )
      ),
      h('div', {},
        h('h2', { className: 'font-headline font-bold text-lg' }, '3. 제3자 제공'),
        h('p', { className: 'mt-2 text-onSurfaceVariant' },
          '정해줘는 수집한 개인정보를 외부에 제공하지 않습니다. 다만 다음 외부 서비스가 활용됩니다:'
        ),
        h('ul', { className: 'list-disc pl-5 mt-2 text-onSurfaceVariant space-y-1' },
          h('li', {}, 'Firebase (Google) — 인증·Firestore 데이터 저장'),
          h('li', {}, 'Kakao Local API — 장소 검색 (개인정보 미전송)'),
          h('li', {}, 'Naver Search API — 장소·이미지·블로그 검색 (개인정보 미전송)'),
          h('li', {}, 'Cloudflare Workers — Naver API 프록시 (개인정보 미저장)')
        )
      ),
      h('div', {},
        h('h2', { className: 'font-headline font-bold text-lg' }, '4. 이용자의 권리'),
        h('p', { className: 'mt-2 text-onSurfaceVariant' },
          '이용자는 언제든 본인의 개인정보 열람·수정·삭제를 요청할 수 있습니다. ',
          '문의: ',
          h('a', { href: 'mailto:it@neotis.co.kr', className: 'text-primary hover:underline' }, 'it@neotis.co.kr')
        )
      ),
      h('div', { className: 'bg-surfaceContainerLowest rounded-2xl p-5 text-onSurfaceVariant text-sm' },
        h('strong', { className: 'block text-onSurface mb-1' }, '※ 안내'),
        '본 약관은 v1.0 정식 출시 전 임시 버전이며, 법무 검토 후 추후 보완 예정입니다.'
      )
    )
  );

  container.appendChild(main);
  container.appendChild(Footer());
  container.appendChild(BottomNav(router));
  return container;
}
