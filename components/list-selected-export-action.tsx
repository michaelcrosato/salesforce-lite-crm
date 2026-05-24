"use client";

import {
  AlertTriangle,
  CheckCircle2,
  CheckSquare,
  ClipboardCheck,
  Download,
  Play,
  Square,
  X
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  executeListBulkExecutionAction,
  previewListBulkExecutionAction,
  previewListSelectedExportAction,
  type ListBulkExecutionActionResult,
  type ListBulkExecutionPreviewActionResult,
  type ListSelectedExportActionResult
} from "@/app/list-selected-export-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  ACCOUNT_STATUSES,
  CONTACT_STATUSES,
  DEAL_STAGES,
  LEAD_STATUSES
} from "@/lib/crm-constants";
import {
  CAMPAIGN_STATUSES,
  CASE_STATUSES,
  TASK_STATUSES
} from "@/lib/crm/registry";
import type {
  BulkActionExecutionAction,
  BulkActionExecutionEntity,
  BulkActionExecutionResult,
  BulkActionExecutionStatus
} from "@/lib/server/bulkActionExecution";
import type {
  BulkActionDryRunReviewPacket,
  BulkActionDryRunReviewPacketStatus
} from "@/lib/server/bulkActionDryRunReviewPackets";
import type { BulkActionSelectedExportPacketEntity } from "@/lib/server/bulkActionSelectedExportPackets";
import { cn } from "@/lib/utils";

export type ListSelectedExportRecord = {
  id: string;
  label: string;
};

type ListBulkActionEntity =
  BulkActionSelectedExportPacketEntity & BulkActionExecutionEntity;

export type ListSelectedExportActionProps = {
  entity: ListBulkActionEntity;
  entityLabel: string;
  records: readonly ListSelectedExportRecord[];
  className?: string;
};

type TargetConfig = {
  field: "targetStatus" | "targetStage" | "targetOwnerId" | "taskTitle";
  label: string;
  options?: readonly string[];
  placeholder?: string;
};

type TargetValues = {
  targetStatus: string;
  targetStage: string;
  targetOwnerId: string;
  taskTitle: string;
};

const DEFAULT_TASK_TITLE = "Follow up selected records";

const EXECUTION_ACTION_LABELS = {
  status_update: "Status update",
  stage_update: "Stage update",
  owner_assignment: "Owner assignment",
  task_creation: "Task creation"
} satisfies Record<BulkActionExecutionAction, string>;

const EXECUTION_ACTIONS_BY_ENTITY = {
  accounts: ["status_update", "owner_assignment", "task_creation"],
  contacts: ["status_update", "task_creation"],
  opportunities: ["stage_update", "owner_assignment", "task_creation"],
  leads: ["status_update", "task_creation"],
  activities: [],
  "dealer-orders": [],
  areas: [],
  tasks: ["status_update", "owner_assignment"],
  cases: ["status_update", "owner_assignment"],
  campaigns: ["status_update", "owner_assignment"]
} satisfies Record<ListBulkActionEntity, readonly BulkActionExecutionAction[]>;

const STATUS_OPTIONS_BY_ENTITY: Partial<
  Record<ListBulkActionEntity, readonly string[]>
> = {
  accounts: ACCOUNT_STATUSES,
  contacts: CONTACT_STATUSES,
  leads: LEAD_STATUSES,
  tasks: TASK_STATUSES,
  cases: CASE_STATUSES,
  campaigns: CAMPAIGN_STATUSES
};

export function ListSelectedExportAction({
  entity,
  entityLabel,
  records,
  className
}: ListSelectedExportActionProps) {
  const visibleRecords = useMemo(() => dedupeRecords(records), [records]);
  const [selectedIds, setSelectedIds] = useState<readonly string[] | null>(null);
  const [exportResult, setExportResult] =
    useState<ListSelectedExportActionResult | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const actionOptions = useMemo(() => executionActionsForEntity(entity), [entity]);
  const [selectedExecutionAction, setSelectedExecutionAction] =
    useState<BulkActionExecutionAction | null>(() =>
      defaultExecutionAction(entity)
    );
  const activeExecutionAction =
    selectedExecutionAction && actionOptions.includes(selectedExecutionAction)
      ? selectedExecutionAction
      : actionOptions[0] ?? null;
  const [targetValues, setTargetValues] = useState<TargetValues>(() =>
    defaultTargetValues(entity, activeExecutionAction)
  );
  const [previewResult, setPreviewResult] =
    useState<ListBulkExecutionPreviewActionResult | null>(null);
  const [executionResult, setExecutionResult] =
    useState<ListBulkExecutionActionResult | null>(null);
  const [executionConfirmed, setExecutionConfirmed] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  const visibleRecordIds = useMemo(
    () => visibleRecords.map((record) => record.id),
    [visibleRecords]
  );
  const selectedIdSet = useMemo(
    () => new Set(selectedIds ?? visibleRecordIds),
    [selectedIds, visibleRecordIds]
  );
  const selectedRecords = useMemo(
    () => visibleRecords.filter((record) => selectedIdSet.has(record.id)),
    [selectedIdSet, visibleRecords]
  );
  const exportTestIdPrefix = `${entity}-selected-export`;
  const executionTestIdPrefix = `${entity}-bulk-execution`;
  const bulkFieldErrors = bulkExecutionFieldErrors(
    previewResult,
    executionResult
  );
  const targetConfig = activeExecutionAction
    ? targetConfigForAction(entity, activeExecutionAction)
    : null;

  function clearBulkState() {
    setPreviewResult(null);
    setExecutionResult(null);
    setExecutionConfirmed(false);
  }

  function clearActionState() {
    setExportResult(null);
    clearBulkState();
  }

  function setAllSelected() {
    setSelectedIds(null);
    clearActionState();
  }

  function clearSelection() {
    setSelectedIds([]);
    clearActionState();
  }

  function toggleRecord(recordId: string) {
    setSelectedIds((current) => {
      const currentIds = current ?? visibleRecordIds;

      return currentIds.includes(recordId)
        ? currentIds.filter((id) => id !== recordId)
        : [...currentIds, recordId];
    });
    clearActionState();
  }

  function updateExecutionAction(action: BulkActionExecutionAction) {
    setSelectedExecutionAction(action);
    setTargetValues(defaultTargetValues(entity, action));
    clearBulkState();
  }

  function updateTargetValue(field: keyof TargetValues, value: string) {
    setTargetValues((current) => ({ ...current, [field]: value }));
    clearBulkState();
  }

  function buildBulkExecutionFormData(confirmExecution: boolean): FormData {
    const formData = new FormData();

    formData.set("entity", entity);
    if (activeExecutionAction) {
      formData.set("action", activeExecutionAction);
    }
    selectedRecords.forEach((record) => {
      formData.append("recordIds", record.id);
    });
    formData.set("targetStatus", targetValues.targetStatus);
    formData.set("targetStage", targetValues.targetStage);
    formData.set("targetOwnerId", targetValues.targetOwnerId);
    formData.set("taskTitle", targetValues.taskTitle);
    if (confirmExecution) {
      formData.set("confirmExecution", "confirmed");
    }

    return formData;
  }

  async function exportSelected() {
    const formData = new FormData();
    formData.set("entity", entity);
    selectedRecords.forEach((record) => {
      formData.append("recordIds", record.id);
    });

    setIsExporting(true);

    try {
      const actionResult = await previewListSelectedExportAction(formData);
      setExportResult(actionResult);

      if (actionResult.ok && actionResult.rowCount > 0) {
        downloadCsv(actionResult);
      }
    } finally {
      setIsExporting(false);
    }
  }

  async function previewBulkExecution() {
    setIsPreviewing(true);

    try {
      const actionResult = await previewListBulkExecutionAction(
        buildBulkExecutionFormData(false)
      );
      setPreviewResult(actionResult);
      setExecutionResult(null);
      setExecutionConfirmed(false);
    } finally {
      setIsPreviewing(false);
    }
  }

  async function executeBulkExecution() {
    setIsExecuting(true);

    try {
      const actionResult = await executeListBulkExecutionAction(
        buildBulkExecutionFormData(executionConfirmed)
      );
      setExecutionResult(actionResult);
    } finally {
      setIsExecuting(false);
    }
  }

  if (visibleRecords.length === 0) {
    return null;
  }

  return (
    <section
      className={cn("mb-4 rounded-md border bg-muted/30 p-3", className)}
      data-testid={`${exportTestIdPrefix}-panel`}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-1">
          <h3 className="text-sm font-semibold">Selected records</h3>
          <p className="text-sm text-muted-foreground">
            {selectedRecords.length} of {visibleRecords.length} visible{" "}
            {entityLabel.toLowerCase()} selected.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={setAllSelected}
            data-testid={`${exportTestIdPrefix}-select-all`}
          >
            <CheckSquare className="h-4 w-4" aria-hidden="true" />
            All
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={clearSelection}
            data-testid={`${exportTestIdPrefix}-clear`}
          >
            <Square className="h-4 w-4" aria-hidden="true" />
            None
          </Button>
          <Button
            type="button"
            size="sm"
            loading={isExporting}
            disabled={selectedRecords.length === 0}
            onClick={() => {
              void exportSelected();
            }}
            data-testid={`${exportTestIdPrefix}-submit`}
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Export selected
          </Button>
        </div>
      </div>

      <div className="mt-3 max-h-44 overflow-y-auto rounded-md border bg-background p-2">
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {visibleRecords.map((record) => (
            <label
              key={record.id}
              className="flex min-w-0 items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-muted"
            >
              <input
                type="checkbox"
                className="h-4 w-4 shrink-0 accent-primary"
                checked={selectedIdSet.has(record.id)}
                onChange={() => toggleRecord(record.id)}
                aria-label={`Select ${record.label} for ${entityLabel} actions`}
                data-testid={`${exportTestIdPrefix}-row`}
              />
              <span className="truncate">{record.label}</span>
            </label>
          ))}
        </div>
      </div>

      {exportResult ? (
        <ActionStatus
          result={exportResult}
          testId={`${exportTestIdPrefix}-status`}
        />
      ) : null}

      <div
        className="mt-4 space-y-3 rounded-md border bg-background p-3"
        data-testid={`${executionTestIdPrefix}-panel`}
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold">Bulk execution</h3>
            <p className="text-sm text-muted-foreground">
              {actionOptions.length > 0
                ? `${selectedRecords.length} selected records ready for dry run.`
                : "Bulk execution is unavailable for this list."}
            </p>
          </div>
          <Badge variant={actionOptions.length > 0 ? "warning" : "outline"}>
            {actionOptions.length > 0 ? "confirmation required" : "no actions"}
          </Badge>
        </div>

        {activeExecutionAction ? (
          <>
            <div className="grid gap-3 lg:grid-cols-[16rem_1fr_auto] lg:items-end">
              <div className="space-y-2">
                <Label htmlFor={`${executionTestIdPrefix}-action`}>
                  Action
                </Label>
                <Select
                  id={`${executionTestIdPrefix}-action`}
                  value={activeExecutionAction}
                  onChange={(event) =>
                    updateExecutionAction(
                      event.target.value as BulkActionExecutionAction
                    )
                  }
                  error={Boolean(bulkFieldErrors?.action)}
                  data-testid={`${executionTestIdPrefix}-action`}
                >
                  {actionOptions.map((action) => (
                    <option key={action} value={action}>
                      {EXECUTION_ACTION_LABELS[action]}
                    </option>
                  ))}
                </Select>
                <FieldError message={bulkFieldErrors?.action?.[0]} />
              </div>

              <BulkExecutionTargetControl
                config={targetConfig}
                values={targetValues}
                fieldError={bulkFieldErrors?.target?.[0]}
                testIdPrefix={executionTestIdPrefix}
                onChange={updateTargetValue}
              />

              <Button
                type="button"
                loading={isPreviewing}
                disabled={selectedRecords.length === 0}
                onClick={() => {
                  void previewBulkExecution();
                }}
                data-testid={`${executionTestIdPrefix}-preview`}
              >
                <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
                {isPreviewing ? "Previewing..." : "Preview dry run"}
              </Button>
            </div>

            <FieldError message={bulkFieldErrors?.recordIds?.[0]} />
            {previewResult && !previewResult.ok ? (
              <ErrorStatus
                message={previewResult.message}
                testId={`${executionTestIdPrefix}-error`}
              />
            ) : null}
            {previewResult?.ok ? (
              <BulkDryRunResultPanel
                packet={previewResult.packet}
                testIdPrefix={executionTestIdPrefix}
              />
            ) : null}

            {previewResult?.ok ? (
              <div className="space-y-3 rounded-md border bg-muted/20 p-3">
                <label className="flex items-start gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={executionConfirmed}
                    onChange={(event) => {
                      setExecutionConfirmed(event.target.checked);
                      setExecutionResult(null);
                    }}
                    className="mt-1 h-4 w-4 rounded border-input"
                    data-testid={`${executionTestIdPrefix}-confirm`}
                  />
                  <span>
                    Confirm execution for eligible records from this dry run.
                  </span>
                </label>
                <FieldError message={bulkFieldErrors?.confirmation?.[0]} />
                {executionResult && !executionResult.ok ? (
                  <ErrorStatus
                    message={executionResult.message}
                    testId={`${executionTestIdPrefix}-execution-error`}
                  />
                ) : null}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted-foreground">
                    {previewResult.packet.rollup.blockedCount} blocked records
                    stay unchanged.
                  </p>
                  <Button
                    type="button"
                    variant="destructive"
                    loading={isExecuting}
                    disabled={
                      !executionConfirmed ||
                      previewResult.packet.rollup.eligibleCount === 0
                    }
                    onClick={() => {
                      void executeBulkExecution();
                    }}
                    data-testid={`${executionTestIdPrefix}-submit`}
                  >
                    <Play className="h-4 w-4" aria-hidden="true" />
                    {isExecuting ? "Executing..." : "Execute eligible records"}
                  </Button>
                </div>
              </div>
            ) : null}

            {executionResult?.ok ? (
              <BulkExecutionResultPanel
                execution={executionResult.execution}
                testIdPrefix={executionTestIdPrefix}
              />
            ) : null}
          </>
        ) : null}
      </div>
    </section>
  );
}

function ActionStatus({
  result,
  testId
}: {
  result: ListSelectedExportActionResult;
  testId: string;
}) {
  return (
    <div
      className={cn(
        "mt-3 rounded-md border px-3 py-2 text-sm",
        result.ok
          ? "border-emerald-200 bg-emerald-50 text-emerald-900"
          : "border-destructive/30 bg-destructive/10 text-destructive"
      )}
      data-testid={testId}
    >
      <div className="flex items-start gap-2">
        {result.ok ? null : (
          <X className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        )}
        <div className="min-w-0 space-y-1">
          <p className="font-medium">{result.message}</p>
          {result.ok && result.blockedRecords.length > 0 ? (
            <p>
              Blocked:{" "}
              {result.blockedRecords
                .map((record) => record.label ?? record.id)
                .join(", ")}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function BulkExecutionTargetControl({
  config,
  values,
  fieldError,
  testIdPrefix,
  onChange
}: {
  config: TargetConfig | null;
  values: TargetValues;
  fieldError?: string;
  testIdPrefix: string;
  onChange: (field: keyof TargetValues, value: string) => void;
}) {
  if (!config) {
    return null;
  }

  if (config.options) {
    return (
      <div className="space-y-2">
        <Label htmlFor={`${testIdPrefix}-target`}>{config.label}</Label>
        <Select
          id={`${testIdPrefix}-target`}
          value={values[config.field]}
          onChange={(event) => onChange(config.field, event.target.value)}
          error={Boolean(fieldError)}
          data-testid={`${testIdPrefix}-target`}
        >
          {config.options.map((option) => (
            <option key={option} value={option}>
              {formatToken(option)}
            </option>
          ))}
        </Select>
        <FieldError message={fieldError} />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={`${testIdPrefix}-target`}>{config.label}</Label>
      <Input
        id={`${testIdPrefix}-target`}
        value={values[config.field]}
        placeholder={config.placeholder}
        onChange={(event) => onChange(config.field, event.target.value)}
        error={Boolean(fieldError)}
        data-testid={`${testIdPrefix}-target`}
      />
      <FieldError message={fieldError} />
    </div>
  );
}

function BulkDryRunResultPanel({
  packet,
  testIdPrefix
}: {
  packet: BulkActionDryRunReviewPacket;
  testIdPrefix: string;
}) {
  return (
    <div
      className="space-y-3 rounded-md border bg-muted/20 p-3"
      data-testid={`${testIdPrefix}-dry-run`}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium">
            {packet.entityMetadata.label} {packet.actionMetadata.label}
          </p>
          <p className="text-sm text-muted-foreground">
            {packet.rollup.eligibleCount} eligible,{" "}
            {packet.rollup.blockedCount} blocked.
          </p>
        </div>
        <Badge variant={dryRunStatusVariant(packet.rollup.status)}>
          {packet.rollup.status}
        </Badge>
      </div>

      <Table data-testid={`${testIdPrefix}-dry-run-records`}>
        <TableHeader>
          <TableRow>
            <TableHead>Record</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Current</TableHead>
            <TableHead>Target</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {packet.dryRun.records.map((record) => (
            <TableRow key={record.id}>
              <TableCell className="font-medium">
                {record.label ?? record.id}
              </TableCell>
              <TableCell>
                <Badge variant={record.eligible ? "success" : "warning"}>
                  {formatToken(record.reason)}
                </Badge>
              </TableCell>
              <TableCell>{record.currentValue ?? "Not set"}</TableCell>
              <TableCell>{record.targetValue ?? "Not set"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function BulkExecutionResultPanel({
  execution,
  testIdPrefix
}: {
  execution: BulkActionExecutionResult;
  testIdPrefix: string;
}) {
  const auditEventIds = execution.records.flatMap((record) =>
    record.auditEventId ? [record.auditEventId] : []
  );

  return (
    <div
      className="space-y-3 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-emerald-950"
      data-testid={`${testIdPrefix}-result`}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium">
            {formatToken(execution.action)} for {execution.entity}
          </p>
          <p className="text-sm">
            {execution.rollup.executedCount} executed,{" "}
            {execution.rollup.skippedCount} skipped,{" "}
            {execution.rollup.blockedCount} blocked.
          </p>
        </div>
        <Badge variant={executionStatusVariant(execution.rollup.status)}>
          {execution.rollup.status}
        </Badge>
      </div>

      <Table data-testid={`${testIdPrefix}-records`}>
        <TableHeader>
          <TableRow>
            <TableHead>Record</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Affected</TableHead>
            <TableHead>Audit</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {execution.records.map((record) => (
            <TableRow key={record.id}>
              <TableCell className="font-medium">
                {record.label ?? record.id}
              </TableCell>
              <TableCell>
                <Badge variant={record.executed ? "success" : "warning"}>
                  {formatToken(record.executionStatus)}
                </Badge>
              </TableCell>
              <TableCell>
                {record.affectedEntityType && record.affectedRecordId
                  ? `${record.affectedEntityType}: ${record.affectedRecordId}`
                  : "Not changed"}
              </TableCell>
              <TableCell>{record.auditEventId ?? "Not recorded"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div
        className="rounded-md border border-emerald-200 bg-white/70 px-3 py-2 text-sm"
        data-testid={`${testIdPrefix}-audit`}
      >
        <CheckCircle2 className="mr-2 inline h-4 w-4" aria-hidden="true" />
        Audit events:{" "}
        {auditEventIds.length > 0 ? auditEventIds.join(", ") : "none"}
      </div>
    </div>
  );
}

function ErrorStatus({
  message,
  testId
}: {
  message: string;
  testId: string;
}) {
  return (
    <div
      className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
      data-testid={testId}
    >
      <AlertTriangle className="mr-2 inline h-4 w-4" aria-hidden="true" />
      {message}
    </div>
  );
}

function FieldError({ message }: { message?: string | null }) {
  if (!message) {
    return null;
  }

  return <p className="text-xs text-destructive">{message}</p>;
}

function dedupeRecords(
  records: readonly ListSelectedExportRecord[]
): ListSelectedExportRecord[] {
  const seen = new Set<string>();
  const output: ListSelectedExportRecord[] = [];

  for (const record of records) {
    if (!seen.has(record.id)) {
      seen.add(record.id);
      output.push(record);
    }
  }

  return output;
}

function executionActionsForEntity(
  entity: ListBulkActionEntity
): readonly BulkActionExecutionAction[] {
  return EXECUTION_ACTIONS_BY_ENTITY[entity];
}

function defaultExecutionAction(
  entity: ListBulkActionEntity
): BulkActionExecutionAction | null {
  return executionActionsForEntity(entity)[0] ?? null;
}

function defaultOption(options: readonly string[] | undefined): string {
  return options?.[1] ?? options?.[0] ?? "";
}

function defaultTargetValues(
  entity: ListBulkActionEntity,
  action: BulkActionExecutionAction | null
): TargetValues {
  return {
    targetStatus:
      action === "status_update"
        ? defaultOption(STATUS_OPTIONS_BY_ENTITY[entity])
        : "",
    targetStage: action === "stage_update" ? defaultOption(DEAL_STAGES) : "",
    targetOwnerId: "",
    taskTitle: action === "task_creation" ? DEFAULT_TASK_TITLE : DEFAULT_TASK_TITLE
  };
}

function targetConfigForAction(
  entity: ListBulkActionEntity,
  action: BulkActionExecutionAction
): TargetConfig | null {
  switch (action) {
    case "status_update":
      return {
        field: "targetStatus",
        label: "Bulk target",
        options: STATUS_OPTIONS_BY_ENTITY[entity] ?? []
      };
    case "stage_update":
      return {
        field: "targetStage",
        label: "Bulk target",
        options: DEAL_STAGES
      };
    case "owner_assignment":
      return {
        field: "targetOwnerId",
        label: "Bulk target",
        placeholder: "user-id"
      };
    case "task_creation":
      return {
        field: "taskTitle",
        label: "Bulk target",
        placeholder: DEFAULT_TASK_TITLE
      };
  }
}

function bulkExecutionFieldErrors(
  previewResult: ListBulkExecutionPreviewActionResult | null,
  executionResult: ListBulkExecutionActionResult | null
) {
  if (executionResult && !executionResult.ok) {
    return executionResult.fieldErrors;
  }

  if (previewResult && !previewResult.ok) {
    return previewResult.fieldErrors;
  }

  return null;
}

function dryRunStatusVariant(status: BulkActionDryRunReviewPacketStatus) {
  switch (status) {
    case "empty":
      return "outline";
    case "ready":
      return "success";
    case "partial":
      return "warning";
    case "blocked":
      return "danger";
  }
}

function executionStatusVariant(status: BulkActionExecutionStatus) {
  switch (status) {
    case "empty":
      return "outline";
    case "completed":
      return "success";
    case "partial":
      return "warning";
    case "blocked":
    case "failed":
      return "danger";
  }
}

function formatToken(value: string): string {
  return value.replaceAll("_", " ").replaceAll("-", " ");
}

function downloadCsv(result: Extract<ListSelectedExportActionResult, { ok: true }>) {
  const blob = new Blob([result.csv], { type: result.contentType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = result.filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
