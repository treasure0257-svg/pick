// One-shot utility: 한국 17개 시·도 대표 랜드마크의 Wikipedia 썸네일 URL을 조회.
// Run: node scripts/fetch-region-photos.mjs
// Output: JSON mapping region-id → image URL (to paste into src/regions.js)

const TARGETS = [
  ['seoul',     'N서울타워'],
  ['gyeonggi',  '수원화성'],
  ['incheon',   '인천대교'],
  ['busan',     '해운대해수욕장'],
  ['daegu',     '팔공산'],
  ['gwangju',   '무등산'],
  ['daejeon',   '한빛탑'],
  ['ulsan',     '대왕암공원'],
  ['sejong',    '정부세종청사'],
  ['gangwon',   '설악산'],
  ['chungbuk',  '청남대'],
  ['chungnam',  '부소산성'],
  ['jeonbuk',   '전주한옥마을'],
  ['jeonnam',   '순천만'],
  ['gyeongbuk', '불국사'],
  ['gyeongnam', '통영시'],
  ['jeju',      '성산일출봉']
];

const results = {};

for (const [id, page] of TARGETS) {
  const url = `https://ko.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(page)}`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'pick-concierge/1.0 (treasure0257-svg)' } });
    if (!res.ok) { results[id] = { page, err: `HTTP ${res.status}` }; continue; }
    const json = await res.json();
    const thumb = json?.thumbnail?.source || json?.originalimage?.source || null;
    results[id] = { page, url: thumb };
  } catch (e) {
    results[id] = { page, err: e.message };
  }
}

console.log(JSON.stringify(results, null, 2));
