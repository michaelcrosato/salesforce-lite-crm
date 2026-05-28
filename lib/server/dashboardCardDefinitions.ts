import { z } from "zod";
import { EXCLUDED_ROUTES, FEATURE_FLAGS } from "@/lib/featureFlags";
import {
  SAVED_REPORT_CHART_TYPES,
  SAVED_REPORT_MAX_PREVIEW_LIMIT,
  getSavedReportEntityDefinition,
  validateSavedReportDefinitionDraft,
  type SavedReportChartType,
  type SavedReportDefinitionChartDraft,
  type SavedReportDefinitionEntity,
  type SavedReportEntityDefinition
} from "@/lib/server/savedReportDefinitions";
import type { PersistedSavedReportDefinition } from "@/lib/server/savedReportPersistence";
import {
  serializeAuditMetadata,
  type AuditMetadataValue
} from "@/lib/services/auditEvents";
import { idSchema } from "@/lib/validation";

export const DASHBOARD_CARD_DEFINITION_CONTENT_TYPE =
  "application/json; charset=utf-8" as const;
export const DASHBOARD_CARD_PLACEMENTS = ["dashboard", "reports"] as const;
export const DASHBOARD_CARD_SIZES = ["compact", "standard", "wide"] as const;
export const DASHBOARD_CARD_VISUALIZATION_TYPES = SAVED_REPORT_CHART_TYPES;
export const DASHBOARD_CARD_MUTATIONS = [
  "pin",
  "reorder",
  "archive",
  "delete"
] as const;
export const DASHBOARD_CARD_DEFAULT_PREVIEW_LIMIT = 10;
export const DASHBOARD_CARD_MAX_PREVIEW_LIMIT = 25;
export const DASHBOARD_CARD_MAX_POSITION = 24;

export type DashboardCardPlacement = (typeof DASHBOARD_CARD_PLACEMENTS)[number];
export type DashboardCardSize = (typeof DASHBOARD_CARD_SIZES)[number];
export type DashboardCardVisualizationType = SavedReportChartType;
export type DashboardCardMutation = (typeof DASHBOARD_CARD_MUTATIONS)[number];

export type DashboardCardReadFlags = {
  metadata: boolean;
  persistedSavedReport: boolean;
  database: false;
  previewExecution: false;
  adapterInternals: false;
};

export type DashboardCardWriteFlags = {
  database: false;
  mutations: false;
  crmRecords: false;
  savedReportDefinitions: false;
  schemas: false;
  routes: false;
  files: false;
  externalServices: false;
  backgroundJobs: false;
  rawSql: false;
  dashboardLayouts: false;
};

export type DashboardCardPlacementContract = {
  key: DashboardCardPlacement;
  label: string;
  route: "/dashboard" | "/reports";
  defaultSize: DashboardCardSize;
  allowedSizes: readonly DashboardCardSize[];
  maxCards: number;
};

export type DashboardCardVisualizationContract = {
  type: DashboardCardVisualizationType;
  label: string;
  surface: "table" | "chart";
};

export type DashboardCardAuditReadFlags = {
  metadata: true;
  database: false;
  auditEvents: false;
  externalTelemetry: false;
};

export type DashboardCardAuditWriteFlags = {
  database: false;
  mutations: false;
  auditEvents: false;
  requestLogs: false;
  externalTelemetry: false;
  externalServices: false;
  backgroundJobs: false;
};

export type DashboardCardMutationAuditContract = {
  mutation: DashboardCardMutation;
  action: "created" | "updated" | "deleted";
  label: string;
  summaryTemplate: string;
  sourceSurface: "components/reports/dashboard-card-operator.tsx";
  evidenceScope: "dashboard-card-client-session";
  metadataFields: readonly string[];
  changedFields: readonly string[];
  persistedAuditEvent: false;
  externalTelemetry: false;
  read: DashboardCardAuditReadFlags;
  write: DashboardCardAuditWriteFlags;
};

export type DashboardCardAuditContract = {
  evidenceScope: "dashboard-card-client-session";
  mutationCount: number;
  mutations: readonly DashboardCardMutationAuditContract[];
  persistedAuditEvents: false;
  externalTelemetry: false;
  source: {
    definitionModule: "lib/server/dashboardCardDefinitions.ts";
    operatorSurface: "components/reports/dashboard-card-operator.tsx";
    auditTaxonomyModule: "lib/services/auditEvents.ts";
  };
  read: DashboardCardAuditReadFlags;
  write: DashboardCardAuditWriteFlags;
};

export type DashboardCardGuardrailSnapshot = {
  allowedPlacementRoutes: ReadonlyArray<"/dashboard" | "/reports">;
  excludedRoutes: readonly string[];
  featureFlags: {
    dealDetailRoute: false;
    globalSearchUi: false;
    commandPalette: false;
  };
  providerIntegrations: {
    externalAi: false;
    externalBi: false;
    salesforce: false;
    webhooks: false;
  };
  dashboardRouteChanges: false;
  dashboardBuilderRoute: false;
  dashboardCardPersistence: false;
  searchExpansion: false;
  routeWrites: false;
  read: DashboardCardAuditReadFlags;
  write: DashboardCardAuditWriteFlags;
};

export type DashboardCardDefinitionCatalog = {
  contentType: typeof DASHBOARD_CARD_DEFINITION_CONTENT_TYPE;
  catalogType: "dashboard-card-definition-catalog";
  placementCount: number;
  visualizationCount: number;
  placements: readonly DashboardCardPlacementContract[];
  visualizations: readonly DashboardCardVisualizationContract[];
  limits: {
    previewRows: {
      defaultLimit: typeof DASHBOARD_CARD_DEFAULT_PREVIEW_LIMIT;
      maxLimit: typeof DASHBOARD_CARD_MAX_PREVIEW_LIMIT;
      savedReportMaxLimit: typeof SAVED_REPORT_MAX_PREVIEW_LIMIT;
    };
    title: {
      min: 1;
      max: 80;
    };
    description: {
      max: 160;
    };
    position: {
      min: 1;
      max: typeof DASHBOARD_CARD_MAX_POSITION;
    };
  };
  source: {
    definitionModule: "lib/server/dashboardCardDefinitions.ts";
    savedReportPersistenceModule: "lib/server/savedReportPersistence.ts";
    savedReportDefinitionModule: "lib/server/savedReportDefinitions.ts";
    catalogScope: "dashboard-card-definition-contracts";
  };
  audit: DashboardCardAuditContract;
  guardrails: DashboardCardGuardrailSnapshot;
  read: DashboardCardReadFlags;
  write: DashboardCardWriteFlags;
};

export type DashboardCardVisualizationDraft = {
  type: DashboardCardVisualizationType;
  dimensionKey: string | null;
  metricKey: string;
};

export type DashboardCardDefinitionDraft = {
  savedReportDefinitionId: string;
  title: string;
  description: string | null;
  placement: DashboardCardPlacement;
  position: number;
  size: DashboardCardSize;
  visualization: DashboardCardVisualizationDraft;
  previewLimit: number;
};

export type DashboardCardDefinition = DashboardCardDefinitionDraft & {
  cardType: "saved-report-dashboard-card";
  savedReport: {
    id: string;
    entity: SavedReportDefinitionEntity;
    name: string;
    route: string;
    previewLimit: number;
    archivedAt: Date | null;
  };
  source: {
    definitionModule: "lib/server/dashboardCardDefinitions.ts";
    savedReportPersistenceModule: "lib/server/savedReportPersistence.ts";
    savedReportDefinitionModule: "lib/server/savedReportDefinitions.ts";
    executionScope: "saved-report-dashboard-card-contract";
  };
  audit: DashboardCardAuditContract;
  guardrails: DashboardCardGuardrailSnapshot;
  read: DashboardCardReadFlags;
  write: DashboardCardWriteFlags;
};

export type DashboardCardMutationAuditEvidence = {
  category: "record";
  action: "created" | "updated" | "deleted";
  entityType: "report";
  entityId: string;
  summary: string;
  metadata: string | null;
  persistedAuditEvent: false;
  externalTelemetry: false;
  source: {
    definitionModule: "lib/server/dashboardCardDefinitions.ts";
    operatorSurface: "components/reports/dashboard-card-operator.tsx";
    evidenceScope: "dashboard-card-client-session";
  };
  read: DashboardCardAuditReadFlags;
  write: DashboardCardAuditWriteFlags;
};

type ParsedDashboardCardVisualizationInput = z.infer<
  typeof dashboardCardVisualizationSchema
>;

type NormalizedSavedReportDefinition = {
  id: string;
  entity: SavedReportDefinitionEntity;
  name: string;
  fields: readonly string[];
  filters: Record<string, string>;
  groupBy: readonly string[];
  chart: SavedReportDefinitionChartDraft | null;
  previewLimit: number;
  archivedAt: Date | null;
  entityDefinition: SavedReportEntityDefinition;
};

const catalogInputSchema = z.object({}).strict();
const previewLimitSchema = z
  .number()
  .int("Preview limit must be a whole number.")
  .min(1, "Preview limit must be at least 1.")
  .max(
    SAVED_REPORT_MAX_PREVIEW_LIMIT,
    `Preview limit cannot exceed ${SAVED_REPORT_MAX_PREVIEW_LIMIT}.`
  );
const dashboardCardVisualizationSchema = z
  .object({
    type: z.enum(DASHBOARD_CARD_VISUALIZATION_TYPES),
    dimensionKey: z
      .union([z.string().trim().min(1), z.null()])
      .optional(),
    metricKey: z.string().trim().min(1).optional()
  })
  .strict();
const dashboardCardDraftSchema = z
  .object({
    savedReportDefinitionId: idSchema,
    title: z
      .string()
      .trim()
      .min(1, "Dashboard card title cannot be blank.")
      .max(80, "Dashboard card title cannot exceed 80 characters.")
      .optional(),
    description: z
      .union([
        z
          .string()
          .trim()
          .max(160, "Dashboard card description cannot exceed 160 characters."),
        z.null()
      ])
      .optional(),
    placement: z.enum(DASHBOARD_CARD_PLACEMENTS),
    position: z.coerce
      .number()
      .int("Dashboard card position must be a whole number.")
      .min(1, "Dashboard card position must be at least 1.")
      .max(
        DASHBOARD_CARD_MAX_POSITION,
        `Dashboard card position cannot exceed ${DASHBOARD_CARD_MAX_POSITION}.`
      )
      .optional(),
    size: z.enum(DASHBOARD_CARD_SIZES).optional(),
    visualization: dashboardCardVisualizationSchema.optional(),
    previewLimit: z.coerce
      .number()
      .int("Dashboard card preview limit must be a whole number.")
      .min(1, "Dashboard card preview limit must be at least 1.")
      .optional()
  })
  .strict();
const dashboardCardMutationAuditInputSchema = z
  .object({
    mutation: z.enum(DASHBOARD_CARD_MUTATIONS),
    previousPosition: z.number().int().min(1).nullable().optional(),
    nextPosition: z.number().int().min(1).nullable().optional()
  })
  .strict();

const placementContracts = [
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
] as const satisfies readonly DashboardCardPlacementContract[];

const mutationMetadataFields = [
  "source",
  "mutation",
  "savedReportDefinitionId",
  "title",
  "placement",
  "entity",
  "route",
  "position",
  "size",
  "visualization",
  "previewLimit",
  "previousPosition",
  "nextPosition",
  "changedFields"
] as const;

const mutationAuditContracts = [
  {
    mutation: "pin",
    action: "created",
    label: "Pin card",
    summaryTemplate: "Dashboard card pinned: {title}.",
    sourceSurface: "components/reports/dashboard-card-operator.tsx",
    evidenceScope: "dashboard-card-client-session",
    metadataFields: mutationMetadataFields,
    changedFields: [
      "placement",
      "position",
      "size",
      "visualization",
      "previewLimit"
    ],
    persistedAuditEvent: false,
    externalTelemetry: false,
    read: auditReads(),
    write: auditNoWrites()
  },
  {
    mutation: "reorder",
    action: "updated",
    label: "Reorder card",
    summaryTemplate: "Dashboard card reordered: {title}.",
    sourceSurface: "components/reports/dashboard-card-operator.tsx",
    evidenceScope: "dashboard-card-client-session",
    metadataFields: mutationMetadataFields,
    changedFields: ["position"],
    persistedAuditEvent: false,
    externalTelemetry: false,
    read: auditReads(),
    write: auditNoWrites()
  },
  {
    mutation: "archive",
    action: "updated",
    label: "Archive card",
    summaryTemplate: "Dashboard card archived: {title}.",
    sourceSurface: "components/reports/dashboard-card-operator.tsx",
    evidenceScope: "dashboard-card-client-session",
    metadataFields: mutationMetadataFields,
    changedFields: ["archived"],
    persistedAuditEvent: false,
    externalTelemetry: false,
    read: auditReads(),
    write: auditNoWrites()
  },
  {
    mutation: "delete",
    action: "deleted",
    label: "Delete card",
    summaryTemplate: "Dashboard card deleted: {title}.",
    sourceSurface: "components/reports/dashboard-card-operator.tsx",
    evidenceScope: "dashboard-card-client-session",
    metadataFields: mutationMetadataFields,
    changedFields: [],
    persistedAuditEvent: false,
    externalTelemetry: false,
    read: auditReads(),
    write: auditNoWrites()
  }
] as const satisfies readonly DashboardCardMutationAuditContract[];

export function getDashboardCardDefinitionCatalog(
  input: unknown = {}
): DashboardCardDefinitionCatalog {
  catalogInputSchema.parse(input);

  const placements = placementContracts.map(copyPlacementContract);
  const visualizations = DASHBOARD_CARD_VISUALIZATION_TYPES.map(
    visualizationContract
  );

  return {
    contentType: DASHBOARD_CARD_DEFINITION_CONTENT_TYPE,
    catalogType: "dashboard-card-definition-catalog",
    placementCount: placements.length,
    visualizationCount: visualizations.length,
    placements,
    visualizations,
    limits: dashboardCardLimits(),
    source: {
      definitionModule: "lib/server/dashboardCardDefinitions.ts",
      savedReportPersistenceModule: "lib/server/savedReportPersistence.ts",
      savedReportDefinitionModule: "lib/server/savedReportDefinitions.ts",
      catalogScope: "dashboard-card-definition-contracts"
    },
    audit: dashboardCardAuditContract(),
    guardrails: dashboardCardGuardrails(),
    read: catalogReads(),
    write: noWrites()
  };
}

export function listDashboardCardPlacements(): DashboardCardPlacement[] {
  return [...DASHBOARD_CARD_PLACEMENTS];
}

export function isDashboardCardPlacement(
  value: string
): value is DashboardCardPlacement {
  return DASHBOARD_CARD_PLACEMENTS.includes(value as DashboardCardPlacement);
}

export function getDashboardCardPlacement(
  placement: string
): DashboardCardPlacementContract | null {
  if (!isDashboardCardPlacement(placement)) {
    return null;
  }

  return copyPlacementContract(requirePlacementContract(placement));
}

export function listDashboardCardMutations(): DashboardCardMutation[] {
  return [...DASHBOARD_CARD_MUTATIONS];
}

export function isDashboardCardMutation(
  value: string
): value is DashboardCardMutation {
  return DASHBOARD_CARD_MUTATIONS.includes(value as DashboardCardMutation);
}

export function getDashboardCardMutationAuditContract(
  mutation: string
): DashboardCardMutationAuditContract | null {
  if (!isDashboardCardMutation(mutation)) {
    return null;
  }

  return copyMutationAuditContract(requireMutationAuditContract(mutation));
}

export function getDashboardCardGuardrails(): DashboardCardGuardrailSnapshot {
  return dashboardCardGuardrails();
}

export function buildDashboardCardMutationAuditEvidence(
  input: unknown,
  card: DashboardCardDefinition
): DashboardCardMutationAuditEvidence {
  const parsed = dashboardCardMutationAuditInputSchema.parse(input);
  const contract = requireMutationAuditContract(parsed.mutation);
  const previousPosition = parsed.previousPosition ?? null;
  const nextPosition = parsed.nextPosition ?? card.position;

  return {
    category: "record",
    action: contract.action,
    entityType: "report",
    entityId: card.savedReportDefinitionId,
    summary: contract.summaryTemplate.replace("{title}", card.title),
    metadata: serializeAuditMetadata(
      dashboardCardMutationAuditMetadata(
        parsed.mutation,
        card,
        previousPosition,
        nextPosition
      )
    ),
    persistedAuditEvent: false,
    externalTelemetry: false,
    source: {
      definitionModule: "lib/server/dashboardCardDefinitions.ts",
      operatorSurface: "components/reports/dashboard-card-operator.tsx",
      evidenceScope: "dashboard-card-client-session"
    },
    read: auditReads(),
    write: auditNoWrites()
  };
}

export function validateDashboardCardDefinitionDraft(
  input: unknown,
  savedReportDefinition: PersistedSavedReportDefinition
): DashboardCardDefinitionDraft {
  const parsed = dashboardCardDraftSchema.parse(input);
  const savedReport = normalizeSavedReportDefinition(savedReportDefinition);

  if (parsed.savedReportDefinitionId !== savedReport.id) {
    throw new Error(
      "Dashboard card must reference the provided saved report definition."
    );
  }

  if (savedReport.archivedAt !== null) {
    throw new Error("Archived saved reports cannot back dashboard cards.");
  }

  const placement = requirePlacementContract(parsed.placement);
  const size = parsed.size ?? placement.defaultSize;

  if (!placement.allowedSizes.includes(size)) {
    throw new Error(
      `Dashboard card size '${size}' is not supported for ${placement.label}.`
    );
  }

  const previewLimit =
    parsed.previewLimit ?? defaultDashboardCardPreviewLimit(savedReport);
  const maxPreviewLimit = maxDashboardCardPreviewLimit(savedReport);

  if (previewLimit > maxPreviewLimit) {
    throw new Error(
      `Dashboard card preview limit cannot exceed ${maxPreviewLimit}.`
    );
  }

  return {
    savedReportDefinitionId: savedReport.id,
    title: parsed.title ?? savedReport.name,
    description: normalizeDescription(parsed.description),
    placement: placement.key,
    position: parsed.position ?? 1,
    size,
    visualization: normalizeVisualization(parsed.visualization, savedReport),
    previewLimit
  };
}

export function buildDashboardCardDefinition(
  input: unknown,
  savedReportDefinition: PersistedSavedReportDefinition
): DashboardCardDefinition {
  const savedReport = normalizeSavedReportDefinition(savedReportDefinition);
  const draft = validateDashboardCardDefinitionDraft(input, savedReportDefinition);

  return {
    ...draft,
    cardType: "saved-report-dashboard-card",
    savedReport: {
      id: savedReport.id,
      entity: savedReport.entity,
      name: savedReport.name,
      route: savedReport.entityDefinition.route,
      previewLimit: savedReport.previewLimit,
      archivedAt: savedReport.archivedAt
    },
    source: {
      definitionModule: "lib/server/dashboardCardDefinitions.ts",
      savedReportPersistenceModule: "lib/server/savedReportPersistence.ts",
      savedReportDefinitionModule: "lib/server/savedReportDefinitions.ts",
      executionScope: "saved-report-dashboard-card-contract"
    },
    audit: dashboardCardAuditContract(),
    guardrails: dashboardCardGuardrails(),
    read: cardReads(),
    write: noWrites()
  };
}

function normalizeSavedReportDefinition(
  savedReportDefinition: PersistedSavedReportDefinition
): NormalizedSavedReportDefinition {
  const draft = validateSavedReportDefinitionDraft({
    entity: savedReportDefinition.entity,
    name: savedReportDefinition.name,
    fields: savedReportDefinition.fields,
    filters: savedReportDefinition.filters,
    groupBy: savedReportDefinition.groupBy,
    ...(savedReportDefinition.chart === null
      ? {}
      : { chart: savedReportDefinition.chart })
  });
  const entityDefinition = getSavedReportEntityDefinition(draft.entity);

  if (draft.name === null) {
    throw new Error("Dashboard cards require a named saved report definition.");
  }

  if (entityDefinition === null) {
    throw new Error(
      `Saved report entity '${draft.entity}' has no dashboard card definition.`
    );
  }

  return {
    id: idSchema.parse(savedReportDefinition.id),
    entity: draft.entity,
    name: draft.name,
    fields: draft.fields,
    filters: draft.filters,
    groupBy: draft.groupBy,
    chart: draft.chart,
    previewLimit: previewLimitSchema.parse(savedReportDefinition.previewLimit),
    archivedAt: savedReportDefinition.archivedAt,
    entityDefinition
  };
}

function normalizeVisualization(
  visualization: ParsedDashboardCardVisualizationInput | undefined,
  savedReport: NormalizedSavedReportDefinition
): DashboardCardVisualizationDraft {
  const fallback = savedReport.chart ?? defaultTableVisualization();
  const type = visualization?.type ?? fallback.type;
  const chartContract = savedReport.entityDefinition.charts.find(
    (candidate) => candidate.type === type
  );

  if (!chartContract) {
    throw new Error(
      `Dashboard card visualization '${type}' is not supported for saved ${savedReport.entity} reports.`
    );
  }

  const dimensionKey =
    visualization === undefined
      ? fallback.dimensionKey
      : "dimensionKey" in visualization
        ? visualization.dimensionKey ?? null
        : matchingSavedReportChart(savedReport, type)?.dimensionKey ??
          chartContract.defaultDimensionKey;
  const metricKey =
    visualization?.metricKey ??
    matchingSavedReportChart(savedReport, type)?.metricKey ??
    chartContract.defaultMetricKey;

  if (
    dimensionKey !== null &&
    !chartContract.supportedDimensionKeys.includes(dimensionKey)
  ) {
    throw new Error(
      `Dashboard card dimension '${dimensionKey}' is not supported for ${type} saved ${savedReport.entity} reports.`
    );
  }

  if (type !== "table" && dimensionKey === null) {
    throw new Error(
      `Dashboard card visualization '${type}' requires a supported dimension for saved ${savedReport.entity} reports.`
    );
  }

  if (!chartContract.supportedMetricKeys.includes(metricKey)) {
    throw new Error(
      `Dashboard card metric '${metricKey}' is not supported for ${type} saved ${savedReport.entity} reports.`
    );
  }

  return {
    type,
    dimensionKey,
    metricKey
  };
}

function matchingSavedReportChart(
  savedReport: NormalizedSavedReportDefinition,
  type: DashboardCardVisualizationType
): SavedReportDefinitionChartDraft | null {
  return savedReport.chart?.type === type ? savedReport.chart : null;
}

function defaultTableVisualization(): DashboardCardVisualizationDraft {
  return {
    type: "table",
    dimensionKey: null,
    metricKey: "recordCount"
  };
}

function defaultDashboardCardPreviewLimit(
  savedReport: NormalizedSavedReportDefinition
): number {
  return Math.min(DASHBOARD_CARD_DEFAULT_PREVIEW_LIMIT, savedReport.previewLimit);
}

function maxDashboardCardPreviewLimit(
  savedReport: NormalizedSavedReportDefinition
): number {
  return Math.min(DASHBOARD_CARD_MAX_PREVIEW_LIMIT, savedReport.previewLimit);
}

function normalizeDescription(description: string | null | undefined): string | null {
  if (description === undefined || description === null) {
    return null;
  }

  return description.length === 0 ? null : description;
}

function copyPlacementContract(
  contract: DashboardCardPlacementContract
): DashboardCardPlacementContract {
  return {
    ...contract,
    allowedSizes: [...contract.allowedSizes]
  };
}

function copyMutationAuditContract(
  contract: DashboardCardMutationAuditContract
): DashboardCardMutationAuditContract {
  return {
    ...contract,
    metadataFields: [...contract.metadataFields],
    changedFields: [...contract.changedFields],
    read: auditReads(),
    write: auditNoWrites()
  };
}

function requirePlacementContract(
  placement: DashboardCardPlacement
): DashboardCardPlacementContract {
  const contract = placementContracts.find(
    (candidate) => candidate.key === placement
  );

  if (!contract) {
    throw new Error(`Unsupported dashboard card placement: ${placement}`);
  }

  return contract;
}

function requireMutationAuditContract(
  mutation: DashboardCardMutation
): DashboardCardMutationAuditContract {
  const contract = mutationAuditContracts.find(
    (candidate) => candidate.mutation === mutation
  );

  if (!contract) {
    throw new Error(`Unsupported dashboard card mutation: ${mutation}`);
  }

  return contract;
}

function visualizationContract(
  type: DashboardCardVisualizationType
): DashboardCardVisualizationContract {
  const labels: Record<DashboardCardVisualizationType, string> = {
    table: "Table",
    bar: "Bar chart",
    line: "Line chart",
    pie: "Pie chart"
  };

  return {
    type,
    label: labels[type],
    surface: type === "table" ? "table" : "chart"
  };
}

function dashboardCardLimits(): DashboardCardDefinitionCatalog["limits"] {
  return {
    previewRows: {
      defaultLimit: DASHBOARD_CARD_DEFAULT_PREVIEW_LIMIT,
      maxLimit: DASHBOARD_CARD_MAX_PREVIEW_LIMIT,
      savedReportMaxLimit: SAVED_REPORT_MAX_PREVIEW_LIMIT
    },
    title: {
      min: 1,
      max: 80
    },
    description: {
      max: 160
    },
    position: {
      min: 1,
      max: DASHBOARD_CARD_MAX_POSITION
    }
  };
}

function dashboardCardAuditContract(): DashboardCardAuditContract {
  return {
    evidenceScope: "dashboard-card-client-session",
    mutationCount: mutationAuditContracts.length,
    mutations: mutationAuditContracts.map(copyMutationAuditContract),
    persistedAuditEvents: false,
    externalTelemetry: false,
    source: {
      definitionModule: "lib/server/dashboardCardDefinitions.ts",
      operatorSurface: "components/reports/dashboard-card-operator.tsx",
      auditTaxonomyModule: "lib/services/auditEvents.ts"
    },
    read: auditReads(),
    write: auditNoWrites()
  };
}

function dashboardCardGuardrails(): DashboardCardGuardrailSnapshot {
  return {
    allowedPlacementRoutes: placementContracts.map((placement) => placement.route),
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
    routeWrites: false,
    read: auditReads(),
    write: auditNoWrites()
  };
}

function dashboardCardMutationAuditMetadata(
  mutation: DashboardCardMutation,
  card: DashboardCardDefinition,
  previousPosition: number | null,
  nextPosition: number | null
): { [key: string]: AuditMetadataValue } {
  const contract = requireMutationAuditContract(mutation);

  return {
    source: "dashboard_card_operator",
    mutation,
    savedReportDefinitionId: card.savedReportDefinitionId,
    title: card.title,
    placement: card.placement,
    entity: card.savedReport.entity,
    route: card.savedReport.route,
    position: card.position,
    size: card.size,
    visualization: {
      type: card.visualization.type,
      dimensionKey: card.visualization.dimensionKey,
      metricKey: card.visualization.metricKey
    },
    previewLimit: card.previewLimit,
    previousPosition,
    nextPosition,
    changedFields: [...contract.changedFields]
  };
}

function catalogReads(): DashboardCardReadFlags {
  return {
    metadata: true,
    persistedSavedReport: false,
    database: false,
    previewExecution: false,
    adapterInternals: false
  };
}

function cardReads(): DashboardCardReadFlags {
  return {
    metadata: true,
    persistedSavedReport: true,
    database: false,
    previewExecution: false,
    adapterInternals: false
  };
}

function noWrites(): DashboardCardWriteFlags {
  return {
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
}

function auditReads(): DashboardCardAuditReadFlags {
  return {
    metadata: true,
    database: false,
    auditEvents: false,
    externalTelemetry: false
  };
}

function auditNoWrites(): DashboardCardAuditWriteFlags {
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
