import { h } from '../utils/dom.js';
import { Header } from '../components/Header.js';
import { BottomNav } from '../components/BottomNav.js';
import { Footer } from '../components/Footer.js';
import { auth, logout } from '../firebase-setup.js';
import { AppState, STORAGE_KEYS } from '../App.js';
import { PICK_DATA } from '../data.js';
import { getCachedPlace } from '../services/kakaoLocal.js';
import { categoryMeta } from '../utils/place-ui.js';

const PROVIDER_BADGE = {
  google: { label: 'Google',  cls: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200' },
  kakao:  { label: 'Kakao',   cls: 'bg-yellow-50 text-yellow-800 ring-1 ring-yellow-200' },
  naver:  { label: 'Naver',   cls: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' }
};

export function MyPageView({ router }) {
  const container = h('div', { className: 'flex flex-col min-h-screen' },
    Header(router),
    h('div', { className: 'bg-surfaceContainer h-[1px] w-full' })
  );

  const main = h('main', { className: 'flex-grow max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 md:py-14 pb-32 md:pb-14' });
  container.appendChild(main);
  container.appendChild(Footer());
  container.appendChild(BottomNav(router));

  // 비로그인 가드
  let user = null;
  try {
    const fbUser = auth?.currentUser;
    if (fbUser) {
      user = {
        provider: 'google',
        displayName: fbUser.displayName || '',
        email: fbUser.email || '',
        photoURL: fbUser.photoURL || ''
      };
    } else {
      const rawK = localStorage.getItem('pick.kakaoUser');
      const rawN = localStorage.getItem('pick.naverUser');
      if (rawK) user = JSON.parse(rawK);
      else if (rawN) user = JSON.parse(rawN);
    }
  } catch { /* noop */ }

  if (!user) {
    main.appendChild(
      h('div', { className: 'text-center py-20 bg-surfaceContainerLowest rounded-3xl border border-dashed border-surfaceContainerHighest px-6' },
        h('div', { className: 'w-20 h-20 mx-auto mb-5 rounded-full bg-primaryContainer flex items-center justify-center text-primary' },
          h('span', { className: 'material-symbols-outlined text-[44px]' }, 'lock')
        ),
        h('h2', { className: 'font-headline text-2xl font-extrabold text-onSurface' }, '로그인이 필요해요'),
        h('p', { className: 'font-body text-onSurfaceVariant mt-2 max-w-md mx-auto' },
          '내 활동·저장한 장소·취향 설정을 한 곳에서 관리하려면 로그인하세요.'
        ),
        h('a', {
          href: '#/login',
          className: 'inline-flex items-center gap-2 mt-6 bg-primary text-onPrimary font-body font-semibold py-3 px-8 rounded-full hover:shadow-md transition-all'
        },
          h('span', { className: 'material-symbols-outlined' }, 'login'),
          '1초 만에 로그인'
        )
      )
    );
    return container;
  }

  const provider = PROVIDER_BADGE[user.provider] || { label: user.provider || '계정', cls: 'bg-surfaceContainer text-onSurfaceVariant' };
  const savedIds = AppState.get(STORAGE_KEYS.saved, []);
  const prefs = AppState.get(STORAGE_KEYS.preferences, {});
  const hasPrefs = Object.keys(prefs || {}).length > 0;

  // 1) 프로필 헤더
  main.appendChild(
    h('section', { className: 'bg-gradient-to-br from-primary/10 via-primaryContainer/40 to-primary-dim/10 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-5' },
      user.photoURL
        ? h('img', { src: user.photoURL, className: 'w-20 h-20 md:w-24 md:h-24 rounded-full object-cover border-4 border-white shadow-md', alt: user.displayName })
        : h('div', { className: 'w-20 h-20 md:w-24 md:h-24 rounded-full bg-primary text-onPrimary flex items-center justify-center text-3xl font-headline font-extrabold border-4 border-white shadow-md' },
            (user.displayName || user.email || '?').slice(0, 1).toUpperCase()
          ),
      h('div', { className: 'flex-grow min-w-0' },
        h('div', { className: 'flex items-center gap-2 flex-wrap' },
          h('h1', { className: 'font-headline text-2xl md:text-3xl font-extrabold text-onSurface truncate' }, user.displayName || '이름 없음'),
          h('span', { className: `text-[11px] font-body font-semibold px-2 py-0.5 rounded-full ${provider.cls}` }, provider.label)
        ),
        user.email
          ? h('p', { className: 'font-body text-sm text-onSurfaceVariant mt-1 truncate' }, user.email)
          : null
      )
    )
  );

  // 2) 활동 통계
  main.appendChild(
    h('section', { className: 'mt-8 grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4' },
      statCard('저장한 장소', String(savedIds.length), 'bookmark'),
      statCard('취향 설정', hasPrefs ? '완료' : '미설정', 'tune'),
      statCard('로그인 방식', provider.label, 'shield')
    )
  );

  // 3) 내 취향
  main.appendChild(
    h('section', { className: 'mt-10' },
      h('div', { className: 'flex items-center justify-between mb-4' },
        h('h2', { className: 'font-headline text-xl font-bold text-onSurface' }, '내 취향'),
        h('a', { href: '#/preferences', className: 'text-sm font-body text-primary hover:underline inline-flex items-center gap-0.5' },
          hasPrefs ? '수정' : '설정하기',
          h('span', { className: 'material-symbols-outlined text-[16px]' }, 'chevron_right')
        )
      ),
      hasPrefs
        ? renderPrefSummary(prefs)
        : h('div', { className: 'bg-surfaceContainerLowest rounded-2xl p-6 text-center text-onSurfaceVariant text-sm border border-dashed border-surfaceContainerHighest' },
            '아직 취향이 없어요. 설정하면 더 정확한 추천을 받을 수 있어요.'
          )
    )
  );

  // 4) 저장된 장소 미리보기 (최근 3개)
  main.appendChild(
    h('section', { className: 'mt-10' },
      h('div', { className: 'flex items-center justify-between mb-4' },
        h('h2', { className: 'font-headline text-xl font-bold text-onSurface' }, '내 저장 장소'),
        h('a', { href: '#/saved', className: 'text-sm font-body text-primary hover:underline inline-flex items-center gap-0.5' },
          '전체 보기',
          h('span', { className: 'material-symbols-outlined text-[16px]' }, 'chevron_right')
        )
      ),
      renderSavedPreview(savedIds)
    )
  );

  // 5) 계정 관리
  main.appendChild(
    h('section', { className: 'mt-12 bg-surfaceContainerLowest rounded-2xl p-5 md:p-6' },
      h('h2', { className: 'font-headline text-base font-bold text-onSurface mb-4' }, '계정 관리'),
      h('div', { className: 'flex flex-col gap-3' },
        h('button', {
          className: 'inline-flex items-center justify-between gap-2 px-4 py-3 rounded-xl bg-surface hover:bg-surfaceContainer text-onSurface font-body text-sm font-medium transition-colors',
          onClick: async () => {
            await logout();
            router.showToast('로그아웃되었습니다.');
            router.navigate('#/');
          }
        },
          h('span', { className: 'flex items-center gap-2' },
            h('span', { className: 'material-symbols-outlined text-[18px]' }, 'logout'),
            '로그아웃'
          ),
          h('span', { className: 'material-symbols-outlined text-[18px] text-onSurfaceVariant' }, 'chevron_right')
        ),
        h('a', {
          href: 'mailto:it@neotis.co.kr?subject=정해줘 회원 탈퇴 요청&body=탈퇴를 요청합니다. (계정 이메일: ' + (user.email || '') + ')',
          className: 'inline-flex items-center justify-between gap-2 px-4 py-3 rounded-xl bg-surface hover:bg-surfaceContainer text-onSurface font-body text-sm font-medium transition-colors'
        },
          h('span', { className: 'flex items-center gap-2 text-rose-700' },
            h('span', { className: 'material-symbols-outlined text-[18px]' }, 'person_remove'),
            '회원 탈퇴 (메일 문의)'
          ),
          h('span', { className: 'material-symbols-outlined text-[18px] text-onSurfaceVariant' }, 'chevron_right')
        )
      )
    )
  );

  return container;
}

function statCard(label, value, icon) {
  return h('div', { className: 'bg-surfaceContainerLowest rounded-2xl p-4 md:p-5' },
    h('div', { className: 'flex items-center gap-2 text-onSurfaceVariant mb-1' },
      h('span', { className: 'material-symbols-outlined text-[18px]' }, icon),
      h('span', { className: 'font-label text-xs uppercase tracking-wider' }, label)
    ),
    h('p', { className: 'font-headline text-2xl md:text-3xl font-extrabold text-onSurface' }, value)
  );
}

function renderPrefSummary(prefs) {
  const rows = [];
  if (prefs.categories?.length) rows.push(['카테고리', prefs.categories.join(' · ')]);
  if (prefs.moods?.length)      rows.push(['무드',     prefs.moods.join(' · ')]);
  if (prefs.budget)             rows.push(['예산',     prefs.budget]);
  if (prefs.duration)           rows.push(['기간',     prefs.duration]);
  if (prefs.alcohol != null)    rows.push(['음주',     prefs.alcohol ? '음주 OK' : '논알콜']);

  if (rows.length === 0) {
    return h('div', { className: 'bg-surfaceContainerLowest rounded-2xl p-5 text-onSurfaceVariant text-sm' },
      '취향 데이터를 읽지 못했어요.'
    );
  }

  return h('div', { className: 'bg-surfaceContainerLowest rounded-2xl p-5 grid sm:grid-cols-2 gap-3' },
    ...rows.map(([k, v]) =>
      h('div', { className: 'flex flex-col gap-1' },
        h('span', { className: 'font-label text-[11px] uppercase tracking-wider text-onSurfaceVariant' }, k),
        h('span', { className: 'font-body text-sm text-onSurface' }, v)
      )
    )
  );
}

function renderSavedPreview(savedIds) {
  if (savedIds.length === 0) {
    return h('div', { className: 'bg-surfaceContainerLowest rounded-2xl p-6 text-center text-onSurfaceVariant text-sm border border-dashed border-surfaceContainerHighest' },
      '아직 저장한 장소가 없어요. 카드의 ',
      h('span', { className: 'material-symbols-outlined text-[15px] align-middle mx-0.5 text-primary' }, 'bookmark_add'),
      ' 버튼으로 모아보세요.'
    );
  }

  const previews = savedIds.slice(0, 3).map(id => {
    const cached = getCachedPlace(id);
    if (cached) return cached;
    const local = PICK_DATA.places.find(p => p.id === id);
    if (local) return { id, name: local.name, address: local.address || '', category: null };
    return null;
  }).filter(Boolean);

  if (previews.length === 0) {
    return h('div', { className: 'bg-surfaceContainerLowest rounded-2xl p-6 text-center text-onSurfaceVariant text-sm' },
      `저장된 장소 ${savedIds.length}개가 있어요. "전체 보기"에서 확인하세요.`
    );
  }

  return h('div', { className: 'grid sm:grid-cols-3 gap-3' },
    ...previews.map(p => {
      const cat = categoryMeta(p.category);
      return h('a', {
        href: `#/place?id=${encodeURIComponent(p.id)}`,
        className: 'bg-surfaceContainerLowest rounded-2xl p-4 hover:shadow-md transition-shadow flex flex-col gap-2'
      },
        h('span', { className: `inline-flex self-start items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${cat.accent}` },
          h('span', { className: 'material-symbols-outlined text-[13px]' }, cat.icon),
          p.categoryLabel || cat.label
        ),
        h('h3', { className: 'font-headline text-sm font-bold text-onSurface line-clamp-2' }, p.name),
        h('p', { className: 'font-body text-xs text-onSurfaceVariant truncate' }, p.address || p.blurb || '')
      );
    })
  );
}
