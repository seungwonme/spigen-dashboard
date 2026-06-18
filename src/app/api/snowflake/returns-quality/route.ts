import { NextResponse } from "next/server";
import { sfQuery } from "@/lib/snowflake/query";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const blockedInProd = process.env.NODE_ENV === "production";

// FBA 고객 반품 최근 12개월 — 처리상태(귀책)별 수량 + 사유 TOP. customer-comments(PII) 미조회.
const DISP_SQL =
  `SELECT "detailed-disposition" AS disp, SUM(TRY_TO_NUMBER(TO_VARCHAR("quantity"))) AS qty ` +
  `FROM S3.AMAZON_SELLER.FBA_FULFILLMENT_CUSTOMER_RETURNS_DATA ` +
  `WHERE TRY_TO_DATE("return-date") >= DATEADD(month,-12,CURRENT_DATE) ` +
  `GROUP BY 1 ORDER BY 2 DESC NULLS LAST`;

const REASON_SQL =
  `SELECT "reason" AS reason, SUM(TRY_TO_NUMBER(TO_VARCHAR("quantity"))) AS qty ` +
  `FROM S3.AMAZON_SELLER.FBA_FULFILLMENT_CUSTOMER_RETURNS_DATA ` +
  `WHERE TRY_TO_DATE("return-date") >= DATEADD(month,-12,CURRENT_DATE) ` +
  `GROUP BY 1 ORDER BY 2 DESC NULLS LAST LIMIT 8`;

export async function GET() {
  if (blockedInProd) return NextResponse.json({ error: "not found" }, { status: 404 });
  try {
    const [disp, reason] = await Promise.all([
      sfQuery<{ DISP: string; QTY: number }>(DISP_SQL),
      sfQuery<{ REASON: string; QTY: number }>(REASON_SQL),
    ]);
    return NextResponse.json({
      disposition: disp.map((r) => ({ disp: r.DISP ?? "(미상)", qty: Number(r.QTY) || 0 })),
      reason: reason.map((r) => ({ reason: r.REASON ?? "(미기재)", qty: Number(r.QTY) || 0 })),
    });
  } catch (e) {
    console.error("[sf] returns-quality", e);
    return NextResponse.json({ error: "snowflake query failed" }, { status: 500 });
  }
}
