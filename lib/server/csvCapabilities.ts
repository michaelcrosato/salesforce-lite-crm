import {
  CSV_EXPORT_CONTENT_TYPE,
  listCsvExportDefinitions,
  type CsvExportEntity
} from "@/lib/server/csvExport";
import {
  listCsvImportPreviewDefinitions,
  type CsvImportPreviewDefinition,
  type CsvImportPreviewEntity,
  type CsvImportPreviewField
} from "@/lib/server/csvImportPreview";
import {
  CSV_IMPORT_TEMPLATE_CONTENT_TYPE,
  listCsvImportTemplates,
  type CsvImportTemplate
} from "@/lib/server/csvImportTemplates";

export const CSV_CAPABILITY_OPERATIONS = [
  "export",
  "import-preview",
  "import-template",
  "import-preflight"
] as const;

export type CsvCapabilityOperation = (typeof CSV_CAPABILITY_OPERATIONS)[number];
export type CsvCapabilityEntity = CsvExportEntity | CsvImportPreviewEntity;

export type CsvCapabilityReadFlags = {
  metadata: true;
  database: boolean;
  csvInput: boolean;
};

export type CsvCapabilityWriteFlags = {
  database: false;
  files: false;
  externalServices: false;
  routingAssignments: false;
};

export type CsvCapability = {
  operation: CsvCapabilityOperation;
  entity: CsvCapabilityEntity;
  label: string;
  route: string;
  filename: string | null;
  inputContentType: typeof CSV_IMPORT_TEMPLATE_CONTENT_TYPE | null;
  outputContentType:
    | typeof CSV_EXPORT_CONTENT_TYPE
    | typeof CSV_IMPORT_TEMPLATE_CONTENT_TYPE
    | null;
  acceptsCsvInput: boolean;
  returnsCsv: boolean;
  canonicalHeaders: readonly string[];
  requiredImportFields: readonly string[];
  requiredImportHeaders: readonly string[];
  read: CsvCapabilityReadFlags;
  write: CsvCapabilityWriteFlags;
};

function readFlags(database: boolean, csvInput: boolean): CsvCapabilityReadFlags {
  return {
    metadata: true,
    database,
    csvInput
  };
}

function noWrites(): CsvCapabilityWriteFlags {
  return {
    database: false,
    files: false,
    externalServices: false,
    routingAssignments: false
  };
}

function headersFromFields(fields: readonly CsvImportPreviewField[]): string[] {
  return fields.map((field) => field.label);
}

function requiredFieldKeys(fields: readonly CsvImportPreviewField[]): string[] {
  return fields
    .filter((field) => field.required)
    .map((field) => field.key);
}

function requiredFieldHeaders(fields: readonly CsvImportPreviewField[]): string[] {
  return fields
    .filter((field) => field.required)
    .map((field) => field.label);
}

function buildImportPreviewCapability(
  definition: CsvImportPreviewDefinition
): CsvCapability {
  return {
    operation: "import-preview",
    entity: definition.entity,
    label: definition.label,
    route: definition.route,
    filename: null,
    inputContentType: CSV_IMPORT_TEMPLATE_CONTENT_TYPE,
    outputContentType: null,
    acceptsCsvInput: true,
    returnsCsv: false,
    canonicalHeaders: headersFromFields(definition.fields),
    requiredImportFields: requiredFieldKeys(definition.fields),
    requiredImportHeaders: requiredFieldHeaders(definition.fields),
    read: readFlags(false, true),
    write: noWrites()
  };
}

function buildImportTemplateCapability(template: CsvImportTemplate): CsvCapability {
  return {
    operation: "import-template",
    entity: template.entity,
    label: template.label,
    route: template.route,
    filename: template.filename,
    inputContentType: null,
    outputContentType: template.contentType,
    acceptsCsvInput: false,
    returnsCsv: true,
    canonicalHeaders: [...template.headers],
    requiredImportFields: requiredFieldKeys(template.fields),
    requiredImportHeaders: [...template.requiredHeaders],
    read: readFlags(false, false),
    write: noWrites()
  };
}

function buildImportPreflightCapability(
  definition: CsvImportPreviewDefinition
): CsvCapability {
  return {
    operation: "import-preflight",
    entity: definition.entity,
    label: definition.label,
    route: definition.route,
    filename: null,
    inputContentType: CSV_IMPORT_TEMPLATE_CONTENT_TYPE,
    outputContentType: null,
    acceptsCsvInput: true,
    returnsCsv: false,
    canonicalHeaders: headersFromFields(definition.fields),
    requiredImportFields: requiredFieldKeys(definition.fields),
    requiredImportHeaders: requiredFieldHeaders(definition.fields),
    read: readFlags(true, true),
    write: noWrites()
  };
}

export function listCsvCapabilities(): CsvCapability[] {
  const exportCapabilities = listCsvExportDefinitions().map((definition): CsvCapability => ({
    operation: "export",
    entity: definition.entity,
    label: definition.label,
    route: definition.route,
    filename: definition.filename,
    inputContentType: null,
    outputContentType: CSV_EXPORT_CONTENT_TYPE,
    acceptsCsvInput: false,
    returnsCsv: true,
    canonicalHeaders: definition.columns.map((column) => column.label),
    requiredImportFields: [],
    requiredImportHeaders: [],
    read: readFlags(true, false),
    write: noWrites()
  }));
  const previewDefinitions = listCsvImportPreviewDefinitions();

  return [
    ...exportCapabilities,
    ...previewDefinitions.map(buildImportPreviewCapability),
    ...listCsvImportTemplates().map(buildImportTemplateCapability),
    ...previewDefinitions.map(buildImportPreflightCapability)
  ];
}

export function listCsvCapabilitiesByOperation(
  operation: CsvCapabilityOperation
): CsvCapability[] {
  return listCsvCapabilities().filter((capability) => capability.operation === operation);
}

export function getCsvCapability(
  operation: CsvCapabilityOperation,
  entity: CsvCapabilityEntity
): CsvCapability | null {
  return (
    listCsvCapabilities().find(
      (capability) => capability.operation === operation && capability.entity === entity
    ) ?? null
  );
}
