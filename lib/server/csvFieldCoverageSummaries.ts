import {
  CSV_CAPABILITY_OPERATIONS,
  type CsvCapabilityOperation
} from "@/lib/server/csvCapabilities";
import {
  CSV_COMPATIBILITY_REPORT_CONTENT_TYPE,
  getCsvCompatibilityReport,
  isCsvCompatibilityReportEntity,
  listCsvCompatibilityReportEntities,
  type CsvCompatibilityDirection,
  type CsvCompatibilityField,
  type CsvCompatibilityReport,
  type CsvCompatibilityReportEntity,
  type CsvCompatibilityWarning,
  type CsvCompatibilityWarningCode
} from "@/lib/server/csvCompatibilityReports";

export const CSV_FIELD_COVERAGE_SUMMARY_CONTENT_TYPE =
  "application/json; charset=utf-8" as const;

export type CsvFieldCoverageEntity = CsvCompatibilityReportEntity;
export type CsvFieldCoverageOperation = CsvCapabilityOperation;

export type CsvFieldCoverageCounts = {
  exportOnly: number;
  importOnly: number;
  shared: number;
  required: number;
  optional: number;
  unsupported: number;
  warnings: number;
};

export type CsvFieldCoverageReadFlags = {
  metadata: true;
  database: false;
  csvInput: false;
  csvOutput: false;
};

export type CsvFieldCoverageWriteFlags = {
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

export type CsvFieldCoverageFieldCategory =
  | "shared"
  | "export-only"
  | "import-only";

export type CsvFieldCoverageField = {
  key: string;
  header: string;
  requiredForImport: boolean;
  category: CsvFieldCoverageFieldCategory;
};

export type CsvFieldCoverageFields = {
  shared: readonly CsvFieldCoverageField[];
  exportOnly: readonly CsvFieldCoverageField[];
  importOnly: readonly CsvFieldCoverageField[];
  required: readonly CsvFieldCoverageField[];
  optional: readonly CsvFieldCoverageField[];
};

export type CsvFieldCoverageEntityOperation = {
  operation: CsvFieldCoverageOperation;
  entity: CsvFieldCoverageEntity;
  label: string;
  route: string | null;
  supported: boolean;
  fieldKeys: readonly string[];
  headers: readonly string[];
  counts: CsvFieldCoverageCounts;
  warningCodes: readonly CsvCompatibilityWarningCode[];
  read: CsvFieldCoverageReadFlags;
  write: CsvFieldCoverageWriteFlags;
};

export type CsvFieldCoverageEntitySummary = {
  entity: CsvFieldCoverageEntity;
  label: string;
  route: string | null;
  direction: CsvCompatibilityDirection;
  contentType: typeof CSV_FIELD_COVERAGE_SUMMARY_CONTENT_TYPE;
  sourceContentType: typeof CSV_COMPATIBILITY_REPORT_CONTENT_TYPE;
  counts: CsvFieldCoverageCounts;
  fields: CsvFieldCoverageFields;
  operations: readonly CsvFieldCoverageEntityOperation[];
  warningCodes: readonly CsvCompatibilityWarningCode[];
  read: CsvFieldCoverageReadFlags;
  write: CsvFieldCoverageWriteFlags;
};

export type CsvFieldCoverageOperationAggregate = {
  operation: CsvFieldCoverageOperation;
  entityCount: number;
  supportedEntityCount: number;
  unsupportedEntityCount: number;
  counts: CsvFieldCoverageCounts;
  read: CsvFieldCoverageReadFlags;
  write: CsvFieldCoverageWriteFlags;
};

export type CsvFieldCoverageSummary = {
  contentType: typeof CSV_FIELD_COVERAGE_SUMMARY_CONTENT_TYPE;
  entityCount: number;
  operationCount: number;
  entries: readonly CsvFieldCoverageEntitySummary[];
  operations: readonly CsvFieldCoverageOperationAggregate[];
  read: CsvFieldCoverageReadFlags;
  write: CsvFieldCoverageWriteFlags;
};

const warningCodesByOperation: Record<
  CsvFieldCoverageOperation,
  readonly CsvCompatibilityWarningCode[]
> = {
  export: [
    "unsupported-export-direction",
    "export-field-only",
    "missing-export-transfer-manifest"
  ],
  "import-preview": [
    "unsupported-import-direction",
    "import-field-only",
    "missing-import-transfer-manifest"
  ],
  "import-template": [
    "unsupported-import-direction",
    "import-field-only",
    "missing-import-transfer-manifest"
  ],
  "import-preflight": [
    "unsupported-import-direction",
    "import-field-only",
    "missing-import-transfer-manifest"
  ]
};

function noWrites(): CsvFieldCoverageWriteFlags {
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

function metadataOnlyReads(): CsvFieldCoverageReadFlags {
  return {
    metadata: true,
    database: false,
    csvInput: false,
    csvOutput: false
  };
}

function zeroCounts(): CsvFieldCoverageCounts {
  return {
    exportOnly: 0,
    importOnly: 0,
    shared: 0,
    required: 0,
    optional: 0,
    unsupported: 0,
    warnings: 0
  };
}

function addCounts(
  left: CsvFieldCoverageCounts,
  right: CsvFieldCoverageCounts
): CsvFieldCoverageCounts {
  return {
    exportOnly: left.exportOnly + right.exportOnly,
    importOnly: left.importOnly + right.importOnly,
    shared: left.shared + right.shared,
    required: left.required + right.required,
    optional: left.optional + right.optional,
    unsupported: left.unsupported + right.unsupported,
    warnings: left.warnings + right.warnings
  };
}

function routeForReport(report: CsvCompatibilityReport): string | null {
  return report.export.route ?? report.import.route;
}

function mapHeaders(
  fieldKeys: readonly string[],
  headers: readonly string[]
): ReadonlyMap<string, string> {
  return new Map(
    fieldKeys.map((fieldKey, index) => [fieldKey, headers[index] ?? fieldKey])
  );
}

function importFieldKeys(report: CsvCompatibilityReport): readonly string[] {
  return report.import.template.example?.fieldKeys ?? [];
}

function importFieldHeaders(report: CsvCompatibilityReport): readonly string[] {
  return report.import.template.headers;
}

function exportHeaderMap(report: CsvCompatibilityReport): ReadonlyMap<string, string> {
  return mapHeaders(report.export.fieldKeys, report.export.canonicalHeaders);
}

function importHeaderMap(report: CsvCompatibilityReport): ReadonlyMap<string, string> {
  return mapHeaders(importFieldKeys(report), importFieldHeaders(report));
}

function fieldFromCompatibilityField(
  field: CsvCompatibilityField,
  category: Exclude<CsvFieldCoverageFieldCategory, "shared">
): CsvFieldCoverageField {
  return {
    key: field.key,
    header: field.header,
    requiredForImport: field.requiredForImport,
    category
  };
}

function buildSharedFields(report: CsvCompatibilityReport): CsvFieldCoverageField[] {
  const exportHeaders = exportHeaderMap(report);
  const importHeaders = importHeaderMap(report);
  const requiredKeys = new Set(report.import.template.requiredFieldKeys);

  return report.fields.matchingFieldKeys.map((fieldKey) => ({
    key: fieldKey,
    header: exportHeaders.get(fieldKey) ?? importHeaders.get(fieldKey) ?? fieldKey,
    requiredForImport: requiredKeys.has(fieldKey),
    category: "shared"
  }));
}

function buildImportFields(report: CsvCompatibilityReport): CsvFieldCoverageField[] {
  const headers = importHeaderMap(report);
  const sharedKeys = new Set(report.fields.matchingFieldKeys);
  const requiredKeys = new Set(report.import.template.requiredFieldKeys);

  return importFieldKeys(report).map((fieldKey) => ({
    key: fieldKey,
    header: headers.get(fieldKey) ?? fieldKey,
    requiredForImport: requiredKeys.has(fieldKey),
    category: sharedKeys.has(fieldKey) ? "shared" : "import-only"
  }));
}

function buildFields(report: CsvCompatibilityReport): CsvFieldCoverageFields {
  const importFields = buildImportFields(report);

  return {
    shared: buildSharedFields(report),
    exportOnly: report.fields.exportOnlyFields.map((field) =>
      fieldFromCompatibilityField(field, "export-only")
    ),
    importOnly: report.fields.importOnlyFields.map((field) =>
      fieldFromCompatibilityField(field, "import-only")
    ),
    required: importFields.filter((field) => field.requiredForImport),
    optional: importFields.filter((field) => !field.requiredForImport)
  };
}

function isOperationSupported(
  report: CsvCompatibilityReport,
  operation: CsvFieldCoverageOperation
): boolean {
  switch (operation) {
    case "export":
      return report.export.supported;
    case "import-preview":
      return report.import.previewRows;
    case "import-template":
      return report.import.template.supported;
    case "import-preflight":
      return (
        report.import.preflightDiagnostics ||
        report.import.readinessSummary ||
        report.import.actionSummary
      );
  }
}

function operationWarnings(
  warnings: readonly CsvCompatibilityWarning[],
  operation: CsvFieldCoverageOperation
): CsvCompatibilityWarning[] {
  const operationCodes = warningCodesByOperation[operation];

  return warnings.filter((warning) => operationCodes.includes(warning.code));
}

function operationFieldKeys(
  report: CsvCompatibilityReport,
  operation: CsvFieldCoverageOperation,
  supported: boolean
): readonly string[] {
  if (!supported) {
    return [];
  }

  return operation === "export" ? report.export.fieldKeys : importFieldKeys(report);
}

function operationHeaders(
  report: CsvCompatibilityReport,
  operation: CsvFieldCoverageOperation,
  supported: boolean
): readonly string[] {
  if (!supported) {
    return [];
  }

  return operation === "export"
    ? report.export.canonicalHeaders
    : importFieldHeaders(report);
}

function operationCounts(
  report: CsvCompatibilityReport,
  operation: CsvFieldCoverageOperation,
  supported: boolean,
  warnings: readonly CsvCompatibilityWarning[]
): CsvFieldCoverageCounts {
  if (!supported) {
    return {
      ...zeroCounts(),
      unsupported: 1,
      warnings: warnings.length
    };
  }

  if (operation === "export") {
    return {
      ...zeroCounts(),
      exportOnly: report.fields.exportOnlyFields.length,
      shared: report.fields.matchingFieldKeys.length,
      warnings: warnings.length
    };
  }

  const requiredCount = report.import.template.requiredFieldKeys.length;
  const importFieldCount = importFieldKeys(report).length;

  return {
    ...zeroCounts(),
    importOnly: report.fields.importOnlyFields.length,
    shared: report.fields.matchingFieldKeys.length,
    required: requiredCount,
    optional: importFieldCount - requiredCount,
    warnings: warnings.length
  };
}

function buildEntityOperation(
  report: CsvCompatibilityReport,
  operation: CsvFieldCoverageOperation
): CsvFieldCoverageEntityOperation {
  const supported = isOperationSupported(report, operation);
  const warnings = operationWarnings(report.warnings, operation);

  return {
    operation,
    entity: report.entity,
    label: report.label,
    route: routeForReport(report),
    supported,
    fieldKeys: operationFieldKeys(report, operation, supported),
    headers: operationHeaders(report, operation, supported),
    counts: operationCounts(report, operation, supported, warnings),
    warningCodes: warnings.map((warning) => warning.code),
    read: metadataOnlyReads(),
    write: noWrites()
  };
}

function entityCounts(
  report: CsvCompatibilityReport,
  operations: readonly CsvFieldCoverageEntityOperation[]
): CsvFieldCoverageCounts {
  return {
    exportOnly: report.fields.exportOnlyFields.length,
    importOnly: report.fields.importOnlyFields.length,
    shared: report.fields.matchingFieldKeys.length,
    required: report.import.template.requiredFieldKeys.length,
    optional:
      importFieldKeys(report).length - report.import.template.requiredFieldKeys.length,
    unsupported: operations.filter((operation) => !operation.supported).length,
    warnings: report.warnings.length
  };
}

function buildEntitySummary(
  report: CsvCompatibilityReport
): CsvFieldCoverageEntitySummary {
  const operations = CSV_CAPABILITY_OPERATIONS.map((operation) =>
    buildEntityOperation(report, operation)
  );

  return {
    entity: report.entity,
    label: report.label,
    route: routeForReport(report),
    direction: report.direction,
    contentType: CSV_FIELD_COVERAGE_SUMMARY_CONTENT_TYPE,
    sourceContentType: CSV_COMPATIBILITY_REPORT_CONTENT_TYPE,
    counts: entityCounts(report, operations),
    fields: buildFields(report),
    operations,
    warningCodes: report.warnings.map((warning) => warning.code),
    read: metadataOnlyReads(),
    write: noWrites()
  };
}

function buildOperationAggregate(
  operation: CsvFieldCoverageOperation,
  entries: readonly CsvFieldCoverageEntitySummary[]
): CsvFieldCoverageOperationAggregate {
  const operationSummaries = entries.map((entry) => {
    const summary = entry.operations.find(
      (candidate) => candidate.operation === operation
    );

    if (summary === undefined) {
      throw new Error(`Missing CSV field coverage operation ${operation}`);
    }

    return summary;
  });
  const counts = operationSummaries.reduce(
    (current, summary) => addCounts(current, summary.counts),
    zeroCounts()
  );

  return {
    operation,
    entityCount: operationSummaries.length,
    supportedEntityCount: operationSummaries.filter((summary) => summary.supported)
      .length,
    unsupportedEntityCount: operationSummaries.filter(
      (summary) => !summary.supported
    ).length,
    counts,
    read: metadataOnlyReads(),
    write: noWrites()
  };
}

export function isCsvFieldCoverageEntity(
  value: string
): value is CsvFieldCoverageEntity {
  return isCsvCompatibilityReportEntity(value);
}

export function listCsvFieldCoverageEntities(): CsvFieldCoverageEntity[] {
  return listCsvCompatibilityReportEntities();
}

export function getCsvFieldCoverageEntitySummary(
  entity: string
): CsvFieldCoverageEntitySummary | null {
  if (!isCsvFieldCoverageEntity(entity)) {
    return null;
  }

  const report = getCsvCompatibilityReport(entity);

  return report === null ? null : buildEntitySummary(report);
}

export function listCsvFieldCoverageEntitySummaries(): CsvFieldCoverageEntitySummary[] {
  return listCsvFieldCoverageEntities().map((entity) => {
    const summary = getCsvFieldCoverageEntitySummary(entity);

    if (summary === null) {
      throw new Error(`Missing CSV field coverage summary for ${entity}`);
    }

    return summary;
  });
}

export function listCsvFieldCoverageOperationSummaries(
  operation: CsvFieldCoverageOperation
): CsvFieldCoverageEntityOperation[] {
  return listCsvFieldCoverageEntitySummaries().map((entry) => {
    const summary = entry.operations.find(
      (candidate) => candidate.operation === operation
    );

    if (summary === undefined) {
      throw new Error(`Missing CSV field coverage operation ${operation}`);
    }

    return summary;
  });
}

export function listCsvFieldCoverageOperationAggregates(): CsvFieldCoverageOperationAggregate[] {
  const entries = listCsvFieldCoverageEntitySummaries();

  return CSV_CAPABILITY_OPERATIONS.map((operation) =>
    buildOperationAggregate(operation, entries)
  );
}

export function getCsvFieldCoverageSummary(): CsvFieldCoverageSummary {
  const entries = listCsvFieldCoverageEntitySummaries();

  return {
    contentType: CSV_FIELD_COVERAGE_SUMMARY_CONTENT_TYPE,
    entityCount: entries.length,
    operationCount: CSV_CAPABILITY_OPERATIONS.length,
    entries,
    operations: CSV_CAPABILITY_OPERATIONS.map((operation) =>
      buildOperationAggregate(operation, entries)
    ),
    read: metadataOnlyReads(),
    write: noWrites()
  };
}
