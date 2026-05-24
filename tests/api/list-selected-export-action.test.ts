import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { previewListSelectedExportAction } from "@/app/list-selected-export-actions";
import { prisma } from "@/lib/prisma";

const accountId = "test-list-export-action-account";
const contactAId = "test-list-export-action-contact-a";
const contactBId = "test-list-export-action-contact-b";
const missingId = "test-list-export-action-missing";

describe("list selected export action", () => {
  beforeEach(async () => {
    await cleanupListSelectedExportFixtures();
    await createListSelectedExportFixtures();
  });

  afterEach(async () => {
    await cleanupListSelectedExportFixtures();
  });

  it("returns a downloadable selected export payload in submitted order", async () => {
    const auditCountBefore = await prisma.auditEvent.count();
    const contactsBefore = await listContacts();
    const formData = new FormData();
    formData.set("entity", "contacts");
    formData.append("recordIds", contactBId);
    formData.append("recordIds", missingId);
    formData.append("recordIds", contactAId);

    const result = await previewListSelectedExportAction(formData);

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error(result.message);
    }
    expect(result).toMatchObject({
      filename: "contacts.csv",
      contentType: "text/csv; charset=utf-8",
      rowCount: 2,
      selectedRecordIds: [contactBId, contactAId],
      blockedRecordIds: [missingId],
      rollup: {
        status: "partial",
        requestedCount: 3,
        uniqueRecordCount: 3,
        duplicateCount: 0,
        missingCount: 1,
        eligibleCount: 2,
        blockedCount: 1,
        exportedCount: 2,
        wouldMutate: false,
        requiresApproval: false
      }
    });
    expect(result.blockedRecords).toEqual([
      {
        id: missingId,
        label: null,
        reason: "not_found",
        message: "Selected record was not found."
      }
    ]);
    expect(result.csv.split("\n")[1].startsWith(`${contactBId},Beta,Action`))
      .toBe(true);
    expect(result.csv.split("\n")[2].startsWith(`${contactAId},Alpha,Action`))
      .toBe(true);
    expect(await prisma.auditEvent.count()).toBe(auditCountBefore);
    expect(await listContacts()).toEqual(contactsBefore);
  });

  it("reports unsupported entities and empty selections without writing", async () => {
    const auditCountBefore = await prisma.auditEvent.count();
    const invalidEntity = new FormData();
    invalidEntity.set("entity", "notes");
    invalidEntity.append("recordIds", contactAId);
    const emptySelection = new FormData();
    emptySelection.set("entity", "contacts");

    await expect(previewListSelectedExportAction(invalidEntity)).resolves.toEqual({
      ok: false,
      message: "Choose a supported selected export list.",
      fieldErrors: {
        entity: ["Choose a supported selected export list."]
      }
    });
    await expect(previewListSelectedExportAction(emptySelection)).resolves.toEqual({
      ok: false,
      message: "Select at least one visible record to export.",
      fieldErrors: {
        recordIds: ["Select at least one visible record to export."]
      }
    });
    expect(await prisma.auditEvent.count()).toBe(auditCountBefore);
  });
});

async function createListSelectedExportFixtures() {
  await prisma.account.create({
    data: {
      id: accountId,
      name: "List Selected Export Account",
      status: "active",
      healthScore: 90
    }
  });
  await prisma.contact.createMany({
    data: [
      {
        id: contactAId,
        accountId,
        firstName: "Alpha",
        lastName: "Action",
        email: "alpha.list.export@example.test",
        status: "active"
      },
      {
        id: contactBId,
        accountId,
        firstName: "Beta",
        lastName: "Action",
        email: "beta.list.export@example.test",
        status: "inactive"
      }
    ]
  });
}

async function cleanupListSelectedExportFixtures() {
  await prisma.contact.deleteMany({
    where: {
      OR: [
        { id: { in: [contactAId, contactBId] } },
        {
          email: {
            in: [
              "alpha.list.export@example.test",
              "beta.list.export@example.test"
            ]
          }
        }
      ]
    }
  });
  await prisma.account.deleteMany({
    where: { id: accountId }
  });
}

async function listContacts() {
  return prisma.contact.findMany({
    where: { id: { in: [contactAId, contactBId] } },
    orderBy: { id: "asc" },
    select: { id: true, status: true, updatedAt: true }
  });
}
