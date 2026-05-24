"use server";

import {
  getBulkActionSelectedExportPacket,
  isBulkActionSelectedExportPacketEntity,
  type BulkActionSelectedExportPacketStatus,
  type BulkActionSelectedExportRollup
} from "@/lib/server/bulkActionSelectedExportPackets";

export type ListSelectedExportActionResult =
  | {
      ok: true;
      message: string;
      filename: string;
      contentType: string;
      csv: string;
      rowCount: number;
      selectedRecordIds: readonly string[];
      blockedRecordIds: readonly string[];
      blockedRecords: readonly ListSelectedExportBlockedRecord[];
      duplicateSelections: readonly ListSelectedExportDuplicateSelection[];
      rollup: ListSelectedExportRollup;
    }
  | {
      ok: false;
      message: string;
      fieldErrors?: {
        entity?: string[];
        recordIds?: string[];
        target?: string[];
      };
    };

export type ListSelectedExportBlockedRecord = {
  id: string;
  label: string | null;
  reason: string;
  message: string;
};

export type ListSelectedExportDuplicateSelection = {
  id: string;
  occurrences: number;
};

export type ListSelectedExportRollup = Pick<
  BulkActionSelectedExportRollup,
  | "requestedCount"
  | "uniqueRecordCount"
  | "duplicateCount"
  | "missingCount"
  | "eligibleCount"
  | "blockedCount"
  | "exportedCount"
> & {
  status: BulkActionSelectedExportPacketStatus;
  wouldMutate: false;
  requiresApproval: false;
};

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

function recordIdsFromFormData(formData: FormData): string[] {
  return formData
    .getAll("recordIds")
    .flatMap((value) => (typeof value === "string" ? [value.trim()] : []))
    .filter((value) => value.length > 0);
}

export async function previewListSelectedExportAction(
  formData: FormData
): Promise<ListSelectedExportActionResult> {
  const entity = formString(formData, "entity");
  const recordIds = recordIdsFromFormData(formData);

  if (!isBulkActionSelectedExportPacketEntity(entity)) {
    return {
      ok: false,
      message: "Choose a supported selected export list.",
      fieldErrors: {
        entity: ["Choose a supported selected export list."]
      }
    };
  }

  if (recordIds.length === 0) {
    return {
      ok: false,
      message: "Select at least one visible record to export.",
      fieldErrors: {
        recordIds: ["Select at least one visible record to export."]
      }
    };
  }

  try {
    const packet = await getBulkActionSelectedExportPacket({
      entity,
      recordIds
    });
    const blockedRecords = packet.dryRun.records
      .filter((record) => !record.eligible)
      .map((record) => ({
        id: record.id,
        label: record.label,
        reason: record.reason,
        message: record.message
      }));

    return {
      ok: true,
      message: `${packet.entityMetadata.label} selected export: ${packet.rollup.exportedCount} exported, ${packet.rollup.blockedCount} blocked.`,
      filename: packet.entityMetadata.filename,
      contentType: packet.entityMetadata.contentType,
      csv: packet.csv,
      rowCount: packet.rowCount,
      selectedRecordIds: [...packet.selectedRecordIds],
      blockedRecordIds: [...packet.blockedRecordIds],
      blockedRecords,
      duplicateSelections: packet.dryRun.duplicateSelections.map(
        (selection) => ({
          id: selection.id,
          occurrences: selection.occurrences
        })
      ),
      rollup: {
        status: packet.rollup.status,
        requestedCount: packet.rollup.requestedCount,
        uniqueRecordCount: packet.rollup.uniqueRecordCount,
        duplicateCount: packet.rollup.duplicateCount,
        missingCount: packet.rollup.missingCount,
        eligibleCount: packet.rollup.eligibleCount,
        blockedCount: packet.rollup.blockedCount,
        exportedCount: packet.rollup.exportedCount,
        wouldMutate: packet.rollup.wouldMutate,
        requiresApproval: packet.rollup.requiresApproval
      }
    };
  } catch {
    return {
      ok: false,
      message: "The selected export packet could not be built.",
      fieldErrors: {
        target: ["Review the selected records and try again."]
      }
    };
  }
}
