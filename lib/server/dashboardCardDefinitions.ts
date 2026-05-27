import { z } from "zod";
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
import { idSchema } from "@/lib/validation";

export const DASHBOARD_CARD_DEFINITION_CONTENT_TYPE =
  "application/json; charset=utf-8" as const;
export const DASHBOARD_CARD_PLACEMENTS = ["dashboard", "reports"] as const;
export const DASHBOARD_CARD_SIZES = ["compact", "standard", "wide"] as const;
export const DASHBOARD_CARD_VISUALIZATION_TYPES = SAVED_REPORT_CHART_TYPES;
export const DASHBOARD_CARD_DEFAULT_PREVIEW_LIMIT = 10;
export const DASHBOARD_CARD_MAX_PREVIEW_LIMIT = 25;
export const DASHBOARD_CARD_MAX_POSITION = 24;

export type DashboardCardPlacement = (typeof DASHBOARD_CARD_PLACEMENTS)[number];
export type DashboardCardSize = (typeof DASHBOARD_CARD_SIZES)[number];
export type DashboardCardVisualizationType = SavedReportChartType;

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
  read: DashboardCardReadFlags;
  write: DashboardCardWriteFlags;
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
