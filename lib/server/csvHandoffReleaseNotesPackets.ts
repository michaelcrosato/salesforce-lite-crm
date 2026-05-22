import { createHash } from "node:crypto";
import {
  CSV_CONTRACT_RELEASE_DIGEST_CONTENT_TYPE,
  getCsvContractReleaseDigest,
  type CsvContractReleaseDigest,
  type CsvContractReleaseDigestStatusCounts,
  type CsvContractReleaseNoteMetadata
} from "@/lib/server/csvContractReleaseDigest";
import {
  CSV_OPERATOR_FIXTURE_BUNDLE_CONTENT_TYPE,
  getCsvOperatorFixtureBundle,
  isCsvOperatorFixtureBundleOperation,
  type CsvOperatorFixtureAvailability,
  type CsvOperatorFixtureBundle,
  type CsvOperatorFixtureBundleOperation,
  type CsvOperatorFixtureBundleOptions,
  type CsvOperatorFixtureEntityBundle,
  type CsvOperatorFixtureOperationBundle
} from "@/lib/server/csvOperatorFixtureBundles";
import {
  type CsvOperatorReadinessWarningCode
} from "@/lib/server/csvOperatorReadinessScorecards";
import {
  type CsvOperatorRemediationSourceCode
} from "@/lib/server/csvOperatorRemediationRunbooks";
import {
  CSV_RELEASE_VERIFICATION_MANIFEST_CONTENT_TYPE,
  getCsvReleaseVerificationManifest,
  isCsvReleaseVerificationManifestEntity,
  type CsvReleaseVerificationEntityCoverage,
  type CsvReleaseVerificationManifest,
  type CsvReleaseVerificationManifestEntity,
  type CsvReleaseVerificationManifestStatus,
  type CsvReleaseVerificationOperationCoverage,
  type CsvReleaseVerificationReadFlags,
  type CsvReleaseVerificationWriteFlags
} from "@/lib/server/csvReleaseVerificationManifests";

export const CSV_HANDOFF_RELEASE_NOTES_PACKET_CONTENT_TYPE =
  "application/json; charset=utf-8" as const;

export type CsvHandoffReleaseNotesEntity =
  CsvReleaseVerificationManifestEntity;
export type CsvHandoffReleaseNotesOperation =
  CsvOperatorFixtureBundleOperation;
export type CsvHandoffReleaseNotesStatus =
  CsvReleaseVerificationManifestStatus;
export type CsvHandoffReleaseNotesStatusCounts =
  CsvContractReleaseDigestStatusCounts;
export type CsvHandoffReleaseNotesOptions = CsvOperatorFixtureBundleOptions;
export type CsvHandoffReleaseNotesReadFlags =
  CsvReleaseVerificationReadFlags;
export type CsvHandoffReleaseNotesWriteFlags =
  CsvReleaseVerificationWriteFlags;

export type CsvHandoffReleaseNotesSource = {
  releaseVerificationContentType:
    typeof CSV_RELEASE_VERIFICATION_MANIFEST_CONTENT_TYPE;
  releaseVerificationManifestVersion: 1;
  releaseVerificationFingerprint: string;
  releaseDigestContentType: typeof CSV_CONTRACT_RELEASE_DIGEST_CONTENT_TYPE;
  releaseDigestVersion: 1;
  releaseDigestFingerprint: string;
  operatorFixtureContentType: typeof CSV_OPERATOR_FIXTURE_BUNDLE_CONTENT_TYPE;
  operatorFixtureBundleVersion: 1;
  operatorFixtureFingerprint: string;
  operatorHandoffStatus: CsvHandoffReleaseNotesStatus;
  contractDriftFingerprint: string;
};

export type CsvHandoffReleaseNotesEntityOperationSummary = {
  operation: CsvHandoffReleaseNotesOperation;
  status: CsvHandoffReleaseNotesStatus;
  supported: boolean;
  fixture: CsvOperatorFixtureAvailability;
  warningCodes: readonly CsvOperatorReadinessWarningCode[];
  sourceCodes: readonly CsvOperatorRemediationSourceCode[];
  sourceContentTypes: readonly string[];
  read: CsvHandoffReleaseNotesReadFlags;
  write: CsvHandoffReleaseNotesWriteFlags;
};

export type CsvHandoffReleaseNotesEntityPacket = {
  contentType: typeof CSV_HANDOFF_RELEASE_NOTES_PACKET_CONTENT_TYPE;
  packetVersion: 1;
  entity: CsvHandoffReleaseNotesEntity;
  label: string;
  route: string | null;
  direction: CsvReleaseVerificationEntityCoverage["direction"];
  status: CsvHandoffReleaseNotesStatus;
  fingerprint: string;
  operationCount: number;
  supportedOperationCount: number;
  unsupportedOperationCount: number;
  fixtureOperationCount: number;
  warningCodes: readonly CsvOperatorReadinessWarningCode[];
  sourceCodes: readonly CsvOperatorRemediationSourceCode[];
  sourceFingerprintCount: number;
  operations: readonly CsvHandoffReleaseNotesEntityOperationSummary[];
  source: CsvHandoffReleaseNotesSource;
  read: CsvHandoffReleaseNotesReadFlags;
  write: CsvHandoffReleaseNotesWriteFlags;
};

export type CsvHandoffReleaseNotesOperationEntitySummary = {
  entity: CsvHandoffReleaseNotesEntity;
  label: string;
  route: string | null;
  status: CsvHandoffReleaseNotesStatus;
  supported: boolean;
  fixture: CsvOperatorFixtureAvailability;
  read: CsvHandoffReleaseNotesReadFlags;
  write: CsvHandoffReleaseNotesWriteFlags;
};

export type CsvHandoffReleaseNotesOperationPacket = {
  contentType: typeof CSV_HANDOFF_RELEASE_NOTES_PACKET_CONTENT_TYPE;
  packetVersion: 1;
  operation: CsvHandoffReleaseNotesOperation;
  status: CsvHandoffReleaseNotesStatus;
  fingerprint: string;
  entityCount: number;
  supportedEntityCount: number;
  unsupportedEntityCount: number;
  fixtureEntityCount: number;
  warningCodes: readonly CsvOperatorReadinessWarningCode[];
  sourceCodes: readonly CsvOperatorRemediationSourceCode[];
  sourceFingerprintCount: number;
  sourceContentTypes: readonly string[];
  entities: readonly CsvHandoffReleaseNotesOperationEntitySummary[];
  source: CsvHandoffReleaseNotesSource;
  read: CsvHandoffReleaseNotesReadFlags;
  write: CsvHandoffReleaseNotesWriteFlags;
};

export type CsvHandoffReleaseNotesFixtureRollup = {
  fixtureOperationCount: number;
  exportFixtureCount: number;
  importFixtureCount: number;
  operationAvailability: readonly {
    operation: CsvHandoffReleaseNotesOperation;
    supportedEntityCount: number;
    fixtureEntityCount: number;
    missingFixtureEntityCount: number;
  }[];
};

export type CsvHandoffReleaseNotesPacket = {
  contentType: typeof CSV_HANDOFF_RELEASE_NOTES_PACKET_CONTENT_TYPE;
  packetVersion: 1;
  status: CsvHandoffReleaseNotesStatus;
  fingerprint: string;
  releaseNote: CsvContractReleaseNoteMetadata;
  entityCount: number;
  operationCount: number;
  capabilityCount: number;
  supportedEntityOperationCount: number;
  unsupportedEntityOperationCount: number;
  statusCounts: CsvHandoffReleaseNotesStatusCounts;
  operationStatusCounts: CsvHandoffReleaseNotesStatusCounts;
  entityOperationStatusCounts: CsvHandoffReleaseNotesStatusCounts;
  sourceFingerprintRollup:
    CsvReleaseVerificationManifest["sourceFingerprintRollup"];
  warningCodeRollup: CsvReleaseVerificationManifest["warningCodeRollup"];
  sourceCodeRollup: CsvReleaseVerificationManifest["sourceCodeRollup"];
  fixtureRollup: CsvHandoffReleaseNotesFixtureRollup;
  entities: readonly CsvHandoffReleaseNotesEntityPacket[];
  operations: readonly CsvHandoffReleaseNotesOperationPacket[];
  sourceContentTypes: readonly string[];
  source: CsvHandoffReleaseNotesSource;
  read: CsvHandoffReleaseNotesReadFlags;
  write: CsvHandoffReleaseNotesWriteFlags;
};

type ReadFlagInput = {
  metadata: true;
  database: boolean;
  csvInput: boolean;
  csvOutput: boolean;
};

function noWrites(): CsvHandoffReleaseNotesWriteFlags {
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

function combineReads(
  reads: readonly (ReadFlagInput | CsvHandoffReleaseNotesReadFlags)[]
): CsvHandoffReleaseNotesReadFlags {
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

function buildSource(input: {
  manifest: CsvReleaseVerificationManifest;
  digest: CsvContractReleaseDigest;
  fixture: CsvOperatorFixtureBundle;
}): CsvHandoffReleaseNotesSource {
  return {
    releaseVerificationContentType: input.manifest.contentType,
    releaseVerificationManifestVersion: input.manifest.manifestVersion,
    releaseVerificationFingerprint: input.manifest.fingerprint,
    releaseDigestContentType: input.digest.contentType,
    releaseDigestVersion: input.digest.digestVersion,
    releaseDigestFingerprint: input.digest.fingerprint,
    operatorFixtureContentType: input.fixture.contentType,
    operatorFixtureBundleVersion: input.fixture.bundleVersion,
    operatorFixtureFingerprint: input.fixture.fingerprint,
    operatorHandoffStatus: input.digest.source.operatorHandoffStatus,
    contractDriftFingerprint: input.digest.source.contractDriftFingerprint
  };
}

function findFixtureEntity(
  fixture: CsvOperatorFixtureBundle,
  entity: CsvHandoffReleaseNotesEntity
): CsvOperatorFixtureEntityBundle {
  const bundle = fixture.entities.find((entry) => entry.entity === entity);

  if (bundle === undefined) {
    throw new Error(`Missing CSV release notes fixture entity ${entity}`);
  }

  return bundle;
}

function findFixtureOperation(
  fixture: CsvOperatorFixtureBundle,
  operation: CsvHandoffReleaseNotesOperation
): CsvOperatorFixtureOperationBundle {
  const bundle = fixture.operations.find(
    (entry) => entry.operation === operation
  );

  if (bundle === undefined) {
    throw new Error(`Missing CSV release notes fixture operation ${operation}`);
  }

  return bundle;
}

function buildEntityOperationSummary(input: {
  manifestOperation: CsvReleaseVerificationEntityCoverage["operations"][number];
  fixtureEntity: CsvOperatorFixtureEntityBundle;
}): CsvHandoffReleaseNotesEntityOperationSummary {
  const fixtureOperation = input.fixtureEntity.operations.find(
    (entry) => entry.operation === input.manifestOperation.operation
  );

  if (fixtureOperation === undefined) {
    throw new Error(
      `Missing CSV release notes fixture operation ${input.manifestOperation.operation} for ${input.fixtureEntity.entity}`
    );
  }

  return {
    operation: input.manifestOperation.operation,
    status: input.manifestOperation.status,
    supported: input.manifestOperation.supported,
    fixture: fixtureOperation.fixture,
    warningCodes: input.manifestOperation.warningCodes,
    sourceCodes: input.manifestOperation.sourceCodes,
    sourceContentTypes: input.manifestOperation.sourceContentTypes,
    read: combineReads([input.manifestOperation.read, fixtureOperation.read]),
    write: noWrites()
  };
}

function buildEntityFingerprint(input: {
  source: CsvHandoffReleaseNotesSource;
  entity: CsvHandoffReleaseNotesEntity;
  status: CsvHandoffReleaseNotesStatus;
  supportedOperationCount: number;
  unsupportedOperationCount: number;
  fixtureOperationCount: number;
  operations: readonly CsvHandoffReleaseNotesEntityOperationSummary[];
}): string {
  return digestPayload({
    source: input.source,
    entity: input.entity,
    status: input.status,
    supportedOperationCount: input.supportedOperationCount,
    unsupportedOperationCount: input.unsupportedOperationCount,
    fixtureOperationCount: input.fixtureOperationCount,
    operations: input.operations.map((operation) => ({
      operation: operation.operation,
      status: operation.status,
      supported: operation.supported,
      fixture: operation.fixture
    }))
  });
}

function buildEntityPacket(input: {
  entity: CsvReleaseVerificationEntityCoverage;
  fixture: CsvOperatorFixtureBundle;
  source: CsvHandoffReleaseNotesSource;
}): CsvHandoffReleaseNotesEntityPacket {
  const fixtureEntity = findFixtureEntity(input.fixture, input.entity.entity);
  const operations = input.entity.operations.map((operation) =>
    buildEntityOperationSummary({
      manifestOperation: operation,
      fixtureEntity
    })
  );
  const read = combineReads([input.entity.read, fixtureEntity.read]);
  const fingerprint = buildEntityFingerprint({
    source: input.source,
    entity: input.entity.entity,
    status: input.entity.status,
    supportedOperationCount: input.entity.supportedOperationCount,
    unsupportedOperationCount: input.entity.unsupportedOperationCount,
    fixtureOperationCount: fixtureEntity.fixtureOperationCount,
    operations
  });

  return {
    contentType: CSV_HANDOFF_RELEASE_NOTES_PACKET_CONTENT_TYPE,
    packetVersion: 1,
    entity: input.entity.entity,
    label: input.entity.label,
    route: input.entity.route,
    direction: input.entity.direction,
    status: input.entity.status,
    fingerprint,
    operationCount: input.entity.operationCount,
    supportedOperationCount: input.entity.supportedOperationCount,
    unsupportedOperationCount: input.entity.unsupportedOperationCount,
    fixtureOperationCount: fixtureEntity.fixtureOperationCount,
    warningCodes: input.entity.warningCodes,
    sourceCodes: input.entity.sourceCodes,
    sourceFingerprintCount: input.entity.sourceFingerprintCount,
    operations,
    source: input.source,
    read,
    write: noWrites()
  };
}

function buildOperationEntitySummary(input: {
  fixtureEntity: CsvOperatorFixtureOperationBundle["entities"][number];
}): CsvHandoffReleaseNotesOperationEntitySummary {
  return {
    entity: input.fixtureEntity.entity,
    label: input.fixtureEntity.label,
    route: input.fixtureEntity.route,
    status: input.fixtureEntity.status,
    supported: input.fixtureEntity.supported,
    fixture: input.fixtureEntity.fixture,
    read: input.fixtureEntity.read,
    write: noWrites()
  };
}

function buildOperationFingerprint(input: {
  source: CsvHandoffReleaseNotesSource;
  operation: CsvHandoffReleaseNotesOperation;
  status: CsvHandoffReleaseNotesStatus;
  supportedEntityCount: number;
  unsupportedEntityCount: number;
  fixtureEntityCount: number;
  entities: readonly CsvHandoffReleaseNotesOperationEntitySummary[];
}): string {
  return digestPayload({
    source: input.source,
    operation: input.operation,
    status: input.status,
    supportedEntityCount: input.supportedEntityCount,
    unsupportedEntityCount: input.unsupportedEntityCount,
    fixtureEntityCount: input.fixtureEntityCount,
    entities: input.entities.map((entity) => ({
      entity: entity.entity,
      status: entity.status,
      supported: entity.supported,
      fixture: entity.fixture
    }))
  });
}

function buildOperationPacket(input: {
  operation: CsvReleaseVerificationOperationCoverage;
  fixtureOperation: CsvOperatorFixtureOperationBundle;
  source: CsvHandoffReleaseNotesSource;
}): CsvHandoffReleaseNotesOperationPacket {
  const entities = input.fixtureOperation.entities.map((entity) =>
    buildOperationEntitySummary({ fixtureEntity: entity })
  );
  const read = combineReads([input.operation.read, input.fixtureOperation.read]);
  const fingerprint = buildOperationFingerprint({
    source: input.source,
    operation: input.operation.operation,
    status: input.operation.status,
    supportedEntityCount: input.operation.supportedEntityCount,
    unsupportedEntityCount: input.operation.unsupportedEntityCount,
    fixtureEntityCount: input.fixtureOperation.fixtureEntityCount,
    entities
  });

  return {
    contentType: CSV_HANDOFF_RELEASE_NOTES_PACKET_CONTENT_TYPE,
    packetVersion: 1,
    operation: input.operation.operation,
    status: input.operation.status,
    fingerprint,
    entityCount: input.operation.entityCount,
    supportedEntityCount: input.operation.supportedEntityCount,
    unsupportedEntityCount: input.operation.unsupportedEntityCount,
    fixtureEntityCount: input.fixtureOperation.fixtureEntityCount,
    warningCodes: input.operation.warningCodes,
    sourceCodes: input.operation.sourceCodes,
    sourceFingerprintCount: input.operation.sourceFingerprintCount,
    sourceContentTypes: input.operation.sourceContentTypes,
    entities,
    source: input.source,
    read,
    write: noWrites()
  };
}

function buildFixtureRollup(
  fixture: CsvOperatorFixtureBundle
): CsvHandoffReleaseNotesFixtureRollup {
  return {
    fixtureOperationCount: fixture.fixtureOperationCount,
    exportFixtureCount: fixture.exportFixtureCount,
    importFixtureCount: fixture.importFixtureCount,
    operationAvailability: fixture.operations.map((operation) => ({
      operation: operation.operation,
      supportedEntityCount: operation.supportedEntityCount,
      fixtureEntityCount: operation.fixtureEntityCount,
      missingFixtureEntityCount:
        operation.supportedEntityCount - operation.fixtureEntityCount
    }))
  };
}

function buildPacketFingerprint(input: {
  source: CsvHandoffReleaseNotesSource;
  status: CsvHandoffReleaseNotesStatus;
  supportedEntityOperationCount: number;
  unsupportedEntityOperationCount: number;
  fixtureRollup: CsvHandoffReleaseNotesFixtureRollup;
  entities: readonly CsvHandoffReleaseNotesEntityPacket[];
  operations: readonly CsvHandoffReleaseNotesOperationPacket[];
}): string {
  return digestPayload({
    source: input.source,
    status: input.status,
    supportedEntityOperationCount: input.supportedEntityOperationCount,
    unsupportedEntityOperationCount: input.unsupportedEntityOperationCount,
    fixtureRollup: input.fixtureRollup,
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

export function isCsvHandoffReleaseNotesEntity(
  value: string
): value is CsvHandoffReleaseNotesEntity {
  return isCsvReleaseVerificationManifestEntity(value);
}

export function isCsvHandoffReleaseNotesOperation(
  value: string
): value is CsvHandoffReleaseNotesOperation {
  return isCsvOperatorFixtureBundleOperation(value);
}

export async function getCsvHandoffReleaseNotesPacket(
  options: CsvHandoffReleaseNotesOptions = {}
): Promise<CsvHandoffReleaseNotesPacket> {
  const [manifest, digest, fixture] = await Promise.all([
    Promise.resolve(getCsvReleaseVerificationManifest()),
    Promise.resolve(getCsvContractReleaseDigest()),
    getCsvOperatorFixtureBundle(options)
  ]);
  const source = buildSource({ manifest, digest, fixture });
  const entities = manifest.coverage.entities.map((entity) =>
    buildEntityPacket({
      entity,
      fixture,
      source
    })
  );
  const operations = manifest.coverage.operations.map((operation) =>
    buildOperationPacket({
      operation,
      fixtureOperation: findFixtureOperation(fixture, operation.operation),
      source
    })
  );
  const fixtureRollup = buildFixtureRollup(fixture);
  const fingerprint = buildPacketFingerprint({
    source,
    status: manifest.status,
    supportedEntityOperationCount: manifest.supportedEntityOperationCount,
    unsupportedEntityOperationCount: manifest.unsupportedEntityOperationCount,
    fixtureRollup,
    entities,
    operations
  });
  const sourceContentTypes = uniqueStrings([
    CSV_HANDOFF_RELEASE_NOTES_PACKET_CONTENT_TYPE,
    manifest.contentType,
    digest.contentType,
    fixture.contentType,
    ...manifest.sourceContentTypes,
    ...fixture.sourceContentTypes
  ]);

  return {
    contentType: CSV_HANDOFF_RELEASE_NOTES_PACKET_CONTENT_TYPE,
    packetVersion: 1,
    status: manifest.status,
    fingerprint,
    releaseNote: digest.releaseNote,
    entityCount: manifest.entityCount,
    operationCount: manifest.operationCount,
    capabilityCount: manifest.capabilityCount,
    supportedEntityOperationCount: manifest.supportedEntityOperationCount,
    unsupportedEntityOperationCount: manifest.unsupportedEntityOperationCount,
    statusCounts: manifest.statusCounts,
    operationStatusCounts: manifest.operationStatusCounts,
    entityOperationStatusCounts: manifest.entityOperationStatusCounts,
    sourceFingerprintRollup: manifest.sourceFingerprintRollup,
    warningCodeRollup: manifest.warningCodeRollup,
    sourceCodeRollup: manifest.sourceCodeRollup,
    fixtureRollup,
    entities,
    operations,
    sourceContentTypes,
    source,
    read: combineReads([manifest.read, digest.read, fixture.read]),
    write: noWrites()
  };
}

export async function listCsvHandoffReleaseNotesEntityPackets(
  options: CsvHandoffReleaseNotesOptions = {}
): Promise<CsvHandoffReleaseNotesEntityPacket[]> {
  return (await getCsvHandoffReleaseNotesPacket(options)).entities.slice();
}

export async function getCsvHandoffReleaseNotesEntityPacket(
  entity: string,
  options: CsvHandoffReleaseNotesOptions = {}
): Promise<CsvHandoffReleaseNotesEntityPacket | null> {
  if (!isCsvHandoffReleaseNotesEntity(entity)) {
    return null;
  }

  const packet = await getCsvHandoffReleaseNotesPacket(options);

  return packet.entities.find((entry) => entry.entity === entity) ?? null;
}

export async function listCsvHandoffReleaseNotesOperationPackets(
  options: CsvHandoffReleaseNotesOptions = {}
): Promise<CsvHandoffReleaseNotesOperationPacket[]> {
  return (await getCsvHandoffReleaseNotesPacket(options)).operations.slice();
}

export async function getCsvHandoffReleaseNotesOperationPacket(
  operation: string,
  options: CsvHandoffReleaseNotesOptions = {}
): Promise<CsvHandoffReleaseNotesOperationPacket | null> {
  if (!isCsvHandoffReleaseNotesOperation(operation)) {
    return null;
  }

  const packet = await getCsvHandoffReleaseNotesPacket(options);

  return packet.operations.find((entry) => entry.operation === operation) ?? null;
}
