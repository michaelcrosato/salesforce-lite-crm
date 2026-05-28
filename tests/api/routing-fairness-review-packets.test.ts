import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  ROUTING_FAIRNESS_METRIC_VERSION
} from "@/lib/server/routingFairnessMetrics";
import {
  ROUTING_FAIRNESS_REVIEW_PACKET_CONTENT_TYPE,
  ROUTING_FAIRNESS_REVIEW_PACKET_VERSION,
  buildRoutingFairnessReviewPacket
} from "@/lib/server/routingFairnessReviewPackets";
import {
  ROUTING_SIMULATOR_EVALUATION_VERSION
} from "@/lib/server/routingSimulatorEvaluator";
import { ROUTING_SIMULATOR_INPUT_VERSION } from "@/lib/server/routingSimulatorContracts";

const now = new Date("2026-05-16T12:00:00Z");
const accountId = "test-routing-fairness-review-account";
const routedAreaId = "test-routing-fairness-review-area-routed";
const inactiveAreaId = "test-routing-fairness-review-area-inactive";
const quotaAreaId = "test-routing-fairness-review-area-quota";
const watchAreaId = "test-routing-fairness-review-area-watch";
const routedOrderOneId = "test-routing-fairness-review-order-one";
const routedOrderTwoId = "test-routing-fairness-review-order-two";
const pausedOrderId = "test-routing-fairness-review-order-paused";
const quotaOrderId = "test-routing-fairness-review-order-quota";
const watchOrderId = "test-routing-fairness-review-order-watch";

describe("routing fairness review packets", () => {
  beforeEach(async () => {
    await cleanup();
    await createFixtures();
  });

  afterEach(async () => {
    await cleanup();
  });

  it("builds deterministic issue summaries and representative samples", async () => {
    const packet = await buildRoutingFairnessReviewPacket(
      {
        leads: [
          {
            referenceId: "route-me",
            firstName: "Riley",
            lastName: "Route",
            postalCode: "t7t 7t7",
            country: "CA",
            source: "web"
          },
          {
            referenceId: "no-area",
            firstName: "Noah",
            postalCode: "z9z 9z9",
            country: "CA"
          },
          {
            referenceId: "inactive-area",
            postalCode: "y8y 8y8",
            country: "CA",
            source: "event"
          },
          {
            referenceId: "quota-full",
            postalCode: "x7x 7x7",
            country: "CA"
          },
          {
            referenceId: "watch-route",
            firstName: "Willa",
            lastName: "Watch",
            postalCode: "w6w 6w6",
            country: "CA",
            source: "partner"
          }
        ]
      },
      { now, sampleLimit: 4 }
    );

    expect(packet).toMatchObject({
      contentType: ROUTING_FAIRNESS_REVIEW_PACKET_CONTENT_TYPE,
      packetType: "routing-fairness-review-packet",
      packetVersion: ROUTING_FAIRNESS_REVIEW_PACKET_VERSION,
      metricVersion: ROUTING_FAIRNESS_METRIC_VERSION,
      inputCatalogVersion: ROUTING_SIMULATOR_INPUT_VERSION,
      evaluationVersion: ROUTING_SIMULATOR_EVALUATION_VERSION,
      reviewedAt: now,
      leadCount: 5,
      rowSampleLimit: 4,
      metricSummary: {
        leadCount: 5,
        assignedCount: 2,
        blockedCount: 3,
        metricCount: 20,
        averageLeadQualityProxy: 0.76,
        quotaSaturationWatchCount: 1,
        quotaSaturationRiskCount: 1,
        thinLeadQualityCount: 2,
        slaRiskCounts: {
          low: 1,
          watch: 1,
          blocked: 3
        }
      },
      summary: {
        leadCount: 5,
        assignedCount: 2,
        blockedCount: 3,
        reviewStatus: "risk",
        issueCount: 8,
        issueCategoryCount: 5,
        blockedReasonCounts: {
          no_area_match: 1,
          no_matching_active_order: 1,
          all_orders_at_quota: 1
        },
        quotaSaturationWatchCount: 1,
        quotaSaturationRiskCount: 1,
        thinLeadQualityCount: 2,
        slaWatchCount: 1,
        representativeSampleCount: 4,
        sampleLimit: 4
      },
      source: {
        reviewModule: "lib/server/routingFairnessReviewPackets.ts",
        metricModule: "lib/server/routingFairnessMetrics.ts",
        evaluatorModule: "lib/server/routingSimulatorEvaluator.ts",
        inputContractModule: "lib/server/routingSimulatorContracts.ts",
        routingModule: "lib/routing/leadRouter.ts",
        packetScope: "read-only-routing-fairness-review-packet"
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
        routingSimulatorEvaluation: true,
        fairnessMetrics: true,
        routingFairnessReviewPacket: true,
        fairnessMetricRows: true,
        issueSummaries: true,
        representativeSamples: true
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
        metricSnapshots: false,
        fairnessWeights: false,
        routingAssignments: false,
        scenarioPersistence: false,
        simulatorRuns: false,
        reviewSnapshots: false,
        fairnessReviewHistory: false
      },
      safety: {
        deterministic: true,
        readOnly: true,
        metricOnly: true,
        validatesInputs: true,
        assignmentEvaluation: true,
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
        backgroundJobs: false,
        reviewOnly: true,
        operatorPacket: true,
        issueSummaries: true,
        representativeSamples: true
      }
    });
    expect(packet.evaluationSummary.reasonCounts).toEqual({
      routed: 2,
      no_area_match: 1,
      no_matching_active_order: 1,
      all_orders_at_quota: 1
    });
    expect(packet.issues).toEqual([
      {
        code: "blocked_routing",
        severity: "critical",
        count: 3,
        rowNumbers: [2, 3, 4],
        message: "3 hypothetical leads blocked before assignment.",
        explanations: [
          "no_area_match:1",
          "no_matching_active_order:1",
          "all_orders_at_quota:1"
        ]
      },
      {
        code: "quota_saturation_risk",
        severity: "critical",
        count: 1,
        rowNumbers: [4],
        message:
          "1 hypothetical lead mapped to quota-saturated dealer order context.",
        explanations: [
          "Routing Fairness Review Quota Order is at 1/1 delivered leads for the current month."
        ]
      },
      {
        code: "quota_saturation_watch",
        severity: "warning",
        count: 1,
        rowNumbers: [5],
        message:
          "1 hypothetical lead mapped to near-saturated dealer order context.",
        explanations: [
          "Routing Fairness Review Watch Order is at 7/8 delivered leads for the current month."
        ]
      },
      {
        code: "thin_lead_quality",
        severity: "warning",
        count: 2,
        rowNumbers: [3, 4],
        message:
          "2 hypothetical leads had thin deterministic lead-quality proxy context.",
        explanations: [
          "Lead quality proxy uses only deterministic input completeness and valid postal routing data."
        ]
      },
      {
        code: "sla_watch",
        severity: "warning",
        count: 1,
        rowNumbers: [5],
        message: "1 hypothetical lead routed with SLA watch indicators.",
        explanations: [
          "The hypothetical lead routes, but the selected order is near quota saturation."
        ]
      }
    ]);
    expect(packet.rowSamples.map((row) => row.rowNumber)).toEqual([2, 3, 4, 5]);
    expect(packet.rowSamples[2]).toMatchObject({
      rowNumber: 4,
      referenceId: "quota-full",
      status: "blocked",
      reason: "all_orders_at_quota",
      issueCodes: [
        "blocked_routing",
        "quota_saturation_risk",
        "thin_lead_quality"
      ],
      explanationReasons: [
        "Routing blocked with reason all_orders_at_quota.",
        "Routing Fairness Review Quota Order is at 1/1 delivered leads for the current month.",
        "Lead quality proxy uses only deterministic input completeness and valid postal routing data."
      ],
      metricHighlights: [
        {
          key: "paceGap",
          value: null,
          status: "blocked",
          band: "unavailable"
        },
        {
          key: "quotaSaturation",
          value: 1,
          status: "risk",
          band: "saturated"
        },
        {
          key: "leadQualityProxy",
          value: 0.5,
          status: "risk",
          band: "thin"
        },
        {
          key: "slaRisk",
          value: 1,
          status: "blocked",
          band: "blocked"
        }
      ]
    });
    expect(packet.rowSamples[3]).toMatchObject({
      rowNumber: 5,
      referenceId: "watch-route",
      status: "assigned",
      reason: "routed",
      matchedAreaId: watchAreaId,
      selectedOrder: {
        orderId: watchOrderId,
        dealerName: "Routing Fairness Review Watch Order",
        accountId,
        accountName: "Routing Fairness Review Account",
        monthlyQuota: 8,
        deliveredThisMonth: 7,
        remainingQuota: 1,
        rank: 1
      },
      issueCodes: ["quota_saturation_watch", "sla_watch"]
    });
  });

  it("does not write CRM records or mutate live routing state", async () => {
    const before = await liveRoutingState();

    const packet = await buildRoutingFairnessReviewPacket(
      {
        leads: [
          {
            referenceId: "no-write-check",
            firstName: "Nora",
            lastName: "Writecheck",
            postalCode: "T7T 7T7",
            country: "CA"
          }
        ]
      },
      { now }
    );

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
    expect(packet.write).toMatchObject({
      database: false,
      leads: false,
      activities: false,
      routingEvents: false,
      dealerOrders: false,
      areas: false,
      pacingEngine: false,
      metricSnapshots: false,
      fairnessWeights: false,
      routingAssignments: false,
      reviewSnapshots: false,
      fairnessReviewHistory: false
    });
    expect(packet.safety).toMatchObject({
      readOnly: true,
      metricOnly: true,
      reviewOnly: true,
      operatorPacket: true,
      routingAlgorithmChanges: false,
      fairnessWeightingChanges: false,
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
      name: "Routing Fairness Review Account",
      status: "active",
      healthScore: 95
    }
  });
  await prisma.area.createMany({
    data: [
      {
        id: routedAreaId,
        name: "Routing Fairness Review Routed Area",
        postalPrefixes: "T7T"
      },
      {
        id: inactiveAreaId,
        name: "Routing Fairness Review Inactive Area",
        postalPrefixes: "Y8Y"
      },
      {
        id: quotaAreaId,
        name: "Routing Fairness Review Quota Area",
        postalPrefixes: "X7X"
      },
      {
        id: watchAreaId,
        name: "Routing Fairness Review Watch Area",
        postalPrefixes: "W6W"
      }
    ]
  });
  await prisma.dealerOrder.createMany({
    data: [
      {
        id: routedOrderOneId,
        accountId,
        name: "Routing Fairness Review Order One",
        monthlyQuota: 4,
        status: "active",
        startDate: new Date("2026-05-01T00:00:00Z")
      },
      {
        id: routedOrderTwoId,
        accountId,
        name: "Routing Fairness Review Order Two",
        monthlyQuota: 8,
        status: "active",
        startDate: new Date("2026-05-02T00:00:00Z")
      },
      {
        id: pausedOrderId,
        accountId,
        name: "Routing Fairness Review Paused Order",
        monthlyQuota: 10,
        status: "paused",
        startDate: new Date("2026-05-01T00:00:00Z")
      },
      {
        id: quotaOrderId,
        accountId,
        name: "Routing Fairness Review Quota Order",
        monthlyQuota: 1,
        status: "active",
        startDate: new Date("2026-05-01T00:00:00Z")
      },
      {
        id: watchOrderId,
        accountId,
        name: "Routing Fairness Review Watch Order",
        monthlyQuota: 8,
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
      },
      {
        dealerOrderId: watchOrderId,
        areaId: watchAreaId
      }
    ]
  });
  await prisma.lead.createMany({
    data: [
      deliveredLead("test-routing-fairness-review-one-delivered-1", routedOrderOneId),
      deliveredLead("test-routing-fairness-review-two-delivered-1", routedOrderTwoId),
      deliveredLead("test-routing-fairness-review-quota-delivered-1", quotaOrderId),
      ...Array.from({ length: 7 }, (_, index) =>
        deliveredLead(
          `test-routing-fairness-review-watch-delivered-${index + 1}`,
          watchOrderId
        )
      )
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
        startsWith: "test-routing-fairness-review"
      }
    }
  });
  await prisma.lead.deleteMany({
    where: {
      id: {
        startsWith: "test-routing-fairness-review"
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
              quotaOrderId,
              watchOrderId
            ]
          }
        },
        {
          areaId: {
            in: [routedAreaId, inactiveAreaId, quotaAreaId, watchAreaId]
          }
        }
      ]
    }
  });
  await prisma.dealerOrder.deleteMany({
    where: {
      id: {
        in: [
          routedOrderOneId,
          routedOrderTwoId,
          pausedOrderId,
          quotaOrderId,
          watchOrderId
        ]
      }
    }
  });
  await prisma.area.deleteMany({
    where: {
      id: {
        in: [routedAreaId, inactiveAreaId, quotaAreaId, watchAreaId]
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
            quotaOrderId,
            watchOrderId
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
          in: [
            routedOrderOneId,
            routedOrderTwoId,
            pausedOrderId,
            quotaOrderId,
            watchOrderId
          ]
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
