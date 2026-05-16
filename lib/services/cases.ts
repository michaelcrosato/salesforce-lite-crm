import type { Case, Prisma } from "@prisma/client";
import { z } from "zod";
import { CASE_STATUSES } from "@/lib/crm/registry";
import { prisma } from "@/lib/prisma";
import { caseCreateSchema, caseUpdateSchema, idSchema } from "@/lib/validation";

export const caseListSchema = z.object({
  status: z.enum(CASE_STATUSES).optional(),
  ownerId: idSchema.optional(),
  accountId: idSchema.optional(),
  contactId: idSchema.optional(),
  skip: z.coerce.number().int().min(0).optional(),
  take: z.coerce.number().int().min(1).max(100).optional()
});

export type CaseListInput = z.input<typeof caseListSchema>;
export type CaseCreateInput = z.input<typeof caseCreateSchema>;
export type CaseUpdateInput = z.input<typeof caseUpdateSchema>;

export async function createCase(input: unknown): Promise<Case> {
  const data: Prisma.CaseUncheckedCreateInput = caseCreateSchema.parse(input);
  return prisma.case.create({ data });
}

export async function listCases(input: unknown = {}): Promise<Case[]> {
  const { accountId, contactId, ownerId, skip, status, take } = caseListSchema.parse(input);
  const where: Prisma.CaseWhereInput = {
    accountId,
    contactId,
    ownerId,
    status
  };

  return prisma.case.findMany({
    where,
    orderBy: [
      {
        updatedAt: "desc"
      },
      {
        createdAt: "desc"
      }
    ],
    skip,
    take
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
