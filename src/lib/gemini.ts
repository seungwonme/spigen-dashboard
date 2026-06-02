import "server-only";
import { GoogleGenAI } from "@google/genai";

/**
 * Gemini 클라이언트는 server-only. API 키는 절대 클라이언트 번들로 새어나가면 안 된다.
 * (이 모듈을 클라이언트 컴포넌트에서 import 하면 빌드가 깨진다.)
 */
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  // 라우트에서 호출 시 명확한 에러를 내도록 lazy 하게 처리하지 않고 모듈 로드 시점에 검증
  console.warn("[gemini] GEMINI_API_KEY 가 설정되지 않았습니다. /api/insights 가 동작하지 않습니다.");
}

const ai = new GoogleGenAI({ apiKey: apiKey ?? "" });

const MODEL = "gemini-2.5-flash";

/** 대시보드 summary 에서 넘어오는 입력 (클라이언트가 계산해 전달) */
export interface InsightInput {
  dateFrom: string;
  dateTo: string;
  totalRevenue: number;
  totalAdSpend: number;
  roas: number | null;
  totalClicks: number;
  avgCtr: number | null;
  avgBuyBox: number | null;
  dailyTrend: { date: string; revenue: number; adSpend: number }[];
  roasByChannel: { channel: string; roas: number | null; spend: number; sales: number }[];
}

export interface DailyInsight {
  headline: string;
  summary: string;
  anomalies: { metric: string; observation: string; severity: "low" | "medium" | "high" }[];
  actions: { action: string; rationale: string }[];
}

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    headline: { type: "string", description: "한 줄 핵심 요약 (40자 이내)" },
    summary: { type: "string", description: "기간 전체 성과를 2~3문장으로 요약" },
    anomalies: {
      type: "array",
      description: "주목할 만한 이상치/변화. 없으면 빈 배열.",
      items: {
        type: "object",
        properties: {
          metric: { type: "string", description: "지표명 (예: ROAS, CTR, 광고비)" },
          observation: { type: "string", description: "무엇이 어떻게 변했는지" },
          severity: { type: "string", enum: ["low", "medium", "high"] },
        },
        required: ["metric", "observation", "severity"],
      },
    },
    actions: {
      type: "array",
      description: "셀러가 취할 구체적 액션 1~3개",
      items: {
        type: "object",
        properties: {
          action: { type: "string", description: "구체적 행동" },
          rationale: { type: "string", description: "근거 (데이터 기반)" },
        },
        required: ["action", "rationale"],
      },
    },
  },
  required: ["headline", "summary", "anomalies", "actions"],
};

function buildPrompt(input: InsightInput): string {
  return [
    "당신은 아마존(유럽) 셀러 슈피겐의 광고/매출 데이터를 분석하는 시니어 이커머스 애널리스트다.",
    "아래 기간의 대시보드 지표를 보고 한국어로 인사이트를 작성하라. 모든 금액 단위는 EUR(€).",
    "추측을 사실처럼 말하지 말고, 데이터에 근거해 신중하게 진단하라. 데이터가 부족하면 그렇게 말하라.",
    "",
    `## 분석 기간: ${input.dateFrom} ~ ${input.dateTo}`,
    "",
    "## 핵심 지표",
    `- 총 매출: €${input.totalRevenue.toLocaleString("de-DE")}`,
    `- 총 광고비: €${input.totalAdSpend.toLocaleString("de-DE")}`,
    `- 통합 ROAS (SP 14d): ${input.roas ?? "N/A"}`,
    `- 총 클릭: ${input.totalClicks.toLocaleString("de-DE")}`,
    `- 평균 CTR: ${input.avgCtr ?? "N/A"}%`,
    `- 평균 Buy Box: ${input.avgBuyBox ?? "N/A"}%`,
    "",
    "## 일별 매출/광고비 추세 (date, revenue, adSpend)",
    JSON.stringify(input.dailyTrend),
    "",
    "## 채널별 ROAS (channel, spend, sales, roas)",
    JSON.stringify(input.roasByChannel),
  ].join("\n");
}

export async function generateDailyInsight(input: InsightInput): Promise<DailyInsight> {
  if (!apiKey) throw new Error("GEMINI_API_KEY 가 서버에 설정되지 않았습니다.");

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: buildPrompt(input),
    config: {
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
      temperature: 0.4,
    },
  });

  const text = response.text;
  if (!text) throw new Error("Gemini 응답이 비어 있습니다.");

  return JSON.parse(text) as DailyInsight;
}
