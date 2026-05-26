import {
  AI_ACTION_EVAL_FIXTURE_VERSION,
  auditAiActionEvalFixtures,
  listAiActionEvalFixtures,
  runAiActionEvalFixture,
  type AiActionEvalFixtureCategory,
  type AiActionEvalFixtureId
} from "@/lib/ai/actionEvalFixtures";
import {
  AI_ACTION_INTENT_REGISTRY_VERSION,
  auditAiActionIntentRegistry,
  getAiActionIntentRegistry,
  type AiActionIntentWriteFlags
} from "@/lib/ai/actionIntentRegistry";
import {
  AI_ACTION_REVIEW_PACKET_VERSION,
  auditAiActionReviewPackets,
  type AiActionReviewIssueCode,
  type AiActionReviewPacketStatus,
  type AiActionReviewPayloadValidationStatus
} from "@/lib/ai/actionReviewPackets";

export const AI_ACTION_READINESS_DIGEST_CONTENT_TYPE =
  "application/json; charset=utf-8" as const;

export const AI_ACTION_READINESS_DIGEST_VERSION = "2026-05-26.s46-f1" as const;

export type AiActionReadinessDigestStatus = "ready" | "blocked";

export type AiActionReadinessSourceKind =
  | "intent-registry"
  | "review-packets"
  | "eval-fixtures";

export type AiActionReadinessSourceDigest = {
  readonly source: AiActionReadinessSourceKind;
  readonly label: string;
  readonly status: AiActionReadinessDigestStatus;
  readonly ok: boolean;
  readonly version: string;
  readonly itemCount: number;
  readonly issueCount: number;
  readonly issues: readonly string[];
};

export type AiActionReadinessSampleProposalReference = {
  readonly fixtureId: AiActionEvalFixtureId;
  readonly category: AiActionEvalFixtureCategory;
  readonly coverage: readonly string[];
  readonly intentId: string | null;
  readonly targetEntity: string | null;
  readonly targetRoute: string | null;
  readonly status: AiActionReviewPacketStatus;
  readonly payloadValidationStatus: AiActionReviewPayloadValidationStatus;
  readonly payloadKeys: readonly string[];
  readonly issueCodes: readonly AiActionReviewIssueCode[];
  readonly approvalRequired: boolean;
  readonly auditRequiredBeforeExecution: boolean;
  readonly currentExecutionAllowed: false;
  readonly wouldWriteNow: false;
};

export type AiActionReadinessSampleStatusCounts = {
  readonly readyForReview: number;
  readonly blocked: number;
  readonly deferred: number;
};

export type AiActionReadinessDigestSummary = {
  readonly status: AiActionReadinessDigestStatus;
  readonly sourceCount: number;
  readonly readySourceCount: number;
  readonly blockedSourceCount: number;
  readonly issueCount: number;
  readonly supportedIntentCount: number;
  readonly deferredIntentCount: number;
  readonly intentCount: number;
  readonly evalFixtureCount: number;
  readonly sampleProposalCount: number;
  readonly sampleStatusCounts: AiActionReadinessSampleStatusCounts;
  readonly currentExecutionAllowed: false;
  readonly wouldWriteNow: false;
};

export type AiActionReadinessDigestSource = {
  readonly module: "lib/ai/actionReadinessDigest.ts";
  readonly digestScope: "no-write-ai-action-operator-readiness";
  readonly registryModule: "lib/ai/actionIntentRegistry.ts";
  readonly registryVersion: typeof AI_ACTION_INTENT_REGISTRY_VERSION;
  readonly reviewPacketModule: "lib/ai/actionReviewPackets.ts";
  readonly reviewPacketVersion: typeof AI_ACTION_REVIEW_PACKET_VERSION;
  readonly evalFixtureModule: "lib/ai/actionEvalFixtures.ts";
  readonly evalFixtureVersion: typeof AI_ACTION_EVAL_FIXTURE_VERSION;
  readonly routeScope: readonly string[];
};

export type AiActionReadinessDigestReadFlags = {
  readonly metadata: true;
  readonly intentRegistryAudit: true;
  readonly reviewPacketAudit: true;
  readonly evalFixtureAudit: true;
  readonly sampleProposals: true;
  readonly database: false;
  readonly crmRecords: false;
  readonly externalServices: false;
  readonly runtimeExecution: false;
};

export type AiActionReadinessDigestSafety = {
  readonly deterministic: true;
  readonly localOnly: true;
  readonly readOnly: true;
  readonly metadataOnly: true;
  readonly reviewOnly: true;
  readonly proposalOnly: true;
  readonly externalProvider: false;
  readonly providerCalls: false;
  readonly network: false;
  readonly database: false;
  readonly crmRecords: false;
  readonly writes: false;
  readonly auditPersistence: false;
  readonly actionExecution: false;
  readonly currentExecutionAllowed: false;
  readonly routeChanges: false;
  readonly routeHandlers: false;
  readonly productUi: false;
  readonly routingExecution: false;
  readonly backgroundJobs: false;
};

export type AiActionReadinessDigest = {
  readonly contentType: typeof AI_ACTION_READINESS_DIGEST_CONTENT_TYPE;
  readonly digestType: "ai-action-readiness-digest";
  readonly digestVersion: typeof AI_ACTION_READINESS_DIGEST_VERSION;
  readonly status: AiActionReadinessDigestStatus;
  readonly summary: AiActionReadinessDigestSummary;
  readonly sources: readonly AiActionReadinessSourceDigest[];
  readonly sampleProposals: readonly AiActionReadinessSampleProposalReference[];
  readonly source: AiActionReadinessDigestSource;
  readonly read: AiActionReadinessDigestReadFlags;
  readonly write: AiActionIntentWriteFlags;
  readonly safety: AiActionReadinessDigestSafety;
};

export type AiActionReadinessDigestAudit = {
  readonly ok: boolean;
  readonly digestVersion: typeof AI_ACTION_READINESS_DIGEST_VERSION;
  readonly sourceCount: number;
  readonly sourceStatuses: readonly {
    readonly source: AiActionReadinessSourceKind;
    readonly status: AiActionReadinessDigestStatus;
    readonly issueCount: number;
  }[];
  readonly sourcesWithIssues: readonly AiActionReadinessSourceKind[];
  readonly sampleProposalIds: readonly AiActionEvalFixtureId[];
  readonly samplesWithWritesEnabled: readonly AiActionEvalFixtureId[];
  readonly samplesWithExecutionAllowed: readonly AiActionEvalFixtureId[];
  readonly digestWouldWrite: boolean;
  readonly digestWouldExecute: boolean;
  readonly issues: readonly string[];
};

const writeFlagKeys = [
  "database",
  "crmRecords",
  "auditEvents",
  "tasks",
  "activities",
  "opportunities",
  "leads",
  "cases",
  "campaigns",
  "routes",
  "routeHandlers",
  "productUi",
  "files",
  "externalServices",
  "backgroundJobs",
  "actionExecution",
  "approvals"
] as const satisfies readonly (keyof AiActionIntentWriteFlags)[];

const readinessSafety = {
  deterministic: true,
  localOnly: true,
  readOnly: true,
  metadataOnly: true,
  reviewOnly: true,
  proposalOnly: true,
  externalProvider: false,
  providerCalls: false,
  network: false,
  database: false,
  crmRecords: false,
  writes: false,
  auditPersistence: false,
  actionExecution: false,
  currentExecutionAllowed: false,
  routeChanges: false,
  routeHandlers: false,
  productUi: false,
  routingExecution: false,
  backgroundJobs: false
} as const satisfies AiActionReadinessDigestSafety;

export function getAiActionReadinessDigest(): AiActionReadinessDigest {
  const registry = getAiActionIntentRegistry();
  const sources = buildSources();
  const sampleProposals = listAiActionEvalFixtures().map(buildSampleReference);
  const summary = buildSummary({
    sources,
    sampleProposals,
    supportedIntentCount: registry.supportedIntentCount,
    deferredIntentCount: registry.deferredIntentCount,
    intentCount: registry.intentCount,
    evalFixtureCount: sampleProposals.length
  });

  return {
    contentType: AI_ACTION_READINESS_DIGEST_CONTENT_TYPE,
    digestType: "ai-action-readiness-digest",
    digestVersion: AI_ACTION_READINESS_DIGEST_VERSION,
    status: summary.status,
    summary,
    sources,
    sampleProposals,
    source: {
      module: "lib/ai/actionReadinessDigest.ts",
      digestScope: "no-write-ai-action-operator-readiness",
      registryModule: "lib/ai/actionIntentRegistry.ts",
      registryVersion: AI_ACTION_INTENT_REGISTRY_VERSION,
      reviewPacketModule: "lib/ai/actionReviewPackets.ts",
      reviewPacketVersion: AI_ACTION_REVIEW_PACKET_VERSION,
      evalFixtureModule: "lib/ai/actionEvalFixtures.ts",
      evalFixtureVersion: AI_ACTION_EVAL_FIXTURE_VERSION,
      routeScope: [...registry.source.routeScope]
    },
    read: readFlags(),
    write: { ...registry.write },
    safety: readinessSafety
  };
}

export function auditAiActionReadinessDigest(): AiActionReadinessDigestAudit {
  const digest = getAiActionReadinessDigest();
  const sourcesWithIssues = digest.sources
    .filter((source) => source.issueCount > 0)
    .map((source) => source.source);
  const samplesWithWritesEnabled = digest.sampleProposals
    .filter((sample) => sample.wouldWriteNow)
    .map((sample) => sample.fixtureId);
  const samplesWithExecutionAllowed = digest.sampleProposals
    .filter((sample) => sample.currentExecutionAllowed)
    .map((sample) => sample.fixtureId);
  const digestWouldWrite = hasWritesEnabled(digest.write) || digest.safety.writes;
  const digestWouldExecute =
    digest.safety.actionExecution || digest.safety.currentExecutionAllowed;
  const issues = [
    ...digest.sources.flatMap((source) => source.issues),
    ...samplesWithWritesEnabled.map(
      (fixtureId) => `AI action readiness sample ${fixtureId} would write now.`
    ),
    ...samplesWithExecutionAllowed.map(
      (fixtureId) =>
        `AI action readiness sample ${fixtureId} allows current execution.`
    ),
    ...(digestWouldWrite
      ? ["AI action readiness digest write flags are enabled."]
      : []),
    ...(digestWouldExecute
      ? ["AI action readiness digest execution flags are enabled."]
      : [])
  ];

  return {
    ok: issues.length === 0,
    digestVersion: AI_ACTION_READINESS_DIGEST_VERSION,
    sourceCount: digest.sources.length,
    sourceStatuses: digest.sources.map((source) => ({
      source: source.source,
      status: source.status,
      issueCount: source.issueCount
    })),
    sourcesWithIssues,
    sampleProposalIds: digest.sampleProposals.map((sample) => sample.fixtureId),
    samplesWithWritesEnabled,
    samplesWithExecutionAllowed,
    digestWouldWrite,
    digestWouldExecute,
    issues
  };
}

export function getAiActionReadinessDigestVersions() {
  return {
    digestVersion: AI_ACTION_READINESS_DIGEST_VERSION,
    registryVersion: AI_ACTION_INTENT_REGISTRY_VERSION,
    reviewPacketVersion: AI_ACTION_REVIEW_PACKET_VERSION,
    evalFixtureVersion: AI_ACTION_EVAL_FIXTURE_VERSION
  };
}

function buildSources(): AiActionReadinessSourceDigest[] {
  const registryAudit = auditAiActionIntentRegistry();
  const reviewPacketAudit = auditAiActionReviewPackets();
  const evalFixtureAudit = auditAiActionEvalFixtures();

  return [
    {
      source: "intent-registry",
      label: "AI action intent registry",
      status: statusFromOk(registryAudit.ok),
      ok: registryAudit.ok,
      version: registryAudit.registryVersion,
      itemCount: registryAudit.registryIntentIds.length,
      issueCount: registryAudit.issues.length,
      issues: [...registryAudit.issues]
    },
    {
      source: "review-packets",
      label: "AI action review packet audit",
      status: statusFromOk(reviewPacketAudit.ok),
      ok: reviewPacketAudit.ok,
      version: reviewPacketAudit.packetVersion,
      itemCount: reviewPacketAudit.payloadSchemaIntentIds.length,
      issueCount: reviewPacketAudit.issues.length,
      issues: [...reviewPacketAudit.issues]
    },
    {
      source: "eval-fixtures",
      label: "AI action eval fixture audit",
      status: statusFromOk(evalFixtureAudit.ok),
      ok: evalFixtureAudit.ok,
      version: evalFixtureAudit.fixtureVersion,
      itemCount: evalFixtureAudit.fixtureIds.length,
      issueCount: evalFixtureAudit.issues.length,
      issues: [...evalFixtureAudit.issues]
    }
  ];
}

function buildSampleReference(
  fixture: ReturnType<typeof listAiActionEvalFixtures>[number]
): AiActionReadinessSampleProposalReference {
  const run = runAiActionEvalFixture(fixture);

  return {
    fixtureId: fixture.id,
    category: fixture.category,
    coverage: [...fixture.coverage],
    intentId: run.packet.proposal.intentId,
    targetEntity: run.packet.proposal.target?.entity ?? null,
    targetRoute: run.packet.proposal.target?.route ?? null,
    status: run.packet.status,
    payloadValidationStatus: run.packet.payloadValidation.status,
    payloadKeys: [...run.packet.proposal.payloadKeys],
    issueCodes: run.packet.issues.map((issue) => issue.code),
    approvalRequired: run.packet.approval?.approvalRequired ?? false,
    auditRequiredBeforeExecution:
      run.packet.audit?.auditRequiredBeforeExecution ?? false,
    currentExecutionAllowed: run.packet.summary.currentExecutionAllowed,
    wouldWriteNow: run.packet.summary.wouldWriteNow
  };
}

function buildSummary(input: {
  sources: readonly AiActionReadinessSourceDigest[];
  sampleProposals: readonly AiActionReadinessSampleProposalReference[];
  supportedIntentCount: number;
  deferredIntentCount: number;
  intentCount: number;
  evalFixtureCount: number;
}): AiActionReadinessDigestSummary {
  const sampleStatusCounts = summarizeSampleStatuses(input.sampleProposals);
  const blockedSourceCount = input.sources.filter(
    (source) => source.status === "blocked"
  ).length;
  const issueCount =
    input.sources.reduce((total, source) => total + source.issueCount, 0) +
    input.sampleProposals.reduce(
      (total, sample) => total + sample.issueCodes.length,
      0
    );

  return {
    status: blockedSourceCount === 0 ? "ready" : "blocked",
    sourceCount: input.sources.length,
    readySourceCount: input.sources.length - blockedSourceCount,
    blockedSourceCount,
    issueCount,
    supportedIntentCount: input.supportedIntentCount,
    deferredIntentCount: input.deferredIntentCount,
    intentCount: input.intentCount,
    evalFixtureCount: input.evalFixtureCount,
    sampleProposalCount: input.sampleProposals.length,
    sampleStatusCounts,
    currentExecutionAllowed: false,
    wouldWriteNow: false
  };
}

function summarizeSampleStatuses(
  samples: readonly AiActionReadinessSampleProposalReference[]
): AiActionReadinessSampleStatusCounts {
  return samples.reduce<AiActionReadinessSampleStatusCounts>(
    (counts, sample) => ({
      readyForReview:
        counts.readyForReview +
        (sample.status === "ready_for_review" ? 1 : 0),
      blocked: counts.blocked + (sample.status === "blocked" ? 1 : 0),
      deferred: counts.deferred + (sample.status === "deferred" ? 1 : 0)
    }),
    {
      readyForReview: 0,
      blocked: 0,
      deferred: 0
    }
  );
}

function readFlags(): AiActionReadinessDigestReadFlags {
  return {
    metadata: true,
    intentRegistryAudit: true,
    reviewPacketAudit: true,
    evalFixtureAudit: true,
    sampleProposals: true,
    database: false,
    crmRecords: false,
    externalServices: false,
    runtimeExecution: false
  };
}

function statusFromOk(ok: boolean): AiActionReadinessDigestStatus {
  return ok ? "ready" : "blocked";
}

function hasWritesEnabled(write: AiActionIntentWriteFlags): boolean {
  return writeFlagKeys.some((key) => write[key]);
}
