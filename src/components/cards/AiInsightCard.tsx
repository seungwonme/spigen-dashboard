"use client";
import { useState } from "react";
import { LuSparkles, LuTriangleAlert, LuLightbulb, LuMail } from "react-icons/lu";
import type { SummaryData } from "@/lib/queries/summary";

interface DailyInsight {
  headline: string;
  summary: string;
  anomalies: { metric: string; observation: string; severity: "low" | "medium" | "high" }[];
  actions: { action: string; rationale: string }[];
}

const SEVERITY_STYLE: Record<string, string> = {
  high: "text-red-600 dark:text-red-400",
  medium: "text-amber-600 dark:text-amber-400",
  low: "text-neutral-500 dark:text-neutral-400",
};

export default function AiInsightCard({
  data,
  dateFrom,
  dateTo,
}: {
  data: SummaryData;
  dateFrom: string;
  dateTo: string;
}) {
  const [insight, setInsight] = useState<DailyInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mailStatus, setMailStatus] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    setMailStatus(null);
    try {
      const res = await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dateFrom, dateTo, ...data }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? "인사이트 생성 실패");
      setInsight(json.insight);
    } catch (e) {
      setError(e instanceof Error ? e.message : "인사이트 생성 실패");
    } finally {
      setLoading(false);
    }
  }

  async function sendMail() {
    if (!insight) return;
    setMailStatus("발송 중...");
    const to = window.prompt("받는 사람 이메일을 입력하세요");
    if (!to) {
      setMailStatus(null);
      return;
    }
    try {
      const html = renderInsightHtml(insight, dateFrom, dateTo);
      const res = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to,
          subject: `[슈피겐] AI 데일리 인사이트 (${dateFrom} ~ ${dateTo})`,
          html,
        }),
      });
      const json = await res.json();
      setMailStatus(json.ok ? "발송 완료 ✓" : `발송 실패: ${json.error}`);
    } catch (e) {
      setMailStatus(`발송 실패: ${e instanceof Error ? e.message : ""}`);
    }
  }

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-200 flex items-center gap-2">
          <LuSparkles className="text-yellow-500" /> AI 인사이트 브리핑
        </h2>
        <div className="flex items-center gap-2">
          {insight && (
            <button
              type="button"
              onClick={sendMail}
              className="text-xs px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-1"
            >
              <LuMail /> 메일로 받기
            </button>
          )}
          <button
            type="button"
            onClick={generate}
            disabled={loading}
            className="text-xs px-3 py-1.5 rounded-lg bg-yellow-500 text-neutral-900 font-medium hover:bg-yellow-400 disabled:opacity-50"
          >
            {loading ? "분석 중..." : insight ? "다시 분석" : "AI 분석 실행"}
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
      {mailStatus && <p className="text-xs text-neutral-400 mb-2">{mailStatus}</p>}

      {!insight && !loading && !error && (
        <p className="text-sm text-neutral-400">
          현재 기간의 지표를 Gemini 가 분석해 요약·이상치·액션을 제안합니다. 버튼을 눌러 실행하세요.
        </p>
      )}

      {insight && (
        <div className="space-y-4">
          <div>
            <p className="text-base font-semibold text-neutral-900 dark:text-neutral-50">{insight.headline}</p>
            <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-1">{insight.summary}</p>
          </div>

          {insight.anomalies.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-2 flex items-center gap-1">
                <LuTriangleAlert /> 주목할 변화
              </h3>
              <ul className="space-y-1.5">
                {insight.anomalies.map((a, i) => (
                  <li key={i} className="text-sm text-neutral-600 dark:text-neutral-300">
                    <span className={`font-medium ${SEVERITY_STYLE[a.severity] ?? ""}`}>{a.metric}</span>
                    {" — "}
                    {a.observation}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {insight.actions.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-2 flex items-center gap-1">
                <LuLightbulb /> 추천 액션
              </h3>
              <ul className="space-y-1.5">
                {insight.actions.map((a, i) => (
                  <li key={i} className="text-sm text-neutral-600 dark:text-neutral-300">
                    <span className="font-medium text-neutral-800 dark:text-neutral-100">{a.action}</span>
                    <span className="text-neutral-400"> — {a.rationale}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-xs text-neutral-400">⚠️ AI 생성 결과로 오류가 있을 수 있습니다. 의사결정 전 원본 지표를 확인하세요.</p>
        </div>
      )}
    </div>
  );
}

function renderInsightHtml(insight: DailyInsight, dateFrom: string, dateTo: string): string {
  const anomalies = insight.anomalies
    .map((a) => `<li><b>${a.metric}</b> (${a.severity}) — ${a.observation}</li>`)
    .join("");
  const actions = insight.actions
    .map((a) => `<li><b>${a.action}</b> — ${a.rationale}</li>`)
    .join("");
  return `
    <div style="font-family:sans-serif;max-width:600px">
      <h2>${insight.headline}</h2>
      <p style="color:#555">기간: ${dateFrom} ~ ${dateTo}</p>
      <p>${insight.summary}</p>
      ${anomalies ? `<h3>주목할 변화</h3><ul>${anomalies}</ul>` : ""}
      ${actions ? `<h3>추천 액션</h3><ul>${actions}</ul>` : ""}
      <p style="color:#999;font-size:12px">⚠️ AI 생성 결과로 오류가 있을 수 있습니다. 의사결정 전 원본 지표를 확인하세요.</p>
    </div>`;
}
