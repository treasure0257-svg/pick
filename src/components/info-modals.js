import { h } from '../utils/dom.js';
import { openModal } from './Modal.js';

export function renderAboutContent() {
  return h('div', { className: 'font-body text-onSurface' },
    h('p', { className: 'text-sm md:text-base text-onSurfaceVariant leading-relaxed' },
      '"정해줘"는 결정장애를 위한 디지털 컨시어지에서 출발한, 바쁜 현대인을 위한 정보집합소입니다. ',
      '전국 17개 시·도의 실시간 맛집·카페·관광지·숙소를 지역과 키워드, 그리고 취향으로 좁혀 오늘 어디로 갈지 정해드립니다.'
    ),
    h('div', { className: 'mt-5 grid gap-3 sm:grid-cols-2' },
      h('div', { className: 'bg-surfaceContainerLowest rounded-xl p-4' },
        h('h3', { className: 'font-headline font-bold text-sm text-onSurface' }, '미션'),
        h('p', { className: 'font-body text-xs text-onSurfaceVariant mt-1.5 leading-relaxed' },
          '주말마다 "어디 가지?"에 들이는 시간을 1시간에서 1분으로.'
        )
      ),
      h('div', { className: 'bg-surfaceContainerLowest rounded-xl p-4' },
        h('h3', { className: 'font-headline font-bold text-sm text-onSurface' }, '데이터'),
        h('p', { className: 'font-body text-xs text-onSurfaceVariant mt-1.5 leading-relaxed' },
          'Kakao Local + Naver Local/Image/Blog 기반 실시간 데이터.'
        )
      )
    ),
    h('p', { className: 'font-body text-xs text-onSurfaceVariant mt-5' },
      '운영: ',
      h('a', { href: 'mailto:it@neotis.co.kr', className: 'text-primary hover:underline' }, 'Neotis · it@neotis.co.kr')
    )
  );
}

const STEPS = [
  { icon: 'home',         title: '1. 홈에서 지역 선택',     desc: '17개 시·도 타일 중 가고 싶은 지역을 누르거나 검색창에 입력.' },
  { icon: 'map',          title: '2. 세부 권역 고르기',     desc: '시·도 안에서 좁은 권역(예: 강남·서초)을 선택.' },
  { icon: 'restaurant',   title: '3. 카테고리 탭 좁히기',   desc: '맛집·카페·즐길거리·숙소 탭 클릭으로 필터링.' },
  { icon: 'near_me',      title: '4. 랜드마크 주변 검색',   desc: '"강남경찰서" 같은 건물명 → 주변 1km만 표시.' },
  { icon: 'bookmark',     title: '5. 마음에 들면 저장',     desc: '저장 버튼 → "저장됨" 메뉴에 보관 (로그인 시 동기화).' },
  { icon: 'tune',         title: '6. 마이페이지에서 취향 설정', desc: '식이·매운맛·예산·카테고리·무드·동행을 카드에서 설정, 즉시 저장.' }
];

export function renderGuideContent() {
  return h('div', { className: 'font-body text-onSurface' },
    h('p', { className: 'text-sm text-onSurfaceVariant mb-4' }, '6단계로 알아보는 정해줘 사용법.'),
    h('ol', { className: 'space-y-3' },
      ...STEPS.map(s =>
        h('li', { className: 'flex gap-3 bg-surfaceContainerLowest rounded-xl p-3' },
          h('div', { className: 'flex-none w-9 h-9 rounded-full bg-primaryContainer text-primary flex items-center justify-center' },
            h('span', { className: 'material-symbols-outlined text-[20px]' }, s.icon)
          ),
          h('div', {},
            h('h3', { className: 'font-headline font-bold text-sm text-onSurface' }, s.title),
            h('p', { className: 'font-body text-xs text-onSurfaceVariant mt-0.5 leading-relaxed' }, s.desc)
          )
        )
      )
    )
  );
}

export function renderPrivacyContent() {
  return h('div', { className: 'font-body text-onSurface text-sm leading-relaxed space-y-5' },
    h('p', { className: 'text-xs text-onSurfaceVariant' }, '시행일자: 2026-04-23'),
    h('div', {},
      h('h3', { className: 'font-headline font-bold text-base mb-1' }, '1. 수집하는 개인정보'),
      h('ul', { className: 'list-disc pl-5 text-onSurfaceVariant space-y-0.5' },
        h('li', {}, '로그인 시: 이메일·이름·프로필 사진(Google/Kakao/Naver OAuth)'),
        h('li', {}, '이용 기록: 저장한 장소·취향 설정 값'),
        h('li', {}, '위치 정보: 거리 표시용 일시 사용, 저장 안 함')
      )
    ),
    h('div', {},
      h('h3', { className: 'font-headline font-bold text-base mb-1' }, '2. 보유 기간'),
      h('p', { className: 'text-onSurfaceVariant' },
        '회원 탈퇴 시 즉시 파기. 삭제 요청은 it@neotis.co.kr 로 메일 → 7일 이내 처리.'
      )
    ),
    h('div', {},
      h('h3', { className: 'font-headline font-bold text-base mb-1' }, '3. 제3자 제공'),
      h('p', { className: 'text-onSurfaceVariant' },
        '외부 미제공. 다음 외부 서비스 활용: Firebase / Kakao Local / Naver Search / Cloudflare Workers (모두 개인정보 미전송).'
      )
    ),
    h('div', { className: 'bg-surfaceContainerLowest rounded-xl p-3 text-xs text-onSurfaceVariant' },
      h('strong', { className: 'block text-onSurface mb-0.5' }, '※ 안내'),
      'v1.0 정식 출시 전 임시 버전. 법무 검토 후 보완 예정.'
    )
  );
}

export function renderTermsContent() {
  return h('div', { className: 'font-body text-onSurface text-sm leading-relaxed space-y-5' },
    h('p', { className: 'text-xs text-onSurfaceVariant' }, '시행일자: 2026-04-23'),
    h('div', {},
      h('h3', { className: 'font-headline font-bold text-base mb-1' }, '제1조 (목적)'),
      h('p', { className: 'text-onSurfaceVariant' },
        '본 약관은 Neotis(이하 "회사")가 제공하는 정해줘 서비스 이용 조건과 절차, 회사·이용자의 권리·의무를 규정합니다.'
      )
    ),
    h('div', {},
      h('h3', { className: 'font-headline font-bold text-base mb-1' }, '제2조 (서비스 내용)'),
      h('p', { className: 'text-onSurfaceVariant' },
        '전국 17개 시·도의 맛집·카페·관광지·숙소 정보를 외부 API(Kakao·Naver) 기반으로 추천합니다.'
      )
    ),
    h('div', {},
      h('h3', { className: 'font-headline font-bold text-base mb-1' }, '제3조 (정보의 정확성)'),
      h('p', { className: 'text-onSurfaceVariant' },
        '장소 정보는 외부 데이터로, 실시간성·정확성을 100% 보장하지 않습니다. 방문 전 확인을 권장합니다.'
      )
    ),
    h('div', {},
      h('h3', { className: 'font-headline font-bold text-base mb-1' }, '제4조 (회원가입·탈퇴)'),
      h('p', { className: 'text-onSurfaceVariant' },
        'Google/Kakao/Naver OAuth 로 가입. 탈퇴는 it@neotis.co.kr 로 요청.'
      )
    ),
    h('div', {},
      h('h3', { className: 'font-headline font-bold text-base mb-1' }, '제5조 (면책)'),
      h('p', { className: 'text-onSurfaceVariant' },
        '외부 API 장애·데이터 오류·천재지변 등으로 인한 서비스 중단·정보 오류에 대해 책임지지 않습니다.'
      )
    ),
    h('div', { className: 'bg-surfaceContainerLowest rounded-xl p-3 text-xs text-onSurfaceVariant' },
      h('strong', { className: 'block text-onSurface mb-0.5' }, '※ 안내'),
      'v1.0 정식 출시 전 임시 버전. 법무 검토 후 보완 예정.'
    )
  );
}

const REGISTRY = {
  about:   { title: '소개',                content: renderAboutContent },
  guide:   { title: '사용가이드',          content: renderGuideContent },
  privacy: { title: '개인정보처리방침',    content: renderPrivacyContent },
  terms:   { title: '이용약관',            content: renderTermsContent }
};

export function openInfoModal(key) {
  const cfg = REGISTRY[key];
  if (!cfg) return;
  openModal({ title: cfg.title, content: cfg.content() });
}
