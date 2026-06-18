import { NextResponse } from "next/server";
import { sfQuery } from "@/lib/snowflake/query";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const blockedInProd = process.env.NODE_ENV === "production";

// 아마존 권장조치별 '예상 회수액'(estimated-cost-savings). 다통화 → SAP TCURR as-of KRW 환산(JPY/100).
// 최신 스냅샷만(QUALIFY), savings 'None'/0 제외. 검증: 총 ≈11.8억 KRW.
const SQL = `
WITH fx AS (
  SELECT FCURR, TO_DATE(TO_VARCHAR(99999999-TRY_TO_NUMBER(GDATU)),'YYYYMMDD') fxd,
    CASE WHEN FCURR='JPY' THEN UKURS/100 ELSE UKURS END rate
  FROM S3.SAP.TCURR WHERE KURST='M' AND TCURR='KRW'
    AND FCURR IN ('EUR','GBP','JPY','SGD','INR','SEK','PLN','TRY','USD')
  UNION ALL SELECT 'KRW','1900-01-01'::date,1
),
plan AS (
  SELECT "recommended-action" action, "currency" cur, TRY_TO_DATE("snapshot-date") sdate,
    TRY_TO_DOUBLE(TO_VARCHAR("estimated-cost-savings-of-recommended-actions")) savings
  FROM (SELECT * FROM S3.AMAZON_SELLER.FBA_INVENTORY_PLANNING_DATA
        QUALIFY "snapshot-date" = MAX("snapshot-date") OVER (PARTITION BY BRAND_NAME, COUNTRY_CODE))
  WHERE "recommended-action" IS NOT NULL AND "recommended-action" <> 'None'
),
plan_fx AS (
  SELECT p.action, p.savings, f.rate
  FROM plan p ASOF JOIN fx f MATCH_CONDITION (p.sdate >= f.fxd) ON p.cur = f.FCURR
  WHERE p.savings > 0
)
SELECT action AS action, SUM(savings*rate) AS krw, COUNT(*) AS skus
FROM plan_fx GROUP BY 1 ORDER BY 2 DESC NULLS LAST`;

export async function GET() {
  if (blockedInProd) return NextResponse.json({ error: "not found" }, { status: 404 });
  try {
    const rows = await sfQuery<{ ACTION: string; KRW: number; SKUS: number }>(SQL);
    const actions = rows
      .map((r) => ({ action: r.ACTION, krw: Number(r.KRW) || 0, skus: Number(r.SKUS) || 0 }))
      .filter((r) => r.krw > 0);
    return NextResponse.json({ actions });
  } catch (e) {
    console.error("[sf] recovery-savings", e);
    return NextResponse.json({ error: "snowflake query failed" }, { status: 500 });
  }
}
