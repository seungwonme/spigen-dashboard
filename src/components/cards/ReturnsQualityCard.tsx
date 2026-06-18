"use client";
import { useEffect, useMemo, useState } from "react";

interface Row { disp?: string; reason?: string; qty: number; }
interface Payload { disposition: { disp: string; qty: number }[]; reason: { reason: string; qty: number }[]; }

// 처리상태 → 귀책 그룹 + 액션
const GROUP: Record<string, { label: string; color: string }> = {
  SELLABLE: { label: "재판매 가능 (손실 없음)", color: "#16a34a" },
  DEFECTIVE: { label: "제품 결함 (품질·공급 개선)", color: "#dc2626" },
  DAMAGED: { label: "제품 손상 (품질·공급 개선)", color: "#ef4444" },
  CUSTOMER_DAMAGED: { label: "고객 손상", color: "#f59e0b" },
  CARRIER_DAMAGED: { label: "배송사 손상 (클레임 대상)", color: "#8b5cf6" },
};
const groupOf = (d: string) => GROUP[d] ?? { label: d || "기타", color: "#9ca3af" };
const num = (n: number) => n.toLocaleString("ko-KR");

export default function ReturnsQualityCard() {
  const [data, setData] = useState<Payload | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/snowflake/returns-quality")
      .then((r) => r.json())
      .then((j) => (j.error ? setErr(j.error) : setData(j)))
      .catch((e) => setErr(String(e)));
  }, []);

  const calc = useMemo(() => {
    if (!data) return null;
    const total = data.disposition.reduce((s, r) => s + r.qty, 0);
    const sellable = data.disposition.find((r) => r.disp === "SELLABLE")?.qty ?? 0;
    const groups = data.disposition.map((r) => ({ ...groupOf(r.disp), qty: r.qty })).sort((a, b) => b.qty - a.qty);
    const maxR = Math.max(...data.reason.map((r) => r.qty), 1);
    return { total, sellable, resaleRate: total > 0 ? (sellable / total) * 100 : 0, loss: total - sellable, groups, maxR };
  }, [data]);

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-5">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">반품 품질·귀책 분석 (최근 12개월)</h2>
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300">Snowflake 직결</span>
      </div>
      <p className="text-xs text-neutral-400 mb-4">반품이 우리 품질 문제인지·고객/배송 귀책인지 갈라, 재판매 가능률과 개선·클레임 대상을 봅니다.</p>

      {err && <p className="text-sm text-red-500">불러오기 실패: {err}</p>}
      {!data && !err && <p className="text-sm text-neutral-400">Snowflake 조회 중...</p>}

      {data && calc && (
        <>
          <div className="flex flex-wrap items-end gap-x-8 gap-y-3 mb-5">
            <div>
              <p className="text-xs text-neutral-400 mb-1">재판매 가능률</p>
              <p className="text-4xl font-bold tabular-nums text-emerald-600">{calc.resaleRate.toFixed(0)}%</p>
            </div>
            <div className="text-sm space-y-0.5">
              <p className="text-neutral-700 dark:text-neutral-200">반품 총 <b>{num(calc.total)}</b>개 · 재판매 불가 <b className="text-rose-600">{num(calc.loss)}</b>개</p>
              <p className="text-neutral-500 dark:text-neutral-400">결함·손상은 품질 개선, 배송사 손상은 환급 클레임 대상</p>
            </div>
          </div>

          <h3 className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-2">귀책별 수량</h3>
          <div className="space-y-1.5 mb-5">
            {calc.groups.map((g, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-44 text-xs text-neutral-600 dark:text-neutral-300 truncate">{g.label}</span>
                <div className="flex-1 h-3.5 bg-neutral-100 dark:bg-neutral-800 rounded">
                  <div className="h-3.5 rounded" style={{ width: `${(g.qty / calc.total) * 100}%`, backgroundColor: g.color }} />
                </div>
                <span className="w-16 text-right text-xs tabular-nums text-neutral-700 dark:text-neutral-200">{num(g.qty)}</span>
              </div>
            ))}
          </div>

          <h3 className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-2">반품 사유 TOP</h3>
          <div className="space-y-1">
            {data.reason.map((r, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-44 text-xs text-neutral-600 dark:text-neutral-300 truncate">{r.reason}</span>
                <div className="flex-1 h-3 bg-neutral-100 dark:bg-neutral-800 rounded">
                  <div className="h-3 bg-amber-400 rounded" style={{ width: `${(r.qty / calc.maxR) * 100}%` }} />
                </div>
                <span className="w-16 text-right text-xs tabular-nums text-neutral-500">{num(r.qty)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
