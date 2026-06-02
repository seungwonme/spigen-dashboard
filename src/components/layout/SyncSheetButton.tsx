"use client";

import { useState } from "react";

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
      // 서버가 시트를 읽고 service_role로 Supabase를 갱신한다.
      const res = await fetch("/api/sync", { method: "POST", cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "동기화 실패");

      const failed: string[] = json.failed ?? [];
      if (failed.length > 0) setError(`일부 탭 실패: ${failed.join(", ")}`);
      setMsg(`${(json.inserted ?? 0).toLocaleString()}건 동기화 완료`);

      // 쿼리들이 새 데이터를 읽도록 새로고침.
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
