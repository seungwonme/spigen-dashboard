<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Project Notes

- Dev server commands (`pnpm dev` / `next dev`) are deny-listed; the user starts the dev server manually for live verification.
- Gmail 발송: `src/lib/google/gmail.ts` 의 `sendEmail()`, `POST /api/email`. OAuth2 + refresh token 방식. 설정·자격증명 발급은 `docs/GMAIL_SETUP.md` 참고.
- 보안 모델(사내 데이터): 6개 데이터 테이블 RLS는 **authenticated 역할에 SELECT만 허용**. 쓰기/삭제/삽입은 정책이 없어 service_role(서버)로만 가능하다. 가입은 `auth.users` insert 트리거로 `@jocodingax.ai` 도메인만 DB 레벨에서 강제(앱 레이어 `checkDomain`만으로는 anon 키로 Auth API 직접 호출 시 우회됨). 클라이언트는 anon 키로 **읽기만** 한다.
- 데이터 흐름: 대시보드(`src/lib/queries/*`, 모두 `"use client"`)는 **Supabase만 읽는다**(시트 직접 읽기 금지 — quota). 시트→Supabase 적재는 `POST /api/sync` 한 곳에서만: `readAllTabs()`→`dbClearAll()`→탭별 `detectFileType`→`ingest`. 전체 삭제 후 재적재(snapshot) 모델.
  - 쓰기는 service_role(`src/lib/supabase/admin.ts`)로만 수행해 RLS를 우회한다. `db.ts`/`ingest`는 `client` 인자로 admin을 주입받는다. 동기화는 `/api/sync`, 수동 업로드는 `/api/upload`(POST 적재 / DELETE 전체삭제, 둘 다 세션 인증 + admin). 업로드 페이지는 파일 파싱만 브라우저에서 하고 적재는 `/api/upload`로 보낸다(anon 직접 쓰기 금지).
  - 수동 동기화: 헤더의 `SyncSheetButton` → `POST /api/sync`. 자동 스케줄(cron)은 미구현(배포 후 `/api/sync` 호출로 추가 예정, 1시간 주기 희망).
  - 필요한 env(`.env.local`, 읽기 deny): `SUPABASE_SERVICE_ROLE_KEY`, `GOOGLE_SHEETS_SPREADSHEET_IDS`(쉼표구분 8개), `GOOGLE_SHEETS_CLIENT_EMAIL`, `GOOGLE_SHEETS_PRIVATE_KEY`.
  - 시트별 유형 감지/적재 주의: orders·attribution은 소스 충돌키가 비-unique라 append-only insert. listing은 SKU 단위라 asin당 1행 dedupe. traffic 퍼센트 컬럼은 `numeric(10,2)`로 확대됨.
  - 전체 동기화 약 78초 소요 → 서버리스(Vercel) 함수 타임아웃 주의(배포 시 maxDuration 또는 분할/Edge 필요).

파일을 수정할 때마다 깃에 커밋하고 깃허브에 푸시해줘.
