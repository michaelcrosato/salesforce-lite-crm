import { describe, expect, it } from "vitest";
import { ACCOUNT_STATUSES, DEAL_STAGES } from "@/lib/crm-constants";
import { prisma } from "@/lib/prisma";
import {
  LIST_FILTER_SUPPORT_CATALOG_CONTENT_TYPE,
  LIST_FILTER_SUPPORT_ENTITIES,
  getListFilterSupportCatalog,
  getListFilterSupportEntityCatalog,
  isListFilterSupportEntity,
  listListFilterSupportEntities,
  type ListFilterSupportEntityCatalog,
  type ListFilterSupportFilter
} from "@/lib/server/listFilterSupportCatalog";

const noWriteFlags = {
  database: false,
  mutations: false,
  schemas: false,
  routes: false,
  files: false,
  externalServices: false,
  backgroundJobs: false
};

const metadataOnlyReads = {
  metadata: true,
  database: false,
  adapterInternals: false
};

describe("server list filter support catalog", () => {
  it("publishes deterministic root metadata for current CRM list options", () => {
    const catalog = getListFilterSupportCatalog();

    expect(listListFilterSupportEntities()).toEqual(LIST_FILTER_SUPPORT_ENTITIES);
    expect(catalog).toMatchObject({
      contentType: LIST_FILTER_SUPPORT_CATALOG_CONTENT_TYPE,
      catalogType: "list-filter-support-catalog",
      entityCount: 10,
      filterCount: 37,
      sortKeyCount: 42,
      enumFilterCount: 9,
      dateRangeFilterCount: 4,
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
      read: metadataOnlyReads,
      write: noWriteFlags
    });
    expect(catalog.entities.map((entity) => entity.entity)).toEqual([
      "accounts",
      "contacts",
      "opportunities",
      "leads",
      "activities",
      "dealer-orders",
      "areas",
      "tasks",
      "cases",
      "campaigns"
    ]);
    expect(
      catalog.entities.map((entity) => ({
        entity: entity.entity,
        filters: entity.filterCount,
        sorts: entity.sortKeyCount
      }))
    ).toEqual([
      { entity: "accounts", filters: 3, sorts: 4 },
      { entity: "contacts", filters: 3, sorts: 4 },
      { entity: "opportunities", filters: 4, sorts: 5 },
      { entity: "leads", filters: 4, sorts: 4 },
      { entity: "activities", filters: 7, sorts: 3 },
      { entity: "dealer-orders", filters: 2, sorts: 4 },
      { entity: "areas", filters: 2, sorts: 3 },
      { entity: "tasks", filters: 4, sorts: 5 },
      { entity: "cases", filters: 4, sorts: 5 },
      { entity: "campaigns", filters: 4, sorts: 5 }
    ]);
  });

  it("describes adapter-backed search, enum filters, and sort defaults", () => {
    const accountCatalog = requireEntityCatalog("accounts");
    const opportunityCatalog = requireEntityCatalog("opportunities");

    expect(accountCatalog).toMatchObject({
      entity: "accounts",
      label: "Accounts",
      route: "/accounts",
      adapter: "listAccounts",
      sourceSurface: "lib/crm/crmClient.ts#listAccounts",
      defaultSortBy: "name",
      defaultSortOrder: "asc",
      sortOrders: ["asc", "desc"],
      pagination: {
        page: { supported: true, min: 1 },
        pageSize: { supported: true, min: 1, max: 100 }
      },
      legacyWindowInput: {
        supported: false,
        fields: [],
        sourceSurface: null
      },
      filterCombination: "and",
      emptyFilterValuesIgnored: true,
      read: metadataOnlyReads,
      write: noWriteFlags
    });
    expect(requireFilter(accountCatalog, "status")).toEqual({
      key: "status",
      label: "Status",
      valueType: "status",
      operators: ["equals"],
      fieldPaths: [["status"]],
      allowedValues: ACCOUNT_STATUSES,
      emptyValuesIgnored: true
    });
    expect(requireFilter(accountCatalog, "search")).toMatchObject({
      key: "search",
      operators: ["or_contains"],
      fieldPaths: [["name"], ["domain"], ["industry"], ["city"], ["region"]],
      allowedValues: null
    });
    expect(accountCatalog.sortKeys.map((sort) => sort.key)).toEqual([
      "name",
      "createdAt",
      "updatedAt",
      "healthScore"
    ]);

    expect(opportunityCatalog).toMatchObject({
      entity: "opportunities",
      label: "Opportunities",
      route: "/deals",
      defaultSortBy: "updatedAt",
      defaultSortOrder: "desc"
    });
    expect(requireFilter(opportunityCatalog, "stage")).toMatchObject({
      valueType: "stage",
      allowedValues: DEAL_STAGES,
      fieldPaths: [["stage"]]
    });
    expect(requireFilter(opportunityCatalog, "search")).toMatchObject({
      operators: ["contains"],
      fieldPaths: [["name"]]
    });
  });

  it("carries service-list date filters and legacy skip/take support", () => {
    const taskCatalog = requireEntityCatalog("tasks");
    const caseCatalog = requireEntityCatalog("cases");
    const campaignCatalog = requireEntityCatalog("campaigns");

    expect(taskCatalog).toMatchObject({
      entity: "tasks",
      sourceModule: "lib/services/tasks.ts",
      sourceSurface: "lib/services/tasks.ts#listTasks",
      defaultSortBy: "dueDate",
      defaultSortOrder: "asc",
      legacyWindowInput: {
        supported: true,
        fields: ["skip", "take"],
        sourceSurface: "lib/services/tasks.ts#listTasks"
      }
    });
    expect(requireFilter(taskCatalog, "dueDateFrom")).toMatchObject({
      valueType: "date",
      operators: ["gte"],
      fieldPaths: [["dueDate"]]
    });
    expect(requireFilter(taskCatalog, "dueDateTo")).toMatchObject({
      valueType: "date",
      operators: ["lte"],
      fieldPaths: [["dueDate"]]
    });
    expect(taskCatalog.sortKeys).toContainEqual(
      expect.objectContaining({
        key: "dueDate",
        fieldPaths: [["dueDate"]],
        tieBreakerFieldPaths: [["createdAt"]]
      })
    );

    expect(caseCatalog).toMatchObject({
      entity: "cases",
      sourceModule: "lib/services/cases.ts",
      defaultSortBy: "updatedAt",
      defaultSortOrder: "desc",
      legacyWindowInput: {
        supported: true,
        fields: ["skip", "take"],
        sourceSurface: "lib/services/cases.ts#listCases"
      }
    });
    expect(caseCatalog.filters.map((filter) => filter.key)).toEqual([
      "status",
      "ownerId",
      "accountId",
      "contactId"
    ]);

    expect(campaignCatalog).toMatchObject({
      entity: "campaigns",
      sourceModule: "lib/services/campaigns.ts",
      defaultSortBy: "startDate",
      defaultSortOrder: "asc",
      legacyWindowInput: {
        supported: true,
        fields: ["skip", "take"],
        sourceSurface: "lib/services/campaigns.ts#listCampaigns"
      }
    });
    expect(requireFilter(campaignCatalog, "startDateFrom")).toMatchObject({
      valueType: "date",
      operators: ["gte"],
      fieldPaths: [["startDate"]]
    });
    expect(requireFilter(campaignCatalog, "startDateTo")).toMatchObject({
      valueType: "date",
      operators: ["lte"],
      fieldPaths: [["startDate"]]
    });
  });

  it("keeps catalog construction strict and no-write", async () => {
    const countsBefore = await currentCounts();

    expect(isListFilterSupportEntity("accounts")).toBe(true);
    expect(isListFilterSupportEntity("notes")).toBe(false);
    expect(getListFilterSupportEntityCatalog("notes")).toBeNull();
    expect(() =>
      getListFilterSupportCatalog({ includeUnsupported: true })
    ).toThrow("Unrecognized key(s) in object: 'includeUnsupported'");
    expect(await currentCounts()).toEqual(countsBefore);
  });
});

function requireEntityCatalog(
  entity: string
): ListFilterSupportEntityCatalog {
  const catalog = getListFilterSupportEntityCatalog(entity);

  if (catalog === null) {
    throw new Error(`Expected list filter support catalog for ${entity}`);
  }

  return catalog;
}

function requireFilter(
  catalog: ListFilterSupportEntityCatalog,
  key: string
): ListFilterSupportFilter {
  const filter = catalog.filters.find((candidate) => candidate.key === key);

  if (filter === undefined) {
    throw new Error(`Expected ${catalog.entity} filter ${key}`);
  }

  return filter;
}

async function currentCounts() {
  const [
    accounts,
    contacts,
    deals,
    leads,
    activities,
    dealerOrders,
    areas,
    tasks,
    cases,
    campaigns
  ] = await Promise.all([
    prisma.account.count(),
    prisma.contact.count(),
    prisma.deal.count(),
    prisma.lead.count(),
    prisma.activity.count(),
    prisma.dealerOrder.count(),
    prisma.area.count(),
    prisma.task.count(),
    prisma.case.count(),
    prisma.campaign.count()
  ]);

  return {
    accounts,
    contacts,
    deals,
    leads,
    activities,
    dealerOrders,
    areas,
    tasks,
    cases,
    campaigns
  };
}
