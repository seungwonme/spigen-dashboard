import { FileType } from "./detect-type";
import { parseSpRow } from "./sp-campaigns";
import { parseSbRow } from "./sb-campaigns";
import { parseSdRow } from "./sd-campaigns";
import { parseAttributionRow } from "./attribution";
import { parseOrderRow } from "./orders";
import { parseListingRow } from "./listing";
import { parseInventoryRow } from "./inventory";
import { parseTrafficRow } from "./traffic";
import type { SupabaseClient } from "@supabase/supabase-js";
import { dbUpsert } from "@/lib/supabase/db";

export const TYPE_LABELS: Record<string, string> = {
  sp: "SP Campaigns",
  sb: "SB Campaigns",
  sd: "SD Campaigns",
  attribution: "Attribution",
  orders: "Orders",
  listing: "Listing",
  inventory: "Inventory",
  traffic: "Traffic",
};

// 감지된 파일 유형별로 parser → Supabase upsert. CSV/XLSX 업로드와 시트 동기화가 공유한다.
// client 미지정 시 anon(업로드 페이지), 서버 동기화는 admin 클라이언트를 주입한다.
export async function ingest(
  type: FileType,
  rawRows: Record<string, unknown>[],
  client?: SupabaseClient,
): Promise<{ inserted: number; skipped: number; error?: string }> {
  if (type === "sp") {
    const rows = rawRows
      .map((r) => parseSpRow(r))
      .filter((r): r is NonNullable<typeof r> => !!r)
      .map((r) => ({ ...r, type: "SP", cost_type: "CPC", new_to_brand_sales: 0, new_to_brand_purchases: 0 }));
    const skipped = rawRows.length - rows.length;
    const { inserted, error } = await dbUpsert("ad_campaigns", rows as unknown as Record<string, unknown>[], client);
    return { inserted, skipped, error };
  }
  if (type === "sb") {
    const rows = rawRows
      .map((r) => parseSbRow(r))
      .filter((r): r is NonNullable<typeof r> => !!r)
      .map((r) => ({ ...r, type: "SB" }));
    const skipped = rawRows.length - rows.length;
    const { inserted, error } = await dbUpsert("ad_campaigns", rows as unknown as Record<string, unknown>[], client);
    return { inserted, skipped, error };
  }
  if (type === "sd") {
    const rows = rawRows
      .map((r) => parseSdRow(r))
      .filter((r): r is NonNullable<typeof r> => !!r)
      .map((r) => ({ ...r, type: "SD", budget_type: "" }));
    const skipped = rawRows.length - rows.length;
    const { inserted, error } = await dbUpsert("ad_campaigns", rows as unknown as Record<string, unknown>[], client);
    return { inserted, skipped, error };
  }
  if (type === "attribution") {
    const rows = rawRows.map((r) => parseAttributionRow(r)).filter((r): r is NonNullable<typeof r> => !!r);
    const skipped = rawRows.length - rows.length;
    const { inserted, error } = await dbUpsert("attribution", rows as unknown as Record<string, unknown>[], client);
    return { inserted, skipped, error };
  }
  if (type === "orders") {
    const rows = rawRows.map((r) => parseOrderRow(r)).filter((r): r is NonNullable<typeof r> => !!r);
    const skipped = rawRows.length - rows.length;
    const { inserted, error } = await dbUpsert("orders", rows as unknown as Record<string, unknown>[], client);
    return { inserted, skipped, error };
  }
  if (type === "listing") {
    const rows = rawRows.map((r) => parseListingRow(r)).filter((r): r is NonNullable<typeof r> => !!r);
    const skipped = rawRows.length - rows.length;
    const { inserted, error } = await dbUpsert("listing", rows as unknown as Record<string, unknown>[], client);
    return { inserted, skipped, error };
  }
  if (type === "inventory") {
    const rows = rawRows.map((r) => parseInventoryRow(r)).filter((r): r is NonNullable<typeof r> => !!r);
    const skipped = rawRows.length - rows.length;
    const { inserted, error } = await dbUpsert("inventory", rows as unknown as Record<string, unknown>[], client);
    return { inserted, skipped, error };
  }
  if (type === "traffic") {
    const rows = rawRows.map((r) => parseTrafficRow(r)).filter((r): r is NonNullable<typeof r> => !!r);
    const skipped = rawRows.length - rows.length;
    const { inserted, error } = await dbUpsert("traffic", rows as unknown as Record<string, unknown>[], client);
    return { inserted, skipped, error };
  }
  return { inserted: 0, skipped: rawRows.length };
}
