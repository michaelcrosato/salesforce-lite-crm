import { z } from "zod/v4";
import {
  ACCOUNT_STATUSES,
  ACTIVITY_TYPES,
  CONTACT_STATUSES,
  DEALER_ORDER_STATUSES,
  DEAL_STAGES,
  LEAD_STATUSES
} from "@/lib/crm-constants";
import {
  CAMPAIGN_STATUSES,
  CASE_STATUSES,
  TASK_STATUSES
} from "@/lib/crm/registry";
import {
  CSV_EXPORT_ENTITIES,
  getCsvExportDefinition,
  type CsvExportEntity
} from "@/lib/server/csvExport";
import type { SortOrder } from "@/lib/services/listQuery";

export const LIST_FILTER_SUPPORT_CATALOG_CONTENT_TYPE =
  "application/json; charset=utf-8" as const;

export const LIST_FILTER_SUPPORT_ENTITIES = CSV_EXPORT_ENTITIES;

export const LIST_FILTER_SUPPORT_SORT_ORDERS = [
  "asc",
  "desc"
] as const satisfies readonly SortOrder[];

export type ListFilterSupportEntity = CsvExportEntity;
export type ListFilterSupportValueType =
  | "activity_type"
  | "date"
  | "id"
  | "stage"
  | "status"
  | "text";
export type ListFilterSupportOperator =
  | "equals"
  | "contains"
  | "or_contains"
  | "gte"
  | "lte";

export type ListFilterSupportReadFlags = {
  metadata: true;
  database: false;
  adapterInternals: false;
};

export type ListFilterSupportWriteFlags = {
  database: false;
  mutations: false;
  schemas: false;
  routes: false;
  files: false;
  externalServices: false;
  backgroundJobs: false;
};

export type ListFilterSupportPagination = {
  page: {
    supported: true;
    min: 1;
  };
  pageSize: {
    supported: true;
    min: 1;
    max: 100;
  };
};

export type ListFilterSupportLegacyWindowInput = {
  supported: boolean;
  fields: readonly ("skip" | "take")[];
  sourceSurface: string | null;
};

export type ListFilterSupportSortKey = {
  key: string;
  label: string;
  fieldPaths: readonly (readonly string[])[];
  tieBreakerFieldPaths: readonly (readonly string[])[];
};

export type ListFilterSupportFilter = {
  key: string;
  label: string;
  valueType: ListFilterSupportValueType;
  operators: readonly ListFilterSupportOperator[];
  fieldPaths: readonly (readonly string[])[];
  allowedValues: readonly string[] | null;
  emptyValuesIgnored: true;
};

export type ListFilterSupportEntityCatalog = {
  entity: ListFilterSupportEntity;
  label: string;
  route: string;
  adapter: string;
  sourceSurface: string;
  sourceModule: string;
  defaultSortBy: string;
  defaultSortOrder: SortOrder;
  sortOrders: readonly SortOrder[];
  sortKeyCount: number;
  filterCount: number;
  filters: readonly ListFilterSupportFilter[];
  sortKeys: readonly ListFilterSupportSortKey[];
  pagination: ListFilterSupportPagination;
  legacyWindowInput: ListFilterSupportLegacyWindowInput;
  filterCombination: "and";
  emptyFilterValuesIgnored: true;
  read: ListFilterSupportReadFlags;
  write: ListFilterSupportWriteFlags;
};

export type ListFilterSupportCatalog = {
  contentType: typeof LIST_FILTER_SUPPORT_CATALOG_CONTENT_TYPE;
  catalogType: "list-filter-support-catalog";
  entityCount: number;
  filterCount: number;
  sortKeyCount: number;
  enumFilterCount: number;
  dateRangeFilterCount: number;
  entities: readonly ListFilterSupportEntityCatalog[];
  source: {
    adapterModule: "lib/crm/crmClient.ts";
    listQueryModule: "lib/services/listQuery.ts";
    filterCompilerModule: "lib/services/filterCompiler.ts";
    serviceListModules: readonly [
      "lib/services/tasks.ts",
      "lib/services/cases.ts",
      "lib/services/campaigns.ts"
    ];
    catalogScope: "current-crm-list-options";
  };
  read: ListFilterSupportReadFlags;
  write: ListFilterSupportWriteFlags;
};

type SortKeySeed = {
  key: string;
  label: string;
  fieldPaths: readonly (readonly string[])[];
  tieBreakerFieldPaths?: readonly (readonly string[])[];
};

type FilterSeed = {
  key: string;
  label: string;
  valueType: ListFilterSupportValueType;
  operators: readonly ListFilterSupportOperator[];
  fieldPaths: readonly (readonly string[])[];
  allowedValues?: readonly string[];
};

type EntitySeed = {
  entity: ListFilterSupportEntity;
  adapter: string;
  sourceSurface: string;
  sourceModule: string;
  defaultSortBy: string;
  defaultSortOrder: SortOrder;
  filters: readonly FilterSeed[];
  sortKeys: readonly SortKeySeed[];
  legacyWindowInput?: ListFilterSupportLegacyWindowInput;
};

const catalogInputSchema = z.object({}).strict();
const listFilterSupportEntitySet: ReadonlySet<string> = new Set(
  LIST_FILTER_SUPPORT_ENTITIES
);

function sourceSurface(adapter: string): string {
  return `lib/crm/crmClient.ts#${adapter}`;
}

function serviceSourceSurface(module: string, adapter: string): string {
  return `${module}#${adapter}`;
}

function noLegacyWindowInput(): ListFilterSupportLegacyWindowInput {
  return {
    supported: false,
    fields: [],
    sourceSurface: null
  };
}

function serviceLegacyWindowInput(
  source: string
): ListFilterSupportLegacyWindowInput {
  return {
    supported: true,
    fields: ["skip", "take"],
    sourceSurface: source
  };
}

function readMetadata(): ListFilterSupportReadFlags {
  return {
    metadata: true,
    database: false,
    adapterInternals: false
  };
}

function noWrites(): ListFilterSupportWriteFlags {
  return {
    database: false,
    mutations: false,
    schemas: false,
    routes: false,
    files: false,
    externalServices: false,
    backgroundJobs: false
  };
}

function pagination(): ListFilterSupportPagination {
  return {
    page: {
      supported: true,
      min: 1
    },
    pageSize: {
      supported: true,
      min: 1,
      max: 100
    }
  };
}

function sortKey(
  key: string,
  label: string,
  fieldPath: readonly string[],
  tieBreakerFieldPaths: readonly (readonly string[])[] = []
): SortKeySeed {
  return {
    key,
    label,
    fieldPaths: [fieldPath],
    tieBreakerFieldPaths
  };
}

function equalsFilter(
  key: string,
  label: string,
  valueType: ListFilterSupportValueType,
  fieldPath: readonly string[],
  allowedValues?: readonly string[]
): FilterSeed {
  return {
    key,
    label,
    valueType,
    operators: ["equals"],
    fieldPaths: [fieldPath],
    allowedValues
  };
}

function boundaryFilter(
  key: string,
  label: string,
  operator: "gte" | "lte",
  fieldPath: readonly string[]
): FilterSeed {
  return {
    key,
    label,
    valueType: "date",
    operators: [operator],
    fieldPaths: [fieldPath]
  };
}

function searchFilter(
  fieldPaths: readonly (readonly string[])[]
): FilterSeed {
  return {
    key: "search",
    label: "Search",
    valueType: "text",
    operators: ["or_contains"],
    fieldPaths
  };
}

const taskServiceSurface = serviceSourceSurface(
  "lib/services/tasks.ts",
  "listTasks"
);
const caseServiceSurface = serviceSourceSurface(
  "lib/services/cases.ts",
  "listCases"
);
const campaignServiceSurface = serviceSourceSurface(
  "lib/services/campaigns.ts",
  "listCampaigns"
);

const entitySeeds = [
  {
    entity: "accounts",
    adapter: "listAccounts",
    sourceSurface: sourceSurface("listAccounts"),
    sourceModule: "lib/crm/crmClient.ts",
    defaultSortBy: "name",
    defaultSortOrder: "asc",
    filters: [
      equalsFilter("status", "Status", "status", ["status"], ACCOUNT_STATUSES),
      equalsFilter("ownerId", "Owner", "id", ["ownerId"]),
      searchFilter([
        ["name"],
        ["domain"],
        ["industry"],
        ["city"],
        ["region"]
      ])
    ],
    sortKeys: [
      sortKey("name", "Name", ["name"]),
      sortKey("createdAt", "Created at", ["createdAt"]),
      sortKey("updatedAt", "Updated at", ["updatedAt"]),
      sortKey("healthScore", "Health score", ["healthScore"])
    ]
  },
  {
    entity: "contacts",
    adapter: "listContacts",
    sourceSurface: sourceSurface("listContacts"),
    sourceModule: "lib/crm/crmClient.ts",
    defaultSortBy: "lastName",
    defaultSortOrder: "asc",
    filters: [
      equalsFilter("status", "Status", "status", ["status"], CONTACT_STATUSES),
      equalsFilter("accountId", "Account", "id", ["accountId"]),
      searchFilter([["firstName"], ["lastName"], ["email"], ["title"]])
    ],
    sortKeys: [
      sortKey("lastName", "Last name", ["lastName"]),
      sortKey("firstName", "First name", ["firstName"]),
      sortKey("createdAt", "Created at", ["createdAt"]),
      sortKey("updatedAt", "Updated at", ["updatedAt"])
    ]
  },
  {
    entity: "opportunities",
    adapter: "listOpportunities",
    sourceSurface: sourceSurface("listOpportunities"),
    sourceModule: "lib/crm/crmClient.ts",
    defaultSortBy: "updatedAt",
    defaultSortOrder: "desc",
    filters: [
      equalsFilter("stage", "Stage", "stage", ["stage"], DEAL_STAGES),
      equalsFilter("accountId", "Account", "id", ["accountId"]),
      equalsFilter("ownerId", "Owner", "id", ["ownerId"]),
      {
        ...searchFilter([["name"]]),
        operators: ["contains"]
      }
    ],
    sortKeys: [
      sortKey("name", "Name", ["name"]),
      sortKey("stage", "Stage", ["stage"]),
      sortKey("value", "Value", ["value"]),
      sortKey("createdAt", "Created at", ["createdAt"]),
      sortKey("updatedAt", "Updated at", ["updatedAt"])
    ]
  },
  {
    entity: "leads",
    adapter: "listLeads",
    sourceSurface: sourceSurface("listLeads"),
    sourceModule: "lib/crm/crmClient.ts",
    defaultSortBy: "createdAt",
    defaultSortOrder: "desc",
    filters: [
      equalsFilter("status", "Status", "status", ["status"], LEAD_STATUSES),
      equalsFilter("assignedOrderId", "Assigned order", "id", [
        "assignedOrderId"
      ]),
      equalsFilter("areaId", "Area", "id", ["areaId"]),
      searchFilter([
        ["firstName"],
        ["lastName"],
        ["email"],
        ["phone"],
        ["postalCode"],
        ["source"]
      ])
    ],
    sortKeys: [
      sortKey("lastName", "Last name", ["lastName"]),
      sortKey("firstName", "First name", ["firstName"]),
      sortKey("createdAt", "Created at", ["createdAt"]),
      sortKey("updatedAt", "Updated at", ["updatedAt"])
    ]
  },
  {
    entity: "activities",
    adapter: "listActivities",
    sourceSurface: sourceSurface("listActivities"),
    sourceModule: "lib/crm/crmClient.ts",
    defaultSortBy: "createdAt",
    defaultSortOrder: "desc",
    filters: [
      equalsFilter("type", "Type", "activity_type", ["type"], ACTIVITY_TYPES),
      equalsFilter("accountId", "Account", "id", ["accountId"]),
      equalsFilter("contactId", "Contact", "id", ["contactId"]),
      equalsFilter("dealId", "Opportunity", "id", ["dealId"]),
      equalsFilter("leadId", "Lead", "id", ["leadId"]),
      equalsFilter("taskId", "Task", "id", ["taskId"]),
      equalsFilter("caseId", "Case", "id", ["caseId"])
    ],
    sortKeys: [
      sortKey("createdAt", "Created at", ["createdAt"]),
      sortKey("type", "Type", ["type"]),
      sortKey("title", "Title", ["title"])
    ]
  },
  {
    entity: "dealer-orders",
    adapter: "listDealerOrders",
    sourceSurface: sourceSurface("listDealerOrders"),
    sourceModule: "lib/crm/crmClient.ts",
    defaultSortBy: "startDate",
    defaultSortOrder: "desc",
    filters: [
      equalsFilter("status", "Status", "status", ["status"], [
        ...DEALER_ORDER_STATUSES
      ]),
      equalsFilter("accountId", "Account", "id", ["accountId"])
    ],
    sortKeys: [
      sortKey("name", "Name", ["name"]),
      sortKey("status", "Status", ["status"]),
      sortKey("startDate", "Start date", ["startDate"]),
      sortKey("createdAt", "Created at", ["createdAt"])
    ]
  },
  {
    entity: "areas",
    adapter: "listAreas",
    sourceSurface: sourceSurface("listAreas"),
    sourceModule: "lib/crm/crmClient.ts",
    defaultSortBy: "name",
    defaultSortOrder: "asc",
    filters: [
      equalsFilter("province", "Province", "text", ["province"]),
      searchFilter([["name"], ["province"], ["region"], ["postalPrefixes"]])
    ],
    sortKeys: [
      sortKey("name", "Name", ["name"]),
      sortKey("province", "Province", ["province"]),
      sortKey("createdAt", "Created at", ["createdAt"])
    ]
  },
  {
    entity: "tasks",
    adapter: "listTasks",
    sourceSurface: taskServiceSurface,
    sourceModule: "lib/services/tasks.ts",
    defaultSortBy: "dueDate",
    defaultSortOrder: "asc",
    legacyWindowInput: serviceLegacyWindowInput(taskServiceSurface),
    filters: [
      equalsFilter("status", "Status", "status", ["status"], TASK_STATUSES),
      equalsFilter("ownerId", "Owner", "id", ["ownerId"]),
      boundaryFilter("dueDateFrom", "Due date from", "gte", ["dueDate"]),
      boundaryFilter("dueDateTo", "Due date to", "lte", ["dueDate"])
    ],
    sortKeys: [
      sortKey("dueDate", "Due date", ["dueDate"], [["createdAt"]]),
      sortKey("createdAt", "Created at", ["createdAt"]),
      sortKey("updatedAt", "Updated at", ["updatedAt"]),
      sortKey("status", "Status", ["status"], [["createdAt"]]),
      sortKey("priority", "Priority", ["priority"], [["createdAt"]])
    ]
  },
  {
    entity: "cases",
    adapter: "listCases",
    sourceSurface: caseServiceSurface,
    sourceModule: "lib/services/cases.ts",
    defaultSortBy: "updatedAt",
    defaultSortOrder: "desc",
    legacyWindowInput: serviceLegacyWindowInput(caseServiceSurface),
    filters: [
      equalsFilter("status", "Status", "status", ["status"], CASE_STATUSES),
      equalsFilter("ownerId", "Owner", "id", ["ownerId"]),
      equalsFilter("accountId", "Account", "id", ["accountId"]),
      equalsFilter("contactId", "Contact", "id", ["contactId"])
    ],
    sortKeys: [
      sortKey("updatedAt", "Updated at", ["updatedAt"], [["createdAt"]]),
      sortKey("createdAt", "Created at", ["createdAt"]),
      sortKey("status", "Status", ["status"], [["updatedAt"]]),
      sortKey("priority", "Priority", ["priority"], [["updatedAt"]]),
      sortKey("subject", "Subject", ["subject"])
    ]
  },
  {
    entity: "campaigns",
    adapter: "listCampaigns",
    sourceSurface: campaignServiceSurface,
    sourceModule: "lib/services/campaigns.ts",
    defaultSortBy: "startDate",
    defaultSortOrder: "asc",
    legacyWindowInput: serviceLegacyWindowInput(campaignServiceSurface),
    filters: [
      equalsFilter("status", "Status", "status", ["status"], CAMPAIGN_STATUSES),
      equalsFilter("ownerId", "Owner", "id", ["ownerId"]),
      boundaryFilter("startDateFrom", "Start date from", "gte", [
        "startDate"
      ]),
      boundaryFilter("startDateTo", "Start date to", "lte", ["startDate"])
    ],
    sortKeys: [
      sortKey("startDate", "Start date", ["startDate"], [["createdAt"]]),
      sortKey("createdAt", "Created at", ["createdAt"]),
      sortKey("status", "Status", ["status"], [["createdAt"]]),
      sortKey("name", "Name", ["name"]),
      sortKey("budget", "Budget", ["budget"], [["createdAt"]])
    ]
  }
] as const satisfies readonly EntitySeed[];

function copyFieldPaths(
  fieldPaths: readonly (readonly string[])[]
): readonly (readonly string[])[] {
  return fieldPaths.map((fieldPath) => [...fieldPath]);
}

function buildSortKey(seed: SortKeySeed): ListFilterSupportSortKey {
  return {
    key: seed.key,
    label: seed.label,
    fieldPaths: copyFieldPaths(seed.fieldPaths),
    tieBreakerFieldPaths: copyFieldPaths(seed.tieBreakerFieldPaths ?? [])
  };
}

function buildFilter(seed: FilterSeed): ListFilterSupportFilter {
  return {
    key: seed.key,
    label: seed.label,
    valueType: seed.valueType,
    operators: [...seed.operators],
    fieldPaths: copyFieldPaths(seed.fieldPaths),
    allowedValues: seed.allowedValues ? [...seed.allowedValues] : null,
    emptyValuesIgnored: true
  };
}

function buildEntityCatalog(seed: EntitySeed): ListFilterSupportEntityCatalog {
  const definition = getCsvExportDefinition(seed.entity);
  const filters = seed.filters.map((filter) => buildFilter(filter));
  const sortKeys = seed.sortKeys.map((sort) => buildSortKey(sort));

  return {
    entity: seed.entity,
    label: definition.label,
    route: definition.route,
    adapter: seed.adapter,
    sourceSurface: seed.sourceSurface,
    sourceModule: seed.sourceModule,
    defaultSortBy: seed.defaultSortBy,
    defaultSortOrder: seed.defaultSortOrder,
    sortOrders: [...LIST_FILTER_SUPPORT_SORT_ORDERS],
    sortKeyCount: sortKeys.length,
    filterCount: filters.length,
    filters,
    sortKeys,
    pagination: pagination(),
    legacyWindowInput: seed.legacyWindowInput ?? noLegacyWindowInput(),
    filterCombination: "and",
    emptyFilterValuesIgnored: true,
    read: readMetadata(),
    write: noWrites()
  };
}

function isEnumFilter(filter: ListFilterSupportFilter): boolean {
  return filter.allowedValues !== null && filter.allowedValues.length > 0;
}

function isDateRangeFilter(filter: ListFilterSupportFilter): boolean {
  return (
    filter.valueType === "date" &&
    (filter.operators.includes("gte") || filter.operators.includes("lte"))
  );
}

export function isListFilterSupportEntity(
  value: string
): value is ListFilterSupportEntity {
  return listFilterSupportEntitySet.has(value);
}

export function listListFilterSupportEntities(): ListFilterSupportEntity[] {
  return [...LIST_FILTER_SUPPORT_ENTITIES];
}

export function getListFilterSupportEntityCatalog(
  entity: string
): ListFilterSupportEntityCatalog | null {
  const seed = entitySeeds.find((candidate) => candidate.entity === entity);

  return seed ? buildEntityCatalog(seed) : null;
}

export function getListFilterSupportCatalog(
  input: unknown = {}
): ListFilterSupportCatalog {
  catalogInputSchema.parse(input);

  const entities = entitySeeds.map((seed) => buildEntityCatalog(seed));
  const filters = entities.flatMap((entity) => entity.filters);

  return {
    contentType: LIST_FILTER_SUPPORT_CATALOG_CONTENT_TYPE,
    catalogType: "list-filter-support-catalog",
    entityCount: entities.length,
    filterCount: filters.length,
    sortKeyCount: entities.reduce(
      (total, entity) => total + entity.sortKeyCount,
      0
    ),
    enumFilterCount: filters.filter((filter) => isEnumFilter(filter)).length,
    dateRangeFilterCount: filters.filter((filter) => isDateRangeFilter(filter))
      .length,
    entities,
    source: {
      adapterModule: "lib/crm/crmClient.ts",
      listQueryModule: "lib/services/listQuery.ts",
      filterCompilerModule: "lib/services/filterCompiler.ts",
      serviceListModules: [
        "lib/services/tasks.ts",
        "lib/services/cases.ts",
        "lib/services/campaigns.ts"
      ],
      catalogScope: "current-crm-list-options"
    },
    read: readMetadata(),
    write: noWrites()
  };
}
