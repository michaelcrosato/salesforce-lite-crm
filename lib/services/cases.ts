import type { Case, Prisma } from "@prisma/client";
import { z } from "zod";
import { CASE_STATUSES, type CaseStatus } from "@/lib/crm/registry";
import { prisma } from "@/lib/prisma";
import {
  buildAuditEventCreateData,
  type AuditMetadataValue
} from "@/lib/services/auditEvents";
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
  const data = caseCreateSchema.parse(input);

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

export async function updateCase(id: string, input: unknown): Promise<Case> {
  const caseId = idSchema.parse(id);
  const data = caseUpdateSchema.parse(input);

  return prisma.$transaction(async (tx) => {
    const existing = await tx.case.findUniqueOrThrow({
      where: {
        id: caseId
      }
    });
    const crmCase = await tx.case.update({
      where: {
        id: caseId
      },
      data
    });
    const statusChanged =
      data.status !== undefined && existing.status !== crmCase.status;

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
          changedFields: auditChangedFields(data),
          previousStatus: statusChanged ? existing.status : null
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
  return prisma.case.delete({ where: { id: idSchema.parse(id) } });
}

function caseAuditMetadata(crmCase: Case): Record<string, AuditMetadataValue> {
  return {
    accountId: crmCase.accountId,
    contactId: crmCase.contactId,
    ownerId: crmCase.ownerId,
    priority: crmCase.priority,
    status: crmCase.status,
    subject: crmCase.subject
  };
}

function auditChangedFields(input: object): string[] {
  return Object.keys(input).sort();
}
