import { google } from "googleapis";

export type SheetRow = Record<string, string>;

const SHEETS_READONLY_SCOPE =
  "https://www.googleapis.com/auth/spreadsheets.readonly";

const DRIVE_READONLY_SCOPE =
  "https://www.googleapis.com/auth/drive.metadata.readonly";

function getRequiredEnv(name: string) {
  const value = process.env[name];
  if (!value || value.includes("여기에_")) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function getAuth() {
  return new google.auth.JWT({
    email: getRequiredEnv("GOOGLE_SERVICE_ACCOUNT_EMAIL"),
    key: getRequiredEnv("GOOGLE_PRIVATE_KEY").replace(/\\n/g, "\n"),
    scopes: [SHEETS_READONLY_SCOPE, DRIVE_READONLY_SCOPE],
  });
}

function getRange(tab: string) {
  const trimmedTab = tab.trim();
  if (!trimmedTab) {
    throw new Error("Sheet tab name is required");
  }

  // 탭 이름만 범위로 주면 해당 탭의 사용 범위 전체를 읽음(컬럼 수 제한 없음).
  // 데이터 탭이 최대 63컬럼이라 A1:Z(26컬럼)로 자르면 광고 탭 등이 잘림.
  const escapedTab = trimmedTab.replace(/'/g, "''");
  return `'${escapedTab}'`;
}

function resolveSpreadsheetId(spreadsheetId?: string) {
  const id = spreadsheetId?.trim();
  return id || getRequiredEnv("SHEET_ID");
}

export async function readSheet(
  tab: string,
  spreadsheetId?: string,
): Promise<SheetRow[]> {
  const sheets = google.sheets({ version: "v4", auth: getAuth() });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: resolveSpreadsheetId(spreadsheetId),
    range: getRange(tab),
  });

  const [headers, ...rows] = res.data.values ?? [];
  if (!headers) return [];

  return rows.map((row) =>
    Object.fromEntries(
      headers.map((h, i) => [String(h), String(row[i] ?? "")]),
    ),
  );
}

export type SpreadsheetInfo = {
  id: string;
  name: string;
  modifiedTime: string;
};

// 서비스 계정에 공유된 스프레드시트 목록(최근 수정순)을 반환한다.
export async function listSpreadsheets(): Promise<SpreadsheetInfo[]> {
  const drive = google.drive({ version: "v3", auth: getAuth() });
  const res = await drive.files.list({
    q: "mimeType='application/vnd.google-apps.spreadsheet' and trashed=false",
    fields: "files(id, name, modifiedTime)",
    orderBy: "modifiedTime desc",
    pageSize: 100,
  });

  return (res.data.files ?? [])
    .filter((file) => Boolean(file.id && file.name))
    .map((file) => ({
      id: file.id as string,
      name: file.name as string,
      modifiedTime: file.modifiedTime ?? "",
    }));
}

// 선택한 스프레드시트의 탭(시트) 이름 목록을 반환한다.
export async function listTabs(spreadsheetId?: string): Promise<string[]> {
  const sheets = google.sheets({ version: "v4", auth: getAuth() });
  const res = await sheets.spreadsheets.get({
    spreadsheetId: resolveSpreadsheetId(spreadsheetId),
    fields: "sheets.properties.title",
  });

  return (res.data.sheets ?? [])
    .map((sheet) => sheet.properties?.title)
    .filter((title): title is string => Boolean(title));
}
