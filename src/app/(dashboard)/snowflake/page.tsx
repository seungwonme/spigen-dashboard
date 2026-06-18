// Snowflake 통합 탭 — 의도: "기존 서비스에 어떤 Snowflake 데이터를 붙여 어떤 기능을 만들었나".
// 각 카드 위에 기존 → 가져온 데이터 → 새로 만든 기능을 비개발자도 알게 명시.
import SalesVsTargetCard from "@/components/cards/SalesVsTargetCard";
import SnowflakeRegionCard from "@/components/cards/SnowflakeRegionCard";
import AdWasteCard from "@/components/cards/AdWasteCard";
import RecoverySavingsCard from "@/components/cards/RecoverySavingsCard";
import ReturnsQualityCard from "@/components/cards/ReturnsQualityCard";

export const dynamic = "force-dynamic";

function ValueFrame({
  before,
  data,
  feature,
  children,
}: {
  before: string;
  data: string;
  feature: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2.5">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1.5fr] items-stretch gap-2 text-xs">
        <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/40 p-3">
          <p className="font-semibold text-neutral-500 dark:text-neutral-400 mb-1">원래 이 사이트는</p>
          <p className="text-neutral-600 dark:text-neutral-300">{before}</p>
        </div>
        <div className="hidden md:flex items-center justify-center text-sky-500 font-bold text-lg">→</div>
        <div className="rounded-lg border border-sky-200 dark:border-sky-900/60 bg-sky-50 dark:bg-sky-900/20 p-3 space-y-2">
          <div>
            <p className="font-semibold text-sky-700 dark:text-sky-300 mb-0.5">가져온 Snowflake 데이터</p>
            <p className="text-neutral-700 dark:text-neutral-200">{data}</p>
          </div>
          <div>
            <p className="font-semibold text-sky-700 dark:text-sky-300 mb-0.5">그래서 새로 만든 기능</p>
            <p className="text-neutral-700 dark:text-neutral-200">{feature}</p>
          </div>
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
          기존 대시보드는 구글시트로 동기화한 <b>샘플 일부</b>로 동작했습니다. 여기에 회사 데이터창고(Snowflake)를 <b>직접</b> 연결해 만든 기능들입니다. 각 카드 위에 <b>어떤 데이터로 무엇을 만들었는지</b>를 적어 뒀습니다. (다운로드·복사 없이 전체 데이터를 실시간으로)
        </p>
      </header>

      <ValueFrame
        before="이번 달 목표 대비 어디까지 왔는지 볼 수 없었고, '총 매출'은 여러 나라 통화(유로·파운드·엔…)를 그대로 더해 부정확했습니다."
        data="아마존 판매·트래픽 일별 집계(DT_SALES_AND_TRAFFIC_BY_DATE)와 SAP 환율표(TCURR)를 합쳐, 나라별 매출을 정확한 환율로 원화 환산(엔화 100단위·중복 적재 보정 포함)."
        feature="회사 전체 실매출을 정확한 원화로 보여주고, 내가 입력한 목표와 결합해 '월별 목표 대비 달성률·전년/전월 대비'를 신설."
      >
        <SalesVsTargetCard />
      </ValueFrame>

      <ValueFrame
        before="광고 분석이 채널·캠페인 단위까지만이라, 어떤 '키워드(검색어)'가 돈을 까먹는지는 볼 수 없었습니다."
        data="아마존 검색광고(SP)의 키워드별 광고비·매출·클릭 약 96만 건(AMAZON_ADS.SPTARGETING, 최근 90일·독일)."
        feature="내가 정한 목표 ROAS에 못 미치는 키워드의 '새는 광고비'를 실시간으로 합산(슬라이더로 기준 조절) — 실측 €88k 회수 후보."
      >
        <AdWasteCard />
      </ValueFrame>

      <ValueFrame
        before="재고가 얼마나 묶여 있는지만 보여주고, '그래서 어떻게 돈을 회수하나'는 알려주지 않았습니다."
        data="아마존이 SKU마다 추천하는 조치와 예상 절감액(FBA_INVENTORY_PLANNING_DATA)에 SAP 환율을 적용해 여러 통화를 원화로 통합."
        feature="권장조치별(광고노출·가격인하·재고제거…) 회수 가능액을 원화로 보여주고, 실제 실행할 액션만 체크하면 '이번 분기 회수 목표'가 합산 — 실측 약 11.8억."
      >
        <RecoverySavingsCard />
      </ValueFrame>

      <ValueFrame
        before="반품을 사유 목록으로만 보여줄 뿐, 그 반품이 우리 품질 문제인지 고객·배송사 책임인지 갈라주지 않았습니다."
        data="아마존 FBA 고객 반품의 처리상태·사유(FBA_FULFILLMENT_CUSTOMER_RETURNS_DATA, 최근 12개월). 고객 코멘트 등 개인정보는 조회하지 않음."
        feature="반품을 귀책(제품 결함=우리 품질 / 고객 손상 / 배송사 손상)으로 갈라, 재판매 가능률과 개선·환급 클레임 대상을 분리."
      >
        <ReturnsQualityCard />
      </ValueFrame>

      <ValueFrame
        before="구글시트로 동기화한 주문 '샘플 일부'만 셌습니다."
        data="아마존 전체 주문 원장(AMAZON_SELLER.FLAT_FILE_ALL_ORDERS…, 약 2천만 행)에서 중복·취소·타브랜드를 제외."
        feature="회사 전체 주문을 정확히(약 1,650만 건) 권역(유럽 통합·인도·일본·싱가포르) 단위로 실시간 집계."
      >
        <SnowflakeRegionCard />
      </ValueFrame>
    </div>
  );
}
