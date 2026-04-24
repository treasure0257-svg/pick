# 정해줘 (Pick) · PRD

> Product Requirements Document  ·  v0.5.0 (2026-04-24)

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
- [x] 지역 drill-down — `#/region?id=<id>` 세부 권역 grid + 해당 시·도 행정구역 지도 (Kakao Map 실타일 + TopoJSON polygon overlay, v0.3.13에서 Leaflet → Kakao 전환), tile ↔ polygon 양방향 호버
- [x] 지역 기반 결과 — `#/results?region=<id>` 또는 `?region=<id>&area=<sub>` 진입 시 Kakao Local API 실시간 검색 (맛집·카페 + 즐길거리 8종 키워드(관광/명소/박물관/미술관/공원/전시관/랜드마크/가볼만한곳) 병렬 호출, 최대 80곳 중복 제거)
- [x] 결과 UX — 카테고리 탭(전체/맛집/카페/즐길거리/숙소) 건수 배지, 2-컬럼 목록+지도, 카드 호버 ↔ 지도 핀 연동, geolocation 기반 "나로부터 N km" 거리, 도로명+지번 주소
- [x] 대표 명소 큐레이션 — RegionView 상단 "✨ 이 지역 대표 명소" 가로 스크롤 (17×5=85개 큐레이션, Kakao 실시간 매칭, 38개는 Wikipedia 실제 사진 + 47개는 Unsplash 카테고리 매칭 폴백, 모두 640×400 자체 호스팅)
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
- **장소 사진 보강**: Naver Image Search API — Cloudflare Worker 프록시(`VITE_NAVER_PROXY_URL`)로 CORS 우회 후 localStorage 24h 캐시. 대표 명소·결과 카드 썸네일에 적용
- **장소 (샘플)**: `src/data.js`의 `PICK_DATA.places` 하드코딩 — preferences 기반 추천 플로우 및 fallback에 사용
- **행정구역 경계**: `public/data/korea-municipalities.topo.json` (southkorea/southkorea-maps 2018 simple, 553KB) — RegionMap에서 TopoJSON → GeoJSON 변환해 polygon 렌더
- **사용자 데이터**: Firestore `users/{uid}` 문서에 `{ preferences, saved }` 저장. 로컬은 `localStorage` 키 `pick.preferences` / `pick.saved`
- v1.0: Kakao 외 장소 소스 추가, App Check 필수

### 5.4 빌드·배포
- 빌드: `vite build` → `dist/` 산출 (현재 JS ~389KB / CSS ~24KB, gzip 기준 ~119KB / 5KB)
- 배포: main 푸시 시 GitHub Actions가 빌드 + Firebase Hosting 업로드
- 필요한 GitHub Secrets: `FIREBASE_SERVICE_ACCOUNT_PICK_CONCIERGE` + `VITE_FIREBASE_*` 6개 + `VITE_KAKAO_JS_KEY` + `VITE_NAVER_CLIENT_ID` + `VITE_NAVER_PROXY_URL` = 총 10개

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
| 2026-04-24 | v0.5.0 | **종합 리뷰 기반 22개 항목 전수 적용 — Batch 1-3.** **Batch 1**: `src/utils/share.js` 신설 — `SITE_ORIGIN` 상수, `sharePlace()` (Web Share API + 클립보드 폴백), `mapLinks()` (카카오맵/네이버지도/구글맵 deep-link 생성기). 카드·상세뷰 모두 공유 chip + 길찾기 3-grid 박스. `App.js` 에 `STORAGE_KEYS.visited` / `.recentRegions` + 관련 헬퍼. ResultsView 카드에 방문함 toggle + 정렬 selector(관련도/거리/블로그 후기수). SavedView 방문 배지 + 토글, MyPage 활동 통계에 '방문 완료' 카드. **Batch 2**: 홈 hero 아래 '최근 본 권역' chip(LRU 5개), BottomNav 활성 상태 강화(상단 막대 인디케이터 + 아이콘 확대 + FILL), 하루 코스 배너에 '코스 저장' 버튼(3장소 한 번에 saved). **Batch 3**: WeatherWidget +3h/+6h 시간별 forecast 미니 카드 추가, **SETUP-V2.md** 신설 — App Check / Firestore 보안 규칙 / 검색엔진 등록 / 커스텀 도메인 / 코드 스플리팅 / FCM 푸시 운영 강화 가이드 |
| 2026-04-24 | v0.4.2 | **헤더·저장됨·로고·hero·날씨 위젯 정리** — (1) 데스크톱 Header에서 홈/저장됨 nav 제거(로고 클릭으로 홈, 마이페이지에서 저장됨 접근), 마이페이지 텍스트 링크는 프로필 사진 왼쪽으로 이동. (2) SavedView **지역별 그룹핑** — `regionFromAddress` 기반 시·도 별 섹션 분리, 헤더에 카운트 + "더 보기" 링크, 매칭 안 되는 장소는 '기타' 섹션으로 맨 뒤. (3) SavedView 빈 상태 카피 두 줄로 분리("나만의 컬렉션을 만들어보세요"가 단어 중간에서 잘리지 않도록). (4) **로고 전면 교체**: 사용자가 새로 보낸 핑크/오렌지 로고 → 오렌지→핑크→보라 3-stop 그라데이션 + 큰 흰색 'p+체크' (font-size 360, 4면 둥근 모서리 균형). theme_color #7C3AED → #EC4899. (5) 경남 hero 사진 통영 콜라주 → 진주성 단일 사진. (6) 메인 hero 화질 1280px → 2560px @ q92 + mozjpeg + 4:4:4 chroma. (7) **`WeatherWidget`** 신설 — Open-Meteo 무료 API(no key, CORS OK), navigator.geolocation 좌표→날씨/온도→외출 vibe 메시지(7단계: 산책 좋아요/시원한 카페/실내 추천 등). 홈 "오늘 누구랑" 섹션 우측에 배치(데스크톱), 모바일은 위에 |
| 2026-04-24 | v0.4.1 | **RegionMap 중심 이동 버그 수정** — Kakao Map 컨테이너가 첫 렌더에 0 사이즈이면 `setBounds()` 가 무효화되어 모든 비-Seoul 지역(부산/대구/제주/전남 등)이 지도 기본 center(36.5, 127.8, 충청도 근처)에 머물러 있던 이슈. `map.relayout()` + ResizeObserver로 실제 사이즈(>50×50px)가 반영되는 순간 한 번만 재적용 후 disconnect — 사용자 드래그 방해 없음 |
| 2026-04-23 | v0.4.0 | **PreferencesView 완전 삭제 → MyPageView로 흡수.** 내 취향을 4개 확장형 카드로 재설계 (음식 취향=orange / 라이프스타일=blue / 카테고리·무드=purple / 동행=rose). 각 카드 헤더는 현재 값 한 줄 요약, 클릭으로 펼치면 chip grid, chip 클릭 즉시 저장 + "저장되었습니다" 토스트 — 제출 버튼 없는 모던 설정 앱 스타일. 활동 통계 "취향 설정" 카드가 `N/8` 카운터로 바뀌어 변경 즉시 반영. BottomNav `취향` 탭 → `마이` 탭(person 아이콘), Header nav `취향 설정` → `마이페이지`. HomeView CTA "취향 설정 시작" → "마이페이지에서 설정"(#/mypage). `#/preferences` 라우트는 `#/mypage` 리다이렉트로 대체(외부 공유 URL 호환), 사용가이드 step 6 카피 갱신 |
| 2026-04-23 | v0.3.16 | 동행 칩에 **이성친구** 추가 (혼자/데이트/이성친구/친구/가족/회식 6종). opposite tier 가중치는 카페·브런치·디저트·와인바·뷰·전시·미술관·한강·루프탑 키워드(데이트보다 캐주얼, 친구보다 분위기). **헤더 auth-slot 버그 수정** — 라우트 이동마다 Header DOM이 새로 그려지면서 #auth-slot 이 빈 상태로 남아 F5 새로고침 전엔 프로필이 안 보이던 이슈, main.js에 latestAuthUser 캐시 + hashchange 리스너로 매 navigation 직후 queueMicrotask로 다시 칠하도록 수정 |
| 2026-04-23 | v0.3.15 | **사용자 영역 대폭 확장** — (1) **Footer + 정보 페이지** 신설: `src/components/Footer.js` + `Modal.js` + `info-modals.js`. 모든 메인 뷰(홈·지역·결과·저장·장소 상세·마이) 하단에 푸터 노출, "소개·사용가이드·문의·개인정보처리방침·이용약관" 5개 링크 중 mailto 외 4개는 클릭 시 가운데 모달 팝업(ESC/배경 클릭/× 닫기, scroll-lock). 풀페이지 fallback 라우트(`#/about`, `#/guide`, `#/privacy`, `#/terms`)도 유지(직접 URL/공유용, 모달과 동일 콘텐츠 함수 재사용). (2) **마이페이지** `#/mypage` 신설: 프로필 hero(아바타·이름·이메일·provider 배지) + 활동 통계 카드 3개 + 내 취향 요약 + 저장 미리보기(top 3) + 계정 관리(로그아웃·탈퇴 mailto). 헤더 프로필 클릭이 즉시 로그아웃 → 마이페이지 이동으로 변경(안전성). (3) **취향 시스템 디테일화**: `data.js`에 `dietary`(7종 다중)/`spiceLevels`(3단계)/`companions`(5종) 추가. PreferencesView에 식이·매운맛 섹션 추가, **동행은 HomeView 상단으로 분리**(매일 바뀌는 세션 컨텍스트). `utils/preference-filter.js` 신설 — `applyAllPreferences()`가 Kakao 결과를 식이(키워드 기반 hard filter, FD6 한정)·매운맛(mild→매운 카테고리 제외)·동행(stable sort 가중치)으로 후처리. ResultsView에 활성 취향 chip(보라색, 클릭 시 /preferences로 편집 이동) 표시 |
| 2026-04-23 | v0.3.14 | **랜드마크 반경 검색 필터** 추가 — ResultsView 카테고리 탭 위에 입력창("어디에 계신가요? 현재 눈 앞에 보이는 것을 검색해보세요!"). 사용자가 건물명 입력 시 Kakao keywordSearch로 좌표 확보 → haversine 1km 반경으로 카드/지도 동시 필터링, 활성 chip(📍 X 주변 1km)에 × 해제. **SEO 보강 패키지** — index.html에 JSON-LD WebApplication schema(SearchAction 포함, 구글 사이트 내 검색창 노출 가능) + canonical URL + meta keywords/author/robots/googlebot 추가. `public/robots.txt` 신설(전체 허용 + sw.js 제외 + sitemap 링크). `public/sitemap.xml` 신설(루트 + 주요 hash 라우트 4개). 검색엔진 verification 토큰은 placeholder 주석으로만 보존. ResultsView 간격 5단계 조정(헤더·input·칩·탭·카드 gap 확대 — 빽빽함 해소) |
| 2026-04-23 | v0.3.13 | RegionMap을 **Leaflet thematic → Kakao Map 실타일 + TopoJSON polygon overlay**로 전환 — 도로·랜드마크가 보이는 실제 지도 위에 시·도 행정구역 polygon(blue 38%, hover purple 70%)으로 강조, 드래그·줌 활성화. ResultsView 카드 **번호 뱃지 → 랭크/태그 시그널**(🥇🥈🥉 1-3위, 📍근처 500m이내, 🔥인기 4-10위). 카드에 **카카오맵 별점·후기 deep-link 버튼**(amber chip, place_url 새 탭)으로 평점 데이터 무료 확보. **Naver 블로그 후기 수 chip** 추가(emerald, "블로그 1.2k건"), Cloudflare Worker `type=blog` 엔드포인트 추가 필요(openapi.naver.com/v1/search/blog.json), `naverLocal.js` getBlogCount + 24h localStorage 캐시. OG 이미지 우상단 작은 로고 배지 제거(카톡 미리보기에서 비대칭 인상 → 클린업) |
| 2026-04-23 | v0.3.12 | subregions 대폭 확장(56 → 83개, +27개) — **서울** 8 → 18개(잠실·송파/강동·천호/노원·중랑/동대문·청량리/강서·마곡/관악·사당/구로·가산/양천·목동/동작·노량진 추가, 25개 구 거의 전체 커버), **경기** 6 → 11개(용인·수지/하남·남양주/의정부·양주/평택·안성/안산·시흥), **인천** 4 → 6개(부평·계양/구월·논현), **부산** 5 → 8개(동래·온천장/사상·구포/남구·용호), **대구** 4 → 7개(달서·성서/북구·칠곡/달성·화원), **광주** 4 → 5개(상무지구·첨단), **대전** 4 → 5개(도안·관저), **강원** 6 → 7개(원주·횡성), **전북** 4 → 5개(익산·정읍), **전남** 5 → 7개(나주·장성/보성·고흥), **경북** 4 → 5개(구미·김천), **경남** 4 → 6개(양산·밀양/하동·산청) |
| 2026-04-23 | v0.3.11 | 권역별 데이터 커버리지 극대화 — `SEARCH_KEYWORDS` 대폭 확장: food 1 → 25개(한식/한정식/고기/삼겹살/갈비/일식/초밥/라멘/회/중식/양식/파스타/피자/아시안/쌀국수/치킨/분식/떡볶이/족발/국밥/냉면/술집/이자카야/포차 등), cafe 1 → 7개(디저트·베이커리·브런치·와플·케이크·커피), attraction 8 → 15개(체험관·테마파크·수족관·동물원·한옥마을·전통시장·전망대 추가), lodging 3 → 8개(리조트·한옥스테이·풀빌라·글램핑·모텔). `buildQueriesForArea`가 subregion의 **모든 키워드**(구·동·랜드마크 등 6-8개)를 area term으로 순회하도록 변경 — 기존 첫 키워드 1개만 사용 → 3-4배 확장. 결과 slice cap 120 → 1000 까지 상향. 권역 1회 로드에 Kakao/Naver 병렬 200-400 개 쿼리로 실질 수백 개 유니크 장소 수집 가능 |
| 2026-04-20 | v0.3.10 | Naver Local/Image API 연동 — `src/services/naverLocal.js` 신설, Cloudflare Worker 프록시(`VITE_NAVER_PROXY_URL`)로 CORS 우회, Naver Image Search 결과를 결과 카드·대표 명소 썸네일에 lazy-load + localStorage 24h 캐시. OG/Twitter 메타 태그 + `public/og-image.jpg` (1200×630, 경복궁 hero + 정해줘 브랜드) 추가로 카톡·트위터 공유 미리보기 개선. `scripts/generate-og-image.mjs` 생성기 추가. SavedView 빈 상태 전면 개편(큰 글로우 아이콘 + 로그인 유도 CTA 분기). ResultsView 모바일 FAB로 리스트↔지도 전환. GitHub Secrets 9개 → 10개로 확장 |
| 2026-04-21 | v0.3.9 | 여행 사이트화 1차 — 지역별 대표 명소 큐레이션(FEATURED_ATTRACTIONS, 17×5=85개), RegionView에 "✨ 이 지역 대표 명소" 가로 스크롤 섹션. 숙소(AD5) 탭 추가, SEARCH_KEYWORDS 에 lodging 그룹(호텔·펜션·게스트하우스). `scripts/download-featured-photos.mjs` 로 Wikipedia originalimage → sharp 640×400 JPEG → `public/data/featured/{region}_{i}.jpg`, RegionView 카드는 `<img>` + onerror 그라데이션 fallback |
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
