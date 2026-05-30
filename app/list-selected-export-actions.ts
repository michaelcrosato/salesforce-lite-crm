"use server";

import {
  getBulkActionSelectedExportPacket,
  isBulkActionSelectedExportPacketEntity,
  type BulkActionSelectedExportPacketStatus,
  type BulkActionSelectedExportRollup
} from "@/lib/server/bulkActionSelectedExportPackets";
import {
  getBulkActionDryRunReviewPacket,
  type BulkActionDryRunReviewPacket
} from "@/lib/server/bulkActionDryRunReviewPackets";
import {
  executeBulkAction,
  getBulkActionExecutionDefinition,
  isBulkActionExecutionAction,
  isBulkActionExecutionEntity,
  type BulkActionExecutionAction,
  type BulkActionExecutionEntity,
  type BulkActionExecutionResult
} from "@/lib/server/bulkActionExecution";
import { logActionError } from "@/lib/action-result";

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

export type ListBulkExecutionFieldErrors = {
  confirmation?: string[];
  entity?: string[];
  action?: string[];
  recordIds?: string[];
  target?: string[];
};

export type ListBulkExecutionPreviewActionResult =
  | {
      ok: true;
      message: string;
      packet: BulkActionDryRunReviewPacket;
    }
  | {
      ok: false;
      message: string;
      fieldErrors?: ListBulkExecutionFieldErrors;
    };

export type ListBulkExecutionActionResult =
  | {
      ok: true;
      message: string;
      execution: BulkActionExecutionResult;
    }
  | {
      ok: false;
      message: string;
      fieldErrors?: ListBulkExecutionFieldErrors;
    };

type ParsedListBulkExecutionInput = {
  entity: BulkActionExecutionEntity;
  action: BulkActionExecutionAction;
  recordIds: string[];
  targetStatus?: string;
  targetStage?: string;
  targetOwnerId?: string;
  taskTitle?: string;
};

const BULK_EXECUTION_CONFIRMATION_VALUE = "confirmed";

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

function optionalFormString(
  formData: FormData,
  key: "targetStatus" | "targetStage" | "targetOwnerId" | "taskTitle"
): string | undefined {
  const value = formString(formData, key).trim();

  return value.length > 0 ? value : undefined;
}

function isSupportedListBulkExecutionAction(
  entity: BulkActionExecutionEntity,
  action: BulkActionExecutionAction
): boolean {
  return getBulkActionExecutionDefinition(entity).supportedActions.includes(
    action
  );
}

function parseListBulkExecutionInput(
  formData: FormData
):
  | { ok: true; input: ParsedListBulkExecutionInput }
  | { ok: false; result: Extract<ListBulkExecutionActionResult, { ok: false }> } {
  const entity = formString(formData, "entity");
  const action = formString(formData, "action");
  const recordIds = recordIdsFromFormData(formData);

  if (!isBulkActionExecutionEntity(entity)) {
    return {
      ok: false,
      result: {
        ok: false,
        message: "Choose a supported bulk execution list.",
        fieldErrors: {
          entity: ["Choose a supported bulk execution list."]
        }
      }
    };
  }

  if (!isBulkActionExecutionAction(action)) {
    return {
      ok: false,
      result: {
        ok: false,
        message: "Choose a supported bulk execution action.",
        fieldErrors: {
          action: ["Choose a supported bulk execution action."]
        }
      }
    };
  }

  if (!isSupportedListBulkExecutionAction(entity, action)) {
    return {
      ok: false,
      result: {
        ok: false,
        message: "This bulk action is not available for the selected list.",
        fieldErrors: {
          action: ["This bulk action is not available for the selected list."]
        }
      }
    };
  }

  if (recordIds.length === 0) {
    return {
      ok: false,
      result: {
        ok: false,
        message: "Select at least one visible record before bulk execution.",
        fieldErrors: {
          recordIds: [
            "Select at least one visible record before bulk execution."
          ]
        }
      }
    };
  }

  return {
    ok: true,
    input: {
      entity,
      action,
      recordIds,
      targetStatus: optionalFormString(formData, "targetStatus"),
      targetStage: optionalFormString(formData, "targetStage"),
      targetOwnerId: optionalFormString(formData, "targetOwnerId"),
      taskTitle: optionalFormString(formData, "taskTitle")
    }
  };
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
  } catch (error) {
    logActionError(error, {
      action: "previewListSelectedExportAction",
      entity
    });
    return {
      ok: false,
      message: "The selected export packet could not be built.",
      fieldErrors: {
        target: ["Review the selected records and try again."]
      }
    };
  }
}

export async function previewListBulkExecutionAction(
  formData: FormData
): Promise<ListBulkExecutionPreviewActionResult> {
  const parsed = parseListBulkExecutionInput(formData);

  if (!parsed.ok) {
    return parsed.result;
  }

  try {
    const packet = await getBulkActionDryRunReviewPacket(parsed.input);

    return {
      ok: true,
      message: `${packet.entityMetadata.label} ${packet.actionMetadata.label}: ${packet.rollup.eligibleCount} eligible, ${packet.rollup.blockedCount} blocked.`,
      packet
    };
  } catch (error) {
    logActionError(error, {
      action: "previewListBulkExecutionAction",
      entity: parsed.input.entity
    });
    return {
      ok: false,
      message: "The list bulk dry run could not be built.",
      fieldErrors: {
        target: ["Review the selected action target and records."]
      }
    };
  }
}

export async function executeListBulkExecutionAction(
  formData: FormData
): Promise<ListBulkExecutionActionResult> {
  const confirmation = formString(formData, "confirmExecution");

  if (confirmation !== BULK_EXECUTION_CONFIRMATION_VALUE) {
    return {
      ok: false,
      message: "Confirm execution before running the bulk action.",
      fieldErrors: {
        confirmation: ["Confirm execution before running the bulk action."]
      }
    };
  }

  const parsed = parseListBulkExecutionInput(formData);

  if (!parsed.ok) {
    return parsed.result;
  }

  try {
    const execution = await executeBulkAction(parsed.input);

    return {
      ok: true,
      message: `${execution.action} execution for ${execution.entity}: ${execution.rollup.executedCount} executed, ${execution.rollup.skippedCount} skipped, ${execution.rollup.blockedCount} blocked.`,
      execution
    };
  } catch (error) {
    logActionError(error, {
      action: "executeListBulkExecutionAction",
      entity: parsed.input.entity
    });
    return {
      ok: false,
      message: "The list bulk action could not be executed.",
      fieldErrors: {
        target: ["Review the selected action target and records."]
      }
    };
  }
}
