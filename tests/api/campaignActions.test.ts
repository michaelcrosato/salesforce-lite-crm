import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createCampaignAction,
  deleteCampaignAction,
  updateCampaignAction,
  updateCampaignStatusAction
} from "@/app/campaigns/actions";
import { prisma } from "@/lib/prisma";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn()
}));

const testCampaignName = "Test Campaign Action Name";

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
});

function formData(values: Record<string, string>) {
  const form = new FormData();
  for (const [key, value] of Object.entries(values)) {
    form.set(key, value);
  }
  return form;
}

async function cleanup() {
  await prisma.campaign.deleteMany({
    where: { name: { in: [testCampaignName, "Updated Campaign"] } }
  });
}
