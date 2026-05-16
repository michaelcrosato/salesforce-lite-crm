import type { Campaign, Prisma } from "@prisma/client";
import { z } from "zod";
import { CAMPAIGN_STATUSES } from "@/lib/crm/registry";
import { prisma } from "@/lib/prisma";
import {
  campaignCreateSchema,
  campaignUpdateSchema,
  idSchema
} from "@/lib/validation";

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

export const campaignListSchema = z.object({
  status: z.enum(CAMPAIGN_STATUSES).optional(),
  ownerId: idSchema.optional(),
  startDateFrom: optionalFilterDate,
  startDateTo: optionalFilterDate,
  skip: z.coerce.number().int().min(0).optional(),
  take: z.coerce.number().int().min(1).max(100).optional()
});

export type CampaignListInput = z.input<typeof campaignListSchema>;
export type CampaignCreateInput = z.input<typeof campaignCreateSchema>;
export type CampaignUpdateInput = z.input<typeof campaignUpdateSchema>;

export async function createCampaign(input: unknown): Promise<Campaign> {
  const { contactIds, leadIds, ownerId, ...parsed } = campaignCreateSchema.parse(input);
  const data: Prisma.CampaignCreateInput = {
    ...parsed,
    owner: ownerId ? { connect: { id: ownerId } } : undefined,
    leads: leadIds ? { connect: leadIds.map((id) => ({ id })) } : undefined,
    contacts: contactIds ? { connect: contactIds.map((id) => ({ id })) } : undefined
  };

  return prisma.campaign.create({ data });
}

export async function listCampaigns(input: unknown = {}): Promise<Campaign[]> {
  const { ownerId, skip, startDateFrom, startDateTo, status, take } =
    campaignListSchema.parse(input);
  const where: Prisma.CampaignWhereInput = {
    ownerId,
    status,
    startDate:
      startDateFrom || startDateTo
        ? {
            gte: startDateFrom,
            lte: startDateTo
          }
        : undefined
  };

  return prisma.campaign.findMany({
    where,
    orderBy: [
      {
        startDate: "asc"
      },
      {
        createdAt: "desc"
      }
    ],
    skip,
    take
  });
}

export async function getCampaign(id: string): Promise<Campaign | null> {
  return prisma.campaign.findUnique({ where: { id: idSchema.parse(id) } });
}

export async function updateCampaign(id: string, input: unknown): Promise<Campaign> {
  const { contactIds, leadIds, ownerId, ...parsed } = campaignUpdateSchema.parse(input);
  const data: Prisma.CampaignUpdateInput = {
    ...parsed,
    owner: ownerId ? { connect: { id: ownerId } } : undefined,
    leads: leadIds ? { set: leadIds.map((leadId) => ({ id: leadId })) } : undefined,
    contacts: contactIds ? { set: contactIds.map((contactId) => ({ id: contactId })) } : undefined
  };

  return prisma.campaign.update({ where: { id: idSchema.parse(id) }, data });
}

export async function completeCampaign(id: string): Promise<Campaign> {
  return prisma.campaign.update({
    where: { id: idSchema.parse(id) },
    data: {
      status: "completed"
    }
  });
}

export async function deleteCampaign(id: string): Promise<Campaign> {
  return prisma.campaign.delete({ where: { id: idSchema.parse(id) } });
}
