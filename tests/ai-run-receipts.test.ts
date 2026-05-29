import { describe, expect, it } from "vitest";
import { validateDeterministicAiOutput } from "@/lib/ai/outputValidation";
import {
  buildDeterministicAiRunReceipt,
  DETERMINISTIC_AI_PROVIDER_LABEL,
  DETERMINISTIC_AI_RUN_RECEIPT_VERSION,
  hashDeterministicAiPayload
} from "@/lib/ai/runReceipts";
import {
  getDeterministicAiEvalFixture,
  listDeterministicAiEvalFixtures,
  runDeterministicAiEvalFixture
} from "@/lib/ai/evalFixtures";
import {
  getDeterministicAiPrompt,
  listDeterministicAiPrompts
} from "@/lib/ai/promptRegistry";
import { activitySummaryResultSchema } from "@/lib/ai/activitySummarizer";

const hashPattern = /^[a-f0-9]{64}$/;

describe("deterministic AI run receipts", () => {
  it("builds stable provider-free receipts for every current eval fixture", () => {
    for (const fixture of listDeterministicAiEvalFixtures()) {
      const prompt = getDeterministicAiPrompt(fixture.promptId);

      if (!prompt) {
        throw new Error(`Missing prompt for ${fixture.promptId}.`);
      }

      const firstRun = runDeterministicAiEvalFixture(fixture);
      const secondRun = runDeterministicAiEvalFixture(fixture);
      const firstReceipt = buildDeterministicAiRunReceipt({
        prompt,
        input: fixture.input,
        output: firstRun.output,
        validation: firstRun.validation
      });
      const secondReceipt = buildDeterministicAiRunReceipt({
        prompt,
        input: fixture.input,
        output: secondRun.output,
        validation: secondRun.validation
      });

      expect(firstReceipt).toEqual(secondReceipt);
      expect(firstReceipt.receiptVersion).toBe(
        DETERMINISTIC_AI_RUN_RECEIPT_VERSION
      );
      expect(firstReceipt.promptId).toBe(prompt.id);
      expect(firstReceipt.promptVersion).toBe(prompt.version);
      expect(firstReceipt.receiptId).toMatch(hashPattern);
      expect(firstReceipt.inputHash).toEqual({
        algorithm: "sha256",
        value: expect.stringMatching(hashPattern)
      });
      expect(firstReceipt.outputHash).toEqual({
        algorithm: "sha256",
        value: expect.stringMatching(hashPattern)
      });
      expect(firstReceipt.validation).toEqual({
        status: "valid",
        issueCount: 0,
        issues: []
      });
      expect(firstReceipt.provider).toEqual({
        label: DETERMINISTIC_AI_PROVIDER_LABEL,
        external: false,
        model: null,
        tokens: {
          input: 0,
          output: 0,
          total: 0
        },
        costUsd: 0
      });
      expect(firstReceipt.safety).toEqual({
        deterministic: true,
        externalProvider: false,
        network: false,
        writes: false,
        rag: false,
        secrets: false,
        persistence: false
      });
    }
  });

  it("keeps receipt coverage aligned with the prompt registry", () => {
    const receiptPromptIds = new Set(
      listDeterministicAiEvalFixtures().map((fixture) => fixture.promptId)
    );

    expect([...receiptPromptIds]).toEqual(
      listDeterministicAiPrompts().map((prompt) => prompt.id)
    );
    for (const prompt of listDeterministicAiPrompts()) {
      expect(prompt.safety).toMatchObject({
        externalProvider: false,
        network: false,
        writes: false,
        rag: false,
        secrets: false
      });
      expect(prompt.evalFixtureIds.length).toBeGreaterThan(0);
    }
  });

  it("reports invalid output validation without widening provider scope", () => {
    const prompt = getDeterministicAiPrompt("activity.note-summary");

    if (!prompt) {
      throw new Error("Expected activity.note-summary prompt.");
    }

    const invalidOutput = {
      summary: "Missing nextStep.",
      tags: ["proposal"]
    };
    const receipt = buildDeterministicAiRunReceipt({
      prompt,
      input: {
        rawText: "Customer asked for a proposal."
      },
      output: invalidOutput,
      validation: validateDeterministicAiOutput(
        activitySummaryResultSchema,
        invalidOutput
      )
    });

    expect(receipt.validation).toEqual({
      status: "invalid",
      issueCount: 1,
      issues: ["nextStep: Invalid input: expected string, received undefined"]
    });
    expect(receipt.provider.external).toBe(false);
    expect(receipt.provider.tokens.total).toBe(0);
    expect(receipt.provider.costUsd).toBe(0);
    expect(receipt.safety.persistence).toBe(false);
  });

  it("hashes payloads deterministically independent of object key order", () => {
    const billingFixture = getDeterministicAiEvalFixture(
      "case.knowledge-suggestions.billing-match"
    );

    if (!billingFixture) {
      throw new Error("Expected billing case knowledge fixture.");
    }

    expect(hashDeterministicAiPayload({ b: 2, a: 1 })).toBe(
      hashDeterministicAiPayload({ a: 1, b: 2 })
    );
    expect(hashDeterministicAiPayload(billingFixture.input)).toBe(
      hashDeterministicAiPayload({ ...billingFixture.input })
    );
    expect(hashDeterministicAiPayload(billingFixture.input)).not.toBe(
      hashDeterministicAiPayload({
        ...billingFixture.input,
        options: {
          limit: 2
        }
      })
    );
  });
});
