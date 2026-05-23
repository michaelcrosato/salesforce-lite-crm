"use server";

import {
  getCsvDedupeReviewBundle,
  isCsvDedupeReviewBundleEntity,
  type CsvDedupeReviewBundle
} from "@/lib/server/csvDedupeReviewBundles";
import {
  BULK_ACTION_DRY_RUN_REVIEW_PACKET_ACTIONS,
  getBulkActionDryRunReviewPacket,
  isBulkActionDryRunReviewPacketEntity,
  type BulkActionDryRunReviewPacket,
  type BulkActionDryRunReviewPacketAction,
  type BulkActionDryRunReviewPacketEntity
} from "@/lib/server/bulkActionDryRunReviewPackets";

export type CsvImportPreviewActionResult =
  | {
      ok: true;
      message: string;
      bundle: CsvDedupeReviewBundle;
    }
  | {
      ok: false;
      message: string;
      fieldErrors?: {
        csv?: string[];
        entity?: string[];
      };
    };

export type BulkActionDryRunReviewActionResult =
  | {
      ok: true;
      message: string;
      packet: BulkActionDryRunReviewPacket;
    }
  | {
      ok: false;
      message: string;
      fieldErrors?: {
        entity?: string[];
        action?: string[];
        recordIds?: string[];
        target?: string[];
      };
    };

const CSV_IMPORT_PREVIEW_SAMPLE_LIMIT = 10;

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

function isBulkActionDryRunReviewPacketAction(
  value: string
): value is BulkActionDryRunReviewPacketAction {
  return (
    BULK_ACTION_DRY_RUN_REVIEW_PACKET_ACTIONS as readonly string[]
  ).includes(value);
}

function parseRecordIds(value: string): string[] {
  return value
    .split(/[\s,]+/)
    .map((recordId) => recordId.trim())
    .filter((recordId) => recordId.length > 0);
}

type BulkActionDryRunReviewInput = {
  entity: BulkActionDryRunReviewPacketEntity;
  action: BulkActionDryRunReviewPacketAction;
  recordIds: string[];
  targetStatus?: string;
  targetStage?: string;
  targetOwnerId?: string;
  taskTitle?: string;
};

function optionalFormString(
  formData: FormData,
  key: keyof Omit<
    BulkActionDryRunReviewInput,
    "entity" | "action" | "recordIds"
  >
): string | undefined {
  const value = formString(formData, key).trim();

  return value.length > 0 ? value : undefined;
}

export async function previewBulkActionDryRunReviewAction(
  formData: FormData
): Promise<BulkActionDryRunReviewActionResult> {
  const entity = formString(formData, "entity");
  const action = formString(formData, "action");
  const recordIds = parseRecordIds(formString(formData, "recordIds"));

  if (!isBulkActionDryRunReviewPacketEntity(entity)) {
    return {
      ok: false,
      message: "Choose a supported bulk action entity.",
      fieldErrors: {
        entity: ["Choose a supported bulk action entity."]
      }
    };
  }

  if (!isBulkActionDryRunReviewPacketAction(action)) {
    return {
      ok: false,
      message: "Choose a supported bulk action.",
      fieldErrors: {
        action: ["Choose a supported bulk action."]
      }
    };
  }

  if (recordIds.length === 0) {
    return {
      ok: false,
      message: "Enter at least one selected record ID.",
      fieldErrors: {
        recordIds: ["Enter at least one selected record ID."]
      }
    };
  }

  const input: BulkActionDryRunReviewInput = {
    entity,
    action,
    recordIds,
    targetStatus: optionalFormString(formData, "targetStatus"),
    targetStage: optionalFormString(formData, "targetStage"),
    targetOwnerId: optionalFormString(formData, "targetOwnerId"),
    taskTitle: optionalFormString(formData, "taskTitle")
  };

  try {
    const packet = await getBulkActionDryRunReviewPacket(input);

    return {
      ok: true,
      message: `${packet.entityMetadata.label} ${packet.actionMetadata.label}: ${packet.rollup.eligibleCount} eligible, ${packet.rollup.blockedCount} blocked.`,
      packet
    };
  } catch {
    return {
      ok: false,
      message: "The bulk dry-run review packet could not be built.",
      fieldErrors: {
        target: ["Review the selected action target and record IDs."]
      }
    };
  }
}

export async function previewCsvImportReviewAction(
  formData: FormData
): Promise<CsvImportPreviewActionResult> {
  const entity = formString(formData, "entity");
  const csv = formString(formData, "csv");

  if (!isCsvDedupeReviewBundleEntity(entity)) {
    return {
      ok: false,
      message: "Choose a supported import entity.",
      fieldErrors: {
        entity: ["Choose a supported import entity."]
      }
    };
  }

  if (csv.trim().length === 0) {
    return {
      ok: false,
      message: "Paste or select a CSV file before previewing.",
      fieldErrors: {
        csv: ["Paste or select a CSV file before previewing."]
      }
    };
  }

  try {
    const bundle = await getCsvDedupeReviewBundle(entity, csv, {
      sampleLimit: CSV_IMPORT_PREVIEW_SAMPLE_LIMIT
    });
    const { safeRows, watchRows, blockRows } = bundle.operatorSummary;

    return {
      ok: true,
      message: `${bundle.label} preview: ${safeRows} safe, ${watchRows} watch, ${blockRows} block.`,
      bundle
    };
  } catch {
    return {
      ok: false,
      message: "The CSV preview could not be built."
    };
  }
}
