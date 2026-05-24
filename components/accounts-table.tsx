"use client";

import { ArrowUpDown, Eye } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { AccountStatusBadge, HealthBadge } from "@/components/account-badges";
import { ListSelectedExportAction } from "@/components/list-selected-export-action";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/formatters";

export type AccountTableRowData = {
  id: string;
  name: string;
  industry: string | null;
  city: string | null;
  region: string | null;
  status: string;
  healthScore: number;
  ownerName: string | null;
  contactsCount: number;
  openPipeline: number;
};

type SortKey =
  | "name"
  | "industry"
  | "location"
  | "status"
  | "health"
  | "owner"
  | "contacts"
  | "pipeline";

export interface AccountsTableProps {
  accounts: AccountTableRowData[];
  /** Optional data-testid for the whole table container */
  "data-testid"?: string;
}

export function AccountsTable({ accounts, "data-testid": testid }: AccountsTableProps) {
  const [sort, setSort] = useState<{ key: SortKey; direction: "asc" | "desc" }>({
    key: "name",
    direction: "asc"
  });
  const sortedAccounts = useMemo(() => {
    return [...accounts].sort((a, b) => {
      const modifier = sort.direction === "asc" ? 1 : -1;
      const cmp = compareAccount(a, b, sort.key);
      return (cmp !== 0 ? cmp : a.id.localeCompare(b.id)) * modifier;
    });
  }, [accounts, sort]);

  function toggleSort(key: SortKey) {
    setSort((current) => ({
      key,
      direction: current.key === key && current.direction === "asc" ? "desc" : "asc"
    }));
  }

  if (accounts.length === 0) {
    return (
      <EmptyState
        title="No accounts"
        description="No accounts match the current filters."
        compact
        data-testid={testid ? `${testid}-empty` : "accounts-table-empty"}
      />
    );
  }

  return (
    <div data-testid={testid}>
      <ListSelectedExportAction
        entity="accounts"
        entityLabel="Accounts"
        records={sortedAccounts.map((account) => ({
          id: account.id,
          label: account.name
        }))}
      />
      <Table>
      <TableHeader>
        <TableRow>
          <SortableHead label="Name" sortKey="name" onSort={toggleSort} />
          <SortableHead label="Industry" sortKey="industry" onSort={toggleSort} />
          <SortableHead label="Location" sortKey="location" onSort={toggleSort} />
          <SortableHead label="Status" sortKey="status" onSort={toggleSort} />
          <SortableHead label="Health" sortKey="health" onSort={toggleSort} />
          <SortableHead label="Owner" sortKey="owner" onSort={toggleSort} />
          <SortableHead label="Contacts" sortKey="contacts" onSort={toggleSort} />
          <SortableHead label="Open Pipeline" sortKey="pipeline" onSort={toggleSort} />
          <TableHead className="w-16">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedAccounts.map((account) => (
          <TableRow key={account.id}>
            <TableCell className="font-medium">{account.name}</TableCell>
            <TableCell>{account.industry ?? "No industry"}</TableCell>
            <TableCell>{locationText(account)}</TableCell>
            <TableCell>
              <AccountStatusBadge status={account.status} />
            </TableCell>
            <TableCell>
              <HealthBadge value={account.healthScore} />
            </TableCell>
            <TableCell>{account.ownerName ?? "Unassigned"}</TableCell>
            <TableCell>{account.contactsCount}</TableCell>
            <TableCell>{formatCurrency(account.openPipeline)}</TableCell>
            <TableCell>
              <Button asChild variant="ghost" size="icon">
                <Link href={`/accounts/${account.id}`} aria-label="Open account">
                  <Eye className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
    </div>
  );
}

function SortableHead({
  label,
  sortKey,
  onSort
}: {
  label: string;
  sortKey: SortKey;
  onSort: (key: SortKey) => void;
}) {
  return (
    <TableHead>
      <button type="button" className="inline-flex items-center gap-1" onClick={() => onSort(sortKey)}>
        {label}
        <ArrowUpDown className="h-3 w-3" aria-hidden="true" />
      </button>
    </TableHead>
  );
}

function compareAccount(a: AccountTableRowData, b: AccountTableRowData, key: SortKey) {
  if (key === "health") {
    return a.healthScore - b.healthScore;
  }

  if (key === "contacts") {
    return a.contactsCount - b.contactsCount;
  }

  if (key === "pipeline") {
    return a.openPipeline - b.openPipeline;
  }

  return accountTextValue(a, key).localeCompare(accountTextValue(b, key));
}

function accountTextValue(account: AccountTableRowData, key: Exclude<SortKey, "health" | "contacts" | "pipeline">) {
  const values: Record<Exclude<SortKey, "health" | "contacts" | "pipeline">, string> = {
    name: account.name,
    industry: account.industry ?? "",
    location: locationText(account),
    status: account.status,
    owner: account.ownerName ?? ""
  };

  return values[key];
}

function locationText(account: Pick<AccountTableRowData, "city" | "region">) {
  return [account.city, account.region].filter(Boolean).join(", ") || "No location";
}
