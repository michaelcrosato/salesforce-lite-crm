"use client";

import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
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

export type DrawerKnowledgeArticle = {
  id: string;
  title: string;
  summary: string | null;
  body: string;
  status: KnowledgeArticleStatus;
  audience: KnowledgeArticleAudience;
  category: string | null;
  keywords: string[];
  caseQueueKey: CaseQueueKey | null;
  ownerName: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
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

export function KnowledgeArticleDetailDrawer({
  article,
  onClose
}: {
  article: DrawerKnowledgeArticle | null;
  onClose: () => void;
}) {
  if (!article) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50" data-testid="knowledge-article-drawer">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/30"
        aria-label="Close knowledge article detail"
        onClick={onClose}
      />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-2xl flex-col overflow-y-auto border-l bg-background shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b bg-background p-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
              Article Detail
            </p>
            <h2 className="mt-1 text-xl font-semibold">{article.title}</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant={STATUS_VARIANT[article.status]}>
                {STATUS_LABELS[article.status]}
              </Badge>
              <Badge variant={AUDIENCE_VARIANT[article.audience]}>
                {AUDIENCE_LABELS[article.audience]}
              </Badge>
            </div>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        <div className="space-y-5 p-5">
          <Card>
            <CardHeader>
              <CardTitle>Article</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {article.summary ? (
                <p className="text-sm text-muted-foreground">
                  {article.summary}
                </p>
              ) : null}
              <p className="whitespace-pre-wrap text-sm leading-6">
                {article.body}
              </p>
            </CardContent>
          </Card>

          <Card data-testid="knowledge-article-context">
            <CardHeader>
              <CardTitle>Case assist context</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <FieldView
                label="Queue"
                value={
                  article.caseQueueKey
                    ? QUEUE_LABELS[article.caseQueueKey]
                    : "Any queue"
                }
              />
              <FieldView
                label="Category"
                value={article.category ?? "Uncategorized"}
              />
              <FieldView
                label="Audience"
                value={AUDIENCE_LABELS[article.audience]}
              />
              <FieldView
                label="Owner"
                value={article.ownerName ?? "Unassigned"}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Keywords</CardTitle>
            </CardHeader>
            <CardContent>
              {article.keywords.length > 0 ? (
                <div
                  className="flex flex-wrap gap-2"
                  data-testid="knowledge-article-keywords"
                >
                  {article.keywords.map((keyword) => (
                    <Badge key={keyword} variant="outline">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p
                  className="rounded-md border border-dashed bg-muted/30 p-3 text-sm text-muted-foreground"
                  data-testid="knowledge-article-keywords"
                >
                  No keywords are attached to this article.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dates</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3">
              <FieldView label="Published" value={formatDate(article.publishedAt)} />
              <FieldView label="Created" value={formatDate(article.createdAt)} />
              <FieldView label="Updated" value={formatDate(article.updatedAt)} />
            </CardContent>
          </Card>
        </div>
      </aside>
    </div>
  );
}

function FieldView({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-background p-3">
      <span className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
        {label}
      </span>
      <span className="mt-1 block text-sm font-medium">{value}</span>
    </div>
  );
}
