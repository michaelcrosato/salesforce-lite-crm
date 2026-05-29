import type { Case, Prisma } from "@prisma/client";
import { z } from "zod/v4";
import {
  CASE_STATUSES,
  type CaseQueueKey,
  type CaseStatus
} from "@/lib/crm/registry";
import { prisma } from "@/lib/prisma";
import {
  buildAuditEventCreateData,
  type AuditMetadataValue
} from "@/lib/services/auditEvents";
import {
  assignCaseQueue,
  type CaseQueueAssignment
} from "@/lib/services/caseQueues";
import {
  buildCaseSlaSnapshot,
  buildCaseSlaSnapshots,
  type CaseSlaClock,
  type CaseSlaSnapshot
} from "@/lib/services/caseSlas";
import { fieldEquals } from "@/lib/services/filterCompiler";
import { buildListQuery, type ListQueryInput } from "@/lib/services/listQuery";
import { caseCreateSchema, caseUpdateSchema, idSchema } from "@/lib/validation";

const caseSortByValues = [
  "updatedAt",
  "createdAt",
  "status",
  "priority",
  "subject"
] as const;
const sortOrderSchema = z.enum(["asc", "desc"]);
const caseFilterSchema = z
  .object({
    status: z.enum(CASE_STATUSES).optional(),
    ownerId: idSchema.optional(),
    accountId: idSchema.optional(),
    contactId: idSchema.optional()
  })
  .strict();

export const caseListSchema = z
  .object({
    page: z.coerce.number().int().min(1).optional(),
    pageSize: z.coerce.number().int().min(1).max(100).optional(),
    sortBy: z.enum(caseSortByValues).optional(),
    sortOrder: sortOrderSchema.optional(),
    filters: caseFilterSchema.optional()
  })
  .strict();

const legacyCaseListSchema = caseFilterSchema
  .extend({
    skip: z.coerce.number().int().min(0).optional(),
    take: z.coerce.number().int().min(1).max(100).optional()
  })
  .strict();

type CaseSortBy = (typeof caseSortByValues)[number];
type CaseFilters = {
  status: CaseStatus;
  ownerId: string;
  accountId: string;
  contactId: string;
};
type ParsedCaseListInput = ListQueryInput<CaseSortBy, CaseFilters>;

export type CaseListInput = ListQueryInput<CaseSortBy, CaseFilters>;
export type CaseCreateInput = z.input<typeof caseCreateSchema>;
export type CaseUpdateInput = z.input<typeof caseUpdateSchema>;

export async function createCase(input: unknown): Promise<Case> {
  const parsed = caseCreateSchema.parse(input);
  const assignment = assignCaseQueue(parsed);
  const data = {
    ...parsed,
    queueKey: assignment.queueKey,
    queueReason: assignment.reason
  };

  return prisma.$transaction(async (tx) => {
    const crmCase = await tx.case.create({ data });

    await tx.auditEvent.create({
      data: buildAuditEventCreateData({
        category: "record",
        action: "created",
        entityType: "case",
        entityId: crmCase.id,
        summary: `Case created: ${crmCase.subject}.`,
        metadata: caseAuditMetadata(crmCase)
      })
    });

    return crmCase;
  });
}

export async function listCases(input: unknown = {}): Promise<Case[]> {
  return prisma.case.findMany(caseListQuery(parseCaseListInput(input)));
}

export async function listCaseSlaSnapshots(
  input: unknown = {},
  clock?: CaseSlaClock
): Promise<CaseSlaSnapshot[]> {
  const cases = await listCases(input);

  return clock
    ? buildCaseSlaSnapshots(cases, clock)
    : buildCaseSlaSnapshots(cases);
}

function parseCaseListInput(input: unknown): ParsedCaseListInput {
  const standard = caseListSchema.safeParse(input);

  if (standard.success) {
    return standard.data;
  }

  const legacy = legacyCaseListSchema.parse(input);
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

function caseListQuery(input: ParsedCaseListInput) {
  return buildListQuery<
    CaseSortBy,
    CaseFilters,
    Prisma.CaseWhereInput,
    Prisma.CaseOrderByWithRelationInput[]
  >(input, {
    defaultSortBy: "updatedAt",
    defaultSortOrder: "desc",
    emptyWhere: {},
    andWhere: (clauses) => ({ AND: clauses }),
    sortMap: {
      updatedAt: (order) => [{ updatedAt: order }, { createdAt: "desc" }],
      createdAt: (order) => [{ createdAt: order }],
      status: (order) => [{ status: order }, { updatedAt: "desc" }],
      priority: (order) => [{ priority: order }, { updatedAt: "desc" }],
      subject: (order) => [{ subject: order }]
    },
    filterMap: {
      status: (status) => fieldEquals(["status"], status),
      ownerId: (ownerId) => fieldEquals(["ownerId"], ownerId),
      accountId: (accountId) => fieldEquals(["accountId"], accountId),
      contactId: (contactId) => fieldEquals(["contactId"], contactId)
    }
  });
}

export async function getCase(id: string): Promise<Case | null> {
  return prisma.case.findUnique({ where: { id: idSchema.parse(id) } });
}

export async function getCaseSlaSnapshot(
  id: string,
  clock?: CaseSlaClock
): Promise<CaseSlaSnapshot | null> {
  const crmCase = await getCase(id);

  if (!crmCase) {
    return null;
  }

  return clock
    ? buildCaseSlaSnapshot(crmCase, clock)
    : buildCaseSlaSnapshot(crmCase);
}

export async function updateCase(id: string, input: unknown): Promise<Case> {
  const caseId = idSchema.parse(id);
  const data = caseUpdateSchema.parse(input);

  return prisma.$transaction(async (tx) => {
    const existing = await tx.case.findUniqueOrThrow({
      where: {
        id: caseId
      }
    });
    const queueUpdate = caseQueueUpdateData(data, existing);
    const writeData = {
      ...data,
      ...queueUpdate
    };
    const crmCase = await tx.case.update({
      where: {
        id: caseId
      },
      data: writeData
    });
    const statusChanged =
      data.status !== undefined && existing.status !== crmCase.status;
    const queueChanged =
      queueUpdate.queueKey !== undefined &&
      existing.queueKey !== crmCase.queueKey;

    await tx.auditEvent.create({
      data: buildAuditEventCreateData({
        category: "record",
        action: statusChanged ? "status_changed" : "updated",
        entityType: "case",
        entityId: crmCase.id,
        summary: statusChanged
          ? `Case status changed from ${existing.status} to ${crmCase.status}.`
          : `Case updated: ${crmCase.subject}.`,
        metadata: {
          ...caseAuditMetadata(crmCase),
          changedFields: auditChangedFields(writeData),
          previousStatus: statusChanged ? existing.status : null,
          previousQueueKey: queueChanged ? existing.queueKey : null
        }
      })
    });

    return crmCase;
  });
}

export async function resolveCase(id: string): Promise<Case> {
  const caseId = idSchema.parse(id);

  return prisma.$transaction(async (tx) => {
    const existing = await tx.case.findUniqueOrThrow({
      where: {
        id: caseId
      }
    });
    const crmCase = await tx.case.update({
      where: { id: caseId },
      data: {
        status: "resolved"
      }
    });

    await tx.auditEvent.create({
      data: buildAuditEventCreateData({
        category: "workflow",
        action: "case_resolved",
        entityType: "case",
        entityId: crmCase.id,
        summary: `Case resolved: ${crmCase.subject}.`,
        metadata: {
          ...caseAuditMetadata(crmCase),
          previousStatus: existing.status
        }
      })
    });

    return crmCase;
  });
}

export async function deleteCase(id: string): Promise<Case> {
  const caseId = idSchema.parse(id);

  return prisma.$transaction(async (tx) => {
    const crmCase = await tx.case.delete({
      where: { id: caseId }
    });

    await tx.auditEvent.create({
      data: buildAuditEventCreateData({
        category: "record",
        action: "deleted",
        entityType: "case",
        entityId: crmCase.id,
        summary: `Case deleted: ${crmCase.subject}.`,
        metadata: caseAuditMetadata(crmCase)
      })
    });

    return crmCase;
  });
}

function caseAuditMetadata(crmCase: Case): Record<string, AuditMetadataValue> {
  return {
    accountId: crmCase.accountId,
    contactId: crmCase.contactId,
    ownerId: crmCase.ownerId,
    priority: crmCase.priority,
    queueKey: crmCase.queueKey,
    queueReason: crmCase.queueReason,
    status: crmCase.status,
    subject: crmCase.subject
  };
}

function auditChangedFields(input: object): string[] {
  return Object.keys(input).sort();
}

function caseQueueUpdateData(
  data: ReturnType<typeof caseUpdateSchema.parse>,
  existing: Case
): { queueKey?: CaseQueueKey; queueReason?: string } {
  if (!isQueueRelevantUpdate(data)) {
    return {};
  }

  if (existing.queueReason === "explicit_queue" && data.queueKey === undefined) {
    return {};
  }

  const assignment = assignCaseQueue({
    subject: data.subject ?? existing.subject,
    description: data.description ?? existing.description,
    priority: data.priority ?? existing.priority,
    accountId: data.accountId ?? existing.accountId,
    contactId: data.contactId ?? existing.contactId,
    queueKey: data.queueKey ?? null
  });

  if (!assignmentChanged(assignment, existing)) {
    return {};
  }

  return {
    queueKey: assignment.queueKey,
    queueReason: assignment.reason
  };
}

function isQueueRelevantUpdate(
  data: ReturnType<typeof caseUpdateSchema.parse>
): boolean {
  return (
    data.queueKey !== undefined ||
    data.subject !== undefined ||
    data.description !== undefined ||
    data.priority !== undefined ||
    data.accountId !== undefined ||
    data.contactId !== undefined
  );
}

function assignmentChanged(
  assignment: CaseQueueAssignment,
  existing: Case
): boolean {
  return (
    assignment.queueKey !== existing.queueKey ||
    assignment.reason !== existing.queueReason
  );
}
