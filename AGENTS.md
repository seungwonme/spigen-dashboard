<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Project Notes

- Dev server commands (`pnpm dev` / `next dev`) are deny-listed; the user starts the dev server manually for live verification.
- Gmail 발송: `src/lib/google/gmail.ts` 의 `sendEmail()`, `POST /api/email`. OAuth2 + refresh token 방식. 설정·자격증명 발급은 `docs/GMAIL_SETUP.md` 참고.
- 데이터 흐름: 대시보드(`src/lib/queries/*`)는 **Supabase만 읽는다**(시트 직접 읽기 금지 — quota). 시트→Supabase 적재는 `POST /api/sync` 한 곳에서만: `readAllTabs()`→`dbClearAll()`→탭별 `detectFileType`→`ingest`. 전체 삭제 후 재적재(snapshot) 모델.
  - 쓰기는 service_role(`src/lib/supabase/admin.ts`)로 RLS 우회. `db.ts`/`ingest`는 선택적 `client` 인자를 받아 동기화는 admin, 업로드 페이지는 anon.
  - 수동 동기화: 헤더의 `SyncSheetButton` → `POST /api/sync`. 자동 스케줄(cron)은 미구현(배포 후 `/api/sync` 호출로 추가 예정, 1시간 주기 희망).
  - 필요한 env(`.env.local`, 읽기 deny): `SUPABASE_SERVICE_ROLE_KEY`, `GOOGLE_SHEETS_SPREADSHEET_IDS`(쉼표구분 8개), `GOOGLE_SHEETS_CLIENT_EMAIL`, `GOOGLE_SHEETS_PRIVATE_KEY`.
  - 시트별 유형 감지/적재 주의: orders·attribution은 소스 충돌키가 비-unique라 append-only insert. listing은 SKU 단위라 asin당 1행 dedupe. traffic 퍼센트 컬럼은 `numeric(10,2)`로 확대됨.
  - 전체 동기화 약 78초 소요 → 서버리스(Vercel) 함수 타임아웃 주의(배포 시 maxDuration 또는 분할/Edge 필요).

파일을 수정할 때마다 깃에 커밋하고 깃허브에 푸시해줘.
