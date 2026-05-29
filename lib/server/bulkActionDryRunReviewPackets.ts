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
import {
  BULK_ACTION_DRY_RUN_ACTIONS,
  BULK_ACTION_DRY_RUN_ENTITIES,
  BULK_ACTION_DRY_RUN_MAX_RECORDS,
  dryRunBulkAction,
  type BulkActionDryRunAction,
  type BulkActionDryRunEntity,
  type BulkActionDryRunReason,
  type BulkActionDryRunRecord,
  type BulkActionDryRunResult
} from "@/lib/server/bulkActionDryRun";
import { getCsvExportDefinition } from "@/lib/server/csvExport";
import type { AuditMetadataValue } from "@/lib/services/auditEvents";

export const BULK_ACTION_DRY_RUN_REVIEW_PACKET_ENTITIES =
  BULK_ACTION_DRY_RUN_ENTITIES;

export const BULK_ACTION_DRY_RUN_REVIEW_PACKET_ACTIONS =
  BULK_ACTION_DRY_RUN_ACTIONS;

export const BULK_ACTION_DRY_RUN_REVIEW_REASON_ORDER = [
  "eligible",
  "no_change",
  "not_found",
  "duplicate_selection",
  "unsupported_action_for_entity",
  "target_required",
  "invalid_target",
  "target_not_found"
] as const satisfies readonly BulkActionDryRunReason[];

export const BULK_ACTION_DRY_RUN_REVIEW_SAMPLE_LIMIT = 3;

export type BulkActionDryRunReviewPacketEntity = BulkActionDryRunEntity;
export type BulkActionDryRunReviewPacketAction = BulkActionDryRunAction;
export type BulkActionDryRunReviewPacketStatus =
  | "empty"
  | "ready"
  | "partial"
  | "blocked";

export type BulkActionDryRunReviewWriteFlags = {
  database: false;
  mutations: false;
  approvals: false;
  auditEvents: false;
  files: false;
  externalServices: false;
  backgroundJobs: false;
};

export type BulkActionDryRunReviewTargetMetadata = {
  field: "targetStatus" | "targetStage" | "targetOwnerId" | "taskTitle" | null;
  required: boolean;
  valueSource:
    | "status_constants"
    | "opportunity_stage_constants"
    | "user_record"
    | "operator_text"
    | "csv_export_definition"
    | "none"
    | "unsupported";
  allowedValues: readonly string[] | null;
};

export type BulkActionDryRunReviewActionMetadata = {
  action: BulkActionDryRunReviewPacketAction;
  label: string;
  supported: boolean;
  target: BulkActionDryRunReviewTargetMetadata;
  previewOnly: true;
  wouldMutate: false;
  requiresApproval: false;
};

export type BulkActionDryRunReviewEntityMetadata = {
  entity: BulkActionDryRunReviewPacketEntity;
  label: string;
  route: string;
  exportFilename: string;
  maxSelectedRecords: typeof BULK_ACTION_DRY_RUN_MAX_RECORDS;
};

export type BulkActionDryRunReviewPacketDefinition = {
  packetType: "bulk-action-dry-run-review-packet";
  entityMetadata: BulkActionDryRunReviewEntityMetadata;
  actions: readonly BulkActionDryRunReviewActionMetadata[];
  write: BulkActionDryRunReviewWriteFlags;
};

export type BulkActionDryRunReviewRollup = {
  status: BulkActionDryRunReviewPacketStatus;
  requestedCount: number;
  uniqueRecordCount: number;
  duplicateCount: number;
  missingCount: number;
  eligibleCount: number;
  blockedCount: number;
  wouldMutate: false;
  requiresApproval: false;
};

export type BulkActionDryRunReviewRepresentativeRecord = {
  id: string;
  label: string | null;
  message: string;
  currentValue: string | null;
  targetValue: string | null;
  occurrences: number | null;
};

export type BulkActionDryRunReviewReasonSummary = {
  reason: BulkActionDryRunReason;
  count: number;
  eligible: boolean;
  message: string;
  representativeRecords: readonly BulkActionDryRunReviewRepresentativeRecord[];
};

export type BulkActionDryRunReviewAuditPlan = {
  source: "bulk_action_dry_run";
  packetSource: "bulk_action_dry_run_review_packet";
  summary: string;
  metadata: AuditMetadataValue;
  wouldMutate: false;
  requiresApproval: false;
  wouldRecordAuditEvent: false;
  write: BulkActionDryRunReviewWriteFlags;
};

export type BulkActionDryRunReviewPacket =
  BulkActionDryRunReviewPacketDefinition & {
    mode: "dry_run_review";
    actionMetadata: BulkActionDryRunReviewActionMetadata;
    dryRun: BulkActionDryRunResult;
    rollup: BulkActionDryRunReviewRollup;
    reasons: readonly BulkActionDryRunReviewReasonSummary[];
    auditPlan: BulkActionDryRunReviewAuditPlan;
  };

const STATUS_TARGETS: Partial<
  Record<BulkActionDryRunReviewPacketEntity, readonly string[]>
> = {
  accounts: ACCOUNT_STATUSES,
  contacts: CONTACT_STATUSES,
  leads: LEAD_STATUSES,
  "dealer-orders": DEALER_ORDER_STATUSES,
  tasks: TASK_STATUSES,
  cases: CASE_STATUSES,
  campaigns: CAMPAIGN_STATUSES
};

const OWNER_ASSIGNMENT_ENTITIES = new Set<BulkActionDryRunReviewPacketEntity>([
  "accounts",
  "opportunities",
  "tasks",
  "cases",
  "campaigns"
]);

const TASK_CREATION_ENTITIES = new Set<BulkActionDryRunReviewPacketEntity>([
  "accounts",
  "contacts",
  "opportunities",
  "leads"
]);

function noWrites(): BulkActionDryRunReviewWriteFlags {
  return {
    database: false,
    mutations: false,
    approvals: false,
    auditEvents: false,
    files: false,
    externalServices: false,
    backgroundJobs: false
  };
}

function actionLabel(action: BulkActionDryRunReviewPacketAction): string {
  switch (action) {
    case "status_update":
      return "Status update";
    case "stage_update":
      return "Stage update";
    case "owner_assignment":
      return "Owner assignment";
    case "task_creation":
      return "Task creation";
    case "selected_export":
      return "Selected export";
    case "delete":
      return "Delete";
  }
}

function isActionSupported(
  entity: BulkActionDryRunReviewPacketEntity,
  action: BulkActionDryRunReviewPacketAction
): boolean {
  switch (action) {
    case "status_update":
      return STATUS_TARGETS[entity] !== undefined;
    case "stage_update":
      return entity === "opportunities";
    case "owner_assignment":
      return OWNER_ASSIGNMENT_ENTITIES.has(entity);
    case "task_creation":
      return TASK_CREATION_ENTITIES.has(entity);
    case "selected_export":
      return true;
    case "delete":
      return entity === "leads" || entity === "opportunities";
  }
}

function targetMetadataForAction(
  entity: BulkActionDryRunReviewPacketEntity,
  action: BulkActionDryRunReviewPacketAction
): BulkActionDryRunReviewTargetMetadata {
  switch (action) {
    case "status_update": {
      const allowedValues = STATUS_TARGETS[entity] ?? null;
      return {
        field: "targetStatus",
        required: true,
        valueSource: allowedValues ? "status_constants" : "unsupported",
        allowedValues: allowedValues ? [...allowedValues] : null
      };
    }
    case "stage_update":
      return {
        field: "targetStage",
        required: true,
        valueSource:
          entity === "opportunities" ? "opportunity_stage_constants" : "unsupported",
        allowedValues: entity === "opportunities" ? [...DEAL_STAGES] : null
      };
    case "owner_assignment":
      return {
        field: "targetOwnerId",
        required: true,
        valueSource: OWNER_ASSIGNMENT_ENTITIES.has(entity)
          ? "user_record"
          : "unsupported",
        allowedValues: null
      };
    case "task_creation":
      return {
        field: "taskTitle",
        required: true,
        valueSource: TASK_CREATION_ENTITIES.has(entity)
          ? "operator_text"
          : "unsupported",
        allowedValues: null
      };
    case "selected_export":
      return {
        field: null,
        required: false,
        valueSource: "csv_export_definition",
        allowedValues: null
      };
    case "delete":
      return {
        field: null,
        required: false,
        valueSource:
          entity === "leads" || entity === "opportunities"
            ? "none"
            : "unsupported",
        allowedValues: null
      };
  }
}

function buildActionMetadata(
  entity: BulkActionDryRunReviewPacketEntity,
  action: BulkActionDryRunReviewPacketAction
): BulkActionDryRunReviewActionMetadata {
  return {
    action,
    label: actionLabel(action),
    supported: isActionSupported(entity, action),
    target: targetMetadataForAction(entity, action),
    previewOnly: true,
    wouldMutate: false,
    requiresApproval: false
  };
}

function buildEntityMetadata(
  entity: BulkActionDryRunReviewPacketEntity
): BulkActionDryRunReviewEntityMetadata {
  const definition = getCsvExportDefinition(entity);

  return {
    entity,
    label: definition.label,
    route: definition.route,
    exportFilename: definition.filename,
    maxSelectedRecords: BULK_ACTION_DRY_RUN_MAX_RECORDS
  };
}

function buildPacketStatus(
  result: BulkActionDryRunResult
): BulkActionDryRunReviewPacketStatus {
  if (result.requestedCount === 0) {
    return "empty";
  }

  if (result.blockedCount === 0) {
    return "ready";
  }

  if (result.eligibleCount > 0) {
    return "partial";
  }

  return "blocked";
}

function buildRollup(result: BulkActionDryRunResult): BulkActionDryRunReviewRollup {
  return {
    status: buildPacketStatus(result),
    requestedCount: result.requestedCount,
    uniqueRecordCount: result.uniqueRecordCount,
    duplicateCount: result.duplicateCount,
    missingCount: result.missingCount,
    eligibleCount: result.eligibleCount,
    blockedCount: result.blockedCount,
    wouldMutate: result.wouldMutate,
    requiresApproval: result.requiresApproval
  };
}

function toRepresentativeRecord(
  record: BulkActionDryRunRecord,
  occurrences: number | null = null,
  message: string = record.message
): BulkActionDryRunReviewRepresentativeRecord {
  return {
    id: record.id,
    label: record.label,
    message,
    currentValue: record.currentValue,
    targetValue: record.targetValue,
    occurrences
  };
}

function pluralizeSelection(count: number): string {
  return count === 1 ? "selection" : "selections";
}

function duplicateMessage(count: number): string {
  return `${count} duplicate ${pluralizeSelection(
    count
  )} ignored after the first occurrence.`;
}

function defaultReasonMessage(
  reason: BulkActionDryRunReason,
  count: number
): string {
  switch (reason) {
    case "eligible":
      return "Selected records would be eligible.";
    case "not_found":
      return "Selected records were not found.";
    case "duplicate_selection":
      return duplicateMessage(count);
    case "unsupported_action_for_entity":
      return "Selected records are blocked because the action is not supported for this entity.";
    case "target_required":
      return "Selected records are blocked because a required target is missing.";
    case "invalid_target":
      return "Selected records are blocked because the requested target is invalid.";
    case "target_not_found":
      return "Selected records are blocked because the requested target was not found.";
    case "no_change":
      return "Selected records already have the requested value.";
  }
}

function buildReasonSummaries(
  result: BulkActionDryRunResult
): BulkActionDryRunReviewReasonSummary[] {
  const recordsByReason = new Map<
    BulkActionDryRunReason,
    BulkActionDryRunRecord[]
  >();

  for (const record of result.records) {
    recordsByReason.set(record.reason, [
      ...(recordsByReason.get(record.reason) ?? []),
      record
    ]);
  }

  const recordsById = new Map(result.records.map((record) => [record.id, record]));
  const duplicateRepresentativeRecords = result.duplicateSelections
    .slice(0, BULK_ACTION_DRY_RUN_REVIEW_SAMPLE_LIMIT)
    .map((selection) => {
      const record = recordsById.get(selection.id);
      const message = duplicateMessage(selection.occurrences - 1);

      return record
        ? toRepresentativeRecord(record, selection.occurrences, message)
        : {
            id: selection.id,
            label: null,
            message,
            currentValue: null,
            targetValue: null,
            occurrences: selection.occurrences
          };
    });

  return BULK_ACTION_DRY_RUN_REVIEW_REASON_ORDER.flatMap((reason) => {
    const records = recordsByReason.get(reason) ?? [];
    const count =
      reason === "duplicate_selection"
        ? result.duplicateSelections.reduce(
            (total, selection) => total + selection.occurrences - 1,
            0
          )
        : records.length;

    if (count === 0) {
      return [];
    }

    const representativeRecords =
      reason === "duplicate_selection"
        ? duplicateRepresentativeRecords
        : records
            .slice(0, BULK_ACTION_DRY_RUN_REVIEW_SAMPLE_LIMIT)
            .map((record) => toRepresentativeRecord(record));
    const firstRepresentative = representativeRecords[0] ?? null;

    return [
      {
        reason,
        count,
        eligible: reason === "eligible",
        message:
          firstRepresentative?.message ?? defaultReasonMessage(reason, count),
        representativeRecords
      }
    ];
  });
}

function buildAuditPlan(
  result: BulkActionDryRunResult
): BulkActionDryRunReviewAuditPlan {
  return {
    source: "bulk_action_dry_run",
    packetSource: "bulk_action_dry_run_review_packet",
    summary: result.audit.summary,
    metadata: result.audit.metadata,
    wouldMutate: result.wouldMutate,
    requiresApproval: result.requiresApproval,
    wouldRecordAuditEvent: false,
    write: noWrites()
  };
}

export function isBulkActionDryRunReviewPacketEntity(
  value: string
): value is BulkActionDryRunReviewPacketEntity {
  return (BULK_ACTION_DRY_RUN_REVIEW_PACKET_ENTITIES as readonly string[]).includes(
    value
  );
}

export function listBulkActionDryRunReviewPacketDefinitions(): BulkActionDryRunReviewPacketDefinition[] {
  return BULK_ACTION_DRY_RUN_REVIEW_PACKET_ENTITIES.map((entity) =>
    getBulkActionDryRunReviewPacketDefinition(entity)
  );
}

export function getBulkActionDryRunReviewPacketDefinition(
  entity: BulkActionDryRunReviewPacketEntity
): BulkActionDryRunReviewPacketDefinition {
  return {
    packetType: "bulk-action-dry-run-review-packet",
    entityMetadata: buildEntityMetadata(entity),
    actions: BULK_ACTION_DRY_RUN_REVIEW_PACKET_ACTIONS.map((action) =>
      buildActionMetadata(entity, action)
    ),
    write: noWrites()
  };
}

export function buildBulkActionDryRunReviewPacket(
  dryRun: BulkActionDryRunResult
): BulkActionDryRunReviewPacket {
  return {
    ...getBulkActionDryRunReviewPacketDefinition(dryRun.entity),
    mode: "dry_run_review",
    actionMetadata: buildActionMetadata(dryRun.entity, dryRun.action),
    dryRun,
    rollup: buildRollup(dryRun),
    reasons: buildReasonSummaries(dryRun),
    auditPlan: buildAuditPlan(dryRun)
  };
}

export async function getBulkActionDryRunReviewPacket(
  input: unknown
): Promise<BulkActionDryRunReviewPacket> {
  return buildBulkActionDryRunReviewPacket(await dryRunBulkAction(input));
}
