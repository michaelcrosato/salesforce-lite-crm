"use client";

import { type FormEvent, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createContactAction,
  updateContactAction
} from "@/app/contacts/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import type { ActionResult } from "@/lib/action-result";
import { CONTACT_STATUSES, CONTACT_STATUS_LABELS } from "@/lib/crm-constants";

export type AccountOption = {
  id: string;
  name: string;
};

export type ContactFormInitialValues = {
  id?: string;
  accountId?: string | null;
  firstName?: string;
  lastName?: string;
  email?: string | null;
  phone?: string | null;
  title?: string | null;
  status?: string;
};

export function ContactForm({
  accounts,
  initialValues,
  title,
  submitLabel
}: {
  accounts: AccountOption[];
  initialValues?: ContactFormInitialValues;
  title: string;
  submitLabel: string;
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
          ? await updateContactAction(initialValues.id, formData)
          : await createContactAction(formData);
        setResult(actionResult);
        showToast({
          title: actionResult.ok ? "Contact saved" : "Contact not saved",
          description: actionResult.message,
          variant: actionResult.ok ? "success" : "error"
        });

        if (actionResult.ok) {
          if (!initialValues?.id) {
            formRef.current?.reset();
          }
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
          <div className="space-y-2">
            <Label htmlFor="firstName">First name</Label>
            <Input
              id="firstName"
              name="firstName"
              defaultValue={initialValues?.firstName ?? ""}
              required
            />
            <FieldError errors={errors?.firstName} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last name</Label>
            <Input
              id="lastName"
              name="lastName"
              defaultValue={initialValues?.lastName ?? ""}
              required
            />
            <FieldError errors={errors?.lastName} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="accountId">Account</Label>
            <Select
              id="accountId"
              name="accountId"
              defaultValue={initialValues?.accountId ?? ""}
            >
              <option value="">No account</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </Select>
            <FieldError errors={errors?.accountId} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              defaultValue={initialValues?.title ?? ""}
            />
            <FieldError errors={errors?.title} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={initialValues?.email ?? ""}
            />
            <FieldError errors={errors?.email} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              name="phone"
              defaultValue={initialValues?.phone ?? ""}
            />
            <FieldError errors={errors?.phone} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              id="status"
              name="status"
              defaultValue={initialValues?.status ?? "active"}
            >
              {CONTACT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {CONTACT_STATUS_LABELS[status]}
                </option>
              ))}
            </Select>
            <FieldError errors={errors?.status} />
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
