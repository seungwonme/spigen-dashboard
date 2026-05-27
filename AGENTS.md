<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Project Notes

- Google Sheets integration lives in `src/lib/sheets.ts`, `src/app/api/sheets/route.ts`, `src/app/api/sheets/list/route.ts`, `src/app/api/sheets/tabs/route.ts`, and `src/app/sheets/page.tsx`.
- Keep `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`, and `SHEET_ID` server-only in `.env.local`; never expose them with `NEXT_PUBLIC_`. The code treats a `여기에_`-prefixed value as unset.
- The Sheets API routes intentionally use the Node.js runtime because `googleapis` is a Node package.
- `readSheet(tab, spreadsheetId?)` reads the tab's full used range (range = quoted tab name, no `A1:Z` column cap) so wide tabs (up to 63 cols) aren't truncated. `spreadsheetId` falls back to env `SHEET_ID` when omitted.
- `listSpreadsheets()` (`GET /api/sheets/list`) lists spreadsheets shared with the service account via the Drive API. This needs the `drive.metadata.readonly` scope (in `getAuth`) and the **Drive API enabled** on GCP project `spigen-497602`. A service account only sees sheets explicitly shared with it.
- `listTabs(spreadsheetId?)` (`GET /api/sheets/tabs?spreadsheetId=`) lists a spreadsheet's tab titles. The `/sheets` page chains these: pick a spreadsheet (list) → pick a tab (tabs) → read rows — passing `spreadsheetId` explicitly so it works even when `SHEET_ID` is unset.
- Gmail sending lives in `src/lib/gmail.ts` and `src/app/api/gmail/send/route.ts` (`POST /api/gmail/send`, JSON body `{ to, subject, html|text, cc?, bcc?, from?, replyTo? }`).
- `sendMail()` reuses the same `google.auth.JWT` service-account pattern as `sheets.ts` but adds `subject` (domain-wide delegation target) and the `gmail.send` scope. The impersonated/From address comes from env `GMAIL_SENDER` (override per-call with `from`). Same Node.js runtime requirement as the Sheets routes.
- DWD prerequisites (code alone is insufficient): the SA client ID must be authorized for the `gmail.send` scope in **Workspace Admin Console → Security → API controls → Domain-wide delegation**, the Gmail API must be **enabled on GCP project `spigen-497602`**, and `GMAIL_SENDER` must be a user in that Workspace domain (e.g. `contact@demodev.io`). Personal Gmail (`@gmail.com`) cannot be a DWD target.
- Subjects are RFC 2047-encoded and bodies are base64 (UTF-8) so non-ASCII (Korean) doesn't break.
- Dev server commands (`pnpm dev` / `next dev`) are deny-listed; the user starts the dev server manually for live verification.

파일을 수정할 때마다 깃에 커밋하고 깃허브에 푸시해줘.
