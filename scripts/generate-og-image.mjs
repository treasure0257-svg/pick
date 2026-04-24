// 카카오톡/Twitter/Open Graph 공유 미리보기용 이미지 생성.
// 1200×630 (표준 OG 비율). v2: 텍스트 중심 디자인 (라이트 bg + 큰 카피),
// 카드 형태로 잘 어울리는 깔끔한 톤.
// Run: node scripts/generate-og-image.mjs

import sharp from 'sharp';
import path from 'path';

const OUT = path.resolve('public/og-image.jpg');
const W = 1200, H = 630;

// SVG: 흰색 그라데이션 bg + 큰 따옴표 카피 + 정해줘 브랜드 + URL footer
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

  <!-- 좌측 컬러 액센트 바 (얇게) -->
  <rect x="0" y="0" width="14" height="100%" fill="url(#brand)"/>

  <g font-family="'Inter','Apple SD Gothic Neo','Malgun Gothic',sans-serif">
    <!-- 상단 카테고리 pill -->
    <rect x="80" y="100" rx="22" ry="22" width="280" height="44" fill="#FCE7F3" stroke="#F9A8D4" stroke-width="1"/>
    <text x="220" y="130" font-size="18" font-weight="600" fill="#9D174D" text-anchor="middle">바쁜 현대인을 위한 정보집합소</text>

    <!-- 메인 카피 (큰 따옴표 강조) -->
    <text x="80" y="280" font-size="100" font-weight="800" fill="#1A1C1E" letter-spacing="-3">"오늘 뭐하지?"</text>
    <text x="80" y="380" font-size="100" font-weight="800" fill="#1A1C1E" letter-spacing="-3">를 끝내는 곳.</text>

    <!-- 브랜드 -->
    <text x="80" y="475" font-size="40" font-weight="700" fill="url(#brand)" letter-spacing="-1">정해줘</text>
    <text x="200" y="475" font-size="22" font-weight="500" fill="#444749">전국 17개 시·도 · 맛집·카페·관광지·숙소</text>

    <!-- URL footer -->
    <text x="80" y="560" font-size="20" font-weight="500" fill="#82898B">pick-concierge.web.app</text>
  </g>
</svg>`;

await sharp(Buffer.from(svg))
  .jpeg({ quality: 92, progressive: true, mozjpeg: true, chromaSubsampling: '4:4:4' })
  .toFile(OUT);

console.log('Wrote og-image.jpg', W, 'x', H);
