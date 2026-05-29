import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  PACING_SNAPSHOT_CONTENT_TYPE,
  PACING_SNAPSHOT_MAX_DEALER_ORDER_IDS,
  PACING_SNAPSHOT_MAX_REQUESTS,
  PACING_SNAPSHOT_MAX_WINDOW_DAYS,
  PACING_SNAPSHOT_METRIC_KEYS,
  PACING_SNAPSHOT_VERSION,
  getPacingSnapshotCatalog,
  getPacingSnapshotFixtureDraft,
  getPacingSnapshotGuardrails,
  getPacingSnapshotMetricDefinitions,
  isPacingSnapshotCalendarDate,
  isPacingSnapshotGranularity,
  isPacingSnapshotMetricKey,
  listPacingSnapshotGranularities,
  listPacingSnapshotMetricKeys,
  validatePacingSnapshotDraft
} from "@/lib/server/pacingSnapshotContracts";

const readMetadataOnly = {
  metadata: true,
  hypotheticalSnapshotInput: false,
  metricDefinitions: true,
  fixtures: true,
  database: false,
  crmRecords: false,
  leads: false,
  activities: false,
  routingEvents: false,
  dealerOrders: false,
  pacingEngine: false,
  persistedSnapshots: false,
  routeHandlers: false,
  externalServices: false
};

const readHypotheticalSnapshotInput = {
  ...readMetadataOnly,
  hypotheticalSnapshotInput: true
};

const noWriteFlags = {
  database: false,
  leads: false,
  activities: false,
  routingEvents: false,
  dealerOrders: false,
  areas: false,
  pacingEngine: false,
  pacingSnapshots: false,
  pacingSnapshotHistory: false,
  forecasts: false,
  scenarioPersistence: false,
  routes: false,
  files: false,
  externalServices: false,
  backgroundJobs: false
};

const safetyFlags = {
  deterministic: true,
  readOnly: true,
  validatesInputs: true,
  fixtureOnly: false,
  snapshotBuilder: false,
  liveRouting: false,
  leadCreation: false,
  leadStatusChanges: false,
  routingEventWrites: false,
  dealerOrderMutation: false,
  areaMutation: false,
  pacingMutation: false,
  snapshotPersistence: false,
  forecastPersistence: false,
  scenarioPersistence: false,
  geocoding: false,
  externalAi: false,
  network: false,
  productUi: false,
  routeHandlers: false,
  backgroundJobs: false
};

describe("pacing snapshot contracts", () => {
  it("publishes deterministic metadata, metric keys, and no-write guardrails", () => {
    const catalog = getPacingSnapshotCatalog();

    expect(listPacingSnapshotGranularities()).toEqual(["daily", "monthly"]);
    expect(isPacingSnapshotGranularity("daily")).toBe(true);
    expect(isPacingSnapshotGranularity("weekly")).toBe(false);
    expect(listPacingSnapshotMetricKeys()).toEqual(PACING_SNAPSHOT_METRIC_KEYS);
    expect(isPacingSnapshotMetricKey("paceGapCount")).toBe(true);
    expect(isPacingSnapshotMetricKey("liveRouteCount")).toBe(false);
    expect(catalog).toMatchObject({
      contentType: PACING_SNAPSHOT_CONTENT_TYPE,
      catalogType: "pacing-snapshot-contracts",
      catalogVersion: PACING_SNAPSHOT_VERSION,
      supportedGranularities: ["daily", "monthly"],
      supportedGranularityCount: 2,
      fieldCount: 7,
      metricCount: PACING_SNAPSHOT_METRIC_KEYS.length,
      limits: {
        requests: {
          min: 1,
          default: 2,
          max: PACING_SNAPSHOT_MAX_REQUESTS
        },
        windowDays: {
          min: 1,
          max: PACING_SNAPSHOT_MAX_WINDOW_DAYS
        },
        fieldLengths: {
          referenceId: 100,
          label: 120,
          dealerOrderId: 120
        },
        dealerOrderIds: {
          maxPerRequest: PACING_SNAPSHOT_MAX_DEALER_ORDER_IDS,
          duplicatesAllowed: false,
          targetReference: "DealerOrder.id"
        },
        metricKeys: {
          minPerRequest: 1,
          maxPerRequest: PACING_SNAPSHOT_METRIC_KEYS.length,
          duplicatesAllowed: false
        }
      },
      guardrails: getPacingSnapshotGuardrails(),
      source: {
        contractModule: "lib/server/pacingSnapshotContracts.ts",
        catalogScope: "read-only-pacing-snapshot-contracts"
      },
      read: readMetadataOnly,
      write: noWriteFlags,
      safety: safetyFlags
    });
    expect(catalog.fields.map((field) => field.key)).toEqual([
      "referenceId",
      "label",
      "granularity",
      "startsOn",
      "endsOn",
      "dealerOrderIds",
      "metricKeys"
    ]);
    expect(catalog.fields.find((field) => field.key === "granularity")).toEqual(
      {
        key: "granularity",
        label: "Granularity",
        required: false,
        valueType: "snapshot_granularity",
        maxLength: null,
        maxItems: null,
        allowedValues: ["daily", "monthly"],
        normalizedOutput: "granularity"
      }
    );
    expect(catalog.metricDefinitions.map((metric) => metric.key)).toEqual([
      "leadCreatedCount",
      "routedLeadCount",
      "unroutedLeadCount",
      "routingEventCount",
      "dealerOrderCount",
      "activeDealerOrderCount",
      "monthlyQuotaTotal",
      "deliveredLeadCount",
      "expectedDeliveryCount",
      "paceGapCount",
      "deliveryRate"
    ]);
    expect(
      catalog.metricDefinitions.find((metric) => metric.key === "deliveryRate")
    ).toEqual({
      key: "deliveryRate",
      label: "Delivery rate",
      description:
        "Delivered leads divided by monthly quota for the snapshot bucket.",
      source: "derived_pacing",
      valueType: "ratio",
      bucketSupport: ["daily", "monthly"]
    });
    expect(catalog.fixtures.map((fixture) => fixture.referenceId)).toEqual([
      "pace-vancouver-june-month",
      "pace-all-orders-week"
    ]);
    expect(catalog.guardrails).toMatchObject({
      noLiveRouting: true,
      noLeadCreation: true,
      noLeadStatusChanges: true,
      noRoutingEventWrites: true,
      noDealerOrderQuotaOrDeliveryMutation: true,
      noPacingEngineMutation: true,
      noPacingSnapshotPersistence: true,
      noPacingSnapshotHistory: true,
      noProductRoutesOrUi: true,
      noExternalCalls: true,
      dateValidation:
        "lib/server/pacingSnapshotContracts.ts#isPacingSnapshotCalendarDate",
      targetReference: "DealerOrder.id"
    });
    expect(() =>
      getPacingSnapshotCatalog({ includeLiveSnapshots: true })
    ).toThrow(/Unrecognized key: .*includeLiveSnapshots/);
  });

  it("normalizes read-only snapshot inputs without building snapshots", () => {
    const draft = validatePacingSnapshotDraft({
      requests: [
        {
          referenceId: "  june-vancouver ",
          label: "  Vancouver June ",
          granularity: "monthly",
          startsOn: " 2026-06-01 ",
          endsOn: "2026-07-15",
          dealerOrderIds: [" dealer-b ", "dealer-a"],
          metricKeys: ["paceGapCount", "deliveredLeadCount", "deliveryRate"]
        },
        {
          startsOn: "2026-06-01",
          endsOn: "2026-06-07",
          granularity: "daily"
        }
      ]
    });

    expect(draft).toMatchObject({
      batchType: "pacing-snapshot-input",
      contractVersion: PACING_SNAPSHOT_VERSION,
      requestCount: 2,
      limits: {
        requests: {
          min: 1,
          default: 2,
          max: PACING_SNAPSHOT_MAX_REQUESTS
        }
      },
      metricDefinitions: getPacingSnapshotMetricDefinitions(),
      guardrails: getPacingSnapshotGuardrails(),
      source: {
        contractModule: "lib/server/pacingSnapshotContracts.ts",
        validationScope: "read-only-pacing-snapshot-input"
      },
      read: readHypotheticalSnapshotInput,
      write: noWriteFlags,
      safety: safetyFlags
    });
    expect(draft.requests[0]).toEqual({
      rowNumber: 1,
      referenceId: "june-vancouver",
      label: "Vancouver June",
      granularity: "monthly",
      startsOn: "2026-06-01",
      endsOn: "2026-07-15",
      calendarDayCount: 45,
      monthBucketCount: 2,
      bucketCount: 2,
      dealerOrderIds: ["dealer-a", "dealer-b"],
      dealerOrderFilterCount: 2,
      metricKeys: ["deliveredLeadCount", "paceGapCount", "deliveryRate"],
      metricCount: 3
    });
    expect(draft.requests[1]).toEqual({
      rowNumber: 2,
      referenceId: null,
      label: null,
      granularity: "daily",
      startsOn: "2026-06-01",
      endsOn: "2026-06-07",
      calendarDayCount: 7,
      monthBucketCount: 1,
      bucketCount: 7,
      dealerOrderIds: [],
      dealerOrderFilterCount: 0,
      metricKeys: [...PACING_SNAPSHOT_METRIC_KEYS],
      metricCount: PACING_SNAPSHOT_METRIC_KEYS.length
    });
  });

  it("publishes a validated fixture draft for later snapshot builders", () => {
    const fixture = getPacingSnapshotFixtureDraft();

    expect(fixture.requestCount).toBe(2);
    expect(fixture.requests.map((request) => request.referenceId)).toEqual([
      "pace-vancouver-june-month",
      "pace-all-orders-week"
    ]);
    expect(fixture.requests.map((request) => request.bucketCount)).toEqual([
      1,
      7
    ]);
    expect(fixture.requests[0]!.dealerOrderIds).toEqual([
      "dealer-order-vancouver-northstar"
    ]);
    expect(fixture.write).toEqual(noWriteFlags);
    expect(fixture.safety.fixtureOnly).toBe(true);
    expect(fixture.safety.snapshotBuilder).toBe(false);
    expect(fixture.safety.liveRouting).toBe(false);
  });

  it("rejects malformed dates, duplicate filters, bad metric keys, extra keys, and oversize batches", () => {
    expect(isPacingSnapshotCalendarDate("2026-06-01")).toBe(true);
    expect(isPacingSnapshotCalendarDate("2026-02-30")).toBe(false);
    expect(() => validatePacingSnapshotDraft({ requests: [] })).toThrow(
      "At least one pacing snapshot request is required."
    );
    expect(() =>
      validatePacingSnapshotDraft({
        requests: [
          {
            startsOn: "2026-02-30",
            endsOn: "2026-03-01"
          }
        ]
      })
    ).toThrow("Snapshot dates must use YYYY-MM-DD calendar dates.");
    expect(() =>
      validatePacingSnapshotDraft({
        requests: [
          {
            startsOn: "2026-06-10",
            endsOn: "2026-06-01"
          }
        ]
      })
    ).toThrow("Snapshot end date must be on or after start date.");
    expect(() =>
      validatePacingSnapshotDraft({
        requests: [
          {
            startsOn: "2026-01-01",
            endsOn: "2027-01-02"
          }
        ]
      })
    ).toThrow(
      `Pacing snapshot windows cannot exceed ${PACING_SNAPSHOT_MAX_WINDOW_DAYS} days.`
    );
    expect(() =>
      validatePacingSnapshotDraft({
        requests: [
          {
            startsOn: "2026-06-01",
            endsOn: "2026-06-30",
            dealerOrderIds: ["dealer-a", "dealer-a"]
          }
        ]
      })
    ).toThrow(
      "Dealer order filters must be unique within a pacing snapshot request."
    );
    expect(() =>
      validatePacingSnapshotDraft({
        requests: [
          {
            startsOn: "2026-06-01",
            endsOn: "2026-06-30",
            metricKeys: ["paceGapCount", "paceGapCount"]
          }
        ]
      })
    ).toThrow("Metric keys must be unique within a pacing snapshot request.");
    expect(() =>
      validatePacingSnapshotDraft({
        requests: [
          {
            startsOn: "2026-06-01",
            endsOn: "2026-06-30",
            metricKeys: ["liveRouteCount"]
          }
        ]
      })
    ).toThrow();
    expect(() =>
      validatePacingSnapshotDraft({
        requests: [
          {
            startsOn: "2026-06-01",
            endsOn: "2026-06-30",
            persistSnapshot: true
          }
        ]
      })
    ).toThrow(/Unrecognized key: .*persistSnapshot/);
    expect(() =>
      validatePacingSnapshotDraft({
        requests: Array.from({ length: PACING_SNAPSHOT_MAX_REQUESTS + 1 }, () => ({
          startsOn: "2026-06-01",
          endsOn: "2026-06-01"
        }))
      })
    ).toThrow(
      `Pacing snapshot batches cannot exceed ${PACING_SNAPSHOT_MAX_REQUESTS} requests.`
    );
  });

  it("does not write CRM records while building contracts", async () => {
    const before = await currentCounts();

    getPacingSnapshotCatalog();
    getPacingSnapshotFixtureDraft();
    validatePacingSnapshotDraft({
      requests: [
        {
          referenceId: "no-write",
          startsOn: "2026-06-01",
          endsOn: "2026-06-30",
          dealerOrderIds: ["dealer-order-vancouver-northstar"]
        }
      ]
    });

    expect(await currentCounts()).toEqual(before);
  });
});

async function currentCounts() {
  const [leads, activities, dealerOrders, areas] = await Promise.all([
    prisma.lead.count(),
    prisma.activity.count(),
    prisma.dealerOrder.count(),
    prisma.area.count()
  ]);

  return {
    leads,
    activities,
    dealerOrders,
    areas
  };
}
