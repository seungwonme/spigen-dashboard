# Gmail API 메일 발송 설정

슈피겐 대시보드에서 Gmail API 로 메일을 보내는 기능. 인증은 **OAuth2 + refresh token** 방식.

- 발송 모듈: `src/lib/google/gmail.ts` → `sendEmail()`
- API 라우트: `POST /api/email` (`src/app/api/email/route.ts`, middleware 로그인 보호됨)
- 토큰 발급 스크립트: `scripts/get-gmail-token.mjs`
- GCP 프로젝트: `spigen-dashboard` (jocodingax.ai org 산하)
- 기본 발신: `sw.an@jocodingax.ai`

Gmail API 는 이미 활성화되어 있다 (`gcloud services enable gmail.googleapis.com`, 완료).

## 1회 설정 (3단계)

### 1) OAuth consent screen 을 Internal 로 구성

프로젝트가 jocodingax.ai org 산하라 **Internal** 로 만들 수 있다. Internal 이면 Google 앱 검증이 필요 없고 **refresh token 이 만료되지 않는다**.

1. https://console.cloud.google.com/auth/overview?project=spigen-dashboard 접속
2. 아직 구성 전이면 "시작하기"
   - User Type: **Internal**
   - 앱 이름: `Spigen Dashboard`, 지원 이메일: `sw.an@jocodingax.ai`

### 2) OAuth 클라이언트 생성 (Desktop)

1. https://console.cloud.google.com/auth/clients?project=spigen-dashboard
2. "클라이언트 만들기"
   - 애플리케이션 유형: **데스크톱 앱**
   - 이름: `Spigen Gmail CLI`
3. 생성 후 **클라이언트 ID** 와 **클라이언트 보안 비밀번호** 를 복사

> gcloud 로 OAuth 클라이언트를 만들 수 없는 이유: IAP OAuth Admin API 가 2026-03-19 종료되어 콘솔에서만 생성 가능.

### 3) .env.local 채우고 refresh token 발급

`.env.local` 에 아래 값을 넣는다 (이미 placeholder 가 들어가 있으면 값만 채운다):

```
GMAIL_SENDER=sw.an@jocodingax.ai
GMAIL_CLIENT_ID=<위에서 복사한 클라이언트 ID>
GMAIL_CLIENT_SECRET=<위에서 복사한 보안 비밀번호>
```

그다음 토큰 발급 스크립트를 실행한다:

```bash
node scripts/get-gmail-token.mjs
```

브라우저가 열리면 `sw.an@jocodingax.ai` 로 동의한다. 완료되면 `GMAIL_REFRESH_TOKEN` 이 `.env.local` 에 자동 추가된다.

## 사용법

### 코드에서 직접

```ts
import { sendEmail } from "@/lib/google/gmail";

await sendEmail({
  to: "someone@example.com",
  subject: "테스트 메일",
  html: "<p>안녕하세요</p>",
});
```

### API 라우트로 (대시보드 로그인 세션 필요)

```bash
curl -X POST http://localhost:3000/api/email \
  -H "Content-Type: application/json" \
  -b "<로그인 쿠키>" \
  -d '{"to":"someone@example.com","subject":"테스트","text":"본문"}'
```

| 필드      | 타입               | 필수                     |
| --------- | ------------------ | ------------------------ |
| `to`      | string \| string[] | O                        |
| `subject` | string             | O                        |
| `text`    | string             | text/html 중 하나        |
| `html`    | string             | text/html 중 하나        |
| `cc`      | string \| string[] |                          |
| `bcc`     | string \| string[] |                          |
| `from`    | string             | 미지정 시 `GMAIL_SENDER` |
| `replyTo` | string             |                          |

## 보안 메모

- `.env.local` 의 자격증명은 **절대 커밋 금지** (`.gitignore` 의 `.env*` 로 보호됨).
- 키 노출 사고 이력: `docs/SECURITY-incident-gcp-key.md` 참고.
- API 라우트는 middleware 로 보호되어 로그인 세션 없이는 호출 불가.
