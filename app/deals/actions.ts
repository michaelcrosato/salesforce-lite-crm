"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/action-result";
import { probabilityForStage } from "@/lib/business/deals";
import { STAGE_LABELS } from "@/lib/crm-constants";
import { prisma } from "@/lib/prisma";
import { dealFormSchema, dealMoveSchema } from "@/lib/validation";

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function fieldErrors(error: {
  flatten: () => { fieldErrors: Record<string, string[] | undefined> };
}) {
  return error.flatten().fieldErrors;
}

function closeDateFromForm(value: string | undefined) {
  return value ? new Date(`${value}T12:00:00`) : null;
}

export async function createDealAction(formData: FormData): Promise<ActionResult> {
  const parsed = dealFormSchema.safeParse({
    accountId: formValue(formData, "accountId"),
    contactId: formValue(formData, "contactId"),
    ownerId: formValue(formData, "ownerId"),
    name: formValue(formData, "name"),
    stage: formValue(formData, "stage"),
    value: formValue(formData, "value"),
    probability: formValue(formData, "probability"),
    expectedCloseDate: formValue(formData, "expectedCloseDate")
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Check the highlighted fields.",
      fieldErrors: fieldErrors(parsed.error)
    };
  }

  const now = new Date();
  await prisma.deal.create({
    data: {
      accountId: parsed.data.accountId ?? null,
      contactId: parsed.data.contactId ?? null,
      ownerId: parsed.data.ownerId ?? null,
      name: parsed.data.name,
      stage: parsed.data.stage,
      value: parsed.data.value,
      probability: parsed.data.probability,
      expectedCloseDate: closeDateFromForm(parsed.data.expectedCloseDate),
      lastActivityAt: now,
      activities: {
        create: {
          accountId: parsed.data.accountId ?? null,
          contactId: parsed.data.contactId ?? null,
          userId: parsed.data.ownerId ?? null,
          type: "status_change",
          title: `${parsed.data.name} created in ${STAGE_LABELS[parsed.data.stage]}`,
          summary: `Deal created in ${parsed.data.stage}.`,
          nextStep:
            parsed.data.stage === "won" || parsed.data.stage === "lost"
              ? "Review closed deal outcome."
              : "Confirm next action for the new stage.",
          createdAt: now
        }
      }
    },
  });

  revalidatePath("/deals");
  revalidatePath("/dashboard");
  revalidatePath("/activities");

  return {
    ok: true,
    message: `Deal created: ${parsed.data.name}.`
  };
}

export async function updateDealAction(
  dealId: string,
  formData: FormData
): Promise<ActionResult> {
  const parsed = dealFormSchema.safeParse({
    accountId: formValue(formData, "accountId"),
    contactId: formValue(formData, "contactId"),
    ownerId: formValue(formData, "ownerId"),
    name: formValue(formData, "name"),
    stage: formValue(formData, "stage"),
    value: formValue(formData, "value"),
    probability: formValue(formData, "probability"),
    expectedCloseDate: formValue(formData, "expectedCloseDate")
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Check the highlighted fields.",
      fieldErrors: fieldErrors(parsed.error)
    };
  }

  const existing = await prisma.deal.findUnique({
    where: {
      id: dealId
    }
  });

  if (!existing) {
    return {
      ok: false,
      message: "Deal was not found."
    };
  }

  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.deal.update({
      where: {
        id: dealId
      },
      data: {
        accountId: parsed.data.accountId ?? null,
        contactId: parsed.data.contactId ?? null,
        ownerId: parsed.data.ownerId ?? null,
        name: parsed.data.name,
        stage: parsed.data.stage,
        value: parsed.data.value,
        probability: parsed.data.probability,
        expectedCloseDate: closeDateFromForm(parsed.data.expectedCloseDate),
        lastActivityAt: existing.stage === parsed.data.stage ? existing.lastActivityAt : now
      }
    });

    if (existing.stage !== parsed.data.stage) {
      await tx.activity.create({
        data: {
          accountId: parsed.data.accountId ?? null,
          contactId: parsed.data.contactId ?? null,
          dealId,
          userId: parsed.data.ownerId ?? null,
          type: "status_change",
          title: `${parsed.data.name} moved to ${STAGE_LABELS[parsed.data.stage]}`,
          summary: `Stage changed from ${existing.stage} to ${parsed.data.stage}.`,
          nextStep:
            parsed.data.stage === "won" || parsed.data.stage === "lost"
              ? "Review closed deal outcome."
              : "Confirm next action for the new stage.",
          createdAt: now
        }
      });
    }
  });

  revalidatePath("/deals");
  revalidatePath("/dashboard");
  revalidatePath("/activities");

  return {
    ok: true,
    message: `Deal updated: ${parsed.data.name}.`
  };
}

export async function moveDealAction(input: {
  dealId: string;
  stage: string;
}): Promise<ActionResult> {
  const parsed = dealMoveSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: "The selected stage is not valid."
    };
  }

  const deal = await prisma.deal.findUnique({
    where: {
      id: parsed.data.dealId
    }
  });

  if (!deal) {
    return {
      ok: false,
      message: "Deal was not found."
    };
  }

  if (deal.stage === parsed.data.stage) {
    return {
      ok: true,
      message: "Deal is already in that stage."
    };
  }

  const now = new Date();
  const probability = probabilityForStage(parsed.data.stage);

  await prisma.$transaction([
    prisma.deal.update({
      where: {
        id: deal.id
      },
      data: {
        stage: parsed.data.stage,
        probability,
        lastActivityAt: now
      }
    }),
    prisma.activity.create({
      data: {
        accountId: deal.accountId,
        contactId: deal.contactId,
        dealId: deal.id,
        userId: deal.ownerId,
        type: "status_change",
        title: `${deal.name} moved to ${STAGE_LABELS[parsed.data.stage]}`,
        summary: `Stage changed from ${deal.stage} to ${parsed.data.stage}.`,
        nextStep:
          parsed.data.stage === "won" || parsed.data.stage === "lost"
            ? "Review closed deal outcome."
            : "Confirm next action for the new stage.",
        createdAt: now
      }
    })
  ]);

  revalidatePath("/deals");
  revalidatePath("/dashboard");
  revalidatePath("/activities");

  return {
    ok: true,
    message: `Deal moved to ${STAGE_LABELS[parsed.data.stage]}.`
  };
}
