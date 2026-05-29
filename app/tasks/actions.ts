"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod/v4";
import { actionErrorResult, type ActionResult } from "@/lib/action-result";
import {
  completeTask,
  createTask,
  deleteTask,
  updateTask
} from "@/lib/crm/crmClient";
import { TASK_STATUSES } from "@/lib/crm/registry";
import { taskCreateSchema, taskUpdateSchema } from "@/lib/validation";

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function buildRawInput(formData: FormData) {
  return {
    title: formString(formData, "title"),
    description: formString(formData, "description"),
    dueDate: formString(formData, "dueDate"),
    status: formString(formData, "status"),
    priority: formString(formData, "priority"),
    ownerId: formString(formData, "ownerId"),
    accountId: formString(formData, "accountId"),
    contactId: formString(formData, "contactId"),
    dealId: formString(formData, "dealId"),
    leadId: formString(formData, "leadId")
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
    entity: "task",
    fallbackMessage: "The task could not be saved."
  });
}

function revalidateAll(): void {
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  revalidatePath("/reports/overdue-tasks");
}

export async function createTaskAction(
  formData: FormData
): Promise<ActionResult> {
  const parsed = taskCreateSchema.safeParse(buildRawInput(formData));

  if (!parsed.success) {
    return {
      ok: false,
      message: "Check the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors
    };
  }

  try {
    await createTask(parsed.data);
    revalidateAll();
    return { ok: true, message: "Task created." };
  } catch (error) {
    return failureFrom(error, "createTask");
  }
}

export async function updateTaskAction(
  taskId: string,
  formData: FormData
): Promise<ActionResult> {
  const parsed = taskUpdateSchema.safeParse(buildRawInput(formData));

  if (!parsed.success) {
    return {
      ok: false,
      message: "Check the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors
    };
  }

  try {
    await updateTask(taskId, parsed.data);
    revalidateAll();
    return { ok: true, message: "Task updated." };
  } catch (error) {
    return failureFrom(error, "updateTask");
  }
}

const statusSchema = z.enum(TASK_STATUSES);

export async function updateTaskStatusAction(
  taskId: string,
  status: string
): Promise<ActionResult> {
  const parsed = statusSchema.safeParse(status);

  if (!parsed.success) {
    return { ok: false, message: "Invalid status." };
  }

  try {
    if (parsed.data === "done") {
      await completeTask(taskId);
    } else {
      await updateTask(taskId, { status: parsed.data });
    }
    revalidateAll();
    return { ok: true, message: "Task status updated." };
  } catch (error) {
    return failureFrom(error, "updateTaskStatus");
  }
}

export async function deleteTaskAction(taskId: string): Promise<ActionResult> {
  try {
    await deleteTask(taskId);
    revalidateAll();
    return { ok: true, message: "Task deleted." };
  } catch (error) {
    return failureFrom(error, "deleteTask");
  }
}
