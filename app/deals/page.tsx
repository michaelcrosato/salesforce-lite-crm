import type { Metadata } from "next";
import Link from "next/link";
import { DealBoard, type BoardDeal } from "@/components/deal-board";
import { KpiCard } from "@/components/kpi-card";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  calculateWeightedForecast,
  isOpenDealStage,
  isStaleDeal
} from "@/lib/business/deals";
import { DEAL_STAGES, type DealStage } from "@/lib/crm-constants";
import { formatCurrency, formatNumber } from "@/lib/formatters";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Deals"
};

export default async function DealsPage({
  searchParams
}: {
  searchParams: Promise<{ deal?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const [deals, accounts, contacts, owners] = await Promise.all([
    prisma.deal.findMany({
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
        },
        owner: {
          select: {
            id: true,
            name: true
          }
        },
        activities: {
          orderBy: {
            createdAt: "desc"
          },
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
            },
            deal: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    }),
    prisma.account.findMany({
      orderBy: {
        name: "asc"
      },
      select: {
        id: true,
        name: true
      }
    }),
    prisma.contact.findMany({
      orderBy: [
        {
          lastName: "asc"
        },
        {
          firstName: "asc"
        }
      ],
      select: {
        id: true,
        accountId: true,
        firstName: true,
        lastName: true
      }
    }),
    prisma.user.findMany({
      orderBy: {
        name: "asc"
      },
      select: {
        id: true,
        name: true
      }
    })
  ]);

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
      updatedAt: deal.updatedAt.toISOString(),
      stale: isStaleDeal(deal),
      account: deal.account,
      contact: deal.contact,
      owner: deal.owner,
      activities: deal.activities.map((activity) => ({
        ...activity,
        createdAt: activity.createdAt.toISOString()
      }))
    }));

  return (
    <div className="crm-page max-w-[1500px]">
      <PageHeader
        title="Deals"
        description="Drag cards across stages to update probability and log pipeline movement."
      >
        <Button asChild>
          <Link href="/deals/new">New deal</Link>
        </Button>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Open Pipeline"
          value={formatCurrency(
            openDeals.reduce((total, deal) => total + deal.value, 0)
          )}
        />
        <KpiCard
          label="Weighted Forecast"
          value={formatCurrency(calculateWeightedForecast(openDeals))}
        />
        <KpiCard label="Won Value" value={formatCurrency(wonValue)} />
        <KpiCard label="Stale Deals" value={formatNumber(staleDeals)} />
      </div>

      {boardDeals.length > 0 ? (
        <DealBoard
          deals={boardDeals}
          highlightedDealId={resolvedSearchParams.deal}
          accounts={accounts}
          contacts={contacts}
          owners={owners}
        />
      ) : (
        <EmptyState
          title="No deals found"
          description="Create a deal to start the pipeline board."
          actionHref="/deals/new"
          actionLabel="Create deal"
        />
      )}
    </div>
  );
}
