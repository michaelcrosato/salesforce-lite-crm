import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  BULK_ACTION_EXECUTION_ACTIONS,
  executeBulkAction,
  getBulkActionExecutionDefinition,
  listBulkActionExecutionDefinitions
} from "@/lib/server/bulkActionExecution";

const ownerAId = "test-bulk-exec-owner-a";
const ownerBId = "test-bulk-exec-owner-b";
const activeAccountId = "test-bulk-exec-account-active";
const pausedAccountId = "test-bulk-exec-account-paused";
const contactId = "test-bulk-exec-contact";
const opportunityId = "test-bulk-exec-opportunity";
const leadId = "test-bulk-exec-lead";
const dealerOrderId = "test-bulk-exec-dealer-order";
const missingId = "test-bulk-exec-missing";
const taskTitle = "Bulk execution follow-up";

const writeFlags = {
  database: true,
  mutations: true,
  auditEvents: true,
  approvals: false,
  files: false,
  externalServices: false,
  backgroundJobs: false
};

describe("server bulk action execution", () => {
  beforeEach(async () => {
    await cleanupBulkActionExecutionFixtures();
    await createBulkActionExecutionFixtures();
  });

  afterEach(async () => {
    await cleanupBulkActionExecutionFixtures();
  });

  it("publishes deterministic execution definitions without excluded actions", () => {
    const definitions = listBulkActionExecutionDefinitions();
    const accountDefinition = getBulkActionExecutionDefinition("accounts");
    const opportunityDefinition =
      getBulkActionExecutionDefinition("opportunities");
    const dealerOrderDefinition =
      getBulkActionExecutionDefinition("dealer-orders");

    expect(BULK_ACTION_EXECUTION_ACTIONS).toEqual([
      "status_update",
      "stage_update",
      "owner_assignment",
      "task_creation"
    ]);
    expect(definitions.map((definition) => definition.entity)).toEqual([
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
    expect(accountDefinition).toEqual({
      mode: "bulk_action_execution",
      entity: "accounts",
      supportedActions: [
        "status_update",
        "owner_assignment",
        "task_creation"
      ],
      maxSelectedRecords: 200,
      write: writeFlags
    });
    expect(opportunityDefinition.supportedActions).toEqual([
      "stage_update",
      "owner_assignment",
      "task_creation"
    ]);
    expect(dealerOrderDefinition.supportedActions).toEqual([]);
  });

  it("executes eligible status updates and skips missing, duplicate, and no-change records", async () => {
    const result = await executeBulkAction({
      entity: "accounts",
      action: "status_update",
      recordIds: [activeAccountId, pausedAccountId, missingId, activeAccountId],
      targetStatus: "paused",
      generatedAt: new Date("2026-05-24T14:00:00Z")
    });
    const accounts = await prisma.account.findMany({
      where: { id: { in: [activeAccountId, pausedAccountId] } },
      orderBy: { id: "asc" },
      select: { id: true, status: true }
    });
    const auditEvent = await prisma.auditEvent.findFirstOrThrow({
      where: {
        entityType: "account",
        entityId: activeAccountId,
        summary: { contains: "Bulk status_update executed" }
      }
    });

    expect(result).toMatchObject({
      mode: "bulk_action_execution",
      entity: "accounts",
      action: "status_update",
      supported: true,
      write: writeFlags
    });
    expect(result.records.map((record) => [record.id, record.executionStatus])).toEqual([
      [activeAccountId, "executed"],
      [pausedAccountId, "skipped"],
      [missingId, "skipped"]
    ]);
    expect(result.rollup).toEqual({
      status: "partial",
      requestedCount: 4,
      uniqueRecordCount: 3,
      duplicateCount: 1,
      missingCount: 1,
      eligibleCount: 1,
      executedCount: 1,
      skippedCount: 3,
      blockedCount: 3,
      failedCount: 0,
      auditEventCount: 1,
      wouldMutate: true,
      requiresApproval: false
    });
    expect(accounts).toEqual([
      { id: activeAccountId, status: "paused" },
      { id: pausedAccountId, status: "paused" }
    ]);
    expect(auditEvent).toMatchObject({
      category: "record",
      action: "status_changed",
      occurredAt: new Date("2026-05-24T14:00:00Z")
    });
    expect(auditEvent.metadata).toContain('"source":"bulk_action_execution"');
    expect(auditEvent.metadata).toContain(`"selectedRecordId":"${activeAccountId}"`);
    expect(auditEvent.metadata).toContain('"targetValue":"paused"');
  });

  it("executes opportunity stage updates through the existing stage-history mutation path", async () => {
    const result = await executeBulkAction({
      entity: "opportunities",
      action: "stage_update",
      recordIds: [opportunityId],
      targetStage: "proposal",
      generatedAt: new Date("2026-05-24T14:15:00Z")
    });
    const opportunity = await prisma.deal.findUniqueOrThrow({
      where: { id: opportunityId },
      select: { stage: true }
    });
    const history = await prisma.opportunityStageHistory.findMany({
      where: { dealId: opportunityId },
      orderBy: { changedAt: "asc" },
      select: { fromStage: true, toStage: true, changedByUserId: true }
    });
    const auditEvent = await prisma.auditEvent.findFirstOrThrow({
      where: {
        entityType: "opportunity",
        entityId: opportunityId,
        action: "stage_changed"
      }
    });

    expect(result.rollup).toMatchObject({
      status: "completed",
      executedCount: 1,
      blockedCount: 0,
      auditEventCount: 1
    });
    expect(result.records[0]).toMatchObject({
      id: opportunityId,
      executionStatus: "executed",
      affectedEntityType: "opportunity",
      affectedRecordId: opportunityId
    });
    expect(opportunity.stage).toBe("proposal");
    expect(history).toEqual([
      {
        fromStage: "qualified",
        toStage: "proposal",
        changedByUserId: ownerAId
      }
    ]);
    expect(auditEvent.metadata).toContain('"action":"stage_update"');
    expect(auditEvent.metadata).toContain('"previousValue":"qualified"');
  });

  it("executes owner assignment with target-owner validation and audit metadata", async () => {
    const result = await executeBulkAction({
      entity: "accounts",
      action: "owner_assignment",
      recordIds: [activeAccountId, pausedAccountId],
      targetOwnerId: ownerBId
    });
    const accounts = await prisma.account.findMany({
      where: { id: { in: [activeAccountId, pausedAccountId] } },
      orderBy: { id: "asc" },
      select: { id: true, ownerId: true }
    });
    const auditEvent = await prisma.auditEvent.findFirstOrThrow({
      where: {
        entityType: "account",
        entityId: activeAccountId,
        action: "updated",
        summary: { contains: "Bulk owner_assignment executed" }
      }
    });

    expect(result.records.map((record) => [record.id, record.executionStatus])).toEqual([
      [activeAccountId, "executed"],
      [pausedAccountId, "skipped"]
    ]);
    expect(result.rollup).toMatchObject({
      status: "partial",
      eligibleCount: 1,
      executedCount: 1,
      skippedCount: 1,
      auditEventCount: 1
    });
    expect(accounts).toEqual([
      { id: activeAccountId, ownerId: ownerBId },
      { id: pausedAccountId, ownerId: ownerBId }
    ]);
    expect(auditEvent.metadata).toContain('"targetValue":"test-bulk-exec-owner-b"');
  });

  it("executes task creation for eligible records and records executor audit events", async () => {
    const result = await executeBulkAction({
      entity: "leads",
      action: "task_creation",
      recordIds: [leadId, missingId],
      taskTitle,
      generatedAt: new Date("2026-05-24T14:30:00Z")
    });
    const createdTask = await prisma.task.findFirstOrThrow({
      where: {
        leadId,
        title: taskTitle
      },
      select: { id: true, title: true, leadId: true, status: true }
    });
    const executorAudit = await prisma.auditEvent.findFirstOrThrow({
      where: {
        entityType: "task",
        entityId: createdTask.id,
        summary: { contains: "Bulk task_creation created task" }
      }
    });
    const serviceAudit = await prisma.auditEvent.findFirstOrThrow({
      where: {
        entityType: "task",
        entityId: createdTask.id,
        summary: { contains: "Task created" }
      }
    });

    expect(result.records.map((record) => [record.id, record.executionStatus])).toEqual([
      [leadId, "created"],
      [missingId, "skipped"]
    ]);
    expect(result.records[0]?.affectedRecordId).toBe(createdTask.id);
    expect(result.rollup).toMatchObject({
      status: "partial",
      eligibleCount: 1,
      executedCount: 1,
      skippedCount: 1,
      blockedCount: 1,
      auditEventCount: 1
    });
    expect(createdTask).toMatchObject({
      title: taskTitle,
      leadId,
      status: "open"
    });
    expect(executorAudit).toMatchObject({
      action: "created",
      occurredAt: new Date("2026-05-24T14:30:00Z")
    });
    expect(executorAudit.metadata).toContain('"linkedEntity":"leads"');
    expect(executorAudit.metadata).toContain(`"createdTaskId":"${createdTask.id}"`);
    expect(serviceAudit.action).toBe("created");
  });

  it("blocks execution for excluded dealer-order writes even when dry-run would be eligible", async () => {
    const result = await executeBulkAction({
      entity: "dealer-orders",
      action: "status_update",
      recordIds: [dealerOrderId],
      targetStatus: "paused"
    });
    const dealerOrder = await prisma.dealerOrder.findUniqueOrThrow({
      where: { id: dealerOrderId },
      select: { status: true }
    });
    const auditCount = await prisma.auditEvent.count({
      where: {
        entityType: "dealer_order",
        entityId: dealerOrderId,
        metadata: { contains: "bulk_action_execution" }
      }
    });

    expect(result.supported).toBe(false);
    expect(result.dryRun).toMatchObject({
      eligibleCount: 1,
      blockedCount: 0
    });
    expect(result.records).toHaveLength(1);
    expect(result.records[0]).toMatchObject({
      id: dealerOrderId,
      executionStatus: "blocked",
      executed: false,
      message:
        "Bulk execution does not support status_update for dealer-orders."
    });
    expect(result.rollup).toMatchObject({
      status: "blocked",
      executedCount: 0,
      skippedCount: 1,
      blockedCount: 1,
      auditEventCount: 0,
      wouldMutate: false
    });
    expect(dealerOrder.status).toBe("active");
    expect(auditCount).toBe(0);
  });

  it("rejects unknown execution keys before writes", async () => {
    await expect(
      executeBulkAction({
        entity: "accounts",
        action: "status_update",
        recordIds: [activeAccountId],
        targetStatus: "paused",
        apply: true
      })
    ).rejects.toThrow(/Unrecognized key: .*apply/);

    const account = await prisma.account.findUniqueOrThrow({
      where: { id: activeAccountId },
      select: { status: true }
    });
    const auditCount = await prisma.auditEvent.count({
      where: {
        entityId: activeAccountId,
        metadata: { contains: "bulk_action_execution" }
      }
    });

    expect(account.status).toBe("active");
    expect(auditCount).toBe(0);
  });
});

async function createBulkActionExecutionFixtures() {
  await prisma.user.createMany({
    data: [
      {
        id: ownerAId,
        name: "Bulk Exec Owner A",
        email: "bulk.exec.owner.a@example.test"
      },
      {
        id: ownerBId,
        name: "Bulk Exec Owner B",
        email: "bulk.exec.owner.b@example.test"
      }
    ]
  });
  await prisma.account.createMany({
    data: [
      {
        id: activeAccountId,
        name: "Bulk Exec Active Account",
        status: "active",
        ownerId: ownerAId,
        healthScore: 80
      },
      {
        id: pausedAccountId,
        name: "Bulk Exec Paused Account",
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
      lastName: "Execution",
      email: "bulk.execution.contact@example.test",
      status: "active"
    }
  });
  await prisma.deal.create({
    data: {
      id: opportunityId,
      accountId: activeAccountId,
      contactId,
      ownerId: ownerAId,
      name: "Bulk Execution Opportunity",
      stage: "qualified",
      value: 10000,
      probability: 40
    }
  });
  await prisma.lead.create({
    data: {
      id: leadId,
      firstName: "Bulk",
      lastName: "Execution",
      status: "new"
    }
  });
  await prisma.dealerOrder.create({
    data: {
      id: dealerOrderId,
      accountId: activeAccountId,
      name: "Bulk Execution Dealer Order",
      monthlyQuota: 10,
      status: "active",
      startDate: new Date("2026-05-01T00:00:00Z")
    }
  });
}

async function cleanupBulkActionExecutionFixtures() {
  await prisma.auditEvent.deleteMany({
    where: {
      OR: [
        { metadata: { contains: "bulk_action_execution" } },
        { summary: { contains: taskTitle } },
        { entityId: { in: [activeAccountId, pausedAccountId, opportunityId] } }
      ]
    }
  });
  await prisma.task.deleteMany({
    where: {
      OR: [{ title: taskTitle }, { leadId }]
    }
  });
  await prisma.dealerOrder.deleteMany({
    where: { id: dealerOrderId }
  });
  await prisma.lead.deleteMany({
    where: { id: leadId }
  });
  await prisma.opportunityStageHistory.deleteMany({
    where: { dealId: opportunityId }
  });
  await prisma.deal.deleteMany({
    where: { id: opportunityId }
  });
  await prisma.contact.deleteMany({
    where: {
      OR: [{ id: contactId }, { email: "bulk.execution.contact@example.test" }]
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
