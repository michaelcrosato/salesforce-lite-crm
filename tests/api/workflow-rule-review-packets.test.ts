import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  WORKFLOW_RULE_REVIEW_PACKET_CONTENT_TYPE,
  WORKFLOW_RULE_REVIEW_PACKET_VERSION,
  getWorkflowRuleReviewPacket
} from "@/lib/server/workflowRuleReviewPackets";

const accountIds = [
  "test-workflow-review-account-01",
  "test-workflow-review-account-02"
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
  actionExecution: false
};

describe("server workflow rule review packets", () => {
  beforeEach(async () => {
    await cleanupWorkflowReviewFixtures();
    await createWorkflowReviewFixtures();
  });

  afterEach(async () => {
    await cleanupWorkflowReviewFixtures();
  });

  it("composes catalog metadata and dry-run output into review packets", async () => {
    const countsBefore = await currentCounts();
    const packet = await getWorkflowRuleReviewPacket({
      entity: "accounts",
      trigger: "status_changed",
      conditions: [
        {
          condition: "accountText",
          operator: "contains",
          value: "Workflow Review Packet"
        }
      ],
      actions: [
        {
          action: "draft_status_update",
          targetValue: "paused",
          reason: "Review matched workflow accounts before pausing"
        },
        {
          action: "draft_task",
          title: "Review workflow packet account",
          priority: "high"
        }
      ],
      limit: 1,
      generatedAt: new Date("2026-05-25T15:00:00Z")
    });
    const accounts = await prisma.account.findMany({
      where: { id: { in: [...accountIds] } },
      orderBy: { id: "asc" },
      select: { id: true, status: true }
    });

    expect(packet).toMatchObject({
      contentType: WORKFLOW_RULE_REVIEW_PACKET_CONTENT_TYPE,
      packetType: "workflow-rule-review-packet",
      packetVersion: WORKFLOW_RULE_REVIEW_PACKET_VERSION,
      generatedAt: "2026-05-25T15:00:00.000Z",
      status: "review",
      warningCount: 3,
      ruleMetadata: {
        entity: "accounts",
        entityLabel: "Accounts",
        modelName: "Account",
        route: "/accounts",
        trigger: "status_changed",
        selectedConditionCount: 1,
        selectedActionCount: 2
      },
      affectedObjects: {
        entity: "accounts",
        matchedRecordCount: 2,
        returnedRecordCount: 1,
        matchLimit: 1,
        truncated: true,
        scanTruncated: false,
        returnedRecordIds: [accountIds[0]]
      },
      read: {
        metadata: true,
        catalog: true,
        database: true,
        crmRecords: true,
        adapterInternals: false,
        runtimeEvaluation: true
      },
      write: noWriteFlags,
      safety: {
        deterministic: true,
        readOnly: true,
        previewOnly: true,
        descriptorOnly: true,
        reviewOnly: true,
        rulePersistence: false,
        scheduledExecution: false,
        actionExecution: false,
        externalAi: false,
        network: false,
        productUi: false,
        schemaChanges: false
      }
    });
    expect(packet.actionCategories).toEqual([
      {
        category: "status",
        actionCount: 1,
        proposedActionCount: 1,
        affectedRecordCount: 1,
        actionKeys: ["draft_status_update"],
        labels: ["Draft status update"],
        wouldMutate: false,
        wouldCreateRecord: false,
        wouldSendMessage: false,
        wouldRecordAuditEvent: false,
        wouldExecuteAction: false
      },
      {
        category: "task",
        actionCount: 1,
        proposedActionCount: 1,
        affectedRecordCount: 1,
        actionKeys: ["draft_task"],
        labels: ["Draft task"],
        wouldMutate: false,
        wouldCreateRecord: false,
        wouldSendMessage: false,
        wouldRecordAuditEvent: false,
        wouldExecuteAction: false
      }
    ]);
    expect(packet.operatorWarnings.map((warning) => warning.code)).toEqual([
      "preview_only",
      "action_execution_disabled",
      "match_limit_truncated"
    ]);
    expect(packet.dryRun.proposedActions).toHaveLength(2);
    expect(accounts).toEqual([
      { id: accountIds[0], status: "active" },
      { id: accountIds[1], status: "active" }
    ]);
    expect(await currentCounts()).toEqual(countsBefore);
  });

  it("surfaces empty-match review warnings without proposing writes", async () => {
    const packet = await getWorkflowRuleReviewPacket({
      entity: "contacts",
      trigger: "record_updated",
      conditions: [
        {
          condition: "contactText",
          operator: "contains",
          value: "not-a-real-workflow-review-value"
        }
      ],
      actions: [
        {
          action: "draft_notification",
          message: "Review unmatched workflow contacts"
        }
      ]
    });

    expect(packet.status).toBe("empty");
    expect(packet.affectedObjects).toMatchObject({
      entity: "contacts",
      matchedRecordCount: 0,
      returnedRecordCount: 0,
      truncated: false
    });
    expect(packet.actionCategories).toEqual([
      {
        category: "notification",
        actionCount: 1,
        proposedActionCount: 0,
        affectedRecordCount: 0,
        actionKeys: ["draft_notification"],
        labels: ["Draft operator notification"],
        wouldMutate: false,
        wouldCreateRecord: false,
        wouldSendMessage: false,
        wouldRecordAuditEvent: false,
        wouldExecuteAction: false
      }
    ]);
    expect(packet.operatorWarnings.map((warning) => warning.code)).toEqual([
      "preview_only",
      "action_execution_disabled",
      "no_records_matched"
    ]);
    expect(packet.dryRun.proposedActions[0]?.recordCount).toBe(0);
    expect(packet.write).toEqual(noWriteFlags);
  });

  it("keeps routes, contract, persistence, and executors out of packets", async () => {
    const countsBefore = await currentCounts();

    await expect(
      getWorkflowRuleReviewPacket({
        entity: "accounts",
        trigger: "status_changed",
        actions: [{ action: "draft_status_update", targetValue: "paused" }],
        apply: true
      })
    ).rejects.toThrow("Unrecognized key(s) in object: 'apply'");

    const packet = await getWorkflowRuleReviewPacket({
      entity: "opportunities",
      trigger: "stage_changed",
      conditions: [{ condition: "stage", operator: "equals", value: "won" }],
      actions: [
        {
          action: "draft_stage_update",
          targetValue: "proposal",
          reason: "Operator must review before any stage change"
        }
      ],
      limit: 1
    });

    expect(packet.source).toMatchObject({
      catalogModule: "lib/server/workflowRuleCatalog.ts",
      dryRunModule: "lib/server/workflowRuleDryRun.ts",
      packetScope: "read-only-workflow-rule-review-packets"
    });
    expect(packet.source.routeScope).not.toContain("/search");
    expect(packet.source.routeScope).not.toContain("/command-palette");
    expect(packet.source.routeScope).not.toContain("/deals/[id]");
    expect(packet.source.routeScope.some((route) => route.includes("/deals/[id]"))).toBe(
      false
    );
    expect(packet.write).toEqual(noWriteFlags);
    expect(packet.dryRun.write).toEqual(noWriteFlags);
    expect(packet.safety).toMatchObject({
      readOnly: true,
      previewOnly: true,
      reviewOnly: true,
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

async function createWorkflowReviewFixtures() {
  await prisma.account.createMany({
    data: [
      {
        id: accountIds[0],
        name: "Workflow Review Packet Alpha",
        status: "active",
        healthScore: 91
      },
      {
        id: accountIds[1],
        name: "Workflow Review Packet Beta",
        status: "active",
        healthScore: 84
      }
    ]
  });
}

async function cleanupWorkflowReviewFixtures() {
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
