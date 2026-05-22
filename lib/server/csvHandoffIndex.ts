import {
  CSV_CAPABILITY_OPERATIONS,
  getCsvCapability,
  type CsvCapability,
  type CsvCapabilityOperation
} from "@/lib/server/csvCapabilities";
import {
  CSV_COMPATIBILITY_REPORT_CONTENT_TYPE,
  getCsvCompatibilityReport,
  isCsvCompatibilityReportEntity,
  listCsvCompatibilityReportEntities,
  type CsvCompatibilityDirection,
  type CsvCompatibilityReport,
  type CsvCompatibilityReportEntity,
  type CsvCompatibilityWarningCode
} from "@/lib/server/csvCompatibilityReports";
import {
  isCsvExportEntity,
  type CsvExportEntity
} from "@/lib/server/csvExport";
import {
  getCsvExportDeliveryPacketDefinition
} from "@/lib/server/csvExportDeliveryPackets";
import {
  isCsvImportPreviewEntity,
  type CsvImportPreviewEntity
} from "@/lib/server/csvImportPreview";
import {
  getCsvImportDryRunReceiptDefinition
} from "@/lib/server/csvImportDryRunReceipts";
import {
  CSV_IMPORT_TEMPLATE_CONTENT_TYPE,
  exportCsvImportTemplateExampleCsv,
  getCsvImportTemplate,
  type CsvImportTemplate,
  type CsvImportTemplateExampleCsv
} from "@/lib/server/csvImportTemplates";
import {
  CSV_TRANSFER_MANIFEST_OPERATIONS,
  getCsvTransferManifestDefinition,
  type CsvTransferManifestDefinition,
  type CsvTransferManifestOperation
} from "@/lib/server/csvTransferManifests";

export const CSV_HANDOFF_INDEX_CONTENT_TYPE =
  "application/json; charset=utf-8" as const;

export const CSV_HANDOFF_PACKET_SURFACES = [
  "export-delivery-packet",
  "import-dry-run-receipt"
] as const;

export type CsvHandoffPacketSurface =
  (typeof CSV_HANDOFF_PACKET_SURFACES)[number];

export type CsvHandoffIndexEntity = CsvCompatibilityReportEntity;

export type CsvHandoffSurfaceKind =
  | "compatibility-report"
  | "export-capability"
  | "import-preview-capability"
  | "import-template-capability"
  | "import-preflight-capability"
  | "import-template"
  | "import-template-example"
  | CsvHandoffPacketSurface
  | "export-delivery-manifest"
  | "import-dry-run-manifest";

export type CsvHandoffReadFlags = {
  metadata: true;
  database: boolean;
  csvInput: boolean;
  csvOutput: boolean;
};

export type CsvHandoffNoWriteFlags = {
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

export type CsvHandoffIndexSurface = {
  kind: CsvHandoffSurfaceKind;
  operation: string;
  route: string | null;
  filename: string | null;
  manifestFilename: string | null;
  templateFilename: string | null;
  contentType: string | null;
  inputContentType: string | null;
  outputContentType: string | null;
  acceptsCsvInput: boolean;
  returnsCsv: boolean;
  canonicalHeaders: readonly string[];
  requiredImportFields: readonly string[];
  requiredImportHeaders: readonly string[];
  read: CsvHandoffReadFlags;
  write: CsvHandoffNoWriteFlags;
};

export type CsvHandoffCapabilitySupport = {
  export: boolean;
  importPreview: boolean;
  importTemplate: boolean;
  importPreflight: boolean;
};

export type CsvHandoffTemplateSummary = {
  supported: boolean;
  filename: string | null;
  exampleFilename: string | null;
  requiredFieldKeys: readonly string[];
  requiredHeaders: readonly string[];
};

export type CsvHandoffTransferSummary = {
  exportDeliveryManifestFilename: string | null;
  importDryRunManifestFilename: string | null;
};

export type CsvHandoffPacketSummary = {
  exportDeliveryPacket: boolean;
  importDryRunReceipt: boolean;
};

export type CsvHandoffCompatibilitySummary = {
  contentType: typeof CSV_COMPATIBILITY_REPORT_CONTENT_TYPE;
  direction: CsvCompatibilityDirection;
  warningCount: number;
  warningCodes: readonly CsvCompatibilityWarningCode[];
};

export type CsvHandoffIndexEntry = {
  entity: CsvHandoffIndexEntity;
  label: string;
  route: string | null;
  direction: CsvCompatibilityDirection;
  capabilities: CsvHandoffCapabilitySupport;
  template: CsvHandoffTemplateSummary;
  transferManifests: CsvHandoffTransferSummary;
  packets: CsvHandoffPacketSummary;
  compatibilityReport: CsvHandoffCompatibilitySummary;
  surfaces: readonly CsvHandoffIndexSurface[];
  read: CsvHandoffReadFlags;
  write: CsvHandoffNoWriteFlags;
};

export type CsvHandoffIndex = {
  contentType: typeof CSV_HANDOFF_INDEX_CONTENT_TYPE;
  entityCount: number;
  entries: readonly CsvHandoffIndexEntry[];
  operations: {
    capabilities: readonly CsvCapabilityOperation[];
    transferManifests: readonly CsvTransferManifestOperation[];
    packets: readonly CsvHandoffPacketSurface[];
  };
  read: CsvHandoffReadFlags;
  write: CsvHandoffNoWriteFlags;
};

function noWrites(): CsvHandoffNoWriteFlags {
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

function readFlags(
  database: boolean,
  csvInput: boolean,
  csvOutput: boolean
): CsvHandoffReadFlags {
  return {
    metadata: true,
    database,
    csvInput,
    csvOutput
  };
}

function indexReads(): CsvHandoffReadFlags {
  return readFlags(false, false, false);
}

function routeForReport(report: CsvCompatibilityReport): string | null {
  return report.export.route ?? report.import.route;
}

function surfaceFromCapability(
  kind: CsvHandoffSurfaceKind,
  capability: CsvCapability
): CsvHandoffIndexSurface {
  return {
    kind,
    operation: capability.operation,
    route: capability.route,
    filename: capability.filename,
    manifestFilename: null,
    templateFilename: null,
    contentType: capability.outputContentType ?? capability.inputContentType,
    inputContentType: capability.inputContentType,
    outputContentType: capability.outputContentType,
    acceptsCsvInput: capability.acceptsCsvInput,
    returnsCsv: capability.returnsCsv,
    canonicalHeaders: capability.canonicalHeaders,
    requiredImportFields: capability.requiredImportFields,
    requiredImportHeaders: capability.requiredImportHeaders,
    read: readFlags(
      capability.read.database,
      capability.read.csvInput,
      capability.returnsCsv
    ),
    write: noWrites()
  };
}

function surfaceFromCompatibilityReport(
  report: CsvCompatibilityReport
): CsvHandoffIndexSurface {
  return {
    kind: "compatibility-report",
    operation: "compatibility-report",
    route: routeForReport(report),
    filename: null,
    manifestFilename: null,
    templateFilename: null,
    contentType: report.contentType,
    inputContentType: null,
    outputContentType: report.contentType,
    acceptsCsvInput: false,
    returnsCsv: false,
    canonicalHeaders: report.export.canonicalHeaders,
    requiredImportFields: report.import.template.requiredFieldKeys,
    requiredImportHeaders: report.import.template.requiredHeaders,
    read: indexReads(),
    write: noWrites()
  };
}

function surfaceFromTemplate(template: CsvImportTemplate): CsvHandoffIndexSurface {
  return {
    kind: "import-template",
    operation: "import-template",
    route: template.route,
    filename: template.filename,
    manifestFilename: null,
    templateFilename: template.filename,
    contentType: template.contentType,
    inputContentType: null,
    outputContentType: template.contentType,
    acceptsCsvInput: false,
    returnsCsv: true,
    canonicalHeaders: template.headers,
    requiredImportFields: template.fields
      .filter((field) => field.required)
      .map((field) => field.key),
    requiredImportHeaders: template.requiredHeaders,
    read: indexReads(),
    write: noWrites()
  };
}

function surfaceFromTemplateExample(
  example: CsvImportTemplateExampleCsv
): CsvHandoffIndexSurface {
  return {
    kind: "import-template-example",
    operation: "import-template-example",
    route: example.route,
    filename: example.filename,
    manifestFilename: null,
    templateFilename: example.templateFilename,
    contentType: example.contentType,
    inputContentType: null,
    outputContentType: example.contentType,
    acceptsCsvInput: false,
    returnsCsv: true,
    canonicalHeaders: example.headers,
    requiredImportFields: example.fields
      .filter((field) => field.required)
      .map((field) => field.key),
    requiredImportHeaders: example.requiredHeaders,
    read: indexReads(),
    write: noWrites()
  };
}

function surfaceFromTransferManifest(
  definition: CsvTransferManifestDefinition
): CsvHandoffIndexSurface {
  return {
    kind:
      definition.operation === "export-delivery"
        ? "export-delivery-manifest"
        : "import-dry-run-manifest",
    operation: definition.operation,
    route: definition.route,
    filename: definition.filenames.manifest,
    manifestFilename: definition.filenames.manifest,
    templateFilename: definition.filenames.template,
    contentType: definition.contentTypes.manifest,
    inputContentType: definition.contentTypes.input,
    outputContentType: definition.contentTypes.output,
    acceptsCsvInput: definition.source.inputRequired,
    returnsCsv: false,
    canonicalHeaders: [],
    requiredImportFields: definition.source.requiredInputFields,
    requiredImportHeaders: definition.source.requiredInputHeaders,
    read: readFlags(
      definition.read.database,
      definition.read.csvInput,
      definition.read.csvOutput
    ),
    write: noWrites()
  };
}

function surfaceFromExportDeliveryPacket(
  entity: CsvExportEntity
): CsvHandoffIndexSurface {
  const definition = getCsvExportDeliveryPacketDefinition(entity);

  return {
    kind: "export-delivery-packet",
    operation: "export-delivery-packet",
    route: definition.route,
    filename: definition.filename,
    manifestFilename: null,
    templateFilename: null,
    contentType: definition.contentType,
    inputContentType: null,
    outputContentType: definition.contentType,
    acceptsCsvInput: false,
    returnsCsv: true,
    canonicalHeaders: definition.canonicalHeaders,
    requiredImportFields: [],
    requiredImportHeaders: [],
    read: readFlags(true, false, true),
    write: noWrites()
  };
}

function surfaceFromImportDryRunReceipt(
  entity: CsvImportPreviewEntity
): CsvHandoffIndexSurface {
  const definition = getCsvImportDryRunReceiptDefinition(entity);
  const template = getCsvImportTemplate(entity);

  return {
    kind: "import-dry-run-receipt",
    operation: "import-dry-run-receipt",
    route: definition.route,
    filename: null,
    manifestFilename: null,
    templateFilename: template.filename,
    contentType: CSV_HANDOFF_INDEX_CONTENT_TYPE,
    inputContentType: CSV_IMPORT_TEMPLATE_CONTENT_TYPE,
    outputContentType: CSV_HANDOFF_INDEX_CONTENT_TYPE,
    acceptsCsvInput: true,
    returnsCsv: false,
    canonicalHeaders: definition.fields.map((field) => field.label),
    requiredImportFields: definition.fields
      .filter((field) => field.required)
      .map((field) => field.key),
    requiredImportHeaders: template.requiredHeaders,
    read: readFlags(true, true, false),
    write: noWrites()
  };
}

function getCapabilitySurface(
  operation: CsvCapabilityOperation,
  entity: CsvHandoffIndexEntity,
  kind: CsvHandoffSurfaceKind
): CsvHandoffIndexSurface | null {
  const capability = getCsvCapability(operation, entity);

  return capability === null ? null : surfaceFromCapability(kind, capability);
}

function getExportSurfaces(entity: CsvHandoffIndexEntity): CsvHandoffIndexSurface[] {
  if (!isCsvExportEntity(entity)) {
    return [];
  }

  const exportCapability = getCapabilitySurface(
    "export",
    entity,
    "export-capability"
  );
  const exportManifest = getCsvTransferManifestDefinition("export-delivery", entity);
  const surfaces: CsvHandoffIndexSurface[] = [];

  if (exportCapability !== null) {
    surfaces.push(exportCapability);
  }

  surfaces.push(surfaceFromExportDeliveryPacket(entity));

  if (exportManifest !== null) {
    surfaces.push(surfaceFromTransferManifest(exportManifest));
  }

  return surfaces;
}

function getImportSurfaces(entity: CsvHandoffIndexEntity): CsvHandoffIndexSurface[] {
  if (!isCsvImportPreviewEntity(entity)) {
    return [];
  }

  const previewCapability = getCapabilitySurface(
    "import-preview",
    entity,
    "import-preview-capability"
  );
  const templateCapability = getCapabilitySurface(
    "import-template",
    entity,
    "import-template-capability"
  );
  const preflightCapability = getCapabilitySurface(
    "import-preflight",
    entity,
    "import-preflight-capability"
  );
  const template = getCsvImportTemplate(entity);
  const example = exportCsvImportTemplateExampleCsv(entity);
  const importManifest = getCsvTransferManifestDefinition("import-dry-run", entity);
  const surfaces: CsvHandoffIndexSurface[] = [];

  if (previewCapability !== null) {
    surfaces.push(previewCapability);
  }

  if (templateCapability !== null) {
    surfaces.push(templateCapability);
  }

  if (preflightCapability !== null) {
    surfaces.push(preflightCapability);
  }

  surfaces.push(
    surfaceFromTemplate(template),
    surfaceFromTemplateExample(example),
    surfaceFromImportDryRunReceipt(entity)
  );

  if (importManifest !== null) {
    surfaces.push(surfaceFromTransferManifest(importManifest));
  }

  return surfaces;
}

function buildTemplateSummary(
  entity: CsvHandoffIndexEntity
): CsvHandoffTemplateSummary {
  if (!isCsvImportPreviewEntity(entity)) {
    return {
      supported: false,
      filename: null,
      exampleFilename: null,
      requiredFieldKeys: [],
      requiredHeaders: []
    };
  }

  const template = getCsvImportTemplate(entity);
  const example = exportCsvImportTemplateExampleCsv(entity);

  return {
    supported: true,
    filename: template.filename,
    exampleFilename: example.filename,
    requiredFieldKeys: template.fields
      .filter((field) => field.required)
      .map((field) => field.key),
    requiredHeaders: template.requiredHeaders
  };
}

function buildTransferSummary(
  surfaces: readonly CsvHandoffIndexSurface[]
): CsvHandoffTransferSummary {
  return {
    exportDeliveryManifestFilename:
      surfaces.find((surface) => surface.kind === "export-delivery-manifest")
        ?.manifestFilename ?? null,
    importDryRunManifestFilename:
      surfaces.find((surface) => surface.kind === "import-dry-run-manifest")
        ?.manifestFilename ?? null
  };
}

function buildPacketSummary(
  surfaces: readonly CsvHandoffIndexSurface[]
): CsvHandoffPacketSummary {
  return {
    exportDeliveryPacket: surfaces.some(
      (surface) => surface.kind === "export-delivery-packet"
    ),
    importDryRunReceipt: surfaces.some(
      (surface) => surface.kind === "import-dry-run-receipt"
    )
  };
}

function buildCapabilitySupport(
  surfaces: readonly CsvHandoffIndexSurface[]
): CsvHandoffCapabilitySupport {
  return {
    export: surfaces.some((surface) => surface.kind === "export-capability"),
    importPreview: surfaces.some(
      (surface) => surface.kind === "import-preview-capability"
    ),
    importTemplate: surfaces.some(
      (surface) => surface.kind === "import-template-capability"
    ),
    importPreflight: surfaces.some(
      (surface) => surface.kind === "import-preflight-capability"
    )
  };
}

export function isCsvHandoffIndexEntity(
  value: string
): value is CsvHandoffIndexEntity {
  return isCsvCompatibilityReportEntity(value);
}

export function listCsvHandoffIndexEntities(): CsvHandoffIndexEntity[] {
  return listCsvCompatibilityReportEntities();
}

export function getCsvHandoffIndexEntry(
  entity: string
): CsvHandoffIndexEntry | null {
  if (!isCsvHandoffIndexEntity(entity)) {
    return null;
  }

  const report = getCsvCompatibilityReport(entity);

  if (report === null) {
    return null;
  }

  const surfaces = [
    surfaceFromCompatibilityReport(report),
    ...getExportSurfaces(entity),
    ...getImportSurfaces(entity)
  ];

  return {
    entity,
    label: report.label,
    route: routeForReport(report),
    direction: report.direction,
    capabilities: buildCapabilitySupport(surfaces),
    template: buildTemplateSummary(entity),
    transferManifests: buildTransferSummary(surfaces),
    packets: buildPacketSummary(surfaces),
    compatibilityReport: {
      contentType: report.contentType,
      direction: report.direction,
      warningCount: report.warnings.length,
      warningCodes: report.warnings.map((warning) => warning.code)
    },
    surfaces,
    read: indexReads(),
    write: noWrites()
  };
}

export function listCsvHandoffIndexEntries(): CsvHandoffIndexEntry[] {
  return listCsvHandoffIndexEntities().map((entity) => {
    const entry = getCsvHandoffIndexEntry(entity);

    if (entry === null) {
      throw new Error(`Missing CSV handoff index entry for ${entity}`);
    }

    return entry;
  });
}

export function listCsvHandoffIndexEntriesByDirection(
  direction: CsvCompatibilityDirection
): CsvHandoffIndexEntry[] {
  return listCsvHandoffIndexEntries().filter(
    (entry) => entry.direction === direction
  );
}

export function getCsvHandoffIndex(): CsvHandoffIndex {
  const entries = listCsvHandoffIndexEntries();

  return {
    contentType: CSV_HANDOFF_INDEX_CONTENT_TYPE,
    entityCount: entries.length,
    entries,
    operations: {
      capabilities: CSV_CAPABILITY_OPERATIONS,
      transferManifests: CSV_TRANSFER_MANIFEST_OPERATIONS,
      packets: CSV_HANDOFF_PACKET_SURFACES
    },
    read: indexReads(),
    write: noWrites()
  };
}
