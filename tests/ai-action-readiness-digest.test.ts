import { describe, expect, it } from "vitest";
import {
  AI_ACTION_EVAL_FIXTURE_IDS,
  AI_ACTION_EVAL_FIXTURE_VERSION
} from "@/lib/ai/actionEvalFixtures";
import {
  AI_ACTION_INTENT_REGISTRY_VERSION,
  AI_ACTION_INTENT_SUPPORTED_IDS,
  AI_ACTION_INTENT_DEFERRED_IDS
} from "@/lib/ai/actionIntentRegistry";
import {
  AI_ACTION_READINESS_DIGEST_CONTENT_TYPE,
  AI_ACTION_READINESS_DIGEST_VERSION,
  auditAiActionReadinessDigest,
  getAiActionReadinessDigest,
  getAiActionReadinessDigestVersions
} from "@/lib/ai/actionReadinessDigest";
import { AI_ACTION_REVIEW_PACKET_VERSION } from "@/lib/ai/actionReviewPackets";

const noWriteFlags = {
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
};

describe("AI action readiness digest", () => {
  it("publishes stable digest metadata and source versions", () => {
    const digest = getAiActionReadinessDigest();

    expect(AI_ACTION_READINESS_DIGEST_VERSION).toBe("2026-05-26.s46-f1");
    expect(getAiActionReadinessDigestVersions()).toEqual({
      digestVersion: AI_ACTION_READINESS_DIGEST_VERSION,
      registryVersion: AI_ACTION_INTENT_REGISTRY_VERSION,
      reviewPacketVersion: AI_ACTION_REVIEW_PACKET_VERSION,
      evalFixtureVersion: AI_ACTION_EVAL_FIXTURE_VERSION
    });
    expect(digest).toMatchObject({
      contentType: AI_ACTION_READINESS_DIGEST_CONTENT_TYPE,
      digestType: "ai-action-readiness-digest",
      digestVersion: AI_ACTION_READINESS_DIGEST_VERSION,
      status: "ready",
      source: {
        module: "lib/ai/actionReadinessDigest.ts",
        digestScope: "no-write-ai-action-operator-readiness",
        registryModule: "lib/ai/actionIntentRegistry.ts",
        registryVersion: AI_ACTION_INTENT_REGISTRY_VERSION,
        reviewPacketModule: "lib/ai/actionReviewPackets.ts",
        reviewPacketVersion: AI_ACTION_REVIEW_PACKET_VERSION,
        evalFixtureModule: "lib/ai/actionEvalFixtures.ts",
        evalFixtureVersion: AI_ACTION_EVAL_FIXTURE_VERSION
      }
    });
    expect(digest.source.routeScope).not.toContain("/search");
    expect(digest.source.routeScope).not.toContain("/command-palette");
    expect(digest.source.routeScope).not.toContain("/deals/[id]");
  });

  it("composes S45 registry, review packet, and eval fixture audits", () => {
    const digest = getAiActionReadinessDigest();

    expect(digest.sources).toEqual([
      {
        source: "intent-registry",
        label: "AI action intent registry",
        status: "ready",
        ok: true,
        version: AI_ACTION_INTENT_REGISTRY_VERSION,
        itemCount:
          AI_ACTION_INTENT_SUPPORTED_IDS.length +
          AI_ACTION_INTENT_DEFERRED_IDS.length,
        issueCount: 0,
        issues: []
      },
      {
        source: "review-packets",
        label: "AI action review packet audit",
        status: "ready",
        ok: true,
        version: AI_ACTION_REVIEW_PACKET_VERSION,
        itemCount: AI_ACTION_INTENT_SUPPORTED_IDS.length,
        issueCount: 0,
        issues: []
      },
      {
        source: "eval-fixtures",
        label: "AI action eval fixture audit",
        status: "ready",
        ok: true,
        version: AI_ACTION_EVAL_FIXTURE_VERSION,
        itemCount: AI_ACTION_EVAL_FIXTURE_IDS.length,
        issueCount: 0,
        issues: []
      }
    ]);
    expect(digest.summary).toEqual({
      status: "ready",
      sourceCount: 3,
      readySourceCount: 3,
      blockedSourceCount: 0,
      issueCount: 6,
      supportedIntentCount: AI_ACTION_INTENT_SUPPORTED_IDS.length,
      deferredIntentCount: AI_ACTION_INTENT_DEFERRED_IDS.length,
      intentCount:
        AI_ACTION_INTENT_SUPPORTED_IDS.length +
        AI_ACTION_INTENT_DEFERRED_IDS.length,
      evalFixtureCount: AI_ACTION_EVAL_FIXTURE_IDS.length,
      sampleProposalCount: AI_ACTION_EVAL_FIXTURE_IDS.length,
      sampleStatusCounts: {
        readyForReview: 1,
        blocked: 3,
        deferred: 1
      },
      currentExecutionAllowed: false,
      wouldWriteNow: false
    });
  });

  it("exposes deterministic sample proposal references without raw payloads", () => {
    const firstDigest = getAiActionReadinessDigest();
    const secondDigest = getAiActionReadinessDigest();

    expect(firstDigest.sampleProposals).toEqual(secondDigest.sampleProposals);
    expect(firstDigest.sampleProposals.map((sample) => sample.fixtureId)).toEqual(
      AI_ACTION_EVAL_FIXTURE_IDS
    );
    expect(firstDigest.sampleProposals.map((sample) => sample.status)).toEqual([
      "ready_for_review",
      "blocked",
      "blocked",
      "deferred",
      "blocked"
    ]);
    expect(firstDigest.sampleProposals[0]).toMatchObject({
      fixtureId: "ai-action.supported.task-create-ready",
      category: "supported",
      intentId: "task.create",
      targetEntity: "Task",
      targetRoute: "/tasks",
      payloadValidationStatus: "valid",
      payloadKeys: ["leadId", "priority", "title"],
      issueCodes: [],
      approvalRequired: true,
      auditRequiredBeforeExecution: true,
      currentExecutionAllowed: false,
      wouldWriteNow: false
    });
    expect(firstDigest.sampleProposals[3]).toMatchObject({
      fixtureId: "ai-action.deferred.email-send-provider",
      category: "deferred",
      intentId: "email.send",
      targetEntity: "Lead",
      targetRoute: "/leads/lead-action-eval-2",
      payloadValidationStatus: "skipped",
      payloadKeys: ["body", "subject"],
      issueCodes: ["intent_deferred"]
    });
    for (const sample of firstDigest.sampleProposals) {
      expect(sample.coverage).toContain("no-write-policy");
      expect("proposal" in sample).toBe(false);
      expect("payload" in sample).toBe(false);
    }
  });

  it("audits digest coverage and no-write execution safety", () => {
    const digest = getAiActionReadinessDigest();

    expect(auditAiActionReadinessDigest()).toEqual({
      ok: true,
      digestVersion: AI_ACTION_READINESS_DIGEST_VERSION,
      sourceCount: 3,
      sourceStatuses: [
        {
          source: "intent-registry",
          status: "ready",
          issueCount: 0
        },
        {
          source: "review-packets",
          status: "ready",
          issueCount: 0
        },
        {
          source: "eval-fixtures",
          status: "ready",
          issueCount: 0
        }
      ],
      sourcesWithIssues: [],
      sampleProposalIds: AI_ACTION_EVAL_FIXTURE_IDS,
      samplesWithWritesEnabled: [],
      samplesWithExecutionAllowed: [],
      digestWouldWrite: false,
      digestWouldExecute: false,
      issues: []
    });
    expect(digest.read).toEqual({
      metadata: true,
      intentRegistryAudit: true,
      reviewPacketAudit: true,
      evalFixtureAudit: true,
      sampleProposals: true,
      database: false,
      crmRecords: false,
      externalServices: false,
      runtimeExecution: false
    });
    expect(digest.write).toEqual(noWriteFlags);
    expect(digest.safety).toEqual({
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
    });
  });
});
