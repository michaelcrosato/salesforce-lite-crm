"use server";

import { revalidatePath, updateTag } from "next/cache";
import { deterministicActivitySummarizer } from "@/lib/ai/activitySummarizer";
import { actionErrorResult, type ActionResult } from "@/lib/action-result";
import { prisma } from "@/lib/prisma";
import { contactFormSchema, noteFormSchema } from "@/lib/validation";
import { buildAuditEventCreateData, type AuditMetadataValue } from "@/lib/services/auditEvents";
import type { Contact } from "@prisma/client";

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function fieldErrors(error: {
  flatten: () => { fieldErrors: Record<string, string[] | undefined> };
}) {
  return error.flatten().fieldErrors;
}

function contactAuditMetadata(contact: Contact): Record<string, AuditMetadataValue> {
  return {
    accountId: contact.accountId,
    firstName: contact.firstName,
    lastName: contact.lastName,
    email: contact.email,
    phone: contact.phone,
    title: contact.title,
    status: contact.status
  };
}

function auditChangedFields(input: object): string[] {
  return Object.keys(input).sort();
}

export async function createContactAction(
  formData: FormData
): Promise<ActionResult> {
  const parsed = contactFormSchema.safeParse({
    accountId: formValue(formData, "accountId"),
    firstName: formValue(formData, "firstName"),
    lastName: formValue(formData, "lastName"),
    email: formValue(formData, "email"),
    phone: formValue(formData, "phone"),
    title: formValue(formData, "title"),
    status: formValue(formData, "status")
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
      const contact = await tx.contact.create({
        data: {
          accountId: parsed.data.accountId ?? null,
          firstName: parsed.data.firstName,
          lastName: parsed.data.lastName,
          email: parsed.data.email ?? null,
          phone: parsed.data.phone ?? null,
          title: parsed.data.title ?? null,
          status: parsed.data.status
        }
      });

      await tx.auditEvent.create({
        data: buildAuditEventCreateData({
          category: "record",
          action: "created",
          entityType: "contact",
          entityId: contact.id,
          summary: `Contact created: ${contact.firstName} ${contact.lastName}.`,
          metadata: contactAuditMetadata(contact)
        })
      });
    });
    updateTag("contacts");
    revalidatePath("/contacts");
    revalidatePath("/dashboard");

    return {
      ok: true,
      message: "Contact created."
    };
  } catch (error) {
    return actionErrorResult(error, {
      action: "createContact",
      entity: "contact",
      fallbackMessage: "The record could not be saved."
    });
  }
}

export async function updateContactAction(
  contactId: string,
  formData: FormData
): Promise<ActionResult> {
  const parsed = contactFormSchema.safeParse({
    accountId: formValue(formData, "accountId"),
    firstName: formValue(formData, "firstName"),
    lastName: formValue(formData, "lastName"),
    email: formValue(formData, "email"),
    phone: formValue(formData, "phone"),
    title: formValue(formData, "title"),
    status: formValue(formData, "status")
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
      const existing = await tx.contact.findUniqueOrThrow({
        where: { id: contactId }
      });

      const contact = await tx.contact.update({
        where: {
          id: contactId
        },
        data: {
          accountId: parsed.data.accountId ?? null,
          firstName: parsed.data.firstName,
          lastName: parsed.data.lastName,
          email: parsed.data.email ?? null,
          phone: parsed.data.phone ?? null,
          title: parsed.data.title ?? null,
          status: parsed.data.status
        }
      });

      const statusChanged = existing.status !== contact.status;

      await tx.auditEvent.create({
        data: buildAuditEventCreateData({
          category: "record",
          action: statusChanged ? "status_changed" : "updated",
          entityType: "contact",
          entityId: contact.id,
          summary: statusChanged
            ? `Contact status changed from ${existing.status} to ${contact.status}.`
            : `Contact updated: ${contact.firstName} ${contact.lastName}.`,
          metadata: {
            ...contactAuditMetadata(contact),
            changedFields: auditChangedFields(parsed.data),
            previousStatus: statusChanged ? existing.status : null
          }
        })
      });
    });
    updateTag("contacts");
    revalidatePath("/contacts");
    revalidatePath(`/contacts/${contactId}`);
    revalidatePath("/dashboard");

    return {
      ok: true,
      message: "Contact updated."
    };
  } catch (error) {
    return actionErrorResult(error, {
      action: "updateContact",
      entity: "contact",
      fallbackMessage: "The record could not be saved."
    });
  }
}

export async function addContactNoteAction(
  formData: FormData
): Promise<ActionResult> {
  const parsed = noteFormSchema.safeParse({
    contactId: formValue(formData, "contactId"),
    dealId: formValue(formData, "dealId"),
    rawText: formValue(formData, "rawText")
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Add a note before saving.",
      fieldErrors: fieldErrors(parsed.error)
    };
  }

  const contact = await prisma.contact.findUnique({
    where: {
      id: parsed.data.contactId
    },
    include: {
      account: true
    }
  });

  if (!contact) {
    return {
      ok: false,
      message: "Contact was not found."
    };
  }

  const linkedDeal = parsed.data.dealId
    ? await prisma.deal.findUnique({
        where: {
          id: parsed.data.dealId
        }
      })
    : null;
  const summary = deterministicActivitySummarizer.summarize({
    rawText: parsed.data.rawText
  });
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.activity.create({
      data: {
        accountId: linkedDeal?.accountId ?? contact.accountId,
        contactId: contact.id,
        dealId: linkedDeal?.id,
        type: "note",
        title: `Note for ${contact.firstName} ${contact.lastName}`,
        rawText: parsed.data.rawText,
        summary: summary.summary,
        nextStep: summary.nextStep,
        createdAt: now
      }
    });

    if (linkedDeal) {
      await tx.deal.update({
        where: {
          id: linkedDeal.id
        },
        data: {
          lastActivityAt: now
        }
      });
    }
  });

  updateTag("contacts");
  if (linkedDeal) {
    updateTag("deals");
  }
  revalidatePath("/contacts");
  revalidatePath(`/contacts/${contact.id}`);
  revalidatePath("/activities");
  revalidatePath("/deals");
  revalidatePath("/dashboard");

  return {
    ok: true,
    message: "Note summarized and saved."
  };
}
