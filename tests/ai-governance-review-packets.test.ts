import { describe, expect, it } from "vitest";
import {
  auditDeterministicAiGovernanceReviewPackets,
  buildDeterministicAiGovernanceReviewPacket,
  DETERMINISTIC_AI_GOVERNANCE_REVIEW_PACKET_VERSION,
  getDeterministicAiGovernanceReviewPacket,
  getDeterministicAiGovernanceReviewVersions,
  listDeterministicAiGovernanceReviewPackets
} from "@/lib/ai/governanceReviewPackets";
import { DETERMINISTIC_AI_POLICY_GUARDRAILS_VERSION } from "@/lib/ai/policyGuardrails";
import {
  DETERMINISTIC_AI_PROMPT_IDS,
  listDeterministicAiPrompts
} from "@/lib/ai/promptRegistry";
import {
  DETERMINISTIC_AI_PROVIDER_LABEL,
  DETERMINISTIC_AI_RUN_RECEIPT_VERSION
} from "@/lib/ai/runReceipts";

const hashPattern = /^[a-f0-9]{64}$/;

describe("deterministic AI governance review packets", () => {
  it("publishes one read-only packet for every current deterministic prompt", () => {
    expect(DETERMINISTIC_AI_GOVERNANCE_REVIEW_PACKET_VERSION).toBe(
      "2026-05-25.s36-f3"
    );
    expect(getDeterministicAiGovernanceReviewVersions()).toEqual({
      packetVersion: DETERMINISTIC_AI_GOVERNANCE_REVIEW_PACKET_VERSION,
      receiptVersion: DETERMINISTIC_AI_RUN_RECEIPT_VERSION,
      policyVersion: DETERMINISTIC_AI_POLICY_GUARDRAILS_VERSION
    });

    const packets = listDeterministicAiGovernanceReviewPackets();

    expect(packets.map((packet) => packet.prompt.id)).toEqual(
      DETERMINISTIC_AI_PROMPT_IDS
    );
    expect(
      buildDeterministicAiGovernanceReviewPacket("activity.note-summary").prompt
        .id
    ).toBe("activity.note-summary");
    expect(getDeterministicAiGovernanceReviewPacket("missing.prompt")).toBeNull();
  });

  it("composes registry, output contract, fixture, receipt, and policy metadata", () => {
    const prompts = listDeterministicAiPrompts();

    for (const prompt of prompts) {
      const packet = getDeterministicAiGovernanceReviewPacket(prompt.id);

      if (!packet) {
        throw new Error(`Expected packet for ${prompt.id}.`);
      }

      expect(packet.packetVersion).toBe(
        DETERMINISTIC_AI_GOVERNANCE_REVIEW_PACKET_VERSION
      );
      expect(packet.prompt).toEqual(prompt);
      expect(packet.outputContract).toMatchObject({
        schema: prompt.outputSchema,
        validation: {
          kind: "zod",
          validatedByEvalFixtures: true,
          fixtureCount: prompt.evalFixtureIds.length,
          invalidFixtureIds: []
        }
      });
      expect(packet.evalFixtures.map((fixture) => fixture.fixtureId)).toEqual(
        prompt.evalFixtureIds
      );
      expect(packet.policy).toMatchObject({
        promptId: prompt.id,
        promptVersion: prompt.version,
        policyVersion: DETERMINISTIC_AI_POLICY_GUARDRAILS_VERSION
      });
      expect(packet.routeReview).toEqual({
        currentRouteScope: prompt.routeScope,
        productRouteChanges: false
      });
    }
  });

  it("reviews each fixture through a stable local run receipt without raw payloads", () => {
    for (const packet of listDeterministicAiGovernanceReviewPackets()) {
      for (const fixture of packet.evalFixtures) {
        expect(fixture.validation).toEqual({
          status: "valid",
          issueCount: 0,
          issues: []
        });
        expect(fixture.receipt).toMatchObject({
          receiptVersion: DETERMINISTIC_AI_RUN_RECEIPT_VERSION,
          promptId: packet.prompt.id,
          promptVersion: packet.prompt.version,
          provider: {
            label: DETERMINISTIC_AI_PROVIDER_LABEL,
            external: false,
            model: null,
            tokens: {
              input: 0,
              output: 0,
              total: 0
            },
            costUsd: 0
          }
        });
        expect(fixture.receipt.receiptId).toMatch(hashPattern);
        expect(fixture.receipt.inputHash.value).toMatch(hashPattern);
        expect(fixture.receipt.outputHash.value).toMatch(hashPattern);
        expect("input" in fixture).toBe(false);
        expect("output" in fixture).toBe(false);
        expect("expectedOutput" in fixture).toBe(false);
      }
    }
  });

  it("keeps governance packets explicitly inside current AI non-goals", () => {
    for (const packet of listDeterministicAiGovernanceReviewPackets()) {
      expect(packet.safety).toEqual({
        deterministic: true,
        readOnly: true,
        externalProvider: false,
        externalProviderClaims: false,
        network: false,
        writes: false,
        persistence: false,
        rag: false,
        toolPlanExecution: false,
        productRouteChanges: false
      });
      expect(packet.prompt.safety).toMatchObject({
        externalProvider: false,
        network: false,
        writes: false,
        rag: false,
        secrets: false
      });
      expect(packet.policy.providerPolicy).toMatchObject({
        externalProvidersAllowed: false,
        providerSecretsAllowed: false,
        networkAllowed: false
      });
      expect(packet.policy.dataPolicy.persistenceAllowed).toBe(false);

      for (const fixture of packet.evalFixtures) {
        expect(fixture.receipt.safety).toEqual({
          deterministic: true,
          externalProvider: false,
          network: false,
          writes: false,
          rag: false,
          secrets: false,
          persistence: false
        });
      }
    }
  });

  it("audits packet coverage and forbidden capability drift", () => {
    expect(auditDeterministicAiGovernanceReviewPackets()).toEqual({
      ok: true,
      packetVersion: DETERMINISTIC_AI_GOVERNANCE_REVIEW_PACKET_VERSION,
      registryPromptIds: DETERMINISTIC_AI_PROMPT_IDS,
      packetPromptIds: DETERMINISTIC_AI_PROMPT_IDS,
      promptsWithoutPackets: [],
      promptsWithoutFixtures: [],
      promptsWithInvalidFixtures: [],
      promptsWithPolicyMismatch: [],
      promptsWithExternalProviderClaims: [],
      promptsWithRagOrToolPlan: [],
      promptsWithRouteChanges: [],
      issues: []
    });
  });
});
