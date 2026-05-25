import {
  WORKFLOW_RULE_ACTIONS,
  WORKFLOW_RULE_CATALOG_CONTENT_TYPE,
  WORKFLOW_RULE_CATALOG_VERSION,
  WORKFLOW_RULE_TRIGGERS,
  getWorkflowRuleCatalog,
  getWorkflowRuleEntityCatalog,
  isWorkflowRuleCatalogEntity,
  type WorkflowRuleAction,
  type WorkflowRuleActionCategory,
  type WorkflowRuleCatalogEntity,
  type WorkflowRuleConditionFamily,
  type WorkflowRuleConditionOperator,
  type WorkflowRuleConditionValueType,
  type WorkflowRuleEntityActionDefinition,
  type WorkflowRuleEntityCatalog,
  type WorkflowRuleTrigger
} from "@/lib/server/workflowRuleCatalog";
import {
  WORKFLOW_RULE_DRY_RUN_CONTENT_TYPE,
  WORKFLOW_RULE_DRY_RUN_DEFAULT_LIMIT,
  WORKFLOW_RULE_DRY_RUN_VERSION
} from "@/lib/server/workflowRuleDryRun";
import {
  WORKFLOW_RULE_REVIEW_PACKET_CONTENT_TYPE,
  WORKFLOW_RULE_REVIEW_PACKET_VERSION
} from "@/lib/server/workflowRuleReviewPackets";

export const WORKFLOW_RULE_EXAMPLE_CONTENT_TYPE =
  "application/json; charset=utf-8" as const;

export const WORKFLOW_RULE_EXAMPLE_VERSION = "2026-05-25.s38-f1" as const;

export type WorkflowRuleExampleReadFlags = {
  metadata: true;
  catalog: true;
  database: false;
  crmRecords: false;
  adapterInternals: false;
  runtimeEvaluation: false;
};

export type WorkflowRuleExampleWriteFlags = {
  database: false;
  workflowRules: false;
  crmRecords: false;
  auditEvents: false;
  routes: false;
  routeHandlers: false;
  productUi: false;
  schema: false;
  crmContract: false;
  files: false;
  externalServices: false;
  backgroundJobs: false;
  scheduledSweeps: false;
  actionExecution: false;
};

export type WorkflowRuleExampleSafety = {
  deterministic: true;
  readOnly: true;
  exampleOnly: true;
  descriptorOnly: true;
  previewOnly: true;
  rulePersistence: false;
  scheduledExecution: false;
  actionExecution: false;
  arbitraryJavascript: false;
  eval: false;
  externalAi: false;
  network: false;
  externalServices: false;
  routeHandlers: false;
  productUi: false;
  crmContractChanges: false;
  schemaChanges: false;
};

export type WorkflowRuleExampleDraftCondition = {
  condition: string;
  operator: WorkflowRuleConditionOperator;
  value: string | number | null;
};

export type WorkflowRuleExampleDraftAction = {
  action: WorkflowRuleAction;
  targetValue?: string;
  title?: string;
  message?: string;
  priority?: string;
  reason?: string;
};

export type WorkflowRuleExampleDraftRule = {
  entity: WorkflowRuleCatalogEntity;
  trigger: WorkflowRuleTrigger;
  conditions: readonly WorkflowRuleExampleDraftCondition[];
  actions: readonly WorkflowRuleExampleDraftAction[];
  limit: typeof WORKFLOW_RULE_DRY_RUN_DEFAULT_LIMIT;
  generatedAt: string;
};

export type WorkflowRuleExampleConditionMetadata = {
  condition: string;
  label: string;
  family: WorkflowRuleConditionFamily;
  valueType: WorkflowRuleConditionValueType;
  operator: WorkflowRuleConditionOperator;
  value: string | number | null;
  fieldPaths: readonly (readonly string[])[];
  allowedValues: readonly string[] | null;
  valueSource: string | null;
};

export type WorkflowRuleExampleActionMetadata = {
  action: WorkflowRuleAction;
  label: string;
  category: WorkflowRuleActionCategory;
  targetKind: WorkflowRuleEntityActionDefinition["target"]["kind"];
  targetFieldPath: readonly string[] | null;
  targetValue: string | null;
  title: string | null;
  message: string | null;
  priority: string | null;
  reason: string | null;
  mode: "descriptor_only";
  externalDelivery: false;
};

export type WorkflowRuleExampleFixtureValue = {
  condition: string;
  fieldPath: readonly string[];
  value: string | number | null;
};

export type WorkflowRuleExampleFixture = {
  source: "synthetic-workflow-rule-example-fixture";
  recordId: string;
  label: string;
  route: string;
  matchedConditionKeys: readonly string[];
  values: readonly WorkflowRuleExampleFixtureValue[];
};

export type WorkflowRuleExampleSource = {
  catalogContentType: typeof WORKFLOW_RULE_CATALOG_CONTENT_TYPE;
  catalogVersion: typeof WORKFLOW_RULE_CATALOG_VERSION;
  catalogModule: "lib/server/workflowRuleCatalog.ts";
  dryRunContentType: typeof WORKFLOW_RULE_DRY_RUN_CONTENT_TYPE;
  dryRunVersion: typeof WORKFLOW_RULE_DRY_RUN_VERSION;
  dryRunModule: "lib/server/workflowRuleDryRun.ts";
  reviewPacketContentType: typeof WORKFLOW_RULE_REVIEW_PACKET_CONTENT_TYPE;
  reviewPacketVersion: typeof WORKFLOW_RULE_REVIEW_PACKET_VERSION;
  reviewPacketModule: "lib/server/workflowRuleReviewPackets.ts";
  exampleScope: "draft-workflow-rule-example-contracts";
};

export type WorkflowRuleExampleContract = {
  contentType: typeof WORKFLOW_RULE_EXAMPLE_CONTENT_TYPE;
  exampleType: "workflow-rule-example-contract";
  exampleVersion: typeof WORKFLOW_RULE_EXAMPLE_VERSION;
  id: string;
  label: string;
  description: string;
  entity: WorkflowRuleCatalogEntity;
  entityLabel: string;
  modelName: string;
  route: string;
  trigger: WorkflowRuleTrigger;
  rule: WorkflowRuleExampleDraftRule;
  conditions: readonly WorkflowRuleExampleConditionMetadata[];
  actions: readonly WorkflowRuleExampleActionMetadata[];
  fixture: WorkflowRuleExampleFixture;
  catalog: {
    catalogVersion: typeof WORKFLOW_RULE_CATALOG_VERSION;
    availableTriggerKeys: readonly WorkflowRuleTrigger[];
    selectedTrigger: WorkflowRuleTrigger;
    availableConditionKeys: readonly string[];
    selectedConditionKeys: readonly string[];
    availableActionKeys: readonly WorkflowRuleAction[];
    selectedActionKeys: readonly WorkflowRuleAction[];
  };
  source: WorkflowRuleExampleSource;
  read: WorkflowRuleExampleReadFlags;
  write: WorkflowRuleExampleWriteFlags;
  safety: WorkflowRuleExampleSafety;
};

export type WorkflowRuleExampleCoverage = {
  entities: readonly WorkflowRuleCatalogEntity[];
  triggers: readonly WorkflowRuleTrigger[];
  conditionCount: number;
  conditionKeysByEntity: readonly {
    entity: WorkflowRuleCatalogEntity;
    conditionKeys: readonly string[];
  }[];
  actions: readonly WorkflowRuleAction[];
  actionKeysByEntity: readonly {
    entity: WorkflowRuleCatalogEntity;
    actionKeys: readonly WorkflowRuleAction[];
  }[];
  unsupportedEntitiesExcluded: readonly string[];
  unsupportedActionsExcluded: readonly string[];
  excludedRoutes: readonly string[];
};

export type WorkflowRuleExampleCatalog = {
  contentType: typeof WORKFLOW_RULE_EXAMPLE_CONTENT_TYPE;
  catalogType: "workflow-rule-example-catalog";
  exampleVersion: typeof WORKFLOW_RULE_EXAMPLE_VERSION;
  exampleCount: number;
  entityCount: number;
  triggerCount: number;
  conditionCount: number;
  actionCount: number;
  examples: readonly WorkflowRuleExampleContract[];
  coverage: WorkflowRuleExampleCoverage;
  source: WorkflowRuleExampleSource & {
    routeScope: readonly string[];
  };
  read: WorkflowRuleExampleReadFlags;
  write: WorkflowRuleExampleWriteFlags;
  safety: WorkflowRuleExampleSafety;
};

type ExampleSeed = {
  id: string;
  label: string;
  description: string;
  entity: WorkflowRuleCatalogEntity;
  trigger: WorkflowRuleTrigger;
  generatedAt: string;
  conditions: readonly WorkflowRuleExampleDraftCondition[];
  actions: readonly WorkflowRuleExampleDraftAction[];
  fixture: {
    recordId: string;
    label: string;
    values: Record<string, string | number | null>;
  };
};

const unsupportedEntitiesExcluded = [
  "dealer-orders",
  "areas",
  "activities",
  "knowledge-articles"
] as const;

const unsupportedActionsExcluded = [
  "webhook",
  "external_ai_action",
  "salesforce_sync",
  "csv_import_apply",
  "arbitrary_javascript"
] as const;

const excludedRoutes = [
  "/deals/[id]",
  "/search",
  "/command-palette",
  "/orders/new",
  "/orders/[id]/edit",
  "/areas/new",
  "/areas/[id]/edit"
] as const;

const ownerId = "workflow-example-owner";
const accountId = "workflow-example-account";
const contactId = "workflow-example-contact";
const opportunityId = "workflow-example-opportunity";
const leadId = "workflow-example-lead";
const taskId = "workflow-example-task";
const caseId = "workflow-example-case";
const campaignId = "workflow-example-campaign";

const exampleSeeds = [
  {
    id: "workflow-example-accounts-health-followup",
    label: "Account health follow-up",
    description:
      "Draft operator review work for a high-health account without changing the account.",
    entity: "accounts",
    trigger: "record_updated",
    generatedAt: "2026-05-25T18:00:00.000Z",
    conditions: [
      { condition: "status", operator: "equals", value: "active" },
      { condition: "ownerId", operator: "equals", value: ownerId },
      { condition: "healthScore", operator: "greater_than_or_equal", value: 80 },
      {
        condition: "accountText",
        operator: "contains",
        value: "Workflow Example Account"
      }
    ],
    actions: [
      {
        action: "draft_task",
        title: "Review workflow example account",
        priority: "high",
        reason: "Confirm next best account follow-up"
      },
      {
        action: "draft_notification",
        message: "Workflow example account is ready for operator review",
        reason: "Notify the account owner"
      },
      {
        action: "draft_status_update",
        targetValue: "paused",
        reason: "Operator must review before any account status change"
      }
    ],
    fixture: {
      recordId: accountId,
      label: "Workflow Example Account",
      values: {
        status: "active",
        ownerId,
        healthScore: 91,
        name: "Workflow Example Account",
        domain: "workflow-example.test",
        industry: "Automotive",
        city: "Vancouver",
        region: "BC"
      }
    }
  },
  {
    id: "workflow-example-contacts-onboarding",
    label: "Contact onboarding review",
    description:
      "Draft contact follow-up descriptors for an active contact linked to an account.",
    entity: "contacts",
    trigger: "record_created",
    generatedAt: "2026-05-25T18:05:00.000Z",
    conditions: [
      { condition: "status", operator: "equals", value: "active" },
      { condition: "accountId", operator: "equals", value: accountId },
      {
        condition: "contactText",
        operator: "contains",
        value: "Workflow Example Contact"
      }
    ],
    actions: [
      {
        action: "draft_task",
        title: "Welcome workflow example contact",
        priority: "normal"
      },
      {
        action: "draft_notification",
        message: "Workflow example contact matched onboarding criteria"
      },
      {
        action: "draft_status_update",
        targetValue: "inactive",
        reason: "Example only; review before changing contact status"
      }
    ],
    fixture: {
      recordId: contactId,
      label: "Workflow Example Contact",
      values: {
        status: "active",
        accountId,
        firstName: "Workflow",
        lastName: "Example Contact",
        email: "workflow.example.contact@example.test",
        phone: "604-555-0190",
        title: "Workflow Example Contact"
      }
    }
  },
  {
    id: "workflow-example-opportunities-stage-review",
    label: "Opportunity stage review",
    description:
      "Draft opportunity stage and task descriptors for a high-value qualified opportunity.",
    entity: "opportunities",
    trigger: "stage_changed",
    generatedAt: "2026-05-25T18:10:00.000Z",
    conditions: [
      { condition: "stage", operator: "equals", value: "qualified" },
      { condition: "value", operator: "greater_than_or_equal", value: 30000 },
      {
        condition: "expectedCloseDate",
        operator: "after",
        value: "2026-06-01T00:00:00.000Z"
      },
      { condition: "ownerId", operator: "equals", value: ownerId },
      { condition: "accountId", operator: "equals", value: accountId }
    ],
    actions: [
      {
        action: "draft_task",
        title: "Prepare workflow example proposal",
        priority: "urgent"
      },
      {
        action: "draft_notification",
        message: "Workflow example opportunity is ready for stage review"
      },
      {
        action: "draft_stage_update",
        targetValue: "proposal",
        reason: "Operator confirms before moving the opportunity"
      }
    ],
    fixture: {
      recordId: opportunityId,
      label: "Workflow Example Opportunity",
      values: {
        stage: "qualified",
        value: 45000,
        expectedCloseDate: "2026-06-15T00:00:00.000Z",
        ownerId,
        accountId
      }
    }
  },
  {
    id: "workflow-example-leads-routing-review",
    label: "Lead routing review",
    description:
      "Draft lead follow-up descriptors for a routed consumer lead without running routing again.",
    entity: "leads",
    trigger: "field_changed",
    generatedAt: "2026-05-25T18:15:00.000Z",
    conditions: [
      { condition: "status", operator: "equals", value: "new" },
      { condition: "assignmentReason", operator: "equals", value: "routed" },
      { condition: "assignedOrderId", operator: "is_empty", value: null },
      { condition: "areaId", operator: "is_empty", value: null },
      {
        condition: "leadText",
        operator: "contains",
        value: "Workflow Example Lead"
      }
    ],
    actions: [
      {
        action: "draft_task",
        title: "Review workflow example lead",
        priority: "high"
      },
      {
        action: "draft_notification",
        message: "Workflow example lead needs routing review"
      },
      {
        action: "draft_status_update",
        targetValue: "contacted",
        reason: "Example only; no lead status write is performed"
      }
    ],
    fixture: {
      recordId: leadId,
      label: "Workflow Example Lead",
      values: {
        status: "new",
        assignmentReason: "routed",
        assignedOrderId: null,
        areaId: null,
        firstName: "Workflow",
        lastName: "Example Lead",
        email: "workflow.example.lead@example.test",
        phone: "604-555-0191",
        postalCode: "V5K 0A1",
        source: "Workflow Example Lead"
      }
    }
  },
  {
    id: "workflow-example-tasks-sla-review",
    label: "Task SLA review",
    description:
      "Draft task status and priority descriptors for an urgent owned task.",
    entity: "tasks",
    trigger: "status_changed",
    generatedAt: "2026-05-25T18:20:00.000Z",
    conditions: [
      { condition: "status", operator: "equals", value: "open" },
      { condition: "priority", operator: "equals", value: "high" },
      {
        condition: "dueDate",
        operator: "before",
        value: "2026-06-30T00:00:00.000Z"
      },
      { condition: "ownerId", operator: "equals", value: ownerId }
    ],
    actions: [
      {
        action: "draft_notification",
        message: "Workflow example task is inside the SLA review window"
      },
      {
        action: "draft_status_update",
        targetValue: "in_progress",
        reason: "Operator reviews before changing task status"
      },
      {
        action: "draft_priority_update",
        targetValue: "urgent",
        reason: "Escalate only after operator confirmation"
      }
    ],
    fixture: {
      recordId: taskId,
      label: "Workflow Example Task",
      values: {
        status: "open",
        priority: "high",
        dueDate: "2026-06-01T00:00:00.000Z",
        ownerId
      }
    }
  },
  {
    id: "workflow-example-cases-queue-review",
    label: "Case queue review",
    description:
      "Draft case queue, priority, status, task, and notification descriptors.",
    entity: "cases",
    trigger: "record_created",
    generatedAt: "2026-05-25T18:25:00.000Z",
    conditions: [
      { condition: "status", operator: "equals", value: "in_progress" },
      { condition: "priority", operator: "equals", value: "urgent" },
      {
        condition: "queueKey",
        operator: "equals",
        value: "critical_support"
      },
      { condition: "ownerId", operator: "equals", value: ownerId },
      { condition: "accountId", operator: "equals", value: accountId }
    ],
    actions: [
      {
        action: "draft_task",
        title: "Review workflow example case",
        priority: "urgent"
      },
      {
        action: "draft_notification",
        message: "Workflow example case requires queue review"
      },
      {
        action: "draft_status_update",
        targetValue: "waiting",
        reason: "Operator must confirm status before any case write"
      },
      {
        action: "draft_priority_update",
        targetValue: "high",
        reason: "Operator must confirm priority before any case write"
      },
      {
        action: "draft_case_queue_assignment",
        targetValue: "customer_success",
        reason: "Queue reassignment remains descriptor-only"
      }
    ],
    fixture: {
      recordId: caseId,
      label: "Workflow Example Case",
      values: {
        status: "in_progress",
        priority: "urgent",
        queueKey: "critical_support",
        ownerId,
        accountId
      }
    }
  },
  {
    id: "workflow-example-campaigns-budget-review",
    label: "Campaign budget review",
    description:
      "Draft campaign status and notification descriptors for an active campaign.",
    entity: "campaigns",
    trigger: "record_updated",
    generatedAt: "2026-05-25T18:30:00.000Z",
    conditions: [
      { condition: "status", operator: "equals", value: "active" },
      {
        condition: "startDate",
        operator: "after",
        value: "2026-05-01T00:00:00.000Z"
      },
      {
        condition: "endDate",
        operator: "before",
        value: "2026-08-01T00:00:00.000Z"
      },
      { condition: "budget", operator: "greater_than_or_equal", value: 5000 },
      { condition: "ownerId", operator: "equals", value: ownerId }
    ],
    actions: [
      {
        action: "draft_notification",
        message: "Workflow example campaign is ready for budget review"
      },
      {
        action: "draft_status_update",
        targetValue: "completed",
        reason: "Operator must confirm before campaign status changes"
      }
    ],
    fixture: {
      recordId: campaignId,
      label: "Workflow Example Campaign",
      values: {
        status: "active",
        startDate: "2026-06-01T00:00:00.000Z",
        endDate: "2026-07-15T00:00:00.000Z",
        budget: 12000,
        ownerId
      }
    }
  }
] as const satisfies readonly ExampleSeed[];

function readFlags(): WorkflowRuleExampleReadFlags {
  return {
    metadata: true,
    catalog: true,
    database: false,
    crmRecords: false,
    adapterInternals: false,
    runtimeEvaluation: false
  };
}

function noWrites(): WorkflowRuleExampleWriteFlags {
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

function safetyFlags(): WorkflowRuleExampleSafety {
  return {
    deterministic: true,
    readOnly: true,
    exampleOnly: true,
    descriptorOnly: true,
    previewOnly: true,
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
}

function sourceMetadata(): WorkflowRuleExampleSource {
  return {
    catalogContentType: WORKFLOW_RULE_CATALOG_CONTENT_TYPE,
    catalogVersion: WORKFLOW_RULE_CATALOG_VERSION,
    catalogModule: "lib/server/workflowRuleCatalog.ts",
    dryRunContentType: WORKFLOW_RULE_DRY_RUN_CONTENT_TYPE,
    dryRunVersion: WORKFLOW_RULE_DRY_RUN_VERSION,
    dryRunModule: "lib/server/workflowRuleDryRun.ts",
    reviewPacketContentType: WORKFLOW_RULE_REVIEW_PACKET_CONTENT_TYPE,
    reviewPacketVersion: WORKFLOW_RULE_REVIEW_PACKET_VERSION,
    reviewPacketModule: "lib/server/workflowRuleReviewPackets.ts",
    exampleScope: "draft-workflow-rule-example-contracts"
  };
}

function requireEntityCatalog(
  entity: WorkflowRuleCatalogEntity
): WorkflowRuleEntityCatalog {
  const catalog = getWorkflowRuleEntityCatalog(entity);

  if (catalog === null) {
    throw new Error(`Workflow rule entity '${entity}' is not supported.`);
  }

  return catalog;
}

function requireCondition(
  catalog: WorkflowRuleEntityCatalog,
  input: WorkflowRuleExampleDraftCondition
) {
  const condition = catalog.conditions.find(
    (candidate) => candidate.key === input.condition
  );

  if (condition === undefined) {
    throw new Error(
      `Workflow rule example condition '${input.condition}' is not supported for ${catalog.entity}.`
    );
  }

  if (!condition.operators.includes(input.operator)) {
    throw new Error(
      `Workflow rule example condition '${input.condition}' does not support operator '${input.operator}'.`
    );
  }

  if (
    condition.allowedValues !== null &&
    input.value !== null &&
    !condition.allowedValues.includes(String(input.value))
  ) {
    throw new Error(
      `Workflow rule example condition '${input.condition}' does not allow value '${input.value}'.`
    );
  }

  return condition;
}

function requireAction(
  catalog: WorkflowRuleEntityCatalog,
  input: WorkflowRuleExampleDraftAction
): WorkflowRuleEntityActionDefinition {
  const action = catalog.actions.find(
    (candidate) => candidate.action === input.action
  );

  if (action === undefined) {
    throw new Error(
      `Workflow rule example action '${input.action}' is not supported for ${catalog.entity}.`
    );
  }

  return action;
}

function copyFieldPaths(
  fieldPaths: readonly (readonly string[])[]
): readonly (readonly string[])[] {
  return fieldPaths.map((fieldPath) => [...fieldPath]);
}

function conditionMetadata(
  catalog: WorkflowRuleEntityCatalog,
  input: WorkflowRuleExampleDraftCondition
): WorkflowRuleExampleConditionMetadata {
  const condition = requireCondition(catalog, input);

  return {
    condition: condition.key,
    label: condition.label,
    family: condition.family,
    valueType: condition.valueType,
    operator: input.operator,
    value: input.value,
    fieldPaths: copyFieldPaths(condition.fieldPaths),
    allowedValues: condition.allowedValues ? [...condition.allowedValues] : null,
    valueSource: condition.valueSource
  };
}

function actionMetadata(
  catalog: WorkflowRuleEntityCatalog,
  input: WorkflowRuleExampleDraftAction
): WorkflowRuleExampleActionMetadata {
  const action = requireAction(catalog, input);

  return {
    action: action.action,
    label: action.label,
    category: action.category,
    targetKind: action.target.kind,
    targetFieldPath: action.target.fieldPath ? [...action.target.fieldPath] : null,
    targetValue: input.targetValue ?? null,
    title: input.title ?? null,
    message: input.message ?? null,
    priority: input.priority ?? null,
    reason: input.reason ?? null,
    mode: action.mode,
    externalDelivery: action.target.externalDelivery
  };
}

function fixtureValues(
  seed: ExampleSeed,
  conditions: readonly WorkflowRuleExampleConditionMetadata[]
): WorkflowRuleExampleFixtureValue[] {
  return conditions.flatMap((condition) =>
    condition.fieldPaths.map((fieldPath) => ({
      condition: condition.condition,
      fieldPath: [...fieldPath],
      value: seed.fixture.values[fieldPath.join(".")] ?? null
    }))
  );
}

function routeForFixture(entity: WorkflowRuleCatalogEntity, id: string): string {
  switch (entity) {
    case "accounts":
      return `/accounts/${id}`;
    case "contacts":
      return `/contacts/${id}`;
    case "opportunities":
      return `/deals?deal=${id}`;
    case "leads":
      return `/leads/${id}`;
    case "tasks":
      return `/tasks?task=${id}`;
    case "cases":
      return `/cases?case=${id}`;
    case "campaigns":
      return `/campaigns?campaign=${id}`;
  }
}

function buildExample(seed: ExampleSeed): WorkflowRuleExampleContract {
  const catalog = requireEntityCatalog(seed.entity);

  if (!catalog.triggers.some((trigger) => trigger.key === seed.trigger)) {
    throw new Error(
      `Workflow rule example trigger '${seed.trigger}' is not supported for ${seed.entity}.`
    );
  }

  const conditions = seed.conditions.map((condition) =>
    conditionMetadata(catalog, condition)
  );
  const actions = seed.actions.map((action) => actionMetadata(catalog, action));

  return {
    contentType: WORKFLOW_RULE_EXAMPLE_CONTENT_TYPE,
    exampleType: "workflow-rule-example-contract",
    exampleVersion: WORKFLOW_RULE_EXAMPLE_VERSION,
    id: seed.id,
    label: seed.label,
    description: seed.description,
    entity: seed.entity,
    entityLabel: catalog.label,
    modelName: catalog.modelName,
    route: catalog.route,
    trigger: seed.trigger,
    rule: {
      entity: seed.entity,
      trigger: seed.trigger,
      conditions: seed.conditions.map((condition) => ({ ...condition })),
      actions: seed.actions.map((action) => ({ ...action })),
      limit: WORKFLOW_RULE_DRY_RUN_DEFAULT_LIMIT,
      generatedAt: seed.generatedAt
    },
    conditions,
    actions,
    fixture: {
      source: "synthetic-workflow-rule-example-fixture",
      recordId: seed.fixture.recordId,
      label: seed.fixture.label,
      route: routeForFixture(seed.entity, seed.fixture.recordId),
      matchedConditionKeys: conditions.map((condition) => condition.condition),
      values: fixtureValues(seed, conditions)
    },
    catalog: {
      catalogVersion: WORKFLOW_RULE_CATALOG_VERSION,
      availableTriggerKeys: catalog.triggers.map((trigger) => trigger.key),
      selectedTrigger: seed.trigger,
      availableConditionKeys: catalog.conditions.map((condition) => condition.key),
      selectedConditionKeys: conditions.map((condition) => condition.condition),
      availableActionKeys: catalog.actions.map((action) => action.action),
      selectedActionKeys: actions.map((action) => action.action)
    },
    source: sourceMetadata(),
    read: readFlags(),
    write: noWrites(),
    safety: safetyFlags()
  };
}

function uniqueCoveredTriggers(
  examples: readonly WorkflowRuleExampleContract[]
): WorkflowRuleTrigger[] {
  return WORKFLOW_RULE_TRIGGERS.filter((trigger) =>
    examples.some((example) => example.trigger === trigger)
  );
}

function uniqueCoveredActions(
  examples: readonly WorkflowRuleExampleContract[]
): WorkflowRuleAction[] {
  return WORKFLOW_RULE_ACTIONS.filter((action) =>
    examples.some((example) =>
      example.catalog.selectedActionKeys.includes(action)
    )
  );
}

function buildCoverage(
  examples: readonly WorkflowRuleExampleContract[]
): WorkflowRuleExampleCoverage {
  return {
    entities: examples.map((example) => example.entity),
    triggers: uniqueCoveredTriggers(examples),
    conditionCount: examples.reduce(
      (count, example) => count + example.catalog.selectedConditionKeys.length,
      0
    ),
    conditionKeysByEntity: examples.map((example) => ({
      entity: example.entity,
      conditionKeys: [...example.catalog.selectedConditionKeys]
    })),
    actions: uniqueCoveredActions(examples),
    actionKeysByEntity: examples.map((example) => ({
      entity: example.entity,
      actionKeys: [...example.catalog.selectedActionKeys]
    })),
    unsupportedEntitiesExcluded: [...unsupportedEntitiesExcluded],
    unsupportedActionsExcluded: [...unsupportedActionsExcluded],
    excludedRoutes: [...excludedRoutes]
  };
}

export function isWorkflowRuleExampleEntity(
  value: string
): value is WorkflowRuleCatalogEntity {
  return (
    isWorkflowRuleCatalogEntity(value) &&
    exampleSeeds.some((seed) => seed.entity === value)
  );
}

export function listWorkflowRuleExampleContracts(): WorkflowRuleExampleContract[] {
  return exampleSeeds.map((seed) => buildExample(seed));
}

export function getWorkflowRuleExampleContract(
  entity: string
): WorkflowRuleExampleContract | null {
  if (!isWorkflowRuleExampleEntity(entity)) {
    return null;
  }

  const seed = exampleSeeds.find((candidate) => candidate.entity === entity);

  return seed ? buildExample(seed) : null;
}

export function getWorkflowRuleExampleCatalog(): WorkflowRuleExampleCatalog {
  const catalog = getWorkflowRuleCatalog();
  const examples = listWorkflowRuleExampleContracts();
  const coverage = buildCoverage(examples);

  return {
    contentType: WORKFLOW_RULE_EXAMPLE_CONTENT_TYPE,
    catalogType: "workflow-rule-example-catalog",
    exampleVersion: WORKFLOW_RULE_EXAMPLE_VERSION,
    exampleCount: examples.length,
    entityCount: coverage.entities.length,
    triggerCount: coverage.triggers.length,
    conditionCount: coverage.conditionCount,
    actionCount: coverage.actions.length,
    examples,
    coverage,
    source: {
      ...sourceMetadata(),
      routeScope: [...catalog.source.routeScope]
    },
    read: readFlags(),
    write: noWrites(),
    safety: safetyFlags()
  };
}
