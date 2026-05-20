import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createLeadAction, updateLeadStatusAction } from "@/app/leads/actions";
import { prisma } from "@/lib/prisma";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn()
}));

const testLeadEmail = "action.lead@example.test";

describe("Lead Actions", () => {
  beforeEach(async () => {
    await cleanup();
  });

  afterEach(async () => {
    await cleanup();
  });

  it("creates a lead and attempts routing", async () => {
    const result = await createLeadAction(
      formData({
        firstName: "Action",
        lastName: "Lead",
        email: testLeadEmail,
        phone: "555-0100",
        postalCode: "X9X 9X9",
        province: "BC",
        source: "website"
      })
    );

    expect(result.ok).toBe(true);
    expect(result.message).toContain("Lead created but not routed");

    const created = await prisma.lead.findFirst({
      where: { email: testLeadEmail }
    });
    expect(created).not.toBeNull();
    expect(created?.firstName).toBe("Action");
    expect(created?.status).toBe("new");
  });

  it("validates required fields for lead creation", async () => {
    const result = await createLeadAction(
      formData({
        firstName: "",
        lastName: "",
        email: "bademail",
        postalCode: ""
      })
    );

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("Expected lead validation to fail");
    }
    expect(result.fieldErrors).toBeDefined();
    expect(result.fieldErrors?.firstName).toBeDefined();
    expect(result.fieldErrors?.lastName).toBeDefined();
    expect(result.fieldErrors?.email).toBeDefined();
  });

  it("updates lead status", async () => {
    const lead = await prisma.lead.create({
      data: {
        firstName: "Update",
        lastName: "Status",
        email: testLeadEmail,
        status: "new"
      }
    });

    const result = await updateLeadStatusAction({
      leadId: lead.id,
      status: "contacted"
    });

    expect(result.ok).toBe(true);

    const updated = await prisma.lead.findUniqueOrThrow({
      where: { id: lead.id }
    });
    expect(updated.status).toBe("contacted");
  });

  it("rejects invalid status", async () => {
    const result = await updateLeadStatusAction({
      leadId: "some-id",
      status: "invalid_status"
    });

    expect(result.ok).toBe(false);
    expect(result.message).toContain("not valid");
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
  await prisma.activity.deleteMany({
    where: { lead: { email: testLeadEmail } }
  });
  await prisma.lead.deleteMany({
    where: { email: testLeadEmail }
  });
}
