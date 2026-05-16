import { describe, expect, it } from "vitest";
import { moveDealAction } from "@/app/deals/actions";
import { deterministicActivitySummarizer } from "@/lib/ai/activitySummarizer";
import {
  calculateWeightedForecast,
  isStaleDeal,
  probabilityForStage
} from "@/lib/business/deals";
import { rankTodaysFocus } from "@/lib/business/dashboard";
import { prisma } from "@/lib/prisma";

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
    expect(deterministicActivitySummarizer.summarize({ rawText: "" }).nextStep).toBe(
      "Review and schedule follow-up."
    );
    expect(
      deterministicActivitySummarizer.summarize({ rawText: "   \n\t  " }).nextStep
    ).toBe("Review and schedule follow-up.");
  });
});
