import {
  CSV_CAPABILITY_OPERATIONS,
  type CsvCapabilityOperation
} from "@/lib/server/csvCapabilities";
import {
  CSV_FIELD_COVERAGE_SUMMARY_CONTENT_TYPE,
  getCsvFieldCoverageEntitySummary,
  type CsvFieldCoverageEntityOperation,
  type CsvFieldCoverageEntitySummary
} from "@/lib/server/csvFieldCoverageSummaries";
import {
  getCsvHandoffIndex,
  getCsvHandoffIndexEntry,
  type CsvHandoffIndexEntry,
  type CsvHandoffIndexSurface,
  type CsvHandoffSurfaceKind
} from "@/lib/server/csvHandoffIndex";
import {
  CSV_OPERATOR_READINESS_SCORECARD_CONTENT_TYPE,
  getCsvOperatorReadinessScorecard,
  getCsvOperatorReadinessScorecards,
  isCsvOperatorReadinessEntity,
  listCsvOperatorReadinessEntities,
  listCsvOperatorReadinessScorecards,
  type CsvOperatorReadinessEntity,
  type CsvOperatorReadinessEntityScorecard,
  type CsvOperatorReadinessOperation,
  type CsvOperatorReadinessOperationScorecard,
  type CsvOperatorReadinessReadFlags
} from "@/lib/server/csvOperatorReadinessScorecards";

export const CSV_CONTRACT_QA_CHECKS_CONTENT_TYPE =
  "application/json; charset=utf-8" as const;

export type CsvContractQaEntity = CsvOperatorReadinessEntity;
export type CsvContractQaOperation = CsvOperatorReadinessOperation;
export type CsvContractQaStatus = "pass" | "warn" | "fail";
export type CsvContractQaSeverity = "warning" | "error";
export type CsvContractQaIssueCode =
  | "inconsistent-headers"
  | "missing-handoff-surface"
  | "unsupported-operation-gap"
  | "read-flag-drift"
  | "no-write-flag-drift";

export type CsvContractQaStatusCounts = {
  pass: number;
  warn: number;
  fail: number;
};

export type CsvContractQaIssueCounts = {
  "inconsistent-headers": number;
  "missing-handoff-surface": number;
  "unsupported-operation-gap": number;
  "read-flag-drift": number;
  "no-write-flag-drift": number;
};

export type CsvContractQaReadFlags = {
  metadata: true;
  database: boolean;
  csvInput: boolean;
  csvOutput: boolean;
};

export type CsvContractQaWriteFlags = {
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

export type CsvContractQaIssue = {
  code: CsvContractQaIssueCode;
  severity: CsvContractQaSeverity;
  entity: CsvContractQaEntity;
  operation: CsvContractQaOperation;
  message: string;
  surfaceKind: CsvHandoffSurfaceKind | null;
  missingSurfaceKinds: readonly CsvHandoffSurfaceKind[];
  expectedHeaders: readonly string[];
  actualHeaders: readonly string[];
  expectedRead: CsvContractQaReadFlags | null;
  actualRead: CsvContractQaReadFlags | null;
  driftSources: readonly string[];
};

export type CsvContractQaOperationCheck = {
  entity: CsvContractQaEntity;
  label: string;
  route: string | null;
  operation: CsvContractQaOperation;
  status: CsvContractQaStatus;
  supported: boolean;
  issueCount: number;
  issueCounts: CsvContractQaIssueCounts;
  issues: readonly CsvContractQaIssue[];
  expectedSurfaceKinds: readonly CsvHandoffSurfaceKind[];
  presentSurfaceKinds: readonly CsvHandoffSurfaceKind[];
  missingSurfaceKinds: readonly CsvHandoffSurfaceKind[];
  checkedHeaderSurfaceKinds: readonly CsvHandoffSurfaceKind[];
  read: CsvContractQaReadFlags;
  write: CsvContractQaWriteFlags;
};

export type CsvContractQaEntityCheck = {
  entity: CsvContractQaEntity;
  label: string;
  route: string | null;
  direction: CsvFieldCoverageEntitySummary["direction"];
  status: CsvContractQaStatus;
  operationCount: number;
  issueCount: number;
  statusCounts: CsvContractQaStatusCounts;
  issueCounts: CsvContractQaIssueCounts;
  operations: readonly CsvContractQaOperationCheck[];
  read: CsvContractQaReadFlags;
  write: CsvContractQaWriteFlags;
};

export type CsvContractQaOperationAggregate = {
  operation: CsvContractQaOperation;
  entityCount: number;
  passEntityCount: number;
  warnEntityCount: number;
  failEntityCount: number;
  issueCount: number;
  statusCounts: CsvContractQaStatusCounts;
  issueCounts: CsvContractQaIssueCounts;
  read: CsvContractQaReadFlags;
  write: CsvContractQaWriteFlags;
};

export type CsvContractQaChecks = {
  contentType: typeof CSV_CONTRACT_QA_CHECKS_CONTENT_TYPE;
  entityCount: number;
  operationCount: number;
  checkCount: number;
  issueCount: number;
  status: CsvContractQaStatus;
  statusCounts: CsvContractQaStatusCounts;
  issueCounts: CsvContractQaIssueCounts;
  entries: readonly CsvContractQaEntityCheck[];
  operations: readonly CsvContractQaOperationAggregate[];
  source: {
    operatorReadinessContentType: typeof CSV_OPERATOR_READINESS_SCORECARD_CONTENT_TYPE;
    handoffIndexContentType: ReturnType<typeof getCsvHandoffIndex>["contentType"];
    fieldCoverageContentType: CsvFieldCoverageEntitySummary["contentType"];
  };
  read: CsvContractQaReadFlags;
  write: CsvContractQaWriteFlags;
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

const expectedReadByOperation: Record<
  CsvContractQaOperation,
  CsvContractQaReadFlags
> = {
  export: {
    metadata: true,
    database: true,
    csvInput: false,
    csvOutput: true
  },
  "import-preview": {
    metadata: true,
    database: false,
    csvInput: true,
    csvOutput: false
  },
  "import-template": {
    metadata: true,
    database: false,
    csvInput: false,
    csvOutput: true
  },
  "import-preflight": {
    metadata: true,
    database: true,
    csvInput: true,
    csvOutput: false
  }
};

function noWrites(): CsvContractQaWriteFlags {
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

function metadataOnlyReads(): CsvContractQaReadFlags {
  return {
    metadata: true,
    database: false,
    csvInput: false,
    csvOutput: false
  };
}

function emptyStatusCounts(): CsvContractQaStatusCounts {
  return {
    pass: 0,
    warn: 0,
    fail: 0
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

function issueCounts(issues: readonly CsvContractQaIssue[]): CsvContractQaIssueCounts {
  const counts = emptyIssueCounts();

  for (const issue of issues) {
    counts[issue.code] += 1;
  }

  return counts;
}

function countStatuses(
  checks: readonly { status: CsvContractQaStatus }[]
): CsvContractQaStatusCounts {
  const counts = emptyStatusCounts();

  for (const check of checks) {
    counts[check.status] += 1;
  }

  return counts;
}

function statusFromIssues(
  issues: readonly CsvContractQaIssue[]
): CsvContractQaStatus {
  if (issues.some((issue) => issue.severity === "error")) {
    return "fail";
  }

  return issues.length > 0 ? "warn" : "pass";
}

function statusFromStatusCounts(
  counts: CsvContractQaStatusCounts
): CsvContractQaStatus {
  if (counts.fail > 0) {
    return "fail";
  }

  return counts.warn > 0 ? "warn" : "pass";
}

function readFromOperatorReadiness(
  read: CsvOperatorReadinessReadFlags
): CsvContractQaReadFlags {
  return {
    metadata: true,
    database: read.database,
    csvInput: read.csvInput,
    csvOutput: read.csvOutput
  };
}

function combineReads(
  reads: readonly CsvContractQaReadFlags[]
): CsvContractQaReadFlags {
  return {
    metadata: true,
    database: reads.some((read) => read.database),
    csvInput: reads.some((read) => read.csvInput),
    csvOutput: reads.some((read) => read.csvOutput)
  };
}

function readFlagsEqual(
  left: CsvContractQaReadFlags,
  right: CsvContractQaReadFlags
): boolean {
  return (
    left.metadata === right.metadata &&
    left.database === right.database &&
    left.csvInput === right.csvInput &&
    left.csvOutput === right.csvOutput
  );
}

function headersEqual(
  left: readonly string[],
  right: readonly string[]
): boolean {
  return (
    left.length === right.length &&
    left.every((header, index) => header === right[index])
  );
}

function hasWriteDrift(write: WriteFlagInput): boolean {
  return (
    write.database ||
    (write.files ?? false) ||
    write.externalServices ||
    (write.exportHistory ?? false) ||
    (write.scheduledDelivery ?? false) ||
    (write.backgroundJobs ?? false) ||
    (write.routingAssignments ?? false) ||
    (write.importApply ?? false) ||
    (write.bulkMutations ?? false) ||
    (write.headerRemapping ?? false) ||
    (write.salesforceSync ?? false)
  );
}

function writeDriftSources(
  sources: readonly { source: string; write: WriteFlagInput }[]
): string[] {
  return sources
    .filter((source) => hasWriteDrift(source.write))
    .map((source) => source.source);
}

function associatedSurfaces(
  operation: CsvOperatorReadinessOperationScorecard,
  handoff: CsvHandoffIndexEntry
): CsvHandoffIndexSurface[] {
  return handoff.surfaces.filter((surface) =>
    operation.presentSurfaceKinds.includes(surface.kind)
  );
}

function checkedHeaderSurfaces(
  operation: CsvOperatorReadinessOperationScorecard,
  surfaces: readonly CsvHandoffIndexSurface[]
): CsvHandoffIndexSurface[] {
  if (!operation.supported) {
    return [];
  }

  return surfaces.filter((surface) => surface.canonicalHeaders.length > 0);
}

function buildIssue(input: {
  code: CsvContractQaIssueCode;
  severity: CsvContractQaSeverity;
  entity: CsvContractQaEntity;
  operation: CsvContractQaOperation;
  message: string;
  surfaceKind?: CsvHandoffSurfaceKind | null;
  missingSurfaceKinds?: readonly CsvHandoffSurfaceKind[];
  expectedHeaders?: readonly string[];
  actualHeaders?: readonly string[];
  expectedRead?: CsvContractQaReadFlags | null;
  actualRead?: CsvContractQaReadFlags | null;
  driftSources?: readonly string[];
}): CsvContractQaIssue {
  return {
    code: input.code,
    severity: input.severity,
    entity: input.entity,
    operation: input.operation,
    message: input.message,
    surfaceKind: input.surfaceKind ?? null,
    missingSurfaceKinds: input.missingSurfaceKinds ?? [],
    expectedHeaders: input.expectedHeaders ?? [],
    actualHeaders: input.actualHeaders ?? [],
    expectedRead: input.expectedRead ?? null,
    actualRead: input.actualRead ?? null,
    driftSources: input.driftSources ?? []
  };
}

function headerIssues(input: {
  operation: CsvOperatorReadinessOperationScorecard;
  coverage: CsvFieldCoverageEntityOperation;
  surfaces: readonly CsvHandoffIndexSurface[];
}): CsvContractQaIssue[] {
  return checkedHeaderSurfaces(input.operation, input.surfaces)
    .filter(
      (surface) => !headersEqual(input.coverage.headers, surface.canonicalHeaders)
    )
    .map((surface) =>
      buildIssue({
        code: "inconsistent-headers",
        severity: "error",
        entity: input.operation.entity,
        operation: input.operation.operation,
        message: `${input.operation.label} ${input.operation.operation} surface ${surface.kind} has headers that drift from the field coverage contract.`,
        surfaceKind: surface.kind,
        expectedHeaders: input.coverage.headers,
        actualHeaders: surface.canonicalHeaders
      })
    );
}

function missingSurfaceIssue(
  operation: CsvOperatorReadinessOperationScorecard
): CsvContractQaIssue | null {
  if (operation.missingSurfaceKinds.length === 0) {
    return null;
  }

  return buildIssue({
    code: "missing-handoff-surface",
    severity: operation.supported ? "error" : "warning",
    entity: operation.entity,
    operation: operation.operation,
    message: `${operation.label} ${operation.operation} is missing one or more expected CSV handoff surfaces.`,
    missingSurfaceKinds: operation.missingSurfaceKinds
  });
}

function unsupportedOperationIssue(
  operation: CsvOperatorReadinessOperationScorecard
): CsvContractQaIssue | null {
  if (operation.supported) {
    return null;
  }

  return buildIssue({
    code: "unsupported-operation-gap",
    severity: "warning",
    entity: operation.entity,
    operation: operation.operation,
    message: `${operation.label} does not support ${operation.operation} in the current CSV contract.`,
    missingSurfaceKinds: operation.missingSurfaceKinds
  });
}

function readDriftIssue(
  operation: CsvOperatorReadinessOperationScorecard,
  actualRead: CsvContractQaReadFlags
): CsvContractQaIssue | null {
  if (!operation.supported) {
    return null;
  }

  const expectedRead = expectedReadByOperation[operation.operation];

  if (readFlagsEqual(expectedRead, actualRead)) {
    return null;
  }

  return buildIssue({
    code: "read-flag-drift",
    severity: "error",
    entity: operation.entity,
    operation: operation.operation,
    message: `${operation.label} ${operation.operation} read flags drift from the expected metadata contract.`,
    expectedRead,
    actualRead
  });
}

function noWriteDriftIssue(input: {
  operation: CsvOperatorReadinessOperationScorecard;
  coverage: CsvFieldCoverageEntityOperation;
  entityCoverage: CsvFieldCoverageEntitySummary;
  handoff: CsvHandoffIndexEntry;
  surfaces: readonly CsvHandoffIndexSurface[];
}): CsvContractQaIssue | null {
  const driftSources = writeDriftSources([
    {
      source: "operator-readiness-operation",
      write: input.operation.write
    },
    {
      source: "field-coverage-entity",
      write: input.entityCoverage.write
    },
    {
      source: "field-coverage-operation",
      write: input.coverage.write
    },
    {
      source: "handoff-index-entry",
      write: input.handoff.write
    },
    ...input.surfaces.map((surface) => ({
      source: `handoff-surface:${surface.kind}`,
      write: surface.write
    }))
  ]);

  if (driftSources.length === 0) {
    return null;
  }

  return buildIssue({
    code: "no-write-flag-drift",
    severity: "error",
    entity: input.operation.entity,
    operation: input.operation.operation,
    message: `${input.operation.label} ${input.operation.operation} has CSV no-write flag drift.`,
    driftSources
  });
}

function findCoverageOperation(
  coverage: CsvFieldCoverageEntitySummary,
  operation: CsvContractQaOperation
): CsvFieldCoverageEntityOperation {
  const coverageOperation = coverage.operations.find(
    (candidate) => candidate.operation === operation
  );

  if (coverageOperation === undefined) {
    throw new Error(`Missing CSV field coverage operation ${operation}`);
  }

  return coverageOperation;
}

function compactIssues(
  issues: readonly (CsvContractQaIssue | null)[]
): CsvContractQaIssue[] {
  return issues.filter((issue): issue is CsvContractQaIssue => issue !== null);
}

function buildOperationCheck(input: {
  operation: CsvOperatorReadinessOperationScorecard;
  coverage: CsvFieldCoverageEntityOperation;
  entityCoverage: CsvFieldCoverageEntitySummary;
  handoff: CsvHandoffIndexEntry;
}): CsvContractQaOperationCheck {
  const surfaces = associatedSurfaces(input.operation, input.handoff);
  const read = readFromOperatorReadiness(input.operation.read);
  const issues = compactIssues([
    ...headerIssues({
      operation: input.operation,
      coverage: input.coverage,
      surfaces
    }),
    missingSurfaceIssue(input.operation),
    unsupportedOperationIssue(input.operation),
    readDriftIssue(input.operation, read),
    noWriteDriftIssue({
      operation: input.operation,
      coverage: input.coverage,
      entityCoverage: input.entityCoverage,
      handoff: input.handoff,
      surfaces
    })
  ]);

  return {
    entity: input.operation.entity,
    label: input.operation.label,
    route: input.operation.route,
    operation: input.operation.operation,
    status: statusFromIssues(issues),
    supported: input.operation.supported,
    issueCount: issues.length,
    issueCounts: issueCounts(issues),
    issues,
    expectedSurfaceKinds: input.operation.expectedSurfaceKinds,
    presentSurfaceKinds: input.operation.presentSurfaceKinds,
    missingSurfaceKinds: input.operation.missingSurfaceKinds,
    checkedHeaderSurfaceKinds: checkedHeaderSurfaces(input.operation, surfaces).map(
      (surface) => surface.kind
    ),
    read,
    write: noWrites()
  };
}

function buildEntityCheck(input: {
  scorecard: CsvOperatorReadinessEntityScorecard;
  coverage: CsvFieldCoverageEntitySummary;
  handoff: CsvHandoffIndexEntry;
}): CsvContractQaEntityCheck {
  const operations = input.scorecard.operations.map((operation) =>
    buildOperationCheck({
      operation,
      coverage: findCoverageOperation(input.coverage, operation.operation),
      entityCoverage: input.coverage,
      handoff: input.handoff
    })
  );
  const statusCounts = countStatuses(operations);
  const issueCountsTotal = operations.reduce(
    (current, operation) => addIssueCounts(current, operation.issueCounts),
    emptyIssueCounts()
  );

  return {
    entity: input.scorecard.entity,
    label: input.scorecard.label,
    route: input.scorecard.route,
    direction: input.scorecard.direction,
    status: statusFromStatusCounts(statusCounts),
    operationCount: operations.length,
    issueCount: operations.reduce(
      (current, operation) => current + operation.issueCount,
      0
    ),
    statusCounts,
    issueCounts: issueCountsTotal,
    operations,
    read: combineReads(operations.map((operation) => operation.read)),
    write: noWrites()
  };
}

function buildOperationAggregate(
  operation: CsvCapabilityOperation,
  entries: readonly CsvContractQaEntityCheck[]
): CsvContractQaOperationAggregate {
  const operationChecks = entries.map((entry) => {
    const check = entry.operations.find(
      (candidate) => candidate.operation === operation
    );

    if (check === undefined) {
      throw new Error(`Missing CSV contract QA operation ${operation}`);
    }

    return check;
  });
  const statusCounts = countStatuses(operationChecks);
  const issueCountsTotal = operationChecks.reduce(
    (current, check) => addIssueCounts(current, check.issueCounts),
    emptyIssueCounts()
  );

  return {
    operation,
    entityCount: operationChecks.length,
    passEntityCount: statusCounts.pass,
    warnEntityCount: statusCounts.warn,
    failEntityCount: statusCounts.fail,
    issueCount: operationChecks.reduce(
      (current, check) => current + check.issueCount,
      0
    ),
    statusCounts,
    issueCounts: issueCountsTotal,
    read: combineReads(operationChecks.map((check) => check.read)),
    write: noWrites()
  };
}

export function isCsvContractQaEntity(
  value: string
): value is CsvContractQaEntity {
  return isCsvOperatorReadinessEntity(value);
}

export function listCsvContractQaEntities(): CsvContractQaEntity[] {
  return listCsvOperatorReadinessEntities();
}

export function getCsvContractQaEntityCheck(
  entity: string
): CsvContractQaEntityCheck | null {
  if (!isCsvContractQaEntity(entity)) {
    return null;
  }

  const scorecard = getCsvOperatorReadinessScorecard(entity);
  const coverage = getCsvFieldCoverageEntitySummary(entity);
  const handoff = getCsvHandoffIndexEntry(entity);

  if (scorecard === null || coverage === null || handoff === null) {
    return null;
  }

  return buildEntityCheck({ scorecard, coverage, handoff });
}

export function listCsvContractQaEntityChecks(): CsvContractQaEntityCheck[] {
  return listCsvOperatorReadinessScorecards().map((scorecard) => {
    const coverage = getCsvFieldCoverageEntitySummary(scorecard.entity);
    const handoff = getCsvHandoffIndexEntry(scorecard.entity);

    if (coverage === null || handoff === null) {
      throw new Error(`Missing CSV contract QA source for ${scorecard.entity}`);
    }

    return buildEntityCheck({ scorecard, coverage, handoff });
  });
}

export function listCsvContractQaOperationChecks(
  operation: CsvContractQaOperation
): CsvContractQaOperationCheck[] {
  return listCsvContractQaEntityChecks().map((entry) => {
    const check = entry.operations.find(
      (candidate) => candidate.operation === operation
    );

    if (check === undefined) {
      throw new Error(`Missing CSV contract QA operation ${operation}`);
    }

    return check;
  });
}

export function getCsvContractQaChecks(): CsvContractQaChecks {
  const entries = listCsvContractQaEntityChecks();
  const statusCounts = countStatuses(entries);
  const issueCountsTotal = entries.reduce(
    (current, entry) => addIssueCounts(current, entry.issueCounts),
    emptyIssueCounts()
  );
  const handoffIndex = getCsvHandoffIndex();
  const operatorReadiness = getCsvOperatorReadinessScorecards();

  return {
    contentType: CSV_CONTRACT_QA_CHECKS_CONTENT_TYPE,
    entityCount: entries.length,
    operationCount: CSV_CAPABILITY_OPERATIONS.length,
    checkCount: entries.reduce(
      (current, entry) => current + entry.operationCount,
      0
    ),
    issueCount: entries.reduce((current, entry) => current + entry.issueCount, 0),
    status: statusFromStatusCounts(statusCounts),
    statusCounts,
    issueCounts: issueCountsTotal,
    entries,
    operations: CSV_CAPABILITY_OPERATIONS.map((operation) =>
      buildOperationAggregate(operation, entries)
    ),
    source: {
      operatorReadinessContentType: operatorReadiness.contentType,
      handoffIndexContentType: handoffIndex.contentType,
      fieldCoverageContentType: CSV_FIELD_COVERAGE_SUMMARY_CONTENT_TYPE
    },
    read: metadataOnlyReads(),
    write: noWrites()
  };
}
