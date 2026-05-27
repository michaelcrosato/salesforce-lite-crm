import type { Prisma, SavedReportDefinition } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  buildAuditEventCreateData,
  type AuditMetadataValue
} from "@/lib/services/auditEvents";
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
  auditEvents: true;
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

type SavedReportAuditMutation = "create" | "update" | "archive" | "delete";

const savedReportAuditChangedFields = [
  "name",
  "fields",
  "filters",
  "groupBy",
  "chart",
  "previewLimit",
  "archivedAt"
] as const;

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

  return prisma.$transaction(async (tx) => {
    const definition = toPersistedSavedReportDefinition(
      await tx.savedReportDefinition.create({ data })
    );

    await tx.auditEvent.create({
      data: buildSavedReportAuditEventCreateData({
        action: "created",
        mutation: "create",
        definition,
        changedFields: [
          "entity",
          "name",
          "fields",
          "filters",
          "groupBy",
          "chart",
          "previewLimit"
        ]
      })
    });

    return definition;
  });
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

  return prisma.$transaction(async (tx) => {
    const updated = toPersistedSavedReportDefinition(
      await tx.savedReportDefinition.update({
        where: { id: definitionId },
        data
      })
    );

    await tx.auditEvent.create({
      data: buildSavedReportAuditEventCreateData({
        action: "updated",
        mutation: "update",
        definition: updated,
        changedFields: changedSavedReportFields(existingSnapshot, updated)
      })
    });

    return updated;
  });
}

export async function archiveSavedReportDefinition(
  id: string,
  archivedAt = new Date()
): Promise<PersistedSavedReportDefinition> {
  const definitionId = idSchema.parse(id);

  return prisma.$transaction(async (tx) => {
    const archived = toPersistedSavedReportDefinition(
      await tx.savedReportDefinition.update({
        where: { id: definitionId },
        data: { archivedAt }
      })
    );

    await tx.auditEvent.create({
      data: buildSavedReportAuditEventCreateData({
        action: "updated",
        mutation: "archive",
        definition: archived,
        changedFields: ["archivedAt"]
      })
    });

    return archived;
  });
}

export async function deleteSavedReportDefinition(
  id: string
): Promise<PersistedSavedReportDefinition> {
  const definitionId = idSchema.parse(id);

  return prisma.$transaction(async (tx) => {
    const deleted = toPersistedSavedReportDefinition(
      await tx.savedReportDefinition.delete({
        where: { id: definitionId }
      })
    );

    await tx.auditEvent.create({
      data: buildSavedReportAuditEventCreateData({
        action: "deleted",
        mutation: "delete",
        definition: deleted,
        changedFields: []
      })
    });

    return deleted;
  });
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
    auditEvents: true,
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

function buildSavedReportAuditEventCreateData(input: {
  action: "created" | "updated" | "deleted";
  mutation: SavedReportAuditMutation;
  definition: PersistedSavedReportDefinition;
  changedFields: readonly string[];
}): Prisma.AuditEventUncheckedCreateInput {
  return buildAuditEventCreateData({
    category: "record",
    action: input.action,
    entityType: "report",
    entityId: input.definition.id,
    summary: savedReportAuditSummary(input.mutation, input.definition.name),
    metadata: savedReportAuditMetadata(
      input.mutation,
      input.definition,
      input.changedFields
    )
  });
}

function savedReportAuditSummary(
  mutation: SavedReportAuditMutation,
  name: string
): string {
  const verbs: Record<SavedReportAuditMutation, string> = {
    create: "created",
    update: "updated",
    archive: "archived",
    delete: "deleted"
  };

  return `Saved report ${verbs[mutation]}: ${name}.`;
}

function savedReportAuditMetadata(
  mutation: SavedReportAuditMutation,
  definition: PersistedSavedReportDefinition,
  changedFields: readonly string[]
): { [key: string]: AuditMetadataValue } {
  return {
    source: "saved_report_persistence",
    persistenceModule: "lib/server/savedReportPersistence.ts",
    mutation,
    definitionId: definition.id,
    entity: definition.entity,
    name: definition.name,
    fields: [...definition.fields],
    filters: { ...definition.filters },
    groupBy: [...definition.groupBy],
    chart:
      definition.chart === null
        ? null
        : {
            type: definition.chart.type,
            dimensionKey: definition.chart.dimensionKey,
            metricKey: definition.chart.metricKey
          },
    previewLimit: definition.previewLimit,
    archivedAt: definition.archivedAt?.toISOString() ?? null,
    changedFields: [...changedFields]
  };
}

function changedSavedReportFields(
  before: PersistedSavedReportDefinition,
  after: PersistedSavedReportDefinition
): string[] {
  return savedReportAuditChangedFields.filter(
    (field) =>
      JSON.stringify(savedReportAuditComparableValue(before, field)) !==
      JSON.stringify(savedReportAuditComparableValue(after, field))
  );
}

function savedReportAuditComparableValue(
  definition: PersistedSavedReportDefinition,
  field: (typeof savedReportAuditChangedFields)[number]
): AuditMetadataValue {
  switch (field) {
    case "name":
      return definition.name;
    case "fields":
      return [...definition.fields];
    case "filters":
      return { ...definition.filters };
    case "groupBy":
      return [...definition.groupBy];
    case "chart":
      return definition.chart === null
        ? null
        : {
            type: definition.chart.type,
            dimensionKey: definition.chart.dimensionKey,
            metricKey: definition.chart.metricKey
          };
    case "previewLimit":
      return definition.previewLimit;
    case "archivedAt":
      return definition.archivedAt?.toISOString() ?? null;
    default:
      return assertNever(field);
  }
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

function assertNever(value: never): never {
  throw new Error(`Unexpected saved report audit field: ${String(value)}`);
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
