import { z } from "zod";
import {
  ACCOUNT_STATUSES,
  CONTACT_STATUSES,
  DEALER_ORDER_STATUSES,
  DEAL_STAGES,
  LEAD_STATUSES
} from "@/lib/crm-constants";
import {
  CAMPAIGN_STATUSES,
  CASE_STATUSES,
  TASK_STATUSES
} from "@/lib/crm/registry";
import { prisma } from "@/lib/prisma";
import {
  CSV_EXPORT_CONTENT_TYPE,
  CSV_EXPORT_ENTITIES,
  getCsvExportDefinition,
  isCsvExportEntity
} from "@/lib/server/csvExport";
import type { AuditMetadataValue } from "@/lib/services/auditEvents";
import { idSchema } from "@/lib/validation";

export const BULK_ACTION_DRY_RUN_ENTITIES = CSV_EXPORT_ENTITIES;

export const BULK_ACTION_DRY_RUN_ACTIONS = [
  "status_update",
  "stage_update",
  "owner_assignment",
  "task_creation",
  "selected_export"
] as const;

export const BULK_ACTION_DRY_RUN_MAX_RECORDS = 200;

export type BulkActionDryRunEntity =
  (typeof BULK_ACTION_DRY_RUN_ENTITIES)[number];
export type BulkActionDryRunAction =
  (typeof BULK_ACTION_DRY_RUN_ACTIONS)[number];

export type BulkActionDryRunReason =
  | "eligible"
  | "not_found"
  | "duplicate_selection"
  | "unsupported_action_for_entity"
  | "target_required"
  | "invalid_target"
  | "target_not_found"
  | "no_change";

export type BulkActionDryRunRecord = {
  id: string;
  label: string | null;
  eligible: boolean;
  reason: BulkActionDryRunReason;
  message: string;
  currentValue: string | null;
  targetValue: string | null;
};

export type BulkActionDuplicateSelection = {
  id: string;
  occurrences: number;
};

export type BulkActionDryRunAudit = {
  summary: string;
  metadata: AuditMetadataValue;
};

export type BulkActionDryRunResult = {
  entity: BulkActionDryRunEntity;
  action: BulkActionDryRunAction;
  requestedCount: number;
  uniqueRecordCount: number;
  duplicateCount: number;
  missingCount: number;
  eligibleCount: number;
  blockedCount: number;
  wouldMutate: false;
  requiresApproval: false;
  records: readonly BulkActionDryRunRecord[];
  duplicateSelections: readonly BulkActionDuplicateSelection[];
  audit: BulkActionDryRunAudit;
};

type BulkActionRecord = {
  id: string;
  label: string | null;
  status: string | null;
  stage: string | null;
  ownerId: string | null;
};

type ParsedBulkActionDryRunInput = z.infer<typeof bulkActionDryRunInputSchema>;

type EvaluationContext = {
  targetValue: string | null;
  globalBlockReason: Exclude<BulkActionDryRunReason, "eligible" | "not_found"> | null;
  globalBlockMessage: string | null;
  metadata: Record<string, AuditMetadataValue>;
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

const bulkActionDryRunInputSchema = z
  .object({
    entity: z.enum(BULK_ACTION_DRY_RUN_ENTITIES),
    action: z.enum(BULK_ACTION_DRY_RUN_ACTIONS),
    recordIds: z
      .array(idSchema)
      .max(
        BULK_ACTION_DRY_RUN_MAX_RECORDS,
        `Bulk action dry runs support at most ${BULK_ACTION_DRY_RUN_MAX_RECORDS} selected records.`
      )
      .default([]),
    targetStatus: z.string().trim().min(1).optional(),
    targetStage: z.string().trim().min(1).optional(),
    targetOwnerId: idSchema.optional(),
    taskTitle: z.string().trim().min(1).optional(),
    generatedAt: optionalDate
  })
  .strict();

const STATUS_TARGETS: Partial<
  Record<BulkActionDryRunEntity, readonly string[]>
> = {
  accounts: ACCOUNT_STATUSES,
  contacts: CONTACT_STATUSES,
  leads: LEAD_STATUSES,
  "dealer-orders": DEALER_ORDER_STATUSES,
  tasks: TASK_STATUSES,
  cases: CASE_STATUSES,
  campaigns: CAMPAIGN_STATUSES
};

const OWNER_ASSIGNMENT_ENTITIES = new Set<BulkActionDryRunEntity>([
  "accounts",
  "opportunities",
  "tasks",
  "cases",
  "campaigns"
]);

const TASK_CREATION_ENTITIES = new Set<BulkActionDryRunEntity>([
  "accounts",
  "contacts",
  "opportunities",
  "leads"
]);

export async function dryRunBulkAction(
  input: unknown
): Promise<BulkActionDryRunResult> {
  const parsed = bulkActionDryRunInputSchema.parse(input);
  const uniqueRecordIds = uniqueIds(parsed.recordIds);
  const duplicateSelections = findDuplicateSelections(parsed.recordIds);
  const recordsById = await loadBulkActionRecords(parsed.entity, uniqueRecordIds);
  const context = await buildEvaluationContext(parsed);

  const records = uniqueRecordIds.map((id) => {
    const record = recordsById.get(id);

    if (!record) {
      return buildRecordResult({
        id,
        label: null,
        eligible: false,
        reason: "not_found",
        message: "Selected record was not found.",
        currentValue: null,
        targetValue: context.targetValue
      });
    }

    return evaluateRecord(parsed, record, context);
  });

  const missingCount = records.filter((record) => record.reason === "not_found")
    .length;
  const eligibleCount = records.filter((record) => record.eligible).length;
  const duplicateCount = parsed.recordIds.length - uniqueRecordIds.length;
  const blockedCount = records.length - eligibleCount + duplicateCount;

  return {
    entity: parsed.entity,
    action: parsed.action,
    requestedCount: parsed.recordIds.length,
    uniqueRecordCount: uniqueRecordIds.length,
    duplicateCount,
    missingCount,
    eligibleCount,
    blockedCount,
    wouldMutate: false,
    requiresApproval: false,
    records,
    duplicateSelections,
    audit: buildAuditMetadata(parsed, {
      uniqueRecordCount: uniqueRecordIds.length,
      duplicateCount,
      missingCount,
      eligibleCount,
      blockedCount,
      contextMetadata: context.metadata
    })
  };
}

function evaluateRecord(
  input: ParsedBulkActionDryRunInput,
  record: BulkActionRecord,
  context: EvaluationContext
): BulkActionDryRunRecord {
  if (context.globalBlockReason && context.globalBlockMessage) {
    return buildRecordResult({
      id: record.id,
      label: record.label,
      eligible: false,
      reason: context.globalBlockReason,
      message: context.globalBlockMessage,
      currentValue: currentValueForAction(input.action, record),
      targetValue: context.targetValue
    });
  }

  switch (input.action) {
    case "status_update":
      return evaluateValueChange(record, record.status, context.targetValue);
    case "stage_update":
      return evaluateValueChange(record, record.stage, context.targetValue);
    case "owner_assignment":
      return evaluateValueChange(record, record.ownerId, context.targetValue);
    case "task_creation":
      return buildRecordResult({
        id: record.id,
        label: record.label,
        eligible: true,
        reason: "eligible",
        message: "Task creation would be eligible for this record.",
        currentValue: null,
        targetValue: context.targetValue
      });
    case "selected_export":
      return buildRecordResult({
        id: record.id,
        label: record.label,
        eligible: true,
        reason: "eligible",
        message: "Selected record would be eligible for export.",
        currentValue: null,
        targetValue: context.targetValue
      });
  }
}

function evaluateValueChange(
  record: BulkActionRecord,
  currentValue: string | null,
  targetValue: string | null
): BulkActionDryRunRecord {
  if (currentValue === targetValue) {
    return buildRecordResult({
      id: record.id,
      label: record.label,
      eligible: false,
      reason: "no_change",
      message: "Selected record already has the requested value.",
      currentValue,
      targetValue
    });
  }

  return buildRecordResult({
    id: record.id,
    label: record.label,
    eligible: true,
    reason: "eligible",
    message: "Selected record would be eligible for this change.",
    currentValue,
    targetValue
  });
}

function buildRecordResult(
  record: BulkActionDryRunRecord
): BulkActionDryRunRecord {
  return record;
}

async function buildEvaluationContext(
  input: ParsedBulkActionDryRunInput
): Promise<EvaluationContext> {
  switch (input.action) {
    case "status_update":
      return buildStatusContext(input.entity, input.targetStatus);
    case "stage_update":
      return buildStageContext(input.entity, input.targetStage);
    case "owner_assignment":
      return buildOwnerAssignmentContext(input.entity, input.targetOwnerId);
    case "task_creation":
      return buildTaskCreationContext(input.entity, input.taskTitle);
    case "selected_export":
      return buildSelectedExportContext(input.entity);
  }
}

function buildStatusContext(
  entity: BulkActionDryRunEntity,
  targetStatus: string | undefined
): EvaluationContext {
  const allowedStatuses = STATUS_TARGETS[entity];

  if (!allowedStatuses) {
    return blockedContext(
      null,
      "unsupported_action_for_entity",
      "Status updates are not supported for this entity.",
      { supported: false }
    );
  }

  if (!targetStatus) {
    return blockedContext(null, "target_required", "Target status is required.", {
      supported: true,
      allowedValues: [...allowedStatuses]
    });
  }

  if (!includesValue(allowedStatuses, targetStatus)) {
    return blockedContext(
      targetStatus,
      "invalid_target",
      "Target status is not valid for this entity.",
      {
        supported: true,
        allowedValues: [...allowedStatuses]
      }
    );
  }

  return allowedContext(targetStatus, {
    supported: true,
    allowedValues: [...allowedStatuses]
  });
}

function buildStageContext(
  entity: BulkActionDryRunEntity,
  targetStage: string | undefined
): EvaluationContext {
  if (entity !== "opportunities") {
    return blockedContext(
      null,
      "unsupported_action_for_entity",
      "Stage updates are only supported for opportunities.",
      { supported: false }
    );
  }

  if (!targetStage) {
    return blockedContext(null, "target_required", "Target stage is required.", {
      supported: true,
      allowedValues: [...DEAL_STAGES]
    });
  }

  if (!includesValue(DEAL_STAGES, targetStage)) {
    return blockedContext(
      targetStage,
      "invalid_target",
      "Target stage is not valid for opportunities.",
      {
        supported: true,
        allowedValues: [...DEAL_STAGES]
      }
    );
  }

  return allowedContext(targetStage, {
    supported: true,
    allowedValues: [...DEAL_STAGES]
  });
}

async function buildOwnerAssignmentContext(
  entity: BulkActionDryRunEntity,
  targetOwnerId: string | undefined
): Promise<EvaluationContext> {
  if (!OWNER_ASSIGNMENT_ENTITIES.has(entity)) {
    return blockedContext(
      null,
      "unsupported_action_for_entity",
      "Owner assignment is not supported for this entity.",
      { supported: false }
    );
  }

  if (!targetOwnerId) {
    return blockedContext(
      null,
      "target_required",
      "Target owner is required.",
      { supported: true }
    );
  }

  const targetOwner = await prisma.user.findUnique({
    where: { id: targetOwnerId },
    select: { id: true, name: true, email: true }
  });

  if (!targetOwner) {
    return blockedContext(
      targetOwnerId,
      "target_not_found",
      "Target owner was not found.",
      { supported: true }
    );
  }

  return allowedContext(targetOwnerId, {
    supported: true,
    targetOwnerId: targetOwner.id,
    targetOwnerName: targetOwner.name,
    targetOwnerEmail: targetOwner.email
  });
}

function buildTaskCreationContext(
  entity: BulkActionDryRunEntity,
  taskTitle: string | undefined
): EvaluationContext {
  if (!TASK_CREATION_ENTITIES.has(entity)) {
    return blockedContext(
      null,
      "unsupported_action_for_entity",
      "Task creation is not supported for this entity.",
      { supported: false }
    );
  }

  if (!taskTitle) {
    return blockedContext(
      null,
      "target_required",
      "Task title is required.",
      { supported: true }
    );
  }

  return allowedContext(taskTitle, {
    supported: true,
    taskTitle
  });
}

function buildSelectedExportContext(
  entity: BulkActionDryRunEntity
): EvaluationContext {
  if (!isCsvExportEntity(entity)) {
    return blockedContext(
      null,
      "unsupported_action_for_entity",
      "Selected export is not supported for this entity.",
      { supported: false }
    );
  }

  const definition = getCsvExportDefinition(entity);

  return allowedContext(definition.filename, {
    supported: true,
    filename: definition.filename,
    contentType: CSV_EXPORT_CONTENT_TYPE,
    columnCount: definition.columns.length,
    route: definition.route
  });
}

function allowedContext(
  targetValue: string | null,
  metadata: Record<string, AuditMetadataValue>
): EvaluationContext {
  return {
    targetValue,
    globalBlockReason: null,
    globalBlockMessage: null,
    metadata
  };
}

function blockedContext(
  targetValue: string | null,
  reason: Exclude<BulkActionDryRunReason, "eligible" | "not_found">,
  message: string,
  metadata: Record<string, AuditMetadataValue>
): EvaluationContext {
  return {
    targetValue,
    globalBlockReason: reason,
    globalBlockMessage: message,
    metadata
  };
}

function currentValueForAction(
  action: BulkActionDryRunAction,
  record: BulkActionRecord
): string | null {
  switch (action) {
    case "status_update":
      return record.status;
    case "stage_update":
      return record.stage;
    case "owner_assignment":
      return record.ownerId;
    case "task_creation":
    case "selected_export":
      return null;
  }
}

function buildAuditMetadata(
  input: ParsedBulkActionDryRunInput,
  counts: {
    uniqueRecordCount: number;
    duplicateCount: number;
    missingCount: number;
    eligibleCount: number;
    blockedCount: number;
    contextMetadata: Record<string, AuditMetadataValue>;
  }
): BulkActionDryRunAudit {
  const generatedAt = input.generatedAt?.toISOString() ?? null;
  const target = targetForAudit(input);
  const summary = `${input.action} dry run for ${input.entity}: ${counts.eligibleCount} eligible, ${counts.blockedCount} blocked.`;

  return {
    summary,
    metadata: {
      source: "bulk_action_dry_run",
      entity: input.entity,
      action: input.action,
      target,
      generatedAt,
      wouldMutate: false,
      requiresApproval: false,
      requestedCount: input.recordIds.length,
      uniqueRecordCount: counts.uniqueRecordCount,
      duplicateCount: counts.duplicateCount,
      missingCount: counts.missingCount,
      eligibleCount: counts.eligibleCount,
      blockedCount: counts.blockedCount,
      ...counts.contextMetadata
    }
  };
}

function targetForAudit(
  input: ParsedBulkActionDryRunInput
): AuditMetadataValue {
  switch (input.action) {
    case "status_update":
      return input.targetStatus ?? null;
    case "stage_update":
      return input.targetStage ?? null;
    case "owner_assignment":
      return input.targetOwnerId ?? null;
    case "task_creation":
      return input.taskTitle ?? null;
    case "selected_export":
      return input.entity;
  }
}

function uniqueIds(recordIds: readonly string[]): string[] {
  const seen = new Set<string>();
  const output: string[] = [];

  for (const id of recordIds) {
    if (!seen.has(id)) {
      seen.add(id);
      output.push(id);
    }
  }

  return output;
}

function findDuplicateSelections(
  recordIds: readonly string[]
): BulkActionDuplicateSelection[] {
  const counts = new Map<string, number>();

  for (const id of recordIds) {
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }

  return [...counts.entries()]
    .filter(([, occurrences]) => occurrences > 1)
    .map(([id, occurrences]) => ({ id, occurrences }));
}

async function loadBulkActionRecords(
  entity: BulkActionDryRunEntity,
  ids: readonly string[]
): Promise<Map<string, BulkActionRecord>> {
  if (ids.length === 0) {
    return new Map();
  }

  switch (entity) {
    case "accounts":
      return loadAccountRecords(ids);
    case "contacts":
      return loadContactRecords(ids);
    case "opportunities":
      return loadOpportunityRecords(ids);
    case "leads":
      return loadLeadRecords(ids);
    case "activities":
      return loadActivityRecords(ids);
    case "dealer-orders":
      return loadDealerOrderRecords(ids);
    case "areas":
      return loadAreaRecords(ids);
    case "tasks":
      return loadTaskRecords(ids);
    case "cases":
      return loadCaseRecords(ids);
    case "campaigns":
      return loadCampaignRecords(ids);
  }
}

async function loadAccountRecords(
  ids: readonly string[]
): Promise<Map<string, BulkActionRecord>> {
  const records = await prisma.account.findMany({
    where: { id: { in: [...ids] } },
    select: { id: true, name: true, status: true, ownerId: true }
  });

  return toRecordMap(
    records.map((record) => ({
      id: record.id,
      label: record.name,
      status: record.status,
      stage: null,
      ownerId: record.ownerId
    }))
  );
}

async function loadContactRecords(
  ids: readonly string[]
): Promise<Map<string, BulkActionRecord>> {
  const records = await prisma.contact.findMany({
    where: { id: { in: [...ids] } },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      status: true
    }
  });

  return toRecordMap(
    records.map((record) => ({
      id: record.id,
      label: `${record.firstName} ${record.lastName}`,
      status: record.status,
      stage: null,
      ownerId: null
    }))
  );
}

async function loadOpportunityRecords(
  ids: readonly string[]
): Promise<Map<string, BulkActionRecord>> {
  const records = await prisma.deal.findMany({
    where: { id: { in: [...ids] } },
    select: { id: true, name: true, stage: true, ownerId: true }
  });

  return toRecordMap(
    records.map((record) => ({
      id: record.id,
      label: record.name,
      status: null,
      stage: record.stage,
      ownerId: record.ownerId
    }))
  );
}

async function loadLeadRecords(
  ids: readonly string[]
): Promise<Map<string, BulkActionRecord>> {
  const records = await prisma.lead.findMany({
    where: { id: { in: [...ids] } },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      status: true
    }
  });

  return toRecordMap(
    records.map((record) => ({
      id: record.id,
      label: `${record.firstName} ${record.lastName}`,
      status: record.status,
      stage: null,
      ownerId: null
    }))
  );
}

async function loadActivityRecords(
  ids: readonly string[]
): Promise<Map<string, BulkActionRecord>> {
  const records = await prisma.activity.findMany({
    where: { id: { in: [...ids] } },
    select: { id: true, title: true }
  });

  return toRecordMap(
    records.map((record) => ({
      id: record.id,
      label: record.title,
      status: null,
      stage: null,
      ownerId: null
    }))
  );
}

async function loadDealerOrderRecords(
  ids: readonly string[]
): Promise<Map<string, BulkActionRecord>> {
  const records = await prisma.dealerOrder.findMany({
    where: { id: { in: [...ids] } },
    select: { id: true, name: true, status: true }
  });

  return toRecordMap(
    records.map((record) => ({
      id: record.id,
      label: record.name,
      status: record.status,
      stage: null,
      ownerId: null
    }))
  );
}

async function loadAreaRecords(
  ids: readonly string[]
): Promise<Map<string, BulkActionRecord>> {
  const records = await prisma.area.findMany({
    where: { id: { in: [...ids] } },
    select: { id: true, name: true }
  });

  return toRecordMap(
    records.map((record) => ({
      id: record.id,
      label: record.name,
      status: null,
      stage: null,
      ownerId: null
    }))
  );
}

async function loadTaskRecords(
  ids: readonly string[]
): Promise<Map<string, BulkActionRecord>> {
  const records = await prisma.task.findMany({
    where: { id: { in: [...ids] } },
    select: { id: true, title: true, status: true, ownerId: true }
  });

  return toRecordMap(
    records.map((record) => ({
      id: record.id,
      label: record.title,
      status: record.status,
      stage: null,
      ownerId: record.ownerId
    }))
  );
}

async function loadCaseRecords(
  ids: readonly string[]
): Promise<Map<string, BulkActionRecord>> {
  const records = await prisma.case.findMany({
    where: { id: { in: [...ids] } },
    select: { id: true, subject: true, status: true, ownerId: true }
  });

  return toRecordMap(
    records.map((record) => ({
      id: record.id,
      label: record.subject,
      status: record.status,
      stage: null,
      ownerId: record.ownerId
    }))
  );
}

async function loadCampaignRecords(
  ids: readonly string[]
): Promise<Map<string, BulkActionRecord>> {
  const records = await prisma.campaign.findMany({
    where: { id: { in: [...ids] } },
    select: { id: true, name: true, status: true, ownerId: true }
  });

  return toRecordMap(
    records.map((record) => ({
      id: record.id,
      label: record.name,
      status: record.status,
      stage: null,
      ownerId: record.ownerId
    }))
  );
}

function toRecordMap(
  records: readonly BulkActionRecord[]
): Map<string, BulkActionRecord> {
  return new Map(records.map((record) => [record.id, record]));
}

function includesValue(
  values: readonly string[],
  value: string
): boolean {
  return values.includes(value);
}
