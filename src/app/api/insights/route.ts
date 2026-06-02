import { type NextRequest, NextResponse } from "next/server";
import { generateDailyInsight, type InsightInput } from "@/lib/gemini";

/**
 * POST /api/insights
 *
 * 대시보드가 계산한 summary 지표를 받아 Gemini 로 데일리 인사이트를 생성한다.
 * API 키는 이 서버 라우트(@/lib/gemini, server-only)에서만 사용되며 클라이언트로 노출되지 않는다.
 * middleware 로 보호된다(로그인 세션 필요).
 *
 * Body(JSON): InsightInput (dateFrom, dateTo, totalRevenue, ... roasByChannel)
 */
export async function POST(request: NextRequest) {
  let body: InsightInput;
  try {
    body = (await request.json()) as InsightInput;
  } catch {
    return NextResponse.json({ ok: false, error: "JSON 본문이 필요합니다." }, { status: 400 });
  }

  if (!body?.dateFrom || !body?.dateTo) {
    return NextResponse.json(
      { ok: false, error: "dateFrom, dateTo 가 필요합니다." },
      { status: 400 }
    );
  }

  try {
    const insight = await generateDailyInsight(body);
    return NextResponse.json({ ok: true, insight });
  } catch (e) {
    const message = e instanceof Error ? e.message : "인사이트 생성에 실패했습니다.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
