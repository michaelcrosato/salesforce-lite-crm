import { z } from "zod";
import {
  WORKFLOW_RULE_CATALOG_CONTENT_TYPE,
  WORKFLOW_RULE_CATALOG_VERSION,
  getWorkflowRuleCatalog,
  type WorkflowRuleAction,
  type WorkflowRuleActionCategory,
  type WorkflowRuleCatalogEntity,
  type WorkflowRuleCatalogReadFlags,
  type WorkflowRuleCatalogSafety,
  type WorkflowRuleCatalogWriteFlags,
  type WorkflowRuleEntityActionDefinition
} from "@/lib/server/workflowRuleCatalog";

export const WORKFLOW_RULE_EXECUTION_CAPABILITY_CONTENT_TYPE =
  "application/json; charset=utf-8" as const;

export const WORKFLOW_RULE_EXECUTION_CAPABILITY_VERSION =
  "2026-05-25.s39-f1" as const;

const CREATE_TASK_EXECUTOR_PATH = "lib/crm/crmClient.ts#createTask" as const;
const UPDATE_ACCOUNT_EXECUTOR_PATH = "lib/crm/crmClient.ts#updateAccount" as const;
const UPDATE_CONTACT_EXECUTOR_PATH = "lib/crm/crmClient.ts#updateContact" as const;
const UPDATE_OPPORTUNITY_EXECUTOR_PATH =
  "lib/crm/crmClient.ts#updateOpportunity" as const;
const UPDATE_LEAD_EXECUTOR_PATH = "lib/crm/crmClient.ts#updateLead" as const;
const UPDATE_TASK_EXECUTOR_PATH = "lib/crm/crmClient.ts#updateTask" as const;
const UPDATE_CASE_EXECUTOR_PATH = "lib/crm/crmClient.ts#updateCase" as const;
const UPDATE_CAMPAIGN_EXECUTOR_PATH = "lib/crm/crmClient.ts#updateCampaign" as const;
const AUDIT_EVENT_RECORDER_PATH = "lib/services/auditEvents.ts#recordAuditEvent" as const;

export type WorkflowRuleExecutionManualExecutorPath =
  | typeof CREATE_TASK_EXECUTOR_PATH
  | typeof UPDATE_ACCOUNT_EXECUTOR_PATH
  | typeof UPDATE_CONTACT_EXECUTOR_PATH
  | typeof UPDATE_OPPORTUNITY_EXECUTOR_PATH
  | typeof UPDATE_LEAD_EXECUTOR_PATH
  | typeof UPDATE_TASK_EXECUTOR_PATH
  | typeof UPDATE_CASE_EXECUTOR_PATH
  | typeof UPDATE_CAMPAIGN_EXECUTOR_PATH;

export type WorkflowRuleExecutionCapabilityStatus =
  | "blocked"
  | "partial"
  | "supported";

export type WorkflowRuleExecutionCapabilityBlockReasonCode =
  | "external_delivery_excluded"
  | "manual_executor_path_missing"
  | "operator_notification_surface_not_persisted";

export type WorkflowRuleExecutionCapabilityBlockReason = {
  code: WorkflowRuleExecutionCapabilityBlockReasonCode;
  message: string;
};

export type WorkflowRuleExecutionCapabilityReadFlags =
  WorkflowRuleCatalogReadFlags & {
    catalog: true;
    auditMetadata: true;
    manualExecutorMetadata: true;
  };

export type WorkflowRuleExecutionCapabilityWriteFlags =
  WorkflowRuleCatalogWriteFlags & {
    actionApprovals: false;
    executorRuns: false;
    executionCapabilityMatrix: false;
    notifications: false;
  };

export type WorkflowRuleExecutionCapabilitySafety =
  WorkflowRuleCatalogSafety & {
    auditWrites: false;
    catalogBacked: true;
    currentExecution: false;
    manualExecutorMetadataOnly: true;
    metadataOnly: true;
    operatorApprovalRequiredBeforeWrites: true;
  };

export type WorkflowRuleExecutionCapabilityAuditIntent = {
  intentType: "workflow-action-execution-capability-audit-intent";
  eventCategory: "workflow";
  eventAction: "workflow_action_execute";
  requiredForManualExecution: boolean;
  auditRecorderPath: typeof AUDIT_EVENT_RECORDER_PATH | null;
  actorRequired: true;
  approvalRequired: true;
  wouldWriteNow: false;
};

export type WorkflowRuleExecutionActionTarget = {
  kind: WorkflowRuleEntityActionDefinition["target"]["kind"];
  recordType: WorkflowRuleEntityActionDefinition["target"]["recordType"];
  fieldPath: readonly string[] | null;
  allowedValues: readonly string[] | null;
  valueSource: string | null;
  requiredDraftFields: readonly string[];
  optionalDraftFields: readonly string[];
  externalDelivery: false;
};

export type WorkflowRuleExecutionEntityActionCapability = {
  entity: WorkflowRuleCatalogEntity;
  action: WorkflowRuleAction;
  label: string;
  category: WorkflowRuleActionCategory;
  catalogMode: WorkflowRuleEntityActionDefinition["mode"];
  target: WorkflowRuleExecutionActionTarget;
  status: Exclude<WorkflowRuleExecutionCapabilityStatus, "partial">;
  manualExecutorPath: WorkflowRuleExecutionManualExecutorPath | null;
  blockedReasons: readonly WorkflowRuleExecutionCapabilityBlockReason[];
  currentExecutionAllowed: false;
  futureManualExecutorEligible: boolean;
  operatorApprovalRequired: true;
  auditIntent: WorkflowRuleExecutionCapabilityAuditIntent;
};

export type WorkflowRuleExecutionEntityCapability = {
  entity: WorkflowRuleCatalogEntity;
  label: string;
  modelName: string;
  route: string;
  actionCount: number;
  supportedActionCount: number;
  blockedActionCount: number;
  actions: readonly WorkflowRuleExecutionEntityActionCapability[];
  read: WorkflowRuleExecutionCapabilityReadFlags;
  write: WorkflowRuleExecutionCapabilityWriteFlags;
  safety: WorkflowRuleExecutionCapabilitySafety;
};

export type WorkflowRuleExecutionActionEntityStatus = {
  entity: WorkflowRuleCatalogEntity;
  status: Exclude<WorkflowRuleExecutionCapabilityStatus, "partial">;
  manualExecutorPath: WorkflowRuleExecutionManualExecutorPath | null;
  blockedReasonCodes: readonly WorkflowRuleExecutionCapabilityBlockReasonCode[];
};

export type WorkflowRuleExecutionActionCapability = {
  action: WorkflowRuleAction;
  label: string;
  category: WorkflowRuleActionCategory;
  catalogSupportedEntities: readonly WorkflowRuleCatalogEntity[];
  catalogSupportedEntityCount: number;
  supportedEntityCount: number;
  blockedEntityCount: number;
  status: WorkflowRuleExecutionCapabilityStatus;
  manualExecutorPaths: readonly WorkflowRuleExecutionManualExecutorPath[];
  blockedReasons: readonly WorkflowRuleExecutionCapabilityBlockReason[];
  entities: readonly WorkflowRuleExecutionActionEntityStatus[];
};

export type WorkflowRuleExecutionCapabilityMatrixSource = {
  catalogContentType: typeof WORKFLOW_RULE_CATALOG_CONTENT_TYPE;
  catalogVersion: typeof WORKFLOW_RULE_CATALOG_VERSION;
  catalogModule: "lib/server/workflowRuleCatalog.ts";
  capabilityScope: "workflow-manual-execution-capability-matrix";
  routeScope: readonly string[];
};

export type WorkflowRuleExecutionCapabilityMatrix = {
  contentType: typeof WORKFLOW_RULE_EXECUTION_CAPABILITY_CONTENT_TYPE;
  matrixType: "workflow-rule-execution-capability-matrix";
  matrixVersion: typeof WORKFLOW_RULE_EXECUTION_CAPABILITY_VERSION;
  entityCount: number;
  catalogActionCount: number;
  entityActionCount: number;
  supportedCatalogActionCount: number;
  blockedCatalogActionCount: number;
  supportedEntityActionCount: number;
  blockedEntityActionCount: number;
  manualExecutorPathCount: number;
  entities: readonly WorkflowRuleExecutionEntityCapability[];
  actions: readonly WorkflowRuleExecutionActionCapability[];
  source: WorkflowRuleExecutionCapabilityMatrixSource;
  read: WorkflowRuleExecutionCapabilityReadFlags;
  write: WorkflowRuleExecutionCapabilityWriteFlags;
  safety: WorkflowRuleExecutionCapabilitySafety;
};

type ManualExecutorPathMap = Record<
  WorkflowRuleCatalogEntity,
  Partial<Record<WorkflowRuleAction, WorkflowRuleExecutionManualExecutorPath>>
>;

const matrixInputSchema = z.object({}).strict();

const manualExecutorPaths: ManualExecutorPathMap = {
  accounts: {
    draft_task: CREATE_TASK_EXECUTOR_PATH,
    draft_status_update: UPDATE_ACCOUNT_EXECUTOR_PATH
  },
  contacts: {
    draft_task: CREATE_TASK_EXECUTOR_PATH,
    draft_status_update: UPDATE_CONTACT_EXECUTOR_PATH
  },
  opportunities: {
    draft_task: CREATE_TASK_EXECUTOR_PATH,
    draft_stage_update: UPDATE_OPPORTUNITY_EXECUTOR_PATH
  },
  leads: {
    draft_task: CREATE_TASK_EXECUTOR_PATH,
    draft_status_update: UPDATE_LEAD_EXECUTOR_PATH
  },
  tasks: {
    draft_status_update: UPDATE_TASK_EXECUTOR_PATH,
    draft_priority_update: UPDATE_TASK_EXECUTOR_PATH
  },
  cases: {
    draft_task: CREATE_TASK_EXECUTOR_PATH,
    draft_status_update: UPDATE_CASE_EXECUTOR_PATH,
    draft_priority_update: UPDATE_CASE_EXECUTOR_PATH,
    draft_case_queue_assignment: UPDATE_CASE_EXECUTOR_PATH
  },
  campaigns: {
    draft_status_update: UPDATE_CAMPAIGN_EXECUTOR_PATH
  }
};

const blockReasonMessages = {
  external_delivery_excluded:
    "Message delivery, webhooks, provider calls, and other external notification delivery remain excluded.",
  manual_executor_path_missing:
    "No bounded local manual-executor path is registered for this catalog action.",
  operator_notification_surface_not_persisted:
    "Operator notifications are descriptor-only because no persisted in-app notification surface is in scope."
} as const satisfies Record<
  WorkflowRuleExecutionCapabilityBlockReasonCode,
  string
>;

export function getWorkflowRuleExecutionCapabilityMatrix(
  input: unknown = {}
): WorkflowRuleExecutionCapabilityMatrix {
  matrixInputSchema.parse(input);

  const catalog = getWorkflowRuleCatalog();
  const entities = catalog.entities.map(buildEntityCapability);
  const actions = catalog.actions.map((action) =>
    buildActionCapability(action, entities)
  );
  const supportedEntityActionCount = entities.reduce(
    (total, entity) => total + entity.supportedActionCount,
    0
  );
  const blockedEntityActionCount = entities.reduce(
    (total, entity) => total + entity.blockedActionCount,
    0
  );

  return {
    contentType: WORKFLOW_RULE_EXECUTION_CAPABILITY_CONTENT_TYPE,
    matrixType: "workflow-rule-execution-capability-matrix",
    matrixVersion: WORKFLOW_RULE_EXECUTION_CAPABILITY_VERSION,
    entityCount: entities.length,
    catalogActionCount: actions.length,
    entityActionCount: supportedEntityActionCount + blockedEntityActionCount,
    supportedCatalogActionCount: actions.filter(
      (action) => action.status === "supported"
    ).length,
    blockedCatalogActionCount: actions.filter(
      (action) => action.status === "blocked"
    ).length,
    supportedEntityActionCount,
    blockedEntityActionCount,
    manualExecutorPathCount: uniqueManualExecutorPaths(
      actions.flatMap((action) => action.manualExecutorPaths)
    ).length,
    entities,
    actions,
    source: {
      catalogContentType: WORKFLOW_RULE_CATALOG_CONTENT_TYPE,
      catalogVersion: WORKFLOW_RULE_CATALOG_VERSION,
      catalogModule: "lib/server/workflowRuleCatalog.ts",
      capabilityScope: "workflow-manual-execution-capability-matrix",
      routeScope: [...catalog.source.routeScope]
    },
    read: readFlags(),
    write: noWrites(),
    safety: safetyFlags()
  };
}

export function getWorkflowRuleExecutionEntityCapability(
  entity: string
): WorkflowRuleExecutionEntityCapability | null {
  return (
    getWorkflowRuleExecutionCapabilityMatrix().entities.find(
      (candidate) => candidate.entity === entity
    ) ?? null
  );
}

export function getWorkflowRuleExecutionActionCapability(
  entity: string,
  action: string
): WorkflowRuleExecutionEntityActionCapability | null {
  const capability = getWorkflowRuleExecutionEntityCapability(entity);

  return (
    capability?.actions.find((candidate) => candidate.action === action) ??
    null
  );
}

function buildEntityCapability(
  catalog: ReturnType<typeof getWorkflowRuleCatalog>["entities"][number]
): WorkflowRuleExecutionEntityCapability {
  const actions = catalog.actions.map((action) =>
    buildEntityActionCapability(catalog.entity, action)
  );
  const supportedActionCount = actions.filter(
    (action) => action.status === "supported"
  ).length;

  return {
    entity: catalog.entity,
    label: catalog.label,
    modelName: catalog.modelName,
    route: catalog.route,
    actionCount: actions.length,
    supportedActionCount,
    blockedActionCount: actions.length - supportedActionCount,
    actions,
    read: readFlags(),
    write: noWrites(),
    safety: safetyFlags()
  };
}

function buildEntityActionCapability(
  entity: WorkflowRuleCatalogEntity,
  action: WorkflowRuleEntityActionDefinition
): WorkflowRuleExecutionEntityActionCapability {
  const manualExecutorPath = manualExecutorPathForAction(entity, action.action);
  const blockedReasons = blockedReasonsForAction(action, manualExecutorPath);
  const supported = blockedReasons.length === 0;

  return {
    entity,
    action: action.action,
    label: action.label,
    category: action.category,
    catalogMode: action.mode,
    target: copyTarget(action.target),
    status: supported ? "supported" : "blocked",
    manualExecutorPath,
    blockedReasons,
    currentExecutionAllowed: false,
    futureManualExecutorEligible: supported,
    operatorApprovalRequired: true,
    auditIntent: {
      intentType: "workflow-action-execution-capability-audit-intent",
      eventCategory: "workflow",
      eventAction: "workflow_action_execute",
      requiredForManualExecution: supported,
      auditRecorderPath: supported ? AUDIT_EVENT_RECORDER_PATH : null,
      actorRequired: true,
      approvalRequired: true,
      wouldWriteNow: false
    }
  };
}

function buildActionCapability(
  action: ReturnType<typeof getWorkflowRuleCatalog>["actions"][number],
  entities: readonly WorkflowRuleExecutionEntityCapability[]
): WorkflowRuleExecutionActionCapability {
  const entityStatuses = entities.flatMap((entity) =>
    entity.actions
      .filter((candidate) => candidate.action === action.action)
      .map((candidate) => ({
        entity: entity.entity,
        status: candidate.status,
        manualExecutorPath: candidate.manualExecutorPath,
        blockedReasonCodes: candidate.blockedReasons.map(
          (reason) => reason.code
        )
      }))
  );
  const supportedEntityCount = entityStatuses.filter(
    (status) => status.status === "supported"
  ).length;
  const blockedEntityCount = entityStatuses.length - supportedEntityCount;

  return {
    action: action.action,
    label: action.label,
    category: action.category,
    catalogSupportedEntities: [...action.supportedEntities],
    catalogSupportedEntityCount: action.supportedEntities.length,
    supportedEntityCount,
    blockedEntityCount,
    status: aggregateStatus(supportedEntityCount, blockedEntityCount),
    manualExecutorPaths: uniqueManualExecutorPaths(
      entityStatuses.map((status) => status.manualExecutorPath)
    ),
    blockedReasons: uniqueBlockReasons(
      entities.flatMap((entity) =>
        entity.actions
          .filter((candidate) => candidate.action === action.action)
          .flatMap((candidate) => candidate.blockedReasons)
      )
    ),
    entities: entityStatuses
  };
}

function manualExecutorPathForAction(
  entity: WorkflowRuleCatalogEntity,
  action: WorkflowRuleAction
): WorkflowRuleExecutionManualExecutorPath | null {
  return manualExecutorPaths[entity][action] ?? null;
}

function blockedReasonsForAction(
  action: WorkflowRuleEntityActionDefinition,
  manualExecutorPath: WorkflowRuleExecutionManualExecutorPath | null
): WorkflowRuleExecutionCapabilityBlockReason[] {
  const codes: WorkflowRuleExecutionCapabilityBlockReasonCode[] = [];

  if (manualExecutorPath === null) {
    codes.push("manual_executor_path_missing");
  }

  if (action.action === "draft_notification") {
    codes.push(
      "operator_notification_surface_not_persisted",
      "external_delivery_excluded"
    );
  }

  return uniqueBlockReasonCodes(codes).map((code) => ({
    code,
    message: blockReasonMessages[code]
  }));
}

function aggregateStatus(
  supportedEntityCount: number,
  blockedEntityCount: number
): WorkflowRuleExecutionCapabilityStatus {
  if (supportedEntityCount === 0) {
    return "blocked";
  }

  if (blockedEntityCount > 0) {
    return "partial";
  }

  return "supported";
}

function copyTarget(
  target: WorkflowRuleEntityActionDefinition["target"]
): WorkflowRuleExecutionActionTarget {
  return {
    kind: target.kind,
    recordType: target.recordType,
    fieldPath: target.fieldPath ? [...target.fieldPath] : null,
    allowedValues: target.allowedValues ? [...target.allowedValues] : null,
    valueSource: target.valueSource,
    requiredDraftFields: [...target.requiredDraftFields],
    optionalDraftFields: [...target.optionalDraftFields],
    externalDelivery: false
  };
}

function uniqueManualExecutorPaths(
  paths: readonly (WorkflowRuleExecutionManualExecutorPath | null)[]
): WorkflowRuleExecutionManualExecutorPath[] {
  const unique = new Set<WorkflowRuleExecutionManualExecutorPath>();

  for (const path of paths) {
    if (path !== null) {
      unique.add(path);
    }
  }

  return [...unique];
}

function uniqueBlockReasons(
  reasons: readonly WorkflowRuleExecutionCapabilityBlockReason[]
): WorkflowRuleExecutionCapabilityBlockReason[] {
  return uniqueBlockReasonCodes(reasons.map((reason) => reason.code)).map(
    (code) => ({
      code,
      message: blockReasonMessages[code]
    })
  );
}

function uniqueBlockReasonCodes(
  codes: readonly WorkflowRuleExecutionCapabilityBlockReasonCode[]
): WorkflowRuleExecutionCapabilityBlockReasonCode[] {
  return [...new Set(codes)];
}

function readFlags(): WorkflowRuleExecutionCapabilityReadFlags {
  return {
    metadata: true,
    database: false,
    crmRecords: false,
    adapterInternals: false,
    runtimeEvaluation: false,
    catalog: true,
    auditMetadata: true,
    manualExecutorMetadata: true
  };
}

function noWrites(): WorkflowRuleExecutionCapabilityWriteFlags {
  return {
    database: false,
    workflowRules: false,
    crmRecords: false,
    auditEvents: false,
    routes: false,
    routeHandlers: false,
    productUi: false,
    schema: false,
    crmContract: false,
    files: false,
    externalServices: false,
    backgroundJobs: false,
    scheduledSweeps: false,
    actionExecution: false,
    actionApprovals: false,
    executorRuns: false,
    executionCapabilityMatrix: false,
    notifications: false
  };
}

function safetyFlags(): WorkflowRuleExecutionCapabilitySafety {
  return {
    deterministic: true,
    readOnly: true,
    descriptorOnly: true,
    rulePersistence: false,
    scheduledExecution: false,
    actionExecution: false,
    arbitraryJavascript: false,
    eval: false,
    externalAi: false,
    network: false,
    externalServices: false,
    routeHandlers: false,
    productUi: false,
    crmContractChanges: false,
    schemaChanges: false,
    auditWrites: false,
    catalogBacked: true,
    currentExecution: false,
    manualExecutorMetadataOnly: true,
    metadataOnly: true,
    operatorApprovalRequiredBeforeWrites: true
  };
}
