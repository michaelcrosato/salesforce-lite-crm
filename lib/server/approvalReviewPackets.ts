import { z } from "zod/v4";
import {
  APPROVAL_POLICY_BLOCKED_SUBJECT_IDS,
  APPROVAL_POLICY_CONTENT_TYPE,
  APPROVAL_POLICY_REGISTRY_VERSION,
  APPROVAL_POLICY_SUPPORTED_SUBJECT_IDS,
  getApprovalPolicyRegistry,
  getApprovalPolicySubject,
  type ApprovalPolicyAuditExpectation,
  type ApprovalPolicyEvidenceRequirement,
  type ApprovalPolicyReadFlags,
  type ApprovalPolicyReviewer,
  type ApprovalPolicySubject,
  type ApprovalPolicyWriteFlags
} from "@/lib/server/approvalPolicyRegistry";

export const APPROVAL_REVIEW_PACKET_CONTENT_TYPE =
  APPROVAL_POLICY_CONTENT_TYPE;

export const APPROVAL_REVIEW_PACKET_VERSION = "2026-05-26.s47-f2" as const;

export const APPROVAL_REVIEW_PACKET_STATUSES = [
  "approval_needed",
  "blocked",
  "not_needed"
] as const;

export const APPROVAL_REVIEW_PROPOSAL_SOURCES = [
  "ai_action_review_packet",
  "bulk_action_dry_run_review_packet",
  "workflow_rule_review_packet",
  "csv_import_apply_preflight",
  "approval_policy_registry",
  "operator_input"
] as const;

export const APPROVAL_REVIEW_PROPOSAL_INTENTS = [
  "future_execution",
  "read_only_review",
  "approval_decision"
] as const;

export const APPROVAL_REVIEW_EVIDENCE_SOURCES = [
  "audit_context",
  "dry_run",
  "operator_input",
  "policy_registry",
  "proposal",
  "review_packet"
] as const;

export const APPROVAL_REVIEW_REQUESTED_CAPABILITY_KEYS = [
  "recordMutation",
  "databaseWrite",
  "auditEventWrite",
  "approvalDecisionWrite",
  "actionExecution",
  "externalProvider",
  "networkRequest",
  "backgroundJob",
  "routeChange",
  "productUi",
  "routingExecution",
  "dealerOrderAreaCrud"
] as const;

export type ApprovalReviewPacketStatus =
  (typeof APPROVAL_REVIEW_PACKET_STATUSES)[number];

export type ApprovalReviewProposalSource =
  (typeof APPROVAL_REVIEW_PROPOSAL_SOURCES)[number];

export type ApprovalReviewProposalIntent =
  (typeof APPROVAL_REVIEW_PROPOSAL_INTENTS)[number];

export type ApprovalReviewEvidenceSource =
  (typeof APPROVAL_REVIEW_EVIDENCE_SOURCES)[number];

export type ApprovalReviewRequestedCapabilityKey =
  (typeof APPROVAL_REVIEW_REQUESTED_CAPABILITY_KEYS)[number];

export type ApprovalReviewIssueCode =
  | "approval_decision_not_supported"
  | "approval_intent_conflict"
  | "capability_blocked"
  | "evidence_missing"
  | "proposal_invalid"
  | "subject_blocked"
  | "subject_unknown";

export type ApprovalReviewIssueSeverity = "info" | "warning" | "error";

export type ApprovalReviewIssue = {
  readonly code: ApprovalReviewIssueCode;
  readonly severity: ApprovalReviewIssueSeverity;
  readonly path: string;
  readonly message: string;
};

export type ApprovalReviewEvidenceInput = {
  readonly key: string;
  readonly source: ApprovalReviewEvidenceSource;
  readonly summary: string;
};

export type ApprovalReviewTarget = {
  readonly entity: string;
  readonly recordCount: number;
  readonly route: string | null;
};

export type ApprovalReviewRequestedCapabilities = Record<
  ApprovalReviewRequestedCapabilityKey,
  boolean
>;

export type ApprovalReviewProposalSnapshot = {
  readonly proposalId: string | null;
  readonly subjectId: string | null;
  readonly label: string | null;
  readonly source: ApprovalReviewProposalSource | null;
  readonly approvalIntent: ApprovalReviewProposalIntent | null;
  readonly target: ApprovalReviewTarget | null;
  readonly evidenceKeys: readonly string[];
  readonly requestedCapabilityKeys: readonly ApprovalReviewRequestedCapabilityKey[];
  readonly rationale: string | null;
};

export type ApprovalReviewEvidenceCheck = ApprovalPolicyEvidenceRequirement & {
  readonly present: boolean;
  readonly providedSource: ApprovalReviewEvidenceSource | null;
  readonly providedSummary: string | null;
};

export type ApprovalReviewApprovalExpectation = {
  readonly approvalRequired: boolean;
  readonly mode: "explicit_operator_approval" | "blocked" | "not_required";
  readonly reviewer: ApprovalPolicyReviewer | null;
  readonly identityRequiredBeforeExecution: boolean;
  readonly approvalPersistence: false;
  readonly currentApprovalDecisionAllowed: false;
  readonly currentExecutionAllowed: false;
  readonly reason: string;
};

export type ApprovalReviewAuditExpectation = ApprovalPolicyAuditExpectation & {
  readonly auditRequiredBeforeExecution: boolean;
  readonly reviewPacketWouldRecordAuditNow: false;
  readonly approvalDecisionWouldRecordNow: false;
  readonly executionWouldRecordNow: false;
};

export type ApprovalReviewPacketReadFlags = ApprovalPolicyReadFlags & {
  readonly registry: true;
  readonly proposal: true;
  readonly evidence: true;
};

export type ApprovalReviewPacketSafety = {
  readonly deterministic: true;
  readonly reviewOnly: true;
  readonly readOnly: true;
  readonly evaluatesEvidence: true;
  readonly currentApprovalDecisionAllowed: false;
  readonly currentExecutionAllowed: false;
  readonly approvalPersistence: false;
  readonly approvalDecisionPersistence: false;
  readonly authEnforcement: false;
  readonly externalProvider: false;
  readonly network: false;
  readonly routeChanges: false;
  readonly productUi: false;
  readonly routingExecution: false;
  readonly dealerOrderAreaCrud: false;
  readonly backgroundJobs: false;
};

export type ApprovalReviewSummary = {
  readonly packetCount: number;
  readonly approvalNeededCount: number;
  readonly blockedCount: number;
  readonly notNeededCount: number;
  readonly issueCount: number;
  readonly missingEvidenceCount: number;
  readonly approvalRequiredCount: number;
  readonly auditRequiredBeforeExecutionCount: number;
  readonly currentApprovalDecisionAllowed: false;
  readonly currentExecutionAllowed: false;
  readonly wouldWriteNow: false;
  readonly approvalPersistence: false;
};

export type ApprovalReviewPacketSource = {
  readonly module: "lib/server/approvalReviewPackets.ts";
  readonly packetScope: "no-write-approval-review-packets";
  readonly registryModule: "lib/server/approvalPolicyRegistry.ts";
  readonly registryVersion: typeof APPROVAL_POLICY_REGISTRY_VERSION;
  readonly proposalSchema: "approvalReviewProposalSchema";
  readonly supportedSubjectIds: readonly (typeof APPROVAL_POLICY_SUPPORTED_SUBJECT_IDS)[number][];
  readonly blockedSubjectIds: readonly (typeof APPROVAL_POLICY_BLOCKED_SUBJECT_IDS)[number][];
  readonly sampleProposalCount: number;
  readonly routeScope: readonly string[];
};

export type ApprovalReviewPacket = {
  readonly contentType: typeof APPROVAL_REVIEW_PACKET_CONTENT_TYPE;
  readonly packetType: "approval-review-packet";
  readonly packetVersion: typeof APPROVAL_REVIEW_PACKET_VERSION;
  readonly status: ApprovalReviewPacketStatus;
  readonly proposal: ApprovalReviewProposalSnapshot;
  readonly subject: ApprovalPolicySubject | null;
  readonly evidence: readonly ApprovalReviewEvidenceCheck[];
  readonly approval: ApprovalReviewApprovalExpectation | null;
  readonly audit: ApprovalReviewAuditExpectation | null;
  readonly summary: ApprovalReviewSummary;
  readonly issues: readonly ApprovalReviewIssue[];
  readonly source: ApprovalReviewPacketSource;
  readonly read: ApprovalReviewPacketReadFlags;
  readonly write: ApprovalPolicyWriteFlags;
  readonly safety: ApprovalReviewPacketSafety;
};

export type ApprovalReviewPacketBatch = {
  readonly contentType: typeof APPROVAL_REVIEW_PACKET_CONTENT_TYPE;
  readonly packetType: "approval-review-packet-batch";
  readonly packetVersion: typeof APPROVAL_REVIEW_PACKET_VERSION;
  readonly packets: readonly ApprovalReviewPacket[];
  readonly summary: ApprovalReviewSummary;
  readonly source: ApprovalReviewPacketSource;
  readonly read: ApprovalReviewPacketReadFlags;
  readonly write: ApprovalPolicyWriteFlags;
  readonly safety: ApprovalReviewPacketSafety;
};

export type ApprovalReviewPacketAudit = {
  readonly ok: boolean;
  readonly packetVersion: typeof APPROVAL_REVIEW_PACKET_VERSION;
  readonly registryVersion: typeof APPROVAL_POLICY_REGISTRY_VERSION;
  readonly supportedSubjectIds: readonly (typeof APPROVAL_POLICY_SUPPORTED_SUBJECT_IDS)[number][];
  readonly blockedSubjectIds: readonly (typeof APPROVAL_POLICY_BLOCKED_SUBJECT_IDS)[number][];
  readonly sampleSubjectIds: readonly string[];
  readonly supportedSubjectIdsWithoutSamples: readonly string[];
  readonly reviewPacketsWouldWrite: false;
  readonly reviewPacketsWouldExecute: false;
  readonly reviewPacketsWouldPersistApprovals: false;
  readonly samplePacketStatuses: readonly ApprovalReviewPacketStatus[];
  readonly issues: readonly string[];
};

const unknownRecordSchema = z.record(z.string(), z.unknown());

const requestedCapabilitiesSchema = z
  .object({
    recordMutation: z.boolean().default(false),
    databaseWrite: z.boolean().default(false),
    auditEventWrite: z.boolean().default(false),
    approvalDecisionWrite: z.boolean().default(false),
    actionExecution: z.boolean().default(false),
    externalProvider: z.boolean().default(false),
    networkRequest: z.boolean().default(false),
    backgroundJob: z.boolean().default(false),
    routeChange: z.boolean().default(false),
    productUi: z.boolean().default(false),
    routingExecution: z.boolean().default(false),
    dealerOrderAreaCrud: z.boolean().default(false)
  })
  .strict()
  .prefault({});

const approvalReviewEvidenceSchema = z
  .object({
    key: z.string().min(1),
    source: z.enum(APPROVAL_REVIEW_EVIDENCE_SOURCES),
    summary: z.string().min(1)
  })
  .strict();

export const approvalReviewProposalSchema = z
  .object({
    proposalId: z.string().min(1),
    subjectId: z.string().min(1),
    label: z.string().min(1),
    summary: z.string().min(1),
    source: z.enum(APPROVAL_REVIEW_PROPOSAL_SOURCES),
    approvalIntent: z.enum(APPROVAL_REVIEW_PROPOSAL_INTENTS),
    target: z
      .object({
        entity: z.string().min(1),
        recordCount: z.number().int().nonnegative(),
        route: z.string().min(1).nullable().default(null)
      })
      .strict(),
    evidence: z.array(approvalReviewEvidenceSchema).default([]),
    requestedCapabilities: requestedCapabilitiesSchema,
    rationale: z.string().min(1).nullable().default(null)
  })
  .strict();

export type ApprovalReviewProposalInput = z.input<
  typeof approvalReviewProposalSchema
>;

type ApprovalReviewProposal = z.infer<typeof approvalReviewProposalSchema>;

const approvalRelevantCapabilityKeys = [
  "recordMutation",
  "databaseWrite",
  "auditEventWrite",
  "actionExecution"
] as const satisfies readonly ApprovalReviewRequestedCapabilityKey[];

const blockedCapabilityMessages = {
  approvalDecisionWrite:
    "Approval review packets do not approve, reject, or persist approval decisions.",
  externalProvider:
    "Approval review packets do not call external AI providers or other external services.",
  networkRequest:
    "Approval review packets do not make network requests.",
  backgroundJob:
    "Approval review packets do not schedule background jobs.",
  routeChange:
    "Approval review packets do not add routes or route handlers.",
  productUi:
    "Approval review packets do not add product UI.",
  routingExecution:
    "Approval review packets do not execute or reassign dealer routing.",
  dealerOrderAreaCrud:
    "Approval review packets do not promote dealer-order or area CRUD."
} as const satisfies Partial<
  Record<ApprovalReviewRequestedCapabilityKey, string>
>;

const sampleProposals = [
  {
    proposalId: "s47-sample-ai-action-task-create",
    subjectId: "ai-action.supported-intent-proposal",
    label: "AI task creation proposal",
    summary:
      "Review a supported AI action proposal before any future task creation path.",
    source: "ai_action_review_packet",
    approvalIntent: "future_execution",
    target: {
      entity: "Task",
      recordCount: 1,
      route: "/reports"
    },
    evidence: sampleEvidence([
      "proposal_payload",
      "source_provenance",
      "target_record_scope",
      "audit_expectation",
      "no_write_safety_flags",
      "operator_rationale"
    ]),
    requestedCapabilities: {
      recordMutation: true,
      databaseWrite: true,
      auditEventWrite: true,
      actionExecution: true
    },
    rationale: "Future execution would create a task and therefore needs review."
  },
  {
    proposalId: "s47-sample-bulk-status-update",
    subjectId: "crm.bulk-action-execution",
    label: "Bulk status update proposal",
    summary:
      "Review selected-list bulk execution output before any future CRM mutation.",
    source: "bulk_action_dry_run_review_packet",
    approvalIntent: "future_execution",
    target: {
      entity: "Account",
      recordCount: 3,
      route: "/reports"
    },
    evidence: sampleEvidence([
      "dry_run_summary",
      "target_record_scope",
      "audit_expectation",
      "no_write_safety_flags",
      "operator_rationale"
    ]),
    requestedCapabilities: {
      recordMutation: true,
      databaseWrite: true,
      auditEventWrite: true,
      actionExecution: true
    },
    rationale: "Future execution would update CRM records in bulk."
  },
  {
    proposalId: "s47-sample-workflow-manual-run",
    subjectId: "crm.workflow-manual-execution",
    label: "Workflow manual execution proposal",
    summary:
      "Review a manual workflow execution packet before any bounded executor path runs.",
    source: "workflow_rule_review_packet",
    approvalIntent: "future_execution",
    target: {
      entity: "Case",
      recordCount: 2,
      route: "/reports"
    },
    evidence: sampleEvidence([
      "dry_run_summary",
      "target_record_scope",
      "audit_expectation",
      "no_write_safety_flags",
      "operator_rationale"
    ]),
    requestedCapabilities: {
      recordMutation: true,
      databaseWrite: true,
      auditEventWrite: true,
      actionExecution: true
    },
    rationale: "Future execution would apply workflow actions to case records."
  },
  {
    proposalId: "s47-sample-csv-contact-import-apply",
    subjectId: "crm.csv-contact-import-apply",
    label: "CSV contact import apply proposal",
    summary:
      "Review contact import apply readiness before any future contact-create run.",
    source: "csv_import_apply_preflight",
    approvalIntent: "future_execution",
    target: {
      entity: "Contact",
      recordCount: 5,
      route: "/reports"
    },
    evidence: sampleEvidence([
      "dry_run_summary",
      "target_record_scope",
      "audit_expectation",
      "no_write_safety_flags",
      "operator_rationale"
    ]),
    requestedCapabilities: {
      recordMutation: true,
      databaseWrite: true,
      auditEventWrite: true,
      actionExecution: true
    },
    rationale: "Future execution would create contacts from reviewed CSV rows."
  },
  {
    proposalId: "s47-sample-read-only-registry-review",
    subjectId: "ai-action.supported-intent-proposal",
    label: "Read-only approval registry review",
    summary: "Display registry coverage without requesting a future CRM write.",
    source: "approval_policy_registry",
    approvalIntent: "read_only_review",
    target: {
      entity: "ApprovalPolicyRegistry",
      recordCount: 0,
      route: "/reports"
    },
    evidence: [],
    requestedCapabilities: {},
    rationale: "Read-only registry coverage does not need an approval decision."
  },
  {
    proposalId: "s47-sample-external-provider-request",
    subjectId: "ai-action.external-provider-request",
    label: "External AI provider request",
    summary: "A live provider request remains blocked by current non-goals.",
    source: "operator_input",
    approvalIntent: "future_execution",
    target: {
      entity: "ExternalAIProvider",
      recordCount: 0,
      route: null
    },
    evidence: sampleEvidence(["proposal_payload", "no_write_safety_flags"]),
    requestedCapabilities: {
      externalProvider: true,
      networkRequest: true
    },
    rationale: "External provider requests require later PLAN and contract promotion."
  }
] as const satisfies readonly ApprovalReviewProposalInput[];

function sampleEvidence(keys: readonly string[]): ApprovalReviewEvidenceInput[] {
  return keys.map((key) => ({
    key,
    source: sampleEvidenceSource(key),
    summary: `Sample ${key.replaceAll("_", " ")} evidence is present.`
  }));
}

function sampleEvidenceSource(key: string): ApprovalReviewEvidenceSource {
  switch (key) {
    case "audit_expectation":
      return "audit_context";
    case "dry_run_summary":
      return "dry_run";
    case "operator_rationale":
      return "operator_input";
    case "no_write_safety_flags":
      return "policy_registry";
    case "proposal_payload":
      return "proposal";
    case "source_provenance":
    case "target_record_scope":
      return "review_packet";
    default:
      return "proposal";
  }
}

export function listApprovalReviewSampleProposals(): ApprovalReviewProposal[] {
  return sampleProposals.map((proposal) =>
    approvalReviewProposalSchema.parse(proposal)
  );
}

export function buildApprovalReviewPacket(input: unknown): ApprovalReviewPacket {
  const proposalResult = approvalReviewProposalSchema.safeParse(input);
  const subjectId = proposalResult.success
    ? proposalResult.data.subjectId
    : extractSubjectId(input);
  const subject = subjectId ? getApprovalPolicySubject(subjectId) : null;
  const proposal = proposalResult.success
    ? snapshotProposal(proposalResult.data)
    : snapshotInvalidProposal(input, subjectId);
  const proposalIssues = proposalResult.success
    ? []
    : proposalResult.error.issues.map((issue) =>
        buildZodIssue("proposal_invalid", "error", issue)
      );

  if (!proposalResult.success) {
    return buildPacket({
      status: "blocked",
      proposal,
      subject,
      evidence: subject ? emptyEvidenceChecks(subject) : [],
      issues: [
        ...unknownSubjectIssues(subjectId, subject),
        ...proposalIssues
      ]
    });
  }

  if (!subject) {
    return buildPacket({
      status: "blocked",
      proposal,
      subject,
      evidence: [],
      issues: unknownSubjectIssues(proposalResult.data.subjectId, subject)
    });
  }

  const evidence = buildEvidenceChecks(subject, proposalResult.data.evidence);
  const evaluation = evaluateProposal(proposalResult.data, subject, evidence);

  return buildPacket({
    status: evaluation.status,
    proposal,
    subject,
    evidence,
    issues: evaluation.issues
  });
}

export function buildApprovalReviewPacketBatch(
  inputs: readonly unknown[]
): ApprovalReviewPacketBatch {
  const packets = inputs.map(buildApprovalReviewPacket);

  return {
    contentType: APPROVAL_REVIEW_PACKET_CONTENT_TYPE,
    packetType: "approval-review-packet-batch",
    packetVersion: APPROVAL_REVIEW_PACKET_VERSION,
    packets,
    summary: summarizePackets(packets),
    source: buildSource(),
    read: readFlags(),
    write: writeFlags(),
    safety: safetyFlags()
  };
}

export function buildApprovalReviewSamplePacketBatch(): ApprovalReviewPacketBatch {
  return buildApprovalReviewPacketBatch(listApprovalReviewSampleProposals());
}

export function auditApprovalReviewPackets(): ApprovalReviewPacketAudit {
  const samplePackets = buildApprovalReviewSamplePacketBatch().packets;
  const sampleSubjectIds = uniqueStrings(
    samplePackets.flatMap((packet) =>
      packet.proposal.subjectId ? [packet.proposal.subjectId] : []
    )
  );
  const supportedSubjectIdsWithoutSamples =
    APPROVAL_POLICY_SUPPORTED_SUBJECT_IDS.filter(
      (subjectId) => !sampleSubjectIds.includes(subjectId)
    );
  const hasApprovalNeeded = samplePackets.some(
    (packet) => packet.status === "approval_needed"
  );
  const hasBlocked = samplePackets.some((packet) => packet.status === "blocked");
  const hasNotNeeded = samplePackets.some(
    (packet) => packet.status === "not_needed"
  );
  const issues = [
    ...supportedSubjectIdsWithoutSamples.map(
      (subjectId) =>
        `Supported approval subject ${subjectId} has no sample review proposal.`
    ),
    ...(hasApprovalNeeded
      ? []
      : ["Sample approval review packets do not cover approval_needed status."]),
    ...(hasBlocked
      ? []
      : ["Sample approval review packets do not cover blocked status."]),
    ...(hasNotNeeded
      ? []
      : ["Sample approval review packets do not cover not_needed status."])
  ];

  return {
    ok: issues.length === 0,
    packetVersion: APPROVAL_REVIEW_PACKET_VERSION,
    registryVersion: APPROVAL_POLICY_REGISTRY_VERSION,
    supportedSubjectIds: [...APPROVAL_POLICY_SUPPORTED_SUBJECT_IDS],
    blockedSubjectIds: [...APPROVAL_POLICY_BLOCKED_SUBJECT_IDS],
    sampleSubjectIds,
    supportedSubjectIdsWithoutSamples,
    reviewPacketsWouldWrite: false,
    reviewPacketsWouldExecute: false,
    reviewPacketsWouldPersistApprovals: false,
    samplePacketStatuses: samplePackets.map((packet) => packet.status),
    issues
  };
}

function evaluateProposal(
  proposal: ApprovalReviewProposal,
  subject: ApprovalPolicySubject,
  evidence: readonly ApprovalReviewEvidenceCheck[]
): {
  readonly status: ApprovalReviewPacketStatus;
  readonly issues: readonly ApprovalReviewIssue[];
} {
  if (subject.status === "blocked") {
    return {
      status: "blocked",
      issues: [blockedSubjectIssue(subject)]
    };
  }

  if (proposal.approvalIntent === "approval_decision") {
    return {
      status: "blocked",
      issues: [
        {
          code: "approval_decision_not_supported",
          severity: "error",
          path: "approvalIntent",
          message:
            "Approval review packets can report approval needs, but they cannot approve, reject, or persist approval decisions."
        }
      ]
    };
  }

  const capabilityIssues = blockedCapabilityIssues(
    proposal.requestedCapabilities
  );
  const approvalRelevant = hasApprovalRelevantCapabilities(
    proposal.requestedCapabilities
  );

  if (
    proposal.approvalIntent === "read_only_review" &&
    requestedCapabilityKeys(proposal.requestedCapabilities).length > 0
  ) {
    return {
      status: "blocked",
      issues: [
        {
          code: "approval_intent_conflict",
          severity: "error",
          path: "requestedCapabilities",
          message:
            "Read-only approval review proposals cannot request mutation, execution, provider, route, UI, or background-job capabilities."
        }
      ]
    };
  }

  if (capabilityIssues.length > 0) {
    return {
      status: "blocked",
      issues: capabilityIssues
    };
  }

  if (!approvalRelevant || proposal.approvalIntent === "read_only_review") {
    return {
      status: "not_needed",
      issues: []
    };
  }

  const missingEvidenceIssues = evidence
    .filter((item) => !item.present)
    .map((item) => missingEvidenceIssue(item));

  if (missingEvidenceIssues.length > 0) {
    return {
      status: "blocked",
      issues: missingEvidenceIssues
    };
  }

  return {
    status: "approval_needed",
    issues: []
  };
}

function buildPacket(input: {
  readonly status: ApprovalReviewPacketStatus;
  readonly proposal: ApprovalReviewProposalSnapshot;
  readonly subject: ApprovalPolicySubject | null;
  readonly evidence: readonly ApprovalReviewEvidenceCheck[];
  readonly issues: readonly ApprovalReviewIssue[];
}): ApprovalReviewPacket {
  const approval = input.subject
    ? buildApprovalExpectation(input.status, input.subject)
    : null;
  const audit = input.subject ? buildAuditExpectation(input.status, input.subject) : null;

  return {
    contentType: APPROVAL_REVIEW_PACKET_CONTENT_TYPE,
    packetType: "approval-review-packet",
    packetVersion: APPROVAL_REVIEW_PACKET_VERSION,
    status: input.status,
    proposal: input.proposal,
    subject: input.subject,
    evidence: input.evidence,
    approval,
    audit,
    summary: summarizePacket({
      status: input.status,
      issues: input.issues,
      evidence: input.evidence,
      approval,
      audit
    }),
    issues: input.issues,
    source: buildSource(),
    read: readFlags(),
    write: writeFlags(),
    safety: safetyFlags()
  };
}

function buildApprovalExpectation(
  status: ApprovalReviewPacketStatus,
  subject: ApprovalPolicySubject
): ApprovalReviewApprovalExpectation {
  if (status === "approval_needed") {
    return {
      approvalRequired: true,
      mode: "explicit_operator_approval",
      reviewer: { ...subject.reviewer },
      identityRequiredBeforeExecution:
        subject.reviewer.identityRequiredBeforeExecution,
      approvalPersistence: false,
      currentApprovalDecisionAllowed: false,
      currentExecutionAllowed: false,
      reason: `${subject.label} requires explicit operator approval before any later execution path.`
    };
  }

  if (status === "blocked") {
    return {
      approvalRequired: false,
      mode: "blocked",
      reviewer: subject.status === "blocked" ? { ...subject.reviewer } : null,
      identityRequiredBeforeExecution:
        subject.reviewer.identityRequiredBeforeExecution,
      approvalPersistence: false,
      currentApprovalDecisionAllowed: false,
      currentExecutionAllowed: false,
      reason:
        subject.deferral?.reason ??
        "The proposal is blocked and cannot be approved by this review packet."
    };
  }

  return {
    approvalRequired: false,
    mode: "not_required",
    reviewer: null,
    identityRequiredBeforeExecution: false,
    approvalPersistence: false,
    currentApprovalDecisionAllowed: false,
    currentExecutionAllowed: false,
    reason:
      "The proposal is read-only or does not request a future mutation/execution capability, so approval is not needed."
  };
}

function buildAuditExpectation(
  status: ApprovalReviewPacketStatus,
  subject: ApprovalPolicySubject
): ApprovalReviewAuditExpectation {
  return {
    ...subject.audit,
    auditRequiredBeforeExecution: status === "approval_needed",
    reviewPacketWouldRecordAuditNow: false,
    approvalDecisionWouldRecordNow: false,
    executionWouldRecordNow: false
  };
}

function buildEvidenceChecks(
  subject: ApprovalPolicySubject,
  evidence: readonly ApprovalReviewEvidenceInput[]
): ApprovalReviewEvidenceCheck[] {
  const evidenceByKey = new Map(evidence.map((item) => [item.key, item]));

  return subject.evidence.map((requirement) => {
    const provided = evidenceByKey.get(requirement.key) ?? null;

    return {
      ...requirement,
      present: provided !== null,
      providedSource: provided?.source ?? null,
      providedSummary: provided?.summary ?? null
    };
  });
}

function emptyEvidenceChecks(
  subject: ApprovalPolicySubject
): ApprovalReviewEvidenceCheck[] {
  return subject.evidence.map((requirement) => ({
    ...requirement,
    present: false,
    providedSource: null,
    providedSummary: null
  }));
}

function snapshotProposal(
  proposal: ApprovalReviewProposal
): ApprovalReviewProposalSnapshot {
  return {
    proposalId: proposal.proposalId,
    subjectId: proposal.subjectId,
    label: proposal.label,
    source: proposal.source,
    approvalIntent: proposal.approvalIntent,
    target: { ...proposal.target },
    evidenceKeys: proposal.evidence.map((item) => item.key).sort(),
    requestedCapabilityKeys: requestedCapabilityKeys(
      proposal.requestedCapabilities
    ),
    rationale: proposal.rationale
  };
}

function snapshotInvalidProposal(
  input: unknown,
  subjectId: string | null
): ApprovalReviewProposalSnapshot {
  const recordResult = unknownRecordSchema.safeParse(input);
  const evidenceResult = recordResult.success
    ? z.array(approvalReviewEvidenceSchema).safeParse(recordResult.data.evidence)
    : { success: false } as const;
  const capabilitiesResult = recordResult.success
    ? requestedCapabilitiesSchema.safeParse(recordResult.data.requestedCapabilities)
    : { success: false } as const;

  return {
    proposalId: recordString(recordResult, "proposalId"),
    subjectId,
    label: recordString(recordResult, "label"),
    source: null,
    approvalIntent: null,
    target: null,
    evidenceKeys: evidenceResult.success
      ? evidenceResult.data.map((item) => item.key).sort()
      : [],
    requestedCapabilityKeys: capabilitiesResult.success
      ? requestedCapabilityKeys(capabilitiesResult.data)
      : [],
    rationale: recordString(recordResult, "rationale")
  };
}

function buildSource(): ApprovalReviewPacketSource {
  const registry = getApprovalPolicyRegistry();

  return {
    module: "lib/server/approvalReviewPackets.ts",
    packetScope: "no-write-approval-review-packets",
    registryModule: "lib/server/approvalPolicyRegistry.ts",
    registryVersion: APPROVAL_POLICY_REGISTRY_VERSION,
    proposalSchema: "approvalReviewProposalSchema",
    supportedSubjectIds: [...APPROVAL_POLICY_SUPPORTED_SUBJECT_IDS],
    blockedSubjectIds: [...APPROVAL_POLICY_BLOCKED_SUBJECT_IDS],
    sampleProposalCount: sampleProposals.length,
    routeScope: [...registry.source.routeScope]
  };
}

function readFlags(): ApprovalReviewPacketReadFlags {
  const registry = getApprovalPolicyRegistry();

  return {
    ...registry.read,
    registry: true,
    proposal: true,
    evidence: true
  };
}

function writeFlags(): ApprovalPolicyWriteFlags {
  return { ...getApprovalPolicyRegistry().write };
}

function safetyFlags(): ApprovalReviewPacketSafety {
  return {
    deterministic: true,
    reviewOnly: true,
    readOnly: true,
    evaluatesEvidence: true,
    currentApprovalDecisionAllowed: false,
    currentExecutionAllowed: false,
    approvalPersistence: false,
    approvalDecisionPersistence: false,
    authEnforcement: false,
    externalProvider: false,
    network: false,
    routeChanges: false,
    productUi: false,
    routingExecution: false,
    dealerOrderAreaCrud: false,
    backgroundJobs: false
  };
}

function summarizePacket(input: {
  readonly status: ApprovalReviewPacketStatus;
  readonly issues: readonly ApprovalReviewIssue[];
  readonly evidence: readonly ApprovalReviewEvidenceCheck[];
  readonly approval: ApprovalReviewApprovalExpectation | null;
  readonly audit: ApprovalReviewAuditExpectation | null;
}): ApprovalReviewSummary {
  return {
    packetCount: 1,
    approvalNeededCount: input.status === "approval_needed" ? 1 : 0,
    blockedCount: input.status === "blocked" ? 1 : 0,
    notNeededCount: input.status === "not_needed" ? 1 : 0,
    issueCount: input.issues.length,
    missingEvidenceCount: input.evidence.filter((item) => !item.present).length,
    approvalRequiredCount: input.approval?.approvalRequired ? 1 : 0,
    auditRequiredBeforeExecutionCount: input.audit?.auditRequiredBeforeExecution
      ? 1
      : 0,
    currentApprovalDecisionAllowed: false,
    currentExecutionAllowed: false,
    wouldWriteNow: false,
    approvalPersistence: false
  };
}

function summarizePackets(
  packets: readonly ApprovalReviewPacket[]
): ApprovalReviewSummary {
  return packets.reduce<ApprovalReviewSummary>(
    (summary, packet) => ({
      packetCount: summary.packetCount + 1,
      approvalNeededCount:
        summary.approvalNeededCount +
        (packet.status === "approval_needed" ? 1 : 0),
      blockedCount:
        summary.blockedCount + (packet.status === "blocked" ? 1 : 0),
      notNeededCount:
        summary.notNeededCount + (packet.status === "not_needed" ? 1 : 0),
      issueCount: summary.issueCount + packet.issues.length,
      missingEvidenceCount:
        summary.missingEvidenceCount + packet.summary.missingEvidenceCount,
      approvalRequiredCount:
        summary.approvalRequiredCount +
        (packet.approval?.approvalRequired ? 1 : 0),
      auditRequiredBeforeExecutionCount:
        summary.auditRequiredBeforeExecutionCount +
        (packet.audit?.auditRequiredBeforeExecution ? 1 : 0),
      currentApprovalDecisionAllowed: false,
      currentExecutionAllowed: false,
      wouldWriteNow: false,
      approvalPersistence: false
    }),
    {
      packetCount: 0,
      approvalNeededCount: 0,
      blockedCount: 0,
      notNeededCount: 0,
      issueCount: 0,
      missingEvidenceCount: 0,
      approvalRequiredCount: 0,
      auditRequiredBeforeExecutionCount: 0,
      currentApprovalDecisionAllowed: false,
      currentExecutionAllowed: false,
      wouldWriteNow: false,
      approvalPersistence: false
    }
  );
}

function requestedCapabilityKeys(
  capabilities: ApprovalReviewRequestedCapabilities
): ApprovalReviewRequestedCapabilityKey[] {
  return APPROVAL_REVIEW_REQUESTED_CAPABILITY_KEYS.filter(
    (key) => capabilities[key]
  );
}

function hasApprovalRelevantCapabilities(
  capabilities: ApprovalReviewRequestedCapabilities
): boolean {
  return approvalRelevantCapabilityKeys.some((key) => capabilities[key]);
}

function blockedCapabilityIssues(
  capabilities: ApprovalReviewRequestedCapabilities
): ApprovalReviewIssue[] {
  return Object.entries(blockedCapabilityMessages).flatMap(([key, message]) => {
    const capabilityKey = key as ApprovalReviewRequestedCapabilityKey;

    if (!capabilities[capabilityKey]) {
      return [];
    }

    return [
      {
        code: "capability_blocked",
        severity: "error",
        path: `requestedCapabilities.${capabilityKey}`,
        message
      } as const satisfies ApprovalReviewIssue
    ];
  });
}

function unknownSubjectIssues(
  subjectId: string | null,
  subject: ApprovalPolicySubject | null
): ApprovalReviewIssue[] {
  if (subject !== null) {
    return [];
  }

  return [
    {
      code: "subject_unknown",
      severity: "error",
      path: "subjectId",
      message:
        subjectId === null
          ? "Approval policy subject is missing or invalid."
          : `Approval policy subject '${subjectId}' is not registered.`
    }
  ];
}

function blockedSubjectIssue(subject: ApprovalPolicySubject): ApprovalReviewIssue {
  return {
    code: "subject_blocked",
    severity: "error",
    path: "subjectId",
    message:
      subject.deferral?.safeNextStep ??
      `Approval policy subject '${subject.id}' is blocked.`
  };
}

function missingEvidenceIssue(
  evidence: ApprovalReviewEvidenceCheck
): ApprovalReviewIssue {
  return {
    code: "evidence_missing",
    severity: "error",
    path: `evidence.${evidence.key}`,
    message: `Required approval evidence is missing: ${evidence.label}.`
  };
}

function buildZodIssue(
  code: ApprovalReviewIssueCode,
  severity: ApprovalReviewIssueSeverity,
  issue: z.ZodIssue
): ApprovalReviewIssue {
  return {
    code,
    severity,
    path: issue.path.length > 0 ? issue.path.map(String).join(".") : "root",
    message: issue.message
  };
}

function extractSubjectId(input: unknown): string | null {
  const recordResult = unknownRecordSchema.safeParse(input);

  if (!recordResult.success) {
    return null;
  }

  const value = recordResult.data.subjectId;
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function recordString(
  recordResult: ReturnType<typeof unknownRecordSchema.safeParse>,
  key: string
): string | null {
  if (!recordResult.success) {
    return null;
  }

  const value = recordResult.data[key];
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function uniqueStrings(values: readonly string[]): string[] {
  return [...new Set(values)];
}
