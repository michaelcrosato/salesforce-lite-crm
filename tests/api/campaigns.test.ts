import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createCampaign,
  deleteCampaign,
  getCampaign,
  listCampaigns,
  updateCampaign
} from "@/lib/services/campaigns";
import { completeCampaign as completeCampaignViaClient } from "@/lib/crm/crmClient";
import { prisma } from "@/lib/prisma";

const ownerId = "test-campaign-owner";
const otherOwnerId = "test-campaign-other-owner";
const leadId = "test-campaign-lead";
const contactId = "test-campaign-contact";

describe("campaigns service", () => {
  beforeEach(async () => {
    await cleanupCampaigns();
    await createOwner(ownerId, "Campaign Owner");
    await createOwner(otherOwnerId, "Other Campaign Owner");
    await createLead(leadId);
    await createContact(contactId);
  });

  afterEach(async () => {
    await cleanupCampaigns();
  });

  it("creates a campaign with validated defaults and related leads and contacts", async () => {
    const campaign = await createCampaign({
      name: "Campaign service create",
      ownerId,
      leadIds: [leadId],
      contactIds: [contactId]
    });
    const withRelations = await prisma.campaign.findUniqueOrThrow({
      where: {
        id: campaign.id
      },
      include: {
        leads: true,
        contacts: true
      }
    });

    expect(campaign.status).toBe("planned");
    expect(withRelations.leads.map((lead) => lead.id)).toEqual([leadId]);
    expect(withRelations.contacts.map((contact) => contact.id)).toEqual([
      contactId
    ]);

    const audit = await prisma.auditEvent.findFirstOrThrow({
      where: {
        action: "created",
        entityId: campaign.id,
        entityType: "campaign"
      }
    });
    expect(audit.category).toBe("record");
    expect(audit.actorUserId).toBeNull();
    expect(audit.summary).toBe("Campaign created: Campaign service create.");
    expect(auditMetadata(audit)).toMatchObject({
      contactIds: [contactId],
      leadIds: [leadId],
      name: "Campaign service create",
      ownerId,
      status: "planned"
    });
  });

  it("lists campaigns with status, owner, and start date filters", async () => {
    const matching = await createCampaign({
      name: "Campaign service matching",
      ownerId,
      status: "active",
      startDate: new Date("2026-05-20T12:00:00Z")
    });
    await createCampaign({
      name: "Campaign service wrong status",
      ownerId,
      status: "planned",
      startDate: new Date("2026-05-20T12:00:00Z")
    });
    await createCampaign({
      name: "Campaign service wrong owner",
      ownerId: otherOwnerId,
      status: "active",
      startDate: new Date("2026-05-20T12:00:00Z")
    });
    await createCampaign({
      name: "Campaign service outside start date",
      ownerId,
      status: "active",
      startDate: new Date("2026-06-01T12:00:00Z")
    });

    const campaigns = await listCampaigns({
      status: "active",
      ownerId,
      startDateFrom: "2026-05-15T00:00:00Z",
      startDateTo: "2026-05-25T23:59:59Z"
    });

    expect(campaigns.map((campaign) => campaign.id)).toEqual([matching.id]);
  });

  it("gets and updates a campaign", async () => {
    const campaign = await createCampaign({
      name: "Campaign service update",
      ownerId
    });

    const updated = await updateCampaign(campaign.id, {
      name: "Campaign service updated",
      budget: 125000,
      status: "active"
    });
    const fetched = await getCampaign(campaign.id);

    expect(updated.name).toBe("Campaign service updated");
    expect(updated.budget).toBe(125000);
    expect(fetched?.status).toBe("active");

    const audit = await prisma.auditEvent.findFirstOrThrow({
      where: {
        action: "status_changed",
        entityId: campaign.id,
        entityType: "campaign"
      }
    });
    expect(audit.category).toBe("record");
    expect(audit.summary).toBe(
      "Campaign status changed from planned to active."
    );
    expect(auditMetadata(audit)).toMatchObject({
      budget: 125000,
      changedFields: ["budget", "name", "status"],
      previousStatus: "planned",
      status: "active"
    });
  });

  it("completes a campaign through the crmClient adapter", async () => {
    const campaign = await createCampaign({
      name: "Campaign service complete",
      ownerId,
      status: "active"
    });

    const completed = await completeCampaignViaClient(campaign.id);

    expect(completed.status).toBe("completed");

    const audit = await prisma.auditEvent.findFirstOrThrow({
      where: {
        action: "campaign_completed",
        entityId: campaign.id,
        entityType: "campaign"
      }
    });
    expect(audit.category).toBe("workflow");
    expect(audit.summary).toBe(
      "Campaign completed: Campaign service complete."
    );
    expect(auditMetadata(audit)).toMatchObject({
      previousStatus: "active",
      status: "completed"
    });
  });

  it("deletes a campaign", async () => {
    const campaign = await createCampaign({
      name: "Campaign service delete",
      ownerId
    });

    await deleteCampaign(campaign.id);

    expect(await getCampaign(campaign.id)).toBeNull();
  });

  it("rejects invalid create, update, and list inputs", async () => {
    await expect(
      createCampaign({
        name: "",
        ownerId
      })
    ).rejects.toThrow();
    await expect(
      updateCampaign("missing-campaign", {
        status: "invalid"
      })
    ).rejects.toThrow();
    await expect(
      listCampaigns({
        status: "invalid"
      })
    ).rejects.toThrow();
  });
});

async function createOwner(id: string, name: string) {
  await prisma.user.create({
    data: {
      id,
      name,
      email: `${id}@example.test`
    }
  });
}

async function createLead(id: string) {
  await prisma.lead.create({
    data: {
      id,
      firstName: "Campaign",
      lastName: "Lead",
      email: `${id}@example.test`,
      status: "new"
    }
  });
}

async function createContact(id: string) {
  await prisma.contact.create({
    data: {
      id,
      firstName: "Campaign",
      lastName: "Contact",
      email: `${id}@example.test`,
      status: "active"
    }
  });
}

async function cleanupCampaigns() {
  await prisma.auditEvent.deleteMany({
    where: {
      OR: [
        {
          entityType: "campaign",
          summary: {
            contains: "Campaign service"
          }
        },
        {
          entityType: "campaign",
          metadata: {
            contains: "Campaign service"
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
            startsWith: "Campaign service"
          }
        },
        {
          ownerId: {
            in: [ownerId, otherOwnerId]
          }
        }
      ]
    }
  });
  await prisma.lead.deleteMany({
    where: {
      id: leadId
    }
  });
  await prisma.contact.deleteMany({
    where: {
      id: contactId
    }
  });
  await prisma.user.deleteMany({
    where: {
      id: {
        in: [ownerId, otherOwnerId]
      }
    }
  });
}

function auditMetadata(event: {
  metadata: string | null;
}): Record<string, unknown> {
  return JSON.parse(event.metadata ?? "{}") as Record<string, unknown>;
}
