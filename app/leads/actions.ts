"use server";

import { revalidatePath, updateTag } from "next/cache";
import { actionErrorResult, type ActionResult } from "@/lib/action-result";
import { ASSIGNMENT_REASON_LABELS, type AssignmentReason } from "@/lib/crm-constants";
import { prisma } from "@/lib/prisma";
import { routeLead } from "@/lib/routing/leadRouter";
import { leadFormSchema, leadStatusUpdateSchema } from "@/lib/validation";
import { buildAuditEventCreateData, type AuditMetadataValue } from "@/lib/services/auditEvents";
import { getCurrentUserId } from "@/lib/session";
import type { Lead } from "@prisma/client";

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function fieldErrors(error: {
  flatten: () => { fieldErrors: Record<string, string[] | undefined> };
}) {
  return error.flatten().fieldErrors;
}

function leadAuditMetadata(lead: Lead): Record<string, AuditMetadataValue> {
  return {
    firstName: lead.firstName,
    lastName: lead.lastName,
    phone: lead.phone,
    email: lead.email,
    postalCode: lead.postalCode,
    province: lead.province,
    source: lead.source,
    status: lead.status
  };
}

export async function createLeadAction(formData: FormData): Promise<ActionResult> {
  const parsed = leadFormSchema.safeParse({
    firstName: formValue(formData, "firstName"),
    lastName: formValue(formData, "lastName"),
    phone: formValue(formData, "phone"),
    email: formValue(formData, "email"),
    postalCode: formValue(formData, "postalCode"),
    province: formValue(formData, "province"),
    source: formValue(formData, "source")
  });

  if (!parsed.success) {
    const errors = fieldErrors(parsed.error);
    const postalIssue = errors.postalCode?.[0];
    const onlyPostal =
      postalIssue && Object.values(errors).filter((entry) => entry?.length).length === 1;

    return {
      ok: false,
      message: onlyPostal ? postalIssue : "Check the highlighted fields.",
      fieldErrors: errors
    };
  }

  let lead;
  try {
    lead = await prisma.$transaction(async (tx) => {
      const createdLead = await tx.lead.create({
        data: {
          firstName: parsed.data.firstName,
          lastName: parsed.data.lastName,
          phone: parsed.data.phone,
          email: parsed.data.email,
          postalCode: parsed.data.postalCode,
          province: parsed.data.province,
          source: parsed.data.source,
          status: "new"
        }
      });

      await tx.auditEvent.create({
        data: buildAuditEventCreateData({
          category: "record",
          action: "created",
          actorUserId: await getCurrentUserId(),
          entityType: "lead",
          entityId: createdLead.id,
          summary: `Lead created: ${createdLead.firstName} ${createdLead.lastName}.`,
          metadata: leadAuditMetadata(createdLead)
        })
      });

      return createdLead;
    });
  } catch (error) {
    return actionErrorResult(error, {
      action: "createLead",
      entity: "lead",
      fallbackMessage: "The lead could not be saved."
    });
  }

  const routeResult = await routeLead(lead.id);
  revalidateDealerOpsPaths();

  if (routeResult.order) {
    return {
      ok: true,
      message: `Lead routed to ${routeResult.order.name}.`
    };
  }

  return {
    ok: true,
    message: `Lead created but not routed: ${reasonLabel(routeResult.reason)}.`
  };
}

export async function updateLeadStatusAction(input: {
  leadId: string;
  status: string;
}): Promise<ActionResult> {
  const parsed = leadStatusUpdateSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: "The selected lead status is not valid."
    };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.lead.findUniqueOrThrow({
        where: { id: parsed.data.leadId }
      });

      const lead = await tx.lead.update({
        where: {
          id: parsed.data.leadId
        },
        data: {
          status: parsed.data.status
        }
      });

      const statusChanged = existing.status !== lead.status;

      await tx.auditEvent.create({
        data: buildAuditEventCreateData({
          category: "record",
          action: statusChanged ? "status_changed" : "updated",
          actorUserId: await getCurrentUserId(),
          entityType: "lead",
          entityId: lead.id,
          summary: statusChanged
            ? `Lead status changed from ${existing.status} to ${lead.status}.`
            : `Lead updated: ${lead.firstName} ${lead.lastName}.`,
          metadata: {
            ...leadAuditMetadata(lead),
            changedFields: ["status"],
            previousStatus: statusChanged ? existing.status : null
          }
        })
      });
    });
  } catch (error) {
    return actionErrorResult(error, {
      action: "updateLeadStatus",
      entity: "lead",
      fallbackMessage: "The lead could not be saved."
    });
  }

  revalidateDealerOpsPaths();
  revalidatePath(`/leads/${parsed.data.leadId}`);

  return {
    ok: true,
    message: "Lead status updated."
  };
}

function reasonLabel(reason: AssignmentReason) {
  return ASSIGNMENT_REASON_LABELS[reason];
}

function revalidateDealerOpsPaths() {
  updateTag("leads");
  revalidatePath("/leads");
  revalidatePath("/orders");
  revalidatePath("/dashboard");
  revalidatePath("/activities");
}
