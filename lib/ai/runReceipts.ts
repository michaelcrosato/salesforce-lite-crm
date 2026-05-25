import { createHash } from "node:crypto";
import type { DeterministicAiOutputValidationResult } from "@/lib/ai/outputValidation";
import type { DeterministicAiPromptRegistryEntry } from "@/lib/ai/promptRegistry";

export const DETERMINISTIC_AI_RUN_RECEIPT_VERSION = "2026-05-25.s36-f1";

export const DETERMINISTIC_AI_PROVIDER_LABEL = "local-deterministic";

export type DeterministicAiHash = {
  readonly algorithm: "sha256";
  readonly value: string;
};

export type DeterministicAiRunReceiptSafety = {
  readonly deterministic: true;
  readonly externalProvider: false;
  readonly network: false;
  readonly writes: false;
  readonly rag: false;
  readonly secrets: false;
  readonly persistence: false;
};

export type DeterministicAiRunReceiptProvider = {
  readonly label: typeof DETERMINISTIC_AI_PROVIDER_LABEL;
  readonly external: false;
  readonly model: null;
  readonly tokens: {
    readonly input: 0;
    readonly output: 0;
    readonly total: 0;
  };
  readonly costUsd: 0;
};

export type DeterministicAiRunReceiptValidation = {
  readonly status: "valid" | "invalid";
  readonly issueCount: number;
  readonly issues: readonly string[];
};

export type DeterministicAiRunReceipt = {
  readonly receiptVersion: typeof DETERMINISTIC_AI_RUN_RECEIPT_VERSION;
  readonly receiptId: string;
  readonly promptId: DeterministicAiPromptRegistryEntry["id"];
  readonly promptVersion: DeterministicAiPromptRegistryEntry["version"];
  readonly provider: DeterministicAiRunReceiptProvider;
  readonly validation: DeterministicAiRunReceiptValidation;
  readonly inputHash: DeterministicAiHash;
  readonly outputHash: DeterministicAiHash;
  readonly safety: DeterministicAiRunReceiptSafety;
};

export type BuildDeterministicAiRunReceiptInput<TOutput> = {
  readonly prompt: DeterministicAiPromptRegistryEntry;
  readonly input: unknown;
  readonly output: unknown;
  readonly validation: DeterministicAiOutputValidationResult<TOutput>;
};

const deterministicRunReceiptProvider = {
  label: DETERMINISTIC_AI_PROVIDER_LABEL,
  external: false,
  model: null,
  tokens: {
    input: 0,
    output: 0,
    total: 0
  },
  costUsd: 0
} as const satisfies DeterministicAiRunReceiptProvider;

const deterministicRunReceiptSafety = {
  deterministic: true,
  externalProvider: false,
  network: false,
  writes: false,
  rag: false,
  secrets: false,
  persistence: false
} as const satisfies DeterministicAiRunReceiptSafety;

export function buildDeterministicAiRunReceipt<TOutput>(
  input: BuildDeterministicAiRunReceiptInput<TOutput>
): DeterministicAiRunReceipt {
  const validation = buildValidationReceipt(input.validation);
  const inputHash = buildSha256Hash(input.input);
  const outputHash = buildSha256Hash(input.output);
  const receiptCore = {
    receiptVersion: DETERMINISTIC_AI_RUN_RECEIPT_VERSION,
    promptId: input.prompt.id,
    promptVersion: input.prompt.version,
    provider: deterministicRunReceiptProvider,
    validation,
    inputHash,
    outputHash,
    safety: deterministicRunReceiptSafety
  } as const;

  return {
    ...receiptCore,
    receiptId: hashDeterministicAiPayload(receiptCore)
  };
}

export function hashDeterministicAiPayload(payload: unknown): string {
  return createHash("sha256").update(stableSerialize(payload)).digest("hex");
}

function buildSha256Hash(payload: unknown): DeterministicAiHash {
  return {
    algorithm: "sha256",
    value: hashDeterministicAiPayload(payload)
  };
}

function buildValidationReceipt<TOutput>(
  validation: DeterministicAiOutputValidationResult<TOutput>
): DeterministicAiRunReceiptValidation {
  return {
    status: validation.ok ? "valid" : "invalid",
    issueCount: validation.issues.length,
    issues: validation.issues
  };
}

function stableSerialize(value: unknown): string {
  if (value === undefined) {
    return JSON.stringify("__undefined__");
  }

  if (value instanceof Date) {
    return JSON.stringify(value.toISOString());
  }

  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableSerialize(entry)).join(",")}]`;
  }

  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, entryValue]) => entryValue !== undefined)
    .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey));

  return `{${entries
    .map(
      ([entryKey, entryValue]) =>
        `${JSON.stringify(entryKey)}:${stableSerialize(entryValue)}`
    )
    .join(",")}}`;
}
