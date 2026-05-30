import { z } from "zod/v4";
import { isCalendarDate, calendarDateStart } from "@/lib/datetime";

export const PACING_SNAPSHOT_CONTENT_TYPE =
  "application/json; charset=utf-8" as const;
export const PACING_SNAPSHOT_VERSION = "2026-05-28.s56-f1" as const;
export const PACING_SNAPSHOT_MIN_REQUESTS = 1;
export const PACING_SNAPSHOT_DEFAULT_REQUESTS = 2;
export const PACING_SNAPSHOT_MAX_REQUESTS = 10;
export const PACING_SNAPSHOT_MAX_WINDOW_DAYS = 366;
export const PACING_SNAPSHOT_REFERENCE_ID_MAX_LENGTH = 100;
export const PACING_SNAPSHOT_LABEL_MAX_LENGTH = 120;
export const PACING_SNAPSHOT_DEALER_ORDER_ID_MAX_LENGTH = 120;
export const PACING_SNAPSHOT_MAX_DEALER_ORDER_IDS = 50;

export const PACING_SNAPSHOT_GRANULARITIES = ["daily", "monthly"] as const;
export const PACING_SNAPSHOT_METRIC_KEYS = [
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
] as const;

export type PacingSnapshotGranularity =
  (typeof PACING_SNAPSHOT_GRANULARITIES)[number];
export type PacingSnapshotMetricKey =
  (typeof PACING_SNAPSHOT_METRIC_KEYS)[number];

export type PacingSnapshotFieldKey =
  | "referenceId"
  | "label"
  | "granularity"
  | "startsOn"
  | "endsOn"
  | "dealerOrderIds"
  | "metricKeys";

export type PacingSnapshotField = {
  readonly key: PacingSnapshotFieldKey;
  readonly label: string;
  readonly required: boolean;
  readonly valueType:
    | "date"
    | "dealer_order_id_list"
    | "metric_key_list"
    | "snapshot_granularity"
    | "text";
  readonly maxLength: number | null;
  readonly maxItems: number | null;
  readonly allowedValues: readonly string[] | null;
  readonly normalizedOutput: string | null;
};

export type PacingSnapshotMetricDefinition = {
  readonly key: PacingSnapshotMetricKey;
  readonly label: string;
  readonly description: string;
  readonly source:
    | "activity"
    | "dealer_order"
    | "derived_pacing"
    | "lead";
  readonly valueType: "count" | "ratio";
  readonly bucketSupport: readonly PacingSnapshotGranularity[];
};

export type PacingSnapshotFixture = {
  readonly referenceId: string;
  readonly label: string;
  readonly granularity: PacingSnapshotGranularity;
  readonly startsOn: string;
  readonly endsOn: string;
  readonly dealerOrderIds: readonly string[];
  readonly metricKeys: readonly PacingSnapshotMetricKey[];
};

export type PacingSnapshotReadFlags = {
  readonly metadata: true;
  readonly hypotheticalSnapshotInput: boolean;
  readonly metricDefinitions: true;
  readonly fixtures: true;
  readonly database: false;
  readonly crmRecords: false;
  readonly leads: false;
  readonly activities: false;
  readonly routingEvents: false;
  readonly dealerOrders: false;
  readonly pacingEngine: false;
  readonly persistedSnapshots: false;
  readonly routeHandlers: false;
  readonly externalServices: false;
};

export type PacingSnapshotWriteFlags = {
  readonly database: false;
  readonly leads: false;
  readonly activities: false;
  readonly routingEvents: false;
  readonly dealerOrders: false;
  readonly areas: false;
  readonly pacingEngine: false;
  readonly pacingSnapshots: false;
  readonly pacingSnapshotHistory: false;
  readonly forecasts: false;
  readonly scenarioPersistence: false;
  readonly routes: false;
  readonly files: false;
  readonly externalServices: false;
  readonly backgroundJobs: false;
};

export type PacingSnapshotSafety = {
  readonly deterministic: true;
  readonly readOnly: true;
  readonly validatesInputs: true;
  readonly fixtureOnly: boolean;
  readonly snapshotBuilder: false;
  readonly liveRouting: false;
  readonly leadCreation: false;
  readonly leadStatusChanges: false;
  readonly routingEventWrites: false;
  readonly dealerOrderMutation: false;
  readonly areaMutation: false;
  readonly pacingMutation: false;
  readonly snapshotPersistence: false;
  readonly forecastPersistence: false;
  readonly scenarioPersistence: false;
  readonly geocoding: false;
  readonly externalAi: false;
  readonly network: false;
  readonly productUi: false;
  readonly routeHandlers: false;
  readonly backgroundJobs: false;
};

export type PacingSnapshotGuardrails = {
  readonly noLiveRouting: true;
  readonly noLeadCreation: true;
  readonly noLeadStatusChanges: true;
  readonly noRoutingEventWrites: true;
  readonly noDealerOrderQuotaOrDeliveryMutation: true;
  readonly noAreaMutation: true;
  readonly noPacingEngineMutation: true;
  readonly noPacingSnapshotPersistence: true;
  readonly noPacingSnapshotHistory: true;
  readonly noForecastPersistence: true;
  readonly noScenarioPersistence: true;
  readonly noProductRoutesOrUi: true;
  readonly noExternalCalls: true;
  readonly dateValidation: "lib/server/pacingSnapshotContracts.ts#isPacingSnapshotCalendarDate";
  readonly targetReference: "DealerOrder.id";
};

export type PacingSnapshotCatalog = {
  readonly contentType: typeof PACING_SNAPSHOT_CONTENT_TYPE;
  readonly catalogType: "pacing-snapshot-contracts";
  readonly catalogVersion: typeof PACING_SNAPSHOT_VERSION;
  readonly supportedGranularities: readonly PacingSnapshotGranularity[];
  readonly supportedGranularityCount: number;
  readonly fields: readonly PacingSnapshotField[];
  readonly fieldCount: number;
  readonly metricDefinitions: readonly PacingSnapshotMetricDefinition[];
  readonly metricCount: number;
  readonly limits: {
    readonly requests: {
      readonly min: typeof PACING_SNAPSHOT_MIN_REQUESTS;
      readonly default: typeof PACING_SNAPSHOT_DEFAULT_REQUESTS;
      readonly max: typeof PACING_SNAPSHOT_MAX_REQUESTS;
    };
    readonly windowDays: {
      readonly min: 1;
      readonly max: typeof PACING_SNAPSHOT_MAX_WINDOW_DAYS;
    };
    readonly fieldLengths: {
      readonly referenceId: typeof PACING_SNAPSHOT_REFERENCE_ID_MAX_LENGTH;
      readonly label: typeof PACING_SNAPSHOT_LABEL_MAX_LENGTH;
      readonly dealerOrderId: typeof PACING_SNAPSHOT_DEALER_ORDER_ID_MAX_LENGTH;
    };
    readonly dealerOrderIds: {
      readonly maxPerRequest: typeof PACING_SNAPSHOT_MAX_DEALER_ORDER_IDS;
      readonly duplicatesAllowed: false;
      readonly targetReference: "DealerOrder.id";
    };
    readonly metricKeys: {
      readonly minPerRequest: 1;
      readonly maxPerRequest: typeof PACING_SNAPSHOT_METRIC_KEYS.length;
      readonly duplicatesAllowed: false;
    };
  };
  readonly fixtures: readonly PacingSnapshotFixture[];
  readonly guardrails: PacingSnapshotGuardrails;
  readonly source: {
    readonly contractModule: "lib/server/pacingSnapshotContracts.ts";
    readonly catalogScope: "read-only-pacing-snapshot-contracts";
  };
  readonly read: PacingSnapshotReadFlags;
  readonly write: PacingSnapshotWriteFlags;
  readonly safety: PacingSnapshotSafety;
};

export type PacingSnapshotInputRow = {
  readonly rowNumber: number;
  readonly referenceId: string | null;
  readonly label: string | null;
  readonly granularity: PacingSnapshotGranularity;
  readonly startsOn: string;
  readonly endsOn: string;
  readonly calendarDayCount: number;
  readonly monthBucketCount: number;
  readonly bucketCount: number;
  readonly dealerOrderIds: readonly string[];
  readonly dealerOrderFilterCount: number;
  readonly metricKeys: readonly PacingSnapshotMetricKey[];
  readonly metricCount: number;
};

export type PacingSnapshotDraft = {
  readonly batchType: "pacing-snapshot-input";
  readonly contractVersion: typeof PACING_SNAPSHOT_VERSION;
  readonly requestCount: number;
  readonly requests: readonly PacingSnapshotInputRow[];
  readonly limits: PacingSnapshotCatalog["limits"];
  readonly metricDefinitions: readonly PacingSnapshotMetricDefinition[];
  readonly guardrails: PacingSnapshotGuardrails;
  readonly source: {
    readonly contractModule: "lib/server/pacingSnapshotContracts.ts";
    readonly validationScope: "read-only-pacing-snapshot-input";
  };
  readonly read: PacingSnapshotReadFlags;
  readonly write: PacingSnapshotWriteFlags;
  readonly safety: PacingSnapshotSafety;
};

const catalogInputSchema = z.object({}).strict();
const pacingSnapshotGranularitySet: ReadonlySet<string> = new Set(
  PACING_SNAPSHOT_GRANULARITIES
);
const pacingSnapshotMetricKeySet: ReadonlySet<string> = new Set(
  PACING_SNAPSHOT_METRIC_KEYS
);
const calendarDateSchema = z
  .string()
  .trim()
  .refine(
    isPacingSnapshotCalendarDate,
    "Snapshot dates must use YYYY-MM-DD calendar dates."
  );
const metricKeySchema = z.enum(PACING_SNAPSHOT_METRIC_KEYS);
const pacingSnapshotRequestSchema = z
  .object({
    referenceId: optionalTrimmedText(
      PACING_SNAPSHOT_REFERENCE_ID_MAX_LENGTH,
      "Reference ID"
    ),
    label: optionalTrimmedText(PACING_SNAPSHOT_LABEL_MAX_LENGTH, "Label"),
    granularity: z.enum(PACING_SNAPSHOT_GRANULARITIES).default("monthly"),
    startsOn: calendarDateSchema,
    endsOn: calendarDateSchema,
    dealerOrderIds: z
      .array(
        requiredTrimmedText(
          PACING_SNAPSHOT_DEALER_ORDER_ID_MAX_LENGTH,
          "Dealer order ID"
        )
      )
      .max(
        PACING_SNAPSHOT_MAX_DEALER_ORDER_IDS,
        `Pacing snapshot requests cannot include more than ${PACING_SNAPSHOT_MAX_DEALER_ORDER_IDS} dealer order filters.`
      )
      .default([]),
    metricKeys: z
      .array(metricKeySchema)
      .min(1, "At least one pacing snapshot metric key is required.")
      .max(
        PACING_SNAPSHOT_METRIC_KEYS.length,
        `Pacing snapshot requests cannot include more than ${PACING_SNAPSHOT_METRIC_KEYS.length} metric keys.`
      )
      .default([...PACING_SNAPSHOT_METRIC_KEYS])
  })
  .strict()
  .superRefine((request, ctx) => {
    if (
      isPacingSnapshotCalendarDate(request.startsOn) &&
      isPacingSnapshotCalendarDate(request.endsOn)
    ) {
      if (request.endsOn < request.startsOn) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["endsOn"],
          message: "Snapshot end date must be on or after start date."
        });
      }

      const calendarDayCount = countInclusiveCalendarDays(
        request.startsOn,
        request.endsOn
      );

      if (calendarDayCount > PACING_SNAPSHOT_MAX_WINDOW_DAYS) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["endsOn"],
          message: `Pacing snapshot windows cannot exceed ${PACING_SNAPSHOT_MAX_WINDOW_DAYS} days.`
        });
      }
    }

    addDuplicateIssue(
      request.dealerOrderIds,
      "dealerOrderIds",
      "Dealer order filters must be unique within a pacing snapshot request.",
      ctx
    );
    addDuplicateIssue(
      request.metricKeys,
      "metricKeys",
      "Metric keys must be unique within a pacing snapshot request.",
      ctx
    );
  });
const pacingSnapshotInputSchema = z
  .object({
    requests: z
      .array(pacingSnapshotRequestSchema)
      .min(
        PACING_SNAPSHOT_MIN_REQUESTS,
        "At least one pacing snapshot request is required."
      )
      .max(
        PACING_SNAPSHOT_MAX_REQUESTS,
        `Pacing snapshot batches cannot exceed ${PACING_SNAPSHOT_MAX_REQUESTS} requests.`
      )
  })
  .strict();

type ParsedPacingSnapshotRequest = z.infer<
  typeof pacingSnapshotRequestSchema
>;

const pacingSnapshotFields = [
  fieldContract(
    "referenceId",
    "Reference ID",
    false,
    "text",
    PACING_SNAPSHOT_REFERENCE_ID_MAX_LENGTH,
    null,
    null,
    "referenceId"
  ),
  fieldContract(
    "label",
    "Label",
    false,
    "text",
    PACING_SNAPSHOT_LABEL_MAX_LENGTH,
    null,
    null,
    "label"
  ),
  fieldContract(
    "granularity",
    "Granularity",
    false,
    "snapshot_granularity",
    null,
    null,
    PACING_SNAPSHOT_GRANULARITIES,
    "granularity"
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
    "dealerOrderIds",
    "Dealer order filters",
    false,
    "dealer_order_id_list",
    PACING_SNAPSHOT_DEALER_ORDER_ID_MAX_LENGTH,
    PACING_SNAPSHOT_MAX_DEALER_ORDER_IDS,
    null,
    "dealerOrderIds"
  ),
  fieldContract(
    "metricKeys",
    "Metric keys",
    false,
    "metric_key_list",
    null,
    PACING_SNAPSHOT_METRIC_KEYS.length,
    PACING_SNAPSHOT_METRIC_KEYS,
    "metricKeys"
  )
] as const satisfies readonly PacingSnapshotField[];

const pacingSnapshotMetricDefinitions = [
  metricDefinition(
    "leadCreatedCount",
    "Leads created",
    "Consumer leads created inside the snapshot bucket.",
    "lead",
    "count"
  ),
  metricDefinition(
    "routedLeadCount",
    "Routed leads",
    "Consumer leads with dealer-order assignment evidence inside the snapshot bucket.",
    "lead",
    "count"
  ),
  metricDefinition(
    "unroutedLeadCount",
    "Unrouted leads",
    "Consumer leads without dealer-order assignment evidence inside the snapshot bucket.",
    "lead",
    "count"
  ),
  metricDefinition(
    "routingEventCount",
    "Routing events",
    "Routing-event activity rows available for the snapshot bucket.",
    "activity",
    "count"
  ),
  metricDefinition(
    "dealerOrderCount",
    "Dealer orders",
    "Dealer orders eligible to appear in the snapshot scope.",
    "dealer_order",
    "count"
  ),
  metricDefinition(
    "activeDealerOrderCount",
    "Active dealer orders",
    "Active dealer orders eligible to appear in the snapshot scope.",
    "dealer_order",
    "count"
  ),
  metricDefinition(
    "monthlyQuotaTotal",
    "Monthly quota",
    "Total monthly dealer-order quota represented by the snapshot scope.",
    "dealer_order",
    "count"
  ),
  metricDefinition(
    "deliveredLeadCount",
    "Delivered leads",
    "Delivered lead count represented by dealer-order pacing evidence.",
    "lead",
    "count"
  ),
  metricDefinition(
    "expectedDeliveryCount",
    "Expected delivery",
    "Deterministic expected delivery count for the bucket based on calendar pacing.",
    "derived_pacing",
    "count"
  ),
  metricDefinition(
    "paceGapCount",
    "Pace gap",
    "Difference between delivered leads and deterministic expected delivery for the bucket.",
    "derived_pacing",
    "count"
  ),
  metricDefinition(
    "deliveryRate",
    "Delivery rate",
    "Delivered leads divided by monthly quota for the snapshot bucket.",
    "derived_pacing",
    "ratio"
  )
] as const satisfies readonly PacingSnapshotMetricDefinition[];

const fixtureInputs = [
  {
    referenceId: "pace-vancouver-june-month",
    label: "Vancouver June pacing snapshot",
    granularity: "monthly",
    startsOn: "2026-06-01",
    endsOn: "2026-06-30",
    dealerOrderIds: ["dealer-order-vancouver-northstar"],
    metricKeys: [
      "deliveredLeadCount",
      "expectedDeliveryCount",
      "paceGapCount",
      "deliveryRate"
    ]
  },
  {
    referenceId: "pace-all-orders-week",
    label: "All orders weekly daily buckets",
    granularity: "daily",
    startsOn: "2026-06-01",
    endsOn: "2026-06-07",
    dealerOrderIds: [],
    metricKeys: [
      "leadCreatedCount",
      "routedLeadCount",
      "routingEventCount",
      "activeDealerOrderCount"
    ]
  }
] as const satisfies readonly PacingSnapshotFixture[];

export function getPacingSnapshotCatalog(
  input: unknown = {}
): PacingSnapshotCatalog {
  catalogInputSchema.parse(input);

  return {
    contentType: PACING_SNAPSHOT_CONTENT_TYPE,
    catalogType: "pacing-snapshot-contracts",
    catalogVersion: PACING_SNAPSHOT_VERSION,
    supportedGranularities: listPacingSnapshotGranularities(),
    supportedGranularityCount: PACING_SNAPSHOT_GRANULARITIES.length,
    fields: pacingSnapshotFields.map(copyField),
    fieldCount: pacingSnapshotFields.length,
    metricDefinitions: getPacingSnapshotMetricDefinitions(),
    metricCount: pacingSnapshotMetricDefinitions.length,
    limits: pacingSnapshotLimits(),
    fixtures: fixtureInputs.map(copyFixture),
    guardrails: pacingSnapshotGuardrails(),
    source: {
      contractModule: "lib/server/pacingSnapshotContracts.ts",
      catalogScope: "read-only-pacing-snapshot-contracts"
    },
    read: readFlags(false),
    write: noWrites(),
    safety: safetyFlags(false)
  };
}

export function listPacingSnapshotGranularities(): PacingSnapshotGranularity[] {
  return [...PACING_SNAPSHOT_GRANULARITIES];
}

export function isPacingSnapshotGranularity(
  value: string
): value is PacingSnapshotGranularity {
  return pacingSnapshotGranularitySet.has(value);
}

export function listPacingSnapshotMetricKeys(): PacingSnapshotMetricKey[] {
  return [...PACING_SNAPSHOT_METRIC_KEYS];
}

export function isPacingSnapshotMetricKey(
  value: string
): value is PacingSnapshotMetricKey {
  return pacingSnapshotMetricKeySet.has(value);
}

export function getPacingSnapshotMetricDefinitions(): PacingSnapshotMetricDefinition[] {
  return pacingSnapshotMetricDefinitions.map(copyMetricDefinition);
}

export function getPacingSnapshotGuardrails(): PacingSnapshotGuardrails {
  return pacingSnapshotGuardrails();
}

export function getPacingSnapshotFixtureDraft(): PacingSnapshotDraft {
  const draft = validatePacingSnapshotDraft({
    requests: fixtureInputs.map(copyFixture)
  });

  return {
    ...draft,
    safety: safetyFlags(true)
  };
}

export function validatePacingSnapshotDraft(
  input: unknown
): PacingSnapshotDraft {
  const parsed = pacingSnapshotInputSchema.parse(input);
  const requests = parsed.requests.map(normalizeSnapshotRequest);

  return {
    batchType: "pacing-snapshot-input",
    contractVersion: PACING_SNAPSHOT_VERSION,
    requestCount: requests.length,
    requests,
    limits: pacingSnapshotLimits(),
    metricDefinitions: getPacingSnapshotMetricDefinitions(),
    guardrails: pacingSnapshotGuardrails(),
    source: {
      contractModule: "lib/server/pacingSnapshotContracts.ts",
      validationScope: "read-only-pacing-snapshot-input"
    },
    read: readFlags(true),
    write: noWrites(),
    safety: safetyFlags(false)
  };
}

export function isPacingSnapshotCalendarDate(value: string): boolean {
  return isCalendarDate(value);
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

function normalizeSnapshotRequest(
  request: ParsedPacingSnapshotRequest,
  index: number
): PacingSnapshotInputRow {
  const calendarDayCount = countInclusiveCalendarDays(
    request.startsOn,
    request.endsOn
  );
  const monthBucketCount = countMonthBuckets(request.startsOn, request.endsOn);
  const dealerOrderIds = [...request.dealerOrderIds].sort();
  const metricKeys = normalizeMetricKeys(request.metricKeys);

  return {
    rowNumber: index + 1,
    referenceId: request.referenceId ?? null,
    label: request.label ?? null,
    granularity: request.granularity,
    startsOn: request.startsOn,
    endsOn: request.endsOn,
    calendarDayCount,
    monthBucketCount,
    bucketCount:
      request.granularity === "daily" ? calendarDayCount : monthBucketCount,
    dealerOrderIds,
    dealerOrderFilterCount: dealerOrderIds.length,
    metricKeys,
    metricCount: metricKeys.length
  };
}

function pacingSnapshotLimits(): PacingSnapshotCatalog["limits"] {
  return {
    requests: {
      min: PACING_SNAPSHOT_MIN_REQUESTS,
      default: PACING_SNAPSHOT_DEFAULT_REQUESTS,
      max: PACING_SNAPSHOT_MAX_REQUESTS
    },
    windowDays: {
      min: 1,
      max: PACING_SNAPSHOT_MAX_WINDOW_DAYS
    },
    fieldLengths: {
      referenceId: PACING_SNAPSHOT_REFERENCE_ID_MAX_LENGTH,
      label: PACING_SNAPSHOT_LABEL_MAX_LENGTH,
      dealerOrderId: PACING_SNAPSHOT_DEALER_ORDER_ID_MAX_LENGTH
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
  };
}

function pacingSnapshotGuardrails(): PacingSnapshotGuardrails {
  return {
    noLiveRouting: true,
    noLeadCreation: true,
    noLeadStatusChanges: true,
    noRoutingEventWrites: true,
    noDealerOrderQuotaOrDeliveryMutation: true,
    noAreaMutation: true,
    noPacingEngineMutation: true,
    noPacingSnapshotPersistence: true,
    noPacingSnapshotHistory: true,
    noForecastPersistence: true,
    noScenarioPersistence: true,
    noProductRoutesOrUi: true,
    noExternalCalls: true,
    dateValidation:
      "lib/server/pacingSnapshotContracts.ts#isPacingSnapshotCalendarDate",
    targetReference: "DealerOrder.id"
  };
}

function readFlags(
  hypotheticalSnapshotInput: boolean
): PacingSnapshotReadFlags {
  return {
    metadata: true,
    hypotheticalSnapshotInput,
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
}

function noWrites(): PacingSnapshotWriteFlags {
  return {
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
}

function safetyFlags(fixtureOnly: boolean): PacingSnapshotSafety {
  return {
    deterministic: true,
    readOnly: true,
    validatesInputs: true,
    fixtureOnly,
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
}

function fieldContract(
  key: PacingSnapshotFieldKey,
  label: string,
  required: boolean,
  valueType: PacingSnapshotField["valueType"],
  maxLength: number | null,
  maxItems: number | null,
  allowedValues: readonly string[] | null,
  normalizedOutput: string | null
): PacingSnapshotField {
  return {
    key,
    label,
    required,
    valueType,
    maxLength,
    maxItems,
    allowedValues: allowedValues ? [...allowedValues] : null,
    normalizedOutput
  };
}

function metricDefinition(
  key: PacingSnapshotMetricKey,
  label: string,
  description: string,
  source: PacingSnapshotMetricDefinition["source"],
  valueType: PacingSnapshotMetricDefinition["valueType"]
): PacingSnapshotMetricDefinition {
  return {
    key,
    label,
    description,
    source,
    valueType,
    bucketSupport: listPacingSnapshotGranularities()
  };
}

function copyField(field: PacingSnapshotField): PacingSnapshotField {
  return {
    ...field,
    allowedValues: field.allowedValues ? [...field.allowedValues] : null
  };
}

function copyMetricDefinition(
  metric: PacingSnapshotMetricDefinition
): PacingSnapshotMetricDefinition {
  return {
    ...metric,
    bucketSupport: [...metric.bucketSupport]
  };
}

function copyFixture(fixture: PacingSnapshotFixture): PacingSnapshotFixture {
  return {
    ...fixture,
    dealerOrderIds: [...fixture.dealerOrderIds],
    metricKeys: [...fixture.metricKeys]
  };
}

function normalizeMetricKeys(
  metricKeys: readonly PacingSnapshotMetricKey[]
): PacingSnapshotMetricKey[] {
  const requested = new Set(metricKeys);

  return PACING_SNAPSHOT_METRIC_KEYS.filter((key) => requested.has(key));
}

function addDuplicateIssue(
  values: readonly string[],
  path: string,
  message: string,
  ctx: z.RefinementCtx
) {
  const seen = new Set<string>();

  values.forEach((value, index) => {
    if (seen.has(value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [path, index],
        message
      });
    }

    seen.add(value);
  });
}

function countInclusiveCalendarDays(startsOn: string, endsOn: string): number {
  const millisecondsPerDay = 24 * 60 * 60 * 1000;

  return (
    Math.floor(
      (calendarDateUtcMs(endsOn) - calendarDateUtcMs(startsOn)) /
        millisecondsPerDay
    ) + 1
  );
}

function countMonthBuckets(startsOn: string, endsOn: string): number {
  const [startYear, startMonth] = startsOn.split("-").map(Number);
  const [endYear, endMonth] = endsOn.split("-").map(Number);
  if (
    startYear === undefined ||
    startMonth === undefined ||
    endYear === undefined ||
    endMonth === undefined
  ) {
    throw new Error(`Invalid calendar date range: ${startsOn}..${endsOn}`);
  }

  return (endYear - startYear) * 12 + endMonth - startMonth + 1;
}

function calendarDateUtcMs(value: string): number {
  return calendarDateStart(value).getTime();
}
