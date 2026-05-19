import Link from "next/link";
import { CasesView } from "@/components/cases/cases-view";
import {
  type CaseLinkedRecord,
  type CaseRow
} from "@/components/cases/cases-table";
import {
  type DrawerCase
} from "@/components/cases/case-detail-drawer";
import { type CaseOptionItem } from "@/components/cases/case-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/page-header";
import { Select } from "@/components/ui/select";
import {
  getCase,
  listAccounts,
  listCases,
  listContacts
} from "@/lib/crm/crmClient";
import type { CaseListOptions } from "@/lib/crm/crmClient";
import { prisma } from "@/lib/prisma";
import {
  CASE_STATUSES,
  type CasePriority,
  type CaseStatus
} from "@/lib/crm/registry";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<CaseStatus, string> = {
  new: "New",
  in_progress: "In progress",
  waiting: "Waiting",
  resolved: "Resolved",
  closed: "Closed"
};

type CasesSearchParams = {
  case?: string;
  status?: string;
  ownerId?: string;
  accountId?: string;
};

function isCaseStatus(value: string | undefined): value is CaseStatus {
  if (!value) {
    return false;
  }
  return (CASE_STATUSES as readonly string[]).includes(value);
}

export default async function CasesPage({
  searchParams
}: {
  searchParams: Promise<CasesSearchParams>;
}) {
  const params = await searchParams;
  const statusFilter = isCaseStatus(params.status) ? params.status : undefined;
  const ownerFilter = params.ownerId?.trim() ? params.ownerId : undefined;
  const accountFilter = params.accountId?.trim() ? params.accountId : undefined;

  const listOptions: CaseListOptions = {
    pageSize: 100,
    filters: {
      status: statusFilter,
      ownerId: ownerFilter,
      accountId: accountFilter
    }
  };

  const [cases, owners, accountsList, contactsList] = await Promise.all([
    listCases(listOptions),
    prisma.user.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true }
    }),
    listAccounts({ pageSize: 100 }),
    listContacts({ pageSize: 100 })
  ]);

  const ownerById = new Map(owners.map((owner) => [owner.id, owner]));
  const accountById = new Map(accountsList.map((account) => [account.id, account]));
  const contactById = new Map(
    contactsList.map((contact) => [contact.id, contact])
  );

  const ownerOptions: CaseOptionItem[] = owners.map((owner) => ({
    id: owner.id,
    label: owner.name
  }));
  const accountOptions: CaseOptionItem[] = accountsList.map((account) => ({
    id: account.id,
    label: account.name
  }));
  const contactOptions: CaseOptionItem[] = contactsList.map((contact) => ({
    id: contact.id,
    label: `${contact.firstName} ${contact.lastName}`
  }));

  function linkedRecord(crmCase: (typeof cases)[number]): CaseLinkedRecord {
    if (crmCase.accountId) {
      const account = accountById.get(crmCase.accountId);
      if (account) {
        return { kind: "account", id: account.id, label: account.name };
      }
    }
    if (crmCase.contactId) {
      const contact = contactById.get(crmCase.contactId);
      if (contact) {
        return {
          kind: "contact",
          id: contact.id,
          label: `${contact.firstName} ${contact.lastName}`
        };
      }
    }
    return null;
  }

  const tableRows: CaseRow[] = cases.map((crmCase) => ({
    id: crmCase.id,
    subject: crmCase.subject,
    status: crmCase.status as CaseStatus,
    priority: crmCase.priority as CasePriority,
    owner: crmCase.ownerId
      ? {
          id: crmCase.ownerId,
          name: ownerById.get(crmCase.ownerId)?.name ?? "Unassigned"
        }
      : null,
    linkedRecord: linkedRecord(crmCase),
    updatedAt: crmCase.updatedAt.toISOString()
  }));

  let drawerCase: DrawerCase | null = null;
  if (params.case) {
    const found = await getCase(params.case);
    if (found) {
      drawerCase = {
        id: found.id,
        subject: found.subject,
        description: found.description,
        status: found.status as CaseStatus,
        priority: found.priority as CasePriority,
        ownerId: found.ownerId,
        ownerName: found.ownerId
          ? ownerById.get(found.ownerId)?.name ?? null
          : null,
        accountId: found.accountId,
        contactId: found.contactId,
        createdAt: found.createdAt.toISOString(),
        updatedAt: found.updatedAt.toISOString()
      };
    }
  }

  return (
    <div className="crm-page">
      <PageHeader
        title="Cases"
        description="Track customer-reported issues and route them to owners."
      >
        <Button asChild>
          <Link href="/cases/new">New case</Link>
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <form action="/cases" className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select id="status" name="status" defaultValue={params.status ?? ""}>
                <option value="">All</option>
                {CASE_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {STATUS_LABELS[status]}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="accountId">Account</Label>
              <Select id="accountId" name="accountId" defaultValue={params.accountId ?? ""}>
                <option value="">Any account</option>
                {accountsList.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ownerId">Owner</Label>
              <Select id="ownerId" name="ownerId" defaultValue={params.ownerId ?? ""}>
                <option value="">Any owner</option>
                {owners.map((owner) => (
                  <option key={owner.id} value={owner.id}>
                    {owner.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex items-end gap-3 md:col-span-3">
              <Button type="submit">Apply filters</Button>
              <Button asChild variant="outline">
                <Link href="/cases">Reset</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Case List</CardTitle>
        </CardHeader>
        <CardContent>
          <CasesView
            cases={tableRows}
            drawerCase={drawerCase}
            owners={ownerOptions}
            accounts={accountOptions}
            contacts={contactOptions}
          />
        </CardContent>
      </Card>
    </div>
  );
}
