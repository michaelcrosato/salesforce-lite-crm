import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  ROUTING_SIMULATOR_EVALUATION_VERSION,
  evaluateRoutingSimulatorBatch
} from "@/lib/server/routingSimulatorEvaluator";
import { ROUTING_SIMULATOR_INPUT_VERSION } from "@/lib/server/routingSimulatorContracts";

const now = new Date("2026-05-16T12:00:00Z");
const accountId = "test-routing-simulator-account";
const routedAreaId = "test-routing-simulator-area-routed";
const inactiveAreaId = "test-routing-simulator-area-inactive";
const quotaAreaId = "test-routing-simulator-area-quota";
const routedOrderOneId = "test-routing-simulator-order-one";
const routedOrderTwoId = "test-routing-simulator-order-two";
const pausedOrderId = "test-routing-simulator-order-paused";
const quotaOrderId = "test-routing-simulator-order-quota";

describe("routing simulator read-only evaluator", () => {
  beforeEach(async () => {
    await cleanup();
    await createFixtures();
  });

  afterEach(async () => {
    await cleanup();
  });

  it("evaluates hypothetical routing outcomes with deterministic traces", async () => {
    const packet = await evaluateRoutingSimulatorBatch(
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
      { now }
    );

    expect(packet).toMatchObject({
      packetType: "routing-simulator-evaluation",
      evaluationVersion: ROUTING_SIMULATOR_EVALUATION_VERSION,
      inputCatalogVersion: ROUTING_SIMULATOR_INPUT_VERSION,
      evaluatedAt: now,
      leadCount: 4,
      source: {
        evaluatorModule: "lib/server/routingSimulatorEvaluator.ts",
        inputContractModule: "lib/server/routingSimulatorContracts.ts",
        routingModule: "lib/routing/leadRouter.ts",
        evaluationScope: "read-only-hypothetical-routing"
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
        externalServices: false
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
        backgroundJobs: false
      },
      safety: {
        deterministic: true,
        readOnly: true,
        validatesInputs: true,
        fixtureOnly: false,
        assignmentEvaluation: true,
        liveRouting: false,
        leadCreation: false,
        routingEventWrites: false,
        dealerOrderMutation: false,
        pacingMutation: false,
        forecastPersistence: false,
        geocoding: false,
        externalAi: false,
        network: false,
        productUi: false,
        routeHandlers: false
      }
    });
    expect(packet.summary).toEqual({
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
          dealerName: "Simulator Routed Order Two",
          count: 1
        }
      ]
    });
    expect(packet.capacitySummary).toEqual({
      applied: false,
      evaluatedOn: "2026-05-16",
      windowCount: 0,
      blockedCount: 0,
      overflowCount: 0,
      assignedWithCapacityCount: 0,
      outcomeCounts: {
        not_configured: 0,
        outside_window: 0,
        blackout_date: 0,
        daily_cap_reached: 0,
        available: 0
      }
    });

    const routed = packet.rows.find((row) => row.referenceId === "route-me");
    expect(routed).toMatchObject({
      normalizedPostalCode: "T7T 7T7",
      postalPrefix: "T7T",
      matchedArea: {
        id: routedAreaId,
        name: "Simulator Routed Area"
      },
      status: "assigned",
      reason: "routed",
      capacity: {
        applied: false,
        evaluatedOn: "2026-05-16",
        candidateChecks: [],
        selectedCheck: null,
        blockedByCapacity: false,
        overflowed: false,
        overflowedFromOrderIds: []
      },
      selectedOrder: {
        orderId: routedOrderTwoId,
        dealerName: "Simulator Routed Order Two",
        accountId,
        accountName: "Routing Simulator Account",
        monthlyQuota: 8,
        deliveredThisMonth: 1,
        remainingQuota: 7,
        paceGap: 0.44,
        rank: 1
      }
    });
    expect(routed?.filteredOrders.map((order) => order.orderId)).toEqual([
      routedOrderOneId,
      routedOrderTwoId
    ]);
    expect(routed?.rankedOrders.map((order) => order.orderId)).toEqual([
      routedOrderTwoId,
      routedOrderOneId
    ]);
    expect(routed?.rankedOrders[1]).toMatchObject({
      orderId: routedOrderOneId,
      paceGap: 0.19,
      rank: 2
    });
    expect(routed?.steps.map((step) => step.step)).toEqual([
      "normalize",
      "extract_prefix",
      "match_area",
      "filter_orders",
      "rank_pace_gap",
      "select"
    ]);
    expect(routed?.steps[3]).toEqual({
      step: "filter_orders",
      result: {
        count: 2,
        orderIds: [routedOrderOneId, routedOrderTwoId]
      }
    });
    expect(routed?.steps[5]).toEqual({
      step: "select",
      result: {
        orderId: routedOrderTwoId
      }
    });

    expect(packet.rows.find((row) => row.referenceId === "no-area")).toMatchObject({
      matchedArea: null,
      filteredOrders: [],
      rankedOrders: [],
      selectedOrder: null,
      status: "blocked",
      reason: "no_area_match",
      summary: "No area matched the hypothetical lead postal code."
    });
    expect(
      packet.rows.find((row) => row.referenceId === "inactive-area")
    ).toMatchObject({
      matchedArea: {
        id: inactiveAreaId,
        name: "Simulator Inactive Area"
      },
      filteredOrders: [],
      rankedOrders: [],
      selectedOrder: null,
      status: "blocked",
      reason: "no_matching_active_order",
      summary: "The resolved area has no active dealer order."
    });
    expect(packet.rows.find((row) => row.referenceId === "quota-full")).toMatchObject({
      matchedArea: {
        id: quotaAreaId,
        name: "Simulator Quota Area"
      },
      filteredOrders: [
        {
          orderId: quotaOrderId,
          monthlyQuota: 1,
          deliveredThisMonth: 1,
          remainingQuota: 0,
          status: "active"
        }
      ],
      rankedOrders: [],
      selectedOrder: null,
      status: "blocked",
      reason: "all_orders_at_quota",
      summary: "All active dealer orders in the resolved area are at monthly quota."
    });
  });

  it("applies capacity windows for batch overflow and blocking", async () => {
    const packet = await evaluateRoutingSimulatorBatch(
      {
        leads: [
          {
            referenceId: "capacity-one",
            postalCode: "t7t 7t7",
            country: "CA"
          },
          {
            referenceId: "capacity-two",
            postalCode: "t7t 7t7",
            country: "CA"
          },
          {
            referenceId: "capacity-three",
            postalCode: "t7t 7t7",
            country: "CA"
          }
        ]
      },
      {
        now,
        capacityWindows: {
          windows: [
            {
              dealerOrderId: routedOrderTwoId,
              label: "Order two daily cap",
              startsOn: "2026-05-16",
              endsOn: "2026-05-16",
              dailyCap: 1
            },
            {
              dealerOrderId: routedOrderOneId,
              label: "Order one daily cap",
              startsOn: "2026-05-16",
              endsOn: "2026-05-16",
              dailyCap: 1
            }
          ]
        }
      }
    );

    expect(packet.summary).toEqual({
      leadCount: 3,
      assignedCount: 2,
      blockedCount: 1,
      reasonCounts: {
        routed: 2,
        no_area_match: 0,
        no_matching_active_order: 0,
        all_orders_at_quota: 1
      },
      selectedOrderCounts: [
        {
          orderId: routedOrderOneId,
          dealerName: "Simulator Routed Order One",
          count: 1
        },
        {
          orderId: routedOrderTwoId,
          dealerName: "Simulator Routed Order Two",
          count: 1
        }
      ]
    });
    expect(packet.capacitySummary).toEqual({
      applied: true,
      evaluatedOn: "2026-05-16",
      windowCount: 2,
      blockedCount: 1,
      overflowCount: 1,
      assignedWithCapacityCount: 2,
      outcomeCounts: {
        not_configured: 0,
        outside_window: 0,
        blackout_date: 0,
        daily_cap_reached: 3,
        available: 3
      }
    });

    const first = packet.rows.find(
      (row) => row.referenceId === "capacity-one"
    );
    expect(first).toMatchObject({
      status: "assigned",
      reason: "routed",
      selectedOrder: {
        orderId: routedOrderTwoId
      },
      capacity: {
        applied: true,
        selectedCheck: {
          orderId: routedOrderTwoId,
          outcome: "available",
          availableSlots: 1
        },
        blockedByCapacity: false,
        overflowed: false,
        overflowedFromOrderIds: []
      },
      summary:
        "Resolved Simulator Routed Area; selected Simulator Routed Order Two for Routing Simulator Account with 1 capacity slot available on 2026-05-16."
    });
    expect(first?.capacity.candidateChecks.map((check) => check.outcome)).toEqual([
      "available",
      "available"
    ]);

    const second = packet.rows.find(
      (row) => row.referenceId === "capacity-two"
    );
    expect(second).toMatchObject({
      status: "assigned",
      reason: "routed",
      selectedOrder: {
        orderId: routedOrderOneId,
        rank: 2
      },
      capacity: {
        applied: true,
        selectedCheck: {
          orderId: routedOrderOneId,
          outcome: "available",
          simulatedAssignedOnDate: 0,
          availableSlots: 1
        },
        blockedByCapacity: false,
        overflowed: true,
        overflowedFromOrderIds: [routedOrderTwoId]
      },
      summary:
        "Resolved Simulator Routed Area; selected Simulator Routed Order One for Routing Simulator Account after capacity overflow from 1 higher-ranked order."
    });
    expect(second?.capacity.candidateChecks.map((check) => check.outcome)).toEqual([
      "daily_cap_reached",
      "available"
    ]);
    expect(second?.steps.map((step) => step.step)).toEqual([
      "normalize",
      "extract_prefix",
      "match_area",
      "filter_orders",
      "rank_pace_gap",
      "apply_capacity_windows",
      "select"
    ]);
    expect(second?.steps.at(-2)).toMatchObject({
      step: "apply_capacity_windows",
      result: {
        evaluatedOn: "2026-05-16",
        selectedOrderId: routedOrderOneId,
        blockedByCapacity: false,
        overflowedFromOrderIds: [routedOrderTwoId]
      }
    });

    const third = packet.rows.find(
      (row) => row.referenceId === "capacity-three"
    );
    expect(third).toMatchObject({
      status: "blocked",
      reason: "all_orders_at_quota",
      selectedOrder: null,
      capacity: {
        applied: true,
        selectedCheck: null,
        blockedByCapacity: true,
        overflowed: false,
        overflowedFromOrderIds: []
      },
      summary:
        "All ranked dealer orders are blocked by hypothetical capacity windows for 2026-05-16."
    });
    expect(third?.capacity.candidateChecks.map((check) => check.outcome)).toEqual([
      "daily_cap_reached",
      "daily_cap_reached"
    ]);
    expect(third?.steps.at(-1)).toEqual({
      step: "select",
      result: {
        orderId: null
      }
    });
  });

  it("reports blackout and outside-window capacity checks", async () => {
    const packet = await evaluateRoutingSimulatorBatch(
      {
        leads: [
          {
            referenceId: "capacity-blackout",
            postalCode: "t7t 7t7",
            country: "CA"
          }
        ]
      },
      {
        now,
        capacityWindows: {
          windows: [
            {
              dealerOrderId: routedOrderTwoId,
              label: "Order two blackout",
              startsOn: "2026-05-16",
              endsOn: "2026-05-16",
              dailyCap: 10,
              blackoutDates: ["2026-05-16"]
            },
            {
              dealerOrderId: routedOrderOneId,
              label: "Order one future window",
              startsOn: "2026-05-17",
              endsOn: "2026-05-18",
              dailyCap: 10
            }
          ]
        }
      }
    );

    expect(packet.summary).toMatchObject({
      leadCount: 1,
      assignedCount: 0,
      blockedCount: 1,
      reasonCounts: {
        routed: 0,
        no_area_match: 0,
        no_matching_active_order: 0,
        all_orders_at_quota: 1
      }
    });
    expect(packet.capacitySummary).toMatchObject({
      applied: true,
      evaluatedOn: "2026-05-16",
      windowCount: 2,
      blockedCount: 1,
      overflowCount: 0,
      assignedWithCapacityCount: 0,
      outcomeCounts: {
        not_configured: 0,
        outside_window: 1,
        blackout_date: 1,
        daily_cap_reached: 0,
        available: 0
      }
    });

    const row = packet.rows[0];
    expect(row?.capacity.candidateChecks).toEqual([
      expect.objectContaining({
        orderId: routedOrderTwoId,
        outcome: "blackout_date",
        blackout: true,
        eligible: false,
        dailyCap: 10
      }),
      expect.objectContaining({
        orderId: routedOrderOneId,
        outcome: "outside_window",
        blackout: false,
        eligible: false,
        dailyCap: null
      })
    ]);
    expect(row?.summary).toBe(
      "All ranked dealer orders are blocked by hypothetical capacity windows for 2026-05-16."
    );
  });

  it("does not write CRM records while evaluating hypothetical leads", async () => {
    const before = await currentCounts();

    await evaluateRoutingSimulatorBatch(
      {
        leads: [
          {
            referenceId: "no-write-check",
            postalCode: "T7T 7T7",
            country: "CA"
          }
        ]
      },
      {
        now,
        capacityWindows: {
          windows: [
            {
              dealerOrderId: routedOrderTwoId,
              startsOn: "2026-05-16",
              endsOn: "2026-05-16",
              dailyCap: 1
            }
          ]
        }
      }
    );

    expect(await currentCounts()).toEqual(before);
  });
});

async function createFixtures() {
  await prisma.account.create({
    data: {
      id: accountId,
      name: "Routing Simulator Account",
      status: "active",
      healthScore: 95
    }
  });
  await prisma.area.createMany({
    data: [
      {
        id: routedAreaId,
        name: "Simulator Routed Area",
        postalPrefixes: "T7T"
      },
      {
        id: inactiveAreaId,
        name: "Simulator Inactive Area",
        postalPrefixes: "Y8Y"
      },
      {
        id: quotaAreaId,
        name: "Simulator Quota Area",
        postalPrefixes: "X7X"
      }
    ]
  });
  await prisma.dealerOrder.createMany({
    data: [
      {
        id: routedOrderOneId,
        accountId,
        name: "Simulator Routed Order One",
        monthlyQuota: 4,
        status: "active",
        startDate: new Date("2026-05-01T00:00:00Z")
      },
      {
        id: routedOrderTwoId,
        accountId,
        name: "Simulator Routed Order Two",
        monthlyQuota: 8,
        status: "active",
        startDate: new Date("2026-05-02T00:00:00Z")
      },
      {
        id: pausedOrderId,
        accountId,
        name: "Simulator Paused Order",
        monthlyQuota: 10,
        status: "paused",
        startDate: new Date("2026-05-01T00:00:00Z")
      },
      {
        id: quotaOrderId,
        accountId,
        name: "Simulator Quota Order",
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
      deliveredLead("test-routing-simulator-one-delivered-1", routedOrderOneId),
      deliveredLead("test-routing-simulator-two-delivered-1", routedOrderTwoId),
      deliveredLead("test-routing-simulator-quota-delivered-1", quotaOrderId)
    ]
  });
}

function deliveredLead(id: string, assignedOrderId: string) {
  return {
    id,
    firstName: "Delivered",
    lastName: "Simulator",
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
        startsWith: "test-routing-simulator"
      }
    }
  });
  await prisma.lead.deleteMany({
    where: {
      id: {
        startsWith: "test-routing-simulator"
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
