import { createClient } from "@/lib/supabase/client";
import { getLatestReportDate } from "@/lib/queries/inventory";

export interface ProductRow {
  asin: string;
  item_name: string;
  price: number;
  afn_fulfillable: number;
  afn_total: number;
  sessions_total: number;
  page_views_total: number;
  buy_box_percentage: number;
  unit_session_percentage: number;
  units_ordered: number;
  revenue: number;
  risk_days: number | null;
}

export interface ProductDetail {
  asin: string;
  item_name: string;
  dailyRevenue: { date: string; revenue: number }[];
  dailyTraffic: { date: string; sessions: number; conversion: number }[];
  campaigns: { type: string; campaign_name: string; cost: number; sales_14d: number; roas: number | null }[];
  inventoryTrend: { report_date: string; afn_fulfillable: number }[];
  countryBreakdown: { ship_country: string; revenue: number; orders: number }[];
}

export async function getProducts(
  dateFrom: string,
  dateTo: string,
  asinQuery?: string,
): Promise<ProductRow[]> {
  const supabase = createClient();
  const reportDate = await getLatestReportDate();

  let listingQuery = supabase.from("listing").select("asin, item_name, price").eq("status", "Active");
  if (asinQuery) listingQuery = listingQuery.ilike("asin", `%${asinQuery}%`);

  const [{ data: listings }, { data: invRows }, { data: trafficRows }, { data: orders }] =
    await Promise.all([
      listingQuery,
      reportDate
        ? supabase.from("inventory").select("asin, afn_fulfillable, afn_total").eq("report_date", reportDate)
        : Promise.resolve({ data: [] }),
      supabase
        .from("traffic")
        .select("child_asin, sessions_total, page_views_total, buy_box_percentage, unit_session_percentage")
        .gte("report_date", dateFrom)
        .lte("report_date", dateTo),
      supabase
        .from("orders")
        .select("asin, quantity, item_price, purchase_date")
        .gte("purchase_date", dateFrom)
        .lte("purchase_date", dateTo),
    ]);

  const invByAsin = new Map((invRows ?? []).map((r) => [r.asin, r]));

  const trafficByAsin = new Map<string, { sessions: number; pageViews: number; bb: number; usp: number; count: number }>();
  for (const r of trafficRows ?? []) {
    let cur = trafficByAsin.get(r.child_asin);
    if (!cur) { cur = { sessions: 0, pageViews: 0, bb: 0, usp: 0, count: 0 }; trafficByAsin.set(r.child_asin, cur); }
    cur.sessions += r.sessions_total ?? 0;
    cur.pageViews += r.page_views_total ?? 0;
    cur.bb += r.buy_box_percentage ?? 0;
    cur.usp += r.unit_session_percentage ?? 0;
    cur.count += 1;
  }

  const ordersByAsin = new Map<string, { units: number; revenue: number; days: Set<string> }>();
  for (const o of orders ?? []) {
    let cur = ordersByAsin.get(o.asin);
    if (!cur) { cur = { units: 0, revenue: 0, days: new Set() }; ordersByAsin.set(o.asin, cur); }
    cur.units += o.quantity ?? 0;
    cur.revenue += (o.item_price ?? 0) * (o.quantity ?? 0);
    cur.days.add(o.purchase_date);
  }

  return (listings ?? [])
    .map((l) => {
      const inv = invByAsin.get(l.asin);
      const tr = trafficByAsin.get(l.asin);
      const ord = ordersByAsin.get(l.asin);
      const dailySales = ord && ord.days.size > 0 ? ord.units / ord.days.size : 0;
      const fulfillable = inv?.afn_fulfillable ?? 0;
      return {
        asin: l.asin,
        item_name: l.item_name ?? "",
        price: l.price ?? 0,
        afn_fulfillable: fulfillable,
        afn_total: inv?.afn_total ?? 0,
        sessions_total: tr && tr.count > 0 ? tr.sessions / tr.count : 0,
        page_views_total: tr && tr.count > 0 ? tr.pageViews / tr.count : 0,
        buy_box_percentage: tr && tr.count > 0 ? tr.bb / tr.count : 0,
        unit_session_percentage: tr && tr.count > 0 ? tr.usp / tr.count : 0,
        units_ordered: ord?.units ?? 0,
        revenue: ord?.revenue ?? 0,
        risk_days: dailySales > 0 ? Math.round(fulfillable / dailySales) : null,
      };
    })
    .sort((a, b) => b.revenue - a.revenue);
}

export async function getProductDetail(
  asin: string,
  dateFrom: string,
  dateTo: string,
): Promise<ProductDetail> {
  const supabase = createClient();

  const [{ data: listing }, { data: orders }, { data: traffic }, { data: ads }, { data: invTrend }] =
    await Promise.all([
      supabase.from("listing").select("item_name").eq("asin", asin).single(),
      supabase
        .from("orders")
        .select("purchase_date, quantity, item_price, ship_country")
        .eq("asin", asin)
        .gte("purchase_date", dateFrom)
        .lte("purchase_date", dateTo),
      supabase
        .from("traffic")
        .select("report_date, sessions_total, unit_session_percentage")
        .eq("child_asin", asin)
        .gte("report_date", dateFrom)
        .lte("report_date", dateTo)
        .order("report_date"),
      supabase
        .from("ad_campaigns")
        .select("type, campaign_name, cost, sales_14d")
        .gte("date", dateFrom)
        .lte("date", dateTo),
      supabase
        .from("inventory")
        .select("report_date, afn_fulfillable")
        .eq("asin", asin)
        .gte("report_date", dateFrom)
        .lte("report_date", dateTo)
        .order("report_date"),
    ]);

  const revByDate = new Map<string, number>();
  for (const o of orders ?? []) {
    revByDate.set(o.purchase_date, (revByDate.get(o.purchase_date) ?? 0) + (o.item_price ?? 0) * (o.quantity ?? 0));
  }
  const dailyRevenue = Array.from(revByDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, revenue]) => ({ date, revenue }));

  const dailyTraffic = (traffic ?? []).map((r) => ({
    date: r.report_date,
    sessions: r.sessions_total ?? 0,
    conversion: r.unit_session_percentage ?? 0,
  }));

  const campMap = new Map<string, { type: string; campaign_name: string; cost: number; sales_14d: number }>();
  for (const r of ads ?? []) {
    const key = `${r.campaign_name}|${r.type}`;
    let cur = campMap.get(key);
    if (!cur) { cur = { type: r.type, campaign_name: r.campaign_name ?? "", cost: 0, sales_14d: 0 }; campMap.set(key, cur); }
    cur.cost += r.cost ?? 0;
    cur.sales_14d += r.sales_14d ?? 0;
  }
  const campaigns = Array.from(campMap.values())
    .map((c) => ({ ...c, roas: c.cost > 0 ? Math.round((c.sales_14d / c.cost) * 100) / 100 : null }))
    .sort((a, b) => b.sales_14d - a.sales_14d)
    .slice(0, 20);

  const countryMap = new Map<string, { revenue: number; orders: number }>();
  for (const o of orders ?? []) {
    let cur = countryMap.get(o.ship_country);
    if (!cur) { cur = { revenue: 0, orders: 0 }; countryMap.set(o.ship_country, cur); }
    cur.revenue += (o.item_price ?? 0) * (o.quantity ?? 0);
    cur.orders += 1;
  }

  return {
    asin,
    item_name: listing?.item_name ?? "",
    dailyRevenue,
    dailyTraffic,
    campaigns,
    inventoryTrend: (invTrend ?? []).map((r) => ({ report_date: r.report_date, afn_fulfillable: r.afn_fulfillable ?? 0 })),
    countryBreakdown: Array.from(countryMap.entries())
      .map(([ship_country, v]) => ({ ship_country, ...v }))
      .sort((a, b) => b.revenue - a.revenue),
  };
}
