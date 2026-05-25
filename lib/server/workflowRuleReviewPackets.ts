import {
  WORKFLOW_RULE_CATALOG_CONTENT_TYPE,
  WORKFLOW_RULE_CATALOG_VERSION,
  getWorkflowRuleCatalog,
  getWorkflowRuleEntityCatalog,
  type WorkflowRuleAction,
  type WorkflowRuleActionCategory,
  type WorkflowRuleCatalogEntity,
  type WorkflowRuleTrigger
} from "@/lib/server/workflowRuleCatalog";
import {
  WORKFLOW_RULE_DRY_RUN_CONTENT_TYPE,
  WORKFLOW_RULE_DRY_RUN_VERSION,
  dryRunWorkflowRule,
  type WorkflowRuleDryRunProposedAction,
  type WorkflowRuleDryRunResult,
  type WorkflowRuleDryRunSafety,
  type WorkflowRuleDryRunWriteFlags
} from "@/lib/server/workflowRuleDryRun";

export const WORKFLOW_RULE_REVIEW_PACKET_CONTENT_TYPE =
  "application/json; charset=utf-8" as const;

export const WORKFLOW_RULE_REVIEW_PACKET_VERSION = "2026-05-25.s37-f3" as const;

export type WorkflowRuleReviewPacketStatus = "empty" | "ready" | "review";

export type WorkflowRuleReviewWarningCode =
  | "action_execution_disabled"
  | "match_limit_truncated"
  | "no_records_matched"
  | "preview_only"
  | "scan_limit_truncated";

export type WorkflowRuleReviewWarningSeverity = "info" | "watch";

export type WorkflowRuleReviewPacketReadFlags = {
  metadata: true;
  catalog: true;
  database: true;
  crmRecords: true;
  adapterInternals: false;
  runtimeEvaluation: true;
};

export type WorkflowRuleReviewPacketWriteFlags = WorkflowRuleDryRunWriteFlags;

export type WorkflowRuleReviewPacketSafety = WorkflowRuleDryRunSafety & {
  reviewOnly: true;
  operatorApprovalRequiredBeforeWrites: true;
};

export type WorkflowRuleReviewRuleMetadata = {
  entity: WorkflowRuleCatalogEntity;
  entityLabel: string;
  modelName: string;
  route: string;
  trigger: WorkflowRuleTrigger;
  catalogVersion: typeof WORKFLOW_RULE_CATALOG_VERSION;
  supportedTriggerCount: number;
  availableConditionCount: number;
  availableActionCount: number;
  selectedConditionCount: number;
  selectedActionCount: number;
};

export type WorkflowRuleReviewAffectedObjectCounts = {
  entity: WorkflowRuleCatalogEntity;
  totalCandidateCount: number;
  scannedRecordCount: number;
  matchedRecordCount: number;
  returnedRecordCount: number;
  matchLimit: number;
  scanLimit: number;
  truncated: boolean;
  scanTruncated: boolean;
  returnedRecordIds: readonly string[];
};

export type WorkflowRuleReviewActionCategorySummary = {
  category: WorkflowRuleActionCategory;
  actionCount: number;
  proposedActionCount: number;
  affectedRecordCount: number;
  actionKeys: readonly WorkflowRuleAction[];
  labels: readonly string[];
  wouldMutate: false;
  wouldCreateRecord: false;
  wouldSendMessage: false;
  wouldRecordAuditEvent: false;
  wouldExecuteAction: false;
};

export type WorkflowRuleReviewOperatorWarning = {
  code: WorkflowRuleReviewWarningCode;
  severity: WorkflowRuleReviewWarningSeverity;
  message: string;
};

export type WorkflowRuleReviewPacketSource = {
  catalogContentType: typeof WORKFLOW_RULE_CATALOG_CONTENT_TYPE;
  catalogVersion: typeof WORKFLOW_RULE_CATALOG_VERSION;
  catalogModule: "lib/server/workflowRuleCatalog.ts";
  dryRunContentType: typeof WORKFLOW_RULE_DRY_RUN_CONTENT_TYPE;
  dryRunVersion: typeof WORKFLOW_RULE_DRY_RUN_VERSION;
  dryRunModule: "lib/server/workflowRuleDryRun.ts";
  packetScope: "read-only-workflow-rule-review-packets";
  routeScope: readonly string[];
};

export type WorkflowRuleReviewPacket = {
  contentType: typeof WORKFLOW_RULE_REVIEW_PACKET_CONTENT_TYPE;
  packetType: "workflow-rule-review-packet";
  packetVersion: typeof WORKFLOW_RULE_REVIEW_PACKET_VERSION;
  generatedAt: string | null;
  status: WorkflowRuleReviewPacketStatus;
  warningCount: number;
  ruleMetadata: WorkflowRuleReviewRuleMetadata;
  affectedObjects: WorkflowRuleReviewAffectedObjectCounts;
  actionCategories: readonly WorkflowRuleReviewActionCategorySummary[];
  operatorWarnings: readonly WorkflowRuleReviewOperatorWarning[];
  dryRun: WorkflowRuleDryRunResult;
  source: WorkflowRuleReviewPacketSource;
  read: WorkflowRuleReviewPacketReadFlags;
  write: WorkflowRuleReviewPacketWriteFlags;
  safety: WorkflowRuleReviewPacketSafety;
};

type MutableActionCategorySummary = Omit<
  WorkflowRuleReviewActionCategorySummary,
  "actionKeys" | "labels"
> & {
  actionKeys: WorkflowRuleAction[];
  labels: string[];
};

function readFlags(): WorkflowRuleReviewPacketReadFlags {
  return {
    metadata: true,
    catalog: true,
    database: true,
    crmRecords: true,
    adapterInternals: false,
    runtimeEvaluation: true
  };
}

function writeFlags(
  dryRun: WorkflowRuleDryRunResult
): WorkflowRuleReviewPacketWriteFlags {
  return { ...dryRun.write };
}

function safetyFlags(
  dryRun: WorkflowRuleDryRunResult
): WorkflowRuleReviewPacketSafety {
  return {
    ...dryRun.safety,
    reviewOnly: true,
    operatorApprovalRequiredBeforeWrites: true
  };
}

function buildPacketStatus(
  dryRun: WorkflowRuleDryRunResult
): WorkflowRuleReviewPacketStatus {
  if (dryRun.matchedRecordCount === 0) {
    return "empty";
  }

  if (dryRun.truncated || dryRun.scanTruncated) {
    return "review";
  }

  return "ready";
}

function buildRuleMetadata(
  dryRun: WorkflowRuleDryRunResult
): WorkflowRuleReviewRuleMetadata {
  const catalog = getWorkflowRuleEntityCatalog(dryRun.entity);

  if (catalog === null) {
    throw new Error(`Workflow rule entity '${dryRun.entity}' is not supported.`);
  }

  return {
    entity: dryRun.entity,
    entityLabel: catalog.label,
    modelName: catalog.modelName,
    route: catalog.route,
    trigger: dryRun.trigger,
    catalogVersion: WORKFLOW_RULE_CATALOG_VERSION,
    supportedTriggerCount: catalog.triggerCount,
    availableConditionCount: catalog.conditionCount,
    availableActionCount: catalog.actionCount,
    selectedConditionCount: dryRun.conditionCount,
    selectedActionCount: dryRun.actionCount
  };
}

function buildAffectedObjectCounts(
  dryRun: WorkflowRuleDryRunResult
): WorkflowRuleReviewAffectedObjectCounts {
  return {
    entity: dryRun.entity,
    totalCandidateCount: dryRun.totalCandidateCount,
    scannedRecordCount: dryRun.scannedRecordCount,
    matchedRecordCount: dryRun.matchedRecordCount,
    returnedRecordCount: dryRun.returnedRecordCount,
    matchLimit: dryRun.matchLimit,
    scanLimit: dryRun.scanLimit,
    truncated: dryRun.truncated,
    scanTruncated: dryRun.scanTruncated,
    returnedRecordIds: dryRun.matchedRecords.map((record) => record.id)
  };
}

function emptyActionCategorySummary(
  action: WorkflowRuleDryRunProposedAction
): MutableActionCategorySummary {
  return {
    category: action.category,
    actionCount: 0,
    proposedActionCount: 0,
    affectedRecordCount: 0,
    actionKeys: [],
    labels: [],
    wouldMutate: false,
    wouldCreateRecord: false,
    wouldSendMessage: false,
    wouldRecordAuditEvent: false,
    wouldExecuteAction: false
  };
}

function buildActionCategorySummaries(
  actions: readonly WorkflowRuleDryRunProposedAction[]
): WorkflowRuleReviewActionCategorySummary[] {
  const categories = new Map<
    WorkflowRuleActionCategory,
    MutableActionCategorySummary
  >();

  for (const action of actions) {
    const existing =
      categories.get(action.category) ?? emptyActionCategorySummary(action);

    existing.actionCount += 1;
    existing.proposedActionCount += action.recordCount;
    existing.affectedRecordCount = Math.max(
      existing.affectedRecordCount,
      action.recordCount
    );
    existing.actionKeys.push(action.action);
    existing.labels.push(action.label);
    categories.set(action.category, existing);
  }

  return [...categories.values()].map((category) => ({
    ...category,
    actionKeys: [...category.actionKeys],
    labels: [...category.labels]
  }));
}

function buildOperatorWarnings(
  dryRun: WorkflowRuleDryRunResult
): WorkflowRuleReviewOperatorWarning[] {
  const warnings: WorkflowRuleReviewOperatorWarning[] = [
    {
      code: "preview_only",
      severity: "info",
      message: "Review packet is preview-only; no workflow rule is persisted."
    },
    {
      code: "action_execution_disabled",
      severity: "info",
      message: "Proposed workflow actions are summaries only and are not executed."
    }
  ];

  if (dryRun.matchedRecordCount === 0) {
    warnings.push({
      code: "no_records_matched",
      severity: "watch",
      message: "No CRM records matched the draft workflow rule conditions."
    });
  }

  if (dryRun.truncated) {
    warnings.push({
      code: "match_limit_truncated",
      severity: "watch",
      message:
        "Matched records exceeded the review packet limit; only the bounded sample is returned."
    });
  }

  if (dryRun.scanTruncated) {
    warnings.push({
      code: "scan_limit_truncated",
      severity: "watch",
      message:
        "Candidate scanning hit the dry-run scan limit; review counts may omit later records."
    });
  }

  return warnings;
}

function buildSource(): WorkflowRuleReviewPacketSource {
  const catalog = getWorkflowRuleCatalog();

  return {
    catalogContentType: WORKFLOW_RULE_CATALOG_CONTENT_TYPE,
    catalogVersion: WORKFLOW_RULE_CATALOG_VERSION,
    catalogModule: "lib/server/workflowRuleCatalog.ts",
    dryRunContentType: WORKFLOW_RULE_DRY_RUN_CONTENT_TYPE,
    dryRunVersion: WORKFLOW_RULE_DRY_RUN_VERSION,
    dryRunModule: "lib/server/workflowRuleDryRun.ts",
    packetScope: "read-only-workflow-rule-review-packets",
    routeScope: [...catalog.source.routeScope]
  };
}

export function buildWorkflowRuleReviewPacket(
  dryRun: WorkflowRuleDryRunResult
): WorkflowRuleReviewPacket {
  const operatorWarnings = buildOperatorWarnings(dryRun);

  return {
    contentType: WORKFLOW_RULE_REVIEW_PACKET_CONTENT_TYPE,
    packetType: "workflow-rule-review-packet",
    packetVersion: WORKFLOW_RULE_REVIEW_PACKET_VERSION,
    generatedAt: dryRun.generatedAt,
    status: buildPacketStatus(dryRun),
    warningCount: operatorWarnings.length,
    ruleMetadata: buildRuleMetadata(dryRun),
    affectedObjects: buildAffectedObjectCounts(dryRun),
    actionCategories: buildActionCategorySummaries(dryRun.proposedActions),
    operatorWarnings,
    dryRun,
    source: buildSource(),
    read: readFlags(),
    write: writeFlags(dryRun),
    safety: safetyFlags(dryRun)
  };
}

export async function getWorkflowRuleReviewPacket(
  input: unknown
): Promise<WorkflowRuleReviewPacket> {
  return buildWorkflowRuleReviewPacket(await dryRunWorkflowRule(input));
}
