import { google } from "googleapis";

// 서버 전용. 서비스 계정으로 스프레드시트의 모든 탭을 읽어
// 탭마다 헤더 기반 객체 배열(Papa/XLSX 파싱 결과와 동일 형태)로 반환한다.

export interface SheetTab {
  tab: string;
  rows: Record<string, string>[];
}

function getAuth() {
  const email = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
  const key = process.env.GOOGLE_SHEETS_PRIVATE_KEY;
  if (!email || !key) {
    throw new Error("GOOGLE_SHEETS_CLIENT_EMAIL / GOOGLE_SHEETS_PRIVATE_KEY 환경변수가 없습니다.");
  }
  return new google.auth.JWT({
    email,
    key: key.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
}

export async function readAllTabs(): Promise<SheetTab[]> {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  if (!spreadsheetId) throw new Error("GOOGLE_SHEETS_SPREADSHEET_ID 환경변수가 없습니다.");

  const sheets = google.sheets({ version: "v4", auth: getAuth() });

  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const titles = (meta.data.sheets ?? [])
    .map((s) => s.properties?.title)
    .filter((t): t is string => !!t);

  // 탭별 전체 범위(전 컬럼)를 한 번에 읽는다. 컬럼을 A:Z로 제한하면
  // SD광고(63컬럼) 등에서 유형 감지에 필요한 헤더가 잘리므로 탭 전체를 읽는다.
  const result = await sheets.spreadsheets.values.batchGet({
    spreadsheetId,
    ranges: titles.map((t) => `'${t.replace(/'/g, "''")}'`),
  });

  const ranges = result.data.valueRanges ?? [];
  return titles.map((tab, i) => {
    const values = ranges[i]?.values ?? [];
    if (values.length < 2) return { tab, rows: [] };
    const headers = (values[0] as string[]).map((h) => String(h ?? ""));
    const rows = values.slice(1).map((row) => {
      const obj: Record<string, string> = {};
      headers.forEach((h, c) => {
        obj[h] = row[c] != null ? String(row[c]) : "";
      });
      return obj;
    });
    return { tab, rows };
  });
}
