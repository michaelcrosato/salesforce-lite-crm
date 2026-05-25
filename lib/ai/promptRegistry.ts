export const DETERMINISTIC_AI_PROMPT_REGISTRY_VERSION = "2026-05-25.s35-f2";

export const DETERMINISTIC_AI_PROMPT_IDS = [
  "activity.note-summary",
  "dashboard.analyst-actions",
  "case.knowledge-suggestions"
] as const;

export type DeterministicAiPromptId =
  (typeof DETERMINISTIC_AI_PROMPT_IDS)[number];

export type DeterministicAiPromptOwner = "sales" | "revops" | "service";

export type DeterministicAiPromptKind =
  | "summary"
  | "recommendation"
  | "case_assist";

export type DeterministicAiPromptSchemaRef = {
  readonly kind: "typescript" | "zod";
  readonly module: string;
  readonly exportName: string;
};

export type DeterministicAiPromptSafety = {
  readonly deterministic: true;
  readonly externalProvider: false;
  readonly network: false;
  readonly writes: false;
  readonly rag: false;
  readonly secrets: false;
};

export type DeterministicAiPromptRegistryEntry = {
  readonly id: DeterministicAiPromptId;
  readonly version: "v1";
  readonly owner: DeterministicAiPromptOwner;
  readonly kind: DeterministicAiPromptKind;
  readonly surface: string;
  readonly source: {
    readonly module: string;
    readonly exportName: string;
  };
  readonly inputSchema: DeterministicAiPromptSchemaRef;
  readonly outputSchema: DeterministicAiPromptSchemaRef;
  readonly routeScope: readonly string[];
  readonly safety: DeterministicAiPromptSafety;
};

const deterministicLocalSafety = {
  deterministic: true,
  externalProvider: false,
  network: false,
  writes: false,
  rag: false,
  secrets: false
} as const satisfies DeterministicAiPromptSafety;

export const DETERMINISTIC_AI_PROMPT_REGISTRY = [
  {
    id: "activity.note-summary",
    version: "v1",
    owner: "sales",
    kind: "summary",
    surface: "Contact note summary and next-step generation",
    source: {
      module: "lib/ai/activitySummarizer.ts",
      exportName: "deterministicActivitySummarizer.summarize"
    },
    inputSchema: {
      kind: "typescript",
      module: "lib/ai/activitySummarizer.ts",
      exportName: "ActivitySummarizerInput"
    },
    outputSchema: {
      kind: "zod",
      module: "lib/ai/activitySummarizer.ts",
      exportName: "activitySummaryResultSchema"
    },
    routeScope: ["/contacts/[id]"],
    safety: deterministicLocalSafety
  },
  {
    id: "dashboard.analyst-actions",
    version: "v1",
    owner: "revops",
    kind: "recommendation",
    surface: "Dashboard deterministic analyst action ranking",
    source: {
      module: "lib/business/analyst.ts",
      exportName: "buildAnalystPanel"
    },
    inputSchema: {
      kind: "typescript",
      module: "lib/business/analyst.ts",
      exportName: "AnalystPanelInput"
    },
    outputSchema: {
      kind: "zod",
      module: "lib/business/analyst.ts",
      exportName: "analystPanelSchema"
    },
    routeScope: ["/dashboard"],
    safety: deterministicLocalSafety
  },
  {
    id: "case.knowledge-suggestions",
    version: "v1",
    owner: "service",
    kind: "case_assist",
    surface: "Case knowledge suggestion packet ranking",
    source: {
      module: "lib/services/caseKnowledgeSuggestions.ts",
      exportName: "getCaseKnowledgeSuggestionPacket"
    },
    inputSchema: {
      kind: "typescript",
      module: "lib/services/caseKnowledgeSuggestions.ts",
      exportName: "CaseKnowledgeSuggestionOptions"
    },
    outputSchema: {
      kind: "zod",
      module: "lib/services/caseKnowledgeSuggestions.ts",
      exportName: "caseKnowledgeSuggestionPacketSchema"
    },
    routeScope: ["/cases"],
    safety: deterministicLocalSafety
  }
] as const satisfies readonly DeterministicAiPromptRegistryEntry[];

export function listDeterministicAiPrompts() {
  return DETERMINISTIC_AI_PROMPT_REGISTRY;
}

export function getDeterministicAiPrompt(id: string) {
  return (
    DETERMINISTIC_AI_PROMPT_REGISTRY.find((entry) => entry.id === id) ?? null
  );
}

export function listDeterministicAiPromptsByOwner(
  owner: DeterministicAiPromptOwner
) {
  return DETERMINISTIC_AI_PROMPT_REGISTRY.filter(
    (entry) => entry.owner === owner
  );
}
