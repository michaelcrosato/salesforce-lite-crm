"use client";

import { Archive, Pencil, Send, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  archiveKnowledgeArticleAction,
  publishKnowledgeArticleAction
} from "@/app/knowledge/actions";
import {
  KnowledgeLifecyclePanel,
  type KnowledgeArticleFormInitialValues,
  type KnowledgeArticleOwnerOption
} from "@/components/knowledge/knowledge-lifecycle-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import {
  type CaseQueueKey,
  type KnowledgeArticleAudience,
  type KnowledgeArticleStatus
} from "@/lib/crm/registry";
import { formatDate } from "@/lib/formatters";

type BadgeVariant =
  | "default"
  | "secondary"
  | "outline-solid"
  | "success"
  | "warning"
  | "danger";

export type DrawerKnowledgeArticle = KnowledgeArticleFormInitialValues & {
  id: string;
  title: string;
  body: string;
  status: KnowledgeArticleStatus;
  audience: KnowledgeArticleAudience;
  keywords: string[];
  caseQueueKey: CaseQueueKey | null;
  ownerId: string | null;
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
  archived: "outline-solid"
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
  owners,
  onClose
}: {
  article: DrawerKnowledgeArticle | null;
  owners: KnowledgeArticleOwnerOption[];
  onClose: () => void;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const focusedArticleId = article?.id;

  useEffect(() => {
    if (focusedArticleId) {
      closeButtonRef.current?.focus();
    }
  }, [focusedArticleId]);

  if (!article) {
    return null;
  }

  const activeArticleId = article.id;
  const drawerTitleId = `knowledge-detail-title-${activeArticleId}`;

  function handlePublish() {
    startTransition(() => {
      void (async () => {
        const result = await publishKnowledgeArticleAction(activeArticleId);
        showToast({
          title: result.ok ? "Article published" : "Article not published",
          description: result.message,
          variant: result.ok ? "success" : "error"
        });
        router.refresh();
      })();
    });
  }

  function handleArchive() {
    startTransition(() => {
      void (async () => {
        const result = await archiveKnowledgeArticleAction(activeArticleId);
        showToast({
          title: result.ok ? "Article archived" : "Article not archived",
          description: result.message,
          variant: result.ok ? "success" : "error"
        });
        router.refresh();
      })();
    });
  }

  return (
    <div className="fixed inset-0 z-50" data-testid="knowledge-article-drawer">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/30"
        aria-hidden="true"
        tabIndex={-1}
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={drawerTitleId}
        className="absolute right-0 top-0 flex h-full w-full max-w-2xl flex-col overflow-y-auto border-l bg-background shadow-2xl"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b bg-background p-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
              Article Detail
            </p>
            <h2 id={drawerTitleId} className="mt-1 text-xl font-semibold">
              {article.title}
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant={STATUS_VARIANT[article.status]}>
                {STATUS_LABELS[article.status]}
              </Badge>
              <Badge variant={AUDIENCE_VARIANT[article.audience]}>
                {AUDIENCE_LABELS[article.audience]}
              </Badge>
            </div>
          </div>
          <Button
            ref={closeButtonRef}
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Close knowledge article detail"
            data-testid="knowledge-drawer-close"
            onClick={onClose}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        <div className="space-y-5 p-5">
          {isEditing ? (
            <KnowledgeLifecyclePanel
              owners={owners}
              initialValues={article}
              title="Edit Article"
              submitLabel="Save article"
              testId="knowledge-edit-form"
              onSaved={() => setIsEditing(false)}
            />
          ) : (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Article</CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  data-testid="knowledge-button-edit"
                  onClick={() => setIsEditing(true)}
                >
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                  Edit
                </Button>
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
          )}

          <Card data-testid="knowledge-lifecycle-panel">
            <CardHeader>
              <CardTitle>Lifecycle</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-3">
              {article.status !== "published" ? (
                <Button
                  type="button"
                  data-testid="knowledge-button-publish"
                  disabled={isPending}
                  onClick={handlePublish}
                >
                  <Send className="h-4 w-4" aria-hidden="true" />
                  Publish article
                </Button>
              ) : null}
              {article.status !== "archived" ? (
                <Button
                  type="button"
                  variant="outline"
                  data-testid="knowledge-button-archive"
                  disabled={isPending}
                  onClick={handleArchive}
                >
                  <Archive className="h-4 w-4" aria-hidden="true" />
                  Archive article
                </Button>
              ) : null}
              <Badge variant={STATUS_VARIANT[article.status]}>
                {STATUS_LABELS[article.status]}
              </Badge>
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
