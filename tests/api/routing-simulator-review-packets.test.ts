import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  ROUTING_SIMULATOR_EVALUATION_VERSION
} from "@/lib/server/routingSimulatorEvaluator";
import { ROUTING_SIMULATOR_INPUT_VERSION } from "@/lib/server/routingSimulatorContracts";
import {
  ROUTING_SIMULATOR_REVIEW_PACKET_CONTENT_TYPE,
  ROUTING_SIMULATOR_REVIEW_PACKET_VERSION,
  buildRoutingSimulatorReviewPacket
} from "@/lib/server/routingSimulatorReviewPackets";

const now = new Date("2026-05-16T12:00:00Z");
const accountId = "test-routing-review-account";
const routedAreaId = "test-routing-review-area-routed";
const inactiveAreaId = "test-routing-review-area-inactive";
const quotaAreaId = "test-routing-review-area-quota";
const routedOrderOneId = "test-routing-review-order-one";
const routedOrderTwoId = "test-routing-review-order-two";
const pausedOrderId = "test-routing-review-order-paused";
const quotaOrderId = "test-routing-review-order-quota";

describe("routing simulator review packets", () => {
  beforeEach(async () => {
    await cleanup();
    await createFixtures();
  });

  afterEach(async () => {
    await cleanup();
  });

  it("builds deterministic assignment summaries, issues, capacity notes, and samples", async () => {
    const packet = await buildRoutingSimulatorReviewPacket(
      {
        leads: [
          {
            referenceId: "route-me",
            postalCode: "t7t 7t7",
            country: "CA"
          },
          {
            referenceId: "no-area",
            postalCode: "z9z 9z9",
            country: "CA"
          },
          {
            referenceId: "inactive-area",
            postalCode: "y8y 8y8",
            country: "CA"
          },
          {
            referenceId: "quota-full",
            postalCode: "x7x 7x7",
            country: "CA"
          }
        ]
      },
      { now, sampleLimit: 2 }
    );

    expect(packet).toMatchObject({
      contentType: ROUTING_SIMULATOR_REVIEW_PACKET_CONTENT_TYPE,
      packetType: "routing-simulator-review-packet",
      packetVersion: ROUTING_SIMULATOR_REVIEW_PACKET_VERSION,
      inputCatalogVersion: ROUTING_SIMULATOR_INPUT_VERSION,
      evaluationVersion: ROUTING_SIMULATOR_EVALUATION_VERSION,
      reviewedAt: now,
      leadCount: 4,
      rowSampleLimit: 2,
      summary: {
        leadCount: 4,
        assignedCount: 1,
        blockedCount: 3,
        assignmentRate: 0.25,
        reviewStatus: "partially_blocked",
        issueCount: 3,
        issueCategoryCount: 3,
        blockedReasonCounts: {
          no_area_match: 1,
          no_matching_active_order: 1,
          all_orders_at_quota: 1
        },
        selectedOrderCount: 1,
        capacityImpactNoteCount: 1,
        sampleCount: 2,
        sampleLimit: 2
      },
      source: {
        reviewModule: "lib/server/routingSimulatorReviewPackets.ts",
        evaluatorModule: "lib/server/routingSimulatorEvaluator.ts",
        inputContractModule: "lib/server/routingSimulatorContracts.ts",
        routingModule: "lib/routing/leadRouter.ts",
        packetScope: "read-only-routing-simulator-review-packet"
      },
      read: {
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
      },
      write: {
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
      },
      safety: {
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
      }
    });
    expect(packet.evaluationSummary).toEqual({
      leadCount: 4,
      assignedCount: 1,
      blockedCount: 3,
      reasonCounts: {
        routed: 1,
        no_area_match: 1,
        no_matching_active_order: 1,
        all_orders_at_quota: 1
      },
      selectedOrderCounts: [
        {
          orderId: routedOrderTwoId,
          dealerName: "Routing Review Order Two",
          count: 1
        }
      ]
    });
    expect(packet.issues).toEqual([
      {
        code: "no_area_match",
        severity: "warning",
        count: 1,
        rowNumbers: [2],
        message: "1 hypothetical lead had no matching routing area."
      },
      {
        code: "no_matching_active_order",
        severity: "warning",
        count: 1,
        rowNumbers: [3],
        message:
          "1 hypothetical lead resolved to an area with no active dealer order."
      },
      {
        code: "all_orders_at_quota",
        severity: "warning",
        count: 1,
        rowNumbers: [4],
        message:
          "1 hypothetical lead resolved to dealer orders already at monthly quota."
      }
    ]);
    expect(packet.capacityImpact).toEqual([
      {
        orderId: routedOrderTwoId,
        dealerName: "Routing Review Order Two",
        accountId,
        accountName: "Routing Review Account",
        monthlyQuota: 8,
        deliveredThisMonth: 1,
        remainingQuota: 7,
        simulatedAssignedLeadCount: 1,
        projectedDeliveredThisMonth: 2,
        projectedRemainingQuota: 6,
        note:
          "Simulator would add 1 hypothetical lead to Routing Review Order Two, moving it from 1/8 to 2/8 delivered this month, leaving 6 slots remaining."
      }
    ]);
    expect(packet.rowSamples).toHaveLength(2);
    expect(packet.rowSamples[0]).toMatchObject({
      rowNumber: 1,
      referenceId: "route-me",
      normalizedPostalCode: "T7T 7T7",
      postalPrefix: "T7T",
      status: "assigned",
      reason: "routed",
      matchedArea: {
        id: routedAreaId,
        name: "Routing Review Routed Area"
      },
      selectedOrder: {
        orderId: routedOrderTwoId,
        dealerName: "Routing Review Order Two",
        accountId,
        accountName: "Routing Review Account",
        monthlyQuota: 8,
        deliveredThisMonth: 1,
        remainingQuota: 7,
        paceGap: 0.44,
        rank: 1
      },
      filteredOrderCount: 2,
      candidateOrderCount: 2
    });
    expect(packet.rowSamples[0]?.steps.map((step) => step.step)).toEqual([
      "normalize",
      "extract_prefix",
      "match_area",
      "filter_orders",
      "rank_pace_gap",
      "select"
    ]);
    expect(packet.rowSamples[1]).toMatchObject({
      rowNumber: 2,
      referenceId: "no-area",
      selectedOrder: null,
      filteredOrderCount: 0,
      candidateOrderCount: 0,
      status: "blocked",
      reason: "no_area_match"
    });
  });

  it("does not write CRM records while building review packets", async () => {
    const before = await currentCounts();

    await buildRoutingSimulatorReviewPacket(
      {
        leads: [
          {
            referenceId: "no-write-check",
            postalCode: "T7T 7T7",
            country: "CA"
          }
        ]
      },
      { now }
    );

    expect(await currentCounts()).toEqual(before);
  });

  it("keeps live routing and dealer-order state unchanged while reporting guardrails", async () => {
    const before = await liveRoutingState();

    const packet = await buildRoutingSimulatorReviewPacket(
      {
        leads: [
          {
            referenceId: "guard-assigned",
            postalCode: "T7T 7T7",
            country: "CA"
          },
          {
            referenceId: "guard-blocked",
            postalCode: "Z9Z 9Z9",
            country: "CA"
          }
        ]
      },
      { now }
    );

    expect(packet.summary).toMatchObject({
      leadCount: 2,
      assignedCount: 1,
      blockedCount: 1,
      reviewStatus: "partially_blocked"
    });
    expect(packet.capacityImpact).toEqual([
      expect.objectContaining({
        orderId: routedOrderTwoId,
        deliveredThisMonth: 1,
        simulatedAssignedLeadCount: 1,
        projectedDeliveredThisMonth: 2,
        projectedRemainingQuota: 6
      })
    ]);
    expect(packet.guardrails).toMatchObject({
      noLiveLeadCreation: true,
      noLeadStatusChanges: true,
      noRoutingEventWrites: true,
      noDealerOrderQuotaOrDeliveryMutation: true,
      noPacingEngineMutation: true,
      noForecastPersistence: true,
      noProductRoutesOrUi: true,
      noExternalCalls: true
    });
    expect(packet.write).toEqual({
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
    });
    expect(packet.safety).toMatchObject({
      readOnly: true,
      reviewOnly: true,
      liveRouting: false,
      leadCreation: false,
      routingEventWrites: false,
      dealerOrderMutation: false,
      routeHandlers: false,
      backgroundJobs: false
    });

    expect(await liveRoutingState()).toEqual(before);
  });
});

async function createFixtures() {
  await prisma.account.create({
    data: {
      id: accountId,
      name: "Routing Review Account",
      status: "active",
      healthScore: 95
    }
  });
  await prisma.area.createMany({
    data: [
      {
        id: routedAreaId,
        name: "Routing Review Routed Area",
        postalPrefixes: "T7T"
      },
      {
        id: inactiveAreaId,
        name: "Routing Review Inactive Area",
        postalPrefixes: "Y8Y"
      },
      {
        id: quotaAreaId,
        name: "Routing Review Quota Area",
        postalPrefixes: "X7X"
      }
    ]
  });
  await prisma.dealerOrder.createMany({
    data: [
      {
        id: routedOrderOneId,
        accountId,
        name: "Routing Review Order One",
        monthlyQuota: 4,
        status: "active",
        startDate: new Date("2026-05-01T00:00:00Z")
      },
      {
        id: routedOrderTwoId,
        accountId,
        name: "Routing Review Order Two",
        monthlyQuota: 8,
        status: "active",
        startDate: new Date("2026-05-02T00:00:00Z")
      },
      {
        id: pausedOrderId,
        accountId,
        name: "Routing Review Paused Order",
        monthlyQuota: 10,
        status: "paused",
        startDate: new Date("2026-05-01T00:00:00Z")
      },
      {
        id: quotaOrderId,
        accountId,
        name: "Routing Review Quota Order",
        monthlyQuota: 1,
        status: "active",
        startDate: new Date("2026-05-01T00:00:00Z")
      }
    ]
  });
  await prisma.dealerOrderArea.createMany({
    data: [
      {
        dealerOrderId: routedOrderOneId,
        areaId: routedAreaId
      },
      {
        dealerOrderId: routedOrderTwoId,
        areaId: routedAreaId
      },
      {
        dealerOrderId: pausedOrderId,
        areaId: inactiveAreaId
      },
      {
        dealerOrderId: quotaOrderId,
        areaId: quotaAreaId
      }
    ]
  });
  await prisma.lead.createMany({
    data: [
      deliveredLead("test-routing-review-one-delivered-1", routedOrderOneId),
      deliveredLead("test-routing-review-two-delivered-1", routedOrderTwoId),
      deliveredLead("test-routing-review-quota-delivered-1", quotaOrderId)
    ]
  });
}

function deliveredLead(id: string, assignedOrderId: string) {
  return {
    id,
    firstName: "Delivered",
    lastName: "Review",
    postalCode: "T7T 7T7",
    status: "assigned",
    assignmentReason: "routed",
    assignedOrderId,
    createdAt: new Date("2026-05-10T12:00:00Z")
  };
}

async function cleanup() {
  await prisma.activity.deleteMany({
    where: {
      leadId: {
        startsWith: "test-routing-review"
      }
    }
  });
  await prisma.lead.deleteMany({
    where: {
      id: {
        startsWith: "test-routing-review"
      }
    }
  });
  await prisma.dealerOrderArea.deleteMany({
    where: {
      OR: [
        {
          dealerOrderId: {
            in: [
              routedOrderOneId,
              routedOrderTwoId,
              pausedOrderId,
              quotaOrderId
            ]
          }
        },
        {
          areaId: {
            in: [routedAreaId, inactiveAreaId, quotaAreaId]
          }
        }
      ]
    }
  });
  await prisma.dealerOrder.deleteMany({
    where: {
      id: {
        in: [routedOrderOneId, routedOrderTwoId, pausedOrderId, quotaOrderId]
      }
    }
  });
  await prisma.area.deleteMany({
    where: {
      id: {
        in: [routedAreaId, inactiveAreaId, quotaAreaId]
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

async function liveRoutingState() {
  const [counts, dealerOrders, deliveredLeads] = await Promise.all([
    currentCounts(),
    prisma.dealerOrder.findMany({
      where: {
        id: {
          in: [
            routedOrderOneId,
            routedOrderTwoId,
            pausedOrderId,
            quotaOrderId
          ]
        }
      },
      select: {
        id: true,
        monthlyQuota: true,
        status: true
      },
      orderBy: {
        id: "asc"
      }
    }),
    prisma.lead.findMany({
      where: {
        assignedOrderId: {
          in: [routedOrderOneId, routedOrderTwoId, pausedOrderId, quotaOrderId]
        }
      },
      select: {
        id: true,
        assignedOrderId: true,
        status: true,
        assignmentReason: true
      },
      orderBy: {
        id: "asc"
      }
    })
  ]);

  return {
    counts,
    dealerOrders,
    deliveredLeads
  };
}
