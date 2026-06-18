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

export async function GET() {
  try {
    // 완전월만(진행 중인 당월 제외), 최근 13개월(YoY 계산용)
    const monthly = await sfQuery<{ MONTH: string; SALES_KRW: number }>(`${CTE}
      SELECT TO_CHAR(DATE_TRUNC('month',REPORT_DATE),'YYYY-MM') MONTH, SUM(ops*rate) SALES_KRW
      FROM sales_fx, maxd
      WHERE REPORT_DATE < DATE_TRUNC('month', maxd.m)
      GROUP BY 1 ORDER BY 1 DESC LIMIT 13`);

    // 최근 완전월 국가별
    const country = await sfQuery<{ CODE: string; SALES_KRW: number }>(`${CTE}
      SELECT COUNTRY_CODE CODE, SUM(ops*rate) SALES_KRW
      FROM sales_fx, maxd
      WHERE DATE_TRUNC('month',REPORT_DATE) = DATEADD(month,-1,DATE_TRUNC('month',maxd.m))
      GROUP BY 1 ORDER BY 2 DESC`);

    const months = monthly
      .map((r) => ({ month: r.MONTH, salesKrw: Number(r.SALES_KRW) }))
      .reverse(); // 오름차순

    return NextResponse.json({
      lastFullMonth: months.length ? months[months.length - 1].month : null,
      monthly: months,
      country: country.map((r) => ({ code: r.CODE, salesKrw: Number(r.SALES_KRW) })),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "snowflake query failed" },
      { status: 500 },
    );
  }
}
