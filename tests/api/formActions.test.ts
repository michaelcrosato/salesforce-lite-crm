import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { updateAccountAction } from "@/app/accounts/actions";
import { updateContactAction } from "@/app/contacts/actions";
import { prisma } from "@/lib/prisma";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn()
}));

const accountId = "test-form-action-account";
const contactId = "test-form-action-contact";

describe("CRM form actions", () => {
  beforeEach(async () => {
    await cleanupFormActionFixtures();
  });

  afterEach(async () => {
    await cleanupFormActionFixtures();
  });

  it("clears nullable account fields when edit form values are blank", async () => {
    await prisma.account.create({
      data: {
        id: accountId,
        name: "Action Account",
        domain: "example.test",
        industry: "Manufacturing",
        city: "Vancouver",
        region: "BC",
        status: "active",
        healthScore: 80
      }
    });

    const result = await updateAccountAction(
      accountId,
      formData({
        name: "Action Account Updated",
        domain: "",
        industry: "",
        city: "",
        region: "",
        status: "paused",
        ownerId: "",
        healthScore: "65"
      })
    );
    const updated = await prisma.account.findUniqueOrThrow({
      where: {
        id: accountId
      }
    });

    expect(result.ok).toBe(true);
    expect(updated.domain).toBeNull();
    expect(updated.industry).toBeNull();
    expect(updated.city).toBeNull();
    expect(updated.region).toBeNull();
  });

  it("clears nullable contact fields and account relation when edit form values are blank", async () => {
    await prisma.account.create({
      data: {
        id: accountId,
        name: "Action Contact Account",
        status: "active",
        healthScore: 80
      }
    });
    await prisma.contact.create({
      data: {
        id: contactId,
        accountId,
        firstName: "Action",
        lastName: "Contact",
        email: "action.contact@example.test",
        phone: "604-555-0100",
        title: "Buyer",
        status: "active"
      }
    });

    const result = await updateContactAction(
      contactId,
      formData({
        accountId: "",
        firstName: "Action",
        lastName: "Contact",
        email: "",
        phone: "",
        title: "",
        status: "inactive"
      })
    );
    const updated = await prisma.contact.findUniqueOrThrow({
      where: {
        id: contactId
      }
    });

    expect(result.ok).toBe(true);
    expect(updated.accountId).toBeNull();
    expect(updated.email).toBeNull();
    expect(updated.phone).toBeNull();
    expect(updated.title).toBeNull();
  });
});

function formData(values: Record<string, string>) {
  const form = new FormData();

  for (const [key, value] of Object.entries(values)) {
    form.set(key, value);
  }

  return form;
}

async function cleanupFormActionFixtures() {
  await prisma.contact.deleteMany({
    where: {
      OR: [
        {
          id: contactId
        },
        {
          email: "action.contact@example.test"
        }
      ]
    }
  });
  await prisma.account.deleteMany({
    where: {
      id: accountId
    }
  });
}
