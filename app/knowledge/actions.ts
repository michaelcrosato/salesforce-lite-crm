"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod/v4";
import type { ActionResult } from "@/lib/action-result";
import {
  archiveKnowledgeArticle,
  createKnowledgeArticle,
  publishKnowledgeArticle,
  updateKnowledgeArticle
} from "@/lib/crm/crmClient";
import {
  knowledgeArticleCreateSchema,
  knowledgeArticleUpdateSchema
} from "@/lib/validation";

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function buildRawInput(formData: FormData) {
  return {
    title: formString(formData, "title"),
    summary: formString(formData, "summary"),
    body: formString(formData, "body"),
    status: formString(formData, "status"),
    audience: formString(formData, "audience"),
    category: formString(formData, "category"),
    keywords: formString(formData, "keywords"),
    caseQueueKey: formString(formData, "caseQueueKey"),
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

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return {
        ok: false,
        message: "A record with that unique value already exists."
      };
    }

    if (error.code === "P2025") {
      return {
        ok: false,
        message: "The knowledge article could not be found."
      };
    }
  }

  return { ok: false, message: "The knowledge article could not be saved." };
}

function revalidateKnowledgeSurfaces(): void {
  revalidatePath("/knowledge");
  revalidatePath("/cases");
}

export async function createKnowledgeArticleAction(
  formData: FormData
): Promise<ActionResult> {
  const parsed = knowledgeArticleCreateSchema.safeParse(buildRawInput(formData));

  if (!parsed.success) {
    return {
      ok: false,
      message: "Check the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors
    };
  }

  try {
    await createKnowledgeArticle(parsed.data);
    revalidateKnowledgeSurfaces();
    return { ok: true, message: "Article created." };
  } catch (error) {
    return failureFrom(error);
  }
}

export async function updateKnowledgeArticleAction(
  articleId: string,
  formData: FormData
): Promise<ActionResult> {
  const parsed = knowledgeArticleUpdateSchema.safeParse(buildRawInput(formData));

  if (!parsed.success) {
    return {
      ok: false,
      message: "Check the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors
    };
  }

  try {
    await updateKnowledgeArticle(articleId, parsed.data);
    revalidateKnowledgeSurfaces();
    return { ok: true, message: "Article updated." };
  } catch (error) {
    return failureFrom(error);
  }
}

export async function publishKnowledgeArticleAction(
  articleId: string
): Promise<ActionResult> {
  try {
    await publishKnowledgeArticle(articleId);
    revalidateKnowledgeSurfaces();
    return { ok: true, message: "Article published." };
  } catch (error) {
    return failureFrom(error);
  }
}

export async function archiveKnowledgeArticleAction(
  articleId: string
): Promise<ActionResult> {
  try {
    await archiveKnowledgeArticle(articleId);
    revalidateKnowledgeSurfaces();
    return { ok: true, message: "Article archived." };
  } catch (error) {
    return failureFrom(error);
  }
}
