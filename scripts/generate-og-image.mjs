// 카카오톡/Twitter/Open Graph 공유 미리보기용 이미지 생성.
// 1200×630 (표준 OG 비율), 경복궁 한옥 배경 + 어두운 오버레이 + 브랜드 텍스트.
// Run: node scripts/generate-og-image.mjs

import sharp from 'sharp';
import path from 'path';

const HERO = path.resolve('public/hero-hanok.jpg');
const LOGO = path.resolve('public/logo.png');
const OUT = path.resolve('public/og-image.jpg');

const W = 1200, H = 630;

// Base: 경복궁 hero 로 덮고 어둡게 처리
const base = await sharp(HERO)
  .resize({ width: W, height: H, fit: 'cover', position: 'center' })
  .modulate({ brightness: 0.55 })
  .toBuffer();

// Text overlay SVG — 정해줘 + 태그라인
const overlay = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="rgba(0,0,0,0.20)"/>
      <stop offset="1" stop-color="rgba(0,0,0,0.55)"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)"/>

  <g font-family="'Helvetica Neue','Apple SD Gothic Neo','Malgun Gothic',sans-serif" fill="#FFFFFF">
    <!-- Pill tagline -->
    <rect x="80" y="200" rx="26" ry="26" width="340" height="52" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.35)" stroke-width="1"/>
    <text x="106" y="234" font-size="22" font-weight="500" fill="#FFFFFF">바쁜 현대인을 위한 정보집합소</text>

    <!-- 정해줘 big title -->
    <text x="80" y="370" font-size="120" font-weight="800" letter-spacing="-2">정해줘</text>
    <text x="80" y="440" font-size="42" font-weight="600" fill="rgba(255,255,255,0.92)">어디로 갈까요? 하루가 결정됩니다.</text>

    <!-- URL footer -->
    <text x="80" y="560" font-size="22" font-weight="500" fill="rgba(255,255,255,0.75)">pick-concierge.web.app</text>
  </g>
</svg>`;

// Compose: base + text overlay (로고 배지는 '정해줘' 큰 타이틀과 중복 + 비대칭 인상 → 제거)
await sharp(base)
  .composite([
    { input: Buffer.from(overlay), top: 0, left: 0 }
  ])
  .jpeg({ quality: 86, progressive: true, mozjpeg: true })
  .toFile(OUT);

console.log('Wrote og-image.jpg', W, 'x', H);
