import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { addCampaignMembers } from "@/lib/services/campaignMembers";
import {
  getCampaignInfluenceSummary,
  listCampaignInfluenceSummaries
} from "@/lib/services/campaignInfluence";
import { createCampaign } from "@/lib/services/campaigns";
import { prisma } from "@/lib/prisma";

const ownerId = "test-campaign-influence-owner";
const contactIds = [
  "test-campaign-influence-contact-1",
  "test-campaign-influence-contact-2",
  "test-campaign-influence-contact-3"
] as const;
const leadIds = [
  "test-campaign-influence-lead-1",
  "test-campaign-influence-lead-2"
] as const;
const dealIds = [
  "test-campaign-influence-deal-open",
  "test-campaign-influence-deal-won",
  "test-campaign-influence-deal-lost"
] as const;

describe("campaign influence summaries", () => {
  beforeEach(async () => {
    await cleanupCampaignInfluenceFixtures();
    await createOwner();
    await createContact(contactIds[0], "Ada", "Influence", "active");
    await createContact(contactIds[1], "Ben", "Influence", "inactive");
    await createContact(contactIds[2], "Cara", "Influence", "active");
    await createLead(leadIds[0], "web", "assigned", "routed");
    await createLead(leadIds[1], "referral", "new", null);
    await createRoutingEvent(leadIds[0]);
    await createDeal({
      id: dealIds[0],
      contactId: contactIds[0],
      name: "Campaign influence open",
      stage: "proposal",
      value: 100_000,
      probability: 50
    });
    await createDeal({
      id: dealIds[1],
      contactId: contactIds[0],
      name: "Campaign influence won",
      stage: "won",
      value: 25_000,
      probability: 100
    });
    await createDeal({
      id: dealIds[2],
      contactId: contactIds[1],
      name: "Campaign influence lost",
      stage: "lost",
      value: 50_000,
      probability: 0
    });
  });

  afterEach(async () => {
    await cleanupCampaignInfluenceFixtures();
  });

  it("summarizes members, related opportunities, and influence-lite metrics", async () => {
    const campaign = await createCampaign({
      name: "Campaign influence summary",
      budget: 50_000,
      ownerId
    });
    await addCampaignMembers({
      campaignId: campaign.id,
      contactIds: [contactIds[1], contactIds[0]],
      leadIds: [leadIds[0], leadIds[1]]
    });

    const summary = await getCampaignInfluenceSummary(campaign.id, {
      opportunityLimit: 2
    });

    expect(summary).toMatchObject({
      campaignId: campaign.id,
      campaignName: "Campaign influence summary",
      status: "planned",
      memberCounts: {
        contacts: 2,
        leads: 2,
        total: 4
      },
      memberStatusCounts: {
        contacts: [
          { label: "active", count: 1 },
          { label: "inactive", count: 1 }
        ],
        leads: [
          { label: "assigned", count: 1 },
          { label: "new", count: 1 }
        ]
      },
      leadSourceCounts: [
        { label: "referral", count: 1 },
        { label: "web", count: 1 }
      ],
      opportunityMetrics: {
        totalCount: 3,
        openCount: 1,
        wonCount: 1,
        lostCount: 1,
        totalValue: 175_000,
        openValue: 100_000,
        wonValue: 25_000,
        lostValue: 50_000,
        weightedValue: 75_000,
        weightedOpenValue: 50_000
      },
      influenceLite: {
        contactsWithOpportunities: 2,
        routedLeadMembers: 1,
        opportunityCoverageRate: 1,
        routedLeadRate: 0.5,
        wonOpportunityRate: 1 / 3,
        opportunitiesPerMember: 0.75,
        openPipelineValuePerMember: 25_000
      },
      roiMetrics: {
        budget: 50_000,
        status: "budgeted",
        totalInfluencedValue: 175_000,
        openPipelineValue: 100_000,
        wonValue: 25_000,
        totalInfluencedToBudget: 3.5,
        openPipelineToBudget: 2,
        wonValueToBudget: 0.5,
        netTotalInfluencedValue: 125_000,
        netWonValue: -25_000
      },
      emptyReason: null
    });
    expect(summary.topOpportunities.map((opportunity) => opportunity.id)).toEqual([
      dealIds[0],
      dealIds[2]
    ]);
    expect(summary.topOpportunities[0]).toMatchObject({
      contactId: contactIds[0],
      contactName: "Ada Influence",
      probability: 50,
      route: `/deals?deal=${dealIds[0]}`,
      weightedValue: 50_000
    });
  });

  it("returns deterministic empty summaries for campaigns without members", async () => {
    const campaign = await createCampaign({
      name: "Campaign influence empty",
      ownerId
    });

    const summary = await getCampaignInfluenceSummary(campaign.id);

    expect(summary.memberCounts).toEqual({
      contacts: 0,
      leads: 0,
      total: 0
    });
    expect(summary.memberStatusCounts).toEqual({
      contacts: [],
      leads: []
    });
    expect(summary.leadSourceCounts).toEqual([]);
    expect(summary.opportunityMetrics).toEqual({
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
    });
    expect(summary.influenceLite).toEqual({
      contactsWithOpportunities: 0,
      routedLeadMembers: 0,
      opportunityCoverageRate: 0,
      routedLeadRate: 0,
      wonOpportunityRate: 0,
      opportunitiesPerMember: 0,
      openPipelineValuePerMember: 0
    });
    expect(summary.roiMetrics).toEqual({
      budget: null,
      status: "missing_budget",
      totalInfluencedValue: 0,
      openPipelineValue: 0,
      wonValue: 0,
      totalInfluencedToBudget: null,
      openPipelineToBudget: null,
      wonValueToBudget: null,
      netTotalInfluencedValue: null,
      netWonValue: null
    });
    expect(summary.topOpportunities).toEqual([]);
    expect(summary.emptyReason).toBe("no_members");
  });

  it("returns budgeted zero-value rollups without dividing by members", async () => {
    const campaign = await createCampaign({
      name: "Campaign influence zero values",
      budget: 2_000,
      ownerId
    });
    await addCampaignMembers({
      campaignId: campaign.id,
      contactIds: [contactIds[2]],
      leadIds: []
    });

    const summary = await getCampaignInfluenceSummary(campaign.id);

    expect(summary.opportunityMetrics.totalValue).toBe(0);
    expect(summary.roiMetrics).toEqual({
      budget: 2_000,
      status: "budgeted",
      totalInfluencedValue: 0,
      openPipelineValue: 0,
      wonValue: 0,
      totalInfluencedToBudget: 0,
      openPipelineToBudget: 0,
      wonValueToBudget: 0,
      netTotalInfluencedValue: -2_000,
      netWonValue: -2_000
    });
    expect(summary.emptyReason).toBe("no_related_opportunities");
  });

  it("returns zero-budget rollups without ratio inflation", async () => {
    const campaign = await createCampaign({
      name: "Campaign influence zero budget",
      budget: 0,
      ownerId
    });
    await addCampaignMembers({
      campaignId: campaign.id,
      contactIds: [contactIds[0]],
      leadIds: []
    });

    const summary = await getCampaignInfluenceSummary(campaign.id);

    expect(summary.roiMetrics).toEqual({
      budget: 0,
      status: "zero_budget",
      totalInfluencedValue: 125_000,
      openPipelineValue: 100_000,
      wonValue: 25_000,
      totalInfluencedToBudget: null,
      openPipelineToBudget: null,
      wonValueToBudget: null,
      netTotalInfluencedValue: 125_000,
      netWonValue: 25_000
    });
  });

  it("lists bounded summaries for selected campaigns", async () => {
    const selected = await createCampaign({
      name: "Campaign influence selected",
      ownerId
    });
    const skipped = await createCampaign({
      name: "Campaign influence skipped",
      ownerId
    });
    await addCampaignMembers({
      campaignId: selected.id,
      contactIds: [contactIds[0]],
      leadIds: []
    });
    await addCampaignMembers({
      campaignId: skipped.id,
      contactIds: [contactIds[2]],
      leadIds: []
    });

    const summaries = await listCampaignInfluenceSummaries({
      campaignIds: [selected.id, selected.id],
      opportunityLimit: 1
    });

    expect(summaries).toHaveLength(1);
    expect(summaries[0]!.campaignId).toBe(selected.id);
    expect(summaries[0]!.topOpportunities).toHaveLength(1);
    expect(summaries[0]!.opportunityMetrics.totalCount).toBe(2);
  });

  it("rejects invalid campaign identifiers", async () => {
    await expect(getCampaignInfluenceSummary("")).rejects.toThrow();
    await expect(
      listCampaignInfluenceSummaries({
        campaignIds: [""]
      })
    ).rejects.toThrow();
  });
});

async function createOwner() {
  await prisma.user.create({
    data: {
      id: ownerId,
      name: "Campaign Influence Owner",
      email: `${ownerId}@example.test`
    }
  });
}

async function createContact(
  id: string,
  firstName: string,
  lastName: string,
  status: string
) {
  await prisma.contact.create({
    data: {
      id,
      firstName,
      lastName,
      email: `${id}@example.test`,
      status
    }
  });
}

async function createLead(
  id: string,
  source: string,
  status: string,
  assignmentReason: string | null
) {
  await prisma.lead.create({
    data: {
      id,
      firstName: "Campaign",
      lastName: "Influence",
      email: `${id}@example.test`,
      source,
      status,
      assignmentReason
    }
  });
}

async function createRoutingEvent(leadId: string) {
  await prisma.activity.create({
    data: {
      leadId,
      type: "routing_event",
      title: "Campaign influence routed lead",
      summary: "Lead routed for campaign influence test."
    }
  });
}

async function createDeal(input: {
  id: string;
  contactId: string;
  name: string;
  stage: string;
  value: number;
  probability: number;
}) {
  await prisma.deal.create({
    data: input
  });
}

async function cleanupCampaignInfluenceFixtures() {
  await prisma.auditEvent.deleteMany({
    where: {
      OR: [
        {
          entityType: "campaign",
          summary: {
            contains: "Campaign influence"
          }
        },
        {
          entityType: "campaign",
          metadata: {
            contains: "Campaign influence"
          }
        }
      ]
    }
  });
  await prisma.campaign.deleteMany({
    where: {
      OR: [
        {
          name: {
            startsWith: "Campaign influence"
          }
        },
        {
          ownerId
        }
      ]
    }
  });
  await prisma.activity.deleteMany({
    where: {
      OR: [
        {
          leadId: {
            in: [...leadIds]
          }
        },
        {
          title: {
            startsWith: "Campaign influence"
          }
        }
      ]
    }
  });
  await prisma.deal.deleteMany({
    where: {
      id: {
        in: [...dealIds]
      }
    }
  });
  await prisma.lead.deleteMany({
    where: {
      id: {
        in: [...leadIds]
      }
    }
  });
  await prisma.contact.deleteMany({
    where: {
      id: {
        in: [...contactIds]
      }
    }
  });
  await prisma.user.deleteMany({
    where: {
      id: ownerId
    }
  });
}
