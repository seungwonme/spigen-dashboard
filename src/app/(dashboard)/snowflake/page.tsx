// Snowflake 통합 탭 — 의도: "기존 서비스에 Snowflake를 붙여 어떤 부가가치를 만들었나".
// 각 기능을 기존(시트 샘플) → +Snowflake(전체·정확) Before/After로 제시.
import SalesVsTargetCard from "@/components/cards/SalesVsTargetCard";
import SnowflakeRegionCard from "@/components/cards/SnowflakeRegionCard";

export const dynamic = "force-dynamic";

function ValueFrame({ before, after, children }: { before: string; after: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2.5">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-stretch gap-2 text-xs">
        <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/40 p-3">
          <p className="font-semibold text-neutral-500 dark:text-neutral-400 mb-1">기존 서비스 (시트 샘플)</p>
          <p className="text-neutral-600 dark:text-neutral-300">{before}</p>
        </div>
        <div className="hidden md:flex items-center justify-center text-sky-500 font-bold">→</div>
        <div className="rounded-lg border border-sky-200 dark:border-sky-900/60 bg-sky-50 dark:bg-sky-900/20 p-3">
          <p className="font-semibold text-sky-700 dark:text-sky-300 mb-1">+ Snowflake = 부가가치</p>
          <p className="text-neutral-700 dark:text-neutral-200">{after}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

export default function SnowflakePage() {
  return (
    <div className="p-6 space-y-8">
      <header>
        <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-50">Snowflake 통합 — 붙여서 만든 부가가치</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          기존 대시보드는 구글시트로 동기화한 <b>샘플 일부</b>로 동작했습니다. 여기에 회사 데이터창고(Snowflake)를 <b>직접</b> 연결해, 다운로드·복사 없이 전체 데이터로 ① 기존 부정확을 바로잡고 ② 없던 기능을 새로 만들었습니다.
        </p>
      </header>

      <ValueFrame
        before="목표 개념 자체가 없고, '총 매출'은 여러 통화(EUR·GBP·JPY…)를 그대로 더해 부정확."
        after="SAP 환율로 정확 KRW 환산(중복 제거·JPY/100) + 내 목표를 결합해 '목표 대비 달성률'을 신설."
      >
        <SalesVsTargetCard />
      </ValueFrame>

      <ValueFrame
        before="구글시트로 동기화한 주문 '샘플 일부'만 집계."
        after="회사 전체 주문(중복·취소·타브랜드 제외, 약 1,650만 건)을 권역 단위로 실시간 집계."
      >
        <SnowflakeRegionCard />
      </ValueFrame>
    </div>
  );
}
