// Wikipedia page summary → originalimage → 640×400 JPEG (sharp) → public/data/featured/{regionId}_{i}.jpg
// Run: node scripts/download-featured-photos.mjs
// 없으면 sharp 가 설치돼 있어야 함. 실패한 항목은 graceful 하게 스킵 (RegionView 가 onError 로 fallback 배경 처리).

import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

const UA = 'pick-concierge/1.0 (treasure0257-svg@github)';

// src/regions.js 의 FEATURED_ATTRACTIONS 를 여기서 미러링 (스크립트 독립성 위해).
const FEATURED = {
  seoul:     ['경복궁', 'N서울타워', '동대문디자인플라자', '창덕궁', '한강공원 여의도지구'],
  gyeonggi:  ['수원화성', '에버랜드', '한국민속촌', '남이섬', '두물머리'],
  incheon:   ['송도 센트럴파크', '월미도', '강화 전등사', '차이나타운', '을왕리해수욕장'],
  busan:     ['해운대해수욕장', '광안리해수욕장', '감천문화마을', '태종대', '자갈치시장'],
  daegu:     ['팔공산 케이블카', '수성못', '동성로', '서문시장', '앞산전망대'],
  gwangju:   ['무등산 국립공원', '국립아시아문화전당', '양림동 역사문화마을', '1913송정역시장', '광주 대인예술시장'],
  daejeon:   ['엑스포과학공원', '유성온천', '대전 오월드', '계족산 황톳길', '성심당 본점'],
  ulsan:     ['태화강 국가정원', '대왕암공원', '간절곶', '반구대 암각화', '장생포 고래문화마을'],
  sejong:    ['세종호수공원', '국립세종수목원', '베어트리파크', '세종중앙공원', '전월산'],
  gangwon:   ['설악산 국립공원', '경포대', '남이섬', '속초 중앙시장', '양양 낙산사'],
  chungbuk:  ['단양 도담삼봉', '청남대', '법주사', '수안보온천', '청주 상당산성'],
  chungnam:  ['공주 공산성', '부여 부소산성', '태안 꽃지해수욕장', '독립기념관', '보령 대천해수욕장'],
  jeonbuk:   ['전주 한옥마을', '군산 경암동 철길마을', '남원 광한루원', '고창 선운산', '무주 덕유산'],
  jeonnam:   ['순천만 국가정원', '여수 돌산대교', '담양 죽녹원', '목포 유달산', '완도 청산도'],
  gyeongbuk: ['경주 불국사', '안동 하회마을', '포항 호미곶', '영주 부석사', '청송 주왕산'],
  gyeongnam: ['통영 동피랑벽화마을', '거제 외도보타니아', '진주성', '남해 독일마을', '하동 쌍계사'],
  jeju:      ['성산일출봉', '한라산 국립공원', '우도', '천지연폭포', '협재해수욕장']
};

const OUT_DIR = path.resolve('public/data/featured');
await fs.mkdir(OUT_DIR, { recursive: true });

async function getImageUrl(title) {
  // ko.wikipedia 우선, 실패 시 en.wikipedia
  for (const lang of ['ko', 'en']) {
    const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/` + encodeURIComponent(title);
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA } });
      if (!r.ok) continue;
      const j = await r.json();
      const src = j?.originalimage?.source || j?.thumbnail?.source;
      if (src) return src;
    } catch {}
  }
  return null;
}

async function fetchWithRetry(url, attempt = 1) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (res.ok) return res;
  if ((res.status === 429 || res.status >= 500) && attempt < 5) {
    const waitSec = Math.min(40, 5 * attempt * attempt);
    process.stdout.write(`(${res.status} retry in ${waitSec}s) `);
    await new Promise(r => setTimeout(r, waitSec * 1000));
    return fetchWithRetry(url, attempt + 1);
  }
  throw new Error('HTTP ' + res.status);
}

let ok = 0, fail = 0, cached = 0;

for (const [regionId, names] of Object.entries(FEATURED)) {
  for (let i = 0; i < names.length; i++) {
    const slug = `${regionId}_${i}`;
    const outPath = path.join(OUT_DIR, `${slug}.jpg`);
    try { await fs.access(outPath); cached++; continue; } catch {}

    const name = names[i];
    process.stdout.write(`${slug} (${name}) … `);
    try {
      // Try several title variants
      const candidates = [
        name,
        name.replace(/\s/g, ''),
        name.split(' ').slice(-1)[0] // last token (e.g. "한라산 국립공원" → "국립공원")
      ].filter((v, idx, a) => a.indexOf(v) === idx);

      let imgUrl = null;
      for (const c of candidates) {
        imgUrl = await getImageUrl(c);
        if (imgUrl) break;
        await new Promise(r => setTimeout(r, 200));
      }
      if (!imgUrl) { console.log('no wiki page'); fail++; continue; }

      const res = await fetchWithRetry(imgUrl);
      const buf = Buffer.from(await res.arrayBuffer());
      await sharp(buf)
        .resize({ width: 640, height: 400, fit: 'cover', position: 'center' })
        .jpeg({ quality: 80, progressive: true, mozjpeg: true })
        .toFile(outPath);
      const stat = await fs.stat(outPath);
      console.log(`ok ${Math.round(stat.size / 1024)} KB`);
      ok++;
    } catch (e) {
      console.log('FAIL', e.message);
      fail++;
    }
    await new Promise(r => setTimeout(r, 2500));
  }
}

console.log(`\nDone. ok=${ok} cached=${cached} fail=${fail}`);
