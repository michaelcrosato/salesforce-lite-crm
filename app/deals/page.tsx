import { DealBoard, type BoardDeal } from "@/components/deal-board";
import { KpiCard } from "@/components/kpi-card";
import { PageHeader } from "@/components/page-header";
import { calculateWeightedForecast, isOpenDealStage, isStaleDeal } from "@/lib/business/deals";
import { DEAL_STAGES, type DealStage } from "@/lib/crm-constants";
import { formatCurrency, formatNumber } from "@/lib/formatters";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function DealsPage({
  searchParams
}: {
  searchParams: Promise<{ deal?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const deals = await prisma.deal.findMany({
    orderBy: [
      {
        stage: "asc"
      },
      {
        value: "desc"
      }
    ],
    include: {
      account: {
        select: {
          id: true,
          name: true
        }
      },
      contact: {
        select: {
          id: true,
          firstName: true,
          lastName: true
        }
      }
    }
  });

  const openDeals = deals.filter((deal) => isOpenDealStage(deal.stage));
  const wonValue = deals
    .filter((deal) => deal.stage === "won")
    .reduce((total, deal) => total + deal.value, 0);
  const staleDeals = deals.filter((deal) => isStaleDeal(deal)).length;
  const boardDeals: BoardDeal[] = deals
    .filter((deal) => DEAL_STAGES.includes(deal.stage as DealStage))
    .map((deal) => ({
      id: deal.id,
      name: deal.name,
      stage: deal.stage as DealStage,
      value: deal.value,
      probability: deal.probability,
      expectedCloseDate: deal.expectedCloseDate?.toISOString() ?? null,
      lastActivityAt: deal.lastActivityAt?.toISOString() ?? null,
      createdAt: deal.createdAt.toISOString(),
      stale: isStaleDeal(deal),
      account: deal.account,
      contact: deal.contact
    }));

  return (
    <div className="crm-page max-w-[1500px]">
      <PageHeader
        title="Deals"
        description="Drag cards across stages to update probability and log pipeline movement."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Open Pipeline"
          value={formatCurrency(openDeals.reduce((total, deal) => total + deal.value, 0))}
        />
        <KpiCard
          label="Weighted Forecast"
          value={formatCurrency(calculateWeightedForecast(openDeals))}
        />
        <KpiCard label="Won Value" value={formatCurrency(wonValue)} />
        <KpiCard label="Stale Deals" value={formatNumber(staleDeals)} />
      </div>

      <DealBoard deals={boardDeals} highlightedDealId={resolvedSearchParams.deal} />
    </div>
  );
}
