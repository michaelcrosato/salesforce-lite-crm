import {
  listDeterministicAiEvalFixturesForPrompt,
  runDeterministicAiEvalFixture,
  type DeterministicAiEvalFixtureId
} from "@/lib/ai/evalFixtures";
import {
  getDeterministicAiPolicyGuardrail,
  DETERMINISTIC_AI_POLICY_GUARDRAILS_VERSION,
  type DeterministicAiPolicyGuardrail
} from "@/lib/ai/policyGuardrails";
import {
  DETERMINISTIC_AI_PROMPT_IDS,
  getDeterministicAiPrompt,
  listDeterministicAiPrompts,
  type DeterministicAiPromptId,
  type DeterministicAiPromptRegistryEntry,
  type DeterministicAiPromptSchemaRef
} from "@/lib/ai/promptRegistry";
import {
  buildDeterministicAiRunReceipt,
  DETERMINISTIC_AI_RUN_RECEIPT_VERSION,
  type DeterministicAiRunReceipt
} from "@/lib/ai/runReceipts";

export const DETERMINISTIC_AI_GOVERNANCE_REVIEW_PACKET_VERSION =
  "2026-05-25.s36-f3";

export type DeterministicAiGovernanceReviewSafety = {
  readonly deterministic: true;
  readonly readOnly: true;
  readonly externalProvider: false;
  readonly externalProviderClaims: false;
  readonly network: false;
  readonly writes: false;
  readonly persistence: false;
  readonly rag: false;
  readonly toolPlanExecution: false;
  readonly productRouteChanges: false;
};

export type DeterministicAiGovernanceOutputContract = {
  readonly schema: DeterministicAiPromptSchemaRef;
  readonly validation: {
    readonly kind: "zod";
    readonly validatedByEvalFixtures: boolean;
    readonly fixtureCount: number;
    readonly invalidFixtureIds: readonly DeterministicAiEvalFixtureId[];
  };
};

export type DeterministicAiGovernanceEvalFixtureReview = {
  readonly fixtureId: DeterministicAiEvalFixtureId;
  readonly name: string;
  readonly coverage: readonly string[];
  readonly validation: DeterministicAiRunReceipt["validation"];
  readonly receipt: DeterministicAiRunReceipt;
  readonly safety: DeterministicAiGovernanceReviewSafety;
};

export type DeterministicAiGovernanceRouteReview = {
  readonly currentRouteScope: DeterministicAiPromptRegistryEntry["routeScope"];
  readonly productRouteChanges: false;
};

export type DeterministicAiGovernanceReviewPacket = {
  readonly packetVersion: typeof DETERMINISTIC_AI_GOVERNANCE_REVIEW_PACKET_VERSION;
  readonly prompt: DeterministicAiPromptRegistryEntry;
  readonly outputContract: DeterministicAiGovernanceOutputContract;
  readonly evalFixtures: readonly DeterministicAiGovernanceEvalFixtureReview[];
  readonly policy: DeterministicAiPolicyGuardrail;
  readonly routeReview: DeterministicAiGovernanceRouteReview;
  readonly safety: DeterministicAiGovernanceReviewSafety;
};

export type DeterministicAiGovernanceReviewAudit = {
  readonly ok: boolean;
  readonly packetVersion: typeof DETERMINISTIC_AI_GOVERNANCE_REVIEW_PACKET_VERSION;
  readonly registryPromptIds: readonly DeterministicAiPromptId[];
  readonly packetPromptIds: readonly DeterministicAiPromptId[];
  readonly promptsWithoutPackets: readonly DeterministicAiPromptId[];
  readonly promptsWithoutFixtures: readonly DeterministicAiPromptId[];
  readonly promptsWithInvalidFixtures: readonly DeterministicAiPromptId[];
  readonly promptsWithPolicyMismatch: readonly DeterministicAiPromptId[];
  readonly promptsWithExternalProviderClaims: readonly DeterministicAiPromptId[];
  readonly promptsWithRagOrToolPlan: readonly DeterministicAiPromptId[];
  readonly promptsWithRouteChanges: readonly DeterministicAiPromptId[];
  readonly issues: readonly string[];
};

const governanceReviewSafety = {
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
} as const satisfies DeterministicAiGovernanceReviewSafety;

export function buildDeterministicAiGovernanceReviewPacket(
  promptId: DeterministicAiPromptId
): DeterministicAiGovernanceReviewPacket {
  const prompt = getDeterministicAiPrompt(promptId);

  if (!prompt) {
    throw new Error(`Missing deterministic AI prompt ${promptId}.`);
  }

  return buildPacketForPrompt(prompt);
}

export function getDeterministicAiGovernanceReviewPacket(promptId: string) {
  const prompt = getDeterministicAiPrompt(promptId);

  if (!prompt) {
    return null;
  }

  return buildPacketForPrompt(prompt);
}

export function listDeterministicAiGovernanceReviewPackets() {
  return DETERMINISTIC_AI_PROMPT_IDS.map((promptId) =>
    buildDeterministicAiGovernanceReviewPacket(promptId)
  );
}

export function auditDeterministicAiGovernanceReviewPackets(): DeterministicAiGovernanceReviewAudit {
  const packets = listDeterministicAiGovernanceReviewPackets();
  const registryPromptIds = listDeterministicAiPrompts().map(
    (prompt) => prompt.id
  );
  const packetPromptIds = packets.map((packet) => packet.prompt.id);
  const packetPromptIdSet = new Set(packetPromptIds);
  const promptsWithoutPackets = registryPromptIds.filter(
    (promptId) => !packetPromptIdSet.has(promptId)
  );
  const promptsWithoutFixtures = packets
    .filter((packet) => packet.evalFixtures.length === 0)
    .map((packet) => packet.prompt.id);
  const promptsWithInvalidFixtures = packets
    .filter((packet) => packet.outputContract.validation.invalidFixtureIds.length > 0)
    .map((packet) => packet.prompt.id);
  const promptsWithPolicyMismatch = packets
    .filter((packet) => packet.policy.promptVersion !== packet.prompt.version)
    .map((packet) => packet.prompt.id);
  const promptsWithExternalProviderClaims = packets
    .filter(hasExternalProviderClaims)
    .map((packet) => packet.prompt.id);
  const promptsWithRagOrToolPlan = packets
    .filter(hasRagOrToolPlan)
    .map((packet) => packet.prompt.id);
  const promptsWithRouteChanges = packets
    .filter((packet) => packet.routeReview.productRouteChanges)
    .map((packet) => packet.prompt.id);
  const issues = [
    ...promptsWithoutPackets.map(
      (promptId) => `Missing governance packet for ${promptId}.`
    ),
    ...promptsWithoutFixtures.map(
      (promptId) => `No eval fixtures reviewed for ${promptId}.`
    ),
    ...promptsWithInvalidFixtures.map(
      (promptId) => `Invalid eval fixture output for ${promptId}.`
    ),
    ...promptsWithPolicyMismatch.map(
      (promptId) => `Policy prompt version mismatch for ${promptId}.`
    ),
    ...promptsWithExternalProviderClaims.map(
      (promptId) => `External provider claims are not allowed for ${promptId}.`
    ),
    ...promptsWithRagOrToolPlan.map(
      (promptId) => `RAG or tool-plan execution is not allowed for ${promptId}.`
    ),
    ...promptsWithRouteChanges.map(
      (promptId) => `Product route changes are not allowed for ${promptId}.`
    )
  ];

  return {
    ok: issues.length === 0,
    packetVersion: DETERMINISTIC_AI_GOVERNANCE_REVIEW_PACKET_VERSION,
    registryPromptIds,
    packetPromptIds,
    promptsWithoutPackets,
    promptsWithoutFixtures,
    promptsWithInvalidFixtures,
    promptsWithPolicyMismatch,
    promptsWithExternalProviderClaims,
    promptsWithRagOrToolPlan,
    promptsWithRouteChanges,
    issues
  };
}

function buildPacketForPrompt(
  prompt: DeterministicAiPromptRegistryEntry
): DeterministicAiGovernanceReviewPacket {
  const policy = getDeterministicAiPolicyGuardrail(prompt.id);

  if (!policy) {
    throw new Error(`Missing deterministic AI policy for ${prompt.id}.`);
  }

  const evalFixtures = listDeterministicAiEvalFixturesForPrompt(prompt.id).map(
    (fixture) => {
      const run = runDeterministicAiEvalFixture(fixture);
      const receipt = buildDeterministicAiRunReceipt({
        prompt,
        input: fixture.input,
        output: run.output,
        validation: run.validation
      });

      return {
        fixtureId: fixture.id,
        name: fixture.name,
        coverage: fixture.coverage,
        validation: receipt.validation,
        receipt,
        safety: governanceReviewSafety
      };
    }
  );
  const invalidFixtureIds = evalFixtures
    .filter((fixture) => fixture.validation.status !== "valid")
    .map((fixture) => fixture.fixtureId);

  return {
    packetVersion: DETERMINISTIC_AI_GOVERNANCE_REVIEW_PACKET_VERSION,
    prompt,
    outputContract: {
      schema: prompt.outputSchema,
      validation: {
        kind: "zod",
        validatedByEvalFixtures: invalidFixtureIds.length === 0,
        fixtureCount: evalFixtures.length,
        invalidFixtureIds
      }
    },
    evalFixtures,
    policy,
    routeReview: {
      currentRouteScope: prompt.routeScope,
      productRouteChanges: false
    },
    safety: governanceReviewSafety
  };
}

function hasExternalProviderClaims(
  packet: DeterministicAiGovernanceReviewPacket
): boolean {
  return (
    packet.safety.externalProvider ||
    packet.safety.externalProviderClaims ||
    packet.prompt.safety.externalProvider ||
    packet.policy.providerPolicy.externalProvidersAllowed ||
    packet.policy.providerPolicy.providerSecretsAllowed ||
    packet.policy.providerPolicy.networkAllowed ||
    packet.evalFixtures.some((fixture) => fixture.receipt.provider.external)
  );
}

function hasRagOrToolPlan(
  packet: DeterministicAiGovernanceReviewPacket
): boolean {
  return (
    packet.safety.rag ||
    packet.safety.toolPlanExecution ||
    packet.prompt.safety.rag ||
    packet.policy.providerPolicy.disallowedCapabilities.includes(
      "rag_retrieval"
    ) === false ||
    packet.policy.providerPolicy.disallowedCapabilities.includes(
      "write_action"
    ) === false
  );
}

export function getDeterministicAiGovernanceReviewVersions() {
  return {
    packetVersion: DETERMINISTIC_AI_GOVERNANCE_REVIEW_PACKET_VERSION,
    receiptVersion: DETERMINISTIC_AI_RUN_RECEIPT_VERSION,
    policyVersion: DETERMINISTIC_AI_POLICY_GUARDRAILS_VERSION
  };
}
