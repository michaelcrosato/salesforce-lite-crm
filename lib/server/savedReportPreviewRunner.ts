import type {
  Account,
  Activity,
  Area,
  Campaign,
  Case,
  Contact,
  DealerOrder,
  Lead,
  Task
} from "@prisma/client";
import { z } from "zod/v4";
import {
  listAccounts,
  listActivities,
  listAreas,
  listCampaigns,
  listCases,
  listContacts,
  listDealerOrders,
  listLeads,
  listOpportunities,
  listTasks,
  type AccountListOptions,
  type ActivityListOptions,
  type AreaListOptions,
  type CampaignListOptions,
  type CaseListOptions,
  type ContactListOptions,
  type DealerOrderListOptions,
  type LeadListOptions,
  type OpportunityListOptions,
  type TaskListOptions
} from "@/lib/crm/crmClient";
import type { Opportunity } from "@/lib/crm/registry";
import {
  SAVED_REPORT_DEFAULT_PREVIEW_LIMIT,
  SAVED_REPORT_MAX_PREVIEW_LIMIT,
  getSavedReportEntityDefinition,
  validateSavedReportDefinitionDraft,
  type SavedReportChartType,
  type SavedReportDefinitionDraft,
  type SavedReportDefinitionEntity,
  type SavedReportEntityDefinition,
  type SavedReportFieldContract,
  type SavedReportMetricAggregation,
  type SavedReportMetricContract
} from "@/lib/server/savedReportDefinitions";

export const SAVED_REPORT_PREVIEW_CONTENT_TYPE =
  "application/json; charset=utf-8" as const;

type SavedReportRawValue = string | number | Date | null;
type SavedReportSourceRow = { id: string } & Record<
  string,
  SavedReportRawValue | undefined
>;
type SavedReportSerializableValue = string | number | null;

export type SavedReportPreviewValidationError = {
  code: string;
  path: string | null;
  message: string;
};

export type SavedReportPreviewCell = {
  fieldKey: string;
  label: string;
  valueType: SavedReportFieldContract["valueType"];
  value: SavedReportSerializableValue;
};

export type SavedReportPreviewRow = {
  recordId: string;
  values: Record<string, SavedReportSerializableValue>;
  cells: readonly SavedReportPreviewCell[];
};

export type SavedReportPreviewAggregate = {
  key: string;
  label: string;
  fieldKey: string | null;
  aggregation: SavedReportMetricAggregation;
  valueType: SavedReportMetricContract["valueType"];
  value: number | null;
};

export type SavedReportPreviewGroup = {
  key: string;
  dimensions: Record<string, SavedReportSerializableValue>;
  rowCount: number;
  aggregates: readonly SavedReportPreviewAggregate[];
};

export type SavedReportPreviewChartPoint = {
  key: string;
  label: string;
  dimension: SavedReportSerializableValue;
  rowCount: number;
  value: number | null;
};

export type SavedReportPreviewChart = {
  type: SavedReportChartType;
  dimensionKey: string | null;
  metricKey: string;
  metricLabel: string;
  points: readonly SavedReportPreviewChartPoint[];
};

export type SavedReportPreviewReadFlags = {
  metadata: boolean;
  database: boolean;
  adapterInternals: false;
  reportServices: false;
};

export type SavedReportPreviewWriteFlags = {
  database: false;
  mutations: false;
  schemas: false;
  routes: false;
  files: false;
  externalServices: false;
  backgroundJobs: false;
  rawSql: false;
};

export type SavedReportPreviewResult = {
  contentType: typeof SAVED_REPORT_PREVIEW_CONTENT_TYPE;
  previewType: "saved-report-preview";
  status: "valid" | "invalid";
  errors: readonly SavedReportPreviewValidationError[];
  definition:
    | {
        entity: SavedReportDefinitionEntity;
        label: string;
        route: string;
      }
    | null;
  normalizedDraft: SavedReportDefinitionDraft | null;
  limit: number | null;
  rowCount: number;
  rows: readonly SavedReportPreviewRow[];
  aggregates: readonly SavedReportPreviewAggregate[];
  groups: readonly SavedReportPreviewGroup[];
  chart: SavedReportPreviewChart | null;
  source: {
    runnerModule: "lib/server/savedReportPreviewRunner.ts";
    definitionModule: "lib/server/savedReportDefinitions.ts";
    listAdapterModule: "lib/crm/crmClient.ts";
    listQueryModule: "lib/services/listQuery.ts";
    executionScope: "bounded-read-only-preview";
  };
  read: SavedReportPreviewReadFlags;
  write: SavedReportPreviewWriteFlags;
};

const savedReportPreviewInputSchema = z
  .object({
    entity: z.unknown(),
    name: z.unknown().optional(),
    fields: z.unknown(),
    filters: z.unknown().optional(),
    groupBy: z.unknown().optional(),
    chart: z.unknown().optional(),
    limit: z.coerce
      .number()
      .int("Preview limit must be a whole number.")
      .min(1, "Preview limit must be at least 1.")
      .max(
        SAVED_REPORT_MAX_PREVIEW_LIMIT,
        `Preview limit cannot exceed ${SAVED_REPORT_MAX_PREVIEW_LIMIT}.`
      )
      .optional()
  })
  .strict();

export async function runSavedReportPreview(
  input: unknown
): Promise<SavedReportPreviewResult> {
  const parsed = savedReportPreviewInputSchema.safeParse(input);

  if (!parsed.success) {
    return invalidPreview(errorsFromZodError(parsed.error));
  }

  let draft: SavedReportDefinitionDraft;

  try {
    draft = validateSavedReportDefinitionDraft(draftInput(parsed.data));
  } catch (error) {
    return invalidPreview(errorsFromUnknown(error));
  }

  const definition = getSavedReportEntityDefinition(draft.entity);

  if (definition === null) {
    return invalidPreview([
      {
        code: "missing_definition",
        path: "entity",
        message: `Saved report entity '${draft.entity}' has no definition.`
      }
    ]);
  }

  const limit = parsed.data.limit ?? SAVED_REPORT_DEFAULT_PREVIEW_LIMIT;
  const sourceRows = await listPreviewRows(draft, limit);
  const rows = sourceRows.map((row) => projectRow(row, definition, draft.fields));
  const aggregates = buildAggregates(sourceRows, definition.metrics);
  const groups = buildGroups(sourceRows, definition, draft.groupBy);
  const chart =
    draft.chart === null
      ? null
      : buildChart(sourceRows, definition, draft.chart);

  return {
    ...basePreview(),
    status: "valid",
    errors: [],
    definition: {
      entity: definition.entity,
      label: definition.label,
      route: definition.route
    },
    normalizedDraft: draft,
    limit,
    rowCount: rows.length,
    rows,
    aggregates,
    groups,
    chart,
    read: {
      metadata: true,
      database: true,
      adapterInternals: false,
      reportServices: false
    }
  };
}

function draftInput(
  input: z.infer<typeof savedReportPreviewInputSchema>
): Record<string, unknown> {
  const draft: Record<string, unknown> = {
    entity: input.entity,
    fields: input.fields
  };

  if (input.name !== undefined) {
    draft.name = input.name;
  }

  if (input.filters !== undefined) {
    draft.filters = input.filters;
  }

  if (input.groupBy !== undefined) {
    draft.groupBy = input.groupBy;
  }

  if (input.chart !== undefined) {
    draft.chart = input.chart;
  }

  return draft;
}

function basePreview(): Omit<
  SavedReportPreviewResult,
  | "status"
  | "errors"
  | "definition"
  | "normalizedDraft"
  | "limit"
  | "rowCount"
  | "rows"
  | "aggregates"
  | "groups"
  | "chart"
  | "read"
> {
  return {
    contentType: SAVED_REPORT_PREVIEW_CONTENT_TYPE,
    previewType: "saved-report-preview",
    source: {
      runnerModule: "lib/server/savedReportPreviewRunner.ts",
      definitionModule: "lib/server/savedReportDefinitions.ts",
      listAdapterModule: "lib/crm/crmClient.ts",
      listQueryModule: "lib/services/listQuery.ts",
      executionScope: "bounded-read-only-preview"
    },
    write: noWrites()
  };
}

function invalidPreview(
  errors: readonly SavedReportPreviewValidationError[]
): SavedReportPreviewResult {
  return {
    ...basePreview(),
    status: "invalid",
    errors,
    definition: null,
    normalizedDraft: null,
    limit: null,
    rowCount: 0,
    rows: [],
    aggregates: [],
    groups: [],
    chart: null,
    read: {
      metadata: false,
      database: false,
      adapterInternals: false,
      reportServices: false
    }
  };
}

function noWrites(): SavedReportPreviewWriteFlags {
  return {
    database: false,
    mutations: false,
    schemas: false,
    routes: false,
    files: false,
    externalServices: false,
    backgroundJobs: false,
    rawSql: false
  };
}

function errorsFromUnknown(error: unknown): SavedReportPreviewValidationError[] {
  if (error instanceof z.ZodError) {
    return errorsFromZodError(error);
  }

  if (error instanceof Error) {
    return [
      {
        code: "invalid_definition",
        path: null,
        message: error.message
      }
    ];
  }

  return [
    {
      code: "invalid_definition",
      path: null,
      message: "Saved report preview validation failed."
    }
  ];
}

function errorsFromZodError(
  error: z.ZodError
): SavedReportPreviewValidationError[] {
  return error.issues.map((issue) => ({
    code: issue.code,
    path: issue.path.length > 0 ? issue.path.join(".") : null,
    message: issue.message
  }));
}

async function listPreviewRows(
  draft: SavedReportDefinitionDraft,
  limit: number
): Promise<SavedReportSourceRow[]> {
  const baseOptions = {
    page: 1,
    pageSize: limit
  };

  switch (draft.entity) {
    case "accounts":
      return (
        await listAccounts({
          ...baseOptions,
          filters: draft.filters as AccountListOptions["filters"]
        })
      ).map(accountRow);
    case "contacts":
      return (
        await listContacts({
          ...baseOptions,
          filters: draft.filters as ContactListOptions["filters"]
        })
      ).map(contactRow);
    case "opportunities":
      return (
        await listOpportunities({
          ...baseOptions,
          filters: draft.filters as OpportunityListOptions["filters"]
        })
      ).map(opportunityRow);
    case "leads":
      return (
        await listLeads({
          ...baseOptions,
          filters: draft.filters as LeadListOptions["filters"]
        })
      ).map(leadRow);
    case "activities":
      return (
        await listActivities({
          ...baseOptions,
          filters: draft.filters as ActivityListOptions["filters"]
        })
      ).map(activityRow);
    case "dealer-orders":
      return (
        await listDealerOrders({
          ...baseOptions,
          filters: draft.filters as DealerOrderListOptions["filters"]
        })
      ).map(dealerOrderRow);
    case "areas":
      return (
        await listAreas({
          ...baseOptions,
          filters: draft.filters as AreaListOptions["filters"]
        })
      ).map(areaRow);
    case "tasks":
      return (
        await listTasks({
          ...baseOptions,
          filters: draft.filters as TaskListOptions["filters"]
        })
      ).map(taskRow);
    case "cases":
      return (
        await listCases({
          ...baseOptions,
          filters: draft.filters as CaseListOptions["filters"]
        })
      ).map(caseRow);
    case "campaigns":
      return (
        await listCampaigns({
          ...baseOptions,
          filters: draft.filters as CampaignListOptions["filters"]
        })
      ).map(campaignRow);
    default:
      return assertNever(draft.entity);
  }
}

function accountRow(account: Account): SavedReportSourceRow {
  return {
    id: account.id,
    name: account.name,
    status: account.status,
    industry: account.industry,
    city: account.city,
    region: account.region,
    healthScore: account.healthScore,
    ownerId: account.ownerId,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt
  };
}

function contactRow(contact: Contact): SavedReportSourceRow {
  return {
    id: contact.id,
    firstName: contact.firstName,
    lastName: contact.lastName,
    status: contact.status,
    accountId: contact.accountId,
    title: contact.title,
    createdAt: contact.createdAt,
    updatedAt: contact.updatedAt
  };
}

function opportunityRow(opportunity: Opportunity): SavedReportSourceRow {
  return {
    id: opportunity.id,
    name: opportunity.name,
    stage: opportunity.stage,
    value: opportunity.value,
    probability: opportunity.probability,
    accountId: opportunity.accountId,
    ownerId: opportunity.ownerId,
    expectedCloseDate: opportunity.expectedCloseDate,
    lastActivityAt: opportunity.lastActivityAt,
    createdAt: opportunity.createdAt,
    updatedAt: opportunity.updatedAt
  };
}

function leadRow(lead: Lead): SavedReportSourceRow {
  return {
    id: lead.id,
    firstName: lead.firstName,
    lastName: lead.lastName,
    status: lead.status,
    source: lead.source,
    province: lead.province,
    areaId: lead.areaId,
    assignedOrderId: lead.assignedOrderId,
    createdAt: lead.createdAt,
    updatedAt: lead.updatedAt
  };
}

function activityRow(activity: Activity): SavedReportSourceRow {
  return {
    id: activity.id,
    type: activity.type,
    title: activity.title,
    accountId: activity.accountId,
    contactId: activity.contactId,
    dealId: activity.dealId,
    leadId: activity.leadId,
    createdAt: activity.createdAt
  };
}

function dealerOrderRow(dealerOrder: DealerOrder): SavedReportSourceRow {
  return {
    id: dealerOrder.id,
    name: dealerOrder.name,
    status: dealerOrder.status,
    monthlyQuota: dealerOrder.monthlyQuota,
    accountId: dealerOrder.accountId,
    startDate: dealerOrder.startDate,
    endDate: dealerOrder.endDate,
    createdAt: dealerOrder.createdAt
  };
}

function areaRow(area: Area): SavedReportSourceRow {
  return {
    id: area.id,
    name: area.name,
    province: area.province,
    region: area.region,
    postalPrefixes: area.postalPrefixes,
    createdAt: area.createdAt
  };
}

function taskRow(task: Task): SavedReportSourceRow {
  return {
    id: task.id,
    title: task.title,
    status: task.status,
    priority: task.priority,
    ownerId: task.ownerId,
    dueDate: task.dueDate,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt
  };
}

function caseRow(crmCase: Case): SavedReportSourceRow {
  return {
    id: crmCase.id,
    subject: crmCase.subject,
    status: crmCase.status,
    priority: crmCase.priority,
    ownerId: crmCase.ownerId,
    accountId: crmCase.accountId,
    createdAt: crmCase.createdAt,
    updatedAt: crmCase.updatedAt
  };
}

function campaignRow(campaign: Campaign): SavedReportSourceRow {
  return {
    id: campaign.id,
    name: campaign.name,
    status: campaign.status,
    budget: campaign.budget,
    ownerId: campaign.ownerId,
    startDate: campaign.startDate,
    endDate: campaign.endDate,
    createdAt: campaign.createdAt,
    updatedAt: campaign.updatedAt
  };
}

function projectRow(
  row: SavedReportSourceRow,
  definition: SavedReportEntityDefinition,
  fieldKeys: readonly string[]
): SavedReportPreviewRow {
  const cells = fieldKeys.map((fieldKey) => {
    const field = requireField(definition, fieldKey);
    const value = serializeValue(readFieldValue(row, field));

    return {
      fieldKey,
      label: field.label,
      valueType: field.valueType,
      value
    };
  });
  const values: Record<string, SavedReportSerializableValue> = {};

  for (const cell of cells) {
    values[cell.fieldKey] = cell.value;
  }

  return {
    recordId: row.id,
    values,
    cells
  };
}

function buildAggregates(
  rows: readonly SavedReportSourceRow[],
  metrics: readonly SavedReportMetricContract[]
): SavedReportPreviewAggregate[] {
  return metrics.map((metric) => aggregateMetric(rows, metric));
}

function aggregateMetric(
  rows: readonly SavedReportSourceRow[],
  metric: SavedReportMetricContract
): SavedReportPreviewAggregate {
  return {
    key: metric.key,
    label: metric.label,
    fieldKey: metric.fieldKey,
    aggregation: metric.aggregation,
    valueType: metric.valueType,
    value: aggregateMetricValue(rows, metric)
  };
}

function aggregateMetricValue(
  rows: readonly SavedReportSourceRow[],
  metric: SavedReportMetricContract
): number | null {
  if (metric.aggregation === "count") {
    return rows.length;
  }

  if (metric.fieldKey === null) {
    return null;
  }

  const fieldKey = metric.fieldKey;
  const values = rows
    .map((row) => row[fieldKey])
    .filter((value): value is number => typeof value === "number");

  if (values.length === 0) {
    return null;
  }

  return aggregateNumbers(values, metric.aggregation);
}

function aggregateNumbers(
  values: readonly number[],
  aggregation: Exclude<SavedReportMetricAggregation, "count">
): number {
  switch (aggregation) {
    case "sum":
      return values.reduce((total, value) => total + value, 0);
    case "avg":
      return values.reduce((total, value) => total + value, 0) / values.length;
    case "min":
      return Math.min(...values);
    case "max":
      return Math.max(...values);
    default:
      return assertNever(aggregation);
  }
}

function buildGroups(
  rows: readonly SavedReportSourceRow[],
  definition: SavedReportEntityDefinition,
  groupBy: readonly string[]
): SavedReportPreviewGroup[] {
  if (groupBy.length === 0) {
    return [];
  }

  const fields = groupBy.map((fieldKey) => requireField(definition, fieldKey));
  const groupedRows = new Map<string, SavedReportSourceRow[]>();
  const groupedDimensions = new Map<
    string,
    Record<string, SavedReportSerializableValue>
  >();

  for (const row of rows) {
    const dimensions = buildDimensions(row, fields);
    const key = groupKey(dimensions);
    const existingRows = groupedRows.get(key) ?? [];

    groupedRows.set(key, [...existingRows, row]);
    groupedDimensions.set(key, dimensions);
  }

  return [...groupedRows.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, groupRows]) => ({
      key,
      dimensions: groupedDimensions.get(key) ?? {},
      rowCount: groupRows.length,
      aggregates: buildAggregates(groupRows, definition.metrics)
    }));
}

function buildChart(
  rows: readonly SavedReportSourceRow[],
  definition: SavedReportEntityDefinition,
  chart: SavedReportDefinitionDraft["chart"]
): SavedReportPreviewChart | null {
  if (chart === null) {
    return null;
  }

  const metric = requireMetric(definition, chart.metricKey);

  if (chart.dimensionKey === null) {
    return {
      type: chart.type,
      dimensionKey: null,
      metricKey: metric.key,
      metricLabel: metric.label,
      points: [
        {
          key: "all",
          label: "All records",
          dimension: null,
          rowCount: rows.length,
          value: aggregateMetricValue(rows, metric)
        }
      ]
    };
  }

  const dimension = requireField(definition, chart.dimensionKey);
  const groupedRows = new Map<string, SavedReportSourceRow[]>();
  const groupedValues = new Map<string, SavedReportSerializableValue>();

  for (const row of rows) {
    const value = groupableValue(readFieldValue(row, dimension), dimension);
    const key = value === null ? "__null" : String(value);
    const existingRows = groupedRows.get(key) ?? [];

    groupedRows.set(key, [...existingRows, row]);
    groupedValues.set(key, value);
  }

  return {
    type: chart.type,
    dimensionKey: dimension.key,
    metricKey: metric.key,
    metricLabel: metric.label,
    points: [...groupedRows.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, groupRows]) => {
        const dimensionValue = groupedValues.get(key) ?? null;

        return {
          key,
          label: labelForValue(dimensionValue),
          dimension: dimensionValue,
          rowCount: groupRows.length,
          value: aggregateMetricValue(groupRows, metric)
        };
      })
  };
}

function buildDimensions(
  row: SavedReportSourceRow,
  fields: readonly SavedReportFieldContract[]
): Record<string, SavedReportSerializableValue> {
  const dimensions: Record<string, SavedReportSerializableValue> = {};

  for (const field of fields) {
    dimensions[field.key] = groupableValue(readFieldValue(row, field), field);
  }

  return dimensions;
}

function groupKey(dimensions: Record<string, SavedReportSerializableValue>): string {
  return Object.keys(dimensions)
    .sort()
    .map((key) => `${key}:${labelForValue(dimensions[key] ?? null)}`)
    .join("|");
}

function requireField(
  definition: SavedReportEntityDefinition,
  fieldKey: string
): SavedReportFieldContract {
  const field = definition.fields.find((candidate) => candidate.key === fieldKey);

  if (!field) {
    throw new Error(
      `Field '${fieldKey}' is not supported for saved ${definition.entity} reports.`
    );
  }

  return field;
}

function requireMetric(
  definition: SavedReportEntityDefinition,
  metricKey: string
): SavedReportMetricContract {
  const metric = definition.metrics.find(
    (candidate) => candidate.key === metricKey
  );

  if (!metric) {
    throw new Error(
      `Metric '${metricKey}' is not supported for saved ${definition.entity} reports.`
    );
  }

  return metric;
}

function readFieldValue(
  row: SavedReportSourceRow,
  field: SavedReportFieldContract
): SavedReportRawValue | undefined {
  for (const path of field.fieldPaths) {
    if (path.length !== 1) {
      continue;
    }

    const [key] = path;
    if (key === undefined) {
      // Unreachable: path.length !== 1 already continued above.
      continue;
    }
    const value = row[key];

    if (value !== undefined) {
      return value;
    }
  }

  return null;
}

function serializeValue(
  value: SavedReportRawValue | undefined
): SavedReportSerializableValue {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "string" || typeof value === "number") {
    return value;
  }

  return null;
}

function groupableValue(
  value: SavedReportRawValue | undefined,
  field: SavedReportFieldContract
): SavedReportSerializableValue {
  if (value instanceof Date && field.valueType === "date") {
    return value.toISOString().slice(0, 10);
  }

  return serializeValue(value);
}

function labelForValue(value: SavedReportSerializableValue): string {
  return value === null ? "None" : String(value);
}

function assertNever(value: never): never {
  throw new Error(`Unexpected saved report preview value: ${String(value)}`);
}
