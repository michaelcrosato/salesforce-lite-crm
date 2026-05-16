import type { Prisma, Task } from "@prisma/client";
import { z } from "zod";
import { TASK_STATUSES } from "@/lib/crm/registry";
import { prisma } from "@/lib/prisma";
import { idSchema, taskCreateSchema, taskUpdateSchema } from "@/lib/validation";

const optionalFilterDate = z.preprocess((value) => {
  if (value instanceof Date) {
    return value;
  }

  if (typeof value !== "string" && typeof value !== "number") {
    return undefined;
  }

  if (typeof value === "string" && value.trim().length === 0) {
    return undefined;
  }

  return new Date(value);
}, z.date().optional());

export const taskListSchema = z.object({
  status: z.enum(TASK_STATUSES).optional(),
  ownerId: idSchema.optional(),
  dueDateFrom: optionalFilterDate,
  dueDateTo: optionalFilterDate,
  skip: z.coerce.number().int().min(0).optional(),
  take: z.coerce.number().int().min(1).max(100).optional()
});

export type TaskListInput = z.input<typeof taskListSchema>;
export type TaskCreateInput = z.input<typeof taskCreateSchema>;
export type TaskUpdateInput = z.input<typeof taskUpdateSchema>;

export async function createTask(input: unknown): Promise<Task> {
  const data: Prisma.TaskUncheckedCreateInput = taskCreateSchema.parse(input);
  return prisma.task.create({ data });
}

export async function listTasks(input: unknown = {}): Promise<Task[]> {
  const { dueDateFrom, dueDateTo, ownerId, skip, status, take } = taskListSchema.parse(input);
  const where: Prisma.TaskWhereInput = {
    ownerId,
    status,
    dueDate:
      dueDateFrom || dueDateTo
        ? {
            gte: dueDateFrom,
            lte: dueDateTo
          }
        : undefined
  };

  return prisma.task.findMany({
    where,
    orderBy: [
      {
        dueDate: "asc"
      },
      {
        createdAt: "desc"
      }
    ],
    skip,
    take
  });
}

export async function getTask(id: string): Promise<Task | null> {
  return prisma.task.findUnique({ where: { id: idSchema.parse(id) } });
}

export async function updateTask(id: string, input: unknown): Promise<Task> {
  const data: Prisma.TaskUncheckedUpdateInput = taskUpdateSchema.parse(input);
  return prisma.task.update({ where: { id: idSchema.parse(id) }, data });
}

export async function completeTask(id: string): Promise<Task> {
  return prisma.task.update({
    where: { id: idSchema.parse(id) },
    data: {
      status: "done"
    }
  });
}

export async function deleteTask(id: string): Promise<Task> {
  return prisma.task.delete({ where: { id: idSchema.parse(id) } });
}
