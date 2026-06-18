"use client";
import { useEffect, useState } from "react";

interface RegionRow { region: string; orders: number; }
interface Payload { total: number; rows: RegionRow[]; }

export default function SnowflakeRegionCard() {
  const [data, setData] = useState<Payload | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/snowflake/orders-by-region")
      .then((r) => r.json())
      .then((j) => (j.error ? setErr(j.error) : setData(j)))
      .catch((e) => setErr(String(e)));
  }, []);

  const max = data ? Math.max(...data.rows.map((r) => r.orders), 1) : 1;

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-5">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">지역별 주문수 — Snowflake 직결</h2>
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300">
          회사 데이터창고 · 전체
        </span>
      </div>
      <p className="text-xs text-neutral-400 mb-4">시트 동기화 샘플이 아니라 Snowflake 전체 주문을 실시간 집계합니다.</p>

      {err && <p className="text-sm text-red-500">불러오기 실패: {err}</p>}
      {!data && !err && <p className="text-sm text-neutral-400">Snowflake 조회 중...</p>}

      {data && (
        <>
          <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-50 mb-4">
            {data.total.toLocaleString("ko-KR")}건 <span className="text-sm font-normal text-neutral-400">전체 주문</span>
          </p>
          <div className="space-y-2">
            {data.rows.map((r) => (
              <div key={r.region} className="flex items-center gap-3">
                <span className="w-10 text-xs font-medium text-neutral-600 dark:text-neutral-300">{r.region}</span>
                <div className="flex-1 h-4 bg-neutral-100 dark:bg-neutral-800 rounded">
                  <div className="h-4 bg-sky-500 rounded" style={{ width: `${(r.orders / max) * 100}%` }} />
                </div>
                <span className="w-24 text-right text-xs tabular-nums text-neutral-700 dark:text-neutral-200">
                  {r.orders.toLocaleString("ko-KR")}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
