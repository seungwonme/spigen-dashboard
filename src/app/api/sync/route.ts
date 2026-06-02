import { NextResponse } from "next/server";
import { readAllTabs } from "@/lib/sheets/server";
import { detectFileType } from "@/lib/parsers/detect-type";
import { ingest } from "@/lib/parsers/ingest";
import { dbClearAll } from "@/lib/supabase/db";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// 시트 → Supabase 동기화. 시트를 단일 소스로 삼아 기존 데이터를 비우고 다시 채운다.
// 쓰기는 service_role(admin) 클라이언트로 수행해 RLS를 우회한다.
export async function POST() {
  // 로그인 세션 보호. (향후 cron 트리거 시 CRON_SECRET 헤더 분기를 여기에 추가)
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    const tabs = await readAllTabs();
    await dbClearAll(admin);

    let inserted = 0;
    const failed: string[] = [];
    for (const { tab, rows } of tabs) {
      if (rows.length === 0) continue;
      const type = detectFileType(Object.keys(rows[0]));
      if (!type) {
        failed.push(`${tab}(유형 감지 실패)`);
        continue;
      }
      const r = await ingest(type, rows, admin);
      if (r.error) failed.push(`${tab}(${r.error})`);
      else inserted += r.inserted;
    }

    return NextResponse.json({
      inserted,
      failed,
      syncedAt: new Date().toISOString(),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
