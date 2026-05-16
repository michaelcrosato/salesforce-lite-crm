"use client";

import { ArrowUpDown, Eye } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { CONTACT_STATUS_LABELS } from "@/lib/crm-constants";
import { formatRelativeDays } from "@/lib/formatters";

export type ContactTableRowData = {
  id: string;
  firstName: string;
  lastName: string;
  account: {
    id: string;
    name: string;
  } | null;
  title: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  lastActivityAt: string | null;
  openDeals: number;
};

type SortKey =
  | "name"
  | "account"
  | "title"
  | "email"
  | "phone"
  | "status"
  | "lastActivity"
  | "openDeals";

export function ContactsTable({ contacts }: { contacts: ContactTableRowData[] }) {
  const [sort, setSort] = useState<{ key: SortKey; direction: "asc" | "desc" }>({
    key: "name",
    direction: "asc"
  });

  const sortedContacts = useMemo(() => {
    return [...contacts].sort((a, b) => {
      const modifier = sort.direction === "asc" ? 1 : -1;
      return compareContact(a, b, sort.key) * modifier;
    });
  }, [contacts, sort]);

  function toggleSort(key: SortKey) {
    setSort((current) => ({
      key,
      direction: current.key === key && current.direction === "asc" ? "desc" : "asc"
    }));
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <SortableHead label="Name" sortKey="name" onSort={toggleSort} />
          <SortableHead label="Account" sortKey="account" onSort={toggleSort} />
          <SortableHead label="Title" sortKey="title" onSort={toggleSort} />
          <SortableHead label="Email" sortKey="email" onSort={toggleSort} />
          <SortableHead label="Phone" sortKey="phone" onSort={toggleSort} />
          <SortableHead label="Status" sortKey="status" onSort={toggleSort} />
          <SortableHead
            label="Last Activity"
            sortKey="lastActivity"
            onSort={toggleSort}
          />
          <SortableHead label="Open Deals" sortKey="openDeals" onSort={toggleSort} />
          <TableHead className="w-16">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedContacts.map((contact) => (
          <TableRow key={contact.id}>
            <TableCell className="font-medium">
              <Link href={`/contacts/${contact.id}`} className="text-primary hover:underline">
                {contact.firstName} {contact.lastName}
              </Link>
            </TableCell>
            <TableCell>
              {contact.account ? (
                <Link
                  href={`/accounts/${contact.account.id}`}
                  className="text-primary hover:underline"
                >
                  {contact.account.name}
                </Link>
              ) : (
                <span className="text-muted-foreground">No account</span>
              )}
            </TableCell>
            <TableCell>{contact.title ?? "No title"}</TableCell>
            <TableCell>{contact.email ?? "No email"}</TableCell>
            <TableCell>{contact.phone ?? "No phone"}</TableCell>
            <TableCell>
              <Badge variant={contact.status === "active" ? "success" : "outline"}>
                {contact.status === "active"
                  ? CONTACT_STATUS_LABELS.active
                  : CONTACT_STATUS_LABELS.inactive}
              </Badge>
            </TableCell>
            <TableCell>{formatRelativeDays(contact.lastActivityAt)}</TableCell>
            <TableCell>{contact.openDeals}</TableCell>
            <TableCell>
              <Button asChild variant="ghost" size="icon">
                <Link href={`/contacts/${contact.id}`} aria-label="Open contact">
                  <Eye className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
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

function compareContact(a: ContactTableRowData, b: ContactTableRowData, key: SortKey) {
  if (key === "openDeals") {
    return a.openDeals - b.openDeals;
  }

  if (key === "lastActivity") {
    return dateValue(a.lastActivityAt) - dateValue(b.lastActivityAt);
  }

  return textValue(a, key).localeCompare(textValue(b, key));
}

function textValue(contact: ContactTableRowData, key: Exclude<SortKey, "openDeals" | "lastActivity">) {
  const values: Record<Exclude<SortKey, "openDeals" | "lastActivity">, string> = {
    name: `${contact.lastName} ${contact.firstName}`,
    account: contact.account?.name ?? "",
    title: contact.title ?? "",
    email: contact.email ?? "",
    phone: contact.phone ?? "",
    status: contact.status
  };

  return values[key];
}

function dateValue(value: string | null) {
  return value ? new Date(value).getTime() : 0;
}
