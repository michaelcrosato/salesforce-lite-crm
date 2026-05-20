import { describe, expect, it } from "vitest";
import { buildAnalystPanel } from "@/lib/business/analyst";
import {
  buildForecast,
  calculateDefaultAssignmentRate
} from "@/lib/business/forecast";

const now = new Date("2026-05-16T12:00:00Z");

const forecastOrders = [
  {
    id: "order-vancouver",
    name: "Vancouver Order",
    monthlyQuota: 20,
    deliveredThisMonth: 10,
    account: {
      id: "account-vancouver",
      name: "Vancouver Dealer"
    },
    areas: [
      {
        id: "area-vancouver",
        name: "Vancouver"
      }
    ]
  },
  {
    id: "order-calgary",
    name: "Calgary Order",
    monthlyQuota: 30,
    deliveredThisMonth: 6,
    account: {
      id: "account-calgary",
      name: "Calgary Dealer"
    },
    areas: [
      {
        id: "area-calgary",
        name: "Calgary"
      }
    ]
  }
];

describe("forecast simulator math", () => {
  it("changes projections when the lead volume multiplier changes", () => {
    const base = buildForecast({
      orders: forecastOrders,
      leadVolumeMultiplier: 1,
      assignmentRate: 0.75,
      now
    });
    const higher = buildForecast({
      orders: forecastOrders,
      leadVolumeMultiplier: 2,
      assignmentRate: 0.75,
      now
    });

    expect(higher.summary.projectedLeads).toBeGreaterThan(
      base.summary.projectedLeads
    );
  });

  it("changes projections when assignment rate changes", () => {
    const lowRate = buildForecast({
      orders: forecastOrders,
      leadVolumeMultiplier: 1,
      assignmentRate: 0.5,
      now
    });
    const highRate = buildForecast({
      orders: forecastOrders,
      leadVolumeMultiplier: 1,
      assignmentRate: 1,
      now
    });

    expect(highRate.summary.projectedLeads).toBeGreaterThan(
      lowRate.summary.projectedLeads
    );
  });

  it("limits forecast rows by area filter", () => {
    const forecast = buildForecast({
      orders: forecastOrders,
      leadVolumeMultiplier: 1,
      assignmentRate: 1,
      areaId: "area-vancouver",
      now
    });

    expect(forecast.rows).toHaveLength(1);
    expect(forecast.rows[0]?.orderId).toBe("order-vancouver");
  });

  it("calculates additional leads needed when projected delivery misses quota", () => {
    const forecast = buildForecast({
      orders: forecastOrders,
      leadVolumeMultiplier: 0.5,
      assignmentRate: 0.5,
      areaId: "area-calgary",
      now
    });

    expect(forecast.rows[0]?.risk).toBe("miss");
    expect(forecast.rows[0]?.additionalLeadsNeeded).toBeGreaterThan(0);
  });

  it("calculates a default assignment rate from current routed lead data", () => {
    expect(
      calculateDefaultAssignmentRate({ totalLeads: 100, routedLeads: 80 })
    ).toBe(0.8);
    expect(
      calculateDefaultAssignmentRate({ totalLeads: 0, routedLeads: 0 })
    ).toBe(0.75);
  });

  it("falls back to safe defaults for non-finite scenario inputs", () => {
    const forecast = buildForecast({
      orders: [forecastOrders[0]],
      leadVolumeMultiplier: Number.NaN,
      assignmentRate: Number.POSITIVE_INFINITY,
      now
    });

    expect(forecast.rows[0]?.projectedDelivered).toBe(15);
    expect(forecast.summary.projectedLeads).toBe(15);
    expect(
      calculateDefaultAssignmentRate({
        totalLeads: Number.NaN,
        routedLeads: 10
      })
    ).toBe(0.75);
  });

  it("keeps malformed order quantities from producing NaN projections", () => {
    const forecast = buildForecast({
      orders: [
        {
          ...forecastOrders[0],
          deliveredThisMonth: Number.NaN,
          monthlyQuota: Number.POSITIVE_INFINITY
        }
      ],
      leadVolumeMultiplier: 1,
      assignmentRate: 1,
      now
    });

    expect(forecast.rows[0]).toMatchObject({
      additionalLeadsNeeded: 0,
      currentDelivered: 0,
      monthlyQuota: 0,
      projectedDelivered: 0
    });
    expect(forecast.summary.projectedLeads).toBe(0);
  });
});

describe("deterministic analyst ranking", () => {
  it("ranks behind-pace orders above lower-risk items", () => {
    const panel = buildAnalystPanel({
      now,
      orders: [
        {
          id: "behind",
          name: "Behind Dealer Order",
          status: "active",
          monthlyQuota: 40,
          deliveredThisMonth: 2,
          account: {
            id: "account-behind",
            name: "Behind Dealer",
            healthScore: 80
          }
        },
        {
          id: "on-pace",
          name: "On Pace Dealer Order",
          status: "active",
          monthlyQuota: 10,
          deliveredThisMonth: 6,
          account: {
            id: "account-on-pace",
            name: "On Pace Dealer",
            healthScore: 80
          }
        }
      ],
      leads: [],
      deals: []
    });

    expect(panel.actions[0]?.href).toBe("/orders/behind");
  });

  it("includes unrouted leads with assignment reason", () => {
    const panel = buildAnalystPanel({
      now,
      orders: [],
      leads: [
        {
          id: "lead-1",
          firstName: "Una",
          lastName: "Routed",
          assignmentReason: "no_area_match"
        }
      ],
      deals: []
    });

    expect(panel.unroutedLeads[0]).toMatchObject({
      href: "/leads/lead-1",
      assignmentReason: "no_area_match"
    });
  });

  it("caps top actions at five", () => {
    const panel = buildAnalystPanel({
      now,
      actionLimit: 5,
      orders: Array.from({ length: 7 }).map((_, index) => ({
        id: `order-${index}`,
        name: `Order ${index}`,
        status: "active",
        monthlyQuota: 50,
        deliveredThisMonth: index,
        account: {
          id: `account-${index}`,
          name: `Dealer ${index}`,
          healthScore: 80
        }
      })),
      leads: [],
      deals: []
    });

    expect(panel.actions).toHaveLength(5);
  });

  it("uses existing routes for analyst links, including deal drawer URLs", () => {
    const panel = buildAnalystPanel({
      now,
      orders: [],
      leads: [],
      deals: [
        {
          id: "deal-1",
          name: "Stale Deal",
          stage: "proposal",
          value: 120000,
          createdAt: "2026-04-01T12:00:00Z",
          lastActivityAt: "2026-04-20T12:00:00Z",
          accountId: "account-1",
          accountName: "Account One"
        }
      ]
    });

    expect(panel.staleHighValueDeals[0]?.href).toBe("/deals?deal=deal-1");
    expect(panel.actions[0]?.href).toBe("/deals?deal=deal-1");
  });
});
