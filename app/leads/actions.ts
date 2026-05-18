"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/action-result";
import { ASSIGNMENT_REASON_LABELS, type AssignmentReason } from "@/lib/crm-constants";
import { prisma } from "@/lib/prisma";
import { routeLead } from "@/lib/routing/leadRouter";
import { leadFormSchema, leadStatusUpdateSchema } from "@/lib/validation";

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function fieldErrors(error: {
  flatten: () => { fieldErrors: Record<string, string[] | undefined> };
}) {
  return error.flatten().fieldErrors;
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

  const lead = await prisma.lead.create({
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

  await prisma.lead.update({
    where: {
      id: parsed.data.leadId
    },
    data: {
      status: parsed.data.status
    }
  });

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
  revalidatePath("/leads");
  revalidatePath("/orders");
  revalidatePath("/dashboard");
  revalidatePath("/activities");
}
