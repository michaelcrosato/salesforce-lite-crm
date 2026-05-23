import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  BULK_ACTION_DRY_RUN_ACTIONS,
  BULK_ACTION_DRY_RUN_ENTITIES,
  dryRunBulkAction
} from "@/lib/server/bulkActionDryRun";

const ownerAId = "test-bulk-owner-a";
const ownerBId = "test-bulk-owner-b";
const activeAccountId = "test-bulk-account-active";
const pausedAccountId = "test-bulk-account-paused";
const contactId = "test-bulk-contact";
const opportunityId = "test-bulk-opportunity";
const leadId = "test-bulk-lead";
const taskId = "test-bulk-task";
const caseId = "test-bulk-case";
const campaignId = "test-bulk-campaign";
const missingId = "test-bulk-missing";

describe("server bulk action dry-run contracts", () => {
  beforeEach(async () => {
    await cleanupBulkActionFixtures();
    await createBulkActionFixtures();
  });

  afterEach(async () => {
    await cleanupBulkActionFixtures();
  });

  it("publishes deterministic dry-run action and entity catalogs", () => {
    expect(BULK_ACTION_DRY_RUN_ACTIONS).toEqual([
      "status_update",
      "stage_update",
      "owner_assignment",
      "task_creation",
      "selected_export"
    ]);
    expect(BULK_ACTION_DRY_RUN_ENTITIES).toEqual([
      "accounts",
      "contacts",
      "opportunities",
      "leads",
      "activities",
      "dealer-orders",
      "areas",
      "tasks",
      "cases",
      "campaigns"
    ]);
  });

  it("plans status updates with missing, no-change, and duplicate counts without writes", async () => {
    const result = await dryRunBulkAction({
      entity: "accounts",
      action: "status_update",
      recordIds: [activeAccountId, pausedAccountId, missingId, activeAccountId],
      targetStatus: "paused",
      generatedAt: new Date("2026-05-22T12:00:00Z")
    });
    const accounts = await prisma.account.findMany({
      where: {
        id: {
          in: [activeAccountId, pausedAccountId]
        }
      },
      orderBy: { id: "asc" },
      select: { id: true, status: true }
    });

    expect(result).toMatchObject({
      entity: "accounts",
      action: "status_update",
      requestedCount: 4,
      uniqueRecordCount: 3,
      duplicateCount: 1,
      missingCount: 1,
      eligibleCount: 1,
      blockedCount: 3,
      wouldMutate: false,
      requiresApproval: false
    });
    expect(result.records.map((record) => [record.id, record.reason])).toEqual([
      [activeAccountId, "eligible"],
      [pausedAccountId, "no_change"],
      [missingId, "not_found"]
    ]);
    expect(result.duplicateSelections).toEqual([
      { id: activeAccountId, occurrences: 2 }
    ]);
    expect(result.audit).toMatchObject({
      summary: "status_update dry run for accounts: 1 eligible, 3 blocked.",
      metadata: {
        source: "bulk_action_dry_run",
        entity: "accounts",
        action: "status_update",
        target: "paused",
        generatedAt: "2026-05-22T12:00:00.000Z",
        wouldMutate: false,
        requiresApproval: false,
        supported: true,
        allowedValues: ["active", "paused", "churned"]
      }
    });
    expect(accounts).toEqual([
      { id: activeAccountId, status: "active" },
      { id: pausedAccountId, status: "paused" }
    ]);
  });

  it("plans opportunity stage updates and blocks invalid targets without writes", async () => {
    const validResult = await dryRunBulkAction({
      entity: "opportunities",
      action: "stage_update",
      recordIds: [opportunityId],
      targetStage: "proposal"
    });
    const invalidResult = await dryRunBulkAction({
      entity: "opportunities",
      action: "stage_update",
      recordIds: [opportunityId],
      targetStage: "archived"
    });
    const opportunity = await prisma.deal.findUniqueOrThrow({
      where: { id: opportunityId },
      select: { stage: true }
    });

    expect(validResult.records).toEqual([
      {
        id: opportunityId,
        label: "Bulk Dry Run Opportunity",
        eligible: true,
        reason: "eligible",
        message: "Selected record would be eligible for this change.",
        currentValue: "qualified",
        targetValue: "proposal"
      }
    ]);
    expect(invalidResult.records).toEqual([
      {
        id: opportunityId,
        label: "Bulk Dry Run Opportunity",
        eligible: false,
        reason: "invalid_target",
        message: "Target stage is not valid for opportunities.",
        currentValue: "qualified",
        targetValue: "archived"
      }
    ]);
    expect(opportunity.stage).toBe("qualified");
  });

  it("validates owner assignment targets and unsupported entity combinations", async () => {
    const ownerResult = await dryRunBulkAction({
      entity: "accounts",
      action: "owner_assignment",
      recordIds: [activeAccountId, pausedAccountId],
      targetOwnerId: ownerBId
    });
    const missingOwnerResult = await dryRunBulkAction({
      entity: "accounts",
      action: "owner_assignment",
      recordIds: [activeAccountId],
      targetOwnerId: "test-bulk-owner-missing"
    });
    const unsupportedResult = await dryRunBulkAction({
      entity: "contacts",
      action: "owner_assignment",
      recordIds: [contactId],
      targetOwnerId: ownerBId
    });
    const account = await prisma.account.findUniqueOrThrow({
      where: { id: activeAccountId },
      select: { ownerId: true }
    });

    expect(ownerResult.records.map((record) => record.reason)).toEqual([
      "eligible",
      "no_change"
    ]);
    expect(ownerResult.audit.metadata).toMatchObject({
      targetOwnerId: ownerBId,
      targetOwnerName: "Bulk Owner B",
      targetOwnerEmail: "bulk.owner.b@example.test"
    });
    expect(missingOwnerResult.records[0]).toMatchObject({
      eligible: false,
      reason: "target_not_found",
      targetValue: "test-bulk-owner-missing"
    });
    expect(unsupportedResult.records[0]).toMatchObject({
      eligible: false,
      reason: "unsupported_action_for_entity",
      message: "Owner assignment is not supported for this entity."
    });
    expect(account.ownerId).toBe(ownerAId);
  });

  it("plans task creation eligibility without creating tasks", async () => {
    const taskCountBefore = await prisma.task.count();
    const eligibleResult = await dryRunBulkAction({
      entity: "leads",
      action: "task_creation",
      recordIds: [leadId, missingId],
      taskTitle: "Call selected lead"
    });
    const unsupportedResult = await dryRunBulkAction({
      entity: "campaigns",
      action: "task_creation",
      recordIds: [campaignId],
      taskTitle: "Call campaign member"
    });
    const taskCountAfter = await prisma.task.count();

    expect(eligibleResult).toMatchObject({
      eligibleCount: 1,
      blockedCount: 1,
      missingCount: 1,
      wouldMutate: false
    });
    expect(eligibleResult.records.map((record) => record.reason)).toEqual([
      "eligible",
      "not_found"
    ]);
    expect(unsupportedResult.records[0]).toMatchObject({
      eligible: false,
      reason: "unsupported_action_for_entity",
      message: "Task creation is not supported for this entity."
    });
    expect(taskCountAfter).toBe(taskCountBefore);
  });

  it("plans selected export eligibility using existing CSV export contracts", async () => {
    const result = await dryRunBulkAction({
      entity: "contacts",
      action: "selected_export",
      recordIds: [contactId, missingId]
    });

    expect(result).toMatchObject({
      entity: "contacts",
      action: "selected_export",
      eligibleCount: 1,
      blockedCount: 1,
      missingCount: 1,
      wouldMutate: false,
      requiresApproval: false
    });
    expect(result.records.map((record) => [record.id, record.reason])).toEqual([
      [contactId, "eligible"],
      [missingId, "not_found"]
    ]);
    expect(result.audit.metadata).toMatchObject({
      filename: "contacts.csv",
      contentType: "text/csv; charset=utf-8",
      columnCount: 11,
      route: "/contacts"
    });
  });

  it("rejects unknown dry-run keys without writing records", async () => {
    const taskCountBefore = await prisma.task.count();

    await expect(
      dryRunBulkAction({
        entity: "accounts",
        action: "task_creation",
        recordIds: [activeAccountId],
        taskTitle: "Follow up",
        apply: true
      })
    ).rejects.toThrow("Unrecognized key(s) in object: 'apply'");

    await expect(
      dryRunBulkAction({
        entity: "accounts",
        action: "task_creation",
        recordIds: [activeAccountId],
        taskTitle: ""
      })
    ).rejects.toThrow("String must contain at least 1 character(s)");
    expect(await prisma.task.count()).toBe(taskCountBefore);
  });
});

async function createBulkActionFixtures() {
  await prisma.user.createMany({
    data: [
      {
        id: ownerAId,
        name: "Bulk Owner A",
        email: "bulk.owner.a@example.test"
      },
      {
        id: ownerBId,
        name: "Bulk Owner B",
        email: "bulk.owner.b@example.test"
      }
    ]
  });
  await prisma.account.createMany({
    data: [
      {
        id: activeAccountId,
        name: "Bulk Active Account",
        status: "active",
        ownerId: ownerAId,
        healthScore: 80
      },
      {
        id: pausedAccountId,
        name: "Bulk Paused Account",
        status: "paused",
        ownerId: ownerBId,
        healthScore: 70
      }
    ]
  });
  await prisma.contact.create({
    data: {
      id: contactId,
      accountId: activeAccountId,
      firstName: "Bulk",
      lastName: "Contact",
      email: "bulk.contact@example.test",
      status: "active"
    }
  });
  await prisma.deal.create({
    data: {
      id: opportunityId,
      accountId: activeAccountId,
      contactId,
      ownerId: ownerAId,
      name: "Bulk Dry Run Opportunity",
      stage: "qualified",
      value: 10000,
      probability: 40
    }
  });
  await prisma.lead.create({
    data: {
      id: leadId,
      firstName: "Bulk",
      lastName: "Lead",
      status: "new"
    }
  });
  await prisma.task.create({
    data: {
      id: taskId,
      title: "Existing bulk task",
      status: "open",
      priority: "normal",
      ownerId: ownerAId,
      accountId: activeAccountId
    }
  });
  await prisma.case.create({
    data: {
      id: caseId,
      subject: "Existing bulk case",
      status: "new",
      priority: "normal",
      ownerId: ownerAId,
      accountId: activeAccountId,
      contactId
    }
  });
  await prisma.campaign.create({
    data: {
      id: campaignId,
      name: "Existing bulk campaign",
      status: "planned",
      ownerId: ownerAId
    }
  });
}

async function cleanupBulkActionFixtures() {
  await prisma.campaign.deleteMany({
    where: { id: campaignId }
  });
  await prisma.case.deleteMany({
    where: { id: caseId }
  });
  await prisma.task.deleteMany({
    where: { id: taskId }
  });
  await prisma.lead.deleteMany({
    where: { id: leadId }
  });
  await prisma.deal.deleteMany({
    where: { id: opportunityId }
  });
  await prisma.contact.deleteMany({
    where: {
      OR: [{ id: contactId }, { email: "bulk.contact@example.test" }]
    }
  });
  await prisma.account.deleteMany({
    where: {
      id: {
        in: [activeAccountId, pausedAccountId]
      }
    }
  });
  await prisma.user.deleteMany({
    where: {
      id: {
        in: [ownerAId, ownerBId]
      }
    }
  });
}
