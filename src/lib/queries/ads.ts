import { createClient } from "@/lib/supabase/client";

export interface ChannelRow {
  type: string;
  cost_type: string;
  impressions: number;
  clicks: number;
  ctr: number | null;
  cost: number;
  sales_14d: number;
  roas: number | null;
  cpc: number | null;
  new_to_brand_sales: number;
}

export interface CampaignRow {
  campaign_id: string;
  campaign_name: string;
  type: string;
  status: string;
  budget_amount: number;
  budget_type: string;
  cost: number;
  sales_14d: number;
  roas: number | null;
  clicks: number;
  top_of_search_impression_share: number | null;
}

export interface AttributionRow {
  product_asin: string;
  product_name: string;
  publisher: string;
  attributed_sales_14d: number;
  attributed_purchases_14d: number;
  brand_halo_sales_14d: number;
  new_to_brand_sales_14d: number;
  new_to_brand_purchases_14d: number;
}

export async function getChannelComparison(
  dateFrom: string,
  dateTo: string,
  types: string[],
): Promise<ChannelRow[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("ad_campaigns")
    .select("type, cost_type, impressions, clicks, cost, sales_14d, new_to_brand_sales")
    .in("type", types)
    .gte("date", dateFrom)
    .lte("date", dateTo);

  const grouped = new Map<string, ChannelRow>();
  for (const r of data ?? []) {
    const key = `${r.type}|${r.cost_type ?? ""}`;
    let cur = grouped.get(key);
    if (!cur) {
      cur = {
        type: r.type, cost_type: r.cost_type ?? "",
        impressions: 0, clicks: 0, ctr: null,
        cost: 0, sales_14d: 0, roas: null, cpc: null,
        new_to_brand_sales: 0,
      };
      grouped.set(key, cur);
    }
    cur.impressions += r.impressions ?? 0;
    cur.clicks += r.clicks ?? 0;
    cur.cost += r.cost ?? 0;
    cur.sales_14d += r.sales_14d ?? 0;
    cur.new_to_brand_sales += r.new_to_brand_sales ?? 0;
  }

  return Array.from(grouped.values())
    .map((c) => ({
      ...c,
      ctr: c.impressions > 0 ? Math.round((c.clicks / c.impressions) * 10000) / 100 : null,
      roas: c.cost > 0 ? Math.round((c.sales_14d / c.cost) * 100) / 100 : null,
      cpc: c.clicks > 0 ? Math.round((c.cost / c.clicks) * 100) / 100 : null,
    }))
    .sort((a, b) => a.type.localeCompare(b.type) || a.cost_type.localeCompare(b.cost_type));
}

export async function getCampaigns(
  dateFrom: string,
  dateTo: string,
  types: string[],
  status?: string,
): Promise<CampaignRow[]> {
  const supabase = createClient();
  let query = supabase
    .from("ad_campaigns")
    .select("campaign_id, campaign_name, type, status, budget_amount, budget_type, cost, sales_14d, clicks, top_of_search_impression_share")
    .in("type", types)
    .gte("date", dateFrom)
    .lte("date", dateTo);

  if (status && status !== "ALL") query = query.eq("status", status);

  const { data } = await query;

  type AdRow = { campaign_id: string; campaign_name: string; type: string; status: string; budget_amount: number; budget_type: string; cost: number; sales_14d: number; clicks: number; top_of_search_impression_share: number | null };
  const grouped = new Map<string, {
    base: AdRow; cost: number; sales: number; clicks: number; tosSum: number; tosCount: number;
  }>();

  for (const r of data ?? []) {
    let cur = grouped.get(r.campaign_id);
    if (!cur) cur = { base: r, cost: 0, sales: 0, clicks: 0, tosSum: 0, tosCount: 0 };
    grouped.set(r.campaign_id, cur);
    cur.cost += r.cost ?? 0;
    cur.sales += r.sales_14d ?? 0;
    cur.clicks += r.clicks ?? 0;
    if (typeof r.top_of_search_impression_share === "number") {
      cur.tosSum += r.top_of_search_impression_share;
      cur.tosCount += 1;
    }
  }

  return Array.from(grouped.entries())
    .map(([campaign_id, v]) => ({
      campaign_id,
      campaign_name: v.base.campaign_name ?? "",
      type: v.base.type,
      status: v.base.status ?? "",
      budget_amount: v.base.budget_amount ?? 0,
      budget_type: v.base.budget_type ?? "",
      cost: v.cost,
      sales_14d: v.sales,
      roas: v.cost > 0 ? Math.round((v.sales / v.cost) * 100) / 100 : null,
      clicks: v.clicks,
      top_of_search_impression_share: v.tosCount > 0 ? v.tosSum / v.tosCount : null,
    }))
    .sort((a, b) => {
      if (a.roas === null && b.roas === null) return 0;
      if (a.roas === null) return 1;
      if (b.roas === null) return -1;
      return b.roas - a.roas;
    });
}

export async function getAttributionByAsin(
  dateFrom: string,
  dateTo: string,
): Promise<AttributionRow[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("attribution")
    .select("product_asin, product_name, publisher, attributed_sales_14d, attributed_purchases_14d, brand_halo_sales_14d, new_to_brand_sales_14d, new_to_brand_purchases_14d")
    .gte("date", dateFrom)
    .lte("date", dateTo);

  const grouped = new Map<string, AttributionRow>();
  for (const r of data ?? []) {
    const key = `${r.product_asin}|${r.publisher}`;
    let cur = grouped.get(key);
    if (!cur) {
      cur = {
        product_asin: r.product_asin,
        product_name: r.product_name ?? "",
        publisher: r.publisher ?? "",
        attributed_sales_14d: 0,
        attributed_purchases_14d: 0,
        brand_halo_sales_14d: 0,
        new_to_brand_sales_14d: 0,
        new_to_brand_purchases_14d: 0,
      };
      grouped.set(key, cur);
    }
    cur.attributed_sales_14d += r.attributed_sales_14d ?? 0;
    cur.attributed_purchases_14d += r.attributed_purchases_14d ?? 0;
    cur.brand_halo_sales_14d += r.brand_halo_sales_14d ?? 0;
    cur.new_to_brand_sales_14d += r.new_to_brand_sales_14d ?? 0;
    cur.new_to_brand_purchases_14d += r.new_to_brand_purchases_14d ?? 0;
  }

  return Array.from(grouped.values()).sort((a, b) => b.attributed_sales_14d - a.attributed_sales_14d);
}
