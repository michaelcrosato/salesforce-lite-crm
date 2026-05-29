import { z } from "zod/v4";
import {
  PACING_SNAPSHOT_BUILDER_VERSION,
  buildPacingSnapshotBatch,
  type PacingSnapshotBucketSummary,
  type PacingSnapshotBuildPacket,
  type PacingSnapshotBuildSummary,
  type PacingSnapshotBuilderReadFlags,
  type PacingSnapshotBuilderSafety,
  type PacingSnapshotMetricMap,
  type PacingSnapshotMetricValue,
  type PacingSnapshotRequestBuild,
  type PacingSnapshotSourceCounts
} from "@/lib/server/pacingSnapshotBuilder";
import {
  PACING_SNAPSHOT_CONTENT_TYPE,
  PACING_SNAPSHOT_VERSION,
  type PacingSnapshotGuardrails,
  type PacingSnapshotMetricDefinition,
  type PacingSnapshotWriteFlags
} from "@/lib/server/pacingSnapshotContracts";

export const PACING_SNAPSHOT_REVIEW_PACKET_CONTENT_TYPE =
  PACING_SNAPSHOT_CONTENT_TYPE;
export const PACING_SNAPSHOT_REVIEW_PACKET_VERSION =
  "2026-05-29.s56-f3" as const;
export const PACING_SNAPSHOT_REVIEW_DEFAULT_BUCKET_SAMPLE_LIMIT = 5;
export const PACING_SNAPSHOT_REVIEW_MAX_BUCKET_SAMPLE_LIMIT = 10;

export type PacingSnapshotReviewStatus =
  | "ready"
  | "partial_evidence"
  | "empty";

export type PacingSnapshotEmptyStateCode =
  | "missing_dealer_order_filters"
  | "no_matching_dealer_orders"
  | "no_active_dealer_orders"
  | "no_leads_created"
  | "no_routed_leads"
  | "no_routing_events"
  | "no_delivered_leads";

export type PacingSnapshotEmptyStateSeverity = "info" | "warning";

export type PacingSnapshotEmptyStateReason = {
  readonly code: PacingSnapshotEmptyStateCode;
  readonly severity: PacingSnapshotEmptyStateSeverity;
  readonly count: number;
  readonly requestRowNumbers: readonly number[];
  readonly message: string;
};

export type PacingSnapshotReviewSourceCounts = PacingSnapshotSourceCounts & {
  readonly requestedDealerOrderFilterCount: number;
  readonly missingDealerOrderFilterCount: number;
};

export type PacingSnapshotReviewFreshness = {
  readonly builtAt: Date;
  readonly reviewedAt: Date;
  readonly sourceWindowStartsOn: string | null;
  readonly sourceWindowEndsOn: string | null;
  readonly oldestBucketKey: string | null;
  readonly newestBucketKey: string | null;
  readonly freshnessStatus: "current_at_review_time";
  readonly sourceRecordBasis: "existing_dealer_orders_leads_and_routing_events";
  readonly persistedSnapshotHistory: false;
};

export type PacingSnapshotReviewRequestSummary = {
  readonly rowNumber: number;
  readonly referenceId: string | null;
  readonly label: string | null;
  readonly granularity: PacingSnapshotRequestBuild["granularity"];
  readonly startsOn: string;
  readonly endsOn: string;
  readonly bucketCount: number;
  readonly metricCount: number;
  readonly dealerOrderFilterCount: number;
  readonly missingDealerOrderIds: readonly string[];
  readonly sourceCounts: PacingSnapshotSourceCounts;
  readonly emptyStateReasonCodes: readonly PacingSnapshotEmptyStateCode[];
};

export type PacingSnapshotReviewBucketSample = {
  readonly requestRowNumber: number;
  readonly referenceId: string | null;
  readonly label: string | null;
  readonly bucketNumber: number;
  readonly bucketKey: string;
  readonly granularity: PacingSnapshotBucketSummary["granularity"];
  readonly startsOn: string;
  readonly endsOn: string;
  readonly calendarDayCount: number;
  readonly metrics: PacingSnapshotMetricMap;
  readonly requestedMetrics: readonly PacingSnapshotMetricValue[];
  readonly emptyStateReasonCodes: readonly PacingSnapshotEmptyStateCode[];
};

export type PacingSnapshotReviewSummary = {
  readonly requestCount: number;
  readonly bucketCount: number;
  readonly metricValueCount: number;
  readonly reviewStatus: PacingSnapshotReviewStatus;
  readonly sourceCounts: PacingSnapshotReviewSourceCounts;
  readonly emptyStateReasonCount: number;
  readonly requestSummaryCount: number;
  readonly bucketSampleCount: number;
  readonly bucketSampleLimit: number;
};

export type PacingSnapshotReviewReadFlags = PacingSnapshotBuilderReadFlags & {
  readonly pacingSnapshotBuildPacket: true;
  readonly pacingSnapshotReviewPacket: true;
  readonly metricDefinitions: true;
  readonly sourceCounts: true;
  readonly freshnessMetadata: true;
  readonly emptyStateReasons: true;
  readonly representativeBucketSamples: true;
};

export type PacingSnapshotReviewWriteFlags = PacingSnapshotWriteFlags & {
  readonly reviewPackets: false;
  readonly snapshotReviewHistory: false;
  readonly trendReports: false;
  readonly dashboardWidgets: false;
  readonly commandPaletteActions: false;
  readonly csvImportApply: false;
};

export type PacingSnapshotReviewSafety = PacingSnapshotBuilderSafety & {
  readonly reviewOnly: true;
  readonly operatorPacket: true;
  readonly trendReportReady: true;
  readonly trendReportUi: false;
  readonly commandPaletteAction: false;
  readonly csvIntegration: false;
};

export type PacingSnapshotReviewPacket = {
  readonly contentType: typeof PACING_SNAPSHOT_REVIEW_PACKET_CONTENT_TYPE;
  readonly packetType: "pacing-snapshot-review-packet";
  readonly packetVersion: typeof PACING_SNAPSHOT_REVIEW_PACKET_VERSION;
  readonly builderVersion: typeof PACING_SNAPSHOT_BUILDER_VERSION;
  readonly contractVersion: typeof PACING_SNAPSHOT_VERSION;
  readonly reviewedAt: Date;
  readonly builtAt: Date;
  readonly requestCount: number;
  readonly bucketCount: number;
  readonly bucketSampleLimit: number;
  readonly buildSummary: PacingSnapshotBuildSummary;
  readonly summary: PacingSnapshotReviewSummary;
  readonly sourceCounts: PacingSnapshotReviewSourceCounts;
  readonly freshness: PacingSnapshotReviewFreshness;
  readonly emptyStateReasons: readonly PacingSnapshotEmptyStateReason[];
  readonly requests: readonly PacingSnapshotReviewRequestSummary[];
  readonly bucketSamples: readonly PacingSnapshotReviewBucketSample[];
  readonly metricDefinitions: readonly PacingSnapshotMetricDefinition[];
  readonly guardrails: PacingSnapshotGuardrails;
  readonly source: {
    readonly reviewModule: "lib/server/pacingSnapshotReviewPackets.ts";
    readonly builderModule: "lib/server/pacingSnapshotBuilder.ts";
    readonly contractModule: "lib/server/pacingSnapshotContracts.ts";
    readonly databaseModels: readonly ["DealerOrder", "Lead", "Activity"];
    readonly packetScope: "read-only-pacing-snapshot-review-packet";
  };
  readonly read: PacingSnapshotReviewReadFlags;
  readonly write: PacingSnapshotReviewWriteFlags;
  readonly safety: PacingSnapshotReviewSafety;
};

export type PacingSnapshotReviewOptions = {
  readonly now?: Date;
  readonly bucketSampleLimit?: number;
};

type ParsedPacingSnapshotReviewOptions = {
  readonly now?: Date;
  readonly bucketSampleLimit: number;
};

const reviewOptionsSchema = z
  .object({
    now: z.date().optional(),
    bucketSampleLimit: z
      .number()
      .int()
      .min(1)
      .max(PACING_SNAPSHOT_REVIEW_MAX_BUCKET_SAMPLE_LIMIT)
      .optional()
  })
  .strict();

const emptyStateCodes = [
  "missing_dealer_order_filters",
  "no_matching_dealer_orders",
  "no_active_dealer_orders",
  "no_leads_created",
  "no_routed_leads",
  "no_routing_events",
  "no_delivered_leads"
] as const satisfies readonly PacingSnapshotEmptyStateCode[];

export async function buildPacingSnapshotReviewPacket(
  input: unknown,
  options: PacingSnapshotReviewOptions = {}
): Promise<PacingSnapshotReviewPacket> {
  const parsedOptions = parseReviewOptions(options);
  const build = await buildPacingSnapshotBatch(input, {
    now: parsedOptions.now
  });
  const reviewedAt = parsedOptions.now ?? build.builtAt;
  const sourceCounts = aggregateSourceCounts(build.requests);
  const emptyStateReasons = buildEmptyStateReasons(build.requests);
  const bucketSamples = representativeBucketSamples(
    build.requests,
    parsedOptions.bucketSampleLimit
  );
  const requestSummaries = build.requests.map(requestSummary);

  return {
    contentType: PACING_SNAPSHOT_REVIEW_PACKET_CONTENT_TYPE,
    packetType: "pacing-snapshot-review-packet",
    packetVersion: PACING_SNAPSHOT_REVIEW_PACKET_VERSION,
    builderVersion: build.builderVersion,
    contractVersion: build.contractVersion,
    reviewedAt,
    builtAt: build.builtAt,
    requestCount: build.requestCount,
    bucketCount: build.bucketCount,
    bucketSampleLimit: parsedOptions.bucketSampleLimit,
    buildSummary: build.summary,
    summary: buildReviewSummary(
      build,
      sourceCounts,
      emptyStateReasons,
      requestSummaries,
      bucketSamples,
      parsedOptions.bucketSampleLimit
    ),
    sourceCounts,
    freshness: buildFreshness(build, reviewedAt),
    emptyStateReasons,
    requests: requestSummaries,
    bucketSamples,
    metricDefinitions: build.metricDefinitions,
    guardrails: build.guardrails,
    source: {
      reviewModule: "lib/server/pacingSnapshotReviewPackets.ts",
      builderModule: "lib/server/pacingSnapshotBuilder.ts",
      contractModule: "lib/server/pacingSnapshotContracts.ts",
      databaseModels: ["DealerOrder", "Lead", "Activity"],
      packetScope: "read-only-pacing-snapshot-review-packet"
    },
    read: readFlags(build.read),
    write: noWrites(build.write),
    safety: safetyFlags(build.safety)
  };
}

function parseReviewOptions(
  options: PacingSnapshotReviewOptions
): ParsedPacingSnapshotReviewOptions {
  const parsed = reviewOptionsSchema.parse(options);

  return {
    now: parsed.now,
    bucketSampleLimit:
      parsed.bucketSampleLimit ??
      PACING_SNAPSHOT_REVIEW_DEFAULT_BUCKET_SAMPLE_LIMIT
  };
}

function buildReviewSummary(
  build: PacingSnapshotBuildPacket,
  sourceCounts: PacingSnapshotReviewSourceCounts,
  emptyStateReasons: readonly PacingSnapshotEmptyStateReason[],
  requestSummaries: readonly PacingSnapshotReviewRequestSummary[],
  bucketSamples: readonly PacingSnapshotReviewBucketSample[],
  bucketSampleLimit: number
): PacingSnapshotReviewSummary {
  return {
    requestCount: build.summary.requestCount,
    bucketCount: build.summary.bucketCount,
    metricValueCount: build.summary.metricValueCount,
    reviewStatus: reviewStatus(sourceCounts, emptyStateReasons),
    sourceCounts,
    emptyStateReasonCount: emptyStateReasons.length,
    requestSummaryCount: requestSummaries.length,
    bucketSampleCount: bucketSamples.length,
    bucketSampleLimit
  };
}

function reviewStatus(
  sourceCounts: PacingSnapshotReviewSourceCounts,
  emptyStateReasons: readonly PacingSnapshotEmptyStateReason[]
): PacingSnapshotReviewStatus {
  if (
    sourceCounts.dealerOrderCount === 0 &&
    sourceCounts.leadCreatedCount === 0 &&
    sourceCounts.routingEventCount === 0
  ) {
    return "empty";
  }

  if (emptyStateReasons.length > 0) {
    return "partial_evidence";
  }

  return "ready";
}

function aggregateSourceCounts(
  requests: readonly PacingSnapshotRequestBuild[]
): PacingSnapshotReviewSourceCounts {
  return requests.reduce(
    (totals, request) => ({
      dealerOrderCount:
        totals.dealerOrderCount + request.sourceCounts.dealerOrderCount,
      activeDealerOrderCount:
        totals.activeDealerOrderCount +
        request.sourceCounts.activeDealerOrderCount,
      leadCreatedCount:
        totals.leadCreatedCount + request.sourceCounts.leadCreatedCount,
      routedLeadCount:
        totals.routedLeadCount + request.sourceCounts.routedLeadCount,
      unroutedLeadCount:
        totals.unroutedLeadCount + request.sourceCounts.unroutedLeadCount,
      routingEventCount:
        totals.routingEventCount + request.sourceCounts.routingEventCount,
      deliveredLeadCount:
        totals.deliveredLeadCount + request.sourceCounts.deliveredLeadCount,
      requestedDealerOrderFilterCount:
        totals.requestedDealerOrderFilterCount +
        request.dealerOrderFilterCount,
      missingDealerOrderFilterCount:
        totals.missingDealerOrderFilterCount +
        request.missingDealerOrderIds.length
    }),
    {
      dealerOrderCount: 0,
      activeDealerOrderCount: 0,
      leadCreatedCount: 0,
      routedLeadCount: 0,
      unroutedLeadCount: 0,
      routingEventCount: 0,
      deliveredLeadCount: 0,
      requestedDealerOrderFilterCount: 0,
      missingDealerOrderFilterCount: 0
    }
  );
}

function buildEmptyStateReasons(
  requests: readonly PacingSnapshotRequestBuild[]
): PacingSnapshotEmptyStateReason[] {
  return emptyStateCodes.flatMap((code) => {
    const requestRowNumbers = requests
      .filter((request) => requestEmptyStateCodes(request).includes(code))
      .map((request) => request.rowNumber);

    if (requestRowNumbers.length === 0) {
      return [];
    }

    return [
      {
        code,
        severity: emptyStateSeverity(code),
        count: requestRowNumbers.length,
        requestRowNumbers,
        message: emptyStateMessage(code, requestRowNumbers.length)
      }
    ];
  });
}

function requestSummary(
  request: PacingSnapshotRequestBuild
): PacingSnapshotReviewRequestSummary {
  return {
    rowNumber: request.rowNumber,
    referenceId: request.referenceId,
    label: request.label,
    granularity: request.granularity,
    startsOn: request.startsOn,
    endsOn: request.endsOn,
    bucketCount: request.bucketCount,
    metricCount: request.metricCount,
    dealerOrderFilterCount: request.dealerOrderFilterCount,
    missingDealerOrderIds: [...request.missingDealerOrderIds],
    sourceCounts: { ...request.sourceCounts },
    emptyStateReasonCodes: requestEmptyStateCodes(request)
  };
}

function requestEmptyStateCodes(
  request: PacingSnapshotRequestBuild
): PacingSnapshotEmptyStateCode[] {
  const codes: PacingSnapshotEmptyStateCode[] = [];

  if (request.missingDealerOrderIds.length > 0) {
    codes.push("missing_dealer_order_filters");
  }

  if (
    request.dealerOrderFilterCount > 0 &&
    request.sourceCounts.dealerOrderCount === 0
  ) {
    codes.push("no_matching_dealer_orders");
  }

  if (
    request.sourceCounts.dealerOrderCount > 0 &&
    request.sourceCounts.activeDealerOrderCount === 0
  ) {
    codes.push("no_active_dealer_orders");
  }

  if (request.sourceCounts.leadCreatedCount === 0) {
    codes.push("no_leads_created");
  }

  if (request.sourceCounts.routedLeadCount === 0) {
    codes.push("no_routed_leads");
  }

  if (request.sourceCounts.routingEventCount === 0) {
    codes.push("no_routing_events");
  }

  if (request.sourceCounts.deliveredLeadCount === 0) {
    codes.push("no_delivered_leads");
  }

  return codes;
}

function representativeBucketSamples(
  requests: readonly PacingSnapshotRequestBuild[],
  bucketSampleLimit: number
): PacingSnapshotReviewBucketSample[] {
  return requests
    .flatMap((request) =>
      request.buckets.map((bucket) => bucketSample(request, bucket))
    )
    .sort((a, b) => {
      const riskDelta = bucketRiskScore(b) - bucketRiskScore(a);

      if (riskDelta !== 0) {
        return riskDelta;
      }

      const paceDelta =
        Math.abs(b.metrics.paceGapCount) - Math.abs(a.metrics.paceGapCount);

      if (paceDelta !== 0) {
        return paceDelta;
      }

      if (a.requestRowNumber !== b.requestRowNumber) {
        return a.requestRowNumber - b.requestRowNumber;
      }

      return a.bucketNumber - b.bucketNumber;
    })
    .slice(0, bucketSampleLimit);
}

function bucketSample(
  request: PacingSnapshotRequestBuild,
  bucket: PacingSnapshotBucketSummary
): PacingSnapshotReviewBucketSample {
  return {
    requestRowNumber: request.rowNumber,
    referenceId: request.referenceId,
    label: request.label,
    bucketNumber: bucket.bucketNumber,
    bucketKey: bucket.bucketKey,
    granularity: bucket.granularity,
    startsOn: bucket.startsOn,
    endsOn: bucket.endsOn,
    calendarDayCount: bucket.calendarDayCount,
    metrics: { ...bucket.metrics },
    requestedMetrics: bucket.requestedMetrics.map(copyMetricValue),
    emptyStateReasonCodes: bucketEmptyStateCodes(request, bucket)
  };
}

function bucketEmptyStateCodes(
  request: PacingSnapshotRequestBuild,
  bucket: PacingSnapshotBucketSummary
): PacingSnapshotEmptyStateCode[] {
  const codes: PacingSnapshotEmptyStateCode[] = [];

  if (request.missingDealerOrderIds.length > 0) {
    codes.push("missing_dealer_order_filters");
  }

  if (
    request.dealerOrderFilterCount > 0 &&
    bucket.metrics.dealerOrderCount === 0
  ) {
    codes.push("no_matching_dealer_orders");
  }

  if (
    bucket.metrics.dealerOrderCount > 0 &&
    bucket.metrics.activeDealerOrderCount === 0
  ) {
    codes.push("no_active_dealer_orders");
  }

  if (bucket.metrics.leadCreatedCount === 0) {
    codes.push("no_leads_created");
  }

  if (bucket.metrics.routedLeadCount === 0) {
    codes.push("no_routed_leads");
  }

  if (bucket.metrics.routingEventCount === 0) {
    codes.push("no_routing_events");
  }

  if (bucket.metrics.deliveredLeadCount === 0) {
    codes.push("no_delivered_leads");
  }

  return codes;
}

function bucketRiskScore(sample: PacingSnapshotReviewBucketSample): number {
  if (
    sample.emptyStateReasonCodes.includes("missing_dealer_order_filters") ||
    sample.emptyStateReasonCodes.includes("no_matching_dealer_orders") ||
    sample.emptyStateReasonCodes.includes("no_active_dealer_orders")
  ) {
    return 3;
  }

  if (sample.emptyStateReasonCodes.length > 0) {
    return 2;
  }

  return 1;
}

function buildFreshness(
  build: PacingSnapshotBuildPacket,
  reviewedAt: Date
): PacingSnapshotReviewFreshness {
  const requests = build.requests;
  const buckets = requests.flatMap((request) => request.buckets);

  return {
    builtAt: build.builtAt,
    reviewedAt,
    sourceWindowStartsOn: minString(requests.map((request) => request.startsOn)),
    sourceWindowEndsOn: maxString(requests.map((request) => request.endsOn)),
    oldestBucketKey: minString(buckets.map((bucket) => bucket.bucketKey)),
    newestBucketKey: maxString(buckets.map((bucket) => bucket.bucketKey)),
    freshnessStatus: "current_at_review_time",
    sourceRecordBasis: "existing_dealer_orders_leads_and_routing_events",
    persistedSnapshotHistory: false
  };
}

function emptyStateSeverity(
  code: PacingSnapshotEmptyStateCode
): PacingSnapshotEmptyStateSeverity {
  if (
    code === "missing_dealer_order_filters" ||
    code === "no_matching_dealer_orders" ||
    code === "no_active_dealer_orders"
  ) {
    return "warning";
  }

  return "info";
}

function emptyStateMessage(
  code: PacingSnapshotEmptyStateCode,
  count: number
): string {
  switch (code) {
    case "missing_dealer_order_filters":
      return `${count} ${requestNoun(count)} referenced dealer-order filters that were not found.`;
    case "no_matching_dealer_orders":
      return `${count} ${requestNoun(count)} had no matching dealer orders in scope.`;
    case "no_active_dealer_orders":
      return `${count} ${requestNoun(count)} had dealer orders but no active dealer orders.`;
    case "no_leads_created":
      return `${count} ${requestNoun(count)} had no created leads in the snapshot window.`;
    case "no_routed_leads":
      return `${count} ${requestNoun(count)} had no routed leads in the snapshot window.`;
    case "no_routing_events":
      return `${count} ${requestNoun(count)} had no routing-event evidence in the snapshot window.`;
    case "no_delivered_leads":
      return `${count} ${requestNoun(count)} had no delivered lead evidence in the snapshot window.`;
  }
}

function readFlags(
  buildRead: PacingSnapshotBuilderReadFlags
): PacingSnapshotReviewReadFlags {
  return {
    ...buildRead,
    pacingSnapshotBuildPacket: true,
    pacingSnapshotReviewPacket: true,
    metricDefinitions: true,
    sourceCounts: true,
    freshnessMetadata: true,
    emptyStateReasons: true,
    representativeBucketSamples: true
  };
}

function noWrites(
  buildWrite: PacingSnapshotWriteFlags
): PacingSnapshotReviewWriteFlags {
  return {
    ...buildWrite,
    reviewPackets: false,
    snapshotReviewHistory: false,
    trendReports: false,
    dashboardWidgets: false,
    commandPaletteActions: false,
    csvImportApply: false
  };
}

function safetyFlags(
  buildSafety: PacingSnapshotBuilderSafety
): PacingSnapshotReviewSafety {
  return {
    ...buildSafety,
    reviewOnly: true,
    operatorPacket: true,
    trendReportReady: true,
    trendReportUi: false,
    commandPaletteAction: false,
    csvIntegration: false
  };
}

function copyMetricValue(
  metric: PacingSnapshotMetricValue
): PacingSnapshotMetricValue {
  return { ...metric };
}

function minString(values: readonly string[]): string | null {
  if (values.length === 0) {
    return null;
  }

  return [...values].sort()[0] ?? null;
}

function maxString(values: readonly string[]): string | null {
  if (values.length === 0) {
    return null;
  }

  return [...values].sort().at(-1) ?? null;
}

function requestNoun(count: number): string {
  return count === 1 ? "request" : "requests";
}
