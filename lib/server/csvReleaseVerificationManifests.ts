import { createHash } from "node:crypto";
import {
  CSV_CONTRACT_RELEASE_DIGEST_CONTENT_TYPE,
  getCsvContractReleaseDigest,
  getCsvContractReleaseOperationDigest,
  isCsvContractReleaseDigestOperation,
  listCsvContractReleaseOperationDigests,
  type CsvContractReleaseDigestOperation,
  type CsvContractReleaseDigestReadFlags,
  type CsvContractReleaseDigestStatus,
  type CsvContractReleaseDigestStatusCounts,
  type CsvContractReleaseDigestWriteFlags,
  type CsvContractReleaseOperationDigest,
  type CsvContractReleaseSourceCodeRollup,
  type CsvContractReleaseSourceFingerprintRollup,
  type CsvContractReleaseWarningCodeRollup
} from "@/lib/server/csvContractReleaseDigest";
import {
  type CsvContractDriftSourceFingerprint
} from "@/lib/server/csvContractDriftSnapshots";
import {
  CSV_OPERATOR_HANDOFF_PACKET_CONTENT_TYPE,
  getCsvOperatorHandoffEntityPacket,
  getCsvOperatorHandoffOperationPacket,
  getCsvOperatorHandoffPackets,
  isCsvOperatorHandoffPacketEntity,
  type CsvOperatorHandoffEntityPacket,
  type CsvOperatorHandoffOperationPacket,
  type CsvOperatorHandoffOperationPacketSummary,
  type CsvOperatorHandoffPacketEntity,
  type CsvOperatorHandoffReadFlags
} from "@/lib/server/csvOperatorHandoffPackets";
import {
  type CsvOperatorReadinessWarningCode
} from "@/lib/server/csvOperatorReadinessScorecards";
import {
  type CsvOperatorRemediationSourceCode
} from "@/lib/server/csvOperatorRemediationRunbooks";

export const CSV_RELEASE_VERIFICATION_MANIFEST_CONTENT_TYPE =
  "application/json; charset=utf-8" as const;

export type CsvReleaseVerificationManifestEntity =
  CsvOperatorHandoffPacketEntity;
export type CsvReleaseVerificationManifestOperation =
  CsvContractReleaseDigestOperation;
export type CsvReleaseVerificationManifestStatus =
  CsvContractReleaseDigestStatus;
export type CsvReleaseVerificationReadFlags =
  CsvContractReleaseDigestReadFlags;
export type CsvReleaseVerificationWriteFlags =
  CsvContractReleaseDigestWriteFlags;
export type CsvReleaseVerificationStatusCounts =
  CsvContractReleaseDigestStatusCounts;

export type CsvReleaseVerificationSource = {
  releaseDigestContentType: typeof CSV_CONTRACT_RELEASE_DIGEST_CONTENT_TYPE;
  releaseDigestVersion: 1;
  releaseDigestFingerprint: string;
  operatorHandoffContentType: typeof CSV_OPERATOR_HANDOFF_PACKET_CONTENT_TYPE;
  operatorHandoffPacketVersion: 1;
  operatorHandoffStatus: CsvReleaseVerificationManifestStatus;
  contractDriftFingerprint: string;
};

export type CsvReleaseVerificationOperationCoverage = {
  operation: CsvReleaseVerificationManifestOperation;
  status: CsvReleaseVerificationManifestStatus;
  entityCount: number;
  capabilityCount: number;
  supportedEntityCount: number;
  unsupportedEntityCount: number;
  stableEntityCount: number;
  watchEntityCount: number;
  blockedEntityCount: number;
  statusCounts: CsvReleaseVerificationStatusCounts;
  warningCodes: readonly CsvOperatorReadinessWarningCode[];
  sourceCodes: readonly CsvOperatorRemediationSourceCode[];
  sourceFingerprintCount: number;
  sourceContentTypes: readonly string[];
  read: CsvReleaseVerificationReadFlags;
  write: CsvReleaseVerificationWriteFlags;
};

export type CsvReleaseVerificationEntityOperationCoverage = {
  operation: CsvReleaseVerificationManifestOperation;
  status: CsvReleaseVerificationManifestStatus;
  supported: boolean;
  warningCodes: readonly CsvOperatorReadinessWarningCode[];
  sourceCodes: readonly CsvOperatorRemediationSourceCode[];
  sourceContentTypes: readonly string[];
  driftFingerprint: string;
  read: CsvReleaseVerificationReadFlags;
  write: CsvReleaseVerificationWriteFlags;
};

export type CsvReleaseVerificationEntityCoverage = {
  entity: CsvReleaseVerificationManifestEntity;
  label: string;
  route: string | null;
  direction: CsvOperatorHandoffEntityPacket["direction"];
  status: CsvReleaseVerificationManifestStatus;
  operationCount: number;
  supportedOperationCount: number;
  unsupportedOperationCount: number;
  blockedOperationCount: number;
  statusCounts: CsvReleaseVerificationStatusCounts;
  warningCodes: readonly CsvOperatorReadinessWarningCode[];
  sourceCodes: readonly CsvOperatorRemediationSourceCode[];
  sourceFingerprintCount: number;
  sourceFingerprints: readonly CsvContractDriftSourceFingerprint[];
  sourceContentTypes: readonly string[];
  operations: readonly CsvReleaseVerificationEntityOperationCoverage[];
  read: CsvReleaseVerificationReadFlags;
  write: CsvReleaseVerificationWriteFlags;
};

export type CsvReleaseVerificationOperationManifest =
  CsvReleaseVerificationOperationCoverage & {
    contentType: typeof CSV_RELEASE_VERIFICATION_MANIFEST_CONTENT_TYPE;
    manifestVersion: 1;
    source: CsvReleaseVerificationSource;
  };

export type CsvReleaseVerificationEntityManifest =
  CsvReleaseVerificationEntityCoverage & {
    contentType: typeof CSV_RELEASE_VERIFICATION_MANIFEST_CONTENT_TYPE;
    manifestVersion: 1;
    source: CsvReleaseVerificationSource;
  };

export type CsvReleaseVerificationManifest = {
  contentType: typeof CSV_RELEASE_VERIFICATION_MANIFEST_CONTENT_TYPE;
  manifestVersion: 1;
  status: CsvReleaseVerificationManifestStatus;
  fingerprint: string;
  entityCount: number;
  operationCount: number;
  capabilityCount: number;
  supportedEntityOperationCount: number;
  unsupportedEntityOperationCount: number;
  statusCounts: CsvReleaseVerificationStatusCounts;
  operationStatusCounts: CsvReleaseVerificationStatusCounts;
  entityOperationStatusCounts: CsvReleaseVerificationStatusCounts;
  sourceContentTypes: readonly string[];
  sourceFingerprintRollup: {
    sourceFingerprintCount: number;
    payloadBytes: number;
    entries: readonly CsvContractReleaseSourceFingerprintRollup[];
  };
  warningCodeRollup: {
    warningCodes: readonly CsvOperatorReadinessWarningCode[];
    entries: readonly CsvContractReleaseWarningCodeRollup[];
  };
  sourceCodeRollup: {
    sourceCodes: readonly CsvOperatorRemediationSourceCode[];
    entries: readonly CsvContractReleaseSourceCodeRollup[];
  };
  coverage: {
    entities: readonly CsvReleaseVerificationEntityCoverage[];
    operations: readonly CsvReleaseVerificationOperationCoverage[];
  };
  source: CsvReleaseVerificationSource;
  read: CsvReleaseVerificationReadFlags;
  write: CsvReleaseVerificationWriteFlags;
};

type ReadFlagInput = {
  metadata: true;
  database: boolean;
  csvInput: boolean;
  csvOutput: boolean;
};

function noWrites(): CsvReleaseVerificationWriteFlags {
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

function metadataOnlyReads(): CsvReleaseVerificationReadFlags {
  return {
    metadata: true,
    database: false,
    csvInput: false,
    csvOutput: false
  };
}

function combineReads(
  reads: readonly (ReadFlagInput | CsvOperatorHandoffReadFlags)[]
): CsvReleaseVerificationReadFlags {
  return {
    metadata: true,
    database: reads.some((read) => read.database),
    csvInput: reads.some((read) => read.csvInput),
    csvOutput: reads.some((read) => read.csvOutput)
  };
}

function uniqueStrings(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    if (!seen.has(value)) {
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

function buildSource(): CsvReleaseVerificationSource {
  const digest = getCsvContractReleaseDigest();

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

function buildOperationCoverage(input: {
  digest: CsvContractReleaseOperationDigest;
  packet: CsvOperatorHandoffOperationPacket;
}): CsvReleaseVerificationOperationCoverage {
  return {
    operation: input.digest.operation,
    status: input.digest.status,
    entityCount: input.digest.entityCount,
    capabilityCount: input.digest.capabilityCount,
    supportedEntityCount: input.digest.supportedEntityCount,
    unsupportedEntityCount: input.digest.unsupportedEntityCount,
    stableEntityCount: input.digest.stableEntityCount,
    watchEntityCount: input.digest.watchEntityCount,
    blockedEntityCount: input.digest.blockedEntityCount,
    statusCounts: input.digest.statusCounts,
    warningCodes: input.digest.warningCodes,
    sourceCodes: input.digest.sourceCodes,
    sourceFingerprintCount: input.packet.sourceFingerprints.length,
    sourceContentTypes: input.packet.sourceContentTypes,
    read: combineReads([input.digest.read, input.packet.read]),
    write: noWrites()
  };
}

function buildOperationManifest(
  digest: CsvContractReleaseOperationDigest
): CsvReleaseVerificationOperationManifest {
  const packet = getCsvOperatorHandoffOperationPacket(digest.operation);

  if (packet === null) {
    throw new Error(
      `Missing CSV release verification operation ${digest.operation}`
    );
  }

  return {
    contentType: CSV_RELEASE_VERIFICATION_MANIFEST_CONTENT_TYPE,
    manifestVersion: 1,
    ...buildOperationCoverage({ digest, packet }),
    source: buildSource()
  };
}

function buildEntityOperationCoverage(
  operation: CsvOperatorHandoffOperationPacketSummary
): CsvReleaseVerificationEntityOperationCoverage {
  return {
    operation: operation.operation,
    status: operation.status,
    supported: operation.supported,
    warningCodes: operation.readiness.warningCodes,
    sourceCodes: operation.remediation.sourceCodes,
    sourceContentTypes: operation.sourceContentTypes,
    driftFingerprint: operation.drift.fingerprint,
    read: combineReads([
      operation.read,
      operation.readiness.read,
      operation.remediation.read
    ]),
    write: noWrites()
  };
}

function buildEntityCoverage(
  packet: CsvOperatorHandoffEntityPacket
): CsvReleaseVerificationEntityCoverage {
  return {
    entity: packet.entity,
    label: packet.label,
    route: packet.route,
    direction: packet.direction,
    status: packet.status,
    operationCount: packet.operationCount,
    supportedOperationCount: packet.supportedOperationCount,
    unsupportedOperationCount:
      packet.operationCount - packet.supportedOperationCount,
    blockedOperationCount: packet.blockedOperationCount,
    statusCounts: packet.statusCounts,
    warningCodes: packet.warningCodes,
    sourceCodes: packet.sourceCodes,
    sourceFingerprintCount: packet.drift.sourceFingerprints.length,
    sourceFingerprints: packet.drift.sourceFingerprints,
    sourceContentTypes: packet.sourceContentTypes,
    operations: packet.operations.map(buildEntityOperationCoverage),
    read: combineReads([packet.read]),
    write: noWrites()
  };
}

function buildEntityManifest(
  packet: CsvOperatorHandoffEntityPacket
): CsvReleaseVerificationEntityManifest {
  return {
    contentType: CSV_RELEASE_VERIFICATION_MANIFEST_CONTENT_TYPE,
    manifestVersion: 1,
    ...buildEntityCoverage(packet),
    source: buildSource()
  };
}

function buildManifestFingerprint(input: {
  releaseDigestFingerprint: string;
  entityCount: number;
  operationCount: number;
  supportedEntityOperationCount: number;
  unsupportedEntityOperationCount: number;
  entityOperationStatusCounts: CsvReleaseVerificationStatusCounts;
  sourceContentTypes: readonly string[];
  sourceFingerprints: readonly CsvContractReleaseSourceFingerprintRollup[];
  warningCodes: readonly CsvContractReleaseWarningCodeRollup[];
  sourceCodes: readonly CsvContractReleaseSourceCodeRollup[];
  entities: readonly CsvReleaseVerificationEntityCoverage[];
  operations: readonly CsvReleaseVerificationOperationCoverage[];
}): string {
  return digestPayload({
    releaseDigestFingerprint: input.releaseDigestFingerprint,
    entityCount: input.entityCount,
    operationCount: input.operationCount,
    supportedEntityOperationCount: input.supportedEntityOperationCount,
    unsupportedEntityOperationCount: input.unsupportedEntityOperationCount,
    entityOperationStatusCounts: input.entityOperationStatusCounts,
    sourceContentTypes: input.sourceContentTypes,
    sourceFingerprints: input.sourceFingerprints.map((entry) => ({
      source: entry.source,
      scope: entry.scope,
      contentType: entry.contentType,
      fingerprintCount: entry.fingerprintCount,
      fingerprints: entry.fingerprints
    })),
    warningCodes: input.warningCodes.map((entry) => ({
      code: entry.code,
      occurrenceCount: entry.occurrenceCount
    })),
    sourceCodes: input.sourceCodes.map((entry) => ({
      code: entry.code,
      occurrenceCount: entry.occurrenceCount,
      requiresContractChangeCount: entry.requiresContractChangeCount
    })),
    entities: input.entities.map((entity) => ({
      entity: entity.entity,
      status: entity.status,
      supportedOperationCount: entity.supportedOperationCount,
      unsupportedOperationCount: entity.unsupportedOperationCount,
      sourceFingerprintCount: entity.sourceFingerprintCount,
      warningCodes: entity.warningCodes,
      sourceCodes: entity.sourceCodes
    })),
    operations: input.operations.map((operation) => ({
      operation: operation.operation,
      status: operation.status,
      supportedEntityCount: operation.supportedEntityCount,
      unsupportedEntityCount: operation.unsupportedEntityCount,
      sourceFingerprintCount: operation.sourceFingerprintCount,
      warningCodes: operation.warningCodes,
      sourceCodes: operation.sourceCodes
    }))
  });
}

export function isCsvReleaseVerificationManifestEntity(
  value: string
): value is CsvReleaseVerificationManifestEntity {
  return isCsvOperatorHandoffPacketEntity(value);
}

export function isCsvReleaseVerificationManifestOperation(
  value: string
): value is CsvReleaseVerificationManifestOperation {
  return isCsvContractReleaseDigestOperation(value);
}

export function getCsvReleaseVerificationOperationManifest(
  operation: string
): CsvReleaseVerificationOperationManifest | null {
  const digest = getCsvContractReleaseOperationDigest(operation);

  if (digest === null) {
    return null;
  }

  return buildOperationManifest(digest);
}

export function listCsvReleaseVerificationOperationManifests(): CsvReleaseVerificationOperationManifest[] {
  return listCsvContractReleaseOperationDigests().map(buildOperationManifest);
}

export function getCsvReleaseVerificationEntityManifest(
  entity: string
): CsvReleaseVerificationEntityManifest | null {
  const packet = getCsvOperatorHandoffEntityPacket(entity);

  if (packet === null) {
    return null;
  }

  return buildEntityManifest(packet);
}

export function listCsvReleaseVerificationEntityManifests(): CsvReleaseVerificationEntityManifest[] {
  return getCsvOperatorHandoffPackets().entries.map(buildEntityManifest);
}

export function getCsvReleaseVerificationManifest(): CsvReleaseVerificationManifest {
  const digest = getCsvContractReleaseDigest();
  const handoffPackets = getCsvOperatorHandoffPackets();
  const operations = listCsvContractReleaseOperationDigests().map(
    (operationDigest) => {
      const packet = getCsvOperatorHandoffOperationPacket(
        operationDigest.operation
      );

      if (packet === null) {
        throw new Error(
          `Missing CSV release verification operation ${operationDigest.operation}`
        );
      }

      return buildOperationCoverage({
        digest: operationDigest,
        packet
      });
    }
  );
  const entities = handoffPackets.entries.map(buildEntityCoverage);
  const sourceContentTypes = uniqueStrings([
    CSV_RELEASE_VERIFICATION_MANIFEST_CONTENT_TYPE,
    digest.contentType,
    handoffPackets.contentType,
    ...handoffPackets.sourceContentTypes,
    ...digest.sourceFingerprintRollup.entries.map((entry) => entry.contentType)
  ]);
  const source = buildSource();
  const fingerprint = buildManifestFingerprint({
    releaseDigestFingerprint: digest.fingerprint,
    entityCount: digest.entityCount,
    operationCount: digest.operationCount,
    supportedEntityOperationCount: digest.supportedEntityOperationCount,
    unsupportedEntityOperationCount: digest.unsupportedEntityOperationCount,
    entityOperationStatusCounts: digest.entityOperationStatusCounts,
    sourceContentTypes,
    sourceFingerprints: digest.sourceFingerprintRollup.entries,
    warningCodes: digest.warningCodeRollup.entries,
    sourceCodes: digest.sourceCodeRollup.entries,
    entities,
    operations
  });

  return {
    contentType: CSV_RELEASE_VERIFICATION_MANIFEST_CONTENT_TYPE,
    manifestVersion: 1,
    status: digest.status,
    fingerprint,
    entityCount: digest.entityCount,
    operationCount: digest.operationCount,
    capabilityCount: digest.capabilityCount,
    supportedEntityOperationCount: digest.supportedEntityOperationCount,
    unsupportedEntityOperationCount: digest.unsupportedEntityOperationCount,
    statusCounts: digest.statusCounts,
    operationStatusCounts: digest.operationStatusCounts,
    entityOperationStatusCounts: digest.entityOperationStatusCounts,
    sourceContentTypes,
    sourceFingerprintRollup: digest.sourceFingerprintRollup,
    warningCodeRollup: digest.warningCodeRollup,
    sourceCodeRollup: digest.sourceCodeRollup,
    coverage: {
      entities,
      operations
    },
    source,
    read: metadataOnlyReads(),
    write: noWrites()
  };
}
