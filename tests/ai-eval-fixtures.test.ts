import { describe, expect, it } from "vitest";
import {
  DETERMINISTIC_AI_EVAL_FIXTURE_IDS,
  DETERMINISTIC_AI_EVAL_HARNESS_VERSION,
  getDeterministicAiEvalFixture,
  listDeterministicAiEvalFixtures,
  listDeterministicAiEvalFixturesForPrompt,
  runDeterministicAiEvalFixture
} from "@/lib/ai/evalFixtures";
import {
  getDeterministicAiPrompt,
  listDeterministicAiPrompts
} from "@/lib/ai/promptRegistry";

describe("deterministic AI eval fixtures", () => {
  it("publishes stable fixture ids linked from the prompt registry", () => {
    expect(DETERMINISTIC_AI_EVAL_HARNESS_VERSION).toBe("2026-05-25.s35-f3");
    expect(listDeterministicAiEvalFixtures().map((fixture) => fixture.id)).toEqual(
      DETERMINISTIC_AI_EVAL_FIXTURE_IDS
    );

    const registryFixtureIds = listDeterministicAiPrompts().flatMap(
      (prompt) => prompt.evalFixtureIds
    );

    expect(registryFixtureIds).toEqual(DETERMINISTIC_AI_EVAL_FIXTURE_IDS);
    for (const fixture of listDeterministicAiEvalFixtures()) {
      const prompt = getDeterministicAiPrompt(fixture.promptId);

      expect(prompt?.evalFixtureIds).toContain(fixture.id);
      expect(getDeterministicAiEvalFixture(fixture.id)?.id).toBe(fixture.id);
    }
  });

  it("replays every fixture against golden outputs with schema validation", () => {
    for (const fixture of listDeterministicAiEvalFixtures()) {
      const firstRun = runDeterministicAiEvalFixture(fixture);
      const secondRun = runDeterministicAiEvalFixture(fixture);

      expect(firstRun.validation).toMatchObject({
        ok: true,
        issues: []
      });
      if (!firstRun.validation.ok) {
        throw new Error(`Expected ${fixture.id} validation to pass.`);
      }

      expect(firstRun.output).toEqual(firstRun.expectedOutput);
      expect(secondRun.output).toEqual(firstRun.output);
      expect(fixture.safety).toEqual({
        deterministic: true,
        externalProvider: false,
        network: false,
        writes: false,
        secrets: false
      });
    }
  });

  it("indexes fixtures by prompt without adding external surfaces", () => {
    expect(
      listDeterministicAiEvalFixturesForPrompt("activity.note-summary").map(
        (fixture) => fixture.id
      )
    ).toEqual([
      "activity.note-summary.proposal-followup",
      "activity.note-summary.untrusted-fallback"
    ]);
    expect(
      listDeterministicAiEvalFixturesForPrompt("dashboard.analyst-actions").map(
        (fixture) => fixture.id
      )
    ).toEqual(["dashboard.analyst-actions.mixed-priority"]);
    expect(
      listDeterministicAiEvalFixturesForPrompt("case.knowledge-suggestions").map(
        (fixture) => fixture.id
      )
    ).toEqual([
      "case.knowledge-suggestions.billing-match",
      "case.knowledge-suggestions.no-published"
    ]);
  });

  it("covers untrusted CRM text and deterministic fallback states", () => {
    const untrustedFixture = getDeterministicAiEvalFixture(
      "activity.note-summary.untrusted-fallback"
    );
    const emptyKnowledgeFixture = getDeterministicAiEvalFixture(
      "case.knowledge-suggestions.no-published"
    );

    if (!untrustedFixture || !emptyKnowledgeFixture) {
      throw new Error("Expected eval fixtures to be registered.");
    }

    const untrustedRun = runDeterministicAiEvalFixture(untrustedFixture);
    const emptyKnowledgeRun =
      runDeterministicAiEvalFixture(emptyKnowledgeFixture);

    expect(untrustedFixture.coverage).toContain("untrusted-crm-text");
    expect(untrustedRun.output).toMatchObject({
      nextStep: "Review and schedule follow-up.",
      tags: []
    });
    expect(emptyKnowledgeFixture.coverage).toContain("no-write-assertion");
    expect(emptyKnowledgeRun.output).toMatchObject({
      emptyReason: "no_published_articles",
      suggestions: []
    });
  });
});
