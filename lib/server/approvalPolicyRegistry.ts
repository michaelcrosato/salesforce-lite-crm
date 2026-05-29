import { z } from "zod/v4";

export const APPROVAL_POLICY_CONTENT_TYPE =
  "application/json; charset=utf-8" as const;

export const APPROVAL_POLICY_REGISTRY_VERSION = "2026-05-26.s47-f1" as const;

export const APPROVAL_POLICY_SUPPORTED_SUBJECT_IDS = [
  "ai-action.supported-intent-proposal",
  "crm.bulk-action-execution",
  "crm.workflow-manual-execution",
  "crm.csv-contact-import-apply"
] as const;

export const APPROVAL_POLICY_BLOCKED_SUBJECT_IDS = [
  "ai-action.external-provider-request",
  "ai-action.routing-execution",
  "crm.dealer-order-area-crud",
  "crm.salesforce-sync",
  "crm.email-send",
  "approval.policy-execution"
] as const;

export const APPROVAL_POLICY_SUBJECT_IDS = [
  ...APPROVAL_POLICY_SUPPORTED_SUBJECT_IDS,
  ...APPROVAL_POLICY_BLOCKED_SUBJECT_IDS
] as const;

export const APPROVAL_POLICY_RISK_LEVELS = [
  "medium",
  "high",
  "critical",
  "blocked"
] as const;

export const APPROVAL_POLICY_REVIEWER_LABELS = [
  "operator-reviewer",
  "manager-reviewer",
  "data-steward-reviewer",
  "admin-reviewer"
] as const;

export const APPROVAL_POLICY_BLOCKED_CAPABILITIES = [
  "auth_enforcement",
  "role_model",
  "approval_persistence",
  "approval_executor",
  "approval_decision_write",
  "record_mutation",
  "database_write",
  "audit_event_write",
  "external_ai_provider",
  "provider_credentials",
  "network_request",
  "email_send",
  "salesforce_integration",
  "routing_execution",
  "dealer_order_area_crud",
  "global_search_expansion",
  "deal_detail_route",
  "route_handler",
  "product_ui",
  "background_job"
] as const;

export type ApprovalPolicySupportedSubjectId =
  (typeof APPROVAL_POLICY_SUPPORTED_SUBJECT_IDS)[number];

export type ApprovalPolicyBlockedSubjectId =
  (typeof APPROVAL_POLICY_BLOCKED_SUBJECT_IDS)[number];

export type ApprovalPolicySubjectId =
  (typeof APPROVAL_POLICY_SUBJECT_IDS)[number];

export type ApprovalPolicySubjectStatus = "supported" | "blocked";

export type ApprovalPolicyRiskLevel =
  (typeof APPROVAL_POLICY_RISK_LEVELS)[number];

export type ApprovalPolicyReviewerLabel =
  (typeof APPROVAL_POLICY_REVIEWER_LABELS)[number];

export type ApprovalPolicyBlockedCapability =
  (typeof APPROVAL_POLICY_BLOCKED_CAPABILITIES)[number];

export type ApprovalPolicySubjectType =
  | "ai_action_proposal"
  | "crm_operation_proposal"
  | "deferred_external_or_excluded_capability"
  | "approval_runtime_capability";

export type ApprovalPolicyEvidenceSource =
  | "audit_context"
  | "dry_run"
  | "operator_input"
  | "policy_registry"
  | "proposal"
  | "review_packet";

export type ApprovalPolicyEvidenceRequirement = {
  readonly key: string;
  readonly label: string;
  readonly source: ApprovalPolicyEvidenceSource;
  readonly required: true;
  readonly description: string;
};

export type ApprovalPolicyReviewer = {
  readonly label: ApprovalPolicyReviewerLabel;
  readonly displayName: string;
  readonly selectionMode: "label_only";
  readonly authRoleRequiredNow: false;
  readonly identityRequiredBeforeExecution: true;
  readonly description: string;
};

export type ApprovalPolicyAuditExpectation = {
  readonly category: "approval_policy";
  readonly reviewEventAction: "approval_policy_review";
  readonly decisionEventAction: "approval_decision";
  readonly futureExecutionAuditRequired: true;
  readonly approvalDecisionAuditRequired: true;
  readonly auditRecorderPath: "lib/services/auditEvents.ts#recordAuditEvent" | null;
  readonly approvalPersistence: false;
  readonly wouldWriteNow: false;
};

export type ApprovalPolicyReference = {
  readonly module: string;
  readonly exportName: string;
};

export type ApprovalPolicyReadFlags = {
  readonly metadata: true;
  readonly database: false;
  readonly crmRecords: false;
  readonly promptOutputs: false;
  readonly runtimeEvaluation: false;
  readonly authSession: false;
};

export type ApprovalPolicyWriteFlags = {
  readonly database: false;
  readonly crmRecords: false;
  readonly auditEvents: false;
  readonly approvalDecisions: false;
  readonly approvals: false;
  readonly routes: false;
  readonly routeHandlers: false;
  readonly productUi: false;
  readonly files: false;
  readonly externalServices: false;
  readonly backgroundJobs: false;
  readonly actionExecution: false;
  readonly auth: false;
};

export type ApprovalPolicySafety = {
  readonly deterministic: true;
  readonly metadataOnly: true;
  readonly readOnly: true;
  readonly policyOnly: true;
  readonly currentApprovalDecisionAllowed: false;
  readonly currentExecutionAllowed: false;
  readonly approvalPersistence: false;
  readonly authEnforcement: false;
  readonly externalProvider: false;
  readonly network: false;
  readonly routeChanges: false;
  readonly productUi: false;
  readonly routingExecution: false;
  readonly dealerOrderAreaCrud: false;
  readonly backgroundJobs: false;
};

export type ApprovalPolicyDeferral = {
  readonly requiresPlanPromotion: true;
  readonly requiresContractPromotion: true;
  readonly reason: string;
  readonly safeNextStep: string;
};

export type ApprovalPolicySubject = {
  readonly id: ApprovalPolicySubjectId;
  readonly status: ApprovalPolicySubjectStatus;
  readonly label: string;
  readonly description: string;
  readonly subjectType: ApprovalPolicySubjectType;
  readonly riskLevel: ApprovalPolicyRiskLevel;
  readonly reviewer: ApprovalPolicyReviewer;
  readonly evidence: readonly ApprovalPolicyEvidenceRequirement[];
  readonly audit: ApprovalPolicyAuditExpectation;
  readonly references: readonly ApprovalPolicyReference[];
  readonly routeScope: readonly string[];
  readonly read: ApprovalPolicyReadFlags;
  readonly write: ApprovalPolicyWriteFlags;
  readonly safety: ApprovalPolicySafety;
  readonly blockedCapabilities: readonly ApprovalPolicyBlockedCapability[];
  readonly deferral: ApprovalPolicyDeferral | null;
};

export type ApprovalPolicyRegistry = {
  readonly contentType: typeof APPROVAL_POLICY_CONTENT_TYPE;
  readonly registryType: "approval-policy-registry";
  readonly registryVersion: typeof APPROVAL_POLICY_REGISTRY_VERSION;
  readonly supportedSubjectCount: number;
  readonly blockedSubjectCount: number;
  readonly subjectCount: number;
  readonly supportedSubjectIds: readonly ApprovalPolicySupportedSubjectId[];
  readonly blockedSubjectIds: readonly ApprovalPolicyBlockedSubjectId[];
  readonly subjects: readonly ApprovalPolicySubject[];
  readonly source: {
    readonly module: "lib/server/approvalPolicyRegistry.ts";
    readonly registryScope: "metadata-only-approval-policy-contracts";
    readonly referencedModules: readonly string[];
    readonly routeScope: readonly string[];
  };
  readonly read: ApprovalPolicyReadFlags;
  readonly write: ApprovalPolicyWriteFlags;
  readonly safety: ApprovalPolicySafety;
  readonly blockedCapabilities: readonly ApprovalPolicyBlockedCapability[];
};

export type ApprovalPolicyRegistryAudit = {
  readonly ok: boolean;
  readonly registryVersion: typeof APPROVAL_POLICY_REGISTRY_VERSION;
  readonly supportedSubjectIds: readonly ApprovalPolicySupportedSubjectId[];
  readonly blockedSubjectIds: readonly ApprovalPolicyBlockedSubjectId[];
  readonly registrySubjectIds: readonly ApprovalPolicySubjectId[];
  readonly duplicateSubjectIds: readonly ApprovalPolicySubjectId[];
  readonly missingSupportedSubjectIds: readonly ApprovalPolicySupportedSubjectId[];
  readonly missingBlockedSubjectIds: readonly ApprovalPolicyBlockedSubjectId[];
  readonly supportedSubjectsWithoutAuditPath: readonly ApprovalPolicySubjectId[];
  readonly subjectsWithoutReviewer: readonly ApprovalPolicySubjectId[];
  readonly subjectsWithoutRequiredEvidence: readonly ApprovalPolicySubjectId[];
  readonly subjectsMissingBlockedCapabilities: readonly ApprovalPolicySubjectId[];
  readonly subjectsWithExecutionEnabled: readonly ApprovalPolicySubjectId[];
  readonly subjectsWithWritesEnabled: readonly ApprovalPolicySubjectId[];
  readonly subjectsWithExcludedRoutes: readonly ApprovalPolicySubjectId[];
  readonly issues: readonly string[];
};

type ApprovalSubjectSeed = {
  readonly id: ApprovalPolicySubjectId;
  readonly status: ApprovalPolicySubjectStatus;
  readonly label: string;
  readonly description: string;
  readonly subjectType: ApprovalPolicySubjectType;
  readonly riskLevel: ApprovalPolicyRiskLevel;
  readonly reviewerLabel: ApprovalPolicyReviewerLabel;
  readonly evidenceKeys: readonly ApprovalEvidenceKey[];
  readonly references: readonly ApprovalPolicyReference[];
  readonly routeScope: readonly string[];
  readonly deferral?: {
    readonly reason: string;
    readonly safeNextStep: string;
  };
};

type ApprovalEvidenceKey =
  | "audit_expectation"
  | "dry_run_summary"
  | "no_write_safety_flags"
  | "operator_rationale"
  | "proposal_payload"
  | "source_provenance"
  | "target_record_scope";

const registryInputSchema = z.object({}).strict();
const supportedSubjectIdSet: ReadonlySet<string> = new Set(
  APPROVAL_POLICY_SUPPORTED_SUBJECT_IDS
);

const evidenceRequirementCatalog = {
  audit_expectation: {
    key: "audit_expectation",
    label: "Audit expectation",
    source: "audit_context",
    required: true,
    description:
      "Future execution must identify the audit event path before approval can authorize a write."
  },
  dry_run_summary: {
    key: "dry_run_summary",
    label: "Dry-run or review summary",
    source: "dry_run",
    required: true,
    description:
      "The operator must see a deterministic dry-run or review-packet summary before approval."
  },
  no_write_safety_flags: {
    key: "no_write_safety_flags",
    label: "No-write safety flags",
    source: "policy_registry",
    required: true,
    description:
      "The policy must show that the registry itself does not persist approvals or execute actions."
  },
  operator_rationale: {
    key: "operator_rationale",
    label: "Operator rationale",
    source: "operator_input",
    required: true,
    description:
      "A human-readable approval rationale is required before later execution."
  },
  proposal_payload: {
    key: "proposal_payload",
    label: "Proposal payload",
    source: "proposal",
    required: true,
    description:
      "The proposed intent, operation, or import action must be visible as structured payload."
  },
  source_provenance: {
    key: "source_provenance",
    label: "Source provenance",
    source: "review_packet",
    required: true,
    description:
      "The review artifact must list source records, fixtures, or packet references used by the proposal."
  },
  target_record_scope: {
    key: "target_record_scope",
    label: "Target record scope",
    source: "review_packet",
    required: true,
    description:
      "The review artifact must identify target entity classes and bounded record counts."
  }
} as const satisfies Record<ApprovalEvidenceKey, ApprovalPolicyEvidenceRequirement>;

const reviewerCatalog = {
  "operator-reviewer": {
    label: "operator-reviewer",
    displayName: "Operator reviewer",
    selectionMode: "label_only",
    authRoleRequiredNow: false,
    identityRequiredBeforeExecution: true,
    description:
      "Label for routine operator review; this does not create an auth role."
  },
  "manager-reviewer": {
    label: "manager-reviewer",
    displayName: "Manager reviewer",
    selectionMode: "label_only",
    authRoleRequiredNow: false,
    identityRequiredBeforeExecution: true,
    description:
      "Label for elevated CRM record-change review; this does not create an auth role."
  },
  "data-steward-reviewer": {
    label: "data-steward-reviewer",
    displayName: "Data steward reviewer",
    selectionMode: "label_only",
    authRoleRequiredNow: false,
    identityRequiredBeforeExecution: true,
    description:
      "Label for import and data-quality review; this does not create an auth role."
  },
  "admin-reviewer": {
    label: "admin-reviewer",
    displayName: "Admin reviewer",
    selectionMode: "label_only",
    authRoleRequiredNow: false,
    identityRequiredBeforeExecution: true,
    description:
      "Label for deferred admin-level capabilities; this does not create an auth role."
  }
} as const satisfies Record<ApprovalPolicyReviewerLabel, ApprovalPolicyReviewer>;

const subjectSeeds = [
  {
    id: "ai-action.supported-intent-proposal",
    status: "supported",
    label: "AI action proposal approval",
    description:
      "Approval metadata for supported S45 AI action intent proposals before any future execution path exists.",
    subjectType: "ai_action_proposal",
    riskLevel: "high",
    reviewerLabel: "operator-reviewer",
    evidenceKeys: [
      "proposal_payload",
      "source_provenance",
      "target_record_scope",
      "audit_expectation",
      "no_write_safety_flags",
      "operator_rationale"
    ],
    references: [
      ref("lib/ai/actionIntentRegistry.ts", "getAiActionIntentRegistry"),
      ref("lib/ai/actionReviewPackets.ts", "buildAiActionReviewPacket")
    ],
    routeScope: ["/reports"]
  },
  {
    id: "crm.bulk-action-execution",
    status: "supported",
    label: "Bulk action execution approval",
    description:
      "Approval metadata for current selected-list bulk execution proposals that already have dry-run review packets.",
    subjectType: "crm_operation_proposal",
    riskLevel: "critical",
    reviewerLabel: "manager-reviewer",
    evidenceKeys: [
      "dry_run_summary",
      "target_record_scope",
      "audit_expectation",
      "no_write_safety_flags",
      "operator_rationale"
    ],
    references: [
      ref("lib/server/bulkActionDryRunReviewPackets.ts", "buildBulkActionReviewPacket"),
      ref("lib/server/bulkActionExecution.ts", "executeBulkAction")
    ],
    routeScope: ["/reports"]
  },
  {
    id: "crm.workflow-manual-execution",
    status: "supported",
    label: "Workflow manual execution approval",
    description:
      "Approval metadata for bounded workflow manual execution proposals derived from review packets.",
    subjectType: "crm_operation_proposal",
    riskLevel: "critical",
    reviewerLabel: "manager-reviewer",
    evidenceKeys: [
      "dry_run_summary",
      "target_record_scope",
      "audit_expectation",
      "no_write_safety_flags",
      "operator_rationale"
    ],
    references: [
      ref("lib/server/workflowRuleReviewPackets.ts", "buildWorkflowRuleReviewPacket"),
      ref("lib/server/workflowRuleManualExecutor.ts", "executeWorkflowRuleManually")
    ],
    routeScope: ["/reports"]
  },
  {
    id: "crm.csv-contact-import-apply",
    status: "supported",
    label: "CSV contact import apply approval",
    description:
      "Approval metadata for operator-approved contact-create import apply runs after read-only preview and preflight.",
    subjectType: "crm_operation_proposal",
    riskLevel: "critical",
    reviewerLabel: "data-steward-reviewer",
    evidenceKeys: [
      "dry_run_summary",
      "target_record_scope",
      "audit_expectation",
      "no_write_safety_flags",
      "operator_rationale"
    ],
    references: [
      ref("lib/server/csvImportApplyCapabilities.ts", "getCsvImportApplyCapabilities"),
      ref("lib/server/csvImportApplyExecutor.ts", "executeCsvContactImportApply")
    ],
    routeScope: ["/reports"]
  },
  {
    id: "ai-action.external-provider-request",
    status: "blocked",
    label: "External AI provider request",
    description:
      "Blocked because live provider calls, credentials, and network requests remain outside the current contract.",
    subjectType: "deferred_external_or_excluded_capability",
    riskLevel: "blocked",
    reviewerLabel: "admin-reviewer",
    evidenceKeys: ["proposal_payload", "no_write_safety_flags"],
    references: [ref("docs/AI-ROADMAP.md", "Non-Goals Until Promoted")],
    routeScope: [],
    deferral: {
      reason: "External AI provider integration is not promoted.",
      safeNextStep:
        "Promote deterministic/recorded provider contracts before approval policies cover live provider requests."
    }
  },
  {
    id: "ai-action.routing-execution",
    status: "blocked",
    label: "AI routing execution",
    description:
      "Blocked because AI action approval cannot authorize dealer routing execution or reassignment.",
    subjectType: "deferred_external_or_excluded_capability",
    riskLevel: "blocked",
    reviewerLabel: "admin-reviewer",
    evidenceKeys: ["proposal_payload", "target_record_scope", "no_write_safety_flags"],
    references: [ref("lib/ai/actionIntentRegistry.ts", "AI_ACTION_INTENT_DEFERRED_IDS")],
    routeScope: [],
    deferral: {
      reason: "Routing execution and reassignment are excluded from AI action scope.",
      safeNextStep:
        "Promote routing simulator or reassignment contracts before approval policies cover routing execution."
    }
  },
  {
    id: "crm.dealer-order-area-crud",
    status: "blocked",
    label: "Dealer order or area CRUD",
    description:
      "Blocked because dealer orders and routing areas remain seeded and browsable only.",
    subjectType: "deferred_external_or_excluded_capability",
    riskLevel: "blocked",
    reviewerLabel: "admin-reviewer",
    evidenceKeys: ["proposal_payload", "target_record_scope", "no_write_safety_flags"],
    references: [ref("CRM-CONTRACT.md", "Feature Flags And Excluded Routes")],
    routeScope: [],
    deferral: {
      reason: "Dealer-order and area create/edit flows are not promoted.",
      safeNextStep:
        "Promote dealer-order and area CRUD with contract updates before approval policies cover these writes."
    }
  },
  {
    id: "crm.salesforce-sync",
    status: "blocked",
    label: "Salesforce sync",
    description:
      "Blocked because Salesforce integration is outside the current product contract.",
    subjectType: "deferred_external_or_excluded_capability",
    riskLevel: "blocked",
    reviewerLabel: "admin-reviewer",
    evidenceKeys: ["proposal_payload", "no_write_safety_flags"],
    references: [ref("docs/ROADMAP.md", "Required Promotion Decisions")],
    routeScope: [],
    deferral: {
      reason: "Salesforce integration is not promoted.",
      safeNextStep:
        "Promote Salesforce import or sync scope before approval policies cover Salesforce writes."
    }
  },
  {
    id: "crm.email-send",
    status: "blocked",
    label: "Email send",
    description:
      "Blocked because transactional email providers and message sending are outside the current contract.",
    subjectType: "deferred_external_or_excluded_capability",
    riskLevel: "blocked",
    reviewerLabel: "admin-reviewer",
    evidenceKeys: ["proposal_payload", "no_write_safety_flags"],
    references: [ref("lib/ai/actionIntentRegistry.ts", "AI_ACTION_INTENT_DEFERRED_IDS")],
    routeScope: [],
    deferral: {
      reason: "Email providers and send behavior are not promoted.",
      safeNextStep:
        "Promote email draft/send contracts and audit rules before approval policies cover email sending."
    }
  },
  {
    id: "approval.policy-execution",
    status: "blocked",
    label: "Approval policy execution",
    description:
      "Blocked because this sprint only publishes metadata and does not add an approval engine or persistence.",
    subjectType: "approval_runtime_capability",
    riskLevel: "blocked",
    reviewerLabel: "admin-reviewer",
    evidenceKeys: ["no_write_safety_flags", "audit_expectation"],
    references: [ref("PLAN.md", "S47-F1 — Approval policy registry")],
    routeScope: [],
    deferral: {
      reason: "Approval enforcement and persistence are not part of S47-F1.",
      safeNextStep:
        "Promote an approval review packet and later executor scope before implementing approval decisions."
    }
  }
] as const satisfies readonly ApprovalSubjectSeed[];

function ref(module: string, exportName: string): ApprovalPolicyReference {
  return {
    module,
    exportName
  };
}

function readFlags(): ApprovalPolicyReadFlags {
  return {
    metadata: true,
    database: false,
    crmRecords: false,
    promptOutputs: false,
    runtimeEvaluation: false,
    authSession: false
  };
}

function noWrites(): ApprovalPolicyWriteFlags {
  return {
    database: false,
    crmRecords: false,
    auditEvents: false,
    approvalDecisions: false,
    approvals: false,
    routes: false,
    routeHandlers: false,
    productUi: false,
    files: false,
    externalServices: false,
    backgroundJobs: false,
    actionExecution: false,
    auth: false
  };
}

function safetyFlags(): ApprovalPolicySafety {
  return {
    deterministic: true,
    metadataOnly: true,
    readOnly: true,
    policyOnly: true,
    currentApprovalDecisionAllowed: false,
    currentExecutionAllowed: false,
    approvalPersistence: false,
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

function auditExpectation(
  status: ApprovalPolicySubjectStatus
): ApprovalPolicyAuditExpectation {
  return {
    category: "approval_policy",
    reviewEventAction: "approval_policy_review",
    decisionEventAction: "approval_decision",
    futureExecutionAuditRequired: true,
    approvalDecisionAuditRequired: true,
    auditRecorderPath:
      status === "supported" ? "lib/services/auditEvents.ts#recordAuditEvent" : null,
    approvalPersistence: false,
    wouldWriteNow: false
  };
}

function evidenceRequirements(
  keys: readonly ApprovalEvidenceKey[]
): ApprovalPolicyEvidenceRequirement[] {
  return keys.map((key) => ({ ...evidenceRequirementCatalog[key] }));
}

function reviewer(label: ApprovalPolicyReviewerLabel): ApprovalPolicyReviewer {
  return { ...reviewerCatalog[label] };
}

function buildSubject(seed: ApprovalSubjectSeed): ApprovalPolicySubject {
  return {
    id: seed.id,
    status: seed.status,
    label: seed.label,
    description: seed.description,
    subjectType: seed.subjectType,
    riskLevel: seed.riskLevel,
    reviewer: reviewer(seed.reviewerLabel),
    evidence: evidenceRequirements(seed.evidenceKeys),
    audit: auditExpectation(seed.status),
    references: seed.references.map((reference) => ({ ...reference })),
    routeScope: [...seed.routeScope],
    read: readFlags(),
    write: noWrites(),
    safety: safetyFlags(),
    blockedCapabilities: [...APPROVAL_POLICY_BLOCKED_CAPABILITIES],
    deferral:
      seed.status === "blocked"
        ? {
            requiresPlanPromotion: true,
            requiresContractPromotion: true,
            reason: seed.deferral?.reason ?? "Approval subject is blocked.",
            safeNextStep:
              seed.deferral?.safeNextStep ??
              "Promote the subject before registering approval decisions."
          }
        : null
  };
}

export const APPROVAL_POLICY_SUBJECTS = subjectSeeds.map(
  buildSubject
) as readonly ApprovalPolicySubject[];

export function isApprovalPolicySubjectId(
  value: string
): value is ApprovalPolicySubjectId {
  return APPROVAL_POLICY_SUBJECT_IDS.includes(value as ApprovalPolicySubjectId);
}

export function isSupportedApprovalPolicySubjectId(
  value: string
): value is ApprovalPolicySupportedSubjectId {
  return supportedSubjectIdSet.has(value);
}

export function listApprovalPolicySubjects(): ApprovalPolicySubject[] {
  return APPROVAL_POLICY_SUBJECTS.map(copySubject);
}

export function listSupportedApprovalPolicySubjects(): ApprovalPolicySubject[] {
  return APPROVAL_POLICY_SUBJECTS.filter(
    (subject) => subject.status === "supported"
  ).map(copySubject);
}

export function listBlockedApprovalPolicySubjects(): ApprovalPolicySubject[] {
  return APPROVAL_POLICY_SUBJECTS.filter(
    (subject) => subject.status === "blocked"
  ).map(copySubject);
}

export function listApprovalPolicySubjectsByRisk(
  riskLevel: ApprovalPolicyRiskLevel
): ApprovalPolicySubject[] {
  return APPROVAL_POLICY_SUBJECTS.filter(
    (subject) => subject.riskLevel === riskLevel
  ).map(copySubject);
}

export function listApprovalPolicySubjectsByReviewer(
  label: ApprovalPolicyReviewerLabel
): ApprovalPolicySubject[] {
  return APPROVAL_POLICY_SUBJECTS.filter(
    (subject) => subject.reviewer.label === label
  ).map(copySubject);
}

export function getApprovalPolicySubject(
  id: string
): ApprovalPolicySubject | null {
  const subject = APPROVAL_POLICY_SUBJECTS.find(
    (candidate) => candidate.id === id
  );

  return subject ? copySubject(subject) : null;
}

export function getApprovalPolicyRegistry(
  input: unknown = {}
): ApprovalPolicyRegistry {
  registryInputSchema.parse(input);

  const subjects = listApprovalPolicySubjects();

  return {
    contentType: APPROVAL_POLICY_CONTENT_TYPE,
    registryType: "approval-policy-registry",
    registryVersion: APPROVAL_POLICY_REGISTRY_VERSION,
    supportedSubjectCount: APPROVAL_POLICY_SUPPORTED_SUBJECT_IDS.length,
    blockedSubjectCount: APPROVAL_POLICY_BLOCKED_SUBJECT_IDS.length,
    subjectCount: APPROVAL_POLICY_SUBJECT_IDS.length,
    supportedSubjectIds: [...APPROVAL_POLICY_SUPPORTED_SUBJECT_IDS],
    blockedSubjectIds: [...APPROVAL_POLICY_BLOCKED_SUBJECT_IDS],
    subjects,
    source: {
      module: "lib/server/approvalPolicyRegistry.ts",
      registryScope: "metadata-only-approval-policy-contracts",
      referencedModules: uniqueStrings(
        subjects.flatMap((subject) =>
          subject.references.map((reference) => reference.module)
        )
      ),
      routeScope: uniqueStrings(
        subjects.flatMap((subject) => subject.routeScope)
      )
    },
    read: readFlags(),
    write: noWrites(),
    safety: safetyFlags(),
    blockedCapabilities: [...APPROVAL_POLICY_BLOCKED_CAPABILITIES]
  };
}

export function auditApprovalPolicyRegistry(): ApprovalPolicyRegistryAudit {
  const registry = getApprovalPolicyRegistry();
  const registrySubjectIds = registry.subjects.map((subject) => subject.id);
  const duplicateSubjectIds = duplicateIds(registrySubjectIds);
  const missingSupportedSubjectIds = APPROVAL_POLICY_SUPPORTED_SUBJECT_IDS.filter(
    (id) => !registrySubjectIds.includes(id)
  );
  const missingBlockedSubjectIds = APPROVAL_POLICY_BLOCKED_SUBJECT_IDS.filter(
    (id) => !registrySubjectIds.includes(id)
  );
  const supportedSubjects = registry.subjects.filter(
    (subject) => subject.status === "supported"
  );
  const supportedSubjectsWithoutAuditPath = supportedSubjects
    .filter((subject) => subject.audit.auditRecorderPath === null)
    .map((subject) => subject.id);
  const subjectsWithoutReviewer = registry.subjects
    .filter((subject) => subject.reviewer.label.length === 0)
    .map((subject) => subject.id);
  const subjectsWithoutRequiredEvidence = registry.subjects
    .filter((subject) => subject.evidence.length === 0)
    .map((subject) => subject.id);
  const subjectsMissingBlockedCapabilities = registry.subjects
    .filter((subject) => !hasAllBlockedCapabilities(subject))
    .map((subject) => subject.id);
  const subjectsWithExecutionEnabled = registry.subjects
    .filter((subject) => subject.safety.currentExecutionAllowed)
    .map((subject) => subject.id);
  const subjectsWithWritesEnabled = registry.subjects
    .filter((subject) => hasWritesEnabled(subject.write))
    .map((subject) => subject.id);
  const subjectsWithExcludedRoutes = registry.subjects
    .filter((subject) => subject.routeScope.some(isExcludedRoute))
    .map((subject) => subject.id);
  const issues = [
    ...duplicateSubjectIds.map((id) => `Duplicate approval policy subject ${id}.`),
    ...missingSupportedSubjectIds.map(
      (id) => `Missing supported approval policy subject ${id}.`
    ),
    ...missingBlockedSubjectIds.map(
      (id) => `Missing blocked approval policy subject ${id}.`
    ),
    ...supportedSubjectsWithoutAuditPath.map(
      (id) => `Supported approval policy subject ${id} has no audit path.`
    ),
    ...subjectsWithoutReviewer.map(
      (id) => `Approval policy subject ${id} has no reviewer label.`
    ),
    ...subjectsWithoutRequiredEvidence.map(
      (id) => `Approval policy subject ${id} has no required evidence.`
    ),
    ...subjectsMissingBlockedCapabilities.map(
      (id) => `Approval policy subject ${id} is missing blocked capabilities.`
    ),
    ...subjectsWithExecutionEnabled.map(
      (id) => `Approval policy subject ${id} enables current execution.`
    ),
    ...subjectsWithWritesEnabled.map(
      (id) => `Approval policy subject ${id} enables writes.`
    ),
    ...subjectsWithExcludedRoutes.map(
      (id) => `Approval policy subject ${id} references an excluded route.`
    )
  ];

  return {
    ok: issues.length === 0,
    registryVersion: APPROVAL_POLICY_REGISTRY_VERSION,
    supportedSubjectIds: [...APPROVAL_POLICY_SUPPORTED_SUBJECT_IDS],
    blockedSubjectIds: [...APPROVAL_POLICY_BLOCKED_SUBJECT_IDS],
    registrySubjectIds,
    duplicateSubjectIds,
    missingSupportedSubjectIds,
    missingBlockedSubjectIds,
    supportedSubjectsWithoutAuditPath,
    subjectsWithoutReviewer,
    subjectsWithoutRequiredEvidence,
    subjectsMissingBlockedCapabilities,
    subjectsWithExecutionEnabled,
    subjectsWithWritesEnabled,
    subjectsWithExcludedRoutes,
    issues
  };
}

function copySubject(subject: ApprovalPolicySubject): ApprovalPolicySubject {
  return {
    id: subject.id,
    status: subject.status,
    label: subject.label,
    description: subject.description,
    subjectType: subject.subjectType,
    riskLevel: subject.riskLevel,
    reviewer: { ...subject.reviewer },
    evidence: subject.evidence.map((requirement) => ({ ...requirement })),
    audit: { ...subject.audit },
    references: subject.references.map((reference) => ({ ...reference })),
    routeScope: [...subject.routeScope],
    read: { ...subject.read },
    write: { ...subject.write },
    safety: { ...subject.safety },
    blockedCapabilities: [...subject.blockedCapabilities],
    deferral: subject.deferral ? { ...subject.deferral } : null
  };
}

function duplicateIds(
  ids: readonly ApprovalPolicySubjectId[]
): ApprovalPolicySubjectId[] {
  const seen = new Set<ApprovalPolicySubjectId>();
  const duplicates = new Set<ApprovalPolicySubjectId>();

  for (const id of ids) {
    if (seen.has(id)) {
      duplicates.add(id);
    }

    seen.add(id);
  }

  return [...duplicates];
}

function hasAllBlockedCapabilities(subject: ApprovalPolicySubject): boolean {
  return APPROVAL_POLICY_BLOCKED_CAPABILITIES.every((capability) =>
    subject.blockedCapabilities.includes(capability)
  );
}

function hasWritesEnabled(write: ApprovalPolicyWriteFlags): boolean {
  return Object.values(write).some((enabled) => enabled);
}

function isExcludedRoute(route: string): boolean {
  return (
    route === "/search" ||
    route === "/command-palette" ||
    route.includes("/deals/[id]") ||
    route.includes("/orders/new") ||
    route.includes("/orders/[id]/edit") ||
    route.includes("/areas/new") ||
    route.includes("/areas/[id]/edit") ||
    route.includes("/knowledge/[id]")
  );
}

function uniqueStrings(values: readonly string[]): string[] {
  return [...new Set(values)];
}
