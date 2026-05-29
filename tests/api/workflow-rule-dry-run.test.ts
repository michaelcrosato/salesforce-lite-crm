import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  WORKFLOW_RULE_DRY_RUN_CONTENT_TYPE,
  WORKFLOW_RULE_DRY_RUN_MAX_MATCHES,
  WORKFLOW_RULE_DRY_RUN_SCAN_LIMIT,
  WORKFLOW_RULE_DRY_RUN_VERSION,
  dryRunWorkflowRule
} from "@/lib/server/workflowRuleDryRun";

const ownerId = "test-workflow-dry-run-owner";
const accountIds = [
  "test-workflow-dry-run-account-01",
  "test-workflow-dry-run-account-02",
  "test-workflow-dry-run-account-03",
  "test-workflow-dry-run-account-04"
] as const;
const contactId = "test-workflow-dry-run-contact";
const opportunityId = "test-workflow-dry-run-opportunity";
const leadId = "test-workflow-dry-run-lead";

describe("server workflow rule dry-run evaluator", () => {
  beforeEach(async () => {
    await cleanupWorkflowDryRunFixtures();
    await createWorkflowDryRunFixtures();
  });

  afterEach(async () => {
    await cleanupWorkflowDryRunFixtures();
  });

  it("validates draft rules and returns read-only proposed action summaries", async () => {
    const countsBefore = await currentCounts();
    const result = await dryRunWorkflowRule({
      entity: "opportunities",
      trigger: "stage_changed",
      conditions: [
        { condition: "stage", operator: "equals", value: "qualified" },
        {
          condition: "value",
          operator: "greater_than_or_equal",
          value: 20000
        },
        { condition: "accountId", operator: "equals", value: accountIds[0] }
      ],
      actions: [
        {
          action: "draft_stage_update",
          targetValue: "proposal",
          reason: "High-value renewal is ready for review"
        }
      ],
      generatedAt: new Date("2026-05-25T12:00:00Z")
    });

    expect(result).toMatchObject({
      contentType: WORKFLOW_RULE_DRY_RUN_CONTENT_TYPE,
      dryRunType: "workflow-rule-dry-run",
      dryRunVersion: WORKFLOW_RULE_DRY_RUN_VERSION,
      generatedAt: "2026-05-25T12:00:00.000Z",
      entity: "opportunities",
      trigger: "stage_changed",
      conditionCount: 3,
      actionCount: 1,
      matchedRecordCount: 1,
      returnedRecordCount: 1,
      matchLimit: 10,
      scanLimit: WORKFLOW_RULE_DRY_RUN_SCAN_LIMIT,
      truncated: false,
      source: {
        catalogModule: "lib/server/workflowRuleCatalog.ts",
        evaluatorScope: "read-only-workflow-rule-dry-run"
      },
      read: {
        metadata: true,
        database: true,
        crmRecords: true,
        adapterInternals: false,
        runtimeEvaluation: true
      },
      write: noWriteFlags(),
      safety: {
        deterministic: true,
        readOnly: true,
        previewOnly: true,
        actionExecution: false,
        externalAi: false,
        network: false,
        productUi: false,
        schemaChanges: false
      }
    });
    expect(result.rule.conditions.map((condition) => condition.condition)).toEqual([
      "stage",
      "value",
      "accountId"
    ]);
    expect(result.rule.actions).toEqual([
      {
        action: "draft_stage_update",
        label: "Draft opportunity stage update",
        category: "stage",
        targetValue: "proposal",
        title: null,
        message: null,
        priority: null,
        reason: "High-value renewal is ready for review"
      }
    ]);
    expect(result.matchedRecords).toEqual([
      {
        id: opportunityId,
        label: "Workflow Dry Run Renewal",
        route: `/deals?deal=${opportunityId}`,
        matchedConditionKeys: ["stage", "value", "accountId"],
        values: [
          {
            condition: "stage",
            fieldPath: ["stage"],
            value: "qualified"
          },
          { condition: "value", fieldPath: ["value"], value: 25000 },
          {
            condition: "accountId",
            fieldPath: ["accountId"],
            value: accountIds[0]
          }
        ]
      }
    ]);
    expect(result.proposedActions).toEqual([
      {
        action: "draft_stage_update",
        label: "Draft opportunity stage update",
        category: "stage",
        mode: "summary_only",
        recordCount: 1,
        summary: 'Propose 1 field update to "proposal" for 1 matched record.',
        target: {
          kind: "enum_field_draft",
          fieldPath: ["stage"],
          targetValue: "proposal",
          title: null,
          message: null,
          priority: null,
          reason: "High-value renewal is ready for review",
          externalDelivery: false
        },
        wouldMutate: false,
        wouldCreateRecord: false,
        wouldSendMessage: false,
        wouldRecordAuditEvent: false,
        wouldExecuteAction: false
      }
    ]);
    expect(await currentCounts()).toEqual(countsBefore);
  });

  it("returns deterministic bounded matches and marks truncation", async () => {
    const result = await dryRunWorkflowRule({
      entity: "accounts",
      trigger: "record_updated",
      conditions: [
        {
          condition: "accountText",
          operator: "contains",
          value: "Workflow Dry Run Bound"
        }
      ],
      actions: [
        {
          action: "draft_task",
          title: "Call bounded account",
          priority: "urgent"
        }
      ],
      limit: 2
    });

    expect(result.matchedRecordCount).toBe(4);
    expect(result.returnedRecordCount).toBe(2);
    expect(result.truncated).toBe(true);
    expect(result.matchedRecords.map((record) => record.id)).toEqual([
      accountIds[0],
      accountIds[1]
    ]);
    expect(result.proposedActions[0]).toMatchObject({
      action: "draft_task",
      category: "task",
      recordCount: 2,
      target: {
        kind: "task_draft",
        title: "Call bounded account",
        priority: "urgent",
        externalDelivery: false
      },
      wouldCreateRecord: false,
      wouldExecuteAction: false
    });
  });

  it("returns empty matches with zero-record action summaries", async () => {
    const result = await dryRunWorkflowRule({
      entity: "contacts",
      trigger: "record_updated",
      conditions: [
        {
          condition: "contactText",
          operator: "contains",
          value: "not-a-real-workflow-dry-run-value"
        }
      ],
      actions: [
        {
          action: "draft_notification",
          message: "Review unmatched contacts"
        }
      ]
    });

    expect(result).toMatchObject({
      entity: "contacts",
      matchedRecordCount: 0,
      returnedRecordCount: 0,
      truncated: false,
      matchedRecords: []
    });
    expect(result.proposedActions).toEqual([
      {
        action: "draft_notification",
        label: "Draft operator notification",
        category: "notification",
        mode: "summary_only",
        recordCount: 0,
        summary:
          "Draft operator notification has no proposed draft because no records matched.",
        target: {
          kind: "operator_notice",
          fieldPath: null,
          targetValue: null,
          title: null,
          message: "Review unmatched contacts",
          priority: null,
          reason: null,
          externalDelivery: false
        },
        wouldMutate: false,
        wouldCreateRecord: false,
        wouldSendMessage: false,
        wouldRecordAuditEvent: false,
        wouldExecuteAction: false
      }
    ]);
  });

  it("rejects invalid draft actions, targets, and unknown keys without writes", async () => {
    const countsBefore = await currentCounts();

    await expect(
      dryRunWorkflowRule({
        entity: "leads",
        trigger: "status_changed",
        actions: [{ action: "draft_stage_update", targetValue: "proposal" }]
      })
    ).rejects.toThrow(
      "Workflow rule action 'draft_stage_update' is not supported for leads."
    );
    await expect(
      dryRunWorkflowRule({
        entity: "accounts",
        trigger: "status_changed",
        actions: [{ action: "draft_status_update", targetValue: "archived" }]
      })
    ).rejects.toThrow(
      "Target value 'archived' is not valid for workflow action 'draft_status_update'."
    );
    await expect(
      dryRunWorkflowRule({
        entity: "accounts",
        trigger: "status_changed",
        actions: [{ action: "draft_status_update", targetValue: "paused" }],
        limit: WORKFLOW_RULE_DRY_RUN_MAX_MATCHES + 1
      })
    ).rejects.toThrow("Too big: expected number to be <=25");
    await expect(
      dryRunWorkflowRule({
        entity: "accounts",
        trigger: "status_changed",
        actions: [{ action: "draft_status_update", targetValue: "paused" }],
        apply: true
      })
    ).rejects.toThrow(/Unrecognized key: .*apply/);
    expect(await currentCounts()).toEqual(countsBefore);
  });
});

async function createWorkflowDryRunFixtures() {
  await prisma.user.create({
    data: {
      id: ownerId,
      name: "Workflow Dry Run Owner",
      email: "workflow.dry.run.owner@example.test"
    }
  });
  await prisma.account.createMany({
    data: [
      {
        id: accountIds[0],
        name: "Workflow Dry Run Bound Alpha",
        status: "active",
        ownerId,
        healthScore: 92
      },
      {
        id: accountIds[1],
        name: "Workflow Dry Run Bound Beta",
        status: "paused",
        ownerId,
        healthScore: 76
      },
      {
        id: accountIds[2],
        name: "Workflow Dry Run Bound Gamma",
        status: "active",
        ownerId,
        healthScore: 88
      },
      {
        id: accountIds[3],
        name: "Workflow Dry Run Bound Delta",
        status: "active",
        ownerId,
        healthScore: 81
      }
    ]
  });
  await prisma.contact.create({
    data: {
      id: contactId,
      accountId: accountIds[0],
      firstName: "Workflow",
      lastName: "Contact",
      email: "workflow.dry.run.contact@example.test",
      title: "Revenue Operations",
      status: "active"
    }
  });
  await prisma.deal.create({
    data: {
      id: opportunityId,
      accountId: accountIds[0],
      contactId,
      ownerId,
      name: "Workflow Dry Run Renewal",
      stage: "qualified",
      value: 25000,
      probability: 40,
      expectedCloseDate: new Date("2026-06-15T00:00:00Z")
    }
  });
  await prisma.lead.create({
    data: {
      id: leadId,
      firstName: "Workflow",
      lastName: "Lead",
      status: "new",
      source: "workflow-dry-run"
    }
  });
}

async function cleanupWorkflowDryRunFixtures() {
  await prisma.lead.deleteMany({ where: { id: leadId } });
  await prisma.deal.deleteMany({ where: { id: opportunityId } });
  await prisma.contact.deleteMany({
    where: {
      OR: [{ id: contactId }, { email: "workflow.dry.run.contact@example.test" }]
    }
  });
  await prisma.account.deleteMany({
    where: {
      id: {
        in: [...accountIds]
      }
    }
  });
  await prisma.user.deleteMany({ where: { id: ownerId } });
}

async function currentCounts() {
  const [accounts, contacts, deals, leads, tasks, cases, campaigns, auditEvents] =
    await Promise.all([
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

function noWriteFlags() {
  return {
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
  };
}
