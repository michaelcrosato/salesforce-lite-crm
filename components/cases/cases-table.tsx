"use client";

import { Eye } from "lucide-react";
import Link from "next/link";
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
import {
  ROUTE_REGISTRY,
  type CasePriority,
  type CaseStatus
} from "@/lib/crm/registry";
import { formatRelativeDays } from "@/lib/formatters";

type BadgeVariant =
  | "default"
  | "secondary"
  | "outline"
  | "success"
  | "warning"
  | "danger";

export type CaseLinkedRecord =
  | { kind: "account"; id: string; label: string }
  | { kind: "contact"; id: string; label: string }
  | null;

export type CaseRow = {
  id: string;
  subject: string;
  status: CaseStatus;
  priority: CasePriority;
  owner: { id: string; name: string } | null;
  linkedRecord: CaseLinkedRecord;
  updatedAt: string;
};

const STATUS_LABELS: Record<CaseStatus, string> = {
  new: "New",
  in_progress: "In progress",
  waiting: "Waiting",
  resolved: "Resolved",
  closed: "Closed"
};

const STATUS_VARIANT: Record<CaseStatus, BadgeVariant> = {
  new: "default",
  in_progress: "warning",
  waiting: "secondary",
  resolved: "success",
  closed: "outline"
};

const PRIORITY_LABELS: Record<CasePriority, string> = {
  low: "Low",
  normal: "Normal",
  high: "High",
  urgent: "Urgent"
};

const PRIORITY_VARIANT: Record<CasePriority, BadgeVariant> = {
  low: "outline",
  normal: "secondary",
  high: "warning",
  urgent: "danger"
};

export function CasesTable({ cases }: { cases: CaseRow[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Subject</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Priority</TableHead>
          <TableHead>Linked to</TableHead>
          <TableHead>Owner</TableHead>
          <TableHead>Updated</TableHead>
          <TableHead className="w-16">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {cases.map((crmCase) => (
          <TableRow key={crmCase.id}>
            <TableCell className="font-medium">
              <Link
                href={ROUTE_REGISTRY.caseDetail(crmCase.id)}
                className="text-primary hover:underline"
              >
                {crmCase.subject}
              </Link>
            </TableCell>
            <TableCell>
              <Badge variant={STATUS_VARIANT[crmCase.status]}>
                {STATUS_LABELS[crmCase.status]}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge variant={PRIORITY_VARIANT[crmCase.priority]}>
                {PRIORITY_LABELS[crmCase.priority]}
              </Badge>
            </TableCell>
            <TableCell>{renderLink(crmCase.linkedRecord)}</TableCell>
            <TableCell>{crmCase.owner?.name ?? "Unassigned"}</TableCell>
            <TableCell>{formatRelativeDays(crmCase.updatedAt)}</TableCell>
            <TableCell>
              <Button asChild variant="ghost" size="icon">
                <Link
                  href={ROUTE_REGISTRY.caseDetail(crmCase.id)}
                  aria-label="Open case"
                >
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

function renderLink(record: CaseLinkedRecord) {
  if (!record) {
    return <span className="text-muted-foreground">No link</span>;
  }

  if (record.kind === "account") {
    return (
      <Link
        href={ROUTE_REGISTRY.accountDetail(record.id)}
        className="text-primary hover:underline"
      >
        {record.label}
      </Link>
    );
  }

  return (
    <Link
      href={ROUTE_REGISTRY.contactDetail(record.id)}
      className="text-primary hover:underline"
    >
      {record.label}
    </Link>
  );
}
