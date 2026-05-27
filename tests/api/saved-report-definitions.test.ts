import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  getListFilterSupportEntityCatalog,
  type ListFilterSupportEntityCatalog
} from "@/lib/server/listFilterSupportCatalog";
import {
  SAVED_REPORT_DEFINITION_CONTENT_TYPE,
  SAVED_REPORT_DEFINITION_ENTITIES,
  getSavedReportDefinitionCatalog,
  getSavedReportEntityDefinition,
  isSavedReportDefinitionEntity,
  listSavedReportDefinitionEntities,
  validateSavedReportDefinitionDraft,
  type SavedReportEntityDefinition
} from "@/lib/server/savedReportDefinitions";

const noWriteFlags = {
  database: false,
  mutations: false,
  schemas: false,
  routes: false,
  files: false,
  externalServices: false,
  backgroundJobs: false,
  rawSql: false
};

const metadataOnlyReads = {
  metadata: true,
  database: false,
  adapterInternals: false
};

describe("saved report definition contracts", () => {
  it("publishes deterministic metadata for supported CRM objects", () => {
    const catalog = getSavedReportDefinitionCatalog();

    expect(listSavedReportDefinitionEntities()).toEqual(
      SAVED_REPORT_DEFINITION_ENTITIES
    );
    expect(catalog).toMatchObject({
      contentType: SAVED_REPORT_DEFINITION_CONTENT_TYPE,
      catalogType: "saved-report-definition-catalog",
      entityCount: 10,
      fieldCount: 76,
      filterCount: 37,
      groupingCount: 58,
      metricCount: 28,
      chartCount: 40,
      source: {
        definitionModule: "lib/server/savedReportDefinitions.ts",
        listFilterCatalogModule: "lib/server/listFilterSupportCatalog.ts",
        listQueryModule: "lib/services/listQuery.ts",
        reportServicesModule: "lib/services/reports.ts",
        catalogScope: "saved-report-definition-contracts"
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
        fields: entity.fieldCount,
        filters: entity.filterCount,
        groupings: entity.groupingCount,
        metrics: entity.metricCount,
        charts: entity.chartCount
      }))
    ).toEqual([
      {
        entity: "accounts",
        fields: 9,
        filters: 3,
        groupings: 7,
        metrics: 4,
        charts: 4
      },
      {
        entity: "contacts",
        fields: 7,
        filters: 3,
        groupings: 5,
        metrics: 1,
        charts: 4
      },
      {
        entity: "opportunities",
        fields: 10,
        filters: 4,
        groupings: 7,
        metrics: 8,
        charts: 4
      },
      {
        entity: "leads",
        fields: 9,
        filters: 4,
        groupings: 7,
        metrics: 1,
        charts: 4
      },
      {
        entity: "activities",
        fields: 7,
        filters: 7,
        groupings: 6,
        metrics: 1,
        charts: 4
      },
      {
        entity: "dealer-orders",
        fields: 7,
        filters: 2,
        groupings: 5,
        metrics: 5,
        charts: 4
      },
      {
        entity: "areas",
        fields: 5,
        filters: 2,
        groupings: 3,
        metrics: 1,
        charts: 4
      },
      {
        entity: "tasks",
        fields: 7,
        filters: 4,
        groupings: 6,
        metrics: 1,
        charts: 4
      },
      {
        entity: "cases",
        fields: 7,
        filters: 4,
        groupings: 6,
        metrics: 1,
        charts: 4
      },
      {
        entity: "campaigns",
        fields: 8,
        filters: 4,
        groupings: 6,
        metrics: 5,
        charts: 4
      }
    ]);
  });

  it("mirrors existing list filter support and adds field/group/chart contracts", () => {
    const listCatalog = requireListCatalog("opportunities");
    const definition = requireSavedReportDefinition("opportunities");

    expect(definition).toMatchObject({
      entity: "opportunities",
      label: "Opportunities",
      route: "/deals",
      sourceSurface: "lib/crm/crmClient.ts#listOpportunities",
      defaultSortBy: "updatedAt",
      defaultSortOrder: "desc",
      limits: {
        previewRows: { defaultLimit: 25, maxLimit: 100 },
        selectedFields: { min: 1, max: 12 },
        groupings: { min: 0, max: 2 }
      },
      read: metadataOnlyReads,
      write: noWriteFlags
    });
    expect(definition.filters.map((filter) => filter.key)).toEqual(
      listCatalog.filters.map((filter) => filter.key)
    );
    expect(definition.fields.find((field) => field.key === "stage")).toEqual({
      key: "stage",
      label: "Stage",
      valueType: "stage",
      fieldPaths: [["stage"]],
      selectable: true,
      groupable: true,
      metricAggregations: []
    });
    expect(definition.metrics.map((metric) => metric.key)).toEqual([
      "recordCount",
      "value.sum",
      "value.avg",
      "value.min",
      "value.max",
      "probability.avg",
      "probability.min",
      "probability.max"
    ]);
    expect(definition.charts.find((chart) => chart.type === "bar")).toMatchObject({
      defaultDimensionKey: "stage",
      defaultMetricKey: "recordCount",
      supportedDimensionKeys: [
        "stage",
        "accountId",
        "ownerId",
        "expectedCloseDate",
        "lastActivityAt",
        "createdAt",
        "updatedAt"
      ]
    });
  });

  it("validates and normalizes saved report definition drafts", () => {
    const draft = validateSavedReportDefinitionDraft({
      entity: "opportunities",
      name: "Pipeline by stage",
      fields: ["name", "stage", "value", "stage"],
      filters: {
        stage: "proposal",
        search: "enterprise"
      },
      groupBy: ["stage", "stage"],
      chart: {
        type: "bar",
        dimensionKey: "stage",
        metricKey: "value.sum"
      }
    });

    expect(draft).toEqual({
      entity: "opportunities",
      name: "Pipeline by stage",
      fields: ["name", "stage", "value"],
      filters: {
        search: "enterprise",
        stage: "proposal"
      },
      groupBy: ["stage"],
      chart: {
        type: "bar",
        dimensionKey: "stage",
        metricKey: "value.sum"
      }
    });
  });

  it("rejects unsupported draft metadata without database writes", async () => {
    const countsBefore = await currentCounts();

    expect(isSavedReportDefinitionEntity("accounts")).toBe(true);
    expect(isSavedReportDefinitionEntity("notes")).toBe(false);
    expect(getSavedReportEntityDefinition("notes")).toBeNull();
    expect(() =>
      getSavedReportDefinitionCatalog({ includeUnsupported: true })
    ).toThrow("Unrecognized key(s) in object: 'includeUnsupported'");
    expect(() =>
      validateSavedReportDefinitionDraft({
        entity: "notes",
        fields: ["title"]
      })
    ).toThrow("Unsupported entity: 'notes'");
    expect(() =>
      validateSavedReportDefinitionDraft({
        entity: "accounts",
        fields: ["email"]
      })
    ).toThrow("Field 'email' is not supported");
    expect(() =>
      validateSavedReportDefinitionDraft({
        entity: "contacts",
        fields: ["lastName"],
        filters: {
          stage: "won"
        }
      })
    ).toThrow("Filter 'stage' is not supported");
    expect(() =>
      validateSavedReportDefinitionDraft({
        entity: "contacts",
        fields: ["lastName"],
        filters: {
          status: "converted"
        }
      })
    ).toThrow("Filter 'status' value 'converted' is not supported.");
    expect(() =>
      validateSavedReportDefinitionDraft({
        entity: "opportunities",
        fields: ["name"],
        groupBy: ["name"]
      })
    ).toThrow("Grouping 'name' is not supported");
    expect(() =>
      validateSavedReportDefinitionDraft({
        entity: "opportunities",
        fields: ["name"],
        chart: {
          type: "pie",
          dimensionKey: "createdAt",
          metricKey: "recordCount"
        }
      })
    ).toThrow("Chart dimension 'createdAt' is not supported");
    expect(() =>
      validateSavedReportDefinitionDraft({
        entity: "opportunities",
        fields: ["name"],
        chart: {
          type: "bar",
          dimensionKey: "stage",
          metricKey: "budget.sum"
        }
      })
    ).toThrow("Chart metric 'budget.sum' is not supported");

    expect(await currentCounts()).toEqual(countsBefore);
  });
});

function requireSavedReportDefinition(
  entity: string
): SavedReportEntityDefinition {
  const definition = getSavedReportEntityDefinition(entity);

  if (definition === null) {
    throw new Error(`Expected saved report definition for ${entity}`);
  }

  return definition;
}

function requireListCatalog(entity: string): ListFilterSupportEntityCatalog {
  const catalog = getListFilterSupportEntityCatalog(entity);

  if (catalog === null) {
    throw new Error(`Expected list filter support catalog for ${entity}`);
  }

  return catalog;
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
    campaigns,
    savedListViews,
    savedReportDefinitions
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
    prisma.campaign.count(),
    prisma.savedListView.count(),
    prisma.savedReportDefinition.count()
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
    campaigns,
    savedListViews,
    savedReportDefinitions
  };
}
