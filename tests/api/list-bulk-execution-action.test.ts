import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  executeListBulkExecutionAction,
  previewListBulkExecutionAction
} from "@/app/list-selected-export-actions";
import { prisma } from "@/lib/prisma";

const accountId = "test-list-bulk-action-account";
const activeContactId = "test-list-bulk-action-contact-active";
const inactiveContactId = "test-list-bulk-action-contact-inactive";
const dealerOrderId = "test-list-bulk-action-dealer-order";
const missingId = "test-list-bulk-action-missing";

describe("list bulk execution actions", () => {
  beforeEach(async () => {
    await cleanupListBulkExecutionFixtures();
    await createListBulkExecutionFixtures();
  });

  afterEach(async () => {
    await cleanupListBulkExecutionFixtures();
  });

  it("builds a no-write dry run from selected visible records", async () => {
    const auditCountBefore = await prisma.auditEvent.count();
    const contactsBefore = await listContacts();
    const formData = contactStatusUpdateFormData();

    const result = await previewListBulkExecutionAction(formData);

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error(result.message);
    }
    expect(result.packet).toMatchObject({
      mode: "dry_run_review",
      entityMetadata: {
        entity: "contacts",
        label: "Contacts"
      },
      actionMetadata: {
        action: "status_update",
        supported: true
      },
      rollup: {
        status: "partial",
        requestedCount: 4,
        uniqueRecordCount: 3,
        duplicateCount: 1,
        missingCount: 1,
        eligibleCount: 1,
        blockedCount: 3,
        wouldMutate: false,
        requiresApproval: false
      }
    });
    expect(
      result.packet.dryRun.records.map((record) => [record.id, record.reason])
    ).toEqual([
      [activeContactId, "eligible"],
      [inactiveContactId, "no_change"],
      [missingId, "not_found"]
    ]);
    expect(await prisma.auditEvent.count()).toBe(auditCountBefore);
    expect(await listContacts()).toEqual(contactsBefore);
  });

  it("requires confirmation before executing selected list records", async () => {
    const formData = contactStatusUpdateFormData();

    const result = await executeListBulkExecutionAction(formData);

    expect(result).toEqual({
      ok: false,
      message: "Confirm execution before running the bulk action.",
      fieldErrors: {
        confirmation: ["Confirm execution before running the bulk action."]
      }
    });
    expect(await listContacts()).toEqual([
      { id: activeContactId, status: "active" },
      { id: inactiveContactId, status: "inactive" }
    ]);
  });

  it("executes eligible records and returns per-record audit evidence", async () => {
    const formData = contactStatusUpdateFormData();
    formData.set("confirmExecution", "confirmed");

    const result = await executeListBulkExecutionAction(formData);
    const contacts = await listContacts();
    const auditEvent = await prisma.auditEvent.findFirstOrThrow({
      where: {
        entityType: "contact",
        entityId: activeContactId,
        metadata: { contains: "bulk_action_execution" }
      }
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error(result.message);
    }
    expect(result.execution.records.map((record) => [
      record.id,
      record.executionStatus,
      Boolean(record.auditEventId)
    ])).toEqual([
      [activeContactId, "executed", true],
      [inactiveContactId, "skipped", false],
      [missingId, "skipped", false]
    ]);
    expect(result.execution.rollup).toMatchObject({
      status: "partial",
      requestedCount: 4,
      executedCount: 1,
      skippedCount: 3,
      blockedCount: 3,
      auditEventCount: 1,
      wouldMutate: true
    });
    expect(contacts).toEqual([
      { id: activeContactId, status: "inactive" },
      { id: inactiveContactId, status: "inactive" }
    ]);
    expect(auditEvent).toMatchObject({
      category: "record",
      action: "status_changed",
      entityType: "contact",
      entityId: activeContactId
    });
    expect(auditEvent.metadata).toContain('"source":"bulk_action_execution"');
    expect(auditEvent.metadata).toContain('"targetValue":"inactive"');
  });

  it("rejects list actions that the executor does not support", async () => {
    const formData = new FormData();
    formData.set("entity", "dealer-orders");
    formData.set("action", "status_update");
    formData.append("recordIds", dealerOrderId);
    formData.set("targetStatus", "paused");

    const result = await previewListBulkExecutionAction(formData);
    const dealerOrder = await prisma.dealerOrder.findUniqueOrThrow({
      where: { id: dealerOrderId },
      select: { status: true }
    });

    expect(result).toEqual({
      ok: false,
      message: "This bulk action is not available for the selected list.",
      fieldErrors: {
        action: ["This bulk action is not available for the selected list."]
      }
    });
    expect(dealerOrder.status).toBe("active");
  });
});

function contactStatusUpdateFormData() {
  const formData = new FormData();
  formData.set("entity", "contacts");
  formData.set("action", "status_update");
  formData.append("recordIds", activeContactId);
  formData.append("recordIds", inactiveContactId);
  formData.append("recordIds", missingId);
  formData.append("recordIds", activeContactId);
  formData.set("targetStatus", "inactive");

  return formData;
}

async function createListBulkExecutionFixtures() {
  await prisma.account.create({
    data: {
      id: accountId,
      name: "List Bulk Execution Account",
      status: "active",
      healthScore: 80
    }
  });
  await prisma.contact.createMany({
    data: [
      {
        id: activeContactId,
        accountId,
        firstName: "Active",
        lastName: "Bulk",
        email: "active.list.bulk@example.test",
        status: "active"
      },
      {
        id: inactiveContactId,
        accountId,
        firstName: "Inactive",
        lastName: "Bulk",
        email: "inactive.list.bulk@example.test",
        status: "inactive"
      }
    ]
  });
  await prisma.dealerOrder.create({
    data: {
      id: dealerOrderId,
      accountId,
      name: "List Bulk Execution Dealer Order",
      monthlyQuota: 12,
      status: "active",
      startDate: new Date("2026-05-01T00:00:00Z")
    }
  });
}

async function cleanupListBulkExecutionFixtures() {
  await prisma.auditEvent.deleteMany({
    where: {
      OR: [
        { metadata: { contains: "bulk_action_execution" } },
        {
          entityId: {
            in: [activeContactId, inactiveContactId, dealerOrderId]
          }
        }
      ]
    }
  });
  await prisma.dealerOrder.deleteMany({
    where: { id: dealerOrderId }
  });
  await prisma.contact.deleteMany({
    where: {
      OR: [
        { id: { in: [activeContactId, inactiveContactId] } },
        {
          email: {
            in: [
              "active.list.bulk@example.test",
              "inactive.list.bulk@example.test"
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
    where: { id: { in: [activeContactId, inactiveContactId] } },
    orderBy: { id: "asc" },
    select: { id: true, status: true }
  });
}
