import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  archiveKnowledgeArticleAction,
  createKnowledgeArticleAction,
  publishKnowledgeArticleAction,
  updateKnowledgeArticleAction
} from "@/app/knowledge/actions";
import { prisma } from "@/lib/prisma";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn()
}));

const ownerId = "test-knowledge-action-owner";
const articleTitle = "Knowledge action lifecycle";
const updatedArticleTitle = "Knowledge action lifecycle updated";

describe("Knowledge article actions", () => {
  beforeEach(async () => {
    await cleanup();
    await prisma.user.create({
      data: {
        id: ownerId,
        name: "Knowledge Action Owner",
        email: "knowledge.action.owner@example.test"
      }
    });
  });

  afterEach(async () => {
    await cleanup();
  });

  it("creates a knowledge article and records audit evidence", async () => {
    const result = await createKnowledgeArticleAction(
      formData({
        title: articleTitle,
        summary: "Lifecycle action summary",
        body: "Lifecycle action body for local service knowledge.",
        status: "draft",
        audience: "internal",
        category: "General Support",
        keywords: "knowledge,action",
        caseQueueKey: "general_support",
        ownerId
      })
    );

    expect(result.ok).toBe(true);
    expect(result.message).toBe("Article created.");

    const created = await prisma.knowledgeArticle.findFirstOrThrow({
      where: { title: articleTitle }
    });
    expect(created.status).toBe("draft");
    expect(created.ownerId).toBe(ownerId);

    const audit = await prisma.auditEvent.findFirstOrThrow({
      where: {
        action: "created",
        entityId: created.id,
        entityType: "knowledge_article"
      }
    });
    expect(audit.summary).toBe(`Knowledge article created: ${articleTitle}.`);
  });

  it("returns field errors for invalid create input", async () => {
    const result = await createKnowledgeArticleAction(
      formData({
        title: "",
        body: "",
        status: "draft",
        audience: "internal"
      })
    );

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("Expected knowledge article validation to fail");
    }
    expect(result.fieldErrors?.title).toBeDefined();
    expect(result.fieldErrors?.body).toBeDefined();
  });

  it("updates, publishes, and archives a knowledge article", async () => {
    const article = await prisma.knowledgeArticle.create({
      data: {
        title: articleTitle,
        body: "Draft local article body.",
        status: "draft",
        audience: "internal",
        ownerId
      }
    });

    const updateResult = await updateKnowledgeArticleAction(
      article.id,
      formData({
        title: updatedArticleTitle,
        summary: "Updated action summary",
        body: "Updated local article body.",
        status: "draft",
        audience: "customer",
        category: "Lifecycle",
        keywords: "updated,lifecycle",
        caseQueueKey: "customer_success",
        ownerId
      })
    );

    expect(updateResult.ok).toBe(true);

    const updated = await prisma.knowledgeArticle.findUniqueOrThrow({
      where: { id: article.id }
    });
    expect(updated.title).toBe(updatedArticleTitle);
    expect(updated.audience).toBe("customer");

    const publishResult = await publishKnowledgeArticleAction(article.id);
    expect(publishResult.ok).toBe(true);

    const published = await prisma.knowledgeArticle.findUniqueOrThrow({
      where: { id: article.id }
    });
    expect(published.status).toBe("published");
    expect(published.publishedAt).not.toBeNull();

    const archiveResult = await archiveKnowledgeArticleAction(article.id);
    expect(archiveResult.ok).toBe(true);

    const archived = await prisma.knowledgeArticle.findUniqueOrThrow({
      where: { id: article.id }
    });
    expect(archived.status).toBe("archived");
    expect(archived.publishedAt?.toISOString()).toBe(
      published.publishedAt?.toISOString()
    );

    const statusAudits = await prisma.auditEvent.findMany({
      where: {
        action: "status_changed",
        entityId: article.id,
        entityType: "knowledge_article"
      }
    });
    expect(statusAudits).toHaveLength(2);
  });
});

function formData(values: Record<string, string>) {
  const form = new FormData();
  for (const [key, value] of Object.entries(values)) {
    form.set(key, value);
  }
  return form;
}

async function cleanup() {
  await prisma.auditEvent.deleteMany({
    where: {
      OR: [
        {
          entityType: "knowledge_article",
          metadata: {
            contains: "Knowledge action"
          }
        },
        {
          entityType: "knowledge_article",
          summary: {
            contains: "Knowledge action"
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
            startsWith: "Knowledge action"
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
