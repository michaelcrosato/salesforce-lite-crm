import { createHash } from "node:crypto";
import {
  CSV_HANDOFF_RELEASE_NOTES_PACKET_CONTENT_TYPE,
  getCsvHandoffReleaseNotesPacket,
  isCsvHandoffReleaseNotesEntity,
  isCsvHandoffReleaseNotesOperation,
  type CsvHandoffReleaseNotesEntity,
  type CsvHandoffReleaseNotesEntityPacket,
  type CsvHandoffReleaseNotesOperation,
  type CsvHandoffReleaseNotesOperationPacket,
  type CsvHandoffReleaseNotesPacket,
  type CsvHandoffReleaseNotesStatus
} from "@/lib/server/csvHandoffReleaseNotesPackets";
import {
  CSV_OPERATOR_ACCEPTANCE_CHECKLIST_CONTENT_TYPE,
  getCsvOperatorAcceptanceChecklist,
  type CsvOperatorAcceptanceChecklist,
  type CsvOperatorAcceptanceChecklistItem,
  type CsvOperatorAcceptanceChecklistOptions,
  type CsvOperatorAcceptanceChecklistStatus,
  type CsvOperatorAcceptanceEntityChecklist,
  type CsvOperatorAcceptanceOperationChecklist
} from "@/lib/server/csvOperatorAcceptanceChecklists";
import {
  CSV_OPERATOR_FIXTURE_BUNDLE_CONTENT_TYPE,
  getCsvOperatorFixtureBundle,
  type CsvOperatorFixtureAvailability,
  type CsvOperatorFixtureBundle,
  type CsvOperatorFixtureEntityBundle,
  type CsvOperatorFixtureEntityOperation,
  type CsvOperatorFixtureOperationBundle
} from "@/lib/server/csvOperatorFixtureBundles";

export const CSV_RELEASE_CLOSURE_SCORECARD_CONTENT_TYPE =
  "application/json; charset=utf-8" as const;

export type CsvReleaseClosureEntity = CsvHandoffReleaseNotesEntity;
export type CsvReleaseClosureOperation = CsvHandoffReleaseNotesOperation;
export type CsvReleaseClosureOptions = CsvOperatorAcceptanceChecklistOptions;
export type CsvReleaseClosureStatus = "ready" | "watch" | "block";

export type CsvReleaseClosureStatusCounts = {
  ready: number;
  watch: number;
  block: number;
};

export type CsvReleaseClosureReadFlags = {
  metadata: true;
  database: boolean;
  csvInput: boolean;
  csvOutput: boolean;
};

export type CsvReleaseClosureWriteFlags = {
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

export type CsvReleaseClosureSourceFingerprint = {
  source:
    | "handoff-release-notes"
    | "operator-acceptance-checklist"
    | "operator-fixture-bundle";
  contentType: string;
  fingerprint: string;
};

export type CsvReleaseClosureSource = {
  handoffReleaseNotesContentType:
    typeof CSV_HANDOFF_RELEASE_NOTES_PACKET_CONTENT_TYPE;
  handoffReleaseNotesPacketVersion: 1;
  handoffReleaseNotesFingerprint: string;
  acceptanceChecklistContentType:
    typeof CSV_OPERATOR_ACCEPTANCE_CHECKLIST_CONTENT_TYPE;
  acceptanceChecklistVersion: 1;
  acceptanceChecklistFingerprint: string;
  operatorFixtureContentType: typeof CSV_OPERATOR_FIXTURE_BUNDLE_CONTENT_TYPE;
  operatorFixtureBundleVersion: 1;
  operatorFixtureFingerprint: string;
  contractDriftFingerprint: string;
  sourceFingerprints: readonly CsvReleaseClosureSourceFingerprint[];
};

export type CsvReleaseClosureReleaseNoteAnchor = {
  title: string;
  statusLabel: CsvHandoffReleaseNotesPacket["releaseNote"]["statusLabel"];
  readyForReleaseNotes: true;
  safeForCurrentSprint: boolean;
  requiresContractChange: boolean;
  sourceFingerprint: string;
  warningCodes: readonly string[];
  sourceCodes: readonly string[];
  noWriteGuarantee: string;
};

export type CsvReleaseClosureFixtureCoverage = {
  available: boolean;
  kind: CsvOperatorFixtureAvailability["kind"];
  coveredCount: number;
  expectedCount: number;
  missingCount: number;
};

export type CsvReleaseClosureCheckCode =
  | "release-note-status"
  | "acceptance-checklist-status"
  | "fixture-coverage"
  | "no-write-safety";

export type CsvReleaseClosureCheck = {
  code: CsvReleaseClosureCheckCode;
  label: string;
  status: CsvReleaseClosureStatus;
  required: true;
  evidence: {
    releaseStatus: CsvHandoffReleaseNotesStatus | null;
    acceptanceStatus: CsvOperatorAcceptanceChecklistStatus | null;
    fixtureAvailable: boolean | null;
    fixtureKind: CsvOperatorFixtureAvailability["kind"] | null;
    writeDriftSources: readonly string[];
  };
};

export type CsvReleaseClosureItem = {
  id: string;
  entity: CsvReleaseClosureEntity;
  label: string;
  route: string | null;
  operation: CsvReleaseClosureOperation;
  status: CsvReleaseClosureStatus;
  releaseStatus: CsvHandoffReleaseNotesStatus;
  acceptanceStatus: CsvOperatorAcceptanceChecklistStatus;
  supported: boolean;
  fixture: CsvOperatorFixtureAvailability;
  fixtureCoverage: CsvReleaseClosureFixtureCoverage;
  releaseNoteAnchor: CsvReleaseClosureReleaseNoteAnchor;
  checks: readonly CsvReleaseClosureCheck[];
  checkStatusCounts: CsvReleaseClosureStatusCounts;
  acceptanceCriteriaCounts: CsvOperatorAcceptanceChecklistItem["criteriaCounts"];
  warningCodes: readonly string[];
  sourceCodes: readonly string[];
  sourceContentTypes: readonly string[];
  read: CsvReleaseClosureReadFlags;
  write: CsvReleaseClosureWriteFlags;
};

export type CsvReleaseClosureEntityScorecard = {
  contentType: typeof CSV_RELEASE_CLOSURE_SCORECARD_CONTENT_TYPE;
  scorecardVersion: 1;
  entity: CsvReleaseClosureEntity;
  label: string;
  route: string | null;
  direction: CsvOperatorAcceptanceEntityChecklist["direction"];
  status: CsvReleaseClosureStatus;
  fingerprint: string;
  operationCount: number;
  supportedOperationCount: number;
  unsupportedOperationCount: number;
  fixtureOperationCount: number;
  closureItemCount: number;
  statusCounts: CsvReleaseClosureStatusCounts;
  checkStatusCounts: CsvReleaseClosureStatusCounts;
  releaseNoteAnchor: CsvReleaseClosureReleaseNoteAnchor;
  fixtureCoverage: CsvReleaseClosureFixtureCoverage;
  items: readonly CsvReleaseClosureItem[];
  source: CsvReleaseClosureSource;
  sourceContentTypes: readonly string[];
  read: CsvReleaseClosureReadFlags;
  write: CsvReleaseClosureWriteFlags;
};

export type CsvReleaseClosureOperationScorecard = {
  contentType: typeof CSV_RELEASE_CLOSURE_SCORECARD_CONTENT_TYPE;
  scorecardVersion: 1;
  operation: CsvReleaseClosureOperation;
  status: CsvReleaseClosureStatus;
  fingerprint: string;
  entityCount: number;
  supportedEntityCount: number;
  unsupportedEntityCount: number;
  fixtureEntityCount: number;
  closureItemCount: number;
  statusCounts: CsvReleaseClosureStatusCounts;
  checkStatusCounts: CsvReleaseClosureStatusCounts;
  releaseNoteAnchor: CsvReleaseClosureReleaseNoteAnchor;
  fixtureCoverage: CsvReleaseClosureFixtureCoverage;
  items: readonly CsvReleaseClosureItem[];
  source: CsvReleaseClosureSource;
  sourceContentTypes: readonly string[];
  read: CsvReleaseClosureReadFlags;
  write: CsvReleaseClosureWriteFlags;
};

export type CsvReleaseClosureScorecard = {
  contentType: typeof CSV_RELEASE_CLOSURE_SCORECARD_CONTENT_TYPE;
  scorecardVersion: 1;
  status: CsvReleaseClosureStatus;
  fingerprint: string;
  entityCount: number;
  operationCount: number;
  closureItemCount: number;
  supportedItemCount: number;
  unsupportedItemCount: number;
  fixtureItemCount: number;
  statusCounts: CsvReleaseClosureStatusCounts;
  entityStatusCounts: CsvReleaseClosureStatusCounts;
  operationStatusCounts: CsvReleaseClosureStatusCounts;
  checkStatusCounts: CsvReleaseClosureStatusCounts;
  releaseNoteAnchor: CsvReleaseClosureReleaseNoteAnchor;
  fixtureCoverage: {
    fixtureItemCount: number;
    exportFixtureCount: number;
    importFixtureCount: number;
    missingFixtureItemCount: number;
    operationCoverage: CsvHandoffReleaseNotesPacket["fixtureRollup"]["operationAvailability"];
  };
  sourceFingerprints: readonly CsvReleaseClosureSourceFingerprint[];
  sourceContentTypes: readonly string[];
  entities: readonly CsvReleaseClosureEntityScorecard[];
  operations: readonly CsvReleaseClosureOperationScorecard[];
  source: CsvReleaseClosureSource;
  read: CsvReleaseClosureReadFlags;
  write: CsvReleaseClosureWriteFlags;
};

type ReadFlagInput = {
  metadata: true;
  database: boolean;
  csvInput: boolean;
  csvOutput: boolean;
};

type WriteFlagInput = {
  database: boolean;
  files?: boolean;
  externalServices: boolean;
  exportHistory?: boolean;
  scheduledDelivery?: boolean;
  backgroundJobs?: boolean;
  routingAssignments?: boolean;
  importApply?: boolean;
  bulkMutations?: boolean;
  headerRemapping?: boolean;
  salesforceSync?: boolean;
};

function noWrites(): CsvReleaseClosureWriteFlags {
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
  reads: readonly ReadFlagInput[]
): CsvReleaseClosureReadFlags {
  return {
    metadata: true,
    database: reads.some((read) => read.database),
    csvInput: reads.some((read) => read.csvInput),
    csvOutput: reads.some((read) => read.csvOutput)
  };
}

function hasWriteDrift(write: WriteFlagInput): boolean {
  return (
    write.database ||
    write.files === true ||
    write.externalServices ||
    write.exportHistory === true ||
    write.scheduledDelivery === true ||
    write.backgroundJobs === true ||
    write.routingAssignments === true ||
    write.importApply === true ||
    write.bulkMutations === true ||
    write.headerRemapping === true ||
    write.salesforceSync === true
  );
}

function writeDriftSources(
  sources: readonly { source: string; write: WriteFlagInput }[]
): string[] {
  return sources
    .filter((source) => hasWriteDrift(source.write))
    .map((source) => source.source);
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

function emptyStatusCounts(): CsvReleaseClosureStatusCounts {
  return {
    ready: 0,
    watch: 0,
    block: 0
  };
}

function countStatuses(
  values: readonly { status: CsvReleaseClosureStatus }[]
): CsvReleaseClosureStatusCounts {
  const counts = emptyStatusCounts();

  for (const value of values) {
    counts[value.status] += 1;
  }

  return counts;
}

function combineStatusCounts(
  values: readonly CsvReleaseClosureStatusCounts[]
): CsvReleaseClosureStatusCounts {
  return values.reduce<CsvReleaseClosureStatusCounts>(
    (current, counts) => ({
      ready: current.ready + counts.ready,
      watch: current.watch + counts.watch,
      block: current.block + counts.block
    }),
    emptyStatusCounts()
  );
}

function statusFromCounts(
  counts: CsvReleaseClosureStatusCounts
): CsvReleaseClosureStatus {
  if (counts.block > 0) {
    return "block";
  }

  return counts.watch > 0 ? "watch" : "ready";
}

function releaseStatusToClosureStatus(
  status: CsvHandoffReleaseNotesStatus
): CsvReleaseClosureStatus {
  switch (status) {
    case "stable":
      return "ready";
    case "watch":
      return "watch";
    case "blocked":
      return "block";
  }
}

function acceptanceStatusToClosureStatus(
  status: CsvOperatorAcceptanceChecklistStatus
): CsvReleaseClosureStatus {
  switch (status) {
    case "pass":
      return "ready";
    case "watch":
      return "watch";
    case "block":
      return "block";
  }
}

function buildSource(input: {
  releaseNotes: CsvHandoffReleaseNotesPacket;
  acceptance: CsvOperatorAcceptanceChecklist;
  fixture: CsvOperatorFixtureBundle;
}): CsvReleaseClosureSource {
  const sourceFingerprints: CsvReleaseClosureSourceFingerprint[] = [
    {
      source: "handoff-release-notes",
      contentType: input.releaseNotes.contentType,
      fingerprint: input.releaseNotes.fingerprint
    },
    {
      source: "operator-acceptance-checklist",
      contentType: input.acceptance.contentType,
      fingerprint: input.acceptance.fingerprint
    },
    {
      source: "operator-fixture-bundle",
      contentType: input.fixture.contentType,
      fingerprint: input.fixture.fingerprint
    }
  ];

  return {
    handoffReleaseNotesContentType: input.releaseNotes.contentType,
    handoffReleaseNotesPacketVersion: input.releaseNotes.packetVersion,
    handoffReleaseNotesFingerprint: input.releaseNotes.fingerprint,
    acceptanceChecklistContentType: input.acceptance.contentType,
    acceptanceChecklistVersion: input.acceptance.checklistVersion,
    acceptanceChecklistFingerprint: input.acceptance.fingerprint,
    operatorFixtureContentType: input.fixture.contentType,
    operatorFixtureBundleVersion: input.fixture.bundleVersion,
    operatorFixtureFingerprint: input.fixture.fingerprint,
    contractDriftFingerprint: input.acceptance.source.contractDriftFingerprint,
    sourceFingerprints
  };
}

function buildReleaseNoteAnchor(input: {
  releaseNotes: CsvHandoffReleaseNotesPacket;
  fingerprint: string;
  warningCodes: readonly string[];
  sourceCodes: readonly string[];
}): CsvReleaseClosureReleaseNoteAnchor {
  return {
    title: input.releaseNotes.releaseNote.title,
    statusLabel: input.releaseNotes.releaseNote.statusLabel,
    readyForReleaseNotes: input.releaseNotes.releaseNote.readyForReleaseNotes,
    safeForCurrentSprint: input.releaseNotes.releaseNote.safeForCurrentSprint,
    requiresContractChange: input.releaseNotes.releaseNote.requiresContractChange,
    sourceFingerprint: input.fingerprint,
    warningCodes: input.warningCodes,
    sourceCodes: input.sourceCodes,
    noWriteGuarantee: input.releaseNotes.releaseNote.noWriteGuarantee
  };
}

function buildFixtureCoverage(input: {
  fixture: CsvOperatorFixtureAvailability;
  expectedCount: number;
}): CsvReleaseClosureFixtureCoverage {
  const coveredCount = input.fixture.available ? 1 : 0;

  return {
    available: input.fixture.available,
    kind: input.fixture.kind,
    coveredCount,
    expectedCount: input.expectedCount,
    missingCount: input.expectedCount - coveredCount
  };
}

function buildAggregateFixtureCoverage(input: {
  coveredCount: number;
  expectedCount: number;
  kind: CsvOperatorFixtureAvailability["kind"];
}): CsvReleaseClosureFixtureCoverage {
  return {
    available: input.coveredCount === input.expectedCount,
    kind: input.kind,
    coveredCount: input.coveredCount,
    expectedCount: input.expectedCount,
    missingCount: input.expectedCount - input.coveredCount
  };
}

function buildCheck(input: {
  code: CsvReleaseClosureCheckCode;
  label: string;
  status: CsvReleaseClosureStatus;
  releaseStatus: CsvHandoffReleaseNotesStatus | null;
  acceptanceStatus: CsvOperatorAcceptanceChecklistStatus | null;
  fixture: CsvOperatorFixtureAvailability | null;
  writeDriftSources?: readonly string[];
}): CsvReleaseClosureCheck {
  return {
    code: input.code,
    label: input.label,
    status: input.status,
    required: true,
    evidence: {
      releaseStatus: input.releaseStatus,
      acceptanceStatus: input.acceptanceStatus,
      fixtureAvailable: input.fixture?.available ?? null,
      fixtureKind: input.fixture?.kind ?? null,
      writeDriftSources: input.writeDriftSources ?? []
    }
  };
}

function buildChecks(input: {
  releaseOperation: CsvHandoffReleaseNotesEntityPacket["operations"][number];
  acceptanceItem: CsvOperatorAcceptanceChecklistItem;
  fixtureOperation: CsvOperatorFixtureEntityOperation;
}): CsvReleaseClosureCheck[] {
  const driftSources = writeDriftSources([
    {
      source: "handoff-release-notes",
      write: input.releaseOperation.write
    },
    {
      source: "operator-acceptance-checklist",
      write: input.acceptanceItem.write
    },
    {
      source: "operator-fixture-bundle",
      write: input.fixtureOperation.write
    }
  ]);

  return [
    buildCheck({
      code: "release-note-status",
      label: "Release-note status is closed for the operation",
      status: releaseStatusToClosureStatus(input.releaseOperation.status),
      releaseStatus: input.releaseOperation.status,
      acceptanceStatus: null,
      fixture: null
    }),
    buildCheck({
      code: "acceptance-checklist-status",
      label: "Operator acceptance checklist is closed",
      status: acceptanceStatusToClosureStatus(input.acceptanceItem.status),
      releaseStatus: null,
      acceptanceStatus: input.acceptanceItem.status,
      fixture: null
    }),
    buildCheck({
      code: "fixture-coverage",
      label: "Bounded fixture coverage is available",
      status: input.fixtureOperation.fixture.available ? "ready" : "block",
      releaseStatus: null,
      acceptanceStatus: null,
      fixture: input.fixtureOperation.fixture
    }),
    buildCheck({
      code: "no-write-safety",
      label: "All closure sources preserve no-write safety flags",
      status: driftSources.length === 0 ? "ready" : "block",
      releaseStatus: null,
      acceptanceStatus: null,
      fixture: null,
      writeDriftSources: driftSources
    })
  ];
}

function findFixtureEntity(
  fixture: CsvOperatorFixtureBundle,
  entity: CsvReleaseClosureEntity
): CsvOperatorFixtureEntityBundle {
  const bundle = fixture.entities.find((entry) => entry.entity === entity);

  if (bundle === undefined) {
    throw new Error(`Missing CSV release closure fixture entity ${entity}`);
  }

  return bundle;
}

function findFixtureOperation(
  fixture: CsvOperatorFixtureBundle,
  operation: CsvReleaseClosureOperation
): CsvOperatorFixtureOperationBundle {
  const bundle = fixture.operations.find(
    (entry) => entry.operation === operation
  );

  if (bundle === undefined) {
    throw new Error(`Missing CSV release closure fixture operation ${operation}`);
  }

  return bundle;
}

function findFixtureEntityOperation(input: {
  entity: CsvOperatorFixtureEntityBundle;
  operation: CsvReleaseClosureOperation;
}): CsvOperatorFixtureEntityOperation {
  const operation = input.entity.operations.find(
    (entry) => entry.operation === input.operation
  );

  if (operation === undefined) {
    throw new Error(
      `Missing CSV release closure fixture operation ${input.operation} for ${input.entity.entity}`
    );
  }

  return operation;
}

function findReleaseEntity(
  releaseNotes: CsvHandoffReleaseNotesPacket,
  entity: CsvReleaseClosureEntity
): CsvHandoffReleaseNotesEntityPacket {
  const packet = releaseNotes.entities.find((entry) => entry.entity === entity);

  if (packet === undefined) {
    throw new Error(`Missing CSV release closure release-note entity ${entity}`);
  }

  return packet;
}

function findReleaseOperation(
  releaseNotes: CsvHandoffReleaseNotesPacket,
  operation: CsvReleaseClosureOperation
): CsvHandoffReleaseNotesOperationPacket {
  const packet = releaseNotes.operations.find(
    (entry) => entry.operation === operation
  );

  if (packet === undefined) {
    throw new Error(
      `Missing CSV release closure release-note operation ${operation}`
    );
  }

  return packet;
}

function findReleaseEntityOperation(input: {
  entity: CsvHandoffReleaseNotesEntityPacket;
  operation: CsvReleaseClosureOperation;
}): CsvHandoffReleaseNotesEntityPacket["operations"][number] {
  const operation = input.entity.operations.find(
    (entry) => entry.operation === input.operation
  );

  if (operation === undefined) {
    throw new Error(
      `Missing CSV release closure release-note operation ${input.operation} for ${input.entity.entity}`
    );
  }

  return operation;
}

function findEntityItem(input: {
  entity: CsvReleaseClosureEntityScorecard;
  operation: CsvReleaseClosureOperation;
}): CsvReleaseClosureItem {
  const item = input.entity.items.find(
    (candidate) => candidate.operation === input.operation
  );

  if (item === undefined) {
    throw new Error(
      `Missing CSV release closure operation ${input.operation} for ${input.entity.entity}`
    );
  }

  return item;
}

function buildItem(input: {
  acceptanceItem: CsvOperatorAcceptanceChecklistItem;
  releaseNotes: CsvHandoffReleaseNotesPacket;
  releaseEntity: CsvHandoffReleaseNotesEntityPacket;
  fixtureEntity: CsvOperatorFixtureEntityBundle;
}): CsvReleaseClosureItem {
  const releaseOperation = findReleaseEntityOperation({
    entity: input.releaseEntity,
    operation: input.acceptanceItem.operation
  });
  const fixtureOperation = findFixtureEntityOperation({
    entity: input.fixtureEntity,
    operation: input.acceptanceItem.operation
  });
  const checks = buildChecks({
    releaseOperation,
    acceptanceItem: input.acceptanceItem,
    fixtureOperation
  });
  const checkStatusCounts = countStatuses(checks);
  const status = statusFromCounts(checkStatusCounts);
  const fixtureCoverage = buildFixtureCoverage({
    fixture: fixtureOperation.fixture,
    expectedCount: 1
  });

  return {
    id: input.acceptanceItem.id,
    entity: input.acceptanceItem.entity,
    label: input.acceptanceItem.label,
    route: input.acceptanceItem.route,
    operation: input.acceptanceItem.operation,
    status,
    releaseStatus: releaseOperation.status,
    acceptanceStatus: input.acceptanceItem.status,
    supported: input.acceptanceItem.supported,
    fixture: fixtureOperation.fixture,
    fixtureCoverage,
    releaseNoteAnchor: buildReleaseNoteAnchor({
      releaseNotes: input.releaseNotes,
      fingerprint: input.releaseEntity.fingerprint,
      warningCodes: releaseOperation.warningCodes,
      sourceCodes: releaseOperation.sourceCodes
    }),
    checks,
    checkStatusCounts,
    acceptanceCriteriaCounts: input.acceptanceItem.criteriaCounts,
    warningCodes: uniqueStrings([
      ...releaseOperation.warningCodes,
      ...input.acceptanceItem.warningCodes
    ]),
    sourceCodes: uniqueStrings([
      ...releaseOperation.sourceCodes,
      ...input.acceptanceItem.sourceCodes
    ]),
    sourceContentTypes: uniqueStrings([
      ...releaseOperation.sourceContentTypes,
      ...input.acceptanceItem.sourceContentTypes,
      ...fixtureOperation.handoff.sourceContentTypes
    ]),
    read: combineReads([
      releaseOperation.read,
      input.acceptanceItem.read,
      fixtureOperation.read
    ]),
    write: noWrites()
  };
}

function buildEntityFingerprint(input: {
  source: CsvReleaseClosureSource;
  entity: CsvReleaseClosureEntity;
  status: CsvReleaseClosureStatus;
  items: readonly CsvReleaseClosureItem[];
}): string {
  return digestPayload({
    source: input.source.sourceFingerprints,
    entity: input.entity,
    status: input.status,
    items: input.items.map((item) => ({
      id: item.id,
      operation: item.operation,
      status: item.status,
      releaseStatus: item.releaseStatus,
      acceptanceStatus: item.acceptanceStatus,
      fixture: item.fixture,
      checkStatusCounts: item.checkStatusCounts
    }))
  });
}

function buildEntityScorecard(input: {
  checklist: CsvOperatorAcceptanceEntityChecklist;
  fixture: CsvOperatorFixtureBundle;
  releaseNotes: CsvHandoffReleaseNotesPacket;
  source: CsvReleaseClosureSource;
}): CsvReleaseClosureEntityScorecard {
  const fixtureEntity = findFixtureEntity(input.fixture, input.checklist.entity);
  const releaseEntity = findReleaseEntity(
    input.releaseNotes,
    input.checklist.entity
  );
  const items = input.checklist.items.map((item) =>
    buildItem({
      acceptanceItem: item,
      releaseNotes: input.releaseNotes,
      releaseEntity,
      fixtureEntity
    })
  );
  const statusCounts = countStatuses(items);
  const checkStatusCounts = combineStatusCounts(
    items.map((item) => item.checkStatusCounts)
  );
  const status = statusFromCounts(statusCounts);
  const fixtureOperationCount = items.filter((item) => item.fixture.available)
    .length;
  const fingerprint = buildEntityFingerprint({
    source: input.source,
    entity: input.checklist.entity,
    status,
    items
  });

  return {
    contentType: CSV_RELEASE_CLOSURE_SCORECARD_CONTENT_TYPE,
    scorecardVersion: 1,
    entity: input.checklist.entity,
    label: input.checklist.label,
    route: input.checklist.route,
    direction: input.checklist.direction,
    status,
    fingerprint,
    operationCount: input.checklist.itemCount,
    supportedOperationCount: input.checklist.supportedItemCount,
    unsupportedOperationCount: input.checklist.unsupportedItemCount,
    fixtureOperationCount,
    closureItemCount: items.length,
    statusCounts,
    checkStatusCounts,
    releaseNoteAnchor: buildReleaseNoteAnchor({
      releaseNotes: input.releaseNotes,
      fingerprint: releaseEntity.fingerprint,
      warningCodes: releaseEntity.warningCodes,
      sourceCodes: releaseEntity.sourceCodes
    }),
    fixtureCoverage: buildAggregateFixtureCoverage({
      coveredCount: fixtureOperationCount,
      expectedCount: items.length,
      kind: items.every((item) => item.fixture.available)
        ? items[0]?.fixture.kind ?? null
        : null
    }),
    items,
    source: input.source,
    sourceContentTypes: uniqueStrings([
      input.checklist.contentType,
      releaseEntity.contentType,
      fixtureEntity.contentType,
      ...items.flatMap((item) => item.sourceContentTypes)
    ]),
    read: combineReads([
      input.checklist.read,
      releaseEntity.read,
      fixtureEntity.read,
      ...items.map((item) => item.read)
    ]),
    write: noWrites()
  };
}

function buildOperationFingerprint(input: {
  source: CsvReleaseClosureSource;
  operation: CsvReleaseClosureOperation;
  status: CsvReleaseClosureStatus;
  items: readonly CsvReleaseClosureItem[];
}): string {
  return digestPayload({
    source: input.source.sourceFingerprints,
    operation: input.operation,
    status: input.status,
    items: input.items.map((item) => ({
      id: item.id,
      entity: item.entity,
      status: item.status,
      releaseStatus: item.releaseStatus,
      acceptanceStatus: item.acceptanceStatus,
      fixture: item.fixture,
      checkStatusCounts: item.checkStatusCounts
    }))
  });
}

function buildOperationScorecard(input: {
  checklist: CsvOperatorAcceptanceOperationChecklist;
  fixture: CsvOperatorFixtureBundle;
  releaseNotes: CsvHandoffReleaseNotesPacket;
  entityScorecards: readonly CsvReleaseClosureEntityScorecard[];
  source: CsvReleaseClosureSource;
}): CsvReleaseClosureOperationScorecard {
  const releaseOperation = findReleaseOperation(
    input.releaseNotes,
    input.checklist.operation
  );
  const fixtureOperation = findFixtureOperation(
    input.fixture,
    input.checklist.operation
  );
  const items = input.entityScorecards.map((entity) =>
    findEntityItem({
      entity,
      operation: input.checklist.operation
    })
  );
  const statusCounts = countStatuses(items);
  const checkStatusCounts = combineStatusCounts(
    items.map((item) => item.checkStatusCounts)
  );
  const status = statusFromCounts(statusCounts);
  const fixtureEntityCount = items.filter((item) => item.fixture.available).length;
  const fingerprint = buildOperationFingerprint({
    source: input.source,
    operation: input.checklist.operation,
    status,
    items
  });

  return {
    contentType: CSV_RELEASE_CLOSURE_SCORECARD_CONTENT_TYPE,
    scorecardVersion: 1,
    operation: input.checklist.operation,
    status,
    fingerprint,
    entityCount: input.checklist.itemCount,
    supportedEntityCount: input.checklist.supportedItemCount,
    unsupportedEntityCount: input.checklist.unsupportedItemCount,
    fixtureEntityCount,
    closureItemCount: items.length,
    statusCounts,
    checkStatusCounts,
    releaseNoteAnchor: buildReleaseNoteAnchor({
      releaseNotes: input.releaseNotes,
      fingerprint: releaseOperation.fingerprint,
      warningCodes: releaseOperation.warningCodes,
      sourceCodes: releaseOperation.sourceCodes
    }),
    fixtureCoverage: buildAggregateFixtureCoverage({
      coveredCount: fixtureEntityCount,
      expectedCount: items.length,
      kind: items.every((item) => item.fixture.available)
        ? items[0]?.fixture.kind ?? null
        : null
    }),
    items,
    source: input.source,
    sourceContentTypes: uniqueStrings([
      input.checklist.contentType,
      releaseOperation.contentType,
      fixtureOperation.contentType,
      ...releaseOperation.sourceContentTypes,
      ...fixtureOperation.handoff.sourceContentTypes,
      ...items.flatMap((item) => item.sourceContentTypes)
    ]),
    read: combineReads([
      input.checklist.read,
      releaseOperation.read,
      fixtureOperation.read,
      ...items.map((item) => item.read)
    ]),
    write: noWrites()
  };
}

function buildScorecardFingerprint(input: {
  source: CsvReleaseClosureSource;
  status: CsvReleaseClosureStatus;
  entities: readonly CsvReleaseClosureEntityScorecard[];
  operations: readonly CsvReleaseClosureOperationScorecard[];
}): string {
  return digestPayload({
    source: input.source.sourceFingerprints,
    status: input.status,
    entities: input.entities.map((entity) => ({
      entity: entity.entity,
      status: entity.status,
      fingerprint: entity.fingerprint,
      statusCounts: entity.statusCounts,
      fixtureOperationCount: entity.fixtureOperationCount
    })),
    operations: input.operations.map((operation) => ({
      operation: operation.operation,
      status: operation.status,
      fingerprint: operation.fingerprint,
      statusCounts: operation.statusCounts,
      fixtureEntityCount: operation.fixtureEntityCount
    }))
  });
}

export function isCsvReleaseClosureEntity(
  value: string
): value is CsvReleaseClosureEntity {
  return isCsvHandoffReleaseNotesEntity(value);
}

export function isCsvReleaseClosureOperation(
  value: string
): value is CsvReleaseClosureOperation {
  return isCsvHandoffReleaseNotesOperation(value);
}

export async function getCsvReleaseClosureScorecard(
  options: CsvReleaseClosureOptions = {}
): Promise<CsvReleaseClosureScorecard> {
  const [releaseNotes, acceptance, fixture] = await Promise.all([
    getCsvHandoffReleaseNotesPacket(options),
    getCsvOperatorAcceptanceChecklist(options),
    getCsvOperatorFixtureBundle(options)
  ]);
  const source = buildSource({ releaseNotes, acceptance, fixture });
  const entities = acceptance.entities.map((checklist) =>
    buildEntityScorecard({
      checklist,
      fixture,
      releaseNotes,
      source
    })
  );
  const operations = acceptance.operations.map((checklist) =>
    buildOperationScorecard({
      checklist,
      fixture,
      releaseNotes,
      entityScorecards: entities,
      source
    })
  );
  const allItems = entities.flatMap((entity) => entity.items);
  const statusCounts = countStatuses(allItems);
  const checkStatusCounts = combineStatusCounts(
    allItems.map((item) => item.checkStatusCounts)
  );
  const status = statusFromCounts(statusCounts);
  const fingerprint = buildScorecardFingerprint({
    source,
    status,
    entities,
    operations
  });

  return {
    contentType: CSV_RELEASE_CLOSURE_SCORECARD_CONTENT_TYPE,
    scorecardVersion: 1,
    status,
    fingerprint,
    entityCount: entities.length,
    operationCount: operations.length,
    closureItemCount: allItems.length,
    supportedItemCount: allItems.filter((item) => item.supported).length,
    unsupportedItemCount: allItems.filter((item) => !item.supported).length,
    fixtureItemCount: allItems.filter((item) => item.fixture.available).length,
    statusCounts,
    entityStatusCounts: countStatuses(entities),
    operationStatusCounts: countStatuses(operations),
    checkStatusCounts,
    releaseNoteAnchor: buildReleaseNoteAnchor({
      releaseNotes,
      fingerprint: releaseNotes.fingerprint,
      warningCodes: releaseNotes.warningCodeRollup.warningCodes,
      sourceCodes: releaseNotes.sourceCodeRollup.sourceCodes
    }),
    fixtureCoverage: {
      fixtureItemCount: releaseNotes.fixtureRollup.fixtureOperationCount,
      exportFixtureCount: releaseNotes.fixtureRollup.exportFixtureCount,
      importFixtureCount: releaseNotes.fixtureRollup.importFixtureCount,
      missingFixtureItemCount:
        allItems.length - releaseNotes.fixtureRollup.fixtureOperationCount,
      operationCoverage: releaseNotes.fixtureRollup.operationAvailability
    },
    sourceFingerprints: source.sourceFingerprints,
    sourceContentTypes: uniqueStrings([
      CSV_RELEASE_CLOSURE_SCORECARD_CONTENT_TYPE,
      releaseNotes.contentType,
      acceptance.contentType,
      fixture.contentType,
      ...releaseNotes.sourceContentTypes,
      ...acceptance.sourceContentTypes,
      ...fixture.sourceContentTypes,
      ...entities.flatMap((entity) => entity.sourceContentTypes),
      ...operations.flatMap((operation) => operation.sourceContentTypes)
    ]),
    entities,
    operations,
    source,
    read: combineReads([
      releaseNotes.read,
      acceptance.read,
      fixture.read,
      ...entities.map((entity) => entity.read),
      ...operations.map((operation) => operation.read)
    ]),
    write: noWrites()
  };
}

export async function listCsvReleaseClosureEntityScorecards(
  options: CsvReleaseClosureOptions = {}
): Promise<CsvReleaseClosureEntityScorecard[]> {
  return (await getCsvReleaseClosureScorecard(options)).entities.slice();
}

export async function getCsvReleaseClosureEntityScorecard(
  entity: string,
  options: CsvReleaseClosureOptions = {}
): Promise<CsvReleaseClosureEntityScorecard | null> {
  if (!isCsvReleaseClosureEntity(entity)) {
    return null;
  }

  const scorecard = await getCsvReleaseClosureScorecard(options);

  return scorecard.entities.find((entry) => entry.entity === entity) ?? null;
}

export async function listCsvReleaseClosureOperationScorecards(
  options: CsvReleaseClosureOptions = {}
): Promise<CsvReleaseClosureOperationScorecard[]> {
  return (await getCsvReleaseClosureScorecard(options)).operations.slice();
}

export async function getCsvReleaseClosureOperationScorecard(
  operation: string,
  options: CsvReleaseClosureOptions = {}
): Promise<CsvReleaseClosureOperationScorecard | null> {
  if (!isCsvReleaseClosureOperation(operation)) {
    return null;
  }

  const scorecard = await getCsvReleaseClosureScorecard(options);

  return (
    scorecard.operations.find((entry) => entry.operation === operation) ?? null
  );
}
