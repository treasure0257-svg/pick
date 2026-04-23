import { h } from '../utils/dom.js';
import { Header } from '../components/Header.js';
import { BottomNav } from '../components/BottomNav.js';
import { PICK_DATA } from '../data.js';
import { AppState, STORAGE_KEYS } from '../App.js';

export function PreferencesView({ router }) {
  const state = {
    categories: new Set(),
    moods: new Set(),
    budget: null,
    duration: null,
    drinks: null,
    dietary: new Set(),
    spice: null,
    companion: null
  };

  const saved = AppState.get(STORAGE_KEYS.preferences, null);
  if (saved) {
    (saved.categories || []).forEach(x => state.categories.add(x));
    (saved.moods || []).forEach(x => state.moods.add(x));
    state.budget = saved.budget || null;
    state.duration = saved.duration || null;
    state.drinks = saved.drinks || null;
    (saved.dietary || []).forEach(x => state.dietary.add(x));
    state.spice = saved.spice || null;
    state.companion = saved.companion || null;
  }

  function renderChips(items, stateKey, multi = true, hasIcon = true) {
    const container = h('div', { className: 'flex flex-wrap gap-3' });

    function update() {
      container.innerHTML = '';
      items.forEach(item => {
        const selected = multi ? state[stateKey].has(item.id) : state[stateKey] === item.id;
        const btn = h('button', { 
          className: `chip ${selected ? 'is-selected' : ''} font-body text-sm font-medium py-2.5 px-5 rounded-full flex items-center gap-2 focus-ring`,
          onClick: () => {
            if (multi) {
              state[stateKey].has(item.id) ? state[stateKey].delete(item.id) : state[stateKey].add(item.id);
            } else {
              state[stateKey] = state[stateKey] === item.id ? null : item.id;
            }
            update();
          }
        },
          hasIcon && item.icon ? h('span', { className: 'material-symbols-outlined text-[18px]' }, item.icon) : null,
          h('span', {}, item.label)
        );
        container.appendChild(btn);
      });
    }

    update();
    return container;
  }

  const container = h('div', { className: 'flex flex-col min-h-screen' },
    Header(router),
    h('div', { className: 'bg-surfaceContainer h-[1px] w-full' }),
    h('main', { className: 'flex-grow flex flex-col md:flex-row max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 md:py-20 gap-12 relative z-10 pb-32 md:pb-12' },
      
      h('aside', { className: 'w-full md:w-5/12 flex flex-col justify-start md:sticky md:top-24 md:self-start relative' },
        h('div', { className: 'absolute inset-0 bg-primaryFixedDim/20 blur-3xl rounded-full -z-10 w-3/4 h-3/4 left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2' }),
        h('span', { className: 'font-label text-sm text-onSurfaceVariant mb-4' }, 'STEP 1 · 취향 설정'),
        h('h1', { className: 'font-headline text-[3rem] md:text-[3.5rem] leading-[1.05] tracking-[-0.02em] font-extrabold text-onSurface mb-6' },
          '당신만의 완벽한 ', h('br'), h('span', { className: 'text-primary' }, '휴식을 디자인하세요.')
        ),
        h('p', { className: 'font-body text-lg text-onSurfaceVariant mb-10 max-w-md leading-relaxed' }, '당신이 어떻게 쉬고 싶은지 알려주세요. 당신의 리듬에 딱 맞는 경험을 설계해 드립니다.'),
        h('div', { className: 'hidden md:block rounded-[2rem] overflow-hidden' },
          h('img', { src: 'https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?auto=format&fit=crop&w=1000&q=70', loading: 'lazy', className: 'w-full h-64 object-cover opacity-90 mix-blend-multiply filter grayscale-[20%]' })
        )
      ),

      h('section', { className: 'w-full md:w-7/12 flex flex-col gap-10' },
        h('section', { className: 'bg-surfaceContainerLow rounded-[2rem] p-8 md:p-10' },
          h('h2', { className: 'font-headline text-2xl font-bold text-onSurface mb-2' }, '관심 카테고리'),
          h('p', { className: 'font-body text-sm text-onSurfaceVariant mb-8' }, '복수 선택 가능. 비워두면 전체에서 추천해요.'),
          renderChips(PICK_DATA.categories, 'categories', true, true)
        ),
        h('section', { className: 'bg-surfaceContainerLow rounded-[2rem] p-8 md:p-10' },
          h('h2', { className: 'font-headline text-2xl font-bold text-onSurface mb-2' }, '분위기 및 스타일'),
          renderChips(PICK_DATA.moods, 'moods', true, true)
        ),
        h('section', { className: 'grid sm:grid-cols-2 gap-6' },
          h('div', { className: 'bg-surfaceContainerLow rounded-[2rem] p-8' },
            h('h3', { className: 'font-headline text-xl font-bold text-onSurface mb-4' }, '예산'),
            renderChips(PICK_DATA.budgets, 'budget', false, false)
          ),
          h('div', { className: 'bg-surfaceContainerLow rounded-[2rem] p-8' },
            h('h3', { className: 'font-headline text-xl font-bold text-onSurface mb-4' }, '소요 시간'),
            renderChips(PICK_DATA.durations, 'duration', false, false)
          )
        ),
        h('section', { className: 'bg-surfaceContainerLow rounded-[2rem] p-8 md:p-10' },
          h('h2', { className: 'font-headline text-2xl font-bold text-onSurface mb-2' }, '술은 어떻게?'),
          renderChips(PICK_DATA.drinks, 'drinks', false, true)
        ),
        h('section', { className: 'bg-surfaceContainerLow rounded-[2rem] p-8 md:p-10' },
          h('h2', { className: 'font-headline text-2xl font-bold text-onSurface mb-2' }, '식이 제한 · 알레르기'),
          h('p', { className: 'font-body text-sm text-onSurfaceVariant mb-6' },
            '맞지 않는 식당은 자동으로 추천에서 제외됩니다. 복수 선택 가능.'
          ),
          renderChips(PICK_DATA.dietary, 'dietary', true, true)
        ),
        h('section', { className: 'grid sm:grid-cols-2 gap-6' },
          h('div', { className: 'bg-surfaceContainerLow rounded-[2rem] p-8' },
            h('h3', { className: 'font-headline text-xl font-bold text-onSurface mb-4' }, '매운맛 선호'),
            renderChips(PICK_DATA.spiceLevels, 'spice', false, true)
          ),
          h('div', { className: 'bg-surfaceContainerLow rounded-[2rem] p-8' },
            h('h3', { className: 'font-headline text-xl font-bold text-onSurface mb-4' }, '오늘 누구랑?'),
            renderChips(PICK_DATA.companions, 'companion', false, true)
          )
        ),

        h('div', { className: 'flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2' },
          h('a', { href: '#/', className: 'inline-flex items-center justify-center gap-2 bg-transparent text-onSurfaceVariant font-body font-semibold py-4 px-6 rounded-xl hover:bg-surfaceContainer transition-colors' }, '돌아가기'),
          h('button', {
            className: 'inline-flex items-center justify-center gap-2 bg-gradient-to-br from-primary to-primary-dim text-onPrimary font-body font-semibold py-4 px-10 rounded-xl hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5',
            onClick: () => {
              const prefs = {
                categories: Array.from(state.categories),
                moods:      Array.from(state.moods),
                budget:     state.budget,
                duration:   state.duration,
                drinks:     state.drinks,
                dietary:    Array.from(state.dietary),
                spice:      state.spice,
                companion:  state.companion
              };
              AppState.set(STORAGE_KEYS.preferences, prefs);
              router.showToast('취향이 저장되었습니다.', 'success');
              router.navigate('#/results?source=preferences');
            }
          },
            h('span', { className: 'material-symbols-outlined' }, 'auto_awesome'), '추천 받기'
          )
        )
      )
    ),
    BottomNav(router)
  );

  return container;
}
