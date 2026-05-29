import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  WORKFLOW_RULE_MANUAL_EXECUTION_CONTENT_TYPE,
  WORKFLOW_RULE_MANUAL_EXECUTION_VERSION,
  executeWorkflowRuleManually
} from "@/lib/server/workflowRuleManualExecutor";

const actorUserId = "test-workflow-manual-actor";
const accountIds = [
  "test-workflow-manual-account-01",
  "test-workflow-manual-account-02"
] as const;
const taskTitle = "Workflow Manual Executor Follow Up";

describe("server workflow rule manual executor", () => {
  beforeEach(async () => {
    await cleanupWorkflowManualFixtures();
    await createWorkflowManualFixtures();
  });

  afterEach(async () => {
    await cleanupWorkflowManualFixtures();
  });

  it("executes approved supported actions and records workflow audit evidence", async () => {
    const countsBefore = await currentCounts();
    const result = await executeWorkflowRuleManually({
      entity: "accounts",
      trigger: "status_changed",
      conditions: [
        {
          condition: "accountText",
          operator: "contains",
          value: "Workflow Manual Executor"
        }
      ],
      actions: [
        {
          action: "draft_status_update",
          targetValue: "paused",
          reason: "Operator approved pausing workflow manual accounts"
        },
        {
          action: "draft_task",
          title: taskTitle,
          priority: "high",
          reason: "Call after workflow manual execution"
        }
      ],
      limit: 2,
      generatedAt: new Date("2026-05-25T21:00:00Z"),
      approval: {
        approved: true,
        actorUserId,
        approvedAt: new Date("2026-05-25T21:05:00Z"),
        note: "Operator approved the bounded workflow execution."
      }
    });
    const accounts = await prisma.account.findMany({
      where: { id: { in: [...accountIds] } },
      orderBy: { id: "asc" },
      select: { id: true, status: true }
    });
    const tasks = await prisma.task.findMany({
      where: { title: taskTitle },
      orderBy: { accountId: "asc" },
      select: { accountId: true, priority: true, title: true }
    });
    const workflowAuditEvents = await prisma.auditEvent.findMany({
      where: {
        actorUserId,
        category: "workflow",
        action: "workflow_action_execute"
      },
      orderBy: [{ entityType: "asc" }, { entityId: "asc" }],
      select: {
        actorUserId: true,
        category: true,
        action: true,
        entityType: true,
        entityId: true,
        metadata: true
      }
    });
    const countsAfter = await currentCounts();

    expect(result).toMatchObject({
      contentType: WORKFLOW_RULE_MANUAL_EXECUTION_CONTENT_TYPE,
      executionType: "workflow-rule-manual-execution",
      executionVersion: WORKFLOW_RULE_MANUAL_EXECUTION_VERSION,
      generatedAt: "2026-05-25T21:00:00.000Z",
      status: "completed",
      blockReasons: [],
      approval: {
        approved: true,
        actorUserId,
        approvedAt: "2026-05-25T21:05:00.000Z"
      },
      summary: {
        entity: "accounts",
        trigger: "status_changed",
        matchedRecordCount: 2,
        returnedRecordCount: 2,
        proposedActionCount: 2,
        executedActionCount: 2,
        blockedActionCount: 0,
        failedActionCount: 0,
        attemptedRecordActionCount: 4,
        executedRecordActionCount: 4,
        blockedRecordActionCount: 0,
        failedRecordActionCount: 0,
        auditEventCount: 4,
        operatorApprovalRequired: true,
        operatorApproved: true,
        didMutate: true
      },
      read: {
        metadata: true,
        catalog: true,
        database: true,
        crmRecords: true,
        adapterInternals: false,
        runtimeEvaluation: true,
        reviewPacket: true,
        capabilityMatrix: true,
        approval: true
      },
      write: {
        database: true,
        workflowRules: false,
        crmRecords: true,
        auditEvents: true,
        routes: false,
        routeHandlers: false,
        productUi: false,
        schema: false,
        crmContract: false,
        files: false,
        externalServices: false,
        backgroundJobs: false,
        scheduledSweeps: false,
        actionExecution: true,
        actionApprovals: false,
        executorRuns: false,
        notifications: false
      },
      safety: {
        deterministic: true,
        readOnly: false,
        actionExecution: true,
        manualExecutorOnly: true,
        operatorApprovalRequired: true,
        approvalPersistence: false,
        rulePersistence: false,
        scheduledExecution: false,
        arbitraryJavascript: false,
        eval: false,
        externalAi: false,
        network: false,
        externalServices: false,
        routeHandlers: false,
        productUi: false,
        crmContractChanges: false,
        schemaChanges: false,
        externalDelivery: false
      }
    });
    expect(result.actions.map((action) => action.status)).toEqual([
      "executed",
      "executed"
    ]);
    expect(result.actions.map((action) => action.auditEventCount)).toEqual([2, 2]);
    expect(result.actions.map((action) => action.manualExecutorPath)).toEqual([
      "lib/crm/crmClient.ts#updateAccount",
      "lib/crm/crmClient.ts#createTask"
    ]);
    expect(result.categories).toEqual([
      {
        category: "status",
        actionCount: 1,
        executedActionCount: 1,
        blockedActionCount: 0,
        failedActionCount: 0,
        recordCount: 2,
        executedRecordCount: 2,
        auditEventCount: 2,
        actionKeys: ["draft_status_update"]
      },
      {
        category: "task",
        actionCount: 1,
        executedActionCount: 1,
        blockedActionCount: 0,
        failedActionCount: 0,
        recordCount: 2,
        executedRecordCount: 2,
        auditEventCount: 2,
        actionKeys: ["draft_task"]
      }
    ]);
    expect(result.source.routeScope).not.toContain("/search");
    expect(result.source.routeScope).not.toContain("/command-palette");
    expect(result.source.routeScope).not.toContain("/deals/[id]");
    expect(
      result.source.routeScope.some((route) => route.includes("/deals/[id]"))
    ).toBe(false);
    expect(accounts).toEqual([
      { id: accountIds[0], status: "paused" },
      { id: accountIds[1], status: "paused" }
    ]);
    expect(tasks).toEqual([
      { accountId: accountIds[0], priority: "high", title: taskTitle },
      { accountId: accountIds[1], priority: "high", title: taskTitle }
    ]);
    expect(workflowAuditEvents).toHaveLength(4);
    expect(
      workflowAuditEvents.every(
        (event) =>
          event.actorUserId === actorUserId &&
          event.category === "workflow" &&
          event.action === "workflow_action_execute"
      )
    ).toBe(true);
    expect(workflowAuditEvents.map((event) => event.entityType).sort()).toEqual([
      "account",
      "account",
      "task",
      "task"
    ]);
    expect(workflowAuditEvents[0]?.metadata).toContain(
      '"source":"workflow_rule_manual_executor"'
    );
    expect(countsAfter).toEqual({
      accounts: countsBefore.accounts,
      tasks: countsBefore.tasks + 2,
      auditEvents: countsBefore.auditEvents + 6
    });
  });

  it("blocks unapproved, empty, and truncated executions without writes", async () => {
    const countsBefore = await currentCounts();
    const unapproved = await executeWorkflowRuleManually({
      ...baseStatusRule(),
      approval: {
        approved: false,
        actorUserId
      }
    });
    const empty = await executeWorkflowRuleManually({
      entity: "accounts",
      trigger: "status_changed",
      conditions: [
        {
          condition: "accountText",
          operator: "contains",
          value: "not-a-real-workflow-manual-value"
        }
      ],
      actions: [
        {
          action: "draft_status_update",
          targetValue: "paused"
        }
      ],
      approval: {
        approved: true,
        actorUserId
      }
    });
    const truncated = await executeWorkflowRuleManually({
      ...baseStatusRule(),
      limit: 1,
      approval: {
        approved: true,
        actorUserId
      }
    });
    const accounts = await prisma.account.findMany({
      where: { id: { in: [...accountIds] } },
      orderBy: { id: "asc" },
      select: { status: true }
    });

    expect(unapproved.status).toBe("blocked");
    expect(unapproved.blockReasons).toEqual(["operator_approval_required"]);
    expect(unapproved.actions[0]).toMatchObject({
      status: "blocked",
      blockReasons: ["operator_approval_required"],
      executedCount: 0,
      auditEventCount: 0
    });
    expect(empty.status).toBe("blocked");
    expect(empty.blockReasons).toEqual(["no_records_matched"]);
    expect(empty.summary).toMatchObject({
      matchedRecordCount: 0,
      executedRecordActionCount: 0,
      auditEventCount: 0,
      didMutate: false
    });
    expect(truncated.status).toBe("blocked");
    expect(truncated.blockReasons).toEqual(["matched_records_truncated"]);
    expect(truncated.actions[0]).toMatchObject({
      status: "blocked",
      blockReasons: ["matched_records_truncated"],
      blockedCount: 1,
      executedCount: 0
    });
    expect(accounts).toEqual([{ status: "active" }, { status: "active" }]);
    expect(await currentCounts()).toEqual(countsBefore);
  });

  it("blocks unsupported notification actions and rejects unknown keys", async () => {
    const countsBefore = await currentCounts();
    const notification = await executeWorkflowRuleManually({
      entity: "accounts",
      trigger: "record_updated",
      conditions: [
        {
          condition: "accountText",
          operator: "contains",
          value: "Workflow Manual Executor"
        }
      ],
      actions: [
        {
          action: "draft_notification",
          message: "Review workflow manual executor account"
        }
      ],
      approval: {
        approved: true,
        actorUserId
      }
    });

    await expect(
      executeWorkflowRuleManually({
        ...baseStatusRule(),
        execute: true,
        approval: {
          approved: true,
          actorUserId
        }
      })
    ).rejects.toThrow(/Unrecognized key: .*execute/);

    expect(notification.status).toBe("blocked");
    expect(notification.summary).toMatchObject({
      matchedRecordCount: 2,
      executedActionCount: 0,
      blockedActionCount: 1,
      executedRecordActionCount: 0,
      auditEventCount: 0,
      didMutate: false
    });
    expect(notification.actions).toEqual([
      expect.objectContaining({
        action: "draft_notification",
        status: "blocked",
        manualExecutorPath: null,
        blockReasons: ["unsupported_action"],
        capabilityBlockedReasonCodes: [
          "manual_executor_path_missing",
          "operator_notification_surface_not_persisted",
          "external_delivery_excluded"
        ],
        wouldSendMessage: false,
        wouldExecuteAction: false,
        wouldRecordAuditEvent: false
      })
    ]);
    expect(await currentCounts()).toEqual(countsBefore);
  });
});

function baseStatusRule() {
  return {
    entity: "accounts",
    trigger: "status_changed",
    conditions: [
      {
        condition: "accountText",
        operator: "contains",
        value: "Workflow Manual Executor"
      }
    ],
    actions: [
      {
        action: "draft_status_update",
        targetValue: "paused",
        reason: "Operator approved pausing workflow manual accounts"
      }
    ],
    limit: 2
  } as const;
}

async function createWorkflowManualFixtures() {
  await prisma.user.create({
    data: {
      id: actorUserId,
      name: "Workflow Manual Actor",
      email: "workflow.manual.actor@example.test"
    }
  });
  await prisma.account.createMany({
    data: [
      {
        id: accountIds[0],
        name: "Workflow Manual Executor Alpha",
        status: "active",
        healthScore: 91
      },
      {
        id: accountIds[1],
        name: "Workflow Manual Executor Beta",
        status: "active",
        healthScore: 84
      }
    ]
  });
}

async function cleanupWorkflowManualFixtures() {
  const tasks = await prisma.task.findMany({
    where: {
      title: {
        contains: "Workflow Manual Executor"
      }
    },
    select: {
      id: true
    }
  });
  const taskIds = tasks.map((task) => task.id);

  await prisma.auditEvent.deleteMany({
    where: {
      OR: [
        { actorUserId },
        { entityId: { in: [...accountIds, ...taskIds] } },
        { summary: { contains: "Workflow action" } },
        { summary: { contains: "Workflow Manual Executor" } }
      ]
    }
  });
  await prisma.task.deleteMany({
    where: {
      OR: [{ id: { in: taskIds } }, { title: { contains: "Workflow Manual Executor" } }]
    }
  });
  await prisma.account.deleteMany({
    where: {
      id: {
        in: [...accountIds]
      }
    }
  });
  await prisma.user.deleteMany({ where: { id: actorUserId } });
}

async function currentCounts() {
  const [accounts, tasks, auditEvents] = await Promise.all([
    prisma.account.count(),
    prisma.task.count(),
    prisma.auditEvent.count()
  ]);

  return {
    accounts,
    tasks,
    auditEvents
  };
}
