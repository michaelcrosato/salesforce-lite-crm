"use server";

import { cacheTag, revalidatePath, updateTag } from "next/cache";
import { actionErrorResult, type ActionResult } from "@/lib/action-result";
import { probabilityForStage } from "@/lib/business/deals";
import { STAGE_LABELS } from "@/lib/crm-constants";
import { prisma } from "@/lib/prisma";
import {
  auditHistoryQuerySchema,
  dealFormSchema,
  dealMoveSchema
} from "@/lib/validation";
import {
  buildAuditEventCreateData,
  listAuditEventsForEntity,
  type AuditEntityType,
  type AuditMetadataValue
} from "@/lib/services/auditEvents";
import { getCurrentUserId } from "@/lib/session";
import type { Deal } from "@prisma/client";

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

function dealAuditMetadata(deal: Deal): Record<string, AuditMetadataValue> {
  return {
    accountId: deal.accountId,
    contactId: deal.contactId,
    ownerId: deal.ownerId,
    name: deal.name,
    stage: deal.stage,
    value: deal.value,
    probability: deal.probability,
    expectedCloseDate: deal.expectedCloseDate ? deal.expectedCloseDate.toISOString() : null
  };
}

function auditChangedFields(input: object): string[] {
  return Object.keys(input).sort();
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
  try {
    await prisma.$transaction(async (tx) => {
      const deal = await tx.deal.create({
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
        }
      });

      await tx.auditEvent.create({
        data: buildAuditEventCreateData({
          category: "record",
          action: "created",
          actorUserId: await getCurrentUserId(),
          entityType: "opportunity",
          entityId: deal.id,
          summary: `Opportunity created: ${deal.name}.`,
          metadata: dealAuditMetadata(deal)
        })
      });
    });
  } catch (error) {
    return actionErrorResult(error, {
      action: "createDeal",
      entity: "deal",
      fallbackMessage: "The deal could not be saved."
    });
  }

  updateTag("deals");
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
  try {
    await prisma.$transaction(async (tx) => {
      const deal = await tx.deal.update({
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

      const stageChanged = existing.stage !== parsed.data.stage;

      if (stageChanged) {
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

        await tx.opportunityStageHistory.create({
          data: {
            dealId,
            fromStage: existing.stage,
            toStage: parsed.data.stage,
            changedAt: now,
            changedByUserId: parsed.data.ownerId ?? existing.ownerId
          }
        });
      }

      await tx.auditEvent.create({
        data: buildAuditEventCreateData({
          category: "record",
          action: stageChanged ? "stage_changed" : "updated",
          actorUserId: await getCurrentUserId(),
          entityType: "opportunity",
          entityId: deal.id,
          summary: stageChanged
            ? `Opportunity stage changed from ${existing.stage} to ${deal.stage}.`
            : `Opportunity updated: ${deal.name}.`,
          metadata: {
            ...dealAuditMetadata(deal),
            changedFields: auditChangedFields(parsed.data),
            previousStatus: stageChanged ? existing.stage : null
          }
        })
      });
    });
  } catch (error) {
    return actionErrorResult(error, {
      action: "updateDeal",
      entity: "deal",
      fallbackMessage: "The deal could not be saved."
    });
  }

  updateTag("deals");
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

  try {
    await prisma.$transaction(async (tx) => {
      const updatedDeal = await tx.deal.update({
        where: {
          id: deal.id
        },
        data: {
          stage: parsed.data.stage,
          probability,
          lastActivityAt: now
        }
      });

      await tx.activity.create({
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
      });

      await tx.opportunityStageHistory.create({
        data: {
          dealId: deal.id,
          fromStage: deal.stage,
          toStage: parsed.data.stage,
          changedAt: now,
          changedByUserId: deal.ownerId ?? null
        }
      });

      await tx.auditEvent.create({
        data: buildAuditEventCreateData({
          category: "record",
          action: "stage_changed",
          actorUserId: await getCurrentUserId(),
          entityType: "opportunity",
          entityId: updatedDeal.id,
          summary: `Opportunity stage changed from ${deal.stage} to ${updatedDeal.stage}.`,
          metadata: {
            ...dealAuditMetadata(updatedDeal),
            changedFields: ["stage", "probability"],
            previousStatus: deal.stage
          }
        })
      });
    });
  } catch (error) {
    return actionErrorResult(error, {
      action: "moveDeal",
      entity: "deal",
      fallbackMessage: "The deal could not be saved."
    });
  }

  updateTag("deals");
  revalidatePath("/deals");
  revalidatePath("/dashboard");
  revalidatePath("/activities");

  return {
    ok: true,
    message: `Deal moved to ${STAGE_LABELS[parsed.data.stage]}.`
  };
}

async function getCachedAuditHistoryInternal(
  entity: AuditEntityType,
  entityId: string
) {
  "use cache";
  const tag = entity === "opportunity" ? "deals" : `${entity}s`;
  cacheTag(tag);
  cacheTag(`audit-events-${entity}-${entityId}`);

  return listAuditEventsForEntity(entity, entityId);
}

async function getCachedAuditHistory(entity: AuditEntityType, entityId: string) {
  if (process.env.NODE_ENV === "test") {
    return listAuditEventsForEntity(entity, entityId);
  }
  return getCachedAuditHistoryInternal(entity, entityId);
}

export async function getAuditHistoryAction(rawQuery: unknown) {
  const parsed = auditHistoryQuerySchema.safeParse(rawQuery);
  if (!parsed.success) {
    return { ok: false, message: "Invalid query parameters.", events: [] };
  }

  try {
    const events = await getCachedAuditHistory(
      parsed.data.entity,
      parsed.data.entityId
    );
    return { ok: true, events };
  } catch {
    return { ok: false, message: "Could not retrieve audit history.", events: [] };
  }
}
