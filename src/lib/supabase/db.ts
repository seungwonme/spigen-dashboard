import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

const CHUNK = 500;

type ConflictConfig = {
  table: string;
  onConflict?: string;
  appendOnly?: boolean;
};

const CONFIG: Record<string, ConflictConfig> = {
  ad_campaigns: { table: "ad_campaigns", onConflict: "date,type,campaign_id" },
  attribution:  { table: "attribution",  onConflict: "date,campaign_id,product_asin,publisher" },
  listing:      { table: "listing",      onConflict: "asin" },
  inventory:    { table: "inventory",    onConflict: "report_date,sku" },
  traffic:      { table: "traffic",      onConflict: "report_date,child_asin" },
  orders:       { table: "orders",       onConflict: "order_id" },
};

// client 미지정 시 브라우저 anon 클라이언트(업로드 페이지 등). 서버 동기화는
// service_role admin 클라이언트를 주입해 RLS를 우회한다.
export async function dbUpsert(
  name: keyof typeof CONFIG,
  rows: Record<string, unknown>[],
  client?: SupabaseClient,
): Promise<{ inserted: number; error?: string }> {
  if (rows.length === 0) return { inserted: 0 };
  const cfg = CONFIG[name];
  const supabase = client ?? createClient();

  let total = 0;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const { error, count } = cfg.appendOnly
      ? await supabase.from(cfg.table).insert(chunk, { count: "exact" })
      : await supabase.from(cfg.table).upsert(chunk, {
          onConflict: cfg.onConflict,
          count: "exact",
        });
    if (error) return { inserted: total, error: error.message };
    total += count ?? chunk.length;
  }
  return { inserted: total };
}

export async function dbClearAll(client?: SupabaseClient): Promise<void> {
  const supabase = client ?? createClient();
  const tables = ["ad_campaigns", "attribution", "orders", "listing", "inventory", "traffic"];
  await Promise.all(tables.map((t) => supabase.from(t).delete().neq("id", 0)));
}
