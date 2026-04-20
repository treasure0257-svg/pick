# Pick — The Concierge

> "뭐하지?"를 끝내는 곳. 결정장애를 위한 디지털 컨시어지.

매주 검색에 허비하는 시간을 줄이는 SPA(Single Page App). 취향 기반 추천과 이상형 월드컵 두 가지 방식으로 "오늘 뭘 할지"를 대신 좁혀줍니다.

- **라이브**: https://pick-concierge.web.app
- **백업 도메인**: https://pick-concierge.firebaseapp.com

## 두 가지 사용 흐름

| 모드 | 라우트 | 동작 |
|---|---|---|
| 취향 기반 추천 | `#/preferences` → `#/results` | 카테고리/무드/예산/기간/음주 유무 선택 후 `scorePlace()`로 랭킹 |
| 이상형 월드컵 | `#/tournament` | A/B 이미지 대결로 점진적으로 좁혀 최종 1위 도출 |

로그인 없이 체험 가능. Google 계정으로 로그인하면 취향·저장 목록이 Firestore에 동기화되어 기기 간 유지됩니다.

## 기술 스택

- **빌드**: Vite 8 (ESM, Rolldown)
- **스타일**: Tailwind CSS 3 + PostCSS + Autoprefixer
- **라우팅**: hash 기반 self-rolled SPA 라우터 (`src/router.js`)
- **DOM**: `h()` 헬퍼(`src/utils/dom.js`)로 가상 DOM 없이 직접 생성
- **인증**: Firebase Auth (Google provider만 활성)
- **데이터**: Firestore (`users/{uid}` 문서에 preferences·saved 저장, localStorage 동기화)
- **PWA**: `public/manifest.json` + `public/sw.js` 서비스워커
- **호스팅**: Firebase Hosting (`dist/` 산출물)
- **CI/CD**: GitHub Actions → Vite build → Firebase Hosting 자동배포

## 폴더 구조

```
pick/
├── index.html              # Vite entry (SPA 루트)
├── public/
│   ├── manifest.json       # PWA 매니페스트
│   └── sw.js               # 서비스워커
├── src/
│   ├── main.js             # 엔트리, 라우터 초기화, 인증 UI
│   ├── App.js              # AppState + scorePlace + recommend 로직
│   ├── router.js           # hash 라우터 + 토스트
│   ├── firebase-setup.js   # Firebase 초기화 + Firestore 동기화
│   ├── data.js             # 샘플 장소 데이터 (PICK_DATA)
│   ├── style.css           # Tailwind 엔트리
│   ├── components/
│   │   ├── Header.js
│   │   └── BottomNav.js
│   ├── views/
│   │   ├── HomeView.js
│   │   ├── PreferencesView.js
│   │   ├── TournamentView.js
│   │   ├── ResultsView.js
│   │   └── SavedView.js
│   └── utils/dom.js        # h() 엘리먼트 헬퍼
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── firebase.json           # Hosting 설정 (public: dist)
├── .firebaserc             # Firebase 프로젝트 별칭
└── .github/workflows/      # build + deploy 자동화
```

## 로컬 개발

### 1) 의존성 설치

```bash
npm install
```

### 2) 환경변수 설정

프로젝트 루트에 `.env` 파일을 만들고 Firebase 웹 앱 설정값을 넣습니다(Firebase Console → 프로젝트 설정 → 내 앱 → SDK 설정 및 구성):

```bash
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=pick-concierge.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=pick-concierge
VITE_FIREBASE_STORAGE_BUCKET=pick-concierge.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

`.env`는 `.gitignore`에 포함되어 커밋되지 않습니다.

### 3) 개발 서버

```bash
npm run dev     # http://localhost:3000
```

Vite HMR이 붙어 있어 파일 저장 시 즉시 반영됩니다.

### 4) 프로덕션 빌드 확인

```bash
npm run build           # dist/로 출력
npm run preview         # 빌드 결과 로컬 프리뷰
```

## 배포

`main` 브랜치에 푸시하면 GitHub Actions가 자동으로:

1. `npm ci` — 락파일 기반 의존성 설치
2. `npm run build` — `VITE_FIREBASE_*` 시크릿을 빌드에 주입
3. `FirebaseExtended/action-hosting-deploy` — `dist/`를 Firebase Hosting에 배포

PR을 올리면 `firebase-hosting-pull-request.yml`이 프리뷰 URL을 생성합니다.

### 필요한 GitHub Secrets

리포 **Settings → Secrets and variables → Actions**에 다음 7개가 등록되어 있어야 합니다:

| 이름 | 용도 |
|---|---|
| `FIREBASE_SERVICE_ACCOUNT_PICK_CONCIERGE` | Firebase 배포용 서비스 계정 JSON |
| `VITE_FIREBASE_API_KEY` | 빌드 타임 주입 — Firebase Web API 키 |
| `VITE_FIREBASE_AUTH_DOMAIN` | `pick-concierge.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `pick-concierge` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `pick-concierge.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | 프로젝트 번호 |
| `VITE_FIREBASE_APP_ID` | Web 앱 ID |

수동 배포는 로컬에서 `.env` 설정 후 `npm run build && firebase deploy --only hosting`.

## 문서

- [PRD.md](PRD.md) — 프로덕트 요구사항 문서
- [SETUP.md](SETUP.md) — 과거 3-way OAuth 시절 세팅 가이드 (현재는 Google 단일 제공자, 참고용 보관)
