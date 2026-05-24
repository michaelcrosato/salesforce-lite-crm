"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  createSavedListView,
  deleteSavedListView,
  updateSavedListView
} from "@/lib/services/savedListViews";
import {
  getListFilterSupportEntityCatalog,
  isListFilterSupportEntity
} from "@/lib/server/listFilterSupportCatalog";

const sortOrderSchema = z.enum(["asc", "desc"]);
const filtersSchema = z.record(z.string());

const savedViewCreateFormSchema = z.object({
  entity: z.string().trim().min(1),
  route: z.string().trim().min(1),
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().optional(),
  filtersJson: z.string().trim().min(1),
  sortBy: z.string().trim().min(1),
  sortOrder: sortOrderSchema,
  pageSize: z.coerce.number().int().min(1).max(100)
});

const savedViewUpdateFormSchema = savedViewCreateFormSchema
  .omit({ name: true, description: true })
  .extend({
    viewId: z.string().trim().min(1)
  });

const savedViewDeleteFormSchema = z.object({
  entity: z.string().trim().min(1),
  route: z.string().trim().min(1),
  viewId: z.string().trim().min(1)
});

type SavedViewStatus = "created" | "updated" | "deleted" | "error";

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function rawSavedViewForm(formData: FormData) {
  return {
    entity: formString(formData, "entity"),
    route: formString(formData, "route"),
    viewId: formString(formData, "viewId"),
    name: formString(formData, "name"),
    description: formString(formData, "description"),
    filtersJson: formString(formData, "filtersJson"),
    sortBy: formString(formData, "sortBy"),
    sortOrder: formString(formData, "sortOrder"),
    pageSize: formString(formData, "pageSize")
  };
}

function safeRouteFromForm(formData: FormData): string {
  const entity = formString(formData, "entity");
  const route = formString(formData, "route");

  if (!isListFilterSupportEntity(entity)) {
    return "/tasks";
  }

  const catalog = getListFilterSupportEntityCatalog(entity);
  return catalog?.route === route ? route : catalog?.route ?? "/tasks";
}

function requireRoute(entity: string, route: string): string {
  if (!isListFilterSupportEntity(entity)) {
    throw new Error(`Unsupported saved list view entity '${entity}'.`);
  }

  const catalog = getListFilterSupportEntityCatalog(entity);

  if (!catalog || catalog.route !== route) {
    throw new Error(`Saved list view route '${route}' is not valid for '${entity}'.`);
  }

  return catalog.route;
}

function parseFilters(filtersJson: string): Record<string, string> {
  const parsed: unknown = JSON.parse(filtersJson);
  return filtersSchema.parse(parsed);
}

function savedViewErrorCode(error: unknown): string {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code === "P2002" ? "duplicate" : "database";
  }

  if (error instanceof z.ZodError || error instanceof SyntaxError) {
    return "invalid";
  }

  return "unknown";
}

function redirectTo(
  route: string,
  status: SavedViewStatus,
  options: { viewId?: string; errorCode?: string } = {}
): never {
  const params = new URLSearchParams({ savedViewStatus: status });

  if (options.viewId) {
    params.set("view", options.viewId);
  }

  if (options.errorCode) {
    params.set("savedViewError", options.errorCode);
  }

  redirect(`${route}?${params.toString()}`);
}

export async function createSavedListViewAction(
  formData: FormData
): Promise<void> {
  const fallbackRoute = safeRouteFromForm(formData);
  let route = fallbackRoute;
  let viewId: string;

  try {
    const parsed = savedViewCreateFormSchema.parse(rawSavedViewForm(formData));
    route = requireRoute(parsed.entity, parsed.route);
    const created = await createSavedListView({
      entity: parsed.entity,
      name: parsed.name,
      description: parsed.description,
      filters: parseFilters(parsed.filtersJson),
      sortBy: parsed.sortBy,
      sortOrder: parsed.sortOrder,
      pageSize: parsed.pageSize
    });

    revalidatePath(route);
    viewId = created.id;
  } catch (error) {
    redirectTo(fallbackRoute, "error", {
      errorCode: savedViewErrorCode(error)
    });
  }

  redirectTo(route, "created", { viewId });
}

export async function updateSavedListViewAction(
  formData: FormData
): Promise<void> {
  const fallbackRoute = safeRouteFromForm(formData);
  let route = fallbackRoute;
  let viewId: string;

  try {
    const parsed = savedViewUpdateFormSchema.parse(rawSavedViewForm(formData));
    route = requireRoute(parsed.entity, parsed.route);
    const updated = await updateSavedListView(parsed.viewId, {
      filters: parseFilters(parsed.filtersJson),
      sortBy: parsed.sortBy,
      sortOrder: parsed.sortOrder,
      pageSize: parsed.pageSize
    });

    revalidatePath(route);
    viewId = updated.id;
  } catch (error) {
    redirectTo(fallbackRoute, "error", {
      errorCode: savedViewErrorCode(error)
    });
  }

  redirectTo(route, "updated", { viewId });
}

export async function deleteSavedListViewAction(
  formData: FormData
): Promise<void> {
  const fallbackRoute = safeRouteFromForm(formData);
  let route = fallbackRoute;

  try {
    const parsed = savedViewDeleteFormSchema.parse(rawSavedViewForm(formData));
    route = requireRoute(parsed.entity, parsed.route);
    await deleteSavedListView(parsed.viewId);

    revalidatePath(route);
  } catch (error) {
    redirectTo(fallbackRoute, "error", {
      errorCode: savedViewErrorCode(error)
    });
  }

  redirectTo(route, "deleted");
}
