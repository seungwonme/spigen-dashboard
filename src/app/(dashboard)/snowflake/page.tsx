// Snowflake 통합 탭 — 회사 데이터창고 직결 기능 모음. 사이드바에서 전 페이지 접근.
import SalesVsTargetCard from "@/components/cards/SalesVsTargetCard";
import SnowflakeRegionCard from "@/components/cards/SnowflakeRegionCard";

export const dynamic = "force-dynamic";

export default function SnowflakePage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-50">Snowflake 통합</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          시트 동기화 샘플이 아니라 회사 데이터창고(Snowflake) 전체를 실시간으로 직접 읽습니다.
        </p>
      </div>
      <SalesVsTargetCard />
      <SnowflakeRegionCard />
    </div>
  );
}
