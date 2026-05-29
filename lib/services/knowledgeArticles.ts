import type { KnowledgeArticle, Prisma } from "@prisma/client";
import { z } from "zod/v4";
import {
  CASE_QUEUE_KEYS,
  KNOWLEDGE_ARTICLE_AUDIENCES,
  KNOWLEDGE_ARTICLE_STATUSES,
  type CaseQueueKey,
  type KnowledgeArticleAudience,
  type KnowledgeArticleStatus
} from "@/lib/crm/registry";
import { prisma } from "@/lib/prisma";
import {
  buildAuditEventCreateData,
  type AuditMetadataValue
} from "@/lib/services/auditEvents";
import {
  fieldContains,
  fieldEquals,
  orFilters
} from "@/lib/services/filterCompiler";
import { buildListQuery, type ListQueryInput } from "@/lib/services/listQuery";
import {
  idSchema,
  knowledgeArticleCreateSchema,
  knowledgeArticleUpdateSchema
} from "@/lib/validation";

const knowledgeArticleSortByValues = [
  "updatedAt",
  "createdAt",
  "title",
  "status",
  "category"
] as const;
const sortOrderSchema = z.enum(["asc", "desc"]);
const knowledgeArticleFilterSchema = z
  .object({
    status: z.enum(KNOWLEDGE_ARTICLE_STATUSES).optional(),
    audience: z.enum(KNOWLEDGE_ARTICLE_AUDIENCES).optional(),
    caseQueueKey: z.enum(CASE_QUEUE_KEYS).optional(),
    category: z.string().trim().min(1).optional(),
    ownerId: idSchema.optional(),
    search: z.string().trim().min(1).optional()
  })
  .strict();

export const knowledgeArticleListSchema = z
  .object({
    page: z.coerce.number().int().min(1).optional(),
    pageSize: z.coerce.number().int().min(1).max(100).optional(),
    sortBy: z.enum(knowledgeArticleSortByValues).optional(),
    sortOrder: sortOrderSchema.optional(),
    filters: knowledgeArticleFilterSchema.optional()
  })
  .strict();

const legacyKnowledgeArticleListSchema = knowledgeArticleFilterSchema
  .extend({
    skip: z.coerce.number().int().min(0).optional(),
    take: z.coerce.number().int().min(1).max(100).optional()
  })
  .strict();

type KnowledgeArticleSortBy = (typeof knowledgeArticleSortByValues)[number];
type KnowledgeArticleFilters = {
  status: KnowledgeArticleStatus;
  audience: KnowledgeArticleAudience;
  caseQueueKey: CaseQueueKey;
  category: string;
  ownerId: string;
  search: string;
};
type ParsedKnowledgeArticleListInput = ListQueryInput<
  KnowledgeArticleSortBy,
  KnowledgeArticleFilters
>;

export type KnowledgeArticleListInput = ListQueryInput<
  KnowledgeArticleSortBy,
  KnowledgeArticleFilters
>;
export type KnowledgeArticleCreateInput = z.input<
  typeof knowledgeArticleCreateSchema
>;
export type KnowledgeArticleUpdateInput = z.input<
  typeof knowledgeArticleUpdateSchema
>;

export async function createKnowledgeArticle(
  input: unknown
): Promise<KnowledgeArticle> {
  const parsed = knowledgeArticleCreateSchema.parse(input);
  const data: Prisma.KnowledgeArticleUncheckedCreateInput =
    normalizeCreateData(parsed);

  return prisma.$transaction(async (tx) => {
    const article = await tx.knowledgeArticle.create({ data });

    await tx.auditEvent.create({
      data: buildAuditEventCreateData({
        category: "record",
        action: "created",
        entityType: "knowledge_article",
        entityId: article.id,
        summary: `Knowledge article created: ${article.title}.`,
        metadata: knowledgeArticleAuditMetadata(article)
      })
    });

    return article;
  });
}

export async function listKnowledgeArticles(
  input: unknown = {}
): Promise<KnowledgeArticle[]> {
  return prisma.knowledgeArticle.findMany(
    knowledgeArticleListQuery(parseKnowledgeArticleListInput(input))
  );
}

export async function getKnowledgeArticle(
  id: string
): Promise<KnowledgeArticle | null> {
  return prisma.knowledgeArticle.findUnique({
    where: { id: idSchema.parse(id) }
  });
}

export async function updateKnowledgeArticle(
  id: string,
  input: unknown
): Promise<KnowledgeArticle> {
  const articleId = idSchema.parse(id);
  const parsed = knowledgeArticleUpdateSchema.parse(input);

  return prisma.$transaction(async (tx) => {
    const existing = await tx.knowledgeArticle.findUniqueOrThrow({
      where: { id: articleId }
    });
    const data = normalizeUpdateData(parsed, existing);
    const article = await tx.knowledgeArticle.update({
      where: { id: articleId },
      data
    });
    const statusChanged =
      parsed.status !== undefined && parsed.status !== existing.status;

    await tx.auditEvent.create({
      data: buildAuditEventCreateData({
        category: "record",
        action: statusChanged ? "status_changed" : "updated",
        entityType: "knowledge_article",
        entityId: article.id,
        summary: statusChanged
          ? `Knowledge article status changed from ${existing.status} to ${article.status}.`
          : `Knowledge article updated: ${article.title}.`,
        metadata: {
          ...knowledgeArticleAuditMetadata(article),
          changedFields: Object.keys(data).sort(),
          previousStatus: statusChanged ? existing.status : null
        }
      })
    });

    return article;
  });
}

export async function publishKnowledgeArticle(
  id: string,
  publishedAt = new Date()
): Promise<KnowledgeArticle> {
  return updateKnowledgeArticle(id, {
    status: "published",
    publishedAt
  });
}

export async function archiveKnowledgeArticle(
  id: string
): Promise<KnowledgeArticle> {
  return updateKnowledgeArticle(id, {
    status: "archived"
  });
}

function parseKnowledgeArticleListInput(
  input: unknown
): ParsedKnowledgeArticleListInput {
  const standard = knowledgeArticleListSchema.safeParse(input);

  if (standard.success) {
    return standard.data;
  }

  const legacy = legacyKnowledgeArticleListSchema.parse(input);
  const { skip, take, ...filters } = legacy;

  return {
    page:
      skip !== undefined && take !== undefined
        ? Math.floor(skip / take) + 1
        : undefined,
    pageSize: take,
    filters
  };
}

function knowledgeArticleListQuery(input: ParsedKnowledgeArticleListInput) {
  return buildListQuery<
    KnowledgeArticleSortBy,
    KnowledgeArticleFilters,
    Prisma.KnowledgeArticleWhereInput,
    Prisma.KnowledgeArticleOrderByWithRelationInput[]
  >(input, {
    defaultSortBy: "updatedAt",
    defaultSortOrder: "desc",
    emptyWhere: {},
    andWhere: (clauses) => ({ AND: clauses }),
    sortMap: {
      updatedAt: (order) => [{ updatedAt: order }, { createdAt: "desc" }],
      createdAt: (order) => [{ createdAt: order }],
      title: (order) => [{ title: order }],
      status: (order) => [{ status: order }, { updatedAt: "desc" }],
      category: (order) => [{ category: order }, { updatedAt: "desc" }]
    },
    filterMap: {
      status: (status) => fieldEquals(["status"], status),
      audience: (audience) => fieldEquals(["audience"], audience),
      caseQueueKey: (caseQueueKey) =>
        fieldEquals(["caseQueueKey"], caseQueueKey),
      category: (category) => fieldEquals(["category"], category),
      ownerId: (ownerId) => fieldEquals(["ownerId"], ownerId),
      search: (search) =>
        orFilters([
          fieldContains(["title"], search),
          fieldContains(["summary"], search),
          fieldContains(["body"], search),
          fieldContains(["category"], search),
          fieldContains(["keywords"], search)
        ])
    }
  });
}

function normalizeCreateData(
  input: ReturnType<typeof knowledgeArticleCreateSchema.parse>
): Prisma.KnowledgeArticleUncheckedCreateInput {
  const data: Prisma.KnowledgeArticleUncheckedCreateInput = { ...input };

  if (input.status === "published" && input.publishedAt === undefined) {
    data.publishedAt = new Date();
  }

  return data;
}

function normalizeUpdateData(
  input: ReturnType<typeof knowledgeArticleUpdateSchema.parse>,
  existing: KnowledgeArticle
): Prisma.KnowledgeArticleUncheckedUpdateInput {
  const data: Prisma.KnowledgeArticleUncheckedUpdateInput = { ...input };

  if (
    input.status === "published" &&
    existing.status !== "published" &&
    input.publishedAt === undefined
  ) {
    data.publishedAt = new Date();
  }

  return data;
}

function knowledgeArticleAuditMetadata(
  article: KnowledgeArticle
): Record<string, AuditMetadataValue> {
  return {
    audience: article.audience,
    category: article.category,
    caseQueueKey: article.caseQueueKey,
    ownerId: article.ownerId,
    status: article.status,
    title: article.title
  };
}
