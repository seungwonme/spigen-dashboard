import { createClient } from "@/lib/supabase/client";

export interface SummaryData {
  totalRevenue: number;
  totalAdSpend: number;
  roas: number | null;
  totalClicks: number;
  avgCtr: number | null;
  avgBuyBox: number | null;
  dailyTrend: { date: string; revenue: number; adSpend: number }[];
  roasByChannel: { channel: string; roas: number | null; spend: number; sales: number }[];
}

export async function getSummary(dateFrom: string, dateTo: string): Promise<SummaryData> {
  const supabase = createClient();

  const [{ data: orders }, { data: ads }, { data: traffic }] = await Promise.all([
    supabase
      .from("orders")
      .select("purchase_date, item_price, quantity")
      .gte("purchase_date", dateFrom)
      .lte("purchase_date", dateTo),
    supabase
      .from("ad_campaigns")
      .select("date, type, impressions, clicks, cost, sales_14d")
      .gte("date", dateFrom)
      .lte("date", dateTo),
    supabase
      .from("traffic")
      .select("report_date, buy_box_percentage")
      .gte("report_date", dateFrom)
      .lte("report_date", dateTo),
  ]);

  const orderList = orders ?? [];
  const adList = ads ?? [];
  const trafficList = traffic ?? [];

  const totalRevenue = orderList.reduce((s, o) => s + (o.item_price ?? 0) * (o.quantity ?? 0), 0);
  const totalAdSpend = adList.reduce((s, a) => s + (a.cost ?? 0), 0);
  const totalClicks = adList.reduce((s, a) => s + (a.clicks ?? 0), 0);
  const totalImpressions = adList.reduce((s, a) => s + (a.impressions ?? 0), 0);
  const totalAdSales = adList.reduce((s, a) => s + (a.sales_14d ?? 0), 0);
  const avgBuyBox = trafficList.length > 0
    ? trafficList.reduce((s, t) => s + (t.buy_box_percentage ?? 0), 0) / trafficList.length
    : null;

  const dateSet = new Set<string>();
  for (const o of orderList) dateSet.add(o.purchase_date);
  for (const a of adList) dateSet.add(a.date);
  const dailyTrend = Array.from(dateSet).sort().map((date) => {
    const revenue = orderList
      .filter((o) => o.purchase_date === date)
      .reduce((s, o) => s + (o.item_price ?? 0) * (o.quantity ?? 0), 0);
    const adSpend = adList.filter((a) => a.date === date).reduce((s, a) => s + (a.cost ?? 0), 0);
    return { date, revenue, adSpend };
  });

  const byChannel = new Map<string, { spend: number; sales: number }>();
  for (const a of adList) {
    const cur = byChannel.get(a.type) ?? { spend: 0, sales: 0 };
    cur.spend += a.cost ?? 0;
    cur.sales += a.sales_14d ?? 0;
    byChannel.set(a.type, cur);
  }
  const roasByChannel = Array.from(byChannel.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([channel, v]) => ({
      channel,
      spend: v.spend,
      sales: v.sales,
      roas: v.spend > 0 ? Math.round((v.sales / v.spend) * 100) / 100 : null,
    }));

  return {
    totalRevenue,
    totalAdSpend,
    roas: totalAdSpend > 0 ? Math.round((totalAdSales / totalAdSpend) * 100) / 100 : null,
    totalClicks,
    avgCtr: totalImpressions > 0 ? Math.round((totalClicks / totalImpressions) * 10000) / 100 : null,
    avgBuyBox,
    dailyTrend,
    roasByChannel,
  };
}
