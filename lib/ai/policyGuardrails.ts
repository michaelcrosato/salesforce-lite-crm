import {
  DETERMINISTIC_AI_PROMPT_IDS,
  listDeterministicAiPrompts,
  type DeterministicAiPromptId,
  type DeterministicAiPromptRegistryEntry
} from "@/lib/ai/promptRegistry";
import { DETERMINISTIC_AI_PROVIDER_LABEL } from "@/lib/ai/runReceipts";

export const DETERMINISTIC_AI_POLICY_GUARDRAILS_VERSION =
  "2026-05-25.s36-f2";

export type DeterministicAiRedactionSensitivity =
  | "crm_free_text"
  | "personal_identifier"
  | "commercial_value"
  | "operational_context"
  | "service_context"
  | "knowledge_content";

export type DeterministicAiRedactionReason =
  | "customer_supplied_text"
  | "contact_identity"
  | "account_identity"
  | "deal_or_quota_value"
  | "routing_or_case_context"
  | "internal_knowledge_content";

export type DeterministicAiRedactionField = {
  readonly path: string;
  readonly label: string;
  readonly sensitivity: DeterministicAiRedactionSensitivity;
  readonly reasons: readonly DeterministicAiRedactionReason[];
  readonly localUseAllowed: true;
  readonly redactionRequiredBeforeExternalUse: true;
};

export type DeterministicAiDisallowedCapability =
  | "external_llm_provider"
  | "embedding_provider"
  | "provider_secret"
  | "network_request"
  | "rag_retrieval"
  | "write_action"
  | "persistence";

export type DeterministicAiProviderPolicy = {
  readonly allowedProviderLabels: readonly [typeof DETERMINISTIC_AI_PROVIDER_LABEL];
  readonly externalProvidersAllowed: false;
  readonly providerSecretsAllowed: false;
  readonly networkAllowed: false;
  readonly disallowedCapabilities: readonly DeterministicAiDisallowedCapability[];
};

export type DeterministicAiCostPolicy = {
  readonly providerLabel: typeof DETERMINISTIC_AI_PROVIDER_LABEL;
  readonly tokenAccounting: {
    readonly input: 0;
    readonly output: 0;
    readonly total: 0;
  };
  readonly costUsd: 0;
  readonly billable: false;
  readonly userQuotaEnforcement: false;
  readonly orgQuotaEnforcement: false;
};

export type DeterministicAiEnforcementPolicy = {
  readonly authRequired: false;
  readonly orgPolicyRequired: false;
  readonly providerPolicyEnforcedBy: "static_local_contract";
};

export type DeterministicAiDataPolicy = {
  readonly localOnly: true;
  readonly persistenceAllowed: false;
  readonly redactionSensitiveFields: readonly DeterministicAiRedactionField[];
};

export type DeterministicAiPolicyGuardrail = {
  readonly promptId: DeterministicAiPromptId;
  readonly promptVersion: DeterministicAiPromptRegistryEntry["version"];
  readonly policyVersion: typeof DETERMINISTIC_AI_POLICY_GUARDRAILS_VERSION;
  readonly dataPolicy: DeterministicAiDataPolicy;
  readonly providerPolicy: DeterministicAiProviderPolicy;
  readonly costPolicy: DeterministicAiCostPolicy;
  readonly enforcement: DeterministicAiEnforcementPolicy;
};

export type DeterministicAiPolicyCoverageReport = {
  readonly ok: boolean;
  readonly registryPromptIds: readonly DeterministicAiPromptId[];
  readonly policyPromptIds: readonly DeterministicAiPromptId[];
  readonly missingPromptIds: readonly DeterministicAiPromptId[];
  readonly stalePolicyPromptIds: readonly DeterministicAiPromptId[];
  readonly promptsWithoutRedactionFields: readonly DeterministicAiPromptId[];
  readonly promptsWithProviderExpansion: readonly DeterministicAiPromptId[];
  readonly promptsWithCostExpansion: readonly DeterministicAiPromptId[];
  readonly issues: readonly string[];
};

const localProviderPolicy = {
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
} as const satisfies DeterministicAiProviderPolicy;

const zeroCostPolicy = {
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
} as const satisfies DeterministicAiCostPolicy;

const staticLocalEnforcement = {
  authRequired: false,
  orgPolicyRequired: false,
  providerPolicyEnforcedBy: "static_local_contract"
} as const satisfies DeterministicAiEnforcementPolicy;

export const DETERMINISTIC_AI_POLICY_GUARDRAILS = [
  {
    promptId: "activity.note-summary",
    promptVersion: "v1",
    policyVersion: DETERMINISTIC_AI_POLICY_GUARDRAILS_VERSION,
    dataPolicy: {
      localOnly: true,
      persistenceAllowed: false,
      redactionSensitiveFields: [
        {
          path: "rawText",
          label: "Contact note free text",
          sensitivity: "crm_free_text",
          reasons: ["customer_supplied_text"],
          localUseAllowed: true,
          redactionRequiredBeforeExternalUse: true
        }
      ]
    },
    providerPolicy: localProviderPolicy,
    costPolicy: zeroCostPolicy,
    enforcement: staticLocalEnforcement
  },
  {
    promptId: "dashboard.analyst-actions",
    promptVersion: "v1",
    policyVersion: DETERMINISTIC_AI_POLICY_GUARDRAILS_VERSION,
    dataPolicy: {
      localOnly: true,
      persistenceAllowed: false,
      redactionSensitiveFields: [
        {
          path: "orders[].name",
          label: "Dealer order name",
          sensitivity: "operational_context",
          reasons: ["routing_or_case_context"],
          localUseAllowed: true,
          redactionRequiredBeforeExternalUse: true
        },
        {
          path: "orders[].account.name",
          label: "Account name",
          sensitivity: "personal_identifier",
          reasons: ["account_identity"],
          localUseAllowed: true,
          redactionRequiredBeforeExternalUse: true
        },
        {
          path: "orders[].monthlyQuota",
          label: "Dealer order quota",
          sensitivity: "commercial_value",
          reasons: ["deal_or_quota_value"],
          localUseAllowed: true,
          redactionRequiredBeforeExternalUse: true
        },
        {
          path: "leads[].firstName",
          label: "Lead first name",
          sensitivity: "personal_identifier",
          reasons: ["contact_identity"],
          localUseAllowed: true,
          redactionRequiredBeforeExternalUse: true
        },
        {
          path: "leads[].lastName",
          label: "Lead last name",
          sensitivity: "personal_identifier",
          reasons: ["contact_identity"],
          localUseAllowed: true,
          redactionRequiredBeforeExternalUse: true
        },
        {
          path: "deals[].name",
          label: "Opportunity name",
          sensitivity: "commercial_value",
          reasons: ["deal_or_quota_value"],
          localUseAllowed: true,
          redactionRequiredBeforeExternalUse: true
        },
        {
          path: "deals[].value",
          label: "Opportunity value",
          sensitivity: "commercial_value",
          reasons: ["deal_or_quota_value"],
          localUseAllowed: true,
          redactionRequiredBeforeExternalUse: true
        },
        {
          path: "deals[].accountName",
          label: "Opportunity account name",
          sensitivity: "personal_identifier",
          reasons: ["account_identity"],
          localUseAllowed: true,
          redactionRequiredBeforeExternalUse: true
        }
      ]
    },
    providerPolicy: localProviderPolicy,
    costPolicy: zeroCostPolicy,
    enforcement: staticLocalEnforcement
  },
  {
    promptId: "case.knowledge-suggestions",
    promptVersion: "v1",
    policyVersion: DETERMINISTIC_AI_POLICY_GUARDRAILS_VERSION,
    dataPolicy: {
      localOnly: true,
      persistenceAllowed: false,
      redactionSensitiveFields: [
        {
          path: "crmCase.subject",
          label: "Case subject",
          sensitivity: "service_context",
          reasons: ["routing_or_case_context", "customer_supplied_text"],
          localUseAllowed: true,
          redactionRequiredBeforeExternalUse: true
        },
        {
          path: "crmCase.description",
          label: "Case description",
          sensitivity: "crm_free_text",
          reasons: ["customer_supplied_text", "routing_or_case_context"],
          localUseAllowed: true,
          redactionRequiredBeforeExternalUse: true
        },
        {
          path: "crmCase.queueKey",
          label: "Case queue key",
          sensitivity: "service_context",
          reasons: ["routing_or_case_context"],
          localUseAllowed: true,
          redactionRequiredBeforeExternalUse: true
        },
        {
          path: "articles[].title",
          label: "Knowledge article title",
          sensitivity: "knowledge_content",
          reasons: ["internal_knowledge_content"],
          localUseAllowed: true,
          redactionRequiredBeforeExternalUse: true
        },
        {
          path: "articles[].summary",
          label: "Knowledge article summary",
          sensitivity: "knowledge_content",
          reasons: ["internal_knowledge_content"],
          localUseAllowed: true,
          redactionRequiredBeforeExternalUse: true
        },
        {
          path: "articles[].body",
          label: "Knowledge article body",
          sensitivity: "knowledge_content",
          reasons: ["internal_knowledge_content"],
          localUseAllowed: true,
          redactionRequiredBeforeExternalUse: true
        },
        {
          path: "articles[].keywords",
          label: "Knowledge article keywords",
          sensitivity: "knowledge_content",
          reasons: ["internal_knowledge_content"],
          localUseAllowed: true,
          redactionRequiredBeforeExternalUse: true
        }
      ]
    },
    providerPolicy: localProviderPolicy,
    costPolicy: zeroCostPolicy,
    enforcement: staticLocalEnforcement
  }
] as const satisfies readonly DeterministicAiPolicyGuardrail[];

export function listDeterministicAiPolicyGuardrails() {
  return DETERMINISTIC_AI_POLICY_GUARDRAILS;
}

export function getDeterministicAiPolicyGuardrail(promptId: string) {
  return (
    DETERMINISTIC_AI_POLICY_GUARDRAILS.find(
      (guardrail) => guardrail.promptId === promptId
    ) ?? null
  );
}

export function listDeterministicAiRedactionFields(
  promptId: DeterministicAiPromptId
) {
  return (
    getDeterministicAiPolicyGuardrail(promptId)?.dataPolicy
      .redactionSensitiveFields ?? []
  );
}

export function auditDeterministicAiPolicyCoverage(): DeterministicAiPolicyCoverageReport {
  const guardrails: readonly DeterministicAiPolicyGuardrail[] =
    DETERMINISTIC_AI_POLICY_GUARDRAILS;
  const registryPromptIds = listDeterministicAiPrompts().map(
    (prompt) => prompt.id
  );
  const policyPromptIds = guardrails.map((guardrail) => guardrail.promptId);
  const registryPromptIdSet = new Set(registryPromptIds);
  const policyPromptIdSet = new Set(policyPromptIds);
  const missingPromptIds = registryPromptIds.filter(
    (promptId) => !policyPromptIdSet.has(promptId)
  );
  const stalePolicyPromptIds = policyPromptIds.filter(
    (promptId) => !registryPromptIdSet.has(promptId)
  );
  const promptsWithoutRedactionFields = guardrails.filter(
    (guardrail) => guardrail.dataPolicy.redactionSensitiveFields.length === 0
  ).map((guardrail) => guardrail.promptId);
  const promptsWithProviderExpansion = guardrails
    .filter(hasProviderExpansion)
    .map((guardrail) => guardrail.promptId);
  const promptsWithCostExpansion = guardrails
    .filter(hasCostExpansion)
    .map((guardrail) => guardrail.promptId);
  const issues = [
    ...missingPromptIds.map((promptId) => `Missing policy for ${promptId}.`),
    ...stalePolicyPromptIds.map((promptId) => `Stale policy for ${promptId}.`),
    ...promptsWithoutRedactionFields.map(
      (promptId) => `No redaction-sensitive fields for ${promptId}.`
    ),
    ...promptsWithProviderExpansion.map(
      (promptId) => `Provider expansion is not allowed for ${promptId}.`
    ),
    ...promptsWithCostExpansion.map(
      (promptId) => `Cost expansion is not allowed for ${promptId}.`
    )
  ];

  return {
    ok: issues.length === 0,
    registryPromptIds,
    policyPromptIds,
    missingPromptIds,
    stalePolicyPromptIds,
    promptsWithoutRedactionFields,
    promptsWithProviderExpansion,
    promptsWithCostExpansion,
    issues
  };
}

function hasProviderExpansion(
  guardrail: DeterministicAiPolicyGuardrail
): boolean {
  return (
    guardrail.providerPolicy.externalProvidersAllowed ||
    guardrail.providerPolicy.providerSecretsAllowed ||
    guardrail.providerPolicy.networkAllowed ||
    guardrail.providerPolicy.allowedProviderLabels.length !== 1 ||
    guardrail.providerPolicy.allowedProviderLabels[0] !==
      DETERMINISTIC_AI_PROVIDER_LABEL
  );
}

function hasCostExpansion(guardrail: DeterministicAiPolicyGuardrail): boolean {
  return (
    guardrail.costPolicy.tokenAccounting.input !== 0 ||
    guardrail.costPolicy.tokenAccounting.output !== 0 ||
    guardrail.costPolicy.tokenAccounting.total !== 0 ||
    guardrail.costPolicy.costUsd !== 0 ||
    guardrail.costPolicy.billable ||
    guardrail.costPolicy.userQuotaEnforcement ||
    guardrail.costPolicy.orgQuotaEnforcement
  );
}

export function listDeterministicAiPolicyPromptIds() {
  return DETERMINISTIC_AI_PROMPT_IDS;
}
