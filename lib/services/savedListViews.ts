import type { Prisma, SavedListView } from "@prisma/client";
import { z } from "zod";
import {
  getListFilterSupportEntityCatalog,
  isListFilterSupportEntity,
  type ListFilterSupportEntity,
  type ListFilterSupportEntityCatalog,
  type ListFilterSupportFilter
} from "@/lib/server/listFilterSupportCatalog";
import type { SortOrder } from "@/lib/services/listQuery";
import { prisma } from "@/lib/prisma";
import { idSchema } from "@/lib/validation";

export type SavedListViewEntity = ListFilterSupportEntity;
export type SavedListViewFilters = Record<string, string>;

export type SavedListViewListQuery = {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: SortOrder;
  filters?: Record<string, unknown>;
};

export type SavedListViewSnapshot = Pick<
  SavedListView,
  | "id"
  | "name"
  | "description"
  | "sortBy"
  | "createdAt"
  | "updatedAt"
> & {
  entity: SavedListViewEntity;
  filters: SavedListViewFilters;
  sortOrder: SortOrder;
  pageSize: number | null;
};

export type SavedListViewResolvedQuery = {
  entity: SavedListViewEntity;
  selectedView: SavedListViewSnapshot | null;
  source: "current-query" | "saved-view";
  query: SavedListViewListQuery;
};

const sortOrderSchema = z.enum(["asc", "desc"]);
const optionalText = z.preprocess((value) => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}, z.string().optional());

const savedListViewCreateSchema = z
  .object({
    entity: z.string().trim().min(1, "Entity is required."),
    name: z
      .string()
      .trim()
      .min(1, "Saved view name is required.")
      .max(120, "Saved view name cannot exceed 120 characters."),
    description: optionalText,
    filters: z.record(z.unknown()).optional(),
    sortBy: z.string().trim().min(1).optional(),
    sortOrder: sortOrderSchema.optional(),
    pageSize: z.coerce.number().int().min(1).max(100).optional()
  })
  .strict();

const savedListViewUpdateSchema = savedListViewCreateSchema
  .omit({ entity: true })
  .partial()
  .strict();

const savedListViewListSchema = z
  .object({
    entity: z.string().trim().min(1).optional()
  })
  .strict();

const savedListViewQuerySchema = z
  .object({
    entity: z.string().trim().min(1, "Entity is required."),
    savedViewId: optionalText,
    query: z
      .object({
        page: z.coerce.number().int().min(1).optional(),
        pageSize: z.coerce.number().int().min(1).max(100).optional(),
        sortBy: z.string().trim().min(1).optional(),
        sortOrder: sortOrderSchema.optional(),
        filters: z.record(z.unknown()).optional()
      })
      .strict()
      .optional()
  })
  .strict();

export type SavedListViewCreateInput = z.input<
  typeof savedListViewCreateSchema
>;
export type SavedListViewUpdateInput = z.input<
  typeof savedListViewUpdateSchema
>;
export type SavedListViewListInput = z.input<typeof savedListViewListSchema>;
export type SavedListViewQueryInput = z.input<typeof savedListViewQuerySchema>;

export async function createSavedListView(
  input: unknown
): Promise<SavedListViewSnapshot> {
  const parsed = savedListViewCreateSchema.parse(input);
  const catalog = requireEntityCatalog(parsed.entity);
  const filters = normalizeFilters(parsed.filters, catalog);
  const sortBy = normalizeSortBy(parsed.sortBy, catalog);
  const sortOrder = normalizeSortOrder(parsed.sortOrder, catalog);
  const data: Prisma.SavedListViewCreateInput = {
    entity: catalog.entity,
    name: parsed.name,
    description: parsed.description ?? null,
    filters: serializeFilters(filters),
    sortBy,
    sortOrder,
    pageSize: parsed.pageSize ?? null
  };

  return toSavedListViewSnapshot(await prisma.savedListView.create({ data }));
}

export async function listSavedListViews(
  input: unknown = {}
): Promise<SavedListViewSnapshot[]> {
  const parsed = savedListViewListSchema.parse(input);
  const entity = parsed.entity
    ? requireEntityCatalog(parsed.entity).entity
    : undefined;
  const where: Prisma.SavedListViewWhereInput =
    entity === undefined ? {} : { entity };
  const views = await prisma.savedListView.findMany({
    where,
    orderBy: [{ entity: "asc" }, { name: "asc" }]
  });

  return views.map(toSavedListViewSnapshot);
}

export async function getSavedListView(
  id: string
): Promise<SavedListViewSnapshot | null> {
  const view = await prisma.savedListView.findUnique({
    where: { id: idSchema.parse(id) }
  });

  return view ? toSavedListViewSnapshot(view) : null;
}

export async function updateSavedListView(
  id: string,
  input: unknown
): Promise<SavedListViewSnapshot> {
  const savedListViewId = idSchema.parse(id);
  const parsed = savedListViewUpdateSchema.parse(input);
  const existing = await prisma.savedListView.findUniqueOrThrow({
    where: { id: savedListViewId }
  });
  const catalog = requireEntityCatalog(existing.entity);
  const data: Prisma.SavedListViewUpdateInput = {};

  if (parsed.name !== undefined) {
    data.name = parsed.name;
  }

  if (parsed.description !== undefined) {
    data.description = parsed.description ?? null;
  }

  if (parsed.filters !== undefined) {
    data.filters = serializeFilters(normalizeFilters(parsed.filters, catalog));
  }

  if (parsed.sortBy !== undefined) {
    data.sortBy = normalizeSortBy(parsed.sortBy, catalog);
  }

  if (parsed.sortOrder !== undefined) {
    data.sortOrder = normalizeSortOrder(parsed.sortOrder, catalog);
  }

  if (parsed.pageSize !== undefined) {
    data.pageSize = parsed.pageSize;
  }

  return toSavedListViewSnapshot(
    await prisma.savedListView.update({
      where: { id: savedListViewId },
      data
    })
  );
}

export async function deleteSavedListView(
  id: string
): Promise<SavedListViewSnapshot> {
  return toSavedListViewSnapshot(
    await prisma.savedListView.delete({ where: { id: idSchema.parse(id) } })
  );
}

export async function buildSavedListViewQuery(
  input: unknown
): Promise<SavedListViewResolvedQuery> {
  const parsed = savedListViewQuerySchema.parse(input);
  const entity = requireEntityCatalog(parsed.entity).entity;
  const currentQuery = parsed.query ?? {};

  if (!parsed.savedViewId) {
    return {
      entity,
      selectedView: null,
      source: "current-query",
      query: currentQuery
    };
  }

  const selectedView = await getSavedListView(parsed.savedViewId);

  if (!selectedView) {
    throw new Error(`Saved list view '${parsed.savedViewId}' was not found.`);
  }

  if (selectedView.entity !== entity) {
    throw new Error(
      `Saved list view '${selectedView.id}' belongs to '${selectedView.entity}', not '${entity}'.`
    );
  }

  return {
    entity,
    selectedView,
    source: "saved-view",
    query: {
      page: currentQuery.page,
      pageSize: selectedView.pageSize ?? currentQuery.pageSize,
      sortBy: selectedView.sortBy,
      sortOrder: selectedView.sortOrder,
      filters: selectedView.filters
    }
  };
}

function requireEntityCatalog(
  entity: string
): ListFilterSupportEntityCatalog {
  if (!isListFilterSupportEntity(entity)) {
    throw new Error(
      `Saved list views only support current CRM list entities. Unsupported entity: '${entity}'.`
    );
  }

  const catalog = getListFilterSupportEntityCatalog(entity);

  if (!catalog) {
    throw new Error(`Saved list view entity '${entity}' has no catalog.`);
  }

  return catalog;
}

function normalizeFilters(
  filters: Record<string, unknown> | undefined,
  catalog: ListFilterSupportEntityCatalog
): SavedListViewFilters {
  const normalized: SavedListViewFilters = {};

  if (!filters) {
    return normalized;
  }

  const supportedFilters = new Map(
    catalog.filters.map((filter) => [filter.key, filter])
  );

  for (const key of Object.keys(filters).sort()) {
    const rawValue = filters[key];

    if (isEmptyFilterValue(rawValue)) {
      continue;
    }

    const filter = supportedFilters.get(key);

    if (!filter) {
      throw new Error(
        `Filter '${key}' is not supported for saved ${catalog.entity} views.`
      );
    }

    normalized[key] = normalizeFilterValue(filter, rawValue);
  }

  return normalized;
}

function normalizeFilterValue(
  filter: ListFilterSupportFilter,
  value: unknown
): string {
  if (filter.valueType === "date") {
    return normalizeDateFilterValue(filter.key, value);
  }

  if (typeof value !== "string") {
    throw new Error(`Filter '${filter.key}' must be a string value.`);
  }

  const normalized = value.trim();

  if (normalized.length === 0) {
    throw new Error(`Filter '${filter.key}' must not be blank.`);
  }

  if (
    filter.allowedValues !== null &&
    !filter.allowedValues.includes(normalized)
  ) {
    throw new Error(
      `Filter '${filter.key}' value '${normalized}' is not supported.`
    );
  }

  return normalized;
}

function normalizeDateFilterValue(key: string, value: unknown): string {
  const date =
    value instanceof Date
      ? value
      : typeof value === "string" || typeof value === "number"
        ? new Date(value)
        : null;

  if (!date || Number.isNaN(date.getTime())) {
    throw new Error(`Filter '${key}' must be a valid date value.`);
  }

  return date.toISOString();
}

function normalizeSortBy(
  sortBy: string | undefined,
  catalog: ListFilterSupportEntityCatalog
): string {
  const normalized = sortBy ?? catalog.defaultSortBy;

  if (!catalog.sortKeys.some((sortKey) => sortKey.key === normalized)) {
    throw new Error(
      `Sort key '${normalized}' is not supported for saved ${catalog.entity} views.`
    );
  }

  return normalized;
}

function normalizeSortOrder(
  sortOrder: SortOrder | string | undefined,
  catalog: ListFilterSupportEntityCatalog
): SortOrder {
  if (sortOrder === undefined) {
    return catalog.defaultSortOrder;
  }

  if (sortOrder !== "asc" && sortOrder !== "desc") {
    throw new Error(
      `Sort order '${sortOrder}' is not supported for saved ${catalog.entity} views.`
    );
  }

  return sortOrder;
}

function serializeFilters(filters: SavedListViewFilters): string {
  return JSON.stringify(filters);
}

function parseSavedFilters(
  serialized: string,
  catalog: ListFilterSupportEntityCatalog
): SavedListViewFilters {
  const parsed: unknown = JSON.parse(serialized);

  if (!isRecord(parsed)) {
    throw new Error("Saved list view filters must be a JSON object.");
  }

  return normalizeFilters(parsed, catalog);
}

function toSavedListViewSnapshot(view: SavedListView): SavedListViewSnapshot {
  const catalog = requireEntityCatalog(view.entity);

  return {
    id: view.id,
    entity: catalog.entity,
    name: view.name,
    description: view.description,
    filters: parseSavedFilters(view.filters, catalog),
    sortBy: normalizeSortBy(view.sortBy, catalog),
    sortOrder: normalizeSortOrder(view.sortOrder, catalog),
    pageSize: view.pageSize,
    createdAt: view.createdAt,
    updatedAt: view.updatedAt
  };
}

function isEmptyFilterValue(value: unknown): boolean {
  return (
    value === undefined ||
    value === null ||
    (typeof value === "string" && value.trim().length === 0)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
