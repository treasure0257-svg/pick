// 대표 명소 중 Wikipedia 다운로드에 실패한 슬롯을
// Korean-themed Unsplash CDN 직접 URL 로 채운다. (photo-id 는 data.js 에서 이미 검증된 것들)
// 실제 해당 장소 사진은 아니지만 관련 톤의 이미지로 UX 빈자리 메움.
// Run: node scripts/fill-missing-featured.mjs

import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

const UA = 'pick-concierge/1.0 (treasure0257-svg@github)';

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

// 검증된 Unsplash photo id 풀 (data.js 및 과거 사용 이력)
const POOL = {
  beach:    ['photo-1502680390469-be75c86b636f', 'photo-1566633806327-68e152aaf26d'],
  mountain: ['photo-1464822759023-fed622ff2c3b', 'photo-1507525428034-b723cf961d3e', 'photo-1488841714725-bb4c32d1ac94'],
  hanok:    ['photo-1538485399081-7c8ed7ac21a4', 'photo-1590846406792-0adc7f938f1d'],
  park:     ['photo-1464822759023-fed622ff2c3b', 'photo-1566633806327-68e152aaf26d'],
  market:   ['photo-1534080564583-6be75777b70a', 'photo-1514933651103-005eec06c04b'],
  museum:   ['photo-1545987796-200677ee1011', 'photo-1521587760476-6c12a4b040da'],
  temple:   ['photo-1590846406792-0adc7f938f1d', 'photo-1545987796-200677ee1011'],
  bridge:   ['photo-1508189860359-77090d22c2ac', 'photo-1566633806327-68e152aaf26d'],
  cafe:     ['photo-1507133750040-4a8f57021571', 'photo-1534080564583-6be75777b70a'],
  city:     ['photo-1538485399081-7c8ed7ac21a4', 'photo-1470337458703-46ad1756a187'],
  spring:   ['photo-1464822759023-fed622ff2c3b'],
  default:  ['photo-1464822759023-fed622ff2c3b', 'photo-1507525428034-b723cf961d3e']
};

function categoryOf(name) {
  if (/해수욕장|해변|바다|해안|포구|등대|섬|일출봉|동피랑/.test(name)) return 'beach';
  if (/산|국립공원|봉|고개|둘레길|황톳길/.test(name)) return 'mountain';
  if (/궁|한옥|궁궐|창덕궁|경복궁/.test(name)) return 'hanok';
  if (/사(寺)?$|사찰|절|낙산사|법주사|쌍계사|부석사|전등사/.test(name)) return 'temple';
  if (/공원|숲|수목원|정원/.test(name)) return 'park';
  if (/시장/.test(name)) return 'market';
  if (/박물관|미술관|전시관|문화전당|문화마을|과학공원|월드/.test(name)) return 'museum';
  if (/대교|철길/.test(name)) return 'bridge';
  if (/온천/.test(name)) return 'spring';
  if (/거리|동(洞)?$|성심당|음식/.test(name)) return 'cafe';
  if (/타워|전망대|광장|성|성곽/.test(name)) return 'city';
  return 'default';
}

const OUT_DIR = path.resolve('public/data/featured');
await fs.mkdir(OUT_DIR, { recursive: true });

async function fetchBuf(url, attempt = 1) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (res.ok) return Buffer.from(await res.arrayBuffer());
  if ((res.status === 429 || res.status >= 500) && attempt < 3) {
    await new Promise(r => setTimeout(r, 3000 * attempt));
    return fetchBuf(url, attempt + 1);
  }
  throw new Error('HTTP ' + res.status);
}

let ok = 0, skip = 0, fail = 0;
let poolIdx = {};

for (const [regionId, names] of Object.entries(FEATURED)) {
  for (let i = 0; i < names.length; i++) {
    const slug = `${regionId}_${i}`;
    const outPath = path.join(OUT_DIR, `${slug}.jpg`);
    try { await fs.access(outPath); skip++; continue; } catch {}

    const name = names[i];
    const cat = categoryOf(name);
    poolIdx[cat] = ((poolIdx[cat] || 0) + 1) % POOL[cat].length;
    const photoId = POOL[cat][poolIdx[cat]];
    const url = `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=960&q=75`;

    process.stdout.write(`${slug} (${name}, ${cat}) … `);
    try {
      const buf = await fetchBuf(url);
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
    await new Promise(r => setTimeout(r, 200));
  }
}

console.log(`\nDone. ok=${ok} skip=${skip} fail=${fail}`);
