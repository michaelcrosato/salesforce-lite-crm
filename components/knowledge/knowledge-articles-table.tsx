"use client";

import { Eye } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  ROUTE_REGISTRY,
  type CaseQueueKey,
  type KnowledgeArticleAudience,
  type KnowledgeArticleStatus
} from "@/lib/crm/registry";
import { formatDate } from "@/lib/formatters";

type BadgeVariant =
  | "default"
  | "secondary"
  | "outline"
  | "success"
  | "warning"
  | "danger";

export type KnowledgeArticleRow = {
  id: string;
  title: string;
  summary: string | null;
  status: KnowledgeArticleStatus;
  audience: KnowledgeArticleAudience;
  category: string | null;
  keywords: string[];
  caseQueueKey: CaseQueueKey | null;
  ownerName: string | null;
  updatedAt: string;
  publishedAt: string | null;
};

const STATUS_LABELS: Record<KnowledgeArticleStatus, string> = {
  draft: "Draft",
  published: "Published",
  archived: "Archived"
};

const STATUS_VARIANT: Record<KnowledgeArticleStatus, BadgeVariant> = {
  draft: "secondary",
  published: "success",
  archived: "outline"
};

const AUDIENCE_LABELS: Record<KnowledgeArticleAudience, string> = {
  internal: "Internal",
  customer: "Customer"
};

const AUDIENCE_VARIANT: Record<KnowledgeArticleAudience, BadgeVariant> = {
  internal: "default",
  customer: "warning"
};

const QUEUE_LABELS: Record<CaseQueueKey, string> = {
  critical_support: "Critical Support",
  billing_support: "Billing Support",
  dealer_operations: "Dealer Operations",
  data_quality: "Data Quality",
  customer_success: "Customer Success",
  general_support: "General Support"
};

export function KnowledgeArticlesTable({
  articles
}: {
  articles: KnowledgeArticleRow[];
}) {
  return (
    <Table data-testid="knowledge-article-table">
      <TableHeader>
        <TableRow>
          <TableHead>Article</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Audience</TableHead>
          <TableHead>Case assist</TableHead>
          <TableHead>Keywords</TableHead>
          <TableHead>Owner</TableHead>
          <TableHead>Updated</TableHead>
          <TableHead className="w-16">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {articles.map((article) => (
          <TableRow key={article.id} data-testid="knowledge-article-row">
            <TableCell className="min-w-64">
              <Link
                href={ROUTE_REGISTRY.knowledgeArticleDetail(article.id)}
                className="font-medium text-primary hover:underline"
              >
                {article.title}
              </Link>
              {article.summary ? (
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                  {article.summary}
                </p>
              ) : null}
            </TableCell>
            <TableCell>
              <Badge variant={STATUS_VARIANT[article.status]}>
                {STATUS_LABELS[article.status]}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge variant={AUDIENCE_VARIANT[article.audience]}>
                {AUDIENCE_LABELS[article.audience]}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex min-w-40 flex-col gap-1">
                <span className="text-sm font-medium">
                  {article.caseQueueKey
                    ? QUEUE_LABELS[article.caseQueueKey]
                    : "Any queue"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {article.category ?? "Uncategorized"}
                </span>
              </div>
            </TableCell>
            <TableCell>
              {article.keywords.length > 0 ? (
                <div className="flex max-w-56 flex-wrap gap-1">
                  {article.keywords.slice(0, 3).map((keyword) => (
                    <Badge key={keyword} variant="outline">
                      {keyword}
                    </Badge>
                  ))}
                  {article.keywords.length > 3 ? (
                    <Badge variant="secondary">
                      +{article.keywords.length - 3}
                    </Badge>
                  ) : null}
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">None</span>
              )}
            </TableCell>
            <TableCell>{article.ownerName ?? "Unassigned"}</TableCell>
            <TableCell>
              <div className="min-w-28">
                <p>{formatDate(article.updatedAt)}</p>
                <p className="text-xs text-muted-foreground">
                  Published {formatDate(article.publishedAt)}
                </p>
              </div>
            </TableCell>
            <TableCell>
              <Button asChild variant="ghost" size="icon">
                <Link
                  href={ROUTE_REGISTRY.knowledgeArticleDetail(article.id)}
                  aria-label="Open knowledge article"
                  data-testid="knowledge-article-open"
                >
                  <Eye className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
