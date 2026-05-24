import type { Metadata } from "next";
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
import {
  SavedListViewControls,
  savedListViewStatus
} from "@/components/saved-list-view-controls";
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
import { nonEmptyQueryParam } from "@/lib/queryParams";
import { getListFilterSupportEntityCatalog } from "@/lib/server/listFilterSupportCatalog";
import {
  buildSavedListViewQuery,
  listSavedListViews,
  type SavedListViewListQuery,
  type SavedListViewResolvedQuery
} from "@/lib/services/savedListViews";
import type { SortOrder } from "@/lib/services/listQuery";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cases"
};

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
  contactId?: string;
  sortBy?: string;
  sortOrder?: string;
  pageSize?: string;
  view?: string;
  savedViewStatus?: string;
};

const CASE_SORT_KEYS = [
  "updatedAt",
  "createdAt",
  "status",
  "priority",
  "subject"
] as const;

type CaseSortBy = (typeof CASE_SORT_KEYS)[number];
const DEFAULT_CASE_SORT_BY: CaseSortBy = "updatedAt";

function isCaseStatus(value: string | undefined): value is CaseStatus {
  if (!value) {
    return false;
  }
  return (CASE_STATUSES as readonly string[]).includes(value);
}

function isCaseSortBy(value: string | undefined): value is CaseSortBy {
  if (!value) {
    return false;
  }
  return (CASE_SORT_KEYS as readonly string[]).includes(value);
}

function sortOrderParam(value: string | undefined): SortOrder | undefined {
  return value === "asc" || value === "desc" ? value : undefined;
}

function stringFilter(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

async function resolveCaseSavedViewQuery(
  savedViewId: string | undefined,
  query: SavedListViewListQuery
): Promise<{ resolved: SavedListViewResolvedQuery; invalidView: boolean }> {
  if (!savedViewId) {
    return {
      invalidView: false,
      resolved: {
        entity: "cases",
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
        entity: "cases",
        savedViewId,
        query
      })
    };
  } catch {
    return {
      invalidView: true,
      resolved: {
        entity: "cases",
        selectedView: null,
        source: "current-query",
        query
      }
    };
  }
}

export default async function CasesPage({
  searchParams
}: {
  searchParams: Promise<CasesSearchParams>;
}) {
  const params = await searchParams;
  const caseCatalog = getListFilterSupportEntityCatalog("cases");

  if (!caseCatalog) {
    throw new Error("Case saved view support catalog is missing.");
  }

  const currentQuery: SavedListViewListQuery = {
    pageSize: 100,
    sortBy: isCaseSortBy(params.sortBy)
      ? params.sortBy
      : DEFAULT_CASE_SORT_BY,
    sortOrder: sortOrderParam(params.sortOrder) ?? caseCatalog.defaultSortOrder,
    filters: {
      status: isCaseStatus(params.status) ? params.status : undefined,
      ownerId: nonEmptyQueryParam(params.ownerId),
      accountId: nonEmptyQueryParam(params.accountId),
      contactId: nonEmptyQueryParam(params.contactId)
    }
  };
  const [savedViews, savedViewState] = await Promise.all([
    listSavedListViews({ entity: "cases" }),
    resolveCaseSavedViewQuery(nonEmptyQueryParam(params.view), currentQuery)
  ]);
  const effectiveFilters = savedViewState.resolved.query.filters ?? {};
  const effectiveStatus = stringFilter(effectiveFilters.status);
  const statusFilter = isCaseStatus(effectiveStatus)
    ? effectiveStatus
    : undefined;
  const ownerFilter = stringFilter(effectiveFilters.ownerId);
  const accountFilter = stringFilter(effectiveFilters.accountId);
  const contactFilter = stringFilter(effectiveFilters.contactId);
  const sortBy = isCaseSortBy(savedViewState.resolved.query.sortBy)
    ? savedViewState.resolved.query.sortBy
    : DEFAULT_CASE_SORT_BY;
  const sortOrder =
    savedViewState.resolved.query.sortOrder ?? caseCatalog.defaultSortOrder;
  const pageSize = savedViewState.resolved.query.pageSize ?? 100;

  const listOptions: CaseListOptions = {
    pageSize,
    sortBy,
    sortOrder,
    filters: {
      status: statusFilter,
      ownerId: ownerFilter,
      accountId: accountFilter,
      contactId: contactFilter
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
          <form action="/cases" className="grid gap-4 lg:grid-cols-6">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select id="status" name="status" defaultValue={statusFilter ?? ""}>
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
              <Select id="accountId" name="accountId" defaultValue={accountFilter ?? ""}>
                <option value="">Any account</option>
                {accountsList.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactId">Contact</Label>
              <Select id="contactId" name="contactId" defaultValue={contactFilter ?? ""}>
                <option value="">Any contact</option>
                {contactsList.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.firstName} {contact.lastName}
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
              <Label htmlFor="sortBy">Sort by</Label>
              <Select id="sortBy" name="sortBy" defaultValue={sortBy}>
                {caseCatalog.sortKeys.map((sortKey) => (
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
                <Link href="/cases">Reset</Link>
              </Button>
            </div>
          </form>
          <div className="mt-5 border-t pt-5">
            <SavedListViewControls
              entity="cases"
              route="/cases"
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
                  accountId: accountFilter,
                  contactId: contactFilter
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
