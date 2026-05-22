import { createHash } from "node:crypto";
import {
  CSV_OPERATOR_HANDOFF_PACKET_CONTENT_TYPE,
  getCsvOperatorHandoffOperationPacket,
  getCsvOperatorHandoffPackets,
  isCsvOperatorHandoffPacketOperation,
  listCsvOperatorHandoffOperationPackets,
  type CsvOperatorHandoffEntityPacket,
  type CsvOperatorHandoffOperationPacket,
  type CsvOperatorHandoffPacketEntity,
  type CsvOperatorHandoffPacketOperation,
  type CsvOperatorHandoffPacketStatus,
  type CsvOperatorHandoffReadFlags,
  type CsvOperatorHandoffWriteFlags
} from "@/lib/server/csvOperatorHandoffPackets";
import {
  type CsvContractDriftSnapshotScope,
  type CsvContractDriftSnapshotSource,
  type CsvContractDriftSourceFingerprint,
  type CsvContractDriftStatusCounts
} from "@/lib/server/csvContractDriftSnapshots";
import {
  type CsvOperatorReadinessWarningCode
} from "@/lib/server/csvOperatorReadinessScorecards";
import {
  type CsvOperatorRemediationSourceCode
} from "@/lib/server/csvOperatorRemediationRunbooks";

export const CSV_CONTRACT_RELEASE_DIGEST_CONTENT_TYPE =
  "application/json; charset=utf-8" as const;

export type CsvContractReleaseDigestEntity = CsvOperatorHandoffPacketEntity;
export type CsvContractReleaseDigestOperation =
  CsvOperatorHandoffPacketOperation;
export type CsvContractReleaseDigestStatus = CsvOperatorHandoffPacketStatus;
export type CsvContractReleaseDigestStatusCounts = CsvContractDriftStatusCounts;
export type CsvContractReleaseDigestReadFlags = CsvOperatorHandoffReadFlags;
export type CsvContractReleaseDigestWriteFlags = CsvOperatorHandoffWriteFlags;

export type CsvContractReleaseNoteStatus =
  | "ready-to-surface"
  | "review-before-ui"
  | "blocked-by-contract";

export type CsvContractReleaseNoteMetadata = {
  title: string;
  statusLabel: CsvContractReleaseNoteStatus;
  summary: string;
  highlights: readonly string[];
  caveats: readonly string[];
  nextActions: readonly string[];
  readyForReleaseNotes: true;
  safeForCurrentSprint: boolean;
  requiresContractChange: boolean;
  noWriteGuarantee: string;
};

export type CsvContractReleaseOperationDigest = {
  operation: CsvContractReleaseDigestOperation;
  status: CsvContractReleaseDigestStatus;
  entityCount: number;
  capabilityCount: number;
  supportedEntityCount: number;
  unsupportedEntityCount: number;
  stableEntityCount: number;
  watchEntityCount: number;
  blockedEntityCount: number;
  statusCounts: CsvContractReleaseDigestStatusCounts;
  warningCodes: readonly CsvOperatorReadinessWarningCode[];
  sourceCodes: readonly CsvOperatorRemediationSourceCode[];
  sourceFingerprintCount: number;
  releaseNote: CsvContractReleaseNoteMetadata;
  read: CsvContractReleaseDigestReadFlags;
  write: CsvContractReleaseDigestWriteFlags;
};

export type CsvContractReleaseSourceFingerprintRollup = {
  source: CsvContractDriftSnapshotSource;
  scope: CsvContractDriftSnapshotScope;
  contentType: string;
  fingerprintCount: number;
  payloadBytes: number;
  entities: readonly CsvContractReleaseDigestEntity[];
  operations: readonly CsvContractReleaseDigestOperation[];
  fingerprints: readonly string[];
};

export type CsvContractReleaseWarningExample = {
  entity: CsvContractReleaseDigestEntity;
  operation: CsvContractReleaseDigestOperation;
  status: CsvContractReleaseDigestStatus;
};

export type CsvContractReleaseWarningCodeRollup = {
  code: CsvOperatorReadinessWarningCode;
  entityCount: number;
  operationCount: number;
  occurrenceCount: number;
  examples: readonly CsvContractReleaseWarningExample[];
};

export type CsvContractReleaseSourceCodeRollup = {
  code: CsvOperatorRemediationSourceCode;
  entityCount: number;
  operationCount: number;
  occurrenceCount: number;
  safeForCurrentSprintCount: number;
  requiresContractChangeCount: number;
  examples: readonly CsvContractReleaseWarningExample[];
};

export type CsvContractReleaseDigest = {
  contentType: typeof CSV_CONTRACT_RELEASE_DIGEST_CONTENT_TYPE;
  digestVersion: 1;
  status: CsvContractReleaseDigestStatus;
  fingerprint: string;
  entityCount: number;
  operationCount: number;
  capabilityCount: number;
  supportedEntityOperationCount: number;
  unsupportedEntityOperationCount: number;
  statusCounts: CsvContractReleaseDigestStatusCounts;
  operationStatusCounts: CsvContractReleaseDigestStatusCounts;
  entityOperationStatusCounts: CsvContractReleaseDigestStatusCounts;
  operations: readonly CsvContractReleaseOperationDigest[];
  warningCodeRollup: {
    warningCodes: readonly CsvOperatorReadinessWarningCode[];
    entries: readonly CsvContractReleaseWarningCodeRollup[];
  };
  sourceCodeRollup: {
    sourceCodes: readonly CsvOperatorRemediationSourceCode[];
    entries: readonly CsvContractReleaseSourceCodeRollup[];
  };
  sourceFingerprintRollup: {
    sourceFingerprintCount: number;
    payloadBytes: number;
    entries: readonly CsvContractReleaseSourceFingerprintRollup[];
  };
  releaseNote: CsvContractReleaseNoteMetadata;
  source: {
    operatorHandoffContentType: typeof CSV_OPERATOR_HANDOFF_PACKET_CONTENT_TYPE;
    operatorHandoffPacketVersion: 1;
    operatorHandoffStatus: CsvContractReleaseDigestStatus;
    contractDriftFingerprint: string;
  };
  read: CsvContractReleaseDigestReadFlags;
  write: CsvContractReleaseDigestWriteFlags;
};

type SourceFingerprintAccumulator = {
  source: CsvContractDriftSnapshotSource;
  scope: CsvContractDriftSnapshotScope;
  contentType: string;
  fingerprints: string[];
  payloadBytes: number;
  entities: CsvContractReleaseDigestEntity[];
  operations: CsvContractReleaseDigestOperation[];
};

type WarningCodeAccumulator = {
  code: CsvOperatorReadinessWarningCode;
  entities: Set<CsvContractReleaseDigestEntity>;
  operations: Set<CsvContractReleaseDigestOperation>;
  occurrenceCount: number;
  examples: CsvContractReleaseWarningExample[];
};

type SourceCodeAccumulator = {
  code: CsvOperatorRemediationSourceCode;
  entities: Set<CsvContractReleaseDigestEntity>;
  operations: Set<CsvContractReleaseDigestOperation>;
  occurrenceCount: number;
  safeForCurrentSprintCount: number;
  requiresContractChangeCount: number;
  examples: CsvContractReleaseWarningExample[];
};

function noWrites(): CsvContractReleaseDigestWriteFlags {
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

function metadataOnlyReads(): CsvContractReleaseDigestReadFlags {
  return {
    metadata: true,
    database: false,
    csvInput: false,
    csvOutput: false
  };
}

function emptyStatusCounts(): CsvContractReleaseDigestStatusCounts {
  return {
    stable: 0,
    watch: 0,
    blocked: 0
  };
}

function addStatusCounts(
  left: CsvContractReleaseDigestStatusCounts,
  right: CsvContractReleaseDigestStatusCounts
): CsvContractReleaseDigestStatusCounts {
  return {
    stable: left.stable + right.stable,
    watch: left.watch + right.watch,
    blocked: left.blocked + right.blocked
  };
}

function countStatuses(
  values: readonly { status: CsvContractReleaseDigestStatus }[]
): CsvContractReleaseDigestStatusCounts {
  const counts = emptyStatusCounts();

  for (const value of values) {
    counts[value.status] += 1;
  }

  return counts;
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

function releaseStatusLabel(
  status: CsvContractReleaseDigestStatus
): CsvContractReleaseNoteStatus {
  switch (status) {
    case "stable":
      return "ready-to-surface";
    case "watch":
      return "review-before-ui";
    case "blocked":
      return "blocked-by-contract";
  }
}

function operationLabel(operation: CsvContractReleaseDigestOperation): string {
  switch (operation) {
    case "export":
      return "CSV export";
    case "import-preview":
      return "CSV import preview";
    case "import-template":
      return "CSV import template";
    case "import-preflight":
      return "CSV import preflight";
  }
}

function buildOperationReleaseNote(
  packet: CsvOperatorHandoffOperationPacket
): CsvContractReleaseNoteMetadata {
  const label = operationLabel(packet.operation);
  const blocked = packet.status === "blocked";
  const watch = packet.status === "watch";
  const caveats = [
    ...(watch
      ? [`${label} has watch-level warnings that later UI or docs must surface.`]
      : []),
    ...(blocked
      ? [
          `${label} includes blocked entity operations that require future contract promotion before implementation.`
        ]
      : [])
  ];
  const nextActions = [
    ...(packet.warningCodes.length > 0
      ? [`Review warning codes: ${packet.warningCodes.join(", ")}.`]
      : []),
    ...(blocked
      ? ["Keep blocked entity operations excluded from UI and import/export apply flows."]
      : ["Use this operation metadata for later read-only UI or docs wiring."])
  ];

  return {
    title: `${label} release digest`,
    statusLabel: releaseStatusLabel(packet.status),
    summary: `${label} covers ${packet.entityCount} entities: ${packet.stableEntityCount} stable, ${packet.watchEntityCount} watch, and ${packet.blockedEntityCount} blocked.`,
    highlights: [
      `${packet.supportedEntityCount} entities expose supported ${packet.operation} handoff metadata.`,
      `${packet.capabilityCount} ${packet.operation} capabilities are described with explicit no-write flags.`
    ],
    caveats,
    nextActions,
    readyForReleaseNotes: true,
    safeForCurrentSprint: !blocked,
    requiresContractChange: blocked,
    noWriteGuarantee:
      "Digest metadata is read-only and does not add persistence, routes, jobs, routing execution, or sync."
  };
}

function buildDigestReleaseNote(input: {
  status: CsvContractReleaseDigestStatus;
  entityCount: number;
  operationCount: number;
  capabilityCount: number;
  supportedEntityOperationCount: number;
  unsupportedEntityOperationCount: number;
  entityOperationStatusCounts: CsvContractReleaseDigestStatusCounts;
  warningCodes: readonly CsvOperatorReadinessWarningCode[];
}): CsvContractReleaseNoteMetadata {
  const caveats = [
    ...(input.entityOperationStatusCounts.watch > 0
      ? [
          `${input.entityOperationStatusCounts.watch} entity-operation handoff entries need review before UI copy is finalized.`
        ]
      : []),
    ...(input.entityOperationStatusCounts.blocked > 0
      ? [
          `${input.entityOperationStatusCounts.blocked} entity-operation handoff entries remain blocked by the current contract.`
        ]
      : [])
  ];
  const nextActions = [
    ...(input.warningCodes.length > 0
      ? [`Carry warning codes into release notes: ${input.warningCodes.join(", ")}.`]
      : []),
    "Use source fingerprint rollups for current-state verification only; do not persist baselines or comparison history.",
    "Keep unsupported CSV operations excluded until a future sprint promotes them in the contract."
  ];

  return {
    title: "CSV handoff closure release digest",
    statusLabel: releaseStatusLabel(input.status),
    summary: `Current CSV handoff covers ${input.entityCount} entities and ${input.operationCount} operations with ${input.capabilityCount} supported capability records.`,
    highlights: [
      `${input.supportedEntityOperationCount} entity-operation pairs are supported for later UI or docs consumption.`,
      `${input.unsupportedEntityOperationCount} entity-operation pairs are explicitly documented as unsupported under the current contract.`
    ],
    caveats,
    nextActions,
    readyForReleaseNotes: true,
    safeForCurrentSprint: true,
    requiresContractChange: false,
    noWriteGuarantee:
      "This digest is read-only metadata. It adds no routes, product UI, storage, database writes, background jobs, integrations, or CSV apply flow."
  };
}

function buildOperationDigest(
  packet: CsvOperatorHandoffOperationPacket
): CsvContractReleaseOperationDigest {
  return {
    operation: packet.operation,
    status: packet.status,
    entityCount: packet.entityCount,
    capabilityCount: packet.capabilityCount,
    supportedEntityCount: packet.supportedEntityCount,
    unsupportedEntityCount: packet.entityCount - packet.supportedEntityCount,
    stableEntityCount: packet.stableEntityCount,
    watchEntityCount: packet.watchEntityCount,
    blockedEntityCount: packet.blockedEntityCount,
    statusCounts: packet.statusCounts,
    warningCodes: packet.warningCodes,
    sourceCodes: packet.sourceCodes,
    sourceFingerprintCount: packet.sourceFingerprints.length,
    releaseNote: buildOperationReleaseNote(packet),
    read: packet.read,
    write: noWrites()
  };
}

function addUnique<T extends string>(values: T[], value: T): void {
  if (!values.includes(value)) {
    values.push(value);
  }
}

function collectSourceFingerprints(
  entries: readonly CsvOperatorHandoffEntityPacket[],
  operations: readonly CsvOperatorHandoffOperationPacket[],
  rootFingerprints: readonly CsvContractDriftSourceFingerprint[]
): CsvContractDriftSourceFingerprint[] {
  return [
    ...rootFingerprints,
    ...entries.flatMap((entry) => entry.drift.sourceFingerprints),
    ...operations.flatMap((operation) => operation.sourceFingerprints)
  ];
}

function buildSourceFingerprintRollups(
  fingerprints: readonly CsvContractDriftSourceFingerprint[]
): CsvContractReleaseSourceFingerprintRollup[] {
  const rollups = new Map<string, SourceFingerprintAccumulator>();

  for (const fingerprint of fingerprints) {
    const key = [
      fingerprint.source,
      fingerprint.scope,
      fingerprint.contentType
    ].join("\u0000");
    const existing = rollups.get(key);
    const accumulator =
      existing ??
      {
        source: fingerprint.source,
        scope: fingerprint.scope,
        contentType: fingerprint.contentType,
        fingerprints: [],
        payloadBytes: 0,
        entities: [],
        operations: []
      };

    accumulator.fingerprints.push(fingerprint.fingerprint);
    accumulator.payloadBytes += fingerprint.payloadBytes;

    if (fingerprint.entity !== null) {
      addUnique(accumulator.entities, fingerprint.entity);
    }

    if (fingerprint.operation !== null) {
      addUnique(accumulator.operations, fingerprint.operation);
    }

    rollups.set(key, accumulator);
  }

  return Array.from(rollups.values()).map((rollup) => ({
    source: rollup.source,
    scope: rollup.scope,
    contentType: rollup.contentType,
    fingerprintCount: rollup.fingerprints.length,
    payloadBytes: rollup.payloadBytes,
    entities: rollup.entities,
    operations: rollup.operations,
    fingerprints: rollup.fingerprints
  }));
}

function addWarningCode(
  rollups: Map<CsvOperatorReadinessWarningCode, WarningCodeAccumulator>,
  code: CsvOperatorReadinessWarningCode,
  example: CsvContractReleaseWarningExample
): void {
  const existing = rollups.get(code);
  const accumulator =
    existing ??
    {
      code,
      entities: new Set<CsvContractReleaseDigestEntity>(),
      operations: new Set<CsvContractReleaseDigestOperation>(),
      occurrenceCount: 0,
      examples: []
    };

  accumulator.entities.add(example.entity);
  accumulator.operations.add(example.operation);
  accumulator.occurrenceCount += 1;

  if (accumulator.examples.length < 5) {
    accumulator.examples.push(example);
  }

  rollups.set(code, accumulator);
}

function addSourceCode(
  rollups: Map<CsvOperatorRemediationSourceCode, SourceCodeAccumulator>,
  code: CsvOperatorRemediationSourceCode,
  example: CsvContractReleaseWarningExample,
  safeForCurrentSprint: boolean,
  requiresContractChange: boolean
): void {
  const existing = rollups.get(code);
  const accumulator =
    existing ??
    {
      code,
      entities: new Set<CsvContractReleaseDigestEntity>(),
      operations: new Set<CsvContractReleaseDigestOperation>(),
      occurrenceCount: 0,
      safeForCurrentSprintCount: 0,
      requiresContractChangeCount: 0,
      examples: []
    };

  accumulator.entities.add(example.entity);
  accumulator.operations.add(example.operation);
  accumulator.occurrenceCount += 1;

  if (safeForCurrentSprint) {
    accumulator.safeForCurrentSprintCount += 1;
  }

  if (requiresContractChange) {
    accumulator.requiresContractChangeCount += 1;
  }

  if (accumulator.examples.length < 5) {
    accumulator.examples.push(example);
  }

  rollups.set(code, accumulator);
}

function buildWarningCodeRollups(
  entries: readonly CsvOperatorHandoffEntityPacket[]
): CsvContractReleaseWarningCodeRollup[] {
  const rollups = new Map<
    CsvOperatorReadinessWarningCode,
    WarningCodeAccumulator
  >();

  for (const entry of entries) {
    for (const operation of entry.operations) {
      const example = {
        entity: entry.entity,
        operation: operation.operation,
        status: operation.status
      };

      for (const code of operation.readiness.warningCodes) {
        addWarningCode(rollups, code, example);
      }
    }
  }

  return Array.from(rollups.values()).map((rollup) => ({
    code: rollup.code,
    entityCount: rollup.entities.size,
    operationCount: rollup.operations.size,
    occurrenceCount: rollup.occurrenceCount,
    examples: rollup.examples
  }));
}

function buildSourceCodeRollups(
  entries: readonly CsvOperatorHandoffEntityPacket[]
): CsvContractReleaseSourceCodeRollup[] {
  const rollups = new Map<
    CsvOperatorRemediationSourceCode,
    SourceCodeAccumulator
  >();

  for (const entry of entries) {
    for (const operation of entry.operations) {
      const example = {
        entity: entry.entity,
        operation: operation.operation,
        status: operation.status
      };

      for (const code of operation.remediation.sourceCodes) {
        addSourceCode(
          rollups,
          code,
          example,
          operation.remediation.nextAction.safeForCurrentSprint,
          operation.remediation.nextAction.requiresContractChange
        );
      }
    }
  }

  return Array.from(rollups.values()).map((rollup) => ({
    code: rollup.code,
    entityCount: rollup.entities.size,
    operationCount: rollup.operations.size,
    occurrenceCount: rollup.occurrenceCount,
    safeForCurrentSprintCount: rollup.safeForCurrentSprintCount,
    requiresContractChangeCount: rollup.requiresContractChangeCount,
    examples: rollup.examples
  }));
}

function buildDigestFingerprint(input: {
  status: CsvContractReleaseDigestStatus;
  entityCount: number;
  operationCount: number;
  capabilityCount: number;
  supportedEntityOperationCount: number;
  statusCounts: CsvContractReleaseDigestStatusCounts;
  operationStatusCounts: CsvContractReleaseDigestStatusCounts;
  entityOperationStatusCounts: CsvContractReleaseDigestStatusCounts;
  operations: readonly CsvContractReleaseOperationDigest[];
  warningCodes: readonly CsvContractReleaseWarningCodeRollup[];
  sourceCodes: readonly CsvContractReleaseSourceCodeRollup[];
  sourceFingerprints: readonly CsvContractReleaseSourceFingerprintRollup[];
}): string {
  return digestPayload({
    status: input.status,
    entityCount: input.entityCount,
    operationCount: input.operationCount,
    capabilityCount: input.capabilityCount,
    supportedEntityOperationCount: input.supportedEntityOperationCount,
    statusCounts: input.statusCounts,
    operationStatusCounts: input.operationStatusCounts,
    entityOperationStatusCounts: input.entityOperationStatusCounts,
    operations: input.operations.map((operation) => ({
      operation: operation.operation,
      status: operation.status,
      statusCounts: operation.statusCounts,
      warningCodes: operation.warningCodes,
      sourceCodes: operation.sourceCodes,
      sourceFingerprintCount: operation.sourceFingerprintCount
    })),
    warningCodes: input.warningCodes.map((warning) => ({
      code: warning.code,
      occurrenceCount: warning.occurrenceCount
    })),
    sourceCodes: input.sourceCodes.map((sourceCode) => ({
      code: sourceCode.code,
      occurrenceCount: sourceCode.occurrenceCount,
      requiresContractChangeCount: sourceCode.requiresContractChangeCount
    })),
    sourceFingerprints: input.sourceFingerprints.map((rollup) => ({
      source: rollup.source,
      scope: rollup.scope,
      contentType: rollup.contentType,
      fingerprintCount: rollup.fingerprintCount,
      payloadBytes: rollup.payloadBytes,
      fingerprints: rollup.fingerprints
    }))
  });
}

export function isCsvContractReleaseDigestOperation(
  value: string
): value is CsvContractReleaseDigestOperation {
  return isCsvOperatorHandoffPacketOperation(value);
}

export function getCsvContractReleaseOperationDigest(
  operation: string
): CsvContractReleaseOperationDigest | null {
  if (!isCsvContractReleaseDigestOperation(operation)) {
    return null;
  }

  const packet = getCsvOperatorHandoffOperationPacket(operation);

  if (packet === null) {
    throw new Error(`Missing CSV contract release operation ${operation}`);
  }

  return buildOperationDigest(packet);
}

export function listCsvContractReleaseOperationDigests(): CsvContractReleaseOperationDigest[] {
  return listCsvOperatorHandoffOperationPackets().map(buildOperationDigest);
}

export function getCsvContractReleaseDigest(): CsvContractReleaseDigest {
  const handoffPackets = getCsvOperatorHandoffPackets();
  const entries = handoffPackets.entries;
  const handoffOperations = handoffPackets.operations;
  const operations = handoffOperations.map(buildOperationDigest);
  const operationStatusCounts = countStatuses(operations);
  const entityOperationStatusCounts = handoffOperations.reduce(
    (counts, operation) => addStatusCounts(counts, operation.statusCounts),
    emptyStatusCounts()
  );
  const supportedEntityOperationCount = operations.reduce(
    (count, operation) => count + operation.supportedEntityCount,
    0
  );
  const unsupportedEntityOperationCount = operations.reduce(
    (count, operation) => count + operation.unsupportedEntityCount,
    0
  );
  const warningCodeEntries = buildWarningCodeRollups(entries);
  const sourceCodeEntries = buildSourceCodeRollups(entries);
  const sourceFingerprints = collectSourceFingerprints(
    entries,
    handoffOperations,
    handoffPackets.sourceFingerprints
  );
  const sourceFingerprintEntries =
    buildSourceFingerprintRollups(sourceFingerprints);
  const warningCodes = warningCodeEntries.map((entry) => entry.code);
  const sourceCodes = sourceCodeEntries.map((entry) => entry.code);
  const releaseNote = buildDigestReleaseNote({
    status: handoffPackets.status,
    entityCount: handoffPackets.entityCount,
    operationCount: handoffPackets.operationCount,
    capabilityCount: handoffPackets.capabilityCount,
    supportedEntityOperationCount,
    unsupportedEntityOperationCount,
    entityOperationStatusCounts,
    warningCodes
  });
  const fingerprint = buildDigestFingerprint({
    status: handoffPackets.status,
    entityCount: handoffPackets.entityCount,
    operationCount: handoffPackets.operationCount,
    capabilityCount: handoffPackets.capabilityCount,
    supportedEntityOperationCount,
    statusCounts: handoffPackets.statusCounts,
    operationStatusCounts,
    entityOperationStatusCounts,
    operations,
    warningCodes: warningCodeEntries,
    sourceCodes: sourceCodeEntries,
    sourceFingerprints: sourceFingerprintEntries
  });

  return {
    contentType: CSV_CONTRACT_RELEASE_DIGEST_CONTENT_TYPE,
    digestVersion: 1,
    status: handoffPackets.status,
    fingerprint,
    entityCount: handoffPackets.entityCount,
    operationCount: handoffPackets.operationCount,
    capabilityCount: handoffPackets.capabilityCount,
    supportedEntityOperationCount,
    unsupportedEntityOperationCount,
    statusCounts: handoffPackets.statusCounts,
    operationStatusCounts,
    entityOperationStatusCounts,
    operations,
    warningCodeRollup: {
      warningCodes,
      entries: warningCodeEntries
    },
    sourceCodeRollup: {
      sourceCodes,
      entries: sourceCodeEntries
    },
    sourceFingerprintRollup: {
      sourceFingerprintCount: sourceFingerprints.length,
      payloadBytes: sourceFingerprints.reduce(
        (count, fingerprintEntry) => count + fingerprintEntry.payloadBytes,
        0
      ),
      entries: sourceFingerprintEntries
    },
    releaseNote,
    source: {
      operatorHandoffContentType: handoffPackets.contentType,
      operatorHandoffPacketVersion: handoffPackets.packetVersion,
      operatorHandoffStatus: handoffPackets.status,
      contractDriftFingerprint: handoffPackets.source.contractDriftFingerprint
    },
    read: metadataOnlyReads(),
    write: noWrites()
  };
}
