# 정해줘 · v1.0 운영 강화 가이드

이 문서는 PRD v1.0 항목 중 **콘솔/외부 작업이 필요한** 보안·인프라 강화 작업을 단계별로 정리한 가이드입니다.

> 코드 변경은 별도 PR/커밋으로 처리하고, 이 문서는 **사람이 직접 클릭해야 하는** 작업을 담당합니다.

---

## 1. Firebase App Check 활성화 (API key 남용 방지)

App Check는 우리 앱에서만 Firebase API 호출이 가능하도록 reCAPTCHA Enterprise / Web 토큰을 검증합니다.

### 단계
1. **reCAPTCHA Enterprise 키 발급**
   - https://console.cloud.google.com/security/recaptcha
   - "키 만들기" → 웹사이트 → 도메인: `pick-concierge.web.app` (커스텀 도메인 추가 시 함께)
   - 사이트 키 복사
2. **Firebase Console → 프로젝트 설정 → App Check**
   - 웹 앱 등록 → reCAPTCHA Enterprise 선택 → 사이트 키 입력
3. **클라이언트 코드 추가** (`src/firebase-setup.js` 상단):
   ```js
   import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
   initializeAppCheck(app, {
     provider: new ReCaptchaEnterpriseProvider('YOUR_SITE_KEY'),
     isTokenAutoRefreshEnabled: true
   });
   ```
4. **Firestore / Storage / Auth 에 Enforce 토글** (Firebase Console)
   - 처음엔 Monitor 모드로 1주일 관찰 → 정상 트래픽 100% 통과 확인 후 Enforce

### 효과
- 우리 도메인 외부에서 fetch 시도 → 401 차단
- API key 도용 차단

---

## 2. Firestore 보안 규칙 작성

현재 기본 규칙은 모든 인증 사용자가 모든 문서를 읽고 쓸 수 있는 상태일 가능성이 높음. 본인 문서만 접근하도록 좁혀야 합니다.

### `firestore.rules` 파일 생성 후 deploy
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 사용자는 자기 문서(uid)만 읽고/쓸 수 있음
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
    // 다른 모든 컬렉션 차단
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

배포: `firebase deploy --only firestore:rules`

### 검증
- Firebase Console → Firestore → 규칙 → 시뮬레이터로 다른 uid 접근 시 거부 확인

---

## 3. 검색엔진 사이트 등록

`index.html` 의 verification 메타 태그 placeholder 를 실제 토큰으로 채우면 됩니다.

### Google Search Console
1. https://search.google.com/search-console
2. URL 접두어 → `https://pick-concierge.web.app/` 입력
3. HTML 메타 태그 방식 → `content="abc123..."` 토큰 받음
4. `index.html` 의 주석 해제 + 토큰 입력
5. 등록 후 `sitemap.xml` 제출

### Naver 서치어드바이저
1. https://searchadvisor.naver.com
2. 사이트 등록 → HTML 메타 태그 방식 → 토큰 받음
3. 마찬가지로 `index.html` placeholder 활성화

---

## 4. 커스텀 도메인 연결 (예: `pick.co.kr`)

### 단계
1. **도메인 구매** (가비아·후이즈 등, 연 2-3만원)
2. **Firebase Console → Hosting → 커스텀 도메인 추가**
   - `pick.co.kr` 입력 → 다음
   - 표시되는 A 레코드 / TXT 레코드를 **도메인 등록업체 DNS 관리** 페이지에 추가
3. **DNS 전파 대기** (평균 1시간 ~ 24시간)
4. **SSL 자동 발급** 확인 (Firebase가 Let's Encrypt 자동)
5. **코드 URL 일괄 교체**:
   - `src/utils/share.js` 의 `SITE_ORIGIN`
   - `index.html` 의 OG/canonical/JSON-LD URL
   - `public/sitemap.xml`
   - `public/robots.txt`

이 작업 알려주면 코드 한 번에 교체합니다.

---

## 5. 번들 코드 스플리팅 (선택, 빌드 사이즈 ↓)

현재 Firebase SDK 가 entry bundle 에 정적 임포트되어 ~400KB. Auth/Firestore 가 즉시 필요 없으면 동적 임포트로 분리 가능.

### 예시 (`src/firebase-setup.js`)
```js
// 즉시 필요한 app만 정적
import { initializeApp } from 'firebase/app';
const app = initializeApp(firebaseConfig);

// auth/firestore는 사용 시점에만 동적 로드
export async function loginGoogle() {
  const { getAuth, signInWithPopup, GoogleAuthProvider } = await import('firebase/auth');
  ...
}
```

### 효과
- 첫 페이지 로드: ~120KB 감소 (auth/firestore 미사용 시)
- LCP 약 200~400ms 개선 (3G 기준)

리스크: 첫 로그인 클릭 시 ~100KB 추가 로드 → 약 0.5초 추가 지연. 트레이드오프 검토 필요.

---

## 6. PWA 푸시 알림 (FCM)

주말 추천 알림 등을 보내려면 Firebase Cloud Messaging 활성화.

### 단계
1. **Firebase Console → Cloud Messaging** 활성화
2. **VAPID 키** 발급 → `.env` 에 `VITE_FCM_VAPID_KEY` 추가
3. `firebase-setup.js` 에 `getMessaging`, `getToken`, `onMessage` 추가
4. 사용자 권한 요청 UI (마이페이지 → 알림 설정 토글)
5. 백엔드(Cloud Functions) 에서 cron 으로 매주 금요일 6PM 푸시

이 영역은 v2.0 일정으로 묶음.

---

## 7. App Check / Firestore Rules 검증 체크리스트

배포 전 확인:
- [ ] Firebase Console → Firestore → 규칙 → "마지막 배포 OK"
- [ ] Firebase Console → App Check → "강제 적용 (Enforce)" ON
- [ ] 시크릿 모드(비로그인) 에서 Firestore 직접 fetch 시 거부 확인
- [ ] 다른 도메인(예: localhost) 에서 빌드 → API call 거부 확인

---

## 일정 권장

| 항목 | 우선순위 | 작업 시간 |
|---|---|---|
| 검색엔진 등록 (3) | 🔥 High | 30분 |
| Firestore 보안 규칙 (2) | 🔥 High | 1시간 |
| 커스텀 도메인 (4) | ⭐ Medium | 1일 (DNS 대기) |
| App Check (1) | ⭐ Medium | 2시간 + 1주 모니터링 |
| 코드 스플리팅 (5) | 💡 Low | 3시간 |
| FCM 푸시 (6) | 🌱 v2 | 1일 + Cloud Functions 셋업 |

문의: it@neotis.co.kr
