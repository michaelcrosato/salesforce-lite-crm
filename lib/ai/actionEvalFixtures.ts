import {
  AI_ACTION_REVIEW_PACKET_VERSION,
  buildAiActionReviewPacket,
  type AiActionReviewIssueCode,
  type AiActionReviewPacket,
  type AiActionReviewPacketStatus,
  type AiActionReviewPayloadValidationStatus
} from "@/lib/ai/actionReviewPackets";
import {
  AI_ACTION_INTENT_REGISTRY_VERSION,
  aiActionIntentProposalSchema,
  type AiActionIntentWriteFlags
} from "@/lib/ai/actionIntentRegistry";

export const AI_ACTION_EVAL_FIXTURE_CONTENT_TYPE =
  "application/json; charset=utf-8" as const;

export const AI_ACTION_EVAL_FIXTURE_VERSION = "2026-05-26.s45-f3" as const;

export const AI_ACTION_EVAL_FIXTURE_REQUIRED_CATEGORIES = [
  "supported",
  "blocked",
  "malformed",
  "deferred"
] as const;

export type AiActionEvalFixtureCategory =
  (typeof AI_ACTION_EVAL_FIXTURE_REQUIRED_CATEGORIES)[number];

export const AI_ACTION_EVAL_FIXTURE_IDS = [
  "ai-action.supported.task-create-ready",
  "ai-action.blocked.task-create-invalid-payload",
  "ai-action.malformed.case-status-execution-toggle",
  "ai-action.deferred.email-send-provider",
  "ai-action.blocked.unknown-case-reply"
] as const;

export type AiActionEvalFixtureId =
  (typeof AI_ACTION_EVAL_FIXTURE_IDS)[number];

export type AiActionEvalFixtureSafety = {
  readonly deterministic: true;
  readonly localOnly: true;
  readonly externalProvider: false;
  readonly network: false;
  readonly database: false;
  readonly crmRecords: false;
  readonly writes: false;
  readonly execution: false;
  readonly routeChanges: false;
  readonly routeHandlers: false;
  readonly productUi: false;
  readonly backgroundJobs: false;
};

export type AiActionEvalFixtureExpectedOutcome = {
  readonly status: AiActionReviewPacketStatus;
  readonly intentId: string | null;
  readonly payloadValidationStatus: AiActionReviewPayloadValidationStatus;
  readonly issueCodes: readonly AiActionReviewIssueCode[];
  readonly reviewResultStatus: AiActionReviewPacketStatus | null;
  readonly approvalRequired: boolean;
  readonly auditRequiredBeforeExecution: boolean;
  readonly proposalSchemaValid: boolean;
  readonly currentExecutionAllowed: false;
  readonly wouldWriteNow: false;
};

export type AiActionEvalFixture = {
  readonly id: AiActionEvalFixtureId;
  readonly name: string;
  readonly category: AiActionEvalFixtureCategory;
  readonly coverage: readonly string[];
  readonly proposal: unknown;
  readonly expectedOutcome: AiActionEvalFixtureExpectedOutcome;
  readonly safety: AiActionEvalFixtureSafety;
};

export type AiActionEvalRunOutput =
  AiActionEvalFixtureExpectedOutcome & {
    readonly contentType: typeof AI_ACTION_EVAL_FIXTURE_CONTENT_TYPE;
    readonly outputType: "ai-action-eval-fixture-output";
    readonly fixtureVersion: typeof AI_ACTION_EVAL_FIXTURE_VERSION;
    readonly reviewPacketVersion: typeof AI_ACTION_REVIEW_PACKET_VERSION;
    readonly registryVersion: typeof AI_ACTION_INTENT_REGISTRY_VERSION;
    readonly fixtureId: AiActionEvalFixtureId;
    readonly category: AiActionEvalFixtureCategory;
    readonly write: AiActionIntentWriteFlags;
    readonly safety: AiActionEvalFixtureSafety;
  };

export type AiActionEvalRunResult = {
  readonly fixture: AiActionEvalFixture;
  readonly packet: AiActionReviewPacket;
  readonly output: AiActionEvalRunOutput;
  readonly expectedOutput: AiActionEvalRunOutput;
};

export type AiActionEvalFixtureAudit = {
  readonly ok: boolean;
  readonly fixtureVersion: typeof AI_ACTION_EVAL_FIXTURE_VERSION;
  readonly reviewPacketVersion: typeof AI_ACTION_REVIEW_PACKET_VERSION;
  readonly registryVersion: typeof AI_ACTION_INTENT_REGISTRY_VERSION;
  readonly fixtureIds: readonly AiActionEvalFixtureId[];
  readonly requiredCategories: readonly AiActionEvalFixtureCategory[];
  readonly categoriesCovered: readonly AiActionEvalFixtureCategory[];
  readonly duplicateFixtureIds: readonly AiActionEvalFixtureId[];
  readonly missingRequiredCategories: readonly AiActionEvalFixtureCategory[];
  readonly fixturesWithUnexpectedOutcomes: readonly AiActionEvalFixtureId[];
  readonly fixturesWithWritesEnabled: readonly AiActionEvalFixtureId[];
  readonly fixturesWithExecutionAllowed: readonly AiActionEvalFixtureId[];
  readonly fixturesWithExternalSurfaces: readonly AiActionEvalFixtureId[];
  readonly issues: readonly string[];
};

const aiActionWriteFlagKeys = [
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

const aiActionEvalNoWriteFlags = {
  database: false,
  crmRecords: false,
  auditEvents: false,
  tasks: false,
  activities: false,
  opportunities: false,
  leads: false,
  cases: false,
  campaigns: false,
  routes: false,
  routeHandlers: false,
  productUi: false,
  files: false,
  externalServices: false,
  backgroundJobs: false,
  actionExecution: false,
  approvals: false
} as const satisfies AiActionIntentWriteFlags;

const aiActionEvalSafety = {
  deterministic: true,
  localOnly: true,
  externalProvider: false,
  network: false,
  database: false,
  crmRecords: false,
  writes: false,
  execution: false,
  routeChanges: false,
  routeHandlers: false,
  productUi: false,
  backgroundJobs: false
} as const satisfies AiActionEvalFixtureSafety;

export const AI_ACTION_EVAL_FIXTURES = [
  {
    id: "ai-action.supported.task-create-ready",
    name: "Supported task create proposal ready for review",
    category: "supported",
    coverage: [
      "supported-intent",
      "valid-payload-schema",
      "approval-required",
      "no-write-policy"
    ],
    safety: aiActionEvalSafety,
    proposal: {
      intentId: "task.create",
      target: {
        entity: "Task",
        route: "/tasks"
      },
      payload: {
        title: "Follow up on dealer order pacing",
        priority: "high",
        leadId: "lead-action-eval-1"
      },
      rationale: "Operator should review a pacing follow-up task.",
      provenance: [
        {
          kind: "record",
          ref: "lead:lead-action-eval-1"
        }
      ]
    },
    expectedOutcome: {
      status: "ready_for_review",
      intentId: "task.create",
      payloadValidationStatus: "valid",
      issueCodes: [],
      reviewResultStatus: "ready_for_review",
      approvalRequired: true,
      auditRequiredBeforeExecution: true,
      proposalSchemaValid: true,
      currentExecutionAllowed: false,
      wouldWriteNow: false
    }
  },
  {
    id: "ai-action.blocked.task-create-invalid-payload",
    name: "Supported task create proposal blocked by payload validation",
    category: "blocked",
    coverage: [
      "supported-intent",
      "invalid-payload-schema",
      "schema-validation-error",
      "no-write-policy"
    ],
    safety: aiActionEvalSafety,
    proposal: {
      intentId: "task.create",
      target: {
        entity: "Task",
        route: "/tasks"
      },
      payload: {
        title: "",
        priority: "immediate"
      },
      rationale: "Operator should review a malformed task proposal."
    },
    expectedOutcome: {
      status: "blocked",
      intentId: "task.create",
      payloadValidationStatus: "invalid",
      issueCodes: ["payload_invalid", "payload_invalid"],
      reviewResultStatus: "blocked",
      approvalRequired: true,
      auditRequiredBeforeExecution: true,
      proposalSchemaValid: true,
      currentExecutionAllowed: false,
      wouldWriteNow: false
    }
  },
  {
    id: "ai-action.malformed.case-status-execution-toggle",
    name: "Malformed case status proposal with forbidden execution toggle",
    category: "malformed",
    coverage: [
      "strict-proposal-schema",
      "forbidden-execution-toggle",
      "proposal-validation-error",
      "no-write-policy"
    ],
    safety: aiActionEvalSafety,
    proposal: {
      intentId: "case.status.update",
      target: {
        entity: "Case",
        recordId: "case-action-eval-1",
        route: "/cases?case=case-action-eval-1"
      },
      payload: {
        status: "resolved"
      },
      rationale: "Resolve the service case after operator review.",
      provenance: [
        {
          kind: "record",
          ref: "case:case-action-eval-1"
        }
      ],
      executeNow: true
    },
    expectedOutcome: {
      status: "blocked",
      intentId: "case.status.update",
      payloadValidationStatus: "skipped",
      issueCodes: ["proposal_invalid"],
      reviewResultStatus: "blocked",
      approvalRequired: true,
      auditRequiredBeforeExecution: true,
      proposalSchemaValid: false,
      currentExecutionAllowed: false,
      wouldWriteNow: false
    }
  },
  {
    id: "ai-action.deferred.email-send-provider",
    name: "Deferred email send proposal requires promotion",
    category: "deferred",
    coverage: [
      "deferred-intent",
      "provider-exclusion",
      "contract-promotion-required",
      "no-write-policy"
    ],
    safety: aiActionEvalSafety,
    proposal: {
      intentId: "email.send",
      target: {
        entity: "Lead",
        recordId: "lead-action-eval-2",
        route: "/leads/lead-action-eval-2"
      },
      payload: {
        subject: "Dealer order handoff",
        body: "Please review the lead routing handoff before any follow-up."
      },
      rationale: "Email sending is outside the current CRM contract.",
      provenance: [
        {
          kind: "record",
          ref: "lead:lead-action-eval-2"
        }
      ]
    },
    expectedOutcome: {
      status: "deferred",
      intentId: "email.send",
      payloadValidationStatus: "skipped",
      issueCodes: ["intent_deferred"],
      reviewResultStatus: "deferred",
      approvalRequired: true,
      auditRequiredBeforeExecution: true,
      proposalSchemaValid: true,
      currentExecutionAllowed: false,
      wouldWriteNow: false
    }
  },
  {
    id: "ai-action.blocked.unknown-case-reply",
    name: "Unknown case reply intent remains blocked",
    category: "blocked",
    coverage: [
      "unknown-intent",
      "strict-intent-registry",
      "proposal-validation-error",
      "no-write-policy"
    ],
    safety: aiActionEvalSafety,
    proposal: {
      intentId: "case.reply.send",
      target: {
        entity: "Case",
        recordId: "case-action-eval-2",
        route: "/cases?case=case-action-eval-2"
      },
      payload: {
        body: "Send this reply to the customer."
      },
      rationale: "The model proposed a case reply action that is not registered."
    },
    expectedOutcome: {
      status: "blocked",
      intentId: "case.reply.send",
      payloadValidationStatus: "skipped",
      issueCodes: ["intent_unknown", "proposal_invalid"],
      reviewResultStatus: null,
      approvalRequired: false,
      auditRequiredBeforeExecution: false,
      proposalSchemaValid: false,
      currentExecutionAllowed: false,
      wouldWriteNow: false
    }
  }
] as const satisfies readonly AiActionEvalFixture[];

export function listAiActionEvalFixtures(): AiActionEvalFixture[] {
  return [...AI_ACTION_EVAL_FIXTURES];
}

export function getAiActionEvalFixture(
  id: string
): AiActionEvalFixture | null {
  return AI_ACTION_EVAL_FIXTURES.find((fixture) => fixture.id === id) ?? null;
}

export function listAiActionEvalFixturesByCategory(
  category: AiActionEvalFixtureCategory
): AiActionEvalFixture[] {
  return AI_ACTION_EVAL_FIXTURES.filter(
    (fixture) => fixture.category === category
  );
}

export function runAiActionEvalFixture(
  fixture: AiActionEvalFixture
): AiActionEvalRunResult {
  const packet = buildAiActionReviewPacket(fixture.proposal);

  return {
    fixture,
    packet,
    output: buildRunOutput(fixture, packet),
    expectedOutput: buildExpectedRunOutput(fixture)
  };
}

export function auditAiActionEvalFixtures(): AiActionEvalFixtureAudit {
  const fixtures = listAiActionEvalFixtures();
  const fixtureIds = fixtures.map((fixture) => fixture.id);
  const duplicateFixtureIds = duplicateIds(fixtureIds);
  const categoriesCovered = uniqueCategories(
    fixtures.map((fixture) => fixture.category)
  );
  const missingRequiredCategories =
    AI_ACTION_EVAL_FIXTURE_REQUIRED_CATEGORIES.filter(
      (category) => !categoriesCovered.includes(category)
    );
  const runs = fixtures.map(runAiActionEvalFixture);
  const fixturesWithUnexpectedOutcomes = runs
    .filter((run) => !runOutputsEqual(run.output, run.expectedOutput))
    .map((run) => run.fixture.id);
  const fixturesWithWritesEnabled = runs
    .filter(
      (run) =>
        hasWritesEnabled(run.output.write) ||
        run.output.wouldWriteNow ||
        run.packet.summary.wouldWriteNow
    )
    .map((run) => run.fixture.id);
  const fixturesWithExecutionAllowed = runs
    .filter(
      (run) =>
        run.output.currentExecutionAllowed ||
        run.packet.summary.currentExecutionAllowed ||
        run.packet.safety.execution
    )
    .map((run) => run.fixture.id);
  const fixturesWithExternalSurfaces = fixtures
    .filter((fixture) => hasExternalSurface(fixture.safety))
    .map((fixture) => fixture.id);
  const issues = [
    ...duplicateFixtureIds.map((id) => `Duplicate AI action eval fixture ${id}.`),
    ...missingRequiredCategories.map(
      (category) => `Missing AI action eval fixture category ${category}.`
    ),
    ...fixturesWithUnexpectedOutcomes.map(
      (id) => `AI action eval fixture ${id} does not match its golden outcome.`
    ),
    ...fixturesWithWritesEnabled.map(
      (id) => `AI action eval fixture ${id} enables writes.`
    ),
    ...fixturesWithExecutionAllowed.map(
      (id) => `AI action eval fixture ${id} enables execution.`
    ),
    ...fixturesWithExternalSurfaces.map(
      (id) => `AI action eval fixture ${id} references an external surface.`
    )
  ];

  return {
    ok: issues.length === 0,
    fixtureVersion: AI_ACTION_EVAL_FIXTURE_VERSION,
    reviewPacketVersion: AI_ACTION_REVIEW_PACKET_VERSION,
    registryVersion: AI_ACTION_INTENT_REGISTRY_VERSION,
    fixtureIds,
    requiredCategories: [...AI_ACTION_EVAL_FIXTURE_REQUIRED_CATEGORIES],
    categoriesCovered,
    duplicateFixtureIds,
    missingRequiredCategories,
    fixturesWithUnexpectedOutcomes,
    fixturesWithWritesEnabled,
    fixturesWithExecutionAllowed,
    fixturesWithExternalSurfaces,
    issues
  };
}

function buildRunOutput(
  fixture: AiActionEvalFixture,
  packet: AiActionReviewPacket
): AiActionEvalRunOutput {
  return {
    ...extractOutcome(packet, fixture.proposal),
    contentType: AI_ACTION_EVAL_FIXTURE_CONTENT_TYPE,
    outputType: "ai-action-eval-fixture-output",
    fixtureVersion: AI_ACTION_EVAL_FIXTURE_VERSION,
    reviewPacketVersion: AI_ACTION_REVIEW_PACKET_VERSION,
    registryVersion: AI_ACTION_INTENT_REGISTRY_VERSION,
    fixtureId: fixture.id,
    category: fixture.category,
    write: packet.write,
    safety: fixture.safety
  };
}

function buildExpectedRunOutput(
  fixture: AiActionEvalFixture
): AiActionEvalRunOutput {
  return {
    ...fixture.expectedOutcome,
    contentType: AI_ACTION_EVAL_FIXTURE_CONTENT_TYPE,
    outputType: "ai-action-eval-fixture-output",
    fixtureVersion: AI_ACTION_EVAL_FIXTURE_VERSION,
    reviewPacketVersion: AI_ACTION_REVIEW_PACKET_VERSION,
    registryVersion: AI_ACTION_INTENT_REGISTRY_VERSION,
    fixtureId: fixture.id,
    category: fixture.category,
    write: aiActionEvalNoWriteFlags,
    safety: fixture.safety
  };
}

function extractOutcome(
  packet: AiActionReviewPacket,
  proposal: unknown
): AiActionEvalFixtureExpectedOutcome {
  return {
    status: packet.status,
    intentId: packet.proposal.intentId,
    payloadValidationStatus: packet.payloadValidation.status,
    issueCodes: packet.issues.map((issue) => issue.code),
    reviewResultStatus: packet.reviewResult?.status ?? null,
    approvalRequired: packet.approval?.approvalRequired ?? false,
    auditRequiredBeforeExecution:
      packet.audit?.auditRequiredBeforeExecution ?? false,
    proposalSchemaValid: aiActionIntentProposalSchema.safeParse(proposal).success,
    currentExecutionAllowed: packet.summary.currentExecutionAllowed,
    wouldWriteNow: packet.summary.wouldWriteNow
  };
}

function duplicateIds(
  ids: readonly AiActionEvalFixtureId[]
): AiActionEvalFixtureId[] {
  const seen = new Set<AiActionEvalFixtureId>();
  const duplicates = new Set<AiActionEvalFixtureId>();

  for (const id of ids) {
    if (seen.has(id)) {
      duplicates.add(id);
    }

    seen.add(id);
  }

  return [...duplicates];
}

function uniqueCategories(
  categories: readonly AiActionEvalFixtureCategory[]
): AiActionEvalFixtureCategory[] {
  return [...new Set(categories)];
}

function runOutputsEqual(
  left: AiActionEvalRunOutput,
  right: AiActionEvalRunOutput
): boolean {
  return (
    left.contentType === right.contentType &&
    left.outputType === right.outputType &&
    left.fixtureVersion === right.fixtureVersion &&
    left.reviewPacketVersion === right.reviewPacketVersion &&
    left.registryVersion === right.registryVersion &&
    left.fixtureId === right.fixtureId &&
    left.category === right.category &&
    left.status === right.status &&
    left.intentId === right.intentId &&
    left.payloadValidationStatus === right.payloadValidationStatus &&
    left.reviewResultStatus === right.reviewResultStatus &&
    left.approvalRequired === right.approvalRequired &&
    left.auditRequiredBeforeExecution === right.auditRequiredBeforeExecution &&
    left.proposalSchemaValid === right.proposalSchemaValid &&
    left.currentExecutionAllowed === right.currentExecutionAllowed &&
    left.wouldWriteNow === right.wouldWriteNow &&
    arraysEqual(left.issueCodes, right.issueCodes) &&
    writeFlagsEqual(left.write, right.write) &&
    safetyEqual(left.safety, right.safety)
  );
}

function arraysEqual<T extends string>(
  left: readonly T[],
  right: readonly T[]
): boolean {
  return left.length === right.length && left.every((item, index) => item === right[index]);
}

function writeFlagsEqual(
  left: AiActionIntentWriteFlags,
  right: AiActionIntentWriteFlags
): boolean {
  return aiActionWriteFlagKeys.every((key) => left[key] === right[key]);
}

function hasWritesEnabled(write: AiActionIntentWriteFlags): boolean {
  return aiActionWriteFlagKeys.some((key) => write[key]);
}

function safetyEqual(
  left: AiActionEvalFixtureSafety,
  right: AiActionEvalFixtureSafety
): boolean {
  return (
    left.deterministic === right.deterministic &&
    left.localOnly === right.localOnly &&
    left.externalProvider === right.externalProvider &&
    left.network === right.network &&
    left.database === right.database &&
    left.crmRecords === right.crmRecords &&
    left.writes === right.writes &&
    left.execution === right.execution &&
    left.routeChanges === right.routeChanges &&
    left.routeHandlers === right.routeHandlers &&
    left.productUi === right.productUi &&
    left.backgroundJobs === right.backgroundJobs
  );
}

function hasExternalSurface(safety: AiActionEvalFixtureSafety): boolean {
  return (
    safety.externalProvider ||
    safety.network ||
    safety.database ||
    safety.crmRecords ||
    safety.writes ||
    safety.execution ||
    safety.routeChanges ||
    safety.routeHandlers ||
    safety.productUi ||
    safety.backgroundJobs
  );
}
