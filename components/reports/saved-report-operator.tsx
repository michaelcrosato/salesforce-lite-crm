"use client";

import {
  Archive,
  BarChart3,
  Eye,
  FileText,
  FolderOpen,
  PieChart,
  Play,
  Save,
  Settings2,
  ShieldCheck,
  Table2,
  Trash2,
  type LucideIcon
} from "lucide-react";
import {
  type FormEvent,
  useMemo,
  useRef,
  useState,
  useTransition
} from "react";
import {
  archiveSavedReportDefinitionAction,
  createSavedReportDefinitionAction,
  deleteSavedReportDefinitionAction,
  previewPersistedSavedReportDefinitionAction,
  previewSavedReportDefinitionAction,
  updateSavedReportDefinitionAction,
  type SavedReportManagementActionResult,
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
import type { SavedReportDefinitionSnapshot } from "@/lib/server/savedReportPersistence";

type SavedReportOperatorProps = {
  catalog: SavedReportDefinitionCatalog;
  initialSavedReports: SavedReportDefinitionSnapshot[];
};

type SavedReportActionResult =
  | SavedReportPreviewActionResult
  | SavedReportManagementActionResult;

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

export function SavedReportOperator({
  catalog,
  initialSavedReports
}: SavedReportOperatorProps) {
  const { showToast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const initialDefinition = catalog.entities[0] ?? null;
  const defaultLimit = String(
    initialDefinition?.limits.previewRows.defaultLimit ?? 25
  );
  const [savedReports, setSavedReports] = useState(initialSavedReports);
  const [activeDefinitionId, setActiveDefinitionId] = useState<string | null>(
    null
  );
  const [selectedEntity, setSelectedEntity] = useState(
    initialDefinition?.entity ?? ""
  );
  const [reportName, setReportName] = useState("Pipeline health preview");
  const [selectedFields, setSelectedFields] = useState<string[]>(
    defaultFieldKeys(initialDefinition)
  );
  const [previewLimit, setPreviewLimit] = useState(defaultLimit);
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
  const [result, setResult] = useState<SavedReportActionResult | null>(null);

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
  const activeSavedReport =
    activeDefinitionId === null
      ? null
      : savedReports.find((definition) => definition.id === activeDefinitionId) ??
        null;

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

  function applyDefinitionState(input: {
    entity: string;
    name: string;
    fields: readonly string[];
    filters: Record<string, string>;
    groupBy: readonly string[];
    chart: { type: string; dimensionKey: string | null; metricKey: string } | null;
    previewLimit: number;
  }) {
    const nextDefinition = catalog.entities.find(
      (definition) => definition.entity === input.entity
    );

    if (!nextDefinition) {
      return;
    }

    const [nextFilterKey, nextFilterValue] =
      Object.entries(input.filters)[0] ?? ["", ""];
    const fallbackChart = defaultChart(nextDefinition);

    setSelectedEntity(nextDefinition.entity);
    setReportName(input.name);
    setSelectedFields([...input.fields]);
    setPreviewLimit(String(input.previewLimit));
    setFilterKey(nextFilterKey);
    setFilterValue(nextFilterValue);
    setGroupBy(input.groupBy[0] ?? "");
    setChartType(input.chart?.type ?? fallbackChart?.type ?? "");
    setChartDimension(
      input.chart?.dimensionKey ?? fallbackChart?.defaultDimensionKey ?? ""
    );
    setChartMetric(input.chart?.metricKey ?? fallbackChart?.defaultMetricKey ?? "recordCount");
    setResult(null);
  }

  function formDataFromBuilder(): FormData | null {
    if (!formRef.current) {
      return null;
    }

    const formData = new FormData(formRef.current);

    if (activeDefinitionId) {
      formData.set("definitionId", activeDefinitionId);
    }

    return formData;
  }

  function runManagementAction(
    action: (formData: FormData) => Promise<SavedReportManagementActionResult>,
    options: {
      formData?: FormData;
      successTitle: string;
      errorTitle: string;
      nextActiveDefinitionId?: string | null;
    }
  ) {
    const formData = options.formData ?? formDataFromBuilder();

    if (!formData) {
      return;
    }

    startTransition(() => {
      void (async () => {
        const actionResult = await action(formData);

        if (actionResult.definitions) {
          setSavedReports(actionResult.definitions);
        }

        if (actionResult.ok && actionResult.definition) {
          const nextActiveDefinitionId =
            options.nextActiveDefinitionId === undefined
              ? actionResult.definition.id
              : options.nextActiveDefinitionId;

          setActiveDefinitionId(nextActiveDefinitionId);
        } else if (options.nextActiveDefinitionId !== undefined) {
          setActiveDefinitionId(options.nextActiveDefinitionId);
        }

        setResult(actionResult);
        showToast({
          title: actionResult.ok ? options.successTitle : options.errorTitle,
          description: actionResult.message,
          variant: actionResult.ok ? "success" : "error"
        });
      })();
    });
  }

  function actionFormData(definitionId: string): FormData {
    const formData = new FormData();

    formData.set("definitionId", definitionId);

    return formData;
  }

  function handleEntityChange(nextEntity: string) {
    const nextDefinition = catalog.entities.find(
      (definition) => definition.entity === nextEntity
    );

    if (!nextDefinition) {
      return;
    }

    const nextChart = defaultChart(nextDefinition);

    setActiveDefinitionId(null);
    setSelectedEntity(nextDefinition.entity);
    setReportName(`${nextDefinition.label} saved report`);
    setSelectedFields(defaultFieldKeys(nextDefinition));
    setPreviewLimit(String(nextDefinition.limits.previewRows.defaultLimit));
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

  function handleCreateSavedReport() {
    runManagementAction(createSavedReportDefinitionAction, {
      successTitle: "Saved report created",
      errorTitle: "Saved report create failed"
    });
  }

  function handleUpdateSavedReport() {
    runManagementAction(updateSavedReportDefinitionAction, {
      successTitle: "Saved report updated",
      errorTitle: "Saved report update failed"
    });
  }

  function handleLoadSavedReport(definition: SavedReportDefinitionSnapshot) {
    setActiveDefinitionId(definition.id);
    applyDefinitionState(definition);
    showToast({
      title: "Saved report loaded",
      description: `${definition.name} is ready to edit or preview.`,
      variant: "success"
    });
  }

  function handlePreviewSavedReport(definitionId: string) {
    runManagementAction(previewPersistedSavedReportDefinitionAction, {
      formData: actionFormData(definitionId),
      successTitle: "Saved report preview ready",
      errorTitle: "Saved report preview failed"
    });
  }

  function handleArchiveSavedReport(definitionId: string) {
    runManagementAction(archiveSavedReportDefinitionAction, {
      formData: actionFormData(definitionId),
      successTitle: "Saved report archived",
      errorTitle: "Saved report archive failed",
      nextActiveDefinitionId:
        activeDefinitionId === definitionId ? null : activeDefinitionId
    });
  }

  function handleDeleteSavedReport(definitionId: string) {
    runManagementAction(deleteSavedReportDefinitionAction, {
      formData: actionFormData(definitionId),
      successTitle: "Saved report deleted",
      errorTitle: "Saved report delete failed",
      nextActiveDefinitionId:
        activeDefinitionId === definitionId ? null : activeDefinitionId
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

      <Card>
        <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
          <div className="space-y-1.5">
            <CardTitle>Saved Definitions</CardTitle>
            <p className="text-sm text-muted-foreground">
              Manage persisted report definitions on the current reports surface.
            </p>
          </div>
          <Badge variant="outline" data-testid="saved-report-persisted-count">
            {formatNumber(savedReports.length)} saved
          </Badge>
        </CardHeader>
        <CardContent>
          {savedReports.length === 0 ? (
            <EmptyState
              title="No saved reports yet"
              description="Save a builder definition to make it available for loading and previewing."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table data-testid="saved-report-persisted-list">
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Fields</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {savedReports.map((definition) => (
                    <TableRow
                      key={definition.id}
                      data-testid={`saved-report-row-${testIdToken(definition.name)}`}
                    >
                      <TableCell className="font-medium">
                        {definition.name}
                        {activeDefinitionId === definition.id ? (
                          <span className="mt-1 block text-xs text-muted-foreground">
                            loaded in builder
                          </span>
                        ) : null}
                      </TableCell>
                      <TableCell>{entityLabel(catalog, definition.entity)}</TableCell>
                      <TableCell>{definition.fields.length}</TableCell>
                      <TableCell>{formatDate(definition.updatedAt)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleLoadSavedReport(definition)}
                            disabled={isPending}
                            data-testid="saved-report-saved-load"
                          >
                            <FolderOpen className="h-4 w-4" aria-hidden="true" />
                            Load
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handlePreviewSavedReport(definition.id)}
                            loading={isPending}
                            data-testid="saved-report-saved-preview"
                          >
                            <Eye className="h-4 w-4" aria-hidden="true" />
                            Preview saved
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleArchiveSavedReport(definition.id)}
                            disabled={isPending}
                            data-testid="saved-report-saved-archive"
                          >
                            <Archive className="h-4 w-4" aria-hidden="true" />
                            Archive
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteSavedReport(definition.id)}
                            disabled={isPending}
                            data-testid="saved-report-saved-delete"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

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
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
              {activeDefinitionId ? (
                <input
                  type="hidden"
                  name="definitionId"
                  value={activeDefinitionId}
                />
              ) : null}
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
                      value={reportName}
                      onChange={(event) => {
                        setReportName(event.target.value);
                        setResult(null);
                      }}
                      maxLength={120}
                      data-testid="saved-report-name-input"
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
                      value={previewLimit}
                      onChange={(event) => {
                        setPreviewLimit(event.target.value);
                        setResult(null);
                      }}
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
                  {selectedDefinition.label}
                  {activeSavedReport ? ` from ${activeSavedReport.name}.` : "."}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    loading={isPending}
                    onClick={handleCreateSavedReport}
                    data-testid="saved-report-create-submit"
                  >
                    <Save className="h-4 w-4" aria-hidden="true" />
                    Save new
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    loading={isPending}
                    onClick={handleUpdateSavedReport}
                    disabled={!activeDefinitionId || isPending}
                    data-testid="saved-report-update-submit"
                  >
                    <Save className="h-4 w-4" aria-hidden="true" />
                    Update saved
                  </Button>
                  <Button
                    type="submit"
                    loading={isPending}
                    data-testid="saved-report-preview-submit"
                  >
                    <Play className="h-4 w-4" aria-hidden="true" />
                    {isPending ? "Previewing..." : "Preview report"}
                  </Button>
                </div>
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

function PreviewErrors({ result }: { result: SavedReportActionResult }) {
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

function entityLabel(
  catalog: SavedReportDefinitionCatalog,
  entity: string
): string {
  return (
    catalog.entities.find((definition) => definition.entity === entity)?.label ??
    entity
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

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
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
