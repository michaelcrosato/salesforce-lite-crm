import { z } from "zod/v4";
import {
  AI_ACTION_INTENT_REGISTRY_VERSION,
  AI_ACTION_INTENT_SUPPORTED_IDS,
  aiActionIntentProposalSchema,
  aiActionIntentReviewResultSchema,
  getAiActionIntent,
  getAiActionIntentRegistry,
  type AiActionIntentAuditExpectation,
  type AiActionIntentId,
  type AiActionIntentRegistryEntry,
  type AiActionIntentSchemaRef,
  type AiActionIntentSupportedId,
  type AiActionIntentSafety,
  type AiActionIntentWriteFlags
} from "@/lib/ai/actionIntentRegistry";
import {
  campaignUpdateSchema,
  caseUpdateSchema,
  dealMoveSchema,
  leadStatusUpdateSchema,
  noteCreateSchema,
  taskCreateSchema
} from "@/lib/validation";

export const AI_ACTION_REVIEW_PACKET_CONTENT_TYPE =
  "application/json; charset=utf-8" as const;

export const AI_ACTION_REVIEW_PACKET_VERSION = "2026-05-26.s45-f2" as const;

export type AiActionReviewPacketStatus =
  | "ready_for_review"
  | "deferred"
  | "blocked";

export type AiActionReviewIssueCode =
  | "intent_deferred"
  | "intent_unknown"
  | "payload_invalid"
  | "proposal_invalid";

export type AiActionReviewIssueSeverity = "info" | "warning" | "error";

export type AiActionReviewIssue = {
  readonly code: AiActionReviewIssueCode;
  readonly severity: AiActionReviewIssueSeverity;
  readonly path: string;
  readonly message: string;
};

export type AiActionReviewProposalSnapshot = {
  readonly intentId: string | null;
  readonly target: {
    readonly entity: string;
    readonly recordId: string | null;
    readonly route: string | null;
  } | null;
  readonly rationale: string | null;
  readonly provenanceCount: number;
  readonly payloadKeys: readonly string[];
};

export type AiActionReviewPayloadValidationStatus =
  | "valid"
  | "invalid"
  | "skipped";

export type AiActionReviewPayloadValidation = {
  readonly status: AiActionReviewPayloadValidationStatus;
  readonly schema: AiActionIntentSchemaRef | null;
  readonly payloadKeyCount: number;
  readonly payloadKeys: readonly string[];
  readonly issueCount: number;
  readonly issues: readonly AiActionReviewIssue[];
};

export type AiActionReviewApprovalExpectation = {
  readonly approvalRequired: true;
  readonly mode: "explicit_operator_approval";
  readonly actorRequired: true;
  readonly identityRequiredBeforeExecution: true;
  readonly approvalPersistence: false;
  readonly currentExecutionAllowed: false;
  readonly reason: string;
};

export type AiActionReviewAuditExpectation = AiActionIntentAuditExpectation & {
  readonly auditRequiredBeforeExecution: boolean;
  readonly wouldRecordAuditNow: false;
};

export type AiActionReviewPacketReadFlags = {
  readonly metadata: true;
  readonly registry: true;
  readonly proposal: true;
  readonly payloadValidation: true;
  readonly database: false;
  readonly crmRecords: false;
  readonly runtimeExecution: false;
};

export type AiActionReviewPacketSafety = AiActionIntentSafety & {
  readonly reviewOnly: true;
  readonly validatesPayload: true;
  readonly execution: false;
  readonly silentWrites: false;
  readonly auditPersistence: false;
  readonly approvalPersistence: false;
};

export type AiActionReviewResult = z.infer<
  typeof aiActionIntentReviewResultSchema
>;

export type AiActionReviewSummary = {
  readonly packetCount: number;
  readonly readyCount: number;
  readonly blockedCount: number;
  readonly deferredCount: number;
  readonly issueCount: number;
  readonly approvalRequiredCount: number;
  readonly auditRequiredBeforeExecutionCount: number;
  readonly currentExecutionAllowed: false;
  readonly wouldWriteNow: false;
};

export type AiActionReviewPacketSource = {
  readonly module: "lib/ai/actionReviewPackets.ts";
  readonly packetScope: "preview-only-ai-action-review-packets";
  readonly registryModule: "lib/ai/actionIntentRegistry.ts";
  readonly registryVersion: typeof AI_ACTION_INTENT_REGISTRY_VERSION;
  readonly proposalSchema: "aiActionIntentProposalSchema";
  readonly reviewResultSchema: "aiActionIntentReviewResultSchema";
  readonly supportedPayloadSchemas: readonly AiActionIntentSchemaRef[];
  readonly routeScope: readonly string[];
};

export type AiActionReviewPacket = {
  readonly contentType: typeof AI_ACTION_REVIEW_PACKET_CONTENT_TYPE;
  readonly packetType: "ai-action-review-packet";
  readonly packetVersion: typeof AI_ACTION_REVIEW_PACKET_VERSION;
  readonly status: AiActionReviewPacketStatus;
  readonly proposal: AiActionReviewProposalSnapshot;
  readonly intent: AiActionIntentRegistryEntry | null;
  readonly payloadValidation: AiActionReviewPayloadValidation;
  readonly reviewResult: AiActionReviewResult | null;
  readonly approval: AiActionReviewApprovalExpectation | null;
  readonly audit: AiActionReviewAuditExpectation | null;
  readonly summary: AiActionReviewSummary;
  readonly issues: readonly AiActionReviewIssue[];
  readonly source: AiActionReviewPacketSource;
  readonly read: AiActionReviewPacketReadFlags;
  readonly write: AiActionIntentWriteFlags;
  readonly safety: AiActionReviewPacketSafety;
};

export type AiActionReviewPacketBatch = {
  readonly contentType: typeof AI_ACTION_REVIEW_PACKET_CONTENT_TYPE;
  readonly packetType: "ai-action-review-packet-batch";
  readonly packetVersion: typeof AI_ACTION_REVIEW_PACKET_VERSION;
  readonly packets: readonly AiActionReviewPacket[];
  readonly summary: AiActionReviewSummary;
  readonly source: AiActionReviewPacketSource;
  readonly read: AiActionReviewPacketReadFlags;
  readonly write: AiActionIntentWriteFlags;
  readonly safety: AiActionReviewPacketSafety;
};

export type AiActionReviewPacketAudit = {
  readonly ok: boolean;
  readonly packetVersion: typeof AI_ACTION_REVIEW_PACKET_VERSION;
  readonly registryVersion: typeof AI_ACTION_INTENT_REGISTRY_VERSION;
  readonly supportedIntentIds: readonly AiActionIntentSupportedId[];
  readonly payloadSchemaIntentIds: readonly AiActionIntentSupportedId[];
  readonly supportedIntentIdsWithoutPayloadSchemas: readonly AiActionIntentSupportedId[];
  readonly payloadSchemaIntentIdsWithoutRegistryEntries: readonly AiActionIntentSupportedId[];
  readonly reviewPacketsWouldWrite: false;
  readonly reviewPacketsWouldExecute: false;
  readonly issues: readonly string[];
};

const supportedPayloadSchemas = {
  "task.create": taskCreateSchema,
  "activity.note.create": noteCreateSchema,
  "opportunity.stage.update": dealMoveSchema,
  "lead.status.update": leadStatusUpdateSchema,
  "case.status.update": caseUpdateSchema,
  "campaign.status.update": campaignUpdateSchema
} as const satisfies Record<AiActionIntentSupportedId, z.ZodType<unknown>>;

const supportedPayloadSchemaRefs = Object.fromEntries(
  AI_ACTION_INTENT_SUPPORTED_IDS.map((intentId) => [
    intentId,
    getRequiredSupportedIntent(intentId).inputSchema
  ])
) as Record<AiActionIntentSupportedId, AiActionIntentSchemaRef>;

function readFlags(): AiActionReviewPacketReadFlags {
  return {
    metadata: true,
    registry: true,
    proposal: true,
    payloadValidation: true,
    database: false,
    crmRecords: false,
    runtimeExecution: false
  };
}

function safetyFlags(): AiActionReviewPacketSafety {
  const registry = getAiActionIntentRegistry();

  return {
    ...registry.safety,
    reviewOnly: true,
    validatesPayload: true,
    execution: false,
    silentWrites: false,
    auditPersistence: false,
    approvalPersistence: false
  };
}

function writeFlags(): AiActionIntentWriteFlags {
  return { ...getAiActionIntentRegistry().write };
}

function buildSource(): AiActionReviewPacketSource {
  const registry = getAiActionIntentRegistry();

  return {
    module: "lib/ai/actionReviewPackets.ts",
    packetScope: "preview-only-ai-action-review-packets",
    registryModule: "lib/ai/actionIntentRegistry.ts",
    registryVersion: AI_ACTION_INTENT_REGISTRY_VERSION,
    proposalSchema: "aiActionIntentProposalSchema",
    reviewResultSchema: "aiActionIntentReviewResultSchema",
    supportedPayloadSchemas: AI_ACTION_INTENT_SUPPORTED_IDS.map(
      (intentId) => supportedPayloadSchemaRefs[intentId]
    ),
    routeScope: [...registry.source.routeScope]
  };
}

export function buildAiActionReviewPacket(input: unknown): AiActionReviewPacket {
  const proposalResult = aiActionIntentProposalSchema.safeParse(input);
  const extractedIntentId = extractIntentId(input);
  const proposal = proposalResult.success
    ? snapshotProposal(proposalResult.data)
    : snapshotInvalidProposal(input, extractedIntentId);
  const intent = proposalResult.success
    ? getAiActionIntent(proposalResult.data.intentId)
    : extractedIntentId
      ? getAiActionIntent(extractedIntentId)
      : null;
  const proposalIssues = proposalResult.success
    ? []
    : proposalResult.error.issues.map((issue) =>
        buildIssue("proposal_invalid", "error", issue)
      );

  if (!proposalResult.success) {
    const unknownIntentIssue = buildUnknownIntentIssue(extractedIntentId);
    return buildPacket({
      proposal,
      intent,
      status: "blocked",
      payloadValidation: skippedPayloadValidation(
        intent?.inputSchema ?? null,
        proposal.payloadKeys
      ),
      issues: unknownIntentIssue
        ? [unknownIntentIssue, ...proposalIssues]
        : proposalIssues
    });
  }

  if (!intent) {
    return buildPacket({
      proposal,
      intent,
      status: "blocked",
      payloadValidation: skippedPayloadValidation(null, proposal.payloadKeys),
      issues: [buildUnknownIntentIssue(proposalResult.data.intentId)].filter(
        isIssue
      )
    });
  }

  if (intent.status === "deferred") {
    const issue = {
      code: "intent_deferred",
      severity: "warning",
      path: "intentId",
      message: `AI action intent '${intent.id}' is deferred: ${
        intent.deferral?.safeNextStep ??
        "Promote the intent before review can continue."
      }`
    } as const satisfies AiActionReviewIssue;

    return buildPacket({
      proposal,
      intent,
      status: "deferred",
      payloadValidation: skippedPayloadValidation(
        intent.inputSchema,
        proposal.payloadKeys
      ),
      issues: [issue]
    });
  }

  const payloadValidation = validateSupportedPayload(
    intent.id,
    proposalResult.data.payload
  );

  return buildPacket({
    proposal,
    intent,
    status:
      payloadValidation.status === "valid" ? "ready_for_review" : "blocked",
    payloadValidation,
    issues: [...payloadValidation.issues]
  });
}

export function buildAiActionReviewPacketBatch(
  inputs: readonly unknown[]
): AiActionReviewPacketBatch {
  const packets = inputs.map(buildAiActionReviewPacket);

  return {
    contentType: AI_ACTION_REVIEW_PACKET_CONTENT_TYPE,
    packetType: "ai-action-review-packet-batch",
    packetVersion: AI_ACTION_REVIEW_PACKET_VERSION,
    packets,
    summary: summarizePackets(packets),
    source: buildSource(),
    read: readFlags(),
    write: writeFlags(),
    safety: safetyFlags()
  };
}

export function auditAiActionReviewPackets(): AiActionReviewPacketAudit {
  const payloadSchemaIntentIds = Object.keys(
    supportedPayloadSchemas
  ) as AiActionIntentSupportedId[];
  const supportedIntentIdsWithoutPayloadSchemas =
    AI_ACTION_INTENT_SUPPORTED_IDS.filter(
      (intentId) => !payloadSchemaIntentIds.includes(intentId)
    );
  const payloadSchemaIntentIdsWithoutRegistryEntries =
    payloadSchemaIntentIds.filter(
      (intentId) => getAiActionIntent(intentId)?.status !== "supported"
    );
  const issues = [
    ...supportedIntentIdsWithoutPayloadSchemas.map(
      (intentId) =>
        `Supported AI action intent ${intentId} has no payload schema validator.`
    ),
    ...payloadSchemaIntentIdsWithoutRegistryEntries.map(
      (intentId) =>
        `Payload schema validator ${intentId} has no supported registry entry.`
    )
  ];

  return {
    ok: issues.length === 0,
    packetVersion: AI_ACTION_REVIEW_PACKET_VERSION,
    registryVersion: AI_ACTION_INTENT_REGISTRY_VERSION,
    supportedIntentIds: [...AI_ACTION_INTENT_SUPPORTED_IDS],
    payloadSchemaIntentIds,
    supportedIntentIdsWithoutPayloadSchemas,
    payloadSchemaIntentIdsWithoutRegistryEntries,
    reviewPacketsWouldWrite: false,
    reviewPacketsWouldExecute: false,
    issues
  };
}

function buildPacket(input: {
  proposal: AiActionReviewProposalSnapshot;
  intent: AiActionIntentRegistryEntry | null;
  status: AiActionReviewPacketStatus;
  payloadValidation: AiActionReviewPayloadValidation;
  issues: readonly AiActionReviewIssue[];
}): AiActionReviewPacket {
  const reviewResult = buildReviewResult(input);
  const approval = input.intent ? buildApproval(input.intent) : null;
  const audit = input.intent ? buildAudit(input.intent) : null;
  const packetForSummary = {
    status: input.status,
    issues: input.issues,
    approval,
    audit
  };

  return {
    contentType: AI_ACTION_REVIEW_PACKET_CONTENT_TYPE,
    packetType: "ai-action-review-packet",
    packetVersion: AI_ACTION_REVIEW_PACKET_VERSION,
    status: input.status,
    proposal: input.proposal,
    intent: input.intent,
    payloadValidation: input.payloadValidation,
    reviewResult,
    approval,
    audit,
    summary: summarizePacket(packetForSummary),
    issues: input.issues,
    source: buildSource(),
    read: readFlags(),
    write: writeFlags(),
    safety: safetyFlags()
  };
}

function buildReviewResult(input: {
  intent: AiActionIntentRegistryEntry | null;
  status: AiActionReviewPacketStatus;
  issues: readonly AiActionReviewIssue[];
}): AiActionReviewResult | null {
  if (!input.intent) {
    return null;
  }

  return aiActionIntentReviewResultSchema.parse({
    intentId: input.intent.id,
    status: input.status,
    approvalRequired: true,
    auditRequiredBeforeExecution: input.intent.audit.executionAuditRequired,
    currentExecutionAllowed: false,
    wouldWriteNow: false,
    issues: input.issues.map((issue) => issue.message)
  });
}

function validateSupportedPayload(
  intentId: AiActionIntentId,
  payload: Record<string, unknown>
): AiActionReviewPayloadValidation {
  if (!isSupportedPayloadIntentId(intentId)) {
    return skippedPayloadValidation(null, Object.keys(payload).sort());
  }

  const schema = supportedPayloadSchemas[intentId];
  const schemaRef = supportedPayloadSchemaRefs[intentId];
  const result = schema.safeParse(payload);
  const issues = result.success
    ? []
    : result.error.issues.map((issue) =>
        buildIssue("payload_invalid", "error", issue)
      );

  return {
    status: result.success ? "valid" : "invalid",
    schema: schemaRef,
    payloadKeyCount: Object.keys(payload).length,
    payloadKeys: Object.keys(payload).sort(),
    issueCount: issues.length,
    issues
  };
}

function skippedPayloadValidation(
  schema: AiActionIntentSchemaRef | null,
  payloadKeys: readonly string[]
): AiActionReviewPayloadValidation {
  return {
    status: "skipped",
    schema,
    payloadKeyCount: payloadKeys.length,
    payloadKeys: [...payloadKeys].sort(),
    issueCount: 0,
    issues: []
  };
}

function snapshotProposal(
  proposal: z.infer<typeof aiActionIntentProposalSchema>
): AiActionReviewProposalSnapshot {
  const payloadKeys = Object.keys(proposal.payload).sort();

  return {
    intentId: proposal.intentId,
    target: {
      entity: proposal.target.entity,
      recordId: proposal.target.recordId ?? null,
      route: proposal.target.route ?? null
    },
    rationale: proposal.rationale,
    provenanceCount: proposal.provenance.length,
    payloadKeys
  };
}

function snapshotInvalidProposal(
  input: unknown,
  intentId: string | null
): AiActionReviewProposalSnapshot {
  const recordResult = z.record(z.string(), z.unknown()).safeParse(input);
  const payloadResult = recordResult.success
    ? z.record(z.string(), z.unknown()).safeParse(recordResult.data.payload)
    : { success: false } as const;

  return {
    intentId,
    target: null,
    rationale: null,
    provenanceCount: 0,
    payloadKeys: payloadResult.success ? Object.keys(payloadResult.data).sort() : []
  };
}

function buildApproval(
  intent: AiActionIntentRegistryEntry
): AiActionReviewApprovalExpectation {
  return {
    approvalRequired: true,
    mode: intent.approval.mode,
    actorRequired: intent.approval.actorRequired,
    identityRequiredBeforeExecution:
      intent.approval.identityRequiredBeforeExecution,
    approvalPersistence: intent.approval.approvalPersistence,
    currentExecutionAllowed: intent.safety.currentExecutionAllowed,
    reason: intent.approval.reason
  };
}

function buildAudit(
  intent: AiActionIntentRegistryEntry
): AiActionReviewAuditExpectation {
  return {
    ...intent.audit,
    auditRequiredBeforeExecution: intent.audit.executionAuditRequired,
    wouldRecordAuditNow: false
  };
}

function summarizePacket(input: {
  status: AiActionReviewPacketStatus;
  issues: readonly AiActionReviewIssue[];
  approval: AiActionReviewApprovalExpectation | null;
  audit: AiActionReviewAuditExpectation | null;
}): AiActionReviewSummary {
  return {
    packetCount: 1,
    readyCount: input.status === "ready_for_review" ? 1 : 0,
    blockedCount: input.status === "blocked" ? 1 : 0,
    deferredCount: input.status === "deferred" ? 1 : 0,
    issueCount: input.issues.length,
    approvalRequiredCount: input.approval ? 1 : 0,
    auditRequiredBeforeExecutionCount: input.audit?.auditRequiredBeforeExecution
      ? 1
      : 0,
    currentExecutionAllowed: false,
    wouldWriteNow: false
  };
}

function summarizePackets(
  packets: readonly AiActionReviewPacket[]
): AiActionReviewSummary {
  return packets.reduce<AiActionReviewSummary>(
    (summary, packet) => ({
      packetCount: summary.packetCount + 1,
      readyCount:
        summary.readyCount + (packet.status === "ready_for_review" ? 1 : 0),
      blockedCount: summary.blockedCount + (packet.status === "blocked" ? 1 : 0),
      deferredCount:
        summary.deferredCount + (packet.status === "deferred" ? 1 : 0),
      issueCount: summary.issueCount + packet.issues.length,
      approvalRequiredCount:
        summary.approvalRequiredCount + (packet.approval ? 1 : 0),
      auditRequiredBeforeExecutionCount:
        summary.auditRequiredBeforeExecutionCount +
        (packet.audit?.auditRequiredBeforeExecution ? 1 : 0),
      currentExecutionAllowed: false,
      wouldWriteNow: false
    }),
    {
      packetCount: 0,
      readyCount: 0,
      blockedCount: 0,
      deferredCount: 0,
      issueCount: 0,
      approvalRequiredCount: 0,
      auditRequiredBeforeExecutionCount: 0,
      currentExecutionAllowed: false,
      wouldWriteNow: false
    }
  );
}

function buildIssue(
  code: AiActionReviewIssueCode,
  severity: AiActionReviewIssueSeverity,
  issue: z.ZodIssue
): AiActionReviewIssue {
  return {
    code,
    severity,
    path: issue.path.length > 0 ? issue.path.map(String).join(".") : "root",
    message: issue.message
  };
}

function buildUnknownIntentIssue(
  intentId: string | null
): AiActionReviewIssue | null {
  if (intentId !== null && getAiActionIntent(intentId)) {
    return null;
  }

  return {
    code: "intent_unknown",
    severity: "error",
    path: "intentId",
    message:
      intentId === null
        ? "AI action intent is missing or invalid."
        : `AI action intent '${intentId}' is not registered.`
  };
}

function extractIntentId(input: unknown): string | null {
  const recordResult = z.record(z.string(), z.unknown()).safeParse(input);

  if (!recordResult.success) {
    return null;
  }

  const value = recordResult.data.intentId;
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function isIssue(value: AiActionReviewIssue | null): value is AiActionReviewIssue {
  return value !== null;
}

function isSupportedPayloadIntentId(
  intentId: AiActionIntentId
): intentId is AiActionIntentSupportedId {
  return AI_ACTION_INTENT_SUPPORTED_IDS.includes(
    intentId as AiActionIntentSupportedId
  );
}

function getRequiredSupportedIntent(
  intentId: AiActionIntentSupportedId
): AiActionIntentRegistryEntry {
  const intent = getAiActionIntent(intentId);

  if (!intent || intent.status !== "supported") {
    throw new Error(`Missing supported AI action intent ${intentId}.`);
  }

  return intent;
}
