import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  DASHBOARD_CARD_DEFINITION_CONTENT_TYPE,
  DASHBOARD_CARD_MAX_PREVIEW_LIMIT,
  buildDashboardCardDefinition,
  getDashboardCardDefinitionCatalog,
  getDashboardCardPlacement,
  isDashboardCardPlacement,
  listDashboardCardPlacements,
  validateDashboardCardDefinitionDraft
} from "@/lib/server/dashboardCardDefinitions";
import type { PersistedSavedReportDefinition } from "@/lib/server/savedReportPersistence";

const noWriteFlags = {
  database: false,
  mutations: false,
  crmRecords: false,
  savedReportDefinitions: false,
  schemas: false,
  routes: false,
  files: false,
  externalServices: false,
  backgroundJobs: false,
  rawSql: false,
  dashboardLayouts: false
};

describe("dashboard card definition contracts", () => {
  it("publishes deterministic metadata for saved-report-backed cards", () => {
    const catalog = getDashboardCardDefinitionCatalog();

    expect(listDashboardCardPlacements()).toEqual(["dashboard", "reports"]);
    expect(isDashboardCardPlacement("dashboard")).toBe(true);
    expect(isDashboardCardPlacement("search")).toBe(false);
    expect(catalog).toMatchObject({
      contentType: DASHBOARD_CARD_DEFINITION_CONTENT_TYPE,
      catalogType: "dashboard-card-definition-catalog",
      placementCount: 2,
      visualizationCount: 4,
      limits: {
        previewRows: {
          defaultLimit: 10,
          maxLimit: DASHBOARD_CARD_MAX_PREVIEW_LIMIT,
          savedReportMaxLimit: 100
        },
        title: { min: 1, max: 80 },
        description: { max: 160 },
        position: { min: 1, max: 24 }
      },
      source: {
        definitionModule: "lib/server/dashboardCardDefinitions.ts",
        savedReportPersistenceModule: "lib/server/savedReportPersistence.ts",
        savedReportDefinitionModule: "lib/server/savedReportDefinitions.ts",
        catalogScope: "dashboard-card-definition-contracts"
      },
      read: {
        metadata: true,
        persistedSavedReport: false,
        database: false,
        previewExecution: false,
        adapterInternals: false
      },
      write: noWriteFlags
    });
    expect(catalog.placements).toEqual([
      {
        key: "dashboard",
        label: "Dashboard",
        route: "/dashboard",
        defaultSize: "standard",
        allowedSizes: ["compact", "standard", "wide"],
        maxCards: 12
      },
      {
        key: "reports",
        label: "Reports",
        route: "/reports",
        defaultSize: "compact",
        allowedSizes: ["compact", "standard"],
        maxCards: 8
      }
    ]);
    expect(catalog.visualizations).toEqual([
      { type: "table", label: "Table", surface: "table" },
      { type: "bar", label: "Bar chart", surface: "chart" },
      { type: "line", label: "Line chart", surface: "chart" },
      { type: "pie", label: "Pie chart", surface: "chart" }
    ]);
    expect(getDashboardCardPlacement("reports")?.route).toBe("/reports");
    expect(getDashboardCardPlacement("search")).toBeNull();
    expect(() =>
      getDashboardCardDefinitionCatalog({ includeRoutes: true })
    ).toThrow("Unrecognized key(s) in object: 'includeRoutes'");
  });

  it("validates and normalizes dashboard card drafts", () => {
    const savedReport = savedReportDefinition();
    const draft = validateDashboardCardDefinitionDraft(
      {
        savedReportDefinitionId: savedReport.id,
        title: "  Board pipeline  ",
        description: "  Proposal stage value  ",
        placement: "dashboard",
        position: "2",
        size: "wide",
        previewLimit: "8",
        visualization: {
          type: "bar",
          dimensionKey: "stage",
          metricKey: "value.sum"
        }
      },
      savedReport
    );

    expect(draft).toEqual({
      savedReportDefinitionId: savedReport.id,
      title: "Board pipeline",
      description: "Proposal stage value",
      placement: "dashboard",
      position: 2,
      size: "wide",
      previewLimit: 8,
      visualization: {
        type: "bar",
        dimensionKey: "stage",
        metricKey: "value.sum"
      }
    });
  });

  it("builds a card definition from persisted saved report defaults", () => {
    const savedReport = savedReportDefinition();
    const card = buildDashboardCardDefinition(
      {
        savedReportDefinitionId: savedReport.id,
        placement: "reports",
        description: ""
      },
      savedReport
    );

    expect(card).toMatchObject({
      cardType: "saved-report-dashboard-card",
      savedReportDefinitionId: savedReport.id,
      title: "Pipeline by stage",
      description: null,
      placement: "reports",
      position: 1,
      size: "compact",
      previewLimit: 10,
      visualization: {
        type: "bar",
        dimensionKey: "stage",
        metricKey: "value.sum"
      },
      savedReport: {
        id: savedReport.id,
        entity: "opportunities",
        name: "Pipeline by stage",
        route: "/deals",
        previewLimit: 12,
        archivedAt: null
      },
      source: {
        definitionModule: "lib/server/dashboardCardDefinitions.ts",
        savedReportPersistenceModule: "lib/server/savedReportPersistence.ts",
        savedReportDefinitionModule: "lib/server/savedReportDefinitions.ts",
        executionScope: "saved-report-dashboard-card-contract"
      },
      read: {
        metadata: true,
        persistedSavedReport: true,
        database: false,
        previewExecution: false,
        adapterInternals: false
      },
      write: noWriteFlags
    });
  });

  it("rejects invalid card metadata without database writes", async () => {
    const savedReport = savedReportDefinition();
    const countsBefore = await dashboardCardDefinitionCounts();

    expect(() =>
      validateDashboardCardDefinitionDraft(
        {
          savedReportDefinitionId: "other-saved-report",
          placement: "dashboard"
        },
        savedReport
      )
    ).toThrow("Dashboard card must reference the provided saved report definition.");
    expect(() =>
      validateDashboardCardDefinitionDraft(
        {
          savedReportDefinitionId: savedReport.id,
          placement: "dashboard"
        },
        savedReportDefinition({
          archivedAt: new Date("2026-05-27T12:00:00.000Z")
        })
      )
    ).toThrow("Archived saved reports cannot back dashboard cards.");
    expect(() =>
      validateDashboardCardDefinitionDraft(
        {
          savedReportDefinitionId: savedReport.id,
          placement: "reports",
          size: "wide"
        },
        savedReport
      )
    ).toThrow("Dashboard card size 'wide' is not supported for Reports.");
    expect(() =>
      validateDashboardCardDefinitionDraft(
        {
          savedReportDefinitionId: savedReport.id,
          placement: "dashboard",
          previewLimit: 13
        },
        savedReport
      )
    ).toThrow("Dashboard card preview limit cannot exceed 12.");
    expect(() =>
      validateDashboardCardDefinitionDraft(
        {
          savedReportDefinitionId: savedReport.id,
          placement: "dashboard",
          visualization: {
            type: "bar",
            dimensionKey: null,
            metricKey: "recordCount"
          }
        },
        savedReport
      )
    ).toThrow(
      "Dashboard card visualization 'bar' requires a supported dimension"
    );
    expect(() =>
      validateDashboardCardDefinitionDraft(
        {
          savedReportDefinitionId: savedReport.id,
          placement: "dashboard",
          visualization: {
            type: "bar",
            dimensionKey: "stage",
            metricKey: "budget.sum"
          }
        },
        savedReport
      )
    ).toThrow("Dashboard card metric 'budget.sum' is not supported");

    expect(await dashboardCardDefinitionCounts()).toEqual(countsBefore);
  });
});

function savedReportDefinition(
  overrides: Partial<PersistedSavedReportDefinition> = {}
): PersistedSavedReportDefinition {
  const base: PersistedSavedReportDefinition = {
    id: "test-dashboard-card-saved-report",
    entity: "opportunities",
    name: "Pipeline by stage",
    fields: ["name", "stage", "value"],
    filters: {
      stage: "proposal"
    },
    groupBy: ["stage"],
    chart: {
      type: "bar",
      dimensionKey: "stage",
      metricKey: "value.sum"
    },
    previewLimit: 12,
    archivedAt: null,
    createdAt: new Date("2026-05-27T10:00:00.000Z"),
    updatedAt: new Date("2026-05-27T10:00:00.000Z"),
    source: {
      persistenceModule: "lib/server/savedReportPersistence.ts",
      definitionModule: "lib/server/savedReportDefinitions.ts",
      executionScope: "persisted-definition-contracts"
    },
    read: {
      metadata: true,
      database: true,
      previewExecution: false,
      adapterInternals: false
    },
    write: {
      database: true,
      mutations: true,
      auditEvents: true,
      schemas: false,
      routes: false,
      files: false,
      externalServices: false,
      backgroundJobs: false,
      rawSql: false,
      previewExecution: false
    }
  };

  return {
    ...base,
    ...overrides
  };
}

async function dashboardCardDefinitionCounts() {
  const [savedReportDefinitions, auditEvents] = await Promise.all([
    prisma.savedReportDefinition.count(),
    prisma.auditEvent.count()
  ]);

  return {
    savedReportDefinitions,
    auditEvents
  };
}
