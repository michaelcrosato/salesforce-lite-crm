import { createHash } from "node:crypto";
import {
  CSV_CONTRACT_QA_CHECKS_CONTENT_TYPE,
  getCsvContractQaChecks,
  type CsvContractQaEntityCheck,
  type CsvContractQaIssueCode,
  type CsvContractQaOperationCheck,
  type CsvContractQaReadFlags,
  type CsvContractQaStatus,
  type CsvContractQaWriteFlags
} from "@/lib/server/csvContractQaChecks";
import {
  CSV_OPERATOR_FIXTURE_BUNDLE_CONTENT_TYPE,
  getCsvOperatorFixtureBundle,
  isCsvOperatorFixtureBundleOperation,
  type CsvOperatorFixtureAvailability,
  type CsvOperatorFixtureBundle,
  type CsvOperatorFixtureBundleOperation,
  type CsvOperatorFixtureBundleOptions,
  type CsvOperatorFixtureEntityBundle,
  type CsvOperatorFixtureOperationBundle,
  type CsvOperatorFixtureReadFlags,
  type CsvOperatorFixtureWriteFlags
} from "@/lib/server/csvOperatorFixtureBundles";
import {
  CSV_OPERATOR_READINESS_SCORECARD_CONTENT_TYPE,
  type CsvOperatorReadinessStatus,
  type CsvOperatorReadinessWarningCode
} from "@/lib/server/csvOperatorReadinessScorecards";
import {
  CSV_OPERATOR_REMEDIATION_RUNBOOK_CONTENT_TYPE,
  getCsvOperatorRemediationRunbooks,
  type CsvOperatorRemediationEntityRunbook,
  type CsvOperatorRemediationNextAction,
  type CsvOperatorRemediationOperationRunbook,
  type CsvOperatorRemediationReadFlags,
  type CsvOperatorRemediationSeverity,
  type CsvOperatorRemediationSourceCode,
  type CsvOperatorRemediationStatus,
  type CsvOperatorRemediationWriteFlags
} from "@/lib/server/csvOperatorRemediationRunbooks";
import {
  CSV_RELEASE_VERIFICATION_MANIFEST_CONTENT_TYPE,
  getCsvReleaseVerificationManifest,
  isCsvReleaseVerificationManifestEntity,
  type CsvReleaseVerificationEntityCoverage,
  type CsvReleaseVerificationManifest,
  type CsvReleaseVerificationManifestEntity,
  type CsvReleaseVerificationManifestStatus,
  type CsvReleaseVerificationReadFlags,
  type CsvReleaseVerificationWriteFlags
} from "@/lib/server/csvReleaseVerificationManifests";
import { getInFlightCsvPacket } from "@/lib/server/csvInFlightCache";

export const CSV_OPERATOR_ACCEPTANCE_CHECKLIST_CONTENT_TYPE =
  "application/json; charset=utf-8" as const;

export type CsvOperatorAcceptanceChecklistEntity =
  CsvReleaseVerificationManifestEntity;
export type CsvOperatorAcceptanceChecklistOperation =
  CsvOperatorFixtureBundleOperation;
export type CsvOperatorAcceptanceChecklistOptions =
  CsvOperatorFixtureBundleOptions;
export type CsvOperatorAcceptanceChecklistStatus = "pass" | "watch" | "block";
export type CsvOperatorAcceptanceChecklistReadFlags =
  CsvReleaseVerificationReadFlags;
export type CsvOperatorAcceptanceChecklistWriteFlags =
  CsvReleaseVerificationWriteFlags;

const acceptanceChecklistCache = new Map<
  string,
  Promise<CsvOperatorAcceptanceChecklist>
>();

export type CsvOperatorAcceptanceChecklistStatusCounts = {
  pass: number;
  watch: number;
  block: number;
};

export type CsvOperatorAcceptanceChecklistCriterionCode =
  | "operation-supported"
  | "release-verification"
  | "fixture-available"
  | "readiness-status"
  | "remediation-status"
  | "contract-qa"
  | "no-write-guarantee";

export type CsvOperatorAcceptanceChecklistCriterion = {
  code: CsvOperatorAcceptanceChecklistCriterionCode;
  label: string;
  status: CsvOperatorAcceptanceChecklistStatus;
  required: true;
  evidence: {
    supported: boolean | null;
    releaseVerificationStatus: CsvReleaseVerificationManifestStatus | null;
    fixtureAvailable: boolean | null;
    fixtureKind: CsvOperatorFixtureAvailability["kind"] | null;
    readinessStatus: CsvOperatorReadinessStatus | null;
    remediationStatus: CsvOperatorRemediationStatus | null;
    remediationSeverity: CsvOperatorRemediationSeverity | null;
    qaStatus: CsvContractQaStatus | null;
    issueCount: number;
    remediationCount: number;
    writeDriftSources: readonly string[];
  };
};

export type CsvOperatorAcceptanceChecklistSource = {
  releaseVerificationContentType:
    typeof CSV_RELEASE_VERIFICATION_MANIFEST_CONTENT_TYPE;
  releaseVerificationManifestVersion: 1;
  releaseVerificationFingerprint: string;
  operatorFixtureContentType: typeof CSV_OPERATOR_FIXTURE_BUNDLE_CONTENT_TYPE;
  operatorFixtureBundleVersion: 1;
  operatorFixtureFingerprint: string;
  operatorRemediationContentType:
    typeof CSV_OPERATOR_REMEDIATION_RUNBOOK_CONTENT_TYPE;
  operatorReadinessContentType:
    typeof CSV_OPERATOR_READINESS_SCORECARD_CONTENT_TYPE;
  contractQaContentType: typeof CSV_CONTRACT_QA_CHECKS_CONTENT_TYPE;
  operatorHandoffStatus: CsvReleaseVerificationManifestStatus;
  contractDriftFingerprint: string;
};

export type CsvOperatorAcceptanceChecklistItem = {
  id: string;
  entity: CsvOperatorAcceptanceChecklistEntity;
  label: string;
  route: string | null;
  operation: CsvOperatorAcceptanceChecklistOperation;
  status: CsvOperatorAcceptanceChecklistStatus;
  supported: boolean;
  releaseVerificationStatus: CsvReleaseVerificationManifestStatus;
  fixture: CsvOperatorFixtureAvailability;
  readinessStatus: CsvOperatorReadinessStatus;
  remediationStatus: CsvOperatorRemediationStatus;
  remediationSeverity: CsvOperatorRemediationSeverity;
  qaStatus: CsvContractQaStatus;
  issueCount: number;
  remediationCount: number;
  warningCodes: readonly CsvOperatorReadinessWarningCode[];
  sourceCodes: readonly CsvOperatorRemediationSourceCode[];
  criteria: readonly CsvOperatorAcceptanceChecklistCriterion[];
  criteriaCounts: CsvOperatorAcceptanceChecklistStatusCounts;
  nextAction: CsvOperatorRemediationNextAction;
  sourceContentTypes: readonly string[];
  read: CsvOperatorAcceptanceChecklistReadFlags;
  write: CsvOperatorAcceptanceChecklistWriteFlags;
};

export type CsvOperatorAcceptanceEntityChecklist = {
  contentType: typeof CSV_OPERATOR_ACCEPTANCE_CHECKLIST_CONTENT_TYPE;
  checklistVersion: 1;
  entity: CsvOperatorAcceptanceChecklistEntity;
  label: string;
  route: string | null;
  direction: CsvReleaseVerificationEntityCoverage["direction"];
  status: CsvOperatorAcceptanceChecklistStatus;
  fingerprint: string;
  itemCount: number;
  supportedItemCount: number;
  unsupportedItemCount: number;
  fixtureItemCount: number;
  issueCount: number;
  remediationCount: number;
  statusCounts: CsvOperatorAcceptanceChecklistStatusCounts;
  warningCodes: readonly CsvOperatorReadinessWarningCode[];
  sourceCodes: readonly CsvOperatorRemediationSourceCode[];
  items: readonly CsvOperatorAcceptanceChecklistItem[];
  source: CsvOperatorAcceptanceChecklistSource;
  read: CsvOperatorAcceptanceChecklistReadFlags;
  write: CsvOperatorAcceptanceChecklistWriteFlags;
};

export type CsvOperatorAcceptanceOperationChecklist = {
  contentType: typeof CSV_OPERATOR_ACCEPTANCE_CHECKLIST_CONTENT_TYPE;
  checklistVersion: 1;
  operation: CsvOperatorAcceptanceChecklistOperation;
  status: CsvOperatorAcceptanceChecklistStatus;
  fingerprint: string;
  itemCount: number;
  supportedItemCount: number;
  unsupportedItemCount: number;
  fixtureItemCount: number;
  issueCount: number;
  remediationCount: number;
  statusCounts: CsvOperatorAcceptanceChecklistStatusCounts;
  warningCodes: readonly CsvOperatorReadinessWarningCode[];
  sourceCodes: readonly CsvOperatorRemediationSourceCode[];
  items: readonly CsvOperatorAcceptanceChecklistItem[];
  source: CsvOperatorAcceptanceChecklistSource;
  read: CsvOperatorAcceptanceChecklistReadFlags;
  write: CsvOperatorAcceptanceChecklistWriteFlags;
};

export type CsvOperatorAcceptanceChecklist = {
  contentType: typeof CSV_OPERATOR_ACCEPTANCE_CHECKLIST_CONTENT_TYPE;
  checklistVersion: 1;
  status: CsvOperatorAcceptanceChecklistStatus;
  fingerprint: string;
  entityCount: number;
  operationCount: number;
  checklistItemCount: number;
  supportedItemCount: number;
  unsupportedItemCount: number;
  fixtureItemCount: number;
  issueCount: number;
  remediationCount: number;
  statusCounts: CsvOperatorAcceptanceChecklistStatusCounts;
  entityStatusCounts: CsvOperatorAcceptanceChecklistStatusCounts;
  operationStatusCounts: CsvOperatorAcceptanceChecklistStatusCounts;
  warningCodes: readonly CsvOperatorReadinessWarningCode[];
  sourceCodes: readonly CsvOperatorRemediationSourceCode[];
  sourceFingerprintRollup:
    CsvReleaseVerificationManifest["sourceFingerprintRollup"];
  sourceContentTypes: readonly string[];
  entities: readonly CsvOperatorAcceptanceEntityChecklist[];
  operations: readonly CsvOperatorAcceptanceOperationChecklist[];
  source: CsvOperatorAcceptanceChecklistSource;
  read: CsvOperatorAcceptanceChecklistReadFlags;
  write: CsvOperatorAcceptanceChecklistWriteFlags;
};

type ReadFlagInput =
  | CsvReleaseVerificationReadFlags
  | CsvOperatorFixtureReadFlags
  | CsvOperatorRemediationReadFlags
  | CsvContractQaReadFlags;

type WriteFlagInput =
  | CsvReleaseVerificationWriteFlags
  | CsvOperatorFixtureWriteFlags
  | CsvOperatorRemediationWriteFlags
  | CsvContractQaWriteFlags;

type CriterionInput = {
  supported: boolean;
  releaseVerificationStatus: CsvReleaseVerificationManifestStatus;
  fixture: CsvOperatorFixtureAvailability;
  readinessStatus: CsvOperatorReadinessStatus;
  remediationStatus: CsvOperatorRemediationStatus;
  remediationSeverity: CsvOperatorRemediationSeverity;
  qaStatus: CsvContractQaStatus;
  issueCount: number;
  remediationCount: number;
  writeDriftSources: readonly string[];
};

function noWrites(): CsvOperatorAcceptanceChecklistWriteFlags {
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

function emptyStatusCounts(): CsvOperatorAcceptanceChecklistStatusCounts {
  return {
    pass: 0,
    watch: 0,
    block: 0
  };
}

function combineReads(
  reads: readonly ReadFlagInput[]
): CsvOperatorAcceptanceChecklistReadFlags {
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

function uniqueWarnings(
  values: readonly CsvOperatorReadinessWarningCode[]
): CsvOperatorReadinessWarningCode[] {
  const seen = new Set<string>();
  const result: CsvOperatorReadinessWarningCode[] = [];

  for (const value of values) {
    if (!seen.has(value)) {
      seen.add(value);
      result.push(value);
    }
  }

  return result;
}

function uniqueSourceCodes(
  values: readonly (CsvOperatorRemediationSourceCode | CsvContractQaIssueCode)[]
): CsvOperatorRemediationSourceCode[] {
  const seen = new Set<string>();
  const result: CsvOperatorRemediationSourceCode[] = [];

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

function countStatuses(
  values: readonly { status: CsvOperatorAcceptanceChecklistStatus }[]
): CsvOperatorAcceptanceChecklistStatusCounts {
  const counts = emptyStatusCounts();

  for (const value of values) {
    counts[value.status] += 1;
  }

  return counts;
}

function statusFromCounts(
  counts: CsvOperatorAcceptanceChecklistStatusCounts
): CsvOperatorAcceptanceChecklistStatus {
  if (counts.block > 0) {
    return "block";
  }

  return counts.watch > 0 ? "watch" : "pass";
}

function statusForReleaseVerification(
  status: CsvReleaseVerificationManifestStatus
): CsvOperatorAcceptanceChecklistStatus {
  switch (status) {
    case "stable":
      return "pass";
    case "watch":
      return "watch";
    case "blocked":
      return "block";
  }
}

function statusForReadiness(
  status: CsvOperatorReadinessStatus
): CsvOperatorAcceptanceChecklistStatus {
  switch (status) {
    case "ready":
      return "pass";
    case "needs-review":
      return "watch";
    case "blocked":
      return "block";
  }
}

function statusForRemediation(
  status: CsvOperatorRemediationStatus
): CsvOperatorAcceptanceChecklistStatus {
  switch (status) {
    case "ready":
      return "pass";
    case "needs-action":
      return "watch";
    case "blocked":
      return "block";
  }
}

function statusForQa(
  status: CsvContractQaStatus
): CsvOperatorAcceptanceChecklistStatus {
  switch (status) {
    case "pass":
      return "pass";
    case "warn":
      return "watch";
    case "fail":
      return "block";
  }
}

function criterionEvidence(input: CriterionInput) {
  return {
    supported: input.supported,
    releaseVerificationStatus: input.releaseVerificationStatus,
    fixtureAvailable: input.fixture.available,
    fixtureKind: input.fixture.kind,
    readinessStatus: input.readinessStatus,
    remediationStatus: input.remediationStatus,
    remediationSeverity: input.remediationSeverity,
    qaStatus: input.qaStatus,
    issueCount: input.issueCount,
    remediationCount: input.remediationCount,
    writeDriftSources: input.writeDriftSources
  };
}

function buildCriterion(input: {
  code: CsvOperatorAcceptanceChecklistCriterionCode;
  label: string;
  status: CsvOperatorAcceptanceChecklistStatus;
  evidence: ReturnType<typeof criterionEvidence>;
}): CsvOperatorAcceptanceChecklistCriterion {
  return {
    code: input.code,
    label: input.label,
    status: input.status,
    required: true,
    evidence: input.evidence
  };
}

function buildCriteria(
  input: CriterionInput
): CsvOperatorAcceptanceChecklistCriterion[] {
  const evidence = criterionEvidence(input);

  return [
    buildCriterion({
      code: "operation-supported",
      label: "Operation is supported by the current CSV contract",
      status: input.supported ? "pass" : "block",
      evidence
    }),
    buildCriterion({
      code: "release-verification",
      label: "Release verification status is acceptable",
      status: statusForReleaseVerification(input.releaseVerificationStatus),
      evidence
    }),
    buildCriterion({
      code: "fixture-available",
      label: "Operator fixture is available for later UI/docs/tests",
      status: input.fixture.available ? "pass" : "block",
      evidence
    }),
    buildCriterion({
      code: "readiness-status",
      label: "Operator readiness scorecard is acceptable",
      status: statusForReadiness(input.readinessStatus),
      evidence
    }),
    buildCriterion({
      code: "remediation-status",
      label: "Remediation runbook has no blocking action",
      status: statusForRemediation(input.remediationStatus),
      evidence
    }),
    buildCriterion({
      code: "contract-qa",
      label: "Contract QA check has no failing issue",
      status: statusForQa(input.qaStatus),
      evidence
    }),
    buildCriterion({
      code: "no-write-guarantee",
      label: "All source surfaces preserve explicit no-write flags",
      status: input.writeDriftSources.length === 0 ? "pass" : "block",
      evidence
    })
  ];
}

function buildSource(input: {
  manifest: CsvReleaseVerificationManifest;
  fixture: CsvOperatorFixtureBundle;
}): CsvOperatorAcceptanceChecklistSource {
  return {
    releaseVerificationContentType: input.manifest.contentType,
    releaseVerificationManifestVersion: input.manifest.manifestVersion,
    releaseVerificationFingerprint: input.manifest.fingerprint,
    operatorFixtureContentType: input.fixture.contentType,
    operatorFixtureBundleVersion: input.fixture.bundleVersion,
    operatorFixtureFingerprint: input.fixture.fingerprint,
    operatorRemediationContentType:
      CSV_OPERATOR_REMEDIATION_RUNBOOK_CONTENT_TYPE,
    operatorReadinessContentType: CSV_OPERATOR_READINESS_SCORECARD_CONTENT_TYPE,
    contractQaContentType: CSV_CONTRACT_QA_CHECKS_CONTENT_TYPE,
    operatorHandoffStatus: input.manifest.source.operatorHandoffStatus,
    contractDriftFingerprint: input.manifest.source.contractDriftFingerprint
  };
}

function findFixtureEntity(
  fixture: CsvOperatorFixtureBundle,
  entity: CsvOperatorAcceptanceChecklistEntity
): CsvOperatorFixtureEntityBundle {
  const bundle = fixture.entities.find((entry) => entry.entity === entity);

  if (bundle === undefined) {
    throw new Error(`Missing CSV acceptance fixture entity ${entity}`);
  }

  return bundle;
}

function findRemediationEntity(
  entities: readonly CsvOperatorRemediationEntityRunbook[],
  entity: CsvOperatorAcceptanceChecklistEntity
): CsvOperatorRemediationEntityRunbook {
  const runbook = entities.find((entry) => entry.entity === entity);

  if (runbook === undefined) {
    throw new Error(`Missing CSV acceptance remediation entity ${entity}`);
  }

  return runbook;
}

function findRemediationOperation(
  entity: CsvOperatorRemediationEntityRunbook,
  operation: CsvOperatorAcceptanceChecklistOperation
): CsvOperatorRemediationOperationRunbook {
  const runbook = entity.operations.find((entry) => entry.operation === operation);

  if (runbook === undefined) {
    throw new Error(
      `Missing CSV acceptance remediation operation ${operation} for ${entity.entity}`
    );
  }

  return runbook;
}

function findQaEntity(
  entities: readonly CsvContractQaEntityCheck[],
  entity: CsvOperatorAcceptanceChecklistEntity
): CsvContractQaEntityCheck {
  const check = entities.find((entry) => entry.entity === entity);

  if (check === undefined) {
    throw new Error(`Missing CSV acceptance QA entity ${entity}`);
  }

  return check;
}

function findQaOperation(
  entity: CsvContractQaEntityCheck,
  operation: CsvOperatorAcceptanceChecklistOperation
): CsvContractQaOperationCheck {
  const check = entity.operations.find((entry) => entry.operation === operation);

  if (check === undefined) {
    throw new Error(
      `Missing CSV acceptance QA operation ${operation} for ${entity.entity}`
    );
  }

  return check;
}

function findEntityOperation(
  entity: CsvReleaseVerificationEntityCoverage,
  operation: CsvOperatorAcceptanceChecklistOperation
): CsvReleaseVerificationEntityCoverage["operations"][number] {
  const coverage = entity.operations.find((entry) => entry.operation === operation);

  if (coverage === undefined) {
    throw new Error(
      `Missing CSV acceptance verification operation ${operation} for ${entity.entity}`
    );
  }

  return coverage;
}

function findFixtureEntityOperation(input: {
  entity: CsvOperatorFixtureEntityBundle;
  operation: CsvOperatorAcceptanceChecklistOperation;
}): CsvOperatorFixtureEntityBundle["operations"][number] {
  const fixture = input.entity.operations.find(
    (entry) => entry.operation === input.operation
  );

  if (fixture === undefined) {
    throw new Error(
      `Missing CSV acceptance fixture operation ${input.operation} for ${input.entity.entity}`
    );
  }

  return fixture;
}

function buildChecklistItem(input: {
  entity: CsvReleaseVerificationEntityCoverage;
  operation: CsvOperatorAcceptanceChecklistOperation;
  fixtureEntity: CsvOperatorFixtureEntityBundle;
  remediationEntity: CsvOperatorRemediationEntityRunbook;
  qaEntity: CsvContractQaEntityCheck;
}): CsvOperatorAcceptanceChecklistItem {
  const verificationOperation = findEntityOperation(
    input.entity,
    input.operation
  );
  const fixtureOperation = findFixtureEntityOperation({
    entity: input.fixtureEntity,
    operation: input.operation
  });
  const remediationOperation = findRemediationOperation(
    input.remediationEntity,
    input.operation
  );
  const qaOperation = findQaOperation(input.qaEntity, input.operation);
  const writeDrifts = writeDriftSources([
    {
      source: "release-verification-operation",
      write: verificationOperation.write
    },
    {
      source: "operator-fixture-operation",
      write: fixtureOperation.write
    },
    {
      source: "operator-remediation-operation",
      write: remediationOperation.write
    },
    {
      source: "contract-qa-operation",
      write: qaOperation.write
    }
  ]);
  const sourceCodes = uniqueSourceCodes([
    ...verificationOperation.sourceCodes,
    ...remediationOperation.sourceCodes,
    ...qaOperation.issues.map((issue) => issue.code)
  ]);
  const warningCodes = uniqueWarnings([
    ...verificationOperation.warningCodes,
    ...remediationOperation.warningCodes
  ]);
  const criteria = buildCriteria({
    supported: verificationOperation.supported,
    releaseVerificationStatus: verificationOperation.status,
    fixture: fixtureOperation.fixture,
    readinessStatus: remediationOperation.readinessStatus,
    remediationStatus: remediationOperation.status,
    remediationSeverity: remediationOperation.severity,
    qaStatus: qaOperation.status,
    issueCount: qaOperation.issueCount,
    remediationCount: remediationOperation.remediationCount,
    writeDriftSources: writeDrifts
  });
  const criteriaCounts = countStatuses(criteria);
  const read = combineReads([
    verificationOperation.read,
    fixtureOperation.read,
    remediationOperation.read,
    qaOperation.read
  ]);

  return {
    id: `${input.entity.entity}:${input.operation}`,
    entity: input.entity.entity,
    label: input.entity.label,
    route: input.entity.route,
    operation: input.operation,
    status: statusFromCounts(criteriaCounts),
    supported: verificationOperation.supported,
    releaseVerificationStatus: verificationOperation.status,
    fixture: fixtureOperation.fixture,
    readinessStatus: remediationOperation.readinessStatus,
    remediationStatus: remediationOperation.status,
    remediationSeverity: remediationOperation.severity,
    qaStatus: qaOperation.status,
    issueCount: qaOperation.issueCount,
    remediationCount: remediationOperation.remediationCount,
    warningCodes,
    sourceCodes,
    criteria,
    criteriaCounts,
    nextAction: remediationOperation.nextAction,
    sourceContentTypes: uniqueStrings([
      ...verificationOperation.sourceContentTypes,
      ...fixtureOperation.handoff.sourceContentTypes
    ]),
    read,
    write: noWrites()
  };
}

function buildEntityFingerprint(input: {
  source: CsvOperatorAcceptanceChecklistSource;
  entity: CsvOperatorAcceptanceChecklistEntity;
  status: CsvOperatorAcceptanceChecklistStatus;
  items: readonly CsvOperatorAcceptanceChecklistItem[];
}): string {
  return digestPayload({
    source: input.source,
    entity: input.entity,
    status: input.status,
    items: input.items.map((item) => ({
      id: item.id,
      status: item.status,
      supported: item.supported,
      fixture: item.fixture,
      criteriaCounts: item.criteriaCounts,
      issueCount: item.issueCount,
      remediationCount: item.remediationCount
    }))
  });
}

function buildEntityChecklist(input: {
  entity: CsvReleaseVerificationEntityCoverage;
  fixture: CsvOperatorFixtureBundle;
  remediationEntities: readonly CsvOperatorRemediationEntityRunbook[];
  qaEntities: readonly CsvContractQaEntityCheck[];
  source: CsvOperatorAcceptanceChecklistSource;
}): CsvOperatorAcceptanceEntityChecklist {
  const fixtureEntity = findFixtureEntity(input.fixture, input.entity.entity);
  const remediationEntity = findRemediationEntity(
    input.remediationEntities,
    input.entity.entity
  );
  const qaEntity = findQaEntity(input.qaEntities, input.entity.entity);
  const items = input.entity.operations.map((operation) =>
    buildChecklistItem({
      entity: input.entity,
      operation: operation.operation,
      fixtureEntity,
      remediationEntity,
      qaEntity
    })
  );
  const statusCounts = countStatuses(items);
  const status = statusFromCounts(statusCounts);
  const fingerprint = buildEntityFingerprint({
    source: input.source,
    entity: input.entity.entity,
    status,
    items
  });

  return {
    contentType: CSV_OPERATOR_ACCEPTANCE_CHECKLIST_CONTENT_TYPE,
    checklistVersion: 1,
    entity: input.entity.entity,
    label: input.entity.label,
    route: input.entity.route,
    direction: input.entity.direction,
    status,
    fingerprint,
    itemCount: items.length,
    supportedItemCount: items.filter((item) => item.supported).length,
    unsupportedItemCount: items.filter((item) => !item.supported).length,
    fixtureItemCount: items.filter((item) => item.fixture.available).length,
    issueCount: items.reduce((current, item) => current + item.issueCount, 0),
    remediationCount: items.reduce(
      (current, item) => current + item.remediationCount,
      0
    ),
    statusCounts,
    warningCodes: uniqueWarnings(items.flatMap((item) => item.warningCodes)),
    sourceCodes: uniqueSourceCodes(items.flatMap((item) => item.sourceCodes)),
    items,
    source: input.source,
    read: combineReads(items.map((item) => item.read)),
    write: noWrites()
  };
}

function buildOperationFingerprint(input: {
  source: CsvOperatorAcceptanceChecklistSource;
  operation: CsvOperatorAcceptanceChecklistOperation;
  status: CsvOperatorAcceptanceChecklistStatus;
  items: readonly CsvOperatorAcceptanceChecklistItem[];
}): string {
  return digestPayload({
    source: input.source,
    operation: input.operation,
    status: input.status,
    items: input.items.map((item) => ({
      id: item.id,
      entity: item.entity,
      status: item.status,
      supported: item.supported,
      fixture: item.fixture,
      criteriaCounts: item.criteriaCounts,
      issueCount: item.issueCount,
      remediationCount: item.remediationCount
    }))
  });
}

function buildOperationChecklist(input: {
  operation: CsvOperatorFixtureOperationBundle;
  entityChecklists: readonly CsvOperatorAcceptanceEntityChecklist[];
  source: CsvOperatorAcceptanceChecklistSource;
}): CsvOperatorAcceptanceOperationChecklist {
  const items = input.entityChecklists.map((entityChecklist) => {
    const item = entityChecklist.items.find(
      (candidate) => candidate.operation === input.operation.operation
    );

    if (item === undefined) {
      throw new Error(
        `Missing CSV acceptance operation ${input.operation.operation} for ${entityChecklist.entity}`
      );
    }

    return item;
  });
  const statusCounts = countStatuses(items);
  const status = statusFromCounts(statusCounts);
  const fingerprint = buildOperationFingerprint({
    source: input.source,
    operation: input.operation.operation,
    status,
    items
  });

  return {
    contentType: CSV_OPERATOR_ACCEPTANCE_CHECKLIST_CONTENT_TYPE,
    checklistVersion: 1,
    operation: input.operation.operation,
    status,
    fingerprint,
    itemCount: items.length,
    supportedItemCount: items.filter((item) => item.supported).length,
    unsupportedItemCount: items.filter((item) => !item.supported).length,
    fixtureItemCount: items.filter((item) => item.fixture.available).length,
    issueCount: items.reduce((current, item) => current + item.issueCount, 0),
    remediationCount: items.reduce(
      (current, item) => current + item.remediationCount,
      0
    ),
    statusCounts,
    warningCodes: uniqueWarnings(items.flatMap((item) => item.warningCodes)),
    sourceCodes: uniqueSourceCodes(items.flatMap((item) => item.sourceCodes)),
    items,
    source: input.source,
    read: combineReads(items.map((item) => item.read)),
    write: noWrites()
  };
}

function buildChecklistFingerprint(input: {
  source: CsvOperatorAcceptanceChecklistSource;
  status: CsvOperatorAcceptanceChecklistStatus;
  entities: readonly CsvOperatorAcceptanceEntityChecklist[];
  operations: readonly CsvOperatorAcceptanceOperationChecklist[];
}): string {
  return digestPayload({
    source: input.source,
    status: input.status,
    entities: input.entities.map((entity) => ({
      entity: entity.entity,
      status: entity.status,
      fingerprint: entity.fingerprint,
      statusCounts: entity.statusCounts
    })),
    operations: input.operations.map((operation) => ({
      operation: operation.operation,
      status: operation.status,
      fingerprint: operation.fingerprint,
      statusCounts: operation.statusCounts
    }))
  });
}

export function isCsvOperatorAcceptanceChecklistEntity(
  value: string
): value is CsvOperatorAcceptanceChecklistEntity {
  return isCsvReleaseVerificationManifestEntity(value);
}

export function isCsvOperatorAcceptanceChecklistOperation(
  value: string
): value is CsvOperatorAcceptanceChecklistOperation {
  return isCsvOperatorFixtureBundleOperation(value);
}

export async function getCsvOperatorAcceptanceChecklist(
  options: CsvOperatorAcceptanceChecklistOptions = {}
): Promise<CsvOperatorAcceptanceChecklist> {
  return getInFlightCsvPacket(acceptanceChecklistCache, options, async () => {
    const [fixture, manifest] = await Promise.all([
      getCsvOperatorFixtureBundle(options),
      Promise.resolve(getCsvReleaseVerificationManifest())
    ]);
    const remediation = getCsvOperatorRemediationRunbooks();
    const qa = getCsvContractQaChecks();
    const source = buildSource({ manifest, fixture });
    const entities = manifest.coverage.entities.map((entity) =>
      buildEntityChecklist({
        entity,
        fixture,
        remediationEntities: remediation.entries,
        qaEntities: qa.entries,
        source
      })
    );
    const operations = fixture.operations.map((operation) =>
      buildOperationChecklist({
        operation,
        entityChecklists: entities,
        source
      })
    );
    const allItems = entities.flatMap((entity) => entity.items);
    const statusCounts = countStatuses(allItems);
    const status = statusFromCounts(statusCounts);
    const sourceContentTypes = uniqueStrings([
      CSV_OPERATOR_ACCEPTANCE_CHECKLIST_CONTENT_TYPE,
      manifest.contentType,
      fixture.contentType,
      remediation.contentType,
      qa.contentType,
      remediation.source.operatorReadinessContentType,
      qa.source.fieldCoverageContentType,
      qa.source.handoffIndexContentType,
      ...manifest.sourceContentTypes,
      ...fixture.sourceContentTypes,
      ...allItems.flatMap((item) => item.sourceContentTypes)
    ]);
    const fingerprint = buildChecklistFingerprint({
      source,
      status,
      entities,
      operations
    });

    return {
      contentType: CSV_OPERATOR_ACCEPTANCE_CHECKLIST_CONTENT_TYPE,
      checklistVersion: 1,
      status,
      fingerprint,
      entityCount: entities.length,
      operationCount: operations.length,
      checklistItemCount: allItems.length,
      supportedItemCount: allItems.filter((item) => item.supported).length,
      unsupportedItemCount: allItems.filter((item) => !item.supported).length,
      fixtureItemCount: allItems.filter((item) => item.fixture.available).length,
      issueCount: allItems.reduce(
        (current, item) => current + item.issueCount,
        0
      ),
      remediationCount: allItems.reduce(
        (current, item) => current + item.remediationCount,
        0
      ),
      statusCounts,
      entityStatusCounts: countStatuses(entities),
      operationStatusCounts: countStatuses(operations),
      warningCodes: uniqueWarnings(
        allItems.flatMap((item) => item.warningCodes)
      ),
      sourceCodes: uniqueSourceCodes(
        allItems.flatMap((item) => item.sourceCodes)
      ),
      sourceFingerprintRollup: manifest.sourceFingerprintRollup,
      sourceContentTypes,
      entities,
      operations,
      source,
      read: combineReads([
        manifest.read,
        fixture.read,
        remediation.read,
        qa.read,
        ...allItems.map((item) => item.read)
      ]),
      write: noWrites()
    };
  });
}

export async function listCsvOperatorAcceptanceEntityChecklists(
  options: CsvOperatorAcceptanceChecklistOptions = {}
): Promise<CsvOperatorAcceptanceEntityChecklist[]> {
  return (await getCsvOperatorAcceptanceChecklist(options)).entities.slice();
}

export async function getCsvOperatorAcceptanceEntityChecklist(
  entity: string,
  options: CsvOperatorAcceptanceChecklistOptions = {}
): Promise<CsvOperatorAcceptanceEntityChecklist | null> {
  if (!isCsvOperatorAcceptanceChecklistEntity(entity)) {
    return null;
  }

  const checklist = await getCsvOperatorAcceptanceChecklist(options);

  return checklist.entities.find((entry) => entry.entity === entity) ?? null;
}

export async function listCsvOperatorAcceptanceOperationChecklists(
  options: CsvOperatorAcceptanceChecklistOptions = {}
): Promise<CsvOperatorAcceptanceOperationChecklist[]> {
  return (await getCsvOperatorAcceptanceChecklist(options)).operations.slice();
}

export async function getCsvOperatorAcceptanceOperationChecklist(
  operation: string,
  options: CsvOperatorAcceptanceChecklistOptions = {}
): Promise<CsvOperatorAcceptanceOperationChecklist | null> {
  if (!isCsvOperatorAcceptanceChecklistOperation(operation)) {
    return null;
  }

  const checklist = await getCsvOperatorAcceptanceChecklist(options);

  return checklist.operations.find((entry) => entry.operation === operation) ?? null;
}
