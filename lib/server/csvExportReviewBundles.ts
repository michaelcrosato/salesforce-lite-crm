import {
  CSV_EXPORT_CONTENT_TYPE,
  CSV_EXPORT_DEFAULT_LIMIT,
  CSV_EXPORT_ENTITIES,
  CSV_EXPORT_MAX_LIMIT,
  CSV_EXPORT_PREVIEW_DEFAULT_LIMIT,
  CSV_EXPORT_PREVIEW_MAX_LIMIT,
  getCsvExportDefinition,
  getCsvExportPreflightSummary,
  getCsvExportPreview,
  isCsvExportEntity,
  listCsvExportDefinitions,
  type CsvExportDefinition,
  type CsvExportEntity,
  type CsvExportPreflightSummary,
  type CsvExportPreview,
  type CsvExportPreviewOptions
} from "@/lib/server/csvExport";
import { getCsvCapability, type CsvCapability } from "@/lib/server/csvCapabilities";

export const CSV_EXPORT_REVIEW_BUNDLE_ENTITIES = CSV_EXPORT_ENTITIES;

export const CSV_EXPORT_REVIEW_NOTE_CODES = [
  "empty-export",
  "preview-disabled",
  "preview-truncated",
  "preview-complete",
  "default-export-limit",
  "max-export-limit"
] as const;

export type CsvExportReviewBundleEntity = CsvExportEntity;
export type CsvExportReviewNoteCode = (typeof CSV_EXPORT_REVIEW_NOTE_CODES)[number];

export type CsvExportReviewNote = {
  code: CsvExportReviewNoteCode;
  severity: "info" | "warning";
  message: string;
};

export type CsvExportReviewWriteFlags = {
  database: false;
  files: false;
  externalServices: false;
  exportHistory: false;
};

export type CsvExportReviewBundleDefinition = CsvExportDefinition & {
  contentType: typeof CSV_EXPORT_CONTENT_TYPE;
  canonicalHeaders: readonly string[];
  defaultExportLimit: typeof CSV_EXPORT_DEFAULT_LIMIT;
  maxExportLimit: typeof CSV_EXPORT_MAX_LIMIT;
  defaultPreviewLimit: typeof CSV_EXPORT_PREVIEW_DEFAULT_LIMIT;
  maxPreviewLimit: typeof CSV_EXPORT_PREVIEW_MAX_LIMIT;
};

export type CsvExportReviewBundleOptions = CsvExportPreviewOptions;

export type CsvExportReviewBundle = CsvExportReviewBundleDefinition & {
  capability: CsvCapability;
  preflight: CsvExportPreflightSummary;
  preview: CsvExportPreview;
  notes: readonly CsvExportReviewNote[];
  write: CsvExportReviewWriteFlags;
};

function noWrites(): CsvExportReviewWriteFlags {
  return {
    database: false,
    files: false,
    externalServices: false,
    exportHistory: false
  };
}

function pluralizeRows(count: number): string {
  return count === 1 ? "row" : "rows";
}

function buildReviewBundleDefinition(
  definition: CsvExportDefinition
): CsvExportReviewBundleDefinition {
  return {
    ...definition,
    contentType: CSV_EXPORT_CONTENT_TYPE,
    canonicalHeaders: definition.columns.map((column) => column.label),
    defaultExportLimit: CSV_EXPORT_DEFAULT_LIMIT,
    maxExportLimit: CSV_EXPORT_MAX_LIMIT,
    defaultPreviewLimit: CSV_EXPORT_PREVIEW_DEFAULT_LIMIT,
    maxPreviewLimit: CSV_EXPORT_PREVIEW_MAX_LIMIT
  };
}

function getExportCapability(entity: CsvExportReviewBundleEntity): CsvCapability {
  const capability = getCsvCapability("export", entity);

  if (capability === null) {
    throw new Error(`Missing CSV export capability for ${entity}`);
  }

  return capability;
}

function buildReviewNotes(
  preflight: CsvExportPreflightSummary,
  preview: CsvExportPreview
): CsvExportReviewNote[] {
  const notes: CsvExportReviewNote[] = [];

  if (preflight.rowCount === 0) {
    notes.push({
      code: "empty-export",
      severity: "info",
      message: `No ${preflight.label} rows are available for export.`
    });
  } else if (preview.previewLimit === 0) {
    notes.push({
      code: "preview-disabled",
      severity: "info",
      message: `Preview rows are disabled; ${preflight.rowCount} ${pluralizeRows(
        preflight.rowCount
      )} remain available for export review.`
    });
  } else if (preview.hasMoreRows) {
    notes.push({
      code: "preview-truncated",
      severity: "info",
      message: `Preview shows ${preview.previewRowCount} of ${preview.totalRowCount} ${pluralizeRows(
        preview.totalRowCount
      )}.`
    });
  } else {
    notes.push({
      code: "preview-complete",
      severity: "info",
      message: `Preview includes all ${preview.totalRowCount} available ${pluralizeRows(
        preview.totalRowCount
      )}.`
    });
  }

  if (preflight.rowCount > CSV_EXPORT_DEFAULT_LIMIT) {
    notes.push({
      code: "default-export-limit",
      severity: "info",
      message: `${preflight.rowCount} ${pluralizeRows(
        preflight.rowCount
      )} are available; default export requests include ${CSV_EXPORT_DEFAULT_LIMIT}.`
    });
  }

  if (preflight.rowCount > CSV_EXPORT_MAX_LIMIT) {
    notes.push({
      code: "max-export-limit",
      severity: "warning",
      message: `${preflight.rowCount} ${pluralizeRows(
        preflight.rowCount
      )} exceed the maximum export limit of ${CSV_EXPORT_MAX_LIMIT}.`
    });
  }

  return notes;
}

export function isCsvExportReviewBundleEntity(
  value: string
): value is CsvExportReviewBundleEntity {
  return isCsvExportEntity(value);
}

export function listCsvExportReviewBundleDefinitions(): CsvExportReviewBundleDefinition[] {
  return listCsvExportDefinitions().map(buildReviewBundleDefinition);
}

export function getCsvExportReviewBundleDefinition(
  entity: CsvExportReviewBundleEntity
): CsvExportReviewBundleDefinition {
  return buildReviewBundleDefinition(getCsvExportDefinition(entity));
}

export async function getCsvExportReviewBundle(
  entity: CsvExportReviewBundleEntity,
  options: CsvExportReviewBundleOptions = {}
): Promise<CsvExportReviewBundle> {
  const [preflight, preview] = await Promise.all([
    getCsvExportPreflightSummary(entity),
    getCsvExportPreview(entity, options)
  ]);

  return {
    ...getCsvExportReviewBundleDefinition(entity),
    capability: getExportCapability(entity),
    preflight,
    preview,
    notes: buildReviewNotes(preflight, preview),
    write: noWrites()
  };
}

export async function listCsvExportReviewBundles(
  options: CsvExportReviewBundleOptions = {}
): Promise<CsvExportReviewBundle[]> {
  return Promise.all(
    CSV_EXPORT_REVIEW_BUNDLE_ENTITIES.map((entity) =>
      getCsvExportReviewBundle(entity, options)
    )
  );
}
