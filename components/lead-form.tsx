"use client";

import { type FormEvent, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createLeadAction } from "@/app/leads/actions";
import type { ActionResult } from "@/lib/action-result";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PostalCodeInput } from "@/components/postal-code-input";
import { useToast } from "@/components/ui/toast";

export function LeadForm() {
  const router = useRouter();
  const { showToast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);
  const [postalCode, setPostalCode] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(() => {
      void (async () => {
        const actionResult = await createLeadAction(formData);
        setResult(actionResult);
        showToast({
          title: actionResult.ok ? "Lead saved" : "Lead not saved",
          description: actionResult.message,
          variant: actionResult.ok ? "success" : "error"
        });

        if (actionResult.ok) {
          formRef.current?.reset();
          setPostalCode("");
          router.refresh();
        }
      })();
    });
  }

  const errors = result && !result.ok ? result.fieldErrors : undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Lead</CardTitle>
      </CardHeader>
      <CardContent>
        <form ref={formRef} onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="firstName">First name</Label>
            <Input id="firstName" name="firstName" required />
            <FieldError errors={errors?.firstName} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last name</Label>
            <Input id="lastName" name="lastName" required />
            <FieldError errors={errors?.lastName} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" />
            <FieldError errors={errors?.phone} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" />
            <FieldError errors={errors?.email} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="postalCode">Postal code</Label>
            <PostalCodeInput
              value={postalCode}
              onChange={setPostalCode}
              country="CA"
              error={errors?.postalCode?.[0]}
              testid="lead-form-postal-input"
              name="postalCode"
              id="postalCode"
              placeholder="V5K 0A1"
              required={false}
            />
            <FieldError errors={errors?.postalCode} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="province">Province</Label>
            <Input id="province" name="province" placeholder="BC" />
            <FieldError errors={errors?.province} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="source">Source</Label>
            <Input id="source" name="source" placeholder="dealer_site" />
            <FieldError errors={errors?.source} />
          </div>
          <div className="flex justify-end md:col-span-2">
            <Button type="submit" disabled={isPending} data-testid="lead-form-submit">
              {isPending ? "Routing..." : "Create lead"}
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
