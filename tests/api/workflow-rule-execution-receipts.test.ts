import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  WORKFLOW_RULE_EXECUTION_RECEIPT_CONTENT_TYPE,
  WORKFLOW_RULE_EXECUTION_RECEIPT_VERSION,
  getWorkflowRuleExecutionReadinessReceipt
} from "@/lib/server/workflowRuleExecutionReceipts";

const accountIds = [
  "test-workflow-execution-account-01",
  "test-workflow-execution-account-02"
] as const;

const noWriteFlags = {
  database: false,
  workflowRules: false,
  crmRecords: false,
  auditEvents: false,
  routes: false,
  routeHandlers: false,
  productUi: false,
  schema: false,
  crmContract: false,
  files: false,
  externalServices: false,
  backgroundJobs: false,
  scheduledSweeps: false,
  actionExecution: false,
  actionApprovals: false,
  executorRuns: false,
  executionReceipts: false
};

describe("server workflow rule execution readiness receipts", () => {
  beforeEach(async () => {
    await cleanupWorkflowExecutionFixtures();
    await createWorkflowExecutionFixtures();
  });

  afterEach(async () => {
    await cleanupWorkflowExecutionFixtures();
  });

  it("summarizes future manual executor eligibility and audit intent", async () => {
    const countsBefore = await currentCounts();
    const receipt = await getWorkflowRuleExecutionReadinessReceipt({
      entity: "accounts",
      trigger: "status_changed",
      conditions: [
        {
          condition: "accountText",
          operator: "contains",
          value: "Workflow Execution Receipt"
        }
      ],
      actions: [
        {
          action: "draft_status_update",
          targetValue: "paused",
          reason: "Operator approval is required before pausing"
        },
        {
          action: "draft_task",
          title: "Review workflow execution receipt account",
          priority: "high"
        }
      ],
      limit: 2,
      generatedAt: new Date("2026-05-25T20:00:00Z")
    });

    expect(receipt).toMatchObject({
      contentType: WORKFLOW_RULE_EXECUTION_RECEIPT_CONTENT_TYPE,
      receiptType: "workflow-rule-execution-readiness-receipt",
      receiptVersion: WORKFLOW_RULE_EXECUTION_RECEIPT_VERSION,
      generatedAt: "2026-05-25T20:00:00.000Z",
      status: "eligible",
      summary: {
        entity: "accounts",
        trigger: "status_changed",
        matchedRecordCount: 2,
        returnedRecordCount: 2,
        proposedActionCount: 2,
        eligibleActionCount: 2,
        blockedActionCount: 0,
        auditIntentCount: 2,
        currentExecutionAllowed: false,
        futureManualExecutorEligible: true,
        operatorApprovalRequired: true
      },
      read: {
        metadata: true,
        catalog: true,
        database: true,
        crmRecords: true,
        adapterInternals: false,
        runtimeEvaluation: true,
        reviewPacket: true,
        auditIntent: true
      },
      write: noWriteFlags,
      safety: {
        deterministic: true,
        readOnly: true,
        previewOnly: true,
        descriptorOnly: true,
        reviewOnly: true,
        auditIntentOnly: true,
        currentExecution: false,
        manualExecutorOnly: true,
        operatorApprovalRequired: true,
        rulePersistence: false,
        scheduledExecution: false,
        actionExecution: false,
        externalAi: false,
        network: false,
        productUi: false,
        schemaChanges: false
      }
    });
    expect(receipt.actions).toHaveLength(2);
    expect(receipt.actions.map((action) => action.status)).toEqual([
      "eligible",
      "eligible"
    ]);
    expect(receipt.actions.map((action) => action.blockReasons)).toEqual([
      ["current_execution_disabled"],
      ["current_execution_disabled"]
    ]);
    expect(receipt.actions.every((action) => action.currentExecutionAllowed)).toBe(
      false
    );
    expect(
      receipt.actions.every((action) => action.futureManualExecutorEligible)
    ).toBe(true);
    expect(
      receipt.auditIntents.every(
        (intent) =>
          intent.requiredForFutureExecution === true &&
          intent.actorRequired === true &&
          intent.approvalRequired === true &&
          intent.wouldWriteNow === false
      )
    ).toBe(true);
    expect(receipt.auditIntents.map((intent) => intent.eventCategory)).toEqual([
      "workflow",
      "workflow"
    ]);
    expect(receipt.auditIntents.map((intent) => intent.eventAction)).toEqual([
      "workflow_action_execute",
      "workflow_action_execute"
    ]);
    expect(receipt.categories).toEqual([
      {
        category: "status",
        actionCount: 1,
        eligibleActionCount: 1,
        blockedActionCount: 0,
        recordCount: 2,
        actionKeys: ["draft_status_update"]
      },
      {
        category: "task",
        actionCount: 1,
        eligibleActionCount: 1,
        blockedActionCount: 0,
        recordCount: 2,
        actionKeys: ["draft_task"]
      }
    ]);
    expect(await currentCounts()).toEqual(countsBefore);
  });

  it("blocks empty-match receipts without audit execution intent", async () => {
    const receipt = await getWorkflowRuleExecutionReadinessReceipt({
      entity: "contacts",
      trigger: "record_updated",
      conditions: [
        {
          condition: "contactText",
          operator: "contains",
          value: "not-a-real-workflow-execution-value"
        }
      ],
      actions: [
        {
          action: "draft_notification",
          message: "Review unmatched workflow contacts"
        }
      ]
    });

    expect(receipt.status).toBe("blocked");
    expect(receipt.summary).toMatchObject({
      matchedRecordCount: 0,
      returnedRecordCount: 0,
      proposedActionCount: 1,
      eligibleActionCount: 0,
      blockedActionCount: 1,
      futureManualExecutorEligible: false,
      currentExecutionAllowed: false
    });
    expect(receipt.actions).toEqual([
      expect.objectContaining({
        action: "draft_notification",
        status: "blocked",
        recordCount: 0,
        recordIds: [],
        blockReasons: ["current_execution_disabled", "no_records_matched"],
        futureManualExecutorEligible: false,
        currentExecutionAllowed: false,
        wouldRecordAuditEventNow: false,
        wouldExecuteActionNow: false
      })
    ]);
    expect(receipt.auditIntents).toEqual([
      expect.objectContaining({
        action: "draft_notification",
        requiredForFutureExecution: false,
        recordCount: 0,
        recordIds: [],
        wouldWriteNow: false
      })
    ]);
    expect(receipt.categories).toEqual([
      {
        category: "notification",
        actionCount: 1,
        eligibleActionCount: 0,
        blockedActionCount: 1,
        recordCount: 0,
        actionKeys: ["draft_notification"]
      }
    ]);
    expect(receipt.write).toEqual(noWriteFlags);
  });

  it("keeps execution receipts out of routes, writes, providers, and executors", async () => {
    const countsBefore = await currentCounts();

    await expect(
      getWorkflowRuleExecutionReadinessReceipt({
        entity: "accounts",
        trigger: "status_changed",
        actions: [{ action: "draft_status_update", targetValue: "paused" }],
        execute: true
      })
    ).rejects.toThrow("Unrecognized key(s) in object: 'execute'");

    const receipt = await getWorkflowRuleExecutionReadinessReceipt({
      entity: "accounts",
      trigger: "status_changed",
      conditions: [
        {
          condition: "accountText",
          operator: "contains",
          value: "Workflow Execution Receipt"
        }
      ],
      actions: [{ action: "draft_status_update", targetValue: "paused" }],
      limit: 1
    });

    expect(receipt.status).toBe("review");
    expect(receipt.actions[0]).toMatchObject({
      action: "draft_status_update",
      status: "blocked",
      blockReasons: [
        "current_execution_disabled",
        "matched_records_truncated"
      ],
      futureManualExecutorEligible: false,
      currentExecutionAllowed: false,
      wouldMutate: false,
      wouldCreateRecord: false,
      wouldRecordAuditEventNow: false,
      wouldExecuteActionNow: false
    });
    expect(receipt.source).toMatchObject({
      reviewPacketContentType: "application/json; charset=utf-8",
      reviewPacketModule: "lib/server/workflowRuleReviewPackets.ts",
      receiptScope: "read-only-workflow-execution-readiness-receipts"
    });
    expect(receipt.source.routeScope).not.toContain("/search");
    expect(receipt.source.routeScope).not.toContain("/command-palette");
    expect(receipt.source.routeScope).not.toContain("/deals/[id]");
    expect(receipt.source.routeScope.some((route) => route.includes("/deals/[id]"))).toBe(
      false
    );
    expect(receipt.write).toEqual(noWriteFlags);
    expect(receipt.reviewPacket.write).toEqual({
      database: false,
      workflowRules: false,
      crmRecords: false,
      auditEvents: false,
      routes: false,
      routeHandlers: false,
      productUi: false,
      schema: false,
      crmContract: false,
      files: false,
      externalServices: false,
      backgroundJobs: false,
      scheduledSweeps: false,
      actionExecution: false
    });
    expect(receipt.safety).toMatchObject({
      readOnly: true,
      previewOnly: true,
      reviewOnly: true,
      auditIntentOnly: true,
      currentExecution: false,
      manualExecutorOnly: true,
      operatorApprovalRequired: true,
      rulePersistence: false,
      scheduledExecution: false,
      actionExecution: false,
      arbitraryJavascript: false,
      eval: false,
      externalAi: false,
      network: false,
      routeHandlers: false,
      productUi: false,
      crmContractChanges: false,
      schemaChanges: false
    });
    expect(await currentCounts()).toEqual(countsBefore);
  });
});

async function createWorkflowExecutionFixtures() {
  await prisma.account.createMany({
    data: [
      {
        id: accountIds[0],
        name: "Workflow Execution Receipt Alpha",
        status: "active",
        healthScore: 91
      },
      {
        id: accountIds[1],
        name: "Workflow Execution Receipt Beta",
        status: "active",
        healthScore: 84
      }
    ]
  });
}

async function cleanupWorkflowExecutionFixtures() {
  await prisma.account.deleteMany({
    where: {
      id: {
        in: [...accountIds]
      }
    }
  });
}

async function currentCounts() {
  const [
    accounts,
    contacts,
    deals,
    leads,
    tasks,
    cases,
    campaigns,
    auditEvents
  ] = await Promise.all([
    prisma.account.count(),
    prisma.contact.count(),
    prisma.deal.count(),
    prisma.lead.count(),
    prisma.task.count(),
    prisma.case.count(),
    prisma.campaign.count(),
    prisma.auditEvent.count()
  ]);

  return {
    accounts,
    contacts,
    deals,
    leads,
    tasks,
    cases,
    campaigns,
    auditEvents
  };
}
