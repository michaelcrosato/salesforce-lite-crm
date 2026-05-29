import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  PACING_SNAPSHOT_BUILDER_VERSION
} from "@/lib/server/pacingSnapshotBuilder";
import {
  PACING_SNAPSHOT_CONTENT_TYPE,
  PACING_SNAPSHOT_METRIC_KEYS,
  PACING_SNAPSHOT_VERSION
} from "@/lib/server/pacingSnapshotContracts";
import {
  PACING_SNAPSHOT_REVIEW_PACKET_VERSION,
  buildPacingSnapshotReviewPacket
} from "@/lib/server/pacingSnapshotReviewPackets";

const now = new Date("2020-04-05T12:00:00Z");
const accountId = "test-pacing-snapshot-review-account";
const activeOrderId = "test-pacing-snapshot-review-order-active";
const pausedOrderId = "test-pacing-snapshot-review-order-paused";
const missingOrderId = "test-pacing-snapshot-review-order-missing";

const noWriteFlags = {
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
  backgroundJobs: false,
  reviewPackets: false,
  snapshotReviewHistory: false,
  trendReports: false,
  dashboardWidgets: false,
  commandPaletteActions: false,
  csvImportApply: false
};

describe("pacing snapshot review packets", () => {
  beforeEach(async () => {
    await cleanup();
    await createFixtures();
  });

  afterEach(async () => {
    await cleanup();
  });

  it("packages builder output with freshness, source counts, empty states, and samples", async () => {
    const before = await currentCounts();

    const packet = await buildPacingSnapshotReviewPacket(
      {
        requests: [
          {
            referenceId: "active-daily",
            label: "Active order daily pacing",
            granularity: "daily",
            startsOn: "2020-04-01",
            endsOn: "2020-04-03",
            dealerOrderIds: [activeOrderId],
            metricKeys: [
              "deliveredLeadCount",
              "expectedDeliveryCount",
              "paceGapCount",
              "deliveryRate"
            ]
          },
          {
            referenceId: "missing-month",
            label: "Missing order monthly pacing",
            granularity: "monthly",
            startsOn: "2020-05-01",
            endsOn: "2020-05-31",
            dealerOrderIds: [missingOrderId],
            metricKeys: ["dealerOrderCount", "routedLeadCount"]
          }
        ]
      },
      { now, bucketSampleLimit: 3 }
    );

    expect(packet).toMatchObject({
      contentType: PACING_SNAPSHOT_CONTENT_TYPE,
      packetType: "pacing-snapshot-review-packet",
      packetVersion: PACING_SNAPSHOT_REVIEW_PACKET_VERSION,
      builderVersion: PACING_SNAPSHOT_BUILDER_VERSION,
      contractVersion: PACING_SNAPSHOT_VERSION,
      reviewedAt: now,
      builtAt: now,
      requestCount: 2,
      bucketCount: 4,
      bucketSampleLimit: 3,
      buildSummary: {
        requestCount: 2,
        bucketCount: 4,
        metricValueCount: 14
      },
      sourceCounts: {
        dealerOrderCount: 1,
        activeDealerOrderCount: 1,
        leadCreatedCount: 2,
        routedLeadCount: 2,
        unroutedLeadCount: 0,
        routingEventCount: 2,
        deliveredLeadCount: 2,
        requestedDealerOrderFilterCount: 2,
        missingDealerOrderFilterCount: 1
      },
      summary: {
        requestCount: 2,
        bucketCount: 4,
        metricValueCount: 14,
        reviewStatus: "partial_evidence",
        emptyStateReasonCount: 6,
        requestSummaryCount: 2,
        bucketSampleCount: 3,
        bucketSampleLimit: 3
      },
      freshness: {
        builtAt: now,
        reviewedAt: now,
        sourceWindowStartsOn: "2020-04-01",
        sourceWindowEndsOn: "2020-05-31",
        oldestBucketKey: "2020-04-01",
        newestBucketKey: "2020-05",
        freshnessStatus: "current_at_review_time",
        sourceRecordBasis: "existing_dealer_orders_leads_and_routing_events",
        persistedSnapshotHistory: false
      },
      source: {
        reviewModule: "lib/server/pacingSnapshotReviewPackets.ts",
        builderModule: "lib/server/pacingSnapshotBuilder.ts",
        contractModule: "lib/server/pacingSnapshotContracts.ts",
        databaseModels: ["DealerOrder", "Lead", "Activity"],
        packetScope: "read-only-pacing-snapshot-review-packet"
      },
      read: {
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
        externalServices: false,
        pacingSnapshotBuildPacket: true,
        pacingSnapshotReviewPacket: true,
        metricDefinitions: true,
        sourceCounts: true,
        freshnessMetadata: true,
        emptyStateReasons: true,
        representativeBucketSamples: true
      },
      write: noWriteFlags,
      safety: {
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
        backgroundJobs: false,
        reviewOnly: true,
        operatorPacket: true,
        trendReportReady: true,
        trendReportUi: false,
        commandPaletteAction: false,
        csvIntegration: false
      }
    });
    expect(packet.summary.sourceCounts).toEqual(packet.sourceCounts);
    expect(packet.metricDefinitions.map((metric) => metric.key)).toEqual(
      PACING_SNAPSHOT_METRIC_KEYS
    );
    expect(packet.requests).toEqual([
      {
        rowNumber: 1,
        referenceId: "active-daily",
        label: "Active order daily pacing",
        granularity: "daily",
        startsOn: "2020-04-01",
        endsOn: "2020-04-03",
        bucketCount: 3,
        metricCount: 4,
        dealerOrderFilterCount: 1,
        missingDealerOrderIds: [],
        sourceCounts: {
          dealerOrderCount: 1,
          activeDealerOrderCount: 1,
          leadCreatedCount: 2,
          routedLeadCount: 2,
          unroutedLeadCount: 0,
          routingEventCount: 2,
          deliveredLeadCount: 2
        },
        emptyStateReasonCodes: []
      },
      {
        rowNumber: 2,
        referenceId: "missing-month",
        label: "Missing order monthly pacing",
        granularity: "monthly",
        startsOn: "2020-05-01",
        endsOn: "2020-05-31",
        bucketCount: 1,
        metricCount: 2,
        dealerOrderFilterCount: 1,
        missingDealerOrderIds: [missingOrderId],
        sourceCounts: {
          dealerOrderCount: 0,
          activeDealerOrderCount: 0,
          leadCreatedCount: 0,
          routedLeadCount: 0,
          unroutedLeadCount: 0,
          routingEventCount: 0,
          deliveredLeadCount: 0
        },
        emptyStateReasonCodes: [
          "missing_dealer_order_filters",
          "no_matching_dealer_orders",
          "no_leads_created",
          "no_routed_leads",
          "no_routing_events",
          "no_delivered_leads"
        ]
      }
    ]);
    expect(packet.emptyStateReasons).toEqual([
      {
        code: "missing_dealer_order_filters",
        severity: "warning",
        count: 1,
        requestRowNumbers: [2],
        message:
          "1 request referenced dealer-order filters that were not found."
      },
      {
        code: "no_matching_dealer_orders",
        severity: "warning",
        count: 1,
        requestRowNumbers: [2],
        message: "1 request had no matching dealer orders in scope."
      },
      {
        code: "no_leads_created",
        severity: "info",
        count: 1,
        requestRowNumbers: [2],
        message: "1 request had no created leads in the snapshot window."
      },
      {
        code: "no_routed_leads",
        severity: "info",
        count: 1,
        requestRowNumbers: [2],
        message: "1 request had no routed leads in the snapshot window."
      },
      {
        code: "no_routing_events",
        severity: "info",
        count: 1,
        requestRowNumbers: [2],
        message:
          "1 request had no routing-event evidence in the snapshot window."
      },
      {
        code: "no_delivered_leads",
        severity: "info",
        count: 1,
        requestRowNumbers: [2],
        message:
          "1 request had no delivered lead evidence in the snapshot window."
      }
    ]);
    expect(packet.bucketSamples.map((sample) => sample.requestRowNumber)).toEqual([
      2,
      1,
      1
    ]);
    expect(packet.bucketSamples[0]).toMatchObject({
      requestRowNumber: 2,
      referenceId: "missing-month",
      bucketNumber: 1,
      bucketKey: "2020-05",
      granularity: "monthly",
      startsOn: "2020-05-01",
      endsOn: "2020-05-31",
      metrics: {
        dealerOrderCount: 0,
        routedLeadCount: 0,
        deliveredLeadCount: 0
      },
      emptyStateReasonCodes: [
        "missing_dealer_order_filters",
        "no_matching_dealer_orders",
        "no_leads_created",
        "no_routed_leads",
        "no_routing_events",
        "no_delivered_leads"
      ]
    });
    expect(packet.bucketSamples[1]?.requestedMetrics.map((metric) => metric.key)).toEqual([
      "deliveredLeadCount",
      "expectedDeliveryCount",
      "paceGapCount",
      "deliveryRate"
    ]);
    expect(await currentCounts()).toEqual(before);
  });

  it("marks fully empty review packets without adding routes, snapshots, or CRM writes", async () => {
    const before = await currentCounts();

    const packet = await buildPacingSnapshotReviewPacket(
      {
        requests: [
          {
            referenceId: "empty",
            startsOn: "2019-01-01",
            endsOn: "2019-01-31",
            metricKeys: ["dealerOrderCount", "leadCreatedCount"]
          }
        ]
      },
      { now }
    );

    expect(packet.summary).toMatchObject({
      requestCount: 1,
      bucketCount: 1,
      reviewStatus: "empty",
      sourceCounts: {
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
    });
    expect(packet.emptyStateReasons.map((reason) => reason.code)).toEqual([
      "no_leads_created",
      "no_routed_leads",
      "no_routing_events",
      "no_delivered_leads"
    ]);
    expect(packet.write).toEqual(noWriteFlags);
    expect(packet.safety).toMatchObject({
      readOnly: true,
      reviewOnly: true,
      snapshotPersistence: false,
      routeHandlers: false,
      trendReportUi: false,
      commandPaletteAction: false,
      csvIntegration: false,
      backgroundJobs: false
    });
    await expect(
      buildPacingSnapshotReviewPacket(
        {
          requests: [
            {
              startsOn: "2019-01-01",
              endsOn: "2019-01-31"
            }
          ]
        },
        { bucketSampleLimit: 11 }
      )
    ).rejects.toThrow();
    expect(await currentCounts()).toEqual(before);
  });
});

async function createFixtures() {
  await prisma.account.create({
    data: {
      id: accountId,
      name: "Pacing Snapshot Review Account",
      status: "active",
      healthScore: 91
    }
  });
  await prisma.dealerOrder.createMany({
    data: [
      {
        id: activeOrderId,
        accountId,
        name: "Pacing Snapshot Review Active Order",
        monthlyQuota: 30,
        status: "active",
        startDate: new Date("2020-04-01T00:00:00Z")
      },
      {
        id: pausedOrderId,
        accountId,
        name: "Pacing Snapshot Review Paused Order",
        monthlyQuota: 10,
        status: "paused",
        startDate: new Date("2020-04-01T00:00:00Z")
      }
    ]
  });
  await prisma.lead.createMany({
    data: [
      lead({
        id: "test-pacing-snapshot-review-lead-routed-1",
        createdAt: new Date("2020-04-01T09:00:00Z"),
        assignedOrderId: activeOrderId,
        assignmentReason: "routed",
        status: "assigned"
      }),
      lead({
        id: "test-pacing-snapshot-review-lead-routed-2",
        createdAt: new Date("2020-04-02T10:00:00Z"),
        assignedOrderId: activeOrderId,
        assignmentReason: "routed",
        status: "assigned"
      })
    ]
  });
  await prisma.activity.createMany({
    data: [
      routingEvent(
        "test-pacing-snapshot-review-event-routed-1",
        "test-pacing-snapshot-review-lead-routed-1",
        new Date("2020-04-01T09:05:00Z"),
        accountId
      ),
      routingEvent(
        "test-pacing-snapshot-review-event-routed-2",
        "test-pacing-snapshot-review-lead-routed-2",
        new Date("2020-04-02T10:05:00Z"),
        accountId
      )
    ]
  });
}

function lead(input: {
  readonly id: string;
  readonly createdAt: Date;
  readonly assignedOrderId: string | null;
  readonly assignmentReason: string;
  readonly status: string;
}) {
  return {
    id: input.id,
    firstName: "Pacing",
    lastName: "Review",
    postalCode: "T7T 7T7",
    status: input.status,
    assignedOrderId: input.assignedOrderId,
    assignmentReason: input.assignmentReason,
    createdAt: input.createdAt
  };
}

function routingEvent(
  id: string,
  leadId: string,
  createdAt: Date,
  linkedAccountId: string | null
) {
  return {
    id,
    leadId,
    accountId: linkedAccountId,
    type: "routing_event",
    title: "Pacing snapshot review routing evidence",
    summary: "Read-only routing event fixture for pacing snapshot reviews.",
    createdAt
  };
}

async function cleanup() {
  await prisma.activity.deleteMany({
    where: {
      OR: [
        {
          id: {
            startsWith: "test-pacing-snapshot-review"
          }
        },
        {
          leadId: {
            startsWith: "test-pacing-snapshot-review"
          }
        }
      ]
    }
  });
  await prisma.lead.deleteMany({
    where: {
      id: {
        startsWith: "test-pacing-snapshot-review"
      }
    }
  });
  await prisma.dealerOrder.deleteMany({
    where: {
      id: {
        startsWith: "test-pacing-snapshot-review"
      }
    }
  });
  await prisma.account.deleteMany({
    where: {
      id: accountId
    }
  });
}

async function currentCounts() {
  const [leads, activities, dealerOrders, areas] = await Promise.all([
    prisma.lead.count(),
    prisma.activity.count(),
    prisma.dealerOrder.count(),
    prisma.area.count()
  ]);

  return {
    leads,
    activities,
    dealerOrders,
    areas
  };
}
