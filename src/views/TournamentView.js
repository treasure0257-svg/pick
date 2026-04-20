import { h } from '../utils/dom.js';
import { Header } from '../components/Header.js';
import { BottomNav } from '../components/BottomNav.js';
import { PICK_DATA } from '../data.js';
import { AppState, STORAGE_KEYS } from '../App.js';

export function TournamentView({ router }) {
  const state = {
    categoryId: 'all',
    drinks: 'flex',
    size: 8,
    bracket: [],
    round: 0,
    matchIndex: 0,
    totalMatches: 0,
    completedMatches: 0
  };

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  const container = h('div', { className: 'flex flex-col min-h-screen' },
    Header(router),
    h('div', { className: 'bg-surfaceContainer h-[1px] w-full' })
  );

  const main = h('main', { className: 'flex-grow max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 md:py-14 pb-32 md:pb-14' });
  container.appendChild(main);
  container.appendChild(BottomNav(router));

  const setupScreen = h('section', { id: 'setup-screen' });
  const matchScreen = h('section', { id: 'match-screen', className: 'hidden' });
  const winnerScreen = h('section', { id: 'winner-screen', className: 'hidden' });
  main.appendChild(setupScreen);
  main.appendChild(matchScreen);
  main.appendChild(winnerScreen);

  // --- Setup Screen ---
  function renderSetup() {
    setupScreen.innerHTML = '';
    
    // Chips renderer helper
    function createChips(items, selectedId, onClick) {
      const wrapper = h('div', { className: 'flex flex-wrap gap-3' });
      items.forEach(item => {
        const btn = h('button', {
          className: `chip ${selectedId === item.id ? 'is-selected' : ''} font-body text-sm font-medium py-2.5 px-5 rounded-full flex items-center gap-2 focus-ring`,
          onClick: () => onClick(item.id)
        }, 
          item.icon ? h('span', { className: 'material-symbols-outlined text-[18px]' }, item.icon) : null,
          item.label
        );
        wrapper.appendChild(btn);
      });
      return wrapper;
    }

    const catItems = [{ id: 'all', label: '전체', icon: 'apps' }, ...PICK_DATA.categories];
    const sizeItems = [4, 8, 16].map(s => ({ id: s, label: `${s}강` }));

    setupScreen.appendChild(h('div', { className: 'mb-10' },
      h('span', { className: 'font-label text-sm text-onSurfaceVariant' }, 'STEP 1 · 시작하기'),
      h('h1', { className: 'font-headline text-[2.5rem] md:text-[3rem] leading-tight tracking-tight font-extrabold text-onSurface mt-2' },
        '둘 중 하나만 ', h('span', { className: 'text-primary' }, '골라주세요.')
      ),
      h('p', { className: 'font-body text-onSurfaceVariant mt-3 max-w-2xl' }, 'A와 B, 이미지로 마주하고 감으로 고르세요. 끝까지 가면 오늘의 한 곳이 남습니다.')
    ));

    setupScreen.appendChild(h('div', { className: 'bg-surfaceContainerLow rounded-[2rem] p-8 md:p-10 mb-8' },
      h('h2', { className: 'font-headline text-xl font-bold text-onSurface mb-4' }, '카테고리 범위'),
      createChips(catItems, state.categoryId, id => { state.categoryId = id; renderSetup(); })
    ));

    setupScreen.appendChild(h('div', { className: 'bg-surfaceContainerLow rounded-[2rem] p-8 md:p-10 mb-8' },
      h('h2', { className: 'font-headline text-xl font-bold text-onSurface mb-4' }, '대진 규모'),
      createChips(sizeItems, state.size, id => { state.size = id; renderSetup(); })
    ));

    setupScreen.appendChild(h('div', { className: 'flex justify-end' },
      h('button', { 
        className: 'inline-flex items-center gap-2 bg-gradient-to-br from-primary to-primary-dim text-onPrimary font-body font-semibold py-4 px-10 rounded-xl hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5',
        onClick: () => {
          const pool = PICK_DATA.places.filter(p => state.categoryId === 'all' || p.category === state.categoryId);
          if (pool.length < state.size) {
            router.showToast(`선택한 범위의 장소가 ${pool.length}개뿐이에요.`, 'info');
            return;
          }
          state.bracket = shuffle(pool).slice(0, state.size);
          state.round = 0;
          state.matchIndex = 0;
          state.completedMatches = 0;
          state.totalMatches = state.size - 1;
          
          setupScreen.classList.add('hidden');
          winnerScreen.classList.add('hidden');
          matchScreen.classList.remove('hidden');
          renderMatch();
        }
      }, h('span', { className: 'material-symbols-outlined' }, 'play_arrow'), '시작하기')
    ));
  }

  // --- Match Screen ---
  function renderMatch() {
    matchScreen.innerHTML = '';
    const size = state.bracket.length;
    const matchesThisRound = size / 2;
    const roundLabelStr = size === 2 ? '결승' : size === 4 ? '준결승' : `${size}강`;

    const a = state.bracket[state.matchIndex * 2];
    const b = state.bracket[state.matchIndex * 2 + 1];
    const pct = Math.round((state.completedMatches / state.totalMatches) * 100);

    function buildCard(place, side) {
      const catLabel = PICK_DATA.categories.find(c => c.id === place.category)?.label || '';
      return h('button', { 
        className: 'card-lift group text-left bg-surfaceContainerLowest rounded-[2rem] p-0 overflow-hidden min-h-[420px] flex flex-col',
        onClick: () => pick(side)
      },
        h('div', { className: 'relative h-56 md:h-72 overflow-hidden' },
          h('img', { src: place.image, loading: 'lazy', className: 'w-full h-full object-cover group-hover:scale-105 transition-transform duration-700' })
        ),
        h('div', { className: 'p-6 md:p-8 flex-grow flex flex-col' },
          h('span', { className: 'font-label text-xs text-primary uppercase tracking-widest' }, catLabel),
          h('h3', { className: 'font-headline text-2xl font-bold text-onSurface mt-2' }, place.name),
          h('p', { className: 'font-body text-onSurfaceVariant mt-2 flex-grow' }, place.blurb),
          h('div', { className: 'mt-6 inline-flex items-center gap-2 text-primary font-semibold' },
            '이걸로 ', h('span', { className: 'material-symbols-outlined' }, 'arrow_forward')
          )
        )
      );
    }

    matchScreen.appendChild(
      h('div', { className: 'flex items-center justify-between mb-6' },
        h('div', {},
          h('p', { className: 'font-label text-sm text-onSurfaceVariant' }, `R${state.round + 1} · ${roundLabelStr}`),
          h('h2', { className: 'font-headline text-2xl md:text-3xl font-bold text-onSurface mt-1' }, `${state.matchIndex + 1} / ${matchesThisRound}`)
        ),
        h('button', { 
          className: 'text-onSurfaceVariant hover:bg-surfaceContainer px-3 py-2 rounded-lg inline-flex items-center gap-2',
          onClick: () => { matchScreen.classList.add('hidden'); setupScreen.classList.remove('hidden'); }
        }, h('span', { className: 'material-symbols-outlined' }, 'refresh'), '다시 시작')
      )
    );

    matchScreen.appendChild(
      h('div', { className: 'w-full bg-surfaceContainer h-2 rounded-full overflow-hidden mb-10' },
        h('div', { className: 'bg-primary h-full transition-all duration-300', style: { width: `${pct}%` } })
      )
    );

    matchScreen.appendChild(
      h('div', { className: 'grid md:grid-cols-[1fr,auto,1fr] gap-6 items-center' },
        buildCard(a, 'a'),
        h('div', { className: 'flex md:flex-col items-center justify-center gap-4 py-4' },
          h('div', { className: 'bg-surfaceContainerLowest rounded-full w-14 h-14 flex items-center justify-center font-headline font-extrabold text-primary shadow-sm' }, 'VS')
        ),
        buildCard(b, 'b')
      )
    );
  }

  function pick(side) {
    const size = state.bracket.length;
    const a = state.bracket[state.matchIndex * 2];
    const b = state.bracket[state.matchIndex * 2 + 1];
    state.bracket[state.matchIndex] = side === 'a' ? a : b;

    state.matchIndex++;
    state.completedMatches++;

    if (state.matchIndex >= size / 2) {
      state.bracket = state.bracket.slice(0, size / 2);
      state.round++;
      state.matchIndex = 0;
    }

    if (state.bracket.length === 1) {
      showWinner(state.bracket[0]);
    } else {
      renderMatch();
    }
  }

  // --- Winner Screen ---
  function showWinner(winner) {
    AppState.set(STORAGE_KEYS.tournament, { winnerId: winner.id, ts: Date.now() });
    winnerScreen.innerHTML = '';
    const catLabel = PICK_DATA.categories.find(c => c.id === winner.category)?.label || '';

    // Web Share API
    const handleShare = async () => {
      if (navigator.share) {
        try {
          await navigator.share({
            title: `오늘의 픽: ${winner.name}`,
            text: winner.blurb,
            url: window.location.origin + window.location.pathname + `#/results?place=${winner.id}`
          });
          router.showToast('공유되었습니다.', 'success');
        } catch (e) {
          console.log('Share failed', e);
        }
      } else {
        router.showToast('공유하기를 지원하지 않는 브라우저입니다.', 'info');
      }
    };

    winnerScreen.appendChild(
      h('div', { className: 'text-center mb-10' },
        h('span', { className: 'inline-block bg-secondaryContainer text-onSecondaryContainer text-xs font-medium px-3 py-1 rounded-full mb-4' }, '우승'),
        h('h2', { className: 'font-headline text-[2.5rem] md:text-[3.5rem] leading-tight font-extrabold text-onSurface' }, '오늘은 ', h('span', { className: 'text-primary' }, '이거예요.'))
      )
    );

    winnerScreen.appendChild(
      h('div', { className: 'bg-surfaceContainerLowest rounded-[2rem] overflow-hidden max-w-3xl mx-auto fade-in' },
        h('img', { src: winner.image, loading: 'lazy', className: 'w-full h-72 md:h-96 object-cover' }),
        h('div', { className: 'p-8 md:p-12' },
          h('span', { className: 'font-label text-xs text-primary uppercase tracking-widest' }, catLabel),
          h('h3', { className: 'font-headline text-3xl md:text-4xl font-bold text-onSurface mt-2' }, winner.name),
          h('p', { className: 'font-body text-onSurfaceVariant mt-4 text-lg leading-relaxed' }, winner.blurb),
          h('div', { className: 'flex flex-col sm:flex-row gap-3 mt-10' },
            h('a', { href: `#/results?place=${winner.id}`, className: 'inline-flex items-center justify-center gap-2 bg-gradient-to-br from-primary to-primary-dim text-onPrimary font-body font-semibold py-4 px-8 rounded-xl hover:-translate-y-0.5 transition-all duration-300' },
              h('span', { className: 'material-symbols-outlined' }, 'map'), '지도에서 보기'
            ),
            h('button', { onClick: handleShare, className: 'inline-flex items-center justify-center gap-2 bg-secondaryContainer text-onSecondaryContainer font-body font-semibold py-4 px-8 rounded-xl hover:bg-secondaryFixedDim transition-colors' },
              h('span', { className: 'material-symbols-outlined' }, 'share'), '공유하기'
            ),
            h('button', { 
              className: 'inline-flex items-center justify-center gap-2 bg-transparent border border-surfaceContainerHighest text-onSurface font-body font-semibold py-4 px-8 rounded-xl hover:bg-surfaceContainer transition-colors',
              onClick: () => { winnerScreen.classList.add('hidden'); setupScreen.classList.remove('hidden'); }
            }, h('span', { className: 'material-symbols-outlined' }, 'replay'), '다시 돌리기')
          )
        )
      )
    );
    matchScreen.classList.add('hidden');
    winnerScreen.classList.remove('hidden');
  }

  renderSetup();
  return container;
}
