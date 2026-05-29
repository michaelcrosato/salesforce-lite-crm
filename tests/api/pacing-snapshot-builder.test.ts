import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  PACING_SNAPSHOT_BUILDER_VERSION,
  buildPacingSnapshotBatch
} from "@/lib/server/pacingSnapshotBuilder";
import {
  PACING_SNAPSHOT_CONTENT_TYPE,
  PACING_SNAPSHOT_METRIC_KEYS,
  PACING_SNAPSHOT_VERSION
} from "@/lib/server/pacingSnapshotContracts";

const now = new Date("2020-04-05T12:00:00Z");
const accountId = "test-pacing-snapshot-account";
const activeOrderId = "test-pacing-snapshot-order-active";
const pausedOrderId = "test-pacing-snapshot-order-paused";
const missingOrderId = "test-pacing-snapshot-order-missing";

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
  backgroundJobs: false
};

describe("pacing snapshot builder", () => {
  beforeEach(async () => {
    await cleanup();
    await createFixtures();
  });

  afterEach(async () => {
    await cleanup();
  });

  it("builds daily read-only bucket metrics for a filtered dealer order", async () => {
    const packet = await buildPacingSnapshotBatch(
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
          }
        ]
      },
      { now }
    );

    expect(packet).toMatchObject({
      contentType: PACING_SNAPSHOT_CONTENT_TYPE,
      packetType: "pacing-snapshot-build",
      builderVersion: PACING_SNAPSHOT_BUILDER_VERSION,
      contractVersion: PACING_SNAPSHOT_VERSION,
      builtAt: now,
      requestCount: 1,
      bucketCount: 3,
      summary: {
        requestCount: 1,
        bucketCount: 3,
        metricValueCount: 12
      },
      source: {
        builderModule: "lib/server/pacingSnapshotBuilder.ts",
        contractModule: "lib/server/pacingSnapshotContracts.ts",
        databaseModels: ["DealerOrder", "Lead", "Activity"],
        snapshotScope: "read-only-pacing-snapshot-builder"
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
        externalServices: false
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
        backgroundJobs: false
      }
    });

    const request = packet.requests[0];
    expect(request).toMatchObject({
      rowNumber: 1,
      referenceId: "active-daily",
      label: "Active order daily pacing",
      granularity: "daily",
      startsOn: "2020-04-01",
      endsOn: "2020-04-03",
      calendarDayCount: 3,
      bucketCount: 3,
      dealerOrderIds: [activeOrderId],
      dealerOrderFilterCount: 1,
      missingDealerOrderIds: [],
      metricCount: 4,
      sourceCounts: {
        dealerOrderCount: 1,
        activeDealerOrderCount: 1,
        leadCreatedCount: 2,
        routedLeadCount: 2,
        unroutedLeadCount: 0,
        routingEventCount: 2,
        deliveredLeadCount: 2
      }
    });
    expect(request?.dealerOrders).toEqual([
      {
        orderId: activeOrderId,
        dealerName: "Pacing Snapshot Active Order",
        accountId,
        accountName: "Pacing Snapshot Account",
        status: "active",
        monthlyQuota: 30,
        startsOn: "2020-04-01",
        endsOn: null
      }
    ]);
    expect(request?.buckets.map((bucket) => bucket.bucketKey)).toEqual([
      "2020-04-01",
      "2020-04-02",
      "2020-04-03"
    ]);
    expect(request?.buckets[0]?.requestedMetrics.map((metric) => metric.key)).toEqual([
      "deliveredLeadCount",
      "expectedDeliveryCount",
      "paceGapCount",
      "deliveryRate"
    ]);
    expect(request?.buckets[0]?.metrics).toMatchObject({
      leadCreatedCount: 1,
      routedLeadCount: 1,
      unroutedLeadCount: 0,
      routingEventCount: 1,
      dealerOrderCount: 1,
      activeDealerOrderCount: 1,
      monthlyQuotaTotal: 30,
      deliveredLeadCount: 1,
      expectedDeliveryCount: 1,
      paceGapCount: 0,
      deliveryRate: 0.03
    });
    expect(request?.buckets[2]?.metrics).toMatchObject({
      leadCreatedCount: 0,
      routedLeadCount: 0,
      unroutedLeadCount: 0,
      routingEventCount: 0,
      dealerOrderCount: 1,
      activeDealerOrderCount: 1,
      monthlyQuotaTotal: 30,
      deliveredLeadCount: 0,
      expectedDeliveryCount: 1,
      paceGapCount: -1,
      deliveryRate: 0
    });
  });

  it("builds monthly unfiltered snapshots with routed and unrouted evidence", async () => {
    const packet = await buildPacingSnapshotBatch(
      {
        requests: [
          {
            referenceId: "monthly-all",
            granularity: "monthly",
            startsOn: "2020-04-01",
            endsOn: "2020-04-30"
          }
        ]
      },
      { now }
    );
    const request = packet.requests[0];
    const bucket = request?.buckets[0];

    expect(request).toMatchObject({
      referenceId: "monthly-all",
      dealerOrderIds: [],
      dealerOrderFilterCount: 0,
      metricKeys: [...PACING_SNAPSHOT_METRIC_KEYS],
      sourceCounts: {
        dealerOrderCount: 2,
        activeDealerOrderCount: 1,
        leadCreatedCount: 3,
        routedLeadCount: 2,
        unroutedLeadCount: 1,
        routingEventCount: 3,
        deliveredLeadCount: 2
      }
    });
    expect(bucket).toMatchObject({
      bucketNumber: 1,
      bucketKey: "2020-04",
      granularity: "monthly",
      startsOn: "2020-04-01",
      endsOn: "2020-04-30",
      calendarDayCount: 30,
      metrics: {
        leadCreatedCount: 3,
        routedLeadCount: 2,
        unroutedLeadCount: 1,
        routingEventCount: 3,
        dealerOrderCount: 2,
        activeDealerOrderCount: 1,
        monthlyQuotaTotal: 40,
        deliveredLeadCount: 2,
        expectedDeliveryCount: 30,
        paceGapCount: -28,
        deliveryRate: 0.05
      }
    });
    expect(bucket?.requestedMetrics).toHaveLength(
      PACING_SNAPSHOT_METRIC_KEYS.length
    );
  });

  it("reports missing dealer order filters without writing CRM records", async () => {
    const before = await currentCounts();

    const packet = await buildPacingSnapshotBatch(
      {
        requests: [
          {
            referenceId: "missing-filter",
            startsOn: "2020-04-01",
            endsOn: "2020-04-30",
            dealerOrderIds: [activeOrderId, missingOrderId],
            metricKeys: ["dealerOrderCount", "deliveredLeadCount"]
          }
        ]
      },
      { now }
    );

    expect(packet.requests[0]).toMatchObject({
      missingDealerOrderIds: [missingOrderId],
      sourceCounts: {
        dealerOrderCount: 1,
        activeDealerOrderCount: 1,
        leadCreatedCount: 2,
        routedLeadCount: 2,
        unroutedLeadCount: 0,
        routingEventCount: 2,
        deliveredLeadCount: 2
      }
    });
    expect(packet.requests[0]?.buckets[0]?.metrics).toMatchObject({
      dealerOrderCount: 1,
      deliveredLeadCount: 2
    });
    expect(await currentCounts()).toEqual(before);
  });
});

async function createFixtures() {
  await prisma.account.create({
    data: {
      id: accountId,
      name: "Pacing Snapshot Account",
      status: "active",
      healthScore: 91
    }
  });
  await prisma.dealerOrder.createMany({
    data: [
      {
        id: activeOrderId,
        accountId,
        name: "Pacing Snapshot Active Order",
        monthlyQuota: 30,
        status: "active",
        startDate: new Date("2020-04-01T00:00:00Z")
      },
      {
        id: pausedOrderId,
        accountId,
        name: "Pacing Snapshot Paused Order",
        monthlyQuota: 10,
        status: "paused",
        startDate: new Date("2020-04-01T00:00:00Z")
      }
    ]
  });
  await prisma.lead.createMany({
    data: [
      lead({
        id: "test-pacing-snapshot-lead-routed-1",
        createdAt: new Date("2020-04-01T09:00:00Z"),
        assignedOrderId: activeOrderId,
        assignmentReason: "routed",
        status: "assigned"
      }),
      lead({
        id: "test-pacing-snapshot-lead-routed-2",
        createdAt: new Date("2020-04-02T10:00:00Z"),
        assignedOrderId: activeOrderId,
        assignmentReason: "routed",
        status: "assigned"
      }),
      lead({
        id: "test-pacing-snapshot-lead-unrouted-1",
        createdAt: new Date("2020-04-03T11:00:00Z"),
        assignedOrderId: null,
        assignmentReason: "no_area_match",
        status: "new"
      })
    ]
  });
  await prisma.activity.createMany({
    data: [
      routingEvent(
        "test-pacing-snapshot-event-routed-1",
        "test-pacing-snapshot-lead-routed-1",
        new Date("2020-04-01T09:05:00Z"),
        accountId
      ),
      routingEvent(
        "test-pacing-snapshot-event-routed-2",
        "test-pacing-snapshot-lead-routed-2",
        new Date("2020-04-02T10:05:00Z"),
        accountId
      ),
      routingEvent(
        "test-pacing-snapshot-event-unrouted-1",
        "test-pacing-snapshot-lead-unrouted-1",
        new Date("2020-04-03T11:05:00Z"),
        null
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
    lastName: "Snapshot",
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
    title: "Pacing snapshot routing evidence",
    summary: "Read-only routing event fixture for pacing snapshots.",
    createdAt
  };
}

async function cleanup() {
  await prisma.activity.deleteMany({
    where: {
      OR: [
        {
          id: {
            startsWith: "test-pacing-snapshot"
          }
        },
        {
          leadId: {
            startsWith: "test-pacing-snapshot"
          }
        }
      ]
    }
  });
  await prisma.lead.deleteMany({
    where: {
      id: {
        startsWith: "test-pacing-snapshot"
      }
    }
  });
  await prisma.dealerOrder.deleteMany({
    where: {
      id: {
        startsWith: "test-pacing-snapshot"
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
