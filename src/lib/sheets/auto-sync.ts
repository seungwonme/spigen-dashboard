import { readAllTabs } from "./server";
import { detectFileType } from "@/lib/parsers/detect-type";
import { ingest } from "@/lib/parsers/ingest";
import { dbClearAll } from "@/lib/supabase/db";

// TTL 캐시 — 서버 인스턴스가 살아있는 동안 60초마다 최대 1회 동기화
let lastSyncAt = 0;
const SYNC_TTL_MS = 60_000;

// 진행 중인 싱크가 있으면 같은 Promise를 반환해 중복 실행을 막는다.
let syncPromise: Promise<void> | null = null;

export async function autoSync(): Promise<void> {
  if (Date.now() - lastSyncAt < SYNC_TTL_MS) return;
  if (syncPromise) return syncPromise;

  syncPromise = (async () => {
    try {
      lastSyncAt = Date.now();
      const tabs = await readAllTabs();
      await dbClearAll();
      for (const { tab, rows } of tabs) {
        if (rows.length === 0) continue;
        const type = detectFileType(Object.keys(rows[0]));
        if (!type) continue;
        await ingest(type, rows).catch((e) =>
          console.warn(`[auto-sync] ${tab} 실패:`, e),
        );
      }
    } finally {
      syncPromise = null;
    }
  })();

  return syncPromise;
}
