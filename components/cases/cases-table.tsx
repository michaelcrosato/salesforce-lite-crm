"use client";

import { Eye } from "lucide-react";
import Link from "next/link";
import {
  CaseKnowledgeListSummary,
  type CaseKnowledgeAssistPacketView
} from "@/components/cases/case-knowledge-assist";
import { ListSelectedExportAction } from "@/components/list-selected-export-action";
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
  type CaseQueueKey,
  type CaseStatus
} from "@/lib/crm/registry";
import { formatRelativeDays } from "@/lib/formatters";
import type { CaseSlaState } from "@/lib/services/caseSlas";

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
  queueKey: CaseQueueKey;
  queueReason: string;
  sla: {
    state: CaseSlaState;
    policyLabel: string;
    dueAt: string;
    remainingMinutes: number;
    overdueMinutes: number;
    isStopped: boolean;
  };
  knowledge: CaseKnowledgeAssistPacketView;
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

const QUEUE_LABELS: Record<CaseQueueKey, string> = {
  critical_support: "Critical Support",
  billing_support: "Billing Support",
  dealer_operations: "Dealer Operations",
  data_quality: "Data Quality",
  customer_success: "Customer Success",
  general_support: "General Support"
};

const QUEUE_REASON_LABELS: Record<string, string> = {
  default_general_support: "Default rule",
  explicit_queue: "Manual assignment",
  linked_customer_record: "Linked customer",
  matched_billing_language: "Billing language",
  matched_customer_success_language: "Customer success language",
  matched_data_quality_language: "Data quality language",
  matched_dealer_operations_language: "Dealer operations language",
  urgent_priority: "Urgent priority"
};

const SLA_STATE_LABELS: Record<CaseSlaState, string> = {
  on_track: "On track",
  due_soon: "Due soon",
  overdue: "Overdue",
  stopped_on_time: "Stopped on time",
  stopped_overdue: "Stopped overdue"
};

const SLA_STATE_VARIANT: Record<CaseSlaState, BadgeVariant> = {
  on_track: "success",
  due_soon: "warning",
  overdue: "danger",
  stopped_on_time: "outline",
  stopped_overdue: "danger"
};

export function CasesTable({ cases }: { cases: CaseRow[] }) {
  return (
    <>
      <ListSelectedExportAction
        entity="cases"
        entityLabel="Cases"
        records={cases.map((crmCase) => ({
          id: crmCase.id,
          label: crmCase.subject
        }))}
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Subject</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Queue</TableHead>
            <TableHead>SLA</TableHead>
            <TableHead>Knowledge</TableHead>
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
              <TableCell data-testid="case-row-queue">
                <div className="flex flex-col gap-1">
                  <Badge variant="secondary">
                    {QUEUE_LABELS[crmCase.queueKey]}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {QUEUE_REASON_LABELS[crmCase.queueReason] ??
                      crmCase.queueReason}
                  </span>
                </div>
              </TableCell>
              <TableCell data-testid="case-row-sla">
                <div className="flex flex-col gap-1">
                  <Badge variant={SLA_STATE_VARIANT[crmCase.sla.state]}>
                    {SLA_STATE_LABELS[crmCase.sla.state]}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {slaTimingText(crmCase.sla)}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <CaseKnowledgeListSummary packet={crmCase.knowledge} />
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
    </>
  );
}

function slaTimingText(crmCaseSla: CaseRow["sla"]): string {
  if (crmCaseSla.isStopped) {
    return crmCaseSla.overdueMinutes > 0
      ? `Stopped ${formatMinutes(crmCaseSla.overdueMinutes)} late`
      : "Stopped before target";
  }

  if (crmCaseSla.overdueMinutes > 0) {
    return `${formatMinutes(crmCaseSla.overdueMinutes)} overdue`;
  }

  return `${formatMinutes(crmCaseSla.remainingMinutes)} left`;
}

function formatMinutes(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes === 0
    ? `${hours}h`
    : `${hours}h ${remainingMinutes}m`;
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
