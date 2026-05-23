import type { Prisma, Task } from "@prisma/client";
import { z } from "zod";
import { TASK_STATUSES, type TaskStatus } from "@/lib/crm/registry";
import { prisma } from "@/lib/prisma";
import { fieldEquals, fieldGte, fieldLte } from "@/lib/services/filterCompiler";
import { buildListQuery, type ListQueryInput } from "@/lib/services/listQuery";
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

const taskSortByValues = [
  "dueDate",
  "createdAt",
  "updatedAt",
  "status",
  "priority"
] as const;
const sortOrderSchema = z.enum(["asc", "desc"]);
const taskFilterSchema = z
  .object({
    status: z.enum(TASK_STATUSES).optional(),
    ownerId: idSchema.optional(),
    dueDateFrom: optionalFilterDate,
    dueDateTo: optionalFilterDate
  })
  .strict();

export const taskListSchema = z
  .object({
    page: z.coerce.number().int().min(1).optional(),
    pageSize: z.coerce.number().int().min(1).max(100).optional(),
    sortBy: z.enum(taskSortByValues).optional(),
    sortOrder: sortOrderSchema.optional(),
    filters: taskFilterSchema.optional()
  })
  .strict();

const legacyTaskListSchema = taskFilterSchema
  .extend({
    skip: z.coerce.number().int().min(0).optional(),
    take: z.coerce.number().int().min(1).max(100).optional()
  })
  .strict();

type TaskSortBy = (typeof taskSortByValues)[number];
type TaskFilterInput = {
  status: TaskStatus;
  ownerId: string;
  dueDateFrom: Date | string | number;
  dueDateTo: Date | string | number;
};
type ParsedTaskFilters = {
  status: TaskStatus;
  ownerId: string;
  dueDateFrom: Date;
  dueDateTo: Date;
};
type ParsedTaskListInput = ListQueryInput<TaskSortBy, ParsedTaskFilters>;

export type TaskListInput = ListQueryInput<TaskSortBy, TaskFilterInput>;
export type TaskCreateInput = z.input<typeof taskCreateSchema>;
export type TaskUpdateInput = z.input<typeof taskUpdateSchema>;

export async function createTask(input: unknown): Promise<Task> {
  const data: Prisma.TaskUncheckedCreateInput = taskCreateSchema.parse(input);
  return prisma.task.create({ data });
}

export async function listTasks(input: unknown = {}): Promise<Task[]> {
  return prisma.task.findMany(taskListQuery(parseTaskListInput(input)));
}

function parseTaskListInput(input: unknown): ParsedTaskListInput {
  const standard = taskListSchema.safeParse(input);

  if (standard.success) {
    return standard.data;
  }

  const legacy = legacyTaskListSchema.parse(input);
  const { skip, take, ...filters } = legacy;

  return {
    page:
      skip !== undefined && take !== undefined
        ? Math.floor(skip / take) + 1
        : undefined,
    pageSize: take,
    filters
  };
}

function taskListQuery(input: ParsedTaskListInput) {
  return buildListQuery<
    TaskSortBy,
    ParsedTaskFilters,
    Prisma.TaskWhereInput,
    Prisma.TaskOrderByWithRelationInput[]
  >(input, {
    defaultSortBy: "dueDate",
    defaultSortOrder: "asc",
    emptyWhere: {},
    andWhere: (clauses) => ({ AND: clauses }),
    sortMap: {
      dueDate: (order) => [{ dueDate: order }, { createdAt: "desc" }],
      createdAt: (order) => [{ createdAt: order }],
      updatedAt: (order) => [{ updatedAt: order }],
      status: (order) => [{ status: order }, { createdAt: "desc" }],
      priority: (order) => [{ priority: order }, { createdAt: "desc" }]
    },
    filterMap: {
      status: (status) => fieldEquals(["status"], status),
      ownerId: (ownerId) => fieldEquals(["ownerId"], ownerId),
      dueDateFrom: (dueDateFrom) => fieldGte(["dueDate"], dueDateFrom),
      dueDateTo: (dueDateTo) => fieldLte(["dueDate"], dueDateTo)
    }
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
  const taskId = idSchema.parse(id);
  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const task = await tx.task.update({
      where: { id: taskId },
      data: {
        status: "done"
      }
    });

    await tx.activity.create({
      data: {
        accountId: task.accountId,
        contactId: task.contactId,
        dealId: task.dealId,
        leadId: task.leadId,
        taskId: task.id,
        userId: task.ownerId,
        type: "status_change",
        title: `Task completed: ${task.title}`,
        summary: "Task status changed to done.",
        createdAt: now
      }
    });

    return task;
  });
}

export async function deleteTask(id: string): Promise<Task> {
  return prisma.task.delete({ where: { id: idSchema.parse(id) } });
}
