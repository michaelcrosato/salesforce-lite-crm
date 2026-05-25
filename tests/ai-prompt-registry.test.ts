import { describe, expect, it } from "vitest";
import {
  DETERMINISTIC_AI_PROMPT_IDS,
  DETERMINISTIC_AI_PROMPT_REGISTRY_VERSION,
  getDeterministicAiPrompt,
  listDeterministicAiPrompts,
  listDeterministicAiPromptsByOwner,
  type DeterministicAiPromptRegistryEntry
} from "@/lib/ai/promptRegistry";

describe("deterministic AI prompt registry", () => {
  it("publishes stable current deterministic prompt ids in order", () => {
    expect(DETERMINISTIC_AI_PROMPT_REGISTRY_VERSION).toBe(
      "2026-05-25.s35-f1"
    );
    expect(listDeterministicAiPrompts().map((entry) => entry.id)).toEqual(
      DETERMINISTIC_AI_PROMPT_IDS
    );
    expect(new Set(DETERMINISTIC_AI_PROMPT_IDS).size).toBe(
      DETERMINISTIC_AI_PROMPT_IDS.length
    );
  });

  it("registers summarizer, analyst, and case-assist schema references", () => {
    expect(getDeterministicAiPrompt("activity.note-summary")).toMatchObject({
      version: "v1",
      owner: "sales",
      source: {
        module: "lib/ai/activitySummarizer.ts",
        exportName: "deterministicActivitySummarizer.summarize"
      },
      inputSchema: {
        exportName: "ActivitySummarizerInput"
      },
      outputSchema: {
        exportName: "ActivitySummaryResult"
      }
    });
    expect(getDeterministicAiPrompt("dashboard.analyst-actions")).toMatchObject({
      owner: "revops",
      source: {
        module: "lib/business/analyst.ts",
        exportName: "buildAnalystPanel"
      },
      inputSchema: {
        exportName: "AnalystPanelInput"
      },
      outputSchema: {
        exportName: "AnalystPanel"
      }
    });
    expect(getDeterministicAiPrompt("case.knowledge-suggestions")).toMatchObject(
      {
        owner: "service",
        source: {
          module: "lib/services/caseKnowledgeSuggestions.ts",
          exportName: "getCaseKnowledgeSuggestionPacket"
        },
        inputSchema: {
          exportName: "CaseKnowledgeSuggestionOptions"
        },
        outputSchema: {
          exportName: "CaseKnowledgeSuggestionPacket"
        }
      }
    );
  });

  it("keeps every registered prompt local, read-only, and provider-free", () => {
    for (const entry of listDeterministicAiPrompts()) {
      expectNoExternalSurface(entry);
      expect(entry.routeScope.length).toBeGreaterThan(0);
      expect(entry.inputSchema.kind).toBe("typescript");
      expect(entry.outputSchema.kind).toBe("typescript");
    }
  });

  it("supports lookup by id and owner without widening the registry surface", () => {
    expect(getDeterministicAiPrompt("missing.prompt")).toBeNull();
    expect(
      listDeterministicAiPromptsByOwner("service").map((entry) => entry.id)
    ).toEqual(["case.knowledge-suggestions"]);
  });
});

function expectNoExternalSurface(entry: DeterministicAiPromptRegistryEntry) {
  expect(entry.safety).toEqual({
    deterministic: true,
    externalProvider: false,
    network: false,
    writes: false,
    rag: false,
    secrets: false
  });
}
