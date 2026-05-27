import { z } from "zod";
import {
  LIST_FILTER_SUPPORT_ENTITIES,
  getListFilterSupportEntityCatalog,
  type ListFilterSupportEntity,
  type ListFilterSupportEntityCatalog,
  type ListFilterSupportFilter
} from "@/lib/server/listFilterSupportCatalog";

export const SAVED_REPORT_DEFINITION_CONTENT_TYPE =
  "application/json; charset=utf-8" as const;
export const SAVED_REPORT_DEFINITION_ENTITIES = LIST_FILTER_SUPPORT_ENTITIES;
export const SAVED_REPORT_CHART_TYPES = [
  "table",
  "bar",
  "line",
  "pie"
] as const;
export const SAVED_REPORT_DEFAULT_PREVIEW_LIMIT = 25;
export const SAVED_REPORT_MAX_PREVIEW_LIMIT = 100;

export type SavedReportDefinitionEntity = ListFilterSupportEntity;
export type SavedReportChartType = (typeof SAVED_REPORT_CHART_TYPES)[number];
export type SavedReportFieldValueType =
  | "activity_type"
  | "currency"
  | "date"
  | "id"
  | "number"
  | "percent"
  | "priority"
  | "stage"
  | "status"
  | "text";
export type SavedReportMetricAggregation = "count" | "sum" | "avg" | "min" | "max";
export type SavedReportFieldMetricAggregation = Exclude<
  SavedReportMetricAggregation,
  "count"
>;
export type SavedReportDateGranularity = "day" | "week" | "month";

export type SavedReportReadFlags = {
  metadata: true;
  database: false;
  adapterInternals: false;
};

export type SavedReportWriteFlags = {
  database: false;
  mutations: false;
  schemas: false;
  routes: false;
  files: false;
  externalServices: false;
  backgroundJobs: false;
  rawSql: false;
};

export type SavedReportFieldContract = {
  key: string;
  label: string;
  valueType: SavedReportFieldValueType;
  fieldPaths: readonly (readonly string[])[];
  selectable: true;
  groupable: boolean;
  metricAggregations: readonly SavedReportFieldMetricAggregation[];
};

export type SavedReportGroupingContract = {
  key: string;
  label: string;
  fieldKey: string;
  valueType: SavedReportFieldValueType;
  dateGranularities: readonly SavedReportDateGranularity[] | null;
};

export type SavedReportMetricContract = {
  key: string;
  label: string;
  fieldKey: string | null;
  aggregation: SavedReportMetricAggregation;
  valueType: "number" | "currency" | "percent";
};

export type SavedReportChartContract = {
  type: SavedReportChartType;
  label: string;
  defaultDimensionKey: string | null;
  defaultMetricKey: string;
  supportedDimensionKeys: readonly string[];
  supportedMetricKeys: readonly string[];
};

export type SavedReportLimitContract = {
  previewRows: {
    defaultLimit: typeof SAVED_REPORT_DEFAULT_PREVIEW_LIMIT;
    maxLimit: typeof SAVED_REPORT_MAX_PREVIEW_LIMIT;
  };
  selectedFields: {
    min: 1;
    max: 12;
  };
  groupings: {
    min: 0;
    max: 2;
  };
};

export type SavedReportEntityDefinition = {
  entity: SavedReportDefinitionEntity;
  label: string;
  route: string;
  sourceSurface: string;
  sourceModule: string;
  defaultSortBy: string;
  defaultSortOrder: "asc" | "desc";
  fieldCount: number;
  filterCount: number;
  groupingCount: number;
  metricCount: number;
  chartCount: number;
  fields: readonly SavedReportFieldContract[];
  filters: readonly ListFilterSupportFilter[];
  groupings: readonly SavedReportGroupingContract[];
  metrics: readonly SavedReportMetricContract[];
  charts: readonly SavedReportChartContract[];
  limits: SavedReportLimitContract;
  read: SavedReportReadFlags;
  write: SavedReportWriteFlags;
};

export type SavedReportDefinitionCatalog = {
  contentType: typeof SAVED_REPORT_DEFINITION_CONTENT_TYPE;
  catalogType: "saved-report-definition-catalog";
  entityCount: number;
  fieldCount: number;
  filterCount: number;
  groupingCount: number;
  metricCount: number;
  chartCount: number;
  entities: readonly SavedReportEntityDefinition[];
  source: {
    definitionModule: "lib/server/savedReportDefinitions.ts";
    listFilterCatalogModule: "lib/server/listFilterSupportCatalog.ts";
    listQueryModule: "lib/services/listQuery.ts";
    reportServicesModule: "lib/services/reports.ts";
    catalogScope: "saved-report-definition-contracts";
  };
  read: SavedReportReadFlags;
  write: SavedReportWriteFlags;
};

export type SavedReportDefinitionChartDraft = {
  type: SavedReportChartType;
  dimensionKey: string | null;
  metricKey: string;
};

export type SavedReportDefinitionDraft = {
  entity: SavedReportDefinitionEntity;
  name: string | null;
  fields: readonly string[];
  filters: Record<string, string>;
  groupBy: readonly string[];
  chart: SavedReportDefinitionChartDraft | null;
};

type FieldSeed = {
  key: string;
  label: string;
  valueType: SavedReportFieldValueType;
  fieldPaths: readonly (readonly string[])[];
  groupable?: true;
  metricAggregations?: readonly SavedReportFieldMetricAggregation[];
};

type EntitySeed = {
  entity: SavedReportDefinitionEntity;
  fields: readonly FieldSeed[];
};

const catalogInputSchema = z.object({}).strict();
const chartDraftSchema = z
  .object({
    type: z.enum(SAVED_REPORT_CHART_TYPES),
    dimensionKey: z.string().trim().min(1).optional(),
    metricKey: z.string().trim().min(1).optional()
  })
  .strict();
const savedReportDefinitionDraftSchema = z
  .object({
    entity: z.string().trim().min(1, "Entity is required."),
    name: z
      .string()
      .trim()
      .min(1, "Saved report name cannot be blank.")
      .max(120, "Saved report name cannot exceed 120 characters.")
      .optional(),
    fields: z
      .array(z.string().trim().min(1))
      .min(1, "At least one report field is required.")
      .max(12, "Saved report definitions can select at most 12 fields."),
    filters: z.record(z.unknown()).optional(),
    groupBy: z
      .array(z.string().trim().min(1))
      .max(2, "Saved report definitions can group by at most 2 fields.")
      .optional(),
    chart: chartDraftSchema.optional()
  })
  .strict();
const savedReportDefinitionEntitySet: ReadonlySet<string> = new Set(
  SAVED_REPORT_DEFINITION_ENTITIES
);

function readMetadata(): SavedReportReadFlags {
  return {
    metadata: true,
    database: false,
    adapterInternals: false
  };
}

function noWrites(): SavedReportWriteFlags {
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

function limits(): SavedReportLimitContract {
  return {
    previewRows: {
      defaultLimit: SAVED_REPORT_DEFAULT_PREVIEW_LIMIT,
      maxLimit: SAVED_REPORT_MAX_PREVIEW_LIMIT
    },
    selectedFields: {
      min: 1,
      max: 12
    },
    groupings: {
      min: 0,
      max: 2
    }
  };
}

function field(
  key: string,
  label: string,
  valueType: SavedReportFieldValueType,
  fieldPath: readonly string[],
  options: {
    groupable?: true;
    metricAggregations?: readonly SavedReportFieldMetricAggregation[];
  } = {}
): FieldSeed {
  return {
    key,
    label,
    valueType,
    fieldPaths: [fieldPath],
    ...options
  };
}

const entitySeeds = [
  {
    entity: "accounts",
    fields: [
      field("name", "Name", "text", ["name"]),
      field("status", "Status", "status", ["status"], { groupable: true }),
      field("industry", "Industry", "text", ["industry"], { groupable: true }),
      field("city", "City", "text", ["city"], { groupable: true }),
      field("region", "Region", "text", ["region"], { groupable: true }),
      field("healthScore", "Health score", "number", ["healthScore"], {
        metricAggregations: ["avg", "min", "max"]
      }),
      field("ownerId", "Owner", "id", ["ownerId"], { groupable: true }),
      field("createdAt", "Created at", "date", ["createdAt"], {
        groupable: true
      }),
      field("updatedAt", "Updated at", "date", ["updatedAt"], {
        groupable: true
      })
    ]
  },
  {
    entity: "contacts",
    fields: [
      field("firstName", "First name", "text", ["firstName"]),
      field("lastName", "Last name", "text", ["lastName"]),
      field("status", "Status", "status", ["status"], { groupable: true }),
      field("accountId", "Account", "id", ["accountId"], { groupable: true }),
      field("title", "Title", "text", ["title"], { groupable: true }),
      field("createdAt", "Created at", "date", ["createdAt"], {
        groupable: true
      }),
      field("updatedAt", "Updated at", "date", ["updatedAt"], {
        groupable: true
      })
    ]
  },
  {
    entity: "opportunities",
    fields: [
      field("name", "Name", "text", ["name"]),
      field("stage", "Stage", "stage", ["stage"], { groupable: true }),
      field("value", "Value", "currency", ["value"], {
        metricAggregations: ["sum", "avg", "min", "max"]
      }),
      field("probability", "Probability", "percent", ["probability"], {
        metricAggregations: ["avg", "min", "max"]
      }),
      field("accountId", "Account", "id", ["accountId"], { groupable: true }),
      field("ownerId", "Owner", "id", ["ownerId"], { groupable: true }),
      field("expectedCloseDate", "Expected close date", "date", [
        "expectedCloseDate"
      ], { groupable: true }),
      field("lastActivityAt", "Last activity at", "date", ["lastActivityAt"], {
        groupable: true
      }),
      field("createdAt", "Created at", "date", ["createdAt"], {
        groupable: true
      }),
      field("updatedAt", "Updated at", "date", ["updatedAt"], {
        groupable: true
      })
    ]
  },
  {
    entity: "leads",
    fields: [
      field("firstName", "First name", "text", ["firstName"]),
      field("lastName", "Last name", "text", ["lastName"]),
      field("status", "Status", "status", ["status"], { groupable: true }),
      field("source", "Source", "text", ["source"], { groupable: true }),
      field("province", "Province", "text", ["province"], { groupable: true }),
      field("areaId", "Area", "id", ["areaId"], { groupable: true }),
      field("assignedOrderId", "Assigned order", "id", ["assignedOrderId"], {
        groupable: true
      }),
      field("createdAt", "Created at", "date", ["createdAt"], {
        groupable: true
      }),
      field("updatedAt", "Updated at", "date", ["updatedAt"], {
        groupable: true
      })
    ]
  },
  {
    entity: "activities",
    fields: [
      field("type", "Type", "activity_type", ["type"], { groupable: true }),
      field("title", "Title", "text", ["title"]),
      field("accountId", "Account", "id", ["accountId"], { groupable: true }),
      field("contactId", "Contact", "id", ["contactId"], { groupable: true }),
      field("dealId", "Opportunity", "id", ["dealId"], { groupable: true }),
      field("leadId", "Lead", "id", ["leadId"], { groupable: true }),
      field("createdAt", "Created at", "date", ["createdAt"], {
        groupable: true
      })
    ]
  },
  {
    entity: "dealer-orders",
    fields: [
      field("name", "Name", "text", ["name"]),
      field("status", "Status", "status", ["status"], { groupable: true }),
      field("monthlyQuota", "Monthly quota", "number", ["monthlyQuota"], {
        metricAggregations: ["sum", "avg", "min", "max"]
      }),
      field("accountId", "Account", "id", ["accountId"], { groupable: true }),
      field("startDate", "Start date", "date", ["startDate"], {
        groupable: true
      }),
      field("endDate", "End date", "date", ["endDate"], { groupable: true }),
      field("createdAt", "Created at", "date", ["createdAt"], {
        groupable: true
      })
    ]
  },
  {
    entity: "areas",
    fields: [
      field("name", "Name", "text", ["name"]),
      field("province", "Province", "text", ["province"], { groupable: true }),
      field("region", "Region", "text", ["region"], { groupable: true }),
      field("postalPrefixes", "Postal prefixes", "text", ["postalPrefixes"]),
      field("createdAt", "Created at", "date", ["createdAt"], {
        groupable: true
      })
    ]
  },
  {
    entity: "tasks",
    fields: [
      field("title", "Title", "text", ["title"]),
      field("status", "Status", "status", ["status"], { groupable: true }),
      field("priority", "Priority", "priority", ["priority"], {
        groupable: true
      }),
      field("ownerId", "Owner", "id", ["ownerId"], { groupable: true }),
      field("dueDate", "Due date", "date", ["dueDate"], { groupable: true }),
      field("createdAt", "Created at", "date", ["createdAt"], {
        groupable: true
      }),
      field("updatedAt", "Updated at", "date", ["updatedAt"], {
        groupable: true
      })
    ]
  },
  {
    entity: "cases",
    fields: [
      field("subject", "Subject", "text", ["subject"]),
      field("status", "Status", "status", ["status"], { groupable: true }),
      field("priority", "Priority", "priority", ["priority"], {
        groupable: true
      }),
      field("ownerId", "Owner", "id", ["ownerId"], { groupable: true }),
      field("accountId", "Account", "id", ["accountId"], { groupable: true }),
      field("createdAt", "Created at", "date", ["createdAt"], {
        groupable: true
      }),
      field("updatedAt", "Updated at", "date", ["updatedAt"], {
        groupable: true
      })
    ]
  },
  {
    entity: "campaigns",
    fields: [
      field("name", "Name", "text", ["name"]),
      field("status", "Status", "status", ["status"], { groupable: true }),
      field("budget", "Budget", "currency", ["budget"], {
        metricAggregations: ["sum", "avg", "min", "max"]
      }),
      field("ownerId", "Owner", "id", ["ownerId"], { groupable: true }),
      field("startDate", "Start date", "date", ["startDate"], {
        groupable: true
      }),
      field("endDate", "End date", "date", ["endDate"], { groupable: true }),
      field("createdAt", "Created at", "date", ["createdAt"], {
        groupable: true
      }),
      field("updatedAt", "Updated at", "date", ["updatedAt"], {
        groupable: true
      })
    ]
  }
] as const satisfies readonly EntitySeed[];

function copyFieldPaths(
  fieldPaths: readonly (readonly string[])[]
): readonly (readonly string[])[] {
  return fieldPaths.map((fieldPath) => [...fieldPath]);
}

function buildField(seed: FieldSeed): SavedReportFieldContract {
  return {
    key: seed.key,
    label: seed.label,
    valueType: seed.valueType,
    fieldPaths: copyFieldPaths(seed.fieldPaths),
    selectable: true,
    groupable: seed.groupable === true,
    metricAggregations: [...(seed.metricAggregations ?? [])]
  };
}

function dateGranularities(
  field: SavedReportFieldContract
): readonly SavedReportDateGranularity[] | null {
  return field.valueType === "date" ? ["day", "week", "month"] : null;
}

function buildGrouping(
  fieldContract: SavedReportFieldContract
): SavedReportGroupingContract {
  return {
    key: fieldContract.key,
    label: fieldContract.label,
    fieldKey: fieldContract.key,
    valueType: fieldContract.valueType,
    dateGranularities: dateGranularities(fieldContract)
  };
}

function metricValueType(
  fieldContract: SavedReportFieldContract
): "number" | "currency" | "percent" {
  if (fieldContract.valueType === "currency") {
    return "currency";
  }

  if (fieldContract.valueType === "percent") {
    return "percent";
  }

  return "number";
}

function metricLabel(
  fieldContract: SavedReportFieldContract,
  aggregation: SavedReportFieldMetricAggregation
): string {
  const labels: Record<SavedReportFieldMetricAggregation, string> = {
    sum: "Total",
    avg: "Average",
    min: "Minimum",
    max: "Maximum"
  };

  return `${labels[aggregation]} ${fieldContract.label}`;
}

function buildMetrics(
  fields: readonly SavedReportFieldContract[]
): SavedReportMetricContract[] {
  const metrics: SavedReportMetricContract[] = [
    {
      key: "recordCount",
      label: "Record count",
      fieldKey: null,
      aggregation: "count",
      valueType: "number"
    }
  ];

  for (const fieldContract of fields) {
    for (const aggregation of fieldContract.metricAggregations) {
      metrics.push({
        key: `${fieldContract.key}.${aggregation}`,
        label: metricLabel(fieldContract, aggregation),
        fieldKey: fieldContract.key,
        aggregation,
        valueType: metricValueType(fieldContract)
      });
    }
  }

  return metrics;
}

function chartLabel(type: SavedReportChartType): string {
  const labels: Record<SavedReportChartType, string> = {
    table: "Table",
    bar: "Bar chart",
    line: "Line chart",
    pie: "Pie chart"
  };

  return labels[type];
}

function chartContract(
  type: SavedReportChartType,
  supportedDimensionKeys: readonly string[],
  supportedMetricKeys: readonly string[]
): SavedReportChartContract {
  return {
    type,
    label: chartLabel(type),
    defaultDimensionKey: supportedDimensionKeys[0] ?? null,
    defaultMetricKey: supportedMetricKeys[0] ?? "recordCount",
    supportedDimensionKeys: [...supportedDimensionKeys],
    supportedMetricKeys: [...supportedMetricKeys]
  };
}

function buildCharts(
  groupings: readonly SavedReportGroupingContract[],
  metrics: readonly SavedReportMetricContract[]
): SavedReportChartContract[] {
  const metricKeys = metrics.map((metric) => metric.key);
  const allDimensionKeys = groupings.map((grouping) => grouping.key);
  const dateDimensionKeys = groupings
    .filter((grouping) => grouping.valueType === "date")
    .map((grouping) => grouping.key);
  const categoryDimensionKeys = groupings
    .filter((grouping) => grouping.valueType !== "date")
    .map((grouping) => grouping.key);
  const charts: SavedReportChartContract[] = [
    chartContract("table", allDimensionKeys, metricKeys)
  ];

  if (allDimensionKeys.length > 0) {
    charts.push(chartContract("bar", allDimensionKeys, metricKeys));
  }

  if (dateDimensionKeys.length > 0) {
    charts.push(chartContract("line", dateDimensionKeys, metricKeys));
  }

  if (categoryDimensionKeys.length > 0) {
    charts.push(chartContract("pie", categoryDimensionKeys, metricKeys));
  }

  return charts;
}

function copyFilter(filterContract: ListFilterSupportFilter): ListFilterSupportFilter {
  return {
    ...filterContract,
    operators: [...filterContract.operators],
    fieldPaths: copyFieldPaths(filterContract.fieldPaths),
    allowedValues:
      filterContract.allowedValues === null
        ? null
        : [...filterContract.allowedValues]
  };
}

function requireListCatalog(
  entity: SavedReportDefinitionEntity
): ListFilterSupportEntityCatalog {
  const catalog = getListFilterSupportEntityCatalog(entity);

  if (catalog === null) {
    throw new Error(`Saved report entity '${entity}' has no list catalog.`);
  }

  return catalog;
}

function buildEntityDefinition(seed: EntitySeed): SavedReportEntityDefinition {
  const listCatalog = requireListCatalog(seed.entity);
  const fields = seed.fields.map(buildField);
  const groupings = fields
    .filter((fieldContract) => fieldContract.groupable)
    .map(buildGrouping);
  const metrics = buildMetrics(fields);
  const charts = buildCharts(groupings, metrics);
  const filters = listCatalog.filters.map(copyFilter);

  return {
    entity: seed.entity,
    label: listCatalog.label,
    route: listCatalog.route,
    sourceSurface: listCatalog.sourceSurface,
    sourceModule: listCatalog.sourceModule,
    defaultSortBy: listCatalog.defaultSortBy,
    defaultSortOrder: listCatalog.defaultSortOrder,
    fieldCount: fields.length,
    filterCount: filters.length,
    groupingCount: groupings.length,
    metricCount: metrics.length,
    chartCount: charts.length,
    fields,
    filters,
    groupings,
    metrics,
    charts,
    limits: limits(),
    read: readMetadata(),
    write: noWrites()
  };
}

export function isSavedReportDefinitionEntity(
  value: string
): value is SavedReportDefinitionEntity {
  return savedReportDefinitionEntitySet.has(value);
}

export function listSavedReportDefinitionEntities(): SavedReportDefinitionEntity[] {
  return [...SAVED_REPORT_DEFINITION_ENTITIES];
}

export function getSavedReportEntityDefinition(
  entity: string
): SavedReportEntityDefinition | null {
  if (!isSavedReportDefinitionEntity(entity)) {
    return null;
  }

  const seed = entitySeeds.find((candidate) => candidate.entity === entity);

  return seed ? buildEntityDefinition(seed) : null;
}

export function getSavedReportDefinitionCatalog(
  input: unknown = {}
): SavedReportDefinitionCatalog {
  catalogInputSchema.parse(input);

  const entities = entitySeeds.map(buildEntityDefinition);

  return {
    contentType: SAVED_REPORT_DEFINITION_CONTENT_TYPE,
    catalogType: "saved-report-definition-catalog",
    entityCount: entities.length,
    fieldCount: entities.reduce((total, entity) => total + entity.fieldCount, 0),
    filterCount: entities.reduce((total, entity) => total + entity.filterCount, 0),
    groupingCount: entities.reduce(
      (total, entity) => total + entity.groupingCount,
      0
    ),
    metricCount: entities.reduce((total, entity) => total + entity.metricCount, 0),
    chartCount: entities.reduce((total, entity) => total + entity.chartCount, 0),
    entities,
    source: {
      definitionModule: "lib/server/savedReportDefinitions.ts",
      listFilterCatalogModule: "lib/server/listFilterSupportCatalog.ts",
      listQueryModule: "lib/services/listQuery.ts",
      reportServicesModule: "lib/services/reports.ts",
      catalogScope: "saved-report-definition-contracts"
    },
    read: readMetadata(),
    write: noWrites()
  };
}

export function validateSavedReportDefinitionDraft(
  input: unknown
): SavedReportDefinitionDraft {
  const parsed = savedReportDefinitionDraftSchema.parse(input);

  if (!isSavedReportDefinitionEntity(parsed.entity)) {
    throw new Error(
      `Saved report definitions only support current CRM list entities. Unsupported entity: '${parsed.entity}'.`
    );
  }

  const definition = getSavedReportEntityDefinition(parsed.entity);

  if (definition === null) {
    throw new Error(`Saved report entity '${parsed.entity}' has no definition.`);
  }

  return {
    entity: definition.entity,
    name: parsed.name ?? null,
    fields: normalizeFieldKeys(parsed.fields, definition),
    filters: normalizeFilters(parsed.filters, definition),
    groupBy: normalizeGroupings(parsed.groupBy ?? [], definition),
    chart:
      parsed.chart === undefined
        ? null
        : normalizeChartDraft(parsed.chart, definition)
  };
}

function normalizeFieldKeys(
  fields: readonly string[],
  definition: SavedReportEntityDefinition
): string[] {
  const supportedFields = new Set(definition.fields.map((fieldContract) => fieldContract.key));
  const normalized: string[] = [];

  for (const fieldKey of fields) {
    if (!supportedFields.has(fieldKey)) {
      throw new Error(
        `Field '${fieldKey}' is not supported for saved ${definition.entity} reports.`
      );
    }

    if (!normalized.includes(fieldKey)) {
      normalized.push(fieldKey);
    }
  }

  return normalized;
}

function normalizeGroupings(
  groupBy: readonly string[],
  definition: SavedReportEntityDefinition
): string[] {
  const supportedGroupings = new Set(
    definition.groupings.map((grouping) => grouping.key)
  );
  const normalized: string[] = [];

  for (const groupingKey of groupBy) {
    if (!supportedGroupings.has(groupingKey)) {
      throw new Error(
        `Grouping '${groupingKey}' is not supported for saved ${definition.entity} reports.`
      );
    }

    if (!normalized.includes(groupingKey)) {
      normalized.push(groupingKey);
    }
  }

  return normalized;
}

function normalizeFilters(
  filters: Record<string, unknown> | undefined,
  definition: SavedReportEntityDefinition
): Record<string, string> {
  const normalized: Record<string, string> = {};

  if (!filters) {
    return normalized;
  }

  const supportedFilters = new Map(
    definition.filters.map((filterContract) => [filterContract.key, filterContract])
  );

  for (const key of Object.keys(filters).sort()) {
    const rawValue = filters[key];

    if (isEmptyFilterValue(rawValue)) {
      continue;
    }

    const filterContract = supportedFilters.get(key);

    if (!filterContract) {
      throw new Error(
        `Filter '${key}' is not supported for saved ${definition.entity} reports.`
      );
    }

    normalized[key] = normalizeFilterValue(filterContract, rawValue);
  }

  return normalized;
}

function normalizeFilterValue(
  filterContract: ListFilterSupportFilter,
  value: unknown
): string {
  if (filterContract.valueType === "date") {
    return normalizeDateFilterValue(filterContract.key, value);
  }

  if (typeof value !== "string") {
    throw new Error(`Filter '${filterContract.key}' must be a string value.`);
  }

  const normalized = value.trim();

  if (normalized.length === 0) {
    throw new Error(`Filter '${filterContract.key}' must not be blank.`);
  }

  if (
    filterContract.allowedValues !== null &&
    !filterContract.allowedValues.includes(normalized)
  ) {
    throw new Error(
      `Filter '${filterContract.key}' value '${normalized}' is not supported.`
    );
  }

  return normalized;
}

function normalizeDateFilterValue(key: string, value: unknown): string {
  const date =
    value instanceof Date
      ? value
      : typeof value === "string" || typeof value === "number"
        ? new Date(value)
        : null;

  if (!date || Number.isNaN(date.getTime())) {
    throw new Error(`Filter '${key}' must be a valid date value.`);
  }

  return date.toISOString();
}

function normalizeChartDraft(
  chart: z.infer<typeof chartDraftSchema>,
  definition: SavedReportEntityDefinition
): SavedReportDefinitionChartDraft {
  const chartContract = definition.charts.find(
    (candidate) => candidate.type === chart.type
  );

  if (!chartContract) {
    throw new Error(
      `Chart type '${chart.type}' is not supported for saved ${definition.entity} reports.`
    );
  }

  const dimensionKey = chart.dimensionKey ?? chartContract.defaultDimensionKey;
  const metricKey = chart.metricKey ?? chartContract.defaultMetricKey;

  if (
    dimensionKey !== null &&
    !chartContract.supportedDimensionKeys.includes(dimensionKey)
  ) {
    throw new Error(
      `Chart dimension '${dimensionKey}' is not supported for ${chart.type} saved ${definition.entity} reports.`
    );
  }

  if (chart.type !== "table" && dimensionKey === null) {
    throw new Error(
      `Chart type '${chart.type}' requires a supported dimension for saved ${definition.entity} reports.`
    );
  }

  if (!chartContract.supportedMetricKeys.includes(metricKey)) {
    throw new Error(
      `Chart metric '${metricKey}' is not supported for ${chart.type} saved ${definition.entity} reports.`
    );
  }

  return {
    type: chart.type,
    dimensionKey,
    metricKey
  };
}

function isEmptyFilterValue(value: unknown): boolean {
  return (
    value === undefined ||
    value === null ||
    (typeof value === "string" && value.trim().length === 0)
  );
}
