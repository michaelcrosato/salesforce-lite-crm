import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  WORKFLOW_RULE_ACTIONS,
  WORKFLOW_RULE_CATALOG_VERSION,
  WORKFLOW_RULE_SUPPORTED_ENTITIES,
  WORKFLOW_RULE_TRIGGERS,
  getWorkflowRuleEntityCatalog,
  type WorkflowRuleAction,
  type WorkflowRuleActionCategory,
  type WorkflowRuleConditionDefinition,
  type WorkflowRuleConditionOperator,
  type WorkflowRuleConditionValueType,
  type WorkflowRuleEntityActionDefinition,
  type WorkflowRuleCatalogEntity,
  type WorkflowRuleTrigger
} from "@/lib/server/workflowRuleCatalog";

export const WORKFLOW_RULE_DRY_RUN_CONTENT_TYPE =
  "application/json; charset=utf-8" as const;

export const WORKFLOW_RULE_DRY_RUN_VERSION = "2026-05-25.s37-f2" as const;

export const WORKFLOW_RULE_DRY_RUN_DEFAULT_LIMIT = 10;
export const WORKFLOW_RULE_DRY_RUN_MAX_MATCHES = 25;
export const WORKFLOW_RULE_DRY_RUN_SCAN_LIMIT = 250;
export const WORKFLOW_RULE_DRY_RUN_MAX_CONDITIONS = 8;
export const WORKFLOW_RULE_DRY_RUN_MAX_ACTIONS = 5;

export type WorkflowRuleDryRunReadFlags = {
  metadata: true;
  database: true;
  crmRecords: true;
  adapterInternals: false;
  runtimeEvaluation: true;
};

export type WorkflowRuleDryRunWriteFlags = {
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

export type WorkflowRuleDryRunSafety = {
  deterministic: true;
  readOnly: true;
  previewOnly: true;
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

export type WorkflowRuleDryRunCondition = {
  condition: string;
  label: string;
  operator: WorkflowRuleConditionOperator;
  valueType: WorkflowRuleConditionValueType;
  value: string | number | null;
  fieldPaths: readonly (readonly string[])[];
};

export type WorkflowRuleDryRunAction = {
  action: WorkflowRuleAction;
  label: string;
  category: WorkflowRuleActionCategory;
  targetValue: string | null;
  title: string | null;
  message: string | null;
  priority: string | null;
  reason: string | null;
};

export type WorkflowRuleDryRunRecordValue = {
  condition: string;
  fieldPath: readonly string[];
  value: string | number | null;
};

export type WorkflowRuleDryRunRecordReference = {
  id: string;
  label: string;
  route: string;
  matchedConditionKeys: readonly string[];
  values: readonly WorkflowRuleDryRunRecordValue[];
};

export type WorkflowRuleDryRunProposedAction = {
  action: WorkflowRuleAction;
  label: string;
  category: WorkflowRuleActionCategory;
  mode: "summary_only";
  recordCount: number;
  summary: string;
  target: {
    kind: "enum_field_draft" | "operator_notice" | "task_draft";
    fieldPath: readonly string[] | null;
    targetValue: string | null;
    title: string | null;
    message: string | null;
    priority: string | null;
    reason: string | null;
    externalDelivery: false;
  };
  wouldMutate: false;
  wouldCreateRecord: false;
  wouldSendMessage: false;
  wouldRecordAuditEvent: false;
  wouldExecuteAction: false;
};

export type WorkflowRuleDryRunResult = {
  contentType: typeof WORKFLOW_RULE_DRY_RUN_CONTENT_TYPE;
  dryRunType: "workflow-rule-dry-run";
  dryRunVersion: typeof WORKFLOW_RULE_DRY_RUN_VERSION;
  generatedAt: string | null;
  entity: WorkflowRuleCatalogEntity;
  trigger: WorkflowRuleTrigger;
  conditionCount: number;
  actionCount: number;
  totalCandidateCount: number;
  scannedRecordCount: number;
  matchedRecordCount: number;
  returnedRecordCount: number;
  matchLimit: number;
  scanLimit: typeof WORKFLOW_RULE_DRY_RUN_SCAN_LIMIT;
  truncated: boolean;
  scanTruncated: boolean;
  rule: {
    entity: WorkflowRuleCatalogEntity;
    trigger: WorkflowRuleTrigger;
    conditions: readonly WorkflowRuleDryRunCondition[];
    actions: readonly WorkflowRuleDryRunAction[];
  };
  matchedRecords: readonly WorkflowRuleDryRunRecordReference[];
  proposedActions: readonly WorkflowRuleDryRunProposedAction[];
  source: {
    catalogVersion: typeof WORKFLOW_RULE_CATALOG_VERSION;
    catalogModule: "lib/server/workflowRuleCatalog.ts";
    evaluatorScope: "read-only-workflow-rule-dry-run";
  };
  read: WorkflowRuleDryRunReadFlags;
  write: WorkflowRuleDryRunWriteFlags;
  safety: WorkflowRuleDryRunSafety;
};

type ParsedWorkflowRuleDryRunInput = z.infer<
  typeof workflowRuleDryRunInputSchema
>;

type ParsedWorkflowRuleDraftCondition = ParsedWorkflowRuleDryRunInput["conditions"][number];
type ParsedWorkflowRuleDraftAction = ParsedWorkflowRuleDryRunInput["actions"][number];

type WorkflowRuleDryRunFieldValue = string | number | Date | null;

type WorkflowRuleDryRunCandidateRecord = {
  id: string;
  label: string;
  route: string;
  values: Record<string, WorkflowRuleDryRunFieldValue>;
};

type NormalizedCondition = WorkflowRuleDryRunCondition & {
  definition: WorkflowRuleConditionDefinition;
};

type NormalizedAction = WorkflowRuleDryRunAction & {
  definition: WorkflowRuleEntityActionDefinition;
};

const WORKFLOW_RULE_CONDITION_OPERATORS = [
  "after",
  "before",
  "contains",
  "equals",
  "greater_than_or_equal",
  "is_empty",
  "is_not_empty",
  "less_than_or_equal",
  "not_equals"
] as const satisfies readonly WorkflowRuleConditionOperator[];

const optionalDate = z.preprocess((value) => {
  if (value instanceof Date) {
    return value;
  }

  if (typeof value !== "string" && typeof value !== "number") {
    return undefined;
  }

  if (typeof value === "string" && value.trim().length === 0) {
    return undefined;
  }

  return new Date(value);
}, z.date().optional());

const conditionValueSchema = z
  .union([z.string(), z.number(), z.date(), z.null()])
  .optional();

const workflowRuleConditionInputSchema = z
  .object({
    condition: z.string().trim().min(1),
    operator: z.enum(WORKFLOW_RULE_CONDITION_OPERATORS),
    value: conditionValueSchema
  })
  .strict();

const workflowRuleActionInputSchema = z
  .object({
    action: z.enum(WORKFLOW_RULE_ACTIONS),
    targetValue: z.string().trim().min(1).optional(),
    title: z.string().trim().min(1).optional(),
    message: z.string().trim().min(1).optional(),
    priority: z.string().trim().min(1).optional(),
    reason: z.string().trim().min(1).optional()
  })
  .strict();

const workflowRuleDryRunInputSchema = z
  .object({
    entity: z.enum(WORKFLOW_RULE_SUPPORTED_ENTITIES),
    trigger: z.enum(WORKFLOW_RULE_TRIGGERS),
    conditions: z
      .array(workflowRuleConditionInputSchema)
      .max(WORKFLOW_RULE_DRY_RUN_MAX_CONDITIONS)
      .default([]),
    actions: z
      .array(workflowRuleActionInputSchema)
      .min(1)
      .max(WORKFLOW_RULE_DRY_RUN_MAX_ACTIONS),
    limit: z
      .coerce.number()
      .int()
      .min(1)
      .max(WORKFLOW_RULE_DRY_RUN_MAX_MATCHES)
      .default(WORKFLOW_RULE_DRY_RUN_DEFAULT_LIMIT),
    generatedAt: optionalDate
  })
  .strict();

export async function dryRunWorkflowRule(
  input: unknown
): Promise<WorkflowRuleDryRunResult> {
  const parsed = workflowRuleDryRunInputSchema.parse(input);
  const catalog = requireWorkflowRuleEntityCatalog(parsed.entity);
  validateTrigger(catalog.entity, parsed.trigger);

  const conditions = parsed.conditions.map((condition) =>
    normalizeCondition(catalog.entity, condition)
  );
  const actions = parsed.actions.map((action) =>
    normalizeAction(catalog.entity, action)
  );
  const [totalCandidateCount, candidates] = await Promise.all([
    countCandidates(parsed.entity),
    loadCandidateRecords(parsed.entity)
  ]);
  const matchedCandidates = candidates.filter((candidate) =>
    conditions.every((condition) => matchesCondition(candidate, condition))
  );
  const matchedRecords = matchedCandidates
    .slice(0, parsed.limit)
    .map((candidate) => buildMatchedRecord(candidate, conditions));

  return {
    contentType: WORKFLOW_RULE_DRY_RUN_CONTENT_TYPE,
    dryRunType: "workflow-rule-dry-run",
    dryRunVersion: WORKFLOW_RULE_DRY_RUN_VERSION,
    generatedAt: parsed.generatedAt?.toISOString() ?? null,
    entity: parsed.entity,
    trigger: parsed.trigger,
    conditionCount: conditions.length,
    actionCount: actions.length,
    totalCandidateCount,
    scannedRecordCount: candidates.length,
    matchedRecordCount: matchedCandidates.length,
    returnedRecordCount: matchedRecords.length,
    matchLimit: parsed.limit,
    scanLimit: WORKFLOW_RULE_DRY_RUN_SCAN_LIMIT,
    truncated: matchedCandidates.length > matchedRecords.length,
    scanTruncated: totalCandidateCount > candidates.length,
    rule: {
      entity: parsed.entity,
      trigger: parsed.trigger,
      conditions: conditions.map(stripConditionDefinition),
      actions: actions.map(stripActionDefinition)
    },
    matchedRecords,
    proposedActions: actions.map((action) =>
      buildProposedAction(action, matchedRecords.length)
    ),
    source: {
      catalogVersion: WORKFLOW_RULE_CATALOG_VERSION,
      catalogModule: "lib/server/workflowRuleCatalog.ts",
      evaluatorScope: "read-only-workflow-rule-dry-run"
    },
    read: readFlags(),
    write: noWrites(),
    safety: safetyFlags()
  };
}

function readFlags(): WorkflowRuleDryRunReadFlags {
  return {
    metadata: true,
    database: true,
    crmRecords: true,
    adapterInternals: false,
    runtimeEvaluation: true
  };
}

function noWrites(): WorkflowRuleDryRunWriteFlags {
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

function safetyFlags(): WorkflowRuleDryRunSafety {
  return {
    deterministic: true,
    readOnly: true,
    previewOnly: true,
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

function requireWorkflowRuleEntityCatalog(entity: WorkflowRuleCatalogEntity) {
  const catalog = getWorkflowRuleEntityCatalog(entity);

  if (catalog === null) {
    throw new Error(`Workflow rule entity '${entity}' is not supported.`);
  }

  return catalog;
}

function validateTrigger(
  entity: WorkflowRuleCatalogEntity,
  trigger: WorkflowRuleTrigger
): void {
  const catalog = requireWorkflowRuleEntityCatalog(entity);
  const supported = catalog.triggers.some((candidate) => candidate.key === trigger);

  if (!supported) {
    throw new Error(
      `Workflow rule trigger '${trigger}' is not supported for ${entity}.`
    );
  }
}

function normalizeCondition(
  entity: WorkflowRuleCatalogEntity,
  input: ParsedWorkflowRuleDraftCondition
): NormalizedCondition {
  const catalog = requireWorkflowRuleEntityCatalog(entity);
  const definition = catalog.conditions.find(
    (condition) => condition.key === input.condition
  );

  if (definition === undefined) {
    throw new Error(
      `Workflow rule condition '${input.condition}' is not supported for ${entity}.`
    );
  }

  if (!definition.operators.includes(input.operator)) {
    throw new Error(
      `Workflow rule condition '${input.condition}' does not support operator '${input.operator}'.`
    );
  }

  return {
    condition: definition.key,
    label: definition.label,
    operator: input.operator,
    valueType: definition.valueType,
    value: normalizeConditionValue(definition, input.operator, input.value),
    fieldPaths: definition.fieldPaths.map((fieldPath) => [...fieldPath]),
    definition
  };
}

function normalizeConditionValue(
  definition: WorkflowRuleConditionDefinition,
  operator: WorkflowRuleConditionOperator,
  value: ParsedWorkflowRuleDraftCondition["value"]
): string | number | null {
  if (operator === "is_empty" || operator === "is_not_empty") {
    return null;
  }

  if (value === undefined || value === null) {
    throw new Error(
      `Workflow rule condition '${definition.key}' requires a value for operator '${operator}'.`
    );
  }

  switch (definition.valueType) {
    case "number":
      return normalizeNumberConditionValue(definition.key, value);
    case "date":
      return normalizeDateConditionValue(definition.key, value);
    case "assignment_reason":
    case "case_priority":
    case "case_queue":
    case "deal_stage":
    case "id":
    case "status":
    case "task_priority":
    case "text":
      return normalizeStringConditionValue(definition, value);
  }
}

function normalizeStringConditionValue(
  definition: WorkflowRuleConditionDefinition,
  value: string | number | Date
): string {
  if (value instanceof Date) {
    throw new Error(
      `Workflow rule condition '${definition.key}' expects a string value.`
    );
  }

  const normalized = String(value).trim();

  if (normalized.length === 0) {
    throw new Error(
      `Workflow rule condition '${definition.key}' expects a non-empty value.`
    );
  }

  if (
    definition.allowedValues !== null &&
    !definition.allowedValues.includes(normalized)
  ) {
    throw new Error(
      `Workflow rule condition '${definition.key}' does not allow value '${normalized}'.`
    );
  }

  return normalized;
}

function normalizeNumberConditionValue(
  condition: string,
  value: string | number | Date
): number {
  if (value instanceof Date) {
    throw new Error(`Workflow rule condition '${condition}' expects a number.`);
  }

  const normalized =
    typeof value === "number" ? value : Number.parseFloat(value.trim());

  if (!Number.isFinite(normalized)) {
    throw new Error(`Workflow rule condition '${condition}' expects a number.`);
  }

  return normalized;
}

function normalizeDateConditionValue(
  condition: string,
  value: string | number | Date
): string {
  const normalized = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(normalized.getTime())) {
    throw new Error(`Workflow rule condition '${condition}' expects a date.`);
  }

  return normalized.toISOString();
}

function normalizeAction(
  entity: WorkflowRuleCatalogEntity,
  input: ParsedWorkflowRuleDraftAction
): NormalizedAction {
  const catalog = requireWorkflowRuleEntityCatalog(entity);
  const definition = catalog.actions.find(
    (candidate) => candidate.action === input.action
  );

  if (definition === undefined) {
    throw new Error(
      `Workflow rule action '${input.action}' is not supported for ${entity}.`
    );
  }

  return normalizeActionTarget(definition, input);
}

function normalizeActionTarget(
  definition: WorkflowRuleEntityActionDefinition,
  input: ParsedWorkflowRuleDraftAction
): NormalizedAction {
  switch (definition.action) {
    case "draft_task":
      return {
        action: definition.action,
        label: definition.label,
        category: definition.category,
        targetValue: null,
        title: requireTextInput(input.title, "Task title", definition.action),
        message: null,
        priority: optionalAllowedValue(
          input.priority,
          definition.target.allowedValues,
          "Task priority",
          definition.action
        ),
        reason: input.reason ?? null,
        definition
      };
    case "draft_notification":
      return {
        action: definition.action,
        label: definition.label,
        category: definition.category,
        targetValue: null,
        title: null,
        message: requireTextInput(
          input.message,
          "Notification message",
          definition.action
        ),
        priority: null,
        reason: input.reason ?? null,
        definition
      };
    case "draft_status_update":
    case "draft_stage_update":
    case "draft_priority_update":
    case "draft_case_queue_assignment":
      return {
        action: definition.action,
        label: definition.label,
        category: definition.category,
        targetValue: requireAllowedValue(
          input.targetValue,
          definition.target.allowedValues,
          "Target value",
          definition.action
        ),
        title: null,
        message: null,
        priority: null,
        reason: input.reason ?? null,
        definition
      };
  }
}

function requireTextInput(
  value: string | undefined,
  label: string,
  action: WorkflowRuleAction
): string {
  if (value === undefined) {
    throw new Error(`${label} is required for workflow action '${action}'.`);
  }

  return value;
}

function requireAllowedValue(
  value: string | undefined,
  allowedValues: readonly string[] | null,
  label: string,
  action: WorkflowRuleAction
): string {
  const normalized = requireTextInput(value, label, action);

  if (allowedValues !== null && !allowedValues.includes(normalized)) {
    throw new Error(
      `${label} '${normalized}' is not valid for workflow action '${action}'.`
    );
  }

  return normalized;
}

function optionalAllowedValue(
  value: string | undefined,
  allowedValues: readonly string[] | null,
  label: string,
  action: WorkflowRuleAction
): string | null {
  if (value === undefined) {
    return null;
  }

  return requireAllowedValue(value, allowedValues, label, action);
}

function stripConditionDefinition(
  condition: NormalizedCondition
): WorkflowRuleDryRunCondition {
  return {
    condition: condition.condition,
    label: condition.label,
    operator: condition.operator,
    valueType: condition.valueType,
    value: condition.value,
    fieldPaths: condition.fieldPaths.map((fieldPath) => [...fieldPath])
  };
}

function stripActionDefinition(action: NormalizedAction): WorkflowRuleDryRunAction {
  return {
    action: action.action,
    label: action.label,
    category: action.category,
    targetValue: action.targetValue,
    title: action.title,
    message: action.message,
    priority: action.priority,
    reason: action.reason
  };
}

function matchesCondition(
  record: WorkflowRuleDryRunCandidateRecord,
  condition: NormalizedCondition
): boolean {
  const values = condition.fieldPaths.map((fieldPath) =>
    valueForFieldPath(record, fieldPath)
  );

  switch (condition.operator) {
    case "contains":
      return values.some((value) =>
        compareText(value).includes(compareText(condition.value))
      );
    case "equals":
      return values.some(
        (value) => compareText(value) === compareText(condition.value)
      );
    case "not_equals":
      return values.every(
        (value) => compareText(value) !== compareText(condition.value)
      );
    case "greater_than_or_equal":
      return values.some(
        (value) => numericValue(value) >= numericConditionValue(condition)
      );
    case "less_than_or_equal":
      return values.some(
        (value) => numericValue(value) <= numericConditionValue(condition)
      );
    case "after":
      return values.some(
        (value) => dateValue(value) > dateConditionValue(condition)
      );
    case "before":
      return values.some(
        (value) => dateValue(value) < dateConditionValue(condition)
      );
    case "is_empty":
      return values.some((value) => isEmptyValue(value));
    case "is_not_empty":
      return values.some((value) => !isEmptyValue(value));
  }
}

function valueForFieldPath(
  record: WorkflowRuleDryRunCandidateRecord,
  fieldPath: readonly string[]
): WorkflowRuleDryRunFieldValue {
  return record.values[fieldPathKey(fieldPath)] ?? null;
}

function fieldPathKey(fieldPath: readonly string[]): string {
  return fieldPath.join(".");
}

function compareText(value: WorkflowRuleDryRunFieldValue | string | number | null): string {
  if (value instanceof Date) {
    return value.toISOString().toLowerCase();
  }

  return value === null ? "" : String(value).trim().toLowerCase();
}

function numericValue(value: WorkflowRuleDryRunFieldValue): number {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    return Number.parseFloat(value);
  }

  return Number.NaN;
}

function numericConditionValue(condition: NormalizedCondition): number {
  return typeof condition.value === "number" ? condition.value : Number.NaN;
}

function dateValue(value: WorkflowRuleDryRunFieldValue): number {
  if (value instanceof Date) {
    return value.getTime();
  }

  if (typeof value === "string" || typeof value === "number") {
    return new Date(value).getTime();
  }

  return Number.NaN;
}

function dateConditionValue(condition: NormalizedCondition): number {
  return typeof condition.value === "string"
    ? new Date(condition.value).getTime()
    : Number.NaN;
}

function isEmptyValue(value: WorkflowRuleDryRunFieldValue): boolean {
  return value === null || (typeof value === "string" && value.trim() === "");
}

function buildMatchedRecord(
  candidate: WorkflowRuleDryRunCandidateRecord,
  conditions: readonly NormalizedCondition[]
): WorkflowRuleDryRunRecordReference {
  return {
    id: candidate.id,
    label: candidate.label,
    route: candidate.route,
    matchedConditionKeys: conditions.map((condition) => condition.condition),
    values: conditions.flatMap((condition) =>
      condition.fieldPaths.map((fieldPath) => ({
        condition: condition.condition,
        fieldPath: [...fieldPath],
        value: serializeFieldValue(valueForFieldPath(candidate, fieldPath))
      }))
    )
  };
}

function serializeFieldValue(
  value: WorkflowRuleDryRunFieldValue
): string | number | null {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return value;
}

function buildProposedAction(
  action: NormalizedAction,
  recordCount: number
): WorkflowRuleDryRunProposedAction {
  return {
    action: action.action,
    label: action.label,
    category: action.category,
    mode: "summary_only",
    recordCount,
    summary: proposedActionSummary(action, recordCount),
    target: {
      kind: action.definition.target.kind,
      fieldPath: action.definition.target.fieldPath
        ? [...action.definition.target.fieldPath]
        : null,
      targetValue: action.targetValue,
      title: action.title,
      message: action.message,
      priority: action.priority,
      reason: action.reason,
      externalDelivery: false
    },
    wouldMutate: false,
    wouldCreateRecord: false,
    wouldSendMessage: false,
    wouldRecordAuditEvent: false,
    wouldExecuteAction: false
  };
}

function proposedActionSummary(
  action: NormalizedAction,
  recordCount: number
): string {
  if (recordCount === 0) {
    return `${action.label} has no proposed draft because no records matched.`;
  }

  switch (action.action) {
    case "draft_task":
      return `Draft ${pluralize(recordCount, "task")} titled "${action.title}" for ${pluralize(recordCount, "matched record")}.`;
    case "draft_notification":
      return `Draft ${pluralize(recordCount, "operator notification")} for ${pluralize(recordCount, "matched record")}.`;
    case "draft_status_update":
    case "draft_stage_update":
    case "draft_priority_update":
    case "draft_case_queue_assignment":
      return `Propose ${pluralize(recordCount, "field update")} to "${action.targetValue}" for ${pluralize(recordCount, "matched record")}.`;
  }
}

function pluralize(count: number, singular: string): string {
  return count === 1 ? `1 ${singular}` : `${count} ${singular}s`;
}

async function countCandidates(
  entity: WorkflowRuleCatalogEntity
): Promise<number> {
  switch (entity) {
    case "accounts":
      return prisma.account.count();
    case "contacts":
      return prisma.contact.count();
    case "opportunities":
      return prisma.deal.count();
    case "leads":
      return prisma.lead.count();
    case "tasks":
      return prisma.task.count();
    case "cases":
      return prisma.case.count();
    case "campaigns":
      return prisma.campaign.count();
  }
}

async function loadCandidateRecords(
  entity: WorkflowRuleCatalogEntity
): Promise<WorkflowRuleDryRunCandidateRecord[]> {
  switch (entity) {
    case "accounts":
      return loadAccountCandidates();
    case "contacts":
      return loadContactCandidates();
    case "opportunities":
      return loadOpportunityCandidates();
    case "leads":
      return loadLeadCandidates();
    case "tasks":
      return loadTaskCandidates();
    case "cases":
      return loadCaseCandidates();
    case "campaigns":
      return loadCampaignCandidates();
  }
}

async function loadAccountCandidates(): Promise<WorkflowRuleDryRunCandidateRecord[]> {
  const records = await prisma.account.findMany({
    orderBy: { id: "asc" },
    take: WORKFLOW_RULE_DRY_RUN_SCAN_LIMIT,
    select: {
      id: true,
      name: true,
      domain: true,
      industry: true,
      city: true,
      region: true,
      status: true,
      ownerId: true,
      healthScore: true
    }
  });

  return records.map((record) =>
    candidateRecord("accounts", record.id, record.name, {
      name: record.name,
      domain: record.domain,
      industry: record.industry,
      city: record.city,
      region: record.region,
      status: record.status,
      ownerId: record.ownerId,
      healthScore: record.healthScore
    })
  );
}

async function loadContactCandidates(): Promise<WorkflowRuleDryRunCandidateRecord[]> {
  const records = await prisma.contact.findMany({
    orderBy: { id: "asc" },
    take: WORKFLOW_RULE_DRY_RUN_SCAN_LIMIT,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      title: true,
      status: true,
      accountId: true
    }
  });

  return records.map((record) =>
    candidateRecord("contacts", record.id, `${record.firstName} ${record.lastName}`, {
      firstName: record.firstName,
      lastName: record.lastName,
      email: record.email,
      phone: record.phone,
      title: record.title,
      status: record.status,
      accountId: record.accountId
    })
  );
}

async function loadOpportunityCandidates(): Promise<WorkflowRuleDryRunCandidateRecord[]> {
  const records = await prisma.deal.findMany({
    orderBy: { id: "asc" },
    take: WORKFLOW_RULE_DRY_RUN_SCAN_LIMIT,
    select: {
      id: true,
      name: true,
      stage: true,
      value: true,
      expectedCloseDate: true,
      ownerId: true,
      accountId: true
    }
  });

  return records.map((record) =>
    candidateRecord("opportunities", record.id, record.name, {
      stage: record.stage,
      value: record.value,
      expectedCloseDate: record.expectedCloseDate,
      ownerId: record.ownerId,
      accountId: record.accountId
    })
  );
}

async function loadLeadCandidates(): Promise<WorkflowRuleDryRunCandidateRecord[]> {
  const records = await prisma.lead.findMany({
    orderBy: { id: "asc" },
    take: WORKFLOW_RULE_DRY_RUN_SCAN_LIMIT,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      postalCode: true,
      source: true,
      status: true,
      assignmentReason: true,
      assignedOrderId: true,
      areaId: true
    }
  });

  return records.map((record) =>
    candidateRecord("leads", record.id, `${record.firstName} ${record.lastName}`, {
      firstName: record.firstName,
      lastName: record.lastName,
      email: record.email,
      phone: record.phone,
      postalCode: record.postalCode,
      source: record.source,
      status: record.status,
      assignmentReason: record.assignmentReason,
      assignedOrderId: record.assignedOrderId,
      areaId: record.areaId
    })
  );
}

async function loadTaskCandidates(): Promise<WorkflowRuleDryRunCandidateRecord[]> {
  const records = await prisma.task.findMany({
    orderBy: { id: "asc" },
    take: WORKFLOW_RULE_DRY_RUN_SCAN_LIMIT,
    select: {
      id: true,
      title: true,
      status: true,
      priority: true,
      dueDate: true,
      ownerId: true
    }
  });

  return records.map((record) =>
    candidateRecord("tasks", record.id, record.title, {
      status: record.status,
      priority: record.priority,
      dueDate: record.dueDate,
      ownerId: record.ownerId
    })
  );
}

async function loadCaseCandidates(): Promise<WorkflowRuleDryRunCandidateRecord[]> {
  const records = await prisma.case.findMany({
    orderBy: { id: "asc" },
    take: WORKFLOW_RULE_DRY_RUN_SCAN_LIMIT,
    select: {
      id: true,
      subject: true,
      status: true,
      priority: true,
      queueKey: true,
      ownerId: true,
      accountId: true
    }
  });

  return records.map((record) =>
    candidateRecord("cases", record.id, record.subject, {
      status: record.status,
      priority: record.priority,
      queueKey: record.queueKey,
      ownerId: record.ownerId,
      accountId: record.accountId
    })
  );
}

async function loadCampaignCandidates(): Promise<WorkflowRuleDryRunCandidateRecord[]> {
  const records = await prisma.campaign.findMany({
    orderBy: { id: "asc" },
    take: WORKFLOW_RULE_DRY_RUN_SCAN_LIMIT,
    select: {
      id: true,
      name: true,
      status: true,
      startDate: true,
      endDate: true,
      budget: true,
      ownerId: true
    }
  });

  return records.map((record) =>
    candidateRecord("campaigns", record.id, record.name, {
      status: record.status,
      startDate: record.startDate,
      endDate: record.endDate,
      budget: record.budget,
      ownerId: record.ownerId
    })
  );
}

function candidateRecord(
  entity: WorkflowRuleCatalogEntity,
  id: string,
  label: string,
  values: Record<string, WorkflowRuleDryRunFieldValue>
): WorkflowRuleDryRunCandidateRecord {
  return {
    id,
    label,
    route: recordRoute(entity, id),
    values
  };
}

function recordRoute(entity: WorkflowRuleCatalogEntity, id: string): string {
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
