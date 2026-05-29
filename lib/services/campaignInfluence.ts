import type { Prisma } from "@prisma/client";
import { z } from "zod/v4";
import { isOpenDealStage, stageSortIndex } from "@/lib/business/deals";
import { ROUTE_REGISTRY } from "@/lib/crm/registry";
import { prisma } from "@/lib/prisma";
import { idSchema } from "@/lib/validation";

const DEFAULT_CAMPAIGN_LIMIT = 50;
const MAX_CAMPAIGN_LIMIT = 100;
const DEFAULT_OPPORTUNITY_LIMIT = 5;
const MAX_OPPORTUNITY_LIMIT = 10;

const opportunityLimitSchema = z.coerce
  .number()
  .int()
  .min(0)
  .max(MAX_OPPORTUNITY_LIMIT)
  .default(DEFAULT_OPPORTUNITY_LIMIT);

const campaignInfluenceSummaryOptionsSchema = z
  .object({
    opportunityLimit: opportunityLimitSchema
  })
  .strict();

const campaignInfluenceListOptionsSchema = campaignInfluenceSummaryOptionsSchema
  .extend({
    campaignIds: z.array(idSchema).max(MAX_CAMPAIGN_LIMIT).optional(),
    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(MAX_CAMPAIGN_LIMIT)
      .default(DEFAULT_CAMPAIGN_LIMIT)
  })
  .strict();

const campaignInfluenceInclude = {
  contacts: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      status: true,
      deals: {
        select: {
          id: true,
          name: true,
          stage: true,
          value: true,
          probability: true,
          contactId: true
        },
        orderBy: [{ value: "desc" }, { name: "asc" }, { id: "asc" }]
      }
    }
  },
  leads: {
    select: {
      id: true,
      source: true,
      status: true,
      assignmentReason: true,
      activities: {
        where: {
          type: "routing_event"
        },
        select: {
          id: true
        }
      }
    }
  }
} satisfies Prisma.CampaignInclude;

type CampaignWithInfluenceData = Prisma.CampaignGetPayload<{
  include: typeof campaignInfluenceInclude;
}>;

type CampaignInfluenceContact = CampaignWithInfluenceData["contacts"][number];
type CampaignInfluenceDeal = CampaignInfluenceContact["deals"][number];

export type CampaignInfluenceSummaryOptions = z.input<
  typeof campaignInfluenceSummaryOptionsSchema
>;

export type CampaignInfluenceListOptions = z.input<
  typeof campaignInfluenceListOptionsSchema
>;

export type CampaignInfluenceCount = {
  label: string;
  count: number;
};

export type CampaignInfluenceOpportunity = {
  id: string;
  name: string;
  stage: string;
  value: number;
  probability: number;
  weightedValue: number;
  route: string;
  contactId: string | null;
  contactName: string;
};

export type CampaignRoiMetrics = {
  budget: number | null;
  status: "budgeted" | "missing_budget" | "zero_budget";
  totalInfluencedValue: number;
  openPipelineValue: number;
  wonValue: number;
  totalInfluencedToBudget: number | null;
  openPipelineToBudget: number | null;
  wonValueToBudget: number | null;
  netTotalInfluencedValue: number | null;
  netWonValue: number | null;
};

export type CampaignInfluenceSummary = {
  campaignId: string;
  campaignName: string;
  status: string;
  memberCounts: {
    contacts: number;
    leads: number;
    total: number;
  };
  memberStatusCounts: {
    contacts: CampaignInfluenceCount[];
    leads: CampaignInfluenceCount[];
  };
  leadSourceCounts: CampaignInfluenceCount[];
  opportunityMetrics: {
    totalCount: number;
    openCount: number;
    wonCount: number;
    lostCount: number;
    totalValue: number;
    openValue: number;
    wonValue: number;
    lostValue: number;
    weightedValue: number;
    weightedOpenValue: number;
  };
  influenceLite: {
    contactsWithOpportunities: number;
    routedLeadMembers: number;
    opportunityCoverageRate: number;
    routedLeadRate: number;
    wonOpportunityRate: number;
    opportunitiesPerMember: number;
    openPipelineValuePerMember: number;
  };
  roiMetrics: CampaignRoiMetrics;
  topOpportunities: CampaignInfluenceOpportunity[];
  emptyReason: "no_members" | "no_related_opportunities" | null;
};

export async function getCampaignInfluenceSummary(
  campaignId: string,
  options: CampaignInfluenceSummaryOptions = {}
): Promise<CampaignInfluenceSummary> {
  const parsedId = idSchema.parse(campaignId);
  const parsedOptions = campaignInfluenceSummaryOptionsSchema.parse(options);
  const campaign = await prisma.campaign.findUniqueOrThrow({
    where: {
      id: parsedId
    },
    include: campaignInfluenceInclude
  });

  return buildCampaignInfluenceSummary(
    campaign,
    parsedOptions.opportunityLimit
  );
}

export async function listCampaignInfluenceSummaries(
  options: CampaignInfluenceListOptions = {}
): Promise<CampaignInfluenceSummary[]> {
  const parsedOptions = campaignInfluenceListOptionsSchema.parse(options);
  const campaignIds =
    parsedOptions.campaignIds === undefined
      ? undefined
      : uniqueIds(parsedOptions.campaignIds);

  if (campaignIds !== undefined && campaignIds.length === 0) {
    return [];
  }

  const campaigns = await prisma.campaign.findMany({
    where:
      campaignIds === undefined
        ? {}
        : {
            id: {
              in: campaignIds
            }
          },
    include: campaignInfluenceInclude,
    orderBy: [{ name: "asc" }, { id: "asc" }],
    take: parsedOptions.limit
  });

  return campaigns.map((campaign) =>
    buildCampaignInfluenceSummary(
      campaign,
      parsedOptions.opportunityLimit
    )
  );
}

function buildCampaignInfluenceSummary(
  campaign: CampaignWithInfluenceData,
  opportunityLimit: number
): CampaignInfluenceSummary {
  const opportunities = campaign.contacts.flatMap((contact) =>
    contact.deals.map((deal) => mapOpportunity(deal, contact))
  );
  const sortedOpportunities = opportunities.sort(compareOpportunities);
  const memberCounts = {
    contacts: campaign.contacts.length,
    leads: campaign.leads.length,
    total: campaign.contacts.length + campaign.leads.length
  };
  const opportunityMetrics = summarizeOpportunities(opportunities);
  const contactsWithOpportunities = campaign.contacts.filter(
    (contact) => contact.deals.length > 0
  ).length;
  const routedLeadMembers = campaign.leads.filter(isRoutedLeadMember).length;

  return {
    campaignId: campaign.id,
    campaignName: campaign.name,
    status: campaign.status,
    memberCounts,
    memberStatusCounts: {
      contacts: countLabels(campaign.contacts.map((contact) => contact.status)),
      leads: countLabels(campaign.leads.map((lead) => lead.status))
    },
    leadSourceCounts: countLabels(
      campaign.leads.map((lead) => lead.source?.trim() || "Unknown")
    ),
    opportunityMetrics,
    influenceLite: {
      contactsWithOpportunities,
      routedLeadMembers,
      opportunityCoverageRate: rate(
        contactsWithOpportunities,
        memberCounts.contacts
      ),
      routedLeadRate: rate(routedLeadMembers, memberCounts.leads),
      wonOpportunityRate: rate(
        opportunityMetrics.wonCount,
        opportunityMetrics.totalCount
      ),
      opportunitiesPerMember: rate(
        opportunityMetrics.totalCount,
        memberCounts.total
      ),
      openPipelineValuePerMember: rate(
        opportunityMetrics.openValue,
        memberCounts.total
      )
    },
    roiMetrics: summarizeRoiMetrics(campaign.budget, opportunityMetrics),
    topOpportunities: sortedOpportunities.slice(0, opportunityLimit),
    emptyReason: emptyReason(memberCounts.total, opportunityMetrics.totalCount)
  };
}

function mapOpportunity(
  deal: CampaignInfluenceDeal,
  contact: CampaignInfluenceContact
): CampaignInfluenceOpportunity {
  return {
    id: deal.id,
    name: deal.name,
    stage: deal.stage,
    value: deal.value,
    probability: deal.probability,
    weightedValue: weightedValue(deal),
    route: ROUTE_REGISTRY.opportunityDetail(deal.id),
    contactId: deal.contactId,
    contactName: formatPersonName(contact.firstName, contact.lastName)
  };
}

function summarizeOpportunities(
  opportunities: CampaignInfluenceOpportunity[]
): CampaignInfluenceSummary["opportunityMetrics"] {
  return opportunities.reduce(
    (summary, opportunity) => {
      const open = isOpenDealStage(opportunity.stage);
      const won = opportunity.stage === "won";
      const lost = opportunity.stage === "lost";

      summary.totalCount += 1;
      summary.totalValue += opportunity.value;
      summary.weightedValue += opportunity.weightedValue;

      if (open) {
        summary.openCount += 1;
        summary.openValue += opportunity.value;
        summary.weightedOpenValue += opportunity.weightedValue;
      }

      if (won) {
        summary.wonCount += 1;
        summary.wonValue += opportunity.value;
      }

      if (lost) {
        summary.lostCount += 1;
        summary.lostValue += opportunity.value;
      }

      return summary;
    },
    {
      totalCount: 0,
      openCount: 0,
      wonCount: 0,
      lostCount: 0,
      totalValue: 0,
      openValue: 0,
      wonValue: 0,
      lostValue: 0,
      weightedValue: 0,
      weightedOpenValue: 0
    }
  );
}

function summarizeRoiMetrics(
  budget: number | null,
  opportunityMetrics: CampaignInfluenceSummary["opportunityMetrics"]
): CampaignRoiMetrics {
  if (budget === null) {
    return {
      budget,
      status: "missing_budget",
      totalInfluencedValue: opportunityMetrics.totalValue,
      openPipelineValue: opportunityMetrics.openValue,
      wonValue: opportunityMetrics.wonValue,
      totalInfluencedToBudget: null,
      openPipelineToBudget: null,
      wonValueToBudget: null,
      netTotalInfluencedValue: null,
      netWonValue: null
    };
  }

  if (budget === 0) {
    return {
      budget,
      status: "zero_budget",
      totalInfluencedValue: opportunityMetrics.totalValue,
      openPipelineValue: opportunityMetrics.openValue,
      wonValue: opportunityMetrics.wonValue,
      totalInfluencedToBudget: null,
      openPipelineToBudget: null,
      wonValueToBudget: null,
      netTotalInfluencedValue: opportunityMetrics.totalValue,
      netWonValue: opportunityMetrics.wonValue
    };
  }

  return {
    budget,
    status: "budgeted",
    totalInfluencedValue: opportunityMetrics.totalValue,
    openPipelineValue: opportunityMetrics.openValue,
    wonValue: opportunityMetrics.wonValue,
    totalInfluencedToBudget: opportunityMetrics.totalValue / budget,
    openPipelineToBudget: opportunityMetrics.openValue / budget,
    wonValueToBudget: opportunityMetrics.wonValue / budget,
    netTotalInfluencedValue: opportunityMetrics.totalValue - budget,
    netWonValue: opportunityMetrics.wonValue - budget
  };
}

function countLabels(labels: string[]): CampaignInfluenceCount[] {
  const counts = new Map<string, number>();

  for (const label of labels) {
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label));
}

function compareOpportunities(
  left: CampaignInfluenceOpportunity,
  right: CampaignInfluenceOpportunity
): number {
  return (
    right.value - left.value ||
    right.weightedValue - left.weightedValue ||
    stageSortIndex(left.stage) - stageSortIndex(right.stage) ||
    left.name.localeCompare(right.name) ||
    left.id.localeCompare(right.id)
  );
}

function isRoutedLeadMember(
  lead: CampaignWithInfluenceData["leads"][number]
): boolean {
  return lead.assignmentReason === "routed" && lead.activities.length > 0;
}

function weightedValue(deal: Pick<CampaignInfluenceDeal, "value" | "probability">) {
  return deal.value * (deal.probability / 100);
}

function formatPersonName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`.trim();
}

function rate(numerator: number, denominator: number): number {
  return denominator > 0 ? numerator / denominator : 0;
}

function emptyReason(
  memberCount: number,
  opportunityCount: number
): CampaignInfluenceSummary["emptyReason"] {
  if (memberCount === 0) {
    return "no_members";
  }

  if (opportunityCount === 0) {
    return "no_related_opportunities";
  }

  return null;
}

function uniqueIds(ids: string[]): string[] {
  return Array.from(new Set(ids));
}
