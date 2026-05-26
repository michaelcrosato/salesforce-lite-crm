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
const campaignMemberAvailabilitySearchSchema = z.preprocess((value) => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}, z.string().optional());

const campaignMemberAvailabilitySchema = z
  .object({
    campaignId: idSchema,
    search: campaignMemberAvailabilitySearchSchema,
    limit: z.coerce.number().int().min(1).max(100).default(20)
  })
  .strict();

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

const campaignMemberRemoveSchema = campaignMemberCreateSchema;

const campaignMemberContactSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  status: true
} satisfies Prisma.ContactSelect;

const campaignMemberLeadSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  source: true,
  status: true
} satisfies Prisma.LeadSelect;

const campaignMemberInclude = {
  contacts: {
    select: campaignMemberContactSelect
  },
  leads: {
    select: campaignMemberLeadSelect
  }
} satisfies Prisma.CampaignInclude;

type CampaignWithMembers = Prisma.CampaignGetPayload<{
  include: typeof campaignMemberInclude;
}>;
type CampaignMemberContact = Prisma.ContactGetPayload<{
  select: typeof campaignMemberContactSelect;
}>;
type CampaignMemberLead = Prisma.LeadGetPayload<{
  select: typeof campaignMemberLeadSelect;
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

export type CampaignMemberCounts = {
  contacts: number;
  leads: number;
  total: number;
};

export type CampaignMemberAvailabilityInput = z.input<
  typeof campaignMemberAvailabilitySchema
>;

export type CampaignMemberAvailabilityResult = {
  campaignId: string;
  search: string | null;
  limit: number;
  availableCounts: CampaignMemberCounts;
  existingMemberCounts: CampaignMemberCounts;
  memberCounts: CampaignMemberCounts;
  contacts: CampaignMember[];
  leads: CampaignMember[];
  members: CampaignMember[];
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
  memberCounts: CampaignMemberCounts;
  members: CampaignMember[];
};

export type CampaignMemberRemoveInput = z.input<
  typeof campaignMemberRemoveSchema
>;

export type CampaignMemberRemoveResult = {
  campaignId: string;
  removedContactIds: string[];
  removedLeadIds: string[];
  skippedNonMemberContactIds: string[];
  skippedNonMemberLeadIds: string[];
  memberCounts: CampaignMemberCounts;
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

export async function listAvailableCampaignMembers(
  input: CampaignMemberAvailabilityInput
): Promise<CampaignMemberAvailabilityResult> {
  const parsed = campaignMemberAvailabilitySchema.parse(input);

  return prisma.$transaction(async (tx) => {
    const campaign = await loadCampaignWithMembers(tx, parsed.campaignId);
    const existingContactIds = campaign.contacts.map((contact) => contact.id);
    const existingLeadIds = campaign.leads.map((lead) => lead.id);
    const contactWhere: Prisma.ContactWhereInput =
      existingContactIds.length > 0
        ? { id: { notIn: existingContactIds } }
        : {};
    const leadWhere: Prisma.LeadWhereInput =
      existingLeadIds.length > 0 ? { id: { notIn: existingLeadIds } } : {};
    const [contacts, leads] = await Promise.all([
      tx.contact.findMany({
        where: contactWhere,
        select: campaignMemberContactSelect,
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }, { id: "asc" }]
      }),
      tx.lead.findMany({
        where: leadWhere,
        select: campaignMemberLeadSelect,
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }, { id: "asc" }]
      })
    ]);
    const availableContacts = contacts
      .map((contact) => mapContactCampaignMember(campaign.id, contact))
      .filter((member) => memberMatchesSearch(member, parsed.search))
      .sort(compareCampaignMembers);
    const availableLeads = leads
      .map((lead) => mapLeadCampaignMember(campaign.id, lead))
      .filter((member) => memberMatchesSearch(member, parsed.search))
      .sort(compareCampaignMembers);
    const returnedContacts = availableContacts.slice(0, parsed.limit);
    const returnedLeads = availableLeads.slice(0, parsed.limit);
    const members = [...returnedContacts, ...returnedLeads].sort(
      compareCampaignMembers
    );

    return {
      campaignId: campaign.id,
      search: parsed.search ?? null,
      limit: parsed.limit,
      availableCounts: buildCampaignMemberCounts(
        availableContacts.length,
        availableLeads.length
      ),
      existingMemberCounts: buildCampaignMemberCounts(
        campaign.contacts.length,
        campaign.leads.length
      ),
      memberCounts: buildCampaignMemberCounts(
        returnedContacts.length,
        returnedLeads.length
      ),
      contacts: returnedContacts,
      leads: returnedLeads,
      members
    };
  });
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
    const memberCounts = buildCampaignMemberCounts(
      updatedCampaign.contacts.length,
      updatedCampaign.leads.length
    );

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

export async function removeCampaignMembers(
  input: CampaignMemberRemoveInput
): Promise<CampaignMemberRemoveResult> {
  const parsed = campaignMemberRemoveSchema.parse(input);
  const requestedContactIds = uniqueIds(parsed.contactIds);
  const requestedLeadIds = uniqueIds(parsed.leadIds);

  return prisma.$transaction(async (tx) => {
    const campaign = await loadCampaignWithMembers(tx, parsed.campaignId);
    const existingContactIds = new Set(
      campaign.contacts.map((contact) => contact.id)
    );
    const existingLeadIds = new Set(campaign.leads.map((lead) => lead.id));
    const removedContactIds = requestedContactIds.filter((contactId) =>
      existingContactIds.has(contactId)
    );
    const removedLeadIds = requestedLeadIds.filter((leadId) =>
      existingLeadIds.has(leadId)
    );
    const skippedNonMemberContactIds = requestedContactIds.filter(
      (contactId) => !existingContactIds.has(contactId)
    );
    const skippedNonMemberLeadIds = requestedLeadIds.filter(
      (leadId) => !existingLeadIds.has(leadId)
    );

    const updatedCampaign =
      removedContactIds.length > 0 || removedLeadIds.length > 0
        ? await tx.campaign.update({
            where: { id: parsed.campaignId },
            data: {
              contacts:
                removedContactIds.length > 0
                  ? { disconnect: removedContactIds.map((id) => ({ id })) }
                  : undefined,
              leads:
                removedLeadIds.length > 0
                  ? { disconnect: removedLeadIds.map((id) => ({ id })) }
                  : undefined
            },
            include: campaignMemberInclude
          })
        : campaign;
    const members = mapCampaignMembers(updatedCampaign);
    const memberCounts = buildCampaignMemberCounts(
      updatedCampaign.contacts.length,
      updatedCampaign.leads.length
    );

    await tx.auditEvent.create({
      data: buildAuditEventCreateData({
        category: "record",
        action: "updated",
        actorUserId: parsed.actorUserId,
        entityType: "campaign",
        entityId: parsed.campaignId,
        summary: `Campaign members removed: ${campaign.name}.`,
        metadata: campaignMemberRemovalAuditMetadata({
          campaign,
          memberCounts,
          removedContactIds,
          removedLeadIds,
          requestedContactIds,
          requestedLeadIds,
          skippedNonMemberContactIds,
          skippedNonMemberLeadIds
        })
      })
    });

    return {
      campaignId: parsed.campaignId,
      removedContactIds,
      removedLeadIds,
      skippedNonMemberContactIds,
      skippedNonMemberLeadIds,
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
  const contactMembers = campaign.contacts.map((contact) =>
    mapContactCampaignMember(campaign.id, contact)
  );
  const leadMembers = campaign.leads.map((lead) =>
    mapLeadCampaignMember(campaign.id, lead)
  );

  return [...contactMembers, ...leadMembers].sort(compareCampaignMembers);
}

function mapContactCampaignMember(
  campaignId: string,
  contact: CampaignMemberContact
): CampaignMember {
  return {
    campaignId,
    memberId: contact.id,
    memberType: "contact",
    displayName: formatPersonName(contact.firstName, contact.lastName),
    email: contact.email,
    route: ROUTE_REGISTRY.contactDetail(contact.id),
    source: null,
    status: contact.status
  };
}

function mapLeadCampaignMember(
  campaignId: string,
  lead: CampaignMemberLead
): CampaignMember {
  return {
    campaignId,
    memberId: lead.id,
    memberType: "lead",
    displayName: formatPersonName(lead.firstName, lead.lastName),
    email: lead.email,
    route: ROUTE_REGISTRY.leadDetail(lead.id),
    source: lead.source,
    status: lead.status
  };
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

function memberMatchesSearch(
  member: CampaignMember,
  search: string | undefined
): boolean {
  if (!search) {
    return true;
  }

  const normalizedSearch = search.toLowerCase();
  return [
    member.memberId,
    member.memberType,
    member.displayName,
    member.email,
    member.source,
    member.status
  ].some((value) => value?.toLowerCase().includes(normalizedSearch) ?? false);
}

function buildCampaignMemberCounts(
  contacts: number,
  leads: number
): CampaignMemberCounts {
  return {
    contacts,
    leads,
    total: contacts + leads
  };
}

function campaignMemberAuditMetadata(input: {
  addedContactIds: string[];
  addedLeadIds: string[];
  campaign: CampaignWithMembers;
  memberCounts: CampaignMemberCounts;
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

function campaignMemberRemovalAuditMetadata(input: {
  campaign: CampaignWithMembers;
  memberCounts: CampaignMemberCounts;
  removedContactIds: string[];
  removedLeadIds: string[];
  requestedContactIds: string[];
  requestedLeadIds: string[];
  skippedNonMemberContactIds: string[];
  skippedNonMemberLeadIds: string[];
}): Record<string, AuditMetadataValue> {
  return {
    campaignId: input.campaign.id,
    campaignName: input.campaign.name,
    contactMemberCount: input.memberCounts.contacts,
    leadMemberCount: input.memberCounts.leads,
    removedContactIds: input.removedContactIds,
    removedLeadIds: input.removedLeadIds,
    requestedContactIds: input.requestedContactIds,
    requestedLeadIds: input.requestedLeadIds,
    skippedNonMemberContactIds: input.skippedNonMemberContactIds,
    skippedNonMemberLeadIds: input.skippedNonMemberLeadIds,
    totalMemberCount: input.memberCounts.total
  };
}
