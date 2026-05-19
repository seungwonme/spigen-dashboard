import { createClient } from "@/lib/supabase/client";

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

function addDays(date: string, days: number): string {
  const d = new Date(date + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export async function getLatestReportDate(): Promise<string | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("inventory")
    .select("report_date")
    .order("report_date", { ascending: false })
    .limit(1)
    .single();
  return data?.report_date ?? null;
}

export async function getInventorySummary(reportDate: string): Promise<InventorySummary> {
  const supabase = createClient();
  const { data } = await supabase
    .from("inventory")
    .select("afn_fulfillable, afn_inbound_total")
    .eq("report_date", reportDate);

  const rows = data ?? [];
  return {
    totalSkus: rows.length,
    outOfStockSkus: rows.filter((r) => (r.afn_fulfillable ?? 0) === 0).length,
    inboundSkus: rows.filter((r) => (r.afn_inbound_total ?? 0) > 0).length,
  };
}

export async function getInventory(reportDate: string, asin?: string): Promise<InventoryRow[]> {
  const supabase = createClient();

  let invQuery = supabase
    .from("inventory")
    .select("sku, asin, product_name, your_price, afn_fulfillable, afn_reserved, afn_inbound_total, afn_total")
    .eq("report_date", reportDate);
  if (asin) invQuery = invQuery.ilike("asin", `%${asin}%`);

  const from7 = addDays(reportDate, -7);
  const [{ data: invRows }, { data: listings }, { data: orders }] = await Promise.all([
    invQuery,
    supabase.from("listing").select("asin, status"),
    supabase
      .from("orders")
      .select("asin, quantity")
      .gte("purchase_date", from7)
      .lte("purchase_date", reportDate),
  ]);

  const listingByAsin = new Map((listings ?? []).map((l) => [l.asin, l]));
  const qtyByAsin = new Map<string, number>();
  for (const o of orders ?? []) {
    qtyByAsin.set(o.asin, (qtyByAsin.get(o.asin) ?? 0) + (o.quantity ?? 0));
  }

  return (invRows ?? [])
    .map((r) => {
      const ds = (qtyByAsin.get(r.asin) ?? 0) / 7;
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
    })
    .sort((a, b) => a.afn_fulfillable - b.afn_fulfillable);
}
