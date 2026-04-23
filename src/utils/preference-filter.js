// 사용자 취향(prefs)을 Kakao/Naver 검색 결과에 적용하는 필터·랭커.
// place 스키마: { name, category(FD6/CE7/AT4/AD5/CT1), categoryFull, ... }
//
// 적용 정책:
// - dietary 는 HARD FILTER: 명백히 안 맞는 음식점만 제외 (오탐 최소화 — false positive 보다 false negative 우선)
// - spice 는 HARD FILTER: '안 매운 거'만 매운 카테고리 제외, '매운 거 OK'는 가산점
// - companion 은 SOFT BOOST: 점수 가산만, 필터링 안 함
//
// 필터는 음식점(FD6) 카테고리에만 적용. 카페·관광·숙소엔 영향 없음.

// 카테고리/이름에 어느 키워드가 들어있는지
function hasAny(text, keywords) {
  if (!text) return false;
  return keywords.some(kw => text.includes(kw));
}

const DIETARY_EXCLUDE_KEYWORDS = {
  vegan: [
    '고기', '구이', '갈비', '삼겹', '소고기', '돼지', '곱창', '족발', '보쌈',
    '치킨', '닭', '회', '횟집', '초밥', '스시', '해산물', '해물', '랍스터',
    '돈까스', '돈가스', '햄버거', '스테이크', '오리'
  ],
  vegetarian: [
    '고기', '구이', '갈비', '삼겹', '소고기', '돼지', '곱창', '족발', '보쌈',
    '치킨', '닭', '회', '횟집', '초밥', '스시', '해산물', '해물', '돈까스', '오리'
  ],
  halal: [
    '돼지', '삼겹', '족발', '보쌈', '돈까스', '돈가스', '술집', '이자카야', '포차',
    '와인', '위스키', '맥주'
  ],
  glutenFree: [
    '분식', '떡볶이', '라멘', '우동', '파스타', '피자', '만두', '베이커리', '빵',
    '도넛', '버거'
  ],
  noPork: ['돼지', '삼겹', '족발', '보쌈', '돈까스', '돈가스'],
  nutAllergy: ['땅콩', '아몬드', '견과', '베이커리'],
  shellfishAllergy: ['새우', '게', '랍스터', '조개', '굴', '해산물', '해물', '회']
};

const SPICY_KEYWORDS = ['매운', '마라', '떡볶이', '닭갈비', '낙지', '아구찜', '짬뽕', '쭈꾸미', '불닭'];

export function applyDietaryFilter(places, prefs) {
  if (!prefs?.dietary?.length) return places;
  const excludeKeywords = new Set();
  prefs.dietary.forEach(d => {
    (DIETARY_EXCLUDE_KEYWORDS[d] || []).forEach(k => excludeKeywords.add(k));
  });
  if (excludeKeywords.size === 0) return places;

  return places.filter(p => {
    if (p.category !== 'FD6') return true; // 음식점만 필터, 카페·관광·숙소 통과
    const haystack = `${p.name || ''} ${p.categoryFull || ''} ${p.categoryLabel || ''}`;
    return !hasAny(haystack, [...excludeKeywords]);
  });
}

export function applySpiceFilter(places, prefs) {
  if (!prefs?.spice || prefs.spice !== 'mild') return places;
  return places.filter(p => {
    if (p.category !== 'FD6') return true;
    const haystack = `${p.name || ''} ${p.categoryFull || ''}`;
    return !hasAny(haystack, SPICY_KEYWORDS);
  });
}

// 동행 유형에 따른 카테고리/키워드 가중치 → 정렬 순서만 재배치
const COMPANION_BOOST_KEYWORDS = {
  solo:     { categories: ['CE7', 'AT4'],         keywords: ['카페', '북카페', '서점', '미술관', '전시'] },
  couple:   { categories: ['CE7', 'AT4', 'FD6'],  keywords: ['데이트', '뷰', '전망', '루프탑', '이탈리안', '와인', '스테이크'] },
  opposite: { categories: ['CE7', 'AT4', 'FD6'],  keywords: ['카페', '브런치', '디저트', '와인바', '뷰', '전시', '미술관', '한강', '루프탑'] },
  friends:  { categories: ['FD6', 'AT4'],         keywords: ['고기', '술집', '치맥', '노래방', '방탈출', '체험'] },
  family:   { categories: ['AT4', 'FD6'],         keywords: ['가족', '키즈', '동물원', '수족관', '한정식', '뷔페'] },
  work:     { categories: ['FD6'],                keywords: ['한정식', '룸', '회식', '갈비', '한우', '코스'] }
};

export function applyCompanionBoost(places, prefs) {
  if (!prefs?.companion) return places;
  const cfg = COMPANION_BOOST_KEYWORDS[prefs.companion];
  if (!cfg) return places;

  // 점수: 카테고리 일치 +5, 키워드 일치 +3
  const scored = places.map((p, originalIdx) => {
    let bonus = 0;
    if (cfg.categories.includes(p.category)) bonus += 5;
    const haystack = `${p.name || ''} ${p.categoryFull || ''}`;
    if (hasAny(haystack, cfg.keywords)) bonus += 3;
    return { p, bonus, originalIdx };
  });
  // 가중치 내림차순 → 동점 시 원래 순서 유지 (안정 정렬)
  scored.sort((a, b) => b.bonus - a.bonus || a.originalIdx - b.originalIdx);
  return scored.map(x => x.p);
}

export function applyAllPreferences(places, prefs) {
  let out = applyDietaryFilter(places, prefs);
  out = applySpiceFilter(out, prefs);
  out = applyCompanionBoost(out, prefs);
  return out;
}
