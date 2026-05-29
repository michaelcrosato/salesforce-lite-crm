import { describe, expect, it } from "vitest";
import {
  ACCOUNT_STATUSES,
  ASSIGNMENT_REASONS,
  DEAL_STAGES,
  LEAD_STATUSES
} from "@/lib/crm-constants";
import {
  CASE_PRIORITIES,
  CASE_QUEUE_KEYS,
  TASK_PRIORITIES,
  TASK_STATUSES
} from "@/lib/crm/registry";
import { prisma } from "@/lib/prisma";
import {
  WORKFLOW_RULE_ACTIONS,
  WORKFLOW_RULE_CATALOG_CONTENT_TYPE,
  WORKFLOW_RULE_CATALOG_VERSION,
  WORKFLOW_RULE_SUPPORTED_ENTITIES,
  WORKFLOW_RULE_TRIGGERS,
  getWorkflowRuleActionDefinition,
  getWorkflowRuleCatalog,
  getWorkflowRuleEntityCatalog,
  isWorkflowRuleCatalogEntity,
  listWorkflowRuleCatalogEntities,
  type WorkflowRuleAction,
  type WorkflowRuleActionDefinition,
  type WorkflowRuleConditionDefinition,
  type WorkflowRuleEntityActionDefinition,
  type WorkflowRuleEntityCatalog
} from "@/lib/server/workflowRuleCatalog";

const readMetadataOnly = {
  metadata: true,
  database: false,
  crmRecords: false,
  adapterInternals: false,
  runtimeEvaluation: false
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
  actionExecution: false
};

const descriptorOnlySafety = {
  deterministic: true,
  readOnly: true,
  descriptorOnly: true,
  rulePersistence: false,
  scheduledExecution: false,
  actionExecution: false,
  arbitraryJavascript: false,
  eval: false,
  externalAi: false,
  network: false,
  externalServices: false,
  routeHandlers: false,
  productUi: false,
  crmContractChanges: false,
  schemaChanges: false
};

describe("server workflow rule catalog", () => {
  it("publishes deterministic root metadata for draft workflow planning", () => {
    const catalog = getWorkflowRuleCatalog();

    expect(listWorkflowRuleCatalogEntities()).toEqual(
      WORKFLOW_RULE_SUPPORTED_ENTITIES
    );
    expect(catalog).toMatchObject({
      contentType: WORKFLOW_RULE_CATALOG_CONTENT_TYPE,
      catalogType: "workflow-rule-catalog",
      catalogVersion: WORKFLOW_RULE_CATALOG_VERSION,
      entityCount: 7,
      triggerCount: 5,
      conditionCount: 31,
      actionCount: 6,
      source: {
        constantsModule: "lib/crm-constants.ts",
        registryModule: "lib/crm/registry.ts",
        catalogScope: "draft-workflow-rule-planning",
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
      read: readMetadataOnly,
      write: noWriteFlags,
      safety: descriptorOnlySafety
    });
    expect(catalog.entities.map((entity) => entity.entity)).toEqual([
      "accounts",
      "contacts",
      "opportunities",
      "leads",
      "tasks",
      "cases",
      "campaigns"
    ]);
    expect(catalog.triggers.map((trigger) => trigger.key)).toEqual(
      WORKFLOW_RULE_TRIGGERS
    );
    expect(catalog.actions.map((action) => action.action)).toEqual(
      WORKFLOW_RULE_ACTIONS
    );
  });

  it("defines the supported object and action matrix without executors", () => {
    const catalog = getWorkflowRuleCatalog();

    expect(
      catalog.entities.map((entity) => ({
        entity: entity.entity,
        triggers: entity.triggers.map((trigger) => trigger.key),
        actions: entity.actions.map((action) => action.action)
      }))
    ).toEqual([
      {
        entity: "accounts",
        triggers: [
          "record_created",
          "record_updated",
          "field_changed",
          "status_changed"
        ],
        actions: [
          "draft_task",
          "draft_notification",
          "draft_status_update"
        ]
      },
      {
        entity: "contacts",
        triggers: [
          "record_created",
          "record_updated",
          "field_changed",
          "status_changed"
        ],
        actions: [
          "draft_task",
          "draft_notification",
          "draft_status_update"
        ]
      },
      {
        entity: "opportunities",
        triggers: [
          "record_created",
          "record_updated",
          "field_changed",
          "stage_changed"
        ],
        actions: ["draft_task", "draft_notification", "draft_stage_update"]
      },
      {
        entity: "leads",
        triggers: [
          "record_created",
          "record_updated",
          "field_changed",
          "status_changed"
        ],
        actions: [
          "draft_task",
          "draft_notification",
          "draft_status_update"
        ]
      },
      {
        entity: "tasks",
        triggers: [
          "record_created",
          "record_updated",
          "field_changed",
          "status_changed"
        ],
        actions: [
          "draft_notification",
          "draft_status_update",
          "draft_priority_update"
        ]
      },
      {
        entity: "cases",
        triggers: [
          "record_created",
          "record_updated",
          "field_changed",
          "status_changed"
        ],
        actions: [
          "draft_task",
          "draft_notification",
          "draft_status_update",
          "draft_priority_update",
          "draft_case_queue_assignment"
        ]
      },
      {
        entity: "campaigns",
        triggers: [
          "record_created",
          "record_updated",
          "field_changed",
          "status_changed"
        ],
        actions: ["draft_notification", "draft_status_update"]
      }
    ]);

    for (const action of catalog.actions) {
      expect(action.mode).toBe("descriptor_only");
      expect(action.safety).toEqual({
        mutatesRecords: false,
        createsRecords: false,
        sendsMessages: false,
        writesAuditEvents: false,
        externalServices: false,
        executesCode: false
      });
    }
  });

  it("uses current CRM constants for conditions and draft targets", () => {
    const account = requireEntityCatalog("accounts");
    const opportunity = requireEntityCatalog("opportunities");
    const lead = requireEntityCatalog("leads");
    const task = requireEntityCatalog("tasks");
    const crmCase = requireEntityCatalog("cases");

    expect(requireCondition(account, "status")).toMatchObject({
      valueType: "status",
      allowedValues: ACCOUNT_STATUSES,
      valueSource: "lib/crm-constants.ts#ACCOUNT_STATUSES"
    });
    expect(requireCondition(opportunity, "stage")).toMatchObject({
      valueType: "deal_stage",
      allowedValues: DEAL_STAGES,
      valueSource: "lib/crm-constants.ts#DEAL_STAGES"
    });
    expect(requireCondition(lead, "assignmentReason")).toMatchObject({
      valueType: "assignment_reason",
      allowedValues: ASSIGNMENT_REASONS
    });
    expect(requireCondition(task, "priority")).toMatchObject({
      valueType: "task_priority",
      allowedValues: TASK_PRIORITIES
    });
    expect(requireCondition(task, "status")).toMatchObject({
      valueType: "status",
      allowedValues: TASK_STATUSES
    });
    expect(requireCondition(crmCase, "queueKey")).toMatchObject({
      valueType: "case_queue",
      allowedValues: CASE_QUEUE_KEYS
    });

    expect(requireEntityAction(lead, "draft_status_update").target).toEqual({
      kind: "enum_field_draft",
      recordType: null,
      fieldPath: ["status"],
      allowedValues: LEAD_STATUSES,
      valueSource: "lib/crm-constants.ts#LEAD_STATUSES",
      requiredDraftFields: ["targetValue"],
      optionalDraftFields: ["reason"],
      externalDelivery: false
    });
    expect(
      requireEntityAction(opportunity, "draft_stage_update").target
        .allowedValues
    ).toEqual(DEAL_STAGES);
    expect(
      requireEntityAction(task, "draft_priority_update").target.allowedValues
    ).toEqual(TASK_PRIORITIES);
    expect(
      requireEntityAction(crmCase, "draft_priority_update").target
        .allowedValues
    ).toEqual(CASE_PRIORITIES);
    expect(
      requireEntityAction(crmCase, "draft_case_queue_assignment").target
        .allowedValues
    ).toEqual(CASE_QUEUE_KEYS);
    expect(requireEntityAction(account, "draft_task").target).toMatchObject({
      kind: "task_draft",
      recordType: "Task",
      allowedValues: TASK_PRIORITIES,
      requiredDraftFields: ["title"],
      optionalDraftFields: [
        "description",
        "dueDate",
        "priority",
        "ownerId",
        "accountId"
      ],
      externalDelivery: false
    });
  });

  it("supports lookup helpers without widening unsupported surfaces", () => {
    expect(isWorkflowRuleCatalogEntity("accounts")).toBe(true);
    expect(isWorkflowRuleCatalogEntity("dealer-orders")).toBe(false);
    expect(isWorkflowRuleCatalogEntity("areas")).toBe(false);
    expect(isWorkflowRuleCatalogEntity("knowledge-articles")).toBe(false);
    expect(isWorkflowRuleCatalogEntity("activities")).toBe(false);

    expect(requireAction("draft_status_update")).toMatchObject({
      action: "draft_status_update",
      supportedEntities: [
        "accounts",
        "contacts",
        "leads",
        "tasks",
        "cases",
        "campaigns"
      ],
      mode: "descriptor_only"
    });
    expect(getWorkflowRuleActionDefinition("webhook")).toBeNull();
    expect(getWorkflowRuleActionDefinition("external_ai_action")).toBeNull();
    expect(getWorkflowRuleActionDefinition("salesforce_sync")).toBeNull();
    expect(getWorkflowRuleActionDefinition("csv_import_apply")).toBeNull();
    expect(getWorkflowRuleEntityCatalog("dealer-orders")).toBeNull();
    expect(getWorkflowRuleEntityCatalog("areas")).toBeNull();
  });

  it("keeps catalog construction strict and no-write", async () => {
    const countsBefore = await currentCounts();
    const catalog = getWorkflowRuleCatalog();

    expect(() =>
      getWorkflowRuleCatalog({ includeUnsupported: true })
    ).toThrow(/Unrecognized key: .*includeUnsupported/);
    expect(catalog.source.routeScope).not.toContain("/search");
    expect(catalog.source.routeScope).not.toContain("/command-palette");
    expect(catalog.source.routeScope).not.toContain("/deals/[id]");
    expect(
      catalog.source.routeScope.some((route) => route.includes("/deals/[id]"))
    ).toBe(false);
    for (const entity of catalog.entities) {
      expect(entity.write).toEqual(noWriteFlags);
      expect(entity.safety.readOnly).toBe(true);
      expect(entity.safety.actionExecution).toBe(false);
    }
    expect(await currentCounts()).toEqual(countsBefore);
  });
});

function requireEntityCatalog(entity: string): WorkflowRuleEntityCatalog {
  const catalog = getWorkflowRuleEntityCatalog(entity);

  if (catalog === null) {
    throw new Error(`Expected workflow rule entity catalog for ${entity}`);
  }

  return catalog;
}

function requireAction(action: string): WorkflowRuleActionDefinition {
  const definition = getWorkflowRuleActionDefinition(action);

  if (definition === null) {
    throw new Error(`Expected workflow rule action definition for ${action}`);
  }

  return definition;
}

function requireCondition(
  catalog: WorkflowRuleEntityCatalog,
  key: string
): WorkflowRuleConditionDefinition {
  const condition = catalog.conditions.find((candidate) => candidate.key === key);

  if (condition === undefined) {
    throw new Error(`Expected ${catalog.entity} workflow condition ${key}`);
  }

  return condition;
}

function requireEntityAction(
  catalog: WorkflowRuleEntityCatalog,
  action: WorkflowRuleAction
): WorkflowRuleEntityActionDefinition {
  const definition = catalog.actions.find(
    (candidate) => candidate.action === action
  );

  if (definition === undefined) {
    throw new Error(`Expected ${catalog.entity} workflow action ${action}`);
  }

  return definition;
}

async function currentCounts() {
  const [accounts, contacts, deals, leads, tasks, cases, campaigns] =
    await Promise.all([
      prisma.account.count(),
      prisma.contact.count(),
      prisma.deal.count(),
      prisma.lead.count(),
      prisma.task.count(),
      prisma.case.count(),
      prisma.campaign.count()
    ]);

  return {
    accounts,
    contacts,
    deals,
    leads,
    tasks,
    cases,
    campaigns
  };
}
