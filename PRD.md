# Pick — The Concierge · PRD

> Product Requirements Document  ·  v0.1 (2026-04-20)

## 1. 제품 개요

### 1.1 한 줄 설명
"뭐하지?"를 끝내주는, 결정장애를 위한 디지털 컨시어지.

### 1.2 문제 정의
한국 직장인이 주말·여가 계획에 들이는 시간은 평균 2.4시간. 정보는 넘치는데 선택은 어렵다. 취향에 맞는 곳을 찾아 헤매다 결국 "그냥 집에 있기"로 끝나는 경우가 많다.

### 1.3 핵심 가치 제안
- 능동적 검색 없이, **두 가지 방식 중 하나**로 오늘의 한 곳이 정해진다.
  1. 취향 슬라이더 기반 필터링
  2. 이상형 월드컵 스타일 대결
- 로그인 없이도 체험 가능, 로그인 시 기록 보존.

## 2. 타깃 사용자

| 세그먼트 | 특징 | 주된 맥락 |
|---|---|---|
| 주말 고민러 | 20–35세 직장인, 데이트/친구 약속 잡기 어려워함 | 금요일 저녁, 이번 주말 뭐할지 | 
| 여행 계획러 | 국내 당일치기~1박 선호 | 출발 하루 전 즉흥 | 
| 혼자 보내는 사람 | 혼영/혼밥/산책 | 카페·공원 위주 | 

## 3. 사용자 흐름

### 3.1 취향 기반 추천
```
index.html
   ↓ [취향으로 추천받기]
preferences.html
   ↓ 카테고리 · 무드 · 예산 · 기간 · 음주 선택
results.html
   ↓ 랭킹 확인 / 저장 / 지도 보기
```

### 3.2 이상형 월드컵
```
index.html
   ↓ [토너먼트로 고르기]
tournament.html (setup)
   ↓ 카테고리 범위 · 음주 · 대진 규모 설정
tournament.html (match)
   ↓ A/B 양자택일 반복
tournament.html (result)
   ↓ 최종 1위 표시 / 저장
```

### 3.3 로그인 (선택)
`login.html`에서 Google / Kakao / Naver 중 선택. 로그인 후 `saved.html`에서 이전 선택 기록 조회 가능.

## 4. 기능 명세

### 4.1 MVP (v0.x, 현재 구현됨)
- [x] 랜딩 페이지 (index.html)
- [x] 취향 설정 폼 (preferences.html)
- [x] 추천 결과 리스트 (results.html) — 하드코딩 데이터
- [x] 토너먼트 모드 (tournament.html)
- [x] 3-way OAuth 로그인 구조 (login.html) — **키 미입력 상태**
- [x] 저장됨 페이지 (saved.html) — localStorage 기반
- [x] 프로필 페이지 (profile.html)
- [x] Firebase Hosting 배포 + GitHub Actions 자동배포

### 4.2 v1.0 (목표)
- [ ] Firebase/Kakao/Naver 실제 키 등록 → 로그인 동작
- [ ] 장소 데이터 API 연동 (Google Places / 카카오 로컬 / 네이버 지역 등)
- [ ] Firestore 기반 사용자별 영구 저장
- [ ] 추천 랭킹 알고리즘 개선 (현재는 필터 매칭 개수 기반)
- [ ] 실제 도메인 연결 (예: `pick.neotis.co.kr`)
- [ ] Firebase App Check 활성화로 API 키 남용 방지

### 4.3 v2.0 (아이디어)
- [ ] 친구 초대 → 공동 토너먼트 (다중 사용자 실시간)
- [ ] 방문 후기 · 평점 투고
- [ ] 알림: 주말 금요일 자동 추천 푸시
- [ ] 날씨·계절 반영 동적 추천
- [ ] Kakao/Naver 토큰을 Firebase Custom Token으로 교환해 Firestore 완전 통합

## 5. 기술 요건

### 5.1 호스팅
- Firebase Hosting (Spark 무료 플랜 유지가 비용 목표)
- 커스텀 도메인: v1.0에서 연결

### 5.2 인증
- Firebase Auth: Google 제공업체 (ID 토큰 Firestore 규칙 검증용)
- Kakao / Naver: JS SDK로 프론트 로그인만, 서버 검증 없음 (MVP 전제)
- 향후 v2.0에서 Cloud Functions로 Kakao/Naver 커스텀 토큰 발급

### 5.3 데이터
- 현재: `assets/js/data.js` 의 `window.PICK_DATA` 하드코딩
- v1.0: 외부 지도 API 프록시 (서버 없이 쿼리 노출되므로 App Check 필수)
- v2.0: Firestore로 사용자 저장소 / 공동 토너먼트 상태

### 5.4 성능 목표
- LCP < 2.5s (모바일 3G 기준)
- 초기 JS 로드 < 200KB (Tailwind CDN 제외 시)

## 6. 비기능 요건

- **접근성**: WCAG AA 수준 목표 (현재는 부분 준수)
- **브라우저**: 최신 Chrome / Safari / Edge / Samsung Internet
- **언어**: 한국어 only (MVP), 영어는 v2.0 이후 고려
- **반응형**: 모바일 우선, 태블릿/데스크톱 대응

## 7. 지표 (v1.0 시점)

- **활성 사용자**: 주간 활성 사용자 (WAU)
- **결정 완료율**: 추천 페이지 진입 대비 "저장" 또는 "지도 열기" 전환율
- **토너먼트 완주율**: 시작한 토너먼트 중 최종 1위까지 간 비율
- **로그인 전환율**: 비로그인 사용자 중 OAuth 완료 비율

## 8. 리스크 및 오픈 이슈

- **API 키 노출**: 프론트 only 구조라 키가 전부 공개됨 → 도메인 제한 + App Check로 완화 필요
- **데이터 품질**: 샘플 데이터로는 신뢰도 제한적, 실 데이터로 조기 전환 필요
- **Naver SDK 리다이렉트**: SPA 느낌 해치는 페이지 새로고침, v2.0에서 팝업 방식 전환 검토
- **Kakao 이메일 스코프**: 검수 필요할 수 있어 MVP에선 선택 동의로만 확보

## 9. 변경 이력

| 날짜 | 버전 | 변경 |
|---|---|---|
| 2026-04-20 | v0.1 | 초기 문서, MVP 완성 및 Firebase 자동배포 구축 |
