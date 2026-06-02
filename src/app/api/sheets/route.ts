import { NextResponse } from "next/server";
import { readAllTabs } from "@/lib/sheets/server";

// 항상 시트 최신 상태를 읽도록 캐시 비활성화.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const tabs = await readAllTabs();
    return NextResponse.json(
      { tabs },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
