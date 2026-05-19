import type { Case, Prisma } from "@prisma/client";
import { z } from "zod";
import { CASE_STATUSES, type CaseStatus } from "@/lib/crm/registry";
import { prisma } from "@/lib/prisma";
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
  const data: Prisma.CaseUncheckedCreateInput = caseCreateSchema.parse(input);
  return prisma.case.create({ data });
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
      status: (status) => ({ status }),
      ownerId: (ownerId) => ({ ownerId }),
      accountId: (accountId) => ({ accountId }),
      contactId: (contactId) => ({ contactId })
    }
  });
}

export async function getCase(id: string): Promise<Case | null> {
  return prisma.case.findUnique({ where: { id: idSchema.parse(id) } });
}

export async function updateCase(id: string, input: unknown): Promise<Case> {
  const data: Prisma.CaseUncheckedUpdateInput = caseUpdateSchema.parse(input);
  return prisma.case.update({ where: { id: idSchema.parse(id) }, data });
}

export async function resolveCase(id: string): Promise<Case> {
  return prisma.case.update({
    where: { id: idSchema.parse(id) },
    data: {
      status: "resolved"
    }
  });
}

export async function deleteCase(id: string): Promise<Case> {
  return prisma.case.delete({ where: { id: idSchema.parse(id) } });
}
