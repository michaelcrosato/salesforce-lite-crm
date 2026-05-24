import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  archiveKnowledgeArticle as archiveKnowledgeArticleViaClient,
  publishKnowledgeArticle as publishKnowledgeArticleViaClient
} from "@/lib/crm/crmClient";
import { prisma } from "@/lib/prisma";
import {
  createKnowledgeArticle,
  getKnowledgeArticle,
  listKnowledgeArticles,
  updateKnowledgeArticle
} from "@/lib/services/knowledgeArticles";

const ownerId = "test-knowledge-owner";

describe("knowledge article service", () => {
  beforeEach(async () => {
    await cleanupKnowledgeArticles();
    await prisma.user.create({
      data: {
        id: ownerId,
        name: "Knowledge Owner",
        email: "knowledge.owner@example.test"
      }
    });
  });

  afterEach(async () => {
    await cleanupKnowledgeArticles();
  });

  it("creates a knowledge article with defaults and audit evidence", async () => {
    const article = await createKnowledgeArticle({
      title: "Knowledge service create",
      body: "Use this local support note to resolve the customer case.",
      caseQueueKey: "customer_success",
      ownerId
    });

    expect(article.status).toBe("draft");
    expect(article.audience).toBe("internal");
    expect(article.keywords).toBe("");
    expect(article.caseQueueKey).toBe("customer_success");

    const audit = await prisma.auditEvent.findFirstOrThrow({
      where: {
        action: "created",
        entityId: article.id,
        entityType: "knowledge_article"
      }
    });
    expect(audit.category).toBe("record");
    expect(audit.summary).toBe(
      "Knowledge article created: Knowledge service create."
    );
    expect(auditMetadata(audit)).toMatchObject({
      audience: "internal",
      caseQueueKey: "customer_success",
      ownerId,
      status: "draft",
      title: "Knowledge service create"
    });
  });

  it("lists articles with deterministic filters and search", async () => {
    const matching = await createKnowledgeArticle({
      title: "Knowledge service invoice",
      summary: "Invoice mismatch checklist",
      body: "Review invoice, credit, and billing owner context.",
      status: "published",
      audience: "internal",
      category: "Billing",
      keywords: "invoice,billing,credit",
      caseQueueKey: "billing_support",
      ownerId
    });
    await createKnowledgeArticle({
      title: "Knowledge service routing",
      body: "Review dealer lead routing context.",
      status: "published",
      audience: "internal",
      category: "Dealer Operations",
      keywords: "routing,dealer",
      caseQueueKey: "dealer_operations",
      ownerId
    });
    await createKnowledgeArticle({
      title: "Knowledge service archived invoice",
      body: "Old invoice workflow.",
      status: "archived",
      audience: "internal",
      category: "Billing",
      keywords: "invoice",
      caseQueueKey: "billing_support",
      ownerId
    });

    const articles = await listKnowledgeArticles({
      sortBy: "title",
      filters: {
        status: "published",
        caseQueueKey: "billing_support",
        ownerId,
        search: "invoice"
      }
    });

    expect(articles.map((article) => article.id)).toEqual([matching.id]);
  });

  it("gets, updates, publishes, and archives through service helpers", async () => {
    const article = await createKnowledgeArticle({
      title: "Knowledge service lifecycle",
      body: "Draft knowledge content for a support workflow.",
      ownerId
    });

    const updated = await updateKnowledgeArticle(article.id, {
      title: "Knowledge service lifecycle updated",
      category: "General Support",
      keywords: "support,lifecycle"
    });
    expect(updated.title).toBe("Knowledge service lifecycle updated");
    expect(updated.category).toBe("General Support");

    const publishedAt = new Date("2026-05-24T12:00:00.000Z");
    const published = await publishKnowledgeArticleViaClient(
      article.id,
      publishedAt
    );
    expect(published.status).toBe("published");
    expect(published.publishedAt?.toISOString()).toBe(
      "2026-05-24T12:00:00.000Z"
    );

    const archived = await archiveKnowledgeArticleViaClient(article.id);
    expect(archived.status).toBe("archived");
    expect(archived.publishedAt?.toISOString()).toBe(
      "2026-05-24T12:00:00.000Z"
    );

    const fetched = await getKnowledgeArticle(article.id);
    expect(fetched?.status).toBe("archived");

    const statusAudit = await prisma.auditEvent.findFirstOrThrow({
      where: {
        action: "status_changed",
        entityId: article.id,
        entityType: "knowledge_article",
        summary: {
          contains: "published to archived"
        }
      }
    });
    expect(auditMetadata(statusAudit)).toMatchObject({
      changedFields: ["status"],
      previousStatus: "published",
      status: "archived"
    });
  });

  it("rejects invalid create, update, and list inputs", async () => {
    await expect(
      createKnowledgeArticle({
        title: "",
        body: "Invalid article"
      })
    ).rejects.toThrow();
    await expect(
      updateKnowledgeArticle("missing-article", {
        audience: "external"
      })
    ).rejects.toThrow();
    await expect(
      listKnowledgeArticles({
        filters: {
          status: "retired"
        }
      })
    ).rejects.toThrow();
  });
});

async function cleanupKnowledgeArticles() {
  await prisma.auditEvent.deleteMany({
    where: {
      OR: [
        {
          entityType: "knowledge_article"
        },
        {
          metadata: {
            contains: "Knowledge service"
          }
        }
      ]
    }
  });
  await prisma.knowledgeArticle.deleteMany({
    where: {
      OR: [
        {
          title: {
            startsWith: "Knowledge service"
          }
        },
        {
          ownerId
        }
      ]
    }
  });
  await prisma.user.deleteMany({
    where: {
      id: ownerId
    }
  });
}

function auditMetadata(event: {
  metadata: string | null;
}): Record<string, unknown> {
  return JSON.parse(event.metadata ?? "{}") as Record<string, unknown>;
}
