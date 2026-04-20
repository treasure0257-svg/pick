// Wikipedia originalimage URLs → public/data/regions/{id}.jpg (1280px JPEG 리사이즈)
// Run: node scripts/download-region-photos.mjs
// 원본 URL은 /thumb/ 를 거치지 않아서 Wikimedia rate-limit 영향 없음.

import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

const UA = 'pick-concierge/1.0 (treasure0257-svg@github)';

const ORIGINALS = {
  seoul:     'https://upload.wikimedia.org/wikipedia/commons/b/ba/Seoul_Tower_%284394893276%29.jpg',
  gyeonggi:  'https://upload.wikimedia.org/wikipedia/commons/f/fb/Bifyu_8.jpg',
  incheon:   'https://upload.wikimedia.org/wikipedia/commons/0/0e/Incheon_Grand_Bridge.jpg',
  busan:     'https://upload.wikimedia.org/wikipedia/commons/a/a2/Haeundae_Beach_in_Busan.jpg',
  daegu:     'https://upload.wikimedia.org/wikipedia/commons/3/3c/%ED%8C%94%EA%B3%B5%EC%82%B0_%EA%B4%80%EB%B4%89_%EA%B2%BD%EC%B9%98%28%EA%B2%BD%EC%82%B0%EC%8B%9C_%EB%B0%A9%ED%96%A5%29.jpg',
  gwangju:   'https://upload.wikimedia.org/wikipedia/commons/9/97/Gwangju_Mudeungsan.jpg',
  daejeon:   'https://upload.wikimedia.org/wikipedia/commons/6/6c/Gate%2C_bridge%2C_and_tower_at_Daejeon_Expo_Science_Park.jpg',
  ulsan:     'https://upload.wikimedia.org/wikipedia/commons/7/74/KU-Dwa2.jpg',
  sejong:    'https://upload.wikimedia.org/wikipedia/commons/0/01/Sejong_Area_1.jpg',
  gangwon:   'https://upload.wikimedia.org/wikipedia/commons/3/32/Korea_Seoraksan.jpg',
  chungbuk:  'https://upload.wikimedia.org/wikipedia/commons/3/31/%EC%B2%AD%EB%82%A8%EB%8C%80_%EB%B3%B8%EA%B4%80_%282%29.JPG',
  chungnam:  'https://upload.wikimedia.org/wikipedia/commons/d/d0/Buyeo_198.JPG',
  jeonbuk:   'https://upload.wikimedia.org/wikipedia/commons/f/f2/%EC%A0%84%EC%A3%BC%ED%95%9C%EC%98%A5%EB%A7%88%EC%9D%84_%EC%A0%84%EA%B2%BD.JPG',
  jeonnam:   'https://upload.wikimedia.org/wikipedia/commons/3/35/20181231_Suncheon_Bay_002.jpg',
  gyeongbuk: 'https://upload.wikimedia.org/wikipedia/commons/e/eb/Lotus_Flower_Bridge_and_Seven_Treasure_Bridge_at_Bulguksa_in_Gyeongju%2C_Korea.jpg',
  gyeongnam: 'https://upload.wikimedia.org/wikipedia/commons/7/7f/Korea-Tongyeong-Collage-01.jpg',
  jeju:      'https://upload.wikimedia.org/wikipedia/commons/e/e3/%EC%84%B1%EC%82%B0%EC%9D%BC%EC%B6%9C%EB%B4%89_%EC%B2%9C%EC%97%B0%EB%B3%B4%ED%98%B8%EA%B5%AC%EC%97%AD_2019%EB%85%84_%EC%B4%AC%EC%98%81%28%EC%B6%9C%EC%B2%98_%EB%AC%B8%ED%99%94%EC%9E%AC%EC%B2%AD_%EB%8C%80%EB%B3%80%EC%9D%B8%EC%8B%A4%29.jpg'
};

const OUT_DIR = path.resolve('public/data/regions');
await fs.mkdir(OUT_DIR, { recursive: true });

async function fetchWithRetry(url, attempt = 1) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (res.ok) return res;
  if ((res.status === 429 || res.status >= 500) && attempt < 5) {
    const waitSec = Math.min(60, 5 * attempt * attempt);
    process.stdout.write(`(${res.status} retry in ${waitSec}s) `);
    await new Promise(r => setTimeout(r, waitSec * 1000));
    return fetchWithRetry(url, attempt + 1);
  }
  throw new Error('HTTP ' + res.status);
}

for (const [id, url] of Object.entries(ORIGINALS)) {
  const outPath = path.join(OUT_DIR, `${id}.jpg`);
  try {
    await fs.access(outPath);
    console.log(id + ' … already cached, skip');
    continue;
  } catch {}

  process.stdout.write(id + ' … ');
  try {
    const res = await fetchWithRetry(url);
    const buf = Buffer.from(await res.arrayBuffer());
    await sharp(buf)
      .resize({ width: 1280, withoutEnlargement: true })
      .jpeg({ quality: 82, progressive: true, mozjpeg: true })
      .toFile(outPath);
    const stat = await fs.stat(outPath);
    console.log(`ok ${Math.round(stat.size / 1024)} KB`);
  } catch (e) {
    console.log('FAIL', e.message);
  }
  // 3s space between requests (Wikimedia 권장)
  await new Promise(r => setTimeout(r, 3000));
}

console.log('\nDone. Files in public/data/regions/');
