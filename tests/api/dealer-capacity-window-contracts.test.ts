import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  DEALER_CAPACITY_WINDOW_CONTENT_TYPE,
  DEALER_CAPACITY_WINDOW_MAX_DAILY_CAP,
  DEALER_CAPACITY_WINDOW_MAX_WINDOWS,
  DEALER_CAPACITY_WINDOW_VERSION,
  getDealerCapacityWindowCatalog,
  getDealerCapacityWindowFixtureDraft,
  getDealerCapacityWindowGuardrails,
  isCalendarDate,
  validateDealerCapacityWindowDraft
} from "@/lib/server/dealerCapacityWindowContracts";
import { ROUTING_SIMULATOR_INPUT_VERSION } from "@/lib/server/routingSimulatorContracts";

const readMetadataOnly = {
  metadata: true,
  hypotheticalCapacityWindows: false,
  database: false,
  crmRecords: false,
  dealerOrders: false,
  liveRouting: false,
  routingSimulatorEvaluation: false,
  pacingEngine: false,
  routeHandlers: false,
  externalServices: false
};

const readHypotheticalCapacityWindows = {
  ...readMetadataOnly,
  hypotheticalCapacityWindows: true
};

const noWriteFlags = {
  database: false,
  leads: false,
  activities: false,
  routingEvents: false,
  dealerOrders: false,
  areas: false,
  pacingEngine: false,
  forecasts: false,
  routes: false,
  files: false,
  externalServices: false,
  backgroundJobs: false,
  capacityWindows: false,
  blackoutDates: false,
  capacityHistory: false,
  routingAssignments: false,
  scenarioPersistence: false,
  simulatorRuns: false
};

const safetyFlags = {
  deterministic: true,
  readOnly: true,
  validatesInputs: true,
  fixtureOnly: false,
  capacityPlanning: true,
  assignmentEvaluation: false,
  liveRouting: false,
  leadCreation: false,
  routingEventWrites: false,
  leadStatusChanges: false,
  dealerOrderMutation: false,
  areaMutation: false,
  pacingMutation: false,
  capacityPersistence: false,
  forecastPersistence: false,
  scenarioPersistence: false,
  geocoding: false,
  externalAi: false,
  network: false,
  productUi: false,
  routeHandlers: false,
  backgroundJobs: false
};

describe("dealer capacity window contracts", () => {
  it("publishes deterministic metadata and no-write guardrails", () => {
    const catalog = getDealerCapacityWindowCatalog();

    expect(catalog).toMatchObject({
      contentType: DEALER_CAPACITY_WINDOW_CONTENT_TYPE,
      catalogType: "dealer-capacity-window-contracts",
      catalogVersion: DEALER_CAPACITY_WINDOW_VERSION,
      inputCatalogVersion: ROUTING_SIMULATOR_INPUT_VERSION,
      fieldCount: 7,
      limits: {
        windows: {
          min: 1,
          default: 3,
          max: DEALER_CAPACITY_WINDOW_MAX_WINDOWS
        },
        fieldLengths: {
          dealerOrderId: 120,
          label: 120,
          notes: 240
        },
        dailyCap: {
          min: 0,
          max: DEALER_CAPACITY_WINDOW_MAX_DAILY_CAP
        },
        blackoutDates: {
          maxPerWindow: 366,
          mustBeWithinWindow: true,
          duplicatesAllowed: false
        }
      },
      guardrails: getDealerCapacityWindowGuardrails(),
      source: {
        contractModule: "lib/server/dealerCapacityWindowContracts.ts",
        routingSimulatorInputModule: "lib/server/routingSimulatorContracts.ts",
        catalogScope: "read-only-dealer-capacity-window-contracts"
      },
      read: readMetadataOnly,
      write: noWriteFlags,
      safety: safetyFlags
    });
    expect(catalog.fields.map((field) => field.key)).toEqual([
      "dealerOrderId",
      "label",
      "startsOn",
      "endsOn",
      "dailyCap",
      "blackoutDates",
      "notes"
    ]);
    expect(catalog.fields.find((field) => field.key === "dailyCap")).toEqual({
      key: "dailyCap",
      label: "Daily cap",
      required: true,
      valueType: "integer",
      maxLength: null,
      minValue: 0,
      maxValue: DEALER_CAPACITY_WINDOW_MAX_DAILY_CAP,
      normalizedOutput: "dailyCap"
    });
    expect(catalog.fixtures.map((fixture) => fixture.dealerOrderId)).toEqual([
      "sim-order-vancouver",
      "sim-order-seattle"
    ]);
    expect(catalog.guardrails).toMatchObject({
      noLiveRouting: true,
      noLeadStatusChanges: true,
      noRoutingEventWrites: true,
      noDealerOrderQuotaOrDeliveryMutation: true,
      noDealerCapacityPersistence: true,
      noCapacityHistory: true,
      noPacingEngineMutation: true,
      noScenarioPersistence: true,
      noProductRoutesOrUi: true,
      noExternalCalls: true,
      dateValidation:
        "lib/server/dealerCapacityWindowContracts.ts#isCalendarDate",
      targetReference: "DealerOrder.id"
    });
    expect(() =>
      getDealerCapacityWindowCatalog({ includeLiveCapacity: true })
    ).toThrow(/Unrecognized key: .*includeLiveCapacity/);
  });

  it("normalizes hypothetical capacity windows without evaluating routing", () => {
    const draft = validateDealerCapacityWindowDraft({
      windows: [
        {
          dealerOrderId: "  order-vancouver  ",
          label: "  Weekend limit ",
          startsOn: " 2026-06-01 ",
          endsOn: "2026-06-07",
          dailyCap: 2,
          blackoutDates: ["2026-06-07", "2026-06-03"],
          notes: "  temporary staffing window "
        },
        {
          dealerOrderId: "order-seattle",
          startsOn: "2026-06-10",
          endsOn: "2026-06-10",
          dailyCap: 0
        }
      ]
    });

    expect(draft).toMatchObject({
      batchType: "dealer-capacity-window-input",
      contractVersion: DEALER_CAPACITY_WINDOW_VERSION,
      inputCatalogVersion: ROUTING_SIMULATOR_INPUT_VERSION,
      windowCount: 2,
      limits: {
        windows: {
          min: 1,
          default: 3,
          max: DEALER_CAPACITY_WINDOW_MAX_WINDOWS
        }
      },
      guardrails: getDealerCapacityWindowGuardrails(),
      source: {
        contractModule: "lib/server/dealerCapacityWindowContracts.ts",
        routingSimulatorInputModule: "lib/server/routingSimulatorContracts.ts",
        validationScope: "hypothetical-dealer-capacity-windows"
      },
      read: readHypotheticalCapacityWindows,
      write: noWriteFlags,
      safety: safetyFlags
    });
    expect(draft.windows).toEqual([
      {
        rowNumber: 1,
        dealerOrderId: "order-vancouver",
        label: "Weekend limit",
        startsOn: "2026-06-01",
        endsOn: "2026-06-07",
        dailyCap: 2,
        blackoutDates: ["2026-06-03", "2026-06-07"],
        notes: "temporary staffing window",
        calendarDayCount: 7,
        blackoutDayCount: 2,
        availableDayCount: 5
      },
      {
        rowNumber: 2,
        dealerOrderId: "order-seattle",
        label: null,
        startsOn: "2026-06-10",
        endsOn: "2026-06-10",
        dailyCap: 0,
        blackoutDates: [],
        notes: null,
        calendarDayCount: 1,
        blackoutDayCount: 0,
        availableDayCount: 1
      }
    ]);
  });

  it("publishes a validated fixture draft for later simulator consumers", () => {
    const fixture = getDealerCapacityWindowFixtureDraft();

    expect(fixture.windowCount).toBe(2);
    expect(fixture.windows.map((window) => window.dealerOrderId)).toEqual([
      "sim-order-vancouver",
      "sim-order-seattle"
    ]);
    expect(fixture.windows.map((window) => window.availableDayCount)).toEqual([
      6,
      2
    ]);
    expect(fixture.write).toEqual(noWriteFlags);
    expect(fixture.safety.fixtureOnly).toBe(true);
    expect(fixture.safety.assignmentEvaluation).toBe(false);
    expect(fixture.safety.liveRouting).toBe(false);
  });

  it("rejects malformed dates, duplicate windows, bad caps, extra keys, and oversize batches", () => {
    expect(isCalendarDate("2026-06-01")).toBe(true);
    expect(isCalendarDate("2026-02-30")).toBe(false);
    expect(() => validateDealerCapacityWindowDraft({ windows: [] })).toThrow(
      "At least one dealer capacity window is required."
    );
    expect(() =>
      validateDealerCapacityWindowDraft({
        windows: [
          {
            dealerOrderId: "order-1",
            startsOn: "2026-02-30",
            endsOn: "2026-03-01",
            dailyCap: 1
          }
        ]
      })
    ).toThrow("Capacity dates must use YYYY-MM-DD calendar dates.");
    expect(() =>
      validateDealerCapacityWindowDraft({
        windows: [
          {
            dealerOrderId: "order-1",
            startsOn: "2026-06-10",
            endsOn: "2026-06-01",
            dailyCap: 1
          }
        ]
      })
    ).toThrow("Capacity window end date must be on or after start date.");
    expect(() =>
      validateDealerCapacityWindowDraft({
        windows: [
          {
            dealerOrderId: "order-1",
            startsOn: "2026-06-01",
            endsOn: "2026-06-10",
            dailyCap: 1,
            blackoutDates: ["2026-06-03", "2026-06-03"]
          }
        ]
      })
    ).toThrow("Blackout dates must be unique within a capacity window.");
    expect(() =>
      validateDealerCapacityWindowDraft({
        windows: [
          {
            dealerOrderId: "order-1",
            startsOn: "2026-06-01",
            endsOn: "2026-06-10",
            dailyCap: 1,
            blackoutDates: ["2026-06-11"]
          }
        ]
      })
    ).toThrow(
      "Blackout dates must fall within the capacity window date range."
    );
    expect(() =>
      validateDealerCapacityWindowDraft({
        windows: [
          {
            dealerOrderId: "order-1",
            startsOn: "2026-06-01",
            endsOn: "2026-06-10",
            dailyCap: -1
          }
        ]
      })
    ).toThrow("Daily cap cannot be negative.");
    expect(() =>
      validateDealerCapacityWindowDraft({
        windows: [
          {
            dealerOrderId: "order-1",
            startsOn: "2026-06-01",
            endsOn: "2026-06-10",
            dailyCap: DEALER_CAPACITY_WINDOW_MAX_DAILY_CAP + 1
          }
        ]
      })
    ).toThrow(
      `Daily cap cannot exceed ${DEALER_CAPACITY_WINDOW_MAX_DAILY_CAP}.`
    );
    expect(() =>
      validateDealerCapacityWindowDraft({
        windows: [
          {
            dealerOrderId: "order-1",
            startsOn: "2026-06-01",
            endsOn: "2026-06-10",
            dailyCap: 1,
            liveRouting: true
          }
        ]
      })
    ).toThrow(/Unrecognized key: .*liveRouting/);
    expect(() =>
      validateDealerCapacityWindowDraft({
        windows: [
          {
            dealerOrderId: "order-1",
            startsOn: "2026-06-01",
            endsOn: "2026-06-10",
            dailyCap: 1
          },
          {
            dealerOrderId: "order-1",
            startsOn: "2026-06-01",
            endsOn: "2026-06-10",
            dailyCap: 2
          }
        ]
      })
    ).toThrow(
      "Duplicate capacity window for the same dealer order and date range."
    );
    expect(() =>
      validateDealerCapacityWindowDraft({
        windows: [
          {
            dealerOrderId: "order-1",
            startsOn: "2026-06-01",
            endsOn: "2026-06-10",
            dailyCap: 1
          },
          {
            dealerOrderId: "order-1",
            startsOn: "2026-06-10",
            endsOn: "2026-06-12",
            dailyCap: 1
          }
        ]
      })
    ).toThrow("Capacity windows for the same dealer order cannot overlap.");
    expect(() =>
      validateDealerCapacityWindowDraft({
        windows: Array.from(
          { length: DEALER_CAPACITY_WINDOW_MAX_WINDOWS + 1 },
          (_, index) => ({
            dealerOrderId: `order-${index}`,
            startsOn: "2026-06-01",
            endsOn: "2026-06-01",
            dailyCap: 1
          })
        )
      })
    ).toThrow(
      `Dealer capacity window batches cannot exceed ${DEALER_CAPACITY_WINDOW_MAX_WINDOWS} windows.`
    );
  });

  it("does not write CRM records while building contracts", async () => {
    const before = await currentCounts();

    getDealerCapacityWindowCatalog();
    getDealerCapacityWindowFixtureDraft();
    validateDealerCapacityWindowDraft({
      windows: [
        {
          dealerOrderId: "no-write-order",
          startsOn: "2026-06-01",
          endsOn: "2026-06-03",
          dailyCap: 2,
          blackoutDates: ["2026-06-02"]
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
