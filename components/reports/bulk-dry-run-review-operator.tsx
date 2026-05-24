"use client";

import {
  type FormEvent,
  useMemo,
  useState,
  useTransition
} from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  ListChecks,
  Play,
  ShieldCheck,
  Table2,
  type LucideIcon
} from "lucide-react";
import Link from "next/link";
import {
  executeBulkActionOperatorAction,
  previewBulkActionDryRunReviewAction,
  type BulkActionExecutionActionResult,
  type BulkActionDryRunReviewActionResult
} from "@/app/reports/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import type {
  BulkActionDryRunReviewActionMetadata,
  BulkActionDryRunReviewPacket,
  BulkActionDryRunReviewPacketAction,
  BulkActionDryRunReviewPacketDefinition,
  BulkActionDryRunReviewPacketEntity,
  BulkActionDryRunReviewPacketStatus,
  BulkActionDryRunReviewReasonSummary,
  BulkActionDryRunReviewWriteFlags
} from "@/lib/server/bulkActionDryRunReviewPackets";
import type {
  BulkActionExecutionResult,
  BulkActionExecutionStatus,
  BulkActionExecutionWriteFlags
} from "@/lib/server/bulkActionExecution";

type BulkDryRunReviewSampleRecordIds = {
  entity: BulkActionDryRunReviewPacketEntity;
  ids: readonly string[];
};

type BulkDryRunReviewOperatorProps = {
  definitions: readonly BulkActionDryRunReviewPacketDefinition[];
  sampleRecordIds: readonly BulkDryRunReviewSampleRecordIds[];
};

const writeFlagLabels = [
  { key: "database", label: "Database" },
  { key: "mutations", label: "Mutations" },
  { key: "approvals", label: "Approvals" },
  { key: "auditEvents", label: "Audit events" },
  { key: "files", label: "Files" },
  { key: "externalServices", label: "External services" },
  { key: "backgroundJobs", label: "Background jobs" }
] satisfies ReadonlyArray<{
  key: keyof BulkActionDryRunReviewWriteFlags;
  label: string;
}>;

const executionWriteFlagLabels = [
  { key: "database", label: "Database" },
  { key: "mutations", label: "Mutations" },
  { key: "auditEvents", label: "Audit events" },
  { key: "approvals", label: "Approvals" },
  { key: "files", label: "Files" },
  { key: "externalServices", label: "External services" },
  { key: "backgroundJobs", label: "Background jobs" }
] satisfies ReadonlyArray<{
  key: keyof BulkActionExecutionWriteFlags;
  label: string;
}>;

export function BulkDryRunReviewOperator({
  definitions,
  sampleRecordIds
}: BulkDryRunReviewOperatorProps) {
  const { showToast } = useToast();
  const [isReviewPending, startReviewTransition] = useTransition();
  const [isExecutePending, startExecuteTransition] = useTransition();
  const firstDefinition = definitions[0] ?? null;
  const firstAction = firstDefinition?.actions[0] ?? null;
  const [selectedEntity, setSelectedEntity] =
    useState<BulkActionDryRunReviewPacketEntity>(
      firstDefinition?.entityMetadata.entity ?? "accounts"
    );
  const [selectedAction, setSelectedAction] =
    useState<BulkActionDryRunReviewPacketAction>(
      firstAction?.action ?? "status_update"
    );
  const [recordIds, setRecordIds] = useState("");
  const [targetStatus, setTargetStatus] = useState(
    defaultTargetValue(firstAction)
  );
  const [targetStage, setTargetStage] = useState("");
  const [targetOwnerId, setTargetOwnerId] = useState("");
  const [taskTitle, setTaskTitle] = useState("Follow up selected records");
  const [result, setResult] =
    useState<BulkActionDryRunReviewActionResult | null>(null);
  const [executionConfirmed, setExecutionConfirmed] = useState(false);
  const [executionResult, setExecutionResult] =
    useState<BulkActionExecutionActionResult | null>(null);

  const selectedDefinition = useMemo(
    () =>
      definitions.find(
        (definition) => definition.entityMetadata.entity === selectedEntity
      ) ?? firstDefinition,
    [definitions, firstDefinition, selectedEntity]
  );
  const selectedActionMetadata = useMemo(
    () =>
      selectedDefinition?.actions.find(
        (action) => action.action === selectedAction
      ) ?? selectedDefinition?.actions[0] ?? null,
    [selectedAction, selectedDefinition]
  );
  const selectedSampleIds = useMemo(
    () =>
      sampleRecordIds.find((sample) => sample.entity === selectedEntity)?.ids ??
      [],
    [sampleRecordIds, selectedEntity]
  );
  const packet = result?.ok ? result.packet : null;
  const fieldErrors = result && !result.ok ? result.fieldErrors : null;

  function clearRunState() {
    setResult(null);
    setExecutionResult(null);
    setExecutionConfirmed(false);
  }

  function handleEntityChange(nextEntity: BulkActionDryRunReviewPacketEntity) {
    const nextDefinition =
      definitions.find(
        (definition) => definition.entityMetadata.entity === nextEntity
      ) ?? firstDefinition;
    const nextAction = nextDefinition?.actions[0] ?? null;

    setSelectedEntity(nextEntity);
    if (nextAction) {
      setSelectedAction(nextAction.action);
      applyTargetDefaults(nextAction);
    }
    clearRunState();
  }

  function handleActionChange(nextAction: BulkActionDryRunReviewPacketAction) {
    const nextActionMetadata =
      selectedDefinition?.actions.find((action) => action.action === nextAction) ??
      null;

    setSelectedAction(nextAction);
    applyTargetDefaults(nextActionMetadata);
    clearRunState();
  }

  function applyTargetDefaults(
    actionMetadata: BulkActionDryRunReviewActionMetadata | null
  ) {
    const value = defaultTargetValue(actionMetadata);

    switch (actionMetadata?.target.field) {
      case "targetStatus":
        setTargetStatus(value);
        break;
      case "targetStage":
        setTargetStage(value);
        break;
      case "targetOwnerId":
        setTargetOwnerId("");
        break;
      case "taskTitle":
        setTaskTitle("Follow up selected records");
        break;
      case null:
      case undefined:
        break;
    }
  }

  function useSampleRecords() {
    setRecordIds(selectedSampleIds.join("\n"));
    clearRunState();
  }

  function buildExecutionFormData(): FormData {
    const formData = new FormData();

    formData.set("entity", selectedEntity);
    formData.set("action", selectedAction);
    formData.set("recordIds", recordIds);
    formData.set("targetStatus", targetStatus);
    formData.set("targetStage", targetStage);
    formData.set("targetOwnerId", targetOwnerId);
    formData.set("taskTitle", taskTitle);
    if (executionConfirmed) {
      formData.set("confirmExecution", "confirmed");
    }

    return formData;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setExecutionResult(null);
    setExecutionConfirmed(false);

    startReviewTransition(() => {
      void (async () => {
        const actionResult = await previewBulkActionDryRunReviewAction(formData);
        setResult(actionResult);
        showToast({
          title: actionResult.ok
            ? "Bulk dry run ready"
            : "Bulk dry run failed",
          description: actionResult.message,
          variant: actionResult.ok ? "success" : "error"
        });
      })();
    });
  }

  function handleExecute() {
    startExecuteTransition(() => {
      void (async () => {
        const actionResult = await executeBulkActionOperatorAction(
          buildExecutionFormData()
        );
        setExecutionResult(actionResult);
        showToast({
          title: actionResult.ok
            ? "Bulk action executed"
            : "Bulk execution failed",
          description: actionResult.message,
          variant: actionResult.ok ? "success" : "error"
        });
      })();
    });
  }

  if (!selectedDefinition || !selectedActionMetadata) {
    return null;
  }

  return (
    <section className="space-y-4" data-testid="bulk-dry-run-review-operator">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-normal">
            Bulk Dry-Run Review
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Build no-write review packets for selected records before bulk
            actions exist.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={selectedDefinition.entityMetadata.route}>
            <ListChecks className="h-4 w-4" aria-hidden="true" />
            Open list
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard
          icon={FileText}
          label="Supported entities"
          value={formatNumber(definitions.length)}
          testId="bulk-dry-run-summary-entities"
        />
        <SummaryCard
          icon={Table2}
          label="Actions"
          value={formatNumber(selectedDefinition.actions.length)}
          testId="bulk-dry-run-summary-actions"
        />
        <SummaryCard
          icon={ClipboardCheck}
          label="Max records"
          value={formatNumber(
            selectedDefinition.entityMetadata.maxSelectedRecords
          )}
          testId="bulk-dry-run-summary-max-records"
        />
        <SummaryCard
          icon={ShieldCheck}
          label="Write surfaces"
          value="None"
          testId="bulk-dry-run-summary-writes"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Review Builder</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit}
            className="grid gap-4 lg:grid-cols-[18rem_1fr]"
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bulk-dry-run-entity">Entity</Label>
                <Select
                  id="bulk-dry-run-entity"
                  name="entity"
                  value={selectedEntity}
                  onChange={(event) =>
                    handleEntityChange(
                      event.target.value as BulkActionDryRunReviewPacketEntity
                    )
                  }
                  error={Boolean(fieldErrors?.entity)}
                  data-testid="bulk-dry-run-entity-select"
                >
                  {definitions.map((definition) => (
                    <option
                      key={definition.entityMetadata.entity}
                      value={definition.entityMetadata.entity}
                    >
                      {definition.entityMetadata.label}
                    </option>
                  ))}
                </Select>
                <FieldError message={fieldErrors?.entity?.[0]} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bulk-dry-run-action">Action</Label>
                <Select
                  id="bulk-dry-run-action"
                  name="action"
                  value={selectedAction}
                  onChange={(event) =>
                    handleActionChange(
                      event.target.value as BulkActionDryRunReviewPacketAction
                    )
                  }
                  error={Boolean(fieldErrors?.action)}
                  data-testid="bulk-dry-run-action-select"
                >
                  {selectedDefinition.actions.map((action) => (
                    <option key={action.action} value={action.action}>
                      {action.label}
                    </option>
                  ))}
                </Select>
                <FieldError message={fieldErrors?.action?.[0]} />
                <Badge
                  variant={
                    selectedActionMetadata.supported ? "success" : "warning"
                  }
                >
                  {selectedActionMetadata.supported
                    ? "Supported for entity"
                    : "Unsupported for entity"}
                </Badge>
              </div>

              <TargetControl
                actionMetadata={selectedActionMetadata}
                fieldError={fieldErrors?.target?.[0]}
                targetOwnerId={targetOwnerId}
                targetStage={targetStage}
                targetStatus={targetStatus}
                taskTitle={taskTitle}
                setTargetOwnerId={(value) => {
                  setTargetOwnerId(value);
                  clearRunState();
                }}
                setTargetStage={(value) => {
                  setTargetStage(value);
                  clearRunState();
                }}
                setTargetStatus={(value) => {
                  setTargetStatus(value);
                  clearRunState();
                }}
                setTaskTitle={(value) => {
                  setTaskTitle(value);
                  clearRunState();
                }}
              />

              <div className="space-y-2">
                <div className="text-sm font-medium">Sample records</div>
                <p className="text-xs text-muted-foreground">
                  {formatNumber(selectedSampleIds.length)} preview IDs available
                  from the existing export packet.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={useSampleRecords}
                  disabled={selectedSampleIds.length === 0}
                  data-testid="bulk-dry-run-use-sample-records"
                >
                  <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
                  Use preview IDs
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="bulk-dry-run-record-ids">
                  Selected record IDs
                </Label>
                <Textarea
                  id="bulk-dry-run-record-ids"
                  name="recordIds"
                  value={recordIds}
                  onChange={(event) => {
                    setRecordIds(event.target.value);
                    clearRunState();
                  }}
                  placeholder="acct-apex&#10;acct-harbor"
                  className="min-h-[14rem] font-mono"
                  data-testid="bulk-dry-run-record-input"
                />
                <FieldError message={fieldErrors?.recordIds?.[0]} />
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  {recordIds.trim().length > 0
                    ? `${formatNumber(parseRecordCount(recordIds))} selections ready`
                    : "No selected records"}
                </p>
                <Button
                  type="submit"
                  loading={isReviewPending}
                  data-testid="bulk-dry-run-submit"
                >
                  {isReviewPending ? "Reviewing..." : "Review dry run"}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {packet ? <BulkDryRunReviewResult packet={packet} /> : null}
      {packet ? (
        <BulkExecutionConfirmation
          packet={packet}
          confirmed={executionConfirmed}
          executionResult={executionResult}
          isPending={isExecutePending}
          onConfirmedChange={(checked) => {
            setExecutionConfirmed(checked);
            setExecutionResult(null);
          }}
          onExecute={handleExecute}
        />
      ) : null}
      {executionResult?.ok ? (
        <BulkExecutionResult execution={executionResult.execution} />
      ) : null}
    </section>
  );
}

function TargetControl({
  actionMetadata,
  fieldError,
  targetOwnerId,
  targetStage,
  targetStatus,
  taskTitle,
  setTargetOwnerId,
  setTargetStage,
  setTargetStatus,
  setTaskTitle
}: {
  actionMetadata: BulkActionDryRunReviewActionMetadata;
  fieldError?: string;
  targetOwnerId: string;
  targetStage: string;
  targetStatus: string;
  taskTitle: string;
  setTargetOwnerId: (value: string) => void;
  setTargetStage: (value: string) => void;
  setTargetStatus: (value: string) => void;
  setTaskTitle: (value: string) => void;
}) {
  const target = actionMetadata.target;

  if (!actionMetadata.supported || target.valueSource === "unsupported") {
    return (
      <div className="rounded-md border bg-muted/20 px-3 py-2 text-sm">
        No target is available for this entity/action pair.
      </div>
    );
  }

  if (target.field === null) {
    return (
      <div
        className="rounded-md border bg-muted/20 px-3 py-2 text-sm"
        data-testid="bulk-dry-run-target-none"
      >
        No target value is required for this action.
      </div>
    );
  }

  if (target.allowedValues && target.allowedValues.length > 0) {
    const value =
      target.field === "targetStage" ? targetStage : targetStatus;
    const setValue =
      target.field === "targetStage" ? setTargetStage : setTargetStatus;

    return (
      <div className="space-y-2">
        <Label htmlFor="bulk-dry-run-target">Target</Label>
        <Select
          id="bulk-dry-run-target"
          name={target.field}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          error={Boolean(fieldError)}
          data-testid="bulk-dry-run-target-select"
        >
          {target.allowedValues.map((allowedValue) => (
            <option key={allowedValue} value={allowedValue}>
              {formatToken(allowedValue)}
            </option>
          ))}
        </Select>
        <FieldError message={fieldError} />
      </div>
    );
  }

  if (target.field === "targetOwnerId") {
    return (
      <div className="space-y-2">
        <Label htmlFor="bulk-dry-run-target-owner">Target owner ID</Label>
        <Input
          id="bulk-dry-run-target-owner"
          name="targetOwnerId"
          value={targetOwnerId}
          onChange={(event) => setTargetOwnerId(event.target.value)}
          placeholder="user-id"
          data-testid="bulk-dry-run-target-owner-input"
        />
        <FieldError message={fieldError} />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="bulk-dry-run-task-title">Task title</Label>
      <Input
        id="bulk-dry-run-task-title"
        name="taskTitle"
        value={taskTitle}
        onChange={(event) => setTaskTitle(event.target.value)}
        data-testid="bulk-dry-run-task-title-input"
      />
      <FieldError message={fieldError} />
    </div>
  );
}

function BulkDryRunReviewResult({
  packet
}: {
  packet: BulkActionDryRunReviewPacket;
}) {
  return (
    <div className="space-y-4" data-testid="bulk-dry-run-result-panel">
      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard
          icon={ShieldCheck}
          label="Eligible"
          value={formatNumber(packet.rollup.eligibleCount)}
          testId="bulk-dry-run-rollup-eligible"
        />
        <SummaryCard
          icon={AlertTriangle}
          label="Blocked"
          value={formatNumber(packet.rollup.blockedCount)}
          testId="bulk-dry-run-rollup-blocked"
        />
        <SummaryCard
          icon={AlertTriangle}
          label="Missing"
          value={formatNumber(packet.rollup.missingCount)}
          testId="bulk-dry-run-rollup-missing"
        />
        <SummaryCard
          icon={ClipboardCheck}
          label="Duplicates"
          value={formatNumber(packet.rollup.duplicateCount)}
          testId="bulk-dry-run-rollup-duplicates"
        />
      </div>

      <Card>
        <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
          <div className="space-y-1.5">
            <CardTitle>
              {packet.entityMetadata.label} {packet.actionMetadata.label}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {formatNumber(packet.rollup.uniqueRecordCount)} unique of{" "}
              {formatNumber(packet.rollup.requestedCount)} requested selections
            </p>
          </div>
          <Badge variant={statusVariant(packet.rollup.status)}>
            {packet.rollup.status}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <Metric
              label="Would mutate"
              value={packet.rollup.wouldMutate ? "on" : "off"}
            />
            <Metric
              label="Requires approval"
              value={packet.rollup.requiresApproval ? "on" : "off"}
            />
            <Metric
              label="Export contract"
              value={packet.entityMetadata.exportFilename}
            />
          </div>

          <Table data-testid="bulk-dry-run-reason-table">
            <TableHeader>
              <TableRow>
                <TableHead>Reason</TableHead>
                <TableHead>Count</TableHead>
                <TableHead>Eligibility</TableHead>
                <TableHead>Representative records</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {packet.reasons.map((reason) => (
                <ReasonRow key={reason.reason} reason={reason} />
              ))}
            </TableBody>
          </Table>

          <Table data-testid="bulk-dry-run-record-table">
            <TableHeader>
              <TableRow>
                <TableHead>Record</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Current</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Message</TableHead>
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
                  <TableCell>
                    <span className="block max-w-[28rem] truncate">
                      {record.message}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card data-testid="bulk-dry-run-audit-plan">
        <CardHeader>
          <CardTitle>Audit Planning Metadata</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {packet.auditPlan.summary}
          </p>
          <div className="grid gap-3 md:grid-cols-4">
            <Metric label="Source" value={packet.auditPlan.source} />
            <Metric label="Packet" value={packet.auditPlan.packetSource} />
            <Metric
              label="Record audit event"
              value={packet.auditPlan.wouldRecordAuditEvent ? "on" : "off"}
            />
            <Metric
              label="Approval"
              value={packet.auditPlan.requiresApproval ? "on" : "off"}
            />
          </div>
        </CardContent>
      </Card>

      <div
        className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4"
        data-testid="bulk-dry-run-write-flags"
      >
        {writeFlagLabels.map((flag) => (
          <div
            key={flag.key}
            className="rounded-md border bg-muted/20 px-3 py-2 text-sm"
          >
            <span className="font-medium">{flag.label}</span>
            {" "}
            <span className="ml-2 text-muted-foreground">
              {packet.write[flag.key] ? "on" : "off"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BulkExecutionConfirmation({
  packet,
  confirmed,
  executionResult,
  isPending,
  onConfirmedChange,
  onExecute
}: {
  packet: BulkActionDryRunReviewPacket;
  confirmed: boolean;
  executionResult: BulkActionExecutionActionResult | null;
  isPending: boolean;
  onConfirmedChange: (checked: boolean) => void;
  onExecute: () => void;
}) {
  const executionError =
    executionResult && !executionResult.ok ? executionResult : null;
  const confirmationError = executionError?.fieldErrors?.confirmation?.[0];
  const targetError =
    executionError?.fieldErrors?.action?.[0] ??
    executionError?.fieldErrors?.target?.[0] ??
    executionError?.fieldErrors?.recordIds?.[0] ??
    executionError?.fieldErrors?.entity?.[0];
  const canExecute = packet.rollup.eligibleCount > 0 && confirmed;

  return (
    <Card data-testid="bulk-execution-confirmation-panel">
      <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
        <div className="space-y-1.5">
          <CardTitle>Bulk Execution</CardTitle>
          <p className="text-sm text-muted-foreground">
            Dry run complete for {formatNumber(packet.rollup.eligibleCount)}
            {" "}eligible records. Execution writes mutations and audit events.
          </p>
        </div>
        <Badge variant={packet.rollup.eligibleCount > 0 ? "warning" : "outline"}>
          {packet.rollup.eligibleCount > 0 ? "ready" : "blocked"}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <label className="flex items-start gap-3 rounded-md border bg-muted/20 px-3 py-3 text-sm">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(event) => onConfirmedChange(event.target.checked)}
            className="mt-1 h-4 w-4 rounded border-input"
            data-testid="bulk-execution-confirm-checkbox"
          />
          <span>
            Confirm execution for eligible records from this dry-run result.
          </span>
        </label>
        <FieldError message={confirmationError} />
        {targetError ? (
          <p
            className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            data-testid="bulk-execution-error"
          >
            {targetError}
          </p>
        ) : null}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {formatNumber(packet.rollup.blockedCount)} blocked records stay
            unchanged.
          </p>
          <Button
            type="button"
            variant="destructive"
            loading={isPending}
            disabled={!canExecute}
            onClick={onExecute}
            data-testid="bulk-execution-submit"
          >
            <Play className="h-4 w-4" aria-hidden="true" />
            {isPending ? "Executing..." : "Execute eligible records"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function BulkExecutionResult({
  execution
}: {
  execution: BulkActionExecutionResult;
}) {
  return (
    <div className="space-y-4" data-testid="bulk-execution-result-panel">
      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard
          icon={CheckCircle2}
          label="Executed"
          value={formatNumber(execution.rollup.executedCount)}
          testId="bulk-execution-rollup-executed"
        />
        <SummaryCard
          icon={ClipboardCheck}
          label="Skipped"
          value={formatNumber(execution.rollup.skippedCount)}
          testId="bulk-execution-rollup-skipped"
        />
        <SummaryCard
          icon={AlertTriangle}
          label="Blocked"
          value={formatNumber(execution.rollup.blockedCount)}
          testId="bulk-execution-rollup-blocked"
        />
        <SummaryCard
          icon={AlertTriangle}
          label="Failed"
          value={formatNumber(execution.rollup.failedCount)}
          testId="bulk-execution-rollup-failed"
        />
      </div>

      <Card>
        <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
          <div className="space-y-1.5">
            <CardTitle>Execution Feedback</CardTitle>
            <p className="text-sm text-muted-foreground">
              {formatToken(execution.action)} for {execution.entity}:{" "}
              {formatNumber(execution.rollup.auditEventCount)} audit events
              recorded.
            </p>
          </div>
          <Badge variant={executionStatusVariant(execution.rollup.status)}>
            {execution.rollup.status}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <Metric
              label="Would mutate"
              value={execution.rollup.wouldMutate ? "on" : "off"}
            />
            <Metric
              label="Requires approval"
              value={execution.rollup.requiresApproval ? "on" : "off"}
            />
            <Metric
              label="Supported"
              value={execution.supported ? "on" : "off"}
            />
          </div>

          <Table data-testid="bulk-execution-record-table">
            <TableHeader>
              <TableRow>
                <TableHead>Record</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Affected</TableHead>
                <TableHead>Audit event</TableHead>
                <TableHead>Message</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {execution.records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">
                    {record.label ?? record.id}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={record.executed ? "success" : "warning"}
                    >
                      {formatToken(record.executionStatus)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {record.affectedEntityType && record.affectedRecordId
                      ? `${record.affectedEntityType}: ${record.affectedRecordId}`
                      : "Not changed"}
                  </TableCell>
                  <TableCell>{record.auditEventId ?? "Not recorded"}</TableCell>
                  <TableCell>
                    <span className="block max-w-[28rem] truncate">
                      {record.error ?? record.message}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div
        className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4"
        data-testid="bulk-execution-write-flags"
      >
        {executionWriteFlagLabels.map((flag) => (
          <div
            key={flag.key}
            className="rounded-md border bg-muted/20 px-3 py-2 text-sm"
          >
            <span className="font-medium">{flag.label}</span>
            {" "}
            <span className="ml-2 text-muted-foreground">
              {execution.write[flag.key] ? "on" : "off"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReasonRow({
  reason
}: {
  reason: BulkActionDryRunReviewReasonSummary;
}) {
  return (
    <TableRow>
      <TableCell className="font-medium">{formatToken(reason.reason)}</TableCell>
      <TableCell>{formatNumber(reason.count)}</TableCell>
      <TableCell>{reason.eligible ? "eligible" : "blocked"}</TableCell>
      <TableCell>
        <span className="block max-w-[32rem] truncate">
          {reason.representativeRecords
            .map((record) => `${record.label ?? record.id}: ${record.message}`)
            .join(" ")}
        </span>
      </TableCell>
    </TableRow>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  testId
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  testId: string;
}) {
  return (
    <Card data-testid={testId}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
          <Icon className="h-4 w-4" aria-hidden="true" />
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold tracking-normal">{value}</div>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-muted/20 px-3 py-2">
      <div className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-lg font-semibold tracking-normal">{value}</div>
    </div>
  );
}

function FieldError({ message }: { message?: string | null }) {
  if (!message) {
    return null;
  }

  return <p className="text-xs text-destructive">{message}</p>;
}

function defaultTargetValue(
  actionMetadata: BulkActionDryRunReviewActionMetadata | null
): string {
  return actionMetadata?.target.allowedValues?.[0] ?? "";
}

function parseRecordCount(value: string): number {
  return value.split(/[\s,]+/).filter((recordId) => recordId.length > 0).length;
}

function statusVariant(status: BulkActionDryRunReviewPacketStatus) {
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

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}
