import {
  type WorkflowRuleAction,
  type WorkflowRuleActionCategory
} from "@/lib/server/workflowRuleCatalog";
import {
  WORKFLOW_RULE_REVIEW_PACKET_CONTENT_TYPE,
  WORKFLOW_RULE_REVIEW_PACKET_VERSION,
  getWorkflowRuleReviewPacket,
  type WorkflowRuleReviewPacket,
  type WorkflowRuleReviewPacketReadFlags,
  type WorkflowRuleReviewPacketSafety,
  type WorkflowRuleReviewPacketWriteFlags
} from "@/lib/server/workflowRuleReviewPackets";
import {
  type WorkflowRuleDryRunProposedAction,
  type WorkflowRuleDryRunRecordReference
} from "@/lib/server/workflowRuleDryRun";

export const WORKFLOW_RULE_EXECUTION_RECEIPT_CONTENT_TYPE =
  "application/json; charset=utf-8" as const;

export const WORKFLOW_RULE_EXECUTION_RECEIPT_VERSION =
  "2026-05-25.s38-f3" as const;

export type WorkflowRuleExecutionReadinessStatus =
  | "blocked"
  | "eligible"
  | "review";

export type WorkflowRuleExecutionBlockReasonCode =
  | "current_execution_disabled"
  | "matched_records_truncated"
  | "no_records_matched"
  | "scan_limit_truncated";

export type WorkflowRuleExecutionReceiptReadFlags =
  WorkflowRuleReviewPacketReadFlags & {
    reviewPacket: true;
    auditIntent: true;
  };

export type WorkflowRuleExecutionReceiptWriteFlags =
  WorkflowRuleReviewPacketWriteFlags & {
    actionApprovals: false;
    executorRuns: false;
    executionReceipts: false;
  };

export type WorkflowRuleExecutionReceiptSafety =
  WorkflowRuleReviewPacketSafety & {
    auditIntentOnly: true;
    currentExecution: false;
    manualExecutorOnly: true;
    operatorApprovalRequired: true;
  };

export type WorkflowRuleExecutionAuditIntent = {
  intentType: "workflow-action-audit-intent";
  action: WorkflowRuleAction;
  category: WorkflowRuleActionCategory;
  eventCategory: "workflow";
  eventAction: "workflow_action_execute";
  requiredForFutureExecution: boolean;
  actorRequired: true;
  approvalRequired: true;
  recordCount: number;
  recordIds: readonly string[];
  target: {
    kind: WorkflowRuleDryRunProposedAction["target"]["kind"];
    fieldPath: readonly string[] | null;
    targetValue: string | null;
    title: string | null;
    message: string | null;
    priority: string | null;
    reason: string | null;
    externalDelivery: false;
  };
  wouldWriteNow: false;
};

export type WorkflowRuleExecutionActionReceipt = {
  action: WorkflowRuleAction;
  label: string;
  category: WorkflowRuleActionCategory;
  status: Exclude<WorkflowRuleExecutionReadinessStatus, "review">;
  recordCount: number;
  recordIds: readonly string[];
  blockReasons: readonly WorkflowRuleExecutionBlockReasonCode[];
  futureManualExecutorEligible: boolean;
  currentExecutionAllowed: false;
  auditIntent: WorkflowRuleExecutionAuditIntent;
  wouldMutate: false;
  wouldCreateRecord: false;
  wouldSendMessage: false;
  wouldRecordAuditEventNow: false;
  wouldExecuteActionNow: false;
};

export type WorkflowRuleExecutionCategoryReceipt = {
  category: WorkflowRuleActionCategory;
  actionCount: number;
  eligibleActionCount: number;
  blockedActionCount: number;
  recordCount: number;
  actionKeys: readonly WorkflowRuleAction[];
};

export type WorkflowRuleExecutionReceiptSource = {
  reviewPacketContentType: typeof WORKFLOW_RULE_REVIEW_PACKET_CONTENT_TYPE;
  reviewPacketVersion: typeof WORKFLOW_RULE_REVIEW_PACKET_VERSION;
  reviewPacketModule: "lib/server/workflowRuleReviewPackets.ts";
  receiptScope: "read-only-workflow-execution-readiness-receipts";
  routeScope: readonly string[];
};

export type WorkflowRuleExecutionReceiptSummary = {
  entity: WorkflowRuleReviewPacket["ruleMetadata"]["entity"];
  trigger: WorkflowRuleReviewPacket["ruleMetadata"]["trigger"];
  matchedRecordCount: number;
  returnedRecordCount: number;
  proposedActionCount: number;
  eligibleActionCount: number;
  blockedActionCount: number;
  auditIntentCount: number;
  currentExecutionAllowed: false;
  futureManualExecutorEligible: boolean;
  operatorApprovalRequired: true;
};

export type WorkflowRuleExecutionReadinessReceipt = {
  contentType: typeof WORKFLOW_RULE_EXECUTION_RECEIPT_CONTENT_TYPE;
  receiptType: "workflow-rule-execution-readiness-receipt";
  receiptVersion: typeof WORKFLOW_RULE_EXECUTION_RECEIPT_VERSION;
  generatedAt: string | null;
  status: WorkflowRuleExecutionReadinessStatus;
  summary: WorkflowRuleExecutionReceiptSummary;
  actions: readonly WorkflowRuleExecutionActionReceipt[];
  categories: readonly WorkflowRuleExecutionCategoryReceipt[];
  auditIntents: readonly WorkflowRuleExecutionAuditIntent[];
  reviewPacket: WorkflowRuleReviewPacket;
  source: WorkflowRuleExecutionReceiptSource;
  read: WorkflowRuleExecutionReceiptReadFlags;
  write: WorkflowRuleExecutionReceiptWriteFlags;
  safety: WorkflowRuleExecutionReceiptSafety;
};

type MutableCategoryReceipt = {
  category: WorkflowRuleActionCategory;
  actionCount: number;
  eligibleActionCount: number;
  blockedActionCount: number;
  recordCount: number;
  actionKeys: WorkflowRuleAction[];
};

export function buildWorkflowRuleExecutionReadinessReceipt(
  reviewPacket: WorkflowRuleReviewPacket
): WorkflowRuleExecutionReadinessReceipt {
  const actions = reviewPacket.dryRun.proposedActions.map((action) =>
    buildActionReceipt(action, reviewPacket.dryRun.matchedRecords, reviewPacket)
  );
  const eligibleActionCount = actions.filter(
    (action) => action.status === "eligible"
  ).length;
  const blockedActionCount = actions.length - eligibleActionCount;

  return {
    contentType: WORKFLOW_RULE_EXECUTION_RECEIPT_CONTENT_TYPE,
    receiptType: "workflow-rule-execution-readiness-receipt",
    receiptVersion: WORKFLOW_RULE_EXECUTION_RECEIPT_VERSION,
    generatedAt: reviewPacket.generatedAt,
    status: receiptStatus(reviewPacket, eligibleActionCount, blockedActionCount),
    summary: {
      entity: reviewPacket.ruleMetadata.entity,
      trigger: reviewPacket.ruleMetadata.trigger,
      matchedRecordCount: reviewPacket.affectedObjects.matchedRecordCount,
      returnedRecordCount: reviewPacket.affectedObjects.returnedRecordCount,
      proposedActionCount: actions.length,
      eligibleActionCount,
      blockedActionCount,
      auditIntentCount: actions.length,
      currentExecutionAllowed: false,
      futureManualExecutorEligible: eligibleActionCount > 0,
      operatorApprovalRequired: true
    },
    actions,
    categories: buildCategoryReceipts(actions),
    auditIntents: actions.map((action) => action.auditIntent),
    reviewPacket,
    source: {
      reviewPacketContentType: WORKFLOW_RULE_REVIEW_PACKET_CONTENT_TYPE,
      reviewPacketVersion: WORKFLOW_RULE_REVIEW_PACKET_VERSION,
      reviewPacketModule: "lib/server/workflowRuleReviewPackets.ts",
      receiptScope: "read-only-workflow-execution-readiness-receipts",
      routeScope: [...reviewPacket.source.routeScope]
    },
    read: readFlags(reviewPacket),
    write: writeFlags(reviewPacket),
    safety: safetyFlags(reviewPacket)
  };
}

export async function getWorkflowRuleExecutionReadinessReceipt(
  input: unknown
): Promise<WorkflowRuleExecutionReadinessReceipt> {
  return buildWorkflowRuleExecutionReadinessReceipt(
    await getWorkflowRuleReviewPacket(input)
  );
}

function buildActionReceipt(
  action: WorkflowRuleDryRunProposedAction,
  matchedRecords: readonly WorkflowRuleDryRunRecordReference[],
  reviewPacket: WorkflowRuleReviewPacket
): WorkflowRuleExecutionActionReceipt {
  const blockReasons = blockReasonsForAction(action, reviewPacket);
  const recordIds = matchedRecords.map((record) => record.id);
  const futureManualExecutorEligible =
    action.recordCount > 0 && blockReasons.length === 1;
  const status = futureManualExecutorEligible ? "eligible" : "blocked";

  return {
    action: action.action,
    label: action.label,
    category: action.category,
    status,
    recordCount: action.recordCount,
    recordIds,
    blockReasons,
    futureManualExecutorEligible,
    currentExecutionAllowed: false,
    auditIntent: {
      intentType: "workflow-action-audit-intent",
      action: action.action,
      category: action.category,
      eventCategory: "workflow",
      eventAction: "workflow_action_execute",
      requiredForFutureExecution: futureManualExecutorEligible,
      actorRequired: true,
      approvalRequired: true,
      recordCount: action.recordCount,
      recordIds,
      target: {
        kind: action.target.kind,
        fieldPath: action.target.fieldPath ? [...action.target.fieldPath] : null,
        targetValue: action.target.targetValue,
        title: action.target.title,
        message: action.target.message,
        priority: action.target.priority,
        reason: action.target.reason,
        externalDelivery: false
      },
      wouldWriteNow: false
    },
    wouldMutate: false,
    wouldCreateRecord: false,
    wouldSendMessage: false,
    wouldRecordAuditEventNow: false,
    wouldExecuteActionNow: false
  };
}

function blockReasonsForAction(
  action: WorkflowRuleDryRunProposedAction,
  reviewPacket: WorkflowRuleReviewPacket
): WorkflowRuleExecutionBlockReasonCode[] {
  const reasons: WorkflowRuleExecutionBlockReasonCode[] = [
    "current_execution_disabled"
  ];

  if (action.recordCount === 0) {
    reasons.push("no_records_matched");
  }

  if (reviewPacket.affectedObjects.truncated) {
    reasons.push("matched_records_truncated");
  }

  if (reviewPacket.affectedObjects.scanTruncated) {
    reasons.push("scan_limit_truncated");
  }

  return reasons;
}

function buildCategoryReceipts(
  actions: readonly WorkflowRuleExecutionActionReceipt[]
): WorkflowRuleExecutionCategoryReceipt[] {
  const categories = new Map<WorkflowRuleActionCategory, MutableCategoryReceipt>();

  for (const action of actions) {
    const current =
      categories.get(action.category) ?? emptyCategoryReceipt(action.category);

    current.actionCount += 1;
    current.recordCount += action.recordCount;
    current.actionKeys.push(action.action);

    if (action.status === "eligible") {
      current.eligibleActionCount += 1;
    } else {
      current.blockedActionCount += 1;
    }

    categories.set(action.category, current);
  }

  return [...categories.values()].map((category) => ({
    ...category,
    actionKeys: [...category.actionKeys]
  }));
}

function emptyCategoryReceipt(
  category: WorkflowRuleActionCategory
): MutableCategoryReceipt {
  return {
    category,
    actionCount: 0,
    eligibleActionCount: 0,
    blockedActionCount: 0,
    recordCount: 0,
    actionKeys: []
  };
}

function receiptStatus(
  reviewPacket: WorkflowRuleReviewPacket,
  eligibleActionCount: number,
  blockedActionCount: number
): WorkflowRuleExecutionReadinessStatus {
  if (
    eligibleActionCount === 0 &&
    reviewPacket.affectedObjects.matchedRecordCount === 0
  ) {
    return "blocked";
  }

  if (
    blockedActionCount > 0 ||
    reviewPacket.affectedObjects.truncated ||
    reviewPacket.affectedObjects.scanTruncated
  ) {
    return "review";
  }

  return "eligible";
}

function readFlags(
  reviewPacket: WorkflowRuleReviewPacket
): WorkflowRuleExecutionReceiptReadFlags {
  return {
    ...reviewPacket.read,
    reviewPacket: true,
    auditIntent: true
  };
}

function writeFlags(
  reviewPacket: WorkflowRuleReviewPacket
): WorkflowRuleExecutionReceiptWriteFlags {
  return {
    ...reviewPacket.write,
    actionApprovals: false,
    executorRuns: false,
    executionReceipts: false
  };
}

function safetyFlags(
  reviewPacket: WorkflowRuleReviewPacket
): WorkflowRuleExecutionReceiptSafety {
  return {
    ...reviewPacket.safety,
    auditIntentOnly: true,
    currentExecution: false,
    manualExecutorOnly: true,
    operatorApprovalRequired: true
  };
}
