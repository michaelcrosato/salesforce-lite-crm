import { describe, expect, it } from "vitest";
import { EXCLUDED_ROUTES, FEATURE_FLAGS } from "@/lib/featureFlags";
import { prisma } from "@/lib/prisma";
import {
  DASHBOARD_CARD_DEFINITION_CONTENT_TYPE,
  DASHBOARD_CARD_MAX_PREVIEW_LIMIT,
  buildDashboardCardMutationAuditEvidence,
  buildDashboardCardDefinition,
  getDashboardCardDefinitionCatalog,
  getDashboardCardGuardrails,
  getDashboardCardMutationAuditContract,
  getDashboardCardPlacement,
  isDashboardCardMutation,
  isDashboardCardPlacement,
  listDashboardCardMutations,
  listDashboardCardPlacements,
  validateDashboardCardDefinitionDraft
} from "@/lib/server/dashboardCardDefinitions";
import type { PersistedSavedReportDefinition } from "@/lib/server/savedReportPersistence";
import { serializeAuditMetadata } from "@/lib/services/auditEvents";

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
    expect(listDashboardCardMutations()).toEqual([
      "pin",
      "reorder",
      "archive",
      "delete"
    ]);
    expect(isDashboardCardMutation("reorder")).toBe(true);
    expect(isDashboardCardMutation("refresh")).toBe(false);
    expect(catalog.audit).toMatchObject({
      evidenceScope: "dashboard-card-client-session",
      mutationCount: 4,
      persistedAuditEvents: false,
      externalTelemetry: false,
      source: {
        definitionModule: "lib/server/dashboardCardDefinitions.ts",
        operatorSurface: "components/reports/dashboard-card-operator.tsx",
        auditTaxonomyModule: "lib/services/auditEvents.ts"
      },
      read: auditReadFlags(),
      write: auditNoWriteFlags()
    });
    expect(
      catalog.audit.mutations.map(({ mutation, action, summaryTemplate }) => ({
        mutation,
        action,
        summaryTemplate
      }))
    ).toEqual([
      {
        mutation: "pin",
        action: "created",
        summaryTemplate: "Dashboard card pinned: {title}."
      },
      {
        mutation: "reorder",
        action: "updated",
        summaryTemplate: "Dashboard card reordered: {title}."
      },
      {
        mutation: "archive",
        action: "updated",
        summaryTemplate: "Dashboard card archived: {title}."
      },
      {
        mutation: "delete",
        action: "deleted",
        summaryTemplate: "Dashboard card deleted: {title}."
      }
    ]);
    expect(catalog.guardrails).toEqual(getDashboardCardGuardrails());
    expect(catalog.guardrails).toMatchObject({
      allowedPlacementRoutes: ["/dashboard", "/reports"],
      excludedRoutes: [...EXCLUDED_ROUTES],
      featureFlags: {
        dealDetailRoute: FEATURE_FLAGS.dealDetailRoute,
        globalSearchUi: FEATURE_FLAGS.globalSearchUi,
        commandPalette: FEATURE_FLAGS.commandPalette
      },
      providerIntegrations: {
        externalAi: false,
        externalBi: false,
        salesforce: false,
        webhooks: false
      },
      dashboardRouteChanges: false,
      dashboardBuilderRoute: false,
      dashboardCardPersistence: false,
      searchExpansion: false,
      routeWrites: false
    });
    expect(catalog.guardrails.excludedRoutes).toContain("/search");
    expect(catalog.guardrails.excludedRoutes).toContain("/command-palette");
    expect(catalog.guardrails.excludedRoutes).toContain("/deals/[id]");
    expect(catalog.guardrails.allowedPlacementRoutes.map(String)).not.toContain(
      "/search"
    );
    expect(getDashboardCardPlacement("reports")?.route).toBe("/reports");
    expect(getDashboardCardPlacement("search")).toBeNull();
    expect(getDashboardCardMutationAuditContract("refresh")).toBeNull();
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
      audit: {
        evidenceScope: "dashboard-card-client-session",
        persistedAuditEvents: false,
        externalTelemetry: false
      },
      guardrails: {
        allowedPlacementRoutes: ["/dashboard", "/reports"],
        dashboardRouteChanges: false,
        dashboardBuilderRoute: false,
        dashboardCardPersistence: false,
        searchExpansion: false
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

  it("builds deterministic mutation audit evidence without persistence", () => {
    const savedReport = savedReportDefinition();
    const card = buildDashboardCardDefinition(
      {
        savedReportDefinitionId: savedReport.id,
        placement: "dashboard",
        position: 2,
        size: "wide"
      },
      savedReport
    );
    const evidence = buildDashboardCardMutationAuditEvidence(
      {
        mutation: "reorder",
        previousPosition: 2,
        nextPosition: 1
      },
      card
    );

    expect(evidence).toMatchObject({
      category: "record",
      action: "updated",
      entityType: "report",
      entityId: savedReport.id,
      summary: "Dashboard card reordered: Pipeline by stage.",
      persistedAuditEvent: false,
      externalTelemetry: false,
      source: {
        definitionModule: "lib/server/dashboardCardDefinitions.ts",
        operatorSurface: "components/reports/dashboard-card-operator.tsx",
        evidenceScope: "dashboard-card-client-session"
      },
      read: auditReadFlags(),
      write: auditNoWriteFlags()
    });
    expect(evidence.metadata).toBe(
      serializeAuditMetadata({
        source: "dashboard_card_operator",
        mutation: "reorder",
        savedReportDefinitionId: savedReport.id,
        title: "Pipeline by stage",
        placement: "dashboard",
        entity: "opportunities",
        route: "/deals",
        position: 2,
        size: "wide",
        visualization: {
          type: "bar",
          dimensionKey: "stage",
          metricKey: "value.sum"
        },
        previewLimit: 10,
        previousPosition: 2,
        nextPosition: 1,
        changedFields: ["position"]
      })
    );
    expect(() =>
      buildDashboardCardMutationAuditEvidence({ mutation: "refresh" }, card)
    ).toThrow();
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

function auditReadFlags() {
  return {
    metadata: true,
    database: false,
    auditEvents: false,
    externalTelemetry: false
  };
}

function auditNoWriteFlags() {
  return {
    database: false,
    mutations: false,
    auditEvents: false,
    requestLogs: false,
    externalTelemetry: false,
    externalServices: false,
    backgroundJobs: false
  };
}
