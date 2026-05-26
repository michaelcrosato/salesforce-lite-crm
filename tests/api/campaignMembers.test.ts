import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  addCampaignMembers,
  listCampaignMembers
} from "@/lib/services/campaignMembers";
import { createCampaign } from "@/lib/services/campaigns";
import { prisma } from "@/lib/prisma";

const ownerId = "test-campaign-member-owner";
const contactIds = [
  "test-campaign-member-contact-1",
  "test-campaign-member-contact-2"
] as const;
const leadIds = [
  "test-campaign-member-lead-1",
  "test-campaign-member-lead-2"
] as const;

describe("campaign member service", () => {
  beforeEach(async () => {
    await cleanupCampaignMemberFixtures();
    await createOwner();
    await createContact(contactIds[0], "Ada", "Contact");
    await createContact(contactIds[1], "Zoe", "Contact");
    await createLead(leadIds[0], "Ben", "Lead", "web");
    await createLead(leadIds[1], "Nora", "Lead", "referral");
  });

  afterEach(async () => {
    await cleanupCampaignMemberFixtures();
  });

  it("adds mixed contact and lead members with stable list output", async () => {
    const campaign = await createCampaign({
      name: "Campaign member create",
      ownerId
    });

    const result = await addCampaignMembers({
      campaignId: campaign.id,
      contactIds: [contactIds[1], contactIds[0], contactIds[0]],
      leadIds: [leadIds[0], leadIds[1]]
    });
    const listed = await listCampaignMembers(campaign.id);

    expect(result.addedContactIds).toEqual([contactIds[1], contactIds[0]]);
    expect(result.addedLeadIds).toEqual([leadIds[0], leadIds[1]]);
    expect(result.skippedExistingContactIds).toEqual([]);
    expect(result.skippedExistingLeadIds).toEqual([]);
    expect(result.memberCounts).toEqual({
      contacts: 2,
      leads: 2,
      total: 4
    });
    expect(listed).toEqual(result.members);
    expect(listed.map((member) => member.displayName)).toEqual([
      "Ada Contact",
      "Ben Lead",
      "Nora Lead",
      "Zoe Contact"
    ]);
    expect(listed[0]).toMatchObject({
      campaignId: campaign.id,
      email: `${contactIds[0]}@example.test`,
      memberId: contactIds[0],
      memberType: "contact",
      route: `/contacts/${contactIds[0]}`,
      source: null,
      status: "active"
    });
    expect(listed[1]).toMatchObject({
      campaignId: campaign.id,
      email: `${leadIds[0]}@example.test`,
      memberId: leadIds[0],
      memberType: "lead",
      route: `/leads/${leadIds[0]}`,
      source: "web",
      status: "new"
    });

    const audit = await prisma.auditEvent.findFirstOrThrow({
      where: {
        action: "updated",
        entityId: campaign.id,
        entityType: "campaign",
        summary: "Campaign members updated: Campaign member create."
      }
    });
    expect(audit.category).toBe("record");
    expect(auditMetadata(audit)).toMatchObject({
      addedContactIds: [contactIds[1], contactIds[0]],
      addedLeadIds: [leadIds[0], leadIds[1]],
      campaignId: campaign.id,
      campaignName: "Campaign member create",
      contactMemberCount: 2,
      leadMemberCount: 2,
      requestedContactIds: [contactIds[1], contactIds[0]],
      requestedLeadIds: [leadIds[0], leadIds[1]],
      skippedExistingContactIds: [],
      skippedExistingLeadIds: [],
      totalMemberCount: 4
    });
  });

  it("keeps repeated member adds idempotent", async () => {
    const campaign = await createCampaign({
      name: "Campaign member idempotent",
      ownerId
    });

    await addCampaignMembers({
      campaignId: campaign.id,
      contactIds: [contactIds[0]],
      leadIds: [leadIds[0]]
    });
    const secondResult = await addCampaignMembers({
      campaignId: campaign.id,
      contactIds: [contactIds[0], contactIds[0]],
      leadIds: [leadIds[0]]
    });
    const withRelations = await prisma.campaign.findUniqueOrThrow({
      where: { id: campaign.id },
      include: {
        contacts: true,
        leads: true
      }
    });

    expect(secondResult.addedContactIds).toEqual([]);
    expect(secondResult.addedLeadIds).toEqual([]);
    expect(secondResult.skippedExistingContactIds).toEqual([contactIds[0]]);
    expect(secondResult.skippedExistingLeadIds).toEqual([leadIds[0]]);
    expect(secondResult.memberCounts).toEqual({
      contacts: 1,
      leads: 1,
      total: 2
    });
    expect(withRelations.contacts).toHaveLength(1);
    expect(withRelations.leads).toHaveLength(1);
  });

  it("rejects empty or invalid member input", async () => {
    const campaign = await createCampaign({
      name: "Campaign member invalid",
      ownerId
    });

    await expect(
      addCampaignMembers({
        campaignId: campaign.id
      })
    ).rejects.toThrow("At least one campaign member ID is required.");
    await expect(
      addCampaignMembers({
        campaignId: campaign.id,
        contactIds: [""]
      })
    ).rejects.toThrow();
    await expect(listCampaignMembers("missing-campaign")).rejects.toThrow();
  });
});

async function createOwner() {
  await prisma.user.create({
    data: {
      id: ownerId,
      name: "Campaign Member Owner",
      email: `${ownerId}@example.test`
    }
  });
}

async function createContact(id: string, firstName: string, lastName: string) {
  await prisma.contact.create({
    data: {
      id,
      firstName,
      lastName,
      email: `${id}@example.test`,
      status: "active"
    }
  });
}

async function createLead(
  id: string,
  firstName: string,
  lastName: string,
  source: string
) {
  await prisma.lead.create({
    data: {
      id,
      firstName,
      lastName,
      email: `${id}@example.test`,
      source,
      status: "new"
    }
  });
}

async function cleanupCampaignMemberFixtures() {
  await prisma.auditEvent.deleteMany({
    where: {
      OR: [
        {
          entityType: "campaign",
          summary: {
            contains: "Campaign member"
          }
        },
        {
          entityType: "campaign",
          metadata: {
            contains: "test-campaign-member"
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
            startsWith: "Campaign member"
          }
        },
        {
          ownerId
        }
      ]
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

function auditMetadata(event: {
  metadata: string | null;
}): Record<string, unknown> {
  return JSON.parse(event.metadata ?? "{}") as Record<string, unknown>;
}
