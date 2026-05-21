import {
  CSV_IMPORT_PREVIEW_DEFAULT_LIMIT,
  CSV_IMPORT_PREVIEW_ENTITIES,
  CSV_IMPORT_PREVIEW_MAX_LIMIT,
  isCsvImportPreviewEntity,
  type CsvImportIssueSummary,
  type CsvImportPreviewEntity
} from "@/lib/server/csvImportPreview";
import {
  CSV_IMPORT_REVIEW_BUNDLE_DEFAULT_SAMPLE_LIMIT,
  CSV_IMPORT_REVIEW_BUNDLE_MAX_SAMPLE_LIMIT,
  getCsvImportReviewBundle,
  getCsvImportReviewBundleDefinition,
  listCsvImportReviewBundleDefinitions,
  type CsvImportReviewBundle,
  type CsvImportReviewBundleDefinition,
  type CsvImportReviewBundleOptions,
  type CsvImportReviewRowSample,
  type CsvImportReviewWriteFlags
} from "@/lib/server/csvImportReviewBundles";
import {
  type CsvImportActionSummary,
  type CsvImportPreflightDiagnostic,
  type CsvImportReadinessSummary
} from "@/lib/server/csvImportPreflight";
import { CSV_IMPORT_TEMPLATE_CONTENT_TYPE } from "@/lib/server/csvImportTemplates";

export const CSV_IMPORT_DRY_RUN_RECEIPT_ENTITIES = CSV_IMPORT_PREVIEW_ENTITIES;

export type CsvImportDryRunReceiptEntity = CsvImportPreviewEntity;
export type CsvImportDryRunReceiptDefinition = CsvImportReviewBundleDefinition;
export type CsvImportDryRunReceiptOptions = CsvImportReviewBundleOptions;

export type CsvImportDryRunSourceMetadata = {
  inputContentType: typeof CSV_IMPORT_TEMPLATE_CONTENT_TYPE;
  characterCount: number;
  lineCount: number;
  rowCount: number;
  previewedRows: number;
  requestedPreviewLimit: number | null;
  appliedPreviewLimit: number;
  defaultPreviewLimit: typeof CSV_IMPORT_PREVIEW_DEFAULT_LIMIT;
  maxPreviewLimit: typeof CSV_IMPORT_PREVIEW_MAX_LIMIT;
  requestedSampleLimit: number | null;
  appliedSampleLimit: number;
  defaultSampleLimit: typeof CSV_IMPORT_REVIEW_BUNDLE_DEFAULT_SAMPLE_LIMIT;
  maxSampleLimit: typeof CSV_IMPORT_REVIEW_BUNDLE_MAX_SAMPLE_LIMIT;
};

export type CsvImportDryRunWriteFlags = CsvImportReviewWriteFlags & {
  importApply: false;
  bulkMutations: false;
  backgroundJobs: false;
};

export type CsvImportDryRunReceipt = CsvImportDryRunReceiptDefinition & {
  mode: "dry_run";
  review: CsvImportReviewBundle;
  source: CsvImportDryRunSourceMetadata;
  issueSummary: CsvImportIssueSummary;
  readinessSummary: CsvImportReadinessSummary;
  actionSummary: CsvImportActionSummary;
  diagnostics: readonly CsvImportPreflightDiagnostic[];
  rowSample: CsvImportReviewRowSample;
  write: CsvImportDryRunWriteFlags;
};

function noWrites(): CsvImportDryRunWriteFlags {
  return {
    database: false,
    files: false,
    externalServices: false,
    routingAssignments: false,
    importApply: false,
    bulkMutations: false,
    backgroundJobs: false
  };
}

function normalizePreviewLimit(limit: number | undefined): number {
  if (limit === undefined) {
    return CSV_IMPORT_PREVIEW_DEFAULT_LIMIT;
  }

  const truncated = Math.trunc(limit);

  if (!Number.isFinite(truncated)) {
    return CSV_IMPORT_PREVIEW_DEFAULT_LIMIT;
  }

  return Math.min(Math.max(truncated, 0), CSV_IMPORT_PREVIEW_MAX_LIMIT);
}

function normalizeRequestedLimit(limit: number | undefined): number | null {
  if (limit === undefined) {
    return null;
  }

  const truncated = Math.trunc(limit);

  return Number.isFinite(truncated) ? truncated : null;
}

function countInputLines(input: string): number {
  if (input.length === 0) {
    return 0;
  }

  return input.split(/\r\n|\n|\r/).length;
}

function buildSourceMetadata(
  input: string,
  options: CsvImportDryRunReceiptOptions,
  review: CsvImportReviewBundle
): CsvImportDryRunSourceMetadata {
  return {
    inputContentType: CSV_IMPORT_TEMPLATE_CONTENT_TYPE,
    characterCount: input.length,
    lineCount: countInputLines(input),
    rowCount: review.preflight.rowCount,
    previewedRows: review.preflight.previewedRows,
    requestedPreviewLimit: normalizeRequestedLimit(options.limit),
    appliedPreviewLimit: normalizePreviewLimit(options.limit),
    defaultPreviewLimit: CSV_IMPORT_PREVIEW_DEFAULT_LIMIT,
    maxPreviewLimit: CSV_IMPORT_PREVIEW_MAX_LIMIT,
    requestedSampleLimit: normalizeRequestedLimit(options.sampleLimit),
    appliedSampleLimit: review.rowSample.sampleLimit,
    defaultSampleLimit: CSV_IMPORT_REVIEW_BUNDLE_DEFAULT_SAMPLE_LIMIT,
    maxSampleLimit: CSV_IMPORT_REVIEW_BUNDLE_MAX_SAMPLE_LIMIT
  };
}

export function isCsvImportDryRunReceiptEntity(
  value: string
): value is CsvImportDryRunReceiptEntity {
  return isCsvImportPreviewEntity(value);
}

export function listCsvImportDryRunReceiptDefinitions(): CsvImportDryRunReceiptDefinition[] {
  return listCsvImportReviewBundleDefinitions();
}

export function getCsvImportDryRunReceiptDefinition(
  entity: CsvImportDryRunReceiptEntity
): CsvImportDryRunReceiptDefinition {
  return getCsvImportReviewBundleDefinition(entity);
}

export async function getCsvImportDryRunReceipt(
  entity: CsvImportDryRunReceiptEntity,
  input: string,
  options: CsvImportDryRunReceiptOptions = {}
): Promise<CsvImportDryRunReceipt> {
  const review = await getCsvImportReviewBundle(entity, input, options);

  return {
    ...getCsvImportDryRunReceiptDefinition(entity),
    mode: "dry_run",
    review,
    source: buildSourceMetadata(input, options, review),
    issueSummary: review.issueSummary,
    readinessSummary: review.readinessSummary,
    actionSummary: review.actionSummary,
    diagnostics: review.diagnostics,
    rowSample: review.rowSample,
    write: noWrites()
  };
}

export async function listCsvImportDryRunReceipts(
  inputs: Record<CsvImportDryRunReceiptEntity, string>,
  options: CsvImportDryRunReceiptOptions = {}
): Promise<CsvImportDryRunReceipt[]> {
  return Promise.all(
    CSV_IMPORT_DRY_RUN_RECEIPT_ENTITIES.map((entity) =>
      getCsvImportDryRunReceipt(entity, inputs[entity], options)
    )
  );
}
