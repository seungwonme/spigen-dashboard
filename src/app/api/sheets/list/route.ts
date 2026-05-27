import { listSpreadsheets } from "@/lib/sheets";

// Route Handler는 Next 15+에서 기본적으로 캐시되지 않음(요청마다 실행).
// 기존 /api/sheets 라우트와 동일하게 동적 렌더링을 강제하고 Node 런타임을 쓴다
// (googleapis JWT 인증은 Node 런타임 필요).
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const sheets = await listSpreadsheets();
    return Response.json({ sheets });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return Response.json({ error: msg }, { status: 500 });
  }
}
