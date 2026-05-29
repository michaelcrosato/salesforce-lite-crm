import { z } from "zod/v4";
import {
  createTask,
  updateAccount,
  updateCampaign,
  updateCase,
  updateContact,
  updateLead,
  updateOpportunity,
  updateTask
} from "@/lib/crm/crmClient";
import {
  WORKFLOW_RULE_EXECUTION_CAPABILITY_CONTENT_TYPE,
  WORKFLOW_RULE_EXECUTION_CAPABILITY_VERSION,
  getWorkflowRuleExecutionActionCapability,
  type WorkflowRuleExecutionCapabilityBlockReasonCode,
  type WorkflowRuleExecutionManualExecutorPath
} from "@/lib/server/workflowRuleExecutionCapabilities";
import {
  WORKFLOW_RULE_REVIEW_PACKET_CONTENT_TYPE,
  WORKFLOW_RULE_REVIEW_PACKET_VERSION,
  getWorkflowRuleReviewPacket,
  type WorkflowRuleReviewPacket
} from "@/lib/server/workflowRuleReviewPackets";
import type {
  WorkflowRuleDryRunProposedAction,
  WorkflowRuleDryRunRecordReference
} from "@/lib/server/workflowRuleDryRun";
import type {
  WorkflowRuleAction,
  WorkflowRuleActionCategory,
  WorkflowRuleCatalogEntity,
  WorkflowRuleTrigger
} from "@/lib/server/workflowRuleCatalog";
import {
  recordAuditEvent,
  type AuditEntityType,
  type AuditMetadataValue
} from "@/lib/services/auditEvents";
import {
  accountStatusSchema,
  campaignStatusSchema,
  casePrioritySchema,
  caseQueueKeySchema,
  caseStatusSchema,
  contactStatusSchema,
  dealStageSchema,
  idSchema,
  leadStatusSchema,
  taskPrioritySchema,
  taskStatusSchema
} from "@/lib/validation";

export const WORKFLOW_RULE_MANUAL_EXECUTION_CONTENT_TYPE =
  "application/json; charset=utf-8" as const;

export const WORKFLOW_RULE_MANUAL_EXECUTION_VERSION =
  "2026-05-25.s39-f2" as const;

export type WorkflowRuleManualExecutionStatus =
  | "blocked"
  | "completed"
  | "failed"
  | "partial";

export type WorkflowRuleManualExecutionActionStatus =
  | "blocked"
  | "executed"
  | "failed"
  | "partial";

export type WorkflowRuleManualExecutionRecordStatus =
  | "blocked"
  | "created"
  | "executed"
  | "failed";

export type WorkflowRuleManualExecutionBlockReasonCode =
  | "matched_records_truncated"
  | "no_records_matched"
  | "operator_approval_required"
  | "scan_limit_truncated"
  | "unsupported_action";

export type WorkflowRuleManualExecutionReadFlags = {
  metadata: true;
  catalog: true;
  database: true;
  crmRecords: true;
  adapterInternals: false;
  runtimeEvaluation: true;
  reviewPacket: true;
  capabilityMatrix: true;
  approval: true;
};

export type WorkflowRuleManualExecutionWriteFlags = {
  database: true;
  workflowRules: false;
  crmRecords: true;
  auditEvents: true;
  routes: false;
  routeHandlers: false;
  productUi: false;
  schema: false;
  crmContract: false;
  files: false;
  externalServices: false;
  backgroundJobs: false;
  scheduledSweeps: false;
  actionExecution: true;
  actionApprovals: false;
  executorRuns: false;
  notifications: false;
};

export type WorkflowRuleManualExecutionSafety = {
  deterministic: true;
  readOnly: false;
  previewOnly: false;
  descriptorOnly: false;
  reviewOnly: false;
  rulePersistence: false;
  scheduledExecution: false;
  actionExecution: true;
  arbitraryJavascript: false;
  eval: false;
  externalAi: false;
  network: false;
  externalServices: false;
  routeHandlers: false;
  productUi: false;
  crmContractChanges: false;
  schemaChanges: false;
  manualExecutorOnly: true;
  operatorApprovalRequired: true;
  approvalPersistence: false;
  externalDelivery: false;
};

export type WorkflowRuleManualExecutionApproval = {
  approved: boolean;
  actorUserId: string;
  approvedAt: string | null;
  note: string | null;
};

export type WorkflowRuleManualExecutionRecord = WorkflowRuleDryRunRecordReference & {
  action: WorkflowRuleAction;
  executionStatus: WorkflowRuleManualExecutionRecordStatus;
  attempted: boolean;
  executed: boolean;
  affectedEntityType: AuditEntityType | null;
  affectedRecordId: string | null;
  auditEventId: string | null;
  message: string;
  error: string | null;
};

export type WorkflowRuleManualExecutionAction = {
  action: WorkflowRuleAction;
  label: string;
  category: WorkflowRuleActionCategory;
  status: WorkflowRuleManualExecutionActionStatus;
  recordCount: number;
  executedCount: number;
  blockedCount: number;
  failedCount: number;
  auditEventCount: number;
  manualExecutorPath: WorkflowRuleExecutionManualExecutorPath | null;
  blockReasons: readonly WorkflowRuleManualExecutionBlockReasonCode[];
  capabilityBlockedReasonCodes: readonly WorkflowRuleExecutionCapabilityBlockReasonCode[];
  records: readonly WorkflowRuleManualExecutionRecord[];
  target: {
    kind: WorkflowRuleDryRunProposedAction["target"]["kind"];
    fieldPath: readonly string[] | null;
    targetValue: string | null;
    title: string | null;
    message: string | null;
    priority: string | null;
    reason: string | null;
    externalDelivery: false;
  };
  wouldMutate: boolean;
  wouldCreateRecord: boolean;
  wouldSendMessage: false;
  wouldRecordAuditEvent: boolean;
  wouldExecuteAction: boolean;
};

export type WorkflowRuleManualExecutionCategory = {
  category: WorkflowRuleActionCategory;
  actionCount: number;
  executedActionCount: number;
  blockedActionCount: number;
  failedActionCount: number;
  recordCount: number;
  executedRecordCount: number;
  auditEventCount: number;
  actionKeys: readonly WorkflowRuleAction[];
};

export type WorkflowRuleManualExecutionSummary = {
  entity: WorkflowRuleCatalogEntity;
  trigger: WorkflowRuleTrigger;
  matchedRecordCount: number;
  returnedRecordCount: number;
  proposedActionCount: number;
  executedActionCount: number;
  blockedActionCount: number;
  failedActionCount: number;
  attemptedRecordActionCount: number;
  executedRecordActionCount: number;
  blockedRecordActionCount: number;
  failedRecordActionCount: number;
  auditEventCount: number;
  operatorApprovalRequired: true;
  operatorApproved: boolean;
  didMutate: boolean;
};

export type WorkflowRuleManualExecutionSource = {
  reviewPacketContentType: typeof WORKFLOW_RULE_REVIEW_PACKET_CONTENT_TYPE;
  reviewPacketVersion: typeof WORKFLOW_RULE_REVIEW_PACKET_VERSION;
  reviewPacketModule: "lib/server/workflowRuleReviewPackets.ts";
  capabilityContentType: typeof WORKFLOW_RULE_EXECUTION_CAPABILITY_CONTENT_TYPE;
  capabilityVersion: typeof WORKFLOW_RULE_EXECUTION_CAPABILITY_VERSION;
  capabilityModule: "lib/server/workflowRuleExecutionCapabilities.ts";
  executorScope: "operator-approved-workflow-manual-execution";
  routeScope: readonly string[];
};

export type WorkflowRuleManualExecutionResult = {
  contentType: typeof WORKFLOW_RULE_MANUAL_EXECUTION_CONTENT_TYPE;
  executionType: "workflow-rule-manual-execution";
  executionVersion: typeof WORKFLOW_RULE_MANUAL_EXECUTION_VERSION;
  generatedAt: string | null;
  status: WorkflowRuleManualExecutionStatus;
  blockReasons: readonly WorkflowRuleManualExecutionBlockReasonCode[];
  approval: WorkflowRuleManualExecutionApproval;
  summary: WorkflowRuleManualExecutionSummary;
  actions: readonly WorkflowRuleManualExecutionAction[];
  categories: readonly WorkflowRuleManualExecutionCategory[];
  reviewPacket: WorkflowRuleReviewPacket;
  source: WorkflowRuleManualExecutionSource;
  read: WorkflowRuleManualExecutionReadFlags;
  write: WorkflowRuleManualExecutionWriteFlags;
  safety: WorkflowRuleManualExecutionSafety;
};

type ParsedWorkflowRuleManualExecutionApproval = z.infer<typeof approvalSchema>;

type TaskRelationInput = {
  accountId?: string;
  contactId?: string;
  dealId?: string;
  leadId?: string;
};

type MutationResult = {
  affectedEntityType: AuditEntityType;
  affectedRecordId: string;
  message: string;
  metadata: Record<string, AuditMetadataValue>;
  status: Extract<WorkflowRuleManualExecutionRecordStatus, "created" | "executed">;
};

type MutableCategory = {
  category: WorkflowRuleActionCategory;
  actionCount: number;
  executedActionCount: number;
  blockedActionCount: number;
  failedActionCount: number;
  recordCount: number;
  executedRecordCount: number;
  auditEventCount: number;
  actionKeys: WorkflowRuleAction[];
};

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

const optionalText = z.preprocess((value) => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}, z.string().optional());

const approvalSchema = z
  .object({
    approved: z.boolean(),
    actorUserId: idSchema,
    approvedAt: optionalDate,
    note: optionalText
  })
  .strict();

const workflowRuleManualExecutionInputSchema = z
  .object({
    approval: approvalSchema
  })
  .passthrough();

const ENTITY_AUDIT_TYPES: Record<WorkflowRuleCatalogEntity, AuditEntityType> = {
  accounts: "account",
  contacts: "contact",
  opportunities: "opportunity",
  leads: "lead",
  tasks: "task",
  cases: "case",
  campaigns: "campaign"
};

function readFlags(): WorkflowRuleManualExecutionReadFlags {
  return {
    metadata: true,
    catalog: true,
    database: true,
    crmRecords: true,
    adapterInternals: false,
    runtimeEvaluation: true,
    reviewPacket: true,
    capabilityMatrix: true,
    approval: true
  };
}

function writeFlags(): WorkflowRuleManualExecutionWriteFlags {
  return {
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
  };
}

function safetyFlags(): WorkflowRuleManualExecutionSafety {
  return {
    deterministic: true,
    readOnly: false,
    previewOnly: false,
    descriptorOnly: false,
    reviewOnly: false,
    rulePersistence: false,
    scheduledExecution: false,
    actionExecution: true,
    arbitraryJavascript: false,
    eval: false,
    externalAi: false,
    network: false,
    externalServices: false,
    routeHandlers: false,
    productUi: false,
    crmContractChanges: false,
    schemaChanges: false,
    manualExecutorOnly: true,
    operatorApprovalRequired: true,
    approvalPersistence: false,
    externalDelivery: false
  };
}

export async function executeWorkflowRuleManually(
  input: unknown
): Promise<WorkflowRuleManualExecutionResult> {
  const parsed = workflowRuleManualExecutionInputSchema.parse(input);
  const { approval, ...ruleInput } = parsed;
  const reviewPacket = await getWorkflowRuleReviewPacket(ruleInput);
  const blockReasons = runBlockReasons(approval, reviewPacket);
  const actions: WorkflowRuleManualExecutionAction[] = [];

  for (const action of reviewPacket.dryRun.proposedActions) {
    actions.push(
      await executeAction(action, reviewPacket, approval, blockReasons)
    );
  }

  return buildResult(reviewPacket, approval, blockReasons, actions);
}

function runBlockReasons(
  approval: ParsedWorkflowRuleManualExecutionApproval,
  reviewPacket: WorkflowRuleReviewPacket
): WorkflowRuleManualExecutionBlockReasonCode[] {
  const reasons: WorkflowRuleManualExecutionBlockReasonCode[] = [];

  if (!approval.approved) {
    reasons.push("operator_approval_required");
  }

  if (reviewPacket.affectedObjects.matchedRecordCount === 0) {
    reasons.push("no_records_matched");
  }

  if (reviewPacket.affectedObjects.truncated) {
    reasons.push("matched_records_truncated");
  }

  if (reviewPacket.affectedObjects.scanTruncated) {
    reasons.push("scan_limit_truncated");
  }

  return reasons;
}

async function executeAction(
  action: WorkflowRuleDryRunProposedAction,
  reviewPacket: WorkflowRuleReviewPacket,
  approval: ParsedWorkflowRuleManualExecutionApproval,
  runReasons: readonly WorkflowRuleManualExecutionBlockReasonCode[]
): Promise<WorkflowRuleManualExecutionAction> {
  const capability = getWorkflowRuleExecutionActionCapability(
    reviewPacket.ruleMetadata.entity,
    action.action
  );
  const capabilityBlockedReasonCodes =
    capability?.blockedReasons.map((reason) => reason.code) ?? [];
  const unsupported =
    capability === null || capability.status !== "supported";
  const actionReasons = uniqueReasons([
    ...runReasons,
    ...(unsupported ? ["unsupported_action" as const] : [])
  ]);
  const records: WorkflowRuleManualExecutionRecord[] = [];

  if (actionReasons.length > 0) {
    for (const record of reviewPacket.dryRun.matchedRecords) {
      records.push(blockedRecord(action, record, actionReasons));
    }
  } else {
    for (const record of reviewPacket.dryRun.matchedRecords) {
      records.push(await executeRecord(action, record, reviewPacket, approval));
    }
  }

  const executedCount = records.filter((record) => record.executed).length;
  const failedCount = records.filter(
    (record) => record.executionStatus === "failed"
  ).length;
  const blockedCount = records.filter(
    (record) => record.executionStatus === "blocked"
  ).length;
  const auditEventCount = records.filter((record) => record.auditEventId).length;

  return {
    action: action.action,
    label: action.label,
    category: action.category,
    status: actionStatus(executedCount, blockedCount, failedCount),
    recordCount: action.recordCount,
    executedCount,
    blockedCount,
    failedCount,
    auditEventCount,
    manualExecutorPath: capability?.manualExecutorPath ?? null,
    blockReasons: actionReasons,
    capabilityBlockedReasonCodes,
    records,
    target: {
      kind: action.target.kind,
      fieldPath: action.target.fieldPath ? [...action.target.fieldPath] : null,
      targetValue: action.target.targetValue,
      title: action.target.title,
      message: action.target.message,
      priority: action.target.priority,
      reason: action.target.reason,
      externalDelivery: false
    },
    wouldMutate: executedCount > 0,
    wouldCreateRecord: action.action === "draft_task" && executedCount > 0,
    wouldSendMessage: false,
    wouldRecordAuditEvent: auditEventCount > 0,
    wouldExecuteAction: executedCount > 0
  };
}

async function executeRecord(
  action: WorkflowRuleDryRunProposedAction,
  record: WorkflowRuleDryRunRecordReference,
  reviewPacket: WorkflowRuleReviewPacket,
  approval: ParsedWorkflowRuleManualExecutionApproval
): Promise<WorkflowRuleManualExecutionRecord> {
  try {
    const mutation = await executeMutation(
      reviewPacket.ruleMetadata.entity,
      action,
      record
    );
    const auditEventId = await recordExecutionAuditEvent(
      action,
      record,
      reviewPacket,
      approval,
      mutation
    );

    return executedRecord(action, record, mutation, auditEventId);
  } catch (error) {
    return failedRecord(action, record, error);
  }
}

async function executeMutation(
  entity: WorkflowRuleCatalogEntity,
  action: WorkflowRuleDryRunProposedAction,
  record: WorkflowRuleDryRunRecordReference
): Promise<MutationResult> {
  switch (action.action) {
    case "draft_task":
      return executeTaskDraft(entity, action, record);
    case "draft_status_update":
      return executeStatusUpdate(entity, action, record);
    case "draft_stage_update":
      return executeStageUpdate(entity, action, record);
    case "draft_priority_update":
      return executePriorityUpdate(entity, action, record);
    case "draft_case_queue_assignment":
      return executeCaseQueueAssignment(entity, action, record);
    case "draft_notification":
      throw new Error("Workflow notification delivery is not supported.");
  }
}

async function executeTaskDraft(
  entity: WorkflowRuleCatalogEntity,
  action: WorkflowRuleDryRunProposedAction,
  record: WorkflowRuleDryRunRecordReference
): Promise<MutationResult> {
  const title = requireActionText(action.target.title, "Task title", action);
  const task = await createTask({
    title,
    description: taskDescription(entity, action, record),
    priority: action.target.priority
      ? taskPrioritySchema.parse(action.target.priority)
      : undefined,
    ...taskRelation(entity, record.id)
  });

  return {
    affectedEntityType: "task",
    affectedRecordId: task.id,
    message: `Workflow action created task ${task.title} for ${record.label}.`,
    metadata: {
      createdTaskId: task.id,
      linkedEntity: entity,
      linkedRecordId: record.id,
      linkedRecordRoute: record.route,
      taskTitle: task.title
    },
    status: "created"
  };
}

async function executeStatusUpdate(
  entity: WorkflowRuleCatalogEntity,
  action: WorkflowRuleDryRunProposedAction,
  record: WorkflowRuleDryRunRecordReference
): Promise<MutationResult> {
  const targetValue = requireActionText(
    action.target.targetValue,
    "Target status",
    action
  );

  switch (entity) {
    case "accounts":
      await updateAccount(record.id, {
        status: accountStatusSchema.parse(targetValue)
      });
      break;
    case "contacts":
      await updateContact(record.id, {
        status: contactStatusSchema.parse(targetValue)
      });
      break;
    case "leads":
      await updateLead(record.id, { status: leadStatusSchema.parse(targetValue) });
      break;
    case "tasks":
      await updateTask(record.id, { status: taskStatusSchema.parse(targetValue) });
      break;
    case "cases":
      await updateCase(record.id, { status: caseStatusSchema.parse(targetValue) });
      break;
    case "campaigns":
      await updateCampaign(record.id, {
        status: campaignStatusSchema.parse(targetValue)
      });
      break;
    case "opportunities":
      throw new Error("Opportunities use stage workflow actions.");
  }

  return fieldMutation(
    entity,
    record,
    action,
    "status",
    targetValue,
    "executed"
  );
}

async function executeStageUpdate(
  entity: WorkflowRuleCatalogEntity,
  action: WorkflowRuleDryRunProposedAction,
  record: WorkflowRuleDryRunRecordReference
): Promise<MutationResult> {
  if (entity !== "opportunities") {
    throw new Error("Stage workflow actions are supported only for opportunities.");
  }

  const targetValue = dealStageSchema.parse(
    requireActionText(action.target.targetValue, "Target stage", action)
  );

  await updateOpportunity(record.id, { stage: targetValue });

  return fieldMutation(
    entity,
    record,
    action,
    "stage",
    targetValue,
    "executed"
  );
}

async function executePriorityUpdate(
  entity: WorkflowRuleCatalogEntity,
  action: WorkflowRuleDryRunProposedAction,
  record: WorkflowRuleDryRunRecordReference
): Promise<MutationResult> {
  const targetValue = requireActionText(
    action.target.targetValue,
    "Target priority",
    action
  );

  switch (entity) {
    case "tasks":
      await updateTask(record.id, {
        priority: taskPrioritySchema.parse(targetValue)
      });
      break;
    case "cases":
      await updateCase(record.id, {
        priority: casePrioritySchema.parse(targetValue)
      });
      break;
    case "accounts":
    case "contacts":
    case "opportunities":
    case "leads":
    case "campaigns":
      throw new Error(`Priority workflow actions are not supported for ${entity}.`);
  }

  return fieldMutation(
    entity,
    record,
    action,
    "priority",
    targetValue,
    "executed"
  );
}

async function executeCaseQueueAssignment(
  entity: WorkflowRuleCatalogEntity,
  action: WorkflowRuleDryRunProposedAction,
  record: WorkflowRuleDryRunRecordReference
): Promise<MutationResult> {
  if (entity !== "cases") {
    throw new Error("Case queue assignment is supported only for cases.");
  }

  const targetValue = caseQueueKeySchema.parse(
    requireActionText(action.target.targetValue, "Target case queue", action)
  );

  await updateCase(record.id, { queueKey: targetValue });

  return fieldMutation(
    entity,
    record,
    action,
    "queueKey",
    targetValue,
    "executed"
  );
}

function fieldMutation(
  entity: WorkflowRuleCatalogEntity,
  record: WorkflowRuleDryRunRecordReference,
  action: WorkflowRuleDryRunProposedAction,
  field: string,
  targetValue: string,
  status: Extract<WorkflowRuleManualExecutionRecordStatus, "executed">
): MutationResult {
  const affectedEntityType = ENTITY_AUDIT_TYPES[entity];

  return {
    affectedEntityType,
    affectedRecordId: record.id,
    message: `Workflow action updated ${field} to ${targetValue} for ${record.label}.`,
    metadata: {
      field,
      targetValue,
      action: action.action,
      reason: action.target.reason
    },
    status
  };
}

async function recordExecutionAuditEvent(
  action: WorkflowRuleDryRunProposedAction,
  record: WorkflowRuleDryRunRecordReference,
  reviewPacket: WorkflowRuleReviewPacket,
  approval: ParsedWorkflowRuleManualExecutionApproval,
  mutation: MutationResult
): Promise<string> {
  const auditEvent = await recordAuditEvent({
    category: "workflow",
    action: "workflow_action_execute",
    actorUserId: approval.actorUserId,
    entityType: mutation.affectedEntityType,
    entityId: mutation.affectedRecordId,
    summary: mutation.message,
    metadata: {
      source: "workflow_rule_manual_executor",
      executionVersion: WORKFLOW_RULE_MANUAL_EXECUTION_VERSION,
      reviewPacketVersion: reviewPacket.packetVersion,
      sourceEntity: reviewPacket.ruleMetadata.entity,
      sourceTrigger: reviewPacket.ruleMetadata.trigger,
      sourceRecordId: record.id,
      sourceRecordLabel: record.label,
      sourceRecordRoute: record.route,
      workflowAction: action.action,
      workflowActionCategory: action.category,
      target: actionTargetMetadata(action),
      approval: approvalMetadata(approval),
      ...mutation.metadata
    },
    occurredAt: approval.approvedAt
  });

  return auditEvent.id;
}

function actionTargetMetadata(
  action: WorkflowRuleDryRunProposedAction
): Record<string, AuditMetadataValue> {
  return {
    kind: action.target.kind,
    fieldPath: action.target.fieldPath ? [...action.target.fieldPath] : null,
    targetValue: action.target.targetValue,
    title: action.target.title,
    message: action.target.message,
    priority: action.target.priority,
    reason: action.target.reason,
    externalDelivery: false
  };
}

function approvalMetadata(
  approval: ParsedWorkflowRuleManualExecutionApproval
): Record<string, AuditMetadataValue> {
  return {
    approved: approval.approved,
    actorUserId: approval.actorUserId,
    approvedAt: approval.approvedAt?.toISOString() ?? null,
    note: approval.note ?? null
  };
}

function executedRecord(
  action: WorkflowRuleDryRunProposedAction,
  record: WorkflowRuleDryRunRecordReference,
  mutation: MutationResult,
  auditEventId: string
): WorkflowRuleManualExecutionRecord {
  return {
    ...copyRecord(record),
    action: action.action,
    executionStatus: mutation.status,
    attempted: true,
    executed: true,
    affectedEntityType: mutation.affectedEntityType,
    affectedRecordId: mutation.affectedRecordId,
    auditEventId,
    message: mutation.message,
    error: null
  };
}

function blockedRecord(
  action: WorkflowRuleDryRunProposedAction,
  record: WorkflowRuleDryRunRecordReference,
  reasons: readonly WorkflowRuleManualExecutionBlockReasonCode[]
): WorkflowRuleManualExecutionRecord {
  return {
    ...copyRecord(record),
    action: action.action,
    executionStatus: "blocked",
    attempted: false,
    executed: false,
    affectedEntityType: null,
    affectedRecordId: null,
    auditEventId: null,
    message: `Workflow action blocked: ${reasons.join(", ")}.`,
    error: null
  };
}

function failedRecord(
  action: WorkflowRuleDryRunProposedAction,
  record: WorkflowRuleDryRunRecordReference,
  error: unknown
): WorkflowRuleManualExecutionRecord {
  return {
    ...copyRecord(record),
    action: action.action,
    executionStatus: "failed",
    attempted: true,
    executed: false,
    affectedEntityType: null,
    affectedRecordId: null,
    auditEventId: null,
    message: "Workflow action execution failed for this record.",
    error:
      error instanceof Error
        ? error.message
        : "Unknown workflow action execution error."
  };
}

function copyRecord(
  record: WorkflowRuleDryRunRecordReference
): WorkflowRuleDryRunRecordReference {
  return {
    id: record.id,
    label: record.label,
    route: record.route,
    matchedConditionKeys: [...record.matchedConditionKeys],
    values: record.values.map((value) => ({
      condition: value.condition,
      fieldPath: [...value.fieldPath],
      value: value.value
    }))
  };
}

function buildResult(
  reviewPacket: WorkflowRuleReviewPacket,
  approval: ParsedWorkflowRuleManualExecutionApproval,
  blockReasons: readonly WorkflowRuleManualExecutionBlockReasonCode[],
  actions: readonly WorkflowRuleManualExecutionAction[]
): WorkflowRuleManualExecutionResult {
  return {
    contentType: WORKFLOW_RULE_MANUAL_EXECUTION_CONTENT_TYPE,
    executionType: "workflow-rule-manual-execution",
    executionVersion: WORKFLOW_RULE_MANUAL_EXECUTION_VERSION,
    generatedAt: reviewPacket.generatedAt,
    status: resultStatus(actions),
    blockReasons,
    approval: {
      approved: approval.approved,
      actorUserId: approval.actorUserId,
      approvedAt: approval.approvedAt?.toISOString() ?? null,
      note: approval.note ?? null
    },
    summary: buildSummary(reviewPacket, approval, actions),
    actions,
    categories: buildCategories(actions),
    reviewPacket,
    source: {
      reviewPacketContentType: WORKFLOW_RULE_REVIEW_PACKET_CONTENT_TYPE,
      reviewPacketVersion: WORKFLOW_RULE_REVIEW_PACKET_VERSION,
      reviewPacketModule: "lib/server/workflowRuleReviewPackets.ts",
      capabilityContentType: WORKFLOW_RULE_EXECUTION_CAPABILITY_CONTENT_TYPE,
      capabilityVersion: WORKFLOW_RULE_EXECUTION_CAPABILITY_VERSION,
      capabilityModule: "lib/server/workflowRuleExecutionCapabilities.ts",
      executorScope: "operator-approved-workflow-manual-execution",
      routeScope: [...reviewPacket.source.routeScope]
    },
    read: readFlags(),
    write: writeFlags(),
    safety: safetyFlags()
  };
}

function buildSummary(
  reviewPacket: WorkflowRuleReviewPacket,
  approval: ParsedWorkflowRuleManualExecutionApproval,
  actions: readonly WorkflowRuleManualExecutionAction[]
): WorkflowRuleManualExecutionSummary {
  const records = actions.flatMap((action) => action.records);
  const executedActionCount = actions.filter(
    (action) => action.status === "executed"
  ).length;
  const blockedActionCount = actions.filter(
    (action) => action.status === "blocked"
  ).length;
  const failedActionCount = actions.filter(
    (action) => action.status === "failed"
  ).length;
  const auditEventCount = records.filter((record) => record.auditEventId).length;

  return {
    entity: reviewPacket.ruleMetadata.entity,
    trigger: reviewPacket.ruleMetadata.trigger,
    matchedRecordCount: reviewPacket.affectedObjects.matchedRecordCount,
    returnedRecordCount: reviewPacket.affectedObjects.returnedRecordCount,
    proposedActionCount: actions.length,
    executedActionCount,
    blockedActionCount,
    failedActionCount,
    attemptedRecordActionCount: records.filter((record) => record.attempted)
      .length,
    executedRecordActionCount: records.filter((record) => record.executed).length,
    blockedRecordActionCount: records.filter(
      (record) => record.executionStatus === "blocked"
    ).length,
    failedRecordActionCount: records.filter(
      (record) => record.executionStatus === "failed"
    ).length,
    auditEventCount,
    operatorApprovalRequired: true,
    operatorApproved: approval.approved,
    didMutate: records.some((record) => record.executed)
  };
}

function buildCategories(
  actions: readonly WorkflowRuleManualExecutionAction[]
): WorkflowRuleManualExecutionCategory[] {
  const categories = new Map<WorkflowRuleActionCategory, MutableCategory>();

  for (const action of actions) {
    const category =
      categories.get(action.category) ?? emptyCategory(action.category);

    category.actionCount += 1;
    category.recordCount += action.recordCount;
    category.executedRecordCount += action.executedCount;
    category.auditEventCount += action.auditEventCount;
    category.actionKeys.push(action.action);

    if (action.status === "executed") {
      category.executedActionCount += 1;
    } else if (action.status === "failed") {
      category.failedActionCount += 1;
    } else {
      category.blockedActionCount += 1;
    }

    categories.set(action.category, category);
  }

  return [...categories.values()].map((category) => ({
    ...category,
    actionKeys: [...category.actionKeys]
  }));
}

function emptyCategory(
  category: WorkflowRuleActionCategory
): MutableCategory {
  return {
    category,
    actionCount: 0,
    executedActionCount: 0,
    blockedActionCount: 0,
    failedActionCount: 0,
    recordCount: 0,
    executedRecordCount: 0,
    auditEventCount: 0,
    actionKeys: []
  };
}

function actionStatus(
  executedCount: number,
  blockedCount: number,
  failedCount: number
): WorkflowRuleManualExecutionActionStatus {
  if (failedCount > 0 && executedCount === 0) {
    return "failed";
  }

  if (executedCount === 0) {
    return "blocked";
  }

  if (blockedCount > 0 || failedCount > 0) {
    return "partial";
  }

  return "executed";
}

function resultStatus(
  actions: readonly WorkflowRuleManualExecutionAction[]
): WorkflowRuleManualExecutionStatus {
  const executedCount = actions.reduce(
    (total, action) => total + action.executedCount,
    0
  );
  const failedCount = actions.reduce(
    (total, action) => total + action.failedCount,
    0
  );
  const blockedCount = actions.reduce(
    (total, action) => total + action.blockedCount,
    0
  );

  if (failedCount > 0 && executedCount === 0) {
    return "failed";
  }

  if (executedCount === 0) {
    return "blocked";
  }

  if (failedCount > 0 || blockedCount > 0) {
    return "partial";
  }

  return "completed";
}

function uniqueReasons(
  reasons: readonly WorkflowRuleManualExecutionBlockReasonCode[]
): WorkflowRuleManualExecutionBlockReasonCode[] {
  return [...new Set(reasons)];
}

function requireActionText(
  value: string | null,
  label: string,
  action: WorkflowRuleDryRunProposedAction
): string {
  if (value === null || value.trim().length === 0) {
    throw new Error(`${label} is required for workflow action '${action.action}'.`);
  }

  return value;
}

function taskDescription(
  entity: WorkflowRuleCatalogEntity,
  action: WorkflowRuleDryRunProposedAction,
  record: WorkflowRuleDryRunRecordReference
): string {
  const reason = action.target.reason ? ` Reason: ${action.target.reason}.` : "";

  return `Workflow manual execution for ${entity} record ${record.label}.${reason} Source: ${record.route}.`;
}

function taskRelation(
  entity: WorkflowRuleCatalogEntity,
  recordId: string
): TaskRelationInput {
  switch (entity) {
    case "accounts":
      return { accountId: recordId };
    case "contacts":
      return { contactId: recordId };
    case "opportunities":
      return { dealId: recordId };
    case "leads":
      return { leadId: recordId };
    case "cases":
    case "tasks":
    case "campaigns":
      return {};
  }
}
