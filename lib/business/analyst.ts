import { isStaleDeal } from "@/lib/business/deals";
import { getPacingStatus, type PacingStatus } from "@/lib/business/dealerOps";
import {
  calculatePaceGap,
  daysRemainingInMonth
} from "@/lib/routing/leadRouter";

export type AnalystOrder = {
  id: string;
  name: string;
  status: string;
  monthlyQuota: number;
  deliveredThisMonth: number;
  account: {
    id: string;
    name: string;
    healthScore: number;
  };
};

export type AnalystLead = {
  id: string;
  firstName: string;
  lastName: string;
  assignmentReason: string | null;
};

export type AnalystDeal = {
  id: string;
  name: string;
  stage: string;
  value: number;
  createdAt: Date | string;
  lastActivityAt: Date | string | null;
  accountId: string | null;
  accountName?: string | null;
};

export type AnalystBehindOrder = {
  id: string;
  name: string;
  href: string;
  accountName: string;
  deliveredThisMonth: number;
  monthlyQuota: number;
  remaining: number;
  daysRemaining: number;
  paceStatus: PacingStatus;
  explanation: string;
  score: number;
};

export type AnalystUnroutedLead = {
  id: string;
  name: string;
  href: string;
  assignmentReason: string;
};

export type AnalystStaleDeal = {
  id: string;
  name: string;
  href: string;
  value: number;
  accountName: string;
};

export type AnalystLowHealthAccount = {
  id: string;
  name: string;
  href: string;
  healthScore: number;
  orderName: string;
};

export type AnalystAction = {
  id: string;
  title: string;
  reason: string;
  href: string;
  suggestedNextAction: string;
  score: number;
};

export type AnalystPanel = {
  behindOrders: AnalystBehindOrder[];
  unroutedLeads: AnalystUnroutedLead[];
  staleHighValueDeals: AnalystStaleDeal[];
  lowHealthAccounts: AnalystLowHealthAccount[];
  actions: AnalystAction[];
};

export type AnalystPanelInput = {
  orders: AnalystOrder[];
  leads: AnalystLead[];
  deals: AnalystDeal[];
  now?: Date;
  actionLimit?: number;
};

export function buildAnalystPanel(input: AnalystPanelInput): AnalystPanel {
  const now = input.now ?? new Date();
  const actionLimit = input.actionLimit ?? 5;
  const daysRemaining = daysRemainingInMonth(now);

  const behindOrders = input.orders
    .filter((order) => order.status === "active")
    .map((order) => {
      const paceStatus = getPacingStatus(order, now);
      const remaining = Math.max(
        0,
        order.monthlyQuota - order.deliveredThisMonth
      );
      const score =
        paceStatus === "behind"
          ? 100 + calculatePaceGap(order, order.deliveredThisMonth, now)
          : 0;

      return {
        id: order.id,
        name: order.name,
        href: `/orders/${order.id}`,
        accountName: order.account.name,
        deliveredThisMonth: order.deliveredThisMonth,
        monthlyQuota: order.monthlyQuota,
        remaining,
        daysRemaining,
        paceStatus,
        explanation: `${order.deliveredThisMonth}/${order.monthlyQuota} delivered; ${remaining} remaining with ${daysRemaining} days left.`,
        score
      };
    })
    .filter((order) => order.paceStatus === "behind")
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));

  const unroutedLeads = input.leads
    .filter(
      (lead) => lead.assignmentReason && lead.assignmentReason !== "routed"
    )
    .map((lead) => ({
      id: lead.id,
      name: `${lead.firstName} ${lead.lastName}`,
      href: `/leads/${lead.id}`,
      assignmentReason: lead.assignmentReason ?? "unrouted"
    }));

  const staleHighValueDeals = input.deals
    .filter((deal) => deal.value >= 75_000 && isStaleDeal(deal, now))
    .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name))
    .map((deal) => ({
      id: deal.id,
      name: deal.name,
      href: `/deals?deal=${deal.id}`,
      value: deal.value,
      accountName: deal.accountName ?? "No account"
    }));

  const lowHealthAccounts = behindOrders
    .map((behindOrder) => {
      const sourceOrder = input.orders.find(
        (order) => order.id === behindOrder.id
      );

      if (!sourceOrder || sourceOrder.account.healthScore >= 60) {
        return null;
      }

      return {
        id: sourceOrder.account.id,
        name: sourceOrder.account.name,
        href: `/accounts/${sourceOrder.account.id}`,
        healthScore: sourceOrder.account.healthScore,
        orderName: sourceOrder.name
      };
    })
    .filter((account): account is AnalystLowHealthAccount => account !== null);

  const actions = rankAnalystActions({
    behindOrders,
    unroutedLeads,
    staleHighValueDeals,
    lowHealthAccounts,
    limit: actionLimit
  });

  return {
    behindOrders: behindOrders.slice(0, 5),
    unroutedLeads: unroutedLeads.slice(0, 5),
    staleHighValueDeals: staleHighValueDeals.slice(0, 5),
    lowHealthAccounts: lowHealthAccounts.slice(0, 5),
    actions
  };
}

function rankAnalystActions(input: {
  behindOrders: AnalystBehindOrder[];
  unroutedLeads: AnalystUnroutedLead[];
  staleHighValueDeals: AnalystStaleDeal[];
  lowHealthAccounts: AnalystLowHealthAccount[];
  limit: number;
}) {
  const actions: AnalystAction[] = [];

  for (const order of input.behindOrders) {
    actions.push({
      id: `order-${order.id}`,
      title: order.name,
      reason: order.explanation,
      href: order.href,
      suggestedNextAction: "Send more matched leads or reduce remaining quota.",
      score: 100 + order.remaining
    });
  }

  for (const lead of input.unroutedLeads) {
    actions.push({
      id: `lead-${lead.id}`,
      title: lead.name,
      reason: `Assignment reason: ${lead.assignmentReason}.`,
      href: lead.href,
      suggestedNextAction: "Review area coverage or active dealer capacity.",
      score: lead.assignmentReason === "no_area_match" ? 88 : 84
    });
  }

  for (const account of input.lowHealthAccounts) {
    actions.push({
      id: `account-${account.id}`,
      title: account.name,
      reason: `Health score ${account.healthScore} with behind order ${account.orderName}.`,
      href: account.href,
      suggestedNextAction:
        "Call the account owner and confirm dealer delivery expectations.",
      score: 80 + (60 - account.healthScore)
    });
  }

  for (const deal of input.staleHighValueDeals) {
    actions.push({
      id: `deal-${deal.id}`,
      title: deal.name,
      reason: `${deal.accountName} has a stale high-value deal.`,
      href: deal.href,
      suggestedNextAction:
        "Open the deal drawer and log the next sales activity.",
      score: 70 + deal.value / 10_000
    });
  }

  return actions
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .slice(0, input.limit);
}
