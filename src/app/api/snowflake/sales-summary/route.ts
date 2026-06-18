import { NextResponse } from "next/server";
import { sfQuery } from "@/lib/snowflake/query";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 검증된 KRW 환산 로직(02-output/dashboard/gather2.py)을 순수 SQL로 이식.
// ① DT 재적재 dedup(QUALIFY) ② SAP TCURR as-of 환율(ASOF JOIN, JPY/100) ③ KRW은 rate 1.
// 골드 대조: 최근 12개월 합계 ≈ 2,182억 (2025-06~2026-05) 일치 확인됨.
const CTE = `
WITH sales AS (
  SELECT COUNTRY_CODE, CURRENCY_CODE, REPORT_DATE,
         TRY_TO_DOUBLE(TO_VARCHAR(ORDERED_PRODUCT_SALES)) ops
  FROM S3.AMAZON_SELLER.DT_SALES_AND_TRAFFIC_BY_DATE
  QUALIFY ROW_NUMBER() OVER (PARTITION BY COUNTRY_CODE, REPORT_DATE
                             ORDER BY FILE_DATE DESC, LOADED_AT DESC) = 1
),
fx AS (
  SELECT FCURR, TO_DATE(TO_VARCHAR(99999999 - TRY_TO_NUMBER(GDATU)),'YYYYMMDD') fxd,
         CASE WHEN FCURR='JPY' THEN UKURS/100 ELSE UKURS END rate
  FROM S3.SAP.TCURR WHERE KURST='M' AND TCURR='KRW'
    AND FCURR IN ('EUR','GBP','JPY','SGD','INR','SEK','PLN','TRY','USD')
  UNION ALL SELECT 'KRW','1900-01-01'::date, 1
),
sales_fx AS (
  SELECT s.COUNTRY_CODE, s.REPORT_DATE, s.ops, f.rate
  FROM sales s ASOF JOIN fx f MATCH_CONDITION (s.REPORT_DATE >= f.fxd) ON s.CURRENCY_CODE = f.FCURR
),
maxd AS (SELECT MAX(REPORT_DATE) m FROM sales)`;

// 보안 게이트: 인증 우회 라우트라 프로덕션/프리뷰 배포(NODE_ENV=production)에선 404로 차단(매출 노출 방지). 로컬 dev에서만 동작.
const blockedInProd = process.env.NODE_ENV === "production";

export async function GET() {
  if (blockedInProd) return NextResponse.json({ error: "not found" }, { status: 404 });
  try {
    // 완전월만(진행 중인 당월 제외), 최근 13개월(YoY 계산용)
    const monthly = await sfQuery<{ MONTH: string; SALES_KRW: number | null }>(`${CTE}
      SELECT TO_CHAR(DATE_TRUNC('month',REPORT_DATE),'YYYY-MM') MONTH, SUM(ops*rate) SALES_KRW
      FROM sales_fx, maxd
      WHERE REPORT_DATE < DATE_TRUNC('month', maxd.m)
      GROUP BY 1 ORDER BY 1 DESC LIMIT 13`);

    // 최근 완전월 국가별
    const country = await sfQuery<{ CODE: string; SALES_KRW: number | null }>(`${CTE}
      SELECT COUNTRY_CODE CODE, SUM(ops*rate) SALES_KRW
      FROM sales_fx, maxd
      WHERE DATE_TRUNC('month',REPORT_DATE) = DATEADD(month,-1,DATE_TRUNC('month',maxd.m))
      GROUP BY 1 ORDER BY 2 DESC`);

    // 환율 미매칭 통화로 SUM이 NULL인 월/국가는 제외(0으로 강등 시 MoM=Infinity 방지)
    const months = monthly
      .map((r) => ({ month: r.MONTH, salesKrw: r.SALES_KRW == null ? null : Number(r.SALES_KRW) }))
      .filter((r): r is { month: string; salesKrw: number } => r.salesKrw != null && r.salesKrw > 0)
      .reverse(); // 오름차순

    return NextResponse.json({
      lastFullMonth: months.length ? months[months.length - 1].month : null,
      monthly: months,
      country: country
        .map((r) => ({ code: r.CODE, salesKrw: r.SALES_KRW == null ? 0 : Number(r.SALES_KRW) }))
        .filter((r) => r.salesKrw > 0),
    });
  } catch (e) {
    console.error("[sf] sales-summary", e);
    return NextResponse.json({ error: "snowflake query failed" }, { status: 500 });
  }
}
