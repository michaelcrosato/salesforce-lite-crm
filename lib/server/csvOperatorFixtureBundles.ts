import { createHash } from "node:crypto";
import {
  CSV_CONTRACT_RELEASE_DIGEST_CONTENT_TYPE,
  getCsvContractReleaseDigest,
  getCsvContractReleaseOperationDigest,
  isCsvContractReleaseDigestOperation,
  type CsvContractReleaseDigest,
  type CsvContractReleaseDigestStatus,
  type CsvContractReleaseDigestStatusCounts,
  type CsvContractReleaseOperationDigest
} from "@/lib/server/csvContractReleaseDigest";
import {
  CSV_EXPORT_DELIVERY_PACKET_ENTITIES,
  getCsvExportDeliveryPacket,
  type CsvExportDeliveryLimitMetadata,
  type CsvExportDeliveryPacketEntity
} from "@/lib/server/csvExportDeliveryPackets";
import {
  CSV_IMPORT_DRY_RUN_RECEIPT_ENTITIES,
  getCsvImportDryRunReceipt,
  type CsvImportDryRunReceipt,
  type CsvImportDryRunReceiptEntity,
  type CsvImportDryRunSourceMetadata
} from "@/lib/server/csvImportDryRunReceipts";
import {
  exportCsvImportTemplateExampleCsv,
  type CsvImportTemplateExampleCsv
} from "@/lib/server/csvImportTemplates";
import {
  CSV_OPERATOR_HANDOFF_PACKET_CONTENT_TYPE,
  getCsvOperatorHandoffEntityPacket,
  getCsvOperatorHandoffOperationPacket,
  getCsvOperatorHandoffPackets,
  isCsvOperatorHandoffPacketEntity,
  isCsvOperatorHandoffPacketOperation,
  type CsvOperatorHandoffEntityPacket,
  type CsvOperatorHandoffOperationPacket,
  type CsvOperatorHandoffOperationPacketSummary,
  type CsvOperatorHandoffPacketEntity,
  type CsvOperatorHandoffPacketOperation,
  type CsvOperatorHandoffReadFlags,
  type CsvOperatorHandoffWriteFlags
} from "@/lib/server/csvOperatorHandoffPackets";
import {
  type CsvOperatorReadinessWarningCode
} from "@/lib/server/csvOperatorReadinessScorecards";
import {
  type CsvOperatorRemediationSourceCode
} from "@/lib/server/csvOperatorRemediationRunbooks";
import { getInFlightCsvPacket } from "@/lib/server/csvInFlightCache";

export const CSV_OPERATOR_FIXTURE_BUNDLE_CONTENT_TYPE =
  "application/json; charset=utf-8" as const;

export type CsvOperatorFixtureBundleEntity = CsvOperatorHandoffPacketEntity;
export type CsvOperatorFixtureBundleOperation =
  CsvOperatorHandoffPacketOperation;
export type CsvOperatorFixtureBundleStatus = CsvContractReleaseDigestStatus;
export type CsvOperatorFixtureStatusCounts =
  CsvContractReleaseDigestStatusCounts;

export type CsvOperatorFixtureBundleOptions = {
  exportLimit?: number;
  importPreviewLimit?: number;
  importSampleLimit?: number;
};

export type CsvOperatorFixtureReadFlags = CsvOperatorHandoffReadFlags;

export type CsvOperatorFixtureWriteFlags = CsvOperatorHandoffWriteFlags;

export type CsvOperatorFixtureSource = {
  releaseDigestContentType: typeof CSV_CONTRACT_RELEASE_DIGEST_CONTENT_TYPE;
  releaseDigestVersion: 1;
  releaseDigestFingerprint: string;
  operatorHandoffContentType: typeof CSV_OPERATOR_HANDOFF_PACKET_CONTENT_TYPE;
  operatorHandoffPacketVersion: 1;
  operatorHandoffStatus: CsvOperatorFixtureBundleStatus;
  contractDriftFingerprint: string;
};

export type CsvOperatorFixtureReleaseSummary = {
  status: CsvOperatorFixtureBundleStatus;
  fingerprint: string;
  entityCount: number;
  operationCount: number;
  capabilityCount: number;
  supportedEntityOperationCount: number;
  unsupportedEntityOperationCount: number;
  statusCounts: CsvOperatorFixtureStatusCounts;
  operationStatusCounts: CsvOperatorFixtureStatusCounts;
  entityOperationStatusCounts: CsvOperatorFixtureStatusCounts;
  warningCodes: readonly CsvOperatorReadinessWarningCode[];
  sourceCodes: readonly CsvOperatorRemediationSourceCode[];
  safeForCurrentSprint: boolean;
  requiresContractChange: boolean;
};

export type CsvOperatorFixtureOperationReleaseSummary = {
  operation: CsvOperatorFixtureBundleOperation;
  status: CsvOperatorFixtureBundleStatus;
  entityCount: number;
  capabilityCount: number;
  supportedEntityCount: number;
  unsupportedEntityCount: number;
  stableEntityCount: number;
  watchEntityCount: number;
  blockedEntityCount: number;
  statusCounts: CsvOperatorFixtureStatusCounts;
  warningCodes: readonly CsvOperatorReadinessWarningCode[];
  sourceCodes: readonly CsvOperatorRemediationSourceCode[];
  safeForCurrentSprint: boolean;
  requiresContractChange: boolean;
};

export type CsvOperatorFixtureExportSample = {
  kind: "export-delivery-packet";
  operation: "export";
  entity: CsvOperatorFixtureBundleEntity;
  filename: string;
  contentType: string;
  canonicalHeaders: readonly string[];
  rowCount: number;
  totalAvailableRows: number;
  limits: CsvExportDeliveryLimitMetadata;
  noteCodes: readonly string[];
  csvSnippet: string;
  csvByteLength: number;
  read: CsvOperatorFixtureReadFlags;
  write: CsvOperatorFixtureWriteFlags;
};

export type CsvOperatorFixtureImportInputSample = {
  filename: string;
  templateFilename: string;
  contentType: string;
  rowCount: 1;
  csv: string;
  csvByteLength: number;
};

export type CsvOperatorFixtureImportDryRunSample = {
  kind: "import-dry-run-receipt";
  operations: readonly Exclude<CsvOperatorFixtureBundleOperation, "export">[];
  entity: CsvOperatorFixtureBundleEntity;
  inputFixture: CsvOperatorFixtureImportInputSample;
  source: CsvImportDryRunSourceMetadata;
  issueSummary: CsvImportDryRunReceipt["issueSummary"];
  readinessSummary: CsvImportDryRunReceipt["readinessSummary"];
  actionSummary: CsvImportDryRunReceipt["actionSummary"];
  diagnostics: CsvImportDryRunReceipt["diagnostics"];
  rowSample: CsvImportDryRunReceipt["rowSample"];
  read: CsvOperatorFixtureReadFlags;
  write: CsvOperatorFixtureWriteFlags;
};

export type CsvOperatorFixtureAvailability =
  | {
      available: true;
      kind: "export-delivery-packet";
      filename: string;
      contentType: string;
      rowCount: number;
      totalAvailableRows: number;
      csvByteLength: number;
    }
  | {
      available: true;
      kind: "import-dry-run-receipt";
      inputFilename: string;
      inputContentType: string;
      inputCsvByteLength: number;
      rowCount: number;
      previewedRows: number;
      sampledRows: number;
      diagnosticCount: number;
    }
  | {
      available: false;
      kind: null;
      reason: "unsupported-operation" | "missing-fixture-source";
    };

export type CsvOperatorFixtureEntityOperation = {
  operation: CsvOperatorFixtureBundleOperation;
  status: CsvOperatorFixtureBundleStatus;
  supported: boolean;
  fixture: CsvOperatorFixtureAvailability;
  release: CsvOperatorFixtureOperationReleaseSummary;
  handoff: {
    label: string;
    route: string | null;
    handoffSurfaceKinds: readonly string[];
    warningCodes: readonly CsvOperatorReadinessWarningCode[];
    sourceCodes: readonly CsvOperatorRemediationSourceCode[];
    sourceContentTypes: readonly string[];
    driftFingerprint: string;
  };
  read: CsvOperatorFixtureReadFlags;
  write: CsvOperatorFixtureWriteFlags;
};

export type CsvOperatorFixtureEntityBundle = {
  contentType: typeof CSV_OPERATOR_FIXTURE_BUNDLE_CONTENT_TYPE;
  bundleVersion: 1;
  entity: CsvOperatorFixtureBundleEntity;
  label: string;
  route: string | null;
  direction: CsvOperatorHandoffEntityPacket["direction"];
  status: CsvOperatorFixtureBundleStatus;
  fingerprint: string;
  operationCount: number;
  supportedOperationCount: number;
  fixtureOperationCount: number;
  exportFixture: CsvOperatorFixtureExportSample | null;
  importDryRunFixture: CsvOperatorFixtureImportDryRunSample | null;
  operations: readonly CsvOperatorFixtureEntityOperation[];
  release: CsvOperatorFixtureReleaseSummary;
  handoff: {
    warningCodes: readonly CsvOperatorReadinessWarningCode[];
    sourceCodes: readonly CsvOperatorRemediationSourceCode[];
    sourceContentTypes: readonly string[];
    sourceFingerprintCount: number;
  };
  source: CsvOperatorFixtureSource;
  read: CsvOperatorFixtureReadFlags;
  write: CsvOperatorFixtureWriteFlags;
};

export type CsvOperatorFixtureOperationEntity = {
  entity: CsvOperatorFixtureBundleEntity;
  label: string;
  route: string | null;
  status: CsvOperatorFixtureBundleStatus;
  supported: boolean;
  fixture: CsvOperatorFixtureAvailability;
  sourceContentTypes: readonly string[];
  read: CsvOperatorFixtureReadFlags;
  write: CsvOperatorFixtureWriteFlags;
};

export type CsvOperatorFixtureOperationBundle = {
  contentType: typeof CSV_OPERATOR_FIXTURE_BUNDLE_CONTENT_TYPE;
  bundleVersion: 1;
  operation: CsvOperatorFixtureBundleOperation;
  status: CsvOperatorFixtureBundleStatus;
  fingerprint: string;
  entityCount: number;
  supportedEntityCount: number;
  fixtureEntityCount: number;
  release: CsvOperatorFixtureOperationReleaseSummary;
  handoff: {
    capabilityCount: number;
    stableEntityCount: number;
    watchEntityCount: number;
    blockedEntityCount: number;
    statusCounts: CsvOperatorFixtureStatusCounts;
    warningCodes: readonly CsvOperatorReadinessWarningCode[];
    sourceCodes: readonly CsvOperatorRemediationSourceCode[];
    sourceContentTypes: readonly string[];
  };
  entities: readonly CsvOperatorFixtureOperationEntity[];
  source: CsvOperatorFixtureSource;
  read: CsvOperatorFixtureReadFlags;
  write: CsvOperatorFixtureWriteFlags;
};

export type CsvOperatorFixtureBundle = {
  contentType: typeof CSV_OPERATOR_FIXTURE_BUNDLE_CONTENT_TYPE;
  bundleVersion: 1;
  status: CsvOperatorFixtureBundleStatus;
  fingerprint: string;
  entityCount: number;
  operationCount: number;
  capabilityCount: number;
  supportedEntityOperationCount: number;
  fixtureOperationCount: number;
  exportFixtureCount: number;
  importFixtureCount: number;
  release: CsvOperatorFixtureReleaseSummary;
  entities: readonly CsvOperatorFixtureEntityBundle[];
  operations: readonly CsvOperatorFixtureOperationBundle[];
  sourceContentTypes: readonly string[];
  source: CsvOperatorFixtureSource;
  read: CsvOperatorFixtureReadFlags;
  write: CsvOperatorFixtureWriteFlags;
};

const fixtureBundleCache = new Map<
  string,
  Promise<CsvOperatorFixtureBundle>
>();

type ReadFlagInput = {
  metadata: true;
  database: boolean;
  csvInput: boolean;
  csvOutput: boolean;
};

function noWrites(): CsvOperatorFixtureWriteFlags {
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

function metadataOnlyReads(): CsvOperatorFixtureReadFlags {
  return {
    metadata: true,
    database: false,
    csvInput: false,
    csvOutput: false
  };
}

function exportFixtureReads(): CsvOperatorFixtureReadFlags {
  return {
    metadata: true,
    database: true,
    csvInput: false,
    csvOutput: true
  };
}

function importFixtureReads(): CsvOperatorFixtureReadFlags {
  return {
    metadata: true,
    database: true,
    csvInput: true,
    csvOutput: true
  };
}

function combineReads(
  reads: readonly (ReadFlagInput | CsvOperatorFixtureReadFlags)[]
): CsvOperatorFixtureReadFlags {
  return {
    metadata: true,
    database: reads.some((read) => read.database),
    csvInput: reads.some((read) => read.csvInput),
    csvOutput: reads.some((read) => read.csvOutput)
  };
}

function uniqueStrings(
  values: readonly (string | null | undefined)[]
): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    if (value !== null && value !== undefined && !seen.has(value)) {
      seen.add(value);
      result.push(value);
    }
  }

  return result;
}

function stableSerialize(value: unknown): string {
  if (value === null) {
    return "null";
  }

  if (value instanceof Date) {
    return JSON.stringify(value.toISOString());
  }

  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableSerialize(entry)).join(",")}]`;
  }

  switch (typeof value) {
    case "boolean":
    case "number":
    case "string":
      return JSON.stringify(value);
    case "object": {
      const record = value as Record<string, unknown>;
      const keys = Object.keys(record)
        .filter((key) => record[key] !== undefined)
        .sort();

      return `{${keys
        .map((key) => `${JSON.stringify(key)}:${stableSerialize(record[key])}`)
        .join(",")}}`;
    }
    default:
      return "null";
  }
}

function digestPayload(payload: unknown): string {
  return createHash("sha256").update(stableSerialize(payload)).digest("hex");
}

function byteLength(value: string): number {
  return Buffer.byteLength(value, "utf8");
}

function isExportFixtureEntity(
  entity: CsvOperatorFixtureBundleEntity
): entity is CsvExportDeliveryPacketEntity {
  return CSV_EXPORT_DELIVERY_PACKET_ENTITIES.some(
    (candidate) => candidate === entity
  );
}

function isImportFixtureEntity(
  entity: CsvOperatorFixtureBundleEntity
): entity is CsvImportDryRunReceiptEntity {
  return CSV_IMPORT_DRY_RUN_RECEIPT_ENTITIES.some(
    (candidate) => candidate === entity
  );
}

function isImportOperation(
  operation: CsvOperatorFixtureBundleOperation
): operation is Exclude<CsvOperatorFixtureBundleOperation, "export"> {
  return operation !== "export";
}

function buildSource(
  digest: CsvContractReleaseDigest
): CsvOperatorFixtureSource {
  return {
    releaseDigestContentType: digest.contentType,
    releaseDigestVersion: digest.digestVersion,
    releaseDigestFingerprint: digest.fingerprint,
    operatorHandoffContentType: digest.source.operatorHandoffContentType,
    operatorHandoffPacketVersion: digest.source.operatorHandoffPacketVersion,
    operatorHandoffStatus: digest.source.operatorHandoffStatus,
    contractDriftFingerprint: digest.source.contractDriftFingerprint
  };
}

function buildReleaseSummary(
  digest: CsvContractReleaseDigest
): CsvOperatorFixtureReleaseSummary {
  return {
    status: digest.status,
    fingerprint: digest.fingerprint,
    entityCount: digest.entityCount,
    operationCount: digest.operationCount,
    capabilityCount: digest.capabilityCount,
    supportedEntityOperationCount: digest.supportedEntityOperationCount,
    unsupportedEntityOperationCount: digest.unsupportedEntityOperationCount,
    statusCounts: digest.statusCounts,
    operationStatusCounts: digest.operationStatusCounts,
    entityOperationStatusCounts: digest.entityOperationStatusCounts,
    warningCodes: digest.warningCodeRollup.warningCodes,
    sourceCodes: digest.sourceCodeRollup.sourceCodes,
    safeForCurrentSprint: digest.releaseNote.safeForCurrentSprint,
    requiresContractChange: digest.releaseNote.requiresContractChange
  };
}

function getOperationDigest(
  operation: CsvOperatorFixtureBundleOperation
): CsvContractReleaseOperationDigest {
  const digest = getCsvContractReleaseOperationDigest(operation);

  if (digest === null) {
    throw new Error(`Missing CSV fixture release operation ${operation}`);
  }

  return digest;
}

function buildOperationReleaseSummary(
  digest: CsvContractReleaseOperationDigest
): CsvOperatorFixtureOperationReleaseSummary {
  return {
    operation: digest.operation,
    status: digest.status,
    entityCount: digest.entityCount,
    capabilityCount: digest.capabilityCount,
    supportedEntityCount: digest.supportedEntityCount,
    unsupportedEntityCount: digest.unsupportedEntityCount,
    stableEntityCount: digest.stableEntityCount,
    watchEntityCount: digest.watchEntityCount,
    blockedEntityCount: digest.blockedEntityCount,
    statusCounts: digest.statusCounts,
    warningCodes: digest.warningCodes,
    sourceCodes: digest.sourceCodes,
    safeForCurrentSprint: digest.releaseNote.safeForCurrentSprint,
    requiresContractChange: digest.releaseNote.requiresContractChange
  };
}

async function buildExportFixture(
  entity: CsvOperatorFixtureBundleEntity,
  options: CsvOperatorFixtureBundleOptions
): Promise<CsvOperatorFixtureExportSample | null> {
  if (!isExportFixtureEntity(entity)) {
    return null;
  }

  const packet = await getCsvExportDeliveryPacket(entity, {
    limit: options.exportLimit
  });

  return {
    kind: "export-delivery-packet",
    operation: "export",
    entity,
    filename: packet.filename,
    contentType: packet.contentType,
    canonicalHeaders: packet.canonicalHeaders,
    rowCount: packet.rowCount,
    totalAvailableRows: packet.totalAvailableRows,
    limits: packet.limits,
    noteCodes: packet.notes.map((note) => note.code),
    csvSnippet: packet.csv,
    csvByteLength: byteLength(packet.csv),
    read: exportFixtureReads(),
    write: noWrites()
  };
}

function buildInputFixture(
  example: CsvImportTemplateExampleCsv
): CsvOperatorFixtureImportInputSample {
  return {
    filename: example.filename,
    templateFilename: example.templateFilename,
    contentType: example.contentType,
    rowCount: example.rowCount,
    csv: example.csv,
    csvByteLength: byteLength(example.csv)
  };
}

async function buildImportDryRunFixture(
  entity: CsvOperatorFixtureBundleEntity,
  operations: readonly CsvOperatorHandoffOperationPacketSummary[],
  options: CsvOperatorFixtureBundleOptions
): Promise<CsvOperatorFixtureImportDryRunSample | null> {
  if (!isImportFixtureEntity(entity)) {
    return null;
  }

  const example = exportCsvImportTemplateExampleCsv(entity);
  const receipt = await getCsvImportDryRunReceipt(entity, example.csv, {
    limit: options.importPreviewLimit,
    sampleLimit: options.importSampleLimit
  });
  const supportedImportOperations: Exclude<
    CsvOperatorFixtureBundleOperation,
    "export"
  >[] = [];

  for (const operation of operations) {
    if (operation.supported && isImportOperation(operation.operation)) {
      supportedImportOperations.push(operation.operation);
    }
  }

  return {
    kind: "import-dry-run-receipt",
    operations: supportedImportOperations,
    entity,
    inputFixture: buildInputFixture(example),
    source: receipt.source,
    issueSummary: receipt.issueSummary,
    readinessSummary: receipt.readinessSummary,
    actionSummary: receipt.actionSummary,
    diagnostics: receipt.diagnostics,
    rowSample: receipt.rowSample,
    read: importFixtureReads(),
    write: noWrites()
  };
}

function buildExportAvailability(
  fixture: CsvOperatorFixtureExportSample
): CsvOperatorFixtureAvailability {
  return {
    available: true,
    kind: "export-delivery-packet",
    filename: fixture.filename,
    contentType: fixture.contentType,
    rowCount: fixture.rowCount,
    totalAvailableRows: fixture.totalAvailableRows,
    csvByteLength: fixture.csvByteLength
  };
}

function buildImportAvailability(
  fixture: CsvOperatorFixtureImportDryRunSample
): CsvOperatorFixtureAvailability {
  return {
    available: true,
    kind: "import-dry-run-receipt",
    inputFilename: fixture.inputFixture.filename,
    inputContentType: fixture.inputFixture.contentType,
    inputCsvByteLength: fixture.inputFixture.csvByteLength,
    rowCount: fixture.source.rowCount,
    previewedRows: fixture.source.previewedRows,
    sampledRows: fixture.rowSample.sampledRows,
    diagnosticCount: fixture.diagnostics.length
  };
}

function buildUnavailableFixture(
  supported: boolean
): CsvOperatorFixtureAvailability {
  return {
    available: false,
    kind: null,
    reason: supported ? "missing-fixture-source" : "unsupported-operation"
  };
}

function buildFixtureAvailability(input: {
  operation: CsvOperatorHandoffOperationPacketSummary;
  exportFixture: CsvOperatorFixtureExportSample | null;
  importFixture: CsvOperatorFixtureImportDryRunSample | null;
}): CsvOperatorFixtureAvailability {
  if (!input.operation.supported) {
    return buildUnavailableFixture(false);
  }

  if (input.operation.operation === "export" && input.exportFixture !== null) {
    return buildExportAvailability(input.exportFixture);
  }

  if (isImportOperation(input.operation.operation) && input.importFixture !== null) {
    return buildImportAvailability(input.importFixture);
  }

  return buildUnavailableFixture(true);
}

function readsForFixture(input: {
  fixture: CsvOperatorFixtureAvailability;
  exportFixture: CsvOperatorFixtureExportSample | null;
  importFixture: CsvOperatorFixtureImportDryRunSample | null;
}): CsvOperatorFixtureReadFlags {
  if (!input.fixture.available) {
    return metadataOnlyReads();
  }

  return input.fixture.kind === "export-delivery-packet"
    ? input.exportFixture?.read ?? metadataOnlyReads()
    : input.importFixture?.read ?? metadataOnlyReads();
}

function buildEntityOperation(input: {
  operation: CsvOperatorHandoffOperationPacketSummary;
  release: CsvOperatorFixtureOperationReleaseSummary;
  exportFixture: CsvOperatorFixtureExportSample | null;
  importFixture: CsvOperatorFixtureImportDryRunSample | null;
}): CsvOperatorFixtureEntityOperation {
  const fixture = buildFixtureAvailability({
    operation: input.operation,
    exportFixture: input.exportFixture,
    importFixture: input.importFixture
  });

  return {
    operation: input.operation.operation,
    status: input.operation.status,
    supported: input.operation.supported,
    fixture,
    release: input.release,
    handoff: {
      label: input.operation.label,
      route: input.operation.route,
      handoffSurfaceKinds: input.operation.handoffSurfaceKinds,
      warningCodes: input.operation.readiness.warningCodes,
      sourceCodes: input.operation.remediation.sourceCodes,
      sourceContentTypes: input.operation.sourceContentTypes,
      driftFingerprint: input.operation.drift.fingerprint
    },
    read: combineReads([
      input.operation.read,
      readsForFixture({
        fixture,
        exportFixture: input.exportFixture,
        importFixture: input.importFixture
      })
    ]),
    write: noWrites()
  };
}

function buildEntityFingerprint(input: {
  entity: CsvOperatorFixtureBundleEntity;
  status: CsvOperatorFixtureBundleStatus;
  exportFixture: CsvOperatorFixtureExportSample | null;
  importFixture: CsvOperatorFixtureImportDryRunSample | null;
  operations: readonly CsvOperatorFixtureEntityOperation[];
  releaseFingerprint: string;
}): string {
  return digestPayload({
    entity: input.entity,
    status: input.status,
    releaseFingerprint: input.releaseFingerprint,
    exportFixture:
      input.exportFixture === null
        ? null
        : {
            rowCount: input.exportFixture.rowCount,
            totalAvailableRows: input.exportFixture.totalAvailableRows,
            limits: input.exportFixture.limits,
            csvSnippet: input.exportFixture.csvSnippet
          },
    importFixture:
      input.importFixture === null
        ? null
        : {
            inputFixture: input.importFixture.inputFixture,
            source: input.importFixture.source,
            issueSummary: input.importFixture.issueSummary,
            readinessSummary: input.importFixture.readinessSummary,
            actionSummary: input.importFixture.actionSummary,
            diagnostics: input.importFixture.diagnostics,
            rowSample: input.importFixture.rowSample
          },
    operations: input.operations.map((operation) => ({
      operation: operation.operation,
      status: operation.status,
      supported: operation.supported,
      fixture: operation.fixture
    }))
  });
}

async function buildEntityBundle(
  packet: CsvOperatorHandoffEntityPacket,
  digest: CsvContractReleaseDigest,
  options: CsvOperatorFixtureBundleOptions
): Promise<CsvOperatorFixtureEntityBundle> {
  const [exportFixture, importFixture] = await Promise.all([
    buildExportFixture(packet.entity, options),
    buildImportDryRunFixture(packet.entity, packet.operations, options)
  ]);
  const operations = packet.operations.map((operation) =>
    buildEntityOperation({
      operation,
      release: buildOperationReleaseSummary(
        getOperationDigest(operation.operation)
      ),
      exportFixture,
      importFixture
    })
  );
  const release = buildReleaseSummary(digest);
  const source = buildSource(digest);
  const fingerprint = buildEntityFingerprint({
    entity: packet.entity,
    status: packet.status,
    exportFixture,
    importFixture,
    operations,
    releaseFingerprint: digest.fingerprint
  });

  return {
    contentType: CSV_OPERATOR_FIXTURE_BUNDLE_CONTENT_TYPE,
    bundleVersion: 1,
    entity: packet.entity,
    label: packet.label,
    route: packet.route,
    direction: packet.direction,
    status: packet.status,
    fingerprint,
    operationCount: packet.operationCount,
    supportedOperationCount: packet.supportedOperationCount,
    fixtureOperationCount: operations.filter((operation) => operation.fixture.available)
      .length,
    exportFixture,
    importDryRunFixture: importFixture,
    operations,
    release,
    handoff: {
      warningCodes: packet.warningCodes,
      sourceCodes: packet.sourceCodes,
      sourceContentTypes: packet.sourceContentTypes,
      sourceFingerprintCount: packet.drift.sourceFingerprints.length
    },
    source,
    read: combineReads([
      packet.read,
      exportFixture?.read ?? metadataOnlyReads(),
      importFixture?.read ?? metadataOnlyReads()
    ]),
    write: noWrites()
  };
}

function buildOperationEntity(
  operation: CsvOperatorFixtureBundleOperation,
  entityBundle: CsvOperatorFixtureEntityBundle
): CsvOperatorFixtureOperationEntity {
  const entityOperation = entityBundle.operations.find(
    (candidate) => candidate.operation === operation
  );

  if (entityOperation === undefined) {
    throw new Error(
      `Missing CSV fixture operation ${operation} for ${entityBundle.entity}`
    );
  }

  return {
    entity: entityBundle.entity,
    label: entityBundle.label,
    route: entityBundle.route,
    status: entityOperation.status,
    supported: entityOperation.supported,
    fixture: entityOperation.fixture,
    sourceContentTypes: entityOperation.handoff.sourceContentTypes,
    read: entityOperation.read,
    write: noWrites()
  };
}

function buildOperationFingerprint(input: {
  operation: CsvOperatorFixtureBundleOperation;
  status: CsvOperatorFixtureBundleStatus;
  releaseFingerprint: string;
  entities: readonly CsvOperatorFixtureOperationEntity[];
}): string {
  return digestPayload({
    operation: input.operation,
    status: input.status,
    releaseFingerprint: input.releaseFingerprint,
    entities: input.entities.map((entity) => ({
      entity: entity.entity,
      status: entity.status,
      supported: entity.supported,
      fixture: entity.fixture
    }))
  });
}

function buildOperationBundle(input: {
  packet: CsvOperatorHandoffOperationPacket;
  digest: CsvContractReleaseDigest;
  entityBundles: readonly CsvOperatorFixtureEntityBundle[];
}): CsvOperatorFixtureOperationBundle {
  const release = buildOperationReleaseSummary(
    getOperationDigest(input.packet.operation)
  );
  const entities = input.entityBundles.map((entityBundle) =>
    buildOperationEntity(input.packet.operation, entityBundle)
  );
  const fingerprint = buildOperationFingerprint({
    operation: input.packet.operation,
    status: input.packet.status,
    releaseFingerprint: input.digest.fingerprint,
    entities
  });

  return {
    contentType: CSV_OPERATOR_FIXTURE_BUNDLE_CONTENT_TYPE,
    bundleVersion: 1,
    operation: input.packet.operation,
    status: input.packet.status,
    fingerprint,
    entityCount: input.packet.entityCount,
    supportedEntityCount: input.packet.supportedEntityCount,
    fixtureEntityCount: entities.filter((entity) => entity.fixture.available)
      .length,
    release,
    handoff: {
      capabilityCount: input.packet.capabilityCount,
      stableEntityCount: input.packet.stableEntityCount,
      watchEntityCount: input.packet.watchEntityCount,
      blockedEntityCount: input.packet.blockedEntityCount,
      statusCounts: input.packet.statusCounts,
      warningCodes: input.packet.warningCodes,
      sourceCodes: input.packet.sourceCodes,
      sourceContentTypes: input.packet.sourceContentTypes
    },
    entities,
    source: buildSource(input.digest),
    read: combineReads(entities.map((entity) => entity.read)),
    write: noWrites()
  };
}

function buildBundleFingerprint(input: {
  releaseFingerprint: string;
  entities: readonly CsvOperatorFixtureEntityBundle[];
  operations: readonly CsvOperatorFixtureOperationBundle[];
}): string {
  return digestPayload({
    releaseFingerprint: input.releaseFingerprint,
    entities: input.entities.map((entity) => ({
      entity: entity.entity,
      status: entity.status,
      fingerprint: entity.fingerprint,
      fixtureOperationCount: entity.fixtureOperationCount
    })),
    operations: input.operations.map((operation) => ({
      operation: operation.operation,
      status: operation.status,
      fingerprint: operation.fingerprint,
      fixtureEntityCount: operation.fixtureEntityCount
    }))
  });
}

export function isCsvOperatorFixtureBundleEntity(
  value: string
): value is CsvOperatorFixtureBundleEntity {
  return isCsvOperatorHandoffPacketEntity(value);
}

export function isCsvOperatorFixtureBundleOperation(
  value: string
): value is CsvOperatorFixtureBundleOperation {
  return isCsvOperatorHandoffPacketOperation(value);
}

export async function getCsvOperatorFixtureEntityBundle(
  entity: string,
  options: CsvOperatorFixtureBundleOptions = {}
): Promise<CsvOperatorFixtureEntityBundle | null> {
  const packet = getCsvOperatorHandoffEntityPacket(entity);

  if (packet === null) {
    return null;
  }

  return buildEntityBundle(packet, getCsvContractReleaseDigest(), options);
}

export async function listCsvOperatorFixtureEntityBundles(
  options: CsvOperatorFixtureBundleOptions = {}
): Promise<CsvOperatorFixtureEntityBundle[]> {
  const digest = getCsvContractReleaseDigest();

  return Promise.all(
    getCsvOperatorHandoffPackets().entries.map((packet) =>
      buildEntityBundle(packet, digest, options)
    )
  );
}

export async function getCsvOperatorFixtureOperationBundle(
  operation: string,
  options: CsvOperatorFixtureBundleOptions = {}
): Promise<CsvOperatorFixtureOperationBundle | null> {
  if (!isCsvContractReleaseDigestOperation(operation)) {
    return null;
  }

  const packet = getCsvOperatorHandoffOperationPacket(operation);

  if (packet === null) {
    return null;
  }

  return buildOperationBundle({
    packet,
    digest: getCsvContractReleaseDigest(),
    entityBundles: await listCsvOperatorFixtureEntityBundles(options)
  });
}

export async function listCsvOperatorFixtureOperationBundles(
  options: CsvOperatorFixtureBundleOptions = {}
): Promise<CsvOperatorFixtureOperationBundle[]> {
  const digest = getCsvContractReleaseDigest();
  const entityBundles = await listCsvOperatorFixtureEntityBundles(options);

  return getCsvOperatorHandoffPackets().operations.map((packet) =>
    buildOperationBundle({
      packet,
      digest,
      entityBundles
    })
  );
}

export async function getCsvOperatorFixtureBundle(
  options: CsvOperatorFixtureBundleOptions = {}
): Promise<CsvOperatorFixtureBundle> {
  return getInFlightCsvPacket(fixtureBundleCache, options, async () => {
    const digest = getCsvContractReleaseDigest();
    const handoff = getCsvOperatorHandoffPackets();
    const entities = await Promise.all(
      handoff.entries.map((packet) => buildEntityBundle(packet, digest, options))
    );
    const operations = handoff.operations.map((packet) =>
      buildOperationBundle({
        packet,
        digest,
        entityBundles: entities
      })
    );
    const sourceContentTypes = uniqueStrings([
      CSV_OPERATOR_FIXTURE_BUNDLE_CONTENT_TYPE,
      digest.contentType,
      handoff.contentType,
      ...handoff.sourceContentTypes,
      ...entities.flatMap((entity) => entity.handoff.sourceContentTypes),
      ...operations.flatMap((operation) => operation.handoff.sourceContentTypes)
    ]);
    const fingerprint = buildBundleFingerprint({
      releaseFingerprint: digest.fingerprint,
      entities,
      operations
    });

    return {
      contentType: CSV_OPERATOR_FIXTURE_BUNDLE_CONTENT_TYPE,
      bundleVersion: 1,
      status: digest.status,
      fingerprint,
      entityCount: digest.entityCount,
      operationCount: digest.operationCount,
      capabilityCount: digest.capabilityCount,
      supportedEntityOperationCount: digest.supportedEntityOperationCount,
      fixtureOperationCount: entities.reduce(
        (count, entity) => count + entity.fixtureOperationCount,
        0
      ),
      exportFixtureCount: entities.filter(
        (entity) => entity.exportFixture !== null
      ).length,
      importFixtureCount: entities.filter(
        (entity) => entity.importDryRunFixture !== null
      ).length,
      release: buildReleaseSummary(digest),
      entities,
      operations,
      sourceContentTypes,
      source: buildSource(digest),
      read: combineReads([
        handoff.read,
        ...entities.map((entity) => entity.read),
        ...operations.map((operation) => operation.read)
      ]),
      write: noWrites()
    };
  });
}
