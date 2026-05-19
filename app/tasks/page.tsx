import Link from "next/link";
import { TasksView } from "@/components/tasks/tasks-view";
import { type TaskOptionItem } from "@/components/tasks/task-form";
import { type DrawerTask } from "@/components/tasks/task-detail-drawer";
import {
  type TaskLinkedRecord,
  type TaskRow
} from "@/components/tasks/tasks-table";
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

export const dynamic = "force-dynamic";

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
};

function isTaskStatus(value: string | undefined): value is TaskStatus {
  if (!value) {
    return false;
  }
  return (TASK_STATUSES as readonly string[]).includes(value);
}

function toTaskOption(
  items: Array<{ id: string; label: string }>
): TaskOptionItem[] {
  return items;
}

export default async function TasksPage({
  searchParams
}: {
  searchParams: Promise<TasksSearchParams>;
}) {
  const params = await searchParams;
  const statusFilter = isTaskStatus(params.status) ? params.status : undefined;
  const ownerFilter = params.ownerId?.trim() ? params.ownerId : undefined;
  const dueDateFrom = params.dueFrom?.trim() ? params.dueFrom : undefined;
  const dueDateTo = params.dueTo?.trim() ? params.dueTo : undefined;

  const listOptions: TaskListOptions = {
    pageSize: 100,
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
  const accountById = new Map(
    accountsList.map((account) => [account.id, account])
  );
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
          ? (ownerById.get(found.ownerId)?.name ?? null)
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
          <form action="/tasks" className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                id="status"
                name="status"
                defaultValue={params.status ?? ""}
              >
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
              <Select
                id="ownerId"
                name="ownerId"
                defaultValue={params.ownerId ?? ""}
              >
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
              <Input
                id="dueFrom"
                name="dueFrom"
                type="date"
                defaultValue={params.dueFrom ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueTo">Due to</Label>
              <Input
                id="dueTo"
                name="dueTo"
                type="date"
                defaultValue={params.dueTo ?? ""}
              />
            </div>
            <div className="flex items-end gap-3 md:col-span-4">
              <Button type="submit">Apply filters</Button>
              <Button asChild variant="outline">
                <Link href="/tasks">Reset</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Task list</CardTitle>
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
