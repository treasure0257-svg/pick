// 카카오톡/Twitter/Open Graph 공유 미리보기용 이미지 생성.
// 1200×630 (표준 OG 비율). v2: 텍스트 중심 디자인 (라이트 bg + 큰 카피),
// 카드 형태로 잘 어울리는 깔끔한 톤.
// Run: node scripts/generate-og-image.mjs

import sharp from 'sharp';
import path from 'path';

const OUT = path.resolve('public/og-image.jpg');
const LOGO = path.resolve('public/logo.png');
const W = 1200, H = 630;

// SVG: 좌측 텍스트 카피 + 우측 큰 로고 (경복궁 hero 제거, 로고 강조)
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="#FFFFFF"/>
      <stop offset="100%" stop-color="#F4F1EC"/>
    </linearGradient>
    <linearGradient id="brand" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%"   stop-color="#FBBF77"/>
      <stop offset="50%"  stop-color="#EC4899"/>
      <stop offset="100%" stop-color="#7C3AED"/>
    </linearGradient>
  </defs>

  <!-- 배경 -->
  <rect width="100%" height="100%" fill="url(#bg)"/>

  <!-- 좌측 컬러 액센트 바 -->
  <rect x="0" y="0" width="14" height="100%" fill="url(#brand)"/>

  <g font-family="'Inter','Apple SD Gothic Neo','Malgun Gothic',sans-serif">
    <!-- 상단 카테고리 pill -->
    <rect x="80" y="90" rx="22" ry="22" width="280" height="44" fill="#FCE7F3" stroke="#F9A8D4" stroke-width="1"/>
    <text x="220" y="120" font-size="18" font-weight="600" fill="#9D174D" text-anchor="middle">바쁜 현대인을 위한 정보집합소</text>

    <!-- 메인 카피 (큰 따옴표 강조) — 좌측 정렬, 로고와 균형 위해 폭 720 정도까지만 사용 -->
    <text x="80" y="265" font-size="92" font-weight="800" fill="#1A1C1E" letter-spacing="-3">"오늘 뭐하지?"</text>
    <text x="80" y="360" font-size="92" font-weight="800" fill="#1A1C1E" letter-spacing="-3">를 끝내는 곳.</text>

    <!-- 브랜드 -->
    <text x="80" y="455" font-size="38" font-weight="700" fill="url(#brand)" letter-spacing="-1">정해줘</text>
    <text x="190" y="455" font-size="20" font-weight="500" fill="#444749">전국 17개 시·도 · 맛집·카페·관광지·숙소</text>

    <!-- URL footer -->
    <text x="80" y="555" font-size="20" font-weight="500" fill="#82898B">pick-concierge.web.app</text>
  </g>
</svg>`;

// 1) SVG 카드 → buffer
const card = await sharp(Buffer.from(svg))
  .png()
  .toBuffer();

// 2) 로고 — 큰 사이즈로 우측에 배치 (320x320, 약간 그림자 포함)
const logo = await sharp(LOGO)
  .resize(320, 320, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toBuffer();

// 3) 합성: 카드 위에 로고 우측 중앙 (top: (H-320)/2 = 155, left: W - 320 - 80 = 800)
await sharp(card)
  .composite([{ input: logo, top: 155, left: 800 }])
  .jpeg({ quality: 92, progressive: true, mozjpeg: true, chromaSubsampling: '4:4:4' })
  .toFile(OUT);

console.log('Wrote og-image.jpg', W, 'x', H);
