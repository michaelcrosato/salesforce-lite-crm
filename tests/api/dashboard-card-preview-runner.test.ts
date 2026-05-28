import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { createSavedReportDefinition } from "@/lib/server/savedReportPersistence";
import {
  DASHBOARD_CARD_PREVIEW_CONTENT_TYPE,
  runDashboardCardPreview
} from "@/lib/server/dashboardCardPreviewRunner";

const accountId = "test-dashboard-card-preview-account";
const proposalDealIds = [
  "test-dashboard-card-preview-proposal-one",
  "test-dashboard-card-preview-proposal-two"
];
const negotiationDealId = "test-dashboard-card-preview-negotiation";
const savedReportNamePrefix = "Test dashboard card preview";

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

describe("dashboard card preview runner", () => {
  beforeAll(async () => {
    await deleteFixtureRecords();
    await prisma.account.upsert({
      where: { id: accountId },
      create: {
        id: accountId,
        name: "Dashboard Card Preview Fixtures",
        status: "active",
        healthScore: 91
      },
      update: {
        name: "Dashboard Card Preview Fixtures",
        status: "active",
        healthScore: 91
      }
    });
    await prisma.deal.createMany({
      data: [
        {
          id: proposalDealIds[0],
          accountId,
          name: "Dashboard Card Preview Fleet",
          stage: "proposal",
          value: 50000,
          probability: 40,
          expectedCloseDate: new Date("2026-06-15T00:00:00.000Z"),
          lastActivityAt: new Date("2026-05-20T00:00:00.000Z")
        },
        {
          id: proposalDealIds[1],
          accountId,
          name: "Dashboard Card Preview Renewal",
          stage: "proposal",
          value: 75000,
          probability: 60,
          expectedCloseDate: new Date("2026-06-20T00:00:00.000Z"),
          lastActivityAt: new Date("2026-05-21T00:00:00.000Z")
        },
        {
          id: negotiationDealId,
          accountId,
          name: "Dashboard Card Preview Negotiation",
          stage: "negotiation",
          value: 125000,
          probability: 75,
          expectedCloseDate: new Date("2026-07-01T00:00:00.000Z"),
          lastActivityAt: new Date("2026-05-22T00:00:00.000Z")
        }
      ]
    });
  });

  beforeEach(async () => {
    await cleanupSavedReportDefinitions();
  });

  afterAll(async () => {
    await cleanupSavedReportDefinitions();
    await deleteFixtureRecords();
  });

  it("runs saved-report-backed dashboard cards through bounded previews", async () => {
    const savedReport = await createSavedReportDefinition({
      entity: "opportunities",
      name: `${savedReportNamePrefix} pipeline`,
      fields: ["name", "stage", "value", "probability"],
      filters: {
        accountId,
        stage: "proposal"
      },
      groupBy: ["stage"],
      chart: {
        type: "bar",
        dimensionKey: "stage",
        metricKey: "value.sum"
      },
      previewLimit: 12
    });
    const countsBefore = await currentCounts();
    const preview = await runDashboardCardPreview(
      {
        savedReportDefinitionId: savedReport.id,
        title: "  Proposal dashboard card  ",
        placement: "dashboard",
        position: 2,
        size: "wide",
        visualization: {
          type: "bar",
          dimensionKey: "stage",
          metricKey: "value.sum"
        },
        previewLimit: 2
      },
      savedReport
    );

    expect(preview).toMatchObject({
      contentType: DASHBOARD_CARD_PREVIEW_CONTENT_TYPE,
      previewType: "dashboard-card-preview",
      status: "valid",
      errors: [],
      card: {
        cardType: "saved-report-dashboard-card",
        savedReportDefinitionId: savedReport.id,
        title: "Proposal dashboard card",
        placement: "dashboard",
        position: 2,
        size: "wide",
        previewLimit: 2,
        visualization: {
          type: "bar",
          dimensionKey: "stage",
          metricKey: "value.sum"
        }
      },
      visualization: {
        type: "bar",
        dimensionKey: "stage",
        metricKey: "value.sum"
      },
      limit: 2,
      rowCount: 2,
      source: {
        runnerModule: "lib/server/dashboardCardPreviewRunner.ts",
        definitionModule: "lib/server/dashboardCardDefinitions.ts",
        savedReportPreviewRunnerModule: "lib/server/savedReportPreviewRunner.ts",
        savedReportPersistenceModule: "lib/server/savedReportPersistence.ts",
        executionScope: "bounded-read-only-dashboard-card-preview"
      },
      read: {
        metadata: true,
        persistedSavedReport: true,
        database: true,
        savedReportPreview: true,
        adapterInternals: false,
        reportServices: false
      },
      write: noWriteFlags
    });
    expect(preview.card?.audit).toMatchObject({
      evidenceScope: "dashboard-card-client-session",
      persistedAuditEvents: false,
      externalTelemetry: false
    });
    expect(preview.card?.guardrails).toMatchObject({
      allowedPlacementRoutes: ["/dashboard", "/reports"],
      dashboardRouteChanges: false,
      dashboardBuilderRoute: false,
      dashboardCardPersistence: false,
      searchExpansion: false,
      routeWrites: false,
      providerIntegrations: {
        externalAi: false,
        externalBi: false,
        salesforce: false,
        webhooks: false
      }
    });
    expect(preview.card?.guardrails.excludedRoutes).toContain("/search");
    expect(preview.savedReportPreview?.source.executionScope).toBe(
      "bounded-read-only-preview"
    );
    expect(preview.savedReportPreview?.write.database).toBe(false);
    expect(preview.rows.map((row) => row.values.name).sort()).toEqual([
      "Dashboard Card Preview Fleet",
      "Dashboard Card Preview Renewal"
    ]);
    expect(preview.chart).toEqual({
      type: "bar",
      dimensionKey: "stage",
      metricKey: "value.sum",
      metricLabel: "Total Value",
      points: [
        {
          key: "proposal",
          label: "proposal",
          dimension: "proposal",
          rowCount: 2,
          value: 125000
        }
      ]
    });
    expect(await currentCounts()).toEqual(countsBefore);
  });

  it("returns deterministic validation errors without running previews", async () => {
    const savedReport = await createSavedReportDefinition({
      entity: "opportunities",
      name: `${savedReportNamePrefix} invalid card`,
      fields: ["name", "stage", "value"],
      filters: {
        accountId,
        stage: "proposal"
      },
      previewLimit: 12
    });
    const countsBefore = await currentCounts();
    const preview = await runDashboardCardPreview(
      {
        savedReportDefinitionId: savedReport.id,
        placement: "reports",
        size: "wide"
      },
      savedReport
    );

    expect(preview).toMatchObject({
      status: "invalid",
      card: null,
      savedReportPreview: null,
      visualization: null,
      limit: null,
      rowCount: 0,
      rows: [],
      aggregates: [],
      groups: [],
      chart: null,
      read: {
        metadata: false,
        persistedSavedReport: true,
        database: false,
        savedReportPreview: false,
        adapterInternals: false,
        reportServices: false
      },
      write: noWriteFlags
    });
    expect(preview.errors).toEqual([
      {
        code: "invalid_definition",
        path: null,
        message: "Dashboard card size 'wide' is not supported for Reports.",
        source: "dashboard-card-definition"
      }
    ]);
    expect(await currentCounts()).toEqual(countsBefore);
  });
});

async function cleanupSavedReportDefinitions() {
  await prisma.auditEvent.deleteMany({
    where: {
      entityType: "report",
      summary: {
        contains: savedReportNamePrefix
      }
    }
  });
  await prisma.savedReportDefinition.deleteMany({
    where: {
      name: {
        startsWith: savedReportNamePrefix
      }
    }
  });
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
    auditEvents,
    savedReportDefinitions,
    savedListViews
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
    prisma.auditEvent.count(),
    prisma.savedReportDefinition.count(),
    prisma.savedListView.count()
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
    auditEvents,
    savedReportDefinitions,
    savedListViews
  };
}

async function deleteFixtureRecords() {
  await prisma.deal.deleteMany({ where: { accountId } });
  await prisma.account.deleteMany({ where: { id: accountId } });
}
