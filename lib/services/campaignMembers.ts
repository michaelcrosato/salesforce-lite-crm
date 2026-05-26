import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { ROUTE_REGISTRY } from "@/lib/crm/registry";
import { prisma } from "@/lib/prisma";
import {
  buildAuditEventCreateData,
  type AuditMetadataValue
} from "@/lib/services/auditEvents";
import { idSchema } from "@/lib/validation";

const campaignMemberIdListSchema = z.array(idSchema).default([]);

const campaignMemberCreateSchema = z
  .object({
    campaignId: idSchema,
    contactIds: campaignMemberIdListSchema,
    leadIds: campaignMemberIdListSchema,
    actorUserId: idSchema.optional()
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.contactIds.length === 0 && value.leadIds.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least one campaign member ID is required.",
        path: ["contactIds"]
      });
    }
  });

const campaignMemberInclude = {
  contacts: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      status: true
    }
  },
  leads: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      source: true,
      status: true
    }
  }
} satisfies Prisma.CampaignInclude;

type CampaignWithMembers = Prisma.CampaignGetPayload<{
  include: typeof campaignMemberInclude;
}>;

type CampaignMemberTransaction = Prisma.TransactionClient;

export type CampaignMemberType = "contact" | "lead";

export type CampaignMember = {
  campaignId: string;
  memberId: string;
  memberType: CampaignMemberType;
  displayName: string;
  email: string | null;
  route: string;
  source: string | null;
  status: string;
};

export type CampaignMemberCreateInput = z.input<
  typeof campaignMemberCreateSchema
>;

export type CampaignMemberCreateResult = {
  campaignId: string;
  addedContactIds: string[];
  addedLeadIds: string[];
  skippedExistingContactIds: string[];
  skippedExistingLeadIds: string[];
  memberCounts: {
    contacts: number;
    leads: number;
    total: number;
  };
  members: CampaignMember[];
};

export async function listCampaignMembers(
  campaignId: string
): Promise<CampaignMember[]> {
  const campaign = await prisma.campaign.findUniqueOrThrow({
    where: { id: idSchema.parse(campaignId) },
    include: campaignMemberInclude
  });

  return mapCampaignMembers(campaign);
}

export async function addCampaignMembers(
  input: CampaignMemberCreateInput
): Promise<CampaignMemberCreateResult> {
  const parsed = campaignMemberCreateSchema.parse(input);
  const requestedContactIds = uniqueIds(parsed.contactIds);
  const requestedLeadIds = uniqueIds(parsed.leadIds);

  return prisma.$transaction(async (tx) => {
    const campaign = await loadCampaignWithMembers(tx, parsed.campaignId);
    const existingContactIds = new Set(
      campaign.contacts.map((contact) => contact.id)
    );
    const existingLeadIds = new Set(campaign.leads.map((lead) => lead.id));
    const addedContactIds = requestedContactIds.filter(
      (contactId) => !existingContactIds.has(contactId)
    );
    const addedLeadIds = requestedLeadIds.filter(
      (leadId) => !existingLeadIds.has(leadId)
    );
    const skippedExistingContactIds = requestedContactIds.filter((contactId) =>
      existingContactIds.has(contactId)
    );
    const skippedExistingLeadIds = requestedLeadIds.filter((leadId) =>
      existingLeadIds.has(leadId)
    );

    const updatedCampaign =
      addedContactIds.length > 0 || addedLeadIds.length > 0
        ? await tx.campaign.update({
            where: { id: parsed.campaignId },
            data: {
              contacts:
                addedContactIds.length > 0
                  ? { connect: addedContactIds.map((id) => ({ id })) }
                  : undefined,
              leads:
                addedLeadIds.length > 0
                  ? { connect: addedLeadIds.map((id) => ({ id })) }
                  : undefined
            },
            include: campaignMemberInclude
          })
        : campaign;
    const members = mapCampaignMembers(updatedCampaign);
    const memberCounts = {
      contacts: updatedCampaign.contacts.length,
      leads: updatedCampaign.leads.length,
      total: updatedCampaign.contacts.length + updatedCampaign.leads.length
    };

    await tx.auditEvent.create({
      data: buildAuditEventCreateData({
        category: "record",
        action: "updated",
        actorUserId: parsed.actorUserId,
        entityType: "campaign",
        entityId: parsed.campaignId,
        summary: `Campaign members updated: ${campaign.name}.`,
        metadata: campaignMemberAuditMetadata({
          addedContactIds,
          addedLeadIds,
          campaign,
          memberCounts,
          requestedContactIds,
          requestedLeadIds,
          skippedExistingContactIds,
          skippedExistingLeadIds
        })
      })
    });

    return {
      campaignId: parsed.campaignId,
      addedContactIds,
      addedLeadIds,
      skippedExistingContactIds,
      skippedExistingLeadIds,
      memberCounts,
      members
    };
  });
}

async function loadCampaignWithMembers(
  tx: CampaignMemberTransaction,
  campaignId: string
): Promise<CampaignWithMembers> {
  return tx.campaign.findUniqueOrThrow({
    where: { id: campaignId },
    include: campaignMemberInclude
  });
}

function mapCampaignMembers(campaign: CampaignWithMembers): CampaignMember[] {
  const contactMembers = campaign.contacts.map((contact) => ({
    campaignId: campaign.id,
    memberId: contact.id,
    memberType: "contact" as const,
    displayName: formatPersonName(contact.firstName, contact.lastName),
    email: contact.email,
    route: ROUTE_REGISTRY.contactDetail(contact.id),
    source: null,
    status: contact.status
  }));
  const leadMembers = campaign.leads.map((lead) => ({
    campaignId: campaign.id,
    memberId: lead.id,
    memberType: "lead" as const,
    displayName: formatPersonName(lead.firstName, lead.lastName),
    email: lead.email,
    route: ROUTE_REGISTRY.leadDetail(lead.id),
    source: lead.source,
    status: lead.status
  }));

  return [...contactMembers, ...leadMembers].sort(compareCampaignMembers);
}

function compareCampaignMembers(
  left: CampaignMember,
  right: CampaignMember
): number {
  return (
    left.displayName.localeCompare(right.displayName) ||
    left.memberType.localeCompare(right.memberType) ||
    left.memberId.localeCompare(right.memberId)
  );
}

function formatPersonName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`.trim();
}

function uniqueIds(ids: string[]): string[] {
  return Array.from(new Set(ids));
}

function campaignMemberAuditMetadata(input: {
  addedContactIds: string[];
  addedLeadIds: string[];
  campaign: CampaignWithMembers;
  memberCounts: CampaignMemberCreateResult["memberCounts"];
  requestedContactIds: string[];
  requestedLeadIds: string[];
  skippedExistingContactIds: string[];
  skippedExistingLeadIds: string[];
}): Record<string, AuditMetadataValue> {
  return {
    addedContactIds: input.addedContactIds,
    addedLeadIds: input.addedLeadIds,
    campaignId: input.campaign.id,
    campaignName: input.campaign.name,
    contactMemberCount: input.memberCounts.contacts,
    leadMemberCount: input.memberCounts.leads,
    requestedContactIds: input.requestedContactIds,
    requestedLeadIds: input.requestedLeadIds,
    skippedExistingContactIds: input.skippedExistingContactIds,
    skippedExistingLeadIds: input.skippedExistingLeadIds,
    totalMemberCount: input.memberCounts.total
  };
}
