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
import {
  validateDealerCapacityWindowDraft,
  type DealerCapacityWindowDraft,
  type DealerCapacityWindowInputRow
} from "@/lib/server/dealerCapacityWindowContracts";

export const ROUTING_SIMULATOR_EVALUATION_VERSION =
  "2026-05-28.s55-f2" as const;

export type RoutingSimulatorEvaluationOptions = {
  now?: Date;
  capacityWindows?: unknown;
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
    | "apply_capacity_windows"
    | "select";
  result: RoutingSimulatorEvaluationJson;
};

export type RoutingSimulatorEvaluationReadFlags = {
  metadata: true;
  hypotheticalInput: true;
  hypotheticalCapacityWindows: boolean;
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
  capacityPlanning: boolean;
  liveRouting: false;
  leadCreation: false;
  routingEventWrites: false;
  dealerOrderMutation: false;
  pacingMutation: false;
  capacityPersistence: false;
  forecastPersistence: false;
  scenarioPersistence: false;
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
  deliveredOnCapacityDate: number;
  remainingQuota: number;
  status: "active";
};

export type RoutingSimulatorRankedOrder = RoutingSimulatorFilteredOrder & {
  paceGap: number;
  rank: number;
};

export type RoutingSimulatorCapacityCheckOutcome =
  | "not_configured"
  | "outside_window"
  | "blackout_date"
  | "daily_cap_reached"
  | "available";

export type RoutingSimulatorCapacityCheck = {
  readonly orderId: string;
  readonly dealerName: string;
  readonly evaluatedOn: string;
  readonly eligible: boolean;
  readonly outcome: RoutingSimulatorCapacityCheckOutcome;
  readonly windowRowNumber: number | null;
  readonly windowLabel: string | null;
  readonly dailyCap: number | null;
  readonly deliveredOnDate: number;
  readonly simulatedAssignedOnDate: number;
  readonly availableSlots: number | null;
  readonly blackout: boolean;
};

export type RoutingSimulatorRowCapacity = {
  readonly applied: boolean;
  readonly evaluatedOn: string;
  readonly candidateChecks: readonly RoutingSimulatorCapacityCheck[];
  readonly selectedCheck: RoutingSimulatorCapacityCheck | null;
  readonly blockedByCapacity: boolean;
  readonly overflowed: boolean;
  readonly overflowedFromOrderIds: readonly string[];
};

export type RoutingSimulatorCapacitySummary = {
  readonly applied: boolean;
  readonly evaluatedOn: string;
  readonly windowCount: number;
  readonly blockedCount: number;
  readonly overflowCount: number;
  readonly assignedWithCapacityCount: number;
  readonly outcomeCounts: Record<RoutingSimulatorCapacityCheckOutcome, number>;
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
  capacity: RoutingSimulatorRowCapacity;
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
  capacitySummary: RoutingSimulatorCapacitySummary;
  guardrails: RoutingSimulatorGuardrails;
  source: {
    evaluatorModule: "lib/server/routingSimulatorEvaluator.ts";
    inputContractModule: "lib/server/routingSimulatorContracts.ts";
    capacityContractModule: "lib/server/dealerCapacityWindowContracts.ts";
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
  deliveredOnCapacityDate: number;
};

type CapacityContext = {
  readonly draft: DealerCapacityWindowDraft | null;
  readonly evaluatedOn: string;
  readonly windowsByOrderId: ReadonlyMap<
    string,
    readonly DealerCapacityWindowInputRow[]
  >;
  readonly simulatedAssignmentsByOrderId: Map<string, number>;
};

type CapacitySelection = {
  readonly selectedOrder: RoutingSimulatorRankedOrder | null;
  readonly capacity: RoutingSimulatorRowCapacity;
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
  const capacityDraft =
    options.capacityWindows === undefined
      ? null
      : validateDealerCapacityWindowDraft(options.capacityWindows);
  const capacityContext = buildCapacityContext(capacityDraft, now);
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
    loadActiveDealerOrders(now, capacityContext.evaluatedOn)
  ]);
  const rows = draft.leads.map((lead) =>
    evaluateLead(lead, areas, activeOrders, now, capacityContext)
  );

  return {
    packetType: "routing-simulator-evaluation",
    evaluationVersion: ROUTING_SIMULATOR_EVALUATION_VERSION,
    inputCatalogVersion: ROUTING_SIMULATOR_INPUT_VERSION,
    evaluatedAt: now,
    leadCount: rows.length,
    rows,
    summary: summarizeRows(rows),
    capacitySummary: summarizeCapacity(rows, capacityContext),
    guardrails: getRoutingSimulatorGuardrails(),
    source: {
      evaluatorModule: "lib/server/routingSimulatorEvaluator.ts",
      inputContractModule: "lib/server/routingSimulatorContracts.ts",
      capacityContractModule: "lib/server/dealerCapacityWindowContracts.ts",
      routingModule: "lib/routing/leadRouter.ts",
      evaluationScope: "read-only-hypothetical-routing"
    },
    read: evaluationReadFlags(capacityDraft !== null),
    write: noWriteFlags(),
    safety: evaluationSafetyFlags(capacityDraft !== null)
  };
}

async function loadActiveDealerOrders(
  now: Date,
  capacityDate: string
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
    orders.map(async (order) => {
      const [deliveredThisMonth, deliveredOnCapacityDate] = await Promise.all([
        countCurrentMonthLeads(order.id, now),
        countCapacityDateLeads(order.id, capacityDate)
      ]);

      return {
        ...order,
        deliveredThisMonth,
        deliveredOnCapacityDate
      };
    })
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

async function countCapacityDateLeads(orderId: string, capacityDate: string) {
  const start = calendarDateStart(capacityDate);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

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
  now: Date,
  capacityContext: CapacityContext
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
  const capacitySelection = selectCapacityEligibleOrder(
    rankedOrders,
    capacityContext
  );
  const selectedOrder = capacitySelection.selectedOrder;
  const reason = resolveReason(
    area,
    filteredOrders,
    rankedOrders,
    capacitySelection.capacity
  );
  const status = reason === "routed" ? "assigned" : "blocked";
  const matchedArea = area ? matchedAreaSummary(area) : null;
  const summary = evaluationSummary(
    reason,
    matchedArea,
    selectedOrder,
    capacitySelection.capacity
  );

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
    capacity: capacitySelection.capacity,
    steps: evaluationSteps(
      lead,
      matchedArea,
      filteredOrders,
      rankedOrders,
      capacitySelection.capacity
    )
  };
}

function orderCoversArea(order: ActiveDealerOrder, areaId: string) {
  return order.areas.some((link) => link.areaId === areaId);
}

function resolveReason(
  area: RoutingArea | null,
  filteredOrders: readonly ActiveDealerOrder[],
  rankedOrders: readonly RoutingSimulatorRankedOrder[],
  capacity: RoutingSimulatorRowCapacity
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

  if (capacity.applied && !capacity.selectedCheck) {
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
    deliveredOnCapacityDate: order.deliveredOnCapacityDate,
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
  selectedOrder: RoutingSimulatorRankedOrder | null,
  capacity: RoutingSimulatorRowCapacity
) {
  if (capacity.applied && capacity.blockedByCapacity) {
    return `All ranked dealer orders are blocked by hypothetical capacity windows for ${capacity.evaluatedOn}.`;
  }

  if (reason === "routed" && area && selectedOrder) {
    if (capacity.applied && capacity.overflowed) {
      const overflowedOrderCount = capacity.overflowedFromOrderIds.length;

      return `Resolved ${area.name}; selected ${selectedOrder.dealerName} for ${selectedOrder.accountName} after capacity overflow from ${overflowedOrderCount} higher-ranked ${orderNoun(overflowedOrderCount)}.`;
    }

    if (capacity.applied && capacity.selectedCheck?.outcome === "available") {
      const availableSlots = capacity.selectedCheck.availableSlots ?? 0;

      return `Resolved ${area.name}; selected ${selectedOrder.dealerName} for ${selectedOrder.accountName} with ${availableSlots} capacity ${slotNoun(availableSlots)} available on ${capacity.evaluatedOn}.`;
    }

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
  rankedOrders: readonly RoutingSimulatorRankedOrder[],
  capacity: RoutingSimulatorRowCapacity
): RoutingSimulatorEvaluationStep[] {
  const selectedOrder = rankedOrders[0] ?? null;

  const baseSteps: RoutingSimulatorEvaluationStep[] = [
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
    }
  ];

  if (capacity.applied) {
    baseSteps.push({
      step: "apply_capacity_windows",
      result: {
        evaluatedOn: capacity.evaluatedOn,
        selectedOrderId: capacity.selectedCheck?.orderId ?? null,
        blockedByCapacity: capacity.blockedByCapacity,
        overflowedFromOrderIds: capacity.overflowedFromOrderIds,
        checks: capacity.candidateChecks.map(capacityCheckStep)
      }
    });
  }

  baseSteps.push(
    {
      step: "select",
      result: {
        orderId: capacity.applied
          ? capacity.selectedCheck?.orderId ?? null
          : selectedOrder?.orderId ?? null
      }
    }
  );

  return baseSteps;
}

function buildCapacityContext(
  draft: DealerCapacityWindowDraft | null,
  now: Date
): CapacityContext {
  const windowsByOrderId = new Map<
    string,
    DealerCapacityWindowInputRow[]
  >();

  if (draft) {
    for (const window of draft.windows) {
      const existing = windowsByOrderId.get(window.dealerOrderId);

      if (existing) {
        existing.push(window);
      } else {
        windowsByOrderId.set(window.dealerOrderId, [window]);
      }
    }
  }

  return {
    draft,
    evaluatedOn: calendarDateKey(now),
    windowsByOrderId,
    simulatedAssignmentsByOrderId: new Map<string, number>()
  };
}

function selectCapacityEligibleOrder(
  rankedOrders: readonly RoutingSimulatorRankedOrder[],
  context: CapacityContext
): CapacitySelection {
  if (!context.draft) {
    return {
      selectedOrder: rankedOrders[0] ?? null,
      capacity: {
        applied: false,
        evaluatedOn: context.evaluatedOn,
        candidateChecks: [],
        selectedCheck: null,
        blockedByCapacity: false,
        overflowed: false,
        overflowedFromOrderIds: []
      }
    };
  }

  const candidateChecks = rankedOrders.map((order) =>
    capacityCheckForOrder(order, context)
  );
  const selectedCheckIndex = candidateChecks.findIndex(
    (check) => check.eligible
  );
  const selectedCheck =
    selectedCheckIndex === -1
      ? null
      : candidateChecks[selectedCheckIndex] ?? null;
  const selectedOrder = selectedCheck
    ? rankedOrders.find((order) => order.orderId === selectedCheck.orderId) ??
      null
    : null;

  if (selectedCheck?.outcome === "available") {
    const currentAssignments =
      context.simulatedAssignmentsByOrderId.get(selectedCheck.orderId) ?? 0;
    context.simulatedAssignmentsByOrderId.set(
      selectedCheck.orderId,
      currentAssignments + 1
    );
  }

  const overflowedFromOrderIds =
    selectedCheckIndex > 0
      ? candidateChecks
          .slice(0, selectedCheckIndex)
          .filter((check) => !check.eligible)
          .map((check) => check.orderId)
      : [];

  return {
    selectedOrder,
    capacity: {
      applied: true,
      evaluatedOn: context.evaluatedOn,
      candidateChecks,
      selectedCheck,
      blockedByCapacity: rankedOrders.length > 0 && !selectedCheck,
      overflowed: overflowedFromOrderIds.length > 0,
      overflowedFromOrderIds
    }
  };
}

function capacityCheckForOrder(
  order: RoutingSimulatorRankedOrder,
  context: CapacityContext
): RoutingSimulatorCapacityCheck {
  const simulatedAssignedOnDate =
    context.simulatedAssignmentsByOrderId.get(order.orderId) ?? 0;
  const windows = context.windowsByOrderId.get(order.orderId) ?? [];

  if (windows.length === 0) {
    return capacityCheck({
      order,
      context,
      eligible: true,
      outcome: "not_configured",
      window: null,
      simulatedAssignedOnDate,
      availableSlots: null,
      blackout: false
    });
  }

  const activeWindow =
    windows.find(
      (window) =>
        window.startsOn <= context.evaluatedOn &&
        context.evaluatedOn <= window.endsOn
    ) ?? null;

  if (!activeWindow) {
    return capacityCheck({
      order,
      context,
      eligible: false,
      outcome: "outside_window",
      window: null,
      simulatedAssignedOnDate,
      availableSlots: 0,
      blackout: false
    });
  }

  const blackout = activeWindow.blackoutDates.includes(context.evaluatedOn);

  if (blackout) {
    return capacityCheck({
      order,
      context,
      eligible: false,
      outcome: "blackout_date",
      window: activeWindow,
      simulatedAssignedOnDate,
      availableSlots: 0,
      blackout
    });
  }

  const availableSlots = Math.max(
    0,
    activeWindow.dailyCap -
      order.deliveredOnCapacityDate -
      simulatedAssignedOnDate
  );

  if (availableSlots === 0) {
    return capacityCheck({
      order,
      context,
      eligible: false,
      outcome: "daily_cap_reached",
      window: activeWindow,
      simulatedAssignedOnDate,
      availableSlots,
      blackout: false
    });
  }

  return capacityCheck({
    order,
    context,
    eligible: true,
    outcome: "available",
    window: activeWindow,
    simulatedAssignedOnDate,
    availableSlots,
    blackout: false
  });
}

function capacityCheck(input: {
  readonly order: RoutingSimulatorRankedOrder;
  readonly context: CapacityContext;
  readonly eligible: boolean;
  readonly outcome: RoutingSimulatorCapacityCheckOutcome;
  readonly window: DealerCapacityWindowInputRow | null;
  readonly simulatedAssignedOnDate: number;
  readonly availableSlots: number | null;
  readonly blackout: boolean;
}): RoutingSimulatorCapacityCheck {
  return {
    orderId: input.order.orderId,
    dealerName: input.order.dealerName,
    evaluatedOn: input.context.evaluatedOn,
    eligible: input.eligible,
    outcome: input.outcome,
    windowRowNumber: input.window?.rowNumber ?? null,
    windowLabel: input.window?.label ?? null,
    dailyCap: input.window?.dailyCap ?? null,
    deliveredOnDate: input.order.deliveredOnCapacityDate,
    simulatedAssignedOnDate: input.simulatedAssignedOnDate,
    availableSlots: input.availableSlots,
    blackout: input.blackout
  };
}

function capacityCheckStep(
  check: RoutingSimulatorCapacityCheck
): RoutingSimulatorEvaluationJson {
  return {
    orderId: check.orderId,
    dealerName: check.dealerName,
    eligible: check.eligible,
    outcome: check.outcome,
    windowRowNumber: check.windowRowNumber,
    dailyCap: check.dailyCap,
    deliveredOnDate: check.deliveredOnDate,
    simulatedAssignedOnDate: check.simulatedAssignedOnDate,
    availableSlots: check.availableSlots,
    blackout: check.blackout
  };
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

function summarizeCapacity(
  rows: readonly RoutingSimulatorEvaluationRow[],
  context: CapacityContext
): RoutingSimulatorCapacitySummary {
  const outcomeCounts = emptyCapacityOutcomeCounts();
  let blockedCount = 0;
  let overflowCount = 0;
  let assignedWithCapacityCount = 0;

  for (const row of rows) {
    if (row.capacity.blockedByCapacity) {
      blockedCount += 1;
    }

    if (row.capacity.overflowed) {
      overflowCount += 1;
    }

    if (row.capacity.selectedCheck?.outcome === "available") {
      assignedWithCapacityCount += 1;
    }

    for (const check of row.capacity.candidateChecks) {
      outcomeCounts[check.outcome] += 1;
    }
  }

  return {
    applied: context.draft !== null,
    evaluatedOn: context.evaluatedOn,
    windowCount: context.draft?.windowCount ?? 0,
    blockedCount,
    overflowCount,
    assignedWithCapacityCount,
    outcomeCounts
  };
}

function emptyCapacityOutcomeCounts(): Record<
  RoutingSimulatorCapacityCheckOutcome,
  number
> {
  return {
    not_configured: 0,
    outside_window: 0,
    blackout_date: 0,
    daily_cap_reached: 0,
    available: 0
  };
}

function evaluationReadFlags(
  hypotheticalCapacityWindows: boolean
): RoutingSimulatorEvaluationReadFlags {
  return {
    metadata: true,
    hypotheticalInput: true,
    hypotheticalCapacityWindows,
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

function evaluationSafetyFlags(
  capacityPlanning: boolean
): RoutingSimulatorEvaluationSafety {
  return {
    deterministic: true,
    readOnly: true,
    validatesInputs: true,
    fixtureOnly: false,
    assignmentEvaluation: true,
    capacityPlanning,
    liveRouting: false,
    leadCreation: false,
    routingEventWrites: false,
    dealerOrderMutation: false,
    pacingMutation: false,
    capacityPersistence: false,
    forecastPersistence: false,
    scenarioPersistence: false,
    geocoding: false,
    externalAi: false,
    network: false,
    productUi: false,
    routeHandlers: false
  };
}

function calendarDateKey(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function calendarDateStart(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  if (year === undefined || month === undefined || day === undefined) {
    throw new Error(`Invalid calendar date: ${value}`);
  }

  return new Date(Date.UTC(year, month - 1, day));
}

function slotNoun(count: number): string {
  return count === 1 ? "slot" : "slots";
}

function orderNoun(count: number): string {
  return count === 1 ? "order" : "orders";
}
