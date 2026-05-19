import { getTable } from "@/lib/local-store";

export interface InventorySummary {
  totalSkus: number;
  outOfStockSkus: number;
  inboundSkus: number;
}

export interface InventoryRow {
  sku: string;
  asin: string;
  product_name: string;
  your_price: number;
  afn_fulfillable: number;
  afn_reserved: number;
  afn_inbound_total: number;
  afn_total: number;
  status: string;
  risk_days: number | null;
  risk_level: "ok" | "warning" | "danger";
}

interface InventoryStored {
  report_date: string; sku: string; asin: string; product_name: string; your_price: number;
  afn_fulfillable: number; afn_reserved: number; afn_inbound_total: number; afn_total: number;
}
interface ListingStored { asin: string; status: string }
interface OrderStored { purchase_date: string; asin: string; quantity: number }

function addDays(date: string, days: number): string {
  const d = new Date(date + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function getInventorySummary(reportDate: string): InventorySummary {
  const rows = getTable<InventoryStored>("inventory").filter((r) => r.report_date === reportDate);
  return {
    totalSkus: rows.length,
    outOfStockSkus: rows.filter((r) => (r.afn_fulfillable ?? 0) === 0).length,
    inboundSkus: rows.filter((r) => (r.afn_inbound_total ?? 0) > 0).length,
  };
}

export function getInventory(reportDate: string, asin?: string): InventoryRow[] {
  const invAll = getTable<InventoryStored>("inventory").filter((r) => r.report_date === reportDate);
  const inv = asin ? invAll.filter((r) => r.asin === asin) : invAll;
  const listings = getTable<ListingStored>("listing");
  const listingByAsin = new Map(listings.map((l) => [l.asin, l]));

  // daily_sales: 최근 7일 (reportDate 기준 -7일 ~ reportDate) 평균 주문수량
  const from = addDays(reportDate, -7);
  const orders = getTable<OrderStored>("orders").filter(
    (o) => o.purchase_date >= from && o.purchase_date <= reportDate,
  );
  const dailySalesByAsin = new Map<string, number>();
  const qtyByAsin = new Map<string, number>();
  for (const o of orders) {
    qtyByAsin.set(o.asin, (qtyByAsin.get(o.asin) ?? 0) + (o.quantity ?? 0));
  }
  for (const [a, qty] of qtyByAsin) dailySalesByAsin.set(a, qty / 7);

  const result: InventoryRow[] = inv.map((r) => {
    const ds = dailySalesByAsin.get(r.asin) ?? 0;
    const riskDays = ds > 0 ? Math.round((r.afn_fulfillable ?? 0) / ds) : null;
    const riskLevel: "ok" | "warning" | "danger" =
      (r.afn_fulfillable ?? 0) === 0 ? "danger"
      : riskDays !== null && riskDays < 14 ? "warning"
      : "ok";
    return {
      sku: r.sku,
      asin: r.asin ?? "",
      product_name: r.product_name ?? "",
      your_price: r.your_price ?? 0,
      afn_fulfillable: r.afn_fulfillable ?? 0,
      afn_reserved: r.afn_reserved ?? 0,
      afn_inbound_total: r.afn_inbound_total ?? 0,
      afn_total: r.afn_total ?? 0,
      status: listingByAsin.get(r.asin)?.status ?? "",
      risk_days: riskDays,
      risk_level: riskLevel,
    };
  });

  result.sort((a, b) => a.afn_fulfillable - b.afn_fulfillable);
  return result;
}

export function getLatestReportDate(): string | null {
  const rows = getTable<InventoryStored>("inventory");
  if (rows.length === 0) return null;
  let max = rows[0].report_date;
  for (const r of rows) if (r.report_date > max) max = r.report_date;
  return max;
}
