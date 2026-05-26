import { describe, expect, it } from "vitest";
import {
  AI_ACTION_EVAL_FIXTURE_IDS,
  AI_ACTION_EVAL_FIXTURE_REQUIRED_CATEGORIES,
  listAiActionEvalFixtures
} from "@/lib/ai/actionEvalFixtures";
import { getAiActionReadinessDigest } from "@/lib/ai/actionReadinessDigest";
import { EXCLUDED_ROUTES } from "@/lib/featureFlags";

describe("AI action operator guardrails", () => {
  it("keeps readiness samples aligned with S45 eval fixtures", () => {
    const digest = getAiActionReadinessDigest();
    const fixtures = listAiActionEvalFixtures();
    const samplesById = new Map(
      digest.sampleProposals.map((sample) => [sample.fixtureId, sample])
    );

    expect(digest.sampleProposals.map((sample) => sample.fixtureId)).toEqual(
      AI_ACTION_EVAL_FIXTURE_IDS
    );
    expect(new Set(fixtures.map((fixture) => fixture.category))).toEqual(
      new Set(AI_ACTION_EVAL_FIXTURE_REQUIRED_CATEGORIES)
    );

    for (const fixture of fixtures) {
      const sample = samplesById.get(fixture.id);

      if (!sample) {
        throw new Error(`Missing readiness sample for ${fixture.id}.`);
      }

      expect(sample.category).toBe(fixture.category);
      expect(sample.status).toBe(fixture.expectedOutcome.status);
      expect(sample.intentId).toBe(fixture.expectedOutcome.intentId);
      expect(sample.payloadValidationStatus).toBe(
        fixture.expectedOutcome.payloadValidationStatus
      );
      expect(sample.issueCodes).toEqual(fixture.expectedOutcome.issueCodes);
      expect(sample.approvalRequired).toBe(
        fixture.expectedOutcome.approvalRequired
      );
      expect(sample.auditRequiredBeforeExecution).toBe(
        fixture.expectedOutcome.auditRequiredBeforeExecution
      );
      expect(sample.currentExecutionAllowed).toBe(false);
      expect(sample.wouldWriteNow).toBe(false);
      expect(sample.coverage).toContain("no-write-policy");
      expect("proposal" in sample).toBe(false);
      expect("payload" in sample).toBe(false);
    }
  });

  it("keeps every operator sample route-safe and metadata-only", () => {
    const digest = getAiActionReadinessDigest();
    const enabledWriteFlags = Object.entries(digest.write)
      .filter(([, enabled]) => enabled)
      .map(([flag]) => flag);

    expect(enabledWriteFlags).toEqual([]);
    expect(digest.summary).toMatchObject({
      currentExecutionAllowed: false,
      wouldWriteNow: false,
      sampleStatusCounts: {
        readyForReview: 1,
        blocked: 3,
        deferred: 1
      }
    });
    expect(digest.safety).toMatchObject({
      readOnly: true,
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

    for (const sample of digest.sampleProposals) {
      if (sample.targetRoute) {
        expect(isExcludedRoute(sample.targetRoute)).toBe(false);
      }

      expect(sample.currentExecutionAllowed).toBe(false);
      expect(sample.wouldWriteNow).toBe(false);
    }
  });

  it("publishes e2e-addressable rows for all operator review states", () => {
    const digest = getAiActionReadinessDigest();
    const rowIds = digest.sampleProposals.map(
      (sample) => `ai-action-review-proposal-${sample.category}`
    );

    expect(rowIds).toEqual([
      "ai-action-review-proposal-supported",
      "ai-action-review-proposal-blocked",
      "ai-action-review-proposal-malformed",
      "ai-action-review-proposal-deferred",
      "ai-action-review-proposal-blocked"
    ]);
    expect(
      digest.sampleProposals.map((sample) => ({
        category: sample.category,
        status: sample.status,
        payload: sample.payloadValidationStatus,
        issueCodes: sample.issueCodes
      }))
    ).toEqual([
      {
        category: "supported",
        status: "ready_for_review",
        payload: "valid",
        issueCodes: []
      },
      {
        category: "blocked",
        status: "blocked",
        payload: "invalid",
        issueCodes: ["payload_invalid", "payload_invalid"]
      },
      {
        category: "malformed",
        status: "blocked",
        payload: "skipped",
        issueCodes: ["proposal_invalid"]
      },
      {
        category: "deferred",
        status: "deferred",
        payload: "skipped",
        issueCodes: ["intent_deferred"]
      },
      {
        category: "blocked",
        status: "blocked",
        payload: "skipped",
        issueCodes: ["intent_unknown", "proposal_invalid"]
      }
    ]);
  });
});

function isExcludedRoute(route: string): boolean {
  const path = route.split("?")[0] ?? route;

  return EXCLUDED_ROUTES.some((excludedRoute) =>
    excludedRoutePattern(excludedRoute).test(path)
  );
}

function excludedRoutePattern(route: string): RegExp {
  return new RegExp(`^${escapeRegExp(route).replace("\\[id\\]", "[^/]+")}$`);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
