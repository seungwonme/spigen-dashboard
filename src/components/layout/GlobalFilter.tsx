"use client";
import { useEffect, useRef, useState } from "react";
import { useFilterStore, DATE_PRESETS, AdType, CampaignStatus } from "@/store/filter-store";
import { createClient } from "@/lib/supabase/client";

export default function GlobalFilter() {
  const { dateFrom, dateTo, adTypes, campaignStatus, asinQuery,
    setDateRange, toggleAdType, setCampaignStatus, setAsinQuery } = useFilterStore();
  const initialized = useRef(false);
  const [latestDate, setLatestDate] = useState<string | null>(null);

  // DB의 실제 최신 날짜 기준으로 기본 필터 초기화 (최초 1회)
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const supabase = createClient();
    supabase
      .from("orders")
      .select("purchase_date")
      .order("purchase_date", { ascending: false })
      .limit(1)
      .single()
      .then(({ data }) => {
        if (!data?.purchase_date) return;
        setLatestDate(data.purchase_date);
        const to = new Date(data.purchase_date + "T00:00:00Z");
        const from = new Date(to.getTime() - 29 * 86400000);
        setDateRange(from.toISOString().slice(0, 10), to.toISOString().slice(0, 10));
      });
  }, [setDateRange]);

  // 프리셋은 DB 최신 날짜 기준으로 적용 (데이터가 없으면 오늘 기준 fallback)
  function applyPreset(days: number) {
    const base = latestDate ? new Date(latestDate + "T00:00:00Z") : new Date();
    const to = base.toISOString().slice(0, 10);
    const from = days === 0
      ? to
      : new Date(base.getTime() - days * 86400000).toISOString().slice(0, 10);
    setDateRange(from, to);
  }

  const today = new Date().toISOString().slice(0, 10);
  const isStale = latestDate !== null && latestDate < today;

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 text-sm min-w-max">
      {/* 날짜 프리셋 */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-neutral-400 shrink-0">기간</span>
        <div className="flex gap-1">
          {DATE_PRESETS.map(({ label, days }) => (
            <button
              key={label}
              onClick={() => applyPreset(days)}
              className="px-2.5 py-1 rounded text-xs bg-neutral-100 dark:bg-neutral-800 hover:bg-yellow-100 dark:hover:bg-yellow-900 transition-colors"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="w-px h-4 bg-neutral-200 dark:bg-neutral-700 shrink-0" />

      {/* 날짜 직접 입력 */}
      <div className="flex items-center gap-1.5">
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateRange(e.target.value, dateTo)}
          className="border border-neutral-300 dark:border-neutral-600 rounded px-2 py-1 text-xs bg-white dark:bg-neutral-800"
        />
        <span className="text-neutral-400 text-xs">~</span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateRange(dateFrom, e.target.value)}
          className="border border-neutral-300 dark:border-neutral-600 rounded px-2 py-1 text-xs bg-white dark:bg-neutral-800"
        />
        {isStale && (
          <span
            title="DB에 저장된 가장 최근 데이터 날짜"
            className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 text-xs text-amber-600 dark:text-amber-400 whitespace-nowrap cursor-default"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
            최신 {latestDate}
          </span>
        )}
      </div>

      <div className="w-px h-4 bg-neutral-200 dark:bg-neutral-700 shrink-0" />

      {/* 광고 유형 */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-neutral-400 shrink-0">유형</span>
        <div className="flex gap-1">
          {(["SP", "SB", "SD"] as AdType[]).map((t) => (
            <button
              key={t}
              onClick={() => toggleAdType(t)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                adTypes.includes(t)
                  ? "bg-yellow-400 text-neutral-900"
                  : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-700"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="w-px h-4 bg-neutral-200 dark:bg-neutral-700 shrink-0" />

      {/* 캠페인 상태 */}
      <select
        value={campaignStatus}
        onChange={(e) => setCampaignStatus(e.target.value as CampaignStatus)}
        className="border border-neutral-300 dark:border-neutral-600 rounded px-2 py-1 text-xs bg-white dark:bg-neutral-800"
      >
        <option value="ALL">전체 상태</option>
        <option value="ENABLED">ENABLED</option>
        <option value="PAUSED">PAUSED</option>
      </select>

      {/* ASIN 검색 */}
      <input
        type="text"
        placeholder="ASIN / 상품명 검색"
        value={asinQuery}
        onChange={(e) => setAsinQuery(e.target.value)}
        className="border border-neutral-300 dark:border-neutral-600 rounded px-2 py-1 text-xs bg-white dark:bg-neutral-800 w-40"
      />
    </div>
  );
}
