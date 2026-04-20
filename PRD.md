# Pick — The Concierge · PRD

> Product Requirements Document  ·  v0.2 (2026-04-20)

## 1. 제품 개요

### 1.1 한 줄 설명
"뭐하지?"를 끝내주는, 결정장애를 위한 디지털 컨시어지.

### 1.2 문제 정의
한국 직장인이 주말·여가 계획에 들이는 시간은 평균 2.4시간. 정보는 넘치는데 선택은 어렵다. 취향에 맞는 곳을 찾아 헤매다 결국 "그냥 집에 있기"로 끝나는 경우가 많다.

### 1.3 핵심 가치 제안
- 능동적 검색 없이, **두 가지 방식 중 하나**로 오늘의 한 곳이 정해진다.
  1. 취향 슬라이더 기반 필터링
  2. 이상형 월드컵 스타일 대결
- 로그인 없이도 체험 가능, 로그인 시 Firestore로 기기 간 동기화.

## 2. 타깃 사용자

| 세그먼트 | 특징 | 주된 맥락 |
|---|---|---|
| 주말 고민러 | 20–35세 직장인, 데이트/친구 약속 잡기 어려워함 | 금요일 저녁, 이번 주말 뭐할지 |
| 여행 계획러 | 국내 당일치기~1박 선호 | 출발 하루 전 즉흥 |
| 혼자 보내는 사람 | 혼영/혼밥/산책 | 카페·공원 위주 |

## 3. 사용자 흐름

SPA 구조 (hash 라우팅).

### 3.1 취향 기반 추천
```
#/  (HomeView)
  ↓ [취향으로 추천받기]
#/preferences  (PreferencesView)
  ↓ 카테고리 · 무드 · 예산 · 기간 · 음주 선택
#/results  (ResultsView)
  ↓ 스코어 기반 랭킹 / 저장
```

### 3.2 이상형 월드컵
```
#/  (HomeView)
  ↓ [토너먼트로 고르기]
#/tournament setup
  ↓ 카테고리 범위 · 음주 · 대진 규모(4/8/16강) 설정
#/tournament match
  ↓ A/B 양자택일 반복
#/tournament result
  ↓ 최종 1위 표시 / 저장
```

### 3.3 로그인
홈·헤더 우측의 **Google 로그인** 버튼(Firebase Auth 팝업)으로 즉시 로그인. 로그인된 상태에서 `AppState.set()`은 Firestore `users/{uid}` 문서에 merge 저장되어 기기 간 동기화.

## 4. 기능 명세

### 4.1 v0.2 (현재, 2026-04-20)
- [x] SPA 전환 완료 — Vite 빌드 + hash 라우터
- [x] HomeView (히어로 섹션, 두 가지 모드 진입)
- [x] PreferencesView — 카테고리/무드/예산/기간/음주 입력
- [x] ResultsView — `scorePlace()` 기반 랭킹
- [x] TournamentView — setup · match · result 3단계
- [x] SavedView — 저장된 장소 목록
- [x] Google 로그인 via Firebase Auth
- [x] Firestore 동기화 — 로그인 시 preferences·saved가 클라우드에 merge 저장
- [x] PWA 기반 — manifest + 서비스워커 등록
- [x] GitHub Actions CI/CD — `npm ci` → `vite build` → Firebase Hosting 배포
- [x] `.env` 기반 Firebase 설정 주입 (빌드 타임, 로컬/CI 모두)

### 4.2 v1.0 (목표)
- [ ] 장소 데이터 API 연동 (Google Places / 카카오 로컬 / 네이버 지역 등)
- [ ] 실제 도메인 연결 (예: `pick.neotis.co.kr`)
- [ ] Firebase App Check 활성화로 API 키 남용 방지
- [ ] Firestore 보안 규칙 작성 (현재 기본 규칙: 인증된 사용자 자기 문서만)
- [ ] SavedView에서 실제 저장된 장소의 카드·지도 렌더링
- [ ] 추천 랭킹 알고리즘 세부 튜닝

### 4.3 v2.0 (아이디어)
- [ ] Kakao/Naver 로그인 재추가 — Cloud Functions 기반 커스텀 토큰 교환 포함
- [ ] 친구 초대 → 공동 토너먼트 (Firestore 실시간)
- [ ] 방문 후기 · 평점 투고
- [ ] 알림: 금요일 자동 추천 푸시 (서비스워커 + FCM)
- [ ] 날씨·계절 반영 동적 추천
- [ ] 접근성 WCAG AA 전체 준수

## 5. 기술 요건

### 5.1 호스팅
- Firebase Hosting (Spark 무료 플랜 유지가 비용 목표)
- 커스텀 도메인: v1.0에서 연결

### 5.2 인증
- Firebase Auth: Google 제공자만 활성. Authorized domains: `localhost`, `pick-concierge.firebaseapp.com`, `pick-concierge.web.app`
- Kakao/Naver는 v0.1 구조에서 제거됨 (v2.0에 Cloud Functions 경유로 재도입 예정)

### 5.3 데이터
- **샘플**: `src/data.js`의 `PICK_DATA.places` 하드코딩 (MVP 한정)
- **사용자 데이터**: Firestore `users/{uid}` 문서에 `{ preferences, saved }` 저장. 로컬은 `localStorage` 키 `pick.preferences` / `pick.saved` / `pick.tournament`
- v1.0: 외부 지도 API 프록시 + App Check 필수

### 5.4 빌드·배포
- 빌드: `vite build` → `dist/` 산출 (현재 JS 383KB / CSS 23KB, gzip 기준 117KB / 5KB)
- 배포: main 푸시 시 GitHub Actions가 빌드 + Firebase Hosting 업로드
- 필요한 GitHub Secrets: `FIREBASE_SERVICE_ACCOUNT_PICK_CONCIERGE` + `VITE_FIREBASE_*` 6개

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
- **토너먼트 완주율**: 시작한 토너먼트 중 최종 1위까지 간 비율
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
| 2026-04-20 | v0.2 | Vite + Firestore SPA로 아키텍처 전환. Kakao/Naver 로그인 제거, Google만 유지. PWA 기반 추가. GitHub Actions에 빌드 스텝 추가 |
| 2026-04-20 | v0.1 | 초기 문서, 바닐라 HTML + Tailwind CDN MVP 완성, Firebase Hosting 배포 파이프라인 구축 |
