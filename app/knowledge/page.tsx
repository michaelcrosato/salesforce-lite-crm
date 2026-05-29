import type { Metadata } from "next";
import Link from "next/link";
import { KnowledgeArticlesView } from "@/components/knowledge/knowledge-articles-view";
import { type DrawerKnowledgeArticle } from "@/components/knowledge/knowledge-article-detail-drawer";
import {
  KnowledgeLifecyclePanel,
  type KnowledgeArticleOwnerOption
} from "@/components/knowledge/knowledge-lifecycle-panel";
import { type KnowledgeArticleRow } from "@/components/knowledge/knowledge-articles-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/page-header";
import { Select } from "@/components/ui/select";
import {
  getKnowledgeArticle,
  listKnowledgeArticles,
  type KnowledgeArticleListOptions
} from "@/lib/crm/crmClient";
import {
  CASE_QUEUE_KEYS,
  KNOWLEDGE_ARTICLE_AUDIENCES,
  KNOWLEDGE_ARTICLE_STATUSES,
  type CaseQueueKey,
  type KnowledgeArticleAudience,
  type KnowledgeArticleStatus
} from "@/lib/crm/registry";
import { prisma } from "@/lib/prisma";
import { nonEmptyQueryParam } from "@/lib/queryParams";
import type { SortOrder } from "@/lib/services/listQuery";



export const metadata: Metadata = {
  title: "Knowledge Articles"
};

type KnowledgeSearchParams = {
  article?: string;
  status?: string;
  audience?: string;
  caseQueueKey?: string;
  category?: string;
  ownerId?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
};

const KNOWLEDGE_SORT_KEYS = [
  "updatedAt",
  "createdAt",
  "title",
  "status",
  "category"
] as const;

type KnowledgeSortBy = (typeof KNOWLEDGE_SORT_KEYS)[number];
const DEFAULT_SORT_BY: KnowledgeSortBy = "updatedAt";

const STATUS_LABELS: Record<KnowledgeArticleStatus, string> = {
  draft: "Draft",
  published: "Published",
  archived: "Archived"
};

const AUDIENCE_LABELS: Record<KnowledgeArticleAudience, string> = {
  internal: "Internal",
  customer: "Customer"
};

const QUEUE_LABELS: Record<CaseQueueKey, string> = {
  critical_support: "Critical Support",
  billing_support: "Billing Support",
  dealer_operations: "Dealer Operations",
  data_quality: "Data Quality",
  customer_success: "Customer Success",
  general_support: "General Support"
};

function isKnowledgeStatus(
  value: string | undefined
): value is KnowledgeArticleStatus {
  if (!value) {
    return false;
  }
  return (KNOWLEDGE_ARTICLE_STATUSES as readonly string[]).includes(value);
}

function isKnowledgeAudience(
  value: string | undefined
): value is KnowledgeArticleAudience {
  if (!value) {
    return false;
  }
  return (KNOWLEDGE_ARTICLE_AUDIENCES as readonly string[]).includes(value);
}

function isCaseQueueKey(
  value: string | null | undefined
): value is CaseQueueKey {
  if (!value) {
    return false;
  }
  return (CASE_QUEUE_KEYS as readonly string[]).includes(value);
}

function isKnowledgeSortBy(
  value: string | undefined
): value is KnowledgeSortBy {
  if (!value) {
    return false;
  }
  return (KNOWLEDGE_SORT_KEYS as readonly string[]).includes(value);
}

function sortOrderParam(value: string | undefined): SortOrder | undefined {
  return value === "asc" || value === "desc" ? value : undefined;
}

function splitKeywords(value: string | null): string[] {
  return (value ?? "")
    .split(",")
    .map((keyword) => keyword.trim())
    .filter((keyword) => keyword.length > 0);
}

export default async function KnowledgePage({
  searchParams
}: {
  searchParams: Promise<KnowledgeSearchParams>;
}) {
  const params = await searchParams;
  const statusFilter = isKnowledgeStatus(params.status)
    ? params.status
    : undefined;
  const audienceFilter = isKnowledgeAudience(params.audience)
    ? params.audience
    : undefined;
  const queueFilter = isCaseQueueKey(params.caseQueueKey)
    ? params.caseQueueKey
    : undefined;
  const categoryFilter = nonEmptyQueryParam(params.category);
  const ownerFilter = nonEmptyQueryParam(params.ownerId);
  const searchFilter = nonEmptyQueryParam(params.search);
  const sortBy = isKnowledgeSortBy(params.sortBy)
    ? params.sortBy
    : DEFAULT_SORT_BY;
  const sortOrder = sortOrderParam(params.sortOrder) ?? "desc";

  const listOptions: KnowledgeArticleListOptions = {
    pageSize: 100,
    sortBy,
    sortOrder,
    filters: {
      status: statusFilter,
      audience: audienceFilter,
      caseQueueKey: queueFilter,
      category: categoryFilter,
      ownerId: ownerFilter,
      search: searchFilter
    }
  };

  const [articles, allArticles, owners] = await Promise.all([
    listKnowledgeArticles(listOptions),
    prisma.knowledgeArticle.findMany({
      orderBy: [{ category: "asc" }, { title: "asc" }],
      select: {
        audience: true,
        category: true,
        caseQueueKey: true,
        status: true
      }
    }),
    prisma.user.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true }
    })
  ]);
  const ownerById = new Map(owners.map((owner) => [owner.id, owner]));
  const ownerOptions: KnowledgeArticleOwnerOption[] = owners.map((owner) => ({
    id: owner.id,
    label: owner.name
  }));
  const categoryOptions = Array.from(
    new Set(
      allArticles
        .map((article) => article.category)
        .filter((category): category is string => Boolean(category))
    )
  );
  const summary = buildKnowledgeSummary(allArticles);
  const rows: KnowledgeArticleRow[] = articles.map((article) => ({
    id: article.id,
    title: article.title,
    summary: article.summary,
    status: article.status as KnowledgeArticleStatus,
    audience: article.audience as KnowledgeArticleAudience,
    category: article.category,
    keywords: splitKeywords(article.keywords),
    caseQueueKey: isCaseQueueKey(article.caseQueueKey)
      ? article.caseQueueKey
      : null,
    ownerName: article.ownerId
      ? ownerById.get(article.ownerId)?.name ?? null
      : null,
    updatedAt: article.updatedAt.toISOString(),
    publishedAt: article.publishedAt?.toISOString() ?? null
  }));

  let drawerArticle: DrawerKnowledgeArticle | null = null;
  if (params.article) {
    const found = await getKnowledgeArticle(params.article);
    if (found) {
      drawerArticle = {
        id: found.id,
        title: found.title,
        summary: found.summary,
        body: found.body,
        status: found.status as KnowledgeArticleStatus,
        audience: found.audience as KnowledgeArticleAudience,
        category: found.category,
        keywords: splitKeywords(found.keywords),
        caseQueueKey: isCaseQueueKey(found.caseQueueKey)
          ? found.caseQueueKey
          : null,
        ownerId: found.ownerId,
        ownerName: found.ownerId
          ? ownerById.get(found.ownerId)?.name ?? null
          : null,
        publishedAt: found.publishedAt?.toISOString() ?? null,
        createdAt: found.createdAt.toISOString(),
        updatedAt: found.updatedAt.toISOString()
      };
    }
  }

  return (
    <div className="crm-page">
      <PageHeader
        title="Knowledge Articles"
        description="Review local service-workflow articles used by deterministic case assist."
      />

      <Card data-testid="knowledge-summary-panel">
        <CardHeader>
          <CardTitle>Workspace Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <SummaryMetric label="Total articles" value={String(summary.total)} />
          <SummaryMetric
            label="Published"
            value={String(summary.published)}
          />
          <SummaryMetric
            label="Internal"
            value={String(summary.internal)}
          />
          <SummaryMetric
            label="Case queues"
            value={String(summary.caseQueues)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <form action="/knowledge" className="grid gap-4 lg:grid-cols-7">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                id="status"
                name="status"
                defaultValue={statusFilter ?? ""}
                data-testid="knowledge-filter-status"
              >
                <option value="">All</option>
                {KNOWLEDGE_ARTICLE_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {STATUS_LABELS[status]}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="audience">Audience</Label>
              <Select
                id="audience"
                name="audience"
                defaultValue={audienceFilter ?? ""}
                data-testid="knowledge-filter-audience"
              >
                <option value="">All</option>
                {KNOWLEDGE_ARTICLE_AUDIENCES.map((audience) => (
                  <option key={audience} value={audience}>
                    {AUDIENCE_LABELS[audience]}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="caseQueueKey">Queue</Label>
              <Select
                id="caseQueueKey"
                name="caseQueueKey"
                defaultValue={queueFilter ?? ""}
                data-testid="knowledge-filter-queue"
              >
                <option value="">Any queue</option>
                {CASE_QUEUE_KEYS.map((queueKey) => (
                  <option key={queueKey} value={queueKey}>
                    {QUEUE_LABELS[queueKey]}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                id="category"
                name="category"
                defaultValue={categoryFilter ?? ""}
                data-testid="knowledge-filter-category"
              >
                <option value="">Any category</option>
                {categoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ownerId">Owner</Label>
              <Select
                id="ownerId"
                name="ownerId"
                defaultValue={ownerFilter ?? ""}
                data-testid="knowledge-filter-owner"
              >
                <option value="">Any owner</option>
                {owners.map((owner) => (
                  <option key={owner.id} value={owner.id}>
                    {owner.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sortBy">Sort by</Label>
              <Select
                id="sortBy"
                name="sortBy"
                defaultValue={sortBy}
                data-testid="knowledge-filter-sort"
              >
                <option value="updatedAt">Updated</option>
                <option value="createdAt">Created</option>
                <option value="title">Title</option>
                <option value="status">Status</option>
                <option value="category">Category</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sortOrder">Order</Label>
              <Select
                id="sortOrder"
                name="sortOrder"
                defaultValue={sortOrder}
                data-testid="knowledge-filter-order"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </Select>
            </div>
            <div className="space-y-2 lg:col-span-5">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                name="search"
                defaultValue={searchFilter ?? ""}
                placeholder="Search title, summary, body, category, or keywords"
                data-testid="knowledge-filter-search"
              />
            </div>
            <div className="flex items-end gap-3 lg:col-span-2">
              <Button type="submit" data-testid="knowledge-filter-submit">
                Apply filters
              </Button>
              <Button asChild variant="outline">
                <Link href="/knowledge">Reset</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <KnowledgeLifecyclePanel
        owners={ownerOptions}
        title="Create Article"
        submitLabel="Create article"
      />

      <Card>
        <CardHeader>
          <CardTitle>Article List</CardTitle>
        </CardHeader>
        <CardContent>
          <KnowledgeArticlesView
            articles={rows}
            drawerArticle={drawerArticle}
            owners={ownerOptions}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-background p-3">
      <span className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
        {label}
      </span>
      <span className="mt-1 block text-2xl font-semibold">{value}</span>
    </div>
  );
}

function buildKnowledgeSummary(
  articles: Array<{
    audience: string;
    caseQueueKey: string | null;
    status: string;
  }>
) {
  return {
    total: articles.length,
    published: articles.filter((article) => article.status === "published")
      .length,
    internal: articles.filter((article) => article.audience === "internal")
      .length,
    caseQueues: new Set(
      articles
        .map((article) => article.caseQueueKey)
        .filter((queueKey): queueKey is string => Boolean(queueKey))
    ).size
  };
}
