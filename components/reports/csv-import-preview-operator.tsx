"use client";

import {
  type ChangeEvent,
  type FormEvent,
  useMemo,
  useState,
  useTransition
} from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  FileUp,
  Play,
  Search,
  ShieldCheck,
  Table2
} from "lucide-react";
import Link from "next/link";
import {
  executeCsvImportApplyOperatorAction,
  previewCsvImportReviewAction,
  type CsvImportApplyActionResult,
  type CsvImportPreviewActionResult
} from "@/app/reports/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
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
import type { CsvDedupeReviewBundle } from "@/lib/server/csvDedupeReviewBundles";
import type { CsvContactImportManualApplyResult } from "@/lib/server/csvImportApplyExecutor";
import type { CsvImportPreflightRow, CsvImportReadinessStatus } from "@/lib/server/csvImportPreflight";
import type { CsvImportTemplate } from "@/lib/server/csvImportTemplates";

type CsvImportPreviewOperatorProps = {
  templates: readonly CsvImportTemplate[];
};

const writeFlagLabels = [
  { key: "database", label: "Database" },
  { key: "files", label: "Files" },
  { key: "externalServices", label: "External services" },
  { key: "routingAssignments", label: "Routing assignments" },
  { key: "importApply", label: "Import apply" },
  { key: "duplicateMerge", label: "Duplicate merge" },
  { key: "bulkMutations", label: "Bulk mutations" },
  { key: "backgroundJobs", label: "Background jobs" },
  { key: "persistentHistory", label: "Persistent history" }
] satisfies ReadonlyArray<{
  key: keyof CsvDedupeReviewBundle["write"];
  label: string;
}>;

const applyWriteFlagLabels = [
  { key: "database", label: "Database" },
  { key: "contacts", label: "Contacts" },
  { key: "auditEvents", label: "Audit events" },
  { key: "leads", label: "Leads" },
  { key: "routingAssignments", label: "Routing assignments" },
  { key: "dealerOrders", label: "Dealer orders" },
  { key: "pacingEngine", label: "Pacing engine" },
  { key: "accounts", label: "Accounts" },
  { key: "updates", label: "Updates" },
  { key: "upserts", label: "Upserts" },
  { key: "duplicateMerge", label: "Duplicate merge" },
  { key: "files", label: "Files" },
  { key: "backgroundJobs", label: "Background jobs" },
  { key: "externalServices", label: "External services" },
  { key: "salesforce", label: "Salesforce" },
  { key: "routes", label: "Routes" },
  { key: "routeHandlers", label: "Route handlers" }
] satisfies ReadonlyArray<{
  key: keyof CsvContactImportManualApplyResult["write"];
  label: string;
}>;

export function CsvImportPreviewOperator({
  templates
}: CsvImportPreviewOperatorProps) {
  const { showToast } = useToast();
  const [isPreviewPending, startPreviewTransition] = useTransition();
  const [isApplyPending, startApplyTransition] = useTransition();
  const [selectedEntity, setSelectedEntity] = useState<CsvImportTemplate["entity"]>(
    templates[0]?.entity ?? "contacts"
  );
  const [csv, setCsv] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [result, setResult] = useState<CsvImportPreviewActionResult | null>(null);
  const [applyConfirmed, setApplyConfirmed] = useState(false);
  const [applyResult, setApplyResult] =
    useState<CsvImportApplyActionResult | null>(null);

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.entity === selectedEntity) ?? templates[0],
    [selectedEntity, templates]
  );
  const bundle = result?.ok ? result.bundle : null;
  const csvError = result && !result.ok ? result.fieldErrors?.csv?.[0] : null;
  const entityError = result && !result.ok ? result.fieldErrors?.entity?.[0] : null;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startPreviewTransition(() => {
      void (async () => {
        const actionResult = await previewCsvImportReviewAction(formData);
        setResult(actionResult);
        setApplyConfirmed(false);
        setApplyResult(null);
        showToast({
          title: actionResult.ok ? "CSV preview ready" : "CSV preview failed",
          description: actionResult.message,
          variant: actionResult.ok ? "success" : "error"
        });
      })();
    });
  }

  function useExampleCsv() {
    if (!selectedTemplate) {
      return;
    }

    const headers = selectedTemplate.headers.join(",");
    const values = selectedTemplate.exampleRow.fields
      .map((field) => field.value)
      .join(",");

    setCsv(`${headers}\n${values}`);
    setFileName(null);
    setFileError(null);
    setResult(null);
    setApplyConfirmed(false);
    setApplyResult(null);
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setFileError(null);

    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      setCsv(text);
      setFileName(file.name);
      setResult(null);
      setApplyConfirmed(false);
      setApplyResult(null);
    } catch {
      setFileError("The selected file could not be read.");
    }
  }

  function handleApply() {
    if (!bundle) {
      return;
    }

    const formData = new FormData();
    formData.set("entity", bundle.entity);
    formData.set("csv", csv);

    if (applyConfirmed) {
      formData.set("confirmApply", "confirmed");
    }

    startApplyTransition(() => {
      void (async () => {
        const actionResult = await executeCsvImportApplyOperatorAction(formData);
        setApplyResult(actionResult);
        showToast({
          title: actionResult.ok ? "CSV apply complete" : "CSV apply failed",
          description: actionResult.message,
          variant: actionResult.ok ? "success" : "error"
        });
      })();
    });
  }

  return (
    <section className="space-y-4" data-testid="csv-import-preview-operator">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-normal">
            CSV Import Preview
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Validate pasted or selected CSV rows before any import workflow.
          </p>
        </div>
        {selectedTemplate ? (
          <Button asChild variant="outline">
            <Link href={selectedTemplate.route}>
              <Search className="h-4 w-4" aria-hidden="true" />
              Open list
            </Link>
          </Button>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          icon={FileUp}
          label="Supported imports"
          value={formatNumber(templates.length)}
          testId="csv-import-summary-supported"
        />
        <SummaryCard
          icon={Table2}
          label="Previewed rows"
          value={formatNumber(bundle?.operatorSummary.previewedRows ?? 0)}
          testId="csv-import-summary-previewed"
        />
        <SummaryCard
          icon={ShieldCheck}
          label="Write surfaces"
          value={bundle?.entity === "contacts" ? "Gated" : "None"}
          testId="csv-import-summary-writes"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Preview Input</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-[18rem_1fr]">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="csv-import-entity">Entity</Label>
                <Select
                  id="csv-import-entity"
                  name="entity"
                  value={selectedEntity}
                  onChange={(event) => {
                    const nextTemplate = templates.find(
                      (template) => template.entity === event.target.value
                    );
                    if (nextTemplate) {
                      setSelectedEntity(nextTemplate.entity);
                    }
                    setResult(null);
                    setApplyConfirmed(false);
                    setApplyResult(null);
                  }}
                  error={Boolean(entityError)}
                  data-testid="csv-import-entity-select"
                >
                  {templates.map((template) => (
                    <option key={template.entity} value={template.entity}>
                      {template.label}
                    </option>
                  ))}
                </Select>
                <FieldError message={entityError} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="csv-import-file">CSV file</Label>
                <Input
                  id="csv-import-file"
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileChange}
                  data-testid="csv-import-file-input"
                />
                <FieldError message={fileError} />
                {fileName ? (
                  <p className="text-xs text-muted-foreground">{fileName}</p>
                ) : null}
              </div>

              {selectedTemplate ? (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Required headers</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedTemplate.requiredHeaders.map((header) => (
                      <Badge key={header} variant="outline">
                        {header}
                      </Badge>
                    ))}
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={useExampleCsv}>
                    <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
                    Use example
                  </Button>
                </div>
              ) : null}
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="csv-import-input">CSV</Label>
                <Textarea
                  id="csv-import-input"
                  name="csv"
                  value={csv}
                  onChange={(event) => {
                    setCsv(event.target.value);
                    setResult(null);
                    setApplyConfirmed(false);
                    setApplyResult(null);
                  }}
                  placeholder="First Name,Last Name,Email,Status"
                  className="min-h-[14rem] font-mono"
                  data-testid="csv-import-input"
                />
                <FieldError message={csvError} />
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  {csv.length > 0
                    ? `${formatNumber(csv.length)} characters ready`
                    : "No CSV selected"}
                </p>
                <Button
                  type="submit"
                  loading={isPreviewPending}
                  data-testid="csv-import-submit"
                >
                  {isPreviewPending ? "Previewing..." : "Preview CSV"}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {bundle ? (
        <>
          <ImportPreviewResult bundle={bundle} />
          <ContactApplyConfirmation
            bundle={bundle}
            confirmed={applyConfirmed}
            applyResult={applyResult}
            isPending={isApplyPending}
            onConfirmedChange={setApplyConfirmed}
            onApply={handleApply}
          />
        </>
      ) : null}
      {applyResult?.ok ? (
        <ContactApplyResult execution={applyResult.execution} />
      ) : null}
    </section>
  );
}

function ImportPreviewResult({ bundle }: { bundle: CsvDedupeReviewBundle }) {
  const rows = bundle.rowSample.rows;

  return (
    <div className="space-y-4" data-testid="csv-import-result-panel">
      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          icon={ShieldCheck}
          label="Safe rows"
          value={formatNumber(bundle.operatorSummary.safeRows)}
          testId="csv-import-summary-safe"
        />
        <SummaryCard
          icon={AlertTriangle}
          label="Watch rows"
          value={formatNumber(bundle.operatorSummary.watchRows)}
          testId="csv-import-summary-watch"
        />
        <SummaryCard
          icon={AlertTriangle}
          label="Block rows"
          value={formatNumber(bundle.operatorSummary.blockRows)}
          testId="csv-import-summary-block"
        />
      </div>

      <Card>
        <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
          <div className="space-y-1.5">
            <CardTitle>{bundle.label} Row Results</CardTitle>
            <p className="text-sm text-muted-foreground">
              {formatNumber(bundle.operatorSummary.importableRows)} importable of{" "}
              {formatNumber(bundle.operatorSummary.totalRows)} total rows
            </p>
          </div>
          <Badge variant={statusVariant(bundle.operatorSummary.status)}>
            {bundle.operatorSummary.status}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          {rows.length === 0 ? (
            <EmptyState
              title="No sampled rows"
              description="The submitted CSV did not include previewable rows."
            />
          ) : (
            <Table data-testid="csv-import-row-results">
              <TableHeader>
                <TableRow>
                  <TableHead>Row</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Readiness</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Issues</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={`${bundle.entity}-${row.rowNumber}`}>
                    <TableCell>{row.rowNumber}</TableCell>
                    <TableCell>{rowLabel(row)}</TableCell>
                    <TableCell>
                      <Badge variant={readinessVariant(row.readiness.status)}>
                        {formatReadiness(row.readiness.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>{row.action.label}</TableCell>
                    <TableCell>
                      <span className="block max-w-[28rem] truncate">
                        {row.readiness.reasons.length > 0
                          ? row.readiness.reasons.map((reason) => reason.message).join(" ")
                          : "None"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <div className="grid gap-3 md:grid-cols-2">
            <Metric label="Dedupe candidates" value={formatNumber(bundle.operatorSummary.dedupeCandidateCount)} />
            <Metric label="Diagnostics" value={formatNumber(bundle.operatorSummary.diagnosticCount)} />
          </div>

          <div
            className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3"
            data-testid="csv-import-write-flags"
          >
            {writeFlagLabels.map((flag) => (
              <div
                key={flag.key}
                className="rounded-md border bg-muted/20 px-3 py-2 text-sm"
              >
                <span className="font-medium">{flag.label}</span>
                {" "}
                <span className="ml-2 text-muted-foreground">
                  {bundle.write[flag.key] ? "on" : "off"}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ContactApplyConfirmation({
  bundle,
  confirmed,
  applyResult,
  isPending,
  onConfirmedChange,
  onApply
}: {
  bundle: CsvDedupeReviewBundle;
  confirmed: boolean;
  applyResult: CsvImportApplyActionResult | null;
  isPending: boolean;
  onConfirmedChange: (checked: boolean) => void;
  onApply: () => void;
}) {
  if (bundle.entity !== "contacts") {
    return null;
  }

  const applyError = applyResult && !applyResult.ok ? applyResult : null;
  const confirmationError = applyError?.fieldErrors?.confirmation?.[0];
  const targetError =
    applyError?.fieldErrors?.target?.[0] ??
    applyError?.fieldErrors?.csv?.[0] ??
    applyError?.fieldErrors?.entity?.[0];
  const createCandidateRows = bundle.actionSummary.createCandidateRows;
  const canApply = createCandidateRows > 0 && confirmed;

  return (
    <Card data-testid="csv-import-apply-confirmation-panel">
      <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
        <div className="space-y-1.5">
          <CardTitle>Contact Apply</CardTitle>
          <p className="text-sm text-muted-foreground">
            {formatNumber(createCandidateRows)} create-safe rows are available.
          </p>
        </div>
        <Badge variant={createCandidateRows > 0 ? "warning" : "outline"}>
          {createCandidateRows > 0 ? "ready" : "blocked"}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <label className="flex items-start gap-3 rounded-md border bg-muted/20 px-3 py-3 text-sm">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(event) => onConfirmedChange(event.target.checked)}
            className="mt-1 h-4 w-4 rounded border-input"
            data-testid="csv-import-apply-confirm-checkbox"
          />
          <span>
            Confirm contact creation for create-safe rows from this CSV preview.
          </span>
        </label>
        <FieldError message={confirmationError} />
        {targetError ? (
          <p
            className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            data-testid="csv-import-apply-error"
          >
            {targetError}
          </p>
        ) : null}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {formatNumber(bundle.actionSummary.reviewCandidateRows)} review
            rows and {formatNumber(bundle.actionSummary.blockedRows)} blocked
            rows stay unchanged.
          </p>
          <Button
            type="button"
            variant="destructive"
            loading={isPending}
            disabled={!canApply}
            onClick={onApply}
            data-testid="csv-import-apply-submit"
          >
            <Play className="h-4 w-4" aria-hidden="true" />
            {isPending ? "Applying..." : "Apply contacts"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ContactApplyResult({
  execution
}: {
  execution: CsvContactImportManualApplyResult;
}) {
  return (
    <div className="space-y-4" data-testid="csv-import-apply-result-panel">
      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard
          icon={CheckCircle2}
          label="Created"
          value={formatNumber(execution.summary.createdRows)}
          testId="csv-import-apply-rollup-created"
        />
        <SummaryCard
          icon={ClipboardCheck}
          label="Skipped"
          value={formatNumber(execution.summary.skippedRows)}
          testId="csv-import-apply-rollup-skipped"
        />
        <SummaryCard
          icon={AlertTriangle}
          label="Blocked"
          value={formatNumber(execution.summary.blockedRows)}
          testId="csv-import-apply-rollup-blocked"
        />
        <SummaryCard
          icon={ClipboardCheck}
          label="Audit events"
          value={formatNumber(execution.summary.auditEventCount)}
          testId="csv-import-apply-rollup-audit-events"
        />
      </div>

      <Card>
        <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
          <div className="space-y-1.5">
            <CardTitle>Apply Feedback</CardTitle>
            <p className="text-sm text-muted-foreground">
              {formatNumber(execution.summary.attemptedRows)} attempted rows,{" "}
              {formatNumber(execution.summary.auditEventCount)} audit events
              recorded.
            </p>
          </div>
          <Badge variant={applyStatusVariant(execution.status)}>
            {execution.status}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <Metric
              label="Operator approved"
              value={execution.approval.approved ? "on" : "off"}
            />
            <Metric
              label="Did mutate"
              value={execution.summary.didMutate ? "on" : "off"}
            />
            <Metric
              label="Manual executor"
              value={execution.source.manualExecutorPath ?? "Not available"}
            />
          </div>

          <div className="overflow-x-auto">
            <Table data-testid="csv-import-apply-row-results">
              <TableHeader>
                <TableRow>
                  <TableHead>Row</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Audit event</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {execution.rows.map((row) => (
                  <TableRow key={`csv-contact-apply-${row.rowNumber}`}>
                    <TableCell>{row.rowNumber}</TableCell>
                    <TableCell>
                      <Badge variant={applyRowStatusVariant(row.status)}>
                        {row.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {row.contactId ? (
                        <Link className="underline" href={`/contacts/${row.contactId}`}>
                          {row.contact
                            ? `${row.contact.firstName} ${row.contact.lastName}`
                            : row.contactId}
                        </Link>
                      ) : (
                        "Not changed"
                      )}
                    </TableCell>
                    <TableCell>{row.auditEventId ?? "Not recorded"}</TableCell>
                    <TableCell>
                      <span className="block max-w-[34rem] truncate">
                        {applyOutcomeReason(row)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div
        className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4"
        data-testid="csv-import-apply-write-flags"
      >
        {applyWriteFlagLabels.map((flag) => (
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

function SummaryCard({
  icon: Icon,
  label,
  value,
  testId
}: {
  icon: typeof FileUp;
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

function rowLabel(row: CsvImportPreflightRow): string {
  const firstName = row.values.firstName ?? row.data?.firstName ?? "";
  const lastName = row.values.lastName ?? row.data?.lastName ?? "";
  const label = `${firstName} ${lastName}`.trim();

  return label.length > 0 ? label : `Row ${row.rowNumber}`;
}

function formatReadiness(status: CsvImportReadinessStatus): string {
  switch (status) {
    case "ready":
      return "safe";
    case "needs_review":
      return "watch";
    case "blocked":
      return "block";
  }
}

function readinessVariant(status: CsvImportReadinessStatus) {
  switch (status) {
    case "ready":
      return "success";
    case "needs_review":
      return "warning";
    case "blocked":
      return "danger";
  }
}

function statusVariant(status: CsvDedupeReviewBundle["operatorSummary"]["status"]) {
  switch (status) {
    case "safe":
      return "success";
    case "watch":
      return "warning";
    case "block":
      return "danger";
  }
}

function applyStatusVariant(status: CsvContactImportManualApplyResult["status"]) {
  switch (status) {
    case "completed":
      return "success";
    case "partial":
      return "warning";
    case "blocked":
    case "failed":
      return "danger";
  }
}

function applyRowStatusVariant(
  status: CsvContactImportManualApplyResult["rows"][number]["status"]
) {
  switch (status) {
    case "created":
      return "success";
    case "skipped":
      return "warning";
    case "blocked":
    case "failed":
      return "danger";
  }
}

function applyOutcomeReason(
  row: CsvContactImportManualApplyResult["rows"][number]
): string {
  const reasons = [
    ...row.blockReasons,
    ...row.skippedReasons,
    ...row.diagnosticCodes
  ];

  if (reasons.length > 0) {
    return reasons.map(formatToken).join(", ");
  }

  return row.message;
}

function formatToken(value: string): string {
  return value.replaceAll("_", " ");
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}
