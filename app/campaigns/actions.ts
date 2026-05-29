"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod/v4";
import { actionErrorResult, type ActionResult } from "@/lib/action-result";
import {
  completeCampaign,
  createCampaign,
  deleteCampaign,
  updateCampaign
} from "@/lib/crm/crmClient";
import { CAMPAIGN_STATUSES } from "@/lib/crm/registry";
import {
  addCampaignMembers,
  removeCampaignMembers,
  type CampaignMemberType
} from "@/lib/services/campaignMembers";
import {
  campaignCreateSchema,
  campaignUpdateSchema,
  idSchema
} from "@/lib/validation";

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

function failureFrom(error: unknown, action: string): ActionResult {
  if (error instanceof z.ZodError) {
    return {
      ok: false,
      message: "Check the highlighted fields.",
      fieldErrors: error.flatten().fieldErrors
    };
  }

  return actionErrorResult(error, {
    action,
    entity: "campaign",
    fallbackMessage: "The campaign could not be saved."
  });
}

function memberFailureFrom(error: unknown, action: string): ActionResult {
  if (error instanceof z.ZodError) {
    return {
      ok: false,
      message: "Select a valid campaign member.",
      fieldErrors: error.flatten().fieldErrors
    };
  }

  return actionErrorResult(error, {
    action,
    entity: "campaignMember",
    fallbackMessage: "Campaign members could not be updated."
  });
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

function isCampaignMemberType(value: string): value is CampaignMemberType {
  return value === "contact" || value === "lead";
}

function parseCampaignMemberValue(
  value: string
): { memberType: CampaignMemberType; memberId: string } | null {
  const separatorIndex = value.indexOf(":");
  if (separatorIndex <= 0) {
    return null;
  }

  const memberType = value.slice(0, separatorIndex);
  const parsedMemberId = idSchema.safeParse(value.slice(separatorIndex + 1));
  if (!isCampaignMemberType(memberType) || !parsedMemberId.success) {
    return null;
  }

  return {
    memberId: parsedMemberId.data,
    memberType
  };
}

export async function createCampaignAction(
  formData: FormData
): Promise<ActionResult> {
  const parsed = campaignCreateSchema.safeParse(
    normalizeBudget(buildRawInput(formData))
  );

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
    return failureFrom(error, "createCampaign");
  }
}

export async function updateCampaignAction(
  campaignId: string,
  formData: FormData
): Promise<ActionResult> {
  const parsed = campaignUpdateSchema.safeParse(
    normalizeBudget(buildRawInput(formData))
  );

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
    return failureFrom(error, "updateCampaign");
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
    return failureFrom(error, "updateCampaignStatus");
  }
}

export async function deleteCampaignAction(
  campaignId: string
): Promise<ActionResult> {
  try {
    await deleteCampaign(campaignId);
    revalidateAll();
    return { ok: true, message: "Campaign deleted." };
  } catch (error) {
    return failureFrom(error, "deleteCampaign");
  }
}

export async function addCampaignMemberAction(
  campaignId: string,
  memberValue: string
): Promise<ActionResult> {
  const parsedCampaignId = idSchema.safeParse(campaignId);
  const memberReference = parseCampaignMemberValue(memberValue);

  if (!parsedCampaignId.success || !memberReference) {
    return { ok: false, message: "Select a valid campaign member." };
  }

  try {
    await addCampaignMembers({
      campaignId: parsedCampaignId.data,
      contactIds:
        memberReference.memberType === "contact"
          ? [memberReference.memberId]
          : [],
      leadIds:
        memberReference.memberType === "lead" ? [memberReference.memberId] : []
    });
    revalidateAll();
    return { ok: true, message: "Campaign member added." };
  } catch (error) {
    return memberFailureFrom(error, "addCampaignMember");
  }
}

export async function removeCampaignMemberAction(
  campaignId: string,
  memberType: string,
  memberId: string
): Promise<ActionResult> {
  const parsedCampaignId = idSchema.safeParse(campaignId);
  const parsedMemberId = idSchema.safeParse(memberId);

  if (
    !parsedCampaignId.success ||
    !parsedMemberId.success ||
    !isCampaignMemberType(memberType)
  ) {
    return { ok: false, message: "Select a valid campaign member." };
  }

  try {
    await removeCampaignMembers({
      campaignId: parsedCampaignId.data,
      contactIds: memberType === "contact" ? [parsedMemberId.data] : [],
      leadIds: memberType === "lead" ? [parsedMemberId.data] : []
    });
    revalidateAll();
    return { ok: true, message: "Campaign member removed." };
  } catch (error) {
    return memberFailureFrom(error, "removeCampaignMember");
  }
}
