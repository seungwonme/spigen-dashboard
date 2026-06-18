// 리허설 전용 공개 페이지 — Supabase 인증과 분리해 Snowflake 직결 카드만 렌더.
// middleware 제외(아래 matcher) 필요. 데모 후 이 페이지+matcher 제외는 되돌릴 것.
import SnowflakeRegionCard from "@/components/cards/SnowflakeRegionCard";
import SalesVsTargetCard from "@/components/cards/SalesVsTargetCard";

export const dynamic = "force-dynamic";

export default function SfDemoPage() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-8">
      <div className="max-w-3xl mx-auto space-y-4">
        <h1 className="text-lg font-bold text-neutral-900 dark:text-neutral-50">
          6회차 리허설 — Snowflake 통합 가치 (Supabase 분리)
        </h1>
        <SalesVsTargetCard />
        <SnowflakeRegionCard />
        <p className="text-xs text-neutral-400">
          이 페이지는 인증 없이 Snowflake 라우트만 호출합니다. 실제 대시보드는 로그인 후 Executive Summary 상단에 같은 카드가 뜹니다.
        </p>
      </div>
    </div>
  );
}
