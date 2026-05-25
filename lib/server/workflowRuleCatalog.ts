import { z } from "zod";
import {
  ACCOUNT_STATUSES,
  ASSIGNMENT_REASONS,
  CONTACT_STATUSES,
  DEAL_STAGES,
  LEAD_STATUSES
} from "@/lib/crm-constants";
import {
  CAMPAIGN_STATUSES,
  CASE_PRIORITIES,
  CASE_QUEUE_KEYS,
  CASE_STATUSES,
  ROUTE_REGISTRY,
  TASK_PRIORITIES,
  TASK_STATUSES
} from "@/lib/crm/registry";

export const WORKFLOW_RULE_CATALOG_CONTENT_TYPE =
  "application/json; charset=utf-8" as const;

export const WORKFLOW_RULE_CATALOG_VERSION = "2026-05-25.s37-f1" as const;

export const WORKFLOW_RULE_SUPPORTED_ENTITIES = [
  "accounts",
  "contacts",
  "opportunities",
  "leads",
  "tasks",
  "cases",
  "campaigns"
] as const;

export const WORKFLOW_RULE_TRIGGERS = [
  "record_created",
  "record_updated",
  "field_changed",
  "status_changed",
  "stage_changed"
] as const;

export const WORKFLOW_RULE_ACTIONS = [
  "draft_task",
  "draft_notification",
  "draft_status_update",
  "draft_stage_update",
  "draft_priority_update",
  "draft_case_queue_assignment"
] as const;

export type WorkflowRuleCatalogEntity =
  (typeof WORKFLOW_RULE_SUPPORTED_ENTITIES)[number];

export type WorkflowRuleTrigger = (typeof WORKFLOW_RULE_TRIGGERS)[number];

export type WorkflowRuleAction = (typeof WORKFLOW_RULE_ACTIONS)[number];

export type WorkflowRuleConditionFamily =
  | "enum_equals"
  | "text_contains"
  | "date_window"
  | "number_threshold"
  | "relationship_presence";

export type WorkflowRuleConditionOperator =
  | "after"
  | "before"
  | "contains"
  | "equals"
  | "greater_than_or_equal"
  | "is_empty"
  | "is_not_empty"
  | "less_than_or_equal"
  | "not_equals";

export type WorkflowRuleConditionValueType =
  | "assignment_reason"
  | "case_priority"
  | "case_queue"
  | "date"
  | "deal_stage"
  | "id"
  | "number"
  | "status"
  | "task_priority"
  | "text";

export type WorkflowRuleActionCategory =
  | "case_queue"
  | "notification"
  | "priority"
  | "stage"
  | "status"
  | "task";

export type WorkflowRuleCatalogReadFlags = {
  metadata: true;
  database: false;
  crmRecords: false;
  adapterInternals: false;
  runtimeEvaluation: false;
};

export type WorkflowRuleCatalogWriteFlags = {
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

export type WorkflowRuleCatalogSafety = {
  deterministic: true;
  readOnly: true;
  descriptorOnly: true;
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

export type WorkflowRuleTriggerDefinition = {
  key: WorkflowRuleTrigger;
  label: string;
  description: string;
  sourceEvent: "crm_client_mutation";
  scheduled: false;
  mutatesRecords: false;
};

export type WorkflowRuleConditionDefinition = {
  key: string;
  label: string;
  family: WorkflowRuleConditionFamily;
  valueType: WorkflowRuleConditionValueType;
  fieldPaths: readonly (readonly string[])[];
  operators: readonly WorkflowRuleConditionOperator[];
  allowedValues: readonly string[] | null;
  valueSource: string | null;
  emptyValuesIgnored: true;
};

export type WorkflowRuleActionTarget = {
  kind: "enum_field_draft" | "operator_notice" | "task_draft";
  recordType: "Task" | null;
  fieldPath: readonly string[] | null;
  allowedValues: readonly string[] | null;
  valueSource: string | null;
  requiredDraftFields: readonly string[];
  optionalDraftFields: readonly string[];
  externalDelivery: false;
};

export type WorkflowRuleActionSafety = {
  mutatesRecords: false;
  createsRecords: false;
  sendsMessages: false;
  writesAuditEvents: false;
  externalServices: false;
  executesCode: false;
};

export type WorkflowRuleActionDefinition = {
  action: WorkflowRuleAction;
  label: string;
  description: string;
  category: WorkflowRuleActionCategory;
  supportedEntities: readonly WorkflowRuleCatalogEntity[];
  mode: "descriptor_only";
  safety: WorkflowRuleActionSafety;
};

export type WorkflowRuleEntityActionDefinition = Omit<
  WorkflowRuleActionDefinition,
  "supportedEntities"
> & {
  target: WorkflowRuleActionTarget;
};

export type WorkflowRuleEntityCatalog = {
  entity: WorkflowRuleCatalogEntity;
  label: string;
  modelName: string;
  route: string;
  triggers: readonly WorkflowRuleTriggerDefinition[];
  triggerCount: number;
  conditions: readonly WorkflowRuleConditionDefinition[];
  conditionCount: number;
  actions: readonly WorkflowRuleEntityActionDefinition[];
  actionCount: number;
  read: WorkflowRuleCatalogReadFlags;
  write: WorkflowRuleCatalogWriteFlags;
  safety: WorkflowRuleCatalogSafety;
};

export type WorkflowRuleCatalog = {
  contentType: typeof WORKFLOW_RULE_CATALOG_CONTENT_TYPE;
  catalogType: "workflow-rule-catalog";
  catalogVersion: typeof WORKFLOW_RULE_CATALOG_VERSION;
  entityCount: number;
  triggerCount: number;
  conditionCount: number;
  actionCount: number;
  entities: readonly WorkflowRuleEntityCatalog[];
  triggers: readonly WorkflowRuleTriggerDefinition[];
  actions: readonly WorkflowRuleActionDefinition[];
  source: {
    constantsModule: "lib/crm-constants.ts";
    registryModule: "lib/crm/registry.ts";
    catalogScope: "draft-workflow-rule-planning";
    routeScope: readonly string[];
  };
  read: WorkflowRuleCatalogReadFlags;
  write: WorkflowRuleCatalogWriteFlags;
  safety: WorkflowRuleCatalogSafety;
};

type ConditionSeed = {
  key: string;
  label: string;
  family: WorkflowRuleConditionFamily;
  valueType: WorkflowRuleConditionValueType;
  fieldPaths: readonly (readonly string[])[];
  operators: readonly WorkflowRuleConditionOperator[];
  allowedValues?: readonly string[];
  valueSource?: string;
};

type EntitySeed = {
  entity: WorkflowRuleCatalogEntity;
  label: string;
  modelName: string;
  route: string;
  triggers: readonly WorkflowRuleTrigger[];
  conditions: readonly ConditionSeed[];
};

type ActionSeed = {
  action: WorkflowRuleAction;
  label: string;
  description: string;
  category: WorkflowRuleActionCategory;
  supportedEntities: readonly WorkflowRuleCatalogEntity[];
};

const catalogInputSchema = z.object({}).strict();
const workflowRuleEntitySet: ReadonlySet<string> = new Set(
  WORKFLOW_RULE_SUPPORTED_ENTITIES
);

const triggerSeeds = [
  {
    key: "record_created",
    label: "Record created",
    description: "Draft rule trigger for a new supported CRM record."
  },
  {
    key: "record_updated",
    label: "Record updated",
    description: "Draft rule trigger for an update to a supported CRM record."
  },
  {
    key: "field_changed",
    label: "Field changed",
    description: "Draft rule trigger scoped to configured field changes."
  },
  {
    key: "status_changed",
    label: "Status changed",
    description: "Draft rule trigger for status-bearing CRM records."
  },
  {
    key: "stage_changed",
    label: "Stage changed",
    description: "Draft rule trigger for opportunity stage changes."
  }
] as const satisfies readonly {
  key: WorkflowRuleTrigger;
  label: string;
  description: string;
}[];

const statusChangeTriggers = [
  "record_created",
  "record_updated",
  "field_changed",
  "status_changed"
] as const satisfies readonly WorkflowRuleTrigger[];

const stageChangeTriggers = [
  "record_created",
  "record_updated",
  "field_changed",
  "stage_changed"
] as const satisfies readonly WorkflowRuleTrigger[];

const actionSeeds = [
  {
    action: "draft_task",
    label: "Draft task",
    description:
      "Describe a task draft for an operator to review later; no task is created by the catalog.",
    category: "task",
    supportedEntities: [
      "accounts",
      "contacts",
      "opportunities",
      "leads",
      "cases"
    ]
  },
  {
    action: "draft_notification",
    label: "Draft operator notification",
    description:
      "Describe an in-app operator notice; no email, webhook, or external delivery is sent.",
    category: "notification",
    supportedEntities: WORKFLOW_RULE_SUPPORTED_ENTITIES
  },
  {
    action: "draft_status_update",
    label: "Draft status update",
    description:
      "Describe a status-change proposal using the current CRM status constants.",
    category: "status",
    supportedEntities: [
      "accounts",
      "contacts",
      "leads",
      "tasks",
      "cases",
      "campaigns"
    ]
  },
  {
    action: "draft_stage_update",
    label: "Draft opportunity stage update",
    description:
      "Describe an opportunity stage-change proposal using the current deal stage constants.",
    category: "stage",
    supportedEntities: ["opportunities"]
  },
  {
    action: "draft_priority_update",
    label: "Draft priority update",
    description:
      "Describe a task or case priority-change proposal using current priority constants.",
    category: "priority",
    supportedEntities: ["tasks", "cases"]
  },
  {
    action: "draft_case_queue_assignment",
    label: "Draft case queue assignment",
    description:
      "Describe a case queue assignment proposal using the current case queue constants.",
    category: "case_queue",
    supportedEntities: ["cases"]
  }
] as const satisfies readonly ActionSeed[];

const entitySeeds = [
  {
    entity: "accounts",
    label: "Accounts",
    modelName: "Account",
    route: ROUTE_REGISTRY.accounts,
    triggers: statusChangeTriggers,
    conditions: [
      enumCondition(
        "status",
        "Status",
        "status",
        ["status"],
        ACCOUNT_STATUSES,
        "lib/crm-constants.ts#ACCOUNT_STATUSES"
      ),
      relationshipCondition("ownerId", "Owner", ["ownerId"]),
      numberCondition("healthScore", "Health score", ["healthScore"]),
      textCondition("accountText", "Account text", [
        ["name"],
        ["domain"],
        ["industry"],
        ["city"],
        ["region"]
      ])
    ]
  },
  {
    entity: "contacts",
    label: "Contacts",
    modelName: "Contact",
    route: ROUTE_REGISTRY.contacts,
    triggers: statusChangeTriggers,
    conditions: [
      enumCondition(
        "status",
        "Status",
        "status",
        ["status"],
        CONTACT_STATUSES,
        "lib/crm-constants.ts#CONTACT_STATUSES"
      ),
      relationshipCondition("accountId", "Account", ["accountId"]),
      textCondition("contactText", "Contact text", [
        ["firstName"],
        ["lastName"],
        ["email"],
        ["phone"],
        ["title"]
      ])
    ]
  },
  {
    entity: "opportunities",
    label: "Opportunities",
    modelName: "Deal",
    route: ROUTE_REGISTRY.opportunities,
    triggers: stageChangeTriggers,
    conditions: [
      enumCondition(
        "stage",
        "Stage",
        "deal_stage",
        ["stage"],
        DEAL_STAGES,
        "lib/crm-constants.ts#DEAL_STAGES"
      ),
      numberCondition("value", "Value", ["value"]),
      dateCondition("expectedCloseDate", "Expected close date", [
        "expectedCloseDate"
      ]),
      relationshipCondition("ownerId", "Owner", ["ownerId"]),
      relationshipCondition("accountId", "Account", ["accountId"])
    ]
  },
  {
    entity: "leads",
    label: "Leads",
    modelName: "Lead",
    route: ROUTE_REGISTRY.leads,
    triggers: statusChangeTriggers,
    conditions: [
      enumCondition(
        "status",
        "Status",
        "status",
        ["status"],
        LEAD_STATUSES,
        "lib/crm-constants.ts#LEAD_STATUSES"
      ),
      enumCondition(
        "assignmentReason",
        "Assignment reason",
        "assignment_reason",
        ["assignmentReason"],
        ASSIGNMENT_REASONS,
        "lib/crm-constants.ts#ASSIGNMENT_REASONS"
      ),
      relationshipCondition("assignedOrderId", "Assigned order", [
        "assignedOrderId"
      ]),
      relationshipCondition("areaId", "Area", ["areaId"]),
      textCondition("leadText", "Lead text", [
        ["firstName"],
        ["lastName"],
        ["email"],
        ["phone"],
        ["postalCode"],
        ["source"]
      ])
    ]
  },
  {
    entity: "tasks",
    label: "Tasks",
    modelName: "Task",
    route: ROUTE_REGISTRY.tasks,
    triggers: statusChangeTriggers,
    conditions: [
      enumCondition(
        "status",
        "Status",
        "status",
        ["status"],
        TASK_STATUSES,
        "lib/crm/registry.ts#TASK_STATUSES"
      ),
      enumCondition(
        "priority",
        "Priority",
        "task_priority",
        ["priority"],
        TASK_PRIORITIES,
        "lib/crm/registry.ts#TASK_PRIORITIES"
      ),
      dateCondition("dueDate", "Due date", ["dueDate"]),
      relationshipCondition("ownerId", "Owner", ["ownerId"])
    ]
  },
  {
    entity: "cases",
    label: "Cases",
    modelName: "Case",
    route: ROUTE_REGISTRY.cases,
    triggers: statusChangeTriggers,
    conditions: [
      enumCondition(
        "status",
        "Status",
        "status",
        ["status"],
        CASE_STATUSES,
        "lib/crm/registry.ts#CASE_STATUSES"
      ),
      enumCondition(
        "priority",
        "Priority",
        "case_priority",
        ["priority"],
        CASE_PRIORITIES,
        "lib/crm/registry.ts#CASE_PRIORITIES"
      ),
      enumCondition(
        "queueKey",
        "Queue",
        "case_queue",
        ["queueKey"],
        CASE_QUEUE_KEYS,
        "lib/crm/registry.ts#CASE_QUEUE_KEYS"
      ),
      relationshipCondition("ownerId", "Owner", ["ownerId"]),
      relationshipCondition("accountId", "Account", ["accountId"])
    ]
  },
  {
    entity: "campaigns",
    label: "Campaigns",
    modelName: "Campaign",
    route: ROUTE_REGISTRY.campaigns,
    triggers: statusChangeTriggers,
    conditions: [
      enumCondition(
        "status",
        "Status",
        "status",
        ["status"],
        CAMPAIGN_STATUSES,
        "lib/crm/registry.ts#CAMPAIGN_STATUSES"
      ),
      dateCondition("startDate", "Start date", ["startDate"]),
      dateCondition("endDate", "End date", ["endDate"]),
      numberCondition("budget", "Budget", ["budget"]),
      relationshipCondition("ownerId", "Owner", ["ownerId"])
    ]
  }
] as const satisfies readonly EntitySeed[];

function enumCondition(
  key: string,
  label: string,
  valueType: Extract<
    WorkflowRuleConditionValueType,
    | "assignment_reason"
    | "case_priority"
    | "case_queue"
    | "deal_stage"
    | "status"
    | "task_priority"
  >,
  fieldPath: readonly string[],
  allowedValues: readonly string[],
  valueSource: string
): ConditionSeed {
  return {
    key,
    label,
    family: "enum_equals",
    valueType,
    fieldPaths: [fieldPath],
    operators: ["equals", "not_equals"],
    allowedValues,
    valueSource
  };
}

function relationshipCondition(
  key: string,
  label: string,
  fieldPath: readonly string[]
): ConditionSeed {
  return {
    key,
    label,
    family: "relationship_presence",
    valueType: "id",
    fieldPaths: [fieldPath],
    operators: ["equals", "is_empty", "is_not_empty"]
  };
}

function textCondition(
  key: string,
  label: string,
  fieldPaths: readonly (readonly string[])[]
): ConditionSeed {
  return {
    key,
    label,
    family: "text_contains",
    valueType: "text",
    fieldPaths,
    operators: ["contains", "equals", "not_equals"]
  };
}

function numberCondition(
  key: string,
  label: string,
  fieldPath: readonly string[]
): ConditionSeed {
  return {
    key,
    label,
    family: "number_threshold",
    valueType: "number",
    fieldPaths: [fieldPath],
    operators: ["greater_than_or_equal", "less_than_or_equal"]
  };
}

function dateCondition(
  key: string,
  label: string,
  fieldPath: readonly string[]
): ConditionSeed {
  return {
    key,
    label,
    family: "date_window",
    valueType: "date",
    fieldPaths: [fieldPath],
    operators: ["after", "before", "is_empty", "is_not_empty"]
  };
}

function readMetadata(): WorkflowRuleCatalogReadFlags {
  return {
    metadata: true,
    database: false,
    crmRecords: false,
    adapterInternals: false,
    runtimeEvaluation: false
  };
}

function noWrites(): WorkflowRuleCatalogWriteFlags {
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

function safetyFlags(): WorkflowRuleCatalogSafety {
  return {
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
}

function actionSafety(): WorkflowRuleActionSafety {
  return {
    mutatesRecords: false,
    createsRecords: false,
    sendsMessages: false,
    writesAuditEvents: false,
    externalServices: false,
    executesCode: false
  };
}

function copyFieldPaths(
  fieldPaths: readonly (readonly string[])[]
): readonly (readonly string[])[] {
  return fieldPaths.map((fieldPath) => [...fieldPath]);
}

function buildTrigger(seed: {
  key: WorkflowRuleTrigger;
  label: string;
  description: string;
}): WorkflowRuleTriggerDefinition {
  return {
    key: seed.key,
    label: seed.label,
    description: seed.description,
    sourceEvent: "crm_client_mutation",
    scheduled: false,
    mutatesRecords: false
  };
}

function buildCondition(seed: ConditionSeed): WorkflowRuleConditionDefinition {
  return {
    key: seed.key,
    label: seed.label,
    family: seed.family,
    valueType: seed.valueType,
    fieldPaths: copyFieldPaths(seed.fieldPaths),
    operators: [...seed.operators],
    allowedValues: seed.allowedValues ? [...seed.allowedValues] : null,
    valueSource: seed.valueSource ?? null,
    emptyValuesIgnored: true
  };
}

function buildAction(seed: ActionSeed): WorkflowRuleActionDefinition {
  return {
    action: seed.action,
    label: seed.label,
    description: seed.description,
    category: seed.category,
    supportedEntities: [...seed.supportedEntities],
    mode: "descriptor_only",
    safety: actionSafety()
  };
}

function buildEntityAction(
  seed: ActionSeed,
  entity: WorkflowRuleCatalogEntity
): WorkflowRuleEntityActionDefinition {
  return {
    action: seed.action,
    label: seed.label,
    description: seed.description,
    category: seed.category,
    mode: "descriptor_only",
    target: actionTargetForEntity(seed.action, entity),
    safety: actionSafety()
  };
}

function buildEntityCatalog(seed: EntitySeed): WorkflowRuleEntityCatalog {
  const triggers = seed.triggers.map((trigger) =>
    buildTrigger(requireTriggerSeed(trigger))
  );
  const conditions = seed.conditions.map((condition) =>
    buildCondition(condition)
  );
  const actions = actionSeeds
    .filter((action) => includesEntity(action.supportedEntities, seed.entity))
    .map((action) => buildEntityAction(action, seed.entity));

  return {
    entity: seed.entity,
    label: seed.label,
    modelName: seed.modelName,
    route: seed.route,
    triggers,
    triggerCount: triggers.length,
    conditions,
    conditionCount: conditions.length,
    actions,
    actionCount: actions.length,
    read: readMetadata(),
    write: noWrites(),
    safety: safetyFlags()
  };
}

function requireTriggerSeed(trigger: WorkflowRuleTrigger) {
  const seed = triggerSeeds.find((candidate) => candidate.key === trigger);

  if (seed === undefined) {
    throw new Error(`Unknown workflow rule trigger '${trigger}'.`);
  }

  return seed;
}

function includesEntity(
  entities: readonly WorkflowRuleCatalogEntity[],
  entity: WorkflowRuleCatalogEntity
): boolean {
  return entities.includes(entity);
}

function actionTargetForEntity(
  action: WorkflowRuleAction,
  entity: WorkflowRuleCatalogEntity
): WorkflowRuleActionTarget {
  switch (action) {
    case "draft_task":
      return {
        kind: "task_draft",
        recordType: "Task",
        fieldPath: null,
        allowedValues: [...TASK_PRIORITIES],
        valueSource: "lib/crm/registry.ts#TASK_PRIORITIES",
        requiredDraftFields: ["title"],
        optionalDraftFields: [
          "description",
          "dueDate",
          "priority",
          "ownerId",
          relatedFieldForTask(entity)
        ],
        externalDelivery: false
      };
    case "draft_notification":
      return {
        kind: "operator_notice",
        recordType: null,
        fieldPath: null,
        allowedValues: null,
        valueSource: null,
        requiredDraftFields: ["message"],
        optionalDraftFields: ["severity", "ownerId"],
        externalDelivery: false
      };
    case "draft_status_update":
      return enumActionTarget(
        ["status"],
        statusValuesForEntity(entity),
        statusValueSourceForEntity(entity)
      );
    case "draft_stage_update":
      return enumActionTarget(
        ["stage"],
        DEAL_STAGES,
        "lib/crm-constants.ts#DEAL_STAGES"
      );
    case "draft_priority_update":
      return enumActionTarget(
        ["priority"],
        priorityValuesForEntity(entity),
        priorityValueSourceForEntity(entity)
      );
    case "draft_case_queue_assignment":
      return enumActionTarget(
        ["queueKey"],
        CASE_QUEUE_KEYS,
        "lib/crm/registry.ts#CASE_QUEUE_KEYS"
      );
  }
}

function enumActionTarget(
  fieldPath: readonly string[],
  allowedValues: readonly string[],
  valueSource: string
): WorkflowRuleActionTarget {
  return {
    kind: "enum_field_draft",
    recordType: null,
    fieldPath: [...fieldPath],
    allowedValues: [...allowedValues],
    valueSource,
    requiredDraftFields: ["targetValue"],
    optionalDraftFields: ["reason"],
    externalDelivery: false
  };
}

function statusValuesForEntity(
  entity: WorkflowRuleCatalogEntity
): readonly string[] {
  switch (entity) {
    case "accounts":
      return ACCOUNT_STATUSES;
    case "contacts":
      return CONTACT_STATUSES;
    case "leads":
      return LEAD_STATUSES;
    case "tasks":
      return TASK_STATUSES;
    case "cases":
      return CASE_STATUSES;
    case "campaigns":
      return CAMPAIGN_STATUSES;
    case "opportunities":
      throw new Error("Opportunities use stage workflow actions.");
  }
}

function statusValueSourceForEntity(entity: WorkflowRuleCatalogEntity): string {
  switch (entity) {
    case "accounts":
      return "lib/crm-constants.ts#ACCOUNT_STATUSES";
    case "contacts":
      return "lib/crm-constants.ts#CONTACT_STATUSES";
    case "leads":
      return "lib/crm-constants.ts#LEAD_STATUSES";
    case "tasks":
      return "lib/crm/registry.ts#TASK_STATUSES";
    case "cases":
      return "lib/crm/registry.ts#CASE_STATUSES";
    case "campaigns":
      return "lib/crm/registry.ts#CAMPAIGN_STATUSES";
    case "opportunities":
      throw new Error("Opportunities use stage workflow actions.");
  }
}

function priorityValuesForEntity(
  entity: WorkflowRuleCatalogEntity
): readonly string[] {
  switch (entity) {
    case "tasks":
      return TASK_PRIORITIES;
    case "cases":
      return CASE_PRIORITIES;
    case "accounts":
    case "contacts":
    case "opportunities":
    case "leads":
    case "campaigns":
      throw new Error(`Priority workflow actions are not supported for ${entity}.`);
  }
}

function priorityValueSourceForEntity(entity: WorkflowRuleCatalogEntity): string {
  switch (entity) {
    case "tasks":
      return "lib/crm/registry.ts#TASK_PRIORITIES";
    case "cases":
      return "lib/crm/registry.ts#CASE_PRIORITIES";
    case "accounts":
    case "contacts":
    case "opportunities":
    case "leads":
    case "campaigns":
      throw new Error(`Priority workflow actions are not supported for ${entity}.`);
  }
}

function relatedFieldForTask(entity: WorkflowRuleCatalogEntity): string {
  switch (entity) {
    case "accounts":
      return "accountId";
    case "contacts":
      return "contactId";
    case "opportunities":
      return "dealId";
    case "leads":
      return "leadId";
    case "cases":
      return "caseId";
    case "campaigns":
      throw new Error("Campaign task drafts are not supported.");
    case "tasks":
      throw new Error("Task task drafts are not supported.");
  }
}

export function isWorkflowRuleCatalogEntity(
  value: string
): value is WorkflowRuleCatalogEntity {
  return workflowRuleEntitySet.has(value);
}

export function listWorkflowRuleCatalogEntities(): WorkflowRuleCatalogEntity[] {
  return [...WORKFLOW_RULE_SUPPORTED_ENTITIES];
}

export function getWorkflowRuleActionDefinition(
  action: string
): WorkflowRuleActionDefinition | null {
  const seed = actionSeeds.find((candidate) => candidate.action === action);

  return seed ? buildAction(seed) : null;
}

export function getWorkflowRuleEntityCatalog(
  entity: string
): WorkflowRuleEntityCatalog | null {
  const seed = entitySeeds.find((candidate) => candidate.entity === entity);

  return seed ? buildEntityCatalog(seed) : null;
}

export function getWorkflowRuleCatalog(input: unknown = {}): WorkflowRuleCatalog {
  catalogInputSchema.parse(input);

  const entities = entitySeeds.map((seed) => buildEntityCatalog(seed));
  const conditions = entities.flatMap((entity) => entity.conditions);
  const actions = actionSeeds.map((action) => buildAction(action));

  return {
    contentType: WORKFLOW_RULE_CATALOG_CONTENT_TYPE,
    catalogType: "workflow-rule-catalog",
    catalogVersion: WORKFLOW_RULE_CATALOG_VERSION,
    entityCount: entities.length,
    triggerCount: WORKFLOW_RULE_TRIGGERS.length,
    conditionCount: conditions.length,
    actionCount: actions.length,
    entities,
    triggers: triggerSeeds.map((trigger) => buildTrigger(trigger)),
    actions,
    source: {
      constantsModule: "lib/crm-constants.ts",
      registryModule: "lib/crm/registry.ts",
      catalogScope: "draft-workflow-rule-planning",
      routeScope: entities.map((entity) => entity.route)
    },
    read: readMetadata(),
    write: noWrites(),
    safety: safetyFlags()
  };
}
