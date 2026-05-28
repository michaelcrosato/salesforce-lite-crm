import type { Area, Prisma } from "@prisma/client";
import { ASSIGNMENT_REASONS, type AssignmentReason } from "@/lib/crm-constants";
import { prisma } from "@/lib/prisma";
import {
  calculatePaceGap,
  currentMonthRange,
  rankEligibleOrders,
  resolveAreaForLead
} from "@/lib/routing/leadRouter";
import {
  ROUTING_SIMULATOR_INPUT_VERSION,
  getRoutingSimulatorGuardrails,
  validateRoutingSimulatorInputDraft,
  type RoutingSimulatorGuardrails,
  type RoutingSimulatorInputRow,
  type RoutingSimulatorWriteFlags
} from "@/lib/server/routingSimulatorContracts";

export const ROUTING_SIMULATOR_EVALUATION_VERSION =
  "2026-05-27.s52-f2" as const;

export type RoutingSimulatorEvaluationOptions = {
  now?: Date;
};

export type RoutingSimulatorEvaluationJson =
  | string
  | number
  | boolean
  | null
  | { readonly [key: string]: RoutingSimulatorEvaluationJson }
  | readonly RoutingSimulatorEvaluationJson[];

export type RoutingSimulatorEvaluationStep = {
  step:
    | "normalize"
    | "extract_prefix"
    | "match_area"
    | "filter_orders"
    | "rank_pace_gap"
    | "select";
  result: RoutingSimulatorEvaluationJson;
};

export type RoutingSimulatorEvaluationReadFlags = {
  metadata: true;
  hypotheticalInput: true;
  database: true;
  crmRecords: true;
  areas: true;
  dealerOrders: true;
  liveRouting: false;
  pacingEngine: true;
  routeHandlers: false;
  externalServices: false;
};

export type RoutingSimulatorEvaluationSafety = {
  deterministic: true;
  readOnly: true;
  validatesInputs: true;
  fixtureOnly: false;
  assignmentEvaluation: true;
  liveRouting: false;
  leadCreation: false;
  routingEventWrites: false;
  dealerOrderMutation: false;
  pacingMutation: false;
  forecastPersistence: false;
  geocoding: false;
  externalAi: false;
  network: false;
  productUi: false;
  routeHandlers: false;
};

export type RoutingSimulatorMatchedArea = {
  id: string;
  name: string;
};

export type RoutingSimulatorFilteredOrder = {
  orderId: string;
  dealerName: string;
  accountId: string;
  accountName: string;
  monthlyQuota: number;
  deliveredThisMonth: number;
  remainingQuota: number;
  status: "active";
};

export type RoutingSimulatorRankedOrder = RoutingSimulatorFilteredOrder & {
  paceGap: number;
  rank: number;
};

export type RoutingSimulatorEvaluationRow = {
  rowNumber: number;
  referenceId: string | null;
  normalizedPostalCode: string;
  postalPrefix: string;
  matchedArea: RoutingSimulatorMatchedArea | null;
  filteredOrders: readonly RoutingSimulatorFilteredOrder[];
  rankedOrders: readonly RoutingSimulatorRankedOrder[];
  selectedOrder: RoutingSimulatorRankedOrder | null;
  status: "assigned" | "blocked";
  reason: AssignmentReason;
  summary: string;
  steps: readonly RoutingSimulatorEvaluationStep[];
};

export type RoutingSimulatorEvaluationSummary = {
  leadCount: number;
  assignedCount: number;
  blockedCount: number;
  reasonCounts: Record<AssignmentReason, number>;
  selectedOrderCounts: readonly {
    orderId: string;
    dealerName: string;
    count: number;
  }[];
};

export type RoutingSimulatorEvaluationPacket = {
  packetType: "routing-simulator-evaluation";
  evaluationVersion: typeof ROUTING_SIMULATOR_EVALUATION_VERSION;
  inputCatalogVersion: typeof ROUTING_SIMULATOR_INPUT_VERSION;
  evaluatedAt: Date;
  leadCount: number;
  rows: readonly RoutingSimulatorEvaluationRow[];
  summary: RoutingSimulatorEvaluationSummary;
  guardrails: RoutingSimulatorGuardrails;
  source: {
    evaluatorModule: "lib/server/routingSimulatorEvaluator.ts";
    inputContractModule: "lib/server/routingSimulatorContracts.ts";
    routingModule: "lib/routing/leadRouter.ts";
    evaluationScope: "read-only-hypothetical-routing";
  };
  read: RoutingSimulatorEvaluationReadFlags;
  write: RoutingSimulatorWriteFlags;
  safety: RoutingSimulatorEvaluationSafety;
};

type RoutingArea = Pick<Area, "id" | "name" | "postalPrefixes">;
type ActiveDealerOrder = Prisma.DealerOrderGetPayload<{
  include: typeof activeDealerOrderInclude;
}> & {
  deliveredThisMonth: number;
};

const activeDealerOrderInclude = {
  account: {
    select: {
      id: true,
      name: true
    }
  },
  areas: {
    select: {
      areaId: true
    }
  }
} as const;

export async function evaluateRoutingSimulatorBatch(
  input: unknown,
  options: RoutingSimulatorEvaluationOptions = {}
): Promise<RoutingSimulatorEvaluationPacket> {
  const now = options.now ?? new Date();
  const draft = validateRoutingSimulatorInputDraft(input);
  const [areas, activeOrders] = await Promise.all([
    prisma.area.findMany({
      select: {
        id: true,
        name: true,
        postalPrefixes: true
      },
      orderBy: [
        {
          name: "asc"
        },
        {
          id: "asc"
        }
      ]
    }),
    loadActiveDealerOrders(now)
  ]);
  const rows = draft.leads.map((lead) =>
    evaluateLead(lead, areas, activeOrders, now)
  );

  return {
    packetType: "routing-simulator-evaluation",
    evaluationVersion: ROUTING_SIMULATOR_EVALUATION_VERSION,
    inputCatalogVersion: ROUTING_SIMULATOR_INPUT_VERSION,
    evaluatedAt: now,
    leadCount: rows.length,
    rows,
    summary: summarizeRows(rows),
    guardrails: getRoutingSimulatorGuardrails(),
    source: {
      evaluatorModule: "lib/server/routingSimulatorEvaluator.ts",
      inputContractModule: "lib/server/routingSimulatorContracts.ts",
      routingModule: "lib/routing/leadRouter.ts",
      evaluationScope: "read-only-hypothetical-routing"
    },
    read: evaluationReadFlags(),
    write: noWriteFlags(),
    safety: evaluationSafetyFlags()
  };
}

async function loadActiveDealerOrders(
  now: Date
): Promise<ActiveDealerOrder[]> {
  const orders = await prisma.dealerOrder.findMany({
    where: {
      status: "active"
    },
    include: activeDealerOrderInclude,
    orderBy: [
      {
        startDate: "asc"
      },
      {
        id: "asc"
      }
    ]
  });

  return Promise.all(
    orders.map(async (order) => ({
      ...order,
      deliveredThisMonth: await countCurrentMonthLeads(order.id, now)
    }))
  );
}

async function countCurrentMonthLeads(orderId: string, now: Date) {
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

function evaluateLead(
  lead: RoutingSimulatorInputRow,
  areas: RoutingArea[],
  activeOrders: ActiveDealerOrder[],
  now: Date
): RoutingSimulatorEvaluationRow {
  const area = resolveAreaForLead(
    {
      postalCode: lead.normalizedPostalCode
    },
    areas
  );
  const filteredOrders = area
    ? activeOrders.filter((order) => orderCoversArea(order, area.id))
    : [];
  const rankedOrders = rankEligibleOrders(filteredOrders, now).map(
    (order, index) => rankedOrderSummary(order, index + 1, now)
  );
  const selectedOrder = rankedOrders[0] ?? null;
  const reason = resolveReason(area, filteredOrders, rankedOrders);
  const status = reason === "routed" ? "assigned" : "blocked";
  const matchedArea = area ? matchedAreaSummary(area) : null;
  const summary = evaluationSummary(reason, matchedArea, selectedOrder);

  return {
    rowNumber: lead.rowNumber,
    referenceId: lead.referenceId,
    normalizedPostalCode: lead.normalizedPostalCode,
    postalPrefix: lead.postalPrefix,
    matchedArea,
    filteredOrders: filteredOrders.map(filteredOrderSummary),
    rankedOrders,
    selectedOrder,
    status,
    reason,
    summary,
    steps: evaluationSteps(lead, matchedArea, filteredOrders, rankedOrders)
  };
}

function orderCoversArea(order: ActiveDealerOrder, areaId: string) {
  return order.areas.some((link) => link.areaId === areaId);
}

function resolveReason(
  area: RoutingArea | null,
  filteredOrders: readonly ActiveDealerOrder[],
  rankedOrders: readonly RoutingSimulatorRankedOrder[]
): AssignmentReason {
  if (!area) {
    return "no_area_match";
  }

  if (filteredOrders.length === 0) {
    return "no_matching_active_order";
  }

  if (rankedOrders.length === 0) {
    return "all_orders_at_quota";
  }

  return "routed";
}

function matchedAreaSummary(area: RoutingArea): RoutingSimulatorMatchedArea {
  return {
    id: area.id,
    name: area.name
  };
}

function filteredOrderSummary(
  order: ActiveDealerOrder
): RoutingSimulatorFilteredOrder {
  return {
    orderId: order.id,
    dealerName: order.name,
    accountId: order.account.id,
    accountName: order.account.name,
    monthlyQuota: order.monthlyQuota,
    deliveredThisMonth: order.deliveredThisMonth,
    remainingQuota: Math.max(0, order.monthlyQuota - order.deliveredThisMonth),
    status: "active"
  };
}

function rankedOrderSummary(
  order: ActiveDealerOrder,
  rank: number,
  now: Date
): RoutingSimulatorRankedOrder {
  return {
    ...filteredOrderSummary(order),
    paceGap: Number(
      calculatePaceGap(order, order.deliveredThisMonth, now).toFixed(2)
    ),
    rank
  };
}

function evaluationSummary(
  reason: AssignmentReason,
  area: RoutingSimulatorMatchedArea | null,
  selectedOrder: RoutingSimulatorRankedOrder | null
) {
  if (reason === "routed" && area && selectedOrder) {
    return `Resolved ${area.name}; selected ${selectedOrder.dealerName} for ${selectedOrder.accountName} with ${selectedOrder.deliveredThisMonth}/${selectedOrder.monthlyQuota} leads delivered and pace gap ${selectedOrder.paceGap.toFixed(2)}.`;
  }

  if (reason === "no_area_match") {
    return "No area matched the hypothetical lead postal code.";
  }

  if (reason === "no_matching_active_order") {
    return "The resolved area has no active dealer order.";
  }

  return "All active dealer orders in the resolved area are at monthly quota.";
}

function evaluationSteps(
  lead: RoutingSimulatorInputRow,
  matchedArea: RoutingSimulatorMatchedArea | null,
  filteredOrders: readonly ActiveDealerOrder[],
  rankedOrders: readonly RoutingSimulatorRankedOrder[]
): RoutingSimulatorEvaluationStep[] {
  const selectedOrder = rankedOrders[0] ?? null;

  return [
    {
      step: "normalize",
      result: lead.normalizedPostalCode
    },
    {
      step: "extract_prefix",
      result: lead.postalPrefix
    },
    {
      step: "match_area",
      result: matchedArea
    },
    {
      step: "filter_orders",
      result: {
        count: filteredOrders.length,
        orderIds: filteredOrders.map((order) => order.id)
      }
    },
    {
      step: "rank_pace_gap",
      result: rankedOrders
    },
    {
      step: "select",
      result: {
        orderId: selectedOrder?.orderId ?? null
      }
    }
  ];
}

function summarizeRows(
  rows: readonly RoutingSimulatorEvaluationRow[]
): RoutingSimulatorEvaluationSummary {
  const reasonCounts = emptyReasonCounts();
  const selectedOrderCounts = new Map<
    string,
    { orderId: string; dealerName: string; count: number }
  >();
  let assignedCount = 0;

  for (const row of rows) {
    reasonCounts[row.reason] += 1;

    if (row.reason !== "routed" || !row.selectedOrder) {
      continue;
    }

    assignedCount += 1;

    const existing = selectedOrderCounts.get(row.selectedOrder.orderId);

    if (existing) {
      existing.count += 1;
    } else {
      selectedOrderCounts.set(row.selectedOrder.orderId, {
        orderId: row.selectedOrder.orderId,
        dealerName: row.selectedOrder.dealerName,
        count: 1
      });
    }
  }

  return {
    leadCount: rows.length,
    assignedCount,
    blockedCount: rows.length - assignedCount,
    reasonCounts,
    selectedOrderCounts: [...selectedOrderCounts.values()].sort((a, b) => {
      if (a.count !== b.count) {
        return b.count - a.count;
      }

      return a.dealerName.localeCompare(b.dealerName);
    })
  };
}

function emptyReasonCounts(): Record<AssignmentReason, number> {
  return ASSIGNMENT_REASONS.reduce(
    (counts, reason) => ({
      ...counts,
      [reason]: 0
    }),
    {
      routed: 0,
      no_area_match: 0,
      no_matching_active_order: 0,
      all_orders_at_quota: 0
    }
  );
}

function evaluationReadFlags(): RoutingSimulatorEvaluationReadFlags {
  return {
    metadata: true,
    hypotheticalInput: true,
    database: true,
    crmRecords: true,
    areas: true,
    dealerOrders: true,
    liveRouting: false,
    pacingEngine: true,
    routeHandlers: false,
    externalServices: false
  };
}

function noWriteFlags(): RoutingSimulatorWriteFlags {
  return {
    database: false,
    leads: false,
    activities: false,
    routingEvents: false,
    dealerOrders: false,
    areas: false,
    pacingEngine: false,
    forecasts: false,
    routes: false,
    files: false,
    externalServices: false,
    backgroundJobs: false
  };
}

function evaluationSafetyFlags(): RoutingSimulatorEvaluationSafety {
  return {
    deterministic: true,
    readOnly: true,
    validatesInputs: true,
    fixtureOnly: false,
    assignmentEvaluation: true,
    liveRouting: false,
    leadCreation: false,
    routingEventWrites: false,
    dealerOrderMutation: false,
    pacingMutation: false,
    forecastPersistence: false,
    geocoding: false,
    externalAi: false,
    network: false,
    productUi: false,
    routeHandlers: false
  };
}
