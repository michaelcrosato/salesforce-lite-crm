import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  ROUTING_FAIRNESS_METRIC_CONTENT_TYPE,
  ROUTING_FAIRNESS_METRIC_VERSION,
  buildRoutingFairnessMetricPacket,
  getRoutingFairnessMetricCatalog
} from "@/lib/server/routingFairnessMetrics";
import {
  ROUTING_SIMULATOR_EVALUATION_VERSION
} from "@/lib/server/routingSimulatorEvaluator";
import { ROUTING_SIMULATOR_INPUT_VERSION } from "@/lib/server/routingSimulatorContracts";

const now = new Date("2026-05-16T12:00:00Z");
const accountId = "test-routing-fairness-account";
const routedAreaId = "test-routing-fairness-area-routed";
const inactiveAreaId = "test-routing-fairness-area-inactive";
const quotaAreaId = "test-routing-fairness-area-quota";
const routedOrderOneId = "test-routing-fairness-order-one";
const routedOrderTwoId = "test-routing-fairness-order-two";
const pausedOrderId = "test-routing-fairness-order-paused";
const quotaOrderId = "test-routing-fairness-order-quota";

describe("routing fairness metric contracts", () => {
  beforeEach(async () => {
    await cleanup();
    await createFixtures();
  });

  afterEach(async () => {
    await cleanup();
  });

  it("exposes metric definitions with explicit read and no-write safety", () => {
    const catalog = getRoutingFairnessMetricCatalog();

    expect(catalog).toMatchObject({
      contentType: ROUTING_FAIRNESS_METRIC_CONTENT_TYPE,
      catalogType: "routing-fairness-metric-contracts",
      catalogVersion: ROUTING_FAIRNESS_METRIC_VERSION,
      inputCatalogVersion: ROUTING_SIMULATOR_INPUT_VERSION,
      evaluationVersion: ROUTING_SIMULATOR_EVALUATION_VERSION,
      metricKeys: [
        "paceGap",
        "quotaSaturation",
        "leadQualityProxy",
        "slaRisk"
      ],
      metricCount: 4,
      source: {
        metricModule: "lib/server/routingFairnessMetrics.ts",
        evaluatorModule: "lib/server/routingSimulatorEvaluator.ts",
        inputContractModule: "lib/server/routingSimulatorContracts.ts",
        routingModule: "lib/routing/leadRouter.ts",
        catalogScope: "read-only-routing-fairness-metric-contracts"
      },
      read: {
        metadata: true,
        hypotheticalInput: false,
        database: false,
        crmRecords: false,
        areas: false,
        dealerOrders: false,
        liveRouting: false,
        pacingEngine: false,
        routeHandlers: false,
        externalServices: false,
        routingSimulatorEvaluation: false,
        fairnessMetrics: true
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
        simulatorRuns: false
      },
      safety: {
        deterministic: true,
        readOnly: true,
        metricOnly: true,
        validatesInputs: false,
        assignmentEvaluation: false,
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
      }
    });
    expect(catalog.metrics.map((metric) => metric.key)).toEqual(
      catalog.metricKeys
    );
    expect(
      catalog.metrics.every(
        (metric) =>
          metric.writes.database === false &&
          metric.writes.fairnessWeights === false &&
          metric.writes.routingAssignments === false
      )
    ).toBe(true);
  });

  it("builds deterministic row metrics and aggregate summaries", async () => {
    const packet = await buildRoutingFairnessMetricPacket(
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
          }
        ]
      },
      { now }
    );

    expect(packet).toMatchObject({
      contentType: ROUTING_FAIRNESS_METRIC_CONTENT_TYPE,
      packetType: "routing-fairness-metric-packet",
      packetVersion: ROUTING_FAIRNESS_METRIC_VERSION,
      inputCatalogVersion: ROUTING_SIMULATOR_INPUT_VERSION,
      evaluationVersion: ROUTING_SIMULATOR_EVALUATION_VERSION,
      evaluatedAt: now,
      leadCount: 4,
      summary: {
        leadCount: 4,
        assignedCount: 1,
        blockedCount: 3,
        metricCount: 16,
        averageLeadQualityProxy: 0.7,
        averageAssignedPaceGap: 0.44,
        quotaSaturationWatchCount: 0,
        quotaSaturationRiskCount: 1,
        thinLeadQualityCount: 2,
        slaRiskCounts: {
          low: 1,
          watch: 0,
          blocked: 3
        }
      },
      source: {
        metricModule: "lib/server/routingFairnessMetrics.ts",
        evaluatorModule: "lib/server/routingSimulatorEvaluator.ts",
        inputContractModule: "lib/server/routingSimulatorContracts.ts",
        routingModule: "lib/routing/leadRouter.ts",
        packetScope: "read-only-routing-fairness-metric-packet"
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
        fairnessMetrics: true
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
        simulatorRuns: false
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
        backgroundJobs: false
      }
    });
    expect(packet.evaluationSummary.reasonCounts).toEqual({
      routed: 1,
      no_area_match: 1,
      no_matching_active_order: 1,
      all_orders_at_quota: 1
    });

    const routed = packet.rows.find((row) => row.referenceId === "route-me");
    expect(routed).toMatchObject({
      normalizedPostalCode: "T7T 7T7",
      postalPrefix: "T7T",
      matchedAreaId: routedAreaId,
      status: "assigned",
      reason: "routed",
      selectedOrder: {
        orderId: routedOrderTwoId,
        dealerName: "Routing Fairness Order Two",
        accountId,
        accountName: "Routing Fairness Account",
        monthlyQuota: 8,
        deliveredThisMonth: 1,
        remainingQuota: 7,
        paceGap: 0.44,
        rank: 1
      },
      filteredOrderCount: 2,
      candidateOrderCount: 2,
      metrics: {
        paceGap: {
          key: "paceGap",
          value: 0.44,
          status: "watch",
          band: "modest_gap"
        },
        quotaSaturation: {
          key: "quotaSaturation",
          value: 0.13,
          status: "ok",
          band: "available_capacity"
        },
        leadQualityProxy: {
          key: "leadQualityProxy",
          value: 1,
          status: "ok",
          band: "complete"
        },
        slaRisk: {
          key: "slaRisk",
          value: 0,
          status: "ok",
          band: "low"
        }
      }
    });
    expect(routed?.metrics.leadQualityProxy.evidence).toEqual([
      "postal_valid",
      "first_name_present",
      "last_name_present",
      "source_present"
    ]);

    expect(packet.rows.find((row) => row.referenceId === "no-area")).toMatchObject({
      status: "blocked",
      reason: "no_area_match",
      metrics: {
        paceGap: {
          value: null,
          status: "blocked",
          band: "unavailable"
        },
        quotaSaturation: {
          value: null,
          status: "blocked",
          band: "unavailable"
        },
        leadQualityProxy: {
          value: 0.7,
          status: "watch",
          band: "usable"
        },
        slaRisk: {
          value: 1,
          status: "blocked",
          band: "blocked"
        }
      }
    });
    expect(packet.rows.find((row) => row.referenceId === "quota-full")).toMatchObject({
      reason: "all_orders_at_quota",
      metrics: {
        quotaSaturation: {
          value: 1,
          status: "risk",
          band: "saturated"
        },
        leadQualityProxy: {
          value: 0.5,
          status: "risk",
          band: "thin"
        },
        slaRisk: {
          value: 1,
          status: "blocked",
          band: "blocked"
        }
      }
    });
  });

  it("does not write CRM records while building metric packets", async () => {
    const before = await currentCounts();

    await buildRoutingFairnessMetricPacket(
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

    expect(await currentCounts()).toEqual(before);
  });
});

async function createFixtures() {
  await prisma.account.create({
    data: {
      id: accountId,
      name: "Routing Fairness Account",
      status: "active",
      healthScore: 95
    }
  });
  await prisma.area.createMany({
    data: [
      {
        id: routedAreaId,
        name: "Routing Fairness Routed Area",
        postalPrefixes: "T7T"
      },
      {
        id: inactiveAreaId,
        name: "Routing Fairness Inactive Area",
        postalPrefixes: "Y8Y"
      },
      {
        id: quotaAreaId,
        name: "Routing Fairness Quota Area",
        postalPrefixes: "X7X"
      }
    ]
  });
  await prisma.dealerOrder.createMany({
    data: [
      {
        id: routedOrderOneId,
        accountId,
        name: "Routing Fairness Order One",
        monthlyQuota: 4,
        status: "active",
        startDate: new Date("2026-05-01T00:00:00Z")
      },
      {
        id: routedOrderTwoId,
        accountId,
        name: "Routing Fairness Order Two",
        monthlyQuota: 8,
        status: "active",
        startDate: new Date("2026-05-02T00:00:00Z")
      },
      {
        id: pausedOrderId,
        accountId,
        name: "Routing Fairness Paused Order",
        monthlyQuota: 10,
        status: "paused",
        startDate: new Date("2026-05-01T00:00:00Z")
      },
      {
        id: quotaOrderId,
        accountId,
        name: "Routing Fairness Quota Order",
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
      deliveredLead("test-routing-fairness-one-delivered-1", routedOrderOneId),
      deliveredLead("test-routing-fairness-two-delivered-1", routedOrderTwoId),
      deliveredLead("test-routing-fairness-quota-delivered-1", quotaOrderId)
    ]
  });
}

function deliveredLead(id: string, assignedOrderId: string) {
  return {
    id,
    firstName: "Delivered",
    lastName: "Fairness",
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
        startsWith: "test-routing-fairness"
      }
    }
  });
  await prisma.lead.deleteMany({
    where: {
      id: {
        startsWith: "test-routing-fairness"
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
