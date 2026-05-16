import { describe, expect, it } from "vitest";
import { deterministicActivitySummarizer } from "@/lib/ai/activitySummarizer";
import {
  calculateWeightedForecast,
  isStaleDeal,
  probabilityForStage
} from "@/lib/business/deals";
import { rankTodaysFocus } from "@/lib/business/dashboard";

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
});

describe("today focus ranking", () => {
  it("ranks high-value stale and late-stage deals ahead of lower-priority work", () => {
    const items = rankTodaysFocus({
      now: new Date("2026-05-16T12:00:00Z"),
      deals: [
        {
          id: "low",
          name: "Low value new deal",
          stage: "new",
          value: 10000,
          probability: 10,
          createdAt: "2026-05-10T12:00:00Z",
          lastActivityAt: "2026-05-12T12:00:00Z",
          accountName: "LowCo"
        },
        {
          id: "high",
          name: "High value stale proposal",
          stage: "proposal",
          value: 200000,
          probability: 50,
          createdAt: "2026-04-01T12:00:00Z",
          lastActivityAt: "2026-04-20T12:00:00Z",
          accountName: "HighCo"
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
          contactName: "Buyer"
        }
      ]
    });

    expect(items[0]?.title).toBe("High value stale proposal");
    expect(items).toHaveLength(3);
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
});
