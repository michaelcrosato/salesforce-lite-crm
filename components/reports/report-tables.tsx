import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { STAGE_LABELS, type DealStage } from "@/lib/crm-constants";
import { formatCurrency, formatDate, formatNumber } from "@/lib/formatters";
import type {
  ActivityVolumeByDayRow,
  LeadsBySourceRow,
  OverdueTaskRow,
  PipelineByStageRow,
  StaleOpportunityRow,
  TopAccountByOpportunityValueRow
} from "@/lib/services/reports";

function dealStageLabel(stage: string): string {
  if (stage in STAGE_LABELS) {
    return STAGE_LABELS[stage as DealStage];
  }
  return stage;
}

export function PipelineByStageTable({ rows }: { rows: PipelineByStageRow[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Stage</TableHead>
          <TableHead>Count</TableHead>
          <TableHead>Value</TableHead>
          <TableHead>Weighted value</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.stage}>
            <TableCell className="font-medium">
              {dealStageLabel(row.stage)}
            </TableCell>
            <TableCell>{formatNumber(row.count)}</TableCell>
            <TableCell>{formatCurrency(row.value)}</TableCell>
            <TableCell>
              {formatCurrency(Math.round(row.weightedValue))}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function LeadsBySourceTable({ rows }: { rows: LeadsBySourceRow[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Source</TableHead>
          <TableHead>Count</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.source}>
            <TableCell className="font-medium">{row.source}</TableCell>
            <TableCell>{formatNumber(row.count)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function ActivityVolumeTable({
  rows
}: {
  rows: ActivityVolumeByDayRow[];
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Day</TableHead>
          <TableHead>Activities</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.day}>
            <TableCell className="font-medium">{row.day}</TableCell>
            <TableCell>{formatNumber(row.count)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function TopAccountsTable({
  rows
}: {
  rows: TopAccountByOpportunityValueRow[];
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Account</TableHead>
          <TableHead>Opportunities</TableHead>
          <TableHead>Total value</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.accountId}>
            <TableCell className="font-medium">
              <Link href={row.route} className="text-primary hover:underline">
                {row.accountName}
              </Link>
            </TableCell>
            <TableCell>{formatNumber(row.opportunityCount)}</TableCell>
            <TableCell>{formatCurrency(row.totalValue)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function StaleOpportunitiesTable({
  rows
}: {
  rows: StaleOpportunityRow[];
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Deal</TableHead>
          <TableHead>Stage</TableHead>
          <TableHead>Value</TableHead>
          <TableHead>Last activity</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="font-medium">
              <Link href={row.route} className="text-primary hover:underline">
                {row.name}
              </Link>
            </TableCell>
            <TableCell>{dealStageLabel(row.stage)}</TableCell>
            <TableCell>{formatCurrency(row.value)}</TableCell>
            <TableCell>{formatDate(row.lastActivityAt)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function OverdueTasksTable({ rows }: { rows: OverdueTaskRow[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Task</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Priority</TableHead>
          <TableHead>Due date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="font-medium">
              <Link href={row.route} className="text-primary hover:underline">
                {row.title}
              </Link>
            </TableCell>
            <TableCell>{row.status}</TableCell>
            <TableCell>{row.priority}</TableCell>
            <TableCell>{formatDate(row.dueDate)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
