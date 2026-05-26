import { z } from "zod";
import {
  CSV_IMPORT_PREVIEW_ENTITIES,
  listCsvImportPreviewDefinitions,
  type CsvImportPreviewEntity
} from "@/lib/server/csvImportPreview";
import type {
  CsvImportReadinessStatus,
  CsvImportRowActionKind
} from "@/lib/server/csvImportPreflight";

export const CSV_IMPORT_APPLY_CAPABILITY_CONTENT_TYPE =
  "application/json; charset=utf-8" as const;

export const CSV_IMPORT_APPLY_CAPABILITY_VERSION =
  "2026-05-25.s40-f1" as const;

export const CSV_IMPORT_APPLY_ROW_ACTIONS = [
  "create_candidate",
  "review_candidate",
  "blocked"
] as const satisfies readonly CsvImportRowActionKind[];

const CONTACT_CREATE_EXECUTOR_PATH = "lib/crm/crmClient.ts#createContact" as const;

export type CsvImportApplyRowAction =
  (typeof CSV_IMPORT_APPLY_ROW_ACTIONS)[number];

export type CsvImportApplyOperation = "create_contact";

export type CsvImportApplyCapabilityStatus =
  | "blocked"
  | "partial"
  | "supported";

export type CsvImportApplyManualExecutorPath =
  typeof CONTACT_CREATE_EXECUTOR_PATH;

export type CsvImportApplyBlockReasonCode =
  | "contact_review_candidate_not_create_safe"
  | "contact_row_blocked_by_validation"
  | "contact_update_upsert_excluded"
  | "duplicate_merge_excluded"
  | "file_storage_excluded"
  | "lead_import_apply_excluded"
  | "lead_routing_excluded"
  | "salesforce_integration_excluded";

export type CsvImportApplyBlockReason = {
  code: CsvImportApplyBlockReasonCode;
  message: string;
};

export type CsvImportApplyReadFlags = {
  metadata: true;
  database: false;
  csvInput: false;
  previewContracts: true;
  readinessContracts: true;
  actionSummaryContracts: true;
};

export type CsvImportApplyWriteFlags = {
  database: false;
  contacts: false;
  leads: false;
  auditEvents: false;
  routingAssignments: false;
  files: false;
  externalServices: false;
  backgroundJobs: false;
  importApply: false;
  updates: false;
  upserts: false;
  duplicateMerge: false;
  salesforce: false;
  routes: false;
  productUi: false;
  schema: false;
  crmContract: false;
};

export type CsvImportApplySafetyFlags = {
  deterministic: true;
  readOnly: true;
  descriptorOnly: true;
  metadataOnly: true;
  currentApply: false;
  operatorApprovalRequiredBeforeWrites: true;
  contactsOnly: true;
  createsOnly: true;
  leadApply: false;
  leadRouting: false;
  updates: false;
  upserts: false;
  duplicateMerge: false;
  fileStorage: false;
  salesforceIntegration: false;
  externalAi: false;
  network: false;
  externalServices: false;
  routeHandlers: false;
  productUi: false;
  crmContractChanges: false;
  schemaChanges: false;
};

export type CsvImportApplyRowActionSource = {
  rowAction: CsvImportApplyRowAction;
  readinessStatus: CsvImportReadinessStatus;
  previewCanProceed: boolean;
  previewRequiresReview: boolean;
};

export type CsvImportApplyEntityActionCapability = {
  entity: CsvImportPreviewEntity;
  label: string;
  route: string;
  rowAction: CsvImportApplyRowAction;
  status: Exclude<CsvImportApplyCapabilityStatus, "partial">;
  applyOperation: CsvImportApplyOperation | null;
  manualExecutorPath: CsvImportApplyManualExecutorPath | null;
  blockedReasons: readonly CsvImportApplyBlockReason[];
  currentApplyAllowed: false;
  futureManualApplyEligible: boolean;
  operatorApprovalRequired: true;
  supportedReadinessStatuses: readonly CsvImportReadinessStatus[];
  sourceAction: CsvImportApplyRowActionSource;
};

export type CsvImportApplyEntityCapability = {
  entity: CsvImportPreviewEntity;
  label: string;
  route: string;
  actionCount: number;
  supportedActionCount: number;
  blockedActionCount: number;
  actions: readonly CsvImportApplyEntityActionCapability[];
  read: CsvImportApplyReadFlags;
  write: CsvImportApplyWriteFlags;
  safety: CsvImportApplySafetyFlags;
};

export type CsvImportApplyActionEntityStatus = {
  entity: CsvImportPreviewEntity;
  status: Exclude<CsvImportApplyCapabilityStatus, "partial">;
  manualExecutorPath: CsvImportApplyManualExecutorPath | null;
  blockedReasonCodes: readonly CsvImportApplyBlockReasonCode[];
};

export type CsvImportApplyActionCapability = {
  rowAction: CsvImportApplyRowAction;
  label: string;
  supportedEntityCount: number;
  blockedEntityCount: number;
  status: CsvImportApplyCapabilityStatus;
  manualExecutorPaths: readonly CsvImportApplyManualExecutorPath[];
  blockedReasons: readonly CsvImportApplyBlockReason[];
  entities: readonly CsvImportApplyActionEntityStatus[];
};

export type CsvImportApplyCapabilityMatrixSource = {
  previewEntities: typeof CSV_IMPORT_PREVIEW_ENTITIES;
  previewModule: "lib/server/csvImportPreview.ts";
  preflightModule: "lib/server/csvImportPreflight.ts";
  capabilityScope: "csv-contact-import-manual-apply-capability-matrix";
  routeScope: readonly string[];
};

export type CsvImportApplyCapabilityMatrix = {
  contentType: typeof CSV_IMPORT_APPLY_CAPABILITY_CONTENT_TYPE;
  matrixType: "csv-import-apply-capability-matrix";
  matrixVersion: typeof CSV_IMPORT_APPLY_CAPABILITY_VERSION;
  entityCount: number;
  rowActionCount: number;
  entityActionCount: number;
  supportedEntityActionCount: number;
  blockedEntityActionCount: number;
  supportedRowActionCount: number;
  blockedRowActionCount: number;
  manualExecutorPathCount: number;
  nonGoalExclusions: readonly CsvImportApplyBlockReason[];
  entities: readonly CsvImportApplyEntityCapability[];
  actions: readonly CsvImportApplyActionCapability[];
  source: CsvImportApplyCapabilityMatrixSource;
  read: CsvImportApplyReadFlags;
  write: CsvImportApplyWriteFlags;
  safety: CsvImportApplySafetyFlags;
};

const matrixInputSchema = z.object({}).strict();

const blockReasonMessages = {
  contact_review_candidate_not_create_safe:
    "Contact rows that need review are not classified as create-safe for manual apply.",
  contact_row_blocked_by_validation:
    "Rows blocked by CSV structure, header, parse, or validation errors cannot be applied.",
  contact_update_upsert_excluded:
    "Contact update, upsert, account creation, and merge behavior remain excluded.",
  duplicate_merge_excluded:
    "Duplicate merge and dedupe mutation workflows remain excluded.",
  file_storage_excluded:
    "CSV upload storage, persistent import history, and background file handling remain excluded.",
  lead_import_apply_excluded:
    "Lead import apply is excluded; the current apply path is limited to contact creation.",
  lead_routing_excluded:
    "Lead routing execution, reassignment, dealer-order writes, and pacing changes remain excluded.",
  salesforce_integration_excluded:
    "Salesforce import, sync, external enrichment, webhooks, and provider calls remain excluded."
} as const satisfies Record<CsvImportApplyBlockReasonCode, string>;

const rowActionSources = {
  create_candidate: {
    rowAction: "create_candidate",
    readinessStatus: "ready",
    previewCanProceed: true,
    previewRequiresReview: false
  },
  review_candidate: {
    rowAction: "review_candidate",
    readinessStatus: "needs_review",
    previewCanProceed: true,
    previewRequiresReview: true
  },
  blocked: {
    rowAction: "blocked",
    readinessStatus: "blocked",
    previewCanProceed: false,
    previewRequiresReview: true
  }
} as const satisfies Record<CsvImportApplyRowAction, CsvImportApplyRowActionSource>;

const nonGoalExclusionCodes: readonly CsvImportApplyBlockReasonCode[] = [
  "lead_import_apply_excluded",
  "lead_routing_excluded",
  "contact_update_upsert_excluded",
  "duplicate_merge_excluded",
  "file_storage_excluded",
  "salesforce_integration_excluded"
];

export function getCsvImportApplyCapabilityMatrix(
  input: unknown = {}
): CsvImportApplyCapabilityMatrix {
  matrixInputSchema.parse(input);

  const definitions = listCsvImportPreviewDefinitions();
  const entities = definitions.map((definition) =>
    buildEntityCapability(definition)
  );
  const actions = CSV_IMPORT_APPLY_ROW_ACTIONS.map((rowAction) =>
    buildActionCapability(rowAction, entities)
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
    contentType: CSV_IMPORT_APPLY_CAPABILITY_CONTENT_TYPE,
    matrixType: "csv-import-apply-capability-matrix",
    matrixVersion: CSV_IMPORT_APPLY_CAPABILITY_VERSION,
    entityCount: entities.length,
    rowActionCount: CSV_IMPORT_APPLY_ROW_ACTIONS.length,
    entityActionCount: supportedEntityActionCount + blockedEntityActionCount,
    supportedEntityActionCount,
    blockedEntityActionCount,
    supportedRowActionCount: actions.filter(
      (action) => action.status === "supported"
    ).length,
    blockedRowActionCount: actions.filter(
      (action) => action.status === "blocked"
    ).length,
    manualExecutorPathCount: uniqueManualExecutorPaths(
      actions.flatMap((action) => action.manualExecutorPaths)
    ).length,
    nonGoalExclusions: blockReasonsForCodes(nonGoalExclusionCodes),
    entities,
    actions,
    source: {
      previewEntities: CSV_IMPORT_PREVIEW_ENTITIES,
      previewModule: "lib/server/csvImportPreview.ts",
      preflightModule: "lib/server/csvImportPreflight.ts",
      capabilityScope: "csv-contact-import-manual-apply-capability-matrix",
      routeScope: definitions.map((definition) => definition.route)
    },
    read: readFlags(),
    write: noWrites(),
    safety: safetyFlags()
  };
}

export function getCsvImportApplyEntityCapability(
  entity: string
): CsvImportApplyEntityCapability | null {
  return (
    getCsvImportApplyCapabilityMatrix().entities.find(
      (candidate) => candidate.entity === entity
    ) ?? null
  );
}

export function getCsvImportApplyActionCapability(
  entity: string,
  rowAction: string
): CsvImportApplyEntityActionCapability | null {
  const capability = getCsvImportApplyEntityCapability(entity);

  return (
    capability?.actions.find((candidate) => candidate.rowAction === rowAction) ??
    null
  );
}

function buildEntityCapability(
  definition: ReturnType<typeof listCsvImportPreviewDefinitions>[number]
): CsvImportApplyEntityCapability {
  const actions = CSV_IMPORT_APPLY_ROW_ACTIONS.map((rowAction) =>
    buildEntityActionCapability(definition, rowAction)
  );
  const supportedActionCount = actions.filter(
    (action) => action.status === "supported"
  ).length;

  return {
    entity: definition.entity,
    label: definition.label,
    route: definition.route,
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
  definition: ReturnType<typeof listCsvImportPreviewDefinitions>[number],
  rowAction: CsvImportApplyRowAction
): CsvImportApplyEntityActionCapability {
  const blockedReasons = blockedReasonsForEntityAction(
    definition.entity,
    rowAction
  );
  const supported = blockedReasons.length === 0;

  return {
    entity: definition.entity,
    label: definition.label,
    route: definition.route,
    rowAction,
    status: supported ? "supported" : "blocked",
    applyOperation: supported ? "create_contact" : null,
    manualExecutorPath: supported ? CONTACT_CREATE_EXECUTOR_PATH : null,
    blockedReasons,
    currentApplyAllowed: false,
    futureManualApplyEligible: supported,
    operatorApprovalRequired: true,
    supportedReadinessStatuses: supported ? ["ready"] : [],
    sourceAction: rowActionSources[rowAction]
  };
}

function blockedReasonsForEntityAction(
  entity: CsvImportPreviewEntity,
  rowAction: CsvImportApplyRowAction
): CsvImportApplyBlockReason[] {
  const codes: CsvImportApplyBlockReasonCode[] = [];

  if (entity !== "contacts") {
    codes.push("lead_import_apply_excluded", "lead_routing_excluded");
  } else if (rowAction === "review_candidate") {
    codes.push(
      "contact_review_candidate_not_create_safe",
      "contact_update_upsert_excluded",
      "duplicate_merge_excluded"
    );
  } else if (rowAction === "blocked") {
    codes.push("contact_row_blocked_by_validation");
  }

  return blockReasonsForCodes(codes);
}

function buildActionCapability(
  rowAction: CsvImportApplyRowAction,
  entities: readonly CsvImportApplyEntityCapability[]
): CsvImportApplyActionCapability {
  const entityStatuses = entities.map((entity) => {
    const action = entity.actions.find(
      (candidate) => candidate.rowAction === rowAction
    );

    if (!action) {
      throw new Error(`Missing CSV import apply action ${rowAction}`);
    }

    return {
      entity: entity.entity,
      status: action.status,
      manualExecutorPath: action.manualExecutorPath,
      blockedReasonCodes: action.blockedReasons.map((reason) => reason.code)
    };
  });
  const supportedEntityCount = entityStatuses.filter(
    (status) => status.status === "supported"
  ).length;
  const blockedEntityCount = entityStatuses.length - supportedEntityCount;

  return {
    rowAction,
    label: labelForRowAction(rowAction),
    supportedEntityCount,
    blockedEntityCount,
    status: aggregateStatus(supportedEntityCount, blockedEntityCount),
    manualExecutorPaths: uniqueManualExecutorPaths(
      entityStatuses.map((status) => status.manualExecutorPath)
    ),
    blockedReasons: uniqueBlockReasons(
      entities.flatMap((entity) =>
        entity.actions
          .filter((candidate) => candidate.rowAction === rowAction)
          .flatMap((candidate) => candidate.blockedReasons)
      )
    ),
    entities: entityStatuses
  };
}

function labelForRowAction(rowAction: CsvImportApplyRowAction): string {
  switch (rowAction) {
    case "create_candidate":
      return "Create-safe contact candidate";
    case "review_candidate":
      return "Review candidate";
    case "blocked":
      return "Blocked row";
  }
}

function aggregateStatus(
  supportedEntityCount: number,
  blockedEntityCount: number
): CsvImportApplyCapabilityStatus {
  if (supportedEntityCount === 0) {
    return "blocked";
  }

  if (blockedEntityCount > 0) {
    return "partial";
  }

  return "supported";
}

function uniqueManualExecutorPaths(
  paths: readonly (CsvImportApplyManualExecutorPath | null)[]
): CsvImportApplyManualExecutorPath[] {
  const unique = new Set<CsvImportApplyManualExecutorPath>();

  for (const path of paths) {
    if (path !== null) {
      unique.add(path);
    }
  }

  return [...unique];
}

function uniqueBlockReasons(
  reasons: readonly CsvImportApplyBlockReason[]
): CsvImportApplyBlockReason[] {
  return blockReasonsForCodes(reasons.map((reason) => reason.code));
}

function blockReasonsForCodes(
  codes: readonly CsvImportApplyBlockReasonCode[]
): CsvImportApplyBlockReason[] {
  return [...new Set(codes)].map((code) => ({
    code,
    message: blockReasonMessages[code]
  }));
}

function readFlags(): CsvImportApplyReadFlags {
  return {
    metadata: true,
    database: false,
    csvInput: false,
    previewContracts: true,
    readinessContracts: true,
    actionSummaryContracts: true
  };
}

function noWrites(): CsvImportApplyWriteFlags {
  return {
    database: false,
    contacts: false,
    leads: false,
    auditEvents: false,
    routingAssignments: false,
    files: false,
    externalServices: false,
    backgroundJobs: false,
    importApply: false,
    updates: false,
    upserts: false,
    duplicateMerge: false,
    salesforce: false,
    routes: false,
    productUi: false,
    schema: false,
    crmContract: false
  };
}

function safetyFlags(): CsvImportApplySafetyFlags {
  return {
    deterministic: true,
    readOnly: true,
    descriptorOnly: true,
    metadataOnly: true,
    currentApply: false,
    operatorApprovalRequiredBeforeWrites: true,
    contactsOnly: true,
    createsOnly: true,
    leadApply: false,
    leadRouting: false,
    updates: false,
    upserts: false,
    duplicateMerge: false,
    fileStorage: false,
    salesforceIntegration: false,
    externalAi: false,
    network: false,
    externalServices: false,
    routeHandlers: false,
    productUi: false,
    crmContractChanges: false,
    schemaChanges: false
  };
}
