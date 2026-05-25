import { describe, expect, it } from "vitest";
import {
  auditDeterministicAiPolicyCoverage,
  DETERMINISTIC_AI_POLICY_GUARDRAILS_VERSION,
  getDeterministicAiPolicyGuardrail,
  listDeterministicAiPolicyGuardrails,
  listDeterministicAiPolicyPromptIds,
  listDeterministicAiRedactionFields
} from "@/lib/ai/policyGuardrails";
import { DETERMINISTIC_AI_PROVIDER_LABEL } from "@/lib/ai/runReceipts";
import {
  DETERMINISTIC_AI_PROMPT_IDS,
  listDeterministicAiPrompts
} from "@/lib/ai/promptRegistry";

describe("deterministic AI policy guardrails", () => {
  it("publishes policy metadata for every current deterministic prompt", () => {
    expect(DETERMINISTIC_AI_POLICY_GUARDRAILS_VERSION).toBe(
      "2026-05-25.s36-f2"
    );
    expect(listDeterministicAiPolicyPromptIds()).toEqual(
      DETERMINISTIC_AI_PROMPT_IDS
    );
    expect(
      listDeterministicAiPolicyGuardrails().map(
        (guardrail) => guardrail.promptId
      )
    ).toEqual(DETERMINISTIC_AI_PROMPT_IDS);

    for (const prompt of listDeterministicAiPrompts()) {
      const guardrail = getDeterministicAiPolicyGuardrail(prompt.id);

      expect(guardrail?.promptVersion).toBe(prompt.version);
      expect(guardrail?.policyVersion).toBe(
        DETERMINISTIC_AI_POLICY_GUARDRAILS_VERSION
      );
      expect(guardrail?.dataPolicy.localOnly).toBe(true);
      expect(guardrail?.dataPolicy.persistenceAllowed).toBe(false);
    }
  });

  it("keeps the policy coverage audit green and aligned to the registry", () => {
    const report = auditDeterministicAiPolicyCoverage();

    expect(report).toMatchObject({
      ok: true,
      registryPromptIds: DETERMINISTIC_AI_PROMPT_IDS,
      policyPromptIds: DETERMINISTIC_AI_PROMPT_IDS,
      missingPromptIds: [],
      stalePolicyPromptIds: [],
      promptsWithoutRedactionFields: [],
      promptsWithProviderExpansion: [],
      promptsWithCostExpansion: [],
      issues: []
    });
  });

  it("catalogs redaction-sensitive fields for every local AI surface", () => {
    expect(
      listDeterministicAiRedactionFields("activity.note-summary").map(
        (field) => field.path
      )
    ).toEqual(["rawText"]);
    expect(
      listDeterministicAiRedactionFields("dashboard.analyst-actions").map(
        (field) => field.path
      )
    ).toEqual([
      "orders[].name",
      "orders[].account.name",
      "orders[].monthlyQuota",
      "leads[].firstName",
      "leads[].lastName",
      "deals[].name",
      "deals[].value",
      "deals[].accountName"
    ]);
    expect(
      listDeterministicAiRedactionFields("case.knowledge-suggestions").map(
        (field) => field.path
      )
    ).toEqual([
      "crmCase.subject",
      "crmCase.description",
      "crmCase.queueKey",
      "articles[].title",
      "articles[].summary",
      "articles[].body",
      "articles[].keywords"
    ]);

    for (const guardrail of listDeterministicAiPolicyGuardrails()) {
      for (const field of guardrail.dataPolicy.redactionSensitiveFields) {
        expect(field.localUseAllowed).toBe(true);
        expect(field.redactionRequiredBeforeExternalUse).toBe(true);
        expect(field.reasons.length).toBeGreaterThan(0);
      }
    }
  });

  it("disallows providers, secrets, network, persistence, and writes", () => {
    for (const guardrail of listDeterministicAiPolicyGuardrails()) {
      expect(guardrail.providerPolicy).toEqual({
        allowedProviderLabels: [DETERMINISTIC_AI_PROVIDER_LABEL],
        externalProvidersAllowed: false,
        providerSecretsAllowed: false,
        networkAllowed: false,
        disallowedCapabilities: [
          "external_llm_provider",
          "embedding_provider",
          "provider_secret",
          "network_request",
          "rag_retrieval",
          "write_action",
          "persistence"
        ]
      });
      expect(guardrail.enforcement).toEqual({
        authRequired: false,
        orgPolicyRequired: false,
        providerPolicyEnforcedBy: "static_local_contract"
      });
    }
  });

  it("keeps token and cost accounting at deterministic local defaults", () => {
    for (const guardrail of listDeterministicAiPolicyGuardrails()) {
      expect(guardrail.costPolicy).toEqual({
        providerLabel: DETERMINISTIC_AI_PROVIDER_LABEL,
        tokenAccounting: {
          input: 0,
          output: 0,
          total: 0
        },
        costUsd: 0,
        billable: false,
        userQuotaEnforcement: false,
        orgQuotaEnforcement: false
      });
    }
  });

  it("supports lookup without widening the prompt surface", () => {
    expect(
      getDeterministicAiPolicyGuardrail("case.knowledge-suggestions")?.promptId
    ).toBe("case.knowledge-suggestions");
    expect(getDeterministicAiPolicyGuardrail("missing.prompt")).toBeNull();
  });
});
