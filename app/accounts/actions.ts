"use server";

import { revalidatePath, updateTag } from "next/cache";
import { actionErrorResult, type ActionResult } from "@/lib/action-result";
import { prisma } from "@/lib/prisma";
import { accountFormSchema } from "@/lib/validation";
import { buildAuditEventCreateData, type AuditMetadataValue } from "@/lib/services/auditEvents";
import { getCurrentUserId } from "@/lib/session";
import type { Account } from "@prisma/client";

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function fieldErrors(error: {
  flatten: () => { fieldErrors: Record<string, string[] | undefined> };
}) {
  return error.flatten().fieldErrors;
}

function accountAuditMetadata(account: Account): Record<string, AuditMetadataValue> {
  return {
    name: account.name,
    domain: account.domain,
    industry: account.industry,
    city: account.city,
    region: account.region,
    status: account.status,
    ownerId: account.ownerId,
    healthScore: account.healthScore
  };
}

function auditChangedFields(input: object): string[] {
  return Object.keys(input).sort();
}

export async function createAccountAction(formData: FormData): Promise<ActionResult> {
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

  try {
    await prisma.$transaction(async (tx) => {
      const account = await tx.account.create({
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

      await tx.auditEvent.create({
        data: buildAuditEventCreateData({
          category: "record",
          action: "created",
          actorUserId: await getCurrentUserId(),
          entityType: "account",
          entityId: account.id,
          summary: `Account created: ${account.name}.`,
          metadata: accountAuditMetadata(account)
        })
      });
    });
  } catch (error) {
    return actionErrorResult(error, {
      action: "createAccount",
      entity: "account",
      fallbackMessage: "The account could not be saved."
    });
  }

  updateTag("accounts");
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

  try {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.account.findUniqueOrThrow({
        where: { id: accountId }
      });

      const account = await tx.account.update({
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

      const statusChanged = existing.status !== account.status;

      await tx.auditEvent.create({
        data: buildAuditEventCreateData({
          category: "record",
          action: statusChanged ? "status_changed" : "updated",
          actorUserId: await getCurrentUserId(),
          entityType: "account",
          entityId: account.id,
          summary: statusChanged
            ? `Account status changed from ${existing.status} to ${account.status}.`
            : `Account updated: ${account.name}.`,
          metadata: {
            ...accountAuditMetadata(account),
            changedFields: auditChangedFields(parsed.data),
            previousStatus: statusChanged ? existing.status : null
          }
        })
      });
    });
  } catch (error) {
    return actionErrorResult(error, {
      action: "updateAccount",
      entity: "account",
      fallbackMessage: "The account could not be saved."
    });
  }

  updateTag("accounts");
  revalidatePath("/accounts");
  revalidatePath(`/accounts/${accountId}`);
  revalidatePath("/dashboard");

  return {
    ok: true,
    message: `Account updated: ${parsed.data.name}.`
  };
}
