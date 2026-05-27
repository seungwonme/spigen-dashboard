import { listTabs } from "@/lib/sheets";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const spreadsheetId =
    request.nextUrl.searchParams.get("spreadsheetId")?.trim() || undefined;

  try {
    const tabs = await listTabs(spreadsheetId);
    return Response.json({ tabs });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return Response.json({ error: msg }, { status: 500 });
  }
}
