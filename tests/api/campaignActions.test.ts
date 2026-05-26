import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  addCampaignMemberAction,
  createCampaignAction,
  deleteCampaignAction,
  removeCampaignMemberAction,
  updateCampaignAction,
  updateCampaignStatusAction
} from "@/app/campaigns/actions";
import { prisma } from "@/lib/prisma";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn()
}));

const testCampaignName = "Test Campaign Action Name";
const testMemberCampaignName = "Test Campaign Member Action Name";
const testContactId = "test-campaign-action-contact";
const testLeadId = "test-campaign-action-lead";

describe("Campaign Actions", () => {
  beforeEach(async () => {
    await cleanup();
  });

  afterEach(async () => {
    await cleanup();
  });

  it("creates a campaign", async () => {
    const result = await createCampaignAction(
      formData({
        name: testCampaignName,
        description: "Campaign Desc",
        status: "planned",
        budget: "5000"
      })
    );

    expect(result.ok).toBe(true);
    expect(result.message).toBe("Campaign created.");

    const created = await prisma.campaign.findFirst({
      where: { name: testCampaignName }
    });
    expect(created).not.toBeNull();
    expect(created?.status).toBe("planned");
    expect(created?.budget).toBe(5000);
  });

  it("validates required fields for campaign creation", async () => {
    const result = await createCampaignAction(
      formData({
        name: "",
        status: "invalid_status"
      })
    );

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("Expected campaign validation to fail");
    }
    expect(result.fieldErrors).toBeDefined();
    expect(result.fieldErrors?.name).toBeDefined();
  });

  it("updates a campaign", async () => {
    const campaign = await prisma.campaign.create({
      data: {
        name: testCampaignName,
        status: "planned"
      }
    });

    const result = await updateCampaignAction(
      campaign.id,
      formData({
        name: "Updated Campaign",
        status: "active",
        budget: "10000"
      })
    );

    expect(result.ok).toBe(true);

    const updated = await prisma.campaign.findUniqueOrThrow({
      where: { id: campaign.id }
    });
    expect(updated.name).toBe("Updated Campaign");
    expect(updated.status).toBe("active");
    expect(updated.budget).toBe(10000);
  });

  it("updates campaign status", async () => {
    const campaign = await prisma.campaign.create({
      data: {
        name: testCampaignName,
        status: "planned"
      }
    });

    const result = await updateCampaignStatusAction(campaign.id, "completed");

    expect(result.ok).toBe(true);

    const updated = await prisma.campaign.findUniqueOrThrow({
      where: { id: campaign.id }
    });
    expect(updated.status).toBe("completed");
  });

  it("rejects invalid status", async () => {
    const result = await updateCampaignStatusAction("some-id", "not-real");

    expect(result.ok).toBe(false);
    expect(result.message).toContain("Invalid status");
  });

  it("deletes a campaign", async () => {
    const campaign = await prisma.campaign.create({
      data: {
        name: testCampaignName,
        status: "planned"
      }
    });

    const result = await deleteCampaignAction(campaign.id);

    expect(result.ok).toBe(true);

    const deleted = await prisma.campaign.findUnique({
      where: { id: campaign.id }
    });
    expect(deleted).toBeNull();
  });

  it("adds and removes campaign members", async () => {
    await createMemberFixtures();
    const campaign = await prisma.campaign.create({
      data: {
        name: testMemberCampaignName,
        status: "planned"
      }
    });

    const addContactResult = await addCampaignMemberAction(
      campaign.id,
      `contact:${testContactId}`
    );
    const addLeadResult = await addCampaignMemberAction(
      campaign.id,
      `lead:${testLeadId}`
    );

    expect(addContactResult).toEqual({
      ok: true,
      message: "Campaign member added."
    });
    expect(addLeadResult).toEqual({
      ok: true,
      message: "Campaign member added."
    });

    const withMembers = await prisma.campaign.findUniqueOrThrow({
      where: { id: campaign.id },
      include: {
        contacts: true,
        leads: true
      }
    });
    expect(withMembers.contacts.map((contact) => contact.id)).toEqual([
      testContactId
    ]);
    expect(withMembers.leads.map((lead) => lead.id)).toEqual([testLeadId]);

    const removeContactResult = await removeCampaignMemberAction(
      campaign.id,
      "contact",
      testContactId
    );
    const removeLeadResult = await removeCampaignMemberAction(
      campaign.id,
      "lead",
      testLeadId
    );

    expect(removeContactResult).toEqual({
      ok: true,
      message: "Campaign member removed."
    });
    expect(removeLeadResult).toEqual({
      ok: true,
      message: "Campaign member removed."
    });

    const withoutMembers = await prisma.campaign.findUniqueOrThrow({
      where: { id: campaign.id },
      include: {
        contacts: true,
        leads: true
      }
    });
    expect(withoutMembers.contacts).toHaveLength(0);
    expect(withoutMembers.leads).toHaveLength(0);
  });

  it("rejects invalid campaign member action input", async () => {
    const addResult = await addCampaignMemberAction("some-id", "invalid");
    const removeResult = await removeCampaignMemberAction(
      "some-id",
      "account",
      "member-id"
    );

    expect(addResult).toEqual({
      ok: false,
      message: "Select a valid campaign member."
    });
    expect(removeResult).toEqual({
      ok: false,
      message: "Select a valid campaign member."
    });
  });
});

function formData(values: Record<string, string>) {
  const form = new FormData();
  for (const [key, value] of Object.entries(values)) {
    form.set(key, value);
  }
  return form;
}

async function cleanup() {
  await prisma.auditEvent.deleteMany({
    where: {
      OR: [
        {
          entityType: "campaign",
          summary: {
            contains: "Test Campaign Member Action"
          }
        },
        {
          entityType: "campaign",
          metadata: {
            contains: "test-campaign-action"
          }
        }
      ]
    }
  });
  await prisma.campaign.deleteMany({
    where: {
      name: {
        in: [testCampaignName, "Updated Campaign", testMemberCampaignName]
      }
    }
  });
  await prisma.lead.deleteMany({
    where: { id: testLeadId }
  });
  await prisma.contact.deleteMany({
    where: { id: testContactId }
  });
}

async function createMemberFixtures() {
  await prisma.contact.create({
    data: {
      id: testContactId,
      firstName: "Action",
      lastName: "Contact",
      email: `${testContactId}@example.test`,
      status: "active"
    }
  });
  await prisma.lead.create({
    data: {
      id: testLeadId,
      firstName: "Action",
      lastName: "Lead",
      email: `${testLeadId}@example.test`,
      source: "web",
      status: "new"
    }
  });
}
