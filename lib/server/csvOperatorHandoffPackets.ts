import {
  CSV_CAPABILITY_OPERATIONS,
  listCsvCapabilities,
  listCsvCapabilitiesByOperation,
  type CsvCapability,
  type CsvCapabilityOperation
} from "@/lib/server/csvCapabilities";
import {
  CSV_CONTRACT_DRIFT_SNAPSHOT_CONTENT_TYPE,
  getCsvContractDriftEntitySnapshot,
  getCsvContractDriftOperationSnapshot,
  getCsvContractDriftSnapshots,
  isCsvContractDriftSnapshotEntity,
  listCsvContractDriftEntitySnapshots,
  listCsvContractDriftOperationSnapshots,
  listCsvContractDriftSnapshotEntities,
  type CsvContractDriftEntitySnapshot,
  type CsvContractDriftOperationSnapshot,
  type CsvContractDriftOperationStatus,
  type CsvContractDriftSnapshotEntity,
  type CsvContractDriftSnapshotOperation,
  type CsvContractDriftSnapshotStatus,
  type CsvContractDriftSourceFingerprint,
  type CsvContractDriftStatusCounts
} from "@/lib/server/csvContractDriftSnapshots";
import {
  CSV_HANDOFF_INDEX_CONTENT_TYPE,
  getCsvHandoffIndex,
  getCsvHandoffIndexEntry,
  type CsvHandoffCapabilitySupport,
  type CsvHandoffIndexEntry,
  type CsvHandoffPacketSummary,
  type CsvHandoffSurfaceKind,
  type CsvHandoffTransferSummary
} from "@/lib/server/csvHandoffIndex";
import {
  CSV_OPERATOR_READINESS_SCORECARD_CONTENT_TYPE,
  getCsvOperatorReadinessScorecard,
  listCsvOperatorReadinessOperationScorecards,
  type CsvOperatorReadinessEntityScorecard,
  type CsvOperatorReadinessOperationScorecard,
  type CsvOperatorReadinessStatus,
  type CsvOperatorReadinessStatusCounts,
  type CsvOperatorReadinessWarningCode
} from "@/lib/server/csvOperatorReadinessScorecards";
import {
  CSV_OPERATOR_REMEDIATION_RUNBOOK_CONTENT_TYPE,
  getCsvOperatorRemediationRunbook,
  listCsvOperatorRemediationOperationRunbooks,
  type CsvOperatorRemediationEntityRunbook,
  type CsvOperatorRemediationOperationRunbook,
  type CsvOperatorRemediationSeverity,
  type CsvOperatorRemediationSeverityCounts,
  type CsvOperatorRemediationSourceCode,
  type CsvOperatorRemediationStatus,
  type CsvOperatorRemediationStatusCounts
} from "@/lib/server/csvOperatorRemediationRunbooks";

export const CSV_OPERATOR_HANDOFF_PACKET_CONTENT_TYPE =
  "application/json; charset=utf-8" as const;

export type CsvOperatorHandoffPacketEntity = CsvContractDriftSnapshotEntity;
export type CsvOperatorHandoffPacketOperation = CsvContractDriftSnapshotOperation;
export type CsvOperatorHandoffPacketStatus = CsvContractDriftSnapshotStatus;

export type CsvOperatorHandoffReadFlags = {
  metadata: true;
  database: boolean;
  csvInput: boolean;
  csvOutput: boolean;
};

export type CsvOperatorHandoffWriteFlags = {
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

export type CsvOperatorHandoffCapabilitySummary = {
  operation: CsvCapabilityOperation;
  entity: CsvOperatorHandoffPacketEntity;
  label: string;
  route: string;
  filename: string | null;
  inputContentType: string | null;
  outputContentType: string | null;
  acceptsCsvInput: boolean;
  returnsCsv: boolean;
  canonicalHeaders: readonly string[];
  requiredImportFields: readonly string[];
  requiredImportHeaders: readonly string[];
  read: CsvOperatorHandoffReadFlags;
  write: CsvOperatorHandoffWriteFlags;
};

export type CsvOperatorHandoffReadinessSummary = {
  status: CsvOperatorReadinessStatus;
  warningCodes: readonly CsvOperatorReadinessWarningCode[];
  expectedSurfaceKinds: readonly CsvHandoffSurfaceKind[];
  presentSurfaceKinds: readonly CsvHandoffSurfaceKind[];
  missingSurfaceKinds: readonly CsvHandoffSurfaceKind[];
  read: CsvOperatorHandoffReadFlags;
};

export type CsvOperatorHandoffRemediationSummary = {
  status: CsvOperatorRemediationStatus;
  severity: CsvOperatorRemediationSeverity;
  remediationCount: number;
  sourceCodes: readonly CsvOperatorRemediationSourceCode[];
  nextAction: CsvOperatorRemediationOperationRunbook["nextAction"];
  read: CsvOperatorHandoffReadFlags;
};

export type CsvOperatorHandoffDriftSummary = {
  status: CsvOperatorHandoffPacketStatus;
  issueCount: number;
  remediationCount: number;
  fingerprint: string;
};

export type CsvOperatorHandoffOperationPacketSummary = {
  operation: CsvOperatorHandoffPacketOperation;
  entity: CsvOperatorHandoffPacketEntity;
  label: string;
  route: string | null;
  status: CsvOperatorHandoffPacketStatus;
  supported: boolean;
  capability: CsvOperatorHandoffCapabilitySummary | null;
  handoffSurfaceKinds: readonly CsvHandoffSurfaceKind[];
  readiness: CsvOperatorHandoffReadinessSummary;
  remediation: CsvOperatorHandoffRemediationSummary;
  drift: CsvOperatorHandoffDriftSummary;
  sourceContentTypes: readonly string[];
  read: CsvOperatorHandoffReadFlags;
  write: CsvOperatorHandoffWriteFlags;
};

export type CsvOperatorHandoffEntityPacket = {
  contentType: typeof CSV_OPERATOR_HANDOFF_PACKET_CONTENT_TYPE;
  packetVersion: 1;
  entity: CsvOperatorHandoffPacketEntity;
  label: string;
  route: string | null;
  direction: CsvContractDriftEntitySnapshot["direction"];
  status: CsvOperatorHandoffPacketStatus;
  operationCount: number;
  supportedOperationCount: number;
  blockedOperationCount: number;
  statusCounts: CsvContractDriftStatusCounts;
  readinessStatusCounts: CsvOperatorReadinessStatusCounts;
  remediationStatusCounts: CsvOperatorRemediationStatusCounts;
  issueCount: number;
  remediationCount: number;
  warningCodes: readonly CsvOperatorReadinessWarningCode[];
  sourceCodes: readonly CsvOperatorRemediationSourceCode[];
  capabilities: readonly CsvOperatorHandoffCapabilitySummary[];
  handoff: {
    capabilities: CsvHandoffCapabilitySupport;
    transferManifests: CsvHandoffTransferSummary;
    packets: CsvHandoffPacketSummary;
    compatibilityWarningCodes: readonly string[];
    surfaceKinds: readonly CsvHandoffSurfaceKind[];
  };
  readiness: {
    status: CsvOperatorReadinessStatus;
    statusCounts: CsvOperatorReadinessStatusCounts;
    warningCodes: readonly CsvOperatorReadinessWarningCode[];
  };
  remediation: {
    status: CsvOperatorRemediationStatus;
    severity: CsvOperatorRemediationSeverity;
    statusCounts: CsvOperatorRemediationStatusCounts;
    severityCounts: CsvOperatorRemediationSeverityCounts;
    remediationCount: number;
    sourceCodes: readonly CsvOperatorRemediationSourceCode[];
  };
  drift: {
    status: CsvOperatorHandoffPacketStatus;
    fingerprint: string;
    sourceFingerprints: readonly CsvContractDriftSourceFingerprint[];
    issueCount: number;
    remediationCount: number;
  };
  operations: readonly CsvOperatorHandoffOperationPacketSummary[];
  sourceContentTypes: readonly string[];
  read: CsvOperatorHandoffReadFlags;
  write: CsvOperatorHandoffWriteFlags;
};

export type CsvOperatorHandoffOperationEntitySummary = {
  entity: CsvOperatorHandoffPacketEntity;
  label: string;
  route: string | null;
  status: CsvOperatorHandoffPacketStatus;
  supported: boolean;
  readinessStatus: CsvOperatorReadinessStatus;
  remediationStatus: CsvOperatorRemediationStatus;
  issueCount: number;
  remediationCount: number;
  sourceContentTypes: readonly string[];
  read: CsvOperatorHandoffReadFlags;
  write: CsvOperatorHandoffWriteFlags;
};

export type CsvOperatorHandoffOperationPacket = {
  contentType: typeof CSV_OPERATOR_HANDOFF_PACKET_CONTENT_TYPE;
  packetVersion: 1;
  operation: CsvOperatorHandoffPacketOperation;
  status: CsvOperatorHandoffPacketStatus;
  entityCount: number;
  capabilityCount: number;
  supportedEntityCount: number;
  stableEntityCount: number;
  watchEntityCount: number;
  blockedEntityCount: number;
  statusCounts: CsvContractDriftStatusCounts;
  capabilities: readonly CsvOperatorHandoffCapabilitySummary[];
  entities: readonly CsvOperatorHandoffOperationEntitySummary[];
  warningCodes: readonly CsvOperatorReadinessWarningCode[];
  sourceCodes: readonly CsvOperatorRemediationSourceCode[];
  sourceFingerprints: readonly CsvContractDriftSourceFingerprint[];
  sourceContentTypes: readonly string[];
  read: CsvOperatorHandoffReadFlags;
  write: CsvOperatorHandoffWriteFlags;
};

export type CsvOperatorHandoffPackets = {
  contentType: typeof CSV_OPERATOR_HANDOFF_PACKET_CONTENT_TYPE;
  packetVersion: 1;
  status: CsvOperatorHandoffPacketStatus;
  entityCount: number;
  operationCount: number;
  capabilityCount: number;
  statusCounts: CsvContractDriftStatusCounts;
  entries: readonly CsvOperatorHandoffEntityPacket[];
  operations: readonly CsvOperatorHandoffOperationPacket[];
  source: {
    capabilityOperations: readonly CsvCapabilityOperation[];
    capabilityCount: number;
    handoffIndexContentType: typeof CSV_HANDOFF_INDEX_CONTENT_TYPE;
    operatorReadinessContentType: typeof CSV_OPERATOR_READINESS_SCORECARD_CONTENT_TYPE;
    operatorRemediationContentType: typeof CSV_OPERATOR_REMEDIATION_RUNBOOK_CONTENT_TYPE;
    contractDriftContentType: typeof CSV_CONTRACT_DRIFT_SNAPSHOT_CONTENT_TYPE;
    contractDriftFingerprint: string;
  };
  sourceFingerprints: readonly CsvContractDriftSourceFingerprint[];
  sourceContentTypes: readonly string[];
  read: CsvOperatorHandoffReadFlags;
  write: CsvOperatorHandoffWriteFlags;
};

type ReadFlagInput = {
  metadata: true;
  database: boolean;
  csvInput: boolean;
  csvOutput: boolean;
};

function noWrites(): CsvOperatorHandoffWriteFlags {
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

function metadataOnlyReads(): CsvOperatorHandoffReadFlags {
  return {
    metadata: true,
    database: false,
    csvInput: false,
    csvOutput: false
  };
}

function combineReads(
  reads: readonly ReadFlagInput[]
): CsvOperatorHandoffReadFlags {
  return {
    metadata: true,
    database: reads.some((read) => read.database),
    csvInput: reads.some((read) => read.csvInput),
    csvOutput: reads.some((read) => read.csvOutput)
  };
}

function readFromCapability(
  capability: CsvCapability
): CsvOperatorHandoffReadFlags {
  return {
    metadata: true,
    database: capability.read.database,
    csvInput: capability.read.csvInput,
    csvOutput: capability.returnsCsv
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

function mergeContentTypes(
  groups: readonly (readonly (string | null | undefined)[])[]
): string[] {
  return uniqueStrings(groups.flatMap((group) => [...group]));
}

function contentTypesFromCapability(
  capability: CsvCapability | CsvOperatorHandoffCapabilitySummary | null
): string[] {
  if (capability === null) {
    return [];
  }

  return uniqueStrings([
    capability.inputContentType,
    capability.outputContentType
  ]);
}

function contentTypesFromHandoffEntry(entry: CsvHandoffIndexEntry): string[] {
  return mergeContentTypes(
    entry.surfaces.map((surface) => [
      surface.contentType,
      surface.inputContentType,
      surface.outputContentType
    ])
  );
}

function contentTypesFromSurfaceKinds(
  entry: CsvHandoffIndexEntry,
  surfaceKinds: readonly CsvHandoffSurfaceKind[]
): string[] {
  return mergeContentTypes(
    entry.surfaces
      .filter((surface) => surfaceKinds.includes(surface.kind))
      .map((surface) => [
        surface.contentType,
        surface.inputContentType,
        surface.outputContentType
      ])
  );
}

function contentTypesFromFingerprints(
  fingerprints: readonly CsvContractDriftSourceFingerprint[]
): string[] {
  return uniqueStrings(fingerprints.map((fingerprint) => fingerprint.contentType));
}

function capabilitiesForEntity(
  entity: CsvOperatorHandoffPacketEntity
): CsvCapability[] {
  return listCsvCapabilities().filter((capability) => capability.entity === entity);
}

function capabilityForEntityOperation(
  entity: CsvOperatorHandoffPacketEntity,
  operation: CsvOperatorHandoffPacketOperation
): CsvCapability | null {
  return (
    listCsvCapabilities().find(
      (capability) =>
        capability.entity === entity && capability.operation === operation
    ) ?? null
  );
}

function buildCapabilitySummary(
  capability: CsvCapability
): CsvOperatorHandoffCapabilitySummary {
  return {
    operation: capability.operation,
    entity: capability.entity,
    label: capability.label,
    route: capability.route,
    filename: capability.filename,
    inputContentType: capability.inputContentType,
    outputContentType: capability.outputContentType,
    acceptsCsvInput: capability.acceptsCsvInput,
    returnsCsv: capability.returnsCsv,
    canonicalHeaders: capability.canonicalHeaders,
    requiredImportFields: capability.requiredImportFields,
    requiredImportHeaders: capability.requiredImportHeaders,
    read: readFromCapability(capability),
    write: noWrites()
  };
}

function findReadinessOperation(
  operation: CsvOperatorHandoffPacketOperation,
  operations: readonly CsvOperatorReadinessOperationScorecard[]
): CsvOperatorReadinessOperationScorecard {
  const scorecard = operations.find(
    (candidate) => candidate.operation === operation
  );

  if (scorecard === undefined) {
    throw new Error(`Missing CSV handoff readiness operation ${operation}`);
  }

  return scorecard;
}

function findRemediationOperation(
  operation: CsvOperatorHandoffPacketOperation,
  operations: readonly CsvOperatorRemediationOperationRunbook[]
): CsvOperatorRemediationOperationRunbook {
  const runbook = operations.find((candidate) => candidate.operation === operation);

  if (runbook === undefined) {
    throw new Error(`Missing CSV handoff remediation operation ${operation}`);
  }

  return runbook;
}

function findReadinessByEntity(
  entity: CsvOperatorHandoffPacketEntity,
  operations: readonly CsvOperatorReadinessOperationScorecard[]
): CsvOperatorReadinessOperationScorecard {
  const scorecard = operations.find((candidate) => candidate.entity === entity);

  if (scorecard === undefined) {
    throw new Error(`Missing CSV handoff readiness entity ${entity}`);
  }

  return scorecard;
}

function findRemediationByEntity(
  entity: CsvOperatorHandoffPacketEntity,
  operations: readonly CsvOperatorRemediationOperationRunbook[]
): CsvOperatorRemediationOperationRunbook {
  const runbook = operations.find((candidate) => candidate.entity === entity);

  if (runbook === undefined) {
    throw new Error(`Missing CSV handoff remediation entity ${entity}`);
  }

  return runbook;
}

function buildOperationSummary(input: {
  drift: CsvContractDriftOperationStatus;
  entityFingerprint: string;
  readiness: CsvOperatorReadinessOperationScorecard;
  remediation: CsvOperatorRemediationOperationRunbook;
  capability: CsvCapability | null;
  handoff: CsvHandoffIndexEntry;
}): CsvOperatorHandoffOperationPacketSummary {
  const capability =
    input.capability === null ? null : buildCapabilitySummary(input.capability);
  const sourceContentTypes = mergeContentTypes([
    contentTypesFromCapability(capability),
    contentTypesFromSurfaceKinds(input.handoff, input.readiness.presentSurfaceKinds)
  ]);
  const reads = [
    input.readiness.read,
    input.remediation.read,
    ...input.handoff.surfaces
      .filter((surface) =>
        input.readiness.presentSurfaceKinds.includes(surface.kind)
      )
      .map((surface) => surface.read)
  ];

  return {
    operation: input.drift.operation,
    entity: input.readiness.entity,
    label: input.readiness.label,
    route: input.readiness.route,
    status: input.drift.status,
    supported: input.readiness.supported,
    capability,
    handoffSurfaceKinds: input.readiness.presentSurfaceKinds,
    readiness: {
      status: input.readiness.status,
      warningCodes: input.readiness.warningCodes,
      expectedSurfaceKinds: input.readiness.expectedSurfaceKinds,
      presentSurfaceKinds: input.readiness.presentSurfaceKinds,
      missingSurfaceKinds: input.readiness.missingSurfaceKinds,
      read: input.readiness.read
    },
    remediation: {
      status: input.remediation.status,
      severity: input.remediation.severity,
      remediationCount: input.remediation.remediationCount,
      sourceCodes: input.remediation.sourceCodes,
      nextAction: input.remediation.nextAction,
      read: input.remediation.read
    },
    drift: {
      status: input.drift.status,
      issueCount: input.drift.issueCount,
      remediationCount: input.drift.remediationCount,
      fingerprint: input.entityFingerprint
    },
    sourceContentTypes,
    read: combineReads(capability === null ? reads : [...reads, capability.read]),
    write: noWrites()
  };
}

function buildEntityPacketFromSources(input: {
  handoff: CsvHandoffIndexEntry;
  readiness: CsvOperatorReadinessEntityScorecard;
  remediation: CsvOperatorRemediationEntityRunbook;
  drift: CsvContractDriftEntitySnapshot;
}): CsvOperatorHandoffEntityPacket {
  const capabilities = capabilitiesForEntity(input.drift.entity).map(
    buildCapabilitySummary
  );
  const operations = input.drift.operations.map((driftOperation) =>
    buildOperationSummary({
      drift: driftOperation,
      entityFingerprint: input.drift.fingerprint,
      readiness: findReadinessOperation(
        driftOperation.operation,
        input.readiness.operations
      ),
      remediation: findRemediationOperation(
        driftOperation.operation,
        input.remediation.operations
      ),
      capability: capabilityForEntityOperation(
        input.drift.entity,
        driftOperation.operation
      ),
      handoff: input.handoff
    })
  );
  const sourceContentTypes = mergeContentTypes([
    capabilities.flatMap(contentTypesFromCapability),
    contentTypesFromHandoffEntry(input.handoff),
    contentTypesFromFingerprints(input.drift.sourceFingerprints)
  ]);

  return {
    contentType: CSV_OPERATOR_HANDOFF_PACKET_CONTENT_TYPE,
    packetVersion: 1,
    entity: input.drift.entity,
    label: input.drift.label,
    route: input.drift.route,
    direction: input.drift.direction,
    status: input.drift.status,
    operationCount: input.drift.operationCount,
    supportedOperationCount: operations.filter((operation) => operation.supported)
      .length,
    blockedOperationCount: input.drift.statusCounts.blocked,
    statusCounts: input.drift.statusCounts,
    readinessStatusCounts: input.drift.readinessStatusCounts,
    remediationStatusCounts: input.drift.remediationStatusCounts,
    issueCount: input.drift.issueCount,
    remediationCount: input.drift.remediationCount,
    warningCodes: input.drift.warningCodes,
    sourceCodes: input.drift.sourceCodes,
    capabilities,
    handoff: {
      capabilities: input.handoff.capabilities,
      transferManifests: input.handoff.transferManifests,
      packets: input.handoff.packets,
      compatibilityWarningCodes:
        input.handoff.compatibilityReport.warningCodes,
      surfaceKinds: input.handoff.surfaces.map((surface) => surface.kind)
    },
    readiness: {
      status: input.readiness.status,
      statusCounts: input.readiness.statusCounts,
      warningCodes: input.readiness.warningCodes
    },
    remediation: {
      status: input.remediation.status,
      severity: input.remediation.severity,
      statusCounts: input.remediation.statusCounts,
      severityCounts: input.remediation.severityCounts,
      remediationCount: input.remediation.remediationCount,
      sourceCodes: input.remediation.sourceCodes
    },
    drift: {
      status: input.drift.status,
      fingerprint: input.drift.fingerprint,
      sourceFingerprints: input.drift.sourceFingerprints,
      issueCount: input.drift.issueCount,
      remediationCount: input.drift.remediationCount
    },
    operations,
    sourceContentTypes,
    read: combineReads([
      input.handoff.read,
      input.readiness.read,
      input.remediation.read,
      input.drift.read
    ]),
    write: noWrites()
  };
}

function buildEntityPacket(
  entity: CsvOperatorHandoffPacketEntity
): CsvOperatorHandoffEntityPacket {
  const handoff = getCsvHandoffIndexEntry(entity);
  const readiness = getCsvOperatorReadinessScorecard(entity);
  const remediation = getCsvOperatorRemediationRunbook(entity);
  const drift = getCsvContractDriftEntitySnapshot(entity);

  if (
    handoff === null ||
    readiness === null ||
    remediation === null ||
    drift === null
  ) {
    throw new Error(`Missing CSV operator handoff source for ${entity}`);
  }

  return buildEntityPacketFromSources({
    handoff,
    readiness,
    remediation,
    drift
  });
}

function buildOperationEntitySummary(input: {
  entity: CsvOperatorHandoffPacketEntity;
  status: CsvContractDriftOperationSnapshot["entities"][number];
  readiness: CsvOperatorReadinessOperationScorecard;
  remediation: CsvOperatorRemediationOperationRunbook;
  capability: CsvCapability | null;
  sourceContentTypes: readonly string[];
}): CsvOperatorHandoffOperationEntitySummary {
  const capability =
    input.capability === null ? null : buildCapabilitySummary(input.capability);
  const sourceContentTypes = mergeContentTypes([
    input.sourceContentTypes,
    contentTypesFromCapability(capability)
  ]);

  return {
    entity: input.entity,
    label: input.status.label,
    route: input.status.route,
    status: input.status.status,
    supported: input.readiness.supported,
    readinessStatus: input.status.readinessStatus,
    remediationStatus: input.status.remediationStatus,
    issueCount: input.status.issueCount,
    remediationCount: input.status.remediationCount,
    sourceContentTypes,
    read: combineReads(
      capability === null
        ? [input.readiness.read, input.remediation.read]
        : [input.readiness.read, input.remediation.read, capability.read]
    ),
    write: noWrites()
  };
}

function buildOperationPacket(
  operation: CsvOperatorHandoffPacketOperation
): CsvOperatorHandoffOperationPacket {
  const snapshot = getCsvContractDriftOperationSnapshot(operation);

  if (snapshot === null) {
    throw new Error(`Missing CSV handoff operation snapshot for ${operation}`);
  }

  const readiness = listCsvOperatorReadinessOperationScorecards(operation);
  const remediation = listCsvOperatorRemediationOperationRunbooks(operation);
  const capabilities = listCsvCapabilitiesByOperation(operation).map(
    buildCapabilitySummary
  );
  const operationSourceContentTypes = mergeContentTypes([
    capabilities.flatMap(contentTypesFromCapability),
    contentTypesFromFingerprints(snapshot.sourceFingerprints)
  ]);
  const entities = snapshot.entities.map((entityStatus) =>
    buildOperationEntitySummary({
      entity: entityStatus.entity,
      status: entityStatus,
      readiness: findReadinessByEntity(entityStatus.entity, readiness),
      remediation: findRemediationByEntity(entityStatus.entity, remediation),
      capability: capabilityForEntityOperation(entityStatus.entity, operation),
      sourceContentTypes: operationSourceContentTypes
    })
  );

  return {
    contentType: CSV_OPERATOR_HANDOFF_PACKET_CONTENT_TYPE,
    packetVersion: 1,
    operation,
    status: snapshot.status,
    entityCount: snapshot.entityCount,
    capabilityCount: capabilities.length,
    supportedEntityCount: readiness.filter((scorecard) => scorecard.supported)
      .length,
    stableEntityCount: snapshot.statusCounts.stable,
    watchEntityCount: snapshot.statusCounts.watch,
    blockedEntityCount: snapshot.statusCounts.blocked,
    statusCounts: snapshot.statusCounts,
    capabilities,
    entities,
    warningCodes: snapshot.warningCodes,
    sourceCodes: snapshot.sourceCodes,
    sourceFingerprints: snapshot.sourceFingerprints,
    sourceContentTypes: operationSourceContentTypes,
    read: combineReads([
      snapshot.read,
      ...readiness.map((scorecard) => scorecard.read),
      ...remediation.map((runbook) => runbook.read),
      ...capabilities.map((capability) => capability.read)
    ]),
    write: noWrites()
  };
}

export function isCsvOperatorHandoffPacketEntity(
  value: string
): value is CsvOperatorHandoffPacketEntity {
  return isCsvContractDriftSnapshotEntity(value);
}

export function listCsvOperatorHandoffPacketEntities(): CsvOperatorHandoffPacketEntity[] {
  return listCsvContractDriftSnapshotEntities();
}

export function getCsvOperatorHandoffEntityPacket(
  entity: string
): CsvOperatorHandoffEntityPacket | null {
  if (!isCsvOperatorHandoffPacketEntity(entity)) {
    return null;
  }

  return buildEntityPacket(entity);
}

export function listCsvOperatorHandoffEntityPackets(): CsvOperatorHandoffEntityPacket[] {
  return listCsvContractDriftEntitySnapshots().map((snapshot) =>
    buildEntityPacket(snapshot.entity)
  );
}

export function isCsvOperatorHandoffPacketOperation(
  value: string
): value is CsvOperatorHandoffPacketOperation {
  return CSV_CAPABILITY_OPERATIONS.some((operation) => operation === value);
}

export function getCsvOperatorHandoffOperationPacket(
  operation: string
): CsvOperatorHandoffOperationPacket | null {
  if (!isCsvOperatorHandoffPacketOperation(operation)) {
    return null;
  }

  return buildOperationPacket(operation);
}

export function listCsvOperatorHandoffOperationPackets(): CsvOperatorHandoffOperationPacket[] {
  return listCsvContractDriftOperationSnapshots().map((snapshot) =>
    buildOperationPacket(snapshot.operation)
  );
}

export function getCsvOperatorHandoffPackets(): CsvOperatorHandoffPackets {
  const handoffIndex = getCsvHandoffIndex();
  const drift = getCsvContractDriftSnapshots();
  const entries = listCsvOperatorHandoffEntityPackets();
  const operations = listCsvOperatorHandoffOperationPackets();
  const capabilities = listCsvCapabilities();
  const sourceContentTypes = mergeContentTypes([
    [handoffIndex.contentType],
    [CSV_OPERATOR_READINESS_SCORECARD_CONTENT_TYPE],
    [CSV_OPERATOR_REMEDIATION_RUNBOOK_CONTENT_TYPE],
    [drift.contentType],
    capabilities.flatMap(contentTypesFromCapability),
    contentTypesFromFingerprints(drift.sourceFingerprints)
  ]);

  return {
    contentType: CSV_OPERATOR_HANDOFF_PACKET_CONTENT_TYPE,
    packetVersion: 1,
    status: drift.status,
    entityCount: entries.length,
    operationCount: operations.length,
    capabilityCount: capabilities.length,
    statusCounts: drift.rollup.statusCounts,
    entries,
    operations,
    source: {
      capabilityOperations: CSV_CAPABILITY_OPERATIONS,
      capabilityCount: capabilities.length,
      handoffIndexContentType: handoffIndex.contentType,
      operatorReadinessContentType: CSV_OPERATOR_READINESS_SCORECARD_CONTENT_TYPE,
      operatorRemediationContentType:
        CSV_OPERATOR_REMEDIATION_RUNBOOK_CONTENT_TYPE,
      contractDriftContentType: drift.contentType,
      contractDriftFingerprint: drift.fingerprint
    },
    sourceFingerprints: drift.sourceFingerprints,
    sourceContentTypes,
    read: metadataOnlyReads(),
    write: noWrites()
  };
}
