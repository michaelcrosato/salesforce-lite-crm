"use server";

import { revalidatePath } from "next/cache";
import { deterministicActivitySummarizer } from "@/lib/ai/activitySummarizer";
import { actionErrorResult, type ActionResult } from "@/lib/action-result";
import { prisma } from "@/lib/prisma";
import { contactFormSchema, noteFormSchema } from "@/lib/validation";

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function fieldErrors(error: {
  flatten: () => { fieldErrors: Record<string, string[] | undefined> };
}) {
  return error.flatten().fieldErrors;
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
    await prisma.contact.create({
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
    await prisma.contact.update({
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
