"use client";

import { type FormEvent, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addContactNoteAction } from "@/app/contacts/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ActionResult } from "@/lib/action-result";

export type NoteDealOption = {
  id: string;
  name: string;
};

export function AddNoteForm({
  contactId,
  deals
}: {
  contactId: string;
  deals: NoteDealOption[];
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(() => {
      void (async () => {
        const actionResult = await addContactNoteAction(formData);
        setResult(actionResult);

        if (actionResult.ok) {
          formRef.current?.reset();
          router.refresh();
        }
      })();
    });
  }

  const errors = result && !result.ok ? result.fieldErrors : undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Note</CardTitle>
      </CardHeader>
      <CardContent>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          <input type="hidden" name="contactId" value={contactId} />
          <div className="space-y-2">
            <Label htmlFor="dealId">Linked deal</Label>
            <Select id="dealId" name="dealId">
              <option value="">No linked deal</option>
              {deals.map((deal) => (
                <option key={deal.id} value={deal.id}>
                  {deal.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="rawText">Raw note</Label>
            <Textarea
              id="rawText"
              name="rawText"
              placeholder="Follow up next week about pricing and decision maker."
              required
            />
            {errors?.rawText?.length ? (
              <p className="text-xs text-destructive">{errors.rawText[0]}</p>
            ) : null}
          </div>
          <div className="flex items-center justify-between gap-3">
            <p
              className={
                result?.ok
                  ? "text-sm text-emerald-700"
                  : "text-sm text-destructive"
              }
            >
              {result?.message}
            </p>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Summarizing..." : "Save note"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
