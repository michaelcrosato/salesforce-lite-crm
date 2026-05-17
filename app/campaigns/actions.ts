"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/lib/action-result";
import {
  completeCampaign,
  createCampaign,
  deleteCampaign,
  updateCampaign
} from "@/lib/crm/crmClient";
import { CAMPAIGN_STATUSES } from "@/lib/crm/registry";
import { campaignCreateSchema, campaignUpdateSchema } from "@/lib/validation";

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function buildRawInput(formData: FormData) {
  return {
    name: formString(formData, "name"),
    description: formString(formData, "description"),
    status: formString(formData, "status"),
    startDate: formString(formData, "startDate"),
    endDate: formString(formData, "endDate"),
    budget: formString(formData, "budget"),
    ownerId: formString(formData, "ownerId")
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

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return { ok: false, message: "A record with that unique value already exists." };
  }

  return { ok: false, message: "The campaign could not be saved." };
}

function revalidateAll(): void {
  revalidatePath("/campaigns");
  revalidatePath("/dashboard");
}

function normalizeBudget(input: ReturnType<typeof buildRawInput>) {
  const next: Record<string, string | undefined> = { ...input };
  if (!next.budget?.trim()) {
    delete next.budget;
  }
  return next;
}

export async function createCampaignAction(formData: FormData): Promise<ActionResult> {
  const parsed = campaignCreateSchema.safeParse(normalizeBudget(buildRawInput(formData)));

  if (!parsed.success) {
    return {
      ok: false,
      message: "Check the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors
    };
  }

  try {
    await createCampaign(parsed.data);
    revalidateAll();
    return { ok: true, message: "Campaign created." };
  } catch (error) {
    return failureFrom(error);
  }
}

export async function updateCampaignAction(
  campaignId: string,
  formData: FormData
): Promise<ActionResult> {
  const parsed = campaignUpdateSchema.safeParse(normalizeBudget(buildRawInput(formData)));

  if (!parsed.success) {
    return {
      ok: false,
      message: "Check the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors
    };
  }

  try {
    await updateCampaign(campaignId, parsed.data);
    revalidateAll();
    return { ok: true, message: "Campaign updated." };
  } catch (error) {
    return failureFrom(error);
  }
}

const statusSchema = z.enum(CAMPAIGN_STATUSES);

export async function updateCampaignStatusAction(
  campaignId: string,
  status: string
): Promise<ActionResult> {
  const parsed = statusSchema.safeParse(status);

  if (!parsed.success) {
    return { ok: false, message: "Invalid status." };
  }

  try {
    if (parsed.data === "completed") {
      await completeCampaign(campaignId);
    } else {
      await updateCampaign(campaignId, { status: parsed.data });
    }
    revalidateAll();
    return { ok: true, message: "Campaign status updated." };
  } catch (error) {
    return failureFrom(error);
  }
}

export async function deleteCampaignAction(campaignId: string): Promise<ActionResult> {
  try {
    await deleteCampaign(campaignId);
    revalidateAll();
    return { ok: true, message: "Campaign deleted." };
  } catch (error) {
    return failureFrom(error);
  }
}
