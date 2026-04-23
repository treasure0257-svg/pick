import { h } from '../utils/dom.js';
import { Header } from '../components/Header.js';
import { BottomNav } from '../components/BottomNav.js';
import { Footer } from '../components/Footer.js';
import { PlacesMap } from '../components/PlacesMap.js';
import { getCachedPlace, nearbySearch, normalizeKakaoPlace, cachePlaces } from '../services/kakaoLocal.js';
import { makeSaveBtn, haversineKm, formatDistance, categoryMeta } from '../utils/place-ui.js';

export function PlaceDetailView({ router, params }) {
  const id = params.get('id');
  const from = params.get('from'); // e.g. "region:seoul" or "region:seoul:hongdae"
  const place = id ? getCachedPlace(id) : null;

  const container = h('div', { className: 'flex flex-col min-h-screen' },
    Header(router),
    h('div', { className: 'bg-surfaceContainer h-[1px] w-full' })
  );
  container.appendChild(
    (function () {
      const m = h('main', { className: 'flex-grow max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 md:py-12 pb-32 md:pb-12' });
      container._main = m;
      return m;
    })()
  );
  container.appendChild(Footer());
  container.appendChild(BottomNav(router));
  const main = container._main;

  if (!place) {
    main.appendChild(
      h('div', { className: 'text-center py-16' },
        h('span', { className: 'material-symbols-outlined text-5xl text-onSurfaceVariant mb-4 block mx-auto' }, 'search_off'),
        h('h1', { className: 'font-headline text-2xl font-bold text-onSurface mb-2' }, '장소 정보를 찾을 수 없어요'),
        h('p', { className: 'font-body text-sm text-onSurfaceVariant mb-6' }, '이 장소는 다시 지역 페이지에서 진입해주세요. 브라우저를 새로고침하거나 직접 URL로 진입하면 캐시가 사라집니다.'),
        h('a', { href: '#/', className: 'inline-flex items-center gap-2 bg-primary text-onPrimary font-body font-semibold py-3 px-6 rounded-xl' },
          h('span', { className: 'material-symbols-outlined' }, 'home'), '홈으로'
        )
      )
    );
    return container;
  }

  const cat = categoryMeta(place.category);
  const categoryPath = (place.categoryFull || '').split('>').map(s => s.trim()).filter(Boolean).join(' › ');

  // Back link
  let backHref = '#/';
  let backLabel = '홈';
  if (from?.startsWith('region:')) {
    const parts = from.slice('region:'.length).split(':');
    const regionId = parts[0];
    const subId = parts[1];
    backHref = subId ? `#/results?region=${regionId}&area=${subId}` : `#/results?region=${regionId}`;
    backLabel = '결과로 돌아가기';
  }

  // Hero
  main.appendChild(
    h('a', { href: backHref, className: 'inline-flex items-center gap-1 text-sm text-onSurfaceVariant hover:text-primary mb-5 font-body' },
      h('span', { className: 'material-symbols-outlined text-[18px]' }, 'arrow_back'),
      backLabel
    )
  );

  main.appendChild(
    h('section', { className: 'mb-8 flex items-start gap-5' },
      h('div', { className: 'flex-none w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-primaryContainer/60 flex items-center justify-center text-primary' },
        h('span', { className: 'material-symbols-outlined text-[40px] md:text-[48px]' }, cat.icon)
      ),
      h('div', { className: 'flex-grow min-w-0' },
        h('div', { className: 'flex items-center gap-2 flex-wrap mb-1.5' },
          h('span', { className: `inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${cat.accent}` },
            h('span', { className: 'material-symbols-outlined text-[14px]' }, cat.icon),
            cat.label
          ),
          categoryPath
            ? h('span', { className: 'font-label text-[11px] text-onSurfaceVariant truncate' }, categoryPath)
            : null
        ),
        h('h1', { className: 'font-headline text-[1.75rem] md:text-[2.25rem] font-extrabold text-onSurface tracking-tight' }, place.name)
      )
    )
  );

  // 2-col: details (left), map (right)
  const mapCol = h('aside', { className: 'md:sticky md:top-[88px] md:self-start' });
  const detailCol = h('section', { className: 'flex flex-col gap-4' });

  // Overview card
  const overview = h('div', { className: 'bg-surfaceContainerLowest rounded-2xl p-5 flex flex-col gap-2.5' },
    place.address
      ? h('div', { className: 'flex items-start gap-2' },
          h('span', { className: 'material-symbols-outlined text-[18px] text-onSurfaceVariant flex-none mt-0.5' }, 'location_on'),
          h('div', { className: 'flex-grow min-w-0' },
            h('p', { className: 'font-body text-sm text-onSurface break-keep' }, place.address),
            place.addressLegacy && place.addressLegacy !== place.address
              ? h('p', { className: 'font-body text-xs text-onSurfaceVariant mt-0.5 break-keep' }, `지번: ${place.addressLegacy}`)
              : null
          )
        )
      : null,
    place.phone
      ? h('div', { className: 'flex items-center gap-2' },
          h('span', { className: 'material-symbols-outlined text-[18px] text-onSurfaceVariant flex-none' }, 'call'),
          h('a', { href: `tel:${place.phone}`, className: 'font-body text-sm text-onSurface hover:text-primary' }, place.phone)
        )
      : null
  );
  detailCol.appendChild(overview);

  // Actions row (primary)
  const actions = h('div', { className: 'flex items-center gap-2 flex-wrap' },
    makeSaveBtn(place, router, { variant: 'button' }),
    place.placeUrl
      ? h('a', {
          href: place.placeUrl, target: '_blank', rel: 'noopener',
          className: 'inline-flex items-center justify-center gap-1 px-4 py-2.5 rounded-full text-sm font-body font-semibold bg-primary text-onPrimary hover:shadow-md transition-all'
        },
          h('span', { className: 'material-symbols-outlined text-[18px]' }, 'reviews'),
          '사진·리뷰 보기'
        )
      : null,
    h('a', {
        href: `https://map.kakao.com/link/to/${encodeURIComponent(place.name)},${place.lat},${place.lng}`,
        target: '_blank', rel: 'noopener',
        className: 'inline-flex items-center justify-center gap-1 px-4 py-2.5 rounded-full text-sm font-body font-semibold bg-secondaryContainer text-onSecondaryContainer hover:bg-secondaryFixedDim transition-colors'
      },
        h('span', { className: 'material-symbols-outlined text-[18px]' }, 'directions'),
        '길찾기'
      ),
    place.phone
      ? h('a', {
          href: `tel:${place.phone}`,
          className: 'inline-flex items-center justify-center gap-1 px-4 py-2.5 rounded-full text-sm font-body font-semibold bg-surfaceContainerLowest text-onSurface hover:bg-surfaceContainer transition-colors'
        },
          h('span', { className: 'material-symbols-outlined text-[18px]' }, 'call'),
          '전화'
        )
      : null
  );
  detailCol.appendChild(actions);

  // Kakao Place CTA — info Kakao has that we don't
  detailCol.appendChild(
    h('div', { className: 'bg-gradient-to-br from-primary-dim/10 to-primaryContainer/30 rounded-2xl p-5' },
      h('div', { className: 'flex items-start gap-3' },
        h('span', { className: 'material-symbols-outlined text-2xl text-primary flex-none' }, 'photo_library'),
        h('div', { className: 'flex-grow' },
          h('h3', { className: 'font-headline font-bold text-onSurface mb-1' }, '사진·리뷰·영업시간·메뉴'),
          h('p', { className: 'font-body text-sm text-onSurfaceVariant leading-relaxed' },
            '이 장소의 실제 방문객 사진·리뷰·평점·영업시간·메뉴 같은 상세 정보는 카카오맵 장소 페이지에서 제공됩니다.'
          ),
          place.placeUrl
            ? h('a', {
                href: place.placeUrl, target: '_blank', rel: 'noopener',
                className: 'inline-flex items-center gap-1 mt-3 text-sm font-body font-semibold text-primary hover:underline'
              },
                '카카오맵에서 자세히 보기',
                h('span', { className: 'material-symbols-outlined text-[16px]' }, 'open_in_new')
              )
            : null
        )
      )
    )
  );

  const grid = h('div', { className: 'grid md:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] gap-5 md:gap-7' }, detailCol, mapCol);
  main.appendChild(grid);

  // Side map: single place
  const mapApi = PlacesMap({ places: [place] });
  mapCol.appendChild(mapApi.el);

  // Nearby section (full width below the grid)
  const nearbyWrap = h('section', { className: 'mt-10 md:mt-14' });
  main.appendChild(nearbyWrap);

  nearbyWrap.appendChild(
    h('div', { className: 'flex items-end justify-between mb-5' },
      h('h2', { className: 'font-headline text-xl md:text-2xl font-extrabold text-onSurface tracking-tight' }, '이 근처 가볼만한 곳'),
      h('span', { className: 'font-label text-xs text-onSurfaceVariant' }, '반경 1.5km 이내')
    )
  );

  const nearbyGrid = h('div', { className: 'grid sm:grid-cols-2 lg:grid-cols-3 gap-3' });
  nearbyWrap.appendChild(nearbyGrid);

  async function loadNearby() {
    if (!Number.isFinite(place.lat) || !Number.isFinite(place.lng)) return;
    // 같은 장소 자체를 제외하고 카테고리별로 가까운 거 3개씩
    const tasks = [
      ['FD6', 'restaurant'],
      ['CE7', 'local_cafe'],
      ['AT4', 'attractions']
    ].map(([code]) =>
      nearbySearch({ lat: place.lat, lng: place.lng, categoryCode: code, radius: 1500, size: 5 })
    );
    const results = await Promise.allSettled(tasks);
    const seen = new Set([place.kakaoId]);
    const merged = [];
    for (const r of results) {
      if (r.status !== 'fulfilled') continue;
      for (const kp of r.value) {
        if (seen.has(kp.id)) continue;
        seen.add(kp.id);
        merged.push(normalizeKakaoPlace(kp));
        if (merged.length >= 9) break;
      }
      if (merged.length >= 9) break;
    }
    cachePlaces(merged);

    if (merged.length === 0) {
      nearbyGrid.appendChild(
        h('div', { className: 'col-span-full p-6 text-center text-onSurfaceVariant font-body text-sm bg-surfaceContainerLowest rounded-2xl' },
          '반경 1.5km 안에 가까운 장소가 없어요.'
        )
      );
      return;
    }

    for (const p of merged) {
      const near = categoryMeta(p.category);
      const dist = haversineKm(place.lat, place.lng, p.lat, p.lng);
      const card = h('a', {
        href: `#/place?id=${encodeURIComponent(p.id)}${from ? `&from=${encodeURIComponent(from)}` : ''}`,
        className: 'card-lift bg-surfaceContainerLowest rounded-2xl p-4 flex flex-col gap-2 transition-all'
      },
        h('div', { className: 'flex items-center gap-2' },
          h('span', { className: `inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${near.accent}` },
            h('span', { className: 'material-symbols-outlined text-[12px]' }, near.icon),
            near.label
          ),
          h('span', { className: 'font-label text-[11px] text-onSurfaceVariant ml-auto' }, formatDistance(dist))
        ),
        h('h3', { className: 'font-headline font-bold text-sm text-onSurface truncate' }, p.name),
        h('p', { className: 'font-body text-xs text-onSurfaceVariant truncate' }, p.address || '')
      );
      nearbyGrid.appendChild(card);
    }
  }

  // loading placeholder
  nearbyGrid.appendChild(
    h('div', { className: 'col-span-full p-6 text-center text-onSurfaceVariant font-body text-sm' },
      h('span', { className: 'material-symbols-outlined text-xl animate-pulse mb-1 block mx-auto' }, 'travel_explore'),
      '주변 장소 불러오는 중…'
    )
  );

  loadNearby()
    .then(() => { nearbyGrid.firstChild?.classList?.contains('animate-pulse'); /* already replaced via append */ })
    .catch((e) => {
      console.error('[PlaceDetail nearby]', e);
      nearbyGrid.innerHTML = '';
      nearbyGrid.appendChild(
        h('div', { className: 'col-span-full p-6 text-center text-red-600 font-body text-sm bg-surfaceContainerLowest rounded-2xl' },
          '주변 장소를 불러오지 못했어요.'
        )
      );
    });

  // Remove loading placeholder before adding real items
  // (실제로는 loadNearby가 내부에서 cards를 append하므로, 기존 로딩 노드를 먼저 지워줘야 한다)
  const original = nearbyGrid.firstChild;
  loadNearby.then = null; // no-op; 위에서 이미 실행됨. 로딩 노드는 DOM 교체로 안전하게 제거하자.
  setTimeout(() => {
    if (original && nearbyGrid.contains(original) && nearbyGrid.children.length > 1) {
      original.remove();
    }
  }, 50);

  return container;
}
