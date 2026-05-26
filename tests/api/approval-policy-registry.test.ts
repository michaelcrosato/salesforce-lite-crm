import { describe, expect, it } from "vitest";
import {
  APPROVAL_POLICY_BLOCKED_CAPABILITIES,
  APPROVAL_POLICY_BLOCKED_SUBJECT_IDS,
  APPROVAL_POLICY_CONTENT_TYPE,
  APPROVAL_POLICY_REGISTRY_VERSION,
  APPROVAL_POLICY_REVIEWER_LABELS,
  APPROVAL_POLICY_RISK_LEVELS,
  APPROVAL_POLICY_SUBJECT_IDS,
  APPROVAL_POLICY_SUPPORTED_SUBJECT_IDS,
  auditApprovalPolicyRegistry,
  getApprovalPolicyRegistry,
  getApprovalPolicySubject,
  isApprovalPolicySubjectId,
  isSupportedApprovalPolicySubjectId,
  listApprovalPolicySubjects,
  listApprovalPolicySubjectsByReviewer,
  listApprovalPolicySubjectsByRisk,
  listBlockedApprovalPolicySubjects,
  listSupportedApprovalPolicySubjects,
  type ApprovalPolicySubject
} from "@/lib/server/approvalPolicyRegistry";

const readMetadataOnly = {
  metadata: true,
  database: false,
  crmRecords: false,
  promptOutputs: false,
  runtimeEvaluation: false,
  authSession: false
};

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

const policyOnlySafety = {
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

describe("approval policy registry", () => {
  it("publishes stable metadata for supported and blocked approval subjects", () => {
    const registry = getApprovalPolicyRegistry();

    expect(APPROVAL_POLICY_REGISTRY_VERSION).toBe("2026-05-26.s47-f1");
    expect(APPROVAL_POLICY_RISK_LEVELS).toEqual([
      "medium",
      "high",
      "critical",
      "blocked"
    ]);
    expect(APPROVAL_POLICY_REVIEWER_LABELS).toEqual([
      "operator-reviewer",
      "manager-reviewer",
      "data-steward-reviewer",
      "admin-reviewer"
    ]);
    expect(registry).toMatchObject({
      contentType: APPROVAL_POLICY_CONTENT_TYPE,
      registryType: "approval-policy-registry",
      registryVersion: APPROVAL_POLICY_REGISTRY_VERSION,
      supportedSubjectCount: APPROVAL_POLICY_SUPPORTED_SUBJECT_IDS.length,
      blockedSubjectCount: APPROVAL_POLICY_BLOCKED_SUBJECT_IDS.length,
      subjectCount: APPROVAL_POLICY_SUBJECT_IDS.length,
      supportedSubjectIds: APPROVAL_POLICY_SUPPORTED_SUBJECT_IDS,
      blockedSubjectIds: APPROVAL_POLICY_BLOCKED_SUBJECT_IDS,
      source: {
        module: "lib/server/approvalPolicyRegistry.ts",
        registryScope: "metadata-only-approval-policy-contracts"
      },
      read: readMetadataOnly,
      write: noWriteFlags,
      safety: policyOnlySafety
    });
    expect(listApprovalPolicySubjects().map((subject) => subject.id)).toEqual(
      APPROVAL_POLICY_SUBJECT_IDS
    );
    expect(listSupportedApprovalPolicySubjects().map((subject) => subject.id)).toEqual(
      APPROVAL_POLICY_SUPPORTED_SUBJECT_IDS
    );
    expect(listBlockedApprovalPolicySubjects().map((subject) => subject.id)).toEqual(
      APPROVAL_POLICY_BLOCKED_SUBJECT_IDS
    );
    expect(new Set(APPROVAL_POLICY_SUBJECT_IDS).size).toBe(
      APPROVAL_POLICY_SUBJECT_IDS.length
    );
  });

  it("describes supported approval classes with reviewer, evidence, and audit requirements", () => {
    expect(getApprovalPolicySubject("ai-action.supported-intent-proposal")).toMatchObject({
      status: "supported",
      subjectType: "ai_action_proposal",
      riskLevel: "high",
      reviewer: {
        label: "operator-reviewer",
        authRoleRequiredNow: false,
        identityRequiredBeforeExecution: true
      },
      audit: {
        auditRecorderPath: "lib/services/auditEvents.ts#recordAuditEvent",
        approvalPersistence: false,
        wouldWriteNow: false
      }
    });
    expect(getApprovalPolicySubject("crm.bulk-action-execution")).toMatchObject({
      status: "supported",
      riskLevel: "critical",
      reviewer: {
        label: "manager-reviewer"
      },
      references: [
        {
          module: "lib/server/bulkActionDryRunReviewPackets.ts",
          exportName: "buildBulkActionReviewPacket"
        },
        {
          module: "lib/server/bulkActionExecution.ts",
          exportName: "executeBulkAction"
        }
      ]
    });
    expect(getApprovalPolicySubject("crm.csv-contact-import-apply")).toMatchObject({
      reviewer: {
        label: "data-steward-reviewer"
      }
    });

    for (const subject of listSupportedApprovalPolicySubjects()) {
      expectPolicyOnlySubject(subject);
      expect(subject.deferral).toBeNull();
      expect(subject.audit.auditRecorderPath).toBe(
        "lib/services/auditEvents.ts#recordAuditEvent"
      );
      expect(subject.evidence.map((item) => item.key)).toContain(
        "operator_rationale"
      );
      expect(subject.evidence.map((item) => item.key)).toContain(
        "audit_expectation"
      );
    }
  });

  it("keeps excluded and external capabilities blocked with safe next actions", () => {
    expect(getApprovalPolicySubject("ai-action.external-provider-request")).toMatchObject({
      status: "blocked",
      riskLevel: "blocked",
      deferral: {
        requiresPlanPromotion: true,
        requiresContractPromotion: true,
        reason: "External AI provider integration is not promoted."
      }
    });
    expect(getApprovalPolicySubject("crm.dealer-order-area-crud")).toMatchObject({
      status: "blocked",
      deferral: {
        reason: "Dealer-order and area create/edit flows are not promoted."
      }
    });
    expect(getApprovalPolicySubject("approval.policy-execution")).toMatchObject({
      status: "blocked",
      subjectType: "approval_runtime_capability",
      deferral: {
        reason: "Approval enforcement and persistence are not part of S47-F1."
      }
    });

    for (const subject of listBlockedApprovalPolicySubjects()) {
      expectPolicyOnlySubject(subject);
      expect(subject.audit.auditRecorderPath).toBeNull();
      expect(subject.deferral?.safeNextStep.length).toBeGreaterThan(0);
      expect(subject.reviewer.label).toBe("admin-reviewer");
    }
  });

  it("supports lookup helpers without widening route, auth, or execution scope", () => {
    const registry = getApprovalPolicyRegistry();

    expect(isApprovalPolicySubjectId("crm.workflow-manual-execution")).toBe(true);
    expect(isApprovalPolicySubjectId("crm.approval-run")).toBe(false);
    expect(isSupportedApprovalPolicySubjectId("crm.bulk-action-execution")).toBe(
      true
    );
    expect(
      isSupportedApprovalPolicySubjectId("ai-action.external-provider-request")
    ).toBe(false);
    expect(getApprovalPolicySubject("missing.subject")).toBeNull();
    expect(listApprovalPolicySubjectsByRisk("critical").map((subject) => subject.id)).toEqual([
      "crm.bulk-action-execution",
      "crm.workflow-manual-execution",
      "crm.csv-contact-import-apply"
    ]);
    expect(
      listApprovalPolicySubjectsByReviewer("manager-reviewer").map(
        (subject) => subject.id
      )
    ).toEqual([
      "crm.bulk-action-execution",
      "crm.workflow-manual-execution"
    ]);
    expect(() => getApprovalPolicyRegistry({ execute: true })).toThrow(
      "Unrecognized key(s) in object: 'execute'"
    );
    expect(registry.source.routeScope).toEqual(["/reports"]);
    expect(registry.source.routeScope).not.toContain("/search");
    expect(registry.source.routeScope).not.toContain("/command-palette");
    expect(registry.source.routeScope).not.toContain("/deals/[id]");
    expect(registry.source.routeScope).not.toContain("/orders/new");
    expect(registry.source.routeScope).not.toContain("/areas/new");
  });

  it("audits registry completeness and no-write guardrails", () => {
    expect(auditApprovalPolicyRegistry()).toEqual({
      ok: true,
      registryVersion: APPROVAL_POLICY_REGISTRY_VERSION,
      supportedSubjectIds: APPROVAL_POLICY_SUPPORTED_SUBJECT_IDS,
      blockedSubjectIds: APPROVAL_POLICY_BLOCKED_SUBJECT_IDS,
      registrySubjectIds: APPROVAL_POLICY_SUBJECT_IDS,
      duplicateSubjectIds: [],
      missingSupportedSubjectIds: [],
      missingBlockedSubjectIds: [],
      supportedSubjectsWithoutAuditPath: [],
      subjectsWithoutReviewer: [],
      subjectsWithoutRequiredEvidence: [],
      subjectsMissingBlockedCapabilities: [],
      subjectsWithExecutionEnabled: [],
      subjectsWithWritesEnabled: [],
      subjectsWithExcludedRoutes: [],
      issues: []
    });
  });
});

function expectPolicyOnlySubject(subject: ApprovalPolicySubject) {
  expect(subject.read).toEqual(readMetadataOnly);
  expect(subject.write).toEqual(noWriteFlags);
  expect(subject.safety).toEqual(policyOnlySafety);
  expect(subject.audit).toMatchObject({
    category: "approval_policy",
    reviewEventAction: "approval_policy_review",
    decisionEventAction: "approval_decision",
    futureExecutionAuditRequired: true,
    approvalDecisionAuditRequired: true,
    approvalPersistence: false,
    wouldWriteNow: false
  });
  expect(subject.blockedCapabilities).toEqual(
    APPROVAL_POLICY_BLOCKED_CAPABILITIES
  );
  expect(subject.evidence.length).toBeGreaterThan(0);
  expect(
    subject.evidence.every((requirement) => requirement.required === true)
  ).toBe(true);
}
