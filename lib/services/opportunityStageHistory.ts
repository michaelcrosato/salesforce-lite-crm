import type { OpportunityStageHistory, Prisma } from "@prisma/client";
import type { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  idSchema,
  opportunityStageHistoryCreateSchema
} from "@/lib/validation";

export type OpportunityStageHistoryCreateInput = z.input<
  typeof opportunityStageHistoryCreateSchema
>;

export function recordOpportunityStageChangeOperation(
  input: unknown
): Prisma.PrismaPromise<OpportunityStageHistory> {
  const parsed = opportunityStageHistoryCreateSchema.parse(input);
  const data: Prisma.OpportunityStageHistoryUncheckedCreateInput = {
    dealId: parsed.dealId,
    fromStage: parsed.fromStage ?? null,
    toStage: parsed.toStage,
    changedAt: parsed.changedAt,
    changedByUserId: parsed.changedByUserId ?? null
  };

  return prisma.opportunityStageHistory.create({ data });
}

export async function recordOpportunityStageChange(
  input: unknown
): Promise<OpportunityStageHistory> {
  return recordOpportunityStageChangeOperation(input);
}

export async function recordOpportunityStageChangeIfChanged(input: {
  dealId: string;
  fromStage?: string;
  toStage: string;
  changedAt?: Date;
  changedByUserId?: string;
}): Promise<OpportunityStageHistory | null> {
  const parsed = opportunityStageHistoryCreateSchema.parse(input);

  if (parsed.fromStage === parsed.toStage) {
    return null;
  }

  return recordOpportunityStageChange(parsed);
}

export async function listOpportunityStageHistory(
  dealId: string
): Promise<OpportunityStageHistory[]> {
  return prisma.opportunityStageHistory.findMany({
    where: {
      dealId: idSchema.parse(dealId)
    },
    orderBy: [
      {
        changedAt: "asc"
      },
      {
        id: "asc"
      }
    ]
  });
}
