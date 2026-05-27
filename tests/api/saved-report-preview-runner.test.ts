import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  SAVED_REPORT_PREVIEW_CONTENT_TYPE,
  runSavedReportPreview,
  type SavedReportPreviewAggregate
} from "@/lib/server/savedReportPreviewRunner";

const accountId = "test-saved-report-preview-account";
const proposalDealIds = [
  "test-saved-report-preview-proposal-one",
  "test-saved-report-preview-proposal-two"
];
const negotiationDealId = "test-saved-report-preview-negotiation";

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

describe("saved report preview runner", () => {
  beforeAll(async () => {
    await deleteFixtureRecords();
    await prisma.account.upsert({
      where: { id: accountId },
      create: {
        id: accountId,
        name: "Saved Report Preview Fixtures",
        status: "active",
        healthScore: 88
      },
      update: {
        name: "Saved Report Preview Fixtures",
        status: "active",
        healthScore: 88
      }
    });
    await prisma.deal.createMany({
      data: [
        {
          id: proposalDealIds[0],
          accountId,
          name: "Preview Fleet Expansion",
          stage: "proposal",
          value: 50000,
          probability: 40,
          expectedCloseDate: new Date("2026-06-15T00:00:00.000Z"),
          lastActivityAt: new Date("2026-05-20T00:00:00.000Z")
        },
        {
          id: proposalDealIds[1],
          accountId,
          name: "Preview Renewal",
          stage: "proposal",
          value: 75000,
          probability: 60,
          expectedCloseDate: new Date("2026-06-20T00:00:00.000Z"),
          lastActivityAt: new Date("2026-05-21T00:00:00.000Z")
        },
        {
          id: negotiationDealId,
          accountId,
          name: "Preview Negotiation",
          stage: "negotiation",
          value: 125000,
          probability: 75,
          expectedCloseDate: new Date("2026-07-01T00:00:00.000Z"),
          lastActivityAt: new Date("2026-05-22T00:00:00.000Z")
        }
      ]
    });
  });

  afterAll(async () => {
    await deleteFixtureRecords();
  });

  it("runs a valid saved report definition through bounded list previews", async () => {
    const countsBefore = await currentCounts();
    const preview = await runSavedReportPreview({
      entity: "opportunities",
      name: "Proposal value preview",
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
      limit: 5
    });

    expect(preview).toMatchObject({
      contentType: SAVED_REPORT_PREVIEW_CONTENT_TYPE,
      previewType: "saved-report-preview",
      status: "valid",
      errors: [],
      definition: {
        entity: "opportunities",
        label: "Opportunities",
        route: "/deals"
      },
      normalizedDraft: {
        entity: "opportunities",
        name: "Proposal value preview",
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
        }
      },
      limit: 5,
      rowCount: 2,
      read: {
        metadata: true,
        database: true,
        adapterInternals: false,
        reportServices: false
      },
      write: noWriteFlags
    });
    expect(preview.rows.map((row) => row.values.name).sort()).toEqual([
      "Preview Fleet Expansion",
      "Preview Renewal"
    ]);
    expect(preview.rows.every((row) => row.values.stage === "proposal")).toBe(
      true
    );
    expect(aggregateValue(preview.aggregates, "recordCount")).toBe(2);
    expect(aggregateValue(preview.aggregates, "value.sum")).toBe(125000);
    expect(aggregateValue(preview.aggregates, "value.avg")).toBe(62500);
    expect(aggregateValue(preview.aggregates, "probability.avg")).toBe(50);
    expect(preview.groups).toHaveLength(1);
    expect(preview.groups[0]).toMatchObject({
      key: "stage:proposal",
      dimensions: {
        stage: "proposal"
      },
      rowCount: 2
    });
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

  it("honors the requested preview limit before calculating summaries", async () => {
    const preview = await runSavedReportPreview({
      entity: "opportunities",
      fields: ["name", "stage", "value"],
      filters: {
        accountId
      },
      chart: {
        type: "bar",
        dimensionKey: "stage",
        metricKey: "recordCount"
      },
      limit: 2
    });

    expect(preview.status).toBe("valid");
    expect(preview.rowCount).toBe(2);
    expect(preview.rows).toHaveLength(2);
    expect(aggregateValue(preview.aggregates, "recordCount")).toBe(2);
    expect(
      preview.chart?.points.reduce((total, point) => total + point.rowCount, 0)
    ).toBe(2);
  });

  it("returns deterministic validation errors without reading or writing data", async () => {
    const countsBefore = await currentCounts();
    const preview = await runSavedReportPreview({
      entity: "notes",
      fields: ["title"],
      limit: 1
    });

    expect(preview).toMatchObject({
      status: "invalid",
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
      },
      write: noWriteFlags
    });
    expect(preview.errors).toEqual([
      {
        code: "invalid_definition",
        path: null,
        message:
          "Saved report definitions only support current CRM list entities. Unsupported entity: 'notes'."
      }
    ]);
    expect(await currentCounts()).toEqual(countsBefore);
  });
});

function aggregateValue(
  aggregates: readonly SavedReportPreviewAggregate[],
  key: string
): number | null {
  const aggregate = aggregates.find((candidate) => candidate.key === key);

  if (!aggregate) {
    throw new Error(`Expected aggregate ${key}`);
  }

  return aggregate.value;
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
    savedListViews
  };
}

async function deleteFixtureRecords() {
  await prisma.deal.deleteMany({ where: { accountId } });
  await prisma.account.deleteMany({ where: { id: accountId } });
}
