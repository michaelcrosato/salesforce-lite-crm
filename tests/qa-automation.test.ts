import { describe, expect, it } from "vitest";
import {
  getPacingStatus,
  pacingPercent,
  rankDealerOpsFocus
} from "@/lib/business/dealerOps";
import { buildForecast } from "@/lib/business/forecast";
import { deterministicActivitySummarizer } from "@/lib/ai/activitySummarizer";
import { forecastQuerySchema, leadFormSchema } from "@/lib/validation";

const now = new Date("2026-05-16T12:00:00Z");

describe("demo QA deterministic logic", () => {
  it("calculates forecast projections with clamped scenario inputs and risk labels", () => {
    const forecast = buildForecast({
      now,
      leadVolumeMultiplier: 10,
      assignmentRate: 2,
      orders: [
        {
          id: "order-over",
          name: "Over delivery order",
          monthlyQuota: 20,
          deliveredThisMonth: 10,
          account: {
            id: "account-over",
            name: "Over Dealer"
          },
          areas: [
            {
              id: "area-vancouver",
              name: "Vancouver Metro"
            }
          ]
        }
      ]
    });

    expect(forecast.rows[0]).toMatchObject({
      orderId: "order-over",
      projectedDelivered: 58,
      risk: "over",
      additionalLeadsNeeded: 0
    });
    expect(forecast.summary).toMatchObject({
      projectedLeads: 58,
      ordersLikelyToHitQuota: 0,
      ordersLikelyToMissQuota: 0,
      ordersLikelyToOverDeliver: 1
    });
  });

  it("normalizes lead and forecast form inputs without accepting invalid values", () => {
    const lead = leadFormSchema.parse({
      firstName: "  QA ",
      lastName: " Lead ",
      phone: "",
      email: "",
      postalCode: " V5K 0A1 ",
      province: "",
      source: " dealer_site "
    });

    expect(lead).toMatchObject({
      firstName: "QA",
      lastName: "Lead",
      postalCode: "V5K 0A1",
      source: "dealer_site"
    });
    expect(lead.email).toBeUndefined();
    expect(lead.province).toBeUndefined();
    expect(
      leadFormSchema.safeParse({
        firstName: "QA",
        lastName: "Lead",
        email: "not-an-email"
      }).success
    ).toBe(false);

    expect(
      forecastQuerySchema.parse({
        multiplier: "2.5",
        assignmentRate: "65",
        area: " area-vancouver "
      })
    ).toEqual({
      multiplier: 2.5,
      assignmentRate: 65,
      area: "area-vancouver"
    });
    expect(
      forecastQuerySchema.safeParse({
        multiplier: "0.1",
        assignmentRate: "101"
      }).success
    ).toBe(false);
  });

  it("classifies dealer order pacing and caps progress percentages", () => {
    expect(
      getPacingStatus({ monthlyQuota: 31, deliveredThisMonth: 0 }, now)
    ).toBe("behind");
    expect(
      getPacingStatus({ monthlyQuota: 31, deliveredThisMonth: 16 }, now)
    ).toBe("on_pace");
    expect(
      getPacingStatus({ monthlyQuota: 31, deliveredThisMonth: 20 }, now)
    ).toBe("ahead");
    expect(
      getPacingStatus({ monthlyQuota: 31, deliveredThisMonth: 31 }, now)
    ).toBe("over");
    expect(pacingPercent({ monthlyQuota: 10, deliveredThisMonth: 12 })).toBe(
      100
    );
    expect(pacingPercent({ monthlyQuota: 0, deliveredThisMonth: 12 })).toBe(0);
  });

  it("prioritizes dealer ops focus links using existing route contracts", () => {
    const items = rankDealerOpsFocus({
      now,
      limit: 5,
      orders: [
        {
          id: "order-risk",
          name: "Behind Risk Order",
          monthlyQuota: 40,
          status: "active",
          deliveredThisMonth: 4,
          account: {
            id: "account-risk",
            name: "Risk Dealer",
            healthScore: 42
          }
        }
      ],
      leads: [
        {
          id: "lead-unmatched",
          firstName: "Una",
          lastName: "Matched",
          assignmentReason: "no_area_match",
          createdAt: now
        }
      ],
      deals: [
        {
          id: "deal-risk",
          name: "Dealer expansion",
          value: 140000,
          accountId: "account-risk"
        }
      ]
    });

    expect(items[0]).toMatchObject({
      kind: "account",
      href: "/accounts/account-risk"
    });
    expect(items.map((item) => item.href)).toEqual(
      expect.arrayContaining([
        "/orders/order-risk",
        "/leads/lead-unmatched",
        "/deals?deal=deal-risk"
      ])
    );
  });

  it("summarizes notes deterministically with stable rule precedence", () => {
    const result = deterministicActivitySummarizer.summarize({
      rawText:
        "The champion liked the rollout plan. The finance team asked for pricing. Send proposal next week with budget options."
    });

    expect(result.summary).toBe(
      "The champion liked the rollout plan. The finance team asked for pricing."
    );
    expect(result.nextStep).toBe("Send proposal and confirm review timeline.");
    expect(result.tags).toEqual(
      expect.arrayContaining(["proposal", "pricing", "budget", "next-week"])
    );
  });
});
