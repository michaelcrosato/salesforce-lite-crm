import { createHash } from "node:crypto";
import {
  CSV_CAPABILITY_OPERATIONS,
  type CsvCapabilityOperation
} from "@/lib/server/csvCapabilities";
import {
  CSV_CONTRACT_QA_CHECKS_CONTENT_TYPE,
  getCsvContractQaChecks,
  getCsvContractQaEntityCheck,
  listCsvContractQaOperationChecks,
  type CsvContractQaEntityCheck,
  type CsvContractQaIssueCounts,
  type CsvContractQaOperationCheck,
  type CsvContractQaStatus,
  type CsvContractQaStatusCounts
} from "@/lib/server/csvContractQaChecks";
import {
  CSV_FIELD_COVERAGE_SUMMARY_CONTENT_TYPE,
  getCsvFieldCoverageEntitySummary,
  getCsvFieldCoverageSummary,
  listCsvFieldCoverageOperationSummaries,
  type CsvFieldCoverageEntityOperation,
  type CsvFieldCoverageEntitySummary,
  type CsvFieldCoverageSummary
} from "@/lib/server/csvFieldCoverageSummaries";
import {
  CSV_HANDOFF_INDEX_CONTENT_TYPE,
  getCsvHandoffIndex,
  getCsvHandoffIndexEntry,
  type CsvHandoffIndex,
  type CsvHandoffIndexEntry
} from "@/lib/server/csvHandoffIndex";
import {
  CSV_OPERATOR_READINESS_SCORECARD_CONTENT_TYPE,
  getCsvOperatorReadinessScorecard,
  getCsvOperatorReadinessScorecards,
  isCsvOperatorReadinessEntity,
  listCsvOperatorReadinessEntities,
  listCsvOperatorReadinessOperationScorecards,
  type CsvOperatorReadinessEntity,
  type CsvOperatorReadinessEntityScorecard,
  type CsvOperatorReadinessOperation,
  type CsvOperatorReadinessOperationScorecard,
  type CsvOperatorReadinessStatus,
  type CsvOperatorReadinessStatusCounts,
  type CsvOperatorReadinessWarningCode
} from "@/lib/server/csvOperatorReadinessScorecards";
import {
  CSV_OPERATOR_REMEDIATION_RUNBOOK_CONTENT_TYPE,
  getCsvOperatorRemediationRunbook,
  getCsvOperatorRemediationRunbooks,
  listCsvOperatorRemediationOperationRunbooks,
  type CsvOperatorRemediationEntityRunbook,
  type CsvOperatorRemediationOperationRunbook,
  type CsvOperatorRemediationSeverityCounts,
  type CsvOperatorRemediationSourceCode,
  type CsvOperatorRemediationStatus,
  type CsvOperatorRemediationStatusCounts
} from "@/lib/server/csvOperatorRemediationRunbooks";

export const CSV_CONTRACT_DRIFT_SNAPSHOT_CONTENT_TYPE =
  "application/json; charset=utf-8" as const;

export type CsvContractDriftSnapshotEntity = CsvOperatorReadinessEntity;
export type CsvContractDriftSnapshotOperation = CsvOperatorReadinessOperation;
export type CsvContractDriftSnapshotStatus = "stable" | "watch" | "blocked";
export type CsvContractDriftSnapshotSource =
  | "field-coverage-summary"
  | "handoff-index"
  | "operator-readiness-scorecards"
  | "contract-qa-checks"
  | "operator-remediation-runbooks";
export type CsvContractDriftSnapshotScope =
  | "all"
  | "entity"
  | "operation";

export type CsvContractDriftReadFlags = {
  metadata: true;
  database: boolean;
  csvInput: boolean;
  csvOutput: boolean;
};

export type CsvContractDriftWriteFlags = {
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

export type CsvContractDriftStatusCounts = {
  stable: number;
  watch: number;
  blocked: number;
};

export type CsvContractDriftSourceFingerprint = {
  source: CsvContractDriftSnapshotSource;
  scope: CsvContractDriftSnapshotScope;
  entity: CsvContractDriftSnapshotEntity | null;
  operation: CsvContractDriftSnapshotOperation | null;
  contentType: string;
  algorithm: "sha256";
  fingerprint: string;
  payloadBytes: number;
};

export type CsvContractDriftOperationStatus = {
  operation: CsvContractDriftSnapshotOperation;
  status: CsvContractDriftSnapshotStatus;
  supported: boolean;
  readinessStatus: CsvOperatorReadinessStatus;
  qaStatus: CsvContractQaStatus;
  remediationStatus: CsvOperatorRemediationStatus;
  issueCount: number;
  remediationCount: number;
  warningCodes: readonly CsvOperatorReadinessWarningCode[];
  sourceCodes: readonly CsvOperatorRemediationSourceCode[];
};

export type CsvContractDriftEntityStatus = {
  entity: CsvContractDriftSnapshotEntity;
  label: string;
  route: string | null;
  status: CsvContractDriftSnapshotStatus;
  readinessStatus: CsvOperatorReadinessStatus;
  qaStatus: CsvContractQaStatus;
  remediationStatus: CsvOperatorRemediationStatus;
  issueCount: number;
  remediationCount: number;
};

export type CsvContractDriftEntitySnapshot = {
  entity: CsvContractDriftSnapshotEntity;
  label: string;
  route: string | null;
  direction: CsvFieldCoverageEntitySummary["direction"];
  status: CsvContractDriftSnapshotStatus;
  operationCount: number;
  issueCount: number;
  remediationCount: number;
  readinessStatus: CsvOperatorReadinessStatus;
  qaStatus: CsvContractQaStatus;
  remediationStatus: CsvOperatorRemediationStatus;
  statusCounts: CsvContractDriftStatusCounts;
  readinessStatusCounts: CsvOperatorReadinessStatusCounts;
  qaStatusCounts: CsvContractQaStatusCounts;
  remediationStatusCounts: CsvOperatorRemediationStatusCounts;
  issueCounts: CsvContractQaIssueCounts;
  severityCounts: CsvOperatorRemediationSeverityCounts;
  warningCodes: readonly CsvOperatorReadinessWarningCode[];
  sourceCodes: readonly CsvOperatorRemediationSourceCode[];
  operations: readonly CsvContractDriftOperationStatus[];
  sourceFingerprints: readonly CsvContractDriftSourceFingerprint[];
  fingerprint: string;
  read: CsvContractDriftReadFlags;
  write: CsvContractDriftWriteFlags;
};

export type CsvContractDriftOperationSnapshot = {
  operation: CsvContractDriftSnapshotOperation;
  status: CsvContractDriftSnapshotStatus;
  entityCount: number;
  issueCount: number;
  remediationCount: number;
  statusCounts: CsvContractDriftStatusCounts;
  readinessStatusCounts: CsvOperatorReadinessStatusCounts;
  qaStatusCounts: CsvContractQaStatusCounts;
  remediationStatusCounts: CsvOperatorRemediationStatusCounts;
  issueCounts: CsvContractQaIssueCounts;
  severityCounts: CsvOperatorRemediationSeverityCounts;
  warningCodes: readonly CsvOperatorReadinessWarningCode[];
  sourceCodes: readonly CsvOperatorRemediationSourceCode[];
  entities: readonly CsvContractDriftEntityStatus[];
  sourceFingerprints: readonly CsvContractDriftSourceFingerprint[];
  fingerprint: string;
  read: CsvContractDriftReadFlags;
  write: CsvContractDriftWriteFlags;
};

export type CsvContractDriftRollup = {
  entityCount: number;
  operationCount: number;
  sourceCount: number;
  issueCount: number;
  remediationCount: number;
  statusCounts: CsvContractDriftStatusCounts;
  readinessStatusCounts: CsvOperatorReadinessStatusCounts;
  qaStatusCounts: CsvContractQaStatusCounts;
  remediationStatusCounts: CsvOperatorRemediationStatusCounts;
  issueCounts: CsvContractQaIssueCounts;
  severityCounts: CsvOperatorRemediationSeverityCounts;
  warningCodes: readonly CsvOperatorReadinessWarningCode[];
  sourceCodes: readonly CsvOperatorRemediationSourceCode[];
};

export type CsvContractDriftSnapshots = {
  contentType: typeof CSV_CONTRACT_DRIFT_SNAPSHOT_CONTENT_TYPE;
  snapshotVersion: 1;
  status: CsvContractDriftSnapshotStatus;
  entityCount: number;
  operationCount: number;
  sourceCount: number;
  fingerprint: string;
  sourceFingerprints: readonly CsvContractDriftSourceFingerprint[];
  entries: readonly CsvContractDriftEntitySnapshot[];
  operations: readonly CsvContractDriftOperationSnapshot[];
  rollup: CsvContractDriftRollup;
  source: {
    fieldCoverageContentType: typeof CSV_FIELD_COVERAGE_SUMMARY_CONTENT_TYPE;
    handoffIndexContentType: typeof CSV_HANDOFF_INDEX_CONTENT_TYPE;
    operatorReadinessContentType: typeof CSV_OPERATOR_READINESS_SCORECARD_CONTENT_TYPE;
    contractQaContentType: typeof CSV_CONTRACT_QA_CHECKS_CONTENT_TYPE;
    operatorRemediationContentType: typeof CSV_OPERATOR_REMEDIATION_RUNBOOK_CONTENT_TYPE;
  };
  read: CsvContractDriftReadFlags;
  write: CsvContractDriftWriteFlags;
};

type ReadFlagInput = {
  metadata: true;
  database: boolean;
  csvInput: boolean;
  csvOutput: boolean;
};

function noWrites(): CsvContractDriftWriteFlags {
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

function metadataOnlyReads(): CsvContractDriftReadFlags {
  return {
    metadata: true,
    database: false,
    csvInput: false,
    csvOutput: false
  };
}

function combineReads(
  reads: readonly ReadFlagInput[]
): CsvContractDriftReadFlags {
  return {
    metadata: true,
    database: reads.some((read) => read.database),
    csvInput: reads.some((read) => read.csvInput),
    csvOutput: reads.some((read) => read.csvOutput)
  };
}

function emptyStatusCounts(): CsvContractDriftStatusCounts {
  return {
    stable: 0,
    watch: 0,
    blocked: 0
  };
}

function emptyReadinessStatusCounts(): CsvOperatorReadinessStatusCounts {
  return {
    ready: 0,
    "needs-review": 0,
    blocked: 0
  };
}

function emptyQaStatusCounts(): CsvContractQaStatusCounts {
  return {
    pass: 0,
    warn: 0,
    fail: 0
  };
}

function emptyRemediationStatusCounts(): CsvOperatorRemediationStatusCounts {
  return {
    ready: 0,
    "needs-action": 0,
    blocked: 0
  };
}

function emptyIssueCounts(): CsvContractQaIssueCounts {
  return {
    "inconsistent-headers": 0,
    "missing-handoff-surface": 0,
    "unsupported-operation-gap": 0,
    "read-flag-drift": 0,
    "no-write-flag-drift": 0
  };
}

function emptySeverityCounts(): CsvOperatorRemediationSeverityCounts {
  return {
    info: 0,
    warning: 0,
    error: 0
  };
}

function addIssueCounts(
  left: CsvContractQaIssueCounts,
  right: CsvContractQaIssueCounts
): CsvContractQaIssueCounts {
  return {
    "inconsistent-headers":
      left["inconsistent-headers"] + right["inconsistent-headers"],
    "missing-handoff-surface":
      left["missing-handoff-surface"] + right["missing-handoff-surface"],
    "unsupported-operation-gap":
      left["unsupported-operation-gap"] + right["unsupported-operation-gap"],
    "read-flag-drift": left["read-flag-drift"] + right["read-flag-drift"],
    "no-write-flag-drift":
      left["no-write-flag-drift"] + right["no-write-flag-drift"]
  };
}

function countStatuses(
  snapshots: readonly { status: CsvContractDriftSnapshotStatus }[]
): CsvContractDriftStatusCounts {
  const counts = emptyStatusCounts();

  for (const snapshot of snapshots) {
    counts[snapshot.status] += 1;
  }

  return counts;
}

function countReadinessStatuses(
  scorecards: readonly { status: CsvOperatorReadinessStatus }[]
): CsvOperatorReadinessStatusCounts {
  const counts = emptyReadinessStatusCounts();

  for (const scorecard of scorecards) {
    counts[scorecard.status] += 1;
  }

  return counts;
}

function countQaStatuses(
  checks: readonly { status: CsvContractQaStatus }[]
): CsvContractQaStatusCounts {
  const counts = emptyQaStatusCounts();

  for (const check of checks) {
    counts[check.status] += 1;
  }

  return counts;
}

function countRemediationStatuses(
  runbooks: readonly { status: CsvOperatorRemediationStatus }[]
): CsvOperatorRemediationStatusCounts {
  const counts = emptyRemediationStatusCounts();

  for (const runbook of runbooks) {
    counts[runbook.status] += 1;
  }

  return counts;
}

function countRemediationSeverities(
  runbooks: readonly CsvOperatorRemediationOperationRunbook[]
): CsvOperatorRemediationSeverityCounts {
  const counts = emptySeverityCounts();

  for (const runbook of runbooks) {
    counts[runbook.severity] += 1;
  }

  return counts;
}

function statusFromSources(input: {
  readinessStatus: CsvOperatorReadinessStatus;
  qaStatus: CsvContractQaStatus;
  remediationStatus: CsvOperatorRemediationStatus;
}): CsvContractDriftSnapshotStatus {
  if (
    input.readinessStatus === "blocked" ||
    input.qaStatus === "fail" ||
    input.remediationStatus === "blocked"
  ) {
    return "blocked";
  }

  if (
    input.readinessStatus === "needs-review" ||
    input.qaStatus === "warn" ||
    input.remediationStatus === "needs-action"
  ) {
    return "watch";
  }

  return "stable";
}

function statusFromCounts(
  counts: CsvContractDriftStatusCounts
): CsvContractDriftSnapshotStatus {
  if (counts.blocked > 0) {
    return "blocked";
  }

  return counts.watch > 0 ? "watch" : "stable";
}

function uniqueValues<T extends string>(values: readonly T[]): T[] {
  const seen = new Set<T>();
  const result: T[] = [];

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

function buildSourceFingerprint(input: {
  source: CsvContractDriftSnapshotSource;
  scope: CsvContractDriftSnapshotScope;
  entity?: CsvContractDriftSnapshotEntity;
  operation?: CsvContractDriftSnapshotOperation;
  contentType: string;
  payload: unknown;
}): CsvContractDriftSourceFingerprint {
  const serialized = stableSerialize(input.payload);

  return {
    source: input.source,
    scope: input.scope,
    entity: input.entity ?? null,
    operation: input.operation ?? null,
    contentType: input.contentType,
    algorithm: "sha256",
    fingerprint: createHash("sha256").update(serialized).digest("hex"),
    payloadBytes: Buffer.byteLength(serialized, "utf8")
  };
}

function rootSourceFingerprints(input: {
  fieldCoverage: CsvFieldCoverageSummary;
  handoffIndex: CsvHandoffIndex;
  operatorReadiness: ReturnType<typeof getCsvOperatorReadinessScorecards>;
  contractQa: ReturnType<typeof getCsvContractQaChecks>;
  operatorRemediation: ReturnType<typeof getCsvOperatorRemediationRunbooks>;
}): CsvContractDriftSourceFingerprint[] {
  return [
    buildSourceFingerprint({
      source: "field-coverage-summary",
      scope: "all",
      contentType: input.fieldCoverage.contentType,
      payload: input.fieldCoverage
    }),
    buildSourceFingerprint({
      source: "handoff-index",
      scope: "all",
      contentType: input.handoffIndex.contentType,
      payload: input.handoffIndex
    }),
    buildSourceFingerprint({
      source: "operator-readiness-scorecards",
      scope: "all",
      contentType: input.operatorReadiness.contentType,
      payload: input.operatorReadiness
    }),
    buildSourceFingerprint({
      source: "contract-qa-checks",
      scope: "all",
      contentType: input.contractQa.contentType,
      payload: input.contractQa
    }),
    buildSourceFingerprint({
      source: "operator-remediation-runbooks",
      scope: "all",
      contentType: input.operatorRemediation.contentType,
      payload: input.operatorRemediation
    })
  ];
}

function entitySourceFingerprints(input: {
  entity: CsvContractDriftSnapshotEntity;
  fieldCoverage: CsvFieldCoverageEntitySummary;
  handoffIndex: CsvHandoffIndexEntry;
  operatorReadiness: CsvOperatorReadinessEntityScorecard;
  contractQa: CsvContractQaEntityCheck;
  operatorRemediation: CsvOperatorRemediationEntityRunbook;
}): CsvContractDriftSourceFingerprint[] {
  return [
    buildSourceFingerprint({
      source: "field-coverage-summary",
      scope: "entity",
      entity: input.entity,
      contentType: input.fieldCoverage.contentType,
      payload: input.fieldCoverage
    }),
    buildSourceFingerprint({
      source: "handoff-index",
      scope: "entity",
      entity: input.entity,
      contentType: CSV_HANDOFF_INDEX_CONTENT_TYPE,
      payload: input.handoffIndex
    }),
    buildSourceFingerprint({
      source: "operator-readiness-scorecards",
      scope: "entity",
      entity: input.entity,
      contentType: CSV_OPERATOR_READINESS_SCORECARD_CONTENT_TYPE,
      payload: input.operatorReadiness
    }),
    buildSourceFingerprint({
      source: "contract-qa-checks",
      scope: "entity",
      entity: input.entity,
      contentType: CSV_CONTRACT_QA_CHECKS_CONTENT_TYPE,
      payload: input.contractQa
    }),
    buildSourceFingerprint({
      source: "operator-remediation-runbooks",
      scope: "entity",
      entity: input.entity,
      contentType: CSV_OPERATOR_REMEDIATION_RUNBOOK_CONTENT_TYPE,
      payload: input.operatorRemediation
    })
  ];
}

function operationSourceFingerprints(input: {
  operation: CsvContractDriftSnapshotOperation;
  fieldCoverage: readonly CsvFieldCoverageEntityOperation[];
  handoffIndex: CsvHandoffIndex;
  operatorReadiness: readonly CsvOperatorReadinessOperationScorecard[];
  contractQa: readonly CsvContractQaOperationCheck[];
  operatorRemediation: readonly CsvOperatorRemediationOperationRunbook[];
}): CsvContractDriftSourceFingerprint[] {
  return [
    buildSourceFingerprint({
      source: "field-coverage-summary",
      scope: "operation",
      operation: input.operation,
      contentType: CSV_FIELD_COVERAGE_SUMMARY_CONTENT_TYPE,
      payload: input.fieldCoverage
    }),
    buildSourceFingerprint({
      source: "handoff-index",
      scope: "operation",
      operation: input.operation,
      contentType: input.handoffIndex.contentType,
      payload: input.handoffIndex
    }),
    buildSourceFingerprint({
      source: "operator-readiness-scorecards",
      scope: "operation",
      operation: input.operation,
      contentType: CSV_OPERATOR_READINESS_SCORECARD_CONTENT_TYPE,
      payload: input.operatorReadiness
    }),
    buildSourceFingerprint({
      source: "contract-qa-checks",
      scope: "operation",
      operation: input.operation,
      contentType: CSV_CONTRACT_QA_CHECKS_CONTENT_TYPE,
      payload: input.contractQa
    }),
    buildSourceFingerprint({
      source: "operator-remediation-runbooks",
      scope: "operation",
      operation: input.operation,
      contentType: CSV_OPERATOR_REMEDIATION_RUNBOOK_CONTENT_TYPE,
      payload: input.operatorRemediation
    })
  ];
}

function findContractQaOperation(
  operation: CsvContractDriftSnapshotOperation,
  checks: readonly CsvContractQaOperationCheck[]
): CsvContractQaOperationCheck {
  const check = checks.find((candidate) => candidate.operation === operation);

  if (check === undefined) {
    throw new Error(`Missing CSV drift QA operation ${operation}`);
  }

  return check;
}

function findRemediationOperation(
  operation: CsvContractDriftSnapshotOperation,
  runbooks: readonly CsvOperatorRemediationOperationRunbook[]
): CsvOperatorRemediationOperationRunbook {
  const runbook = runbooks.find((candidate) => candidate.operation === operation);

  if (runbook === undefined) {
    throw new Error(`Missing CSV drift remediation operation ${operation}`);
  }

  return runbook;
}

function buildOperationStatus(input: {
  readiness: CsvOperatorReadinessOperationScorecard;
  qa: CsvContractQaOperationCheck;
  remediation: CsvOperatorRemediationOperationRunbook;
}): CsvContractDriftOperationStatus {
  return {
    operation: input.readiness.operation,
    status: statusFromSources({
      readinessStatus: input.readiness.status,
      qaStatus: input.qa.status,
      remediationStatus: input.remediation.status
    }),
    supported: input.readiness.supported,
    readinessStatus: input.readiness.status,
    qaStatus: input.qa.status,
    remediationStatus: input.remediation.status,
    issueCount: input.qa.issueCount,
    remediationCount: input.remediation.remediationCount,
    warningCodes: input.readiness.warningCodes,
    sourceCodes: input.remediation.sourceCodes
  };
}

function buildEntityStatus(input: {
  readiness: CsvOperatorReadinessEntityScorecard;
  qa: CsvContractQaEntityCheck;
  remediation: CsvOperatorRemediationEntityRunbook;
}): CsvContractDriftEntityStatus {
  return {
    entity: input.readiness.entity,
    label: input.readiness.label,
    route: input.readiness.route,
    status: statusFromSources({
      readinessStatus: input.readiness.status,
      qaStatus: input.qa.status,
      remediationStatus: input.remediation.status
    }),
    readinessStatus: input.readiness.status,
    qaStatus: input.qa.status,
    remediationStatus: input.remediation.status,
    issueCount: input.qa.issueCount,
    remediationCount: input.remediation.remediationCount
  };
}

function buildEntitySnapshot(
  entity: CsvContractDriftSnapshotEntity
): CsvContractDriftEntitySnapshot {
  const fieldCoverage = getCsvFieldCoverageEntitySummary(entity);
  const handoffIndex = getCsvHandoffIndexEntry(entity);
  const operatorReadiness = getCsvOperatorReadinessScorecard(entity);
  const contractQa = getCsvContractQaEntityCheck(entity);
  const operatorRemediation = getCsvOperatorRemediationRunbook(entity);

  if (
    fieldCoverage === null ||
    handoffIndex === null ||
    operatorReadiness === null ||
    contractQa === null ||
    operatorRemediation === null
  ) {
    throw new Error(`Missing CSV contract drift source for ${entity}`);
  }

  const operations = operatorReadiness.operations.map((operation) =>
    buildOperationStatus({
      readiness: operation,
      qa: findContractQaOperation(operation.operation, contractQa.operations),
      remediation: findRemediationOperation(
        operation.operation,
        operatorRemediation.operations
      )
    })
  );
  const sourceFingerprints = entitySourceFingerprints({
    entity,
    fieldCoverage,
    handoffIndex,
    operatorReadiness,
    contractQa,
    operatorRemediation
  });
  const status = statusFromSources({
    readinessStatus: operatorReadiness.status,
    qaStatus: contractQa.status,
    remediationStatus: operatorRemediation.status
  });
  const snapshot = {
    entity,
    status,
    operations,
    sourceFingerprints
  };

  return {
    entity,
    label: operatorReadiness.label,
    route: operatorReadiness.route,
    direction: operatorReadiness.direction,
    status,
    operationCount: operations.length,
    issueCount: contractQa.issueCount,
    remediationCount: operatorRemediation.remediationCount,
    readinessStatus: operatorReadiness.status,
    qaStatus: contractQa.status,
    remediationStatus: operatorRemediation.status,
    statusCounts: countStatuses(operations),
    readinessStatusCounts: operatorReadiness.statusCounts,
    qaStatusCounts: contractQa.statusCounts,
    remediationStatusCounts: operatorRemediation.statusCounts,
    issueCounts: contractQa.issueCounts,
    severityCounts: operatorRemediation.severityCounts,
    warningCodes: operatorReadiness.warningCodes,
    sourceCodes: operatorRemediation.sourceCodes,
    operations,
    sourceFingerprints,
    fingerprint: digestPayload(snapshot),
    read: combineReads([
      fieldCoverage.read,
      handoffIndex.read,
      operatorReadiness.read,
      contractQa.read,
      operatorRemediation.read
    ]),
    write: noWrites()
  };
}

function buildOperationSnapshot(
  operation: CsvCapabilityOperation
): CsvContractDriftOperationSnapshot {
  const fieldCoverage = listCsvFieldCoverageOperationSummaries(operation);
  const handoffIndex = getCsvHandoffIndex();
  const operatorReadiness =
    listCsvOperatorReadinessOperationScorecards(operation);
  const contractQa = listCsvContractQaOperationChecks(operation);
  const operatorRemediation =
    listCsvOperatorRemediationOperationRunbooks(operation);
  const entities = operatorReadiness.map((readiness) => {
    const qa = contractQa.find(
      (candidate) => candidate.entity === readiness.entity
    );
    const remediation = operatorRemediation.find(
      (candidate) => candidate.entity === readiness.entity
    );

    if (qa === undefined || remediation === undefined) {
      throw new Error(`Missing CSV operation drift source for ${operation}`);
    }

    return buildEntityStatus({
      readiness: {
        entity: readiness.entity,
        label: readiness.label,
        route: readiness.route,
        direction: "bidirectional",
        status: readiness.status,
        operationCount: 1,
        statusCounts: countReadinessStatuses([readiness]),
        operations: [readiness],
        warningCodes: readiness.warningCodes,
        read: readiness.read,
        write: readiness.write
      },
      qa: {
        entity: qa.entity,
        label: qa.label,
        route: qa.route,
        direction: "bidirectional",
        status: qa.status,
        operationCount: 1,
        issueCount: qa.issueCount,
        statusCounts: countQaStatuses([qa]),
        issueCounts: qa.issueCounts,
        operations: [qa],
        read: qa.read,
        write: qa.write
      },
      remediation: {
        entity: remediation.entity,
        label: remediation.label,
        route: remediation.route,
        status: remediation.status,
        severity: remediation.severity,
        operationCount: 1,
        remediationCount: remediation.remediationCount,
        statusCounts: countRemediationStatuses([remediation]),
        severityCounts: countRemediationSeverities([remediation]),
        sourceCodes: remediation.sourceCodes,
        operations: [remediation],
        read: remediation.read,
        write: remediation.write
      }
    });
  });
  const sourceFingerprints = operationSourceFingerprints({
    operation,
    fieldCoverage,
    handoffIndex,
    operatorReadiness,
    contractQa,
    operatorRemediation
  });
  const statusCounts = countStatuses(entities);
  const issueCounts = contractQa.reduce(
    (current, qa) => addIssueCounts(current, qa.issueCounts),
    emptyIssueCounts()
  );
  const snapshot = {
    operation,
    entities,
    sourceFingerprints
  };

  return {
    operation,
    status: statusFromCounts(statusCounts),
    entityCount: entities.length,
    issueCount: contractQa.reduce((current, qa) => current + qa.issueCount, 0),
    remediationCount: operatorRemediation.reduce(
      (current, remediation) => current + remediation.remediationCount,
      0
    ),
    statusCounts,
    readinessStatusCounts: countReadinessStatuses(operatorReadiness),
    qaStatusCounts: countQaStatuses(contractQa),
    remediationStatusCounts: countRemediationStatuses(operatorRemediation),
    issueCounts,
    severityCounts: countRemediationSeverities(operatorRemediation),
    warningCodes: uniqueValues(
      operatorReadiness.flatMap((readiness) => readiness.warningCodes)
    ),
    sourceCodes: uniqueValues(
      operatorRemediation.flatMap((remediation) => remediation.sourceCodes)
    ),
    entities,
    sourceFingerprints,
    fingerprint: digestPayload(snapshot),
    read: combineReads([
      ...fieldCoverage.map((summary) => summary.read),
      ...operatorReadiness.map((scorecard) => scorecard.read),
      ...contractQa.map((check) => check.read),
      ...operatorRemediation.map((runbook) => runbook.read)
    ]),
    write: noWrites()
  };
}

export function isCsvContractDriftSnapshotEntity(
  value: string
): value is CsvContractDriftSnapshotEntity {
  return isCsvOperatorReadinessEntity(value);
}

export function listCsvContractDriftSnapshotEntities(): CsvContractDriftSnapshotEntity[] {
  return listCsvOperatorReadinessEntities();
}

export function isCsvContractDriftSnapshotOperation(
  value: string
): value is CsvContractDriftSnapshotOperation {
  return CSV_CAPABILITY_OPERATIONS.some((operation) => operation === value);
}

export function getCsvContractDriftEntitySnapshot(
  entity: string
): CsvContractDriftEntitySnapshot | null {
  if (!isCsvContractDriftSnapshotEntity(entity)) {
    return null;
  }

  return buildEntitySnapshot(entity);
}

export function listCsvContractDriftEntitySnapshots(): CsvContractDriftEntitySnapshot[] {
  return listCsvContractDriftSnapshotEntities().map(buildEntitySnapshot);
}

export function getCsvContractDriftOperationSnapshot(
  operation: string
): CsvContractDriftOperationSnapshot | null {
  if (!isCsvContractDriftSnapshotOperation(operation)) {
    return null;
  }

  return buildOperationSnapshot(operation);
}

export function listCsvContractDriftOperationSnapshots(): CsvContractDriftOperationSnapshot[] {
  return CSV_CAPABILITY_OPERATIONS.map(buildOperationSnapshot);
}

export function getCsvContractDriftSnapshots(): CsvContractDriftSnapshots {
  const fieldCoverage = getCsvFieldCoverageSummary();
  const handoffIndex = getCsvHandoffIndex();
  const operatorReadiness = getCsvOperatorReadinessScorecards();
  const contractQa = getCsvContractQaChecks();
  const operatorRemediation = getCsvOperatorRemediationRunbooks();
  const entries = listCsvContractDriftEntitySnapshots();
  const operations = listCsvContractDriftOperationSnapshots();
  const sourceFingerprints = rootSourceFingerprints({
    fieldCoverage,
    handoffIndex,
    operatorReadiness,
    contractQa,
    operatorRemediation
  });
  const statusCounts = countStatuses(entries);
  const rollup = {
    entityCount: entries.length,
    operationCount: operations.length,
    sourceCount: sourceFingerprints.length,
    issueCount: contractQa.issueCount,
    remediationCount: operatorRemediation.remediationCount,
    statusCounts,
    readinessStatusCounts: operatorReadiness.statusCounts,
    qaStatusCounts: contractQa.statusCounts,
    remediationStatusCounts: operatorRemediation.statusCounts,
    issueCounts: contractQa.issueCounts,
    severityCounts: operatorRemediation.severityCounts,
    warningCodes: uniqueValues(
      operatorReadiness.entries.flatMap((entry) => entry.warningCodes)
    ),
    sourceCodes: operatorRemediation.sourceCodes
  };

  return {
    contentType: CSV_CONTRACT_DRIFT_SNAPSHOT_CONTENT_TYPE,
    snapshotVersion: 1,
    status: statusFromCounts(statusCounts),
    entityCount: entries.length,
    operationCount: operations.length,
    sourceCount: sourceFingerprints.length,
    fingerprint: digestPayload({
      sourceFingerprints,
      entries: entries.map((entry) => ({
        entity: entry.entity,
        status: entry.status,
        fingerprint: entry.fingerprint
      })),
      operations: operations.map((operation) => ({
        operation: operation.operation,
        status: operation.status,
        fingerprint: operation.fingerprint
      }))
    }),
    sourceFingerprints,
    entries,
    operations,
    rollup,
    source: {
      fieldCoverageContentType: fieldCoverage.contentType,
      handoffIndexContentType: handoffIndex.contentType,
      operatorReadinessContentType: operatorReadiness.contentType,
      contractQaContentType: contractQa.contentType,
      operatorRemediationContentType: operatorRemediation.contentType
    },
    read: metadataOnlyReads(),
    write: noWrites()
  };
}
