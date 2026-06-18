import { NextResponse } from "next/server";
import { sfQuery } from "@/lib/snowflake/query";

export const runtime = "nodejs"; // snowflake-sdk는 node 전용 (edge 불가)
export const dynamic = "force-dynamic"; // 라이브 데이터, 캐시 금지

// 보안 게이트: 인증 우회 라우트라 프로덕션/프리뷰 배포(NODE_ENV=production)에선 404로 차단(매출·주문 노출 방지). 로컬 dev에서만 동작.
const blockedInProd = process.env.NODE_ENV === "production";

// 정확한 주문 수: COUNT(DISTINCT "amazon-order-id") + SPIGEN 브랜드 + 취소 제외 + item-price 존재.
// COUNT(*)는 라인아이템×스냅샷 재적재라 ~19% 과대(SPEC 주문수 레시피). 소문자·하이픈 컬럼 큰따옴표 필수.
const SQL =
  `SELECT COUNTRY_CODE AS region, COUNT(DISTINCT "amazon-order-id") AS orders ` +
  `FROM S3.AMAZON_SELLER.FLAT_FILE_ALL_ORDERS_DATA_BY_ORDER_DATE_GENERAL ` +
  `WHERE BRAND_NAME='SPIGEN' AND "order-status" <> 'Cancelled' AND "item-price" IS NOT NULL ` +
  `GROUP BY 1 ORDER BY 2 DESC LIMIT 10`;

export async function GET() {
  if (blockedInProd) return NextResponse.json({ error: "not found" }, { status: 404 });
  try {
    const rows = await sfQuery<{ REGION: string; ORDERS: number }>(SQL);
    const data = rows.map((r) => ({ region: r.REGION, orders: Number(r.ORDERS) }));
    const total = data.reduce((s, r) => s + r.orders, 0);
    return NextResponse.json({ total, rows: data });
  } catch (e) {
    console.error("[sf] orders-by-region", e);
    return NextResponse.json({ error: "snowflake query failed" }, { status: 500 });
  }
}
