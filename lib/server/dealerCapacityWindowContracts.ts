import { z } from "zod/v4";
import {
  ROUTING_SIMULATOR_INPUT_CONTENT_TYPE,
  ROUTING_SIMULATOR_INPUT_VERSION,
  type RoutingSimulatorWriteFlags
} from "@/lib/server/routingSimulatorContracts";

export const DEALER_CAPACITY_WINDOW_CONTENT_TYPE =
  ROUTING_SIMULATOR_INPUT_CONTENT_TYPE;
export const DEALER_CAPACITY_WINDOW_VERSION =
  "2026-05-28.s55-f1" as const;
export const DEALER_CAPACITY_WINDOW_MIN_WINDOWS = 1;
export const DEALER_CAPACITY_WINDOW_DEFAULT_WINDOWS = 3;
export const DEALER_CAPACITY_WINDOW_MAX_WINDOWS = 50;
export const DEALER_CAPACITY_WINDOW_ID_MAX_LENGTH = 120;
export const DEALER_CAPACITY_WINDOW_LABEL_MAX_LENGTH = 120;
export const DEALER_CAPACITY_WINDOW_NOTES_MAX_LENGTH = 240;
export const DEALER_CAPACITY_WINDOW_MAX_BLACKOUT_DATES = 366;
export const DEALER_CAPACITY_WINDOW_MAX_DAILY_CAP = 500;

export type DealerCapacityWindowFieldKey =
  | "dealerOrderId"
  | "label"
  | "startsOn"
  | "endsOn"
  | "dailyCap"
  | "blackoutDates"
  | "notes";

export type DealerCapacityWindowField = {
  readonly key: DealerCapacityWindowFieldKey;
  readonly label: string;
  readonly required: boolean;
  readonly valueType: "date" | "date_list" | "integer" | "text";
  readonly maxLength: number | null;
  readonly minValue: number | null;
  readonly maxValue: number | null;
  readonly normalizedOutput: string | null;
};

export type DealerCapacityWindowFixture = {
  readonly dealerOrderId: string;
  readonly label: string;
  readonly startsOn: string;
  readonly endsOn: string;
  readonly dailyCap: number;
  readonly blackoutDates: readonly string[];
  readonly notes: string;
};

export type DealerCapacityWindowReadFlags = {
  readonly metadata: true;
  readonly hypotheticalCapacityWindows: boolean;
  readonly database: false;
  readonly crmRecords: false;
  readonly dealerOrders: false;
  readonly liveRouting: false;
  readonly routingSimulatorEvaluation: false;
  readonly pacingEngine: false;
  readonly routeHandlers: false;
  readonly externalServices: false;
};

export type DealerCapacityWindowWriteFlags = RoutingSimulatorWriteFlags & {
  readonly capacityWindows: false;
  readonly blackoutDates: false;
  readonly capacityHistory: false;
  readonly routingAssignments: false;
  readonly scenarioPersistence: false;
  readonly simulatorRuns: false;
};

export type DealerCapacityWindowSafety = {
  readonly deterministic: true;
  readonly readOnly: true;
  readonly validatesInputs: true;
  readonly fixtureOnly: boolean;
  readonly capacityPlanning: true;
  readonly assignmentEvaluation: false;
  readonly liveRouting: false;
  readonly leadCreation: false;
  readonly routingEventWrites: false;
  readonly leadStatusChanges: false;
  readonly dealerOrderMutation: false;
  readonly areaMutation: false;
  readonly pacingMutation: false;
  readonly capacityPersistence: false;
  readonly forecastPersistence: false;
  readonly scenarioPersistence: false;
  readonly geocoding: false;
  readonly externalAi: false;
  readonly network: false;
  readonly productUi: false;
  readonly routeHandlers: false;
  readonly backgroundJobs: false;
};

export type DealerCapacityWindowGuardrails = {
  readonly noLiveRouting: true;
  readonly noLeadCreation: true;
  readonly noLeadStatusChanges: true;
  readonly noRoutingEventWrites: true;
  readonly noDealerOrderQuotaOrDeliveryMutation: true;
  readonly noDealerCapacityPersistence: true;
  readonly noCapacityHistory: true;
  readonly noAreaMutation: true;
  readonly noPacingEngineMutation: true;
  readonly noForecastPersistence: true;
  readonly noScenarioPersistence: true;
  readonly noProductRoutesOrUi: true;
  readonly noExternalCalls: true;
  readonly dateValidation: "lib/server/dealerCapacityWindowContracts.ts#isCalendarDate";
  readonly targetReference: "DealerOrder.id";
};

export type DealerCapacityWindowCatalog = {
  readonly contentType: typeof DEALER_CAPACITY_WINDOW_CONTENT_TYPE;
  readonly catalogType: "dealer-capacity-window-contracts";
  readonly catalogVersion: typeof DEALER_CAPACITY_WINDOW_VERSION;
  readonly inputCatalogVersion: typeof ROUTING_SIMULATOR_INPUT_VERSION;
  readonly fields: readonly DealerCapacityWindowField[];
  readonly fieldCount: number;
  readonly limits: {
    readonly windows: {
      readonly min: typeof DEALER_CAPACITY_WINDOW_MIN_WINDOWS;
      readonly default: typeof DEALER_CAPACITY_WINDOW_DEFAULT_WINDOWS;
      readonly max: typeof DEALER_CAPACITY_WINDOW_MAX_WINDOWS;
    };
    readonly fieldLengths: {
      readonly dealerOrderId: typeof DEALER_CAPACITY_WINDOW_ID_MAX_LENGTH;
      readonly label: typeof DEALER_CAPACITY_WINDOW_LABEL_MAX_LENGTH;
      readonly notes: typeof DEALER_CAPACITY_WINDOW_NOTES_MAX_LENGTH;
    };
    readonly dailyCap: {
      readonly min: 0;
      readonly max: typeof DEALER_CAPACITY_WINDOW_MAX_DAILY_CAP;
    };
    readonly blackoutDates: {
      readonly maxPerWindow: typeof DEALER_CAPACITY_WINDOW_MAX_BLACKOUT_DATES;
      readonly mustBeWithinWindow: true;
      readonly duplicatesAllowed: false;
    };
  };
  readonly fixtures: readonly DealerCapacityWindowFixture[];
  readonly guardrails: DealerCapacityWindowGuardrails;
  readonly source: {
    readonly contractModule: "lib/server/dealerCapacityWindowContracts.ts";
    readonly routingSimulatorInputModule: "lib/server/routingSimulatorContracts.ts";
    readonly catalogScope: "read-only-dealer-capacity-window-contracts";
  };
  readonly read: DealerCapacityWindowReadFlags;
  readonly write: DealerCapacityWindowWriteFlags;
  readonly safety: DealerCapacityWindowSafety;
};

export type DealerCapacityWindowInputRow = {
  readonly rowNumber: number;
  readonly dealerOrderId: string;
  readonly label: string | null;
  readonly startsOn: string;
  readonly endsOn: string;
  readonly dailyCap: number;
  readonly blackoutDates: readonly string[];
  readonly notes: string | null;
  readonly calendarDayCount: number;
  readonly blackoutDayCount: number;
  readonly availableDayCount: number;
};

export type DealerCapacityWindowDraft = {
  readonly batchType: "dealer-capacity-window-input";
  readonly contractVersion: typeof DEALER_CAPACITY_WINDOW_VERSION;
  readonly inputCatalogVersion: typeof ROUTING_SIMULATOR_INPUT_VERSION;
  readonly windowCount: number;
  readonly windows: readonly DealerCapacityWindowInputRow[];
  readonly limits: DealerCapacityWindowCatalog["limits"];
  readonly guardrails: DealerCapacityWindowGuardrails;
  readonly source: {
    readonly contractModule: "lib/server/dealerCapacityWindowContracts.ts";
    readonly routingSimulatorInputModule: "lib/server/routingSimulatorContracts.ts";
    readonly validationScope: "hypothetical-dealer-capacity-windows";
  };
  readonly read: DealerCapacityWindowReadFlags;
  readonly write: DealerCapacityWindowWriteFlags;
  readonly safety: DealerCapacityWindowSafety;
};

const catalogInputSchema = z.object({}).strict();
const calendarDateSchema = z
  .string()
  .trim()
  .refine(
    isCalendarDate,
    "Capacity dates must use YYYY-MM-DD calendar dates."
  );
const dealerCapacityWindowSchema = z
  .object({
    dealerOrderId: requiredTrimmedText(
      DEALER_CAPACITY_WINDOW_ID_MAX_LENGTH,
      "Dealer order ID"
    ),
    label: optionalTrimmedText(
      DEALER_CAPACITY_WINDOW_LABEL_MAX_LENGTH,
      "Label"
    ),
    startsOn: calendarDateSchema,
    endsOn: calendarDateSchema,
    dailyCap: z
      .number()
      .int("Daily cap must be a whole number.")
      .min(0, "Daily cap cannot be negative.")
      .max(
        DEALER_CAPACITY_WINDOW_MAX_DAILY_CAP,
        `Daily cap cannot exceed ${DEALER_CAPACITY_WINDOW_MAX_DAILY_CAP}.`
      ),
    blackoutDates: z
      .array(calendarDateSchema)
      .max(
        DEALER_CAPACITY_WINDOW_MAX_BLACKOUT_DATES,
        `Capacity windows cannot include more than ${DEALER_CAPACITY_WINDOW_MAX_BLACKOUT_DATES} blackout dates.`
      )
      .default([]),
    notes: optionalTrimmedText(DEALER_CAPACITY_WINDOW_NOTES_MAX_LENGTH, "Notes")
  })
  .strict()
  .superRefine((capacityWindow, ctx) => {
    if (
      isCalendarDate(capacityWindow.startsOn) &&
      isCalendarDate(capacityWindow.endsOn) &&
      capacityWindow.endsOn < capacityWindow.startsOn
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endsOn"],
        message: "Capacity window end date must be on or after start date."
      });
    }

    const seenBlackouts = new Set<string>();

    capacityWindow.blackoutDates.forEach((blackoutDate, index) => {
      if (seenBlackouts.has(blackoutDate)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["blackoutDates", index],
          message:
            "Blackout dates must be unique within a capacity window."
        });
      }

      seenBlackouts.add(blackoutDate);

      if (
        isCalendarDate(blackoutDate) &&
        isCalendarDate(capacityWindow.startsOn) &&
        isCalendarDate(capacityWindow.endsOn) &&
        (blackoutDate < capacityWindow.startsOn ||
          blackoutDate > capacityWindow.endsOn)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["blackoutDates", index],
          message:
            "Blackout dates must fall within the capacity window date range."
        });
      }
    });
  });
const dealerCapacityWindowInputSchema = z
  .object({
    windows: z
      .array(dealerCapacityWindowSchema)
      .min(
        DEALER_CAPACITY_WINDOW_MIN_WINDOWS,
        "At least one dealer capacity window is required."
      )
      .max(
        DEALER_CAPACITY_WINDOW_MAX_WINDOWS,
        `Dealer capacity window batches cannot exceed ${DEALER_CAPACITY_WINDOW_MAX_WINDOWS} windows.`
      )
  })
  .strict()
  .superRefine((input, ctx) => {
    const exactWindowKeys = new Set<string>();

    input.windows.forEach((capacityWindow, index) => {
      if (
        !isCalendarDate(capacityWindow.startsOn) ||
        !isCalendarDate(capacityWindow.endsOn)
      ) {
        return;
      }

      const exactKey = [
        capacityWindow.dealerOrderId,
        capacityWindow.startsOn,
        capacityWindow.endsOn
      ].join("|");

      if (exactWindowKeys.has(exactKey)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["windows", index],
          message:
            "Duplicate capacity window for the same dealer order and date range."
        });

        return;
      }

      exactWindowKeys.add(exactKey);

      const previousWindow = input.windows
        .slice(0, index)
        .find(
          (candidate) =>
            candidate.dealerOrderId === capacityWindow.dealerOrderId &&
            isCalendarDate(candidate.startsOn) &&
            isCalendarDate(candidate.endsOn) &&
            rangesOverlap(candidate, capacityWindow)
        );

      if (previousWindow) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["windows", index],
          message:
            "Capacity windows for the same dealer order cannot overlap."
        });
      }
    });
  });

type ParsedDealerCapacityWindow = z.infer<
  typeof dealerCapacityWindowSchema
>;

const capacityWindowFields = [
  fieldContract(
    "dealerOrderId",
    "Dealer order ID",
    true,
    "text",
    DEALER_CAPACITY_WINDOW_ID_MAX_LENGTH,
    null,
    null,
    "dealerOrderId"
  ),
  fieldContract(
    "label",
    "Label",
    false,
    "text",
    DEALER_CAPACITY_WINDOW_LABEL_MAX_LENGTH,
    null,
    null,
    "label"
  ),
  fieldContract(
    "startsOn",
    "Start date",
    true,
    "date",
    null,
    null,
    null,
    "startsOn"
  ),
  fieldContract(
    "endsOn",
    "End date",
    true,
    "date",
    null,
    null,
    null,
    "endsOn"
  ),
  fieldContract(
    "dailyCap",
    "Daily cap",
    true,
    "integer",
    null,
    0,
    DEALER_CAPACITY_WINDOW_MAX_DAILY_CAP,
    "dailyCap"
  ),
  fieldContract(
    "blackoutDates",
    "Blackout dates",
    false,
    "date_list",
    null,
    null,
    null,
    "blackoutDates"
  ),
  fieldContract(
    "notes",
    "Notes",
    false,
    "text",
    DEALER_CAPACITY_WINDOW_NOTES_MAX_LENGTH,
    null,
    null,
    "notes"
  )
] as const satisfies readonly DealerCapacityWindowField[];

const fixtureInputs = [
  {
    dealerOrderId: "sim-order-vancouver",
    label: "Vancouver weekday cap",
    startsOn: "2026-06-01",
    endsOn: "2026-06-07",
    dailyCap: 3,
    blackoutDates: ["2026-06-05"],
    notes: "Read-only fixture for capacity-aware routing simulation."
  },
  {
    dealerOrderId: "sim-order-seattle",
    label: "Seattle blackout check",
    startsOn: "2026-06-01",
    endsOn: "2026-06-03",
    dailyCap: 0,
    blackoutDates: ["2026-06-02"],
    notes: "Read-only fixture for blackout handling."
  }
] as const satisfies readonly DealerCapacityWindowFixture[];

export function getDealerCapacityWindowCatalog(
  input: unknown = {}
): DealerCapacityWindowCatalog {
  catalogInputSchema.parse(input);

  return {
    contentType: DEALER_CAPACITY_WINDOW_CONTENT_TYPE,
    catalogType: "dealer-capacity-window-contracts",
    catalogVersion: DEALER_CAPACITY_WINDOW_VERSION,
    inputCatalogVersion: ROUTING_SIMULATOR_INPUT_VERSION,
    fields: capacityWindowFields.map(copyField),
    fieldCount: capacityWindowFields.length,
    limits: capacityWindowLimits(),
    fixtures: fixtureInputs.map(copyFixture),
    guardrails: dealerCapacityWindowGuardrails(),
    source: {
      contractModule: "lib/server/dealerCapacityWindowContracts.ts",
      routingSimulatorInputModule: "lib/server/routingSimulatorContracts.ts",
      catalogScope: "read-only-dealer-capacity-window-contracts"
    },
    read: readFlags(false),
    write: noWrites(),
    safety: safetyFlags(false)
  };
}

export function getDealerCapacityWindowGuardrails(): DealerCapacityWindowGuardrails {
  return dealerCapacityWindowGuardrails();
}

export function getDealerCapacityWindowFixtureDraft(): DealerCapacityWindowDraft {
  const draft = validateDealerCapacityWindowDraft({
    windows: fixtureInputs.map(copyFixture)
  });

  return {
    ...draft,
    safety: safetyFlags(true)
  };
}

export function validateDealerCapacityWindowDraft(
  input: unknown
): DealerCapacityWindowDraft {
  const parsed = dealerCapacityWindowInputSchema.parse(input);
  const windows = parsed.windows.map(normalizeCapacityWindow);

  return {
    batchType: "dealer-capacity-window-input",
    contractVersion: DEALER_CAPACITY_WINDOW_VERSION,
    inputCatalogVersion: ROUTING_SIMULATOR_INPUT_VERSION,
    windowCount: windows.length,
    windows,
    limits: capacityWindowLimits(),
    guardrails: dealerCapacityWindowGuardrails(),
    source: {
      contractModule: "lib/server/dealerCapacityWindowContracts.ts",
      routingSimulatorInputModule: "lib/server/routingSimulatorContracts.ts",
      validationScope: "hypothetical-dealer-capacity-windows"
    },
    read: readFlags(true),
    write: noWrites(),
    safety: safetyFlags(false)
  };
}

export function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  if (year === undefined || month === undefined || day === undefined) {
    return false;
  }
  const utc = new Date(Date.UTC(year, month - 1, day));

  return (
    utc.getUTCFullYear() === year &&
    utc.getUTCMonth() === month - 1 &&
    utc.getUTCDate() === day
  );
}

function requiredTrimmedText(maxLength: number, label: string) {
  return z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .max(maxLength, `${label} cannot exceed ${maxLength} characters.`);
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

function normalizeCapacityWindow(
  capacityWindow: ParsedDealerCapacityWindow,
  index: number
): DealerCapacityWindowInputRow {
  const blackoutDates = [...capacityWindow.blackoutDates].sort();
  const calendarDayCount = countInclusiveCalendarDays(
    capacityWindow.startsOn,
    capacityWindow.endsOn
  );

  return {
    rowNumber: index + 1,
    dealerOrderId: capacityWindow.dealerOrderId,
    label: capacityWindow.label ?? null,
    startsOn: capacityWindow.startsOn,
    endsOn: capacityWindow.endsOn,
    dailyCap: capacityWindow.dailyCap,
    blackoutDates,
    notes: capacityWindow.notes ?? null,
    calendarDayCount,
    blackoutDayCount: blackoutDates.length,
    availableDayCount: calendarDayCount - blackoutDates.length
  };
}

function capacityWindowLimits(): DealerCapacityWindowCatalog["limits"] {
  return {
    windows: {
      min: DEALER_CAPACITY_WINDOW_MIN_WINDOWS,
      default: DEALER_CAPACITY_WINDOW_DEFAULT_WINDOWS,
      max: DEALER_CAPACITY_WINDOW_MAX_WINDOWS
    },
    fieldLengths: {
      dealerOrderId: DEALER_CAPACITY_WINDOW_ID_MAX_LENGTH,
      label: DEALER_CAPACITY_WINDOW_LABEL_MAX_LENGTH,
      notes: DEALER_CAPACITY_WINDOW_NOTES_MAX_LENGTH
    },
    dailyCap: {
      min: 0,
      max: DEALER_CAPACITY_WINDOW_MAX_DAILY_CAP
    },
    blackoutDates: {
      maxPerWindow: DEALER_CAPACITY_WINDOW_MAX_BLACKOUT_DATES,
      mustBeWithinWindow: true,
      duplicatesAllowed: false
    }
  };
}

function dealerCapacityWindowGuardrails(): DealerCapacityWindowGuardrails {
  return {
    noLiveRouting: true,
    noLeadCreation: true,
    noLeadStatusChanges: true,
    noRoutingEventWrites: true,
    noDealerOrderQuotaOrDeliveryMutation: true,
    noDealerCapacityPersistence: true,
    noCapacityHistory: true,
    noAreaMutation: true,
    noPacingEngineMutation: true,
    noForecastPersistence: true,
    noScenarioPersistence: true,
    noProductRoutesOrUi: true,
    noExternalCalls: true,
    dateValidation: "lib/server/dealerCapacityWindowContracts.ts#isCalendarDate",
    targetReference: "DealerOrder.id"
  };
}

function readFlags(
  hypotheticalCapacityWindows: boolean
): DealerCapacityWindowReadFlags {
  return {
    metadata: true,
    hypotheticalCapacityWindows,
    database: false,
    crmRecords: false,
    dealerOrders: false,
    liveRouting: false,
    routingSimulatorEvaluation: false,
    pacingEngine: false,
    routeHandlers: false,
    externalServices: false
  };
}

function noWrites(): DealerCapacityWindowWriteFlags {
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
    backgroundJobs: false,
    capacityWindows: false,
    blackoutDates: false,
    capacityHistory: false,
    routingAssignments: false,
    scenarioPersistence: false,
    simulatorRuns: false
  };
}

function safetyFlags(fixtureOnly: boolean): DealerCapacityWindowSafety {
  return {
    deterministic: true,
    readOnly: true,
    validatesInputs: true,
    fixtureOnly,
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
}

function fieldContract(
  key: DealerCapacityWindowFieldKey,
  label: string,
  required: boolean,
  valueType: DealerCapacityWindowField["valueType"],
  maxLength: number | null,
  minValue: number | null,
  maxValue: number | null,
  normalizedOutput: string | null
): DealerCapacityWindowField {
  return {
    key,
    label,
    required,
    valueType,
    maxLength,
    minValue,
    maxValue,
    normalizedOutput
  };
}

function copyField(
  field: DealerCapacityWindowField
): DealerCapacityWindowField {
  return {
    ...field
  };
}

function copyFixture(
  fixture: DealerCapacityWindowFixture
): DealerCapacityWindowFixture {
  return {
    ...fixture,
    blackoutDates: [...fixture.blackoutDates]
  };
}

function rangesOverlap(
  first: Pick<ParsedDealerCapacityWindow, "startsOn" | "endsOn">,
  second: Pick<ParsedDealerCapacityWindow, "startsOn" | "endsOn">
) {
  return first.startsOn <= second.endsOn && second.startsOn <= first.endsOn;
}

function countInclusiveCalendarDays(startsOn: string, endsOn: string): number {
  const millisecondsPerDay = 24 * 60 * 60 * 1000;

  return (
    Math.floor((calendarDateUtcMs(endsOn) - calendarDateUtcMs(startsOn)) / millisecondsPerDay) +
    1
  );
}

function calendarDateUtcMs(value: string): number {
  const [year, month, day] = value.split("-").map(Number);
  if (year === undefined || month === undefined || day === undefined) {
    throw new Error(`Invalid calendar date: ${value}`);
  }

  return Date.UTC(year, month - 1, day);
}
