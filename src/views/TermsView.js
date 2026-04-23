import { h } from '../utils/dom.js';
import { Header } from '../components/Header.js';
import { BottomNav } from '../components/BottomNav.js';
import { Footer } from '../components/Footer.js';

export function TermsView({ router }) {
  const container = h('div', { className: 'flex flex-col min-h-screen' },
    Header(router),
    h('div', { className: 'bg-surfaceContainer h-[1px] w-full' })
  );

  const main = h('main', { className: 'flex-grow max-w-3xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 md:py-16' },
    h('span', { className: 'font-label text-sm text-onSurfaceVariant' }, 'Terms'),
    h('h1', { className: 'font-headline text-3xl md:text-4xl font-extrabold text-onSurface mt-2' }, '이용약관'),
    h('p', { className: 'font-body text-xs text-onSurfaceVariant mt-2' }, '시행일자: 2026-04-23'),

    h('section', { className: 'mt-10 space-y-8 font-body text-sm md:text-base text-onSurface leading-relaxed' },
      h('div', {},
        h('h2', { className: 'font-headline font-bold text-lg' }, '제1조 (목적)'),
        h('p', { className: 'mt-2 text-onSurfaceVariant' },
          '본 약관은 Neotis(이하 "회사")가 제공하는 정해줘 서비스의 이용 조건과 절차, 회사와 이용자의 권리·의무·책임을 규정하는 데 목적이 있습니다.'
        )
      ),
      h('div', {},
        h('h2', { className: 'font-headline font-bold text-lg' }, '제2조 (서비스의 내용)'),
        h('p', { className: 'mt-2 text-onSurfaceVariant' },
          '정해줘는 전국 17개 시·도의 맛집·카페·관광지·숙소 정보를 외부 API(Kakao·Naver)로부터 실시간 조회하여 ',
          '이용자가 원하는 장소를 추천해주는 웹 애플리케이션입니다.'
        )
      ),
      h('div', {},
        h('h2', { className: 'font-headline font-bold text-lg' }, '제3조 (장소 정보의 정확성)'),
        h('p', { className: 'mt-2 text-onSurfaceVariant' },
          '장소 정보(영업시간·전화번호·주소·평점 등)는 외부 데이터 제공자로부터 가져온 것으로, ',
          '실시간성·정확성을 100% 보장하지 않습니다. 방문 전 해당 장소에 직접 확인하시는 것을 권장합니다.'
        )
      ),
      h('div', {},
        h('h2', { className: 'font-headline font-bold text-lg' }, '제4조 (회원가입 및 탈퇴)'),
        h('p', { className: 'mt-2 text-onSurfaceVariant' },
          '회원가입은 Google·Kakao·Naver 계정 OAuth로 진행되며, 별도 가입 절차는 없습니다. ',
          '탈퇴는 it@neotis.co.kr 로 요청하시면 7일 이내 처리됩니다.'
        )
      ),
      h('div', {},
        h('h2', { className: 'font-headline font-bold text-lg' }, '제5조 (면책)'),
        h('p', { className: 'mt-2 text-onSurfaceVariant' },
          '회사는 외부 API의 일시적 장애·데이터 오류·천재지변 등으로 인한 서비스 중단·정보 오류에 대해 책임을 지지 않습니다.'
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
