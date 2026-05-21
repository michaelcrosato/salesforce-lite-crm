import {
  CSV_IMPORT_PREVIEW_DEFAULT_LIMIT,
  CSV_IMPORT_PREVIEW_ENTITIES,
  CSV_IMPORT_PREVIEW_MAX_LIMIT,
  getCsvImportPreviewDefinition,
  isCsvImportPreviewEntity,
  listCsvImportPreviewDefinitions,
  type CsvImportIssueSummary,
  type CsvImportPreviewDefinition,
  type CsvImportPreviewEntity,
  type CsvImportPreviewOptions
} from "@/lib/server/csvImportPreview";
import {
  previewCsvImportWithPreflightDiagnostics,
  type CsvImportActionSummary,
  type CsvImportPreflightDiagnostic,
  type CsvImportPreflightResult,
  type CsvImportPreflightRow,
  type CsvImportReadinessSummary
} from "@/lib/server/csvImportPreflight";
import {
  CSV_IMPORT_TEMPLATE_CONTENT_TYPE,
  getCsvImportTemplate,
  type CsvImportTemplate
} from "@/lib/server/csvImportTemplates";

export const CSV_IMPORT_REVIEW_BUNDLE_ENTITIES = CSV_IMPORT_PREVIEW_ENTITIES;
export const CSV_IMPORT_REVIEW_BUNDLE_DEFAULT_SAMPLE_LIMIT = 5;
export const CSV_IMPORT_REVIEW_BUNDLE_MAX_SAMPLE_LIMIT = 25;

export type CsvImportReviewBundleEntity = CsvImportPreviewEntity;

export type CsvImportReviewBundleOptions = CsvImportPreviewOptions & {
  sampleLimit?: number;
};

export type CsvImportReviewBundleDefinition = CsvImportPreviewDefinition & {
  inputContentType: typeof CSV_IMPORT_TEMPLATE_CONTENT_TYPE;
  defaultPreviewLimit: typeof CSV_IMPORT_PREVIEW_DEFAULT_LIMIT;
  maxPreviewLimit: typeof CSV_IMPORT_PREVIEW_MAX_LIMIT;
  defaultSampleLimit: typeof CSV_IMPORT_REVIEW_BUNDLE_DEFAULT_SAMPLE_LIMIT;
  maxSampleLimit: typeof CSV_IMPORT_REVIEW_BUNDLE_MAX_SAMPLE_LIMIT;
};

export type CsvImportReviewPreflight = Omit<CsvImportPreflightResult, "rows">;

export type CsvImportReviewRowSample = {
  sampleLimit: number;
  sampledRows: number;
  hasMoreRows: boolean;
  rows: readonly CsvImportPreflightRow[];
};

export type CsvImportReviewWriteFlags = {
  database: false;
  files: false;
  externalServices: false;
  routingAssignments: false;
};

export type CsvImportReviewBundle = CsvImportReviewBundleDefinition & {
  template: CsvImportTemplate;
  preflight: CsvImportReviewPreflight;
  issueSummary: CsvImportIssueSummary;
  readinessSummary: CsvImportReadinessSummary;
  actionSummary: CsvImportActionSummary;
  diagnostics: readonly CsvImportPreflightDiagnostic[];
  rowSample: CsvImportReviewRowSample;
  write: CsvImportReviewWriteFlags;
};

function normalizeSampleLimit(limit: number | undefined): number {
  if (limit === undefined) {
    return CSV_IMPORT_REVIEW_BUNDLE_DEFAULT_SAMPLE_LIMIT;
  }

  const truncated = Math.trunc(limit);

  if (!Number.isFinite(truncated)) {
    return CSV_IMPORT_REVIEW_BUNDLE_DEFAULT_SAMPLE_LIMIT;
  }

  return Math.min(
    Math.max(truncated, 0),
    CSV_IMPORT_REVIEW_BUNDLE_MAX_SAMPLE_LIMIT
  );
}

function noWrites(): CsvImportReviewWriteFlags {
  return {
    database: false,
    files: false,
    externalServices: false,
    routingAssignments: false
  };
}

function buildReviewBundleDefinition(
  definition: CsvImportPreviewDefinition
): CsvImportReviewBundleDefinition {
  return {
    ...definition,
    inputContentType: CSV_IMPORT_TEMPLATE_CONTENT_TYPE,
    defaultPreviewLimit: CSV_IMPORT_PREVIEW_DEFAULT_LIMIT,
    maxPreviewLimit: CSV_IMPORT_PREVIEW_MAX_LIMIT,
    defaultSampleLimit: CSV_IMPORT_REVIEW_BUNDLE_DEFAULT_SAMPLE_LIMIT,
    maxSampleLimit: CSV_IMPORT_REVIEW_BUNDLE_MAX_SAMPLE_LIMIT
  };
}

function summarizePreflight(
  preflight: CsvImportPreflightResult
): CsvImportReviewPreflight {
  const { rows, ...summary } = preflight;
  void rows;

  return summary;
}

function buildRowSample(
  preflight: CsvImportPreflightResult,
  sampleLimit: number
): CsvImportReviewRowSample {
  const rows = preflight.rows.slice(0, sampleLimit);

  return {
    sampleLimit,
    sampledRows: rows.length,
    hasMoreRows: preflight.rowCount > rows.length,
    rows
  };
}

export function isCsvImportReviewBundleEntity(
  value: string
): value is CsvImportReviewBundleEntity {
  return isCsvImportPreviewEntity(value);
}

export function listCsvImportReviewBundleDefinitions(): CsvImportReviewBundleDefinition[] {
  return listCsvImportPreviewDefinitions().map(buildReviewBundleDefinition);
}

export function getCsvImportReviewBundleDefinition(
  entity: CsvImportReviewBundleEntity
): CsvImportReviewBundleDefinition {
  return buildReviewBundleDefinition(getCsvImportPreviewDefinition(entity));
}

export async function getCsvImportReviewBundle(
  entity: CsvImportReviewBundleEntity,
  input: string,
  options: CsvImportReviewBundleOptions = {}
): Promise<CsvImportReviewBundle> {
  const preflightOptions: CsvImportPreviewOptions = {
    limit: options.limit
  };
  const [template, preflight] = await Promise.all([
    Promise.resolve(getCsvImportTemplate(entity)),
    previewCsvImportWithPreflightDiagnostics(entity, input, preflightOptions)
  ]);
  const sampleLimit = normalizeSampleLimit(options.sampleLimit);

  return {
    ...getCsvImportReviewBundleDefinition(entity),
    template,
    preflight: summarizePreflight(preflight),
    issueSummary: preflight.issueSummary,
    readinessSummary: preflight.readinessSummary,
    actionSummary: preflight.actionSummary,
    diagnostics: preflight.diagnostics,
    rowSample: buildRowSample(preflight, sampleLimit),
    write: noWrites()
  };
}

export async function listCsvImportReviewBundles(
  inputs: Record<CsvImportReviewBundleEntity, string>,
  options: CsvImportReviewBundleOptions = {}
): Promise<CsvImportReviewBundle[]> {
  return Promise.all(
    CSV_IMPORT_REVIEW_BUNDLE_ENTITIES.map((entity) =>
      getCsvImportReviewBundle(entity, inputs[entity], options)
    )
  );
}
