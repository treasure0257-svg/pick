import { h } from '../utils/dom.js';
import { Header } from '../components/Header.js';
import { BottomNav } from '../components/BottomNav.js';
import { PICK_DATA } from '../data.js';

export function HomeView({ router }) {
  const container = h('div', { className: 'flex flex-col min-h-screen' },
    Header(router),
    h('div', { className: 'bg-surfaceContainer h-[1px] w-full' }),
    h('main', { className: 'flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 pb-32 md:pb-20' },
      
      // Hero Section
      h('section', { className: 'relative grid md:grid-cols-2 gap-10 md:gap-16 items-center mb-24' },
        h('div', { className: 'absolute inset-0 bg-primaryFixedDim/20 blur-3xl rounded-full -z-10 w-3/4 h-3/4 left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2' }),
        h('div', {},
          h('span', { className: 'inline-block bg-secondaryContainer text-onSecondaryContainer text-xs font-medium px-3 py-1 rounded-full mb-6' }, '결정장애를 위한 디지털 컨시어지'),
          h('h1', { className: 'font-headline text-[3rem] md:text-[3.5rem] leading-[1.05] tracking-[-0.02em] font-extrabold text-onSurface mb-6' },
            '"뭐하지?"를 ', h('br'), h('span', { className: 'text-primary' }, '끝내는 곳.')
          ),
          h('p', { className: 'font-body text-lg text-onSurfaceVariant mb-10 max-w-md leading-relaxed' },
            '매주 검색하며 허비하는 시간, 우리가 대신 고민해 드려요. 취향으로 추천받거나, 토너먼트로 좁혀가거나 — 원하는 방식으로.'
          ),
          h('div', { className: 'flex flex-col sm:flex-row gap-3' },
            h('a', { href: '#/preferences', className: 'inline-flex items-center justify-center gap-2 bg-gradient-to-br from-primary to-primary-dim text-onPrimary font-body font-semibold py-4 px-8 rounded-xl hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5' },
              h('span', { className: 'material-symbols-outlined' }, 'tune'), '취향으로 추천받기'
            ),
            h('a', { href: '#/tournament', className: 'inline-flex items-center justify-center gap-2 bg-secondaryContainer text-onSecondaryContainer font-body font-semibold py-4 px-8 rounded-xl hover:bg-secondaryFixedDim transition-colors' },
              h('span', { className: 'material-symbols-outlined' }, 'swords'), '토너먼트로 고르기'
            )
          )
        ),
        h('div', { className: 'relative' },
          h('div', { className: 'rounded-[2rem] overflow-hidden bg-surfaceContainerLow aspect-[4/3] relative' },
            h('img', { src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=70', loading: 'lazy', alt: 'Relaxing weekend', className: 'w-full h-full object-cover mix-blend-multiply filter grayscale-[15%]' }),
            h('div', { className: 'absolute bottom-4 left-4 right-4 frosted rounded-xl p-4' },
              h('p', { className: 'font-headline text-sm font-semibold text-onSurface' }, '이번 주말, 평균 2.4시간을 검색에 썼어요.'),
              h('p', { className: 'font-body text-xs text-onSurfaceVariant mt-1' }, '2025년 국내 직장인 조사 기준')
            )
          )
        )
      ),

      // Two paths
      h('section', { className: 'mb-24' },
        h('div', { className: 'flex items-end justify-between mb-8' },
          h('div', {},
            h('h2', { className: 'font-headline text-3xl md:text-4xl font-extrabold text-onSurface tracking-tight' }, '두 가지 방식'),
            h('p', { className: 'font-body text-onSurfaceVariant mt-2' }, '지금 기분에 맞는 방식을 고르세요.')
          )
        ),
        h('div', { className: 'grid md:grid-cols-2 gap-6' },
          h('a', { href: '#/preferences', className: 'card-lift group bg-surfaceContainerLowest rounded-[2rem] p-10 flex flex-col justify-between min-h-[280px] relative overflow-hidden' },
            h('div', { className: 'absolute -top-10 -right-10 w-40 h-40 bg-primaryFixedDim/30 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-700' }),
            h('div', { className: 'relative' },
              h('div', { className: 'inline-flex w-12 h-12 items-center justify-center rounded-xl bg-primaryFixed text-primary mb-6' },
                h('span', { className: 'material-symbols-outlined' }, 'tune')
              ),
              h('h3', { className: 'font-headline text-2xl font-bold text-onSurface mb-3' }, '취향 기반 추천'),
              h('p', { className: 'font-body text-onSurfaceVariant leading-relaxed' }, '몇 가지 질문과 분위기 태그로 당신의 리듬에 맞춘 맞춤 코스를 제안해요.')
            ),
            h('div', { className: 'relative mt-8 flex items-center gap-2 text-primary font-semibold' },
              '취향 설정 시작', h('span', { className: 'material-symbols-outlined transition-transform group-hover:translate-x-1' }, 'arrow_forward')
            )
          ),
          h('a', { href: '#/tournament', className: 'card-lift group bg-surfaceContainerLowest rounded-[2rem] p-10 flex flex-col justify-between min-h-[280px] relative overflow-hidden' },
            h('div', { className: 'absolute -top-10 -right-10 w-40 h-40 bg-tertiaryFixed/30 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-700' }),
            h('div', { className: 'relative' },
              h('div', { className: 'inline-flex w-12 h-12 items-center justify-center rounded-xl bg-tertiaryFixed text-onTertiaryContainer mb-6' },
                h('span', { className: 'material-symbols-outlined' }, 'swords')
              ),
              h('h3', { className: 'font-headline text-2xl font-bold text-onSurface mb-3' }, '이상형 월드컵'),
              h('p', { className: 'font-body text-onSurfaceVariant leading-relaxed' }, 'A와 B, 계속 둘 중 하나만 고르다 보면 오늘 하고 싶은 게 선명해져요.')
            ),
            h('div', { className: 'relative mt-8 flex items-center gap-2 text-primary font-semibold' },
              '토너먼트 시작', h('span', { className: 'material-symbols-outlined transition-transform group-hover:translate-x-1' }, 'arrow_forward')
            )
          )
        )
      ),

      // Categories
      h('section', { className: 'mb-24' },
        h('div', { className: 'mb-8' },
          h('h2', { className: 'font-headline text-3xl md:text-4xl font-extrabold text-onSurface tracking-tight' }, '카테고리로 바로 시작'),
          h('p', { className: 'font-body text-onSurfaceVariant mt-2' }, '뭘 하고 싶은지만 정해져 있다면, 바로 이동.')
        ),
        h('div', { className: 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4' },
          ...PICK_DATA.categories.map(c => 
            h('a', { href: `#/results?category=${c.id}`, className: 'card-lift bg-surfaceContainerLowest rounded-xl p-6 flex flex-col gap-3 focus-ring' },
              h('span', { className: 'material-symbols-outlined text-primary' }, c.icon),
              h('span', { className: 'font-headline font-semibold text-onSurface' }, c.label)
            )
          )
        )
      )
    ),
    BottomNav(router)
  );

  return container;
}
