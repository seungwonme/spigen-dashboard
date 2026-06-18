import { NextResponse } from "next/server";
import { sfQuery } from "@/lib/snowflake/query";

export const runtime = "nodejs"; // snowflake-sdk는 node 전용 (edge 불가)
export const dynamic = "force-dynamic"; // 라이브 데이터, 캐시 금지

// 안전 집계만(COUNT). 사용자 입력 없음 → 인젝션 없음. PII·매출금액 미조회.
const SQL =
  "SELECT COUNTRY_CODE AS region, COUNT(*) AS orders " +
  "FROM S3.AMAZON_SELLER.FLAT_FILE_ALL_ORDERS_DATA_BY_ORDER_DATE_GENERAL " +
  "GROUP BY 1 ORDER BY 2 DESC LIMIT 10";

export async function GET() {
  try {
    const rows = await sfQuery<{ REGION: string; ORDERS: number }>(SQL);
    const data = rows.map((r) => ({ region: r.REGION, orders: Number(r.ORDERS) }));
    const total = data.reduce((s, r) => s + r.orders, 0);
    return NextResponse.json({ total, rows: data });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "snowflake query failed" },
      { status: 500 },
    );
  }
}
