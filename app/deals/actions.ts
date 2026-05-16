"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/action-result";
import { probabilityForStage } from "@/lib/business/deals";
import { STAGE_LABELS } from "@/lib/crm-constants";
import { prisma } from "@/lib/prisma";
import { dealMoveSchema } from "@/lib/validation";

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
