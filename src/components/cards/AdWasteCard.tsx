"use client";
import { useEffect, useMemo, useState } from "react";

interface Kw { keyword: string; matchType: string; cost: number; sales: number; clicks: number; }
interface Payload { currency: string; periodDays: number; keywords: Kw[]; }

const ROAS_KEY = "spigen-adwaste-target-roas";
const MINCOST_KEY = "spigen-adwaste-min-cost";
const eur = (n: number) => "€" + Math.round(n).toLocaleString("ko-KR");

export default function AdWasteCard() {
  const [data, setData] = useState<Payload | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [targetRoas, setTargetRoas] = useState(2);
  const [minCost, setMinCost] = useState(5);

  useEffect(() => {
    const r = Number(typeof window !== "undefined" ? window.localStorage.getItem(ROAS_KEY) : null);
    const c = Number(typeof window !== "undefined" ? window.localStorage.getItem(MINCOST_KEY) : null);
    if (Number.isFinite(r) && r > 0) setTargetRoas(r);
    if (Number.isFinite(c) && c >= 0) setMinCost(c);
    fetch("/api/snowflake/ad-waste")
      .then((res) => res.json())
      .then((j) => (j.error ? setErr(j.error) : setData(j)))
      .catch((e) => setErr(String(e)));
  }, []);

  function setRoas(v: number) {
    setTargetRoas(v);
    if (typeof window !== "undefined") window.localStorage.setItem(ROAS_KEY, String(v));
  }
  function setMin(v: number) {
    setMinCost(v);
    if (typeof window !== "undefined") window.localStorage.setItem(MINCOST_KEY, String(v));
  }

  const calc = useMemo(() => {
    if (!data) return null;
    const ks = data.keywords;
    const totalCost = ks.reduce((s, k) => s + k.cost, 0);
    const totalSales = ks.reduce((s, k) => s + k.sales, 0);
    const wasted = ks
      .filter((k) => k.cost >= minCost && k.cost > 0 && k.sales / k.cost < targetRoas)
      .sort((a, b) => b.cost - a.cost);
    const wastedCost = wasted.reduce((s, k) => s + k.cost, 0);
    return {
      totalCost,
      overallRoas: totalCost > 0 ? totalSales / totalCost : 0,
      wastedCost,
      wastedCount: wasted.length,
      wastedShare: totalCost > 0 ? (wastedCost / totalCost) * 100 : 0,
      top: wasted.slice(0, 8),
    };
  }, [data, targetRoas, minCost]);

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-5">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">낭비 광고비 회수기 — 키워드 단위 (DE · 최근 90일)</h2>
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300">
          Snowflake 직결 · 내 기준 결합
        </span>
      </div>
      <p className="text-xs text-neutral-400 mb-4">목표 ROAS·최소 광고비를 내가 정하면, 미달 키워드에 새는 광고비가 실시간 집계됩니다(입찰 재검토·네거티브 후보).</p>

      {err && <p className="text-sm text-red-500">불러오기 실패: {err}</p>}
      {!data && !err && <p className="text-sm text-neutral-400">Snowflake 조회 중...</p>}

      {data && calc && (
        <>
          <div className="flex flex-wrap items-end gap-x-8 gap-y-4 mb-5">
            <div>
              <p className="text-xs text-neutral-400 mb-1">새는 광고비 (회수 후보)</p>
              <p className="text-4xl font-bold tabular-nums text-rose-600">{eur(calc.wastedCost)}</p>
            </div>
            <div className="text-sm space-y-0.5">
              <p className="text-neutral-700 dark:text-neutral-200">대상 키워드 <b>{calc.wastedCount}개</b> · 전체 광고비의 <b>{calc.wastedShare.toFixed(0)}%</b></p>
              <p className="text-neutral-500 dark:text-neutral-400">전체 광고비 {eur(calc.totalCost)} · 통합 ROAS {calc.overallRoas.toFixed(2)}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-6 mb-5">
            <label className="text-xs text-neutral-500 dark:text-neutral-400">
              목표 ROAS: <b className="text-neutral-800 dark:text-neutral-100">{targetRoas.toFixed(1)}</b>
              <input type="range" min={1} max={5} step={0.5} value={targetRoas} onChange={(e) => setRoas(Number(e.target.value))} className="block w-44 mt-1 accent-sky-500" />
            </label>
            <label className="text-xs text-neutral-500 dark:text-neutral-400">
              최소 광고비: <b className="text-neutral-800 dark:text-neutral-100">€{minCost}</b>
              <input type="range" min={0} max={50} step={5} value={minCost} onChange={(e) => setMin(Number(e.target.value))} className="block w-44 mt-1 accent-sky-500" />
            </label>
          </div>

          <h3 className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-2">새는 광고비 상위 키워드</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-neutral-400 border-b border-neutral-200 dark:border-neutral-700">
                  <th className="text-left font-medium py-1.5">키워드</th>
                  <th className="text-right font-medium">광고비</th>
                  <th className="text-right font-medium">매출</th>
                  <th className="text-right font-medium">ROAS</th>
                </tr>
              </thead>
              <tbody>
                {calc.top.map((k) => (
                  <tr key={k.keyword + k.matchType} className="border-b border-neutral-100 dark:border-neutral-800">
                    <td className="py-1.5 text-neutral-700 dark:text-neutral-200 truncate max-w-[200px]">{k.keyword} <span className="text-neutral-400">· {k.matchType}</span></td>
                    <td className="text-right tabular-nums text-rose-600">{eur(k.cost)}</td>
                    <td className="text-right tabular-nums text-neutral-500">{eur(k.sales)}</td>
                    <td className="text-right tabular-nums text-neutral-700 dark:text-neutral-200">{(k.cost > 0 ? k.sales / k.cost : 0).toFixed(2)}</td>
                  </tr>
                ))}
                {calc.top.length === 0 && (
                  <tr><td colSpan={4} className="py-3 text-center text-neutral-400">현재 기준에 걸리는 키워드 없음</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
