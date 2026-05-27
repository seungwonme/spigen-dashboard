import { readSheet } from "@/lib/sheets";
import type { NextRequest } from "next/server";

// Route Handler는 Next 15+에서 기본적으로 캐시되지 않음(요청마다 실행).
// Cache Components(cacheComponents 플래그)가 꺼져 있는 이 프로젝트에서는
// 명시적으로 동적 렌더링을 강제해 새로고침마다 최신 시트를 반영한다.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const tab = request.nextUrl.searchParams.get("tab")?.trim() || "주문";
  const spreadsheetId =
    request.nextUrl.searchParams.get("spreadsheetId")?.trim() || undefined;

  try {
    const rows = await readSheet(tab, spreadsheetId);
    return Response.json({ tab, rows, count: rows.length });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return Response.json({ error: msg }, { status: 500 });
  }
}
