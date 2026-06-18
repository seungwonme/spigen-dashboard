"use client";
import { useEffect, useMemo, useState } from "react";

interface ActionRow { action: string; krw: number; skus: number; }
interface Payload { actions: ActionRow[]; }

const SEL_KEY = "spigen-recovery-deselected"; // 해제한 액션 저장
const EOK = 1e8;
const fmtEok = (krw: number) => (krw / EOK).toLocaleString("ko-KR", { maximumFractionDigits: 2 });

// 영문 권장조치 → 비개발자용 한글
const LABEL: Record<string, string> = {
  "Advertise listing": "광고 노출 늘리기",
  "Edit listing": "리스팅 수정",
  "NoRestockExcessActionRequired": "과잉재고 입고중단",
  "Lower price": "가격 인하",
  "Create removal order": "재고 제거(반출)",
  "Create Outlet deal": "아웃렛 딜",
  "NoExcessInventory": "과잉 없음",
  "Improve keywords": "키워드 개선",
  "CreateShippingPlan": "입고 계획 생성",
  "GoToRestock": "재입고",
};
const label = (a: string) => LABEL[a] ?? a;

export default function RecoverySavingsCard() {
  const [data, setData] = useState<Payload | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [off, setOff] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const saved = typeof window !== "undefined" ? window.localStorage.getItem(SEL_KEY) : null;
      if (saved) setOff(new Set(JSON.parse(saved)));
    } catch {}
    fetch("/api/snowflake/recovery-savings")
      .then((r) => r.json())
      .then((j) => (j.error ? setErr(j.error) : setData(j)))
      .catch((e) => setErr(String(e)));
  }, []);

  function toggle(action: string) {
    setOff((prev) => {
      const next = new Set(prev);
      next.has(action) ? next.delete(action) : next.add(action);
      if (typeof window !== "undefined") window.localStorage.setItem(SEL_KEY, JSON.stringify([...next]));
      return next;
    });
  }

  const calc = useMemo(() => {
    if (!data) return null;
    const total = data.actions.reduce((s, a) => s + a.krw, 0);
    const selected = data.actions.filter((a) => !off.has(a.action)).reduce((s, a) => s + a.krw, 0);
    const max = Math.max(...data.actions.map((a) => a.krw), 1);
    return { total, selected, max };
  }, [data, off]);

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-5">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">회수 가능 금액 — 아마존 권장조치별 (KRW 환산)</h2>
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300">Snowflake 직결 · 내 회수 목표</span>
      </div>
      <p className="text-xs text-neutral-400 mb-4">아마존이 추정한 조치별 회수액(다통화→원화). 실행할 액션만 체크하면 '이번 분기 회수 목표'가 합산됩니다.</p>

      {err && <p className="text-sm text-red-500">불러오기 실패: {err}</p>}
      {!data && !err && <p className="text-sm text-neutral-400">Snowflake 조회 중...</p>}

      {data && calc && (
        <>
          <div className="flex flex-wrap items-end gap-x-8 gap-y-3 mb-5">
            <div>
              <p className="text-xs text-neutral-400 mb-1">선택한 회수 목표</p>
              <p className="text-4xl font-bold tabular-nums text-emerald-600">{fmtEok(calc.selected)}억</p>
            </div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">전체 권장 합계 {fmtEok(calc.total)}억 · <span className="text-neutral-400">아마존 추정·권장(정산 확정 아님)</span></p>
          </div>

          <div className="space-y-1.5">
            {data.actions.map((a) => {
              const on = !off.has(a.action);
              return (
                <label key={a.action} className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={on} onChange={() => toggle(a.action)} className="accent-emerald-500" />
                  <span className={`w-32 text-xs truncate ${on ? "text-neutral-700 dark:text-neutral-200" : "text-neutral-400 line-through"}`}>{label(a.action)}</span>
                  <div className="flex-1 h-3.5 bg-neutral-100 dark:bg-neutral-800 rounded">
                    <div className="h-3.5 rounded" style={{ width: `${(a.krw / calc.max) * 100}%`, backgroundColor: on ? "#10b981" : "#d1d5db" }} />
                  </div>
                  <span className="w-20 text-right text-xs tabular-nums text-neutral-700 dark:text-neutral-200">{fmtEok(a.krw)}억</span>
                  <span className="w-16 text-right text-[11px] tabular-nums text-neutral-400">{a.skus.toLocaleString("ko-KR")} SKU</span>
                </label>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
