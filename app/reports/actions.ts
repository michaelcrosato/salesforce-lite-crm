"use server";

import {
  getCsvDedupeReviewBundle,
  isCsvDedupeReviewBundleEntity,
  type CsvDedupeReviewBundle
} from "@/lib/server/csvDedupeReviewBundles";
import {
  executeCsvContactImportApply,
  type CsvContactImportManualApplyResult
} from "@/lib/server/csvImportApplyExecutor";
import {
  BULK_ACTION_DRY_RUN_REVIEW_PACKET_ACTIONS,
  getBulkActionDryRunReviewPacket,
  isBulkActionDryRunReviewPacketEntity,
  type BulkActionDryRunReviewPacket,
  type BulkActionDryRunReviewPacketAction,
  type BulkActionDryRunReviewPacketEntity
} from "@/lib/server/bulkActionDryRunReviewPackets";
import {
  executeBulkAction,
  isBulkActionExecutionAction,
  isBulkActionExecutionEntity,
  type BulkActionExecutionAction,
  type BulkActionExecutionEntity,
  type BulkActionExecutionResult
} from "@/lib/server/bulkActionExecution";
import {
  getWorkflowRuleExampleContract,
  isWorkflowRuleExampleEntity,
  type WorkflowRuleExampleContract
} from "@/lib/server/workflowRuleExamples";
import {
  getWorkflowRuleReviewPacket,
  type WorkflowRuleReviewPacket
} from "@/lib/server/workflowRuleReviewPackets";
import {
  executeWorkflowRuleManually,
  type WorkflowRuleManualExecutionResult
} from "@/lib/server/workflowRuleManualExecutor";
import {
  runSavedReportPreview,
  type SavedReportPreviewResult
} from "@/lib/server/savedReportPreviewRunner";

export type CsvImportPreviewActionResult =
  | {
      ok: true;
      message: string;
      bundle: CsvDedupeReviewBundle;
    }
  | {
      ok: false;
      message: string;
      fieldErrors?: {
        csv?: string[];
        entity?: string[];
      };
    };

export type CsvImportApplyActionResult =
  | {
      ok: true;
      message: string;
      execution: CsvContactImportManualApplyResult;
    }
  | {
      ok: false;
      message: string;
      fieldErrors?: {
        confirmation?: string[];
        csv?: string[];
        entity?: string[];
        target?: string[];
      };
    };

export type BulkActionDryRunReviewActionResult =
  | {
      ok: true;
      message: string;
      packet: BulkActionDryRunReviewPacket;
    }
  | {
      ok: false;
      message: string;
      fieldErrors?: {
        entity?: string[];
        action?: string[];
        recordIds?: string[];
        target?: string[];
      };
    };

export type BulkActionExecutionActionResult =
  | {
      ok: true;
      message: string;
      execution: BulkActionExecutionResult;
    }
  | {
      ok: false;
      message: string;
      fieldErrors?: {
        confirmation?: string[];
        entity?: string[];
        action?: string[];
        recordIds?: string[];
        target?: string[];
      };
    };

export type WorkflowRuleDryRunActionResult =
  | {
      ok: true;
      message: string;
      example: WorkflowRuleExampleContract;
      packet: WorkflowRuleReviewPacket;
    }
  | {
      ok: false;
      message: string;
      fieldErrors?: {
        exampleEntity?: string[];
        target?: string[];
      };
    };

export type WorkflowRuleExecutionActionResult =
  | {
      ok: true;
      message: string;
      execution: WorkflowRuleManualExecutionResult;
    }
  | {
      ok: false;
      message: string;
      fieldErrors?: {
        confirmation?: string[];
        exampleEntity?: string[];
        target?: string[];
      };
    };

export type SavedReportPreviewActionResult =
  | {
      ok: true;
      message: string;
      preview: SavedReportPreviewResult;
    }
  | {
      ok: false;
      message: string;
      preview?: SavedReportPreviewResult;
      fieldErrors?: {
        entity?: string[];
        fields?: string[];
        target?: string[];
      };
    };

const CSV_IMPORT_PREVIEW_SAMPLE_LIMIT = 10;
const CSV_IMPORT_APPLY_CONFIRMATION_VALUE = "confirmed";
const CSV_IMPORT_APPLY_ACTOR_USER_ID = "user-ava";
const BULK_EXECUTION_CONFIRMATION_VALUE = "confirmed";
const WORKFLOW_EXECUTION_CONFIRMATION_VALUE = "confirmed";
const WORKFLOW_EXECUTION_ACTOR_USER_ID = "user-ava";

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

function formStrings(formData: FormData, key: string): string[] {
  return formData
    .getAll(key)
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

function isBulkActionDryRunReviewPacketAction(
  value: string
): value is BulkActionDryRunReviewPacketAction {
  return (
    BULK_ACTION_DRY_RUN_REVIEW_PACKET_ACTIONS as readonly string[]
  ).includes(value);
}

function parseRecordIds(value: string): string[] {
  return value
    .split(/[\s,]+/)
    .map((recordId) => recordId.trim())
    .filter((recordId) => recordId.length > 0);
}

function optionalActionString(value: string): string | undefined {
  const normalized = value.trim();

  return normalized.length > 0 ? normalized : undefined;
}

type BulkActionDryRunReviewInput = {
  entity: BulkActionDryRunReviewPacketEntity;
  action: BulkActionDryRunReviewPacketAction;
  recordIds: string[];
  targetStatus?: string;
  targetStage?: string;
  targetOwnerId?: string;
  taskTitle?: string;
};

type BulkActionExecutionInput = Omit<
  BulkActionDryRunReviewInput,
  "entity" | "action"
> & {
  entity: BulkActionExecutionEntity;
  action: BulkActionExecutionAction;
};

function optionalFormString(
  formData: FormData,
  key: keyof Omit<
    BulkActionDryRunReviewInput,
    "entity" | "action" | "recordIds"
  >
): string | undefined {
  const value = formString(formData, key).trim();

  return value.length > 0 ? value : undefined;
}

export async function previewBulkActionDryRunReviewAction(
  formData: FormData
): Promise<BulkActionDryRunReviewActionResult> {
  const entity = formString(formData, "entity");
  const action = formString(formData, "action");
  const recordIds = parseRecordIds(formString(formData, "recordIds"));

  if (!isBulkActionDryRunReviewPacketEntity(entity)) {
    return {
      ok: false,
      message: "Choose a supported bulk action entity.",
      fieldErrors: {
        entity: ["Choose a supported bulk action entity."]
      }
    };
  }

  if (!isBulkActionDryRunReviewPacketAction(action)) {
    return {
      ok: false,
      message: "Choose a supported bulk action.",
      fieldErrors: {
        action: ["Choose a supported bulk action."]
      }
    };
  }

  if (recordIds.length === 0) {
    return {
      ok: false,
      message: "Enter at least one selected record ID.",
      fieldErrors: {
        recordIds: ["Enter at least one selected record ID."]
      }
    };
  }

  const input: BulkActionDryRunReviewInput = {
    entity,
    action,
    recordIds,
    targetStatus: optionalFormString(formData, "targetStatus"),
    targetStage: optionalFormString(formData, "targetStage"),
    targetOwnerId: optionalFormString(formData, "targetOwnerId"),
    taskTitle: optionalFormString(formData, "taskTitle")
  };

  try {
    const packet = await getBulkActionDryRunReviewPacket(input);

    return {
      ok: true,
      message: `${packet.entityMetadata.label} ${packet.actionMetadata.label}: ${packet.rollup.eligibleCount} eligible, ${packet.rollup.blockedCount} blocked.`,
      packet
    };
  } catch {
    return {
      ok: false,
      message: "The bulk dry-run review packet could not be built.",
      fieldErrors: {
        target: ["Review the selected action target and record IDs."]
      }
    };
  }
}

export async function executeBulkActionOperatorAction(
  formData: FormData
): Promise<BulkActionExecutionActionResult> {
  const confirmation = formString(formData, "confirmExecution");
  const entity = formString(formData, "entity");
  const action = formString(formData, "action");
  const recordIds = parseRecordIds(formString(formData, "recordIds"));

  if (confirmation !== BULK_EXECUTION_CONFIRMATION_VALUE) {
    return {
      ok: false,
      message: "Confirm execution before running the bulk action.",
      fieldErrors: {
        confirmation: ["Confirm execution before running the bulk action."]
      }
    };
  }

  if (!isBulkActionExecutionEntity(entity)) {
    return {
      ok: false,
      message: "Choose a supported bulk execution entity.",
      fieldErrors: {
        entity: ["Choose a supported bulk execution entity."]
      }
    };
  }

  if (!isBulkActionExecutionAction(action)) {
    return {
      ok: false,
      message: "Choose a supported executable bulk action.",
      fieldErrors: {
        action: ["Choose a supported executable bulk action."]
      }
    };
  }

  if (recordIds.length === 0) {
    return {
      ok: false,
      message: "Enter at least one selected record ID.",
      fieldErrors: {
        recordIds: ["Enter at least one selected record ID."]
      }
    };
  }

  const input: BulkActionExecutionInput = {
    entity,
    action,
    recordIds,
    targetStatus: optionalFormString(formData, "targetStatus"),
    targetStage: optionalFormString(formData, "targetStage"),
    targetOwnerId: optionalFormString(formData, "targetOwnerId"),
    taskTitle: optionalFormString(formData, "taskTitle")
  };

  try {
    const execution = await executeBulkAction(input);

    return {
      ok: true,
      message: `${execution.action} execution for ${execution.entity}: ${execution.rollup.executedCount} executed, ${execution.rollup.skippedCount} skipped, ${execution.rollup.blockedCount} blocked.`,
      execution
    };
  } catch {
    return {
      ok: false,
      message: "The bulk action could not be executed.",
      fieldErrors: {
        target: ["Review the selected action target and record IDs."]
      }
    };
  }
}

export async function previewCsvImportReviewAction(
  formData: FormData
): Promise<CsvImportPreviewActionResult> {
  const entity = formString(formData, "entity");
  const csv = formString(formData, "csv");

  if (!isCsvDedupeReviewBundleEntity(entity)) {
    return {
      ok: false,
      message: "Choose a supported import entity.",
      fieldErrors: {
        entity: ["Choose a supported import entity."]
      }
    };
  }

  if (csv.trim().length === 0) {
    return {
      ok: false,
      message: "Paste or select a CSV file before previewing.",
      fieldErrors: {
        csv: ["Paste or select a CSV file before previewing."]
      }
    };
  }

  try {
    const bundle = await getCsvDedupeReviewBundle(entity, csv, {
      sampleLimit: CSV_IMPORT_PREVIEW_SAMPLE_LIMIT
    });
    const { safeRows, watchRows, blockRows } = bundle.operatorSummary;

    return {
      ok: true,
      message: `${bundle.label} preview: ${safeRows} safe, ${watchRows} watch, ${blockRows} block.`,
      bundle
    };
  } catch {
    return {
      ok: false,
      message: "The CSV preview could not be built."
    };
  }
}

export async function previewSavedReportDefinitionAction(
  formData: FormData
): Promise<SavedReportPreviewActionResult> {
  const entity = formString(formData, "entity").trim();
  const name = optionalActionString(formString(formData, "name"));
  const fields = formStrings(formData, "fields");
  const filterKey = formString(formData, "filterKey").trim();
  const filterValue = formString(formData, "filterValue").trim();
  const groupBy = formStrings(formData, "groupBy");
  const chartType = formString(formData, "chartType").trim();
  const chartDimension = optionalActionString(
    formString(formData, "chartDimension")
  );
  const chartMetric = optionalActionString(formString(formData, "chartMetric"));
  const limit = formString(formData, "limit").trim();

  if (!entity) {
    return {
      ok: false,
      message: "Choose a saved report entity.",
      fieldErrors: {
        entity: ["Choose a saved report entity."]
      }
    };
  }

  if (fields.length === 0) {
    return {
      ok: false,
      message: "Choose at least one saved report field.",
      fieldErrors: {
        fields: ["Choose at least one saved report field."]
      }
    };
  }

  const filters: Record<string, string> = {};

  if (filterKey.length > 0 && filterValue.length > 0) {
    filters[filterKey] = filterValue;
  }

  const chart = chartType.length > 0 ? buildChartInput(chartType, {
    dimensionKey: chartDimension,
    metricKey: chartMetric
  }) : undefined;

  try {
    const preview = await runSavedReportPreview({
      entity,
      name,
      fields,
      filters,
      groupBy,
      chart,
      limit: limit.length > 0 ? limit : undefined
    });

    if (preview.status === "invalid") {
      return {
        ok: false,
        message: "Saved report preview validation failed.",
        preview
      };
    }

    return {
      ok: true,
      message: `${preview.definition?.label ?? "Saved report"} preview: ${preview.rowCount} rows, ${preview.aggregates.length} aggregates.`,
      preview
    };
  } catch {
    return {
      ok: false,
      message: "The saved report preview could not be built.",
      fieldErrors: {
        target: ["Review the selected entity, fields, filters, and chart."]
      }
    };
  }
}

function buildChartInput(
  type: string,
  options: {
    dimensionKey?: string;
    metricKey?: string;
  }
): Record<string, string> {
  const chart: Record<string, string> = {
    type
  };

  if (options.dimensionKey) {
    chart.dimensionKey = options.dimensionKey;
  }

  if (options.metricKey) {
    chart.metricKey = options.metricKey;
  }

  return chart;
}

export async function executeCsvImportApplyOperatorAction(
  formData: FormData
): Promise<CsvImportApplyActionResult> {
  const confirmation = formString(formData, "confirmApply");
  const entity = formString(formData, "entity");
  const csv = formString(formData, "csv");

  if (confirmation !== CSV_IMPORT_APPLY_CONFIRMATION_VALUE) {
    return {
      ok: false,
      message: "Confirm contact apply before creating CSV contacts.",
      fieldErrors: {
        confirmation: ["Confirm contact apply before creating CSV contacts."]
      }
    };
  }

  if (entity !== "contacts") {
    return {
      ok: false,
      message: "CSV apply is available for contact create-safe rows only.",
      fieldErrors: {
        entity: ["CSV apply is available for contact create-safe rows only."]
      }
    };
  }

  if (csv.trim().length === 0) {
    return {
      ok: false,
      message: "Paste or select a CSV file before applying.",
      fieldErrors: {
        csv: ["Paste or select a CSV file before applying."]
      }
    };
  }

  try {
    const approvedAt = new Date();
    const execution = await executeCsvContactImportApply({
      entity: "contacts",
      csv,
      generatedAt: approvedAt,
      approval: {
        approved: true,
        actorUserId: CSV_IMPORT_APPLY_ACTOR_USER_ID,
        approvedAt,
        note: "Operator confirmed contact CSV import apply from reports."
      }
    });

    return {
      ok: true,
      message: `Contact CSV apply: ${execution.summary.createdRows} created, ${execution.summary.skippedRows} skipped, ${execution.summary.blockedRows} blocked.`,
      execution
    };
  } catch {
    return {
      ok: false,
      message: "The contact CSV apply could not be completed.",
      fieldErrors: {
        target: ["Review the contact CSV preview before applying."]
      }
    };
  }
}

export async function previewWorkflowRuleDryRunAction(
  formData: FormData
): Promise<WorkflowRuleDryRunActionResult> {
  const exampleEntity = formString(formData, "exampleEntity");

  if (!isWorkflowRuleExampleEntity(exampleEntity)) {
    return {
      ok: false,
      message: "Choose a supported workflow example.",
      fieldErrors: {
        exampleEntity: ["Choose a supported workflow example."]
      }
    };
  }

  const example = getWorkflowRuleExampleContract(exampleEntity);

  if (example === null) {
    return {
      ok: false,
      message: "The workflow example could not be found.",
      fieldErrors: {
        exampleEntity: ["The workflow example could not be found."]
      }
    };
  }

  try {
    const packet = await getWorkflowRuleReviewPacket(example.rule);

    return {
      ok: true,
      message: `${packet.ruleMetadata.entityLabel} workflow dry run: ${packet.affectedObjects.matchedRecordCount} matched, ${packet.dryRun.proposedActions.length} action summaries.`,
      example,
      packet
    };
  } catch {
    return {
      ok: false,
      message: "The workflow dry-run review packet could not be built.",
      fieldErrors: {
        target: ["Review the selected workflow example."]
      }
    };
  }
}

export async function executeWorkflowRuleOperatorAction(
  formData: FormData
): Promise<WorkflowRuleExecutionActionResult> {
  const confirmation = formString(formData, "confirmExecution");
  const exampleEntity = formString(formData, "exampleEntity");

  if (confirmation !== WORKFLOW_EXECUTION_CONFIRMATION_VALUE) {
    return {
      ok: false,
      message: "Confirm execution before running the workflow action.",
      fieldErrors: {
        confirmation: ["Confirm execution before running the workflow action."]
      }
    };
  }

  if (!isWorkflowRuleExampleEntity(exampleEntity)) {
    return {
      ok: false,
      message: "Choose a supported workflow example.",
      fieldErrors: {
        exampleEntity: ["Choose a supported workflow example."]
      }
    };
  }

  const example = getWorkflowRuleExampleContract(exampleEntity);

  if (example === null) {
    return {
      ok: false,
      message: "The workflow example could not be found.",
      fieldErrors: {
        exampleEntity: ["The workflow example could not be found."]
      }
    };
  }

  try {
    const execution = await executeWorkflowRuleManually({
      ...example.rule,
      approval: {
        approved: true,
        actorUserId: WORKFLOW_EXECUTION_ACTOR_USER_ID,
        approvedAt: new Date(),
        note: `Operator confirmed ${example.label} from the reports workflow panel.`
      }
    });

    return {
      ok: true,
      message: `${example.entityLabel} workflow execution: ${execution.summary.executedRecordActionCount} executed, ${execution.summary.blockedActionCount} blocked actions, ${execution.summary.auditEventCount} audit events.`,
      execution
    };
  } catch {
    return {
      ok: false,
      message: "The workflow execution could not be completed.",
      fieldErrors: {
        target: ["Review the selected workflow example and dry-run packet."]
      }
    };
  }
}
