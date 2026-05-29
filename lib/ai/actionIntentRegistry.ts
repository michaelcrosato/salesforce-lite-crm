import { z } from "zod/v4";
import { ROUTE_REGISTRY } from "@/lib/crm/registry";

export const AI_ACTION_INTENT_CONTENT_TYPE =
  "application/json; charset=utf-8" as const;

export const AI_ACTION_INTENT_REGISTRY_VERSION = "2026-05-26.s45-f1" as const;

export const AI_ACTION_INTENT_SUPPORTED_IDS = [
  "task.create",
  "activity.note.create",
  "opportunity.stage.update",
  "lead.status.update",
  "case.status.update",
  "campaign.status.update"
] as const;

export const AI_ACTION_INTENT_DEFERRED_IDS = [
  "email.draft",
  "email.send",
  "lead.routing.assign",
  "dealer-order.create-or-edit",
  "area.create-or-edit",
  "external-provider.request",
  "calendar.sync",
  "salesforce.sync"
] as const;

export const AI_ACTION_INTENT_IDS = [
  ...AI_ACTION_INTENT_SUPPORTED_IDS,
  ...AI_ACTION_INTENT_DEFERRED_IDS
] as const;

export const AI_ACTION_INTENT_FORBIDDEN_CAPABILITIES = [
  "external_ai_provider",
  "provider_credentials",
  "network_request",
  "rag_retrieval",
  "silent_write",
  "autonomous_execution",
  "action_execution",
  "database_write",
  "route_handler",
  "product_ui",
  "routing_execution",
  "dealer_order_area_crud",
  "global_search_expansion",
  "deal_detail_route",
  "background_job"
] as const;

export type AiActionIntentSupportedId =
  (typeof AI_ACTION_INTENT_SUPPORTED_IDS)[number];

export type AiActionIntentDeferredId =
  (typeof AI_ACTION_INTENT_DEFERRED_IDS)[number];

export type AiActionIntentId = (typeof AI_ACTION_INTENT_IDS)[number];

export type AiActionIntentStatus = "supported" | "deferred";

export type AiActionIntentSchemaKind = "typescript" | "zod";

export type AiActionIntentSchemaRef = {
  readonly kind: AiActionIntentSchemaKind;
  readonly module: string;
  readonly exportName: string;
};

export type AiActionCrmObject =
  | "Account"
  | "Activity"
  | "Area"
  | "Campaign"
  | "Case"
  | "Contact"
  | "DealerOrder"
  | "ExternalProvider"
  | "Lead"
  | "Opportunity"
  | "Salesforce"
  | "Task";

export type AiActionIntentObjectScope = {
  readonly object: AiActionCrmObject;
  readonly modelName: string | null;
  readonly route: string | null;
  readonly detailRoute: string | null;
  readonly operation: "create" | "draft" | "request" | "send" | "sync" | "update";
};

export type AiActionIntentApproval = {
  readonly required: true;
  readonly mode: "explicit_operator_approval";
  readonly actorRequired: true;
  readonly identityRequiredBeforeExecution: true;
  readonly approvalPersistence: false;
  readonly reason: string;
};

export type AiActionIntentAuditExpectation = {
  readonly category: "ai_action";
  readonly reviewEventAction: "ai_action_review";
  readonly executionEventAction: "ai_action_execute";
  readonly reviewRequired: true;
  readonly executionAuditRequired: true;
  readonly auditRecorderPath:
    | "lib/services/auditEvents.ts#recordAuditEvent"
    | null;
  readonly wouldWriteNow: false;
};

export type AiActionIntentReadFlags = {
  readonly metadata: true;
  readonly database: false;
  readonly crmRecords: false;
  readonly promptOutputs: false;
  readonly runtimeEvaluation: false;
};

export type AiActionIntentWriteFlags = {
  readonly database: false;
  readonly crmRecords: false;
  readonly auditEvents: false;
  readonly tasks: false;
  readonly activities: false;
  readonly opportunities: false;
  readonly leads: false;
  readonly cases: false;
  readonly campaigns: false;
  readonly routes: false;
  readonly routeHandlers: false;
  readonly productUi: false;
  readonly files: false;
  readonly externalServices: false;
  readonly backgroundJobs: false;
  readonly actionExecution: false;
  readonly approvals: false;
};

export type AiActionIntentSafety = {
  readonly deterministic: true;
  readonly metadataOnly: true;
  readonly readOnly: true;
  readonly proposalOnly: true;
  readonly currentExecutionAllowed: false;
  readonly externalProvider: false;
  readonly network: false;
  readonly rag: false;
  readonly routeChanges: false;
  readonly productUi: false;
  readonly routingExecution: false;
  readonly dealerOrderAreaCrud: false;
  readonly backgroundJobs: false;
};

export type AiActionIntentDeferral = {
  readonly requiresPlanPromotion: true;
  readonly requiresContractPromotion: true;
  readonly reasons: readonly AiActionIntentDeferralReason[];
  readonly safeNextStep: string;
};

export type AiActionIntentDeferralReason =
  | "area_crud_excluded"
  | "calendar_sync_excluded"
  | "dealer_order_crud_excluded"
  | "email_provider_excluded"
  | "external_ai_provider_excluded"
  | "external_integration_excluded"
  | "routing_execution_excluded"
  | "salesforce_integration_excluded";

export type AiActionForbiddenCapability =
  (typeof AI_ACTION_INTENT_FORBIDDEN_CAPABILITIES)[number];

export type AiActionIntentRegistryEntry = {
  readonly id: AiActionIntentId;
  readonly status: AiActionIntentStatus;
  readonly label: string;
  readonly description: string;
  readonly mode: "proposal_only";
  readonly crmObjectScope: readonly AiActionIntentObjectScope[];
  readonly inputSchema: AiActionIntentSchemaRef;
  readonly outputSchema: AiActionIntentSchemaRef;
  readonly approval: AiActionIntentApproval;
  readonly audit: AiActionIntentAuditExpectation;
  readonly read: AiActionIntentReadFlags;
  readonly write: AiActionIntentWriteFlags;
  readonly safety: AiActionIntentSafety;
  readonly forbiddenCapabilities: readonly AiActionForbiddenCapability[];
  readonly deferral: AiActionIntentDeferral | null;
};

export type AiActionIntentRegistry = {
  readonly contentType: typeof AI_ACTION_INTENT_CONTENT_TYPE;
  readonly registryType: "ai-action-intent-registry";
  readonly registryVersion: typeof AI_ACTION_INTENT_REGISTRY_VERSION;
  readonly supportedIntentCount: number;
  readonly deferredIntentCount: number;
  readonly intentCount: number;
  readonly supportedIntentIds: readonly AiActionIntentSupportedId[];
  readonly deferredIntentIds: readonly AiActionIntentDeferredId[];
  readonly intents: readonly AiActionIntentRegistryEntry[];
  readonly source: {
    readonly module: "lib/ai/actionIntentRegistry.ts";
    readonly registryScope: "preview-only-ai-action-safety-contracts";
    readonly routeScope: readonly string[];
  };
  readonly read: AiActionIntentReadFlags;
  readonly write: AiActionIntentWriteFlags;
  readonly safety: AiActionIntentSafety;
  readonly forbiddenCapabilities: readonly AiActionForbiddenCapability[];
};

export type AiActionIntentRegistryAudit = {
  readonly ok: boolean;
  readonly registryVersion: typeof AI_ACTION_INTENT_REGISTRY_VERSION;
  readonly supportedIntentIds: readonly AiActionIntentSupportedId[];
  readonly deferredIntentIds: readonly AiActionIntentDeferredId[];
  readonly registryIntentIds: readonly AiActionIntentId[];
  readonly duplicateIntentIds: readonly AiActionIntentId[];
  readonly missingSupportedIntentIds: readonly AiActionIntentSupportedId[];
  readonly missingDeferredIntentIds: readonly AiActionIntentDeferredId[];
  readonly supportedIntentIdsWithoutApproval: readonly AiActionIntentId[];
  readonly supportedIntentIdsWithoutAuditPath: readonly AiActionIntentId[];
  readonly intentsMissingForbiddenCapabilities: readonly AiActionIntentId[];
  readonly intentsWithExecutionEnabled: readonly AiActionIntentId[];
  readonly intentsWithWritesEnabled: readonly AiActionIntentId[];
  readonly intentsWithExcludedRoutes: readonly AiActionIntentId[];
  readonly issues: readonly string[];
};

export const aiActionIntentIdSchema = z.enum(AI_ACTION_INTENT_IDS);

export const aiActionIntentProposalTargetSchema = z
  .object({
    entity: z.string().trim().min(1),
    recordId: z.string().trim().min(1).optional(),
    route: z.string().trim().min(1).optional()
  })
  .strict();

export const aiActionIntentProposalProvenanceSchema = z
  .object({
    kind: z.enum(["activity", "prompt", "record", "report"]),
    ref: z.string().trim().min(1)
  })
  .strict();

export const aiActionIntentProposalSchema = z
  .object({
    intentId: aiActionIntentIdSchema,
    target: aiActionIntentProposalTargetSchema,
    payload: z.record(z.string(), z.unknown()).default({}),
    rationale: z.string().trim().min(1),
    provenance: z.array(aiActionIntentProposalProvenanceSchema).default([])
  })
  .strict();

export const aiActionIntentReviewResultSchema = z
  .object({
    intentId: aiActionIntentIdSchema,
    status: z.enum(["ready_for_review", "deferred", "blocked"]),
    approvalRequired: z.literal(true),
    auditRequiredBeforeExecution: z.boolean(),
    currentExecutionAllowed: z.literal(false),
    wouldWriteNow: z.literal(false),
    issues: z.array(z.string())
  })
  .strict();

const registryInputSchema = z.object({}).strict();
const supportedIntentIdSet: ReadonlySet<string> = new Set(
  AI_ACTION_INTENT_SUPPORTED_IDS
);

const commonOutputSchema = {
  kind: "zod",
  module: "lib/ai/actionIntentRegistry.ts",
  exportName: "aiActionIntentReviewResultSchema"
} as const satisfies AiActionIntentSchemaRef;

const proposalSchema = {
  kind: "zod",
  module: "lib/ai/actionIntentRegistry.ts",
  exportName: "aiActionIntentProposalSchema"
} as const satisfies AiActionIntentSchemaRef;

const supportedIntentSeeds = [
  {
    id: "task.create",
    label: "Create task",
    description:
      "Describe a task creation proposal for explicit operator review; no task is created by the registry.",
    crmObjectScope: [
      scope("Task", "Task", ROUTE_REGISTRY.tasks, null, "create")
    ],
    inputSchema: schema("zod", "lib/validation.ts", "taskCreateSchema")
  },
  {
    id: "activity.note.create",
    label: "Log note activity",
    description:
      "Describe a note activity proposal tied to an existing CRM record; no activity is created by the registry.",
    crmObjectScope: [
      scope("Activity", "Activity", ROUTE_REGISTRY.notes, null, "create")
    ],
    inputSchema: schema("zod", "lib/validation.ts", "noteCreateSchema")
  },
  {
    id: "opportunity.stage.update",
    label: "Update opportunity stage",
    description:
      "Describe an opportunity stage-change proposal using the current Deal stage contract.",
    crmObjectScope: [
      scope(
        "Opportunity",
        "Deal",
        ROUTE_REGISTRY.opportunities,
        "/deals?deal=<id>",
        "update"
      )
    ],
    inputSchema: schema("zod", "lib/validation.ts", "dealMoveSchema")
  },
  {
    id: "lead.status.update",
    label: "Update lead status",
    description:
      "Describe a consumer lead status-change proposal without routing reassignment.",
    crmObjectScope: [
      scope("Lead", "Lead", ROUTE_REGISTRY.leads, "/leads/<id>", "update")
    ],
    inputSchema: schema("zod", "lib/validation.ts", "leadStatusUpdateSchema")
  },
  {
    id: "case.status.update",
    label: "Update case status",
    description:
      "Describe a case status-change proposal using the current service case contract.",
    crmObjectScope: [
      scope("Case", "Case", ROUTE_REGISTRY.cases, "/cases?case=<id>", "update")
    ],
    inputSchema: schema("zod", "lib/validation.ts", "caseUpdateSchema")
  },
  {
    id: "campaign.status.update",
    label: "Update campaign status",
    description:
      "Describe a campaign status-change proposal using the current campaign contract.",
    crmObjectScope: [
      scope(
        "Campaign",
        "Campaign",
        ROUTE_REGISTRY.campaigns,
        "/campaigns?campaign=<id>",
        "update"
      )
    ],
    inputSchema: schema("zod", "lib/validation.ts", "campaignUpdateSchema")
  }
] as const satisfies readonly SupportedIntentSeed[];

const deferredIntentSeeds = [
  {
    id: "email.draft",
    label: "Draft email",
    description:
      "Deferred until an email drafting surface and provider-safe data policy are promoted.",
    crmObjectScope: [
      scope("Contact", "Contact", ROUTE_REGISTRY.contacts, "/contacts/<id>", "draft"),
      scope("Lead", "Lead", ROUTE_REGISTRY.leads, "/leads/<id>", "draft"),
      scope("Case", "Case", ROUTE_REGISTRY.cases, "/cases?case=<id>", "draft")
    ],
    reasons: ["email_provider_excluded"],
    safeNextStep:
      "Promote an email-draft contract before registering reviewable email intents."
  },
  {
    id: "email.send",
    label: "Send email",
    description:
      "Deferred because transactional email providers and message sending are outside the current contract.",
    crmObjectScope: [
      scope("Contact", "Contact", ROUTE_REGISTRY.contacts, "/contacts/<id>", "send"),
      scope("Lead", "Lead", ROUTE_REGISTRY.leads, "/leads/<id>", "send")
    ],
    reasons: ["email_provider_excluded", "external_integration_excluded"],
    safeNextStep:
      "Promote a transactional email provider, approval, and audit contract before send intents."
  },
  {
    id: "lead.routing.assign",
    label: "Assign lead by routing",
    description:
      "Deferred because AI action intents must not execute or re-run dealer routing.",
    crmObjectScope: [
      scope("Lead", "Lead", ROUTE_REGISTRY.leads, "/leads/<id>", "update"),
      scope(
        "DealerOrder",
        "DealerOrder",
        ROUTE_REGISTRY.dealerOrders,
        "/orders/<id>",
        "update"
      ),
      scope("Area", "Area", ROUTE_REGISTRY.areas, null, "update")
    ],
    reasons: ["routing_execution_excluded"],
    safeNextStep:
      "Promote routing simulation or reassignment scope before AI routing intents."
  },
  {
    id: "dealer-order.create-or-edit",
    label: "Create or edit dealer order",
    description:
      "Deferred because dealer orders remain seeded and browsable only.",
    crmObjectScope: [
      scope(
        "DealerOrder",
        "DealerOrder",
        ROUTE_REGISTRY.dealerOrders,
        "/orders/<id>",
        "update"
      )
    ],
    reasons: ["dealer_order_crud_excluded"],
    safeNextStep:
      "Promote dealer-order CRUD before registering dealer-order AI action intents."
  },
  {
    id: "area.create-or-edit",
    label: "Create or edit routing area",
    description:
      "Deferred because routing areas remain seeded and browsable only.",
    crmObjectScope: [
      scope("Area", "Area", ROUTE_REGISTRY.areas, null, "update")
    ],
    reasons: ["area_crud_excluded"],
    safeNextStep:
      "Promote area CRUD and overlap validation before registering area AI action intents."
  },
  {
    id: "external-provider.request",
    label: "Call external AI provider",
    description:
      "Deferred because live AI providers, credentials, and network calls are outside the current contract.",
    crmObjectScope: [
      scope("ExternalProvider", null, null, null, "request")
    ],
    reasons: ["external_ai_provider_excluded"],
    safeNextStep:
      "Promote a deterministic/recorded provider port before any live provider request."
  },
  {
    id: "calendar.sync",
    label: "Sync calendar",
    description:
      "Deferred because calendar sync and provider credentials are outside the current contract.",
    crmObjectScope: [
      scope("ExternalProvider", null, null, null, "sync")
    ],
    reasons: ["calendar_sync_excluded", "external_integration_excluded"],
    safeNextStep:
      "Promote calendar integration and credential handling before calendar sync intents."
  },
  {
    id: "salesforce.sync",
    label: "Sync Salesforce",
    description:
      "Deferred because Salesforce integration is outside the current contract.",
    crmObjectScope: [
      scope("Salesforce", null, null, null, "sync")
    ],
    reasons: ["salesforce_integration_excluded"],
    safeNextStep:
      "Promote Salesforce import or sync scope before registering Salesforce AI action intents."
  }
] as const satisfies readonly DeferredIntentSeed[];

export const AI_ACTION_INTENT_REGISTRY = [
  ...supportedIntentSeeds.map(buildSupportedEntry),
  ...deferredIntentSeeds.map(buildDeferredEntry)
] as const satisfies readonly AiActionIntentRegistryEntry[];

type SupportedIntentSeed = {
  readonly id: AiActionIntentSupportedId;
  readonly label: string;
  readonly description: string;
  readonly crmObjectScope: readonly AiActionIntentObjectScope[];
  readonly inputSchema: AiActionIntentSchemaRef;
};

type DeferredIntentSeed = {
  readonly id: AiActionIntentDeferredId;
  readonly label: string;
  readonly description: string;
  readonly crmObjectScope: readonly AiActionIntentObjectScope[];
  readonly reasons: readonly AiActionIntentDeferralReason[];
  readonly safeNextStep: string;
};

function schema(
  kind: AiActionIntentSchemaKind,
  module: string,
  exportName: string
): AiActionIntentSchemaRef {
  return {
    kind,
    module,
    exportName
  };
}

function scope(
  object: AiActionCrmObject,
  modelName: string | null,
  route: string | null,
  detailRoute: string | null,
  operation: AiActionIntentObjectScope["operation"]
): AiActionIntentObjectScope {
  return {
    object,
    modelName,
    route,
    detailRoute,
    operation
  };
}

function buildSupportedEntry(
  seed: SupportedIntentSeed
): AiActionIntentRegistryEntry {
  return {
    id: seed.id,
    status: "supported",
    label: seed.label,
    description: seed.description,
    mode: "proposal_only",
    crmObjectScope: seed.crmObjectScope.map(copyScope),
    inputSchema: seed.inputSchema,
    outputSchema: commonOutputSchema,
    approval: approval(
      "Supported AI action intents still require explicit operator review before any future execution."
    ),
    audit: auditExpectation("lib/services/auditEvents.ts#recordAuditEvent"),
    read: readFlags(),
    write: noWrites(),
    safety: safetyFlags(),
    forbiddenCapabilities: [...AI_ACTION_INTENT_FORBIDDEN_CAPABILITIES],
    deferral: null
  };
}

function buildDeferredEntry(
  seed: DeferredIntentSeed
): AiActionIntentRegistryEntry {
  return {
    id: seed.id,
    status: "deferred",
    label: seed.label,
    description: seed.description,
    mode: "proposal_only",
    crmObjectScope: seed.crmObjectScope.map(copyScope),
    inputSchema: proposalSchema,
    outputSchema: commonOutputSchema,
    approval: approval(
      "Deferred AI action intents require contract promotion before operator approval can authorize execution."
    ),
    audit: auditExpectation(null),
    read: readFlags(),
    write: noWrites(),
    safety: safetyFlags(),
    forbiddenCapabilities: [...AI_ACTION_INTENT_FORBIDDEN_CAPABILITIES],
    deferral: {
      requiresPlanPromotion: true,
      requiresContractPromotion: true,
      reasons: [...seed.reasons],
      safeNextStep: seed.safeNextStep
    }
  };
}

function approval(reason: string): AiActionIntentApproval {
  return {
    required: true,
    mode: "explicit_operator_approval",
    actorRequired: true,
    identityRequiredBeforeExecution: true,
    approvalPersistence: false,
    reason
  };
}

function auditExpectation(
  auditRecorderPath: AiActionIntentAuditExpectation["auditRecorderPath"]
): AiActionIntentAuditExpectation {
  return {
    category: "ai_action",
    reviewEventAction: "ai_action_review",
    executionEventAction: "ai_action_execute",
    reviewRequired: true,
    executionAuditRequired: true,
    auditRecorderPath,
    wouldWriteNow: false
  };
}

function readFlags(): AiActionIntentReadFlags {
  return {
    metadata: true,
    database: false,
    crmRecords: false,
    promptOutputs: false,
    runtimeEvaluation: false
  };
}

function noWrites(): AiActionIntentWriteFlags {
  return {
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
}

function safetyFlags(): AiActionIntentSafety {
  return {
    deterministic: true,
    metadataOnly: true,
    readOnly: true,
    proposalOnly: true,
    currentExecutionAllowed: false,
    externalProvider: false,
    network: false,
    rag: false,
    routeChanges: false,
    productUi: false,
    routingExecution: false,
    dealerOrderAreaCrud: false,
    backgroundJobs: false
  };
}

function copyScope(
  scopeEntry: AiActionIntentObjectScope
): AiActionIntentObjectScope {
  return {
    object: scopeEntry.object,
    modelName: scopeEntry.modelName,
    route: scopeEntry.route,
    detailRoute: scopeEntry.detailRoute,
    operation: scopeEntry.operation
  };
}

export function isAiActionIntentId(value: string): value is AiActionIntentId {
  return AI_ACTION_INTENT_IDS.includes(value as AiActionIntentId);
}

export function isSupportedAiActionIntentId(
  value: string
): value is AiActionIntentSupportedId {
  return supportedIntentIdSet.has(value);
}

export function listAiActionIntents(): AiActionIntentRegistryEntry[] {
  return [...AI_ACTION_INTENT_REGISTRY];
}

export function listSupportedAiActionIntents(): AiActionIntentRegistryEntry[] {
  return AI_ACTION_INTENT_REGISTRY.filter(
    (entry) => entry.status === "supported"
  );
}

export function listDeferredAiActionIntents(): AiActionIntentRegistryEntry[] {
  return AI_ACTION_INTENT_REGISTRY.filter(
    (entry) => entry.status === "deferred"
  );
}

export function getAiActionIntent(id: string): AiActionIntentRegistryEntry | null {
  return AI_ACTION_INTENT_REGISTRY.find((entry) => entry.id === id) ?? null;
}

export function listAiActionIntentsByObject(
  object: AiActionCrmObject
): AiActionIntentRegistryEntry[] {
  return AI_ACTION_INTENT_REGISTRY.filter((entry) =>
    entry.crmObjectScope.some((scopeEntry) => scopeEntry.object === object)
  );
}

export function getAiActionIntentRegistry(
  input: unknown = {}
): AiActionIntentRegistry {
  registryInputSchema.parse(input);

  const intents = listAiActionIntents();
  const routeScope = uniqueRoutes(
    intents.flatMap((intent) =>
      intent.crmObjectScope.flatMap((scopeEntry) => [
        scopeEntry.route,
        scopeEntry.detailRoute
      ])
    )
  );

  return {
    contentType: AI_ACTION_INTENT_CONTENT_TYPE,
    registryType: "ai-action-intent-registry",
    registryVersion: AI_ACTION_INTENT_REGISTRY_VERSION,
    supportedIntentCount: AI_ACTION_INTENT_SUPPORTED_IDS.length,
    deferredIntentCount: AI_ACTION_INTENT_DEFERRED_IDS.length,
    intentCount: intents.length,
    supportedIntentIds: [...AI_ACTION_INTENT_SUPPORTED_IDS],
    deferredIntentIds: [...AI_ACTION_INTENT_DEFERRED_IDS],
    intents,
    source: {
      module: "lib/ai/actionIntentRegistry.ts",
      registryScope: "preview-only-ai-action-safety-contracts",
      routeScope
    },
    read: readFlags(),
    write: noWrites(),
    safety: safetyFlags(),
    forbiddenCapabilities: [...AI_ACTION_INTENT_FORBIDDEN_CAPABILITIES]
  };
}

export function auditAiActionIntentRegistry(): AiActionIntentRegistryAudit {
  const registry = getAiActionIntentRegistry();
  const registryIntentIds = registry.intents.map((entry) => entry.id);
  const duplicateIntentIds = duplicateIds(registryIntentIds);
  const missingSupportedIntentIds = AI_ACTION_INTENT_SUPPORTED_IDS.filter(
    (id) => !registryIntentIds.includes(id)
  );
  const missingDeferredIntentIds = AI_ACTION_INTENT_DEFERRED_IDS.filter(
    (id) => !registryIntentIds.includes(id)
  );
  const supportedEntries = registry.intents.filter(
    (entry) => entry.status === "supported"
  );
  const supportedIntentIdsWithoutApproval = supportedEntries
    .filter((entry) => !entry.approval.required)
    .map((entry) => entry.id);
  const supportedIntentIdsWithoutAuditPath = supportedEntries
    .filter((entry) => entry.audit.auditRecorderPath === null)
    .map((entry) => entry.id);
  const intentsMissingForbiddenCapabilities = registry.intents
    .filter((entry) => !hasAllForbiddenCapabilities(entry))
    .map((entry) => entry.id);
  const intentsWithExecutionEnabled = registry.intents
    .filter((entry) => entry.safety.currentExecutionAllowed)
    .map((entry) => entry.id);
  const intentsWithWritesEnabled = registry.intents
    .filter((entry) => hasWritesEnabled(entry.write))
    .map((entry) => entry.id);
  const intentsWithExcludedRoutes = registry.intents
    .filter((entry) => entry.crmObjectScope.some(hasExcludedRoute))
    .map((entry) => entry.id);
  const issues = [
    ...duplicateIntentIds.map((id) => `Duplicate AI action intent ${id}.`),
    ...missingSupportedIntentIds.map(
      (id) => `Missing supported AI action intent ${id}.`
    ),
    ...missingDeferredIntentIds.map(
      (id) => `Missing deferred AI action intent ${id}.`
    ),
    ...supportedIntentIdsWithoutApproval.map(
      (id) => `Supported AI action intent ${id} does not require approval.`
    ),
    ...supportedIntentIdsWithoutAuditPath.map(
      (id) => `Supported AI action intent ${id} has no future audit path.`
    ),
    ...intentsMissingForbiddenCapabilities.map(
      (id) => `AI action intent ${id} is missing forbidden capabilities.`
    ),
    ...intentsWithExecutionEnabled.map(
      (id) => `AI action intent ${id} enables current execution.`
    ),
    ...intentsWithWritesEnabled.map(
      (id) => `AI action intent ${id} enables writes.`
    ),
    ...intentsWithExcludedRoutes.map(
      (id) => `AI action intent ${id} references an excluded route.`
    )
  ];

  return {
    ok: issues.length === 0,
    registryVersion: AI_ACTION_INTENT_REGISTRY_VERSION,
    supportedIntentIds: [...AI_ACTION_INTENT_SUPPORTED_IDS],
    deferredIntentIds: [...AI_ACTION_INTENT_DEFERRED_IDS],
    registryIntentIds,
    duplicateIntentIds,
    missingSupportedIntentIds,
    missingDeferredIntentIds,
    supportedIntentIdsWithoutApproval,
    supportedIntentIdsWithoutAuditPath,
    intentsMissingForbiddenCapabilities,
    intentsWithExecutionEnabled,
    intentsWithWritesEnabled,
    intentsWithExcludedRoutes,
    issues
  };
}

function duplicateIds(ids: readonly AiActionIntentId[]): AiActionIntentId[] {
  const seen = new Set<AiActionIntentId>();
  const duplicates = new Set<AiActionIntentId>();

  for (const id of ids) {
    if (seen.has(id)) {
      duplicates.add(id);
    }

    seen.add(id);
  }

  return [...duplicates];
}

function hasAllForbiddenCapabilities(
  entry: AiActionIntentRegistryEntry
): boolean {
  return AI_ACTION_INTENT_FORBIDDEN_CAPABILITIES.every((capability) =>
    entry.forbiddenCapabilities.includes(capability)
  );
}

function hasWritesEnabled(write: AiActionIntentWriteFlags): boolean {
  return Object.values(write).some((enabled) => enabled);
}

function hasExcludedRoute(scopeEntry: AiActionIntentObjectScope): boolean {
  return [scopeEntry.route, scopeEntry.detailRoute]
    .filter((route): route is string => route !== null)
    .some(
      (route) =>
        route === "/search" ||
        route === "/command-palette" ||
        route.includes("/deals/[id]") ||
        route.includes("/orders/new") ||
        route.includes("/orders/[id]/edit") ||
        route.includes("/areas/new") ||
        route.includes("/areas/[id]/edit")
    );
}

function uniqueRoutes(routes: readonly (string | null)[]): string[] {
  return [...new Set(routes.filter((route): route is string => route !== null))];
}
