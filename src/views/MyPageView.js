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
  google: { label: 'Google', cls: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200' },
  kakao:  { label: 'Kakao',  cls: 'bg-yellow-50 text-yellow-800 ring-1 ring-yellow-200' },
  naver:  { label: 'Naver',  cls: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' }
};

// 취향 카드 액센트 (음식·라이프·무드·동행)
const ACCENT = {
  food:    { iconBg: 'bg-orange-100', iconColor: 'text-orange-700', chipActive: 'bg-orange-600 text-white border-orange-600' },
  life:    { iconBg: 'bg-blue-100',   iconColor: 'text-blue-700',   chipActive: 'bg-blue-600 text-white border-blue-600' },
  mood:    { iconBg: 'bg-purple-100', iconColor: 'text-purple-700', chipActive: 'bg-purple-600 text-white border-purple-600' },
  comp:    { iconBg: 'bg-rose-100',   iconColor: 'text-rose-700',   chipActive: 'bg-rose-600 text-white border-rose-600' }
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
          '내 활동·저장한 장소·취향을 한 곳에서 관리하려면 로그인하세요.'
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
  function statsRow() {
    const savedCount = AppState.get(STORAGE_KEYS.saved, []).length;
    const visitedCount = AppState.get(STORAGE_KEYS.visited, []).length;
    const prefs = AppState.get(STORAGE_KEYS.preferences, {}) || {};
    const prefSet = countSetPrefs(prefs);
    return h('section', { className: 'mt-8 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4' },
      statCard('저장한 장소', String(savedCount), 'bookmark'),
      statCard('방문 완료', String(visitedCount), 'check_circle'),
      statCard('취향 설정', `${prefSet}/9`, 'tune'),
      statCard('로그인 방식', provider.label, 'shield')
    );
  }
  let statsSlot = statsRow();
  main.appendChild(statsSlot);
  function refreshStats() {
    const next = statsRow();
    statsSlot.replaceWith(next);
    statsSlot = next;
  }

  // 3) 내 취향 — 4개 확장형 카드 (음식·라이프·무드·동행)
  main.appendChild(
    h('section', { className: 'mt-10' },
      h('div', { className: 'flex items-center justify-between mb-5' },
        h('h2', { className: 'font-headline text-xl font-bold text-onSurface' }, '내 취향'),
        h('span', { className: 'font-label text-xs text-onSurfaceVariant' }, '클릭 즉시 저장')
      ),
      h('div', { className: 'space-y-3' },
        prefCard({ key: 'food', icon: 'restaurant', title: '음식 취향', accent: ACCENT.food, defaultOpen: true,
          render: () => foodPrefsContent(router, refreshStats) }),
        prefCard({ key: 'life', icon: 'savings', title: '라이프스타일', accent: ACCENT.life,
          render: () => lifePrefsContent(router, refreshStats) }),
        prefCard({ key: 'mood', icon: 'palette', title: '카테고리 · 무드', accent: ACCENT.mood,
          render: () => moodPrefsContent(router, refreshStats) }),
        prefCard({ key: 'comp', icon: 'group', title: '동행', accent: ACCENT.comp,
          render: () => companionPrefsContent(router, refreshStats) })
      )
    )
  );

  // 4) 저장된 장소 미리보기
  main.appendChild(
    h('section', { className: 'mt-12' },
      h('div', { className: 'flex items-center justify-between mb-4' },
        h('h2', { className: 'font-headline text-xl font-bold text-onSurface' }, '내 저장 장소'),
        h('a', { href: '#/saved', className: 'text-sm font-body text-primary hover:underline inline-flex items-center gap-0.5' },
          '전체 보기',
          h('span', { className: 'material-symbols-outlined text-[16px]' }, 'chevron_right')
        )
      ),
      renderSavedPreview()
    )
  );

  // 5) 계정 관리
  main.appendChild(
    h('section', { className: 'mt-12 bg-surfaceContainerLowest rounded-2xl p-5 md:p-6' },
      h('h2', { className: 'font-headline text-base font-bold text-onSurface mb-4' }, '계정 관리'),
      h('div', { className: 'flex flex-col gap-3' },
        // (다크 모드 토글은 헤더 우상단으로 이동됨)
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

function countSetPrefs(prefs) {
  let n = 0;
  if (prefs.dietary?.length)    n++;
  if (prefs.spice)              n++;
  if (prefs.budget)             n++;
  if (prefs.duration)           n++;
  if (prefs.drinks)             n++;
  if (prefs.petFriendly)        n++;
  if (prefs.categories?.length) n++;
  if (prefs.moods?.length)      n++;
  if (prefs.companion)          n++;
  return n;
}

// --- 확장형 카드 ---
function prefCard({ icon, title, accent, defaultOpen, render }) {
  const summarySlot = h('span', { className: 'font-body text-sm text-onSurfaceVariant truncate' });
  const chevron = h('span', { className: 'material-symbols-outlined text-onSurfaceVariant transition-transform' }, 'expand_more');
  const body = h('div', { className: 'overflow-hidden transition-all', style: { maxHeight: '0px' } });
  let bodyRendered = false;
  let isOpen = false;

  function refreshSummary() {
    summarySlot.textContent = computeSummary();
  }
  function computeSummary() {
    const prefs = AppState.get(STORAGE_KEYS.preferences, {}) || {};
    return summaryFor(title, prefs);
  }

  function open() {
    if (!bodyRendered) {
      body.appendChild(render());
      bodyRendered = true;
    }
    isOpen = true;
    body.style.maxHeight = body.scrollHeight + 'px';
    chevron.style.transform = 'rotate(180deg)';
    // expand 후 자식 변동 (chip 클릭 시 사이즈 변경) 대응 위해 약간 딜레이 후 auto 로
    setTimeout(() => { if (isOpen) body.style.maxHeight = 'none'; }, 250);
  }
  function close() {
    isOpen = false;
    if (body.style.maxHeight === 'none') body.style.maxHeight = body.scrollHeight + 'px';
    requestAnimationFrame(() => { body.style.maxHeight = '0px'; });
    chevron.style.transform = 'rotate(0deg)';
  }

  const header = h('button', {
    type: 'button',
    className: 'w-full flex items-center gap-3 p-4 md:p-5 text-left',
    onClick: () => { isOpen ? close() : open(); }
  },
    h('div', { className: `flex-none w-10 h-10 rounded-xl flex items-center justify-center ${accent.iconBg} ${accent.iconColor}` },
      h('span', { className: 'material-symbols-outlined text-[22px]' }, icon)
    ),
    h('div', { className: 'flex-grow min-w-0' },
      h('h3', { className: 'font-headline font-bold text-onSurface' }, title),
      summarySlot
    ),
    chevron
  );

  // body 내부 변경 시 summary 갱신을 위해 MutationObserver 대신 click 위임으로 처리
  body.addEventListener('click', () => {
    // 다음 tick 에 prefs 가 반영되어 있음
    queueMicrotask(refreshSummary);
  });

  refreshSummary();
  if (defaultOpen) queueMicrotask(open);

  return h('div', { className: 'bg-surfaceContainerLowest rounded-2xl overflow-hidden' },
    header,
    h('div', { className: 'px-4 md:px-5' }, body)
  );
}

function summaryFor(title, prefs) {
  const labelOf = (arr, id) => (arr.find(x => x.id === id) || {}).label || id;
  if (title === '음식 취향') {
    const parts = [];
    if (prefs.dietary?.length) parts.push(prefs.dietary.map(d => labelOf(PICK_DATA.dietary, d)).join('·'));
    if (prefs.spice) parts.push(labelOf(PICK_DATA.spiceLevels, prefs.spice));
    return parts.length ? parts.join(' / ') : '아직 설정 안 함';
  }
  if (title === '라이프스타일') {
    const parts = [];
    if (prefs.budget)   parts.push(labelOf(PICK_DATA.budgets, prefs.budget));
    if (prefs.duration) parts.push(labelOf(PICK_DATA.durations, prefs.duration));
    if (prefs.drinks)   parts.push(labelOf(PICK_DATA.drinks, prefs.drinks));
    if (prefs.petFriendly) parts.push('🐾 반려동물 동반');
    return parts.length ? parts.join(' · ') : '아직 설정 안 함';
  }
  if (title === '카테고리 · 무드') {
    const parts = [];
    if (prefs.categories?.length) parts.push(prefs.categories.map(c => labelOf(PICK_DATA.categories, c)).join('·'));
    if (prefs.moods?.length)      parts.push(prefs.moods.map(m => labelOf(PICK_DATA.moods, m)).join('·'));
    return parts.length ? parts.join(' / ') : '아직 설정 안 함';
  }
  if (title === '동행') {
    return prefs.companion ? labelOf(PICK_DATA.companions, prefs.companion) : '아직 설정 안 함';
  }
  return '';
}

// --- chip 그리드 helper ---
function chipGroup({ items, value, multi, accent, onChange }) {
  const wrap = h('div', { className: 'flex flex-wrap gap-2' });
  function paint() {
    wrap.innerHTML = '';
    const current = multi ? new Set(value()) : value();
    items.forEach(item => {
      const selected = multi ? current.has(item.id) : current === item.id;
      const btn = h('button', {
        type: 'button',
        className: `inline-flex items-center gap-1.5 py-2 px-3.5 rounded-full font-body text-sm font-medium border transition-colors ${
          selected
            ? `${accent.chipActive} shadow-sm`
            : 'bg-surface text-onSurface border-surfaceContainerHighest hover:border-primary/40'
        }`,
        onClick: () => {
          let next;
          if (multi) {
            const arr = new Set(value());
            arr.has(item.id) ? arr.delete(item.id) : arr.add(item.id);
            next = Array.from(arr);
          } else {
            next = current === item.id ? null : item.id; // 같은 거 다시 누르면 해제
          }
          onChange(next);
          paint();
        }
      },
        item.icon ? h('span', { className: 'material-symbols-outlined text-[16px]' }, item.icon) : null,
        item.label
      );
      wrap.appendChild(btn);
    });
  }
  paint();
  return wrap;
}

function getPrefs() { return AppState.get(STORAGE_KEYS.preferences, {}) || {}; }
function patchPrefs(patch, router, refreshStats) {
  const next = { ...getPrefs(), ...patch };
  AppState.set(STORAGE_KEYS.preferences, next);
  router.showToast('저장되었습니다');
  refreshStats?.();
}

// --- 4개 카드 컨텐츠 ---
function foodPrefsContent(router, refreshStats) {
  const wrap = h('div', { className: 'pb-5 space-y-4' });
  wrap.appendChild(h('div', {},
    h('h4', { className: 'font-label text-xs uppercase tracking-wider text-onSurfaceVariant mb-2' }, '식이 제한 · 알레르기'),
    chipGroup({
      items: PICK_DATA.dietary, multi: true, accent: ACCENT.food,
      value: () => getPrefs().dietary || [],
      onChange: v => patchPrefs({ dietary: v }, router, refreshStats)
    })
  ));
  wrap.appendChild(h('div', {},
    h('h4', { className: 'font-label text-xs uppercase tracking-wider text-onSurfaceVariant mb-2' }, '매운맛 선호'),
    chipGroup({
      items: PICK_DATA.spiceLevels, multi: false, accent: ACCENT.food,
      value: () => getPrefs().spice || null,
      onChange: v => patchPrefs({ spice: v }, router, refreshStats)
    })
  ));
  return wrap;
}

function lifePrefsContent(router, refreshStats) {
  const wrap = h('div', { className: 'pb-5 space-y-4' });
  wrap.appendChild(h('div', {},
    h('h4', { className: 'font-label text-xs uppercase tracking-wider text-onSurfaceVariant mb-2' }, '예산'),
    chipGroup({
      items: PICK_DATA.budgets, multi: false, accent: ACCENT.life,
      value: () => getPrefs().budget || null,
      onChange: v => patchPrefs({ budget: v }, router, refreshStats)
    })
  ));
  wrap.appendChild(h('div', {},
    h('h4', { className: 'font-label text-xs uppercase tracking-wider text-onSurfaceVariant mb-2' }, '소요 시간'),
    chipGroup({
      items: PICK_DATA.durations, multi: false, accent: ACCENT.life,
      value: () => getPrefs().duration || null,
      onChange: v => patchPrefs({ duration: v }, router, refreshStats)
    })
  ));
  wrap.appendChild(h('div', {},
    h('h4', { className: 'font-label text-xs uppercase tracking-wider text-onSurfaceVariant mb-2' }, '음주'),
    chipGroup({
      items: PICK_DATA.drinks, multi: false, accent: ACCENT.life,
      value: () => getPrefs().drinks || null,
      onChange: v => patchPrefs({ drinks: v }, router, refreshStats)
    })
  ));
  // 반려동물 동반 가능 — single boolean toggle (chip 형태)
  wrap.appendChild(h('div', {},
    h('h4', { className: 'font-label text-xs uppercase tracking-wider text-onSurfaceVariant mb-2' }, '반려동물 동반'),
    chipGroup({
      items: [{ id: true, label: '동반 가능 업체만 보기', icon: 'pets' }],
      multi: false, accent: ACCENT.life,
      value: () => (getPrefs().petFriendly ? true : null),
      onChange: v => patchPrefs({ petFriendly: !!v }, router, refreshStats)
    }),
    h('p', { className: 'font-label text-[11px] text-onSurfaceVariant mt-2 leading-relaxed' },
      '맛집·카페·숙소 결과에서 "애견동반·반려동물·펫동반·애견펜션·펫스테이" 키워드가 명시된 곳만 보여줍니다. (관광 카테고리는 영향 없음)'
    )
  ));
  return wrap;
}

function moodPrefsContent(router, refreshStats) {
  const wrap = h('div', { className: 'pb-5 space-y-4' });
  wrap.appendChild(h('div', {},
    h('h4', { className: 'font-label text-xs uppercase tracking-wider text-onSurfaceVariant mb-2' }, '관심 카테고리'),
    chipGroup({
      items: PICK_DATA.categories, multi: true, accent: ACCENT.mood,
      value: () => getPrefs().categories || [],
      onChange: v => patchPrefs({ categories: v }, router, refreshStats)
    })
  ));
  wrap.appendChild(h('div', {},
    h('h4', { className: 'font-label text-xs uppercase tracking-wider text-onSurfaceVariant mb-2' }, '분위기 · 스타일'),
    chipGroup({
      items: PICK_DATA.moods, multi: true, accent: ACCENT.mood,
      value: () => getPrefs().moods || [],
      onChange: v => patchPrefs({ moods: v }, router, refreshStats)
    })
  ));
  return wrap;
}

function companionPrefsContent(router, refreshStats) {
  const wrap = h('div', { className: 'pb-5' });
  wrap.appendChild(h('p', { className: 'font-body text-xs text-onSurfaceVariant mb-3' },
    '홈 화면 상단의 동행 칩과 동기화됩니다.'
  ));
  wrap.appendChild(chipGroup({
    items: PICK_DATA.companions, multi: false, accent: ACCENT.comp,
    value: () => getPrefs().companion || null,
    onChange: v => patchPrefs({ companion: v }, router, refreshStats)
  }));
  return wrap;
}

function renderSavedPreview() {
  const savedIds = AppState.get(STORAGE_KEYS.saved, []);
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
