# Pick — 인증 설정 가이드

로그인을 실제로 동작시키려면 세 개의 콘솔(Firebase + Kakao + Naver)에서 앱을 등록하고 키를 받아와야 합니다. 그 후 `assets/js/firebase-config.js`에 값을 채우면 끝입니다.

## 1. Firebase 프로젝트 만들기 (Google 로그인용)

1. <https://console.firebase.google.com> 접속 → **프로젝트 추가**
2. 프로젝트 이름(예: `pick-concierge`) 입력 → 생성
3. 좌측 **Authentication** → **시작하기**
4. **Sign-in method** 탭 → **Google** 토글 ON → 저장
5. **Settings > Authorized domains**에 배포 도메인을 추가
   - 로컬 테스트면 `localhost`는 이미 허용됨
6. **프로젝트 설정(⚙)** → **일반** 탭 하단 "내 앱" → **웹 앱 추가**(</> 아이콘)
7. 앱 이름 입력 → 등록하면 표시되는 `firebaseConfig` 객체를 복사

## 2. Kakao 앱 만들기

1. <https://developers.kakao.com> → **내 애플리케이션** → **애플리케이션 추가**
2. 앱 이름/회사명 입력 후 저장
3. **앱 설정 > 앱 키** 탭에서 **JavaScript 키** 복사
4. **제품 설정 > 카카오 로그인** → 활성화 ON
5. **Redirect URI** 에 사이트 주소 등록
   - 로컬 테스트: `http://localhost:8765`
   - 배포: `https://your-domain.com`
6. **동의 항목** 에서 필요한 스코프 허용:
   - 닉네임 (필수)
   - 프로필 사진 (선택)
   - 이메일 (선택, 검수 필요할 수 있음)
7. **플랫폼 > Web 플랫폼 등록** 에서 사이트 도메인 추가

## 3. Naver 애플리케이션 만들기

1. <https://developers.naver.com/apps/> → **Application 등록**
2. 애플리케이션 이름 입력
3. **사용 API** 에서 "네이버 로그인" 선택
4. **제공 정보 선택** 에서 필요한 항목 체크 (이름, 이메일, 프로필사진 등)
5. **환경 추가 > PC웹** 선택
6. **서비스 URL**: `http://localhost:8765` (또는 배포 도메인)
7. **Callback URL**: `http://localhost:8765/login.html`
   - ⚠ Naver SDK는 로그인 후 이 정확한 URL로 리다이렉트합니다. 경로까지 일치해야 합니다.
8. 등록 후 **내 애플리케이션 > 기본 정보**에서 **Client ID** 복사
   - Client Secret은 사용하지 않습니다 (프론트엔드 전용 설정)

## 4. 키 파일 채우기

`assets/js/firebase-config.js` 을 열고 아래처럼 수정:

```js
window.PICK_FIREBASE_CONFIG = {
  apiKey:            "AIza...",
  authDomain:        "pick-concierge.firebaseapp.com",
  projectId:         "pick-concierge",
  storageBucket:     "pick-concierge.appspot.com",
  messagingSenderId: "1234567890",
  appId:             "1:1234567890:web:abcdef"
};

window.PICK_KAKAO_JS_KEY    = "여기에_카카오_JS키";
window.PICK_NAVER_CLIENT_ID = "여기에_네이버_Client_ID";
```

저장 후 브라우저 강력 새로고침 (Ctrl+F5).

## 5. 동작 흐름

- **Google**: Firebase Auth가 표준 OAuth 팝업을 띄웁니다. 세션은 Firebase가 관리.
- **Kakao**: Kakao JS SDK로 팝업 로그인 → 프로필 조회 → localStorage에 저장. Firebase 세션은 생성되지 않습니다.
- **Naver**: Naver ID Login SDK가 로그인 페이지로 **리다이렉트**합니다. 로그인 후 `login.html`로 돌아오며 URL hash에 access_token이 포함되고, `auth.js`가 이를 감지해 프로필을 저장합니다.
- `assets/js/auth.js` 의 `PickAuth` 모듈이 세 경로를 통합해 하나의 사용자 객체로 표현합니다.

## 6. 주의사항

- **Kakao/Naver → Firebase 완전 통합**이 필요하면 Cloud Functions에서 각 SDK의 토큰을 검증 후 Firebase Custom Token을 발급하는 서버 엔드포인트를 추가해야 합니다. 지금 구조는 백엔드 없이 동작하는 최소 구성이므로 Kakao/Naver 사용자는 Firebase Firestore 기준으로는 미인증 상태입니다.
- 프로덕션에서는 Firebase **App Check**를 활성화해서 API 키 남용을 막는 것을 권장합니다.
- Naver SDK는 기본적으로 리다이렉트 방식이라 로그인 후 페이지가 새로고침됩니다 (팝업 방식으로 바꾸고 싶으면 `auth.js`의 `isPopup: false` 를 `true`로).

## 7. 문제가 생겼을 때

- 콘솔에 `[PickAuth] Firebase config is still a placeholder` / `Naver client ID is a placeholder` 가 뜨면 키를 아직 안 채운 상태입니다.
- `auth/unauthorized-domain` 에러 → Firebase **Authorized domains**에 현재 도메인 추가.
- `KOE006` (Kakao) → Kakao 앱 **플랫폼** 에 도메인 추가.
- Naver 로그인 후 프로필이 안 뜸 → Naver Developers에서 Callback URL이 `login.html`까지 정확히 일치하는지 확인.
- `popup-blocked` → 브라우저 팝업 차단 해제.
