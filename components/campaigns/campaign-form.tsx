"use client";

import { type FormEvent, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createCampaignAction,
  updateCampaignAction
} from "@/app/campaigns/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import type { ActionResult } from "@/lib/action-result";
import { CAMPAIGN_STATUSES, type CampaignStatus } from "@/lib/crm/registry";

export type CampaignOptionItem = {
  id: string;
  label: string;
};

export type CampaignFormInitialValues = {
  id?: string;
  name?: string;
  description?: string | null;
  status?: CampaignStatus;
  startDate?: string | null;
  endDate?: string | null;
  budget?: number | null;
  ownerId?: string | null;
};

const STATUS_LABELS: Record<CampaignStatus, string> = {
  planned: "Planned",
  active: "Active",
  completed: "Completed",
  cancelled: "Cancelled"
};

export function CampaignForm({
  owners,
  initialValues,
  title,
  submitLabel,
  onSaved
}: {
  owners: CampaignOptionItem[];
  initialValues?: CampaignFormInitialValues;
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
          ? await updateCampaignAction(initialValues.id, formData)
          : await createCampaignAction(formData);
        setResult(actionResult);
        showToast({
          title: actionResult.ok ? "Campaign saved" : "Campaign not saved",
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
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="grid gap-4 md:grid-cols-2"
        >
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              defaultValue={initialValues?.name ?? ""}
              required
            />
            <FieldError errors={errors?.name} />
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
              defaultValue={initialValues?.status ?? "planned"}
            >
              {CAMPAIGN_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABELS[status]}
                </option>
              ))}
            </Select>
            <FieldError errors={errors?.status} />
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
            <Label htmlFor="startDate">Start date</Label>
            <Input
              id="startDate"
              name="startDate"
              type="date"
              defaultValue={toDateInput(initialValues?.startDate)}
            />
            <FieldError errors={errors?.startDate} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate">End date</Label>
            <Input
              id="endDate"
              name="endDate"
              type="date"
              defaultValue={toDateInput(initialValues?.endDate)}
            />
            <FieldError errors={errors?.endDate} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="budget">Budget (USD)</Label>
            <Input
              id="budget"
              name="budget"
              type="number"
              min={0}
              step={1}
              defaultValue={initialValues?.budget ?? ""}
            />
            <FieldError errors={errors?.budget} />
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
