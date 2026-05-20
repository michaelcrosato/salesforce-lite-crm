"use client";

import { type FormEvent, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createAccountAction, updateAccountAction } from "@/app/accounts/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import type { ActionResult } from "@/lib/action-result";
import { ACCOUNT_STATUSES, ACCOUNT_STATUS_LABELS } from "@/lib/crm-constants";

export type AccountOwnerOption = {
  id: string;
  name: string;
};

export type AccountFormInitialValues = {
  id?: string;
  name?: string;
  domain?: string | null;
  industry?: string | null;
  city?: string | null;
  region?: string | null;
  status?: string;
  ownerId?: string | null;
  healthScore?: number;
};

export function AccountForm({
  owners,
  initialValues,
  title,
  submitLabel,
  onSaved
}: {
  owners: AccountOwnerOption[];
  initialValues?: AccountFormInitialValues;
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
          ? await updateAccountAction(initialValues.id, formData)
          : await createAccountAction(formData);
        setResult(actionResult);
        showToast({
          title: actionResult.ok ? "Account saved" : "Account not saved",
          description: actionResult.message,
          variant: actionResult.ok ? "success" : "error"
        });

        if (actionResult.ok) {
          if (!initialValues?.id) {
            formRef.current?.reset();
            router.push("/accounts");
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
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" defaultValue={initialValues?.name ?? ""} required />
            <FieldError errors={errors?.name} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="domain">Domain</Label>
            <Input id="domain" name="domain" defaultValue={initialValues?.domain ?? ""} />
            <FieldError errors={errors?.domain} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="industry">Industry</Label>
            <Input id="industry" name="industry" defaultValue={initialValues?.industry ?? ""} />
            <FieldError errors={errors?.industry} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input id="city" name="city" defaultValue={initialValues?.city ?? ""} />
            <FieldError errors={errors?.city} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="region">Region</Label>
            <Input id="region" name="region" defaultValue={initialValues?.region ?? ""} />
            <FieldError errors={errors?.region} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select id="status" name="status" defaultValue={initialValues?.status ?? "active"}>
              {ACCOUNT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {ACCOUNT_STATUS_LABELS[status]}
                </option>
              ))}
            </Select>
            <FieldError errors={errors?.status} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="healthScore">Health score</Label>
            <Input
              id="healthScore"
              name="healthScore"
              type="number"
              min={0}
              max={100}
              defaultValue={initialValues?.healthScore ?? 80}
            />
            <FieldError errors={errors?.healthScore} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="ownerId">Owner</Label>
            <Select id="ownerId" name="ownerId" defaultValue={initialValues?.ownerId ?? ""}>
              <option value="">Unassigned</option>
              {owners.map((owner) => (
                <option key={owner.id} value={owner.id}>
                  {owner.name}
                </option>
              ))}
            </Select>
            <FieldError errors={errors?.ownerId} />
          </div>
          <div className="flex items-center justify-end gap-3 md:col-span-2">
            <Button type="submit" loading={isPending}>
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
