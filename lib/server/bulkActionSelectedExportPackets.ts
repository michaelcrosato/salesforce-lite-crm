import { z } from "zod/v4";
import {
  BULK_ACTION_DRY_RUN_ENTITIES,
  BULK_ACTION_DRY_RUN_MAX_RECORDS,
  dryRunBulkAction,
  type BulkActionDryRunEntity,
  type BulkActionDryRunResult
} from "@/lib/server/bulkActionDryRun";
import {
  CSV_EXPORT_CONTENT_TYPE,
  exportSelectedCrmListCsv,
  getCsvExportDefinition,
  type CsvSelectedExportResult
} from "@/lib/server/csvExport";
import type { AuditMetadataValue } from "@/lib/services/auditEvents";
import { idSchema } from "@/lib/validation";

export const BULK_ACTION_SELECTED_EXPORT_PACKET_ENTITIES =
  BULK_ACTION_DRY_RUN_ENTITIES;

export type BulkActionSelectedExportPacketEntity = BulkActionDryRunEntity;
export type BulkActionSelectedExportPacketStatus =
  | "empty"
  | "ready"
  | "partial"
  | "blocked";

export type BulkActionSelectedExportWriteFlags = {
  database: false;
  mutations: false;
  auditEvents: false;
  files: false;
  externalServices: false;
  backgroundJobs: false;
};

export type BulkActionSelectedExportEntityMetadata = {
  entity: BulkActionSelectedExportPacketEntity;
  label: string;
  route: string;
  filename: string;
  contentType: typeof CSV_EXPORT_CONTENT_TYPE;
  canonicalHeaders: readonly string[];
  maxSelectedRecords: typeof BULK_ACTION_DRY_RUN_MAX_RECORDS;
};

export type BulkActionSelectedExportActionMetadata = {
  action: "selected_export";
  label: "Selected export";
  source: "bulk_action_dry_run";
  wouldMutate: false;
  requiresApproval: false;
};

export type BulkActionSelectedExportPacketDefinition = {
  packetType: "bulk-action-selected-export-packet";
  entityMetadata: BulkActionSelectedExportEntityMetadata;
  actionMetadata: BulkActionSelectedExportActionMetadata;
  write: BulkActionSelectedExportWriteFlags;
};

export type BulkActionSelectedExportRollup = {
  status: BulkActionSelectedExportPacketStatus;
  requestedCount: number;
  uniqueRecordCount: number;
  duplicateCount: number;
  missingCount: number;
  eligibleCount: number;
  blockedCount: number;
  exportedCount: number;
  wouldMutate: false;
  requiresApproval: false;
};

export type BulkActionSelectedExportAuditPlan = {
  source: "bulk_action_dry_run";
  packetSource: "bulk_action_selected_export_packet";
  summary: string;
  metadata: AuditMetadataValue;
  wouldMutate: false;
  requiresApproval: false;
  wouldRecordAuditEvent: false;
  write: BulkActionSelectedExportWriteFlags;
};

export type BulkActionSelectedExportPacket =
  BulkActionSelectedExportPacketDefinition & {
    mode: "selected_export_packet";
    dryRun: BulkActionDryRunResult;
    rollup: BulkActionSelectedExportRollup;
    csv: string;
    rowCount: number;
    selectedRecordIds: readonly string[];
    blockedRecordIds: readonly string[];
    auditPlan: BulkActionSelectedExportAuditPlan;
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

const selectedExportPacketInputSchema = z
  .object({
    entity: z.enum(BULK_ACTION_SELECTED_EXPORT_PACKET_ENTITIES),
    recordIds: z
      .array(idSchema)
      .max(
        BULK_ACTION_DRY_RUN_MAX_RECORDS,
        `Selected export packets support at most ${BULK_ACTION_DRY_RUN_MAX_RECORDS} selected records.`
      )
      .default([]),
    generatedAt: optionalDate
  })
  .strict();

type ParsedSelectedExportPacketInput = z.infer<
  typeof selectedExportPacketInputSchema
>;

function noWrites(): BulkActionSelectedExportWriteFlags {
  return {
    database: false,
    mutations: false,
    auditEvents: false,
    files: false,
    externalServices: false,
    backgroundJobs: false
  };
}

function actionMetadata(): BulkActionSelectedExportActionMetadata {
  return {
    action: "selected_export",
    label: "Selected export",
    source: "bulk_action_dry_run",
    wouldMutate: false,
    requiresApproval: false
  };
}

function buildEntityMetadata(
  entity: BulkActionSelectedExportPacketEntity
): BulkActionSelectedExportEntityMetadata {
  const definition = getCsvExportDefinition(entity);

  return {
    entity,
    label: definition.label,
    route: definition.route,
    filename: definition.filename,
    contentType: CSV_EXPORT_CONTENT_TYPE,
    canonicalHeaders: definition.columns.map((column) => column.label),
    maxSelectedRecords: BULK_ACTION_DRY_RUN_MAX_RECORDS
  };
}

function buildPacketStatus(
  dryRun: BulkActionDryRunResult,
  exportedCount: number
): BulkActionSelectedExportPacketStatus {
  if (dryRun.requestedCount === 0) {
    return "empty";
  }

  if (dryRun.blockedCount === 0) {
    return "ready";
  }

  if (exportedCount > 0) {
    return "partial";
  }

  return "blocked";
}

function buildRollup(
  dryRun: BulkActionDryRunResult,
  exportedCount: number
): BulkActionSelectedExportRollup {
  return {
    status: buildPacketStatus(dryRun, exportedCount),
    requestedCount: dryRun.requestedCount,
    uniqueRecordCount: dryRun.uniqueRecordCount,
    duplicateCount: dryRun.duplicateCount,
    missingCount: dryRun.missingCount,
    eligibleCount: dryRun.eligibleCount,
    blockedCount: dryRun.blockedCount,
    exportedCount,
    wouldMutate: dryRun.wouldMutate,
    requiresApproval: dryRun.requiresApproval
  };
}

function selectedRecordIds(dryRun: BulkActionDryRunResult): string[] {
  return dryRun.records
    .filter((record) => record.eligible)
    .map((record) => record.id);
}

function blockedRecordIds(dryRun: BulkActionDryRunResult): string[] {
  return dryRun.records
    .filter((record) => !record.eligible)
    .map((record) => record.id);
}

function buildAuditPlan(
  dryRun: BulkActionDryRunResult,
  exportResult: CsvSelectedExportResult,
  blockedIds: readonly string[]
): BulkActionSelectedExportAuditPlan {
  return {
    source: "bulk_action_dry_run",
    packetSource: "bulk_action_selected_export_packet",
    summary: `selected_export packet for ${dryRun.entity}: ${exportResult.rowCount} exported, ${dryRun.blockedCount} blocked.`,
    metadata: {
      dryRun: dryRun.audit.metadata,
      packetSource: "bulk_action_selected_export_packet",
      entity: dryRun.entity,
      action: "selected_export",
      filename: exportResult.filename,
      contentType: exportResult.contentType,
      requestedCount: dryRun.requestedCount,
      uniqueRecordCount: dryRun.uniqueRecordCount,
      duplicateCount: dryRun.duplicateCount,
      missingCount: dryRun.missingCount,
      eligibleCount: dryRun.eligibleCount,
      blockedCount: dryRun.blockedCount,
      exportedCount: exportResult.rowCount,
      selectedRecordIds: [...exportResult.selectedRecordIds],
      blockedRecordIds: [...blockedIds],
      wouldMutate: false,
      requiresApproval: false
    },
    wouldMutate: false,
    requiresApproval: false,
    wouldRecordAuditEvent: false,
    write: noWrites()
  };
}

function dryRunInput(input: ParsedSelectedExportPacketInput) {
  return {
    entity: input.entity,
    action: "selected_export",
    recordIds: input.recordIds,
    generatedAt: input.generatedAt
  } as const;
}

export function isBulkActionSelectedExportPacketEntity(
  value: string
): value is BulkActionSelectedExportPacketEntity {
  return (BULK_ACTION_SELECTED_EXPORT_PACKET_ENTITIES as readonly string[]).includes(
    value
  );
}

export function listBulkActionSelectedExportPacketDefinitions(): BulkActionSelectedExportPacketDefinition[] {
  return BULK_ACTION_SELECTED_EXPORT_PACKET_ENTITIES.map((entity) =>
    getBulkActionSelectedExportPacketDefinition(entity)
  );
}

export function getBulkActionSelectedExportPacketDefinition(
  entity: BulkActionSelectedExportPacketEntity
): BulkActionSelectedExportPacketDefinition {
  return {
    packetType: "bulk-action-selected-export-packet",
    entityMetadata: buildEntityMetadata(entity),
    actionMetadata: actionMetadata(),
    write: noWrites()
  };
}

export async function getBulkActionSelectedExportPacket(
  input: unknown
): Promise<BulkActionSelectedExportPacket> {
  const parsed = selectedExportPacketInputSchema.parse(input);
  const dryRun = await dryRunBulkAction(dryRunInput(parsed));
  const selectedIds = selectedRecordIds(dryRun);
  const blockedIds = blockedRecordIds(dryRun);
  const exportResult = await exportSelectedCrmListCsv(parsed.entity, {
    recordIds: selectedIds
  });

  return {
    ...getBulkActionSelectedExportPacketDefinition(parsed.entity),
    mode: "selected_export_packet",
    dryRun,
    rollup: buildRollup(dryRun, exportResult.rowCount),
    csv: exportResult.csv,
    rowCount: exportResult.rowCount,
    selectedRecordIds: exportResult.selectedRecordIds,
    blockedRecordIds: blockedIds,
    auditPlan: buildAuditPlan(dryRun, exportResult, blockedIds)
  };
}
