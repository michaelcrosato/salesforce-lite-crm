"use client";

import {
  BarChart3,
  FileText,
  PieChart,
  Play,
  Settings2,
  ShieldCheck,
  Table2,
  type LucideIcon
} from "lucide-react";
import {
  type FormEvent,
  useMemo,
  useState,
  useTransition
} from "react";
import {
  previewSavedReportDefinitionAction,
  type SavedReportPreviewActionResult
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
import { useToast } from "@/components/ui/toast";
import type {
  SavedReportChartContract,
  SavedReportDefinitionCatalog,
  SavedReportEntityDefinition
} from "@/lib/server/savedReportDefinitions";
import type {
  SavedReportPreviewResult,
  SavedReportPreviewWriteFlags
} from "@/lib/server/savedReportPreviewRunner";

type SavedReportOperatorProps = {
  catalog: SavedReportDefinitionCatalog;
};

type SavedReportWriteFlags =
  | SavedReportDefinitionCatalog["write"]
  | SavedReportPreviewWriteFlags;

const writeFlagLabels = [
  { key: "database", label: "Database" },
  { key: "mutations", label: "Mutations" },
  { key: "schemas", label: "Schemas" },
  { key: "routes", label: "Routes" },
  { key: "files", label: "Files" },
  { key: "externalServices", label: "External services" },
  { key: "backgroundJobs", label: "Background jobs" },
  { key: "rawSql", label: "Raw SQL" }
] satisfies ReadonlyArray<{
  key: keyof SavedReportDefinitionCatalog["write"];
  label: string;
}>;

export function SavedReportOperator({ catalog }: SavedReportOperatorProps) {
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const initialDefinition = catalog.entities[0] ?? null;
  const [selectedEntity, setSelectedEntity] = useState(
    initialDefinition?.entity ?? ""
  );
  const [selectedFields, setSelectedFields] = useState<string[]>(
    defaultFieldKeys(initialDefinition)
  );
  const [filterKey, setFilterKey] = useState("");
  const [filterValue, setFilterValue] = useState("");
  const [groupBy, setGroupBy] = useState(defaultGroupBy(initialDefinition));
  const initialChart = defaultChart(initialDefinition);
  const [chartType, setChartType] = useState(initialChart?.type ?? "");
  const [chartDimension, setChartDimension] = useState(
    initialChart?.defaultDimensionKey ?? ""
  );
  const [chartMetric, setChartMetric] = useState(
    initialChart?.defaultMetricKey ?? "recordCount"
  );
  const [result, setResult] = useState<SavedReportPreviewActionResult | null>(
    null
  );

  const selectedDefinition = useMemo(
    () =>
      catalog.entities.find((entity) => entity.entity === selectedEntity) ??
      initialDefinition,
    [catalog.entities, initialDefinition, selectedEntity]
  );
  const selectedChart = useMemo(
    () => findChart(selectedDefinition, chartType),
    [chartType, selectedDefinition]
  );
  const activePreview = result?.preview ?? null;
  const activeWriteFlags = activePreview?.write ?? catalog.write;

  if (!initialDefinition || !selectedDefinition) {
    return (
      <section className="space-y-4" data-testid="saved-report-operator">
        <EmptyState
          title="No saved report definitions"
          description="The saved report definition catalog did not return supported entities."
        />
      </section>
    );
  }

  function handleEntityChange(nextEntity: string) {
    const nextDefinition = catalog.entities.find(
      (definition) => definition.entity === nextEntity
    );

    if (!nextDefinition) {
      return;
    }

    const nextChart = defaultChart(nextDefinition);

    setSelectedEntity(nextDefinition.entity);
    setSelectedFields(defaultFieldKeys(nextDefinition));
    setFilterKey("");
    setFilterValue("");
    setGroupBy(defaultGroupBy(nextDefinition));
    setChartType(nextChart?.type ?? "");
    setChartDimension(nextChart?.defaultDimensionKey ?? "");
    setChartMetric(nextChart?.defaultMetricKey ?? "recordCount");
    setResult(null);
  }

  function handleChartTypeChange(nextType: string) {
    const nextChart = findChart(selectedDefinition, nextType);

    setChartType(nextChart?.type ?? nextType);
    setChartDimension(nextChart?.defaultDimensionKey ?? "");
    setChartMetric(nextChart?.defaultMetricKey ?? "recordCount");
    setResult(null);
  }

  function toggleField(fieldKey: string, checked: boolean) {
    setSelectedFields((current) => {
      if (checked) {
        return current.includes(fieldKey) ? current : [...current, fieldKey];
      }

      return current.filter((candidate) => candidate !== fieldKey);
    });
    setResult(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(() => {
      void (async () => {
        const actionResult = await previewSavedReportDefinitionAction(formData);
        setResult(actionResult);
        showToast({
          title: actionResult.ok
            ? "Saved report preview ready"
            : "Saved report preview failed",
          description: actionResult.message,
          variant: actionResult.ok ? "success" : "error"
        });
      })();
    });
  }

  return (
    <section className="space-y-4" data-testid="saved-report-operator">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-normal">
            Saved Report Builder
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Build a bounded report definition and preview it through current CRM
            list adapters.
          </p>
        </div>
        <Badge variant={hasWriteSurface(activeWriteFlags) ? "warning" : "success"}>
          read-only preview
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard
          icon={FileText}
          label="Supported entities"
          value={formatNumber(catalog.entityCount)}
          testId="saved-report-summary-entities"
        />
        <SummaryCard
          icon={Settings2}
          label="Selectable fields"
          value={formatNumber(catalog.fieldCount)}
          testId="saved-report-summary-fields"
        />
        <SummaryCard
          icon={BarChart3}
          label="Chart contracts"
          value={formatNumber(catalog.chartCount)}
          testId="saved-report-summary-charts"
        />
        <SummaryCard
          icon={ShieldCheck}
          label="Previewed rows"
          value={formatNumber(activePreview?.rowCount ?? 0)}
          testId="saved-report-summary-previewed"
        />
      </div>

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(18rem,24rem)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Definition Catalog</CardTitle>
          </CardHeader>
          <CardContent>
            <Table data-testid="saved-report-definition-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Entity</TableHead>
                  <TableHead>Fields</TableHead>
                  <TableHead>Filters</TableHead>
                  <TableHead>Charts</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {catalog.entities.map((definition) => (
                  <TableRow key={definition.entity}>
                    <TableCell className="font-medium">
                      {definition.label}
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {definition.route}
                      </span>
                    </TableCell>
                    <TableCell>{formatNumber(definition.fieldCount)}</TableCell>
                    <TableCell>{formatNumber(definition.filterCount)}</TableCell>
                    <TableCell>{formatNumber(definition.chartCount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
            <div className="space-y-1.5">
              <CardTitle>Builder</CardTitle>
              <p className="text-sm text-muted-foreground">
                Select fields, one optional filter, grouping, chart, and preview
                limit.
              </p>
            </div>
            <Badge variant="outline">{selectedDefinition.sourceSurface}</Badge>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-4 lg:grid-cols-[16rem_minmax(0,1fr)]">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="saved-report-entity">Entity</Label>
                    <Select
                      id="saved-report-entity"
                      name="entity"
                      value={selectedDefinition.entity}
                      onChange={(event) => handleEntityChange(event.target.value)}
                      data-testid="saved-report-entity-select"
                    >
                      {catalog.entities.map((definition) => (
                        <option
                          key={definition.entity}
                          value={definition.entity}
                        >
                          {definition.label}
                        </option>
                      ))}
                    </Select>
                    <FieldError
                      message={
                        result && !result.ok
                          ? result.fieldErrors?.entity?.[0]
                          : null
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="saved-report-name">Report name</Label>
                    <Input
                      id="saved-report-name"
                      name="name"
                      defaultValue="Pipeline health preview"
                      maxLength={120}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="saved-report-limit">Preview limit</Label>
                    <Input
                      id="saved-report-limit"
                      name="limit"
                      type="number"
                      min={1}
                      max={selectedDefinition.limits.previewRows.maxLimit}
                      defaultValue={selectedDefinition.limits.previewRows.defaultLimit}
                      data-testid="saved-report-limit-input"
                    />
                  </div>
                </div>

                <div className="min-w-0 space-y-4">
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Fields</div>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {selectedDefinition.fields.map((field) => (
                        <label
                          key={field.key}
                          className="flex items-start gap-2 rounded-md border bg-muted/20 px-3 py-2 text-sm"
                        >
                          <input
                            type="checkbox"
                            name="fields"
                            value={field.key}
                            checked={selectedFields.includes(field.key)}
                            onChange={(event) =>
                              toggleField(field.key, event.target.checked)
                            }
                            className="mt-1 h-4 w-4 rounded border-input"
                            data-testid={`saved-report-field-${testIdToken(field.key)}`}
                          />
                          <span>
                            <span className="block font-medium">
                              {field.label}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatToken(field.valueType)}
                            </span>
                          </span>
                        </label>
                      ))}
                    </div>
                    <FieldError
                      message={
                        result && !result.ok
                          ? result.fieldErrors?.fields?.[0]
                          : null
                      }
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="saved-report-filter">Filter</Label>
                      <Select
                        id="saved-report-filter"
                        name="filterKey"
                        value={filterKey}
                        onChange={(event) => {
                          setFilterKey(event.target.value);
                          setFilterValue("");
                          setResult(null);
                        }}
                        data-testid="saved-report-filter-select"
                      >
                        <option value="">No filter</option>
                        {selectedDefinition.filters.map((filter) => (
                          <option key={filter.key} value={filter.key}>
                            {filter.label}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="saved-report-filter-value">
                        Filter value
                      </Label>
                      <Input
                        id="saved-report-filter-value"
                        name="filterValue"
                        value={filterValue}
                        onChange={(event) => {
                          setFilterValue(event.target.value);
                          setResult(null);
                        }}
                        disabled={!filterKey}
                        placeholder={filterPlaceholder(
                          selectedDefinition,
                          filterKey
                        )}
                        data-testid="saved-report-filter-value"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-2">
                      <Label htmlFor="saved-report-group">Group by</Label>
                      <Select
                        id="saved-report-group"
                        name="groupBy"
                        value={groupBy}
                        onChange={(event) => {
                          setGroupBy(event.target.value);
                          setResult(null);
                        }}
                        data-testid="saved-report-group-select"
                      >
                        <option value="">No grouping</option>
                        {selectedDefinition.groupings.map((grouping) => (
                          <option key={grouping.key} value={grouping.key}>
                            {grouping.label}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="saved-report-chart-type">Chart</Label>
                      <Select
                        id="saved-report-chart-type"
                        name="chartType"
                        value={chartType}
                        onChange={(event) =>
                          handleChartTypeChange(event.target.value)
                        }
                        data-testid="saved-report-chart-type"
                      >
                        {selectedDefinition.charts.map((chart) => (
                          <option key={chart.type} value={chart.type}>
                            {chart.label}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="saved-report-chart-dimension">
                        Dimension
                      </Label>
                      <Select
                        id="saved-report-chart-dimension"
                        name="chartDimension"
                        value={chartDimension}
                        onChange={(event) => {
                          setChartDimension(event.target.value);
                          setResult(null);
                        }}
                        disabled={!selectedChart}
                        data-testid="saved-report-chart-dimension"
                      >
                        <option value="">Default</option>
                        {selectedChart?.supportedDimensionKeys.map((key) => (
                          <option key={key} value={key}>
                            {definitionLabel(selectedDefinition, key)}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="saved-report-chart-metric">Metric</Label>
                      <Select
                        id="saved-report-chart-metric"
                        name="chartMetric"
                        value={chartMetric}
                        onChange={(event) => {
                          setChartMetric(event.target.value);
                          setResult(null);
                        }}
                        disabled={!selectedChart}
                        data-testid="saved-report-chart-metric"
                      >
                        {selectedChart?.supportedMetricKeys.map((key) => (
                          <option key={key} value={key}>
                            {metricLabel(selectedDefinition, key)}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  {formatNumber(selectedFields.length)} fields selected for{" "}
                  {selectedDefinition.label}.
                </p>
                <Button
                  type="submit"
                  loading={isPending}
                  data-testid="saved-report-preview-submit"
                >
                  <Play className="h-4 w-4" aria-hidden="true" />
                  {isPending ? "Previewing..." : "Preview report"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {result && !result.ok ? <PreviewErrors result={result} /> : null}
      {activePreview ? <PreviewResult preview={activePreview} /> : null}

      <div
        className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4"
        data-testid="saved-report-write-flags"
      >
        {writeFlagLabels.map((flag) => (
          <div
            key={flag.key}
            className="rounded-md border bg-muted/20 px-3 py-2 text-sm"
          >
            <span className="font-medium">{flag.label}</span>{" "}
            <span className="ml-2 text-muted-foreground">
              {activeWriteFlags[flag.key] ? "on" : "off"}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function PreviewErrors({ result }: { result: SavedReportPreviewActionResult }) {
  if (result.ok) {
    return null;
  }

  const errors = result.preview?.errors ?? [];
  const targetError = result.fieldErrors?.target?.[0] ?? null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preview Validation</CardTitle>
      </CardHeader>
      <CardContent>
        {errors.length > 0 ? (
          <ul className="space-y-2 text-sm" data-testid="saved-report-error-list">
            {errors.map((error) => (
              <li
                key={`${error.code}-${error.path ?? "root"}-${error.message}`}
                className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-destructive"
              >
                {error.message}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-destructive">
            {targetError ?? result.message}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function PreviewResult({ preview }: { preview: SavedReportPreviewResult }) {
  const firstRow = preview.rows[0] ?? null;

  return (
    <div className="space-y-4" data-testid="saved-report-result-panel">
      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard
          icon={Table2}
          label="Rows"
          value={formatNumber(preview.rowCount)}
          testId="saved-report-result-rows"
        />
        <SummaryCard
          icon={BarChart3}
          label="Aggregates"
          value={formatNumber(preview.aggregates.length)}
          testId="saved-report-result-aggregates"
        />
        <SummaryCard
          icon={PieChart}
          label="Groups"
          value={formatNumber(preview.groups.length)}
          testId="saved-report-result-groups"
        />
        <SummaryCard
          icon={ShieldCheck}
          label="Status"
          value={preview.status}
          testId="saved-report-result-status"
        />
      </div>

      <Card>
        <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
          <div className="space-y-1.5">
            <CardTitle>{preview.definition?.label ?? "Saved report"} Preview</CardTitle>
            <p className="text-sm text-muted-foreground">
              {preview.normalizedDraft?.name ?? "Untitled saved report"} via{" "}
              {preview.source.executionScope}.
            </p>
          </div>
          <Badge variant={preview.status === "valid" ? "success" : "danger"}>
            {preview.status}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          {preview.rows.length === 0 ? (
            <EmptyState
              title="No preview rows"
              description="The saved report definition returned no rows for the current filters."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table data-testid="saved-report-row-table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Record</TableHead>
                    {firstRow?.cells.map((cell) => (
                      <TableHead key={cell.fieldKey}>{cell.label}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.rows.map((row) => (
                    <TableRow key={row.recordId}>
                      <TableCell className="font-medium">
                        {row.recordId}
                      </TableCell>
                      {row.cells.map((cell) => (
                        <TableCell key={`${row.recordId}-${cell.fieldKey}`}>
                          {formatCellValue(cell.value)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="grid gap-4 xl:grid-cols-2">
            <Table data-testid="saved-report-aggregate-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Aggregate</TableHead>
                  <TableHead>Aggregation</TableHead>
                  <TableHead>Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {preview.aggregates.map((aggregate) => (
                  <TableRow key={aggregate.key}>
                    <TableCell className="font-medium">
                      {aggregate.label}
                    </TableCell>
                    <TableCell>{formatToken(aggregate.aggregation)}</TableCell>
                    <TableCell>{formatCellValue(aggregate.value)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Table data-testid="saved-report-chart-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Chart point</TableHead>
                  <TableHead>Rows</TableHead>
                  <TableHead>{preview.chart?.metricLabel ?? "Metric"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {preview.chart?.points.map((point) => (
                  <TableRow key={point.key}>
                    <TableCell className="font-medium">{point.label}</TableCell>
                    <TableCell>{formatNumber(point.rowCount)}</TableCell>
                    <TableCell>{formatCellValue(point.value)}</TableCell>
                  </TableRow>
                )) ?? (
                  <TableRow>
                    <TableCell colSpan={3}>No chart selected.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <Metric
              label="Runner"
              value={preview.source.runnerModule}
            />
            <Metric
              label="Definition"
              value={preview.source.definitionModule}
            />
            <Metric label="Adapter" value={preview.source.listAdapterModule} />
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
      <div className="mt-1 max-w-full truncate text-sm font-medium">{value}</div>
    </div>
  );
}

function FieldError({ message }: { message?: string | null }) {
  if (!message) {
    return null;
  }

  return <p className="text-xs text-destructive">{message}</p>;
}

function defaultFieldKeys(
  definition: SavedReportEntityDefinition | null
): string[] {
  return definition?.fields.slice(0, 3).map((field) => field.key) ?? [];
}

function defaultGroupBy(
  definition: SavedReportEntityDefinition | null
): string {
  return definition?.groupings[0]?.key ?? "";
}

function defaultChart(
  definition: SavedReportEntityDefinition | null
): SavedReportChartContract | null {
  if (!definition) {
    return null;
  }

  return (
    definition.charts.find((chart) => chart.type === "bar") ??
    definition.charts[0] ??
    null
  );
}

function findChart(
  definition: SavedReportEntityDefinition | null,
  chartType: string
): SavedReportChartContract | null {
  if (!definition) {
    return null;
  }

  return (
    definition.charts.find((chart) => chart.type === chartType) ??
    definition.charts[0] ??
    null
  );
}

function definitionLabel(
  definition: SavedReportEntityDefinition,
  fieldKey: string
): string {
  return (
    definition.groupings.find((grouping) => grouping.key === fieldKey)?.label ??
    definition.fields.find((field) => field.key === fieldKey)?.label ??
    fieldKey
  );
}

function metricLabel(
  definition: SavedReportEntityDefinition,
  metricKey: string
): string {
  return (
    definition.metrics.find((metric) => metric.key === metricKey)?.label ??
    metricKey
  );
}

function filterPlaceholder(
  definition: SavedReportEntityDefinition,
  key: string
): string {
  const filter = definition.filters.find((candidate) => candidate.key === key);

  if (!filter) {
    return "No filter selected";
  }

  if (filter.allowedValues && filter.allowedValues.length > 0) {
    return filter.allowedValues.slice(0, 3).join(", ");
  }

  return formatToken(filter.valueType);
}

function hasWriteSurface(flags: SavedReportWriteFlags): boolean {
  return writeFlagLabels.some((flag) => flags[flag.key]);
}

function formatCellValue(value: string | number | null): string {
  if (value === null) {
    return "None";
  }

  if (typeof value === "number") {
    return formatNumber(value);
  }

  return value;
}

function formatToken(value: string): string {
  return value.replaceAll("_", " ").replaceAll("-", " ");
}

function testIdToken(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replaceAll(".", "-")
    .toLowerCase();
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}
