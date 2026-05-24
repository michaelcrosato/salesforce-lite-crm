import type { Metadata } from "next";
import Link from "next/link";
import { TasksView } from "@/components/tasks/tasks-view";
import { type TaskOptionItem } from "@/components/tasks/task-form";
import { type DrawerTask } from "@/components/tasks/task-detail-drawer";
import { type TaskLinkedRecord, type TaskRow } from "@/components/tasks/tasks-table";
import {
  SavedListViewControls,
  savedListViewStatus
} from "@/components/saved-list-view-controls";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/page-header";
import { Select } from "@/components/ui/select";
import {
  getTask,
  listAccounts,
  listContacts,
  listLeads,
  listOpportunities,
  listTasks
} from "@/lib/crm/crmClient";
import { prisma } from "@/lib/prisma";
import {
  TASK_STATUSES,
  type TaskPriority,
  type TaskStatus
} from "@/lib/crm/registry";
import type { TaskListOptions } from "@/lib/crm/crmClient";
import { getListFilterSupportEntityCatalog } from "@/lib/server/listFilterSupportCatalog";
import {
  buildSavedListViewQuery,
  listSavedListViews,
  type SavedListViewListQuery,
  type SavedListViewResolvedQuery
} from "@/lib/services/savedListViews";
import type { SortOrder } from "@/lib/services/listQuery";
import {
  boundedNumberQueryParam,
  dateQueryParam,
  nonEmptyQueryParam
} from "@/lib/queryParams";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tasks"
};

const STATUS_LABELS: Record<TaskStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  done: "Done",
  cancelled: "Cancelled"
};

type TasksSearchParams = {
  task?: string;
  status?: string;
  ownerId?: string;
  dueFrom?: string;
  dueTo?: string;
  sortBy?: string;
  sortOrder?: string;
  pageSize?: string;
  view?: string;
  savedViewStatus?: string;
};

const TASK_SORT_KEYS = [
  "dueDate",
  "createdAt",
  "updatedAt",
  "status",
  "priority"
] as const;

type TaskSortBy = (typeof TASK_SORT_KEYS)[number];
const DEFAULT_TASK_SORT_BY: TaskSortBy = "dueDate";

function isTaskStatus(value: string | undefined): value is TaskStatus {
  if (!value) {
    return false;
  }
  return (TASK_STATUSES as readonly string[]).includes(value);
}

function isTaskSortBy(value: string | undefined): value is TaskSortBy {
  if (!value) {
    return false;
  }
  return (TASK_SORT_KEYS as readonly string[]).includes(value);
}

function sortOrderParam(value: string | undefined): SortOrder | undefined {
  return value === "asc" || value === "desc" ? value : undefined;
}

function stringFilter(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function dateFilterValue(value: unknown): string | undefined {
  const text = stringFilter(value);

  if (!text) {
    return undefined;
  }

  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime())
    ? undefined
    : parsed.toISOString().slice(0, 10);
}

async function resolveTaskSavedViewQuery(
  savedViewId: string | undefined,
  query: SavedListViewListQuery
): Promise<{ resolved: SavedListViewResolvedQuery; invalidView: boolean }> {
  if (!savedViewId) {
    return {
      invalidView: false,
      resolved: {
        entity: "tasks",
        selectedView: null,
        source: "current-query",
        query
      }
    };
  }

  try {
    return {
      invalidView: false,
      resolved: await buildSavedListViewQuery({
        entity: "tasks",
        savedViewId,
        query
      })
    };
  } catch {
    return {
      invalidView: true,
      resolved: {
        entity: "tasks",
        selectedView: null,
        source: "current-query",
        query
      }
    };
  }
}

function toTaskOption(items: Array<{ id: string; label: string }>): TaskOptionItem[] {
  return items;
}

export default async function TasksPage({
  searchParams
}: {
  searchParams: Promise<TasksSearchParams>;
}) {
  const params = await searchParams;
  const taskCatalog = getListFilterSupportEntityCatalog("tasks");

  if (!taskCatalog) {
    throw new Error("Task saved view support catalog is missing.");
  }

  const currentQuery: SavedListViewListQuery = {
    pageSize: boundedNumberQueryParam(params.pageSize, { min: 1, max: 100 }) ?? 100,
    sortBy: isTaskSortBy(params.sortBy) ? params.sortBy : DEFAULT_TASK_SORT_BY,
    sortOrder: sortOrderParam(params.sortOrder) ?? taskCatalog.defaultSortOrder,
    filters: {
      status: isTaskStatus(params.status) ? params.status : undefined,
      ownerId: nonEmptyQueryParam(params.ownerId),
      dueDateFrom: dateQueryParam(params.dueFrom),
      dueDateTo: dateQueryParam(params.dueTo)
    }
  };
  const [savedViews, savedViewState] = await Promise.all([
    listSavedListViews({ entity: "tasks" }),
    resolveTaskSavedViewQuery(nonEmptyQueryParam(params.view), currentQuery)
  ]);
  const effectiveFilters = savedViewState.resolved.query.filters ?? {};
  const effectiveStatus = stringFilter(effectiveFilters.status);
  const statusFilter = isTaskStatus(effectiveStatus)
    ? effectiveStatus
    : undefined;
  const ownerFilter = stringFilter(effectiveFilters.ownerId);
  const dueDateFrom = dateFilterValue(effectiveFilters.dueDateFrom);
  const dueDateTo = dateFilterValue(effectiveFilters.dueDateTo);
  const sortBy = isTaskSortBy(savedViewState.resolved.query.sortBy)
    ? savedViewState.resolved.query.sortBy
    : DEFAULT_TASK_SORT_BY;
  const sortOrder =
    savedViewState.resolved.query.sortOrder ?? taskCatalog.defaultSortOrder;
  const pageSize = savedViewState.resolved.query.pageSize ?? 100;

  const listOptions: TaskListOptions = {
    pageSize,
    sortBy,
    sortOrder,
    filters: {
      status: statusFilter,
      ownerId: ownerFilter,
      dueDateFrom,
      dueDateTo
    }
  };

  const [tasks, owners, accountsList, contactsList, dealsList, leadsList] =
    await Promise.all([
      listTasks(listOptions),
      prisma.user.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true }
      }),
      listAccounts({ pageSize: 100 }),
      listContacts({ pageSize: 100 }),
      listOpportunities({ pageSize: 100 }),
      listLeads({ pageSize: 100 })
    ]);

  const ownerById = new Map(owners.map((owner) => [owner.id, owner]));
  const accountById = new Map(accountsList.map((account) => [account.id, account]));
  const contactById = new Map(
    contactsList.map((contact) => [contact.id, contact])
  );
  const dealById = new Map(dealsList.map((deal) => [deal.id, deal]));
  const leadById = new Map(leadsList.map((lead) => [lead.id, lead]));

  const ownerOptions: TaskOptionItem[] = toTaskOption(
    owners.map((owner) => ({ id: owner.id, label: owner.name }))
  );
  const accountOptions: TaskOptionItem[] = toTaskOption(
    accountsList.map((account) => ({ id: account.id, label: account.name }))
  );
  const contactOptions: TaskOptionItem[] = toTaskOption(
    contactsList.map((contact) => ({
      id: contact.id,
      label: `${contact.firstName} ${contact.lastName}`
    }))
  );
  const dealOptions: TaskOptionItem[] = toTaskOption(
    dealsList.map((deal) => ({ id: deal.id, label: deal.name }))
  );
  const leadOptions: TaskOptionItem[] = toTaskOption(
    leadsList.map((lead) => ({
      id: lead.id,
      label: `${lead.firstName} ${lead.lastName}`
    }))
  );

  function linkedRecord(task: (typeof tasks)[number]): TaskLinkedRecord {
    if (task.dealId) {
      const deal = dealById.get(task.dealId);
      if (deal) {
        return { kind: "deal", id: deal.id, label: deal.name };
      }
    }
    if (task.accountId) {
      const account = accountById.get(task.accountId);
      if (account) {
        return { kind: "account", id: account.id, label: account.name };
      }
    }
    if (task.contactId) {
      const contact = contactById.get(task.contactId);
      if (contact) {
        return {
          kind: "contact",
          id: contact.id,
          label: `${contact.firstName} ${contact.lastName}`
        };
      }
    }
    if (task.leadId) {
      const lead = leadById.get(task.leadId);
      if (lead) {
        return {
          kind: "lead",
          id: lead.id,
          label: `${lead.firstName} ${lead.lastName}`
        };
      }
    }
    return null;
  }

  const tableRows: TaskRow[] = tasks.map((task) => ({
    id: task.id,
    title: task.title,
    status: task.status as TaskStatus,
    priority: task.priority as TaskPriority,
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
    owner: task.ownerId
      ? {
          id: task.ownerId,
          name: ownerById.get(task.ownerId)?.name ?? "Unassigned"
        }
      : null,
    linkedRecord: linkedRecord(task)
  }));

  let drawerTask: DrawerTask | null = null;
  if (params.task) {
    const found = await getTask(params.task);
    if (found) {
      drawerTask = {
        id: found.id,
        title: found.title,
        description: found.description,
        dueDate: found.dueDate ? found.dueDate.toISOString() : null,
        status: found.status as TaskStatus,
        priority: found.priority as TaskPriority,
        ownerId: found.ownerId,
        ownerName: found.ownerId
          ? ownerById.get(found.ownerId)?.name ?? null
          : null,
        accountId: found.accountId,
        contactId: found.contactId,
        dealId: found.dealId,
        leadId: found.leadId,
        createdAt: found.createdAt.toISOString(),
        updatedAt: found.updatedAt.toISOString()
      };
    }
  }

  return (
    <div className="crm-page">
      <PageHeader
        title="Tasks"
        description="Plan follow-up work and track progress on outstanding items."
      >
        <Button asChild>
          <Link href="/tasks/new">New task</Link>
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <form action="/tasks" className="grid gap-4 lg:grid-cols-6">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select id="status" name="status" defaultValue={statusFilter ?? ""}>
                <option value="">All</option>
                {TASK_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {STATUS_LABELS[status]}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ownerId">Owner</Label>
              <Select id="ownerId" name="ownerId" defaultValue={ownerFilter ?? ""}>
                <option value="">Any owner</option>
                {owners.map((owner) => (
                  <option key={owner.id} value={owner.id}>
                    {owner.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueFrom">Due from</Label>
              <Input id="dueFrom" name="dueFrom" type="date" defaultValue={dueDateFrom ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueTo">Due to</Label>
              <Input id="dueTo" name="dueTo" type="date" defaultValue={dueDateTo ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sortBy">Sort by</Label>
              <Select id="sortBy" name="sortBy" defaultValue={sortBy}>
                {taskCatalog.sortKeys.map((sortKey) => (
                  <option key={sortKey.key} value={sortKey.key}>
                    {sortKey.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sortOrder">Order</Label>
              <Select id="sortOrder" name="sortOrder" defaultValue={sortOrder}>
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </Select>
            </div>
            <div className="flex items-end gap-3 lg:col-span-6">
              <Button type="submit">Apply filters</Button>
              <Button asChild variant="outline">
                <Link href="/tasks">Reset</Link>
              </Button>
            </div>
          </form>
          <div className="mt-5 border-t pt-5">
            <SavedListViewControls
              entity="tasks"
              route="/tasks"
              savedViews={savedViews}
              selectedView={savedViewState.resolved.selectedView}
              status={
                savedViewState.invalidView
                  ? "error"
                  : savedListViewStatus(params.savedViewStatus)
              }
              current={{
                filters: {
                  status: statusFilter,
                  ownerId: ownerFilter,
                  dueDateFrom,
                  dueDateTo
                },
                pageSize,
                sortBy,
                sortOrder
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Task List</CardTitle>
        </CardHeader>
        <CardContent>
          <TasksView
            tasks={tableRows}
            drawerTask={drawerTask}
            owners={ownerOptions}
            accounts={accountOptions}
            contacts={contactOptions}
            deals={dealOptions}
            leads={leadOptions}
          />
        </CardContent>
      </Card>
    </div>
  );
}
