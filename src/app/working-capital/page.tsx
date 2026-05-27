"use client";
import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from "recharts";
import DataTable, { Column } from "@/components/tables/DataTable";
import KpiCard from "@/components/cards/KpiCard";
import {
  getWorkingCapital,
  type WorkingCapitalData,
  type WorkingCapitalRow,
  type CapitalBucket,
  type StockStatus,
} from "@/lib/queries/working-capital";

function eur(n: number, digits = 0) {
  return `€${n.toLocaleString("de-DE", { maximumFractionDigits: digits })}`;
}

const STATUS_META: Record<StockStatus, { label: string; color: string; badge: string }> = {
  deadstock: { label: "데드스톡", color: "#ef4444", badge: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300" },
  stockout: { label: "품절", color: "#a855f7", badge: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300" },
  overstock: { label: "과잉", color: "#f59e0b", badge: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" },
  low: { label: "임박", color: "#eab308", badge: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300" },
  healthy: { label: "정상", color: "#22c55e", badge: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300" },
};

function StatusBadge({ status }: { status: StockStatus }) {
  const m = STATUS_META[status];
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${m.badge}`}>{m.label}</span>;
}

export default function WorkingCapitalPage() {
  const [data, setData] = useState<WorkingCapitalData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getWorkingCapital()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-neutral-400">로딩 중...</div>;
  if (!data) return (
    <div className="p-8 space-y-2">
      <p className="text-neutral-500 font-medium">아직 재고 데이터가 없습니다.</p>
      <p className="text-sm text-neutral-400">
        <a href="/upload" className="underline text-yellow-500">데이터 업로드</a> 페이지에서 재고/트래픽 CSV를 먼저 업로드해 주세요.
      </p>
    </div>
  );

  const { summary, rows, reportDate } = data;

  const columns: Column<WorkingCapitalRow>[] = [
    { key: "sku", header: "SKU", sortable: false, render: r => <span className="font-mono text-xs">{r.sku}</span> },
    { key: "product_name", header: "상품명", sortable: false, render: r => <span className="max-w-[220px] truncate block" title={r.product_name}>{r.product_name}</span> },
    { key: "your_price", header: "가격", align: "right", render: r => eur(r.your_price, 2) },
    { key: "afn_total", header: "총재고", align: "right", render: r => r.afn_total.toLocaleString() },
    { key: "asset_value", header: "재고자산", align: "right", render: r => <span className="font-semibold">{eur(r.asset_value)}</span> },
    { key: "units_period", header: "판매량", align: "right", render: r => r.units_period.toLocaleString() },
    { key: "days_of_cover", header: "재고일수", align: "right", render: r => r.days_of_cover === null ? <span className="text-red-500">∞</span> : `${r.days_of_cover.toLocaleString()}일` },
    { key: "status", header: "상태", align: "center", render: r => <StatusBadge status={r.status} /> },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-50">재고자산 · 운전자본</h1>
        {reportDate && <span className="text-xs text-neutral-400">재고 기준일: {reportDate}</span>}
      </div>

      {/* KPI 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard label="재고자산 총액" value={eur(summary.totalAssetValue)} sub="소매가 기준" highlight />
        <KpiCard
          label="데드스톡 자본"
          value={eur(summary.deadStockValue)}
          sub={`${summary.deadStockSkus} SKU · ${summary.deadStockUnits.toLocaleString()} units`}
          highlight={summary.deadStockValue > 0}
        />
        <KpiCard label="즉시 판매가능 자산" value={eur(summary.fulfillableValue)} sub="가용재고" />
        <KpiCard label="입고중 투입 자본" value={eur(summary.inboundValue)} sub="발주 예정분" />
        <KpiCard
          label="재고회전율"
          value={summary.turnover !== null ? `${summary.turnover.toFixed(2)}x` : null}
          sub="연환산 · 소매가"
        />
        <KpiCard
          label="데드스톡 SKU 비중"
          value={summary.deadStockShare !== null ? summary.deadStockShare.toFixed(0) : null}
          unit="%"
          sub={`${summary.totalSkus} SKU 중`}
        />
      </div>

      {/* 구간별 묶인 자본 */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-5">
        <h2 className="text-sm font-semibold mb-1 text-neutral-700 dark:text-neutral-200">구간별 묶인 자본 (EUR)</h2>
        <p className="text-xs text-neutral-400 mb-4">재고일수(가용재고÷일판매) 기준으로 자본이 어디에 잠겨 있는지</p>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={summary.buckets} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `€${(v / 1000).toLocaleString("de-DE")}K`} />
            <Tooltip
              formatter={(v, _n, item) => {
                const val = typeof v === "number" ? v : Number(v);
                const skus = (item?.payload as CapitalBucket | undefined)?.skus ?? 0;
                return [`${eur(val)} · ${skus} SKU`, "묶인 자본"];
              }}
            />
            <Bar dataKey="value" name="묶인 자본" radius={[4, 4, 0, 0]}>
              {summary.buckets.map((b) => (
                <Cell key={b.key} fill={STATUS_META[b.key].color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* SKU별 운전자본 테이블 */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-neutral-100 dark:border-neutral-800">
          <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">SKU별 재고자산 (자산 큰 순)</h2>
        </div>
        <DataTable
          columns={columns as unknown as Column<Record<string, unknown>>[]}
          data={rows as unknown as Record<string, unknown>[]}
        />
      </div>

      <p className="text-xs text-neutral-400">
        ※ 매입원가(COGS) 데이터가 없어 재고자산·회전율은 <strong>소매가(your_price)</strong> 기준입니다. 판매속도는 적재된 트래픽 {summary.periodDays}일을 기준으로 산정했습니다. 재고일수 ∞ = 해당 기간 무판매(데드스톡).
      </p>
    </div>
  );
}
