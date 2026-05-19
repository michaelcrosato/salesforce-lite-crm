import {
  calculatePaceGap,
  daysRemainingInMonth
} from "@/lib/routing/leadRouter";

export type PacingStatus = "behind" | "on_pace" | "ahead" | "over";

export type DealerOpsOrder = {
  id: string;
  name: string;
  monthlyQuota: number;
  status: string;
  deliveredThisMonth: number;
  account: {
    id: string;
    name: string;
    healthScore?: number;
  };
};

export type DealerOpsLead = {
  id: string;
  firstName: string;
  lastName: string;
  assignmentReason: string | null;
  createdAt: Date | string;
};

export type DealerOpsDeal = {
  id: string;
  name: string;
  value: number;
  accountId: string | null;
};

export type DealerOpsKpis = {
  leadsThisMonth: number;
  unroutedLeads: number;
  activeDealerOrders: number;
  behindPaceOrders: number;
  ordersAtQuota: number;
  recentRoutedLeads: number;
};

export type DealerOpsFocusItem = {
  id: string;
  kind: "order" | "lead" | "account" | "deal";
  title: string;
  subtitle: string;
  score: number;
  href: string;
};

export function expectedDeliveredByToday(
  order: Pick<DealerOpsOrder, "monthlyQuota">,
  now: Date = new Date()
) {
  const daysInMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0
  ).getDate();
  return (order.monthlyQuota * now.getDate()) / daysInMonth;
}

export function getPacingStatus(
  order: Pick<DealerOpsOrder, "monthlyQuota" | "deliveredThisMonth">,
  now: Date = new Date()
): PacingStatus {
  if (order.deliveredThisMonth >= order.monthlyQuota) {
    return "over";
  }

  const expected = expectedDeliveredByToday(order, now);
  const delta = order.deliveredThisMonth - expected;

  if (delta < -1) {
    return "behind";
  }

  if (delta > 1) {
    return "ahead";
  }

  return "on_pace";
}

export function pacingPercent(
  order: Pick<DealerOpsOrder, "monthlyQuota" | "deliveredThisMonth">
) {
  if (order.monthlyQuota <= 0) {
    return 0;
  }

  return Math.min(
    100,
    Math.round((order.deliveredThisMonth / order.monthlyQuota) * 100)
  );
}

export function calculateDealerOpsKpis(input: {
  leadsThisMonth: number;
  leads: DealerOpsLead[];
  orders: DealerOpsOrder[];
  now?: Date;
}): DealerOpsKpis {
  const now = input.now ?? new Date();
  const activeOrders = input.orders.filter(
    (order) => order.status === "active"
  );

  return {
    leadsThisMonth: input.leadsThisMonth,
    unroutedLeads: input.leads.filter(
      (lead) => lead.assignmentReason !== "routed"
    ).length,
    activeDealerOrders: activeOrders.length,
    behindPaceOrders: activeOrders.filter(
      (order) => getPacingStatus(order, now) === "behind"
    ).length,
    ordersAtQuota: activeOrders.filter(
      (order) => order.deliveredThisMonth >= order.monthlyQuota
    ).length,
    recentRoutedLeads: input.leads.filter(
      (lead) => lead.assignmentReason === "routed"
    ).length
  };
}

export function rankDealerOpsFocus(input: {
  orders: DealerOpsOrder[];
  leads: DealerOpsLead[];
  deals?: DealerOpsDeal[];
  now?: Date;
  limit?: number;
}): DealerOpsFocusItem[] {
  const now = input.now ?? new Date();
  const limit = input.limit ?? 5;
  const items: DealerOpsFocusItem[] = [];
  const behindAccountIds = new Set<string>();

  for (const order of input.orders) {
    if (order.status !== "active") {
      continue;
    }

    if (getPacingStatus(order, now) === "behind") {
      behindAccountIds.add(order.account.id);
      items.push({
        id: `order-${order.id}`,
        kind: "order",
        title: order.name,
        subtitle: `${order.account.name}: ${order.deliveredThisMonth}/${order.monthlyQuota} delivered, ${daysRemainingInMonth(now)} days left`,
        score: 80 + calculatePaceGap(order, order.deliveredThisMonth, now),
        href: `/orders/${order.id}`
      });

      if ((order.account.healthScore ?? 100) < 60) {
        items.push({
          id: `account-${order.account.id}-${order.id}`,
          kind: "account",
          title: order.account.name,
          subtitle: `Low health account has a behind-pace order`,
          score: 75 + (60 - (order.account.healthScore ?? 60)),
          href: `/accounts/${order.account.id}`
        });
      }
    }
  }

  for (const lead of input.leads) {
    if (lead.assignmentReason === "no_area_match") {
      items.push({
        id: `lead-area-${lead.id}`,
        kind: "lead",
        title: `${lead.firstName} ${lead.lastName}`,
        subtitle: "No area match",
        score: 70,
        href: `/leads/${lead.id}`
      });
    }

    if (lead.assignmentReason === "no_matching_active_order") {
      items.push({
        id: `lead-order-${lead.id}`,
        kind: "lead",
        title: `${lead.firstName} ${lead.lastName}`,
        subtitle: "No active dealer order",
        score: 68,
        href: `/leads/${lead.id}`
      });
    }
  }

  for (const deal of input.deals ?? []) {
    if (deal.accountId && behindAccountIds.has(deal.accountId)) {
      items.push({
        id: `deal-${deal.id}`,
        kind: "deal",
        title: deal.name,
        subtitle: "High-value deal on a behind-pace dealer account",
        score: 50 + deal.value / 10_000,
        href: `/deals?deal=${deal.id}`
      });
    }
  }

  return items
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .slice(0, limit);
}
