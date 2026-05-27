import { createClient } from "@/lib/supabase/client";
import { getLatestReportDate } from "@/lib/queries/inventory";

// 재고 상태 분류 (우선순위: deadstock > stockout > overstock > low > healthy)
export type StockStatus =
  | "deadstock" // 기간 내 무판매 + 재고 보유 → 자본 묶임
  | "stockout" // 가용재고 0인데 판매 중 → 기회손실
  | "overstock" // 재고일수 > 180일 → 자본 과투입
  | "low" // 재고일수 < 30일 → 재발주 필요
  | "healthy"; // 정상 회전

export interface WorkingCapitalRow {
  sku: string;
  asin: string;
  product_name: string;
  your_price: number;
  afn_fulfillable: number;
  afn_total: number;
  asset_value: number; // your_price × afn_total (소매가 기준)
  units_period: number; // 적재 기간 판매량 (traffic)
  daily_sales: number;
  days_of_cover: number | null; // 가용재고 ÷ 일판매 (무판매 시 null)
  status: StockStatus;
}

export interface CapitalBucket {
  key: StockStatus;
  label: string;
  skus: number;
  value: number; // 묶인 자본 (EUR, 소매가)
  units: number;
}

export interface WorkingCapitalSummary {
  totalAssetValue: number; // Σ price × afn_total
  fulfillableValue: number; // Σ price × afn_fulfillable (즉시 판매가능 자본)
  inboundValue: number; // Σ price × afn_inbound_total (입고 예정 투입 자본)
  deadStockValue: number;
  deadStockSkus: number;
  deadStockUnits: number;
  totalSkus: number;
  totalUnits: number; // Σ afn_total
  deadStockShare: number | null; // 데드스톡 SKU 비중 (%)
  turnover: number | null; // 연환산 재고회전율 (소매가 기준)
  periodDays: number; // 판매속도 산정에 쓴 트래픽 일수
  buckets: CapitalBucket[];
}

export interface WorkingCapitalData {
  reportDate: string;
  summary: WorkingCapitalSummary;
  rows: WorkingCapitalRow[];
}

const BUCKET_ORDER: { key: StockStatus; label: string }[] = [
  { key: "deadstock", label: "데드스톡 (무판매)" },
  { key: "overstock", label: "과잉 (>180일)" },
  { key: "healthy", label: "정상 (30–180일)" },
  { key: "low", label: "임박 (<30일)" },
  { key: "stockout", label: "품절 (가용 0)" },
];

export async function getWorkingCapital(): Promise<WorkingCapitalData | null> {
  const supabase = createClient();
  const reportDate = await getLatestReportDate();
  if (!reportDate) return null;

  const [{ data: invRows }, { data: trafficRows }] = await Promise.all([
    supabase
      .from("inventory")
      .select(
        "sku, asin, product_name, your_price, afn_fulfillable, afn_reserved, afn_inbound_total, afn_total",
      )
      .eq("report_date", reportDate),
    // 판매속도는 적재된 트래픽 전체를 신뢰 소스로 사용 (BUSINESS_INSIGHT.md 기준)
    supabase
      .from("traffic")
      .select("report_date, child_asin, units_ordered, ordered_product_sales"),
  ]);

  // 트래픽 집계: 적재 일수 + ASIN별 판매량 + 전체 판매액(소매가)
  const days = new Set<string>();
  const unitsByAsin = new Map<string, number>();
  let totalPeriodSales = 0;
  for (const t of trafficRows ?? []) {
    if (t.report_date) days.add(t.report_date);
    unitsByAsin.set(
      t.child_asin,
      (unitsByAsin.get(t.child_asin) ?? 0) + (t.units_ordered ?? 0),
    );
    totalPeriodSales += t.ordered_product_sales ?? 0;
  }
  const periodDays = Math.max(days.size, 1);

  const rows: WorkingCapitalRow[] = (invRows ?? [])
    .map((r) => {
      const price = r.your_price ?? 0;
      const afnTotal = r.afn_total ?? 0;
      const fulfillable = r.afn_fulfillable ?? 0;
      const unitsPeriod = unitsByAsin.get(r.asin) ?? 0;
      const dailySales = unitsPeriod / periodDays;
      const assetValue = price * afnTotal;
      const doc = dailySales > 0 ? Math.round(fulfillable / dailySales) : null;

      let status: StockStatus;
      if (unitsPeriod === 0 && afnTotal > 0) status = "deadstock";
      else if (fulfillable === 0) status = "stockout";
      else if (doc !== null && doc > 180) status = "overstock";
      else if (doc !== null && doc < 30) status = "low";
      else status = "healthy";

      return {
        sku: r.sku,
        asin: r.asin ?? "",
        product_name: r.product_name ?? "",
        your_price: price,
        afn_fulfillable: fulfillable,
        afn_total: afnTotal,
        asset_value: assetValue,
        units_period: unitsPeriod,
        daily_sales: dailySales,
        days_of_cover: doc,
        status,
      };
    })
    .sort((a, b) => b.asset_value - a.asset_value);

  // 요약 집계
  let totalAssetValue = 0;
  let fulfillableValue = 0;
  let inboundValue = 0;
  let totalUnits = 0;
  let deadStockValue = 0;
  let deadStockUnits = 0;
  let deadStockSkus = 0;

  const bucketMap = new Map<StockStatus, CapitalBucket>(
    BUCKET_ORDER.map((b) => [b.key, { ...b, skus: 0, value: 0, units: 0 }]),
  );

  // 입고중 재고는 row에 없으므로 SKU → 입고량 맵으로 조회
  const inboundBySku = new Map(
    (invRows ?? []).map((r) => [r.sku, r.afn_inbound_total ?? 0]),
  );

  for (const row of rows) {
    totalAssetValue += row.asset_value;
    fulfillableValue += row.your_price * row.afn_fulfillable;
    inboundValue += row.your_price * (inboundBySku.get(row.sku) ?? 0);
    totalUnits += row.afn_total;

    if (row.status === "deadstock") {
      deadStockValue += row.asset_value;
      deadStockUnits += row.afn_total;
      deadStockSkus += 1;
    }

    const bucket = bucketMap.get(row.status);
    if (bucket) {
      bucket.skus += 1;
      bucket.value += row.asset_value;
      bucket.units += row.afn_total;
    }
  }

  const totalSkus = rows.length;
  const annualizedSales = totalPeriodSales * (365 / periodDays);
  const turnover =
    totalAssetValue > 0 ? annualizedSales / totalAssetValue : null;
  const deadStockShare = totalSkus > 0 ? (deadStockSkus / totalSkus) * 100 : null;

  return {
    reportDate,
    summary: {
      totalAssetValue,
      fulfillableValue,
      inboundValue,
      deadStockValue,
      deadStockSkus,
      deadStockUnits,
      totalSkus,
      totalUnits,
      deadStockShare,
      turnover,
      periodDays,
      buckets: BUCKET_ORDER.map((b) => bucketMap.get(b.key)!),
    },
    rows,
  };
}
