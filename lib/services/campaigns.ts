import type { Campaign, Prisma } from "@prisma/client";
import { z } from "zod/v4";
import { CAMPAIGN_STATUSES, type CampaignStatus } from "@/lib/crm/registry";
import { prisma } from "@/lib/prisma";
import {
  buildAuditEventCreateData,
  type AuditMetadataValue
} from "@/lib/services/auditEvents";
import { fieldEquals, fieldGte, fieldLte } from "@/lib/services/filterCompiler";
import { buildListQuery, type ListQueryInput } from "@/lib/services/listQuery";
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

const campaignSortByValues = [
  "startDate",
  "createdAt",
  "status",
  "name",
  "budget"
] as const;
const sortOrderSchema = z.enum(["asc", "desc"]);
const campaignFilterSchema = z
  .object({
    status: z.enum(CAMPAIGN_STATUSES).optional(),
    ownerId: idSchema.optional(),
    startDateFrom: optionalFilterDate,
    startDateTo: optionalFilterDate
  })
  .strict();

export const campaignListSchema = z
  .object({
    page: z.coerce.number().int().min(1).optional(),
    pageSize: z.coerce.number().int().min(1).max(100).optional(),
    sortBy: z.enum(campaignSortByValues).optional(),
    sortOrder: sortOrderSchema.optional(),
    filters: campaignFilterSchema.optional()
  })
  .strict();

const legacyCampaignListSchema = campaignFilterSchema
  .extend({
    skip: z.coerce.number().int().min(0).optional(),
    take: z.coerce.number().int().min(1).max(100).optional()
  })
  .strict();

type CampaignSortBy = (typeof campaignSortByValues)[number];
type CampaignFilterInput = {
  status: CampaignStatus;
  ownerId: string;
  startDateFrom: Date | string | number;
  startDateTo: Date | string | number;
};
type ParsedCampaignFilters = {
  status: CampaignStatus;
  ownerId: string;
  startDateFrom: Date;
  startDateTo: Date;
};
type ParsedCampaignListInput = ListQueryInput<
  CampaignSortBy,
  ParsedCampaignFilters
>;

export type CampaignListInput = ListQueryInput<
  CampaignSortBy,
  CampaignFilterInput
>;
export type CampaignCreateInput = z.input<typeof campaignCreateSchema>;
export type CampaignUpdateInput = z.input<typeof campaignUpdateSchema>;

export async function createCampaign(input: unknown): Promise<Campaign> {
  const { contactIds, leadIds, ownerId, ...parsed } =
    campaignCreateSchema.parse(input);
  const data: Prisma.CampaignCreateInput = {
    ...parsed,
    owner: ownerId ? { connect: { id: ownerId } } : undefined,
    leads: leadIds ? { connect: leadIds.map((id) => ({ id })) } : undefined,
    contacts: contactIds
      ? { connect: contactIds.map((id) => ({ id })) }
      : undefined
  };

  return prisma.$transaction(async (tx) => {
    const campaign = await tx.campaign.create({ data });

    await tx.auditEvent.create({
      data: buildAuditEventCreateData({
        category: "record",
        action: "created",
        entityType: "campaign",
        entityId: campaign.id,
        summary: `Campaign created: ${campaign.name}.`,
        metadata: {
          ...campaignAuditMetadata(campaign),
          contactIds: contactIds ?? [],
          leadIds: leadIds ?? []
        }
      })
    });

    return campaign;
  });
}

export async function listCampaigns(input: unknown = {}): Promise<Campaign[]> {
  return prisma.campaign.findMany(
    campaignListQuery(parseCampaignListInput(input))
  );
}

function parseCampaignListInput(input: unknown): ParsedCampaignListInput {
  const standard = campaignListSchema.safeParse(input);

  if (standard.success) {
    return standard.data;
  }

  const legacy = legacyCampaignListSchema.parse(input);
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

function campaignListQuery(input: ParsedCampaignListInput) {
  return buildListQuery<
    CampaignSortBy,
    ParsedCampaignFilters,
    Prisma.CampaignWhereInput,
    Prisma.CampaignOrderByWithRelationInput[]
  >(input, {
    defaultSortBy: "startDate",
    defaultSortOrder: "asc",
    emptyWhere: {},
    andWhere: (clauses) => ({ AND: clauses }),
    sortMap: {
      startDate: (order) => [{ startDate: order }, { createdAt: "desc" }],
      createdAt: (order) => [{ createdAt: order }],
      status: (order) => [{ status: order }, { createdAt: "desc" }],
      name: (order) => [{ name: order }],
      budget: (order) => [{ budget: order }, { createdAt: "desc" }]
    },
    filterMap: {
      status: (status) => fieldEquals(["status"], status),
      ownerId: (ownerId) => fieldEquals(["ownerId"], ownerId),
      startDateFrom: (startDateFrom) => fieldGte(["startDate"], startDateFrom),
      startDateTo: (startDateTo) => fieldLte(["startDate"], startDateTo)
    }
  });
}

export async function getCampaign(id: string): Promise<Campaign | null> {
  return prisma.campaign.findUnique({ where: { id: idSchema.parse(id) } });
}

export async function updateCampaign(
  id: string,
  input: unknown
): Promise<Campaign> {
  const campaignId = idSchema.parse(id);
  const parsedInput = campaignUpdateSchema.parse(input);
  const { contactIds, leadIds, ownerId, ...parsed } = parsedInput;
  const data: Prisma.CampaignUpdateInput = {
    ...parsed,
    owner: ownerId ? { connect: { id: ownerId } } : undefined,
    leads: leadIds
      ? { set: leadIds.map((leadId) => ({ id: leadId })) }
      : undefined,
    contacts: contactIds
      ? { set: contactIds.map((contactId) => ({ id: contactId })) }
      : undefined
  };

  return prisma.$transaction(async (tx) => {
    const existing = await tx.campaign.findUniqueOrThrow({
      where: {
        id: campaignId
      }
    });
    const campaign = await tx.campaign.update({
      where: {
        id: campaignId
      },
      data
    });
    const statusChanged =
      parsedInput.status !== undefined &&
      existing.status !== campaign.status;

    await tx.auditEvent.create({
      data: buildAuditEventCreateData({
        category: "record",
        action: statusChanged ? "status_changed" : "updated",
        entityType: "campaign",
        entityId: campaign.id,
        summary: statusChanged
          ? `Campaign status changed from ${existing.status} to ${campaign.status}.`
          : `Campaign updated: ${campaign.name}.`,
        metadata: {
          ...campaignAuditMetadata(campaign),
          changedFields: auditChangedFields(parsedInput),
          contactIds: contactIds ?? [],
          leadIds: leadIds ?? [],
          previousStatus: statusChanged ? existing.status : null
        }
      })
    });

    return campaign;
  });
}

export async function completeCampaign(id: string): Promise<Campaign> {
  const campaignId = idSchema.parse(id);

  return prisma.$transaction(async (tx) => {
    const existing = await tx.campaign.findUniqueOrThrow({
      where: {
        id: campaignId
      }
    });
    const campaign = await tx.campaign.update({
      where: { id: campaignId },
      data: {
        status: "completed"
      }
    });

    await tx.auditEvent.create({
      data: buildAuditEventCreateData({
        category: "workflow",
        action: "campaign_completed",
        entityType: "campaign",
        entityId: campaign.id,
        summary: `Campaign completed: ${campaign.name}.`,
        metadata: {
          ...campaignAuditMetadata(campaign),
          previousStatus: existing.status
        }
      })
    });

    return campaign;
  });
}

export async function deleteCampaign(id: string): Promise<Campaign> {
  return prisma.campaign.delete({ where: { id: idSchema.parse(id) } });
}

function campaignAuditMetadata(
  campaign: Campaign
): Record<string, AuditMetadataValue> {
  return {
    budget: campaign.budget,
    endDate: campaign.endDate ? campaign.endDate.toISOString() : null,
    name: campaign.name,
    ownerId: campaign.ownerId,
    startDate: campaign.startDate ? campaign.startDate.toISOString() : null,
    status: campaign.status
  };
}

function auditChangedFields(input: object): string[] {
  return Object.keys(input).sort();
}
