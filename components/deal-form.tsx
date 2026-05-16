"use client";

import { type FormEvent, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createDealAction, updateDealAction } from "@/app/deals/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import type { ActionResult } from "@/lib/action-result";
import { probabilityForStage } from "@/lib/business/deals";
import { DEAL_STAGES, STAGE_LABELS, type DealStage } from "@/lib/crm-constants";

export type DealAccountOption = {
  id: string;
  name: string;
};

export type DealContactOption = {
  id: string;
  accountId: string | null;
  firstName: string;
  lastName: string;
};

export type DealOwnerOption = {
  id: string;
  name: string;
};

export type DealFormInitialValues = {
  id?: string;
  accountId?: string | null;
  contactId?: string | null;
  ownerId?: string | null;
  name?: string;
  stage?: string;
  value?: number;
  probability?: number;
  expectedCloseDate?: string | null;
};

export function DealForm({
  accounts,
  contacts,
  owners,
  initialValues,
  title,
  submitLabel,
  onSaved
}: {
  accounts: DealAccountOption[];
  contacts: DealContactOption[];
  owners: DealOwnerOption[];
  initialValues?: DealFormInitialValues;
  title: string;
  submitLabel: string;
  onSaved?: () => void;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState(initialValues?.accountId ?? "");
  const [selectedStage, setSelectedStage] = useState<DealStage>(
    (initialValues?.stage as DealStage | undefined) ?? "new"
  );
  const [probability, setProbability] = useState(
    initialValues?.probability ?? probabilityForStage(selectedStage)
  );

  const filteredContacts = useMemo(() => {
    if (!selectedAccountId) {
      return contacts;
    }

    return contacts.filter((contact) => contact.accountId === selectedAccountId);
  }, [contacts, selectedAccountId]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(() => {
      void (async () => {
        const actionResult = initialValues?.id
          ? await updateDealAction(initialValues.id, formData)
          : await createDealAction(formData);
        setResult(actionResult);
        showToast({
          title: actionResult.ok ? "Deal saved" : "Deal not saved",
          description: actionResult.message,
          variant: actionResult.ok ? "success" : "error"
        });

        if (actionResult.ok) {
          if (!initialValues?.id) {
            formRef.current?.reset();
          }
          onSaved?.();
          router.refresh();
          if (!initialValues?.id) {
            router.push("/deals");
          }
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
            <Label htmlFor="name">Deal name</Label>
            <Input id="name" name="name" defaultValue={initialValues?.name ?? ""} required />
            <FieldError errors={errors?.name} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="stage">Stage</Label>
            <Select
              id="stage"
              name="stage"
              value={selectedStage}
              onChange={(event) => {
                const stage = event.currentTarget.value as DealStage;
                setSelectedStage(stage);
                setProbability(probabilityForStage(stage));
              }}
            >
              {DEAL_STAGES.map((stage) => (
                <option key={stage} value={stage}>
                  {STAGE_LABELS[stage]}
                </option>
              ))}
            </Select>
            <FieldError errors={errors?.stage} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="probability">Probability</Label>
            <Input
              id="probability"
              name="probability"
              type="number"
              min={0}
              max={100}
              value={probability}
              onChange={(event) => setProbability(Number(event.currentTarget.value))}
            />
            <FieldError errors={errors?.probability} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="value">Value</Label>
            <Input
              id="value"
              name="value"
              type="number"
              min={0}
              defaultValue={initialValues?.value ?? 0}
              required
            />
            <FieldError errors={errors?.value} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="expectedCloseDate">Expected close date</Label>
            <Input
              id="expectedCloseDate"
              name="expectedCloseDate"
              type="date"
              defaultValue={toDateInputValue(initialValues?.expectedCloseDate)}
            />
            <FieldError errors={errors?.expectedCloseDate} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="accountId">Account</Label>
            <Select
              id="accountId"
              name="accountId"
              value={selectedAccountId}
              onChange={(event) => setSelectedAccountId(event.currentTarget.value)}
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
            <Label htmlFor="contactId">Contact</Label>
            <Select id="contactId" name="contactId" defaultValue={initialValues?.contactId ?? ""}>
              <option value="">No contact</option>
              {filteredContacts.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.firstName} {contact.lastName}
                </option>
              ))}
            </Select>
            <FieldError errors={errors?.contactId} />
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
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : submitLabel}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function toDateInputValue(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  return value.slice(0, 10);
}

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) {
    return null;
  }

  return <p className="text-xs text-destructive">{errors[0]}</p>;
}
