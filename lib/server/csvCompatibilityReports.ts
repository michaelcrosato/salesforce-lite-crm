import {
  CSV_EXPORT_CONTENT_TYPE,
  CSV_EXPORT_ENTITIES,
  getCsvExportDefinition,
  isCsvExportEntity,
  type CsvExportColumnContract,
  type CsvExportDefinition,
  type CsvExportEntity
} from "@/lib/server/csvExport";
import {
  getCsvCapability,
  type CsvCapability
} from "@/lib/server/csvCapabilities";
import {
  CSV_IMPORT_PREVIEW_ENTITIES,
  getCsvImportPreviewDefinition,
  isCsvImportPreviewEntity,
  type CsvImportPreviewDefinition,
  type CsvImportPreviewEntity,
  type CsvImportPreviewField
} from "@/lib/server/csvImportPreview";
import {
  CSV_IMPORT_TEMPLATE_CONTENT_TYPE,
  exportCsvImportTemplateExampleCsv,
  getCsvImportTemplate,
  type CsvImportTemplate,
  type CsvImportTemplateExampleCsv
} from "@/lib/server/csvImportTemplates";
import {
  CSV_TRANSFER_MANIFEST_CONTENT_TYPE,
  getCsvTransferManifestDefinition,
  type CsvTransferManifestDefinition
} from "@/lib/server/csvTransferManifests";

export const CSV_COMPATIBILITY_REPORT_CONTENT_TYPE =
  "application/json; charset=utf-8" as const;

export type CsvCompatibilityReportEntity =
  | CsvExportEntity
  | CsvImportPreviewEntity;

export type CsvCompatibilityDirection =
  | "bidirectional"
  | "export-only"
  | "import-only";

export type CsvCompatibilityWarningCode =
  | "unsupported-export-direction"
  | "unsupported-import-direction"
  | "export-field-only"
  | "import-field-only"
  | "missing-export-transfer-manifest"
  | "missing-import-transfer-manifest";

export type CsvCompatibilityWarning = {
  code: CsvCompatibilityWarningCode;
  severity: "info" | "warning";
  message: string;
  fieldKeys: readonly string[];
  fieldHeaders: readonly string[];
};

export type CsvCompatibilityField = {
  key: string;
  header: string;
  requiredForImport: boolean;
};

export type CsvCompatibilityFieldComparison = {
  matchingFieldKeys: readonly string[];
  exportOnlyFields: readonly CsvCompatibilityField[];
  importOnlyFields: readonly CsvCompatibilityField[];
};

export type CsvCompatibilityExportSurface = {
  supported: boolean;
  filename: string | null;
  contentType: typeof CSV_EXPORT_CONTENT_TYPE | null;
  route: string | null;
  canonicalHeaders: readonly string[];
  fieldKeys: readonly string[];
  previewRows: boolean;
  previewCsvSnippet: boolean;
};

export type CsvCompatibilityImportTemplateExample = {
  filename: string;
  templateFilename: string;
  rowCount: number;
  fieldKeys: readonly string[];
  values: Readonly<Record<string, string>>;
};

export type CsvCompatibilityImportSurface = {
  supported: boolean;
  inputContentType: typeof CSV_IMPORT_TEMPLATE_CONTENT_TYPE | null;
  route: string | null;
  previewRows: boolean;
  issueSummary: boolean;
  preflightDiagnostics: boolean;
  readinessSummary: boolean;
  actionSummary: boolean;
  template: {
    supported: boolean;
    filename: string | null;
    contentType: typeof CSV_IMPORT_TEMPLATE_CONTENT_TYPE | null;
    headers: readonly string[];
    requiredFieldKeys: readonly string[];
    requiredHeaders: readonly string[];
    example: CsvCompatibilityImportTemplateExample | null;
  };
};

export type CsvCompatibilityTransferManifestCoverage = {
  exportDelivery: {
    supportedDirection: boolean;
    covered: boolean;
    manifestFilename: string | null;
    contentType: typeof CSV_TRANSFER_MANIFEST_CONTENT_TYPE | null;
  };
  importDryRun: {
    supportedDirection: boolean;
    covered: boolean;
    manifestFilename: string | null;
    contentType: typeof CSV_TRANSFER_MANIFEST_CONTENT_TYPE | null;
  };
};

export type CsvCompatibilityReadFlags = {
  metadata: true;
  database: false;
  csvInput: false;
  csvOutput: false;
};

export type CsvCompatibilityWriteFlags = {
  database: false;
  files: false;
  externalServices: false;
  exportHistory: false;
  scheduledDelivery: false;
  backgroundJobs: false;
  routingAssignments: false;
  importApply: false;
  bulkMutations: false;
  headerRemapping: false;
  salesforceSync: false;
};

export type CsvCompatibilityReport = {
  entity: CsvCompatibilityReportEntity;
  label: string;
  direction: CsvCompatibilityDirection;
  contentType: typeof CSV_COMPATIBILITY_REPORT_CONTENT_TYPE;
  export: CsvCompatibilityExportSurface;
  import: CsvCompatibilityImportSurface;
  fields: CsvCompatibilityFieldComparison;
  transferManifests: CsvCompatibilityTransferManifestCoverage;
  warnings: readonly CsvCompatibilityWarning[];
  read: CsvCompatibilityReadFlags;
  write: CsvCompatibilityWriteFlags;
};

const csvExportEntityIds: ReadonlySet<string> = new Set(CSV_EXPORT_ENTITIES);
const csvImportPreviewEntityIds: ReadonlySet<string> = new Set(
  CSV_IMPORT_PREVIEW_ENTITIES
);

function noWrites(): CsvCompatibilityWriteFlags {
  return {
    database: false,
    files: false,
    externalServices: false,
    exportHistory: false,
    scheduledDelivery: false,
    backgroundJobs: false,
    routingAssignments: false,
    importApply: false,
    bulkMutations: false,
    headerRemapping: false,
    salesforceSync: false
  };
}

function metadataOnlyReads(): CsvCompatibilityReadFlags {
  return {
    metadata: true,
    database: false,
    csvInput: false,
    csvOutput: false
  };
}

function listImportOnlyEntities(): CsvImportPreviewEntity[] {
  return CSV_IMPORT_PREVIEW_ENTITIES.filter(
    (entity) => !csvExportEntityIds.has(entity)
  );
}

function getExportDefinitionOrNull(
  entity: CsvCompatibilityReportEntity
): CsvExportDefinition | null {
  return isCsvExportEntity(entity) ? getCsvExportDefinition(entity) : null;
}

function getImportDefinitionOrNull(
  entity: CsvCompatibilityReportEntity
): CsvImportPreviewDefinition | null {
  return isCsvImportPreviewEntity(entity)
    ? getCsvImportPreviewDefinition(entity)
    : null;
}

function getImportTemplateOrNull(
  entity: CsvCompatibilityReportEntity
): CsvImportTemplate | null {
  return isCsvImportPreviewEntity(entity) ? getCsvImportTemplate(entity) : null;
}

function getImportTemplateExampleOrNull(
  entity: CsvCompatibilityReportEntity
): CsvImportTemplateExampleCsv | null {
  return isCsvImportPreviewEntity(entity)
    ? exportCsvImportTemplateExampleCsv(entity)
    : null;
}

function getExportCapabilityOrNull(
  entity: CsvCompatibilityReportEntity
): CsvCapability | null {
  return isCsvExportEntity(entity) ? getCsvCapability("export", entity) : null;
}

function getImportCapabilityOrNull(
  entity: CsvCompatibilityReportEntity
): CsvCapability | null {
  return isCsvImportPreviewEntity(entity)
    ? getCsvCapability("import-preview", entity)
    : null;
}

function getImportPreflightCapabilityOrNull(
  entity: CsvCompatibilityReportEntity
): CsvCapability | null {
  return isCsvImportPreviewEntity(entity)
    ? getCsvCapability("import-preflight", entity)
    : null;
}

function getDirection(
  exportDefinition: CsvExportDefinition | null,
  importDefinition: CsvImportPreviewDefinition | null
): CsvCompatibilityDirection {
  if (exportDefinition !== null && importDefinition !== null) {
    return "bidirectional";
  }

  return exportDefinition !== null ? "export-only" : "import-only";
}

function fieldFromExportColumn(
  column: CsvExportColumnContract
): CsvCompatibilityField {
  return {
    key: column.key,
    header: column.label,
    requiredForImport: false
  };
}

function fieldFromImportField(
  field: CsvImportPreviewField
): CsvCompatibilityField {
  return {
    key: field.key,
    header: field.label,
    requiredForImport: field.required
  };
}

function compareFields(
  exportDefinition: CsvExportDefinition | null,
  importDefinition: CsvImportPreviewDefinition | null
): CsvCompatibilityFieldComparison {
  const exportColumns = exportDefinition?.columns ?? [];
  const importFields = importDefinition?.fields ?? [];
  const exportFieldKeys = new Set(exportColumns.map((column) => column.key));
  const importFieldKeys = new Set(importFields.map((field) => field.key));

  return {
    matchingFieldKeys: exportColumns
      .map((column) => column.key)
      .filter((key) => importFieldKeys.has(key)),
    exportOnlyFields: exportColumns
      .filter((column) => !importFieldKeys.has(column.key))
      .map(fieldFromExportColumn),
    importOnlyFields: importFields
      .filter((field) => !exportFieldKeys.has(field.key))
      .map(fieldFromImportField)
  };
}

function buildExportSurface(
  definition: CsvExportDefinition | null,
  capability: CsvCapability | null
): CsvCompatibilityExportSurface {
  return {
    supported: definition !== null,
    filename: definition?.filename ?? null,
    contentType: definition === null ? null : CSV_EXPORT_CONTENT_TYPE,
    route: definition?.route ?? null,
    canonicalHeaders: definition?.columns.map((column) => column.label) ?? [],
    fieldKeys: definition?.columns.map((column) => column.key) ?? [],
    previewRows: capability?.preview.rows ?? false,
    previewCsvSnippet: capability?.preview.csvSnippet ?? false
  };
}

function buildImportTemplateExample(
  example: CsvImportTemplateExampleCsv | null
): CsvCompatibilityImportTemplateExample | null {
  if (example === null) {
    return null;
  }

  return {
    filename: example.filename,
    templateFilename: example.templateFilename,
    rowCount: example.rowCount,
    fieldKeys: example.fields.map((field) => field.key),
    values: example.exampleRow.values
  };
}

function buildImportSurface(
  definition: CsvImportPreviewDefinition | null,
  template: CsvImportTemplate | null,
  example: CsvImportTemplateExampleCsv | null,
  previewCapability: CsvCapability | null,
  preflightCapability: CsvCapability | null
): CsvCompatibilityImportSurface {
  return {
    supported: definition !== null,
    inputContentType: definition === null ? null : CSV_IMPORT_TEMPLATE_CONTENT_TYPE,
    route: definition?.route ?? null,
    previewRows: previewCapability?.preview.rows ?? false,
    issueSummary: previewCapability?.preview.issueSummary ?? false,
    preflightDiagnostics: preflightCapability?.preview.diagnostics ?? false,
    readinessSummary: preflightCapability?.preview.readinessSummary ?? false,
    actionSummary: preflightCapability?.preview.actionSummary ?? false,
    template: {
      supported: template !== null,
      filename: template?.filename ?? null,
      contentType: template?.contentType ?? null,
      headers: template?.headers ?? [],
      requiredFieldKeys:
        template?.fields
          .filter((field) => field.required)
          .map((field) => field.key) ?? [],
      requiredHeaders: template?.requiredHeaders ?? [],
      example: buildImportTemplateExample(example)
    }
  };
}

function manifestCoverage(
  supportedDirection: boolean,
  definition: CsvTransferManifestDefinition | null
) {
  return {
    supportedDirection,
    covered: definition !== null,
    manifestFilename: definition?.filenames.manifest ?? null,
    contentType: definition?.contentTypes.manifest ?? null
  };
}

function buildTransferManifestCoverage(
  exportDefinition: CsvExportDefinition | null,
  importDefinition: CsvImportPreviewDefinition | null
): CsvCompatibilityTransferManifestCoverage {
  const exportManifest =
    exportDefinition === null
      ? null
      : getCsvTransferManifestDefinition("export-delivery", exportDefinition.entity);
  const importManifest =
    importDefinition === null
      ? null
      : getCsvTransferManifestDefinition("import-dry-run", importDefinition.entity);

  return {
    exportDelivery: manifestCoverage(exportDefinition !== null, exportManifest),
    importDryRun: manifestCoverage(importDefinition !== null, importManifest)
  };
}

function warning(
  code: CsvCompatibilityWarningCode,
  severity: "info" | "warning",
  message: string,
  fields: readonly CsvCompatibilityField[] = []
): CsvCompatibilityWarning {
  return {
    code,
    severity,
    message,
    fieldKeys: fields.map((field) => field.key),
    fieldHeaders: fields.map((field) => field.header)
  };
}

function buildWarnings(input: {
  label: string;
  direction: CsvCompatibilityDirection;
  fields: CsvCompatibilityFieldComparison;
  transferManifests: CsvCompatibilityTransferManifestCoverage;
}): CsvCompatibilityWarning[] {
  const warnings: CsvCompatibilityWarning[] = [];

  if (input.direction === "export-only") {
    warnings.push(
      warning(
        "unsupported-import-direction",
        "warning",
        `${input.label} supports CSV export metadata, but no import preview, template, or dry-run surface is supported.`
      )
    );
  }

  if (input.direction === "import-only") {
    warnings.push(
      warning(
        "unsupported-export-direction",
        "warning",
        `${input.label} supports CSV import metadata, but no export delivery surface is supported.`
      )
    );
  }

  if (input.fields.exportOnlyFields.length > 0) {
    warnings.push(
      warning(
        "export-field-only",
        "info",
        `${input.label} export includes fields that the import template does not accept.`,
        input.fields.exportOnlyFields
      )
    );
  }

  if (input.fields.importOnlyFields.length > 0) {
    warnings.push(
      warning(
        "import-field-only",
        "info",
        `${input.label} import template includes fields that the export does not emit.`,
        input.fields.importOnlyFields
      )
    );
  }

  if (
    input.transferManifests.exportDelivery.supportedDirection &&
    !input.transferManifests.exportDelivery.covered
  ) {
    warnings.push(
      warning(
        "missing-export-transfer-manifest",
        "warning",
        `${input.label} supports export delivery but has no export transfer manifest definition.`
      )
    );
  }

  if (
    input.transferManifests.importDryRun.supportedDirection &&
    !input.transferManifests.importDryRun.covered
  ) {
    warnings.push(
      warning(
        "missing-import-transfer-manifest",
        "warning",
        `${input.label} supports import dry-run but has no import transfer manifest definition.`
      )
    );
  }

  return warnings;
}

export function listCsvCompatibilityReportEntities(): CsvCompatibilityReportEntity[] {
  return [...CSV_EXPORT_ENTITIES, ...listImportOnlyEntities()];
}

export function isCsvCompatibilityReportEntity(
  value: string
): value is CsvCompatibilityReportEntity {
  return csvExportEntityIds.has(value) || csvImportPreviewEntityIds.has(value);
}

export function getCsvCompatibilityReport(
  entity: string
): CsvCompatibilityReport | null {
  if (!isCsvCompatibilityReportEntity(entity)) {
    return null;
  }

  const exportDefinition = getExportDefinitionOrNull(entity);
  const importDefinition = getImportDefinitionOrNull(entity);
  const direction = getDirection(exportDefinition, importDefinition);
  const label = exportDefinition?.label ?? importDefinition?.label ?? entity;
  const fields = compareFields(exportDefinition, importDefinition);
  const transferManifests = buildTransferManifestCoverage(
    exportDefinition,
    importDefinition
  );

  return {
    entity,
    label,
    direction,
    contentType: CSV_COMPATIBILITY_REPORT_CONTENT_TYPE,
    export: buildExportSurface(
      exportDefinition,
      getExportCapabilityOrNull(entity)
    ),
    import: buildImportSurface(
      importDefinition,
      getImportTemplateOrNull(entity),
      getImportTemplateExampleOrNull(entity),
      getImportCapabilityOrNull(entity),
      getImportPreflightCapabilityOrNull(entity)
    ),
    fields,
    transferManifests,
    warnings: buildWarnings({
      label,
      direction,
      fields,
      transferManifests
    }),
    read: metadataOnlyReads(),
    write: noWrites()
  };
}

export function listCsvCompatibilityReports(): CsvCompatibilityReport[] {
  return listCsvCompatibilityReportEntities().map((entity) => {
    const report = getCsvCompatibilityReport(entity);

    if (report === null) {
      throw new Error(`Missing CSV compatibility report for ${entity}`);
    }

    return report;
  });
}

export function listCsvBidirectionalCompatibilityReports(): CsvCompatibilityReport[] {
  return listCsvCompatibilityReports().filter(
    (report) => report.direction === "bidirectional"
  );
}
