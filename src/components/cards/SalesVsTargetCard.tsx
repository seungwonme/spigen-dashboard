"use client";
import { useEffect, useMemo, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Cell,
} from "recharts";

interface MonthRow { month: string; salesKrw: number; }
interface CountryRow { code: string; salesKrw: number; }
interface Payload { lastFullMonth: string | null; monthly: MonthRow[]; country: CountryRow[]; }

const EOK = 1e8;
const TARGET_KEY = "spigen-sales-target-eok";
const fmtEok = (krw: number) => (krw / EOK).toLocaleString("ko-KR", { maximumFractionDigits: 1 });

export default function SalesVsTargetCard() {
  const [data, setData] = useState<Payload | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [target, setTarget] = useState<number>(180); // 억원, 내가 입력하는 사업계획 목표

  useEffect(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem(TARGET_KEY) : null;
    if (saved) setTarget(Number(saved));
    fetch("/api/snowflake/sales-summary")
      .then((r) => r.json())
      .then((j) => (j.error ? setErr(j.error) : setData(j)))
      .catch((e) => setErr(String(e)));
  }, []);

  function updateTarget(v: number) {
    setTarget(v);
    if (typeof window !== "undefined") window.localStorage.setItem(TARGET_KEY, String(v));
  }

  const calc = useMemo(() => {
    if (!data || data.monthly.length === 0) return null;
    const m = data.monthly;
    const last = m[m.length - 1];
    const prev = m[m.length - 2];
    const yoy = m[m.length - 13]; // 13개월이면 첫 항목
    const actualEok = last.salesKrw / EOK;
    return {
      month: last.month,
      actualEok,
      achievement: target > 0 ? (actualEok / target) * 100 : null,
      gapEok: actualEok - target,
      mom: prev ? (last.salesKrw / prev.salesKrw - 1) * 100 : null,
      yoy: yoy ? (last.salesKrw / yoy.salesKrw - 1) * 100 : null,
    };
  }, [data, target]);

  const chartData = useMemo(
    () => (data?.monthly ?? []).map((r) => ({ month: r.month.slice(2), eok: Math.round(r.salesKrw / EOK) })),
    [data],
  );

  const achColor = (a: number | null) =>
    a == null ? "#9ca3af" : a >= 100 ? "#16a34a" : a >= 80 ? "#f59e0b" : "#dc2626";

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-5">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">
          목표 대비 실적 — 회사 전체 매출 (정확 KRW 환산)
        </h2>
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300">
          Snowflake 직결 · 내 목표 결합
        </span>
      </div>
      <p className="text-xs text-neutral-400 mb-4">
        Snowflake 전체 실적(통화 정규화·중복 제거)에 내가 세운 목표를 합쳐 달성률을 봅니다.
      </p>

      {err && <p className="text-sm text-red-500">불러오기 실패: {err}</p>}
      {!data && !err && <p className="text-sm text-neutral-400">Snowflake 조회 중...</p>}

      {data && calc && (
        <>
          <div className="flex flex-wrap items-end gap-x-8 gap-y-4 mb-5">
            {/* 달성률 */}
            <div>
              <p className="text-xs text-neutral-400 mb-1">{calc.month} 달성률</p>
              <p className="text-4xl font-bold tabular-nums" style={{ color: achColor(calc.achievement) }}>
                {calc.achievement != null ? `${calc.achievement.toFixed(0)}%` : "—"}
              </p>
            </div>
            {/* 실적 / 목표 / 갭 */}
            <div className="text-sm space-y-0.5">
              <p className="text-neutral-700 dark:text-neutral-200">
                실적 <b>{fmtEok(calc.actualEok * EOK)}억</b> · 목표 <b>{target.toLocaleString("ko-KR")}억</b>
              </p>
              <p className={calc.gapEok >= 0 ? "text-emerald-600" : "text-rose-600"}>
                갭 {calc.gapEok >= 0 ? "+" : ""}{calc.gapEok.toFixed(1)}억
              </p>
              <p className="text-neutral-500 dark:text-neutral-400">
                전월 대비 {calc.mom != null ? `${calc.mom >= 0 ? "+" : ""}${calc.mom.toFixed(1)}%` : "—"}
                {"  ·  "}
                전년 대비 {calc.yoy != null ? `${calc.yoy >= 0 ? "+" : ""}${calc.yoy.toFixed(1)}%` : "—"}
              </p>
            </div>
            {/* 목표 입력 */}
            <label className="text-xs text-neutral-500 dark:text-neutral-400 ml-auto">
              이번 달 목표(억원)
              <input
                type="number"
                value={target}
                min={0}
                onChange={(e) => updateTarget(Number(e.target.value))}
                className="block mt-1 w-28 rounded-md border border-neutral-300 dark:border-neutral-600 bg-transparent px-2 py-1 text-sm text-neutral-900 dark:text-neutral-100"
              />
            </label>
          </div>

          {/* 달성률 바 */}
          <div className="h-2 w-full bg-neutral-100 dark:bg-neutral-800 rounded mb-6 overflow-hidden">
            <div
              className="h-2 rounded"
              style={{ width: `${Math.min(calc.achievement ?? 0, 100)}%`, backgroundColor: achColor(calc.achievement) }}
            />
          </div>

          {/* 월별 추세 + 목표선 */}
          <h3 className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-2">월별 매출 추세 (억원, 목표선 표시)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => `${v}억`} />
              <ReferenceLine y={target} stroke="#dc2626" strokeDasharray="4 4" label={{ value: `목표 ${target}억`, position: "right", fontSize: 11, fill: "#dc2626" }} />
              <Bar dataKey="eok" name="매출" radius={[4, 4, 0, 0]}>
                {chartData.map((d, i) => (
                  <Cell key={i} fill={d.eok >= target ? "#16a34a" : "#3b82f6"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* 국가별 (최근 완전월) */}
          {data.country.length > 0 && (
            <div className="mt-5">
              <h3 className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-2">{calc.month} 국가별 매출 TOP (억원)</h3>
              <div className="space-y-1.5">
                {data.country.slice(0, 5).map((c) => {
                  const max = data.country[0].salesKrw || 1;
                  return (
                    <div key={c.code} className="flex items-center gap-3">
                      <span className="w-10 text-xs font-medium text-neutral-600 dark:text-neutral-300">{c.code}</span>
                      <div className="flex-1 h-3.5 bg-neutral-100 dark:bg-neutral-800 rounded">
                        <div className="h-3.5 bg-sky-500 rounded" style={{ width: `${(c.salesKrw / max) * 100}%` }} />
                      </div>
                      <span className="w-16 text-right text-xs tabular-nums text-neutral-700 dark:text-neutral-200">{fmtEok(c.salesKrw)}억</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
