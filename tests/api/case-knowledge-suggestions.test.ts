import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  getCaseKnowledgeSuggestionPacket,
  buildCaseKnowledgeSuggestionPacket
} from "@/lib/services/caseKnowledgeSuggestions";

const billingCaseId = "test-case-knowledge-billing";
const urgentCaseId = "test-case-knowledge-urgent";
const noMatchCaseId = "test-case-knowledge-no-match";
const billingArticleId = "knowledge-test-billing-primary";
const billingKeywordArticleId = "knowledge-test-billing-keyword";
const urgentArticleId = "knowledge-test-urgent-primary";
const draftArticleId = "knowledge-test-draft-billing";
const archivedArticleId = "knowledge-test-archived-billing";
const unrelatedArticleId = "knowledge-test-unrelated";

describe("case knowledge suggestions", () => {
  beforeEach(async () => {
    await cleanupCaseKnowledgeFixtures();
  });

  afterEach(async () => {
    await cleanupCaseKnowledgeFixtures();
  });

  it("ranks published article suggestions by queue and keyword relevance", async () => {
    await seedCases();
    await seedArticles();

    const beforeCounts = await countCaseKnowledgeData();
    const packet = await getCaseKnowledgeSuggestionPacket(billingCaseId, {
      limit: 2
    });

    expect(packet).not.toBeNull();
    expect(packet?.caseId).toBe(billingCaseId);
    expect(packet?.caseQueueKey).toBe("general_support");
    expect(packet?.source).toBe("local_case_article_metadata");
    expect(packet?.limit).toBe(2);
    expect(packet?.totalAvailable).toBeGreaterThanOrEqual(2);
    expect(packet?.emptyReason).toBeNull();
    expect(packet?.suggestions.map((suggestion) => suggestion.articleId)).toEqual(
      [billingArticleId, billingKeywordArticleId]
    );
    expect(packet?.suggestions[0]).toMatchObject({
      rank: 1,
      score: 105,
      reasonCodes: ["queue_match", "keyword_match", "metadata_text_match"],
      matchedKeywords: ["pluto", "orbit", "reset", "marker"],
      matchedTerms: ["general", "mismatch", "orbit", "pluto", "reset"]
    });
    expect(
      packet?.suggestions.some(
        (suggestion) =>
          suggestion.articleId === draftArticleId ||
          suggestion.articleId === archivedArticleId
      )
    ).toBe(false);
    expect(await countCaseKnowledgeData()).toEqual(beforeCounts);
  });

  it("adds urgent priority metadata without mutating records", async () => {
    await seedCases();
    await seedArticles();

    const packet = await getCaseKnowledgeSuggestionPacket(urgentCaseId);

    expect(packet?.suggestions[0]).toMatchObject({
      articleId: urgentArticleId,
      rank: 1,
      reasonCodes: [
        "queue_match",
        "keyword_match",
        "metadata_text_match",
        "urgent_priority_match"
      ]
    });
    expect(packet?.suggestions[0]?.score).toBeGreaterThan(100);
  });

  it("returns empty packets for cases without relevant published articles", async () => {
    await seedCases();
    await prisma.knowledgeArticle.create({
      data: {
        id: unrelatedArticleId,
        title: "Knowledge test unrelated routing note",
        body: "Review dealer routing context.",
        status: "published",
        audience: "internal",
        category: "Dealer Operations",
        keywords: "dealer,routing,lead",
        caseQueueKey: "dealer_operations",
        publishedAt: new Date("2026-05-10T00:00:00.000Z")
      }
    });

    const packet = await getCaseKnowledgeSuggestionPacket(noMatchCaseId);
    const missingPacket = await getCaseKnowledgeSuggestionPacket(
      "missing-case-knowledge"
    );

    expect(packet).toMatchObject({
      caseId: noMatchCaseId,
      totalAvailable: 0,
      emptyReason: "no_relevant_articles",
      suggestions: []
    });
    expect(missingPacket).toBeNull();
  });

  it("validates suggestion options and pure scoring inputs", async () => {
    await seedCases();
    await seedArticles();

    await expect(
      getCaseKnowledgeSuggestionPacket(billingCaseId, {
        limit: 0
      })
    ).rejects.toThrow();
    await expect(
      getCaseKnowledgeSuggestionPacket(billingCaseId, {
        limit: 1,
        unknown: true
      })
    ).rejects.toThrow();

    const packet = buildCaseKnowledgeSuggestionPacket(
      {
        id: "pure-case",
        subject: "Invoice credit issue",
        description: "Payment credit does not match billing terms.",
        priority: "normal",
        status: "new",
        queueKey: "billing_support"
      },
      [
        {
          id: billingArticleId,
          title: "Resolve billing discrepancy tickets",
          summary: "Checklist for invoice mismatch and payment questions.",
          body: "Confirm invoice number.",
          status: "published",
          audience: "internal",
          category: "Billing",
          keywords: "billing,invoice,credit,payment",
          caseQueueKey: "billing_support",
          publishedAt: new Date("2026-05-01T00:00:00.000Z"),
          updatedAt: new Date("2026-05-01T00:00:00.000Z")
        }
      ],
      {
        limit: 1
      }
    );

    expect(packet.suggestions).toHaveLength(1);
    expect(packet.suggestions[0]?.articleId).toBe(billingArticleId);
  });
});

async function seedCases() {
  await prisma.case.createMany({
    data: [
      {
        id: billingCaseId,
        subject: "Pluto reset orbit mismatch",
        description:
          "Customer says the orbit marker does not reset in the local workflow.",
        status: "new",
        priority: "normal",
        queueKey: "general_support",
        queueReason: "default_general_support"
      },
      {
        id: urgentCaseId,
        subject: "Urgent outage blocking customer workflow",
        description:
          "Customer impact is high and the account needs escalation.",
        status: "in_progress",
        priority: "urgent",
        queueKey: "critical_support",
        queueReason: "urgent_priority"
      },
      {
        id: noMatchCaseId,
        subject: "Password reset loop",
        description: "Reset email works but the session loops after login.",
        status: "new",
        priority: "normal",
        queueKey: "general_support",
        queueReason: "default_general_support"
      }
    ]
  });
}

async function seedArticles() {
  await prisma.knowledgeArticle.createMany({
    data: [
      {
        id: billingArticleId,
        title: "Resolve pluto reset tickets",
        summary: "Checklist for orbit mismatch and reset questions.",
        body:
          "Confirm the local workflow, compare the marker state, and review reset steps.",
        status: "published",
        audience: "internal",
        category: "General Support",
        keywords: "pluto,orbit,reset,marker",
        caseQueueKey: "general_support",
        publishedAt: new Date("2026-05-01T00:00:00.000Z")
      },
      {
        id: billingKeywordArticleId,
        title: "Explain orbit marker history",
        summary: "Marker audit note for local reset questions.",
        body: "Review the marker timeline and recent reset context.",
        status: "published",
        audience: "internal",
        category: "Customer Success",
        keywords: "orbit,marker",
        caseQueueKey: "customer_success",
        publishedAt: new Date("2026-05-15T00:00:00.000Z")
      },
      {
        id: urgentArticleId,
        title: "Triage urgent service outages",
        summary: "Escalation workflow for urgent customer impact cases.",
        body: "Confirm affected account and update the customer cadence.",
        status: "published",
        audience: "internal",
        category: "Critical Support",
        keywords: "urgent,outage,escalation,customer impact",
        caseQueueKey: "critical_support",
        publishedAt: new Date("2026-05-20T00:00:00.000Z")
      },
      {
        id: draftArticleId,
        title: "Draft billing article",
        body: "Draft article should not be suggested.",
        status: "draft",
        audience: "internal",
        category: "General Support",
        keywords: "pluto,orbit",
        caseQueueKey: "general_support"
      },
      {
        id: archivedArticleId,
        title: "Archived billing article",
        body: "Archived article should not be suggested.",
        status: "archived",
        audience: "internal",
        category: "General Support",
        keywords: "pluto,orbit",
        caseQueueKey: "general_support",
        publishedAt: new Date("2025-01-01T00:00:00.000Z")
      }
    ]
  });
}

async function countCaseKnowledgeData() {
  const [caseCount, articleCount, auditCount] = await Promise.all([
    prisma.case.count(),
    prisma.knowledgeArticle.count(),
    prisma.auditEvent.count()
  ]);

  return {
    caseCount,
    articleCount,
    auditCount
  };
}

async function cleanupCaseKnowledgeFixtures() {
  await prisma.case.deleteMany({
    where: {
      id: {
        startsWith: "test-case-knowledge"
      }
    }
  });
  await prisma.knowledgeArticle.deleteMany({
    where: {
      id: {
        startsWith: "knowledge-test-"
      }
    }
  });
}
