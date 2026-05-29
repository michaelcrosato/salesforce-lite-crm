import { z } from "zod/v4";
import type { AssignmentReason } from "@/lib/crm-constants";
import {
  ROUTING_SIMULATOR_INPUT_CONTENT_TYPE,
  ROUTING_SIMULATOR_INPUT_VERSION,
  getRoutingSimulatorGuardrails,
  validateRoutingSimulatorInputDraft,
  type RoutingSimulatorGuardrails,
  type RoutingSimulatorInputRow,
  type RoutingSimulatorWriteFlags
} from "@/lib/server/routingSimulatorContracts";
import {
  ROUTING_SIMULATOR_EVALUATION_VERSION,
  evaluateRoutingSimulatorBatch,
  type RoutingSimulatorEvaluationPacket,
  type RoutingSimulatorEvaluationRow,
  type RoutingSimulatorFilteredOrder,
  type RoutingSimulatorRankedOrder
} from "@/lib/server/routingSimulatorEvaluator";

export const ROUTING_FAIRNESS_METRIC_CONTENT_TYPE =
  ROUTING_SIMULATOR_INPUT_CONTENT_TYPE;
export const ROUTING_FAIRNESS_METRIC_VERSION =
  "2026-05-28.s54-f1" as const;

export type RoutingFairnessMetricKey =
  | "paceGap"
  | "quotaSaturation"
  | "leadQualityProxy"
  | "slaRisk";

export type RoutingFairnessMetricStatus =
  | "ok"
  | "watch"
  | "risk"
  | "blocked";

export type RoutingFairnessMetricBand =
  | "behind_pace"
  | "modest_gap"
  | "available_capacity"
  | "near_saturation"
  | "saturated"
  | "complete"
  | "usable"
  | "thin"
  | "low"
  | "watch"
  | "blocked"
  | "unavailable";

export type RoutingFairnessMetricDefinition = {
  readonly key: RoutingFairnessMetricKey;
  readonly label: string;
  readonly description: string;
  readonly valueType: "ratio" | "score" | "risk" | "gap";
  readonly valueRange: {
    readonly min: number;
    readonly max: number | null;
    readonly nullable: boolean;
  };
  readonly sourceFields: readonly string[];
  readonly outputPath: string;
  readonly writes: RoutingFairnessMetricWriteFlags;
};

export type RoutingFairnessMetricReading = {
  readonly key: RoutingFairnessMetricKey;
  readonly label: string;
  readonly value: number | null;
  readonly status: RoutingFairnessMetricStatus;
  readonly band: RoutingFairnessMetricBand;
  readonly explanation: string;
  readonly evidence: readonly string[];
};

export type RoutingFairnessRowMetrics = {
  readonly paceGap: RoutingFairnessMetricReading;
  readonly quotaSaturation: RoutingFairnessMetricReading;
  readonly leadQualityProxy: RoutingFairnessMetricReading;
  readonly slaRisk: RoutingFairnessMetricReading;
};

export type RoutingFairnessMetricRow = {
  readonly rowNumber: number;
  readonly referenceId: string | null;
  readonly normalizedPostalCode: string;
  readonly postalPrefix: string;
  readonly status: "assigned" | "blocked";
  readonly reason: AssignmentReason;
  readonly matchedAreaId: string | null;
  readonly selectedOrder: RoutingSimulatorRankedOrder | null;
  readonly filteredOrderCount: number;
  readonly candidateOrderCount: number;
  readonly metrics: RoutingFairnessRowMetrics;
};

export type RoutingFairnessSlaRiskCounts = {
  readonly low: number;
  readonly watch: number;
  readonly blocked: number;
};

export type RoutingFairnessMetricSummary = {
  readonly leadCount: number;
  readonly assignedCount: number;
  readonly blockedCount: number;
  readonly metricCount: number;
  readonly averageLeadQualityProxy: number;
  readonly averageAssignedPaceGap: number | null;
  readonly quotaSaturationWatchCount: number;
  readonly quotaSaturationRiskCount: number;
  readonly thinLeadQualityCount: number;
  readonly slaRiskCounts: RoutingFairnessSlaRiskCounts;
};

export type RoutingFairnessMetricReadFlags = {
  readonly metadata: true;
  readonly hypotheticalInput: boolean;
  readonly database: boolean;
  readonly crmRecords: boolean;
  readonly areas: boolean;
  readonly dealerOrders: boolean;
  readonly liveRouting: false;
  readonly pacingEngine: boolean;
  readonly routeHandlers: false;
  readonly externalServices: false;
  readonly routingSimulatorEvaluation: boolean;
  readonly fairnessMetrics: true;
};

export type RoutingFairnessMetricWriteFlags = RoutingSimulatorWriteFlags & {
  readonly metricSnapshots: false;
  readonly fairnessWeights: false;
  readonly routingAssignments: false;
  readonly scenarioPersistence: false;
  readonly simulatorRuns: false;
};

export type RoutingFairnessMetricSafety = {
  readonly deterministic: true;
  readonly readOnly: true;
  readonly metricOnly: true;
  readonly validatesInputs: boolean;
  readonly assignmentEvaluation: boolean;
  readonly liveRouting: false;
  readonly leadCreation: false;
  readonly routingEventWrites: false;
  readonly dealerOrderMutation: false;
  readonly pacingMutation: false;
  readonly routingAlgorithmChanges: false;
  readonly fairnessWeightingChanges: false;
  readonly forecastPersistence: false;
  readonly scenarioPersistence: false;
  readonly geocoding: false;
  readonly externalAi: false;
  readonly network: false;
  readonly productUi: false;
  readonly routeHandlers: false;
  readonly backgroundJobs: false;
};

export type RoutingFairnessMetricCatalog = {
  readonly contentType: typeof ROUTING_FAIRNESS_METRIC_CONTENT_TYPE;
  readonly catalogType: "routing-fairness-metric-contracts";
  readonly catalogVersion: typeof ROUTING_FAIRNESS_METRIC_VERSION;
  readonly inputCatalogVersion: typeof ROUTING_SIMULATOR_INPUT_VERSION;
  readonly evaluationVersion: typeof ROUTING_SIMULATOR_EVALUATION_VERSION;
  readonly metrics: readonly RoutingFairnessMetricDefinition[];
  readonly metricKeys: readonly RoutingFairnessMetricKey[];
  readonly metricCount: number;
  readonly guardrails: RoutingSimulatorGuardrails;
  readonly source: {
    readonly metricModule: "lib/server/routingFairnessMetrics.ts";
    readonly evaluatorModule: "lib/server/routingSimulatorEvaluator.ts";
    readonly inputContractModule: "lib/server/routingSimulatorContracts.ts";
    readonly routingModule: "lib/routing/leadRouter.ts";
    readonly catalogScope: "read-only-routing-fairness-metric-contracts";
  };
  readonly read: RoutingFairnessMetricReadFlags;
  readonly write: RoutingFairnessMetricWriteFlags;
  readonly safety: RoutingFairnessMetricSafety;
};

export type RoutingFairnessMetricPacket = {
  readonly contentType: typeof ROUTING_FAIRNESS_METRIC_CONTENT_TYPE;
  readonly packetType: "routing-fairness-metric-packet";
  readonly packetVersion: typeof ROUTING_FAIRNESS_METRIC_VERSION;
  readonly inputCatalogVersion: typeof ROUTING_SIMULATOR_INPUT_VERSION;
  readonly evaluationVersion: typeof ROUTING_SIMULATOR_EVALUATION_VERSION;
  readonly evaluatedAt: Date;
  readonly leadCount: number;
  readonly metricDefinitions: readonly RoutingFairnessMetricDefinition[];
  readonly summary: RoutingFairnessMetricSummary;
  readonly rows: readonly RoutingFairnessMetricRow[];
  readonly evaluationSummary: RoutingSimulatorEvaluationPacket["summary"];
  readonly guardrails: RoutingSimulatorGuardrails;
  readonly source: {
    readonly metricModule: "lib/server/routingFairnessMetrics.ts";
    readonly evaluatorModule: "lib/server/routingSimulatorEvaluator.ts";
    readonly inputContractModule: "lib/server/routingSimulatorContracts.ts";
    readonly routingModule: "lib/routing/leadRouter.ts";
    readonly packetScope: "read-only-routing-fairness-metric-packet";
  };
  readonly read: RoutingFairnessMetricReadFlags;
  readonly write: RoutingFairnessMetricWriteFlags;
  readonly safety: RoutingFairnessMetricSafety;
};

export type RoutingFairnessMetricOptions = {
  readonly now?: Date;
};

const catalogInputSchema = z.object({}).strict();
const metricOptionsSchema = z
  .object({
    now: z.date().optional()
  })
  .strict();

const metricDefinitions = [
  metricDefinition(
    "paceGap",
    "Pace gap",
    "Selected dealer order pace gap from the existing routing evaluator; higher values indicate more remaining quota pressure per remaining day.",
    "gap",
    0,
    null,
    true,
    [
      "RoutingSimulatorEvaluationRow.selectedOrder.paceGap",
      "RoutingSimulatorEvaluationRow.rankedOrders[].paceGap"
    ],
    "rows[].metrics.paceGap"
  ),
  metricDefinition(
    "quotaSaturation",
    "Quota saturation",
    "Current-month delivered leads divided by monthly quota for the selected or blocking dealer order.",
    "ratio",
    0,
    1,
    true,
    [
      "RoutingSimulatorEvaluationRow.selectedOrder.deliveredThisMonth",
      "RoutingSimulatorEvaluationRow.selectedOrder.monthlyQuota",
      "RoutingSimulatorEvaluationRow.filteredOrders[]"
    ],
    "rows[].metrics.quotaSaturation"
  ),
  metricDefinition(
    "leadQualityProxy",
    "Lead quality proxy",
    "Deterministic input-completeness proxy based on valid postal routing data plus optional name and source context.",
    "score",
    0,
    1,
    false,
    [
      "RoutingSimulatorInputRow.normalizedPostalCode",
      "RoutingSimulatorInputRow.firstName",
      "RoutingSimulatorInputRow.lastName",
      "RoutingSimulatorInputRow.source"
    ],
    "rows[].metrics.leadQualityProxy"
  ),
  metricDefinition(
    "slaRisk",
    "SLA risk",
    "Read-only routing outcome indicator that flags blocked routing or near-saturated assigned orders for later operator review.",
    "risk",
    0,
    1,
    false,
    [
      "RoutingSimulatorEvaluationRow.reason",
      "RoutingSimulatorEvaluationRow.selectedOrder",
      "RoutingSimulatorEvaluationRow.filteredOrders[]"
    ],
    "rows[].metrics.slaRisk"
  )
] as const satisfies readonly RoutingFairnessMetricDefinition[];

export function getRoutingFairnessMetricCatalog(
  input: unknown = {}
): RoutingFairnessMetricCatalog {
  catalogInputSchema.parse(input);

  return {
    contentType: ROUTING_FAIRNESS_METRIC_CONTENT_TYPE,
    catalogType: "routing-fairness-metric-contracts",
    catalogVersion: ROUTING_FAIRNESS_METRIC_VERSION,
    inputCatalogVersion: ROUTING_SIMULATOR_INPUT_VERSION,
    evaluationVersion: ROUTING_SIMULATOR_EVALUATION_VERSION,
    metrics: metricDefinitions.map(copyMetricDefinition),
    metricKeys: metricDefinitions.map((definition) => definition.key),
    metricCount: metricDefinitions.length,
    guardrails: getRoutingSimulatorGuardrails(),
    source: {
      metricModule: "lib/server/routingFairnessMetrics.ts",
      evaluatorModule: "lib/server/routingSimulatorEvaluator.ts",
      inputContractModule: "lib/server/routingSimulatorContracts.ts",
      routingModule: "lib/routing/leadRouter.ts",
      catalogScope: "read-only-routing-fairness-metric-contracts"
    },
    read: readFlags(false),
    write: noWrites(),
    safety: safetyFlags(false, false)
  };
}

export async function buildRoutingFairnessMetricPacket(
  input: unknown,
  options: RoutingFairnessMetricOptions = {}
): Promise<RoutingFairnessMetricPacket> {
  const parsedOptions = metricOptionsSchema.parse(options);
  const draft = validateRoutingSimulatorInputDraft(input);
  const evaluation = await evaluateRoutingSimulatorBatch(input, {
    now: parsedOptions.now
  });
  const inputsByRowNumber = new Map(
    draft.leads.map((lead) => [lead.rowNumber, lead])
  );
  const rows = evaluation.rows.map((row) =>
    buildMetricRow(row, requireInputRow(inputsByRowNumber, row.rowNumber))
  );

  return {
    contentType: ROUTING_FAIRNESS_METRIC_CONTENT_TYPE,
    packetType: "routing-fairness-metric-packet",
    packetVersion: ROUTING_FAIRNESS_METRIC_VERSION,
    inputCatalogVersion: evaluation.inputCatalogVersion,
    evaluationVersion: evaluation.evaluationVersion,
    evaluatedAt: evaluation.evaluatedAt,
    leadCount: evaluation.leadCount,
    metricDefinitions: metricDefinitions.map(copyMetricDefinition),
    summary: summarizeMetricRows(rows, evaluation),
    rows,
    evaluationSummary: evaluation.summary,
    guardrails: getRoutingSimulatorGuardrails(),
    source: {
      metricModule: "lib/server/routingFairnessMetrics.ts",
      evaluatorModule: "lib/server/routingSimulatorEvaluator.ts",
      inputContractModule: "lib/server/routingSimulatorContracts.ts",
      routingModule: "lib/routing/leadRouter.ts",
      packetScope: "read-only-routing-fairness-metric-packet"
    },
    read: readFlags(true),
    write: noWrites(),
    safety: safetyFlags(true, true)
  };
}

function buildMetricRow(
  row: RoutingSimulatorEvaluationRow,
  input: RoutingSimulatorInputRow
): RoutingFairnessMetricRow {
  const quotaSaturation = quotaSaturationMetric(row);
  const metrics = {
    paceGap: paceGapMetric(row),
    quotaSaturation,
    leadQualityProxy: leadQualityMetric(input),
    slaRisk: slaRiskMetric(row, quotaSaturation)
  } satisfies RoutingFairnessRowMetrics;

  return {
    rowNumber: row.rowNumber,
    referenceId: row.referenceId,
    normalizedPostalCode: row.normalizedPostalCode,
    postalPrefix: row.postalPrefix,
    status: row.status,
    reason: row.reason,
    matchedAreaId: row.matchedArea?.id ?? null,
    selectedOrder: row.selectedOrder ? { ...row.selectedOrder } : null,
    filteredOrderCount: row.filteredOrders.length,
    candidateOrderCount: row.rankedOrders.length,
    metrics
  };
}

function paceGapMetric(
  row: RoutingSimulatorEvaluationRow
): RoutingFairnessMetricReading {
  const value = row.selectedOrder?.paceGap ?? null;

  if (value === null) {
    return metricReading(
      "paceGap",
      null,
      "blocked",
      "unavailable",
      "No eligible dealer order was selected, so no selected-order pace gap is available.",
      [`reason:${row.reason}`]
    );
  }

  const status: RoutingFairnessMetricStatus = value >= 0.5 ? "ok" : "watch";
  const band: RoutingFairnessMetricBand =
    value >= 0.5 ? "behind_pace" : "modest_gap";

  return metricReading(
    "paceGap",
    value,
    status,
    band,
    `Selected order ${row.selectedOrder?.dealerName} has a pace gap of ${value.toFixed(2)} leads per remaining day.`,
    [
      `selectedOrder:${row.selectedOrder?.orderId}`,
      `rank:${row.selectedOrder?.rank}`,
      `paceGap:${value.toFixed(2)}`
    ]
  );
}

function quotaSaturationMetric(
  row: RoutingSimulatorEvaluationRow
): RoutingFairnessMetricReading {
  const order = row.selectedOrder ?? mostSaturatedFilteredOrder(row.filteredOrders);

  if (!order) {
    return metricReading(
      "quotaSaturation",
      null,
      "blocked",
      "unavailable",
      "No selected or blocking dealer order is available for quota saturation.",
      [`reason:${row.reason}`]
    );
  }

  const value =
    order.monthlyQuota <= 0
      ? 1
      : roundMetric(order.deliveredThisMonth / order.monthlyQuota);
  const status = quotaSaturationStatus(value);
  const band = quotaSaturationBand(status);

  return metricReading(
    "quotaSaturation",
    value,
    status,
    band,
    `${order.dealerName} is at ${order.deliveredThisMonth}/${order.monthlyQuota} delivered leads for the current month.`,
    [
      `order:${order.orderId}`,
      `deliveredThisMonth:${order.deliveredThisMonth}`,
      `monthlyQuota:${order.monthlyQuota}`
    ]
  );
}

function leadQualityMetric(
  input: RoutingSimulatorInputRow
): RoutingFairnessMetricReading {
  const factors = [
    "postal_valid",
    input.firstName ? "first_name_present" : "first_name_missing",
    input.lastName ? "last_name_present" : "last_name_missing",
    input.source ? "source_present" : "source_missing"
  ];
  const value = roundMetric(
    0.5 +
      (input.firstName ? 0.2 : 0) +
      (input.lastName ? 0.2 : 0) +
      (input.source ? 0.1 : 0)
  );
  const status: RoutingFairnessMetricStatus =
    value >= 0.9 ? "ok" : value >= 0.7 ? "watch" : "risk";
  const band: RoutingFairnessMetricBand =
    value >= 0.9 ? "complete" : value >= 0.7 ? "usable" : "thin";

  return metricReading(
    "leadQualityProxy",
    value,
    status,
    band,
    "Lead quality proxy uses only deterministic input completeness and valid postal routing data.",
    factors
  );
}

function slaRiskMetric(
  row: RoutingSimulatorEvaluationRow,
  quotaSaturation: RoutingFairnessMetricReading
): RoutingFairnessMetricReading {
  if (row.reason !== "routed") {
    return metricReading(
      "slaRisk",
      1,
      "blocked",
      "blocked",
      slaBlockedExplanation(row.reason),
      [`reason:${row.reason}`]
    );
  }

  if (
    quotaSaturation.status === "watch" ||
    quotaSaturation.status === "risk"
  ) {
    return metricReading(
      "slaRisk",
      0.5,
      "watch",
      "watch",
      "The hypothetical lead routes, but the selected order is near quota saturation.",
      quotaSaturation.evidence
    );
  }

  return metricReading(
    "slaRisk",
    0,
    "ok",
    "low",
    "The hypothetical lead routes to an active order with available quota.",
    [`reason:${row.reason}`, `selectedOrder:${row.selectedOrder?.orderId}`]
  );
}

function summarizeMetricRows(
  rows: readonly RoutingFairnessMetricRow[],
  evaluation: RoutingSimulatorEvaluationPacket
): RoutingFairnessMetricSummary {
  const leadQualityValues = rows.map(
    (row) => row.metrics.leadQualityProxy.value ?? 0
  );
  const assignedPaceGapValues = rows
    .map((row) => row.metrics.paceGap.value)
    .filter((value): value is number => value !== null);

  return {
    leadCount: evaluation.summary.leadCount,
    assignedCount: evaluation.summary.assignedCount,
    blockedCount: evaluation.summary.blockedCount,
    metricCount: rows.length * metricDefinitions.length,
    averageLeadQualityProxy: average(leadQualityValues),
    averageAssignedPaceGap:
      assignedPaceGapValues.length > 0 ? average(assignedPaceGapValues) : null,
    quotaSaturationWatchCount: rows.filter(
      (row) => row.metrics.quotaSaturation.status === "watch"
    ).length,
    quotaSaturationRiskCount: rows.filter(
      (row) => row.metrics.quotaSaturation.status === "risk"
    ).length,
    thinLeadQualityCount: rows.filter(
      (row) => row.metrics.leadQualityProxy.status === "risk"
    ).length,
    slaRiskCounts: {
      low: rows.filter((row) => row.metrics.slaRisk.status === "ok").length,
      watch: rows.filter((row) => row.metrics.slaRisk.status === "watch").length,
      blocked: rows.filter((row) => row.metrics.slaRisk.status === "blocked")
        .length
    }
  };
}

function requireInputRow(
  inputsByRowNumber: ReadonlyMap<number, RoutingSimulatorInputRow>,
  rowNumber: number
): RoutingSimulatorInputRow {
  const input = inputsByRowNumber.get(rowNumber);

  if (!input) {
    throw new Error("Routing fairness metric input and evaluation rows diverged.");
  }

  return input;
}

function mostSaturatedFilteredOrder(
  orders: readonly RoutingSimulatorFilteredOrder[]
): RoutingSimulatorFilteredOrder | null {
  return (
    [...orders].sort((a, b) => {
      const saturationDelta = quotaSaturationValue(b) - quotaSaturationValue(a);

      if (saturationDelta !== 0) {
        return saturationDelta;
      }

      return a.dealerName.localeCompare(b.dealerName);
    })[0] ?? null
  );
}

function quotaSaturationValue(order: RoutingSimulatorFilteredOrder): number {
  if (order.monthlyQuota <= 0) {
    return 1;
  }

  return order.deliveredThisMonth / order.monthlyQuota;
}

function quotaSaturationStatus(
  value: number
): RoutingFairnessMetricStatus {
  if (value >= 1) {
    return "risk";
  }

  if (value >= 0.85) {
    return "watch";
  }

  return "ok";
}

function quotaSaturationBand(
  status: RoutingFairnessMetricStatus
): RoutingFairnessMetricBand {
  if (status === "risk") {
    return "saturated";
  }

  if (status === "watch") {
    return "near_saturation";
  }

  return "available_capacity";
}

function slaBlockedExplanation(reason: AssignmentReason): string {
  switch (reason) {
    case "no_area_match":
      return "Routing is blocked because no routing area covers the hypothetical lead postal prefix.";
    case "no_matching_active_order":
      return "Routing is blocked because the matched area has no active dealer order.";
    case "all_orders_at_quota":
      return "Routing is blocked because every active dealer order for the matched area is at monthly quota.";
    case "routed":
      return "The hypothetical lead routes to an active dealer order.";
  }
}

function metricDefinition(
  key: RoutingFairnessMetricKey,
  label: string,
  description: string,
  valueType: RoutingFairnessMetricDefinition["valueType"],
  min: number,
  max: number | null,
  nullable: boolean,
  sourceFields: readonly string[],
  outputPath: string
): RoutingFairnessMetricDefinition {
  return {
    key,
    label,
    description,
    valueType,
    valueRange: {
      min,
      max,
      nullable
    },
    sourceFields: [...sourceFields],
    outputPath,
    writes: noWrites()
  };
}

function metricReading(
  key: RoutingFairnessMetricKey,
  value: number | null,
  status: RoutingFairnessMetricStatus,
  band: RoutingFairnessMetricBand,
  explanation: string,
  evidence: readonly string[]
): RoutingFairnessMetricReading {
  return {
    key,
    label: metricLabel(key),
    value,
    status,
    band,
    explanation,
    evidence: [...evidence]
  };
}

function metricLabel(key: RoutingFairnessMetricKey): string {
  switch (key) {
    case "paceGap":
      return "Pace gap";
    case "quotaSaturation":
      return "Quota saturation";
    case "leadQualityProxy":
      return "Lead quality proxy";
    case "slaRisk":
      return "SLA risk";
  }
}

function readFlags(
  evaluated: boolean
): RoutingFairnessMetricReadFlags {
  return {
    metadata: true,
    hypotheticalInput: evaluated,
    database: evaluated,
    crmRecords: evaluated,
    areas: evaluated,
    dealerOrders: evaluated,
    liveRouting: false,
    pacingEngine: evaluated,
    routeHandlers: false,
    externalServices: false,
    routingSimulatorEvaluation: evaluated,
    fairnessMetrics: true
  };
}

function noWrites(): RoutingFairnessMetricWriteFlags {
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
    metricSnapshots: false,
    fairnessWeights: false,
    routingAssignments: false,
    scenarioPersistence: false,
    simulatorRuns: false
  };
}

function safetyFlags(
  validatesInputs: boolean,
  assignmentEvaluation: boolean
): RoutingFairnessMetricSafety {
  return {
    deterministic: true,
    readOnly: true,
    metricOnly: true,
    validatesInputs,
    assignmentEvaluation,
    liveRouting: false,
    leadCreation: false,
    routingEventWrites: false,
    dealerOrderMutation: false,
    pacingMutation: false,
    routingAlgorithmChanges: false,
    fairnessWeightingChanges: false,
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

function copyMetricDefinition(
  definition: RoutingFairnessMetricDefinition
): RoutingFairnessMetricDefinition {
  return {
    ...definition,
    valueRange: {
      ...definition.valueRange
    },
    sourceFields: [...definition.sourceFields],
    writes: {
      ...definition.writes
    }
  };
}

function average(values: readonly number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return roundMetric(
    values.reduce((total, value) => total + value, 0) / values.length
  );
}

function roundMetric(value: number): number {
  return Number(value.toFixed(2));
}
