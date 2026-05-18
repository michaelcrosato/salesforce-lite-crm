"use client";

import { type FormEvent, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createTaskAction, updateTaskAction } from "@/app/tasks/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import type { ActionResult } from "@/lib/action-result";
import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  type TaskPriority,
  type TaskStatus
} from "@/lib/crm/registry";

export type TaskOptionItem = {
  id: string;
  label: string;
};

export type TaskFormInitialValues = {
  id?: string;
  title?: string;
  description?: string | null;
  dueDate?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  ownerId?: string | null;
  accountId?: string | null;
  contactId?: string | null;
  dealId?: string | null;
  leadId?: string | null;
};

const STATUS_LABELS: Record<TaskStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  done: "Done",
  cancelled: "Cancelled"
};

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Low",
  normal: "Normal",
  high: "High",
  urgent: "Urgent"
};

export function TaskForm({
  owners,
  accounts,
  contacts,
  deals,
  leads,
  initialValues,
  title,
  submitLabel,
  onSaved
}: {
  owners: TaskOptionItem[];
  accounts: TaskOptionItem[];
  contacts: TaskOptionItem[];
  deals: TaskOptionItem[];
  leads: TaskOptionItem[];
  initialValues?: TaskFormInitialValues;
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
          ? await updateTaskAction(initialValues.id, formData)
          : await createTaskAction(formData);
        setResult(actionResult);
        showToast({
          title: actionResult.ok ? "Task saved" : "Task not saved",
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <form ref={formRef} onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              defaultValue={initialValues?.title ?? ""}
              required
            />
            <FieldError errors={errors?.title} />
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
            <Label htmlFor="dueDate">Due date</Label>
            <Input
              id="dueDate"
              name="dueDate"
              type="date"
              defaultValue={toDateInput(initialValues?.dueDate)}
            />
            <FieldError errors={errors?.dueDate} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              id="status"
              name="status"
              defaultValue={initialValues?.status ?? "open"}
            >
              {TASK_STATUSES.map((status) => (
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
              {TASK_PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {PRIORITY_LABELS[priority]}
                </option>
              ))}
            </Select>
            <FieldError errors={errors?.priority} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ownerId">Owner</Label>
            <Select id="ownerId" name="ownerId" defaultValue={initialValues?.ownerId ?? ""}>
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
          <div className="space-y-2">
            <Label htmlFor="dealId">Deal</Label>
            <Select id="dealId" name="dealId" defaultValue={initialValues?.dealId ?? ""}>
              <option value="">No deal</option>
              {deals.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </Select>
            <FieldError errors={errors?.dealId} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="leadId">Lead</Label>
            <Select id="leadId" name="leadId" defaultValue={initialValues?.leadId ?? ""}>
              <option value="">No lead</option>
              {leads.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </Select>
            <FieldError errors={errors?.leadId} />
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

function toDateInput(value?: string | null): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) {
    return null;
  }

  return <p className="text-xs text-destructive">{errors[0]}</p>;
}
