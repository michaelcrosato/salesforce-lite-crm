import { z } from "zod";
import {
  POSTAL_COUNTRIES,
  validatePostalCode,
  type PostalCountry
} from "@/lib/postal";

export const ROUTING_SIMULATOR_INPUT_CONTENT_TYPE =
  "application/json; charset=utf-8" as const;
export const ROUTING_SIMULATOR_INPUT_VERSION =
  "2026-05-27.s52-f1" as const;
export const ROUTING_SIMULATOR_MIN_BATCH_SIZE = 1;
export const ROUTING_SIMULATOR_DEFAULT_BATCH_SIZE = 5;
export const ROUTING_SIMULATOR_MAX_BATCH_SIZE = 25;
export const ROUTING_SIMULATOR_REFERENCE_ID_MAX_LENGTH = 80;
export const ROUTING_SIMULATOR_NAME_MAX_LENGTH = 80;
export const ROUTING_SIMULATOR_SOURCE_MAX_LENGTH = 80;

export type RoutingSimulatorCountry = PostalCountry;

export type RoutingSimulatorReadFlags = {
  metadata: true;
  hypotheticalInput: boolean;
  database: false;
  crmRecords: false;
  liveRouting: false;
  dealerOrders: false;
  pacingEngine: false;
  routeHandlers: false;
  externalServices: false;
};

export type RoutingSimulatorWriteFlags = {
  database: false;
  leads: false;
  activities: false;
  routingEvents: false;
  dealerOrders: false;
  areas: false;
  pacingEngine: false;
  forecasts: false;
  routes: false;
  files: false;
  externalServices: false;
  backgroundJobs: false;
};

export type RoutingSimulatorSafety = {
  deterministic: true;
  readOnly: true;
  validatesInputs: true;
  fixtureOnly: boolean;
  assignmentEvaluation: false;
  liveRouting: false;
  leadCreation: false;
  routingEventWrites: false;
  dealerOrderMutation: false;
  pacingMutation: false;
  forecastPersistence: false;
  geocoding: false;
  externalAi: false;
  network: false;
  productUi: false;
  routeHandlers: false;
};

export type RoutingSimulatorGuardrails = {
  noLiveLeadCreation: true;
  noLeadStatusChanges: true;
  noRoutingEventWrites: true;
  noDealerOrderQuotaOrDeliveryMutation: true;
  noPacingEngineMutation: true;
  noForecastPersistence: true;
  noProductRoutesOrUi: true;
  noExternalCalls: true;
  countryValidation: "lib/postal.ts#POSTAL_COUNTRIES";
  postalValidation: "lib/postal.ts#validatePostalCode";
};

export type RoutingSimulatorInputField = {
  key:
    | "referenceId"
    | "firstName"
    | "lastName"
    | "postalCode"
    | "country"
    | "source";
  label: string;
  required: boolean;
  valueType: "country" | "postal_code" | "text";
  maxLength: number | null;
  allowedValues: readonly string[] | null;
  normalizedOutput: string | null;
};

export type RoutingSimulatorInputFixture = {
  referenceId: string;
  firstName: string;
  lastName: string;
  postalCode: string;
  country: RoutingSimulatorCountry;
  source: "routing-simulator-fixture";
};

export type RoutingSimulatorInputCatalog = {
  contentType: typeof ROUTING_SIMULATOR_INPUT_CONTENT_TYPE;
  catalogType: "routing-simulator-input-contracts";
  catalogVersion: typeof ROUTING_SIMULATOR_INPUT_VERSION;
  supportedCountries: readonly RoutingSimulatorCountry[];
  supportedCountryCount: number;
  fields: readonly RoutingSimulatorInputField[];
  fieldCount: number;
  limits: {
    batch: {
      min: typeof ROUTING_SIMULATOR_MIN_BATCH_SIZE;
      default: typeof ROUTING_SIMULATOR_DEFAULT_BATCH_SIZE;
      max: typeof ROUTING_SIMULATOR_MAX_BATCH_SIZE;
    };
    fieldLengths: {
      referenceId: typeof ROUTING_SIMULATOR_REFERENCE_ID_MAX_LENGTH;
      firstName: typeof ROUTING_SIMULATOR_NAME_MAX_LENGTH;
      lastName: typeof ROUTING_SIMULATOR_NAME_MAX_LENGTH;
      source: typeof ROUTING_SIMULATOR_SOURCE_MAX_LENGTH;
    };
  };
  fixtures: readonly RoutingSimulatorInputFixture[];
  guardrails: RoutingSimulatorGuardrails;
  source: {
    contractModule: "lib/server/routingSimulatorContracts.ts";
    postalModule: "lib/postal.ts";
    catalogScope: "routing-simulator-input-contracts";
  };
  read: RoutingSimulatorReadFlags;
  write: RoutingSimulatorWriteFlags;
  safety: RoutingSimulatorSafety;
};

export type RoutingSimulatorInputRow = {
  rowNumber: number;
  referenceId: string | null;
  firstName: string | null;
  lastName: string | null;
  rawPostalCode: string;
  country: RoutingSimulatorCountry;
  normalizedPostalCode: string;
  postalPrefix: string;
  source: string | null;
};

export type RoutingSimulatorInputDraft = {
  batchType: "routing-simulator-input";
  catalogVersion: typeof ROUTING_SIMULATOR_INPUT_VERSION;
  leadCount: number;
  leads: readonly RoutingSimulatorInputRow[];
  limits: RoutingSimulatorInputCatalog["limits"];
  guardrails: RoutingSimulatorGuardrails;
  source: {
    contractModule: "lib/server/routingSimulatorContracts.ts";
    postalModule: "lib/postal.ts";
    validationScope: "hypothetical-consumer-lead-input";
  };
  read: RoutingSimulatorReadFlags;
  write: RoutingSimulatorWriteFlags;
  safety: RoutingSimulatorSafety;
};

type ParsedRoutingSimulatorLeadInput = z.infer<
  typeof routingSimulatorLeadInputSchema
>;

const catalogInputSchema = z.object({}).strict();
const routingSimulatorCountrySet: ReadonlySet<string> = new Set(
  POSTAL_COUNTRIES
);
const routingSimulatorLeadInputSchema = z
  .object({
    referenceId: optionalTrimmedText(
      ROUTING_SIMULATOR_REFERENCE_ID_MAX_LENGTH,
      "Reference ID"
    ),
    firstName: optionalTrimmedText(
      ROUTING_SIMULATOR_NAME_MAX_LENGTH,
      "First name"
    ),
    lastName: optionalTrimmedText(
      ROUTING_SIMULATOR_NAME_MAX_LENGTH,
      "Last name"
    ),
    postalCode: z
      .string()
      .trim()
      .min(1, "Postal code is required for routing simulation."),
    country: z.enum(POSTAL_COUNTRIES).default("CA"),
    source: optionalTrimmedText(ROUTING_SIMULATOR_SOURCE_MAX_LENGTH, "Source")
  })
  .strict()
  .superRefine((lead, ctx) => {
    const postal = validatePostalCode(lead.postalCode, lead.country);

    if (!postal.ok) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["postalCode"],
        message: postal.reason
      });
    }
  });
const routingSimulatorInputSchema = z
  .object({
    leads: z
      .array(routingSimulatorLeadInputSchema)
      .min(
        ROUTING_SIMULATOR_MIN_BATCH_SIZE,
        "At least one hypothetical lead is required."
      )
      .max(
        ROUTING_SIMULATOR_MAX_BATCH_SIZE,
        `Routing simulator batches cannot exceed ${ROUTING_SIMULATOR_MAX_BATCH_SIZE} leads.`
      )
  })
  .strict();

const inputFields = [
  fieldContract(
    "referenceId",
    "Reference ID",
    false,
    "text",
    ROUTING_SIMULATOR_REFERENCE_ID_MAX_LENGTH,
    null,
    "referenceId"
  ),
  fieldContract(
    "firstName",
    "First name",
    false,
    "text",
    ROUTING_SIMULATOR_NAME_MAX_LENGTH,
    null,
    "firstName"
  ),
  fieldContract(
    "lastName",
    "Last name",
    false,
    "text",
    ROUTING_SIMULATOR_NAME_MAX_LENGTH,
    null,
    "lastName"
  ),
  fieldContract(
    "postalCode",
    "Postal code",
    true,
    "postal_code",
    null,
    null,
    "normalizedPostalCode"
  ),
  fieldContract(
    "country",
    "Country",
    false,
    "country",
    null,
    POSTAL_COUNTRIES,
    "country"
  ),
  fieldContract(
    "source",
    "Source",
    false,
    "text",
    ROUTING_SIMULATOR_SOURCE_MAX_LENGTH,
    null,
    "source"
  )
] as const satisfies readonly RoutingSimulatorInputField[];

const fixtureInputs = [
  {
    referenceId: "sim-vancouver-v5k",
    firstName: "Avery",
    lastName: "Chen",
    postalCode: "V5K 0A1",
    country: "CA",
    source: "routing-simulator-fixture"
  },
  {
    referenceId: "sim-seattle-98101",
    firstName: "Jordan",
    lastName: "Lee",
    postalCode: "98101",
    country: "US",
    source: "routing-simulator-fixture"
  }
] as const satisfies readonly RoutingSimulatorInputFixture[];

export function getRoutingSimulatorInputCatalog(
  input: unknown = {}
): RoutingSimulatorInputCatalog {
  catalogInputSchema.parse(input);

  return {
    contentType: ROUTING_SIMULATOR_INPUT_CONTENT_TYPE,
    catalogType: "routing-simulator-input-contracts",
    catalogVersion: ROUTING_SIMULATOR_INPUT_VERSION,
    supportedCountries: listRoutingSimulatorCountries(),
    supportedCountryCount: POSTAL_COUNTRIES.length,
    fields: inputFields.map(copyInputField),
    fieldCount: inputFields.length,
    limits: routingSimulatorLimits(),
    fixtures: fixtureInputs.map(copyFixture),
    guardrails: routingSimulatorGuardrails(),
    source: {
      contractModule: "lib/server/routingSimulatorContracts.ts",
      postalModule: "lib/postal.ts",
      catalogScope: "routing-simulator-input-contracts"
    },
    read: readFlags(false),
    write: noWrites(),
    safety: safetyFlags(false)
  };
}

export function listRoutingSimulatorCountries(): RoutingSimulatorCountry[] {
  return [...POSTAL_COUNTRIES];
}

export function isRoutingSimulatorCountry(
  value: string
): value is RoutingSimulatorCountry {
  return routingSimulatorCountrySet.has(value);
}

export function getRoutingSimulatorGuardrails(): RoutingSimulatorGuardrails {
  return routingSimulatorGuardrails();
}

export function getRoutingSimulatorFixtureBatch(): RoutingSimulatorInputDraft {
  const draft = validateRoutingSimulatorInputDraft({
    leads: fixtureInputs
  });

  return {
    ...draft,
    safety: safetyFlags(true)
  };
}

export function validateRoutingSimulatorInputDraft(
  input: unknown
): RoutingSimulatorInputDraft {
  const parsed = routingSimulatorInputSchema.parse(input);
  const leads = parsed.leads.map(normalizeLeadInput);

  return {
    batchType: "routing-simulator-input",
    catalogVersion: ROUTING_SIMULATOR_INPUT_VERSION,
    leadCount: leads.length,
    leads,
    limits: routingSimulatorLimits(),
    guardrails: routingSimulatorGuardrails(),
    source: {
      contractModule: "lib/server/routingSimulatorContracts.ts",
      postalModule: "lib/postal.ts",
      validationScope: "hypothetical-consumer-lead-input"
    },
    read: readFlags(true),
    write: noWrites(),
    safety: safetyFlags(false)
  };
}

function optionalTrimmedText(maxLength: number, label: string) {
  return z
    .string()
    .trim()
    .max(maxLength, `${label} cannot exceed ${maxLength} characters.`)
    .optional()
    .transform((value) =>
      value === undefined || value.length === 0 ? undefined : value
    );
}

function normalizeLeadInput(
  lead: ParsedRoutingSimulatorLeadInput,
  index: number
): RoutingSimulatorInputRow {
  const postal = validatePostalCode(lead.postalCode, lead.country);

  if (!postal.ok) {
    throw new Error(postal.reason);
  }

  return {
    rowNumber: index + 1,
    referenceId: lead.referenceId ?? null,
    firstName: lead.firstName ?? null,
    lastName: lead.lastName ?? null,
    rawPostalCode: lead.postalCode,
    country: lead.country,
    normalizedPostalCode: postal.normalized,
    postalPrefix: postal.prefix,
    source: lead.source ?? null
  };
}

function routingSimulatorLimits(): RoutingSimulatorInputCatalog["limits"] {
  return {
    batch: {
      min: ROUTING_SIMULATOR_MIN_BATCH_SIZE,
      default: ROUTING_SIMULATOR_DEFAULT_BATCH_SIZE,
      max: ROUTING_SIMULATOR_MAX_BATCH_SIZE
    },
    fieldLengths: {
      referenceId: ROUTING_SIMULATOR_REFERENCE_ID_MAX_LENGTH,
      firstName: ROUTING_SIMULATOR_NAME_MAX_LENGTH,
      lastName: ROUTING_SIMULATOR_NAME_MAX_LENGTH,
      source: ROUTING_SIMULATOR_SOURCE_MAX_LENGTH
    }
  };
}

function routingSimulatorGuardrails(): RoutingSimulatorGuardrails {
  return {
    noLiveLeadCreation: true,
    noLeadStatusChanges: true,
    noRoutingEventWrites: true,
    noDealerOrderQuotaOrDeliveryMutation: true,
    noPacingEngineMutation: true,
    noForecastPersistence: true,
    noProductRoutesOrUi: true,
    noExternalCalls: true,
    countryValidation: "lib/postal.ts#POSTAL_COUNTRIES",
    postalValidation: "lib/postal.ts#validatePostalCode"
  };
}

function readFlags(hypotheticalInput: boolean): RoutingSimulatorReadFlags {
  return {
    metadata: true,
    hypotheticalInput,
    database: false,
    crmRecords: false,
    liveRouting: false,
    dealerOrders: false,
    pacingEngine: false,
    routeHandlers: false,
    externalServices: false
  };
}

function noWrites(): RoutingSimulatorWriteFlags {
  return {
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
}

function safetyFlags(fixtureOnly: boolean): RoutingSimulatorSafety {
  return {
    deterministic: true,
    readOnly: true,
    validatesInputs: true,
    fixtureOnly,
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
}

function fieldContract(
  key: RoutingSimulatorInputField["key"],
  label: string,
  required: boolean,
  valueType: RoutingSimulatorInputField["valueType"],
  maxLength: number | null,
  allowedValues: readonly string[] | null,
  normalizedOutput: string | null
): RoutingSimulatorInputField {
  return {
    key,
    label,
    required,
    valueType,
    maxLength,
    allowedValues: allowedValues ? [...allowedValues] : null,
    normalizedOutput
  };
}

function copyInputField(
  field: RoutingSimulatorInputField
): RoutingSimulatorInputField {
  return {
    ...field,
    allowedValues: field.allowedValues ? [...field.allowedValues] : null
  };
}

function copyFixture(
  fixture: RoutingSimulatorInputFixture
): RoutingSimulatorInputFixture {
  return {
    ...fixture
  };
}
