# 정해줘 (Pick) · PRD

> Product Requirements Document  ·  v0.3.8 (2026-04-20)

## 1. 제품 개요

### 1.1 한 줄 설명
바쁜 현대인을 위한 정보집합소. 지역·키워드·취향으로 오늘 어디로 갈지 정해주는 웹앱.

### 1.2 문제 정의
한국 직장인이 주말·여가 계획에 들이는 시간은 평균 2.4시간. 정보는 넘치는데 선택은 어렵다. 취향에 맞는 곳을 찾아 헤매다 결국 "그냥 집에 있기"로 끝나는 경우가 많다.

### 1.3 핵심 가치 제안
- 첫 화면에서 **지역 선택 또는 키워드 검색**으로 즉시 장소를 좁힌다.
- 더 좁히고 싶으면 **취향 설정**으로 카테고리·무드·예산·기간·음주를 반영한 랭킹을 받는다.
- 로그인 없이도 체험 가능, 로그인 시 Firestore로 기기 간 동기화.

## 2. 타깃 사용자

| 세그먼트 | 특징 | 주된 맥락 |
|---|---|---|
| 주말 고민러 | 20–35세 직장인, 데이트/친구 약속 잡기 어려워함 | 금요일 저녁, 이번 주말 뭐할지 |
| 여행 계획러 | 국내 당일치기~1박 선호 | 출발 하루 전 즉흥 |
| 혼자 보내는 사람 | 혼영/혼밥/산책 | 카페·공원 위주 |

## 3. 사용자 흐름

SPA 구조 (hash 라우팅).

### 3.1 지역 기반 탐색 (기본 진입)
```
#/  (HomeView)
  · 한옥 hero + 검색창: 지역·장소·무드·카테고리 전체 매칭
  · 17개 시·도 타일 grid
  ↓ 타일 클릭
#/region?id=<id>  (RegionView)
  · 해당 시·도 히어로 + 세부 권역 grid + 정적 thematic 지도 (구별 라벨·호버 연동)
  ↓ 세부 권역 클릭
#/results?region=<id>&area=<sub>  (ResultsView)
  · 카테고리 탭(전체/맛집/카페/즐길거리) + 건수 배지
  · 왼쪽: 장소 카드(번호·거리·주소·전화) / 오른쪽: Kakao 지도 카테고리별 색상 핀
  · 카드 호버 ↔ 지도 핀 강조·팬
  · 하단 "하루 코스 추천" 배너(맛집→카페→즐길거리 셔플)
  ↓ 카드 클릭
#/place?id=<id>&from=<region:X[:Y]>  (PlaceDetailView)
  · 히어로 + 주소·전화·Kakao CTA + 해당 장소 단일 지도
  · "이 근처 가볼만한 곳" (반경 1.5km, 카테고리별 fetch 병합)
```

### 3.2 취향 기반 추천 (심화)
```
#/  (HomeView 하단 CTA)
  ↓ [취향 설정 시작]
#/preferences  (PreferencesView)
  ↓ 카테고리 · 무드 · 예산 · 기간 · 음주 선택
#/results?source=preferences  (ResultsView)
  ↓ scorePlace() 랭킹 / 저장
```

### 3.3 로그인
헤더 우측 **로그인** 버튼 → `#/login` 라우트 → Google / Kakao / Naver 중 선택. Google은 Firebase Auth 팝업 + Firestore `users/{uid}` 문서에 merge 저장으로 기기 간 동기화. Kakao/Naver는 JS SDK로 로그인 후 localStorage에만 저장 (커스텀 토큰 경유 Firestore 통합은 v2.0 예정).

## 4. 기능 명세

### 4.1 v0.3 (현재, 2026-04-20)
- [x] 홈 리디자인: 한옥 풀블리드 히어로(경복궁 전경) + 중앙 검색창(지역·장소·키워드 복합) + Leaflet 한국 지도(17개 시·도 핀) + 17개 시·도 region grid(Wikipedia Commons 랜드마크 사진) + 취향 CTA
- [x] 지역 drill-down — `#/region?id=<id>` 세부 권역 grid + 해당 시·도 행정구역 정적 thematic 지도 (Leaflet + TopoJSON), tile ↔ polygon 양방향 호버
- [x] 지역 기반 결과 — `#/results?region=<id>` 또는 `?region=<id>&area=<sub>` 진입 시 Kakao Local API 실시간 검색 (맛집·카페 + 즐길거리 8종 키워드(관광/명소/박물관/미술관/공원/전시관/랜드마크/가볼만한곳) 병렬 호출, 최대 80곳 중복 제거)
- [x] 결과 UX — 카테고리 탭(전체/맛집/카페/즐길거리) 건수 배지, 2-컬럼 목록+지도, 카드 호버 ↔ 지도 핀 연동, geolocation 기반 "나로부터 N km" 거리, 도로명+지번 주소
- [x] 맛집 서브 분류 — Kakao `category_name` 2번째 세그먼트 파싱(한식/고기·구이/일식·회/중식/양식/아시안/치킨·분식/술집/기타), 결과에 없는 서브는 자동 숨김
- [x] 하루 코스 추천 — 맛집→카페→즐길거리 순 1곳씩 셔플 카드
- [x] 장소 상세 — `#/place?id=<id>` 히어로·액션·지도·카카오 CTA·"이 근처 가볼만한 곳"(반경 1.5km Kakao categorySearch 병합)
- [x] 검색 드롭다운 — 입력 시 region/place 매칭 미리보기
- [x] 토너먼트 모드 제거 (Header·BottomNav 라우트 모두 정리)
- [x] `src/regions.js` — 17개 시·도 메타 + 주소 prefix → region id 매핑 + 카운트 헬퍼
- [x] PreferencesView — 카테고리/무드/예산/기간/음주 입력
- [x] ResultsView — region/category/place/preferences 4개 소스 분기 지원
- [x] SavedView — 저장된 장소 목록
- [x] LoginView — 3-way OAuth (Google / Kakao / Naver) on `#/login`
- [x] Google 로그인 via Firebase Auth
- [x] Kakao 로그인 via Kakao JS SDK v1 (팝업 플로우)
- [x] Naver 로그인 UI (Client ID 미등록 — 클릭 시 명시적 안내, 등록되면 즉시 활성)
- [x] Firestore 동기화 — Google 로그인 시 preferences·saved가 클라우드에 merge 저장
- [x] PWA 기반 — manifest + network-first 서비스워커 (v2)
- [x] GitHub Actions CI/CD — `npm ci` → `vite build` → Firebase Hosting 배포
- [x] `.env` 기반 Firebase/Kakao/Naver 설정 주입 (빌드 타임, 로컬/CI 모두)

### 4.2 v1.0 (목표)
- [ ] 장소 데이터 API 연동 (Google Places / 카카오 로컬 / 네이버 지역 등)
- [ ] 실제 도메인 연결 (예: `pick.neotis.co.kr`)
- [ ] Firebase App Check 활성화로 API 키 남용 방지
- [ ] Firestore 보안 규칙 작성 (현재 기본 규칙: 인증된 사용자 자기 문서만)
- [ ] SavedView에서 실제 저장된 장소의 카드·지도 렌더링
- [ ] 추천 랭킹 알고리즘 세부 튜닝

### 4.3 v2.0 (아이디어)
- [ ] Kakao/Naver → Firebase 커스텀 토큰 통합 (Cloud Functions 경유, Firestore 동기화 연계)
- [ ] 친구와 함께 결정 — 공동 세션 (Firestore 실시간 동기화)
- [ ] 방문 후기 · 평점 투고
- [ ] 알림: 금요일 자동 추천 푸시 (서비스워커 + FCM)
- [ ] 날씨·계절 반영 동적 추천
- [ ] 접근성 WCAG AA 전체 준수

## 5. 기술 요건

### 5.1 호스팅
- Firebase Hosting (Spark 무료 플랜 유지가 비용 목표)
- 커스텀 도메인: v1.0에서 연결

### 5.2 인증
- **Firebase Auth (Google)**: Authorized domains에 `localhost`, `pick-concierge.firebaseapp.com`, `pick-concierge.web.app` 등록. 로그인 시 Firestore 동기화까지 연계
- **Kakao JS SDK**: JavaScript 키 기반 팝업 로그인, 프로필 정보를 localStorage에 저장. 이메일 스코프는 비즈 앱 검수 필요해서 제외
- **Naver ID Login SDK**: Client ID 기반 리다이렉트 로그인(URL hash access_token으로 복귀). 현재 Client ID 미등록 — 버튼만 보이고 클릭 시 안내
- Kakao/Naver → Firebase 통합(Custom Token 발급)은 v2.0 Cloud Functions로 처리 예정

### 5.3 데이터
- **장소 (동적)**: Kakao Local API 실시간 검색 — 지역·세부 권역 레이블 × {맛집, 카페, 명소} 키워드 조합 병렬 호출, place_url/lat/lng/category 사용
- **장소 (샘플)**: `src/data.js`의 `PICK_DATA.places` 하드코딩 — preferences 기반 추천 플로우 및 fallback에 사용
- **행정구역 경계**: `public/data/korea-municipalities.topo.json` (southkorea/southkorea-maps 2018 simple, 553KB) — RegionMap에서 TopoJSON → GeoJSON 변환해 polygon 렌더
- **사용자 데이터**: Firestore `users/{uid}` 문서에 `{ preferences, saved }` 저장. 로컬은 `localStorage` 키 `pick.preferences` / `pick.saved`
- v1.0: Kakao 외 장소 소스 추가, App Check 필수

### 5.4 빌드·배포
- 빌드: `vite build` → `dist/` 산출 (현재 JS ~389KB / CSS ~24KB, gzip 기준 ~119KB / 5KB)
- 배포: main 푸시 시 GitHub Actions가 빌드 + Firebase Hosting 업로드
- 필요한 GitHub Secrets: `FIREBASE_SERVICE_ACCOUNT_PICK_CONCIERGE` + `VITE_FIREBASE_*` 6개 + `VITE_KAKAO_JS_KEY` + `VITE_NAVER_CLIENT_ID` = 총 9개

### 5.5 성능 목표
- LCP < 2.5s (모바일 3G 기준)
- JS 번들 < 400KB (현재 Firebase SDK 포함 383KB — v1.0에서 코드 스플리팅 검토)

## 6. 비기능 요건

- **접근성**: WCAG AA 지향 (부분 준수)
- **브라우저**: 최신 Chrome / Safari / Edge / Samsung Internet
- **언어**: 한국어 only (MVP)
- **반응형**: 모바일 우선, 태블릿/데스크톱 대응
- **오프라인**: 서비스워커 등록됨 (`public/sw.js`). 캐시 전략은 v1.0에서 확정

## 7. 지표 (v1.0 시점)

- **활성 사용자**: 주간 활성 사용자 (WAU)
- **결정 완료율**: 추천 페이지 진입 대비 "저장" 또는 "지도 열기" 전환율
- **지역 탐색 깊이**: 홈 진입 대비 지역 타일 클릭 비율
- **로그인 전환율**: 비로그인 사용자 중 Google 로그인 완료 비율
- **Firestore 쓰기 빈도**: 사용자당 일일 쓰기 수 (비용 모니터링)

## 8. 리스크 및 오픈 이슈

- **Firebase 키 노출**: `VITE_*` 프리픽스로 번들에 인라인됨(설계상). Authorized domains + App Check로 완화 필요
- **데이터 품질**: 샘플 데이터로는 신뢰도 제한적, 실 데이터로 조기 전환 필요
- **번들 크기**: Firebase SDK 전체 임포트로 JS 383KB. v1.0에서 동적 임포트·트리쉐이킹 최적화
- **Firestore 비용**: 로그인 사용자 증가 시 읽기·쓰기 비용 폭증 위험. 캐시·debounce 필요
- **서비스워커**: 등록만 하고 캐시 전략 미정. 잘못 설계 시 업데이트 반영 지연 발생 가능

## 9. 변경 이력

| 날짜 | 버전 | 변경 |
|---|---|---|
| 2026-04-20 | v0.3.8 | 관광 명소 선택지 확장 — `SEARCH_KEYWORDS` 맵 도입, 즐길거리 키워드 `명소` 1개 → 8개(관광/명소/박물관/미술관/공원/전시관/랜드마크/가볼만한곳). Kakao keywordSearch size 10 → 15(최대치), 결과 cap 30 → 80. 세부 지역당 호출 수 6 → 20, 예상 결과 3-5배 증가 |
| 2026-04-20 | v0.3.7 | 지역 히어로 이미지 자체 호스팅으로 전환 — 기존 Wikimedia /thumb/ 330px 썸네일은 확대 시 픽셀화, 고해상도 버전은 429 rate limit. `scripts/download-region-photos.mjs` 로 원본(6000px급) 받아 sharp 1280px JPEG(quality 82, mozjpeg)로 리사이즈해 `public/data/regions/{id}.jpg` 에 보관, Firebase Hosting CDN 서빙. 이미지 총 ~3MB, lazy-load |
| 2026-04-20 | v0.3.6 | 맛집 서브 탭(요리 유형별) 추가 — Kakao `category_name` 2번째 세그먼트로 한식/고기·구이/일식·회/중식/양식/아시안/치킨·분식/술집 자동 분류, 맛집 메인탭 활성 시만 빨간 톤 2번째 row 노출. 시·도/세부 지역 타일의 정적 샘플 기준 count·"준비 중" 표시 제거 — 모든 타일 항상 클릭 가능, 실제 Kakao 실시간 검색이 전국 커버 |
| 2026-04-20 | v0.3.5 | 결과 화면 UX 전면 강화: 카테고리 탭(전체/맛집/카페/즐길거리 건수 배지, 목록+지도 동시 필터링), 2-컬럼 sticky 지도(카테고리별 색상 핀, 카드 호버 연동), 카드 정보 확장(도로명+지번·거리·카테고리 풀패스). "하루 코스 추천" 배너(맛집→카페→즐길거리 셔플). 장소 상세 뷰(`#/place?id=`) 신설 — 히어로·지도·카카오 CTA·주변 1.5km fetchers. `src/components/PlacesMap.js`, `src/views/PlaceDetailView.js`, `src/utils/place-ui.js` 분리 |
| 2026-04-20 | v0.3.4 | **Kakao Local API 실시간 연동** — OPEN_MAP_AND_LOCAL 서비스 활성화 후 `src/services/kakaoLocal.js` 신설(Kakao Maps services SDK 동적 로드 + keywordSearch). ResultsView가 region/area 진입 시 "맛집·카페·명소" 키워드 병렬 검색해 실제 장소 카드 렌더. 홈 지도 제거하고 RegionView에 정적 thematic 지도(행정구역 경계·구별 라벨·양방향 호버) 적용, TopoJSON(`public/data/korea-municipalities.topo.json`) + `topojson-client` 사용 |
| 2026-04-20 | v0.3.3 | 지역 drill-down 도입 — RegionView + `#/region?id=<id>` 라우트, regions.js에 subregions[] (Seoul 8개 실데이터 매칭 + 기타 시·도 3-8개 stub), ResultsView `?area=` 필터. 홈에 Leaflet 한국 지도(17개 시·도 핀) 추가 — 처음엔 Kakao Maps로 시도했으나 앱 OPEN_MAP_AND_LOCAL 미활성으로 Leaflet+OSM으로 교체, 한국어 라벨을 위해 CartoDB nolabels 베이스 + OSM 오버레이 2-layer 구성 |
| 2026-04-20 | v0.3.2 | 홈 hero에 한옥 풀블리드 배경(`public/hero-hanok.jpg` 경복궁 전경, Wikipedia Commons 1280×853) 적용 — 여기어때 레퍼런스 기반. 어두운 그라데이션 오버레이 + 흰 텍스트. 로그인 화면 카피 업데이트("간편하게 시작하세요" + 2줄 서브카피). 카카오 버튼에 KakaoTalk 브랜드 SVG 아이콘(`public/kakao-icon.svg`) 적용 |
| 2026-04-20 | v0.3.1 | 브랜드명 "The Concierge" → "정해줘". 로고 이미지(`public/logo.png`, 퍼플 심플) 도입 — Header/LoginView/favicon/PWA manifest 전면 교체. manifest 테마컬러 #436B53 → #7C3AED(퍼플). H1 "어디로 갈까요?"로 단축, 서브카피 "당신의 소중한 하루가 결정됩니다"로 교체 |
| 2026-04-20 | v0.3 | 홈 리디자인: 지역 검색창 + 17개 시·도 grid 중심. 토너먼트 모드 제거. ResultsView에 region 필터 추가, regions.js 헬퍼 신설. 타일은 Wikipedia Commons 랜드마크 썸네일(scripts/fetch-region-photos.mjs로 갱신). Kakao SDK를 v2.7→v1으로 다운그레이드(Auth.login 팝업 복구) |
| 2026-04-20 | v0.2.1 | 서비스워커 network-first로 교체(cache-first 버그 수정). Kakao/Naver 로그인 재복구(LoginView + `#/login` 라우트, SDK on-demand 로드). GitHub Secrets 9개로 확장 |
| 2026-04-20 | v0.2 | Vite + Firestore SPA로 아키텍처 전환. Google 단일 provider로 일시 축소. PWA 기반 추가. GitHub Actions에 빌드 스텝 추가 |
| 2026-04-20 | v0.1 | 초기 문서, 바닐라 HTML + Tailwind CDN MVP 완성, Firebase Hosting 배포 파이프라인 구축 |
