import { z } from "zod/v4";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

import {
  BULK_ACTION_DRY_RUN_ENTITIES,
  BULK_ACTION_DRY_RUN_MAX_RECORDS,
  dryRunBulkAction,
  type BulkActionDryRunRecord,
  type BulkActionDryRunResult
} from "@/lib/server/bulkActionDryRun";
import {
  buildAuditEventCreateData,
  type AuditEntityType,
  type AuditMetadataValue
} from "@/lib/services/auditEvents";
import {
  accountStatusSchema,
  campaignStatusSchema,
  caseStatusSchema,
  contactStatusSchema,
  dealStageSchema,
  idSchema,
  leadStatusSchema,
  taskStatusSchema
} from "@/lib/validation";

export const BULK_ACTION_EXECUTION_ENTITIES = BULK_ACTION_DRY_RUN_ENTITIES;

export const BULK_ACTION_EXECUTION_ACTIONS = [
  "status_update",
  "stage_update",
  "owner_assignment",
  "task_creation",
  "delete"
] as const;

export type BulkActionExecutionEntity =
  (typeof BULK_ACTION_EXECUTION_ENTITIES)[number];
export type BulkActionExecutionAction =
  (typeof BULK_ACTION_EXECUTION_ACTIONS)[number];

export type BulkActionExecutionStatus =
  | "empty"
  | "completed"
  | "partial"
  | "blocked"
  | "failed";

export type BulkActionExecutionRecordStatus =
  | "executed"
  | "created"
  | "skipped"
  | "blocked"
  | "failed";

export type BulkActionExecutionWriteFlags = {
  database: true;
  mutations: true;
  auditEvents: true;
  approvals: false;
  files: false;
  externalServices: false;
  backgroundJobs: false;
};

export type BulkActionExecutionDefinition = {
  mode: "bulk_action_execution";
  entity: BulkActionExecutionEntity;
  supportedActions: readonly BulkActionExecutionAction[];
  maxSelectedRecords: typeof BULK_ACTION_DRY_RUN_MAX_RECORDS;
  write: BulkActionExecutionWriteFlags;
};

export type BulkActionExecutionRecord = BulkActionDryRunRecord & {
  executionStatus: BulkActionExecutionRecordStatus;
  attempted: boolean;
  executed: boolean;
  affectedEntityType: AuditEntityType | null;
  affectedRecordId: string | null;
  auditEventId: string | null;
  message: string;
  error: string | null;
};

export type BulkActionExecutionRollup = {
  status: BulkActionExecutionStatus;
  requestedCount: number;
  uniqueRecordCount: number;
  duplicateCount: number;
  missingCount: number;
  eligibleCount: number;
  executedCount: number;
  skippedCount: number;
  blockedCount: number;
  failedCount: number;
  auditEventCount: number;
  wouldMutate: boolean;
  requiresApproval: false;
};

export type BulkActionExecutionResult = {
  mode: "bulk_action_execution";
  entity: BulkActionExecutionEntity;
  action: BulkActionExecutionAction;
  supported: boolean;
  dryRun: BulkActionDryRunResult;
  records: readonly BulkActionExecutionRecord[];
  rollup: BulkActionExecutionRollup;
  write: BulkActionExecutionWriteFlags;
};

type ParsedBulkActionExecutionInput = z.infer<
  typeof bulkActionExecutionInputSchema
>;

type MutationResult = {
  affectedEntityType: AuditEntityType;
  affectedRecordId: string;
  summary: string;
  metadata: Record<string, AuditMetadataValue>;
};

const STATUS_EXECUTION_ENTITIES = new Set<BulkActionExecutionEntity>([
  "accounts",
  "contacts",
  "leads",
  "tasks",
  "cases",
  "campaigns"
]);

const OWNER_ASSIGNMENT_ENTITIES = new Set<BulkActionExecutionEntity>([
  "accounts",
  "opportunities",
  "tasks",
  "cases",
  "campaigns"
]);

const TASK_CREATION_ENTITIES = new Set<BulkActionExecutionEntity>([
  "accounts",
  "contacts",
  "opportunities",
  "leads"
]);

const ENTITY_AUDIT_TYPES: Record<BulkActionExecutionEntity, AuditEntityType> = {
  accounts: "account",
  contacts: "contact",
  opportunities: "opportunity",
  leads: "lead",
  activities: "activity",
  "dealer-orders": "dealer_order",
  areas: "area",
  tasks: "task",
  cases: "case",
  campaigns: "campaign"
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

const bulkActionExecutionInputSchema = z
  .object({
    entity: z.enum(BULK_ACTION_EXECUTION_ENTITIES),
    action: z.enum(BULK_ACTION_EXECUTION_ACTIONS),
    recordIds: z
      .array(idSchema)
      .max(
        BULK_ACTION_DRY_RUN_MAX_RECORDS,
        `Bulk action execution supports at most ${BULK_ACTION_DRY_RUN_MAX_RECORDS} selected records.`
      )
      .default([]),
    targetStatus: z.string().trim().min(1).optional(),
    targetStage: z.string().trim().min(1).optional(),
    targetOwnerId: idSchema.optional(),
    taskTitle: z.string().trim().min(1).optional(),
    generatedAt: optionalDate
  })
  .strict();

function writeFlags(): BulkActionExecutionWriteFlags {
  return {
    database: true,
    mutations: true,
    auditEvents: true,
    approvals: false,
    files: false,
    externalServices: false,
    backgroundJobs: false
  };
}

function executionUnsupportedMessage(
  entity: BulkActionExecutionEntity,
  action: BulkActionExecutionAction
): string {
  return `Bulk execution does not support ${action} for ${entity}.`;
}

function isExecutionSupported(
  entity: BulkActionExecutionEntity,
  action: BulkActionExecutionAction
): boolean {
  switch (action) {
    case "status_update":
      return STATUS_EXECUTION_ENTITIES.has(entity);
    case "stage_update":
      return entity === "opportunities";
    case "owner_assignment":
      return OWNER_ASSIGNMENT_ENTITIES.has(entity);
    case "task_creation":
      return TASK_CREATION_ENTITIES.has(entity);
    case "delete":
      return entity === "leads" || entity === "opportunities";
  }
}

function supportedActionsForEntity(
  entity: BulkActionExecutionEntity
): BulkActionExecutionAction[] {
  return BULK_ACTION_EXECUTION_ACTIONS.filter((action) =>
    isExecutionSupported(entity, action)
  );
}

function dryRunInput(input: ParsedBulkActionExecutionInput) {
  return {
    entity: input.entity,
    action: input.action,
    recordIds: input.recordIds,
    targetStatus: input.targetStatus,
    targetStage: input.targetStage,
    targetOwnerId: input.targetOwnerId,
    taskTitle: input.taskTitle,
    generatedAt: input.generatedAt
  };
}

function requireTarget(value: string | undefined, label: string): string {
  if (!value) {
    throw new Error(`${label} is required for bulk action execution.`);
  }

  return value;
}

function updateSummary(
  action: BulkActionExecutionAction,
  record: BulkActionDryRunRecord,
  affectedType: AuditEntityType
): string {
  return `Bulk ${action} executed for ${affectedType} ${
    record.label ?? record.id
  }.`;
}

async function executeStatusUpdate(
  tx: Prisma.TransactionClient,
  input: ParsedBulkActionExecutionInput,
  record: BulkActionDryRunRecord
): Promise<MutationResult> {
  const status = requireTarget(input.targetStatus, "Target status");

  switch (input.entity) {
    case "accounts":
      await tx.account.update({
        where: { id: record.id },
        data: { status: accountStatusSchema.parse(status) }
      });
      break;
    case "contacts":
      await tx.contact.update({
        where: { id: record.id },
        data: { status: contactStatusSchema.parse(status) }
      });
      break;
    case "leads":
      await tx.lead.update({
        where: { id: record.id },
        data: { status: leadStatusSchema.parse(status) }
      });
      break;
    case "tasks":
      await tx.task.update({
        where: { id: record.id },
        data: { status: taskStatusSchema.parse(status) }
      });
      break;
    case "cases":
      await tx.case.update({
        where: { id: record.id },
        data: { status: caseStatusSchema.parse(status) }
      });
      break;
    case "campaigns":
      await tx.campaign.update({
        where: { id: record.id },
        data: { status: campaignStatusSchema.parse(status) }
      });
      break;
    case "opportunities":
    case "activities":
    case "dealer-orders":
    case "areas":
      throw new Error(executionUnsupportedMessage(input.entity, input.action));
  }

  const affectedType = ENTITY_AUDIT_TYPES[input.entity];

  return {
    affectedEntityType: affectedType,
    affectedRecordId: record.id,
    summary: updateSummary(input.action, record, affectedType),
    metadata: {
      previousValue: record.currentValue,
      targetValue: status
    }
  };
}

async function executeStageUpdate(
  tx: Prisma.TransactionClient,
  input: ParsedBulkActionExecutionInput,
  record: BulkActionDryRunRecord
): Promise<MutationResult> {
  const stage = dealStageSchema.parse(
    requireTarget(input.targetStage, "Target stage")
  );

  if (input.entity !== "opportunities") {
    throw new Error(executionUnsupportedMessage(input.entity, input.action));
  }

  const existing = await tx.deal.findUnique({
    where: { id: record.id },
    select: { stage: true, ownerId: true }
  });

  await tx.deal.update({
    where: { id: record.id },
    data: { stage }
  });

  if (existing && existing.stage !== stage) {
    await tx.opportunityStageHistory.create({
      data: {
        dealId: record.id,
        fromStage: existing.stage,
        toStage: stage,
        changedByUserId: existing.ownerId ?? "system"
      }
    });
  }

  return {
    affectedEntityType: "opportunity",
    affectedRecordId: record.id,
    summary: updateSummary(input.action, record, "opportunity"),
    metadata: {
      previousValue: record.currentValue,
      targetValue: stage
    }
  };
}

async function executeOwnerAssignment(
  tx: Prisma.TransactionClient,
  input: ParsedBulkActionExecutionInput,
  record: BulkActionDryRunRecord
): Promise<MutationResult> {
  const ownerId = requireTarget(input.targetOwnerId, "Target owner");

  switch (input.entity) {
    case "accounts":
      await tx.account.update({ where: { id: record.id }, data: { ownerId } });
      break;
    case "opportunities":
      await tx.deal.update({ where: { id: record.id }, data: { ownerId } });
      break;
    case "tasks":
      await tx.task.update({ where: { id: record.id }, data: { ownerId } });
      break;
    case "cases":
      await tx.case.update({ where: { id: record.id }, data: { ownerId } });
      break;
    case "campaigns":
      await tx.campaign.update({ where: { id: record.id }, data: { ownerId } });
      break;
    case "contacts":
    case "leads":
    case "activities":
    case "dealer-orders":
    case "areas":
      throw new Error(executionUnsupportedMessage(input.entity, input.action));
  }

  const affectedType = ENTITY_AUDIT_TYPES[input.entity];

  return {
    affectedEntityType: affectedType,
    affectedRecordId: record.id,
    summary: updateSummary(input.action, record, affectedType),
    metadata: {
      previousValue: record.currentValue,
      targetValue: ownerId
    }
  };
}

async function executeTaskCreation(
  tx: Prisma.TransactionClient,
  input: ParsedBulkActionExecutionInput,
  record: BulkActionDryRunRecord
): Promise<MutationResult> {
  const title = requireTarget(input.taskTitle, "Task title");

  const taskInput = {
    title,
    ...taskRelation(input.entity, record.id)
  };
  const createdTask = await tx.task.create({
    data: taskInput
  });

  await tx.auditEvent.create({
    data: buildAuditEventCreateData({
      category: "record",
      action: "created",
      entityType: "task",
      entityId: createdTask.id,
      summary: `Task created: ${createdTask.title}.`,
      metadata: {
        accountId: createdTask.accountId,
        contactId: createdTask.contactId,
        dealId: createdTask.dealId,
        dueDate: createdTask.dueDate ? createdTask.dueDate.toISOString() : null,
        leadId: createdTask.leadId,
        ownerId: createdTask.ownerId,
        priority: createdTask.priority,
        status: createdTask.status,
        title: createdTask.title
      }
    })
  });

  return {
    affectedEntityType: "task",
    affectedRecordId: createdTask.id,
    summary: `Bulk task_creation created task ${createdTask.title} for ${
      record.label ?? record.id
    }.`,
    metadata: {
      linkedEntity: input.entity,
      linkedRecordId: record.id,
      createdTaskId: createdTask.id,
      taskTitle: createdTask.title
    }
  };
}

function taskRelation(entity: BulkActionExecutionEntity, recordId: string) {
  switch (entity) {
    case "accounts":
      return { accountId: recordId };
    case "contacts":
      return { contactId: recordId };
    case "opportunities":
      return { dealId: recordId };
    case "leads":
      return { leadId: recordId };
    case "activities":
    case "dealer-orders":
    case "areas":
    case "tasks":
    case "cases":
    case "campaigns":
      throw new Error(executionUnsupportedMessage(entity, "task_creation"));
  }
}

async function executeDelete(
  tx: Prisma.TransactionClient,
  input: ParsedBulkActionExecutionInput,
  record: BulkActionDryRunRecord
): Promise<MutationResult> {
  if (input.entity !== "leads" && input.entity !== "opportunities") {
    throw new Error(executionUnsupportedMessage(input.entity, input.action));
  }

  if (input.entity === "leads") {
    await tx.lead.delete({ where: { id: record.id } });
  } else {
    await tx.deal.delete({ where: { id: record.id } });
  }

  const affectedType = ENTITY_AUDIT_TYPES[input.entity];

  return {
    affectedEntityType: affectedType,
    affectedRecordId: record.id,
    summary: `Bulk delete executed for ${affectedType} ${record.label ?? record.id}.`,
    metadata: {
      deleted: true
    }
  };
}

async function executeRecordMutation(
  tx: Prisma.TransactionClient,
  input: ParsedBulkActionExecutionInput,
  record: BulkActionDryRunRecord
): Promise<MutationResult> {
  switch (input.action) {
    case "status_update":
      return executeStatusUpdate(tx, input, record);
    case "stage_update":
      return executeStageUpdate(tx, input, record);
    case "owner_assignment":
      return executeOwnerAssignment(tx, input, record);
    case "task_creation":
      return executeTaskCreation(tx, input, record);
    case "delete":
      return executeDelete(tx, input, record);
  }
}

function auditActionFor(action: BulkActionExecutionAction) {
  switch (action) {
    case "status_update":
      return "status_changed";
    case "stage_update":
      return "stage_changed";
    case "owner_assignment":
      return "updated";
    case "task_creation":
      return "created";
    case "delete":
      return "deleted";
  }
}

function dryRunAuditMetadata(
  dryRun: BulkActionDryRunResult
): Record<string, AuditMetadataValue> {
  return {
    requestedCount: dryRun.requestedCount,
    uniqueRecordCount: dryRun.uniqueRecordCount,
    duplicateCount: dryRun.duplicateCount,
    missingCount: dryRun.missingCount,
    eligibleCount: dryRun.eligibleCount,
    blockedCount: dryRun.blockedCount
  };
}

async function recordExecutionAuditEvent(
  tx: Prisma.TransactionClient,
  input: ParsedBulkActionExecutionInput,
  dryRun: BulkActionDryRunResult,
  record: BulkActionDryRunRecord,
  mutation: MutationResult
): Promise<string> {
  const auditEvent = await tx.auditEvent.create({
    data: buildAuditEventCreateData({
      category: "record",
      action: auditActionFor(input.action),
      entityType: mutation.affectedEntityType,
      entityId: mutation.affectedRecordId,
      summary: mutation.summary,
      metadata: {
        source: "bulk_action_execution",
        entity: input.entity,
        action: input.action,
        selectedRecordId: record.id,
        selectedRecordLabel: record.label,
        currentValue: record.currentValue,
        targetValue: record.targetValue,
        generatedAt: input.generatedAt?.toISOString() ?? null,
        dryRun: dryRunAuditMetadata(dryRun),
        ...mutation.metadata
      },
      occurredAt: input.generatedAt
    })
  });

  return auditEvent.id;
}

function skippedRecord(
  record: BulkActionDryRunRecord
): BulkActionExecutionRecord {
  return {
    ...record,
    executionStatus: "skipped",
    attempted: false,
    executed: false,
    affectedEntityType: null,
    affectedRecordId: null,
    auditEventId: null,
    message: record.message,
    error: null
  };
}

function blockedRecord(
  record: BulkActionDryRunRecord,
  message: string
): BulkActionExecutionRecord {
  return {
    ...record,
    eligible: false,
    executionStatus: "blocked",
    attempted: false,
    executed: false,
    affectedEntityType: null,
    affectedRecordId: null,
    auditEventId: null,
    message,
    error: null
  };
}

function executedRecord(
  record: BulkActionDryRunRecord,
  mutation: MutationResult,
  auditEventId: string,
  status: Extract<BulkActionExecutionRecordStatus, "executed" | "created">
): BulkActionExecutionRecord {
  return {
    ...record,
    executionStatus: status,
    attempted: true,
    executed: true,
    affectedEntityType: mutation.affectedEntityType,
    affectedRecordId: mutation.affectedRecordId,
    auditEventId,
    message: mutation.summary,
    error: null
  };
}

function failedRecord(
  record: BulkActionDryRunRecord,
  error: unknown
): BulkActionExecutionRecord {
  return {
    ...record,
    executionStatus: "failed",
    attempted: true,
    executed: false,
    affectedEntityType: null,
    affectedRecordId: null,
    auditEventId: null,
    message: "Bulk action execution failed for this record.",
    error:
      error instanceof Error
        ? error.message
        : "Unknown bulk action execution error."
  };
}

function buildRollup(
  dryRun: BulkActionDryRunResult,
  records: readonly BulkActionExecutionRecord[]
): BulkActionExecutionRollup {
  const executedCount = records.filter((record) => record.executed).length;
  const failedCount = records.filter(
    (record) => record.executionStatus === "failed"
  ).length;
  const unsupportedCount = records.filter(
    (record) => record.executionStatus === "blocked"
  ).length;
  const skippedUniqueCount = records.filter((record) =>
    ["skipped", "blocked"].includes(record.executionStatus)
  ).length;
  const auditEventCount = records.filter((record) => record.auditEventId).length;
  const blockedCount = dryRun.blockedCount + unsupportedCount + failedCount;
  const skippedCount = skippedUniqueCount + dryRun.duplicateCount;

  return {
    status: executionStatus({
      requestedCount: dryRun.requestedCount,
      executedCount,
      blockedCount,
      failedCount
    }),
    requestedCount: dryRun.requestedCount,
    uniqueRecordCount: dryRun.uniqueRecordCount,
    duplicateCount: dryRun.duplicateCount,
    missingCount: dryRun.missingCount,
    eligibleCount: dryRun.eligibleCount,
    executedCount,
    skippedCount,
    blockedCount,
    failedCount,
    auditEventCount,
    wouldMutate: executedCount > 0,
    requiresApproval: false
  };
}

function executionStatus(input: {
  requestedCount: number;
  executedCount: number;
  blockedCount: number;
  failedCount: number;
}): BulkActionExecutionStatus {
  if (input.requestedCount === 0) {
    return "empty";
  }

  if (input.failedCount > 0 && input.executedCount === 0) {
    return "failed";
  }

  if (input.executedCount === 0) {
    return "blocked";
  }

  if (input.failedCount > 0 || input.blockedCount > 0) {
    return "partial";
  }

  return "completed";
}

export function isBulkActionExecutionEntity(
  value: string
): value is BulkActionExecutionEntity {
  return (BULK_ACTION_EXECUTION_ENTITIES as readonly string[]).includes(value);
}

export function isBulkActionExecutionAction(
  value: string
): value is BulkActionExecutionAction {
  return (BULK_ACTION_EXECUTION_ACTIONS as readonly string[]).includes(value);
}

export function getBulkActionExecutionDefinition(
  entity: BulkActionExecutionEntity
): BulkActionExecutionDefinition {
  return {
    mode: "bulk_action_execution",
    entity,
    supportedActions: supportedActionsForEntity(entity),
    maxSelectedRecords: BULK_ACTION_DRY_RUN_MAX_RECORDS,
    write: writeFlags()
  };
}

export function listBulkActionExecutionDefinitions(): BulkActionExecutionDefinition[] {
  return BULK_ACTION_EXECUTION_ENTITIES.map((entity) =>
    getBulkActionExecutionDefinition(entity)
  );
}

export async function executeBulkAction(
  input: unknown
): Promise<BulkActionExecutionResult> {
  const parsed = bulkActionExecutionInputSchema.parse(input);
  const dryRun = await dryRunBulkAction(dryRunInput(parsed));
  const supported = isExecutionSupported(parsed.entity, parsed.action);
  const unsupportedMessage = executionUnsupportedMessage(
    parsed.entity,
    parsed.action
  );
  const records: BulkActionExecutionRecord[] = [];

  try {
    return await prisma.$transaction(async (tx) => {
      for (const record of dryRun.records) {
        if (!record.eligible) {
          records.push(skippedRecord(record));
          continue;
        }

        if (!supported) {
          records.push(blockedRecord(record, unsupportedMessage));
          continue;
        }

        const mutation = await executeRecordMutation(tx, parsed, record);
        const auditEventId = await recordExecutionAuditEvent(
          tx,
          parsed,
          dryRun,
          record,
          mutation
        );
        records.push(
          executedRecord(
            record,
            mutation,
            auditEventId,
            parsed.action === "task_creation" ? "created" : "executed"
          )
        );
      }

      return {
        mode: "bulk_action_execution",
        entity: parsed.entity,
        action: parsed.action,
        supported,
        dryRun,
        records,
        rollup: buildRollup(dryRun, records),
        write: writeFlags()
      };
    });
  } catch (error) {
    const failedRecords = dryRun.records.map((record) => {
      if (record.eligible) {
        return failedRecord(record, error);
      }
      return skippedRecord(record);
    });

    return {
      mode: "bulk_action_execution",
      entity: parsed.entity,
      action: parsed.action,
      supported,
      dryRun,
      records: failedRecords,
      rollup: buildRollup(dryRun, failedRecords),
      write: writeFlags()
    };
  }
}
