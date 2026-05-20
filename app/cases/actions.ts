"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/lib/action-result";
import {
  createCase,
  deleteCase,
  resolveCase,
  updateCase
} from "@/lib/crm/crmClient";
import { CASE_STATUSES } from "@/lib/crm/registry";
import { caseCreateSchema, caseUpdateSchema } from "@/lib/validation";

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function buildRawInput(formData: FormData) {
  return {
    subject: formString(formData, "subject"),
    description: formString(formData, "description"),
    status: formString(formData, "status"),
    priority: formString(formData, "priority"),
    ownerId: formString(formData, "ownerId"),
    accountId: formString(formData, "accountId"),
    contactId: formString(formData, "contactId")
  };
}

function failureFrom(error: unknown): ActionResult {
  if (error instanceof z.ZodError) {
    return {
      ok: false,
      message: "Check the highlighted fields.",
      fieldErrors: error.flatten().fieldErrors
    };
  }

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return {
      ok: false,
      message: "A record with that unique value already exists."
    };
  }

  return { ok: false, message: "The case could not be saved." };
}

function revalidateAll(): void {
  revalidatePath("/cases");
  revalidatePath("/dashboard");
}

export async function createCaseAction(
  formData: FormData
): Promise<ActionResult> {
  const parsed = caseCreateSchema.safeParse(buildRawInput(formData));

  if (!parsed.success) {
    return {
      ok: false,
      message: "Check the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors
    };
  }

  try {
    await createCase(parsed.data);
    revalidateAll();
    return { ok: true, message: "Case created." };
  } catch (error) {
    return failureFrom(error);
  }
}

export async function updateCaseAction(
  caseId: string,
  formData: FormData
): Promise<ActionResult> {
  const parsed = caseUpdateSchema.safeParse(buildRawInput(formData));

  if (!parsed.success) {
    return {
      ok: false,
      message: "Check the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors
    };
  }

  try {
    await updateCase(caseId, parsed.data);
    revalidateAll();
    return { ok: true, message: "Case updated." };
  } catch (error) {
    return failureFrom(error);
  }
}

const statusSchema = z.enum(CASE_STATUSES);

export async function updateCaseStatusAction(
  caseId: string,
  status: string
): Promise<ActionResult> {
  const parsed = statusSchema.safeParse(status);

  if (!parsed.success) {
    return { ok: false, message: "Invalid status." };
  }

  try {
    if (parsed.data === "resolved") {
      await resolveCase(caseId);
    } else {
      await updateCase(caseId, { status: parsed.data });
    }
    revalidateAll();
    return { ok: true, message: "Case status updated." };
  } catch (error) {
    return failureFrom(error);
  }
}

export async function deleteCaseAction(caseId: string): Promise<ActionResult> {
  try {
    await deleteCase(caseId);
    revalidateAll();
    return { ok: true, message: "Case deleted." };
  } catch (error) {
    return failureFrom(error);
  }
}
