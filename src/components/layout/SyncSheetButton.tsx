"use client";

import { useState } from "react";
import { detectFileType } from "@/lib/parsers/detect-type";
import { ingest } from "@/lib/parsers/ingest";
import { dbClearAll } from "@/lib/supabase/db";

interface SheetTab {
  tab: string;
  rows: Record<string, string>[];
}

export default function SyncSheetButton() {
  const [syncing, setSyncing] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSync() {
    if (syncing) return;
    setSyncing(true);
    setMsg(null);
    setError(null);

    try {
      // 1. 시트의 모든 탭을 라이브로 읽는다 (서버가 서비스 계정으로 접근).
      const res = await fetch("/api/sheets", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "시트 읽기 실패");
      const tabs: SheetTab[] = json.tabs ?? [];

      // 2. 시트를 단일 소스로 삼아 기존 데이터를 비우고 다시 채운다.
      await dbClearAll();

      // 3. 탭마다 유형 감지 → 기존 parser/upsert 재사용.
      let inserted = 0;
      const failed: string[] = [];
      for (const { tab, rows } of tabs) {
        if (rows.length === 0) continue;
        const type = detectFileType(Object.keys(rows[0]));
        if (!type) {
          failed.push(`${tab}(유형 감지 실패)`);
          continue;
        }
        const r = await ingest(type, rows);
        if (r.error) failed.push(`${tab}(${r.error})`);
        else inserted += r.inserted;
      }

      if (failed.length > 0) setError(`일부 탭 실패: ${failed.join(", ")}`);
      setMsg(`${inserted.toLocaleString()}건 동기화 완료`);

      // 4. 쿼리들이 새 데이터를 읽도록 새로고침.
      setTimeout(() => window.location.reload(), 600);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {error && <span className="text-xs text-red-500 max-w-[200px] truncate" title={error}>{error}</span>}
      {!error && msg && <span className="text-xs text-green-600">{msg}</span>}
      <button
        onClick={handleSync}
        disabled={syncing}
        className="text-xs px-3 py-1.5 rounded-md bg-yellow-400 text-neutral-900 font-medium hover:bg-yellow-300 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        title="구글 시트의 모든 탭을 읽어 대시보드 데이터를 갱신합니다"
      >
        {syncing ? "동기화 중..." : "시트에서 동기화"}
      </button>
    </div>
  );
}
