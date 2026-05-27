import type { Prisma, SavedReportDefinition } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  SAVED_REPORT_DEFAULT_PREVIEW_LIMIT,
  SAVED_REPORT_MAX_PREVIEW_LIMIT,
  validateSavedReportDefinitionDraft,
  type SavedReportDefinitionChartDraft,
  type SavedReportDefinitionDraft
} from "@/lib/server/savedReportDefinitions";
import { idSchema } from "@/lib/validation";

export type PersistedSavedReportDefinition = {
  id: string;
  entity: SavedReportDefinitionDraft["entity"];
  name: string;
  fields: readonly string[];
  filters: Record<string, string>;
  groupBy: readonly string[];
  chart: SavedReportDefinitionChartDraft | null;
  previewLimit: number;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  source: {
    persistenceModule: "lib/server/savedReportPersistence.ts";
    definitionModule: "lib/server/savedReportDefinitions.ts";
    executionScope: "persisted-definition-contracts";
  };
  read: SavedReportPersistenceReadFlags;
  write: SavedReportPersistenceWriteFlags;
};

export type SavedReportDefinitionSnapshot = Omit<
  PersistedSavedReportDefinition,
  "archivedAt" | "createdAt" | "updatedAt"
> & {
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SavedReportPersistenceReadFlags = {
  metadata: true;
  database: true;
  previewExecution: false;
  adapterInternals: false;
};

export type SavedReportPersistenceWriteFlags = {
  database: true;
  mutations: true;
  schemas: false;
  routes: false;
  files: false;
  externalServices: false;
  backgroundJobs: false;
  rawSql: false;
  previewExecution: false;
};

const previewLimitSchema = z.coerce
  .number()
  .int("Preview limit must be a whole number.")
  .min(1, "Preview limit must be at least 1.")
  .max(
    SAVED_REPORT_MAX_PREVIEW_LIMIT,
    `Preview limit cannot exceed ${SAVED_REPORT_MAX_PREVIEW_LIMIT}.`
  );

const savedReportDefinitionCreateSchema = z
  .object({
    entity: z.unknown(),
    name: z.unknown(),
    fields: z.unknown(),
    filters: z.unknown().optional(),
    groupBy: z.unknown().optional(),
    chart: z.unknown().optional(),
    previewLimit: previewLimitSchema.optional()
  })
  .strict();

const savedReportDefinitionUpdateSchema = z
  .object({
    name: z.unknown().optional(),
    fields: z.unknown().optional(),
    filters: z.unknown().optional(),
    groupBy: z.unknown().optional(),
    chart: z.unknown().optional(),
    previewLimit: previewLimitSchema.optional()
  })
  .strict();

const savedReportDefinitionListSchema = z
  .object({
    entity: z.string().trim().min(1).optional(),
    includeArchived: optionalBooleanSchema()
  })
  .strict();

export type SavedReportDefinitionCreateInput = z.input<
  typeof savedReportDefinitionCreateSchema
>;
export type SavedReportDefinitionUpdateInput = z.input<
  typeof savedReportDefinitionUpdateSchema
>;
export type SavedReportDefinitionListInput = z.input<
  typeof savedReportDefinitionListSchema
>;

export async function createSavedReportDefinition(
  input: unknown
): Promise<PersistedSavedReportDefinition> {
  const parsed = savedReportDefinitionCreateSchema.parse(input);
  const draft = requireNamedDraft({
    entity: parsed.entity,
    name: parsed.name,
    fields: parsed.fields,
    filters: parsed.filters,
    groupBy: parsed.groupBy,
    chart: parsed.chart
  });
  const data: Prisma.SavedReportDefinitionCreateInput = {
    entity: draft.entity,
    name: draft.name,
    fields: serializeJson(draft.fields),
    filters: serializeJson(draft.filters),
    groupBy: serializeJson(draft.groupBy),
    chart: draft.chart === null ? null : serializeJson(draft.chart),
    previewLimit: parsed.previewLimit ?? SAVED_REPORT_DEFAULT_PREVIEW_LIMIT
  };

  return toPersistedSavedReportDefinition(
    await prisma.savedReportDefinition.create({ data })
  );
}

export async function listSavedReportDefinitions(
  input: unknown = {}
): Promise<PersistedSavedReportDefinition[]> {
  const parsed = savedReportDefinitionListSchema.parse(input);
  const where: Prisma.SavedReportDefinitionWhereInput = {
    ...(parsed.entity === undefined ? {} : { entity: parsed.entity }),
    ...(parsed.includeArchived === true ? {} : { archivedAt: null })
  };
  const definitions = await prisma.savedReportDefinition.findMany({
    where,
    orderBy: [{ entity: "asc" }, { name: "asc" }]
  });

  return definitions.map(toPersistedSavedReportDefinition);
}

export async function getSavedReportDefinition(
  id: string
): Promise<PersistedSavedReportDefinition | null> {
  const definition = await prisma.savedReportDefinition.findUnique({
    where: { id: idSchema.parse(id) }
  });

  return definition ? toPersistedSavedReportDefinition(definition) : null;
}

export async function updateSavedReportDefinition(
  id: string,
  input: unknown
): Promise<PersistedSavedReportDefinition> {
  const definitionId = idSchema.parse(id);
  const parsed = savedReportDefinitionUpdateSchema.parse(input);
  const existing = await prisma.savedReportDefinition.findUniqueOrThrow({
    where: { id: definitionId }
  });
  const existingSnapshot = toPersistedSavedReportDefinition(existing);
  const draft = requireNamedDraft({
    entity: existingSnapshot.entity,
    name: parsed.name ?? existingSnapshot.name,
    fields: parsed.fields ?? existingSnapshot.fields,
    filters: parsed.filters ?? existingSnapshot.filters,
    groupBy: parsed.groupBy ?? existingSnapshot.groupBy,
    chart:
      parsed.chart === undefined
        ? existingSnapshot.chart ?? undefined
        : parsed.chart
  });
  const data: Prisma.SavedReportDefinitionUpdateInput = {
    name: draft.name,
    fields: serializeJson(draft.fields),
    filters: serializeJson(draft.filters),
    groupBy: serializeJson(draft.groupBy),
    chart: draft.chart === null ? null : serializeJson(draft.chart)
  };

  if (parsed.previewLimit !== undefined) {
    data.previewLimit = parsed.previewLimit;
  }

  return toPersistedSavedReportDefinition(
    await prisma.savedReportDefinition.update({
      where: { id: definitionId },
      data
    })
  );
}

export async function archiveSavedReportDefinition(
  id: string,
  archivedAt = new Date()
): Promise<PersistedSavedReportDefinition> {
  return toPersistedSavedReportDefinition(
    await prisma.savedReportDefinition.update({
      where: { id: idSchema.parse(id) },
      data: { archivedAt }
    })
  );
}

export async function deleteSavedReportDefinition(
  id: string
): Promise<PersistedSavedReportDefinition> {
  return toPersistedSavedReportDefinition(
    await prisma.savedReportDefinition.delete({
      where: { id: idSchema.parse(id) }
    })
  );
}

export function toSavedReportDefinitionSnapshot(
  definition: PersistedSavedReportDefinition
): SavedReportDefinitionSnapshot {
  return {
    ...definition,
    archivedAt: definition.archivedAt?.toISOString() ?? null,
    createdAt: definition.createdAt.toISOString(),
    updatedAt: definition.updatedAt.toISOString()
  };
}

function requireNamedDraft(input: {
  entity: unknown;
  name: unknown;
  fields: unknown;
  filters?: unknown;
  groupBy?: unknown;
  chart?: unknown;
}): SavedReportDefinitionDraft & { name: string } {
  const draftInput: Record<string, unknown> = {
    entity: input.entity,
    name: input.name,
    fields: input.fields
  };

  if (input.filters !== undefined) {
    draftInput.filters = input.filters;
  }

  if (input.groupBy !== undefined) {
    draftInput.groupBy = input.groupBy;
  }

  if (input.chart !== undefined && input.chart !== null) {
    draftInput.chart = input.chart;
  }

  const draft = validateSavedReportDefinitionDraft(draftInput);

  if (draft.name === null) {
    throw new Error("Saved report name is required.");
  }

  return {
    ...draft,
    name: draft.name
  };
}

function toPersistedSavedReportDefinition(
  definition: SavedReportDefinition
): PersistedSavedReportDefinition {
  const draft = requireNamedDraft({
    entity: definition.entity,
    name: definition.name,
    fields: parseStringArray(definition.fields, "fields"),
    filters: parseStringRecord(definition.filters, "filters"),
    groupBy: parseStringArray(definition.groupBy, "groupBy"),
    chart:
      definition.chart === null
        ? undefined
        : parseJsonObject(definition.chart, "chart")
  });

  return {
    id: definition.id,
    entity: draft.entity,
    name: draft.name,
    fields: draft.fields,
    filters: draft.filters,
    groupBy: draft.groupBy,
    chart: draft.chart,
    previewLimit: normalizePersistedPreviewLimit(definition.previewLimit),
    archivedAt: definition.archivedAt,
    createdAt: definition.createdAt,
    updatedAt: definition.updatedAt,
    source: {
      persistenceModule: "lib/server/savedReportPersistence.ts",
      definitionModule: "lib/server/savedReportDefinitions.ts",
      executionScope: "persisted-definition-contracts"
    },
    read: persistenceReads(),
    write: persistenceWrites()
  };
}

function persistenceReads(): SavedReportPersistenceReadFlags {
  return {
    metadata: true,
    database: true,
    previewExecution: false,
    adapterInternals: false
  };
}

function persistenceWrites(): SavedReportPersistenceWriteFlags {
  return {
    database: true,
    mutations: true,
    schemas: false,
    routes: false,
    files: false,
    externalServices: false,
    backgroundJobs: false,
    rawSql: false,
    previewExecution: false
  };
}

function serializeJson(value: unknown): string {
  return JSON.stringify(value);
}

function parseJson(serialized: string, label: string): unknown {
  try {
    return JSON.parse(serialized);
  } catch {
    throw new Error(`Saved report definition ${label} must be valid JSON.`);
  }
}

function parseStringArray(serialized: string, label: string): string[] {
  const parsed = parseJson(serialized, label);

  if (!Array.isArray(parsed) || !parsed.every((value) => typeof value === "string")) {
    throw new Error(`Saved report definition ${label} must be a string array.`);
  }

  return [...parsed];
}

function parseStringRecord(
  serialized: string,
  label: string
): Record<string, string> {
  const parsed = parseJson(serialized, label);

  if (!isStringRecord(parsed)) {
    throw new Error(`Saved report definition ${label} must be a string record.`);
  }

  return { ...parsed };
}

function parseJsonObject(serialized: string, label: string): Record<string, unknown> {
  const parsed = parseJson(serialized, label);

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error(`Saved report definition ${label} must be a JSON object.`);
  }

  return { ...parsed };
}

function normalizePersistedPreviewLimit(limit: number): number {
  return previewLimitSchema.parse(limit);
}

function isStringRecord(value: unknown): value is Record<string, string> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.values(value).every((entry) => typeof entry === "string")
  );
}

function optionalBooleanSchema() {
  return z.preprocess((value) => {
    if (value === undefined) {
      return undefined;
    }

    if (typeof value !== "string") {
      return value;
    }

    const normalized = value.trim().toLowerCase();

    if (normalized === "true") {
      return true;
    }

    if (normalized === "false") {
      return false;
    }

    return value;
  }, z.boolean().optional());
}
