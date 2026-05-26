import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  addCampaignMembers,
  listAvailableCampaignMembers,
  listCampaignMembers,
  removeCampaignMembers
} from "@/lib/services/campaignMembers";
import { createCampaign } from "@/lib/services/campaigns";
import { prisma } from "@/lib/prisma";

const ownerId = "test-campaign-member-owner";
const contactIds = [
  "test-campaign-member-contact-1",
  "test-campaign-member-contact-2",
  "test-campaign-member-contact-3"
] as const;
const leadIds = [
  "test-campaign-member-lead-1",
  "test-campaign-member-lead-2",
  "test-campaign-member-lead-3"
] as const;

describe("campaign member service", () => {
  beforeEach(async () => {
    await cleanupCampaignMemberFixtures();
    await createOwner();
    await createContact(contactIds[0], "Ada", "Contact");
    await createContact(contactIds[1], "Zoe", "Contact");
    await createContact(contactIds[2], "Mia", "Available");
    await createLead(leadIds[0], "Ben", "Lead", "web");
    await createLead(leadIds[1], "Nora", "Lead", "referral");
    await createLead(leadIds[2], "Liam", "Available", "event");
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

  it("lists available members while excluding current campaign members", async () => {
    const campaign = await createCampaign({
      name: "Campaign member availability",
      ownerId,
      contactIds: [contactIds[0]],
      leadIds: [leadIds[0]]
    });

    const result = await listAvailableCampaignMembers({
      campaignId: campaign.id,
      search: "available",
      limit: 1
    });

    expect(result).toMatchObject({
      campaignId: campaign.id,
      search: "available",
      limit: 1,
      availableCounts: {
        contacts: 1,
        leads: 1,
        total: 2
      },
      existingMemberCounts: {
        contacts: 1,
        leads: 1,
        total: 2
      },
      memberCounts: {
        contacts: 1,
        leads: 1,
        total: 2
      }
    });
    expect(result.contacts.map((member) => member.memberId)).toEqual([
      contactIds[2]
    ]);
    expect(result.leads.map((member) => member.memberId)).toEqual([
      leadIds[2]
    ]);
    expect(result.members.map((member) => member.displayName)).toEqual([
      "Liam Available",
      "Mia Available"
    ]);
    expect(result.members).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ memberId: contactIds[0] }),
        expect.objectContaining({ memberId: leadIds[0] })
      ])
    );
  });

  it("removes current members with deterministic audit evidence", async () => {
    const campaign = await createCampaign({
      name: "Campaign member remove",
      ownerId,
      contactIds: [contactIds[0], contactIds[1]],
      leadIds: [leadIds[0], leadIds[1]]
    });

    const result = await removeCampaignMembers({
      campaignId: campaign.id,
      contactIds: [contactIds[1], contactIds[2], contactIds[1]],
      leadIds: [leadIds[0], "missing-campaign-member-lead"]
    });
    const withRelations = await prisma.campaign.findUniqueOrThrow({
      where: { id: campaign.id },
      include: {
        contacts: true,
        leads: true
      }
    });

    expect(result.removedContactIds).toEqual([contactIds[1]]);
    expect(result.removedLeadIds).toEqual([leadIds[0]]);
    expect(result.skippedNonMemberContactIds).toEqual([contactIds[2]]);
    expect(result.skippedNonMemberLeadIds).toEqual([
      "missing-campaign-member-lead"
    ]);
    expect(result.memberCounts).toEqual({
      contacts: 1,
      leads: 1,
      total: 2
    });
    expect(result.members.map((member) => member.memberId)).toEqual([
      contactIds[0],
      leadIds[1]
    ]);
    expect(withRelations.contacts.map((contact) => contact.id)).toEqual([
      contactIds[0]
    ]);
    expect(withRelations.leads.map((lead) => lead.id)).toEqual([leadIds[1]]);

    const audit = await prisma.auditEvent.findFirstOrThrow({
      where: {
        action: "updated",
        entityId: campaign.id,
        entityType: "campaign",
        summary: "Campaign members removed: Campaign member remove."
      }
    });
    expect(audit.category).toBe("record");
    expect(auditMetadata(audit)).toMatchObject({
      campaignId: campaign.id,
      campaignName: "Campaign member remove",
      contactMemberCount: 1,
      leadMemberCount: 1,
      removedContactIds: [contactIds[1]],
      removedLeadIds: [leadIds[0]],
      requestedContactIds: [contactIds[1], contactIds[2]],
      requestedLeadIds: [leadIds[0], "missing-campaign-member-lead"],
      skippedNonMemberContactIds: [contactIds[2]],
      skippedNonMemberLeadIds: ["missing-campaign-member-lead"],
      totalMemberCount: 2
    });
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
    await expect(
      removeCampaignMembers({
        campaignId: campaign.id
      })
    ).rejects.toThrow("At least one campaign member ID is required.");
    await expect(
      removeCampaignMembers({
        campaignId: campaign.id,
        leadIds: [""]
      })
    ).rejects.toThrow();
    await expect(
      listAvailableCampaignMembers({
        campaignId: "",
        limit: 1
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
