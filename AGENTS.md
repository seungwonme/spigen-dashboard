<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Project Notes

- Dev server commands (`pnpm dev` / `next dev`) are deny-listed; the user starts the dev server manually for live verification.
- Gmail 발송: `src/lib/google/gmail.ts` 의 `sendEmail()`, `POST /api/email`. OAuth2 + refresh token 방식. 설정·자격증명 발급은 `docs/GMAIL_SETUP.md` 참고.

파일을 수정할 때마다 깃에 커밋하고 깃허브에 푸시해줘.
