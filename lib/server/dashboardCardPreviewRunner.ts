import { z } from "zod/v4";
import {
  buildDashboardCardDefinition,
  type DashboardCardDefinition,
  type DashboardCardVisualizationDraft
} from "@/lib/server/dashboardCardDefinitions";
import type { PersistedSavedReportDefinition } from "@/lib/server/savedReportPersistence";
import {
  SAVED_REPORT_PREVIEW_CONTENT_TYPE,
  runSavedReportPreview,
  type SavedReportPreviewAggregate,
  type SavedReportPreviewChart,
  type SavedReportPreviewGroup,
  type SavedReportPreviewResult,
  type SavedReportPreviewRow,
  type SavedReportPreviewValidationError
} from "@/lib/server/savedReportPreviewRunner";

export const DASHBOARD_CARD_PREVIEW_CONTENT_TYPE =
  "application/json; charset=utf-8" as const;

export type DashboardCardPreviewErrorSource =
  | "dashboard-card-definition"
  | "saved-report-preview";

export type DashboardCardPreviewValidationError = {
  code: string;
  path: string | null;
  message: string;
  source: DashboardCardPreviewErrorSource;
};

export type DashboardCardPreviewReadFlags = {
  metadata: boolean;
  persistedSavedReport: boolean;
  database: boolean;
  savedReportPreview: boolean;
  adapterInternals: false;
  reportServices: false;
};

export type DashboardCardPreviewWriteFlags = {
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

export type DashboardCardPreviewResult = {
  contentType: typeof DASHBOARD_CARD_PREVIEW_CONTENT_TYPE;
  previewType: "dashboard-card-preview";
  status: "valid" | "invalid";
  errors: readonly DashboardCardPreviewValidationError[];
  card: DashboardCardDefinition | null;
  savedReportPreview: SavedReportPreviewResult | null;
  visualization: DashboardCardVisualizationDraft | null;
  limit: number | null;
  rowCount: number;
  rows: readonly SavedReportPreviewRow[];
  aggregates: readonly SavedReportPreviewAggregate[];
  groups: readonly SavedReportPreviewGroup[];
  chart: SavedReportPreviewChart | null;
  source: {
    runnerModule: "lib/server/dashboardCardPreviewRunner.ts";
    definitionModule: "lib/server/dashboardCardDefinitions.ts";
    savedReportPreviewRunnerModule: "lib/server/savedReportPreviewRunner.ts";
    savedReportPersistenceModule: "lib/server/savedReportPersistence.ts";
    executionScope: "bounded-read-only-dashboard-card-preview";
  };
  read: DashboardCardPreviewReadFlags;
  write: DashboardCardPreviewWriteFlags;
};

export async function runDashboardCardPreview(
  input: unknown,
  savedReportDefinition: PersistedSavedReportDefinition
): Promise<DashboardCardPreviewResult> {
  let card: DashboardCardDefinition;

  try {
    card = buildDashboardCardDefinition(input, savedReportDefinition);
  } catch (error) {
    return invalidDashboardCardPreview(errorsFromUnknown(error), null, null);
  }

  const savedReportPreview = await runSavedReportPreview({
    entity: savedReportDefinition.entity,
    name: card.title,
    fields: savedReportDefinition.fields,
    filters: savedReportDefinition.filters,
    groupBy: savedReportDefinition.groupBy,
    ...(card.visualization.type === "table"
      ? {}
      : { chart: card.visualization }),
    limit: card.previewLimit
  });

  if (savedReportPreview.status === "invalid") {
    return invalidDashboardCardPreview(
      errorsFromSavedReportPreview(savedReportPreview.errors),
      card,
      savedReportPreview
    );
  }

  return {
    ...baseDashboardCardPreview(),
    status: "valid",
    errors: [],
    card,
    savedReportPreview,
    visualization: card.visualization,
    limit: savedReportPreview.limit,
    rowCount: savedReportPreview.rowCount,
    rows: savedReportPreview.rows,
    aggregates: savedReportPreview.aggregates,
    groups: savedReportPreview.groups,
    chart: savedReportPreview.chart,
    read: {
      metadata: true,
      persistedSavedReport: true,
      database: true,
      savedReportPreview: true,
      adapterInternals: false,
      reportServices: false
    }
  };
}

function baseDashboardCardPreview(): Omit<
  DashboardCardPreviewResult,
  | "status"
  | "errors"
  | "card"
  | "savedReportPreview"
  | "visualization"
  | "limit"
  | "rowCount"
  | "rows"
  | "aggregates"
  | "groups"
  | "chart"
  | "read"
> {
  return {
    contentType: DASHBOARD_CARD_PREVIEW_CONTENT_TYPE,
    previewType: "dashboard-card-preview",
    source: {
      runnerModule: "lib/server/dashboardCardPreviewRunner.ts",
      definitionModule: "lib/server/dashboardCardDefinitions.ts",
      savedReportPreviewRunnerModule: "lib/server/savedReportPreviewRunner.ts",
      savedReportPersistenceModule: "lib/server/savedReportPersistence.ts",
      executionScope: "bounded-read-only-dashboard-card-preview"
    },
    write: noWrites()
  };
}

function invalidDashboardCardPreview(
  errors: readonly DashboardCardPreviewValidationError[],
  card: DashboardCardDefinition | null,
  savedReportPreview: SavedReportPreviewResult | null
): DashboardCardPreviewResult {
  return {
    ...baseDashboardCardPreview(),
    status: "invalid",
    errors,
    card,
    savedReportPreview,
    visualization: card?.visualization ?? null,
    limit: savedReportPreview?.limit ?? null,
    rowCount: 0,
    rows: [],
    aggregates: [],
    groups: [],
    chart: null,
    read: {
      metadata: card !== null,
      persistedSavedReport: true,
      database: false,
      savedReportPreview: savedReportPreview !== null,
      adapterInternals: false,
      reportServices: false
    }
  };
}

function errorsFromUnknown(
  error: unknown
): DashboardCardPreviewValidationError[] {
  if (error instanceof z.ZodError) {
    return error.issues.map((issue) => ({
      code: issue.code,
      path: issue.path.length > 0 ? issue.path.join(".") : null,
      message: issue.message,
      source: "dashboard-card-definition"
    }));
  }

  if (error instanceof Error) {
    return [
      {
        code: "invalid_definition",
        path: null,
        message: error.message,
        source: "dashboard-card-definition"
      }
    ];
  }

  return [
    {
      code: "invalid_definition",
      path: null,
      message: "Dashboard card preview validation failed.",
      source: "dashboard-card-definition"
    }
  ];
}

function errorsFromSavedReportPreview(
  errors: readonly SavedReportPreviewValidationError[]
): DashboardCardPreviewValidationError[] {
  return errors.map((error) => ({
    ...error,
    source: "saved-report-preview"
  }));
}

function noWrites(): DashboardCardPreviewWriteFlags {
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

export { SAVED_REPORT_PREVIEW_CONTENT_TYPE };
