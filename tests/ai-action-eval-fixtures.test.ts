import { describe, expect, it } from "vitest";
import {
  AI_ACTION_EVAL_FIXTURE_IDS,
  AI_ACTION_EVAL_FIXTURE_REQUIRED_CATEGORIES,
  AI_ACTION_EVAL_FIXTURE_VERSION,
  auditAiActionEvalFixtures,
  getAiActionEvalFixture,
  listAiActionEvalFixtures,
  listAiActionEvalFixturesByCategory,
  runAiActionEvalFixture
} from "@/lib/ai/actionEvalFixtures";
import { AI_ACTION_REVIEW_PACKET_VERSION } from "@/lib/ai/actionReviewPackets";
import { AI_ACTION_INTENT_REGISTRY_VERSION } from "@/lib/ai/actionIntentRegistry";

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

const noExternalSafety = {
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
};

describe("AI action eval fixtures", () => {
  it("publishes stable fixture metadata and audit output", () => {
    expect(AI_ACTION_EVAL_FIXTURE_VERSION).toBe("2026-05-26.s45-f3");
    expect(listAiActionEvalFixtures().map((fixture) => fixture.id)).toEqual(
      AI_ACTION_EVAL_FIXTURE_IDS
    );
    expect(auditAiActionEvalFixtures()).toEqual({
      ok: true,
      fixtureVersion: AI_ACTION_EVAL_FIXTURE_VERSION,
      reviewPacketVersion: AI_ACTION_REVIEW_PACKET_VERSION,
      registryVersion: AI_ACTION_INTENT_REGISTRY_VERSION,
      fixtureIds: AI_ACTION_EVAL_FIXTURE_IDS,
      requiredCategories: AI_ACTION_EVAL_FIXTURE_REQUIRED_CATEGORIES,
      categoriesCovered: ["supported", "blocked", "malformed", "deferred"],
      duplicateFixtureIds: [],
      missingRequiredCategories: [],
      fixturesWithUnexpectedOutcomes: [],
      fixturesWithWritesEnabled: [],
      fixturesWithExecutionAllowed: [],
      fixturesWithExternalSurfaces: [],
      issues: []
    });
  });

  it("replays every fixture against its golden review outcome", () => {
    for (const fixture of listAiActionEvalFixtures()) {
      const firstRun = runAiActionEvalFixture(fixture);
      const secondRun = runAiActionEvalFixture(fixture);

      expect(firstRun.output).toEqual(firstRun.expectedOutput);
      expect(secondRun.output).toEqual(firstRun.output);
      expect(firstRun.packet.write).toEqual(noWriteFlags);
      expect(firstRun.packet.summary).toMatchObject({
        currentExecutionAllowed: false,
        wouldWriteNow: false
      });
      expect(firstRun.packet.safety).toMatchObject({
        reviewOnly: true,
        execution: false,
        silentWrites: false,
        auditPersistence: false,
        approvalPersistence: false
      });
      expect(fixture.safety).toEqual(noExternalSafety);
    }
  });

  it("indexes fixtures by action eval category", () => {
    expect(
      listAiActionEvalFixturesByCategory("supported").map((fixture) => fixture.id)
    ).toEqual(["ai-action.supported.task-create-ready"]);
    expect(
      listAiActionEvalFixturesByCategory("blocked").map((fixture) => fixture.id)
    ).toEqual([
      "ai-action.blocked.task-create-invalid-payload",
      "ai-action.blocked.unknown-case-reply"
    ]);
    expect(
      listAiActionEvalFixturesByCategory("malformed").map((fixture) => fixture.id)
    ).toEqual(["ai-action.malformed.case-status-execution-toggle"]);
    expect(
      listAiActionEvalFixturesByCategory("deferred").map((fixture) => fixture.id)
    ).toEqual(["ai-action.deferred.email-send-provider"]);
  });

  it("covers schema-valid, schema-invalid, malformed, and deferred examples", () => {
    const supportedFixture = getRequiredFixture(
      "ai-action.supported.task-create-ready"
    );
    const blockedFixture = getRequiredFixture(
      "ai-action.blocked.task-create-invalid-payload"
    );
    const malformedFixture = getRequiredFixture(
      "ai-action.malformed.case-status-execution-toggle"
    );
    const deferredFixture = getRequiredFixture(
      "ai-action.deferred.email-send-provider"
    );
    const unknownFixture = getRequiredFixture(
      "ai-action.blocked.unknown-case-reply"
    );

    expect(runAiActionEvalFixture(supportedFixture).output).toMatchObject({
      status: "ready_for_review",
      payloadValidationStatus: "valid",
      proposalSchemaValid: true,
      issueCodes: []
    });
    expect(runAiActionEvalFixture(blockedFixture).output).toMatchObject({
      status: "blocked",
      payloadValidationStatus: "invalid",
      proposalSchemaValid: true,
      issueCodes: ["payload_invalid", "payload_invalid"]
    });
    expect(runAiActionEvalFixture(malformedFixture).output).toMatchObject({
      status: "blocked",
      payloadValidationStatus: "skipped",
      proposalSchemaValid: false,
      issueCodes: ["proposal_invalid"]
    });
    expect(runAiActionEvalFixture(deferredFixture).output).toMatchObject({
      status: "deferred",
      payloadValidationStatus: "skipped",
      proposalSchemaValid: true,
      issueCodes: ["intent_deferred"]
    });
    expect(runAiActionEvalFixture(unknownFixture).output).toMatchObject({
      status: "blocked",
      intentId: "case.reply.send",
      payloadValidationStatus: "skipped",
      proposalSchemaValid: false,
      issueCodes: ["intent_unknown", "proposal_invalid"],
      reviewResultStatus: null,
      approvalRequired: false
    });
  });

  it("keeps policy guardrails attached to every fixture run", () => {
    for (const fixture of listAiActionEvalFixtures()) {
      const run = runAiActionEvalFixture(fixture);

      expect(fixture.coverage).toContain("no-write-policy");
      expect(run.output).toMatchObject({
        currentExecutionAllowed: false,
        wouldWriteNow: false,
        write: noWriteFlags,
        safety: noExternalSafety
      });
      expect(run.packet.source.routeScope).not.toContain("/search");
      expect(run.packet.source.routeScope).not.toContain("/command-palette");
      expect(run.packet.source.routeScope).not.toContain("/deals/[id]");
    }
  });
});

function getRequiredFixture(id: string) {
  const fixture = getAiActionEvalFixture(id);

  if (!fixture) {
    throw new Error(`Expected fixture ${id} to be registered.`);
  }

  return fixture;
}
