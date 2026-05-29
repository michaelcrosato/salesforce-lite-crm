import { z } from "zod/v4";
import type { AssignmentReason } from "@/lib/crm-constants";
import {
  ROUTING_FAIRNESS_METRIC_CONTENT_TYPE,
  ROUTING_FAIRNESS_METRIC_VERSION,
  buildRoutingFairnessMetricPacket,
  type RoutingFairnessMetricBand,
  type RoutingFairnessMetricDefinition,
  type RoutingFairnessMetricKey,
  type RoutingFairnessMetricPacket,
  type RoutingFairnessMetricReadFlags,
  type RoutingFairnessMetricRow,
  type RoutingFairnessMetricSafety,
  type RoutingFairnessMetricStatus,
  type RoutingFairnessMetricSummary,
  type RoutingFairnessMetricWriteFlags
} from "@/lib/server/routingFairnessMetrics";
import {
  ROUTING_SIMULATOR_EVALUATION_VERSION
} from "@/lib/server/routingSimulatorEvaluator";
import {
  ROUTING_SIMULATOR_INPUT_VERSION,
  type RoutingSimulatorGuardrails
} from "@/lib/server/routingSimulatorContracts";

export const ROUTING_FAIRNESS_REVIEW_PACKET_CONTENT_TYPE =
  ROUTING_FAIRNESS_METRIC_CONTENT_TYPE;
export const ROUTING_FAIRNESS_REVIEW_PACKET_VERSION =
  "2026-05-28.s54-f2" as const;
export const ROUTING_FAIRNESS_REVIEW_DEFAULT_SAMPLE_LIMIT = 5;
export const ROUTING_FAIRNESS_REVIEW_MAX_SAMPLE_LIMIT = 10;

export type RoutingFairnessReviewStatus =
  | "clear"
  | "watch"
  | "risk"
  | "blocked";

export type RoutingFairnessReviewIssueCode =
  | "blocked_routing"
  | "quota_saturation_risk"
  | "quota_saturation_watch"
  | "thin_lead_quality"
  | "sla_watch";

export type RoutingFairnessReviewIssueSeverity =
  | "warning"
  | "critical";

export type RoutingFairnessBlockedReason = Exclude<
  AssignmentReason,
  "routed"
>;

export type RoutingFairnessReviewIssue = {
  readonly code: RoutingFairnessReviewIssueCode;
  readonly severity: RoutingFairnessReviewIssueSeverity;
  readonly count: number;
  readonly rowNumbers: readonly number[];
  readonly message: string;
  readonly explanations: readonly string[];
};

export type RoutingFairnessReviewMetricHighlight = {
  readonly key: RoutingFairnessMetricKey;
  readonly label: string;
  readonly value: number | null;
  readonly status: RoutingFairnessMetricStatus;
  readonly band: RoutingFairnessMetricBand;
  readonly explanation: string;
  readonly evidence: readonly string[];
};

export type RoutingFairnessReviewRowSample = {
  readonly rowNumber: number;
  readonly referenceId: string | null;
  readonly normalizedPostalCode: string;
  readonly postalPrefix: string;
  readonly status: "assigned" | "blocked";
  readonly reason: AssignmentReason;
  readonly matchedAreaId: string | null;
  readonly selectedOrder: RoutingFairnessMetricRow["selectedOrder"];
  readonly filteredOrderCount: number;
  readonly candidateOrderCount: number;
  readonly issueCodes: readonly RoutingFairnessReviewIssueCode[];
  readonly explanationReasons: readonly string[];
  readonly metricHighlights: readonly RoutingFairnessReviewMetricHighlight[];
};

export type RoutingFairnessReviewSummary = {
  readonly leadCount: number;
  readonly assignedCount: number;
  readonly blockedCount: number;
  readonly reviewStatus: RoutingFairnessReviewStatus;
  readonly issueCount: number;
  readonly issueCategoryCount: number;
  readonly blockedReasonCounts: Record<RoutingFairnessBlockedReason, number>;
  readonly quotaSaturationWatchCount: number;
  readonly quotaSaturationRiskCount: number;
  readonly thinLeadQualityCount: number;
  readonly slaWatchCount: number;
  readonly representativeSampleCount: number;
  readonly sampleLimit: number;
};

export type RoutingFairnessReviewReadFlags =
  RoutingFairnessMetricReadFlags & {
    readonly routingFairnessReviewPacket: true;
    readonly fairnessMetricRows: true;
    readonly issueSummaries: true;
    readonly representativeSamples: true;
  };

export type RoutingFairnessReviewWriteFlags =
  RoutingFairnessMetricWriteFlags & {
    readonly reviewSnapshots: false;
    readonly fairnessReviewHistory: false;
  };

export type RoutingFairnessReviewSafety =
  RoutingFairnessMetricSafety & {
    readonly reviewOnly: true;
    readonly operatorPacket: true;
    readonly issueSummaries: true;
    readonly representativeSamples: true;
  };

export type RoutingFairnessReviewPacket = {
  readonly contentType: typeof ROUTING_FAIRNESS_REVIEW_PACKET_CONTENT_TYPE;
  readonly packetType: "routing-fairness-review-packet";
  readonly packetVersion: typeof ROUTING_FAIRNESS_REVIEW_PACKET_VERSION;
  readonly metricVersion: typeof ROUTING_FAIRNESS_METRIC_VERSION;
  readonly inputCatalogVersion: typeof ROUTING_SIMULATOR_INPUT_VERSION;
  readonly evaluationVersion: typeof ROUTING_SIMULATOR_EVALUATION_VERSION;
  readonly reviewedAt: Date;
  readonly leadCount: number;
  readonly rowSampleLimit: number;
  readonly metricDefinitions: readonly RoutingFairnessMetricDefinition[];
  readonly metricSummary: RoutingFairnessMetricSummary;
  readonly evaluationSummary: RoutingFairnessMetricPacket["evaluationSummary"];
  readonly summary: RoutingFairnessReviewSummary;
  readonly issues: readonly RoutingFairnessReviewIssue[];
  readonly rowSamples: readonly RoutingFairnessReviewRowSample[];
  readonly guardrails: RoutingSimulatorGuardrails;
  readonly source: {
    readonly reviewModule: "lib/server/routingFairnessReviewPackets.ts";
    readonly metricModule: "lib/server/routingFairnessMetrics.ts";
    readonly evaluatorModule: "lib/server/routingSimulatorEvaluator.ts";
    readonly inputContractModule: "lib/server/routingSimulatorContracts.ts";
    readonly routingModule: "lib/routing/leadRouter.ts";
    readonly packetScope: "read-only-routing-fairness-review-packet";
  };
  readonly read: RoutingFairnessReviewReadFlags;
  readonly write: RoutingFairnessReviewWriteFlags;
  readonly safety: RoutingFairnessReviewSafety;
};

export type RoutingFairnessReviewOptions = {
  readonly now?: Date;
  readonly sampleLimit?: number;
};

type ParsedRoutingFairnessReviewOptions = {
  readonly now?: Date;
  readonly sampleLimit: number;
};

const reviewOptionsSchema = z
  .object({
    now: z.date().optional(),
    sampleLimit: z
      .number()
      .int()
      .min(1)
      .max(ROUTING_FAIRNESS_REVIEW_MAX_SAMPLE_LIMIT)
      .optional()
  })
  .strict();

const issueCodes = [
  "blocked_routing",
  "quota_saturation_risk",
  "quota_saturation_watch",
  "thin_lead_quality",
  "sla_watch"
] as const satisfies readonly RoutingFairnessReviewIssueCode[];

export async function buildRoutingFairnessReviewPacket(
  input: unknown,
  options: RoutingFairnessReviewOptions = {}
): Promise<RoutingFairnessReviewPacket> {
  const parsedOptions = parseReviewOptions(options);
  const metricPacket = await buildRoutingFairnessMetricPacket(input, {
    now: parsedOptions.now
  });
  const issues = buildIssues(metricPacket.rows);
  const rowSamples = representativeRows(metricPacket.rows, parsedOptions.sampleLimit)
    .map(buildRowSample);

  return {
    contentType: ROUTING_FAIRNESS_REVIEW_PACKET_CONTENT_TYPE,
    packetType: "routing-fairness-review-packet",
    packetVersion: ROUTING_FAIRNESS_REVIEW_PACKET_VERSION,
    metricVersion: ROUTING_FAIRNESS_METRIC_VERSION,
    inputCatalogVersion: metricPacket.inputCatalogVersion,
    evaluationVersion: metricPacket.evaluationVersion,
    reviewedAt: metricPacket.evaluatedAt,
    leadCount: metricPacket.leadCount,
    rowSampleLimit: parsedOptions.sampleLimit,
    metricDefinitions: metricPacket.metricDefinitions,
    metricSummary: metricPacket.summary,
    evaluationSummary: metricPacket.evaluationSummary,
    summary: buildReviewSummary(
      metricPacket,
      issues,
      rowSamples,
      parsedOptions.sampleLimit
    ),
    issues,
    rowSamples,
    guardrails: metricPacket.guardrails,
    source: {
      reviewModule: "lib/server/routingFairnessReviewPackets.ts",
      metricModule: "lib/server/routingFairnessMetrics.ts",
      evaluatorModule: "lib/server/routingSimulatorEvaluator.ts",
      inputContractModule: "lib/server/routingSimulatorContracts.ts",
      routingModule: "lib/routing/leadRouter.ts",
      packetScope: "read-only-routing-fairness-review-packet"
    },
    read: readFlags(metricPacket.read),
    write: noWrites(metricPacket.write),
    safety: safetyFlags(metricPacket.safety)
  };
}

function parseReviewOptions(
  options: RoutingFairnessReviewOptions
): ParsedRoutingFairnessReviewOptions {
  const parsed = reviewOptionsSchema.parse(options);

  return {
    now: parsed.now,
    sampleLimit:
      parsed.sampleLimit ?? ROUTING_FAIRNESS_REVIEW_DEFAULT_SAMPLE_LIMIT
  };
}

function buildReviewSummary(
  metricPacket: RoutingFairnessMetricPacket,
  issues: readonly RoutingFairnessReviewIssue[],
  rowSamples: readonly RoutingFairnessReviewRowSample[],
  sampleLimit: number
): RoutingFairnessReviewSummary {
  return {
    leadCount: metricPacket.summary.leadCount,
    assignedCount: metricPacket.summary.assignedCount,
    blockedCount: metricPacket.summary.blockedCount,
    reviewStatus: reviewStatus(metricPacket, issues),
    issueCount: issues.reduce((total, issue) => total + issue.count, 0),
    issueCategoryCount: issues.length,
    blockedReasonCounts: blockedReasonCounts(metricPacket.rows),
    quotaSaturationWatchCount: metricPacket.summary.quotaSaturationWatchCount,
    quotaSaturationRiskCount: metricPacket.summary.quotaSaturationRiskCount,
    thinLeadQualityCount: metricPacket.summary.thinLeadQualityCount,
    slaWatchCount: metricPacket.summary.slaRiskCounts.watch,
    representativeSampleCount: rowSamples.length,
    sampleLimit
  };
}

function reviewStatus(
  metricPacket: RoutingFairnessMetricPacket,
  issues: readonly RoutingFairnessReviewIssue[]
): RoutingFairnessReviewStatus {
  if (
    metricPacket.summary.leadCount > 0 &&
    metricPacket.summary.assignedCount === 0
  ) {
    return "blocked";
  }

  if (issues.some((issue) => issue.severity === "critical")) {
    return "risk";
  }

  if (issues.length > 0) {
    return "watch";
  }

  return "clear";
}

function buildIssues(
  rows: readonly RoutingFairnessMetricRow[]
): RoutingFairnessReviewIssue[] {
  return issueCodes.flatMap((code) => {
    const matchingRows = rows.filter((row) => rowIssueCodes(row).includes(code));

    if (matchingRows.length === 0) {
      return [];
    }

    return [
      {
        code,
        severity: issueSeverity(code),
        count: matchingRows.length,
        rowNumbers: matchingRows.map((row) => row.rowNumber),
        message: issueMessage(code, matchingRows.length),
        explanations: issueExplanations(code, matchingRows)
      }
    ];
  });
}

function blockedReasonCounts(
  rows: readonly RoutingFairnessMetricRow[]
): Record<RoutingFairnessBlockedReason, number> {
  const counts: Record<RoutingFairnessBlockedReason, number> = {
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

function issueSeverity(
  code: RoutingFairnessReviewIssueCode
): RoutingFairnessReviewIssueSeverity {
  if (code === "blocked_routing" || code === "quota_saturation_risk") {
    return "critical";
  }

  return "warning";
}

function issueMessage(
  code: RoutingFairnessReviewIssueCode,
  count: number
): string {
  switch (code) {
    case "blocked_routing":
      return `${count} ${leadNoun(count)} blocked before assignment.`;
    case "quota_saturation_risk":
      return `${count} ${leadNoun(count)} mapped to quota-saturated dealer order context.`;
    case "quota_saturation_watch":
      return `${count} ${leadNoun(count)} mapped to near-saturated dealer order context.`;
    case "thin_lead_quality":
      return `${count} ${leadNoun(count)} had thin deterministic lead-quality proxy context.`;
    case "sla_watch":
      return `${count} ${leadNoun(count)} routed with SLA watch indicators.`;
  }
}

function issueExplanations(
  code: RoutingFairnessReviewIssueCode,
  rows: readonly RoutingFairnessMetricRow[]
): string[] {
  if (code === "blocked_routing") {
    const counts = blockedReasonCounts(rows);

    return [
      `no_area_match:${counts.no_area_match}`,
      `no_matching_active_order:${counts.no_matching_active_order}`,
      `all_orders_at_quota:${counts.all_orders_at_quota}`
    ].filter((entry) => !entry.endsWith(":0"));
  }

  return unique(
    rows.map((row) => rowIssueExplanation(code, row))
  );
}

function representativeRows(
  rows: readonly RoutingFairnessMetricRow[],
  sampleLimit: number
): RoutingFairnessMetricRow[] {
  return [...rows]
    .sort((a, b) => {
      const scoreDelta = rowRiskScore(b) - rowRiskScore(a);

      if (scoreDelta !== 0) {
        return scoreDelta;
      }

      return a.rowNumber - b.rowNumber;
    })
    .slice(0, sampleLimit);
}

function buildRowSample(
  row: RoutingFairnessMetricRow
): RoutingFairnessReviewRowSample {
  const issueCodesForRow = rowIssueCodes(row);

  return {
    rowNumber: row.rowNumber,
    referenceId: row.referenceId,
    normalizedPostalCode: row.normalizedPostalCode,
    postalPrefix: row.postalPrefix,
    status: row.status,
    reason: row.reason,
    matchedAreaId: row.matchedAreaId,
    selectedOrder: row.selectedOrder ? { ...row.selectedOrder } : null,
    filteredOrderCount: row.filteredOrderCount,
    candidateOrderCount: row.candidateOrderCount,
    issueCodes: issueCodesForRow,
    explanationReasons:
      issueCodesForRow.length > 0
        ? issueCodesForRow.map((code) => rowIssueExplanation(code, row))
        : ["No fairness review issue was detected for this hypothetical lead."],
    metricHighlights: [
      metricHighlight(row.metrics.paceGap),
      metricHighlight(row.metrics.quotaSaturation),
      metricHighlight(row.metrics.leadQualityProxy),
      metricHighlight(row.metrics.slaRisk)
    ]
  };
}

function rowIssueCodes(
  row: RoutingFairnessMetricRow
): RoutingFairnessReviewIssueCode[] {
  const codes: RoutingFairnessReviewIssueCode[] = [];

  if (row.status === "blocked") {
    codes.push("blocked_routing");
  }

  if (row.metrics.quotaSaturation.status === "risk") {
    codes.push("quota_saturation_risk");
  }

  if (row.metrics.quotaSaturation.status === "watch") {
    codes.push("quota_saturation_watch");
  }

  if (row.metrics.leadQualityProxy.status === "risk") {
    codes.push("thin_lead_quality");
  }

  if (row.metrics.slaRisk.status === "watch") {
    codes.push("sla_watch");
  }

  return codes;
}

function rowRiskScore(row: RoutingFairnessMetricRow): number {
  const codes = rowIssueCodes(row);

  if (codes.some((code) => issueSeverity(code) === "critical")) {
    return 3;
  }

  if (codes.length > 0) {
    return 2;
  }

  return 1;
}

function rowIssueExplanation(
  code: RoutingFairnessReviewIssueCode,
  row: RoutingFairnessMetricRow
): string {
  switch (code) {
    case "blocked_routing":
      return `Routing blocked with reason ${row.reason}.`;
    case "quota_saturation_risk":
    case "quota_saturation_watch":
      return row.metrics.quotaSaturation.explanation;
    case "thin_lead_quality":
      return row.metrics.leadQualityProxy.explanation;
    case "sla_watch":
      return row.metrics.slaRisk.explanation;
  }
}

function metricHighlight(
  metric: RoutingFairnessMetricRow["metrics"][RoutingFairnessMetricKey]
): RoutingFairnessReviewMetricHighlight {
  return {
    key: metric.key,
    label: metric.label,
    value: metric.value,
    status: metric.status,
    band: metric.band,
    explanation: metric.explanation,
    evidence: [...metric.evidence]
  };
}

function readFlags(
  metricRead: RoutingFairnessMetricReadFlags
): RoutingFairnessReviewReadFlags {
  return {
    ...metricRead,
    routingFairnessReviewPacket: true,
    fairnessMetricRows: true,
    issueSummaries: true,
    representativeSamples: true
  };
}

function noWrites(
  metricWrite: RoutingFairnessMetricWriteFlags
): RoutingFairnessReviewWriteFlags {
  return {
    ...metricWrite,
    reviewSnapshots: false,
    fairnessReviewHistory: false
  };
}

function safetyFlags(
  metricSafety: RoutingFairnessMetricSafety
): RoutingFairnessReviewSafety {
  return {
    ...metricSafety,
    reviewOnly: true,
    operatorPacket: true,
    issueSummaries: true,
    representativeSamples: true
  };
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)];
}

function leadNoun(count: number): string {
  return count === 1 ? "hypothetical lead" : "hypothetical leads";
}
