"use client";

import { type FormEvent, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createCaseAction, updateCaseAction } from "@/app/cases/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import type { ActionResult } from "@/lib/action-result";
import {
  CASE_PRIORITIES,
  CASE_QUEUE_KEYS,
  CASE_STATUSES,
  type CasePriority,
  type CaseQueueKey,
  type CaseStatus
} from "@/lib/crm/registry";

export type CaseOptionItem = {
  id: string;
  label: string;
};

export type CaseFormInitialValues = {
  id?: string;
  subject?: string;
  description?: string | null;
  status?: CaseStatus;
  priority?: CasePriority;
  queueKey?: CaseQueueKey | null;
  queueReason?: string | null;
  ownerId?: string | null;
  accountId?: string | null;
  contactId?: string | null;
};

const STATUS_LABELS: Record<CaseStatus, string> = {
  new: "New",
  in_progress: "In progress",
  waiting: "Waiting",
  resolved: "Resolved",
  closed: "Closed"
};

const PRIORITY_LABELS: Record<CasePriority, string> = {
  low: "Low",
  normal: "Normal",
  high: "High",
  urgent: "Urgent"
};

const QUEUE_LABELS: Record<CaseQueueKey, string> = {
  critical_support: "Critical Support",
  billing_support: "Billing Support",
  dealer_operations: "Dealer Operations",
  data_quality: "Data Quality",
  customer_success: "Customer Success",
  general_support: "General Support"
};

export function CaseForm({
  owners,
  accounts,
  contacts,
  initialValues,
  title,
  submitLabel,
  onSaved
}: {
  owners: CaseOptionItem[];
  accounts: CaseOptionItem[];
  contacts: CaseOptionItem[];
  initialValues?: CaseFormInitialValues;
  title: string;
  submitLabel: string;
  onSaved?: () => void;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(() => {
      void (async () => {
        const actionResult = initialValues?.id
          ? await updateCaseAction(initialValues.id, formData)
          : await createCaseAction(formData);
        setResult(actionResult);
        showToast({
          title: actionResult.ok ? "Case saved" : "Case not saved",
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
  const queueDefault =
    initialValues?.queueReason === "explicit_queue"
      ? initialValues.queueKey ?? ""
      : "";

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
        >
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              name="subject"
              defaultValue={initialValues?.subject ?? ""}
              required
            />
            <FieldError errors={errors?.subject} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={initialValues?.description ?? ""}
            />
            <FieldError errors={errors?.description} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              id="status"
              name="status"
              defaultValue={initialValues?.status ?? "new"}
            >
              {CASE_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABELS[status]}
                </option>
              ))}
            </Select>
            <FieldError errors={errors?.status} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select
              id="priority"
              name="priority"
              defaultValue={initialValues?.priority ?? "normal"}
            >
              {CASE_PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {PRIORITY_LABELS[priority]}
                </option>
              ))}
            </Select>
            <FieldError errors={errors?.priority} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ownerId">Owner</Label>
            <Select
              id="ownerId"
              name="ownerId"
              defaultValue={initialValues?.ownerId ?? ""}
            >
              <option value="">Unassigned</option>
              {owners.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </Select>
            <FieldError errors={errors?.ownerId} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="queueKey">Queue</Label>
            <Select id="queueKey" name="queueKey" defaultValue={queueDefault}>
              <option value="">Auto assign</option>
              {CASE_QUEUE_KEYS.map((queueKey) => (
                <option key={queueKey} value={queueKey}>
                  {QUEUE_LABELS[queueKey]}
                </option>
              ))}
            </Select>
            <FieldError errors={errors?.queueKey} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="accountId">Account</Label>
            <Select
              id="accountId"
              name="accountId"
              defaultValue={initialValues?.accountId ?? ""}
            >
              <option value="">No account</option>
              {accounts.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </Select>
            <FieldError errors={errors?.accountId} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactId">Contact</Label>
            <Select
              id="contactId"
              name="contactId"
              defaultValue={initialValues?.contactId ?? ""}
            >
              <option value="">No contact</option>
              {contacts.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </Select>
            <FieldError errors={errors?.contactId} />
          </div>
          <div className="flex items-end justify-end gap-3 md:col-span-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : submitLabel}
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
