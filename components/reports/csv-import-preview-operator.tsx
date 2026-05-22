"use client";

import { type ChangeEvent, type FormEvent, useMemo, useState, useTransition } from "react";
import { AlertTriangle, ClipboardCheck, FileUp, Search, ShieldCheck, Table2 } from "lucide-react";
import Link from "next/link";
import { previewCsvImportReviewAction, type CsvImportPreviewActionResult } from "@/app/reports/actions";
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

export function CsvImportPreviewOperator({
  templates
}: CsvImportPreviewOperatorProps) {
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [selectedEntity, setSelectedEntity] = useState<CsvImportTemplate["entity"]>(
    templates[0]?.entity ?? "contacts"
  );
  const [csv, setCsv] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [result, setResult] = useState<CsvImportPreviewActionResult | null>(null);

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

    startTransition(() => {
      void (async () => {
        const actionResult = await previewCsvImportReviewAction(formData);
        setResult(actionResult);
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
    } catch {
      setFileError("The selected file could not be read.");
    }
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
          value="None"
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
                  onChange={(event) => setCsv(event.target.value)}
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
                <Button type="submit" loading={isPending} data-testid="csv-import-submit">
                  {isPending ? "Previewing..." : "Preview CSV"}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {bundle ? <ImportPreviewResult bundle={bundle} /> : null}
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

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}
