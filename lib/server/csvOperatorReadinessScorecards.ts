import {
  CSV_CAPABILITY_OPERATIONS,
  type CsvCapabilityOperation
} from "@/lib/server/csvCapabilities";
import {
  type CsvCompatibilityWarningCode
} from "@/lib/server/csvCompatibilityReports";
import {
  getCsvFieldCoverageEntitySummary,
  getCsvFieldCoverageSummary,
  isCsvFieldCoverageEntity,
  listCsvFieldCoverageEntities,
  listCsvFieldCoverageEntitySummaries,
  type CsvFieldCoverageCounts,
  type CsvFieldCoverageEntity,
  type CsvFieldCoverageEntityOperation,
  type CsvFieldCoverageEntitySummary,
  type CsvFieldCoverageReadFlags,
  type CsvFieldCoverageWriteFlags
} from "@/lib/server/csvFieldCoverageSummaries";
import {
  getCsvHandoffIndex,
  getCsvHandoffIndexEntry,
  type CsvHandoffIndexEntry,
  type CsvHandoffIndexSurface,
  type CsvHandoffNoWriteFlags,
  type CsvHandoffReadFlags,
  type CsvHandoffSurfaceKind
} from "@/lib/server/csvHandoffIndex";

export const CSV_OPERATOR_READINESS_SCORECARD_CONTENT_TYPE =
  "application/json; charset=utf-8" as const;

export type CsvOperatorReadinessEntity = CsvFieldCoverageEntity;
export type CsvOperatorReadinessOperation = CsvCapabilityOperation;
export type CsvOperatorReadinessStatus =
  | "ready"
  | "needs-review"
  | "blocked";

export type CsvOperatorReadinessWarningCode =
  | CsvCompatibilityWarningCode
  | "unsupported-operation"
  | "missing-handoff-surface"
  | "write-flag-drift";

export type CsvOperatorReadinessStatusCounts = {
  ready: number;
  "needs-review": number;
  blocked: number;
};

export type CsvOperatorReadinessReadFlags = {
  metadata: true;
  database: boolean;
  csvInput: boolean;
  csvOutput: boolean;
};

export type CsvOperatorReadinessWriteFlags = {
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

export type CsvOperatorReadinessOperationScorecard = {
  operation: CsvOperatorReadinessOperation;
  entity: CsvOperatorReadinessEntity;
  label: string;
  route: string | null;
  status: CsvOperatorReadinessStatus;
  supported: boolean;
  expectedSurfaceKinds: readonly CsvHandoffSurfaceKind[];
  presentSurfaceKinds: readonly CsvHandoffSurfaceKind[];
  missingSurfaceKinds: readonly CsvHandoffSurfaceKind[];
  surfaceCount: number;
  requiredSurfaceCount: number;
  missingSurfaceCount: number;
  counts: CsvFieldCoverageCounts;
  warningCodes: readonly CsvOperatorReadinessWarningCode[];
  read: CsvOperatorReadinessReadFlags;
  write: CsvOperatorReadinessWriteFlags;
};

export type CsvOperatorReadinessEntityScorecard = {
  entity: CsvOperatorReadinessEntity;
  label: string;
  route: string | null;
  direction: CsvFieldCoverageEntitySummary["direction"];
  status: CsvOperatorReadinessStatus;
  operationCount: number;
  statusCounts: CsvOperatorReadinessStatusCounts;
  operations: readonly CsvOperatorReadinessOperationScorecard[];
  warningCodes: readonly CsvOperatorReadinessWarningCode[];
  read: CsvOperatorReadinessReadFlags;
  write: CsvOperatorReadinessWriteFlags;
};

export type CsvOperatorReadinessOperationAggregate = {
  operation: CsvOperatorReadinessOperation;
  entityCount: number;
  readyEntityCount: number;
  needsReviewEntityCount: number;
  blockedEntityCount: number;
  statusCounts: CsvOperatorReadinessStatusCounts;
  counts: CsvFieldCoverageCounts;
  warningCodes: readonly CsvOperatorReadinessWarningCode[];
  read: CsvOperatorReadinessReadFlags;
  write: CsvOperatorReadinessWriteFlags;
};

export type CsvOperatorReadinessScorecards = {
  contentType: typeof CSV_OPERATOR_READINESS_SCORECARD_CONTENT_TYPE;
  entityCount: number;
  operationCount: number;
  entries: readonly CsvOperatorReadinessEntityScorecard[];
  operations: readonly CsvOperatorReadinessOperationAggregate[];
  statusCounts: CsvOperatorReadinessStatusCounts;
  source: {
    handoffIndexContentType: ReturnType<typeof getCsvHandoffIndex>["contentType"];
    fieldCoverageContentType: ReturnType<typeof getCsvFieldCoverageSummary>["contentType"];
  };
  read: CsvOperatorReadinessReadFlags;
  write: CsvOperatorReadinessWriteFlags;
};

const expectedSurfaceKindsByOperation: Record<
  CsvOperatorReadinessOperation,
  readonly CsvHandoffSurfaceKind[]
> = {
  export: [
    "export-capability",
    "export-delivery-packet",
    "export-delivery-manifest"
  ],
  "import-preview": ["import-preview-capability"],
  "import-template": [
    "import-template-capability",
    "import-template",
    "import-template-example"
  ],
  "import-preflight": [
    "import-preflight-capability",
    "import-dry-run-receipt",
    "import-dry-run-manifest"
  ]
};

function noWrites(): CsvOperatorReadinessWriteFlags {
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

function metadataOnlyReads(): CsvOperatorReadinessReadFlags {
  return {
    metadata: true,
    database: false,
    csvInput: false,
    csvOutput: false
  };
}

function zeroCounts(): CsvFieldCoverageCounts {
  return {
    exportOnly: 0,
    importOnly: 0,
    shared: 0,
    required: 0,
    optional: 0,
    unsupported: 0,
    warnings: 0
  };
}

function emptyStatusCounts(): CsvOperatorReadinessStatusCounts {
  return {
    ready: 0,
    "needs-review": 0,
    blocked: 0
  };
}

function addCounts(
  left: CsvFieldCoverageCounts,
  right: CsvFieldCoverageCounts
): CsvFieldCoverageCounts {
  return {
    exportOnly: left.exportOnly + right.exportOnly,
    importOnly: left.importOnly + right.importOnly,
    shared: left.shared + right.shared,
    required: left.required + right.required,
    optional: left.optional + right.optional,
    unsupported: left.unsupported + right.unsupported,
    warnings: left.warnings + right.warnings
  };
}

function countStatuses(
  scorecards: readonly { status: CsvOperatorReadinessStatus }[]
): CsvOperatorReadinessStatusCounts {
  const counts = emptyStatusCounts();

  for (const scorecard of scorecards) {
    counts[scorecard.status] += 1;
  }

  return counts;
}

function combineReads(
  reads: readonly (CsvOperatorReadinessReadFlags | CsvHandoffReadFlags)[]
): CsvOperatorReadinessReadFlags {
  return {
    metadata: true,
    database: reads.some((read) => read.database),
    csvInput: reads.some((read) => read.csvInput),
    csvOutput: reads.some((read) => read.csvOutput)
  };
}

function readFromFieldCoverage(
  read: CsvFieldCoverageReadFlags
): CsvOperatorReadinessReadFlags {
  return {
    metadata: true,
    database: read.database,
    csvInput: read.csvInput,
    csvOutput: read.csvOutput
  };
}

function hasWriteDrift(
  write: CsvFieldCoverageWriteFlags | CsvHandoffNoWriteFlags
): boolean {
  return (
    write.database ||
    write.files ||
    write.externalServices ||
    write.exportHistory ||
    write.scheduledDelivery ||
    write.backgroundJobs ||
    write.routingAssignments ||
    write.importApply ||
    write.bulkMutations ||
    write.headerRemapping ||
    write.salesforceSync
  );
}

function uniqueWarningCodes(
  codes: readonly CsvOperatorReadinessWarningCode[]
): CsvOperatorReadinessWarningCode[] {
  const seen = new Set<CsvOperatorReadinessWarningCode>();
  const unique: CsvOperatorReadinessWarningCode[] = [];

  for (const code of codes) {
    if (!seen.has(code)) {
      seen.add(code);
      unique.push(code);
    }
  }

  return unique;
}

function surfaceKinds(
  surfaces: readonly CsvHandoffIndexSurface[]
): CsvHandoffSurfaceKind[] {
  return surfaces.map((surface) => surface.kind);
}

function associatedSurfaces(
  operation: CsvOperatorReadinessOperation,
  handoff: CsvHandoffIndexEntry
): CsvHandoffIndexSurface[] {
  const expectedKinds = expectedSurfaceKindsByOperation[operation];

  return handoff.surfaces.filter((surface) =>
    expectedKinds.includes(surface.kind)
  );
}

function warningCodesForOperation(input: {
  operation: CsvFieldCoverageEntityOperation;
  missingSurfaceKinds: readonly CsvHandoffSurfaceKind[];
  surfaces: readonly CsvHandoffIndexSurface[];
}): CsvOperatorReadinessWarningCode[] {
  const warningCodes: CsvOperatorReadinessWarningCode[] = [
    ...input.operation.warningCodes
  ];

  if (!input.operation.supported) {
    warningCodes.push("unsupported-operation");
  }

  if (input.missingSurfaceKinds.length > 0) {
    warningCodes.push("missing-handoff-surface");
  }

  if (
    hasWriteDrift(input.operation.write) ||
    input.surfaces.some((surface) => hasWriteDrift(surface.write))
  ) {
    warningCodes.push("write-flag-drift");
  }

  return uniqueWarningCodes(warningCodes);
}

function statusForOperation(input: {
  supported: boolean;
  missingSurfaceCount: number;
  warningCount: number;
}): CsvOperatorReadinessStatus {
  if (!input.supported) {
    return "blocked";
  }

  return input.missingSurfaceCount > 0 || input.warningCount > 0
    ? "needs-review"
    : "ready";
}

function statusForEntity(
  operations: readonly CsvOperatorReadinessOperationScorecard[]
): CsvOperatorReadinessStatus {
  if (operations.every((operation) => operation.status === "blocked")) {
    return "blocked";
  }

  return operations.some((operation) => operation.status !== "ready")
    ? "needs-review"
    : "ready";
}

function buildOperationScorecard(
  operation: CsvFieldCoverageEntityOperation,
  handoff: CsvHandoffIndexEntry
): CsvOperatorReadinessOperationScorecard {
  const expectedSurfaceKinds = expectedSurfaceKindsByOperation[operation.operation];
  const surfaces = associatedSurfaces(operation.operation, handoff);
  const presentSurfaceKinds = surfaceKinds(surfaces);
  const missingSurfaceKinds = expectedSurfaceKinds.filter(
    (kind) => !presentSurfaceKinds.includes(kind)
  );
  const warningCodes = warningCodesForOperation({
    operation,
    missingSurfaceKinds,
    surfaces
  });
  const read = combineReads([
    readFromFieldCoverage(operation.read),
    ...surfaces.map((surface) => surface.read)
  ]);

  return {
    operation: operation.operation,
    entity: operation.entity,
    label: operation.label,
    route: operation.route,
    status: statusForOperation({
      supported: operation.supported,
      missingSurfaceCount: missingSurfaceKinds.length,
      warningCount: warningCodes.length
    }),
    supported: operation.supported,
    expectedSurfaceKinds,
    presentSurfaceKinds,
    missingSurfaceKinds,
    surfaceCount: presentSurfaceKinds.length,
    requiredSurfaceCount: expectedSurfaceKinds.length,
    missingSurfaceCount: missingSurfaceKinds.length,
    counts: operation.counts,
    warningCodes,
    read,
    write: noWrites()
  };
}

function buildEntityScorecard(
  coverage: CsvFieldCoverageEntitySummary,
  handoff: CsvHandoffIndexEntry
): CsvOperatorReadinessEntityScorecard {
  const operations = coverage.operations.map((operation) =>
    buildOperationScorecard(operation, handoff)
  );
  const warningCodes = uniqueWarningCodes(
    operations.flatMap((operation) => operation.warningCodes)
  );

  return {
    entity: coverage.entity,
    label: coverage.label,
    route: coverage.route,
    direction: coverage.direction,
    status: statusForEntity(operations),
    operationCount: operations.length,
    statusCounts: countStatuses(operations),
    operations,
    warningCodes,
    read: combineReads(operations.map((operation) => operation.read)),
    write: noWrites()
  };
}

function buildOperationAggregate(
  operation: CsvOperatorReadinessOperation,
  entries: readonly CsvOperatorReadinessEntityScorecard[]
): CsvOperatorReadinessOperationAggregate {
  const operations = entries.map((entry) => {
    const scorecard = entry.operations.find(
      (candidate) => candidate.operation === operation
    );

    if (scorecard === undefined) {
      throw new Error(`Missing CSV operator readiness operation ${operation}`);
    }

    return scorecard;
  });
  const statusCounts = countStatuses(operations);
  const counts = operations.reduce(
    (current, scorecard) => addCounts(current, scorecard.counts),
    zeroCounts()
  );

  return {
    operation,
    entityCount: operations.length,
    readyEntityCount: statusCounts.ready,
    needsReviewEntityCount: statusCounts["needs-review"],
    blockedEntityCount: statusCounts.blocked,
    statusCounts,
    counts,
    warningCodes: uniqueWarningCodes(
      operations.flatMap((scorecard) => scorecard.warningCodes)
    ),
    read: combineReads(operations.map((scorecard) => scorecard.read)),
    write: noWrites()
  };
}

export function isCsvOperatorReadinessEntity(
  value: string
): value is CsvOperatorReadinessEntity {
  return isCsvFieldCoverageEntity(value);
}

export function listCsvOperatorReadinessEntities(): CsvOperatorReadinessEntity[] {
  return listCsvFieldCoverageEntities();
}

export function getCsvOperatorReadinessScorecard(
  entity: string
): CsvOperatorReadinessEntityScorecard | null {
  if (!isCsvOperatorReadinessEntity(entity)) {
    return null;
  }

  const coverage = getCsvFieldCoverageEntitySummary(entity);
  const handoff = getCsvHandoffIndexEntry(entity);

  if (coverage === null || handoff === null) {
    return null;
  }

  return buildEntityScorecard(coverage, handoff);
}

export function listCsvOperatorReadinessScorecards(): CsvOperatorReadinessEntityScorecard[] {
  return listCsvFieldCoverageEntitySummaries().map((coverage) => {
    const handoff = getCsvHandoffIndexEntry(coverage.entity);

    if (handoff === null) {
      throw new Error(`Missing CSV handoff index entry for ${coverage.entity}`);
    }

    return buildEntityScorecard(coverage, handoff);
  });
}

export function listCsvOperatorReadinessOperationScorecards(
  operation: CsvOperatorReadinessOperation
): CsvOperatorReadinessOperationScorecard[] {
  return listCsvOperatorReadinessScorecards().map((entry) => {
    const scorecard = entry.operations.find(
      (candidate) => candidate.operation === operation
    );

    if (scorecard === undefined) {
      throw new Error(`Missing CSV operator readiness operation ${operation}`);
    }

    return scorecard;
  });
}

export function getCsvOperatorReadinessScorecards(): CsvOperatorReadinessScorecards {
  const entries = listCsvOperatorReadinessScorecards();
  const fieldCoverageSummary = getCsvFieldCoverageSummary();
  const handoffIndex = getCsvHandoffIndex();

  return {
    contentType: CSV_OPERATOR_READINESS_SCORECARD_CONTENT_TYPE,
    entityCount: entries.length,
    operationCount: CSV_CAPABILITY_OPERATIONS.length,
    entries,
    operations: CSV_CAPABILITY_OPERATIONS.map((operation) =>
      buildOperationAggregate(operation, entries)
    ),
    statusCounts: countStatuses(entries),
    source: {
      handoffIndexContentType: handoffIndex.contentType,
      fieldCoverageContentType: fieldCoverageSummary.contentType
    },
    read: metadataOnlyReads(),
    write: noWrites()
  };
}
