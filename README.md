# Pick — The Concierge

> "뭐하지?"를 끝내는 곳. 결정장애를 위한 디지털 컨시어지.

매주 검색에 허비하는 시간을 줄이는 정적 웹 앱. 취향 기반 추천과 이상형 월드컵 두 가지 방식으로 "오늘 뭘 할지"를 대신 좁혀줍니다.

- **라이브**: https://pick-concierge.web.app
- **백업 도메인**: https://pick-concierge.firebaseapp.com

## 두 가지 사용 흐름

| 모드 | 경로 | 동작 |
|---|---|---|
| 취향 기반 추천 | `preferences.html` → `results.html` | 카테고리/무드/예산/기간/음주 유무로 필터링 후 개인화 랭킹 |
| 이상형 월드컵 | `tournament.html` | A/B 이미지 대결로 점진적으로 좁혀서 최종 1위 도출 |

로그인 없이도 체험 가능. 로그인하면 결과를 `saved.html`에 영구 저장.

## 기술 스택

- **프론트**: 바닐라 JS + Tailwind CDN + Material Symbols, 빌드 과정 없음
- **인증**: Firebase Auth (Google) + Kakao JS SDK + Naver ID Login SDK
- **호스팅**: Firebase Hosting
- **자동배포**: GitHub Actions → Firebase Hosting (main 푸시 시)
- **데이터**: `assets/js/data.js` 하드코딩 샘플 (추후 API로 대체 예정)
- **백엔드**: 없음. Firebase 세션과 localStorage로 상태 관리

## 폴더 구조

```
pick/
├── index.html              # 랜딩
├── login.html              # 3-way OAuth (Google / Kakao / Naver)
├── preferences.html        # 취향 설정
├── results.html            # 추천 결과
├── tournament.html         # 이상형 월드컵
├── saved.html              # 저장된 장소
├── profile.html            # 사용자 프로필
├── assets/
│   ├── css/app.css
│   └── js/
│       ├── config.js           # 전역 설정
│       ├── data.js             # 샘플 장소 데이터
│       ├── app.js              # 공통 앱 로직
│       ├── auth.js             # PickAuth 통합 모듈
│       ├── auth-header.js      # 헤더 로그인 UI
│       └── firebase-config.js  # 🔑 API 키 (SETUP.md 참고)
├── design/                 # 디자인 레퍼런스 (배포 제외)
├── firebase.json           # Hosting 설정
├── .firebaserc             # 프로젝트 별칭
├── .github/workflows/      # GitHub Actions (merge 배포 + PR 프리뷰)
├── SETUP.md                # 인증 키 세팅 가이드
└── PRD.md                  # 프로덕트 요구사항 문서
```

## 로컬 개발

정적 서버 아무거나 띄우면 됩니다:

```bash
# Python
python -m http.server 8765

# Node (npx serve)
npx serve -l 8765 .

# Firebase Emulator (로컬에서 배포 환경 재현)
firebase emulators:start --only hosting
```

접속: <http://localhost:8765>

> ⚠ Naver SDK는 로그인 후 Callback URL로 리다이렉트하므로 개발 중에는 Naver Developers에서 `http://localhost:8765/login.html`을 Callback으로 등록해두세요.

## 배포

`main` 브랜치에 푸시하면 끝입니다:

```bash
git add .
git commit -m "변경 내용"
git push origin main
```

- GitHub Actions가 `.github/workflows/firebase-hosting-merge.yml` 실행 → Firebase Hosting에 자동 배포
- 풀 리퀘스트를 올리면 `firebase-hosting-pull-request.yml`이 임시 프리뷰 URL 생성

수동 배포는 `firebase deploy --only hosting`.

## 인증 키 채우기

로그인을 실제 동작시키려면 Firebase / Kakao / Naver 콘솔에서 키를 받아와 `assets/js/firebase-config.js` 에 채워야 합니다. 상세 절차는 [SETUP.md](SETUP.md) 참고.

## 문서

- [SETUP.md](SETUP.md) — 인증 설정 가이드 (Firebase/Kakao/Naver)
- [PRD.md](PRD.md) — 프로덕트 요구사항 문서
