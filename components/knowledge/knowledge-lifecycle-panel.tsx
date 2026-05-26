"use client";

import { Plus, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useRef, useState, useTransition } from "react";
import {
  createKnowledgeArticleAction,
  updateKnowledgeArticleAction
} from "@/app/knowledge/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import type { ActionResult } from "@/lib/action-result";
import {
  CASE_QUEUE_KEYS,
  KNOWLEDGE_ARTICLE_AUDIENCES,
  KNOWLEDGE_ARTICLE_STATUSES,
  type CaseQueueKey,
  type KnowledgeArticleAudience,
  type KnowledgeArticleStatus
} from "@/lib/crm/registry";

export type KnowledgeArticleOwnerOption = {
  id: string;
  label: string;
};

export type KnowledgeArticleFormInitialValues = {
  id?: string;
  title?: string;
  summary?: string | null;
  body?: string;
  status?: KnowledgeArticleStatus;
  audience?: KnowledgeArticleAudience;
  category?: string | null;
  keywords?: string[];
  caseQueueKey?: CaseQueueKey | null;
  ownerId?: string | null;
};

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

export function KnowledgeLifecyclePanel({
  owners,
  initialValues,
  title,
  submitLabel,
  testId = "knowledge-create-form",
  onSaved
}: {
  owners: KnowledgeArticleOwnerOption[];
  initialValues?: KnowledgeArticleFormInitialValues;
  title: string;
  submitLabel: string;
  testId?: string;
  onSaved?: () => void;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);
  const fieldIdPrefix = initialValues?.id
    ? `knowledge-edit-${initialValues.id}`
    : "knowledge-create";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(() => {
      void (async () => {
        const actionResult = initialValues?.id
          ? await updateKnowledgeArticleAction(initialValues.id, formData)
          : await createKnowledgeArticleAction(formData);
        setResult(actionResult);
        showToast({
          title: actionResult.ok ? "Article saved" : "Article not saved",
          description: actionResult.message,
          variant: actionResult.ok ? "success" : "error"
        });

        if (actionResult.ok) {
          if (!initialValues?.id) {
            formRef.current?.reset();
          }
          onSaved?.();
          router.refresh();
        }
      })();
    });
  }

  const errors = result && !result.ok ? result.fieldErrors : undefined;
  const keywords = initialValues?.keywords?.join(", ") ?? "";
  const Icon = initialValues?.id ? Save : Plus;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="grid gap-4 md:grid-cols-2"
          data-testid={testId}
        >
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor={`${fieldIdPrefix}-title`}>Title</Label>
            <Input
              id={`${fieldIdPrefix}-title`}
              name="title"
              defaultValue={initialValues?.title ?? ""}
              required
              data-testid="knowledge-field-title"
            />
            <FieldError errors={errors?.title} />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor={`${fieldIdPrefix}-summary`}>Summary</Label>
            <Textarea
              id={`${fieldIdPrefix}-summary`}
              name="summary"
              defaultValue={initialValues?.summary ?? ""}
              className="min-h-24"
              data-testid="knowledge-field-summary"
            />
            <FieldError errors={errors?.summary} />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor={`${fieldIdPrefix}-body`}>Body</Label>
            <Textarea
              id={`${fieldIdPrefix}-body`}
              name="body"
              defaultValue={initialValues?.body ?? ""}
              required
              data-testid="knowledge-field-body"
            />
            <FieldError errors={errors?.body} />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${fieldIdPrefix}-status`}>Status</Label>
            <Select
              id={`${fieldIdPrefix}-status`}
              name="status"
              defaultValue={initialValues?.status ?? "draft"}
              data-testid="knowledge-field-status"
            >
              {KNOWLEDGE_ARTICLE_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABELS[status]}
                </option>
              ))}
            </Select>
            <FieldError errors={errors?.status} />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${fieldIdPrefix}-audience`}>Audience</Label>
            <Select
              id={`${fieldIdPrefix}-audience`}
              name="audience"
              defaultValue={initialValues?.audience ?? "internal"}
              data-testid="knowledge-field-audience"
            >
              {KNOWLEDGE_ARTICLE_AUDIENCES.map((audience) => (
                <option key={audience} value={audience}>
                  {AUDIENCE_LABELS[audience]}
                </option>
              ))}
            </Select>
            <FieldError errors={errors?.audience} />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${fieldIdPrefix}-category`}>Category</Label>
            <Input
              id={`${fieldIdPrefix}-category`}
              name="category"
              defaultValue={initialValues?.category ?? ""}
              data-testid="knowledge-field-category"
            />
            <FieldError errors={errors?.category} />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${fieldIdPrefix}-keywords`}>Keywords</Label>
            <Input
              id={`${fieldIdPrefix}-keywords`}
              name="keywords"
              defaultValue={keywords}
              data-testid="knowledge-field-keywords"
            />
            <FieldError errors={errors?.keywords} />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${fieldIdPrefix}-caseQueueKey`}>Queue</Label>
            <Select
              id={`${fieldIdPrefix}-caseQueueKey`}
              name="caseQueueKey"
              defaultValue={initialValues?.caseQueueKey ?? ""}
              data-testid="knowledge-field-queue"
            >
              <option value="">Any queue</option>
              {CASE_QUEUE_KEYS.map((queueKey) => (
                <option key={queueKey} value={queueKey}>
                  {QUEUE_LABELS[queueKey]}
                </option>
              ))}
            </Select>
            <FieldError errors={errors?.caseQueueKey} />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${fieldIdPrefix}-ownerId`}>Owner</Label>
            <Select
              id={`${fieldIdPrefix}-ownerId`}
              name="ownerId"
              defaultValue={initialValues?.ownerId ?? ""}
              data-testid="knowledge-field-owner"
            >
              <option value="">Unassigned</option>
              {owners.map((owner) => (
                <option key={owner.id} value={owner.id}>
                  {owner.label}
                </option>
              ))}
            </Select>
            <FieldError errors={errors?.ownerId} />
          </div>

          <div className="flex items-end justify-end gap-3 md:col-span-2">
            <Button
              type="submit"
              loading={isPending}
              data-testid="knowledge-button-submit"
            >
              {!isPending ? <Icon className="h-4 w-4" aria-hidden="true" /> : null}
              {submitLabel}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) {
    return null;
  }

  return <p className="text-xs text-destructive">{errors[0]}</p>;
}
