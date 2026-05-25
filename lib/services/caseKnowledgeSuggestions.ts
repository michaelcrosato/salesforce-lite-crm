import type { Case, KnowledgeArticle } from "@prisma/client";
import { z } from "zod";
import {
  CASE_QUEUE_KEYS,
  type CaseQueueKey
} from "@/lib/crm/registry";
import { prisma } from "@/lib/prisma";
import { idSchema } from "@/lib/validation";

const defaultSuggestionLimit = 3;
const maxSuggestionLimit = 5;

export const caseKnowledgeSuggestionOptionsSchema = z
  .object({
    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(maxSuggestionLimit)
      .default(defaultSuggestionLimit)
  })
  .strict();

export type CaseKnowledgeSuggestionOptions = z.input<
  typeof caseKnowledgeSuggestionOptionsSchema
>;

export type CaseKnowledgeSuggestionReasonCode =
  | "queue_match"
  | "keyword_match"
  | "metadata_text_match"
  | "urgent_priority_match";

export type CaseKnowledgeSuggestionEmptyReason =
  | "no_published_articles"
  | "no_relevant_articles";

export type CaseKnowledgeSuggestion = {
  rank: number;
  articleId: string;
  title: string;
  summary: string | null;
  category: string | null;
  audience: string;
  caseQueueKey: CaseQueueKey | null;
  publishedAt: Date | null;
  score: number;
  reasonCodes: CaseKnowledgeSuggestionReasonCode[];
  matchedKeywords: string[];
  matchedTerms: string[];
};

export type CaseKnowledgeSuggestionPacket = {
  caseId: string;
  caseSubject: string;
  caseQueueKey: CaseQueueKey | null;
  source: "local_case_article_metadata";
  limit: number;
  totalAvailable: number;
  emptyReason: CaseKnowledgeSuggestionEmptyReason | null;
  suggestions: CaseKnowledgeSuggestion[];
};

type SuggestionCase = Pick<
  Case,
  "id" | "subject" | "description" | "priority" | "status" | "queueKey"
>;

type SuggestionArticle = Pick<
  KnowledgeArticle,
  | "id"
  | "title"
  | "summary"
  | "body"
  | "status"
  | "audience"
  | "category"
  | "keywords"
  | "caseQueueKey"
  | "publishedAt"
  | "updatedAt"
>;

type ScoredSuggestion = {
  suggestion: Omit<CaseKnowledgeSuggestion, "rank">;
  publishedAtTime: number;
  updatedAtTime: number;
};

const stopWords = new Set([
  "about",
  "after",
  "and",
  "are",
  "case",
  "customer",
  "for",
  "from",
  "has",
  "have",
  "into",
  "last",
  "new",
  "not",
  "now",
  "on",
  "or",
  "our",
  "review",
  "service",
  "support",
  "that",
  "the",
  "this",
  "ticket",
  "with"
]);

export async function getCaseKnowledgeSuggestionPacket(
  caseId: string,
  options: unknown = {}
): Promise<CaseKnowledgeSuggestionPacket | null> {
  const parsedCaseId = idSchema.parse(caseId);
  const parsedOptions = caseKnowledgeSuggestionOptionsSchema.parse(options);
  const [crmCase, articles] = await Promise.all([
    prisma.case.findUnique({
      where: {
        id: parsedCaseId
      }
    }),
    prisma.knowledgeArticle.findMany({
      where: {
        status: "published"
      },
      orderBy: [
        {
          publishedAt: "desc"
        },
        {
          updatedAt: "desc"
        },
        {
          title: "asc"
        }
      ]
    })
  ]);

  if (!crmCase) {
    return null;
  }

  return buildCaseKnowledgeSuggestionPacket(crmCase, articles, parsedOptions);
}

export function buildCaseKnowledgeSuggestionPacket(
  crmCase: SuggestionCase,
  articles: readonly SuggestionArticle[],
  options: unknown = {}
): CaseKnowledgeSuggestionPacket {
  const parsedOptions = caseKnowledgeSuggestionOptionsSchema.parse(options);
  const caseQueueKey = normalizeCaseQueueKey(crmCase.queueKey);
  const caseText = normalizeText([
    crmCase.subject,
    crmCase.description,
    crmCase.priority,
    crmCase.status,
    crmCase.queueKey
  ]);
  const caseTerms = new Set(tokenize(caseText));
  const publishedArticles = articles.filter(
    (article) => article.status === "published"
  );
  const scoredSuggestions = publishedArticles
    .map((article) => scoreArticle(crmCase, caseText, caseTerms, article))
    .filter(
      (suggestion): suggestion is ScoredSuggestion => suggestion !== null
    )
    .sort(compareSuggestions);
  const suggestions = scoredSuggestions
    .slice(0, parsedOptions.limit)
    .map((scoredSuggestion, index) => ({
      rank: index + 1,
      ...scoredSuggestion.suggestion
    }));

  return {
    caseId: crmCase.id,
    caseSubject: crmCase.subject,
    caseQueueKey,
    source: "local_case_article_metadata",
    limit: parsedOptions.limit,
    totalAvailable: scoredSuggestions.length,
    emptyReason:
      scoredSuggestions.length > 0
        ? null
        : publishedArticles.length > 0
          ? "no_relevant_articles"
          : "no_published_articles",
    suggestions
  };
}

function scoreArticle(
  crmCase: SuggestionCase,
  caseText: string,
  caseTerms: ReadonlySet<string>,
  article: SuggestionArticle
): ScoredSuggestion | null {
  const articleQueueKey = normalizeCaseQueueKey(article.caseQueueKey);
  const reasonCodes: CaseKnowledgeSuggestionReasonCode[] = [];
  const matchedKeywords = matchArticleKeywords(article.keywords, caseText);
  const matchedTerms = matchArticleTerms(article, caseTerms);
  const queueMatches =
    articleQueueKey !== null && articleQueueKey === crmCase.queueKey;
  const urgentPriorityMatches =
    crmCase.priority === "urgent" && articleQueueKey === "critical_support";
  let score = 0;

  if (queueMatches) {
    score += 50;
    reasonCodes.push("queue_match");
  }

  if (matchedKeywords.length > 0) {
    score += Math.min(40, matchedKeywords.length * 10);
    reasonCodes.push("keyword_match");
  }

  if (matchedTerms.length > 0) {
    score += Math.min(15, matchedTerms.length * 3);
    reasonCodes.push("metadata_text_match");
  }

  if (urgentPriorityMatches) {
    score += 20;
    reasonCodes.push("urgent_priority_match");
  }

  if (score === 0) {
    return null;
  }

  return {
    suggestion: {
      articleId: article.id,
      title: article.title,
      summary: article.summary,
      category: article.category,
      audience: article.audience,
      caseQueueKey: articleQueueKey,
      publishedAt: article.publishedAt,
      score,
      reasonCodes,
      matchedKeywords,
      matchedTerms
    },
    publishedAtTime: article.publishedAt?.getTime() ?? 0,
    updatedAtTime: article.updatedAt.getTime()
  };
}

function compareSuggestions(
  left: ScoredSuggestion,
  right: ScoredSuggestion
): number {
  return (
    right.suggestion.score - left.suggestion.score ||
    right.suggestion.matchedKeywords.length -
      left.suggestion.matchedKeywords.length ||
    right.publishedAtTime - left.publishedAtTime ||
    right.updatedAtTime - left.updatedAtTime ||
    left.suggestion.title.localeCompare(right.suggestion.title) ||
    left.suggestion.articleId.localeCompare(right.suggestion.articleId)
  );
}

function normalizeCaseQueueKey(value: string | null): CaseQueueKey | null {
  if (!value) {
    return null;
  }

  for (const queueKey of CASE_QUEUE_KEYS) {
    if (queueKey === value) {
      return queueKey;
    }
  }

  return null;
}

function matchArticleKeywords(keywords: string, caseText: string): string[] {
  return parseKeywordList(keywords).filter((keyword) =>
    caseText.includes(keyword)
  );
}

function matchArticleTerms(
  article: SuggestionArticle,
  caseTerms: ReadonlySet<string>
): string[] {
  const articleTerms = tokenize(
    normalizeText([article.title, article.summary, article.category])
  ).filter((term) => caseTerms.has(term));

  return uniqueSorted(articleTerms);
}

function parseKeywordList(keywords: string): string[] {
  return uniqueInOrder(
    keywords
      .split(",")
      .map((keyword) => normalizeText([keyword]))
      .filter((keyword) => keyword.length > 0)
  );
}

function tokenize(text: string): string[] {
  return uniqueInOrder(
    text
      .split(" ")
      .map((token) => token.trim())
      .filter((token) => token.length >= 3 && !stopWords.has(token))
  );
}

function normalizeText(parts: readonly (string | null | undefined)[]): string {
  return parts
    .filter((part): part is string => typeof part === "string")
    .join(" ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function uniqueInOrder(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const uniqueValues: string[] = [];

  for (const value of values) {
    if (!seen.has(value)) {
      seen.add(value);
      uniqueValues.push(value);
    }
  }

  return uniqueValues;
}

function uniqueSorted(values: readonly string[]): string[] {
  return [...new Set(values)].sort((left, right) =>
    left.localeCompare(right)
  );
}
