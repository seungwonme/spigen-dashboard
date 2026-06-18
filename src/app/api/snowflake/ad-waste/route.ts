import { NextResponse } from "next/server";
import { sfQuery } from "@/lib/snowflake/query";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// SP 광고 키워드 단위 최근 90일 집계(DE). 소문자·하이픈 컬럼 큰따옴표 필수.
// ROAS는 행별 AVG 금지 → 클라에서 SUM(sales)/SUM(cost). 낭비 임계는 사용자가 카드에서 조절.
const SQL =
  `SELECT "keyword" AS keyword, "matchType" AS match_type, ` +
  `SUM(TRY_TO_DOUBLE(TO_VARCHAR("cost"))) AS cost, ` +
  `SUM(TRY_TO_DOUBLE(TO_VARCHAR("sales7d"))) AS sales, ` +
  `SUM(TRY_TO_DOUBLE(TO_VARCHAR("clicks"))) AS clicks ` +
  `FROM S3.AMAZON_ADS.SPTARGETING ` +
  `WHERE COUNTRY_CODE='DE' AND "date" >= DATEADD(day,-90,CURRENT_DATE) ` +
  `GROUP BY 1,2 HAVING SUM(TRY_TO_DOUBLE(TO_VARCHAR("cost"))) > 1 ` +
  `ORDER BY cost DESC LIMIT 600`;

export async function GET() {
  try {
    const rows = await sfQuery<{ KEYWORD: string; MATCH_TYPE: string; COST: number; SALES: number; CLICKS: number }>(SQL);
    const keywords = rows.map((r) => ({
      keyword: r.KEYWORD,
      matchType: r.MATCH_TYPE,
      cost: Number(r.COST) || 0,
      sales: Number(r.SALES) || 0,
      clicks: Number(r.CLICKS) || 0,
    }));
    return NextResponse.json({ currency: "EUR", periodDays: 90, keywords });
  } catch (e) {
    console.error("[sf] ad-waste", e);
    return NextResponse.json({ error: "snowflake query failed" }, { status: 500 });
  }
}
