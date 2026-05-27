import { describe, expect, it } from "vitest";
import {
  APPROVAL_REVIEW_PACKET_CONTENT_TYPE,
  APPROVAL_REVIEW_PACKET_VERSION,
  auditApprovalReviewPackets,
  buildApprovalReviewPacket,
  buildApprovalReviewPacketBatch,
  buildApprovalReviewSamplePacketBatch,
  listApprovalReviewSampleProposals
} from "@/lib/server/approvalReviewPackets";
import {
  APPROVAL_POLICY_BLOCKED_SUBJECT_IDS,
  APPROVAL_POLICY_REGISTRY_VERSION,
  APPROVAL_POLICY_SUPPORTED_SUBJECT_IDS
} from "@/lib/server/approvalPolicyRegistry";

const noWriteFlags = {
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

const reviewOnlySafety = {
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

describe("approval review packets", () => {
  it("publishes stable metadata, samples, and audit output", () => {
    const sampleBatch = buildApprovalReviewSamplePacketBatch();

    expect(APPROVAL_REVIEW_PACKET_VERSION).toBe("2026-05-26.s47-f2");
    expect(sampleBatch).toMatchObject({
      contentType: APPROVAL_REVIEW_PACKET_CONTENT_TYPE,
      packetType: "approval-review-packet-batch",
      packetVersion: APPROVAL_REVIEW_PACKET_VERSION,
      source: {
        module: "lib/server/approvalReviewPackets.ts",
        packetScope: "no-write-approval-review-packets",
        registryModule: "lib/server/approvalPolicyRegistry.ts",
        registryVersion: APPROVAL_POLICY_REGISTRY_VERSION,
        proposalSchema: "approvalReviewProposalSchema",
        supportedSubjectIds: APPROVAL_POLICY_SUPPORTED_SUBJECT_IDS,
        blockedSubjectIds: APPROVAL_POLICY_BLOCKED_SUBJECT_IDS,
        sampleProposalCount: 6,
        routeScope: ["/reports"]
      },
      write: noWriteFlags,
      safety: reviewOnlySafety
    });
    expect(listApprovalReviewSampleProposals()).toHaveLength(6);
    expect(sampleBatch.packets.map((packet) => packet.status)).toEqual([
      "approval_needed",
      "approval_needed",
      "approval_needed",
      "approval_needed",
      "not_needed",
      "blocked"
    ]);
    expect(auditApprovalReviewPackets()).toEqual({
      ok: true,
      packetVersion: APPROVAL_REVIEW_PACKET_VERSION,
      registryVersion: APPROVAL_POLICY_REGISTRY_VERSION,
      supportedSubjectIds: APPROVAL_POLICY_SUPPORTED_SUBJECT_IDS,
      blockedSubjectIds: APPROVAL_POLICY_BLOCKED_SUBJECT_IDS,
      sampleSubjectIds: [
        "ai-action.supported-intent-proposal",
        "crm.bulk-action-execution",
        "crm.workflow-manual-execution",
        "crm.csv-contact-import-apply",
        "ai-action.external-provider-request"
      ],
      supportedSubjectIdsWithoutSamples: [],
      reviewPacketsWouldWrite: false,
      reviewPacketsWouldExecute: false,
      reviewPacketsWouldPersistApprovals: false,
      samplePacketStatuses: [
        "approval_needed",
        "approval_needed",
        "approval_needed",
        "approval_needed",
        "not_needed",
        "blocked"
      ],
      issues: []
    });
  });

  it("marks supported future execution proposals as approval needed", () => {
    const packet = buildApprovalReviewPacket({
      proposalId: "approval-review-bulk-1",
      subjectId: "crm.bulk-action-execution",
      label: "Bulk account status update",
      summary: "Review selected records before a future bulk update.",
      source: "bulk_action_dry_run_review_packet",
      approvalIntent: "future_execution",
      target: {
        entity: "Account",
        recordCount: 2,
        route: "/reports"
      },
      evidence: [
        evidence("dry_run_summary"),
        evidence("target_record_scope"),
        evidence("audit_expectation"),
        evidence("no_write_safety_flags"),
        evidence("operator_rationale")
      ],
      requestedCapabilities: {
        recordMutation: true,
        databaseWrite: true,
        auditEventWrite: true,
        actionExecution: true
      },
      rationale: "A future execution would update account status values."
    });

    expect(packet.status).toBe("approval_needed");
    expect(packet.proposal).toEqual({
      proposalId: "approval-review-bulk-1",
      subjectId: "crm.bulk-action-execution",
      label: "Bulk account status update",
      source: "bulk_action_dry_run_review_packet",
      approvalIntent: "future_execution",
      target: {
        entity: "Account",
        recordCount: 2,
        route: "/reports"
      },
      evidenceKeys: [
        "audit_expectation",
        "dry_run_summary",
        "no_write_safety_flags",
        "operator_rationale",
        "target_record_scope"
      ],
      requestedCapabilityKeys: [
        "recordMutation",
        "databaseWrite",
        "auditEventWrite",
        "actionExecution"
      ],
      rationale: "A future execution would update account status values."
    });
    expect(packet.subject).toMatchObject({
      id: "crm.bulk-action-execution",
      status: "supported",
      riskLevel: "critical",
      reviewer: {
        label: "manager-reviewer"
      }
    });
    expect(packet.evidence.map((item) => [item.key, item.present])).toEqual([
      ["dry_run_summary", true],
      ["target_record_scope", true],
      ["audit_expectation", true],
      ["no_write_safety_flags", true],
      ["operator_rationale", true]
    ]);
    expect(packet.approval).toMatchObject({
      approvalRequired: true,
      mode: "explicit_operator_approval",
      reviewer: {
        label: "manager-reviewer",
        identityRequiredBeforeExecution: true
      },
      approvalPersistence: false,
      currentApprovalDecisionAllowed: false,
      currentExecutionAllowed: false
    });
    expect(packet.audit).toMatchObject({
      category: "approval_policy",
      reviewEventAction: "approval_policy_review",
      decisionEventAction: "approval_decision",
      futureExecutionAuditRequired: true,
      approvalDecisionAuditRequired: true,
      auditRecorderPath: "lib/services/auditEvents.ts#recordAuditEvent",
      approvalPersistence: false,
      wouldWriteNow: false,
      auditRequiredBeforeExecution: true,
      reviewPacketWouldRecordAuditNow: false,
      approvalDecisionWouldRecordNow: false,
      executionWouldRecordNow: false
    });
    expect(packet.summary).toEqual({
      packetCount: 1,
      approvalNeededCount: 1,
      blockedCount: 0,
      notNeededCount: 0,
      issueCount: 0,
      missingEvidenceCount: 0,
      approvalRequiredCount: 1,
      auditRequiredBeforeExecutionCount: 1,
      currentApprovalDecisionAllowed: false,
      currentExecutionAllowed: false,
      wouldWriteNow: false,
      approvalPersistence: false
    });
    expect(packet.write).toEqual(noWriteFlags);
    expect(packet.safety).toEqual(reviewOnlySafety);
  });

  it("marks read-only registry proposals as approval not needed", () => {
    const packet = buildApprovalReviewPacket({
      proposalId: "approval-review-read-only-1",
      subjectId: "ai-action.supported-intent-proposal",
      label: "Display approval registry coverage",
      summary: "Show registry coverage without requesting a write.",
      source: "approval_policy_registry",
      approvalIntent: "read_only_review",
      target: {
        entity: "ApprovalPolicyRegistry",
        recordCount: 0,
        route: "/reports"
      },
      evidence: [],
      requestedCapabilities: {},
      rationale: "Read-only metadata display should not require approval."
    });

    expect(packet.status).toBe("not_needed");
    expect(packet.approval).toEqual({
      approvalRequired: false,
      mode: "not_required",
      reviewer: null,
      identityRequiredBeforeExecution: false,
      approvalPersistence: false,
      currentApprovalDecisionAllowed: false,
      currentExecutionAllowed: false,
      reason:
        "The proposal is read-only or does not request a future mutation/execution capability, so approval is not needed."
    });
    expect(packet.summary).toMatchObject({
      notNeededCount: 1,
      approvalRequiredCount: 0,
      auditRequiredBeforeExecutionCount: 0,
      currentExecutionAllowed: false,
      wouldWriteNow: false
    });
    expect(packet.write).toEqual(noWriteFlags);
  });

  it("blocks subjects that the policy registry marks as deferred", () => {
    const packet = buildApprovalReviewPacket({
      proposalId: "approval-review-provider-1",
      subjectId: "ai-action.external-provider-request",
      label: "Live provider request",
      summary: "A model request wants to call a live provider.",
      source: "operator_input",
      approvalIntent: "future_execution",
      target: {
        entity: "ExternalAIProvider",
        recordCount: 0,
        route: null
      },
      evidence: [
        evidence("proposal_payload"),
        evidence("no_write_safety_flags")
      ],
      requestedCapabilities: {
        externalProvider: true,
        networkRequest: true
      },
      rationale: "External provider requests are not promoted."
    });

    expect(packet.status).toBe("blocked");
    expect(packet.subject).toMatchObject({
      id: "ai-action.external-provider-request",
      status: "blocked",
      riskLevel: "blocked",
      deferral: {
        requiresPlanPromotion: true,
        requiresContractPromotion: true,
        reason: "External AI provider integration is not promoted."
      }
    });
    expect(packet.issues).toEqual([
      {
        code: "subject_blocked",
        severity: "error",
        path: "subjectId",
        message:
          "Promote deterministic/recorded provider contracts before approval policies cover live provider requests."
      }
    ]);
    expect(packet.approval).toMatchObject({
      approvalRequired: false,
      mode: "blocked",
      currentApprovalDecisionAllowed: false,
      currentExecutionAllowed: false,
      approvalPersistence: false
    });
    expect(packet.audit?.auditRecorderPath).toBeNull();
    expect(packet.write).toEqual(noWriteFlags);
  });

  it("blocks malformed, unknown, and missing-evidence proposals deterministically", () => {
    const malformed = buildApprovalReviewPacket({
      proposalId: "approval-review-malformed-1",
      subjectId: "crm.bulk-action-execution",
      label: "Malformed bulk approval",
      summary: "This payload tries to approve immediately.",
      source: "bulk_action_dry_run_review_packet",
      approvalIntent: "approval_decision",
      target: {
        entity: "Account",
        recordCount: 1,
        route: "/reports"
      },
      evidence: [
        evidence("dry_run_summary"),
        evidence("target_record_scope"),
        evidence("audit_expectation"),
        evidence("no_write_safety_flags"),
        evidence("operator_rationale")
      ],
      requestedCapabilities: {
        approvalDecisionWrite: true
      },
      rationale: "Approve now.",
      approveNow: true
    });
    const unknown = buildApprovalReviewPacket({
      proposalId: "approval-review-unknown-1",
      subjectId: "crm.unknown-approval-subject",
      label: "Unknown approval subject",
      summary: "This subject is not registered.",
      source: "operator_input",
      approvalIntent: "future_execution",
      target: {
        entity: "Account",
        recordCount: 1,
        route: "/accounts"
      },
      evidence: [],
      requestedCapabilities: {
        recordMutation: true
      }
    });
    const missingEvidence = buildApprovalReviewPacket({
      proposalId: "approval-review-missing-evidence-1",
      subjectId: "crm.csv-contact-import-apply",
      label: "CSV contact import apply",
      summary: "This future import apply proposal lacks required evidence.",
      source: "csv_import_apply_preflight",
      approvalIntent: "future_execution",
      target: {
        entity: "Contact",
        recordCount: 4,
        route: "/reports"
      },
      evidence: [evidence("dry_run_summary")],
      requestedCapabilities: {
        recordMutation: true,
        databaseWrite: true,
        auditEventWrite: true,
        actionExecution: true
      }
    });

    expect(malformed.status).toBe("blocked");
    expect(malformed.issues.map((issue) => issue.code)).toEqual([
      "proposal_invalid"
    ]);
    expect(malformed.proposal.requestedCapabilityKeys).toEqual([
      "approvalDecisionWrite"
    ]);
    expect(malformed.write).toEqual(noWriteFlags);

    expect(unknown.status).toBe("blocked");
    expect(unknown.subject).toBeNull();
    expect(unknown.issues).toEqual([
      {
        code: "subject_unknown",
        severity: "error",
        path: "subjectId",
        message:
          "Approval policy subject 'crm.unknown-approval-subject' is not registered."
      }
    ]);
    expect(unknown.approval).toBeNull();

    expect(missingEvidence.status).toBe("blocked");
    expect(missingEvidence.issues.map((issue) => issue.code)).toEqual([
      "evidence_missing",
      "evidence_missing",
      "evidence_missing",
      "evidence_missing"
    ]);
    expect(missingEvidence.summary).toMatchObject({
      blockedCount: 1,
      missingEvidenceCount: 4,
      approvalRequiredCount: 0,
      currentExecutionAllowed: false,
      wouldWriteNow: false
    });
  });

  it("summarizes mixed batches without enabling approval decisions or execution", () => {
    const batch = buildApprovalReviewPacketBatch([
      {
        proposalId: "approval-review-ai-action-1",
        subjectId: "ai-action.supported-intent-proposal",
        label: "AI action proposal",
        summary: "Review a supported AI action before future execution.",
        source: "ai_action_review_packet",
        approvalIntent: "future_execution",
        target: {
          entity: "Task",
          recordCount: 1,
          route: "/reports"
        },
        evidence: [
          evidence("proposal_payload"),
          evidence("source_provenance"),
          evidence("target_record_scope"),
          evidence("audit_expectation"),
          evidence("no_write_safety_flags"),
          evidence("operator_rationale")
        ],
        requestedCapabilities: {
          recordMutation: true,
          databaseWrite: true,
          auditEventWrite: true,
          actionExecution: true
        }
      },
      {
        proposalId: "approval-review-not-needed-1",
        subjectId: "crm.workflow-manual-execution",
        label: "Workflow coverage view",
        summary: "Display workflow approval coverage only.",
        source: "approval_policy_registry",
        approvalIntent: "read_only_review",
        target: {
          entity: "WorkflowRule",
          recordCount: 0,
          route: "/reports"
        },
        evidence: [],
        requestedCapabilities: {}
      },
      {
        proposalId: "approval-review-routing-blocked-1",
        subjectId: "ai-action.routing-execution",
        label: "AI routing execution",
        summary: "AI routing execution remains blocked.",
        source: "operator_input",
        approvalIntent: "future_execution",
        target: {
          entity: "Lead",
          recordCount: 1,
          route: "/leads/lead-1"
        },
        evidence: [
          evidence("proposal_payload"),
          evidence("target_record_scope"),
          evidence("no_write_safety_flags")
        ],
        requestedCapabilities: {
          routingExecution: true
        }
      }
    ]);

    expect(batch.packets.map((packet) => packet.status)).toEqual([
      "approval_needed",
      "not_needed",
      "blocked"
    ]);
    expect(batch.summary).toEqual({
      packetCount: 3,
      approvalNeededCount: 1,
      blockedCount: 1,
      notNeededCount: 1,
      issueCount: 1,
      missingEvidenceCount: 5,
      approvalRequiredCount: 1,
      auditRequiredBeforeExecutionCount: 1,
      currentApprovalDecisionAllowed: false,
      currentExecutionAllowed: false,
      wouldWriteNow: false,
      approvalPersistence: false
    });
    expect(batch.write).toEqual(noWriteFlags);
    expect(batch.safety).toEqual(reviewOnlySafety);
  });
});

function evidence(key: string) {
  return {
    key,
    source: evidenceSource(key),
    summary: `${key} is available for review.`
  };
}

function evidenceSource(key: string) {
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
