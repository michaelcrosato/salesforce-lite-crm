import type { Prisma } from "@prisma/client";
import { z } from "zod/v4";
import { calendarDateStart, calendarDateKey } from "@/lib/datetime";
import { prisma } from "@/lib/prisma";
import {
  PACING_SNAPSHOT_CONTENT_TYPE,
  PACING_SNAPSHOT_VERSION,
  getPacingSnapshotGuardrails,
  getPacingSnapshotMetricDefinitions,
  validatePacingSnapshotDraft,
  type PacingSnapshotDraft,
  type PacingSnapshotGranularity,
  type PacingSnapshotGuardrails,
  type PacingSnapshotInputRow,
  type PacingSnapshotMetricDefinition,
  type PacingSnapshotMetricKey,
  type PacingSnapshotWriteFlags
} from "@/lib/server/pacingSnapshotContracts";

export const PACING_SNAPSHOT_BUILDER_VERSION =
  "2026-05-28.s56-f2" as const;

export type PacingSnapshotBuilderOptions = {
  readonly now?: Date;
};

export type PacingSnapshotMetricMap = {
  readonly [key in PacingSnapshotMetricKey]: number;
};

export type PacingSnapshotMetricValue = {
  readonly key: PacingSnapshotMetricKey;
  readonly label: string;
  readonly source: PacingSnapshotMetricDefinition["source"];
  readonly valueType: PacingSnapshotMetricDefinition["valueType"];
  readonly value: number;
};

export type PacingSnapshotDealerOrderSummary = {
  readonly orderId: string;
  readonly dealerName: string;
  readonly accountId: string;
  readonly accountName: string;
  readonly status: string;
  readonly monthlyQuota: number;
  readonly startsOn: string;
  readonly endsOn: string | null;
};

export type PacingSnapshotSourceCounts = {
  readonly dealerOrderCount: number;
  readonly activeDealerOrderCount: number;
  readonly leadCreatedCount: number;
  readonly routedLeadCount: number;
  readonly unroutedLeadCount: number;
  readonly routingEventCount: number;
  readonly deliveredLeadCount: number;
};

export type PacingSnapshotBucketSummary = {
  readonly bucketNumber: number;
  readonly bucketKey: string;
  readonly granularity: PacingSnapshotGranularity;
  readonly startsOn: string;
  readonly endsOn: string;
  readonly calendarDayCount: number;
  readonly metrics: PacingSnapshotMetricMap;
  readonly requestedMetrics: readonly PacingSnapshotMetricValue[];
};

export type PacingSnapshotRequestBuild = {
  readonly rowNumber: number;
  readonly referenceId: string | null;
  readonly label: string | null;
  readonly granularity: PacingSnapshotGranularity;
  readonly startsOn: string;
  readonly endsOn: string;
  readonly calendarDayCount: number;
  readonly bucketCount: number;
  readonly dealerOrderIds: readonly string[];
  readonly dealerOrderFilterCount: number;
  readonly missingDealerOrderIds: readonly string[];
  readonly metricKeys: readonly PacingSnapshotMetricKey[];
  readonly metricCount: number;
  readonly dealerOrders: readonly PacingSnapshotDealerOrderSummary[];
  readonly sourceCounts: PacingSnapshotSourceCounts;
  readonly buckets: readonly PacingSnapshotBucketSummary[];
};

export type PacingSnapshotBuildSummary = {
  readonly requestCount: number;
  readonly bucketCount: number;
  readonly metricValueCount: number;
};

export type PacingSnapshotBuilderReadFlags = {
  readonly metadata: true;
  readonly validatedSnapshotInput: true;
  readonly database: true;
  readonly crmRecords: true;
  readonly leads: true;
  readonly activities: true;
  readonly routingEvents: true;
  readonly dealerOrders: true;
  readonly pacingEngine: true;
  readonly liveRouting: false;
  readonly persistedSnapshots: false;
  readonly routeHandlers: false;
  readonly externalServices: false;
};

export type PacingSnapshotBuilderSafety = {
  readonly deterministic: true;
  readonly readOnly: true;
  readonly validatesInputs: true;
  readonly fixtureOnly: false;
  readonly snapshotBuilder: true;
  readonly liveRouting: false;
  readonly leadCreation: false;
  readonly leadStatusChanges: false;
  readonly routingEventWrites: false;
  readonly dealerOrderMutation: false;
  readonly areaMutation: false;
  readonly pacingMutation: false;
  readonly snapshotPersistence: false;
  readonly forecastPersistence: false;
  readonly scenarioPersistence: false;
  readonly geocoding: false;
  readonly externalAi: false;
  readonly network: false;
  readonly productUi: false;
  readonly routeHandlers: false;
  readonly backgroundJobs: false;
};

export type PacingSnapshotBuildPacket = {
  readonly contentType: typeof PACING_SNAPSHOT_CONTENT_TYPE;
  readonly packetType: "pacing-snapshot-build";
  readonly builderVersion: typeof PACING_SNAPSHOT_BUILDER_VERSION;
  readonly contractVersion: typeof PACING_SNAPSHOT_VERSION;
  readonly builtAt: Date;
  readonly requestCount: number;
  readonly bucketCount: number;
  readonly requests: readonly PacingSnapshotRequestBuild[];
  readonly summary: PacingSnapshotBuildSummary;
  readonly metricDefinitions: readonly PacingSnapshotMetricDefinition[];
  readonly guardrails: PacingSnapshotGuardrails;
  readonly source: {
    readonly builderModule: "lib/server/pacingSnapshotBuilder.ts";
    readonly contractModule: "lib/server/pacingSnapshotContracts.ts";
    readonly databaseModels: readonly ["DealerOrder", "Lead", "Activity"];
    readonly snapshotScope: "read-only-pacing-snapshot-builder";
  };
  readonly read: PacingSnapshotBuilderReadFlags;
  readonly write: PacingSnapshotWriteFlags;
  readonly safety: PacingSnapshotBuilderSafety;
};

type DealerOrderRecord = Prisma.DealerOrderGetPayload<{
  include: typeof dealerOrderInclude;
}>;

type LeadRecord = {
  readonly id: string;
  readonly assignedOrderId: string | null;
  readonly assignmentReason: string | null;
  readonly createdAt: Date;
};

type RoutingEventRecord = {
  readonly id: string;
  readonly leadId: string | null;
  readonly createdAt: Date;
  readonly lead: {
    readonly assignedOrderId: string | null;
  } | null;
};

type BucketWindow = {
  readonly bucketNumber: number;
  readonly bucketKey: string;
  readonly granularity: PacingSnapshotGranularity;
  readonly startsOn: string;
  readonly endsOn: string;
  readonly start: Date;
  readonly endExclusive: Date;
  readonly calendarDayCount: number;
};

type SourceData = {
  readonly dealerOrders: readonly DealerOrderRecord[];
  readonly leads: readonly LeadRecord[];
  readonly routingEvents: readonly RoutingEventRecord[];
};

const builderOptionsSchema = z
  .object({
    now: z.date().optional()
  })
  .strict();

const dealerOrderInclude = {
  account: {
    select: {
      id: true,
      name: true
    }
  }
} as const;

const metricDefinitionsByKey = new Map<
  PacingSnapshotMetricKey,
  PacingSnapshotMetricDefinition
>(getPacingSnapshotMetricDefinitions().map((metric) => [metric.key, metric]));

export async function buildPacingSnapshotBatch(
  input: unknown,
  options: PacingSnapshotBuilderOptions = {}
): Promise<PacingSnapshotBuildPacket> {
  const parsedOptions = builderOptionsSchema.parse(options);
  const draft = validatePacingSnapshotDraft(input);
  const requests = await Promise.all(draft.requests.map(buildRequestSnapshot));
  const bucketCount = requests.reduce(
    (total, request) => total + request.bucketCount,
    0
  );

  return {
    contentType: PACING_SNAPSHOT_CONTENT_TYPE,
    packetType: "pacing-snapshot-build",
    builderVersion: PACING_SNAPSHOT_BUILDER_VERSION,
    contractVersion: PACING_SNAPSHOT_VERSION,
    builtAt: parsedOptions.now ?? new Date(),
    requestCount: draft.requestCount,
    bucketCount,
    requests,
    summary: {
      requestCount: draft.requestCount,
      bucketCount,
      metricValueCount: requests.reduce(
        (total, request) =>
          total +
          request.buckets.reduce(
            (requestTotal, bucket) =>
              requestTotal + bucket.requestedMetrics.length,
            0
          ),
        0
      )
    },
    metricDefinitions: getPacingSnapshotMetricDefinitions(),
    guardrails: getPacingSnapshotGuardrails(),
    source: {
      builderModule: "lib/server/pacingSnapshotBuilder.ts",
      contractModule: "lib/server/pacingSnapshotContracts.ts",
      databaseModels: ["DealerOrder", "Lead", "Activity"],
      snapshotScope: "read-only-pacing-snapshot-builder"
    },
    read: readFlags(),
    write: noWriteFlags(),
    safety: safetyFlags()
  };
}

async function buildRequestSnapshot(
  request: PacingSnapshotDraft["requests"][number]
): Promise<PacingSnapshotRequestBuild> {
  const [source, buckets] = await Promise.all([
    loadSourceData(request),
    Promise.resolve(bucketWindows(request))
  ]);
  const bucketSummaries = buckets.map((bucket) =>
    buildBucketSummary(request, source, bucket)
  );
  const requestOrders = ordersOverlappingWindow(
    source.dealerOrders,
    calendarDateStart(request.startsOn),
    addDays(calendarDateStart(request.endsOn), 1)
  );

  return {
    rowNumber: request.rowNumber,
    referenceId: request.referenceId,
    label: request.label,
    granularity: request.granularity,
    startsOn: request.startsOn,
    endsOn: request.endsOn,
    calendarDayCount: request.calendarDayCount,
    bucketCount: request.bucketCount,
    dealerOrderIds: [...request.dealerOrderIds],
    dealerOrderFilterCount: request.dealerOrderFilterCount,
    missingDealerOrderIds: missingDealerOrderIds(
      request.dealerOrderIds,
      source.dealerOrders
    ),
    metricKeys: [...request.metricKeys],
    metricCount: request.metricCount,
    dealerOrders: requestOrders.map(dealerOrderSummary),
    sourceCounts: requestSourceCounts(requestOrders, bucketSummaries),
    buckets: bucketSummaries
  };
}

async function loadSourceData(
  request: PacingSnapshotInputRow
): Promise<SourceData> {
  const start = calendarDateStart(request.startsOn);
  const endExclusive = addDays(calendarDateStart(request.endsOn), 1);
  const orderIds = new Set(request.dealerOrderIds);
  const [dealerOrders, leads, routingEvents] = await Promise.all([
    prisma.dealerOrder.findMany({
      where:
        request.dealerOrderIds.length > 0
          ? {
              id: {
                in: [...request.dealerOrderIds]
              }
            }
          : {},
      include: dealerOrderInclude,
      orderBy: [
        {
          name: "asc"
        },
        {
          id: "asc"
        }
      ]
    }),
    prisma.lead.findMany({
      where: {
        createdAt: {
          gte: start,
          lt: endExclusive
        },
        ...(request.dealerOrderIds.length > 0
          ? {
              assignedOrderId: {
                in: [...request.dealerOrderIds]
              }
            }
          : {})
      },
      select: {
        id: true,
        assignedOrderId: true,
        assignmentReason: true,
        createdAt: true
      },
      orderBy: [
        {
          createdAt: "asc"
        },
        {
          id: "asc"
        }
      ]
    }),
    prisma.activity.findMany({
      where: {
        type: "routing_event",
        createdAt: {
          gte: start,
          lt: endExclusive
        }
      },
      select: {
        id: true,
        leadId: true,
        createdAt: true,
        lead: {
          select: {
            assignedOrderId: true
          }
        }
      },
      orderBy: [
        {
          createdAt: "asc"
        },
        {
          id: "asc"
        }
      ]
    })
  ]);

  return {
    dealerOrders,
    leads,
    routingEvents:
      request.dealerOrderIds.length > 0
        ? routingEvents.filter((event) =>
            event.lead?.assignedOrderId
              ? orderIds.has(event.lead.assignedOrderId)
              : false
          )
        : routingEvents
  };
}

function buildBucketSummary(
  request: PacingSnapshotInputRow,
  source: SourceData,
  bucket: BucketWindow
): PacingSnapshotBucketSummary {
  const metrics = bucketMetrics(request, source, bucket);

  return {
    bucketNumber: bucket.bucketNumber,
    bucketKey: bucket.bucketKey,
    granularity: bucket.granularity,
    startsOn: bucket.startsOn,
    endsOn: bucket.endsOn,
    calendarDayCount: bucket.calendarDayCount,
    metrics,
    requestedMetrics: request.metricKeys.map((key) =>
      metricValue(key, metrics[key])
    )
  };
}

function bucketMetrics(
  request: PacingSnapshotInputRow,
  source: SourceData,
  bucket: BucketWindow
): PacingSnapshotMetricMap {
  const bucketOrders = source.dealerOrders.filter((order) =>
    orderOverlapsWindow(order, bucket.start, bucket.endExclusive)
  );
  const activeOrders = bucketOrders.filter((order) => order.status === "active");
  const bucketOrderIds = new Set(bucketOrders.map((order) => order.id));
  const bucketLeads = source.leads
    .filter((lead) => inWindow(lead.createdAt, bucket.start, bucket.endExclusive))
    .filter((lead) =>
      request.dealerOrderIds.length > 0
        ? lead.assignedOrderId !== null && bucketOrderIds.has(lead.assignedOrderId)
        : true
    );
  const routedLeads = bucketLeads.filter(
    (lead) =>
      hasAssignmentEvidence(lead) &&
      lead.assignedOrderId !== null &&
      bucketOrderIds.has(lead.assignedOrderId)
  );
  const routingEventCount = source.routingEvents.filter(
    (event) =>
      inWindow(event.createdAt, bucket.start, bucket.endExclusive) &&
      (request.dealerOrderIds.length === 0 ||
        (event.lead?.assignedOrderId !== undefined &&
          event.lead?.assignedOrderId !== null &&
          bucketOrderIds.has(event.lead.assignedOrderId)))
  ).length;
  const monthlyQuotaTotal = bucketOrders.reduce(
    (total, order) => total + order.monthlyQuota,
    0
  );
  const deliveredLeadCount = routedLeads.length;
  const expectedDeliveryCount = expectedDeliveryForBucket(
    activeOrders,
    bucket
  );

  return {
    leadCreatedCount: bucketLeads.length,
    routedLeadCount: routedLeads.length,
    unroutedLeadCount: bucketLeads.filter((lead) => !hasAssignmentEvidence(lead))
      .length,
    routingEventCount,
    dealerOrderCount: bucketOrders.length,
    activeDealerOrderCount: activeOrders.length,
    monthlyQuotaTotal,
    deliveredLeadCount,
    expectedDeliveryCount,
    paceGapCount: roundMetric(deliveredLeadCount - expectedDeliveryCount),
    deliveryRate:
      monthlyQuotaTotal === 0
        ? 0
        : roundMetric(deliveredLeadCount / monthlyQuotaTotal)
  };
}

function bucketWindows(request: PacingSnapshotInputRow): BucketWindow[] {
  if (request.granularity === "daily") {
    return dailyBuckets(request);
  }

  return monthlyBuckets(request);
}

function dailyBuckets(request: PacingSnapshotInputRow): BucketWindow[] {
  const buckets: BucketWindow[] = [];
  let cursor = calendarDateStart(request.startsOn);
  const endExclusive = addDays(calendarDateStart(request.endsOn), 1);

  while (cursor < endExclusive) {
    const startsOn = calendarDateKey(cursor);
    const next = addDays(cursor, 1);
    buckets.push(
      bucketWindow(
        buckets.length + 1,
        startsOn,
        startsOn,
        request.granularity,
        cursor,
        next
      )
    );
    cursor = next;
  }

  return buckets;
}

function monthlyBuckets(request: PacingSnapshotInputRow): BucketWindow[] {
  const buckets: BucketWindow[] = [];
  const requestStart = calendarDateStart(request.startsOn);
  const requestEndExclusive = addDays(calendarDateStart(request.endsOn), 1);
  let cursor = firstDayOfMonth(requestStart);

  while (cursor < requestEndExclusive) {
    const nextMonth = addMonths(cursor, 1);
    const bucketStart = maxDate(cursor, requestStart);
    const bucketEndExclusive = minDate(nextMonth, requestEndExclusive);
    const startsOn = calendarDateKey(bucketStart);
    const endsOn = calendarDateKey(addDays(bucketEndExclusive, -1));

    buckets.push(
      bucketWindow(
        buckets.length + 1,
        startsOn.slice(0, 7),
        endsOn,
        request.granularity,
        bucketStart,
        bucketEndExclusive,
        startsOn
      )
    );
    cursor = nextMonth;
  }

  return buckets;
}

function bucketWindow(
  bucketNumber: number,
  bucketKey: string,
  endsOn: string,
  granularity: PacingSnapshotGranularity,
  start: Date,
  endExclusive: Date,
  startsOn: string = bucketKey
): BucketWindow {
  return {
    bucketNumber,
    bucketKey,
    granularity,
    startsOn,
    endsOn,
    start,
    endExclusive,
    calendarDayCount: countDays(start, endExclusive)
  };
}

function requestSourceCounts(
  orders: readonly DealerOrderRecord[],
  buckets: readonly PacingSnapshotBucketSummary[]
): PacingSnapshotSourceCounts {
  const sourceMetricTotals = buckets.reduce(
    (totals, bucket) => ({
      leadCreatedCount:
        totals.leadCreatedCount + bucket.metrics.leadCreatedCount,
      routedLeadCount: totals.routedLeadCount + bucket.metrics.routedLeadCount,
      unroutedLeadCount:
        totals.unroutedLeadCount + bucket.metrics.unroutedLeadCount,
      routingEventCount:
        totals.routingEventCount + bucket.metrics.routingEventCount,
      deliveredLeadCount:
        totals.deliveredLeadCount + bucket.metrics.deliveredLeadCount
    }),
    {
      leadCreatedCount: 0,
      routedLeadCount: 0,
      unroutedLeadCount: 0,
      routingEventCount: 0,
      deliveredLeadCount: 0
    }
  );

  return {
    dealerOrderCount: orders.length,
    activeDealerOrderCount: orders.filter((order) => order.status === "active")
      .length,
    ...sourceMetricTotals
  };
}

function ordersOverlappingWindow(
  orders: readonly DealerOrderRecord[],
  start: Date,
  endExclusive: Date
): DealerOrderRecord[] {
  return orders.filter((order) =>
    orderOverlapsWindow(order, start, endExclusive)
  );
}

function orderOverlapsWindow(
  order: Pick<DealerOrderRecord, "startDate" | "endDate">,
  start: Date,
  endExclusive: Date
): boolean {
  const orderStart = startOfUtcDay(order.startDate);
  const orderEndExclusive = order.endDate
    ? addDays(startOfUtcDay(order.endDate), 1)
    : null;

  return orderStart < endExclusive && (!orderEndExclusive || orderEndExclusive > start);
}

function expectedDeliveryForBucket(
  activeOrders: readonly DealerOrderRecord[],
  bucket: BucketWindow
): number {
  const expected = activeOrders.reduce((total, order) => {
    const overlapDays = orderOverlapDays(order, bucket);

    if (overlapDays === 0) {
      return total;
    }

    return (
      total +
      (order.monthlyQuota * overlapDays) / daysInMonth(bucket.startsOn)
    );
  }, 0);

  return roundMetric(expected);
}

function orderOverlapDays(
  order: Pick<DealerOrderRecord, "startDate" | "endDate">,
  bucket: BucketWindow
): number {
  const orderStart = startOfUtcDay(order.startDate);
  const orderEndExclusive = order.endDate
    ? addDays(startOfUtcDay(order.endDate), 1)
    : bucket.endExclusive;
  const start = maxDate(bucket.start, orderStart);
  const endExclusive = minDate(bucket.endExclusive, orderEndExclusive);

  if (endExclusive <= start) {
    return 0;
  }

  return countDays(start, endExclusive);
}

function hasAssignmentEvidence(lead: Pick<LeadRecord, "assignedOrderId" | "assignmentReason">): boolean {
  return lead.assignmentReason === "routed" && lead.assignedOrderId !== null;
}

function missingDealerOrderIds(
  requestedIds: readonly string[],
  dealerOrders: readonly DealerOrderRecord[]
): string[] {
  const foundIds = new Set(dealerOrders.map((order) => order.id));

  return requestedIds.filter((orderId) => !foundIds.has(orderId));
}

function dealerOrderSummary(
  order: DealerOrderRecord
): PacingSnapshotDealerOrderSummary {
  return {
    orderId: order.id,
    dealerName: order.name,
    accountId: order.account.id,
    accountName: order.account.name,
    status: order.status,
    monthlyQuota: order.monthlyQuota,
    startsOn: calendarDateKey(order.startDate),
    endsOn: order.endDate ? calendarDateKey(order.endDate) : null
  };
}

function metricValue(
  key: PacingSnapshotMetricKey,
  value: number
): PacingSnapshotMetricValue {
  const definition = metricDefinitionsByKey.get(key);

  if (!definition) {
    throw new Error(`Missing pacing snapshot metric definition for ${key}.`);
  }

  return {
    key,
    label: definition.label,
    source: definition.source,
    valueType: definition.valueType,
    value
  };
}

function readFlags(): PacingSnapshotBuilderReadFlags {
  return {
    metadata: true,
    validatedSnapshotInput: true,
    database: true,
    crmRecords: true,
    leads: true,
    activities: true,
    routingEvents: true,
    dealerOrders: true,
    pacingEngine: true,
    liveRouting: false,
    persistedSnapshots: false,
    routeHandlers: false,
    externalServices: false
  };
}

function noWriteFlags(): PacingSnapshotWriteFlags {
  return {
    database: false,
    leads: false,
    activities: false,
    routingEvents: false,
    dealerOrders: false,
    areas: false,
    pacingEngine: false,
    pacingSnapshots: false,
    pacingSnapshotHistory: false,
    forecasts: false,
    scenarioPersistence: false,
    routes: false,
    files: false,
    externalServices: false,
    backgroundJobs: false
  };
}

function safetyFlags(): PacingSnapshotBuilderSafety {
  return {
    deterministic: true,
    readOnly: true,
    validatesInputs: true,
    fixtureOnly: false,
    snapshotBuilder: true,
    liveRouting: false,
    leadCreation: false,
    leadStatusChanges: false,
    routingEventWrites: false,
    dealerOrderMutation: false,
    areaMutation: false,
    pacingMutation: false,
    snapshotPersistence: false,
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

function inWindow(value: Date, start: Date, endExclusive: Date): boolean {
  return value >= start && value < endExclusive;
}



function startOfUtcDay(value: Date): Date {
  return calendarDateStart(calendarDateKey(value));
}

function firstDayOfMonth(value: Date): Date {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), 1));
}

function addDays(value: Date, days: number): Date {
  return new Date(value.getTime() + days * 24 * 60 * 60 * 1000);
}

function addMonths(value: Date, months: number): Date {
  return new Date(
    Date.UTC(value.getUTCFullYear(), value.getUTCMonth() + months, 1)
  );
}

function maxDate(a: Date, b: Date): Date {
  return a > b ? a : b;
}

function minDate(a: Date, b: Date): Date {
  return a < b ? a : b;
}

function countDays(start: Date, endExclusive: Date): number {
  return Math.round(
    (endExclusive.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)
  );
}

function daysInMonth(startsOn: string): number {
  const [year, month] = startsOn.split("-").map(Number);
  if (year === undefined || month === undefined) {
    throw new Error(`Invalid calendar date: ${startsOn}`);
  }
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));

  return countDays(start, end);
}

function roundMetric(value: number): number {
  return Number(value.toFixed(2));
}
