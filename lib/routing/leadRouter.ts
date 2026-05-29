import type { Area, DealerOrder, Prisma } from "@prisma/client";
import type { AssignmentReason } from "@/lib/crm-constants";
import { logger } from "@/lib/observability/logger";
import {
  extractPostalPrefix,
  normalizePostalCode as normalizeDisplayPostalCode
} from "@/lib/postal";
import { prisma } from "@/lib/prisma";

type RoutableLead = {
  postalCode?: string | null;
  areaName?: string | null;
  area?: {
    name: string;
  } | null;
};

type PaceOrder = Pick<
  DealerOrder,
  "id" | "monthlyQuota" | "status" | "startDate"
> & {
  deliveredThisMonth?: number;
};

type RouteOrder = DealerOrder & {
  account: {
    id: string;
    name: string;
  };
  deliveredThisMonth: number;
};

type RouteResult = {
  order: DealerOrder | null;
  reason: AssignmentReason;
};

type TransactionClient = Prisma.TransactionClient;
type RoutingLead = {
  id: string;
  firstName: string;
  lastName: string;
  postalCode: string | null;
};
type RoutingPayloadJson =
  | string
  | number
  | boolean
  | null
  | { readonly [key: string]: RoutingPayloadJson }
  | readonly RoutingPayloadJson[];
type RoutingPayloadStep = {
  step: string;
  result: RoutingPayloadJson;
};

const millisecondsPerDay = 86_400_000;

export function normalizePostalCode(raw: string): string {
  return raw.replace(/[^a-z0-9]/gi, "").toUpperCase();
}

export function parsePostalPrefixes(
  area: Pick<Area, "postalPrefixes">
): string[] {
  return area.postalPrefixes
    .split(",")
    .map((prefix) => normalizePostalCode(prefix))
    .filter(Boolean);
}

export function resolveAreaForLead<
  TArea extends Pick<Area, "id" | "name" | "postalPrefixes">
>(lead: RoutableLead, areas: TArea[]): TArea | null {
  const suppliedAreaName = lead.areaName?.trim() || lead.area?.name.trim();

  if (suppliedAreaName) {
    const byName = areas.find(
      (area) => area.name.toLowerCase() === suppliedAreaName.toLowerCase()
    );

    if (byName) {
      return byName;
    }
  }

  const postalCode = normalizePostalCode(lead.postalCode ?? "");

  if (!postalCode) {
    return null;
  }

  return (
    areas.find((area) =>
      parsePostalPrefixes(area).some((prefix) => postalCode.startsWith(prefix))
    ) ?? null
  );
}

export async function getCurrentMonthLeadCount(
  orderId: string,
  now: Date = new Date()
): Promise<number> {
  const { start, end } = currentMonthRange(now);

  return prisma.lead.count({
    where: {
      assignedOrderId: orderId,
      createdAt: {
        gte: start,
        lt: end
      }
    }
  });
}

export function calculatePaceGap(
  order: Pick<DealerOrder, "monthlyQuota">,
  deliveredCount: number,
  now: Date = new Date()
): number {
  const remainingQuota = Math.max(0, order.monthlyQuota - deliveredCount);
  const daysRemaining = Math.max(daysRemainingInMonth(now), 1);

  return remainingQuota / daysRemaining;
}

export function rankEligibleOrders<TOrder extends PaceOrder>(
  orders: TOrder[],
  now: Date = new Date()
): TOrder[] {
  return orders
    .filter((order) => {
      const deliveredCount = order.deliveredThisMonth ?? 0;
      return order.status === "active" && deliveredCount < order.monthlyQuota;
    })
    .sort((a, b) => {
      const aDelivered = a.deliveredThisMonth ?? 0;
      const bDelivered = b.deliveredThisMonth ?? 0;
      const gapDelta =
        calculatePaceGap(b, bDelivered, now) -
        calculatePaceGap(a, aDelivered, now);

      if (gapDelta !== 0) {
        return gapDelta;
      }

      if (aDelivered !== bDelivered) {
        return aDelivered - bDelivered;
      }

      return a.startDate.getTime() - b.startDate.getTime();
    });
}

export async function routeLead(
  leadId: string,
  now: Date = new Date()
): Promise<RouteResult> {
  return prisma.$transaction(async (tx) => {
    const lead = await tx.lead.findUnique({
      where: {
        id: leadId
      },
      include: {
        area: {
          select: {
            name: true
          }
        }
      }
    });

    if (!lead) {
      throw new Error("Lead was not found.");
    }

    const areas = await tx.area.findMany();
    const area = resolveAreaForLead(lead, areas);

    if (!area) {
      await markUnrouted(tx, lead, "no_area_match", null, [], [], now);
      return {
        order: null,
        reason: "no_area_match"
      };
    }

    const activeOrders = await tx.dealerOrder.findMany({
      where: {
        status: "active",
        areas: {
          some: {
            areaId: area.id
          }
        }
      },
      include: {
        account: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (activeOrders.length === 0) {
      await markUnrouted(
        tx,
        lead,
        "no_matching_active_order",
        area,
        [],
        [],
        now
      );
      return {
        order: null,
        reason: "no_matching_active_order"
      };
    }

    const ordersWithCounts: RouteOrder[] = [];

    for (const order of activeOrders) {
      ordersWithCounts.push({
        ...order,
        deliveredThisMonth: await countCurrentMonthLeads(tx, order.id, now)
      });
    }

    const rankedOrders = rankEligibleOrders(ordersWithCounts, now);

    if (rankedOrders.length === 0) {
      await markUnrouted(
        tx,
        lead,
        "all_orders_at_quota",
        area,
        activeOrders,
        [],
        now
      );
      return {
        order: null,
        reason: "all_orders_at_quota"
      };
    }

    const winningOrder = rankedOrders[0];
    if (!winningOrder) {
      // Unreachable: the rankedOrders.length === 0 guard above already returned.
      throw new Error("Ranked orders unexpectedly empty after capacity ranking.");
    }
    const rankedOrderSummaries = rankedOrders.map((order, index) => ({
      orderId: order.id,
      dealerName: order.name,
      paceGap: Number(
        calculatePaceGap(order, order.deliveredThisMonth, now).toFixed(2)
      ),
      rank: index + 1
    }));
    const paceGap = calculatePaceGap(
      winningOrder,
      winningOrder.deliveredThisMonth,
      now
    );
    const routingSummary = `Resolved ${area.name}; selected ${winningOrder.name} for ${winningOrder.account.name} with ${winningOrder.deliveredThisMonth}/${winningOrder.monthlyQuota} leads delivered and pace gap ${paceGap.toFixed(2)}.`;

    await tx.lead.update({
      where: {
        id: lead.id
      },
      data: {
        status: "assigned",
        areaId: area.id,
        assignedOrderId: winningOrder.id,
        assignmentReason: "routed"
      }
    });

    await tx.activity.create({
      data: {
        accountId: winningOrder.accountId,
        leadId: lead.id,
        type: "routing_event",
        title: `${lead.firstName} ${lead.lastName} routed to ${winningOrder.name}`,
        rawText: routingPayloadString({
          lead,
          area,
          filteredOrders: activeOrders,
          rankedOrders: rankedOrderSummaries,
          selectedOrderId: winningOrder.id,
          summary: routingSummary
        }),
        summary: routingSummary,
        nextStep: "Dealer should contact the assigned lead.",
        createdAt: now
      }
    });

    return {
      order: winningOrder,
      reason: "routed"
    };
  });
}

export function currentMonthRange(now: Date) {
  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1),
    end: new Date(now.getFullYear(), now.getMonth() + 1, 1)
  };
}

export function daysRemainingInMonth(now: Date) {
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return (
    Math.floor(
      (new Date(now.getFullYear(), now.getMonth(), lastDay).getTime() -
        new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) /
        millisecondsPerDay
    ) + 1
  );
}

async function countCurrentMonthLeads(
  tx: TransactionClient,
  orderId: string,
  now: Date
) {
  const { start, end } = currentMonthRange(now);

  return tx.lead.count({
    where: {
      assignedOrderId: orderId,
      createdAt: {
        gte: start,
        lt: end
      }
    }
  });
}

async function markUnrouted(
  tx: TransactionClient,
  inputLead: RoutingLead,
  reason: Exclude<AssignmentReason, "routed">,
  area: Pick<Area, "id" | "name"> | null,
  filteredOrders: readonly Pick<DealerOrder, "id">[],
  rankedOrders: readonly {
    orderId: string;
    dealerName: string;
    paceGap: number;
    rank: number;
  }[],
  now: Date
) {
  const lead = await tx.lead.update({
    where: {
      id: inputLead.id
    },
    data: {
      status: "new",
      areaId: area?.id ?? null,
      assignedOrderId: null,
      assignmentReason: reason
    }
  });
  const routingSummary = failureSummary(reason);

  await tx.activity.create({
    data: {
      leadId: lead.id,
      type: "routing_event",
      title: `${lead.firstName} ${lead.lastName} was not routed`,
      rawText: routingPayloadString({
        lead,
        area,
        filteredOrders,
        rankedOrders,
        selectedOrderId: null,
        summary: routingSummary
      }),
      summary: routingSummary,
      nextStep: "Review routing coverage and active order capacity.",
      createdAt: now
    }
  });

  logger.warn("lead_routing_unrouted", {
    leadId: lead.id,
    reason,
    areaId: area?.id ?? null,
    areaName: area?.name ?? null,
    activeOrderCount: filteredOrders.length,
    rankedOrderCount: rankedOrders.length
  });
}

function failureSummary(reason: Exclude<AssignmentReason, "routed">) {
  const summaries: Record<Exclude<AssignmentReason, "routed">, string> = {
    no_area_match: "No area matched the lead postal code.",
    no_matching_active_order: "The resolved area has no active dealer order.",
    all_orders_at_quota:
      "All active dealer orders in the resolved area are at monthly quota."
  };

  return summaries[reason];
}

function routingPayloadString(input: {
  lead: RoutingLead;
  area: Pick<Area, "id" | "name"> | null;
  filteredOrders: readonly Pick<DealerOrder, "id">[];
  rankedOrders: readonly {
    orderId: string;
    dealerName: string;
    paceGap: number;
    rank: number;
  }[];
  selectedOrderId: string | null;
  summary: string;
}) {
  const postal = postalTrace(input.lead.postalCode);
  const steps: RoutingPayloadStep[] = [
    {
      step: "normalize",
      result: postal.normalized
    },
    {
      step: "extract_prefix",
      result: postal.prefix
    },
    {
      step: "match_area",
      result: input.area ? { id: input.area.id, name: input.area.name } : null
    },
    {
      step: "filter_orders",
      result: {
        count: input.filteredOrders.length,
        orderIds: input.filteredOrders.map((order) => order.id)
      }
    },
    {
      step: "rank_pace_gap",
      result: input.rankedOrders
    },
    {
      step: "select",
      result: {
        orderId: input.selectedOrderId
      }
    }
  ];

  return JSON.stringify({
    version: 1,
    input: {
      postal: postal.compact,
      leadId: input.lead.id
    },
    steps,
    summary: input.summary
  });
}

function postalTrace(postalCode: string | null) {
  const compact = normalizePostalCode(postalCode ?? "");
  const normalized =
    normalizeDisplayPostalCode(postalCode ?? "", "CA") ?? compact;
  const prefix = normalized.includes(" ")
    ? extractPostalPrefix(normalized, "CA")
    : compact.slice(0, 3);

  return {
    compact,
    normalized,
    prefix
  };
}
