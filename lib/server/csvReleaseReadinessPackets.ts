import { createHash } from "node:crypto";
import {
  CSV_CONTRACT_RELEASE_DIGEST_CONTENT_TYPE,
  getCsvContractReleaseDigest,
  isCsvContractReleaseDigestOperation,
  type CsvContractReleaseDigest,
  type CsvContractReleaseDigestReadFlags,
  type CsvContractReleaseDigestStatus,
  type CsvContractReleaseOperationDigest
} from "@/lib/server/csvContractReleaseDigest";
import {
  CSV_RELEASE_CLOSURE_SCORECARD_CONTENT_TYPE,
  getCsvReleaseClosureScorecard,
  isCsvReleaseClosureEntity,
  isCsvReleaseClosureOperation,
  type CsvReleaseClosureEntityScorecard,
  type CsvReleaseClosureItem,
  type CsvReleaseClosureOperationScorecard,
  type CsvReleaseClosureReadFlags,
  type CsvReleaseClosureScorecard,
  type CsvReleaseClosureStatus,
  type CsvReleaseClosureStatusCounts
} from "@/lib/server/csvReleaseClosureScorecards";
import {
  CSV_RELEASE_DISPOSITION_MANIFEST_CONTENT_TYPE,
  getCsvReleaseDispositionManifest,
  isCsvReleaseDispositionEntity,
  isCsvReleaseDispositionOperation,
  type CsvReleaseDispositionEntity,
  type CsvReleaseDispositionEntityManifest,
  type CsvReleaseDispositionItem,
  type CsvReleaseDispositionManifest,
  type CsvReleaseDispositionManifestOptions,
  type CsvReleaseDispositionOperation,
  type CsvReleaseDispositionOperationManifest,
  type CsvReleaseDispositionReadFlags,
  type CsvReleaseDispositionStatusCounts
} from "@/lib/server/csvReleaseDispositionManifests";
import {
  CSV_RELEASE_EXCEPTION_REGISTER_CONTENT_TYPE,
  getCsvReleaseExceptionRegister,
  isCsvReleaseExceptionEntity,
  isCsvReleaseExceptionOperation,
  type CsvReleaseExceptionEntityRegister,
  type CsvReleaseExceptionOperationRegister,
  type CsvReleaseExceptionReadFlags,
  type CsvReleaseExceptionRegister,
  type CsvReleaseExceptionRegisterEntry,
  type CsvReleaseExceptionSeverity,
  type CsvReleaseExceptionSeverityCounts
} from "@/lib/server/csvReleaseExceptionRegisters";
import {
  CSV_RELEASE_VERIFICATION_MANIFEST_CONTENT_TYPE,
  getCsvReleaseVerificationManifest,
  isCsvReleaseVerificationManifestEntity,
  isCsvReleaseVerificationManifestOperation,
  type CsvReleaseVerificationEntityCoverage,
  type CsvReleaseVerificationEntityOperationCoverage,
  type CsvReleaseVerificationManifest,
  type CsvReleaseVerificationOperationCoverage,
  type CsvReleaseVerificationReadFlags,
  type CsvReleaseVerificationStatusCounts
} from "@/lib/server/csvReleaseVerificationManifests";

export const CSV_RELEASE_READINESS_PACKET_CONTENT_TYPE =
  "application/json; charset=utf-8" as const;

export type CsvReleaseReadinessPacketOptions =
  CsvReleaseDispositionManifestOptions;
export type CsvReleaseReadinessEntity = CsvReleaseDispositionEntity;
export type CsvReleaseReadinessOperation = CsvReleaseDispositionOperation;
export type CsvReleaseReadinessStatus = "pass" | "watch" | "block";

export type CsvReleaseReadinessStatusCounts = {
  pass: number;
  watch: number;
  block: number;
};

export type CsvReleaseReadinessReadFlags = {
  metadata: true;
  database: boolean;
  csvInput: boolean;
  csvOutput: boolean;
};

export type CsvReleaseReadinessWriteFlags = {
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

export type CsvReleaseReadinessSourceName =
  | "release-disposition-manifest"
  | "contract-release-digest"
  | "release-verification-manifest"
  | "release-closure-scorecard"
  | "release-exception-register";

export type CsvReleaseReadinessSourceScope =
  | "root"
  | "entity"
  | "operation"
  | "item";

export type CsvReleaseReadinessSourceFingerprint = {
  source: CsvReleaseReadinessSourceName;
  scope: CsvReleaseReadinessSourceScope;
  key: string | null;
  contentType: string;
  fingerprint: string;
};

export type CsvReleaseReadinessSource = {
  releaseDispositionContentType:
    typeof CSV_RELEASE_DISPOSITION_MANIFEST_CONTENT_TYPE;
  releaseDispositionManifestVersion: 1;
  releaseDispositionFingerprint: string;
  releaseDigestContentType: typeof CSV_CONTRACT_RELEASE_DIGEST_CONTENT_TYPE;
  releaseDigestVersion: 1;
  releaseDigestFingerprint: string;
  releaseVerificationContentType:
    typeof CSV_RELEASE_VERIFICATION_MANIFEST_CONTENT_TYPE;
  releaseVerificationManifestVersion: 1;
  releaseVerificationFingerprint: string;
  releaseClosureContentType: typeof CSV_RELEASE_CLOSURE_SCORECARD_CONTENT_TYPE;
  releaseClosureScorecardVersion: 1;
  releaseClosureFingerprint: string;
  releaseExceptionContentType:
    typeof CSV_RELEASE_EXCEPTION_REGISTER_CONTENT_TYPE;
  releaseExceptionRegisterVersion: 1;
  releaseExceptionFingerprint: string;
  sourceFingerprints: readonly CsvReleaseReadinessSourceFingerprint[];
};

export type CsvReleaseReadinessRemediationAnchor = {
  severity: CsvReleaseExceptionSeverity;
  status: CsvReleaseReadinessStatus;
  order: number;
  sourceFingerprint: string;
  nextAction: CsvReleaseExceptionRegisterEntry["remediation"]["nextAction"];
  warningCodes: readonly string[];
  sourceCodes: readonly string[];
  issueCount: number;
  remediationCount: number;
};

export type CsvReleaseReadinessConsumerSummary = {
  title: string;
  status: CsvReleaseReadinessStatus;
  statusLabel: "ready-for-consumption" | "review-before-consumption" | "blocked";
  summary: string;
  highlights: readonly string[];
  caveats: readonly string[];
  nextActions: readonly string[];
  passTotal: number;
  watchTotal: number;
  blockTotal: number;
  remediationAnchorCount: number;
  safeForCurrentSprint: boolean;
  requiresContractChange: boolean;
  noWriteGuarantee: string;
};

export type CsvReleaseReadinessTrace = {
  disposition: {
    status: CsvReleaseDispositionItem["status"];
    fingerprint: string;
    supported: boolean;
    fixtureAvailable: boolean;
    fixtureKind: CsvReleaseDispositionItem["fixtureKind"];
  };
  verification: {
    status: CsvReleaseVerificationEntityOperationCoverage["status"];
    supported: boolean;
    driftFingerprint: string;
    warningCodes: readonly string[];
    sourceCodes: readonly string[];
  };
  closure: {
    status: CsvReleaseClosureItem["status"];
    releaseStatus: CsvReleaseClosureItem["releaseStatus"];
    acceptanceStatus: CsvReleaseClosureItem["acceptanceStatus"];
    checkStatusCounts: CsvReleaseClosureStatusCounts;
    fixtureCoverage: CsvReleaseClosureItem["fixtureCoverage"];
  };
  exception: {
    severity: CsvReleaseExceptionSeverity;
    status: CsvReleaseExceptionRegisterEntry["status"];
    fingerprint: string;
    remediation: CsvReleaseReadinessRemediationAnchor;
  } | null;
  releaseDigest: {
    operationStatus: CsvContractReleaseDigestStatus;
    releaseNoteStatus: CsvContractReleaseOperationDigest["releaseNote"]["statusLabel"];
    safeForCurrentSprint: boolean;
    requiresContractChange: boolean;
  };
};

export type CsvReleaseReadinessItem = {
  id: string;
  entity: CsvReleaseReadinessEntity;
  label: string;
  route: string | null;
  operation: CsvReleaseReadinessOperation;
  status: CsvReleaseReadinessStatus;
  fingerprint: string;
  supported: boolean;
  fixtureAvailable: boolean;
  hasException: boolean;
  exceptionSeverity: CsvReleaseExceptionSeverity | null;
  warningCodes: readonly string[];
  sourceCodes: readonly string[];
  remediationAnchors: readonly CsvReleaseReadinessRemediationAnchor[];
  trace: CsvReleaseReadinessTrace;
  sourceFingerprints: readonly CsvReleaseReadinessSourceFingerprint[];
  sourceContentTypes: readonly string[];
  read: CsvReleaseReadinessReadFlags;
  write: CsvReleaseReadinessWriteFlags;
};

export type CsvReleaseReadinessEntityPacket = {
  contentType: typeof CSV_RELEASE_READINESS_PACKET_CONTENT_TYPE;
  packetVersion: 1;
  entity: CsvReleaseReadinessEntity;
  label: string;
  route: string | null;
  direction: CsvReleaseDispositionEntityManifest["direction"];
  status: CsvReleaseReadinessStatus;
  fingerprint: string;
  operationCount: number;
  supportedOperationCount: number;
  unsupportedOperationCount: number;
  fixtureOperationCount: number;
  readinessCount: number;
  passReadinessCount: number;
  watchReadinessCount: number;
  blockReadinessCount: number;
  supportedReadinessCount: number;
  unsupportedReadinessCount: number;
  missingFixtureReadinessCount: number;
  remediationAnchorCount: number;
  watchRemediationAnchorCount: number;
  blockRemediationAnchorCount: number;
  statusCounts: CsvReleaseReadinessStatusCounts;
  dispositionStatusCounts: CsvReleaseReadinessStatusCounts;
  verificationStatusCounts: CsvReleaseReadinessStatusCounts;
  closureStatusCounts: CsvReleaseReadinessStatusCounts;
  exceptionSeverityCounts: CsvReleaseExceptionSeverityCounts;
  warningCodes: readonly string[];
  sourceCodes: readonly string[];
  releaseConsumerSummary: CsvReleaseReadinessConsumerSummary;
  items: readonly CsvReleaseReadinessItem[];
  sourceFingerprints: readonly CsvReleaseReadinessSourceFingerprint[];
  sourceContentTypes: readonly string[];
  source: CsvReleaseReadinessSource;
  read: CsvReleaseReadinessReadFlags;
  write: CsvReleaseReadinessWriteFlags;
};

export type CsvReleaseReadinessOperationPacket = {
  contentType: typeof CSV_RELEASE_READINESS_PACKET_CONTENT_TYPE;
  packetVersion: 1;
  operation: CsvReleaseReadinessOperation;
  status: CsvReleaseReadinessStatus;
  fingerprint: string;
  entityCount: number;
  supportedEntityCount: number;
  unsupportedEntityCount: number;
  fixtureEntityCount: number;
  readinessCount: number;
  passReadinessCount: number;
  watchReadinessCount: number;
  blockReadinessCount: number;
  supportedReadinessCount: number;
  unsupportedReadinessCount: number;
  missingFixtureReadinessCount: number;
  remediationAnchorCount: number;
  watchRemediationAnchorCount: number;
  blockRemediationAnchorCount: number;
  statusCounts: CsvReleaseReadinessStatusCounts;
  dispositionStatusCounts: CsvReleaseReadinessStatusCounts;
  verificationStatusCounts: CsvReleaseReadinessStatusCounts;
  closureStatusCounts: CsvReleaseReadinessStatusCounts;
  exceptionSeverityCounts: CsvReleaseExceptionSeverityCounts;
  warningCodes: readonly string[];
  sourceCodes: readonly string[];
  releaseConsumerSummary: CsvReleaseReadinessConsumerSummary;
  items: readonly CsvReleaseReadinessItem[];
  sourceFingerprints: readonly CsvReleaseReadinessSourceFingerprint[];
  sourceContentTypes: readonly string[];
  source: CsvReleaseReadinessSource;
  read: CsvReleaseReadinessReadFlags;
  write: CsvReleaseReadinessWriteFlags;
};

export type CsvReleaseReadinessPacket = {
  contentType: typeof CSV_RELEASE_READINESS_PACKET_CONTENT_TYPE;
  packetVersion: 1;
  status: CsvReleaseReadinessStatus;
  fingerprint: string;
  entityCount: number;
  operationCount: number;
  readinessCount: number;
  passReadinessCount: number;
  watchReadinessCount: number;
  blockReadinessCount: number;
  supportedReadinessCount: number;
  unsupportedReadinessCount: number;
  missingFixtureReadinessCount: number;
  remediationAnchorCount: number;
  watchRemediationAnchorCount: number;
  blockRemediationAnchorCount: number;
  statusCounts: CsvReleaseReadinessStatusCounts;
  entityStatusCounts: CsvReleaseReadinessStatusCounts;
  operationStatusCounts: CsvReleaseReadinessStatusCounts;
  dispositionStatusCounts: CsvReleaseReadinessStatusCounts;
  verificationStatusCounts: CsvReleaseReadinessStatusCounts;
  closureStatusCounts: CsvReleaseReadinessStatusCounts;
  exceptionSeverityCounts: CsvReleaseExceptionSeverityCounts;
  warningCodes: readonly string[];
  sourceCodes: readonly string[];
  releaseConsumerSummary: CsvReleaseReadinessConsumerSummary;
  items: readonly CsvReleaseReadinessItem[];
  entities: readonly CsvReleaseReadinessEntityPacket[];
  operations: readonly CsvReleaseReadinessOperationPacket[];
  sourceFingerprints: readonly CsvReleaseReadinessSourceFingerprint[];
  sourceContentTypes: readonly string[];
  source: CsvReleaseReadinessSource;
  read: CsvReleaseReadinessReadFlags;
  write: CsvReleaseReadinessWriteFlags;
};

type ReadFlagInput =
  | CsvContractReleaseDigestReadFlags
  | CsvReleaseVerificationReadFlags
  | CsvReleaseDispositionReadFlags
  | CsvReleaseClosureReadFlags
  | CsvReleaseExceptionReadFlags
  | CsvReleaseReadinessReadFlags;

function noWrites(): CsvReleaseReadinessWriteFlags {
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
): CsvReleaseReadinessReadFlags {
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

function emptyStatusCounts(): CsvReleaseReadinessStatusCounts {
  return {
    pass: 0,
    watch: 0,
    block: 0
  };
}

function emptyExceptionCounts(): CsvReleaseExceptionSeverityCounts {
  return {
    watch: 0,
    block: 0
  };
}

function countStatuses(
  values: readonly { status: CsvReleaseReadinessStatus }[]
): CsvReleaseReadinessStatusCounts {
  const counts = emptyStatusCounts();

  for (const value of values) {
    counts[value.status] += 1;
  }

  return counts;
}

function statusFromCounts(
  counts: CsvReleaseReadinessStatusCounts
): CsvReleaseReadinessStatus {
  if (counts.block > 0) {
    return "block";
  }

  return counts.watch > 0 ? "watch" : "pass";
}

function countExceptionSeverities(
  items: readonly CsvReleaseReadinessItem[]
): CsvReleaseExceptionSeverityCounts {
  const counts = emptyExceptionCounts();

  for (const item of items) {
    if (item.exceptionSeverity !== null) {
      counts[item.exceptionSeverity] += 1;
    }
  }

  return counts;
}

function dispositionStatusCounts(
  counts: CsvReleaseDispositionStatusCounts
): CsvReleaseReadinessStatusCounts {
  return {
    pass: counts.ready,
    watch: counts.watch,
    block: counts.block
  };
}

function closureStatusCounts(
  counts: CsvReleaseClosureStatusCounts
): CsvReleaseReadinessStatusCounts {
  return {
    pass: counts.ready,
    watch: counts.watch,
    block: counts.block
  };
}

function verificationStatusCounts(
  counts: CsvReleaseVerificationStatusCounts
): CsvReleaseReadinessStatusCounts {
  return {
    pass: counts.stable,
    watch: counts.watch,
    block: counts.blocked
  };
}

function readinessFromDispositionStatus(
  status: CsvReleaseDispositionItem["status"]
): CsvReleaseReadinessStatus {
  return status === "ready" ? "pass" : status;
}

function readinessFromClosureStatus(
  status: CsvReleaseClosureStatus
): CsvReleaseReadinessStatus {
  return status === "ready" ? "pass" : status;
}

function readinessFromVerificationStatus(
  status: CsvContractReleaseDigestStatus
): CsvReleaseReadinessStatus {
  switch (status) {
    case "stable":
      return "pass";
    case "watch":
      return "watch";
    case "blocked":
      return "block";
  }
}

function readinessFromExceptionSeverity(
  severity: CsvReleaseExceptionSeverity | null
): CsvReleaseReadinessStatus {
  return severity ?? "pass";
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
  source: CsvReleaseReadinessSourceName;
  scope: CsvReleaseReadinessSourceScope;
  key: string | null;
  contentType: string;
  fingerprint: string;
}): CsvReleaseReadinessSourceFingerprint {
  return {
    source: input.source,
    scope: input.scope,
    key: input.key,
    contentType: input.contentType,
    fingerprint: input.fingerprint
  };
}

function buildSource(input: {
  disposition: CsvReleaseDispositionManifest;
  digest: CsvContractReleaseDigest;
  verification: CsvReleaseVerificationManifest;
  closure: CsvReleaseClosureScorecard;
  exception: CsvReleaseExceptionRegister;
}): CsvReleaseReadinessSource {
  const sourceFingerprints = [
    sourceFingerprint({
      source: "release-disposition-manifest",
      scope: "root",
      key: null,
      contentType: input.disposition.contentType,
      fingerprint: input.disposition.fingerprint
    }),
    sourceFingerprint({
      source: "contract-release-digest",
      scope: "root",
      key: null,
      contentType: input.digest.contentType,
      fingerprint: input.digest.fingerprint
    }),
    sourceFingerprint({
      source: "release-verification-manifest",
      scope: "root",
      key: null,
      contentType: input.verification.contentType,
      fingerprint: input.verification.fingerprint
    }),
    sourceFingerprint({
      source: "release-closure-scorecard",
      scope: "root",
      key: null,
      contentType: input.closure.contentType,
      fingerprint: input.closure.fingerprint
    }),
    sourceFingerprint({
      source: "release-exception-register",
      scope: "root",
      key: null,
      contentType: input.exception.contentType,
      fingerprint: input.exception.fingerprint
    })
  ];

  return {
    releaseDispositionContentType: input.disposition.contentType,
    releaseDispositionManifestVersion: input.disposition.manifestVersion,
    releaseDispositionFingerprint: input.disposition.fingerprint,
    releaseDigestContentType: input.digest.contentType,
    releaseDigestVersion: input.digest.digestVersion,
    releaseDigestFingerprint: input.digest.fingerprint,
    releaseVerificationContentType: input.verification.contentType,
    releaseVerificationManifestVersion: input.verification.manifestVersion,
    releaseVerificationFingerprint: input.verification.fingerprint,
    releaseClosureContentType: input.closure.contentType,
    releaseClosureScorecardVersion: input.closure.scorecardVersion,
    releaseClosureFingerprint: input.closure.fingerprint,
    releaseExceptionContentType: input.exception.contentType,
    releaseExceptionRegisterVersion: input.exception.registerVersion,
    releaseExceptionFingerprint: input.exception.fingerprint,
    sourceFingerprints
  };
}

function entitySourceFingerprints(input: {
  disposition: CsvReleaseDispositionEntityManifest;
  closure: CsvReleaseClosureEntityScorecard;
  exception: CsvReleaseExceptionEntityRegister;
}): CsvReleaseReadinessSourceFingerprint[] {
  return [
    sourceFingerprint({
      source: "release-disposition-manifest",
      scope: "entity",
      key: input.disposition.entity,
      contentType: input.disposition.contentType,
      fingerprint: input.disposition.fingerprint
    }),
    sourceFingerprint({
      source: "release-closure-scorecard",
      scope: "entity",
      key: input.closure.entity,
      contentType: input.closure.contentType,
      fingerprint: input.closure.fingerprint
    }),
    sourceFingerprint({
      source: "release-exception-register",
      scope: "entity",
      key: input.exception.entity,
      contentType: input.exception.contentType,
      fingerprint: input.exception.fingerprint
    })
  ];
}

function operationSourceFingerprints(input: {
  disposition: CsvReleaseDispositionOperationManifest;
  closure: CsvReleaseClosureOperationScorecard;
  exception: CsvReleaseExceptionOperationRegister;
}): CsvReleaseReadinessSourceFingerprint[] {
  return [
    sourceFingerprint({
      source: "release-disposition-manifest",
      scope: "operation",
      key: input.disposition.operation,
      contentType: input.disposition.contentType,
      fingerprint: input.disposition.fingerprint
    }),
    sourceFingerprint({
      source: "release-closure-scorecard",
      scope: "operation",
      key: input.closure.operation,
      contentType: input.closure.contentType,
      fingerprint: input.closure.fingerprint
    }),
    sourceFingerprint({
      source: "release-exception-register",
      scope: "operation",
      key: input.exception.operation,
      contentType: input.exception.contentType,
      fingerprint: input.exception.fingerprint
    })
  ];
}

function itemSourceFingerprints(input: {
  disposition: CsvReleaseDispositionItem;
  exception: CsvReleaseExceptionRegisterEntry | null;
}): CsvReleaseReadinessSourceFingerprint[] {
  const sources = [
    sourceFingerprint({
      source: "release-disposition-manifest",
      scope: "item",
      key: input.disposition.id,
      contentType: CSV_RELEASE_DISPOSITION_MANIFEST_CONTENT_TYPE,
      fingerprint: input.disposition.fingerprint
    })
  ];

  if (input.exception !== null) {
    sources.push(
      sourceFingerprint({
        source: "release-exception-register",
        scope: "item",
        key: input.exception.id,
        contentType: CSV_RELEASE_EXCEPTION_REGISTER_CONTENT_TYPE,
        fingerprint: input.exception.fingerprint
      })
    );
  }

  return sources;
}

function statusLabel(
  status: CsvReleaseReadinessStatus
): CsvReleaseReadinessConsumerSummary["statusLabel"] {
  switch (status) {
    case "pass":
      return "ready-for-consumption";
    case "watch":
      return "review-before-consumption";
    case "block":
      return "blocked";
  }
}

function noWriteGuarantee(): string {
  return "Readiness packets are read-only metadata and add no routes, product UI, persistence, database writes, approval workflows, background jobs, integrations, or CSV apply flow.";
}

function buildConsumerSummary(input: {
  title: string;
  status: CsvReleaseReadinessStatus;
  statusCounts: CsvReleaseReadinessStatusCounts;
  remediationAnchorCount: number;
  warningCodes: readonly string[];
  sourceCodes: readonly string[];
  releaseNote?: CsvContractReleaseOperationDigest["releaseNote"];
}): CsvReleaseReadinessConsumerSummary {
  const blockCount = input.statusCounts.block;
  const watchCount = input.statusCounts.watch;
  const passCount = input.statusCounts.pass;
  const releaseCaveats = input.releaseNote?.caveats ?? [];
  const releaseNextActions = input.releaseNote?.nextActions ?? [];
  const caveats = [
    ...releaseCaveats,
    ...(watchCount > 0
      ? [`${watchCount} readiness items require review before UI or docs consumption.`]
      : []),
    ...(blockCount > 0
      ? [`${blockCount} readiness items remain blocked by current contract boundaries.`]
      : [])
  ];
  const nextActions = [
    ...releaseNextActions,
    ...(input.warningCodes.length > 0
      ? [`Carry warning codes forward: ${input.warningCodes.join(", ")}.`]
      : []),
    ...(input.sourceCodes.length > 0
      ? [`Use remediation source codes: ${input.sourceCodes.join(", ")}.`]
      : []),
    "Keep the release surface read-only until a future prompt promotes CSV UI, writes, or approval workflows."
  ];

  return {
    title: input.title,
    status: input.status,
    statusLabel: statusLabel(input.status),
    summary: `${input.title} has ${passCount} pass, ${watchCount} watch, and ${blockCount} block readiness items.`,
    highlights: [
      `${passCount} readiness items can be consumed by later UI, docs, or tests without additional contract work.`,
      `${input.remediationAnchorCount} remediation anchors are available for watch/block items.`
    ],
    caveats,
    nextActions,
    passTotal: passCount,
    watchTotal: watchCount,
    blockTotal: blockCount,
    remediationAnchorCount: input.remediationAnchorCount,
    safeForCurrentSprint: true,
    requiresContractChange: blockCount > 0,
    noWriteGuarantee: noWriteGuarantee()
  };
}

function findVerificationEntity(
  verification: CsvReleaseVerificationManifest,
  entity: CsvReleaseReadinessEntity
): CsvReleaseVerificationEntityCoverage {
  const match = verification.coverage.entities.find(
    (entry) => entry.entity === entity
  );

  if (match === undefined) {
    throw new Error(`Missing CSV release readiness verification entity ${entity}`);
  }

  return match;
}

function findClosureEntity(
  closure: CsvReleaseClosureScorecard,
  entity: CsvReleaseReadinessEntity
): CsvReleaseClosureEntityScorecard {
  const match = closure.entities.find((entry) => entry.entity === entity);

  if (match === undefined) {
    throw new Error(`Missing CSV release readiness closure entity ${entity}`);
  }

  return match;
}

function findExceptionEntity(
  register: CsvReleaseExceptionRegister,
  entity: CsvReleaseReadinessEntity
): CsvReleaseExceptionEntityRegister {
  const match = register.entities.find((entry) => entry.entity === entity);

  if (match === undefined) {
    throw new Error(`Missing CSV release readiness exception entity ${entity}`);
  }

  return match;
}

function findVerificationOperation(
  verification: CsvReleaseVerificationManifest,
  operation: CsvReleaseReadinessOperation
): CsvReleaseVerificationOperationCoverage {
  const match = verification.coverage.operations.find(
    (entry) => entry.operation === operation
  );

  if (match === undefined) {
    throw new Error(
      `Missing CSV release readiness verification operation ${operation}`
    );
  }

  return match;
}

function findClosureOperation(
  closure: CsvReleaseClosureScorecard,
  operation: CsvReleaseReadinessOperation
): CsvReleaseClosureOperationScorecard {
  const match = closure.operations.find(
    (entry) => entry.operation === operation
  );

  if (match === undefined) {
    throw new Error(`Missing CSV release readiness closure operation ${operation}`);
  }

  return match;
}

function findExceptionOperation(
  register: CsvReleaseExceptionRegister,
  operation: CsvReleaseReadinessOperation
): CsvReleaseExceptionOperationRegister {
  const match = register.operations.find(
    (entry) => entry.operation === operation
  );

  if (match === undefined) {
    throw new Error(
      `Missing CSV release readiness exception operation ${operation}`
    );
  }

  return match;
}

function findDigestOperation(
  digest: CsvContractReleaseDigest,
  operation: CsvReleaseReadinessOperation
): CsvContractReleaseOperationDigest {
  const match = digest.operations.find((entry) => entry.operation === operation);

  if (match === undefined) {
    throw new Error(`Missing CSV release readiness digest operation ${operation}`);
  }

  return match;
}

function findVerificationEntityOperation(input: {
  entity: CsvReleaseVerificationEntityCoverage;
  operation: CsvReleaseReadinessOperation;
}): CsvReleaseVerificationEntityOperationCoverage {
  const match = input.entity.operations.find(
    (entry) => entry.operation === input.operation
  );

  if (match === undefined) {
    throw new Error(
      `Missing CSV release readiness verification item ${input.entity.entity}:${input.operation}`
    );
  }

  return match;
}

function findClosureItem(input: {
  entity: CsvReleaseClosureEntityScorecard;
  operation: CsvReleaseReadinessOperation;
}): CsvReleaseClosureItem {
  const match = input.entity.items.find(
    (entry) => entry.operation === input.operation
  );

  if (match === undefined) {
    throw new Error(
      `Missing CSV release readiness closure item ${input.entity.entity}:${input.operation}`
    );
  }

  return match;
}

function findExceptionEntry(input: {
  entity: CsvReleaseExceptionEntityRegister;
  id: string;
}): CsvReleaseExceptionRegisterEntry | null {
  return input.entity.entries.find((entry) => entry.id === input.id) ?? null;
}

function buildRemediationAnchor(
  entry: CsvReleaseExceptionRegisterEntry
): CsvReleaseReadinessRemediationAnchor {
  return {
    severity: entry.severity,
    status: readinessFromExceptionSeverity(entry.severity),
    order: entry.order,
    sourceFingerprint: entry.fingerprint,
    nextAction: entry.remediation.nextAction,
    warningCodes: entry.remediation.warningCodes,
    sourceCodes: entry.remediation.sourceCodes,
    issueCount: entry.remediation.issueCount,
    remediationCount: entry.remediation.remediationCount
  };
}

function buildItemFingerprint(input: {
  id: string;
  status: CsvReleaseReadinessStatus;
  sourceFingerprints: readonly CsvReleaseReadinessSourceFingerprint[];
  dispositionFingerprint: string;
  verificationFingerprint: string;
  closureStatus: CsvReleaseClosureStatus;
  exceptionFingerprint: string | null;
}): string {
  return digestPayload({
    id: input.id,
    status: input.status,
    sourceFingerprints: input.sourceFingerprints,
    dispositionFingerprint: input.dispositionFingerprint,
    verificationFingerprint: input.verificationFingerprint,
    closureStatus: input.closureStatus,
    exceptionFingerprint: input.exceptionFingerprint
  });
}

function buildReadinessItem(input: {
  disposition: CsvReleaseDispositionItem;
  verification: CsvReleaseVerificationEntityOperationCoverage;
  closure: CsvReleaseClosureItem;
  exception: CsvReleaseExceptionRegisterEntry | null;
  digest: CsvContractReleaseOperationDigest;
}): CsvReleaseReadinessItem {
  const remediationAnchor =
    input.exception === null ? null : buildRemediationAnchor(input.exception);
  const remediationAnchors =
    remediationAnchor === null ? [] : [remediationAnchor];
  const status = statusFromCounts(
    countStatuses([
      { status: readinessFromDispositionStatus(input.disposition.status) },
      { status: readinessFromVerificationStatus(input.verification.status) },
      { status: readinessFromClosureStatus(input.closure.status) },
      {
        status: readinessFromExceptionSeverity(
          input.exception?.severity ?? null
        )
      }
    ])
  );
  const sourceFingerprints = itemSourceFingerprints({
    disposition: input.disposition,
    exception: input.exception
  });
  const fingerprint = buildItemFingerprint({
    id: input.disposition.id,
    status,
    sourceFingerprints,
    dispositionFingerprint: input.disposition.fingerprint,
    verificationFingerprint: input.verification.driftFingerprint,
    closureStatus: input.closure.status,
    exceptionFingerprint: input.exception?.fingerprint ?? null
  });
  const exceptionTrace =
    input.exception === null || remediationAnchor === null
      ? null
      : {
          severity: input.exception.severity,
          status: input.exception.status,
          fingerprint: input.exception.fingerprint,
          remediation: remediationAnchor
        };

  return {
    id: input.disposition.id,
    entity: input.disposition.entity,
    label: input.disposition.label,
    route: input.disposition.route,
    operation: input.disposition.operation,
    status,
    fingerprint,
    supported: input.disposition.supported && input.verification.supported,
    fixtureAvailable:
      input.disposition.fixtureAvailable && input.closure.fixture.available,
    hasException: input.exception !== null,
    exceptionSeverity: input.exception?.severity ?? null,
    warningCodes: uniqueStrings([
      ...input.disposition.trace.handoff.closure.warningCodes,
      ...input.verification.warningCodes,
      ...input.closure.warningCodes,
      ...(input.exception?.remediation.warningCodes ?? [])
    ]),
    sourceCodes: uniqueStrings([
      ...input.disposition.trace.handoff.closure.sourceCodes,
      ...input.verification.sourceCodes,
      ...input.closure.sourceCodes,
      ...(input.exception?.remediation.sourceCodes ?? [])
    ]),
    remediationAnchors,
    trace: {
      disposition: {
        status: input.disposition.status,
        fingerprint: input.disposition.fingerprint,
        supported: input.disposition.supported,
        fixtureAvailable: input.disposition.fixtureAvailable,
        fixtureKind: input.disposition.fixtureKind
      },
      verification: {
        status: input.verification.status,
        supported: input.verification.supported,
        driftFingerprint: input.verification.driftFingerprint,
        warningCodes: input.verification.warningCodes,
        sourceCodes: input.verification.sourceCodes
      },
      closure: {
        status: input.closure.status,
        releaseStatus: input.closure.releaseStatus,
        acceptanceStatus: input.closure.acceptanceStatus,
        checkStatusCounts: input.closure.checkStatusCounts,
        fixtureCoverage: input.closure.fixtureCoverage
      },
      exception: exceptionTrace,
      releaseDigest: {
        operationStatus: input.digest.status,
        releaseNoteStatus: input.digest.releaseNote.statusLabel,
        safeForCurrentSprint: input.digest.releaseNote.safeForCurrentSprint,
        requiresContractChange: input.digest.releaseNote.requiresContractChange
      }
    },
    sourceFingerprints,
    sourceContentTypes: uniqueStrings([
      CSV_RELEASE_READINESS_PACKET_CONTENT_TYPE,
      ...input.disposition.sourceContentTypes,
      ...input.verification.sourceContentTypes,
      ...input.closure.sourceContentTypes,
      ...(input.exception?.sourceContentTypes ?? []),
      ...sourceFingerprints.map((source) => source.contentType)
    ]),
    read: combineReads([
      input.disposition.read,
      input.verification.read,
      input.closure.read,
      input.digest.read,
      ...(input.exception === null ? [] : [input.exception.read])
    ]),
    write: noWrites()
  };
}

function itemRollup(items: readonly CsvReleaseReadinessItem[]) {
  const statusCounts = countStatuses(items);
  const remediationAnchors = items.flatMap((item) => item.remediationAnchors);

  return {
    statusCounts,
    status: statusFromCounts(statusCounts),
    passReadinessCount: statusCounts.pass,
    watchReadinessCount: statusCounts.watch,
    blockReadinessCount: statusCounts.block,
    supportedReadinessCount: items.filter((item) => item.supported).length,
    unsupportedReadinessCount: items.filter((item) => !item.supported).length,
    missingFixtureReadinessCount: items.filter((item) => !item.fixtureAvailable)
      .length,
    remediationAnchorCount: remediationAnchors.length,
    watchRemediationAnchorCount: remediationAnchors.filter(
      (anchor) => anchor.severity === "watch"
    ).length,
    blockRemediationAnchorCount: remediationAnchors.filter(
      (anchor) => anchor.severity === "block"
    ).length,
    exceptionSeverityCounts: countExceptionSeverities(items)
  };
}

function buildEntityFingerprint(input: {
  sourceFingerprints: readonly CsvReleaseReadinessSourceFingerprint[];
  entity: CsvReleaseReadinessEntity;
  status: CsvReleaseReadinessStatus;
  items: readonly CsvReleaseReadinessItem[];
}): string {
  return digestPayload({
    sourceFingerprints: input.sourceFingerprints,
    entity: input.entity,
    status: input.status,
    items: input.items.map((item) => ({
      id: item.id,
      operation: item.operation,
      status: item.status,
      fingerprint: item.fingerprint
    }))
  });
}

function buildEntityPacket(input: {
  disposition: CsvReleaseDispositionEntityManifest;
  verification: CsvReleaseVerificationManifest;
  closure: CsvReleaseClosureScorecard;
  exception: CsvReleaseExceptionRegister;
  digest: CsvContractReleaseDigest;
  source: CsvReleaseReadinessSource;
}): CsvReleaseReadinessEntityPacket {
  const verificationEntity = findVerificationEntity(
    input.verification,
    input.disposition.entity
  );
  const closureEntity = findClosureEntity(input.closure, input.disposition.entity);
  const exceptionEntity = findExceptionEntity(
    input.exception,
    input.disposition.entity
  );
  const items = input.disposition.dispositions.map((dispositionItem) =>
    buildReadinessItem({
      disposition: dispositionItem,
      verification: findVerificationEntityOperation({
        entity: verificationEntity,
        operation: dispositionItem.operation
      }),
      closure: findClosureItem({
        entity: closureEntity,
        operation: dispositionItem.operation
      }),
      exception: findExceptionEntry({
        entity: exceptionEntity,
        id: dispositionItem.id
      }),
      digest: findDigestOperation(input.digest, dispositionItem.operation)
    })
  );
  const rollup = itemRollup(items);
  const sourceFingerprints = entitySourceFingerprints({
    disposition: input.disposition,
    closure: closureEntity,
    exception: exceptionEntity
  });
  const fingerprint = buildEntityFingerprint({
    sourceFingerprints,
    entity: input.disposition.entity,
    status: rollup.status,
    items
  });

  return {
    contentType: CSV_RELEASE_READINESS_PACKET_CONTENT_TYPE,
    packetVersion: 1,
    entity: input.disposition.entity,
    label: input.disposition.label,
    route: input.disposition.route,
    direction: input.disposition.direction,
    status: rollup.status,
    fingerprint,
    operationCount: input.disposition.operationCount,
    supportedOperationCount: input.disposition.supportedOperationCount,
    unsupportedOperationCount: input.disposition.unsupportedOperationCount,
    fixtureOperationCount: input.disposition.fixtureOperationCount,
    readinessCount: items.length,
    passReadinessCount: rollup.passReadinessCount,
    watchReadinessCount: rollup.watchReadinessCount,
    blockReadinessCount: rollup.blockReadinessCount,
    supportedReadinessCount: rollup.supportedReadinessCount,
    unsupportedReadinessCount: rollup.unsupportedReadinessCount,
    missingFixtureReadinessCount: rollup.missingFixtureReadinessCount,
    remediationAnchorCount: rollup.remediationAnchorCount,
    watchRemediationAnchorCount: rollup.watchRemediationAnchorCount,
    blockRemediationAnchorCount: rollup.blockRemediationAnchorCount,
    statusCounts: rollup.statusCounts,
    dispositionStatusCounts: dispositionStatusCounts(input.disposition.statusCounts),
    verificationStatusCounts: verificationStatusCounts(
      verificationEntity.statusCounts
    ),
    closureStatusCounts: closureStatusCounts(closureEntity.statusCounts),
    exceptionSeverityCounts: rollup.exceptionSeverityCounts,
    warningCodes: uniqueStrings(items.flatMap((item) => item.warningCodes)),
    sourceCodes: uniqueStrings(items.flatMap((item) => item.sourceCodes)),
    releaseConsumerSummary: buildConsumerSummary({
      title: `${input.disposition.label} CSV release readiness`,
      status: rollup.status,
      statusCounts: rollup.statusCounts,
      remediationAnchorCount: rollup.remediationAnchorCount,
      warningCodes: uniqueStrings(items.flatMap((item) => item.warningCodes)),
      sourceCodes: uniqueStrings(items.flatMap((item) => item.sourceCodes))
    }),
    items,
    sourceFingerprints,
    sourceContentTypes: uniqueStrings([
      CSV_RELEASE_READINESS_PACKET_CONTENT_TYPE,
      input.disposition.contentType,
      verificationEntity.sourceContentTypes[0],
      closureEntity.contentType,
      exceptionEntity.contentType,
      ...input.source.sourceFingerprints.map((source) => source.contentType),
      ...input.disposition.sourceContentTypes,
      ...verificationEntity.sourceContentTypes,
      ...closureEntity.sourceContentTypes,
      ...exceptionEntity.sourceContentTypes,
      ...items.flatMap((item) => item.sourceContentTypes)
    ]),
    source: input.source,
    read: combineReads([
      input.disposition.read,
      verificationEntity.read,
      closureEntity.read,
      exceptionEntity.read,
      ...items.map((item) => item.read)
    ]),
    write: noWrites()
  };
}

function buildOperationFingerprint(input: {
  sourceFingerprints: readonly CsvReleaseReadinessSourceFingerprint[];
  operation: CsvReleaseReadinessOperation;
  status: CsvReleaseReadinessStatus;
  items: readonly CsvReleaseReadinessItem[];
}): string {
  return digestPayload({
    sourceFingerprints: input.sourceFingerprints,
    operation: input.operation,
    status: input.status,
    items: input.items.map((item) => ({
      id: item.id,
      entity: item.entity,
      status: item.status,
      fingerprint: item.fingerprint
    }))
  });
}

function buildOperationPacket(input: {
  disposition: CsvReleaseDispositionOperationManifest;
  verification: CsvReleaseVerificationManifest;
  closure: CsvReleaseClosureScorecard;
  exception: CsvReleaseExceptionRegister;
  digest: CsvContractReleaseDigest;
  entityPackets: readonly CsvReleaseReadinessEntityPacket[];
  source: CsvReleaseReadinessSource;
}): CsvReleaseReadinessOperationPacket {
  const verificationOperation = findVerificationOperation(
    input.verification,
    input.disposition.operation
  );
  const closureOperation = findClosureOperation(
    input.closure,
    input.disposition.operation
  );
  const exceptionOperation = findExceptionOperation(
    input.exception,
    input.disposition.operation
  );
  const digestOperation = findDigestOperation(input.digest, input.disposition.operation);
  const items = input.entityPackets.flatMap((entity) =>
    entity.items.filter((item) => item.operation === input.disposition.operation)
  );
  const rollup = itemRollup(items);
  const sourceFingerprints = operationSourceFingerprints({
    disposition: input.disposition,
    closure: closureOperation,
    exception: exceptionOperation
  });
  const fingerprint = buildOperationFingerprint({
    sourceFingerprints,
    operation: input.disposition.operation,
    status: rollup.status,
    items
  });
  const warningCodes = uniqueStrings(items.flatMap((item) => item.warningCodes));
  const sourceCodes = uniqueStrings(items.flatMap((item) => item.sourceCodes));

  return {
    contentType: CSV_RELEASE_READINESS_PACKET_CONTENT_TYPE,
    packetVersion: 1,
    operation: input.disposition.operation,
    status: rollup.status,
    fingerprint,
    entityCount: input.disposition.entityCount,
    supportedEntityCount: input.disposition.supportedEntityCount,
    unsupportedEntityCount: input.disposition.unsupportedEntityCount,
    fixtureEntityCount: input.disposition.fixtureEntityCount,
    readinessCount: items.length,
    passReadinessCount: rollup.passReadinessCount,
    watchReadinessCount: rollup.watchReadinessCount,
    blockReadinessCount: rollup.blockReadinessCount,
    supportedReadinessCount: rollup.supportedReadinessCount,
    unsupportedReadinessCount: rollup.unsupportedReadinessCount,
    missingFixtureReadinessCount: rollup.missingFixtureReadinessCount,
    remediationAnchorCount: rollup.remediationAnchorCount,
    watchRemediationAnchorCount: rollup.watchRemediationAnchorCount,
    blockRemediationAnchorCount: rollup.blockRemediationAnchorCount,
    statusCounts: rollup.statusCounts,
    dispositionStatusCounts: dispositionStatusCounts(input.disposition.statusCounts),
    verificationStatusCounts: verificationStatusCounts(
      verificationOperation.statusCounts
    ),
    closureStatusCounts: closureStatusCounts(closureOperation.statusCounts),
    exceptionSeverityCounts: rollup.exceptionSeverityCounts,
    warningCodes,
    sourceCodes,
    releaseConsumerSummary: buildConsumerSummary({
      title: `${input.disposition.operation} CSV release readiness`,
      status: rollup.status,
      statusCounts: rollup.statusCounts,
      remediationAnchorCount: rollup.remediationAnchorCount,
      warningCodes,
      sourceCodes,
      releaseNote: digestOperation.releaseNote
    }),
    items,
    sourceFingerprints,
    sourceContentTypes: uniqueStrings([
      CSV_RELEASE_READINESS_PACKET_CONTENT_TYPE,
      input.disposition.contentType,
      ...verificationOperation.sourceContentTypes,
      closureOperation.contentType,
      exceptionOperation.contentType,
      ...input.source.sourceFingerprints.map((source) => source.contentType),
      ...input.disposition.sourceContentTypes,
      ...closureOperation.sourceContentTypes,
      ...exceptionOperation.sourceContentTypes,
      ...items.flatMap((item) => item.sourceContentTypes)
    ]),
    source: input.source,
    read: combineReads([
      input.disposition.read,
      verificationOperation.read,
      closureOperation.read,
      exceptionOperation.read,
      digestOperation.read,
      ...items.map((item) => item.read)
    ]),
    write: noWrites()
  };
}

function buildPacketFingerprint(input: {
  sourceFingerprints: readonly CsvReleaseReadinessSourceFingerprint[];
  status: CsvReleaseReadinessStatus;
  entities: readonly CsvReleaseReadinessEntityPacket[];
  operations: readonly CsvReleaseReadinessOperationPacket[];
}): string {
  return digestPayload({
    sourceFingerprints: input.sourceFingerprints,
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

export function isCsvReleaseReadinessEntity(
  value: string
): value is CsvReleaseReadinessEntity {
  return (
    isCsvReleaseDispositionEntity(value) &&
    isCsvReleaseVerificationManifestEntity(value) &&
    isCsvReleaseClosureEntity(value) &&
    isCsvReleaseExceptionEntity(value)
  );
}

export function isCsvReleaseReadinessOperation(
  value: string
): value is CsvReleaseReadinessOperation {
  return (
    isCsvReleaseDispositionOperation(value) &&
    isCsvContractReleaseDigestOperation(value) &&
    isCsvReleaseVerificationManifestOperation(value) &&
    isCsvReleaseClosureOperation(value) &&
    isCsvReleaseExceptionOperation(value)
  );
}

export async function getCsvReleaseReadinessPacket(
  options: CsvReleaseReadinessPacketOptions = {}
): Promise<CsvReleaseReadinessPacket> {
  const [disposition, closure, exception] = await Promise.all([
    getCsvReleaseDispositionManifest(options),
    getCsvReleaseClosureScorecard(options),
    getCsvReleaseExceptionRegister(options)
  ]);
  const digest = getCsvContractReleaseDigest();
  const verification = getCsvReleaseVerificationManifest();
  const source = buildSource({
    disposition,
    digest,
    verification,
    closure,
    exception
  });
  const entities = disposition.entities.map((entity) =>
    buildEntityPacket({
      disposition: entity,
      verification,
      closure,
      exception,
      digest,
      source
    })
  );
  const operations = disposition.operations.map((operation) =>
    buildOperationPacket({
      disposition: operation,
      verification,
      closure,
      exception,
      digest,
      entityPackets: entities,
      source
    })
  );
  const items = entities.flatMap((entity) => entity.items);
  const rollup = itemRollup(items);
  const warningCodes = uniqueStrings(items.flatMap((item) => item.warningCodes));
  const sourceCodes = uniqueStrings(items.flatMap((item) => item.sourceCodes));
  const sourceFingerprints = source.sourceFingerprints;
  const fingerprint = buildPacketFingerprint({
    sourceFingerprints,
    status: rollup.status,
    entities,
    operations
  });

  return {
    contentType: CSV_RELEASE_READINESS_PACKET_CONTENT_TYPE,
    packetVersion: 1,
    status: rollup.status,
    fingerprint,
    entityCount: entities.length,
    operationCount: operations.length,
    readinessCount: items.length,
    passReadinessCount: rollup.passReadinessCount,
    watchReadinessCount: rollup.watchReadinessCount,
    blockReadinessCount: rollup.blockReadinessCount,
    supportedReadinessCount: rollup.supportedReadinessCount,
    unsupportedReadinessCount: rollup.unsupportedReadinessCount,
    missingFixtureReadinessCount: rollup.missingFixtureReadinessCount,
    remediationAnchorCount: rollup.remediationAnchorCount,
    watchRemediationAnchorCount: rollup.watchRemediationAnchorCount,
    blockRemediationAnchorCount: rollup.blockRemediationAnchorCount,
    statusCounts: rollup.statusCounts,
    entityStatusCounts: countStatuses(entities),
    operationStatusCounts: countStatuses(operations),
    dispositionStatusCounts: dispositionStatusCounts(disposition.statusCounts),
    verificationStatusCounts: verificationStatusCounts(
      verification.entityOperationStatusCounts
    ),
    closureStatusCounts: closureStatusCounts(closure.statusCounts),
    exceptionSeverityCounts: rollup.exceptionSeverityCounts,
    warningCodes,
    sourceCodes,
    releaseConsumerSummary: buildConsumerSummary({
      title: "CSV release readiness packet",
      status: rollup.status,
      statusCounts: rollup.statusCounts,
      remediationAnchorCount: rollup.remediationAnchorCount,
      warningCodes,
      sourceCodes
    }),
    items,
    entities,
    operations,
    sourceFingerprints,
    sourceContentTypes: uniqueStrings([
      CSV_RELEASE_READINESS_PACKET_CONTENT_TYPE,
      disposition.contentType,
      digest.contentType,
      verification.contentType,
      closure.contentType,
      exception.contentType,
      ...disposition.sourceContentTypes,
      ...verification.sourceContentTypes,
      ...closure.sourceContentTypes,
      ...exception.sourceContentTypes,
      ...entities.flatMap((entity) => entity.sourceContentTypes),
      ...operations.flatMap((operation) => operation.sourceContentTypes)
    ]),
    source,
    read: combineReads([
      disposition.read,
      digest.read,
      verification.read,
      closure.read,
      exception.read,
      ...entities.map((entity) => entity.read),
      ...operations.map((operation) => operation.read)
    ]),
    write: noWrites()
  };
}

export async function listCsvReleaseReadinessEntityPackets(
  options: CsvReleaseReadinessPacketOptions = {}
): Promise<CsvReleaseReadinessEntityPacket[]> {
  return (await getCsvReleaseReadinessPacket(options)).entities.slice();
}

export async function getCsvReleaseReadinessEntityPacket(
  entity: string,
  options: CsvReleaseReadinessPacketOptions = {}
): Promise<CsvReleaseReadinessEntityPacket | null> {
  if (!isCsvReleaseReadinessEntity(entity)) {
    return null;
  }

  const packet = await getCsvReleaseReadinessPacket(options);

  return packet.entities.find((entry) => entry.entity === entity) ?? null;
}

export async function listCsvReleaseReadinessOperationPackets(
  options: CsvReleaseReadinessPacketOptions = {}
): Promise<CsvReleaseReadinessOperationPacket[]> {
  return (await getCsvReleaseReadinessPacket(options)).operations.slice();
}

export async function getCsvReleaseReadinessOperationPacket(
  operation: string,
  options: CsvReleaseReadinessPacketOptions = {}
): Promise<CsvReleaseReadinessOperationPacket | null> {
  if (!isCsvReleaseReadinessOperation(operation)) {
    return null;
  }

  const packet = await getCsvReleaseReadinessPacket(options);

  return packet.operations.find((entry) => entry.operation === operation) ?? null;
}
