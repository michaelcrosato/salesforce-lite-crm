import { beforeEach, describe, expect, it } from "vitest";
import { moveDealAction } from "@/app/deals/actions";
import { deterministicActivitySummarizer } from "@/lib/ai/activitySummarizer";
import {
  calculateWeightedForecast,
  isStaleDeal,
  probabilityForStage
} from "@/lib/business/deals";
import { rankTodaysFocus } from "@/lib/business/dashboard";
import { prisma } from "@/lib/prisma";
import {
  calculatePaceGap,
  normalizePostalCode,
  parsePostalPrefixes,
  rankEligibleOrders,
  resolveAreaForLead,
  routeLead
} from "@/lib/routing/leadRouter";

describe("deal business logic", () => {
  it("calculates weighted forecast for open deals only", () => {
    const forecast = calculateWeightedForecast([
      { stage: "new", value: 100000, probability: 10 },
      { stage: "proposal", value: 80000, probability: 50 },
      { stage: "won", value: 50000, probability: 100 },
      { stage: "lost", value: 30000, probability: 0 }
    ]);

    expect(forecast).toBe(50000);
  });

  it("detects stale open deals using the latest activity date", () => {
    const now = new Date("2026-05-16T12:00:00Z");

    expect(
      isStaleDeal(
        {
          stage: "qualified",
          createdAt: "2026-04-01T12:00:00Z",
          lastActivityAt: "2026-05-01T12:00:00Z"
        },
        now
      )
    ).toBe(true);
    expect(
      isStaleDeal(
        {
          stage: "won",
          createdAt: "2026-04-01T12:00:00Z",
          lastActivityAt: "2026-04-15T12:00:00Z"
        },
        now
      )
    ).toBe(false);
    expect(
      isStaleDeal(
        {
          stage: "proposal",
          createdAt: "not-a-date",
          lastActivityAt: null
        },
        now
      )
    ).toBe(false);
  });

  it("maps stages to default probabilities", () => {
    expect(probabilityForStage("new")).toBe(10);
    expect(probabilityForStage("qualified")).toBe(25);
    expect(probabilityForStage("proposal")).toBe(50);
    expect(probabilityForStage("negotiation")).toBe(75);
    expect(probabilityForStage("won")).toBe(100);
    expect(probabilityForStage("lost")).toBe(0);
  });

  it("does not write an activity when moving a deal to its current stage", async () => {
    const dealId = "test-same-stage-deal";
    await prisma.activity.deleteMany({
      where: {
        dealId
      }
    });
    await prisma.deal.deleteMany({
      where: {
        id: dealId
      }
    });
    await prisma.deal.create({
      data: {
        id: dealId,
        name: "Same stage test deal",
        stage: "qualified",
        value: 10000,
        probability: 25
      }
    });

    const before = await prisma.activity.count({
      where: {
        dealId
      }
    });
    const result = await moveDealAction({
      dealId,
      stage: "qualified"
    });
    const after = await prisma.activity.count({
      where: {
        dealId
      }
    });

    expect(result).toEqual({
      ok: true,
      message: "Deal is already in that stage."
    });
    expect(after).toBe(before);

    await prisma.activity.deleteMany({
      where: {
        dealId
      }
    });
    await prisma.deal.deleteMany({
      where: {
        id: dealId
      }
    });
  });
});

describe("today focus ranking", () => {
  it("ranks high-value stale and late-stage deals ahead of lower-priority work", () => {
    const items = rankTodaysFocus({
      now: new Date("2026-05-16T12:00:00Z"),
      deals: [
        {
          id: "lower",
          name: "Lower value stale proposal",
          stage: "proposal",
          value: 50000,
          probability: 50,
          createdAt: "2026-04-01T12:00:00Z",
          lastActivityAt: "2026-04-20T12:00:00Z",
          accountName: "LowerCo"
        },
        {
          id: "high",
          name: "High value stale negotiation",
          stage: "negotiation",
          value: 200000,
          probability: 75,
          createdAt: "2026-04-01T12:00:00Z",
          lastActivityAt: "2026-04-20T12:00:00Z",
          accountName: "HighCo"
        },
        {
          id: "fresh",
          name: "Fresh new deal",
          stage: "new",
          value: 15000,
          probability: 10,
          createdAt: "2026-05-10T12:00:00Z",
          lastActivityAt: "2026-05-12T12:00:00Z",
          accountName: "FreshCo"
        }
      ],
      accounts: [
        {
          id: "account",
          name: "At-risk Account",
          status: "active",
          healthScore: 45
        }
      ],
      activities: [
        {
          id: "activity",
          title: "Recent note",
          type: "note",
          nextStep: "Follow up Friday.",
          createdAt: "2026-05-15T12:00:00Z",
          contactName: "Buyer",
          contactId: "buyer-1"
        }
      ]
    });

    expect(items[0]?.title).toBe("High value stale negotiation");
    expect(items[1]?.title).toBe("Lower value stale proposal");
    expect(items.find((item) => item.title === "Follow up Friday.")?.href).toBe(
      "/contacts/buyer-1"
    );
    expect(items).toHaveLength(4);
  });

  it("keeps malformed activity dates from poisoning focus scores", () => {
    const items = rankTodaysFocus({
      now: new Date("2026-05-16T12:00:00Z"),
      deals: [],
      accounts: [],
      activities: [
        {
          id: "activity",
          title: "Imported note",
          type: "note",
          nextStep: "Call the buyer.",
          createdAt: "not-a-date",
          contactName: "Buyer",
          contactId: "buyer-1"
        }
      ]
    });

    expect(items).toEqual([
      expect.objectContaining({
        href: "/contacts/buyer-1",
        score: 25,
        title: "Call the buyer."
      })
    ]);
  });
});

describe("activity summarizer", () => {
  it("summarizes meaningful sentences and extracts deterministic next steps", () => {
    const result = deterministicActivitySummarizer.summarize({
      rawText:
        "Customer liked the workflow and wants executive buy-in. Send proposal next week with pricing and timeline details."
    });

    expect(result.summary).toContain("Customer liked the workflow");
    expect(result.nextStep).toBe("Send proposal and confirm review timeline.");
    expect(result.tags).toContain("proposal");
  });

  it("uses the fallback next step when no signal is detected", () => {
    const result = deterministicActivitySummarizer.summarize({
      rawText: "General update from the account team. No blockers were raised."
    });

    expect(result.nextStep).toBe("Review and schedule follow-up.");
  });

  it("handles empty and whitespace-only notes without throwing", () => {
    expect(
      deterministicActivitySummarizer.summarize({ rawText: "" }).nextStep
    ).toBe("Review and schedule follow-up.");
    expect(
      deterministicActivitySummarizer.summarize({ rawText: "   \n\t  " })
        .nextStep
    ).toBe("Review and schedule follow-up.");
  });
});

describe("dealer lead routing helpers", () => {
  it("normalizes postal codes across case, spaces, and partial values", () => {
    expect(normalizePostalCode("v5 k 0a1")).toBe("V5K0A1");
    expect(normalizePostalCode(" T2 ")).toBe("T2");
    expect(normalizePostalCode("m5v-2t6")).toBe("M5V2T6");
  });

  it("parses postal prefixes from empty, single, and comma-separated strings", () => {
    expect(parsePostalPrefixes({ postalPrefixes: "" })).toEqual([]);
    expect(parsePostalPrefixes({ postalPrefixes: "V5" })).toEqual(["V5"]);
    expect(parsePostalPrefixes({ postalPrefixes: "V5, V6, v7" })).toEqual([
      "V5",
      "V6",
      "V7"
    ]);
  });

  it("resolves an area by exact name, postal prefix, or no match", () => {
    const areas = [
      {
        id: "area-a",
        name: "Vancouver Metro",
        postalPrefixes: "V5,V6"
      },
      {
        id: "area-b",
        name: "Calgary Metro",
        postalPrefixes: "T2,T3"
      }
    ];

    expect(resolveAreaForLead({ areaName: "Calgary Metro" }, areas)?.id).toBe(
      "area-b"
    );
    expect(resolveAreaForLead({ postalCode: "v5k 0a1" }, areas)?.id).toBe(
      "area-a"
    );
    expect(resolveAreaForLead({ postalCode: "Z9Z 9Z9" }, areas)).toBeNull();
  });

  it("calculates pace gap for first, middle, last, and completed quota cases", () => {
    expect(
      calculatePaceGap(
        { monthlyQuota: 31 },
        0,
        new Date("2026-05-01T12:00:00Z")
      )
    ).toBe(1);
    expect(
      calculatePaceGap(
        { monthlyQuota: 32 },
        0,
        new Date("2026-05-16T12:00:00Z")
      )
    ).toBe(2);
    expect(
      calculatePaceGap(
        { monthlyQuota: 10 },
        5,
        new Date("2026-05-31T12:00:00Z")
      )
    ).toBe(5);
    expect(
      calculatePaceGap(
        { monthlyQuota: 10 },
        12,
        new Date("2026-05-31T12:00:00Z")
      )
    ).toBe(0);
  });

  it("ranks eligible orders by pace gap, lower delivered count, then older start date", () => {
    const now = new Date("2026-05-16T12:00:00Z");
    const orders = [
      {
        id: "less-behind",
        monthlyQuota: 10,
        status: "active",
        startDate: new Date("2026-05-01T12:00:00Z"),
        deliveredThisMonth: 8
      },
      {
        id: "most-behind",
        monthlyQuota: 20,
        status: "active",
        startDate: new Date("2026-05-03T12:00:00Z"),
        deliveredThisMonth: 4
      },
      {
        id: "paused",
        monthlyQuota: 50,
        status: "paused",
        startDate: new Date("2026-04-01T12:00:00Z"),
        deliveredThisMonth: 0
      },
      {
        id: "tie-older",
        monthlyQuota: 20,
        status: "active",
        startDate: new Date("2026-04-01T12:00:00Z"),
        deliveredThisMonth: 4
      }
    ];

    expect(rankEligibleOrders(orders, now).map((order) => order.id)).toEqual([
      "tie-older",
      "most-behind",
      "less-behind"
    ]);
  });
});

describe("dealer lead routing transactions", () => {
  beforeEach(async () => {
    await cleanupRoutingFixtures();
    await prisma.account.create({
      data: {
        id: "test-route-account",
        name: "Routing Test Dealer",
        status: "active",
        healthScore: 80
      }
    });
  });

  it("writes no_area_match when no area matches the lead", async () => {
    await prisma.lead.create({
      data: {
        id: "test-route-lead-no-area",
        firstName: "No",
        lastName: "Area",
        postalCode: "Z9Z 9Z9",
        status: "new"
      }
    });

    const result = await routeLead(
      "test-route-lead-no-area",
      new Date("2026-05-16T12:00:00Z")
    );
    const lead = await prisma.lead.findUniqueOrThrow({
      where: {
        id: "test-route-lead-no-area"
      }
    });

    expect(result.reason).toBe("no_area_match");
    expect(result.order).toBeNull();
    expect(lead.assignmentReason).toBe("no_area_match");
    await expectRoutingEvent("test-route-lead-no-area");
  });

  it("writes no_matching_active_order when the resolved area has no active order", async () => {
    await createRouteArea("test-route-area-london", "London Test", "X1");
    await prisma.dealerOrder.create({
      data: {
        id: "test-route-order-paused",
        accountId: "test-route-account",
        name: "Paused test order",
        monthlyQuota: 5,
        status: "paused",
        startDate: new Date("2026-05-01T12:00:00Z"),
        areas: {
          create: {
            areaId: "test-route-area-london"
          }
        }
      }
    });
    await prisma.lead.create({
      data: {
        id: "test-route-lead-no-active",
        firstName: "No",
        lastName: "Active",
        postalCode: "X1Y 1A1",
        status: "new"
      }
    });

    const result = await routeLead(
      "test-route-lead-no-active",
      new Date("2026-05-16T12:00:00Z")
    );
    const lead = await prisma.lead.findUniqueOrThrow({
      where: {
        id: "test-route-lead-no-active"
      }
    });

    expect(result.reason).toBe("no_matching_active_order");
    expect(lead.areaId).toBe("test-route-area-london");
    await expectRoutingEvent("test-route-lead-no-active");
  });

  it("writes all_orders_at_quota when every matching active order is full", async () => {
    await createRouteArea("test-route-area-full", "Full Test", "Q9");
    await createActiveRouteOrder(
      "test-route-order-full",
      "test-route-area-full",
      1
    );
    await prisma.lead.createMany({
      data: [
        {
          id: "test-route-lead-existing",
          firstName: "Existing",
          lastName: "Delivered",
          postalCode: "Q9W 1A1",
          status: "assigned",
          areaId: "test-route-area-full",
          assignedOrderId: "test-route-order-full",
          assignmentReason: "routed",
          createdAt: new Date("2026-05-02T12:00:00Z")
        },
        {
          id: "test-route-lead-at-quota",
          firstName: "At",
          lastName: "Quota",
          postalCode: "Q9W 1A1",
          status: "new"
        }
      ]
    });

    const result = await routeLead(
      "test-route-lead-at-quota",
      new Date("2026-05-16T12:00:00Z")
    );
    const lead = await prisma.lead.findUniqueOrThrow({
      where: {
        id: "test-route-lead-at-quota"
      }
    });

    expect(result.reason).toBe("all_orders_at_quota");
    expect(lead.areaId).toBe("test-route-area-full");
    expect(lead.assignedOrderId).toBeNull();
    await expectRoutingEvent("test-route-lead-at-quota");
  });

  it("routes to the matching active order most behind pace", async () => {
    await createRouteArea("test-route-area-van", "Vancouver Test", "Y1");
    await createActiveRouteOrder(
      "test-route-order-a",
      "test-route-area-van",
      10
    );
    await createActiveRouteOrder(
      "test-route-order-b",
      "test-route-area-van",
      10
    );
    await prisma.lead.create({
      data: {
        id: "test-route-lead-delivered",
        firstName: "Delivered",
        lastName: "Lead",
        postalCode: "Y1K 0A1",
        status: "assigned",
        areaId: "test-route-area-van",
        assignedOrderId: "test-route-order-a",
        assignmentReason: "routed",
        createdAt: new Date("2026-05-03T12:00:00Z")
      }
    });
    await prisma.lead.create({
      data: {
        id: "test-route-lead-routed",
        firstName: "Route",
        lastName: "Winner",
        postalCode: "Y1K 0A1",
        status: "new"
      }
    });

    const result = await routeLead(
      "test-route-lead-routed",
      new Date("2026-05-16T12:00:00Z")
    );
    const lead = await prisma.lead.findUniqueOrThrow({
      where: {
        id: "test-route-lead-routed"
      }
    });

    expect(result.reason).toBe("routed");
    expect(lead.status).toBe("assigned");
    expect(lead.assignedOrderId).toBe("test-route-order-b");
    expect(lead.assignmentReason).toBe("routed");
    await expectRoutingEvent("test-route-lead-routed");
  });
});

async function createRouteArea(
  id: string,
  name: string,
  postalPrefixes: string
) {
  await prisma.area.create({
    data: {
      id,
      name,
      postalPrefixes
    }
  });
}

async function createActiveRouteOrder(
  id: string,
  areaId: string,
  monthlyQuota: number
) {
  await prisma.dealerOrder.create({
    data: {
      id,
      accountId: "test-route-account",
      name: `${id} order`,
      monthlyQuota,
      status: "active",
      startDate: new Date("2026-05-01T12:00:00Z"),
      areas: {
        create: {
          areaId
        }
      }
    }
  });
}

async function expectRoutingEvent(leadId: string) {
  const count = await prisma.activity.count({
    where: {
      leadId,
      type: "routing_event"
    }
  });

  expect(count).toBe(1);
}

async function cleanupRoutingFixtures() {
  await prisma.activity.deleteMany({
    where: {
      OR: [
        {
          leadId: {
            startsWith: "test-route-lead"
          }
        },
        {
          accountId: "test-route-account"
        }
      ]
    }
  });
  await prisma.lead.deleteMany({
    where: {
      id: {
        startsWith: "test-route-lead"
      }
    }
  });
  await prisma.dealerOrderArea.deleteMany({
    where: {
      OR: [
        {
          dealerOrderId: {
            startsWith: "test-route-order"
          }
        },
        {
          areaId: {
            startsWith: "test-route-area"
          }
        }
      ]
    }
  });
  await prisma.dealerOrder.deleteMany({
    where: {
      id: {
        startsWith: "test-route-order"
      }
    }
  });
  await prisma.area.deleteMany({
    where: {
      id: {
        startsWith: "test-route-area"
      }
    }
  });
  await prisma.account.deleteMany({
    where: {
      id: "test-route-account"
    }
  });
}
