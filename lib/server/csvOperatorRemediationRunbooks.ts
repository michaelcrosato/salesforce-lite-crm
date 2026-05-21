import { CSV_CAPABILITY_OPERATIONS } from "@/lib/server/csvCapabilities";
import {
  CSV_CONTRACT_QA_CHECKS_CONTENT_TYPE,
  getCsvContractQaChecks,
  getCsvContractQaEntityCheck,
  type CsvContractQaEntityCheck,
  type CsvContractQaIssue,
  type CsvContractQaIssueCode,
  type CsvContractQaOperationCheck,
  type CsvContractQaSeverity,
  type CsvContractQaStatus
} from "@/lib/server/csvContractQaChecks";
import {
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
  type CsvOperatorReadinessOperation,
  type CsvOperatorReadinessOperationScorecard,
  type CsvOperatorReadinessReadFlags,
  type CsvOperatorReadinessStatus,
  type CsvOperatorReadinessWarningCode,
  type CsvOperatorReadinessWriteFlags
} from "@/lib/server/csvOperatorReadinessScorecards";

export const CSV_OPERATOR_REMEDIATION_RUNBOOK_CONTENT_TYPE =
  "application/json; charset=utf-8" as const;

export type CsvOperatorRemediationEntity = CsvOperatorReadinessEntity;
export type CsvOperatorRemediationOperation = CsvOperatorReadinessOperation;
export type CsvOperatorRemediationStatus =
  | "ready"
  | "needs-action"
  | "blocked";
export type CsvOperatorRemediationSeverity = "info" | "warning" | "error";
export type CsvOperatorRemediationSourceCode =
  | CsvOperatorReadinessWarningCode
  | CsvContractQaIssueCode;
export type CsvOperatorRemediationActionCode =
  | "no-action-needed"
  | "review-directional-field-coverage"
  | "keep-unsupported-operation-excluded"
  | "restore-handoff-surface"
  | "align-header-contract"
  | "align-read-flags"
  | "restore-no-write-guarantee"
  | "review-operation-readiness";

export type CsvOperatorRemediationStatusCounts = {
  ready: number;
  "needs-action": number;
  blocked: number;
};

export type CsvOperatorRemediationSeverityCounts = {
  info: number;
  warning: number;
  error: number;
};

export type CsvOperatorRemediationReadFlags = CsvOperatorReadinessReadFlags;
export type CsvOperatorRemediationWriteFlags = CsvOperatorReadinessWriteFlags;

export type CsvOperatorRemediationNextAction = {
  code: CsvOperatorRemediationActionCode;
  label: string;
  description: string;
  safeForCurrentSprint: boolean;
  requiresContractChange: boolean;
};

export type CsvOperatorRemediationEvidence = {
  readinessStatus: CsvOperatorReadinessStatus;
  qaStatus: CsvContractQaStatus;
  warningCodes: readonly CsvOperatorReadinessWarningCode[];
  issueCodes: readonly CsvContractQaIssueCode[];
  issueMessages: readonly string[];
  missingSurfaceKinds: readonly CsvHandoffSurfaceKind[];
};

export type CsvOperatorRemediationItem = {
  code: CsvOperatorRemediationActionCode;
  entity: CsvOperatorRemediationEntity;
  label: string;
  route: string | null;
  operation: CsvOperatorRemediationOperation;
  severity: CsvOperatorRemediationSeverity;
  title: string;
  explanation: string;
  sourceCodes: readonly CsvOperatorRemediationSourceCode[];
  evidence: CsvOperatorRemediationEvidence;
  nextAction: CsvOperatorRemediationNextAction;
};

export type CsvOperatorRemediationOperationRunbook = {
  entity: CsvOperatorRemediationEntity;
  label: string;
  route: string | null;
  operation: CsvOperatorRemediationOperation;
  status: CsvOperatorRemediationStatus;
  severity: CsvOperatorRemediationSeverity;
  supported: boolean;
  readinessStatus: CsvOperatorReadinessStatus;
  qaStatus: CsvContractQaStatus;
  sourceCodes: readonly CsvOperatorRemediationSourceCode[];
  expectedSurfaceKinds: readonly CsvHandoffSurfaceKind[];
  presentSurfaceKinds: readonly CsvHandoffSurfaceKind[];
  missingSurfaceKinds: readonly CsvHandoffSurfaceKind[];
  issueCount: number;
  warningCodes: readonly CsvOperatorReadinessWarningCode[];
  remediations: readonly CsvOperatorRemediationItem[];
  remediationCount: number;
  nextAction: CsvOperatorRemediationNextAction;
  read: CsvOperatorRemediationReadFlags;
  write: CsvOperatorRemediationWriteFlags;
};

export type CsvOperatorRemediationEntityRunbook = {
  entity: CsvOperatorRemediationEntity;
  label: string;
  route: string | null;
  status: CsvOperatorRemediationStatus;
  severity: CsvOperatorRemediationSeverity;
  operationCount: number;
  remediationCount: number;
  statusCounts: CsvOperatorRemediationStatusCounts;
  severityCounts: CsvOperatorRemediationSeverityCounts;
  sourceCodes: readonly CsvOperatorRemediationSourceCode[];
  operations: readonly CsvOperatorRemediationOperationRunbook[];
  read: CsvOperatorRemediationReadFlags;
  write: CsvOperatorRemediationWriteFlags;
};

export type CsvOperatorRemediationOperationAggregate = {
  operation: CsvOperatorRemediationOperation;
  entityCount: number;
  readyEntityCount: number;
  needsActionEntityCount: number;
  blockedEntityCount: number;
  remediationCount: number;
  statusCounts: CsvOperatorRemediationStatusCounts;
  severityCounts: CsvOperatorRemediationSeverityCounts;
  sourceCodes: readonly CsvOperatorRemediationSourceCode[];
  read: CsvOperatorRemediationReadFlags;
  write: CsvOperatorRemediationWriteFlags;
};

export type CsvOperatorRemediationRunbooks = {
  contentType: typeof CSV_OPERATOR_REMEDIATION_RUNBOOK_CONTENT_TYPE;
  entityCount: number;
  operationCount: number;
  remediationCount: number;
  entries: readonly CsvOperatorRemediationEntityRunbook[];
  operations: readonly CsvOperatorRemediationOperationAggregate[];
  statusCounts: CsvOperatorRemediationStatusCounts;
  severityCounts: CsvOperatorRemediationSeverityCounts;
  sourceCodes: readonly CsvOperatorRemediationSourceCode[];
  source: {
    operatorReadinessContentType: typeof CSV_OPERATOR_READINESS_SCORECARD_CONTENT_TYPE;
    contractQaContentType: typeof CSV_CONTRACT_QA_CHECKS_CONTENT_TYPE;
  };
  read: CsvOperatorRemediationReadFlags;
  write: CsvOperatorRemediationWriteFlags;
};

function noWrites(): CsvOperatorRemediationWriteFlags {
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

function metadataOnlyReads(): CsvOperatorRemediationReadFlags {
  return {
    metadata: true,
    database: false,
    csvInput: false,
    csvOutput: false
  };
}

function combineReads(
  reads: readonly CsvOperatorRemediationReadFlags[]
): CsvOperatorRemediationReadFlags {
  return {
    metadata: true,
    database: reads.some((read) => read.database),
    csvInput: reads.some((read) => read.csvInput),
    csvOutput: reads.some((read) => read.csvOutput)
  };
}

function emptyStatusCounts(): CsvOperatorRemediationStatusCounts {
  return {
    ready: 0,
    "needs-action": 0,
    blocked: 0
  };
}

function emptySeverityCounts(): CsvOperatorRemediationSeverityCounts {
  return {
    info: 0,
    warning: 0,
    error: 0
  };
}

function countStatuses(
  runbooks: readonly { status: CsvOperatorRemediationStatus }[]
): CsvOperatorRemediationStatusCounts {
  const counts = emptyStatusCounts();

  for (const runbook of runbooks) {
    counts[runbook.status] += 1;
  }

  return counts;
}

function countSeverities(
  runbooks: readonly { severity: CsvOperatorRemediationSeverity }[]
): CsvOperatorRemediationSeverityCounts {
  const counts = emptySeverityCounts();

  for (const runbook of runbooks) {
    counts[runbook.severity] += 1;
  }

  return counts;
}

function uniqueSourceCodes(
  sourceCodes: readonly CsvOperatorRemediationSourceCode[]
): CsvOperatorRemediationSourceCode[] {
  const seen = new Set<string>();
  const result: CsvOperatorRemediationSourceCode[] = [];

  for (const sourceCode of sourceCodes) {
    if (!seen.has(sourceCode)) {
      seen.add(sourceCode);
      result.push(sourceCode);
    }
  }

  return result;
}

function uniqueActionCodes(
  actionCodes: readonly CsvOperatorRemediationActionCode[]
): CsvOperatorRemediationActionCode[] {
  const seen = new Set<string>();
  const result: CsvOperatorRemediationActionCode[] = [];

  for (const actionCode of actionCodes) {
    if (!seen.has(actionCode)) {
      seen.add(actionCode);
      result.push(actionCode);
    }
  }

  return result;
}

function uniqueSurfaceKinds(
  surfaceKinds: readonly CsvHandoffSurfaceKind[]
): CsvHandoffSurfaceKind[] {
  const seen = new Set<string>();
  const result: CsvHandoffSurfaceKind[] = [];

  for (const surfaceKind of surfaceKinds) {
    if (!seen.has(surfaceKind)) {
      seen.add(surfaceKind);
      result.push(surfaceKind);
    }
  }

  return result;
}

function strongestSeverity(
  severities: readonly CsvOperatorRemediationSeverity[]
): CsvOperatorRemediationSeverity {
  if (severities.includes("error")) {
    return "error";
  }

  if (severities.includes("warning")) {
    return "warning";
  }

  return "info";
}

function severityFromQaIssue(
  severity: CsvContractQaSeverity
): CsvOperatorRemediationSeverity {
  return severity === "error" ? "error" : "warning";
}

function actionCodeForSourceCode(
  sourceCode: CsvOperatorRemediationSourceCode,
  operation: CsvOperatorReadinessOperationScorecard
): CsvOperatorRemediationActionCode {
  if (
    !operation.supported &&
    (sourceCode === "unsupported-export-direction" ||
      sourceCode === "unsupported-import-direction" ||
      sourceCode === "unsupported-operation" ||
      sourceCode === "unsupported-operation-gap" ||
      sourceCode === "missing-handoff-surface")
  ) {
    return "keep-unsupported-operation-excluded";
  }

  switch (sourceCode) {
    case "export-field-only":
    case "import-field-only":
      return "review-directional-field-coverage";
    case "unsupported-export-direction":
    case "unsupported-import-direction":
    case "unsupported-operation":
    case "unsupported-operation-gap":
      return "keep-unsupported-operation-excluded";
    case "missing-export-transfer-manifest":
    case "missing-import-transfer-manifest":
    case "missing-handoff-surface":
      return "restore-handoff-surface";
    case "inconsistent-headers":
      return "align-header-contract";
    case "read-flag-drift":
      return "align-read-flags";
    case "no-write-flag-drift":
    case "write-flag-drift":
      return "restore-no-write-guarantee";
    default:
      return "review-operation-readiness";
  }
}

function titleForAction(
  actionCode: CsvOperatorRemediationActionCode
): string {
  switch (actionCode) {
    case "no-action-needed":
      return "No remediation needed";
    case "review-directional-field-coverage":
      return "Review directional field coverage";
    case "keep-unsupported-operation-excluded":
      return "Keep unsupported operation excluded";
    case "restore-handoff-surface":
      return "Restore missing handoff surface";
    case "align-header-contract":
      return "Align CSV header contract";
    case "align-read-flags":
      return "Align read flag metadata";
    case "restore-no-write-guarantee":
      return "Restore no-write guarantee";
    case "review-operation-readiness":
      return "Review operation readiness";
  }
}

function explanationForAction(input: {
  actionCode: CsvOperatorRemediationActionCode;
  operation: CsvOperatorReadinessOperationScorecard;
  missingSurfaceKinds: readonly CsvHandoffSurfaceKind[];
}): string {
  const operationName = `${input.operation.label} ${input.operation.operation}`;

  switch (input.actionCode) {
    case "no-action-needed":
      return `${operationName} is ready under the current read-only CSV contract.`;
    case "review-directional-field-coverage":
      return `${operationName} has directional fields that are intentionally export-only or import-only and should be reviewed before UI handoff copy is written.`;
    case "keep-unsupported-operation-excluded":
      return `${operationName} is outside the current supported CSV surface; do not widen entity support without a future contract update.`;
    case "restore-handoff-surface":
      return `${operationName} is missing expected handoff surface metadata: ${input.missingSurfaceKinds.join(", ")}.`;
    case "align-header-contract":
      return `${operationName} has header metadata that does not match the field coverage contract.`;
    case "align-read-flags":
      return `${operationName} has read flag metadata that does not match the expected read-only contract.`;
    case "restore-no-write-guarantee":
      return `${operationName} has drift in explicit no-write metadata and must not imply writes, jobs, routing, or sync.`;
    case "review-operation-readiness":
      return `${operationName} has readiness warnings that require operator review before UI handoff.`;
  }
}

function nextActionForAction(input: {
  actionCode: CsvOperatorRemediationActionCode;
  operation: CsvOperatorReadinessOperationScorecard;
  missingSurfaceKinds: readonly CsvHandoffSurfaceKind[];
}): CsvOperatorRemediationNextAction {
  const operationName = `${input.operation.label} ${input.operation.operation}`;

  switch (input.actionCode) {
    case "no-action-needed":
      return {
        code: input.actionCode,
        label: "No action",
        description: `${operationName} can be surfaced as ready by later UI work.`,
        safeForCurrentSprint: true,
        requiresContractChange: false
      };
    case "review-directional-field-coverage":
      return {
        code: input.actionCode,
        label: "Review field direction",
        description: `Use the source field coverage notes when explaining ${operationName}; do not add header remapping.`,
        safeForCurrentSprint: true,
        requiresContractChange: false
      };
    case "keep-unsupported-operation-excluded":
      return {
        code: input.actionCode,
        label: "Keep excluded",
        description: `Keep ${operationName} excluded unless a future sprint promotes that CSV operation in the contract.`,
        safeForCurrentSprint: false,
        requiresContractChange: true
      };
    case "restore-handoff-surface":
      return {
        code: input.actionCode,
        label: "Restore surface metadata",
        description: `Restore the missing metadata surfaces for ${operationName}: ${input.missingSurfaceKinds.join(", ")}.`,
        safeForCurrentSprint: true,
        requiresContractChange: false
      };
    case "align-header-contract":
      return {
        code: input.actionCode,
        label: "Align headers",
        description: `Align generated headers for ${operationName} with the existing field coverage contract.`,
        safeForCurrentSprint: true,
        requiresContractChange: false
      };
    case "align-read-flags":
      return {
        code: input.actionCode,
        label: "Align read flags",
        description: `Align read metadata for ${operationName} with the current read-only source surfaces.`,
        safeForCurrentSprint: true,
        requiresContractChange: false
      };
    case "restore-no-write-guarantee":
      return {
        code: input.actionCode,
        label: "Restore no-write metadata",
        description: `Restore no-write flags for ${operationName}; do not add persistence, routing execution, jobs, or sync.`,
        safeForCurrentSprint: true,
        requiresContractChange: false
      };
    case "review-operation-readiness":
      return {
        code: input.actionCode,
        label: "Review readiness",
        description: `Review the scorecard evidence for ${operationName} before presenting it as operator-ready.`,
        safeForCurrentSprint: true,
        requiresContractChange: false
      };
  }
}

function statusForOperation(input: {
  readinessStatus: CsvOperatorReadinessStatus;
  qaStatus: CsvContractQaStatus;
  remediationCount: number;
}): CsvOperatorRemediationStatus {
  if (input.readinessStatus === "blocked" || input.qaStatus === "fail") {
    return "blocked";
  }

  if (input.remediationCount > 0 || input.qaStatus === "warn") {
    return "needs-action";
  }

  return "ready";
}

function statusForEntity(
  operations: readonly CsvOperatorRemediationOperationRunbook[]
): CsvOperatorRemediationStatus {
  if (operations.some((operation) => operation.status === "blocked")) {
    return "blocked";
  }

  if (operations.some((operation) => operation.status === "needs-action")) {
    return "needs-action";
  }

  return "ready";
}

function buildRemediationItem(input: {
  actionCode: CsvOperatorRemediationActionCode;
  operation: CsvOperatorReadinessOperationScorecard;
  qaOperation: CsvContractQaOperationCheck;
  sourceCodes: readonly CsvOperatorRemediationSourceCode[];
  issues: readonly CsvContractQaIssue[];
}): CsvOperatorRemediationItem {
  const warningCodes = input.operation.warningCodes.filter((warningCode) =>
    input.sourceCodes.some((sourceCode) => sourceCode === warningCode)
  );
  const issueCodes = input.issues.map((issue) => issue.code);
  const missingSurfaceKinds = uniqueSurfaceKinds([
    ...input.operation.missingSurfaceKinds,
    ...input.issues.flatMap((issue) => issue.missingSurfaceKinds)
  ]);
  const qaSeverities = input.issues.map((issue) =>
    severityFromQaIssue(issue.severity)
  );
  const severity = strongestSeverity([
    ...qaSeverities,
    input.operation.status === "blocked" && input.operation.supported
      ? "error"
      : "warning"
  ]);
  const nextAction = nextActionForAction({
    actionCode: input.actionCode,
    operation: input.operation,
    missingSurfaceKinds
  });

  return {
    code: input.actionCode,
    entity: input.operation.entity,
    label: input.operation.label,
    route: input.operation.route,
    operation: input.operation.operation,
    severity,
    title: titleForAction(input.actionCode),
    explanation: explanationForAction({
      actionCode: input.actionCode,
      operation: input.operation,
      missingSurfaceKinds
    }),
    sourceCodes: input.sourceCodes,
    evidence: {
      readinessStatus: input.operation.status,
      qaStatus: input.qaOperation.status,
      warningCodes,
      issueCodes,
      issueMessages: input.issues.map((issue) => issue.message),
      missingSurfaceKinds
    },
    nextAction
  };
}

function buildRemediationItems(input: {
  operation: CsvOperatorReadinessOperationScorecard;
  qaOperation: CsvContractQaOperationCheck;
}): CsvOperatorRemediationItem[] {
  const sourceCodes = uniqueSourceCodes([
    ...input.operation.warningCodes,
    ...input.qaOperation.issues.map((issue) => issue.code)
  ]);
  const actionCodes = uniqueActionCodes(
    sourceCodes.map((sourceCode) =>
      actionCodeForSourceCode(sourceCode, input.operation)
    )
  );

  return actionCodes.map((actionCode) => {
    const relatedSourceCodes = sourceCodes.filter(
      (sourceCode) =>
        actionCodeForSourceCode(sourceCode, input.operation) === actionCode
    );
    const relatedIssues = input.qaOperation.issues.filter((issue) =>
      relatedSourceCodes.some((sourceCode) => sourceCode === issue.code)
    );

    return buildRemediationItem({
      actionCode,
      operation: input.operation,
      qaOperation: input.qaOperation,
      sourceCodes: relatedSourceCodes,
      issues: relatedIssues
    });
  });
}

function buildOperationRunbook(
  operation: CsvOperatorReadinessOperationScorecard,
  qaOperation: CsvContractQaOperationCheck
): CsvOperatorRemediationOperationRunbook {
  const remediations = buildRemediationItems({ operation, qaOperation });
  const status = statusForOperation({
    readinessStatus: operation.status,
    qaStatus: qaOperation.status,
    remediationCount: remediations.length
  });
  const severity =
    remediations.length === 0
      ? "info"
      : strongestSeverity(remediations.map((remediation) => remediation.severity));
  const sourceCodes = uniqueSourceCodes(
    remediations.flatMap((remediation) => remediation.sourceCodes)
  );

  return {
    entity: operation.entity,
    label: operation.label,
    route: operation.route,
    operation: operation.operation,
    status,
    severity,
    supported: operation.supported,
    readinessStatus: operation.status,
    qaStatus: qaOperation.status,
    sourceCodes,
    expectedSurfaceKinds: operation.expectedSurfaceKinds,
    presentSurfaceKinds: operation.presentSurfaceKinds,
    missingSurfaceKinds: operation.missingSurfaceKinds,
    issueCount: qaOperation.issueCount,
    warningCodes: operation.warningCodes,
    remediations,
    remediationCount: remediations.length,
    nextAction:
      remediations[0]?.nextAction ??
      nextActionForAction({
        actionCode: "no-action-needed",
        operation,
        missingSurfaceKinds: []
      }),
    read: combineReads([operation.read, qaOperation.read]),
    write: noWrites()
  };
}

function buildEntityRunbook(input: {
  readiness: NonNullable<ReturnType<typeof getCsvOperatorReadinessScorecard>>;
  qa: CsvContractQaEntityCheck;
}): CsvOperatorRemediationEntityRunbook {
  const operations = input.readiness.operations.map((operation) => {
    const qaOperation = input.qa.operations.find(
      (candidate) => candidate.operation === operation.operation
    );

    if (qaOperation === undefined) {
      throw new Error(`Missing CSV remediation QA operation ${operation.operation}`);
    }

    return buildOperationRunbook(operation, qaOperation);
  });
  const status = statusForEntity(operations);

  return {
    entity: input.readiness.entity,
    label: input.readiness.label,
    route: input.readiness.route,
    status,
    severity: strongestSeverity(operations.map((operation) => operation.severity)),
    operationCount: operations.length,
    remediationCount: operations.reduce(
      (current, operation) => current + operation.remediationCount,
      0
    ),
    statusCounts: countStatuses(operations),
    severityCounts: countSeverities(operations),
    sourceCodes: uniqueSourceCodes(
      operations.flatMap((operation) => operation.sourceCodes)
    ),
    operations,
    read: combineReads(operations.map((operation) => operation.read)),
    write: noWrites()
  };
}

function buildOperationAggregate(
  operation: CsvOperatorRemediationOperation,
  entries: readonly CsvOperatorRemediationEntityRunbook[]
): CsvOperatorRemediationOperationAggregate {
  const operationRunbooks = entries.map((entry) => {
    const runbook = entry.operations.find(
      (candidate) => candidate.operation === operation
    );

    if (runbook === undefined) {
      throw new Error(`Missing CSV remediation operation ${operation}`);
    }

    return runbook;
  });
  const statusCounts = countStatuses(operationRunbooks);

  return {
    operation,
    entityCount: operationRunbooks.length,
    readyEntityCount: statusCounts.ready,
    needsActionEntityCount: statusCounts["needs-action"],
    blockedEntityCount: statusCounts.blocked,
    remediationCount: operationRunbooks.reduce(
      (current, runbook) => current + runbook.remediationCount,
      0
    ),
    statusCounts,
    severityCounts: countSeverities(operationRunbooks),
    sourceCodes: uniqueSourceCodes(
      operationRunbooks.flatMap((runbook) => runbook.sourceCodes)
    ),
    read: combineReads(operationRunbooks.map((runbook) => runbook.read)),
    write: noWrites()
  };
}

export function isCsvOperatorRemediationEntity(
  value: string
): value is CsvOperatorRemediationEntity {
  return isCsvOperatorReadinessEntity(value);
}

export function listCsvOperatorRemediationEntities(): CsvOperatorRemediationEntity[] {
  return listCsvOperatorReadinessEntities();
}

export function getCsvOperatorRemediationRunbook(
  entity: string
): CsvOperatorRemediationEntityRunbook | null {
  if (!isCsvOperatorRemediationEntity(entity)) {
    return null;
  }

  const readiness = getCsvOperatorReadinessScorecard(entity);
  const qa = getCsvContractQaEntityCheck(entity);

  if (readiness === null || qa === null) {
    return null;
  }

  return buildEntityRunbook({ readiness, qa });
}

export function listCsvOperatorRemediationRunbooks(): CsvOperatorRemediationEntityRunbook[] {
  return listCsvOperatorReadinessScorecards().map((readiness) => {
    const qa = getCsvContractQaEntityCheck(readiness.entity);

    if (qa === null) {
      throw new Error(`Missing CSV remediation QA entry for ${readiness.entity}`);
    }

    return buildEntityRunbook({ readiness, qa });
  });
}

export function listCsvOperatorRemediationOperationRunbooks(
  operation: CsvOperatorRemediationOperation
): CsvOperatorRemediationOperationRunbook[] {
  return listCsvOperatorRemediationRunbooks().map((entry) => {
    const runbook = entry.operations.find(
      (candidate) => candidate.operation === operation
    );

    if (runbook === undefined) {
      throw new Error(`Missing CSV remediation operation ${operation}`);
    }

    return runbook;
  });
}

export function getCsvOperatorRemediationRunbooks(): CsvOperatorRemediationRunbooks {
  const entries = listCsvOperatorRemediationRunbooks();
  const statusCounts = countStatuses(entries);
  const operatorReadiness = getCsvOperatorReadinessScorecards();
  const contractQa = getCsvContractQaChecks();

  return {
    contentType: CSV_OPERATOR_REMEDIATION_RUNBOOK_CONTENT_TYPE,
    entityCount: entries.length,
    operationCount: CSV_CAPABILITY_OPERATIONS.length,
    remediationCount: entries.reduce(
      (current, entry) => current + entry.remediationCount,
      0
    ),
    entries,
    operations: CSV_CAPABILITY_OPERATIONS.map((operation) =>
      buildOperationAggregate(operation, entries)
    ),
    statusCounts,
    severityCounts: countSeverities(entries),
    sourceCodes: uniqueSourceCodes(
      entries.flatMap((entry) => entry.sourceCodes)
    ),
    source: {
      operatorReadinessContentType: operatorReadiness.contentType,
      contractQaContentType: contractQa.contentType
    },
    read: metadataOnlyReads(),
    write: noWrites()
  };
}
