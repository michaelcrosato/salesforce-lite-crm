"use client";

import { type FormEvent, useMemo, useState, useTransition } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Play,
  ShieldCheck,
  Table2,
  type LucideIcon
} from "lucide-react";
import Link from "next/link";
import {
  executeWorkflowRuleOperatorAction,
  previewWorkflowRuleDryRunAction,
  type WorkflowRuleDryRunActionResult,
  type WorkflowRuleExecutionActionResult
} from "@/app/reports/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useToast } from "@/components/ui/toast";
import type {
  WorkflowRuleExampleCatalog,
  WorkflowRuleExampleContract
} from "@/lib/server/workflowRuleExamples";
import type {
  WorkflowRuleReviewOperatorWarning,
  WorkflowRuleReviewPacket,
  WorkflowRuleReviewPacketStatus,
  WorkflowRuleReviewPacketWriteFlags
} from "@/lib/server/workflowRuleReviewPackets";
import type {
  WorkflowRuleManualExecutionResult,
  WorkflowRuleManualExecutionStatus,
  WorkflowRuleManualExecutionWriteFlags
} from "@/lib/server/workflowRuleManualExecutor";

type WorkflowDryRunOperatorProps = {
  catalog: WorkflowRuleExampleCatalog;
};

type WorkflowRuleExampleEntity = WorkflowRuleExampleContract["entity"];

const writeFlagLabels = [
  { key: "database", label: "Database" },
  { key: "workflowRules", label: "Workflow rules" },
  { key: "crmRecords", label: "CRM records" },
  { key: "auditEvents", label: "Audit events" },
  { key: "routes", label: "Routes" },
  { key: "routeHandlers", label: "Route handlers" },
  { key: "externalServices", label: "External services" },
  { key: "backgroundJobs", label: "Background jobs" },
  { key: "actionExecution", label: "Action execution" }
] satisfies ReadonlyArray<{
  key: keyof WorkflowRuleReviewPacketWriteFlags;
  label: string;
}>;

const executionWriteFlagLabels = [
  { key: "database", label: "Database" },
  { key: "crmRecords", label: "CRM records" },
  { key: "auditEvents", label: "Audit events" },
  { key: "actionExecution", label: "Action execution" },
  { key: "routes", label: "Routes" },
  { key: "externalServices", label: "External services" },
  { key: "backgroundJobs", label: "Background jobs" },
  { key: "executorRuns", label: "Executor runs" }
] satisfies ReadonlyArray<{
  key: keyof WorkflowRuleManualExecutionWriteFlags;
  label: string;
}>;

export function WorkflowDryRunOperator({
  catalog
}: WorkflowDryRunOperatorProps) {
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isExecutePending, startExecuteTransition] = useTransition();
  const [selectedEntity, setSelectedEntity] = useState<WorkflowRuleExampleEntity>(
    catalog.examples[0]?.entity ?? "accounts"
  );
  const [result, setResult] =
    useState<WorkflowRuleDryRunActionResult | null>(null);
  const [executionConfirmed, setExecutionConfirmed] = useState(false);
  const [executionResult, setExecutionResult] =
    useState<WorkflowRuleExecutionActionResult | null>(null);

  const selectedExample = useMemo(
    () =>
      catalog.examples.find((example) => example.entity === selectedEntity) ??
      catalog.examples[0] ??
      null,
    [catalog.examples, selectedEntity]
  );
  const packet = result?.ok ? result.packet : null;
  const fieldErrors = result && !result.ok ? result.fieldErrors : null;
  const hasWriteSurface = packet
    ? writeFlagLabels.some((flag) => packet.write[flag.key])
    : writeFlagLabels.some((flag) => catalog.write[flag.key]);

  function clearExecutionState() {
    setExecutionConfirmed(false);
    setExecutionResult(null);
  }

  function handleEntityChange(nextEntity: WorkflowRuleExampleEntity) {
    setSelectedEntity(nextEntity);
    setResult(null);
    clearExecutionState();
  }

  function buildExecutionFormData(): FormData {
    const formData = new FormData();

    formData.set("exampleEntity", selectedEntity);
    if (executionConfirmed) {
      formData.set("confirmExecution", "confirmed");
    }

    return formData;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    clearExecutionState();

    startTransition(() => {
      void (async () => {
        const actionResult = await previewWorkflowRuleDryRunAction(formData);
        setResult(actionResult);
        showToast({
          title: actionResult.ok
            ? "Workflow dry run ready"
            : "Workflow dry run failed",
          description: actionResult.message,
          variant: actionResult.ok ? "success" : "error"
        });
      })();
    });
  }

  function handleExecute() {
    startExecuteTransition(() => {
      void (async () => {
        const actionResult = await executeWorkflowRuleOperatorAction(
          buildExecutionFormData()
        );
        setExecutionResult(actionResult);
        showToast({
          title: actionResult.ok
            ? "Workflow execution complete"
            : "Workflow execution failed",
          description: actionResult.message,
          variant: actionResult.ok ? "success" : "error"
        });
      })();
    });
  }

  if (selectedExample === null) {
    return null;
  }

  return (
    <section className="space-y-4" data-testid="workflow-dry-run-operator">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-normal">
            Workflow Dry Run
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Run read-only review packets from catalog examples.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={selectedExample.route}>
            <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
            Open object
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard
          icon={FileText}
          label="Examples"
          value={formatNumber(catalog.exampleCount)}
          testId="workflow-dry-run-summary-examples"
        />
        <SummaryCard
          icon={Table2}
          label="Entities"
          value={formatNumber(catalog.entityCount)}
          testId="workflow-dry-run-summary-entities"
        />
        <SummaryCard
          icon={ClipboardCheck}
          label="Actions"
          value={formatNumber(selectedExample.actions.length)}
          testId="workflow-dry-run-summary-actions"
        />
        <SummaryCard
          icon={ShieldCheck}
          label="Write surfaces"
          value={hasWriteSurface ? "Review" : "None"}
          testId="workflow-dry-run-summary-writes"
        />
      </div>

      <Card>
        <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
          <div className="space-y-1.5">
            <CardTitle>Example Draft Rule</CardTitle>
            <p className="text-sm text-muted-foreground">
              {selectedExample.description}
            </p>
          </div>
          <Badge variant="outline">{formatToken(selectedExample.trigger)}</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            onSubmit={handleSubmit}
            className="grid gap-4 lg:grid-cols-[minmax(16rem,22rem)_1fr]"
          >
            <div className="space-y-2">
              <Label htmlFor="workflow-dry-run-example">Example</Label>
              <Select
                id="workflow-dry-run-example"
                name="exampleEntity"
                value={selectedEntity}
                onChange={(event) =>
                  handleEntityChange(
                    event.target.value as WorkflowRuleExampleEntity
                  )
                }
                error={Boolean(fieldErrors?.exampleEntity)}
                data-testid="workflow-dry-run-example-select"
              >
                {catalog.examples.map((example) => (
                  <option key={example.id} value={example.entity}>
                    {example.label}
                  </option>
                ))}
              </Select>
              <FieldError message={fieldErrors?.exampleEntity?.[0]} />
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Metric label="Entity" value={selectedExample.entityLabel} />
              <Metric
                label="Conditions"
                value={formatNumber(selectedExample.conditions.length)}
              />
              <Metric
                label="Actions"
                value={formatNumber(selectedExample.actions.length)}
              />
              <Metric label="Mode" value="Read only" />
            </div>

            <div className="lg:col-start-2">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Limit {formatNumber(selectedExample.rule.limit)} matched
                  records per run.
                </p>
                <Button
                  type="submit"
                  loading={isPending}
                  data-testid="workflow-dry-run-submit"
                >
                  <Play className="h-4 w-4" aria-hidden="true" />
                  {isPending ? "Running..." : "Run dry run"}
                </Button>
              </div>
              <FieldError message={fieldErrors?.target?.[0]} />
            </div>
          </form>
        </CardContent>
      </Card>

      {packet ? <WorkflowDryRunResult packet={packet} /> : null}
      {packet ? (
        <WorkflowExecutionConfirmation
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
        <WorkflowExecutionResult execution={executionResult.execution} />
      ) : null}
    </section>
  );
}

function WorkflowDryRunResult({ packet }: { packet: WorkflowRuleReviewPacket }) {
  return (
    <div className="space-y-4" data-testid="workflow-dry-run-result-panel">
      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard
          icon={ShieldCheck}
          label="Matched"
          value={formatNumber(packet.affectedObjects.matchedRecordCount)}
          testId="workflow-dry-run-rollup-matched"
        />
        <SummaryCard
          icon={Table2}
          label="Returned"
          value={formatNumber(packet.affectedObjects.returnedRecordCount)}
          testId="workflow-dry-run-rollup-returned"
        />
        <SummaryCard
          icon={AlertTriangle}
          label="Warnings"
          value={formatNumber(packet.warningCount)}
          testId="workflow-dry-run-rollup-warnings"
        />
        <SummaryCard
          icon={ClipboardCheck}
          label="Actions"
          value={formatNumber(packet.dryRun.proposedActions.length)}
          testId="workflow-dry-run-rollup-actions"
        />
      </div>

      <Card>
        <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
          <div className="space-y-1.5">
            <CardTitle>{packet.ruleMetadata.entityLabel} Review Packet</CardTitle>
            <p className="text-sm text-muted-foreground">
              {formatNumber(packet.affectedObjects.scannedRecordCount)} scanned
              of {formatNumber(packet.affectedObjects.totalCandidateCount)}
              {" "}candidates.
            </p>
          </div>
          <Badge variant={statusVariant(packet.status)}>
            {formatToken(packet.status)}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <Metric
              label="Trigger"
              value={formatToken(packet.ruleMetadata.trigger)}
            />
            <Metric
              label="Conditions"
              value={formatNumber(packet.ruleMetadata.selectedConditionCount)}
            />
            <Metric
              label="Match limit"
              value={formatNumber(packet.affectedObjects.matchLimit)}
            />
            <Metric
              label="Generated"
              value={packet.generatedAt ?? "Not stamped"}
            />
          </div>

          <div className="overflow-x-auto">
            <Table data-testid="workflow-dry-run-action-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Records</TableHead>
                  <TableHead>Summary</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {packet.dryRun.proposedActions.map((action) => (
                  <TableRow key={action.action}>
                    <TableCell className="font-medium">{action.label}</TableCell>
                    <TableCell>{formatToken(action.category)}</TableCell>
                    <TableCell>{formatNumber(action.recordCount)}</TableCell>
                    <TableCell>
                      <span className="block max-w-[36rem] truncate">
                        {action.summary}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card data-testid="workflow-dry-run-warning-list">
        <CardHeader>
          <CardTitle>Operator Warnings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 lg:grid-cols-3">
            {packet.operatorWarnings.map((warning) => (
              <WarningCard key={warning.code} warning={warning} />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Matched Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table data-testid="workflow-dry-run-record-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Record</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Conditions</TableHead>
                  <TableHead>Values</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {packet.dryRun.matchedRecords.length > 0 ? (
                  packet.dryRun.matchedRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">
                        {record.label}
                      </TableCell>
                      <TableCell>
                        <Link className="underline" href={record.route}>
                          {record.route}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {record.matchedConditionKeys.map(formatToken).join(", ")}
                      </TableCell>
                      <TableCell>
                        <span className="block max-w-[36rem] truncate">
                          {record.values
                            .map(
                              (value) =>
                                `${value.fieldPath.join(".")}: ${formatValue(value.value)}`
                            )
                            .join("; ")}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4}>No records matched.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div
        className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4"
        data-testid="workflow-dry-run-write-flags"
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

function WorkflowExecutionConfirmation({
  packet,
  confirmed,
  executionResult,
  isPending,
  onConfirmedChange,
  onExecute
}: {
  packet: WorkflowRuleReviewPacket;
  confirmed: boolean;
  executionResult: WorkflowRuleExecutionActionResult | null;
  isPending: boolean;
  onConfirmedChange: (checked: boolean) => void;
  onExecute: () => void;
}) {
  const executionError =
    executionResult && !executionResult.ok ? executionResult : null;
  const confirmationError = executionError?.fieldErrors?.confirmation?.[0];
  const targetError =
    executionError?.fieldErrors?.target?.[0] ??
    executionError?.fieldErrors?.exampleEntity?.[0];

  return (
    <Card data-testid="workflow-execution-confirmation-panel">
      <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
        <div className="space-y-1.5">
          <CardTitle>Workflow Execution</CardTitle>
          <p className="text-sm text-muted-foreground">
            Review packet ready for{" "}
            {formatNumber(packet.dryRun.proposedActions.length)} proposed
            actions. Execution writes supported local mutations and audit
            events.
          </p>
        </div>
        <Badge
          variant={
            packet.affectedObjects.matchedRecordCount > 0 ? "warning" : "outline"
          }
        >
          {packet.affectedObjects.matchedRecordCount > 0 ? "ready" : "blocked"}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <label className="flex items-start gap-3 rounded-md border bg-muted/20 px-3 py-3 text-sm">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(event) => onConfirmedChange(event.target.checked)}
            className="mt-1 h-4 w-4 rounded border-input"
            data-testid="workflow-execution-confirm-checkbox"
          />
          <span>
            Confirm manual execution for this workflow dry-run result.
          </span>
        </label>
        <FieldError message={confirmationError} />
        {targetError ? (
          <p
            className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            data-testid="workflow-execution-error"
          >
            {targetError}
          </p>
        ) : null}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {formatNumber(packet.affectedObjects.returnedRecordCount)} returned
            records are evaluated by the manual executor.
          </p>
          <Button
            type="button"
            variant="destructive"
            loading={isPending}
            disabled={!confirmed}
            onClick={onExecute}
            data-testid="workflow-execution-submit"
          >
            <Play className="h-4 w-4" aria-hidden="true" />
            {isPending ? "Executing..." : "Execute workflow"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function WorkflowExecutionResult({
  execution
}: {
  execution: WorkflowRuleManualExecutionResult;
}) {
  const records = execution.actions.flatMap((action) => action.records);

  return (
    <div className="space-y-4" data-testid="workflow-execution-result-panel">
      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard
          icon={CheckCircle2}
          label="Executed"
          value={formatNumber(execution.summary.executedRecordActionCount)}
          testId="workflow-execution-rollup-executed"
        />
        <SummaryCard
          icon={AlertTriangle}
          label="Blocked"
          value={formatNumber(execution.summary.blockedActionCount)}
          testId="workflow-execution-rollup-blocked"
        />
        <SummaryCard
          icon={AlertTriangle}
          label="Failed"
          value={formatNumber(execution.summary.failedRecordActionCount)}
          testId="workflow-execution-rollup-failed"
        />
        <SummaryCard
          icon={ClipboardCheck}
          label="Audit events"
          value={formatNumber(execution.summary.auditEventCount)}
          testId="workflow-execution-rollup-audit-events"
        />
      </div>

      <Card>
        <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
          <div className="space-y-1.5">
            <CardTitle>Execution Feedback</CardTitle>
            <p className="text-sm text-muted-foreground">
              {formatToken(execution.summary.entity)} workflow:{" "}
              {formatNumber(execution.summary.proposedActionCount)} proposed
              actions, {formatNumber(execution.summary.executedActionCount)}
              {" "}executed actions.
            </p>
          </div>
          <Badge variant={executionStatusVariant(execution.status)}>
            {execution.status}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <Metric
              label="Approved"
              value={execution.approval.approved ? "on" : "off"}
            />
            <Metric
              label="Did mutate"
              value={execution.summary.didMutate ? "on" : "off"}
            />
            <Metric
              label="Manual executor"
              value={execution.safety.manualExecutorOnly ? "on" : "off"}
            />
          </div>

          <Table data-testid="workflow-execution-action-table">
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Executed</TableHead>
                <TableHead>Blocked</TableHead>
                <TableHead>Audit events</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {execution.actions.map((action) => (
                <TableRow key={action.action}>
                  <TableCell className="font-medium">{action.label}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        action.status === "executed" ? "success" : "warning"
                      }
                    >
                      {formatToken(action.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatNumber(action.executedCount)}</TableCell>
                  <TableCell>{formatNumber(action.blockedCount)}</TableCell>
                  <TableCell>{formatNumber(action.auditEventCount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Table data-testid="workflow-execution-record-table">
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
              {records.length > 0 ? (
                records.map((record) => (
                  <TableRow key={`${record.action}-${record.id}`}>
                    <TableCell className="font-medium">{record.label}</TableCell>
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
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5}>
                    No record actions were attempted.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div
        className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4"
        data-testid="workflow-execution-write-flags"
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

function WarningCard({
  warning
}: {
  warning: WorkflowRuleReviewOperatorWarning;
}) {
  return (
    <div className="rounded-md border bg-muted/20 px-3 py-3 text-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="font-medium">{formatToken(warning.code)}</span>
        <Badge variant={warning.severity === "watch" ? "warning" : "outline"}>
          {warning.severity}
        </Badge>
      </div>
      <p className="mt-2 text-muted-foreground">{warning.message}</p>
    </div>
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

function statusVariant(status: WorkflowRuleReviewPacketStatus) {
  switch (status) {
    case "empty":
      return "outline";
    case "ready":
      return "success";
    case "review":
      return "warning";
  }
}

function executionStatusVariant(status: WorkflowRuleManualExecutionStatus) {
  switch (status) {
    case "completed":
      return "success";
    case "partial":
      return "warning";
    case "blocked":
      return "outline";
    case "failed":
      return "danger";
  }
}

function formatValue(value: string | number | null): string {
  if (value === null) {
    return "Not set";
  }

  return String(value);
}

function formatToken(value: string): string {
  return value.replaceAll("_", " ").replaceAll("-", " ");
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}
