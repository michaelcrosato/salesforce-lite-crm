import { createHash } from "node:crypto";
import {
  CSV_OPERATOR_ACCEPTANCE_CHECKLIST_CONTENT_TYPE,
  getCsvOperatorAcceptanceChecklist,
  isCsvOperatorAcceptanceChecklistEntity,
  isCsvOperatorAcceptanceChecklistOperation,
  type CsvOperatorAcceptanceChecklist,
  type CsvOperatorAcceptanceChecklistItem,
  type CsvOperatorAcceptanceChecklistReadFlags,
  type CsvOperatorAcceptanceChecklistStatus,
  type CsvOperatorAcceptanceChecklistStatusCounts,
  type CsvOperatorAcceptanceEntityChecklist,
  type CsvOperatorAcceptanceOperationChecklist
} from "@/lib/server/csvOperatorAcceptanceChecklists";
import {
  CSV_OPERATOR_FIXTURE_BUNDLE_CONTENT_TYPE,
  getCsvOperatorFixtureBundle,
  isCsvOperatorFixtureBundleEntity,
  isCsvOperatorFixtureBundleOperation,
  type CsvOperatorFixtureAvailability,
  type CsvOperatorFixtureBundle,
  type CsvOperatorFixtureEntityBundle,
  type CsvOperatorFixtureEntityOperation,
  type CsvOperatorFixtureOperationBundle,
  type CsvOperatorFixtureReadFlags
} from "@/lib/server/csvOperatorFixtureBundles";
import {
  CSV_OPERATOR_WALKTHROUGH_MANIFEST_CONTENT_TYPE,
  getCsvOperatorWalkthroughManifest,
  isCsvOperatorWalkthroughEntity,
  isCsvOperatorWalkthroughOperation,
  type CsvOperatorWalkthroughEntityManifest,
  type CsvOperatorWalkthroughItem,
  type CsvOperatorWalkthroughManifest,
  type CsvOperatorWalkthroughOperationManifest,
  type CsvOperatorWalkthroughReadFlags,
  type CsvOperatorWalkthroughStatus,
  type CsvOperatorWalkthroughStatusCounts
} from "@/lib/server/csvOperatorWalkthroughManifests";
import {
  CSV_RELEASE_CLOSURE_SCORECARD_CONTENT_TYPE,
  getCsvReleaseClosureScorecard,
  isCsvReleaseClosureEntity,
  isCsvReleaseClosureOperation,
  type CsvReleaseClosureEntity,
  type CsvReleaseClosureEntityScorecard,
  type CsvReleaseClosureItem,
  type CsvReleaseClosureOperation,
  type CsvReleaseClosureOperationScorecard,
  type CsvReleaseClosureOptions,
  type CsvReleaseClosureReadFlags,
  type CsvReleaseClosureScorecard,
  type CsvReleaseClosureStatus,
  type CsvReleaseClosureStatusCounts
} from "@/lib/server/csvReleaseClosureScorecards";

export const CSV_RELEASE_EXCEPTION_REGISTER_CONTENT_TYPE =
  "application/json; charset=utf-8" as const;

export type CsvReleaseExceptionRegisterOptions = CsvReleaseClosureOptions;
export type CsvReleaseExceptionEntity = CsvReleaseClosureEntity;
export type CsvReleaseExceptionOperation = CsvReleaseClosureOperation;
export type CsvReleaseExceptionSeverity = "watch" | "block";
export type CsvReleaseExceptionStatus = CsvReleaseClosureStatus;

export type CsvReleaseExceptionSeverityCounts = {
  watch: number;
  block: number;
};

export type CsvReleaseExceptionReadFlags = {
  metadata: true;
  database: boolean;
  csvInput: boolean;
  csvOutput: boolean;
};

export type CsvReleaseExceptionWriteFlags = {
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

export type CsvReleaseExceptionSourceName =
  | "release-closure-scorecard"
  | "operator-acceptance-checklist"
  | "operator-fixture-bundle"
  | "operator-walkthrough-manifest";

export type CsvReleaseExceptionSourceScope = "root" | "entity" | "operation";

export type CsvReleaseExceptionSourceFingerprint = {
  source: CsvReleaseExceptionSourceName;
  scope: CsvReleaseExceptionSourceScope;
  key: string | null;
  contentType: string;
  fingerprint: string;
};

export type CsvReleaseExceptionSource = {
  releaseClosureContentType: typeof CSV_RELEASE_CLOSURE_SCORECARD_CONTENT_TYPE;
  releaseClosureScorecardVersion: 1;
  releaseClosureFingerprint: string;
  acceptanceChecklistContentType:
    typeof CSV_OPERATOR_ACCEPTANCE_CHECKLIST_CONTENT_TYPE;
  acceptanceChecklistVersion: 1;
  acceptanceChecklistFingerprint: string;
  operatorFixtureContentType: typeof CSV_OPERATOR_FIXTURE_BUNDLE_CONTENT_TYPE;
  operatorFixtureBundleVersion: 1;
  operatorFixtureFingerprint: string;
  operatorWalkthroughContentType:
    typeof CSV_OPERATOR_WALKTHROUGH_MANIFEST_CONTENT_TYPE;
  operatorWalkthroughManifestVersion: 1;
  operatorWalkthroughFingerprint: string;
  sourceFingerprints: readonly CsvReleaseExceptionSourceFingerprint[];
};

export type CsvReleaseExceptionClosureAnchor = {
  status: CsvReleaseClosureStatus;
  releaseStatus: CsvReleaseClosureItem["releaseStatus"];
  acceptanceStatus: CsvReleaseClosureItem["acceptanceStatus"];
  checkStatusCounts: CsvReleaseClosureStatusCounts;
  exceptionCheckCodes: readonly CsvReleaseClosureItem["checks"][number]["code"][];
  warningCodes: readonly string[];
  sourceCodes: readonly string[];
};

export type CsvReleaseExceptionAcceptanceAnchor = {
  status: CsvOperatorAcceptanceChecklistStatus;
  criteriaCounts: CsvOperatorAcceptanceChecklistStatusCounts;
  exceptionCriterionCodes: readonly CsvOperatorAcceptanceChecklistItem["criteria"][number]["code"][];
  issueCount: number;
  remediationCount: number;
  nextAction: CsvOperatorAcceptanceChecklistItem["nextAction"];
};

export type CsvReleaseExceptionFixtureAnchor = {
  availability: CsvOperatorFixtureAvailability;
  coverage: CsvReleaseClosureItem["fixtureCoverage"];
  fixtureStatus: CsvOperatorFixtureEntityOperation["status"];
  supported: boolean;
};

export type CsvReleaseExceptionWalkthroughAnchor = {
  status: CsvOperatorWalkthroughStatus;
  stepCount: number;
  watchNoteCount: number;
  blockingNoteCount: number;
  statusCounts: CsvOperatorWalkthroughStatusCounts;
  exceptionStepCodes: readonly CsvOperatorWalkthroughItem["steps"][number]["code"][];
  watchNotes: readonly string[];
  blockingNotes: readonly string[];
};

export type CsvReleaseExceptionRegisterEntry = {
  id: string;
  order: number;
  entity: CsvReleaseExceptionEntity;
  label: string;
  route: string | null;
  operation: CsvReleaseExceptionOperation;
  severity: CsvReleaseExceptionSeverity;
  status: CsvReleaseExceptionStatus;
  fingerprint: string;
  supported: boolean;
  fixtureAvailable: boolean;
  fixtureKind: CsvOperatorFixtureAvailability["kind"];
  closure: CsvReleaseExceptionClosureAnchor;
  acceptance: CsvReleaseExceptionAcceptanceAnchor;
  fixture: CsvReleaseExceptionFixtureAnchor;
  walkthrough: CsvReleaseExceptionWalkthroughAnchor;
  remediation: {
    nextAction: CsvOperatorAcceptanceChecklistItem["nextAction"];
    warningCodes: readonly string[];
    sourceCodes: readonly string[];
    issueCount: number;
    remediationCount: number;
  };
  sourceFingerprints: readonly CsvReleaseExceptionSourceFingerprint[];
  sourceContentTypes: readonly string[];
  read: CsvReleaseExceptionReadFlags;
  write: CsvReleaseExceptionWriteFlags;
};

export type CsvReleaseExceptionEntityRegister = {
  contentType: typeof CSV_RELEASE_EXCEPTION_REGISTER_CONTENT_TYPE;
  registerVersion: 1;
  entity: CsvReleaseExceptionEntity;
  label: string;
  route: string | null;
  direction: CsvReleaseClosureEntityScorecard["direction"];
  status: CsvReleaseExceptionStatus;
  fingerprint: string;
  exceptionCount: number;
  watchExceptionCount: number;
  blockExceptionCount: number;
  supportedExceptionCount: number;
  unsupportedExceptionCount: number;
  missingFixtureExceptionCount: number;
  severityCounts: CsvReleaseExceptionSeverityCounts;
  closureStatusCounts: CsvReleaseClosureStatusCounts;
  acceptanceStatusCounts: CsvOperatorAcceptanceChecklistStatusCounts;
  walkthroughStatusCounts: CsvOperatorWalkthroughStatusCounts;
  warningCodes: readonly string[];
  sourceCodes: readonly string[];
  entries: readonly CsvReleaseExceptionRegisterEntry[];
  sourceFingerprints: readonly CsvReleaseExceptionSourceFingerprint[];
  sourceContentTypes: readonly string[];
  source: CsvReleaseExceptionSource;
  read: CsvReleaseExceptionReadFlags;
  write: CsvReleaseExceptionWriteFlags;
};

export type CsvReleaseExceptionOperationRegister = {
  contentType: typeof CSV_RELEASE_EXCEPTION_REGISTER_CONTENT_TYPE;
  registerVersion: 1;
  operation: CsvReleaseExceptionOperation;
  status: CsvReleaseExceptionStatus;
  fingerprint: string;
  exceptionCount: number;
  watchExceptionCount: number;
  blockExceptionCount: number;
  supportedExceptionCount: number;
  unsupportedExceptionCount: number;
  missingFixtureExceptionCount: number;
  severityCounts: CsvReleaseExceptionSeverityCounts;
  closureStatusCounts: CsvReleaseClosureStatusCounts;
  acceptanceStatusCounts: CsvOperatorAcceptanceChecklistStatusCounts;
  walkthroughStatusCounts: CsvOperatorWalkthroughStatusCounts;
  warningCodes: readonly string[];
  sourceCodes: readonly string[];
  entries: readonly CsvReleaseExceptionRegisterEntry[];
  sourceFingerprints: readonly CsvReleaseExceptionSourceFingerprint[];
  sourceContentTypes: readonly string[];
  source: CsvReleaseExceptionSource;
  read: CsvReleaseExceptionReadFlags;
  write: CsvReleaseExceptionWriteFlags;
};

export type CsvReleaseExceptionRegister = {
  contentType: typeof CSV_RELEASE_EXCEPTION_REGISTER_CONTENT_TYPE;
  registerVersion: 1;
  status: CsvReleaseExceptionStatus;
  fingerprint: string;
  entityCount: number;
  operationCount: number;
  exceptionCount: number;
  watchExceptionCount: number;
  blockExceptionCount: number;
  supportedExceptionCount: number;
  unsupportedExceptionCount: number;
  missingFixtureExceptionCount: number;
  severityCounts: CsvReleaseExceptionSeverityCounts;
  entitySeverityCounts: CsvReleaseExceptionSeverityCounts;
  operationSeverityCounts: CsvReleaseExceptionSeverityCounts;
  closureStatusCounts: CsvReleaseClosureStatusCounts;
  acceptanceStatusCounts: CsvOperatorAcceptanceChecklistStatusCounts;
  walkthroughStatusCounts: CsvOperatorWalkthroughStatusCounts;
  warningCodes: readonly string[];
  sourceCodes: readonly string[];
  entries: readonly CsvReleaseExceptionRegisterEntry[];
  entities: readonly CsvReleaseExceptionEntityRegister[];
  operations: readonly CsvReleaseExceptionOperationRegister[];
  sourceFingerprints: readonly CsvReleaseExceptionSourceFingerprint[];
  sourceContentTypes: readonly string[];
  source: CsvReleaseExceptionSource;
  read: CsvReleaseExceptionReadFlags;
  write: CsvReleaseExceptionWriteFlags;
};

type ReadFlagInput =
  | CsvReleaseClosureReadFlags
  | CsvOperatorAcceptanceChecklistReadFlags
  | CsvOperatorFixtureReadFlags
  | CsvOperatorWalkthroughReadFlags
  | CsvReleaseExceptionReadFlags;

function noWrites(): CsvReleaseExceptionWriteFlags {
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
): CsvReleaseExceptionReadFlags {
  return {
    metadata: true,
    database: reads.some((read) => read.database),
    csvInput: reads.some((read) => read.csvInput),
    csvOutput: reads.some((read) => read.csvOutput)
  };
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

function emptySeverityCounts(): CsvReleaseExceptionSeverityCounts {
  return {
    watch: 0,
    block: 0
  };
}

function countSeverities(
  values: readonly { severity: CsvReleaseExceptionSeverity }[]
): CsvReleaseExceptionSeverityCounts {
  const counts = emptySeverityCounts();

  for (const value of values) {
    counts[value.severity] += 1;
  }

  return counts;
}

function statusFromSeverityCounts(
  counts: CsvReleaseExceptionSeverityCounts
): CsvReleaseExceptionStatus {
  if (counts.block > 0) {
    return "block";
  }

  return counts.watch > 0 ? "watch" : "ready";
}

function severityFromStatus(
  status: CsvReleaseClosureStatus
): CsvReleaseExceptionSeverity | null {
  return status === "ready" ? null : status;
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

function sourceFingerprint(input: {
  source: CsvReleaseExceptionSourceName;
  scope: CsvReleaseExceptionSourceScope;
  key: string | null;
  contentType: string;
  fingerprint: string;
}): CsvReleaseExceptionSourceFingerprint {
  return {
    source: input.source,
    scope: input.scope,
    key: input.key,
    contentType: input.contentType,
    fingerprint: input.fingerprint
  };
}

function buildSource(input: {
  closure: CsvReleaseClosureScorecard;
  acceptance: CsvOperatorAcceptanceChecklist;
  fixture: CsvOperatorFixtureBundle;
  walkthrough: CsvOperatorWalkthroughManifest;
}): CsvReleaseExceptionSource {
  return {
    releaseClosureContentType: input.closure.contentType,
    releaseClosureScorecardVersion: input.closure.scorecardVersion,
    releaseClosureFingerprint: input.closure.fingerprint,
    acceptanceChecklistContentType: input.acceptance.contentType,
    acceptanceChecklistVersion: input.acceptance.checklistVersion,
    acceptanceChecklistFingerprint: input.acceptance.fingerprint,
    operatorFixtureContentType: input.fixture.contentType,
    operatorFixtureBundleVersion: input.fixture.bundleVersion,
    operatorFixtureFingerprint: input.fixture.fingerprint,
    operatorWalkthroughContentType: input.walkthrough.contentType,
    operatorWalkthroughManifestVersion: input.walkthrough.manifestVersion,
    operatorWalkthroughFingerprint: input.walkthrough.fingerprint,
    sourceFingerprints: [
      sourceFingerprint({
        source: "release-closure-scorecard",
        scope: "root",
        key: null,
        contentType: input.closure.contentType,
        fingerprint: input.closure.fingerprint
      }),
      sourceFingerprint({
        source: "operator-acceptance-checklist",
        scope: "root",
        key: null,
        contentType: input.acceptance.contentType,
        fingerprint: input.acceptance.fingerprint
      }),
      sourceFingerprint({
        source: "operator-fixture-bundle",
        scope: "root",
        key: null,
        contentType: input.fixture.contentType,
        fingerprint: input.fixture.fingerprint
      }),
      sourceFingerprint({
        source: "operator-walkthrough-manifest",
        scope: "root",
        key: null,
        contentType: input.walkthrough.contentType,
        fingerprint: input.walkthrough.fingerprint
      })
    ]
  };
}

function entitySourceFingerprints(input: {
  closure: CsvReleaseClosureEntityScorecard;
  acceptance: CsvOperatorAcceptanceEntityChecklist;
  fixture: CsvOperatorFixtureEntityBundle;
  walkthrough: CsvOperatorWalkthroughEntityManifest;
}): CsvReleaseExceptionSourceFingerprint[] {
  return [
    sourceFingerprint({
      source: "release-closure-scorecard",
      scope: "entity",
      key: input.closure.entity,
      contentType: input.closure.contentType,
      fingerprint: input.closure.fingerprint
    }),
    sourceFingerprint({
      source: "operator-acceptance-checklist",
      scope: "entity",
      key: input.acceptance.entity,
      contentType: input.acceptance.contentType,
      fingerprint: input.acceptance.fingerprint
    }),
    sourceFingerprint({
      source: "operator-fixture-bundle",
      scope: "entity",
      key: input.fixture.entity,
      contentType: input.fixture.contentType,
      fingerprint: input.fixture.fingerprint
    }),
    sourceFingerprint({
      source: "operator-walkthrough-manifest",
      scope: "entity",
      key: input.walkthrough.entity,
      contentType: input.walkthrough.contentType,
      fingerprint: input.walkthrough.fingerprint
    })
  ];
}

function operationSourceFingerprints(input: {
  closure: CsvReleaseClosureOperationScorecard;
  acceptance: CsvOperatorAcceptanceOperationChecklist;
  fixture: CsvOperatorFixtureOperationBundle;
  walkthrough: CsvOperatorWalkthroughOperationManifest;
}): CsvReleaseExceptionSourceFingerprint[] {
  return [
    sourceFingerprint({
      source: "release-closure-scorecard",
      scope: "operation",
      key: input.closure.operation,
      contentType: input.closure.contentType,
      fingerprint: input.closure.fingerprint
    }),
    sourceFingerprint({
      source: "operator-acceptance-checklist",
      scope: "operation",
      key: input.acceptance.operation,
      contentType: input.acceptance.contentType,
      fingerprint: input.acceptance.fingerprint
    }),
    sourceFingerprint({
      source: "operator-fixture-bundle",
      scope: "operation",
      key: input.fixture.operation,
      contentType: input.fixture.contentType,
      fingerprint: input.fixture.fingerprint
    }),
    sourceFingerprint({
      source: "operator-walkthrough-manifest",
      scope: "operation",
      key: input.walkthrough.operation,
      contentType: input.walkthrough.contentType,
      fingerprint: input.walkthrough.fingerprint
    })
  ];
}

function findAcceptanceEntity(
  acceptance: CsvOperatorAcceptanceChecklist,
  entity: CsvReleaseExceptionEntity
): CsvOperatorAcceptanceEntityChecklist {
  const checklist = acceptance.entities.find((entry) => entry.entity === entity);

  if (checklist === undefined) {
    throw new Error(`Missing CSV release exception acceptance entity ${entity}`);
  }

  return checklist;
}

function findAcceptanceOperation(
  acceptance: CsvOperatorAcceptanceChecklist,
  operation: CsvReleaseExceptionOperation
): CsvOperatorAcceptanceOperationChecklist {
  const checklist = acceptance.operations.find(
    (entry) => entry.operation === operation
  );

  if (checklist === undefined) {
    throw new Error(
      `Missing CSV release exception acceptance operation ${operation}`
    );
  }

  return checklist;
}

function findAcceptanceItem(input: {
  entity: CsvOperatorAcceptanceEntityChecklist;
  operation: CsvReleaseExceptionOperation;
}): CsvOperatorAcceptanceChecklistItem {
  const item = input.entity.items.find(
    (candidate) => candidate.operation === input.operation
  );

  if (item === undefined) {
    throw new Error(
      `Missing CSV release exception acceptance item ${input.operation} for ${input.entity.entity}`
    );
  }

  return item;
}

function findFixtureEntity(
  fixture: CsvOperatorFixtureBundle,
  entity: CsvReleaseExceptionEntity
): CsvOperatorFixtureEntityBundle {
  const bundle = fixture.entities.find((entry) => entry.entity === entity);

  if (bundle === undefined) {
    throw new Error(`Missing CSV release exception fixture entity ${entity}`);
  }

  return bundle;
}

function findFixtureOperation(
  fixture: CsvOperatorFixtureBundle,
  operation: CsvReleaseExceptionOperation
): CsvOperatorFixtureOperationBundle {
  const bundle = fixture.operations.find((entry) => entry.operation === operation);

  if (bundle === undefined) {
    throw new Error(
      `Missing CSV release exception fixture operation ${operation}`
    );
  }

  return bundle;
}

function findFixtureEntityOperation(input: {
  entity: CsvOperatorFixtureEntityBundle;
  operation: CsvReleaseExceptionOperation;
}): CsvOperatorFixtureEntityOperation {
  const operation = input.entity.operations.find(
    (candidate) => candidate.operation === input.operation
  );

  if (operation === undefined) {
    throw new Error(
      `Missing CSV release exception fixture item ${input.operation} for ${input.entity.entity}`
    );
  }

  return operation;
}

function findWalkthroughEntity(
  walkthrough: CsvOperatorWalkthroughManifest,
  entity: CsvReleaseExceptionEntity
): CsvOperatorWalkthroughEntityManifest {
  const manifest = walkthrough.entities.find((entry) => entry.entity === entity);

  if (manifest === undefined) {
    throw new Error(
      `Missing CSV release exception walkthrough entity ${entity}`
    );
  }

  return manifest;
}

function findWalkthroughOperation(
  walkthrough: CsvOperatorWalkthroughManifest,
  operation: CsvReleaseExceptionOperation
): CsvOperatorWalkthroughOperationManifest {
  const manifest = walkthrough.operations.find(
    (entry) => entry.operation === operation
  );

  if (manifest === undefined) {
    throw new Error(
      `Missing CSV release exception walkthrough operation ${operation}`
    );
  }

  return manifest;
}

function findWalkthroughItem(input: {
  entity: CsvOperatorWalkthroughEntityManifest;
  operation: CsvReleaseExceptionOperation;
}): CsvOperatorWalkthroughItem {
  const item = input.entity.items.find(
    (candidate) => candidate.operation === input.operation
  );

  if (item === undefined) {
    throw new Error(
      `Missing CSV release exception walkthrough item ${input.operation} for ${input.entity.entity}`
    );
  }

  return item;
}

function findClosureOperation(
  closure: CsvReleaseClosureScorecard,
  operation: CsvReleaseExceptionOperation
): CsvReleaseClosureOperationScorecard {
  const scorecard = closure.operations.find(
    (entry) => entry.operation === operation
  );

  if (scorecard === undefined) {
    throw new Error(
      `Missing CSV release exception closure operation ${operation}`
    );
  }

  return scorecard;
}

function exceptionStatusCounts(
  entries: readonly CsvReleaseExceptionRegisterEntry[]
): CsvReleaseClosureStatusCounts {
  return {
    ready: 0,
    watch: entries.filter((entry) => entry.severity === "watch").length,
    block: entries.filter((entry) => entry.severity === "block").length
  };
}

function acceptanceExceptionStatusCounts(
  entries: readonly CsvReleaseExceptionRegisterEntry[]
): CsvOperatorAcceptanceChecklistStatusCounts {
  return {
    pass: 0,
    watch: entries.filter((entry) => entry.acceptance.status === "watch").length,
    block: entries.filter((entry) => entry.acceptance.status === "block").length
  };
}

function walkthroughExceptionStatusCounts(
  entries: readonly CsvReleaseExceptionRegisterEntry[]
): CsvOperatorWalkthroughStatusCounts {
  return {
    pass: 0,
    watch: entries.filter((entry) => entry.walkthrough.status === "watch").length,
    block: entries.filter((entry) => entry.walkthrough.status === "block").length
  };
}

function buildEntryFingerprint(input: {
  id: string;
  severity: CsvReleaseExceptionSeverity;
  sourceFingerprints: readonly CsvReleaseExceptionSourceFingerprint[];
  closure: CsvReleaseExceptionClosureAnchor;
  acceptance: CsvReleaseExceptionAcceptanceAnchor;
  fixture: CsvReleaseExceptionFixtureAnchor;
  walkthrough: CsvReleaseExceptionWalkthroughAnchor;
}): string {
  return digestPayload({
    id: input.id,
    severity: input.severity,
    source: input.sourceFingerprints,
    closure: {
      status: input.closure.status,
      releaseStatus: input.closure.releaseStatus,
      acceptanceStatus: input.closure.acceptanceStatus,
      exceptionCheckCodes: input.closure.exceptionCheckCodes
    },
    acceptance: {
      status: input.acceptance.status,
      exceptionCriterionCodes: input.acceptance.exceptionCriterionCodes,
      issueCount: input.acceptance.issueCount,
      remediationCount: input.acceptance.remediationCount,
      nextAction: input.acceptance.nextAction
    },
    fixture: {
      available: input.fixture.availability.available,
      kind: input.fixture.availability.kind,
      missingCount: input.fixture.coverage.missingCount,
      fixtureStatus: input.fixture.fixtureStatus
    },
    walkthrough: {
      status: input.walkthrough.status,
      exceptionStepCodes: input.walkthrough.exceptionStepCodes,
      watchNoteCount: input.walkthrough.watchNotes.length,
      blockingNoteCount: input.walkthrough.blockingNotes.length
    }
  });
}

function buildEntry(input: {
  closureItem: CsvReleaseClosureItem;
  acceptanceItem: CsvOperatorAcceptanceChecklistItem;
  fixtureOperation: CsvOperatorFixtureEntityOperation;
  walkthroughItem: CsvOperatorWalkthroughItem;
  sourceFingerprints: readonly CsvReleaseExceptionSourceFingerprint[];
}): CsvReleaseExceptionRegisterEntry | null {
  const severity = severityFromStatus(input.closureItem.status);

  if (severity === null) {
    return null;
  }

  const closure: CsvReleaseExceptionClosureAnchor = {
    status: input.closureItem.status,
    releaseStatus: input.closureItem.releaseStatus,
    acceptanceStatus: input.closureItem.acceptanceStatus,
    checkStatusCounts: input.closureItem.checkStatusCounts,
    exceptionCheckCodes: input.closureItem.checks
      .filter((check) => check.status !== "ready")
      .map((check) => check.code),
    warningCodes: input.closureItem.warningCodes,
    sourceCodes: input.closureItem.sourceCodes
  };
  const acceptance: CsvReleaseExceptionAcceptanceAnchor = {
    status: input.acceptanceItem.status,
    criteriaCounts: input.acceptanceItem.criteriaCounts,
    exceptionCriterionCodes: input.acceptanceItem.criteria
      .filter((criterion) => criterion.status !== "pass")
      .map((criterion) => criterion.code),
    issueCount: input.acceptanceItem.issueCount,
    remediationCount: input.acceptanceItem.remediationCount,
    nextAction: input.acceptanceItem.nextAction
  };
  const fixture: CsvReleaseExceptionFixtureAnchor = {
    availability: input.fixtureOperation.fixture,
    coverage: input.closureItem.fixtureCoverage,
    fixtureStatus: input.fixtureOperation.status,
    supported: input.fixtureOperation.supported
  };
  const walkthrough: CsvReleaseExceptionWalkthroughAnchor = {
    status: input.walkthroughItem.status,
    stepCount: input.walkthroughItem.stepCount,
    watchNoteCount: input.walkthroughItem.watchNoteCount,
    blockingNoteCount: input.walkthroughItem.blockingNoteCount,
    statusCounts: {
      pass: input.walkthroughItem.steps.filter((step) => step.status === "pass")
        .length,
      watch: input.walkthroughItem.steps.filter((step) => step.status === "watch")
        .length,
      block: input.walkthroughItem.steps.filter((step) => step.status === "block")
        .length
    },
    exceptionStepCodes: input.walkthroughItem.steps
      .filter((step) => step.status !== "pass")
      .map((step) => step.code),
    watchNotes: uniqueStrings(
      input.walkthroughItem.steps.flatMap((step) => step.watchNotes)
    ),
    blockingNotes: uniqueStrings(
      input.walkthroughItem.steps.flatMap((step) => step.blockingNotes)
    )
  };
  const fingerprint = buildEntryFingerprint({
    id: input.closureItem.id,
    severity,
    sourceFingerprints: input.sourceFingerprints,
    closure,
    acceptance,
    fixture,
    walkthrough
  });

  return {
    id: input.closureItem.id,
    order: 0,
    entity: input.closureItem.entity,
    label: input.closureItem.label,
    route: input.closureItem.route,
    operation: input.closureItem.operation,
    severity,
    status: input.closureItem.status,
    fingerprint,
    supported: input.closureItem.supported,
    fixtureAvailable: input.closureItem.fixture.available,
    fixtureKind: input.closureItem.fixture.kind,
    closure,
    acceptance,
    fixture,
    walkthrough,
    remediation: {
      nextAction: input.acceptanceItem.nextAction,
      warningCodes: uniqueStrings([
        ...input.closureItem.warningCodes,
        ...input.acceptanceItem.warningCodes
      ]),
      sourceCodes: uniqueStrings([
        ...input.closureItem.sourceCodes,
        ...input.acceptanceItem.sourceCodes
      ]),
      issueCount: input.acceptanceItem.issueCount,
      remediationCount: input.acceptanceItem.remediationCount
    },
    sourceFingerprints: input.sourceFingerprints,
    sourceContentTypes: uniqueStrings([
      ...input.closureItem.sourceContentTypes,
      ...input.acceptanceItem.sourceContentTypes,
      ...input.walkthroughItem.sourceContentTypes,
      ...input.sourceFingerprints.map((source) => source.contentType)
    ]),
    read: combineReads([
      input.closureItem.read,
      input.acceptanceItem.read,
      input.fixtureOperation.read,
      input.walkthroughItem.read
    ]),
    write: noWrites()
  };
}

function severityRank(severity: CsvReleaseExceptionSeverity): number {
  return severity === "block" ? 0 : 1;
}

function sortEntries(
  entries: readonly CsvReleaseExceptionRegisterEntry[]
): CsvReleaseExceptionRegisterEntry[] {
  return entries
    .slice()
    .sort(
      (left, right) =>
        severityRank(left.severity) - severityRank(right.severity) ||
        left.entity.localeCompare(right.entity) ||
        left.operation.localeCompare(right.operation)
    )
    .map((entry, index) => ({
      ...entry,
      order: index + 1
    }));
}

function buildEntityFingerprint(input: {
  sourceFingerprints: readonly CsvReleaseExceptionSourceFingerprint[];
  entity: CsvReleaseExceptionEntity;
  status: CsvReleaseExceptionStatus;
  entries: readonly CsvReleaseExceptionRegisterEntry[];
}): string {
  return digestPayload({
    source: input.sourceFingerprints,
    entity: input.entity,
    status: input.status,
    entries: input.entries.map((entry) => ({
      id: entry.id,
      severity: entry.severity,
      fingerprint: entry.fingerprint
    }))
  });
}

function buildEntityRegister(input: {
  closureEntity: CsvReleaseClosureEntityScorecard;
  closure: CsvReleaseClosureScorecard;
  acceptance: CsvOperatorAcceptanceChecklist;
  fixture: CsvOperatorFixtureBundle;
  walkthrough: CsvOperatorWalkthroughManifest;
  source: CsvReleaseExceptionSource;
}): CsvReleaseExceptionEntityRegister {
  const acceptanceEntity = findAcceptanceEntity(
    input.acceptance,
    input.closureEntity.entity
  );
  const fixtureEntity = findFixtureEntity(input.fixture, input.closureEntity.entity);
  const walkthroughEntity = findWalkthroughEntity(
    input.walkthrough,
    input.closureEntity.entity
  );
  const sourceFingerprints = entitySourceFingerprints({
    closure: input.closureEntity,
    acceptance: acceptanceEntity,
    fixture: fixtureEntity,
    walkthrough: walkthroughEntity
  });
  const entries = sortEntries(
    input.closureEntity.items
      .map((closureItem) => {
        const operation = closureItem.operation;
        const operationSourceFingerprints = operationSourceFingerprintsForItem({
          closure: input.closure,
          acceptance: input.acceptance,
          fixture: input.fixture,
          walkthrough: input.walkthrough,
          operation
        });

        return buildEntry({
          closureItem,
          acceptanceItem: findAcceptanceItem({
            entity: acceptanceEntity,
            operation
          }),
          fixtureOperation: findFixtureEntityOperation({
            entity: fixtureEntity,
            operation
          }),
          walkthroughItem: findWalkthroughItem({
            entity: walkthroughEntity,
            operation
          }),
          sourceFingerprints: [
            ...sourceFingerprints,
            ...operationSourceFingerprints
          ]
        });
      })
      .filter((entry): entry is CsvReleaseExceptionRegisterEntry => entry !== null)
  );
  const severityCounts = countSeverities(entries);
  const status = statusFromSeverityCounts(severityCounts);
  const fingerprint = buildEntityFingerprint({
    sourceFingerprints,
    entity: input.closureEntity.entity,
    status,
    entries
  });

  return {
    contentType: CSV_RELEASE_EXCEPTION_REGISTER_CONTENT_TYPE,
    registerVersion: 1,
    entity: input.closureEntity.entity,
    label: input.closureEntity.label,
    route: input.closureEntity.route,
    direction: input.closureEntity.direction,
    status,
    fingerprint,
    exceptionCount: entries.length,
    watchExceptionCount: severityCounts.watch,
    blockExceptionCount: severityCounts.block,
    supportedExceptionCount: entries.filter((entry) => entry.supported).length,
    unsupportedExceptionCount: entries.filter((entry) => !entry.supported).length,
    missingFixtureExceptionCount: entries.filter(
      (entry) => !entry.fixtureAvailable
    ).length,
    severityCounts,
    closureStatusCounts: exceptionStatusCounts(entries),
    acceptanceStatusCounts: acceptanceExceptionStatusCounts(entries),
    walkthroughStatusCounts: walkthroughExceptionStatusCounts(entries),
    warningCodes: uniqueStrings(
      entries.flatMap((entry) => entry.remediation.warningCodes)
    ),
    sourceCodes: uniqueStrings(
      entries.flatMap((entry) => entry.remediation.sourceCodes)
    ),
    entries,
    sourceFingerprints,
    sourceContentTypes: uniqueStrings([
      CSV_RELEASE_EXCEPTION_REGISTER_CONTENT_TYPE,
      ...sourceFingerprints.map((source) => source.contentType),
      ...entries.flatMap((entry) => entry.sourceContentTypes)
    ]),
    source: input.source,
    read: combineReads([
      input.closureEntity.read,
      acceptanceEntity.read,
      fixtureEntity.read,
      walkthroughEntity.read,
      ...entries.map((entry) => entry.read)
    ]),
    write: noWrites()
  };
}

function operationSourceFingerprintsForItem(input: {
  closure: CsvReleaseClosureScorecard;
  acceptance: CsvOperatorAcceptanceChecklist;
  fixture: CsvOperatorFixtureBundle;
  walkthrough: CsvOperatorWalkthroughManifest;
  operation: CsvReleaseExceptionOperation;
}): CsvReleaseExceptionSourceFingerprint[] {
  return operationSourceFingerprints({
    closure: findClosureOperation(input.closure, input.operation),
    acceptance: findAcceptanceOperation(input.acceptance, input.operation),
    fixture: findFixtureOperation(input.fixture, input.operation),
    walkthrough: findWalkthroughOperation(input.walkthrough, input.operation)
  });
}

function buildOperationFingerprint(input: {
  sourceFingerprints: readonly CsvReleaseExceptionSourceFingerprint[];
  operation: CsvReleaseExceptionOperation;
  status: CsvReleaseExceptionStatus;
  entries: readonly CsvReleaseExceptionRegisterEntry[];
}): string {
  return digestPayload({
    source: input.sourceFingerprints,
    operation: input.operation,
    status: input.status,
    entries: input.entries.map((entry) => ({
      id: entry.id,
      severity: entry.severity,
      fingerprint: entry.fingerprint
    }))
  });
}

function buildOperationRegister(input: {
  closureOperation: CsvReleaseClosureOperationScorecard;
  acceptance: CsvOperatorAcceptanceChecklist;
  fixture: CsvOperatorFixtureBundle;
  walkthrough: CsvOperatorWalkthroughManifest;
  entityRegisters: readonly CsvReleaseExceptionEntityRegister[];
  source: CsvReleaseExceptionSource;
}): CsvReleaseExceptionOperationRegister {
  const acceptanceOperation = findAcceptanceOperation(
    input.acceptance,
    input.closureOperation.operation
  );
  const fixtureOperation = findFixtureOperation(
    input.fixture,
    input.closureOperation.operation
  );
  const walkthroughOperation = findWalkthroughOperation(
    input.walkthrough,
    input.closureOperation.operation
  );
  const sourceFingerprints = operationSourceFingerprints({
    closure: input.closureOperation,
    acceptance: acceptanceOperation,
    fixture: fixtureOperation,
    walkthrough: walkthroughOperation
  });
  const entries = sortEntries(
    input.entityRegisters.flatMap((entity) =>
      entity.entries.filter(
        (entry) => entry.operation === input.closureOperation.operation
      )
    )
  );
  const severityCounts = countSeverities(entries);
  const status = statusFromSeverityCounts(severityCounts);
  const fingerprint = buildOperationFingerprint({
    sourceFingerprints,
    operation: input.closureOperation.operation,
    status,
    entries
  });

  return {
    contentType: CSV_RELEASE_EXCEPTION_REGISTER_CONTENT_TYPE,
    registerVersion: 1,
    operation: input.closureOperation.operation,
    status,
    fingerprint,
    exceptionCount: entries.length,
    watchExceptionCount: severityCounts.watch,
    blockExceptionCount: severityCounts.block,
    supportedExceptionCount: entries.filter((entry) => entry.supported).length,
    unsupportedExceptionCount: entries.filter((entry) => !entry.supported).length,
    missingFixtureExceptionCount: entries.filter(
      (entry) => !entry.fixtureAvailable
    ).length,
    severityCounts,
    closureStatusCounts: exceptionStatusCounts(entries),
    acceptanceStatusCounts: acceptanceExceptionStatusCounts(entries),
    walkthroughStatusCounts: walkthroughExceptionStatusCounts(entries),
    warningCodes: uniqueStrings(
      entries.flatMap((entry) => entry.remediation.warningCodes)
    ),
    sourceCodes: uniqueStrings(
      entries.flatMap((entry) => entry.remediation.sourceCodes)
    ),
    entries,
    sourceFingerprints,
    sourceContentTypes: uniqueStrings([
      CSV_RELEASE_EXCEPTION_REGISTER_CONTENT_TYPE,
      ...sourceFingerprints.map((source) => source.contentType),
      ...entries.flatMap((entry) => entry.sourceContentTypes)
    ]),
    source: input.source,
    read: combineReads([
      input.closureOperation.read,
      acceptanceOperation.read,
      fixtureOperation.read,
      walkthroughOperation.read,
      ...entries.map((entry) => entry.read)
    ]),
    write: noWrites()
  };
}

function buildRegisterFingerprint(input: {
  sourceFingerprints: readonly CsvReleaseExceptionSourceFingerprint[];
  status: CsvReleaseExceptionStatus;
  entities: readonly CsvReleaseExceptionEntityRegister[];
  operations: readonly CsvReleaseExceptionOperationRegister[];
}): string {
  return digestPayload({
    source: input.sourceFingerprints,
    status: input.status,
    entities: input.entities.map((entity) => ({
      entity: entity.entity,
      status: entity.status,
      fingerprint: entity.fingerprint,
      exceptionCount: entity.exceptionCount
    })),
    operations: input.operations.map((operation) => ({
      operation: operation.operation,
      status: operation.status,
      fingerprint: operation.fingerprint,
      exceptionCount: operation.exceptionCount
    }))
  });
}

export function isCsvReleaseExceptionEntity(
  value: string
): value is CsvReleaseExceptionEntity {
  return (
    isCsvReleaseClosureEntity(value) &&
    isCsvOperatorAcceptanceChecklistEntity(value) &&
    isCsvOperatorFixtureBundleEntity(value) &&
    isCsvOperatorWalkthroughEntity(value)
  );
}

export function isCsvReleaseExceptionOperation(
  value: string
): value is CsvReleaseExceptionOperation {
  return (
    isCsvReleaseClosureOperation(value) &&
    isCsvOperatorAcceptanceChecklistOperation(value) &&
    isCsvOperatorFixtureBundleOperation(value) &&
    isCsvOperatorWalkthroughOperation(value)
  );
}

export async function getCsvReleaseExceptionRegister(
  options: CsvReleaseExceptionRegisterOptions = {}
): Promise<CsvReleaseExceptionRegister> {
  const [closure, acceptance, fixture, walkthrough] = await Promise.all([
    getCsvReleaseClosureScorecard(options),
    getCsvOperatorAcceptanceChecklist(options),
    getCsvOperatorFixtureBundle(options),
    getCsvOperatorWalkthroughManifest(options)
  ]);
  const source = buildSource({ closure, acceptance, fixture, walkthrough });
  const entities = closure.entities.map((closureEntity) =>
    buildEntityRegister({
      closureEntity,
      closure,
      acceptance,
      fixture,
      walkthrough,
      source
    })
  );
  const operations = closure.operations.map((closureOperation) =>
    buildOperationRegister({
      closureOperation,
      acceptance,
      fixture,
      walkthrough,
      entityRegisters: entities,
      source
    })
  );
  const entries = sortEntries(entities.flatMap((entity) => entity.entries));
  const severityCounts = countSeverities(entries);
  const status = statusFromSeverityCounts(severityCounts);
  const sourceFingerprints = source.sourceFingerprints;
  const fingerprint = buildRegisterFingerprint({
    sourceFingerprints,
    status,
    entities,
    operations
  });

  return {
    contentType: CSV_RELEASE_EXCEPTION_REGISTER_CONTENT_TYPE,
    registerVersion: 1,
    status,
    fingerprint,
    entityCount: entities.length,
    operationCount: operations.length,
    exceptionCount: entries.length,
    watchExceptionCount: severityCounts.watch,
    blockExceptionCount: severityCounts.block,
    supportedExceptionCount: entries.filter((entry) => entry.supported).length,
    unsupportedExceptionCount: entries.filter((entry) => !entry.supported).length,
    missingFixtureExceptionCount: entries.filter(
      (entry) => !entry.fixtureAvailable
    ).length,
    severityCounts,
    entitySeverityCounts: countSeverities(
      entities
        .filter((entity) => entity.status !== "ready")
        .map((entity) => ({
          severity: entity.status === "block" ? "block" : "watch"
        }))
    ),
    operationSeverityCounts: countSeverities(
      operations
        .filter((operation) => operation.status !== "ready")
        .map((operation) => ({
          severity: operation.status === "block" ? "block" : "watch"
        }))
    ),
    closureStatusCounts: exceptionStatusCounts(entries),
    acceptanceStatusCounts: acceptanceExceptionStatusCounts(entries),
    walkthroughStatusCounts: walkthroughExceptionStatusCounts(entries),
    warningCodes: uniqueStrings(
      entries.flatMap((entry) => entry.remediation.warningCodes)
    ),
    sourceCodes: uniqueStrings(
      entries.flatMap((entry) => entry.remediation.sourceCodes)
    ),
    entries,
    entities,
    operations,
    sourceFingerprints,
    sourceContentTypes: uniqueStrings([
      CSV_RELEASE_EXCEPTION_REGISTER_CONTENT_TYPE,
      closure.contentType,
      acceptance.contentType,
      fixture.contentType,
      walkthrough.contentType,
      ...closure.sourceContentTypes,
      ...acceptance.sourceContentTypes,
      ...fixture.sourceContentTypes,
      ...walkthrough.sourceContentTypes,
      ...entities.flatMap((entity) => entity.sourceContentTypes),
      ...operations.flatMap((operation) => operation.sourceContentTypes)
    ]),
    source,
    read: combineReads([
      closure.read,
      acceptance.read,
      fixture.read,
      walkthrough.read,
      ...entities.map((entity) => entity.read),
      ...operations.map((operation) => operation.read)
    ]),
    write: noWrites()
  };
}

export async function listCsvReleaseExceptionEntityRegisters(
  options: CsvReleaseExceptionRegisterOptions = {}
): Promise<CsvReleaseExceptionEntityRegister[]> {
  return (await getCsvReleaseExceptionRegister(options)).entities.slice();
}

export async function getCsvReleaseExceptionEntityRegister(
  entity: string,
  options: CsvReleaseExceptionRegisterOptions = {}
): Promise<CsvReleaseExceptionEntityRegister | null> {
  if (!isCsvReleaseExceptionEntity(entity)) {
    return null;
  }

  const register = await getCsvReleaseExceptionRegister(options);

  return register.entities.find((entry) => entry.entity === entity) ?? null;
}

export async function listCsvReleaseExceptionOperationRegisters(
  options: CsvReleaseExceptionRegisterOptions = {}
): Promise<CsvReleaseExceptionOperationRegister[]> {
  return (await getCsvReleaseExceptionRegister(options)).operations.slice();
}

export async function getCsvReleaseExceptionOperationRegister(
  operation: string,
  options: CsvReleaseExceptionRegisterOptions = {}
): Promise<CsvReleaseExceptionOperationRegister | null> {
  if (!isCsvReleaseExceptionOperation(operation)) {
    return null;
  }

  const register = await getCsvReleaseExceptionRegister(options);

  return (
    register.operations.find((entry) => entry.operation === operation) ?? null
  );
}
