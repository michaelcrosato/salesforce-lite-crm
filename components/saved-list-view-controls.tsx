import Link from "next/link";
import { Eye, RefreshCw, Save, Trash2, X } from "lucide-react";
import {
  createSavedListViewAction,
  deleteSavedListViewAction,
  updateSavedListViewAction
} from "@/app/saved-list-views/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type {
  SavedListViewEntity,
  SavedListViewSnapshot
} from "@/lib/services/savedListViews";
import type { SortOrder } from "@/lib/services/listQuery";

type SavedListViewStatus = "created" | "updated" | "deleted" | "error";

type SavedListViewControlState = {
  filters: Record<string, string | undefined>;
  pageSize: number;
  sortBy: string;
  sortOrder: SortOrder;
};

const statusMessages: Record<SavedListViewStatus, string> = {
  created: "Saved view created.",
  updated: "Saved view updated.",
  deleted: "Saved view deleted.",
  error: "Saved view changes could not be saved."
};

export function savedListViewStatus(
  value: string | undefined
): SavedListViewStatus | null {
  return value === "created" ||
    value === "updated" ||
    value === "deleted" ||
    value === "error"
    ? value
    : null;
}

export function SavedListViewControls({
  entity,
  route,
  savedViews,
  selectedView,
  status,
  current
}: {
  entity: SavedListViewEntity;
  route: string;
  savedViews: SavedListViewSnapshot[];
  selectedView: SavedListViewSnapshot | null;
  status: SavedListViewStatus | null;
  current: SavedListViewControlState;
}) {
  const selectedViewId = selectedView?.id ?? "";
  const updateViewId = selectedView?.id ?? savedViews[0]?.id ?? "";

  return (
    <div
      className="space-y-4 rounded-md border bg-muted/20 p-4"
      data-testid="saved-view-control-panel"
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold tracking-normal">Saved views</h3>
        </div>
        {selectedView ? (
          <p className="text-xs text-muted-foreground">
            Active: <span className="font-medium">{selectedView.name}</span>
          </p>
        ) : null}
      </div>

      {status ? (
        <div
          className={
            status === "error"
              ? "rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              : "rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
          }
          data-testid="saved-view-notice-status"
          role={status === "error" ? "alert" : "status"}
        >
          {statusMessages[status]}
        </div>
      ) : null}

      <form action={route} className="grid gap-3 lg:grid-cols-[1fr_auto_auto]">
        <div className="space-y-2">
          <Label htmlFor={`${entity}-saved-view-apply`}>Apply view</Label>
          <Select
            id={`${entity}-saved-view-apply`}
            name="view"
            defaultValue={selectedViewId}
            data-testid="saved-view-apply-select"
          >
            <option value="">Current filters</option>
            {savedViews.map((view) => (
              <option key={view.id} value={view.id}>
                {view.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex items-end">
          <Button
            type="submit"
            variant="secondary"
            data-testid="saved-view-apply-submit"
          >
            <Eye className="h-4 w-4" aria-hidden="true" />
            Apply
          </Button>
        </div>
        <div className="flex items-end">
          <Button asChild variant="outline">
            <Link href={route}>
              <X className="h-4 w-4" aria-hidden="true" />
              Reset
            </Link>
          </Button>
        </div>
      </form>

      <form
        action={createSavedListViewAction}
        className="grid gap-3 lg:grid-cols-[minmax(12rem,1fr)_minmax(12rem,1fr)_auto]"
      >
        <SavedListViewHiddenFields
          entity={entity}
          route={route}
          current={current}
        />
        <div className="space-y-2">
          <Label htmlFor={`${entity}-saved-view-name`}>View name</Label>
          <Input
            id={`${entity}-saved-view-name`}
            name="name"
            maxLength={120}
            placeholder="Open work this week"
            required
            data-testid="saved-view-save-name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${entity}-saved-view-description`}>
            Description
          </Label>
          <Input
            id={`${entity}-saved-view-description`}
            name="description"
            placeholder="Optional note"
          />
        </div>
        <div className="flex items-end">
          <Button type="submit" data-testid="saved-view-save-submit">
            <Save className="h-4 w-4" aria-hidden="true" />
            Save
          </Button>
        </div>
      </form>

      <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
        <form
          action={updateSavedListViewAction}
          className="grid gap-3 lg:grid-cols-[1fr_auto]"
        >
          <SavedListViewHiddenFields
            entity={entity}
            route={route}
            current={current}
          />
          <div className="space-y-2">
            <Label htmlFor={`${entity}-saved-view-update`}>
              Update existing view
            </Label>
            <Select
              id={`${entity}-saved-view-update`}
              name="viewId"
              defaultValue={updateViewId}
              disabled={savedViews.length === 0}
              data-testid="saved-view-update-select"
            >
              {savedViews.length === 0 ? (
                <option value="">No saved views</option>
              ) : null}
              {savedViews.map((view) => (
                <option key={view.id} value={view.id}>
                  {view.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex items-end">
            <Button
              type="submit"
              variant="outline"
              disabled={savedViews.length === 0}
              data-testid="saved-view-update-submit"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Update
            </Button>
          </div>
        </form>

        {selectedView ? (
          <form action={deleteSavedListViewAction} className="flex items-end">
            <input type="hidden" name="entity" value={entity} />
            <input type="hidden" name="route" value={route} />
            <input type="hidden" name="viewId" value={selectedView.id} />
            <Button
              type="submit"
              variant="destructive"
              data-testid="saved-view-delete-submit"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Delete
            </Button>
          </form>
        ) : null}
      </div>
    </div>
  );
}

function SavedListViewHiddenFields({
  entity,
  route,
  current
}: {
  entity: SavedListViewEntity;
  route: string;
  current: SavedListViewControlState;
}) {
  return (
    <>
      <input type="hidden" name="entity" value={entity} />
      <input type="hidden" name="route" value={route} />
      <input type="hidden" name="filtersJson" value={filtersJson(current)} />
      <input type="hidden" name="sortBy" value={current.sortBy} />
      <input type="hidden" name="sortOrder" value={current.sortOrder} />
      <input type="hidden" name="pageSize" value={current.pageSize} />
    </>
  );
}

function filtersJson(current: SavedListViewControlState): string {
  const filters: Record<string, string> = {};

  for (const key of Object.keys(current.filters).sort()) {
    const value = current.filters[key]?.trim();

    if (value) {
      filters[key] = value;
    }
  }

  return JSON.stringify(filters);
}
