import { type ActivityType } from "@/lib/crm-constants";
import {
  calculateWeightedForecast,
  isOpenDealStage,
  isStaleDeal
} from "@/lib/business/deals";

export type DashboardDeal = {
  id: string;
  name: string;
  stage: string;
  value: number;
  probability: number;
  createdAt: Date | string;
  lastActivityAt: Date | string | null;
  accountName?: string | null;
};

export type DashboardAccount = {
  id: string;
  name: string;
  status: string;
  healthScore: number;
};

export type DashboardActivity = {
  id: string;
  accountId?: string | null;
  contactId?: string | null;
  dealId?: string | null;
  title: string;
  type: ActivityType | string;
  nextStep: string | null;
  createdAt: Date | string;
  contactName?: string | null;
  accountName?: string | null;
  dealName?: string | null;
};

export type DashboardKpis = {
  totalContacts: number;
  activeAccounts: number;
  openDeals: number;
  openPipelineValue: number;
  weightedForecastValue: number;
  staleDeals: number;
};

export type TodayFocusItem = {
  id: string;
  kind: "deal" | "account" | "activity";
  title: string;
  subtitle: string;
  score: number;
  href: string;
};

export function calculateDashboardKpis(input: {
  contactsCount: number;
  accounts: DashboardAccount[];
  deals: DashboardDeal[];
  now?: Date;
}): DashboardKpis {
  const now = input.now ?? new Date();
  const openDeals = input.deals.filter((deal) => isOpenDealStage(deal.stage));

  return {
    totalContacts: input.contactsCount,
    activeAccounts: input.accounts.filter(
      (account) => account.status === "active"
    ).length,
    openDeals: openDeals.length,
    openPipelineValue: openDeals.reduce((total, deal) => total + deal.value, 0),
    weightedForecastValue: calculateWeightedForecast(openDeals),
    staleDeals: input.deals.filter((deal) => isStaleDeal(deal, now)).length
  };
}

export function rankTodaysFocus(input: {
  deals: DashboardDeal[];
  accounts: DashboardAccount[];
  activities: DashboardActivity[];
  now?: Date;
  limit?: number;
}) {
  const now = input.now ?? new Date();
  const limit = input.limit ?? 5;
  const items: TodayFocusItem[] = [];

  for (const deal of input.deals) {
    if (!isOpenDealStage(deal.stage)) {
      continue;
    }

    const stale = isStaleDeal(deal, now);
    const lateStage = deal.stage === "proposal" || deal.stage === "negotiation";

    if (stale || lateStage) {
      const score =
        deal.value / 1000 +
        (stale ? 45 : 0) +
        (lateStage ? 30 : 0) +
        (deal.stage === "negotiation" ? 10 : 0);

      items.push({
        id: `deal-${deal.id}`,
        kind: "deal",
        title: deal.name,
        subtitle: stale
          ? `${deal.accountName ?? "No account"} needs activity`
          : `${deal.accountName ?? "No account"} is in ${deal.stage}`,
        score,
        href: `/deals?deal=${deal.id}`
      });
    }
  }

  for (const account of input.accounts) {
    if (account.status !== "churned" && account.healthScore < 60) {
      items.push({
        id: `account-${account.id}`,
        kind: "account",
        title: account.name,
        subtitle: `Health score ${account.healthScore}`,
        score: 80 - account.healthScore,
        href: `/accounts/${account.id}`
      });
    }
  }

  for (const activity of input.activities) {
    if (activity.nextStep) {
      const ageInDays = Math.max(
        0,
        Math.floor(
          (now.getTime() - new Date(activity.createdAt).getTime()) / 86_400_000
        )
      );

      items.push({
        id: `activity-${activity.id}`,
        kind: "activity",
        title: activity.nextStep,
        subtitle:
          activity.dealName ??
          activity.contactName ??
          activity.accountName ??
          activity.title,
        score: 25 + Math.min(14, ageInDays),
        href: activity.dealId
          ? `/deals?deal=${activity.dealId}`
          : activity.contactId
            ? `/contacts/${activity.contactId}`
            : activity.accountId
              ? `/accounts/${activity.accountId}`
              : `/activities?type=${activity.type}`
      });
    }
  }

  return items
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .slice(0, limit);
}
