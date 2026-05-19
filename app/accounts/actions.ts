"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/action-result";
import { prisma } from "@/lib/prisma";
import { accountFormSchema } from "@/lib/validation";

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function fieldErrors(error: {
  flatten: () => { fieldErrors: Record<string, string[] | undefined> };
}) {
  return error.flatten().fieldErrors;
}

export async function createAccountAction(
  formData: FormData
): Promise<ActionResult> {
  const parsed = accountFormSchema.safeParse({
    name: formValue(formData, "name"),
    domain: formValue(formData, "domain"),
    industry: formValue(formData, "industry"),
    city: formValue(formData, "city"),
    region: formValue(formData, "region"),
    status: formValue(formData, "status"),
    ownerId: formValue(formData, "ownerId"),
    healthScore: formValue(formData, "healthScore")
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Check the highlighted fields.",
      fieldErrors: fieldErrors(parsed.error)
    };
  }

  await prisma.account.create({
    data: {
      name: parsed.data.name,
      domain: parsed.data.domain ?? null,
      industry: parsed.data.industry ?? null,
      city: parsed.data.city ?? null,
      region: parsed.data.region ?? null,
      status: parsed.data.status,
      ownerId: parsed.data.ownerId ?? null,
      healthScore: parsed.data.healthScore
    }
  });

  revalidatePath("/accounts");
  revalidatePath("/dashboard");

  return {
    ok: true,
    message: `Account created: ${parsed.data.name}.`
  };
}

export async function updateAccountAction(
  accountId: string,
  formData: FormData
): Promise<ActionResult> {
  const parsed = accountFormSchema.safeParse({
    name: formValue(formData, "name"),
    domain: formValue(formData, "domain"),
    industry: formValue(formData, "industry"),
    city: formValue(formData, "city"),
    region: formValue(formData, "region"),
    status: formValue(formData, "status"),
    ownerId: formValue(formData, "ownerId"),
    healthScore: formValue(formData, "healthScore")
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Check the highlighted fields.",
      fieldErrors: fieldErrors(parsed.error)
    };
  }

  await prisma.account.update({
    where: {
      id: accountId
    },
    data: {
      name: parsed.data.name,
      domain: parsed.data.domain ?? null,
      industry: parsed.data.industry ?? null,
      city: parsed.data.city ?? null,
      region: parsed.data.region ?? null,
      status: parsed.data.status,
      ownerId: parsed.data.ownerId ?? null,
      healthScore: parsed.data.healthScore
    }
  });

  revalidatePath("/accounts");
  revalidatePath(`/accounts/${accountId}`);
  revalidatePath("/dashboard");

  return {
    ok: true,
    message: `Account updated: ${parsed.data.name}.`
  };
}
