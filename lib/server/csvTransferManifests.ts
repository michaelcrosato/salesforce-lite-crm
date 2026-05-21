import {
  CSV_EXPORT_DELIVERY_PACKET_ENTITIES,
  getCsvExportDeliveryPacket,
  getCsvExportDeliveryPacketDefinition,
  isCsvExportDeliveryPacketEntity,
  listCsvExportDeliveryPacketDefinitions,
  type CsvExportDeliveryLimitMetadata,
  type CsvExportDeliveryPacketEntity,
  type CsvExportDeliveryPacketOptions
} from "@/lib/server/csvExportDeliveryPackets";
import {
  getCsvImportDryRunReceipt,
  getCsvImportDryRunReceiptDefinition,
  isCsvImportDryRunReceiptEntity,
  listCsvImportDryRunReceiptDefinitions,
  type CsvImportDryRunReceiptEntity,
  type CsvImportDryRunReceiptOptions,
  type CsvImportDryRunSourceMetadata
} from "@/lib/server/csvImportDryRunReceipts";
import {
  type CsvImportActionSummary,
  type CsvImportReadinessSummary
} from "@/lib/server/csvImportPreflight";
import {
  CSV_IMPORT_REVIEW_BUNDLE_DEFAULT_SAMPLE_LIMIT,
  CSV_IMPORT_REVIEW_BUNDLE_MAX_SAMPLE_LIMIT
} from "@/lib/server/csvImportReviewBundles";
import {
  CSV_IMPORT_PREVIEW_DEFAULT_LIMIT,
  CSV_IMPORT_PREVIEW_ENTITIES,
  CSV_IMPORT_PREVIEW_MAX_LIMIT,
  type CsvImportIssueSummary
} from "@/lib/server/csvImportPreview";
import {
  CSV_IMPORT_TEMPLATE_CONTENT_TYPE,
  getCsvImportTemplate
} from "@/lib/server/csvImportTemplates";

export const CSV_TRANSFER_MANIFEST_CONTENT_TYPE =
  "application/json; charset=utf-8" as const;

export const CSV_TRANSFER_MANIFEST_OPERATIONS = [
  "export-delivery",
  "import-dry-run"
] as const;

export type CsvTransferManifestOperation =
  (typeof CSV_TRANSFER_MANIFEST_OPERATIONS)[number];

export type CsvTransferManifestEntity =
  | CsvExportDeliveryPacketEntity
  | CsvImportDryRunReceiptEntity;

export type CsvTransferManifestReadFlags = {
  metadata: true;
  database: boolean;
  csvInput: boolean;
  csvOutput: boolean;
};

export type CsvTransferManifestWriteFlags = {
  database: false;
  files: false;
  externalServices: false;
  exportHistory: false;
  scheduledDelivery: false;
  backgroundJobs: false;
  routingAssignments: false;
  importApply: false;
  bulkMutations: false;
};

export type CsvTransferManifestLimit = {
  defaultLimit: number;
  maxLimit: number;
};

export type CsvTransferManifestLimits = {
  exportRows: CsvTransferManifestLimit | null;
  previewRows: CsvTransferManifestLimit | null;
  sampleRows: CsvTransferManifestLimit | null;
};

export type CsvTransferManifestFilenames = {
  csv: string | null;
  template: string | null;
  manifest: string;
};

export type CsvTransferManifestContentTypes = {
  input: typeof CSV_IMPORT_TEMPLATE_CONTENT_TYPE | null;
  output: string | null;
  manifest: typeof CSV_TRANSFER_MANIFEST_CONTENT_TYPE;
};

export type CsvTransferManifestSourceDefinition = {
  inputRequired: boolean;
  inputContentType: typeof CSV_IMPORT_TEMPLATE_CONTENT_TYPE | null;
  inputTemplateFilename: string | null;
  inputFields: readonly string[];
  requiredInputFields: readonly string[];
  requiredInputHeaders: readonly string[];
};

type CsvTransferManifestBaseDefinition = {
  operation: CsvTransferManifestOperation;
  entity: CsvTransferManifestEntity;
  label: string;
  route: string;
  filenames: CsvTransferManifestFilenames;
  contentTypes: CsvTransferManifestContentTypes;
  limits: CsvTransferManifestLimits;
  source: CsvTransferManifestSourceDefinition;
  read: CsvTransferManifestReadFlags;
  write: CsvTransferManifestWriteFlags;
};

export type CsvExportTransferManifestDefinition =
  CsvTransferManifestBaseDefinition & {
    operation: "export-delivery";
    entity: CsvExportDeliveryPacketEntity;
    filenames: CsvTransferManifestFilenames & {
      csv: string;
      template: null;
    };
  };

export type CsvImportDryRunTransferManifestDefinition =
  CsvTransferManifestBaseDefinition & {
    operation: "import-dry-run";
    entity: CsvImportDryRunReceiptEntity;
    filenames: CsvTransferManifestFilenames & {
      csv: string;
      template: string;
    };
    contentTypes: CsvTransferManifestContentTypes & {
      input: typeof CSV_IMPORT_TEMPLATE_CONTENT_TYPE;
      output: null;
    };
  };

export type CsvTransferManifestDefinition =
  | CsvExportTransferManifestDefinition
  | CsvImportDryRunTransferManifestDefinition;

export type CsvExportTransferManifest = CsvExportTransferManifestDefinition & {
  transfer: {
    packetType: "csv-export-delivery-packet";
    rowCount: number;
    totalAvailableRows: number;
    limits: CsvExportDeliveryLimitMetadata;
    csvIncluded: false;
    reviewNoteCodes: readonly string[];
  };
};

export type CsvImportDryRunTransferManifest =
  CsvImportDryRunTransferManifestDefinition & {
    transfer: {
      packetType: "csv-import-dry-run-receipt";
      mode: "dry_run";
      source: CsvImportDryRunSourceMetadata;
      issueSummary: CsvImportIssueSummary;
      readinessSummary: CsvImportReadinessSummary;
      actionSummary: CsvImportActionSummary;
      diagnosticCount: number;
      rowSample: {
        sampleLimit: number;
        sampledRows: number;
        hasMoreRows: boolean;
      };
      rowDataIncluded: false;
    };
  };

export type CsvTransferManifest =
  | CsvExportTransferManifest
  | CsvImportDryRunTransferManifest;

export type CsvTransferManifestOptions = {
  exportDelivery?: CsvExportDeliveryPacketOptions;
  importDryRun?: CsvImportDryRunReceiptOptions;
};

function noWrites(): CsvTransferManifestWriteFlags {
  return {
    database: false,
    files: false,
    externalServices: false,
    exportHistory: false,
    scheduledDelivery: false,
    backgroundJobs: false,
    routingAssignments: false,
    importApply: false,
    bulkMutations: false
  };
}

function readFlags(
  database: boolean,
  csvInput: boolean,
  csvOutput: boolean
): CsvTransferManifestReadFlags {
  return {
    metadata: true,
    database,
    csvInput,
    csvOutput
  };
}

function limitMetadata(defaultLimit: number, maxLimit: number): CsvTransferManifestLimit {
  return {
    defaultLimit,
    maxLimit
  };
}

function manifestFilename(
  entity: CsvTransferManifestEntity,
  operation: CsvTransferManifestOperation
): string {
  return `${entity}-${operation}-manifest.json`;
}

function buildExportTransferManifestDefinition(
  entity: CsvExportDeliveryPacketEntity
): CsvExportTransferManifestDefinition {
  const definition = getCsvExportDeliveryPacketDefinition(entity);

  return {
    operation: "export-delivery",
    entity: definition.entity,
    label: definition.label,
    route: definition.route,
    filenames: {
      csv: definition.filename,
      template: null,
      manifest: manifestFilename(definition.entity, "export-delivery")
    },
    contentTypes: {
      input: null,
      output: definition.contentType,
      manifest: CSV_TRANSFER_MANIFEST_CONTENT_TYPE
    },
    limits: {
      exportRows: limitMetadata(definition.defaultExportLimit, definition.maxExportLimit),
      previewRows: limitMetadata(definition.defaultPreviewLimit, definition.maxPreviewLimit),
      sampleRows: null
    },
    source: {
      inputRequired: false,
      inputContentType: null,
      inputTemplateFilename: null,
      inputFields: [],
      requiredInputFields: [],
      requiredInputHeaders: []
    },
    read: readFlags(true, false, true),
    write: noWrites()
  };
}

function buildImportDryRunTransferManifestDefinition(
  entity: CsvImportDryRunReceiptEntity
): CsvImportDryRunTransferManifestDefinition {
  const definition = getCsvImportDryRunReceiptDefinition(entity);
  const template = getCsvImportTemplate(entity);

  return {
    operation: "import-dry-run",
    entity: definition.entity,
    label: definition.label,
    route: definition.route,
    filenames: {
      csv: template.filename,
      template: template.filename,
      manifest: manifestFilename(definition.entity, "import-dry-run")
    },
    contentTypes: {
      input: CSV_IMPORT_TEMPLATE_CONTENT_TYPE,
      output: null,
      manifest: CSV_TRANSFER_MANIFEST_CONTENT_TYPE
    },
    limits: {
      exportRows: null,
      previewRows: limitMetadata(CSV_IMPORT_PREVIEW_DEFAULT_LIMIT, CSV_IMPORT_PREVIEW_MAX_LIMIT),
      sampleRows: limitMetadata(
        CSV_IMPORT_REVIEW_BUNDLE_DEFAULT_SAMPLE_LIMIT,
        CSV_IMPORT_REVIEW_BUNDLE_MAX_SAMPLE_LIMIT
      )
    },
    source: {
      inputRequired: true,
      inputContentType: CSV_IMPORT_TEMPLATE_CONTENT_TYPE,
      inputTemplateFilename: template.filename,
      inputFields: definition.fields.map((field) => field.key),
      requiredInputFields: definition.fields
        .filter((field) => field.required)
        .map((field) => field.key),
      requiredInputHeaders: template.requiredHeaders
    },
    read: readFlags(true, true, false),
    write: noWrites()
  };
}

export function isCsvTransferManifestOperation(
  value: string
): value is CsvTransferManifestOperation {
  return CSV_TRANSFER_MANIFEST_OPERATIONS.includes(
    value as CsvTransferManifestOperation
  );
}

export function isCsvTransferManifestEntity(
  operation: CsvTransferManifestOperation,
  value: string
): value is CsvTransferManifestEntity {
  switch (operation) {
    case "export-delivery":
      return isCsvExportDeliveryPacketEntity(value);
    case "import-dry-run":
      return isCsvImportDryRunReceiptEntity(value);
  }
}

export function listCsvExportTransferManifestDefinitions(): CsvExportTransferManifestDefinition[] {
  return listCsvExportDeliveryPacketDefinitions().map((definition) =>
    buildExportTransferManifestDefinition(definition.entity)
  );
}

export function listCsvImportDryRunTransferManifestDefinitions(): CsvImportDryRunTransferManifestDefinition[] {
  return listCsvImportDryRunReceiptDefinitions().map((definition) =>
    buildImportDryRunTransferManifestDefinition(definition.entity)
  );
}

export function listCsvTransferManifestDefinitions(): CsvTransferManifestDefinition[] {
  return [
    ...listCsvExportTransferManifestDefinitions(),
    ...listCsvImportDryRunTransferManifestDefinitions()
  ];
}

export function listCsvTransferManifestDefinitionsByOperation(
  operation: CsvTransferManifestOperation
): CsvTransferManifestDefinition[] {
  return listCsvTransferManifestDefinitions().filter(
    (definition) => definition.operation === operation
  );
}

export function getCsvTransferManifestDefinition(
  operation: "export-delivery",
  entity: CsvExportDeliveryPacketEntity
): CsvExportTransferManifestDefinition;
export function getCsvTransferManifestDefinition(
  operation: "import-dry-run",
  entity: CsvImportDryRunReceiptEntity
): CsvImportDryRunTransferManifestDefinition;
export function getCsvTransferManifestDefinition(
  operation: CsvTransferManifestOperation,
  entity: string
): CsvTransferManifestDefinition | null;
export function getCsvTransferManifestDefinition(
  operation: CsvTransferManifestOperation,
  entity: string
): CsvTransferManifestDefinition | null {
  switch (operation) {
    case "export-delivery":
      return isCsvExportDeliveryPacketEntity(entity)
        ? buildExportTransferManifestDefinition(entity)
        : null;
    case "import-dry-run":
      return isCsvImportDryRunReceiptEntity(entity)
        ? buildImportDryRunTransferManifestDefinition(entity)
        : null;
  }
}

export async function getCsvExportTransferManifest(
  entity: CsvExportDeliveryPacketEntity,
  options: CsvExportDeliveryPacketOptions = {}
): Promise<CsvExportTransferManifest> {
  const packet = await getCsvExportDeliveryPacket(entity, options);

  return {
    ...buildExportTransferManifestDefinition(entity),
    transfer: {
      packetType: "csv-export-delivery-packet",
      rowCount: packet.rowCount,
      totalAvailableRows: packet.totalAvailableRows,
      limits: packet.limits,
      csvIncluded: false,
      reviewNoteCodes: packet.notes.map((note) => note.code)
    }
  };
}

export async function getCsvImportDryRunTransferManifest(
  entity: CsvImportDryRunReceiptEntity,
  input: string,
  options: CsvImportDryRunReceiptOptions = {}
): Promise<CsvImportDryRunTransferManifest> {
  const receipt = await getCsvImportDryRunReceipt(entity, input, options);

  return {
    ...buildImportDryRunTransferManifestDefinition(entity),
    transfer: {
      packetType: "csv-import-dry-run-receipt",
      mode: receipt.mode,
      source: receipt.source,
      issueSummary: receipt.issueSummary,
      readinessSummary: receipt.readinessSummary,
      actionSummary: receipt.actionSummary,
      diagnosticCount: receipt.diagnostics.length,
      rowSample: {
        sampleLimit: receipt.rowSample.sampleLimit,
        sampledRows: receipt.rowSample.sampledRows,
        hasMoreRows: receipt.rowSample.hasMoreRows
      },
      rowDataIncluded: false
    }
  };
}

export async function listCsvExportTransferManifests(
  options: CsvExportDeliveryPacketOptions = {}
): Promise<CsvExportTransferManifest[]> {
  return Promise.all(
    CSV_EXPORT_DELIVERY_PACKET_ENTITIES.map((entity) =>
      getCsvExportTransferManifest(entity, options)
    )
  );
}

export async function listCsvImportDryRunTransferManifests(
  inputs: Record<CsvImportDryRunReceiptEntity, string>,
  options: CsvImportDryRunReceiptOptions = {}
): Promise<CsvImportDryRunTransferManifest[]> {
  return Promise.all(
    CSV_IMPORT_PREVIEW_ENTITIES.map((entity) =>
      getCsvImportDryRunTransferManifest(entity, inputs[entity], options)
    )
  );
}

export async function listCsvTransferManifests(
  inputs: Record<CsvImportDryRunReceiptEntity, string>,
  options: CsvTransferManifestOptions = {}
): Promise<CsvTransferManifest[]> {
  const [exportManifests, importManifests] = await Promise.all([
    listCsvExportTransferManifests(options.exportDelivery),
    listCsvImportDryRunTransferManifests(inputs, options.importDryRun)
  ]);

  return [...exportManifests, ...importManifests];
}
