import { describe, expect, it } from "vitest";
import { POSTAL_COUNTRIES } from "@/lib/postal";
import { prisma } from "@/lib/prisma";
import {
  ROUTING_SIMULATOR_DEFAULT_BATCH_SIZE,
  ROUTING_SIMULATOR_INPUT_CONTENT_TYPE,
  ROUTING_SIMULATOR_INPUT_VERSION,
  ROUTING_SIMULATOR_MAX_BATCH_SIZE,
  getRoutingSimulatorFixtureBatch,
  getRoutingSimulatorGuardrails,
  getRoutingSimulatorInputCatalog,
  isRoutingSimulatorCountry,
  listRoutingSimulatorCountries,
  validateRoutingSimulatorInputDraft
} from "@/lib/server/routingSimulatorContracts";

const readMetadataOnly = {
  metadata: true,
  hypotheticalInput: false,
  database: false,
  crmRecords: false,
  liveRouting: false,
  dealerOrders: false,
  pacingEngine: false,
  routeHandlers: false,
  externalServices: false
};

const readHypotheticalInput = {
  ...readMetadataOnly,
  hypotheticalInput: true
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
  backgroundJobs: false
};

const safetyFlags = {
  deterministic: true,
  readOnly: true,
  validatesInputs: true,
  fixtureOnly: false,
  assignmentEvaluation: false,
  liveRouting: false,
  leadCreation: false,
  routingEventWrites: false,
  dealerOrderMutation: false,
  pacingMutation: false,
  forecastPersistence: false,
  geocoding: false,
  externalAi: false,
  network: false,
  productUi: false,
  routeHandlers: false
};

describe("routing simulator input contracts", () => {
  it("publishes deterministic simulator metadata and no-write guardrails", () => {
    const catalog = getRoutingSimulatorInputCatalog();

    expect(listRoutingSimulatorCountries()).toEqual(POSTAL_COUNTRIES);
    expect(isRoutingSimulatorCountry("CA")).toBe(true);
    expect(isRoutingSimulatorCountry("US")).toBe(true);
    expect(isRoutingSimulatorCountry("MX")).toBe(false);
    expect(catalog).toMatchObject({
      contentType: ROUTING_SIMULATOR_INPUT_CONTENT_TYPE,
      catalogType: "routing-simulator-input-contracts",
      catalogVersion: ROUTING_SIMULATOR_INPUT_VERSION,
      supportedCountries: ["CA", "US"],
      supportedCountryCount: 2,
      fieldCount: 6,
      limits: {
        batch: {
          min: 1,
          default: ROUTING_SIMULATOR_DEFAULT_BATCH_SIZE,
          max: ROUTING_SIMULATOR_MAX_BATCH_SIZE
        },
        fieldLengths: {
          referenceId: 80,
          firstName: 80,
          lastName: 80,
          source: 80
        }
      },
      guardrails: getRoutingSimulatorGuardrails(),
      source: {
        contractModule: "lib/server/routingSimulatorContracts.ts",
        postalModule: "lib/postal.ts",
        catalogScope: "routing-simulator-input-contracts"
      },
      read: readMetadataOnly,
      write: noWriteFlags,
      safety: safetyFlags
    });
    expect(catalog.fields.map((field) => field.key)).toEqual([
      "referenceId",
      "firstName",
      "lastName",
      "postalCode",
      "country",
      "source"
    ]);
    expect(catalog.fields.find((field) => field.key === "postalCode")).toEqual({
      key: "postalCode",
      label: "Postal code",
      required: true,
      valueType: "postal_code",
      maxLength: null,
      allowedValues: null,
      normalizedOutput: "normalizedPostalCode"
    });
    expect(catalog.fields.find((field) => field.key === "country")).toEqual({
      key: "country",
      label: "Country",
      required: false,
      valueType: "country",
      maxLength: null,
      allowedValues: ["CA", "US"],
      normalizedOutput: "country"
    });
    expect(catalog.fixtures.map((fixture) => fixture.referenceId)).toEqual([
      "sim-vancouver-v5k",
      "sim-seattle-98101"
    ]);
    expect(catalog.guardrails).toMatchObject({
      noLiveLeadCreation: true,
      noRoutingEventWrites: true,
      noDealerOrderQuotaOrDeliveryMutation: true,
      noPacingEngineMutation: true,
      noForecastPersistence: true,
      noProductRoutesOrUi: true,
      noExternalCalls: true,
      countryValidation: "lib/postal.ts#POSTAL_COUNTRIES",
      postalValidation: "lib/postal.ts#validatePostalCode"
    });
    expect(() =>
      getRoutingSimulatorInputCatalog({ includeAssignments: true })
    ).toThrow("Unrecognized key(s) in object: 'includeAssignments'");
  });

  it("normalizes hypothetical lead inputs without evaluating assignments", () => {
    const draft = validateRoutingSimulatorInputDraft({
      leads: [
        {
          referenceId: "  van-1  ",
          firstName: "  Avery ",
          lastName: " Chen ",
          postalCode: "v5k0a1",
          country: "CA",
          source: " web-form "
        },
        {
          postalCode: "98101",
          country: "US"
        },
        {
          postalCode: "H2B 1A0"
        }
      ]
    });

    expect(draft).toMatchObject({
      batchType: "routing-simulator-input",
      catalogVersion: ROUTING_SIMULATOR_INPUT_VERSION,
      leadCount: 3,
      limits: {
        batch: {
          min: 1,
          default: ROUTING_SIMULATOR_DEFAULT_BATCH_SIZE,
          max: ROUTING_SIMULATOR_MAX_BATCH_SIZE
        }
      },
      guardrails: getRoutingSimulatorGuardrails(),
      source: {
        contractModule: "lib/server/routingSimulatorContracts.ts",
        postalModule: "lib/postal.ts",
        validationScope: "hypothetical-consumer-lead-input"
      },
      read: readHypotheticalInput,
      write: noWriteFlags,
      safety: safetyFlags
    });
    expect(draft.leads).toEqual([
      {
        rowNumber: 1,
        referenceId: "van-1",
        firstName: "Avery",
        lastName: "Chen",
        rawPostalCode: "v5k0a1",
        country: "CA",
        normalizedPostalCode: "V5K 0A1",
        postalPrefix: "V5K",
        source: "web-form"
      },
      {
        rowNumber: 2,
        referenceId: null,
        firstName: null,
        lastName: null,
        rawPostalCode: "98101",
        country: "US",
        normalizedPostalCode: "98101",
        postalPrefix: "98101",
        source: null
      },
      {
        rowNumber: 3,
        referenceId: null,
        firstName: null,
        lastName: null,
        rawPostalCode: "H2B 1A0",
        country: "CA",
        normalizedPostalCode: "H2B 1A0",
        postalPrefix: "H2B",
        source: null
      }
    ]);
  });

  it("publishes a validated fixture batch for later simulator consumers", () => {
    const fixture = getRoutingSimulatorFixtureBatch();

    expect(fixture.leadCount).toBe(2);
    expect(fixture.leads.map((lead) => lead.referenceId)).toEqual([
      "sim-vancouver-v5k",
      "sim-seattle-98101"
    ]);
    expect(fixture.leads.map((lead) => lead.normalizedPostalCode)).toEqual([
      "V5K 0A1",
      "98101"
    ]);
    expect(fixture.leads.map((lead) => lead.postalPrefix)).toEqual([
      "V5K",
      "98101"
    ]);
    expect(fixture.write).toEqual(noWriteFlags);
    expect(fixture.safety.fixtureOnly).toBe(true);
    expect(fixture.safety.assignmentEvaluation).toBe(false);
    expect(fixture.safety.liveRouting).toBe(false);
  });

  it("rejects unsupported countries, postal formats, extra keys, and oversize batches", () => {
    expect(() => validateRoutingSimulatorInputDraft({ leads: [] })).toThrow(
      "At least one hypothetical lead is required."
    );
    expect(() =>
      validateRoutingSimulatorInputDraft({
        leads: [
          {
            postalCode: "V5K 0A1",
            country: "MX"
          }
        ]
      })
    ).toThrow();
    expect(() =>
      validateRoutingSimulatorInputDraft({
        leads: [
          {
            postalCode: "not-valid",
            country: "CA"
          }
        ]
      })
    ).toThrow("Postal code must be in the format A1A 1A1");
    expect(() =>
      validateRoutingSimulatorInputDraft({
        leads: [
          {
            postalCode: "V5K 0A1",
            country: "CA",
            assignedOrderId: "order-1"
          }
        ]
      })
    ).toThrow("Unrecognized key(s) in object: 'assignedOrderId'");
    expect(() =>
      validateRoutingSimulatorInputDraft({
        leads: Array.from({ length: ROUTING_SIMULATOR_MAX_BATCH_SIZE + 1 }, () => ({
          postalCode: "V5K 0A1",
          country: "CA"
        }))
      })
    ).toThrow(
      `Routing simulator batches cannot exceed ${ROUTING_SIMULATOR_MAX_BATCH_SIZE} leads.`
    );
  });

  it("does not write CRM records while building contracts", async () => {
    const before = await currentCounts();

    getRoutingSimulatorInputCatalog();
    getRoutingSimulatorFixtureBatch();
    validateRoutingSimulatorInputDraft({
      leads: [
        {
          referenceId: "no-write",
          postalCode: "V5K 0A1",
          country: "CA"
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
