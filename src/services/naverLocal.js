// Naver Search API 호출 래퍼.
// Cloudflare Worker 프록시 (VITE_NAVER_PROXY_URL) 를 거쳐서 CORS 우회.
// - local search: 지역 장소 (맛집/카페/명소 등)
// - image search: 장소 이름별 대표 사진 1장

const PROXY = import.meta.env.VITE_NAVER_PROXY_URL;

function proxyFetch(type, query, display) {
  if (!PROXY) return Promise.reject(new Error('VITE_NAVER_PROXY_URL missing'));
  const url = `${PROXY}/?type=${type}&query=${encodeURIComponent(query)}&display=${display}`;
  return fetch(url).then(r => {
    if (!r.ok) throw new Error(`Naver ${type}: HTTP ${r.status}`);
    return r.json();
  });
}

export async function naverLocalSearch(query, display = 5) {
  try {
    const data = await proxyFetch('local', query, display);
    return data.items || [];
  } catch (e) {
    console.warn('[naverLocalSearch]', e.message);
    return [];
  }
}

export async function naverImageSearch(query, display = 1) {
  try {
    const data = await proxyFetch('image', query, display);
    return data.items || [];
  } catch (e) {
    console.warn('[naverImageSearch]', e.message);
    return [];
  }
}

// Naver 블로그 검색 — 우리는 total(매칭 수)만 필요. display=1 로 트래픽 최소화.
export async function naverBlogCount(query) {
  try {
    const data = await proxyFetch('blog', query, 1);
    return Number(data.total || 0);
  } catch (e) {
    console.warn('[naverBlogCount]', e.message);
    return 0;
  }
}

// Naver place → 공통 스키마로 정규화
// Naver의 <b> 태그 감싼 title 등도 정리
function stripTags(s) { return (s || '').replace(/<\/?b>/g, ''); }

function mapNaverCategory(naverCat) {
  if (!naverCat) return null;
  const c = naverCat.toLowerCase();
  if (/카페|커피/.test(c)) return 'CE7';
  if (/음식점|식당|맛집|레스토랑/.test(c)) return 'FD6';
  if (/관광|명소|박물관|미술관|공원|전시/.test(c)) return 'AT4';
  if (/문화|공연|극장|영화/.test(c)) return 'CT1';
  if (/숙박|호텔|펜션|모텔/.test(c)) return 'AD5';
  return null;
}

export function normalizeNaverPlace(np) {
  // Naver mapx/mapy 는 1e7 배율 정수
  const lng = parseInt(np.mapx, 10) / 1e7;
  const lat = parseInt(np.mapy, 10) / 1e7;
  const name = stripTags(np.title);
  return {
    id: 'naver:' + name + ':' + np.roadAddress,
    source: 'naver',
    name,
    address: np.roadAddress || np.address,
    addressLegacy: np.address,
    phone: np.telephone || '',
    category: mapNaverCategory(np.category),
    categoryLabel: np.category || '',
    categoryFull: np.category || '',
    lat, lng,
    placeUrl: np.link || '',
    image: null,
    blurb: stripTags(np.category || '')
  };
}

// --- 이미지 로컬 캐시 (24h TTL) ---
const IMG_CACHE_KEY = 'pick.naver.imgCache.v1';
const IMG_TTL_MS = 24 * 60 * 60 * 1000;

function loadImgCache() {
  try {
    const raw = localStorage.getItem(IMG_CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    const now = Date.now();
    // TTL 만료된 건 제거
    const cleaned = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (v && v.t && now - v.t < IMG_TTL_MS) cleaned[k] = v;
    }
    return cleaned;
  } catch { return {}; }
}

function saveImgCache(cache) {
  try { localStorage.setItem(IMG_CACHE_KEY, JSON.stringify(cache)); } catch {}
}

const inflight = new Map(); // key → Promise

// --- 블로그 후기 수 캐시 (24h TTL, 별도 키) ---
const BLOG_CACHE_KEY = 'pick.naver.blogCountCache.v1';
const BLOG_TTL_MS = 24 * 60 * 60 * 1000;

function loadBlogCache() {
  try {
    const raw = localStorage.getItem(BLOG_CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    const now = Date.now();
    const cleaned = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (v && v.t && now - v.t < BLOG_TTL_MS) cleaned[k] = v;
    }
    return cleaned;
  } catch { return {}; }
}

function saveBlogCache(cache) {
  try { localStorage.setItem(BLOG_CACHE_KEY, JSON.stringify(cache)); } catch {}
}

const blogInflight = new Map();

export async function getBlogCount(query) {
  if (!query) return 0;
  const key = query.trim();
  const cache = loadBlogCache();
  if (cache[key] != null) return cache[key].n;

  if (blogInflight.has(key)) return blogInflight.get(key);

  const p = (async () => {
    const n = await naverBlogCount(key);
    const next = loadBlogCache();
    next[key] = { n, t: Date.now() };
    saveBlogCache(next);
    return n;
  })();
  blogInflight.set(key, p);
  try { return await p; } finally { blogInflight.delete(key); }
}

export async function getPlaceImage(placeName) {
  if (!placeName) return null;
  const key = placeName.trim();
  const cache = loadImgCache();
  if (cache[key]) return cache[key].url;

  if (inflight.has(key)) return inflight.get(key);

  const p = (async () => {
    const items = await naverImageSearch(key, 1);
    const url = items[0]?.link || null;
    // 캐시는 성공이든 실패든 저장 (반복 호출 방지)
    const next = loadImgCache();
    next[key] = { url, t: Date.now() };
    saveImgCache(next);
    return url;
  })();
  inflight.set(key, p);
  try { return await p; } finally { inflight.delete(key); }
}
