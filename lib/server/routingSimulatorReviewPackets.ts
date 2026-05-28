import { z } from "zod";
import type { AssignmentReason } from "@/lib/crm-constants";
import {
  ROUTING_SIMULATOR_EVALUATION_VERSION,
  evaluateRoutingSimulatorBatch,
  type RoutingSimulatorEvaluationPacket,
  type RoutingSimulatorEvaluationReadFlags,
  type RoutingSimulatorEvaluationRow,
  type RoutingSimulatorEvaluationStep,
  type RoutingSimulatorMatchedArea,
  type RoutingSimulatorRankedOrder,
  type RoutingSimulatorEvaluationSummary
} from "@/lib/server/routingSimulatorEvaluator";
import {
  ROUTING_SIMULATOR_INPUT_CONTENT_TYPE,
  ROUTING_SIMULATOR_INPUT_VERSION,
  getRoutingSimulatorGuardrails,
  type RoutingSimulatorGuardrails,
  type RoutingSimulatorWriteFlags
} from "@/lib/server/routingSimulatorContracts";

export const ROUTING_SIMULATOR_REVIEW_PACKET_CONTENT_TYPE =
  ROUTING_SIMULATOR_INPUT_CONTENT_TYPE;
export const ROUTING_SIMULATOR_REVIEW_PACKET_VERSION =
  "2026-05-28.s53-f1" as const;
export const ROUTING_SIMULATOR_REVIEW_DEFAULT_SAMPLE_LIMIT = 5;
export const ROUTING_SIMULATOR_REVIEW_MAX_SAMPLE_LIMIT = 10;

export type RoutingSimulatorReviewStatus =
  | "all_assigned"
  | "partially_blocked"
  | "all_blocked";

export type RoutingSimulatorReviewIssueCode = Exclude<
  AssignmentReason,
  "routed"
>;

export type RoutingSimulatorReviewIssue = {
  readonly code: RoutingSimulatorReviewIssueCode;
  readonly severity: "warning";
  readonly count: number;
  readonly rowNumbers: readonly number[];
  readonly message: string;
};

export type RoutingSimulatorReviewSelectedOrder = Pick<
  RoutingSimulatorRankedOrder,
  | "orderId"
  | "dealerName"
  | "accountId"
  | "accountName"
  | "monthlyQuota"
  | "deliveredThisMonth"
  | "remainingQuota"
  | "paceGap"
  | "rank"
>;

export type RoutingSimulatorReviewRowSample = {
  readonly rowNumber: number;
  readonly referenceId: string | null;
  readonly normalizedPostalCode: string;
  readonly postalPrefix: string;
  readonly status: "assigned" | "blocked";
  readonly reason: AssignmentReason;
  readonly summary: string;
  readonly matchedArea: RoutingSimulatorMatchedArea | null;
  readonly selectedOrder: RoutingSimulatorReviewSelectedOrder | null;
  readonly filteredOrderCount: number;
  readonly candidateOrderCount: number;
  readonly steps: readonly RoutingSimulatorEvaluationStep[];
};

export type RoutingSimulatorCapacityImpact = {
  readonly orderId: string;
  readonly dealerName: string;
  readonly accountId: string;
  readonly accountName: string;
  readonly monthlyQuota: number;
  readonly deliveredThisMonth: number;
  readonly remainingQuota: number;
  readonly simulatedAssignedLeadCount: number;
  readonly projectedDeliveredThisMonth: number;
  readonly projectedRemainingQuota: number;
  readonly note: string;
};

export type RoutingSimulatorReviewSummary = {
  readonly leadCount: number;
  readonly assignedCount: number;
  readonly blockedCount: number;
  readonly assignmentRate: number;
  readonly reviewStatus: RoutingSimulatorReviewStatus;
  readonly issueCount: number;
  readonly issueCategoryCount: number;
  readonly blockedReasonCounts: Record<RoutingSimulatorReviewIssueCode, number>;
  readonly selectedOrderCount: number;
  readonly capacityImpactNoteCount: number;
  readonly sampleCount: number;
  readonly sampleLimit: number;
};

export type RoutingSimulatorReviewReadFlags =
  RoutingSimulatorEvaluationReadFlags & {
    readonly reviewPacket: true;
    readonly evaluationRows: true;
    readonly capacityImpact: true;
  };

export type RoutingSimulatorReviewWriteFlags = RoutingSimulatorWriteFlags & {
  readonly scenarioPersistence: false;
  readonly simulatorRuns: false;
};

export type RoutingSimulatorReviewSafety = {
  readonly deterministic: true;
  readonly reviewOnly: true;
  readonly readOnly: true;
  readonly validatesInputs: true;
  readonly assignmentEvaluation: true;
  readonly liveRouting: false;
  readonly leadCreation: false;
  readonly routingEventWrites: false;
  readonly dealerOrderMutation: false;
  readonly pacingMutation: false;
  readonly forecastPersistence: false;
  readonly scenarioPersistence: false;
  readonly geocoding: false;
  readonly externalAi: false;
  readonly network: false;
  readonly productUi: false;
  readonly routeHandlers: false;
  readonly backgroundJobs: false;
};

export type RoutingSimulatorReviewPacket = {
  readonly contentType: typeof ROUTING_SIMULATOR_REVIEW_PACKET_CONTENT_TYPE;
  readonly packetType: "routing-simulator-review-packet";
  readonly packetVersion: typeof ROUTING_SIMULATOR_REVIEW_PACKET_VERSION;
  readonly inputCatalogVersion: typeof ROUTING_SIMULATOR_INPUT_VERSION;
  readonly evaluationVersion: typeof ROUTING_SIMULATOR_EVALUATION_VERSION;
  readonly reviewedAt: Date;
  readonly leadCount: number;
  readonly rowSampleLimit: number;
  readonly evaluationSummary: RoutingSimulatorEvaluationSummary;
  readonly summary: RoutingSimulatorReviewSummary;
  readonly issues: readonly RoutingSimulatorReviewIssue[];
  readonly capacityImpact: readonly RoutingSimulatorCapacityImpact[];
  readonly rowSamples: readonly RoutingSimulatorReviewRowSample[];
  readonly guardrails: RoutingSimulatorGuardrails;
  readonly source: {
    readonly reviewModule: "lib/server/routingSimulatorReviewPackets.ts";
    readonly evaluatorModule: "lib/server/routingSimulatorEvaluator.ts";
    readonly inputContractModule: "lib/server/routingSimulatorContracts.ts";
    readonly routingModule: "lib/routing/leadRouter.ts";
    readonly packetScope: "read-only-routing-simulator-review-packet";
  };
  readonly read: RoutingSimulatorReviewReadFlags;
  readonly write: RoutingSimulatorReviewWriteFlags;
  readonly safety: RoutingSimulatorReviewSafety;
};

export type RoutingSimulatorReviewOptions = {
  readonly now?: Date;
  readonly sampleLimit?: number;
};

type ParsedRoutingSimulatorReviewOptions = {
  readonly now?: Date;
  readonly sampleLimit: number;
};

type MutableCapacityImpact = {
  orderId: string;
  dealerName: string;
  accountId: string;
  accountName: string;
  monthlyQuota: number;
  deliveredThisMonth: number;
  remainingQuota: number;
  simulatedAssignedLeadCount: number;
};

const reviewOptionsSchema = z
  .object({
    now: z.date().optional(),
    sampleLimit: z
      .number()
      .int()
      .min(1)
      .max(ROUTING_SIMULATOR_REVIEW_MAX_SAMPLE_LIMIT)
      .optional()
  })
  .strict();

const blockedReasonCodes = [
  "no_area_match",
  "no_matching_active_order",
  "all_orders_at_quota"
] as const satisfies readonly RoutingSimulatorReviewIssueCode[];

export async function buildRoutingSimulatorReviewPacket(
  input: unknown,
  options: RoutingSimulatorReviewOptions = {}
): Promise<RoutingSimulatorReviewPacket> {
  const parsedOptions = parseReviewOptions(options);
  const evaluation = await evaluateRoutingSimulatorBatch(input, {
    now: parsedOptions.now
  });
  const issues = buildIssues(evaluation.rows);
  const capacityImpact = buildCapacityImpact(evaluation.rows);
  const rowSamples = evaluation.rows
    .slice(0, parsedOptions.sampleLimit)
    .map(buildRowSample);

  return {
    contentType: ROUTING_SIMULATOR_REVIEW_PACKET_CONTENT_TYPE,
    packetType: "routing-simulator-review-packet",
    packetVersion: ROUTING_SIMULATOR_REVIEW_PACKET_VERSION,
    inputCatalogVersion: evaluation.inputCatalogVersion,
    evaluationVersion: evaluation.evaluationVersion,
    reviewedAt: evaluation.evaluatedAt,
    leadCount: evaluation.leadCount,
    rowSampleLimit: parsedOptions.sampleLimit,
    evaluationSummary: evaluation.summary,
    summary: buildReviewSummary(
      evaluation,
      issues,
      capacityImpact,
      rowSamples,
      parsedOptions.sampleLimit
    ),
    issues,
    capacityImpact,
    rowSamples,
    guardrails: getRoutingSimulatorGuardrails(),
    source: {
      reviewModule: "lib/server/routingSimulatorReviewPackets.ts",
      evaluatorModule: "lib/server/routingSimulatorEvaluator.ts",
      inputContractModule: "lib/server/routingSimulatorContracts.ts",
      routingModule: "lib/routing/leadRouter.ts",
      packetScope: "read-only-routing-simulator-review-packet"
    },
    read: readFlags(),
    write: noWrites(),
    safety: safetyFlags()
  };
}

function parseReviewOptions(
  options: RoutingSimulatorReviewOptions
): ParsedRoutingSimulatorReviewOptions {
  const parsed = reviewOptionsSchema.parse(options);

  return {
    now: parsed.now,
    sampleLimit:
      parsed.sampleLimit ?? ROUTING_SIMULATOR_REVIEW_DEFAULT_SAMPLE_LIMIT
  };
}

function buildReviewSummary(
  evaluation: RoutingSimulatorEvaluationPacket,
  issues: readonly RoutingSimulatorReviewIssue[],
  capacityImpact: readonly RoutingSimulatorCapacityImpact[],
  rowSamples: readonly RoutingSimulatorReviewRowSample[],
  sampleLimit: number
): RoutingSimulatorReviewSummary {
  return {
    leadCount: evaluation.summary.leadCount,
    assignedCount: evaluation.summary.assignedCount,
    blockedCount: evaluation.summary.blockedCount,
    assignmentRate: rate(evaluation.summary.assignedCount, evaluation.leadCount),
    reviewStatus: reviewStatus(evaluation.summary),
    issueCount: evaluation.summary.blockedCount,
    issueCategoryCount: issues.length,
    blockedReasonCounts: blockedReasonCounts(evaluation.rows),
    selectedOrderCount: evaluation.summary.selectedOrderCounts.length,
    capacityImpactNoteCount: capacityImpact.length,
    sampleCount: rowSamples.length,
    sampleLimit
  };
}

function reviewStatus(
  summary: RoutingSimulatorEvaluationSummary
): RoutingSimulatorReviewStatus {
  if (summary.assignedCount === summary.leadCount) {
    return "all_assigned";
  }

  if (summary.assignedCount === 0) {
    return "all_blocked";
  }

  return "partially_blocked";
}

function buildIssues(
  rows: readonly RoutingSimulatorEvaluationRow[]
): RoutingSimulatorReviewIssue[] {
  return blockedReasonCodes.flatMap((code) => {
    const matchingRows = rows.filter((row) => row.reason === code);

    if (matchingRows.length === 0) {
      return [];
    }

    return [
      {
        code,
        severity: "warning",
        count: matchingRows.length,
        rowNumbers: matchingRows.map((row) => row.rowNumber),
        message: issueMessage(code, matchingRows.length)
      }
    ];
  });
}

function blockedReasonCounts(
  rows: readonly RoutingSimulatorEvaluationRow[]
): Record<RoutingSimulatorReviewIssueCode, number> {
  const counts: Record<RoutingSimulatorReviewIssueCode, number> = {
    no_area_match: 0,
    no_matching_active_order: 0,
    all_orders_at_quota: 0
  };

  for (const row of rows) {
    if (row.reason !== "routed") {
      counts[row.reason] += 1;
    }
  }

  return counts;
}

function issueMessage(
  code: RoutingSimulatorReviewIssueCode,
  count: number
): string {
  switch (code) {
    case "no_area_match":
      return `${count} ${leadNoun(count)} had no matching routing area.`;
    case "no_matching_active_order":
      return `${count} ${leadNoun(count)} resolved to an area with no active dealer order.`;
    case "all_orders_at_quota":
      return `${count} ${leadNoun(count)} resolved to dealer orders already at monthly quota.`;
  }
}

function buildCapacityImpact(
  rows: readonly RoutingSimulatorEvaluationRow[]
): RoutingSimulatorCapacityImpact[] {
  const impacts = new Map<string, MutableCapacityImpact>();

  for (const row of rows) {
    if (!row.selectedOrder) {
      continue;
    }

    const existing = impacts.get(row.selectedOrder.orderId);

    if (existing) {
      existing.simulatedAssignedLeadCount += 1;
      continue;
    }

    impacts.set(row.selectedOrder.orderId, {
      orderId: row.selectedOrder.orderId,
      dealerName: row.selectedOrder.dealerName,
      accountId: row.selectedOrder.accountId,
      accountName: row.selectedOrder.accountName,
      monthlyQuota: row.selectedOrder.monthlyQuota,
      deliveredThisMonth: row.selectedOrder.deliveredThisMonth,
      remainingQuota: row.selectedOrder.remainingQuota,
      simulatedAssignedLeadCount: 1
    });
  }

  return [...impacts.values()]
    .map((impact) => {
      const projectedDeliveredThisMonth =
        impact.deliveredThisMonth + impact.simulatedAssignedLeadCount;
      const projectedRemainingQuota = Math.max(
        0,
        impact.monthlyQuota - projectedDeliveredThisMonth
      );

      return {
        ...impact,
        projectedDeliveredThisMonth,
        projectedRemainingQuota,
        note: capacityImpactNote({
          ...impact,
          projectedDeliveredThisMonth,
          projectedRemainingQuota
        })
      };
    })
    .sort((a, b) => {
      if (a.simulatedAssignedLeadCount !== b.simulatedAssignedLeadCount) {
        return b.simulatedAssignedLeadCount - a.simulatedAssignedLeadCount;
      }

      return a.dealerName.localeCompare(b.dealerName);
    });
}

function capacityImpactNote(
  impact: Omit<RoutingSimulatorCapacityImpact, "note">
): string {
  const projectedRemaining =
    impact.projectedRemainingQuota === 0
      ? "leaving it at monthly quota"
      : `leaving ${impact.projectedRemainingQuota} ${slotNoun(
          impact.projectedRemainingQuota
        )} remaining`;

  return `Simulator would add ${impact.simulatedAssignedLeadCount} ${leadNoun(
    impact.simulatedAssignedLeadCount
  )} to ${impact.dealerName}, moving it from ${impact.deliveredThisMonth}/${impact.monthlyQuota} to ${impact.projectedDeliveredThisMonth}/${impact.monthlyQuota} delivered this month, ${projectedRemaining}.`;
}

function buildRowSample(
  row: RoutingSimulatorEvaluationRow
): RoutingSimulatorReviewRowSample {
  return {
    rowNumber: row.rowNumber,
    referenceId: row.referenceId,
    normalizedPostalCode: row.normalizedPostalCode,
    postalPrefix: row.postalPrefix,
    status: row.status,
    reason: row.reason,
    summary: row.summary,
    matchedArea: row.matchedArea ? { ...row.matchedArea } : null,
    selectedOrder: row.selectedOrder ? selectedOrderSample(row.selectedOrder) : null,
    filteredOrderCount: row.filteredOrders.length,
    candidateOrderCount: row.rankedOrders.length,
    steps: row.steps.map(copyStep)
  };
}

function selectedOrderSample(
  order: RoutingSimulatorRankedOrder
): RoutingSimulatorReviewSelectedOrder {
  return {
    orderId: order.orderId,
    dealerName: order.dealerName,
    accountId: order.accountId,
    accountName: order.accountName,
    monthlyQuota: order.monthlyQuota,
    deliveredThisMonth: order.deliveredThisMonth,
    remainingQuota: order.remainingQuota,
    paceGap: order.paceGap,
    rank: order.rank
  };
}

function copyStep(
  step: RoutingSimulatorEvaluationStep
): RoutingSimulatorEvaluationStep {
  return {
    step: step.step,
    result: step.result
  };
}

function rate(count: number, total: number): number {
  if (total === 0) {
    return 0;
  }

  return Number((count / total).toFixed(2));
}

function readFlags(): RoutingSimulatorReviewReadFlags {
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
    externalServices: false,
    reviewPacket: true,
    evaluationRows: true,
    capacityImpact: true
  };
}

function noWrites(): RoutingSimulatorReviewWriteFlags {
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
    backgroundJobs: false,
    scenarioPersistence: false,
    simulatorRuns: false
  };
}

function safetyFlags(): RoutingSimulatorReviewSafety {
  return {
    deterministic: true,
    reviewOnly: true,
    readOnly: true,
    validatesInputs: true,
    assignmentEvaluation: true,
    liveRouting: false,
    leadCreation: false,
    routingEventWrites: false,
    dealerOrderMutation: false,
    pacingMutation: false,
    forecastPersistence: false,
    scenarioPersistence: false,
    geocoding: false,
    externalAi: false,
    network: false,
    productUi: false,
    routeHandlers: false,
    backgroundJobs: false
  };
}

function leadNoun(count: number): string {
  return count === 1 ? "hypothetical lead" : "hypothetical leads";
}

function slotNoun(count: number): string {
  return count === 1 ? "slot" : "slots";
}
