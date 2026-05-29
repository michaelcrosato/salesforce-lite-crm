import { describe, expect, it } from "vitest";
import {
  deterministicActivitySummarizer,
  validateActivitySummaryResult
} from "@/lib/ai/activitySummarizer";
import {
  buildAnalystPanel,
  validateAnalystPanel
} from "@/lib/business/analyst";
import {
  buildCaseKnowledgeSuggestionPacket,
  validateCaseKnowledgeSuggestionPacket
} from "@/lib/services/caseKnowledgeSuggestions";

const now = new Date("2026-05-20T12:00:00.000Z");

describe("deterministic AI output contracts", () => {
  it("validates activity summary outputs and reports invalid shapes", () => {
    const summary = deterministicActivitySummarizer.summarize({
      rawText:
        "Customer wants pricing by Friday. Send proposal after buyer review."
    });
    const valid = validateActivitySummaryResult(summary);

    expect(valid).toMatchObject({
      ok: true,
      issues: []
    });
    if (!valid.ok) {
      throw new Error("Expected activity summary validation to pass.");
    }
    expect(valid.data.nextStep).toBe(
      "Send proposal and confirm review timeline."
    );

    const invalid = validateActivitySummaryResult({
      summary: "Missing next step.",
      tags: ["proposal"]
    });

    expect(invalid).toMatchObject({
      ok: false,
      data: null
    });
    expect(invalid.issues).toContain(
      "nextStep: Invalid input: expected string, received undefined"
    );
  });

  it("validates analyst panel outputs and reports nested invalid actions", () => {
    const panel = buildAnalystPanel({
      now,
      orders: [
        {
          id: "behind-order",
          name: "Behind Dealer Order",
          status: "active",
          monthlyQuota: 50,
          deliveredThisMonth: 2,
          account: {
            id: "account-1",
            name: "Northstar Freight",
            healthScore: 55
          }
        }
      ],
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
    const valid = validateAnalystPanel(panel);

    expect(valid).toMatchObject({
      ok: true,
      issues: []
    });
    if (!valid.ok) {
      throw new Error("Expected analyst panel validation to pass.");
    }
    expect(valid.data.actions.length).toBeGreaterThan(0);

    const invalid = validateAnalystPanel({
      behindOrders: [],
      unroutedLeads: [],
      staleHighValueDeals: [],
      lowHealthAccounts: [],
      actions: [
        {
          id: "action-1",
          href: "/dashboard"
        }
      ]
    });

    expect(invalid).toMatchObject({
      ok: false,
      data: null
    });
    expect(invalid.issues).toContain(
      "actions.0.title: Invalid input: expected string, received undefined"
    );
  });

  it("validates case knowledge packets and rejects external sources", () => {
    const packet = buildCaseKnowledgeSuggestionPacket(
      {
        id: "case-1",
        subject: "Urgent billing reset",
        description:
          "Customer reports an urgent billing reset issue with invoice history.",
        priority: "urgent",
        status: "new",
        queueKey: "billing_support"
      },
      [
        {
          id: "article-1",
          title: "Resolve billing reset tickets",
          summary: "Checklist for billing reset and invoice questions.",
          body: "Confirm invoice number.",
          status: "published",
          audience: "internal",
          category: "Billing",
          keywords: "billing,invoice,reset",
          caseQueueKey: "billing_support",
          publishedAt: new Date("2026-05-01T00:00:00.000Z"),
          updatedAt: new Date("2026-05-01T00:00:00.000Z")
        }
      ],
      {
        limit: 1
      }
    );
    const valid = validateCaseKnowledgeSuggestionPacket(packet);

    expect(valid).toMatchObject({
      ok: true,
      issues: []
    });
    if (!valid.ok) {
      throw new Error("Expected case knowledge validation to pass.");
    }
    expect(valid.data.source).toBe("local_case_article_metadata");

    const invalid = validateCaseKnowledgeSuggestionPacket({
      ...packet,
      source: "external_provider"
    });

    expect(invalid).toMatchObject({
      ok: false,
      data: null
    });
    expect(invalid.issues).toContain(
      'source: Invalid input: expected "local_case_article_metadata"'
    );
  });
});
