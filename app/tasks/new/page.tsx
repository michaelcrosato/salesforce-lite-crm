import { PageHeader } from "@/components/page-header";
import { TaskForm, type TaskOptionItem } from "@/components/tasks/task-form";
import {
  listAccounts,
  listContacts,
  listLeads,
  listOpportunities
} from "@/lib/crm/crmClient";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function NewTaskPage() {
  const [owners, accounts, contacts, deals, leads] = await Promise.all([
    prisma.user.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true }
    }),
    listAccounts({ pageSize: 100 }),
    listContacts({ pageSize: 100 }),
    listOpportunities({ pageSize: 100 }),
    listLeads({ pageSize: 100 })
  ]);

  const ownerOptions: TaskOptionItem[] = owners.map((owner) => ({
    id: owner.id,
    label: owner.name
  }));
  const accountOptions: TaskOptionItem[] = accounts.map((account) => ({
    id: account.id,
    label: account.name
  }));
  const contactOptions: TaskOptionItem[] = contacts.map((contact) => ({
    id: contact.id,
    label: `${contact.firstName} ${contact.lastName}`
  }));
  const dealOptions: TaskOptionItem[] = deals.map((deal) => ({
    id: deal.id,
    label: deal.name
  }));
  const leadOptions: TaskOptionItem[] = leads.map((lead) => ({
    id: lead.id,
    label: `${lead.firstName} ${lead.lastName}`
  }));

  return (
    <div className="crm-page">
      <PageHeader
        title="New Task"
        description="Capture follow-up work and link it to an account, contact, deal, or lead."
      />
      <TaskForm
        title="Create Task"
        submitLabel="Create task"
        owners={ownerOptions}
        accounts={accountOptions}
        contacts={contactOptions}
        deals={dealOptions}
        leads={leadOptions}
      />
    </div>
  );
}
