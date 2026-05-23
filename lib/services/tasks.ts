import type { Prisma, Task } from "@prisma/client";
import { z } from "zod";
import { TASK_STATUSES, type TaskStatus } from "@/lib/crm/registry";
import { prisma } from "@/lib/prisma";
import {
  buildAuditEventCreateData,
  type AuditMetadataValue
} from "@/lib/services/auditEvents";
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
  const data = taskCreateSchema.parse(input);

  return prisma.$transaction(async (tx) => {
    const task = await tx.task.create({ data });

    await tx.auditEvent.create({
      data: buildAuditEventCreateData({
        category: "record",
        action: "created",
        entityType: "task",
        entityId: task.id,
        summary: `Task created: ${task.title}.`,
        metadata: taskAuditMetadata(task)
      })
    });

    return task;
  });
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
  const taskId = idSchema.parse(id);
  const data = taskUpdateSchema.parse(input);

  return prisma.$transaction(async (tx) => {
    const existing = await tx.task.findUniqueOrThrow({
      where: {
        id: taskId
      }
    });
    const task = await tx.task.update({
      where: {
        id: taskId
      },
      data
    });
    const statusChanged =
      data.status !== undefined && existing.status !== task.status;

    await tx.auditEvent.create({
      data: buildAuditEventCreateData({
        category: "record",
        action: statusChanged ? "status_changed" : "updated",
        entityType: "task",
        entityId: task.id,
        summary: statusChanged
          ? `Task status changed from ${existing.status} to ${task.status}.`
          : `Task updated: ${task.title}.`,
        metadata: {
          ...taskAuditMetadata(task),
          changedFields: auditChangedFields(data),
          previousStatus: statusChanged ? existing.status : null
        }
      })
    });

    return task;
  });
}

export async function completeTask(id: string): Promise<Task> {
  const taskId = idSchema.parse(id);
  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const existing = await tx.task.findUniqueOrThrow({
      where: {
        id: taskId
      }
    });
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

    await tx.auditEvent.create({
      data: buildAuditEventCreateData({
        category: "workflow",
        action: "task_completed",
        entityType: "task",
        entityId: task.id,
        summary: `Task completed: ${task.title}.`,
        metadata: {
          ...taskAuditMetadata(task),
          previousStatus: existing.status,
          activityCreated: true
        }
      })
    });

    return task;
  });
}

export async function deleteTask(id: string): Promise<Task> {
  return prisma.task.delete({ where: { id: idSchema.parse(id) } });
}

function taskAuditMetadata(task: Task): Record<string, AuditMetadataValue> {
  return {
    accountId: task.accountId,
    contactId: task.contactId,
    dealId: task.dealId,
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
    leadId: task.leadId,
    ownerId: task.ownerId,
    priority: task.priority,
    status: task.status,
    title: task.title
  };
}

function auditChangedFields(input: object): string[] {
  return Object.keys(input).sort();
}
