import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  WORKFLOW_RULE_ACTIONS,
  WORKFLOW_RULE_CATALOG_CONTENT_TYPE,
  WORKFLOW_RULE_CATALOG_VERSION,
  WORKFLOW_RULE_SUPPORTED_ENTITIES,
  getWorkflowRuleCatalog
} from "@/lib/server/workflowRuleCatalog";
import {
  WORKFLOW_RULE_EXECUTION_CAPABILITY_CONTENT_TYPE,
  WORKFLOW_RULE_EXECUTION_CAPABILITY_VERSION,
  getWorkflowRuleExecutionActionCapability,
  getWorkflowRuleExecutionCapabilityMatrix,
  getWorkflowRuleExecutionEntityCapability,
  type WorkflowRuleExecutionActionCapability,
  type WorkflowRuleExecutionEntityActionCapability
} from "@/lib/server/workflowRuleExecutionCapabilities";

const readFlags = {
  metadata: true,
  database: false,
  crmRecords: false,
  adapterInternals: false,
  runtimeEvaluation: false,
  catalog: true,
  auditMetadata: true,
  manualExecutorMetadata: true
};

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
  executionCapabilityMatrix: false,
  notifications: false
};

describe("server workflow rule execution capabilities", () => {
  it("publishes deterministic root metadata for manual execution planning", () => {
    const catalog = getWorkflowRuleCatalog();
    const matrix = getWorkflowRuleExecutionCapabilityMatrix();
    const catalogEntityActionCount = catalog.entities.reduce(
      (total, entity) => total + entity.actionCount,
      0
    );

    expect(matrix).toMatchObject({
      contentType: WORKFLOW_RULE_EXECUTION_CAPABILITY_CONTENT_TYPE,
      matrixType: "workflow-rule-execution-capability-matrix",
      matrixVersion: WORKFLOW_RULE_EXECUTION_CAPABILITY_VERSION,
      entityCount: 7,
      catalogActionCount: 6,
      entityActionCount: catalogEntityActionCount,
      supportedCatalogActionCount: 5,
      blockedCatalogActionCount: 1,
      supportedEntityActionCount: 15,
      blockedEntityActionCount: 7,
      manualExecutorPathCount: 8,
      source: {
        catalogContentType: WORKFLOW_RULE_CATALOG_CONTENT_TYPE,
        catalogVersion: WORKFLOW_RULE_CATALOG_VERSION,
        catalogModule: "lib/server/workflowRuleCatalog.ts",
        capabilityScope: "workflow-manual-execution-capability-matrix",
        routeScope: [
          "/accounts",
          "/contacts",
          "/deals",
          "/leads",
          "/tasks",
          "/cases",
          "/campaigns"
        ]
      },
      read: readFlags,
      write: noWriteFlags,
      safety: {
        deterministic: true,
        readOnly: true,
        descriptorOnly: true,
        metadataOnly: true,
        catalogBacked: true,
        currentExecution: false,
        manualExecutorMetadataOnly: true,
        operatorApprovalRequiredBeforeWrites: true,
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
        schemaChanges: false,
        auditWrites: false
      }
    });
    expect(matrix.entities.map((entity) => entity.entity)).toEqual(
      WORKFLOW_RULE_SUPPORTED_ENTITIES
    );
    expect(matrix.actions.map((action) => action.action)).toEqual(
      WORKFLOW_RULE_ACTIONS
    );
  });

  it("maps catalog actions to manual executor paths and blocked reasons", () => {
    const accountStatus = requireEntityActionCapability(
      "accounts",
      "draft_status_update"
    );
    const accountTask = requireEntityActionCapability("accounts", "draft_task");
    const opportunityStage = requireEntityActionCapability(
      "opportunities",
      "draft_stage_update"
    );
    const caseQueue = requireEntityActionCapability(
      "cases",
      "draft_case_queue_assignment"
    );
    const notification = requireEntityActionCapability(
      "accounts",
      "draft_notification"
    );
    const taskAction = requireActionCapability("draft_task");
    const notificationAction = requireActionCapability("draft_notification");

    expect(accountStatus).toMatchObject({
      status: "supported",
      manualExecutorPath: "lib/crm/crmClient.ts#updateAccount",
      target: {
        kind: "enum_field_draft",
        fieldPath: ["status"],
        requiredDraftFields: ["targetValue"],
        optionalDraftFields: ["reason"],
        externalDelivery: false
      },
      blockedReasons: [],
      currentExecutionAllowed: false,
      futureManualExecutorEligible: true,
      operatorApprovalRequired: true,
      auditIntent: {
        eventCategory: "workflow",
        eventAction: "workflow_action_execute",
        requiredForManualExecution: true,
        auditRecorderPath: "lib/services/auditEvents.ts#recordAuditEvent",
        actorRequired: true,
        approvalRequired: true,
        wouldWriteNow: false
      }
    });
    expect(accountTask).toMatchObject({
      status: "supported",
      manualExecutorPath: "lib/crm/crmClient.ts#createTask",
      target: {
        kind: "task_draft",
        recordType: "Task",
        requiredDraftFields: ["title"],
        optionalDraftFields: [
          "description",
          "dueDate",
          "priority",
          "ownerId",
          "accountId"
        ]
      }
    });
    expect(opportunityStage).toMatchObject({
      status: "supported",
      manualExecutorPath: "lib/crm/crmClient.ts#updateOpportunity",
      target: {
        kind: "enum_field_draft",
        fieldPath: ["stage"]
      }
    });
    expect(caseQueue).toMatchObject({
      status: "supported",
      manualExecutorPath: "lib/crm/crmClient.ts#updateCase",
      target: {
        kind: "enum_field_draft",
        fieldPath: ["queueKey"]
      }
    });
    expect(notification).toMatchObject({
      status: "blocked",
      manualExecutorPath: null,
      futureManualExecutorEligible: false,
      currentExecutionAllowed: false,
      auditIntent: {
        requiredForManualExecution: false,
        auditRecorderPath: null,
        wouldWriteNow: false
      }
    });
    expect(notification.blockedReasons.map((reason) => reason.code)).toEqual([
      "manual_executor_path_missing",
      "operator_notification_surface_not_persisted",
      "external_delivery_excluded"
    ]);
    expect(taskAction).toMatchObject({
      action: "draft_task",
      status: "supported",
      catalogSupportedEntityCount: 5,
      supportedEntityCount: 5,
      blockedEntityCount: 0,
      manualExecutorPaths: ["lib/crm/crmClient.ts#createTask"],
      blockedReasons: []
    });
    expect(notificationAction).toMatchObject({
      action: "draft_notification",
      status: "blocked",
      catalogSupportedEntityCount: 7,
      supportedEntityCount: 0,
      blockedEntityCount: 7,
      manualExecutorPaths: []
    });
  });

  it("stays catalog-backed, strict, no-write, and excludes non-goal surfaces", async () => {
    const countsBefore = await currentCounts();
    const matrix = getWorkflowRuleExecutionCapabilityMatrix();

    expect(() =>
      getWorkflowRuleExecutionCapabilityMatrix({ execute: true })
    ).toThrow(/Unrecognized key: .*execute/);
    expect(getWorkflowRuleExecutionEntityCapability("dealer-orders")).toBeNull();
    expect(getWorkflowRuleExecutionEntityCapability("areas")).toBeNull();
    expect(
      getWorkflowRuleExecutionEntityCapability("knowledge-articles")
    ).toBeNull();
    expect(getWorkflowRuleExecutionActionCapability("cases", "webhook")).toBeNull();
    expect(
      getWorkflowRuleExecutionActionCapability("cases", "external_ai_action")
    ).toBeNull();
    expect(matrix.source.routeScope).not.toContain("/search");
    expect(matrix.source.routeScope).not.toContain("/command-palette");
    expect(matrix.source.routeScope).not.toContain("/deals/[id]");
    expect(
      matrix.source.routeScope.some((route) => route.includes("/deals/[id]"))
    ).toBe(false);
    for (const entity of matrix.entities) {
      expect(entity.write).toEqual(noWriteFlags);
      expect(entity.safety).toMatchObject({
        readOnly: true,
        metadataOnly: true,
        catalogBacked: true,
        currentExecution: false,
        rulePersistence: false,
        scheduledExecution: false,
        actionExecution: false,
        externalAi: false,
        network: false,
        productUi: false,
        crmContractChanges: false,
        schemaChanges: false
      });
      expect(entity.actions.map((action) => action.action)).toEqual(
        getWorkflowRuleCatalog().entities.find(
          (candidate) => candidate.entity === entity.entity
        )?.actions.map((action) => action.action)
      );
    }
    expect(await currentCounts()).toEqual(countsBefore);
  });
});

function requireEntityActionCapability(
  entity: string,
  action: string
): WorkflowRuleExecutionEntityActionCapability {
  const capability = getWorkflowRuleExecutionActionCapability(entity, action);

  if (capability === null) {
    throw new Error(`Expected ${entity} workflow action capability ${action}`);
  }

  return capability;
}

function requireActionCapability(
  action: string
): WorkflowRuleExecutionActionCapability {
  const capability = getWorkflowRuleExecutionCapabilityMatrix().actions.find(
    (candidate) => candidate.action === action
  );

  if (capability === undefined) {
    throw new Error(`Expected workflow execution action capability ${action}`);
  }

  return capability;
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
