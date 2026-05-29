"use client";

import { Eye } from "lucide-react";
import Link from "next/link";
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
  type TaskPriority,
  type TaskStatus
} from "@/lib/crm/registry";
import { formatDate } from "@/lib/formatters";

export type TaskLinkedRecord =
  | { kind: "account"; id: string; label: string }
  | { kind: "contact"; id: string; label: string }
  | { kind: "deal"; id: string; label: string }
  | { kind: "lead"; id: string; label: string }
  | null;

export type TaskRow = {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  owner: { id: string; name: string } | null;
  linkedRecord: TaskLinkedRecord;
};

const STATUS_LABELS: Record<TaskStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  done: "Done",
  cancelled: "Cancelled"
};

const STATUS_VARIANT: Record<
  TaskStatus,
  "default" | "secondary" | "outline-solid" | "success" | "warning" | "danger"
> = {
  open: "default",
  in_progress: "warning",
  done: "success",
  cancelled: "outline-solid"
};

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Low",
  normal: "Normal",
  high: "High",
  urgent: "Urgent"
};

const PRIORITY_VARIANT: Record<
  TaskPriority,
  "default" | "secondary" | "outline-solid" | "success" | "warning" | "danger"
> = {
  low: "outline-solid",
  normal: "secondary",
  high: "warning",
  urgent: "danger"
};

export function TasksTable({ tasks }: { tasks: TaskRow[] }) {
  return (
    <>
      <ListSelectedExportAction
        entity="tasks"
        entityLabel="Tasks"
        records={tasks.map((task) => ({
          id: task.id,
          label: task.title
        }))}
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Due date</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>Linked to</TableHead>
            <TableHead className="w-16">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TableRow key={task.id}>
              <TableCell className="font-medium">
                <Link
                  href={ROUTE_REGISTRY.taskDetail(task.id)}
                  className="text-primary hover:underline"
                >
                  {task.title}
                </Link>
              </TableCell>
              <TableCell>
                <Badge variant={STATUS_VARIANT[task.status]}>
                  {STATUS_LABELS[task.status]}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={PRIORITY_VARIANT[task.priority]}>
                  {PRIORITY_LABELS[task.priority]}
                </Badge>
              </TableCell>
              <TableCell>{formatDate(task.dueDate)}</TableCell>
              <TableCell>{task.owner?.name ?? "Unassigned"}</TableCell>
              <TableCell>{renderLink(task.linkedRecord)}</TableCell>
              <TableCell>
                <Button asChild variant="ghost" size="icon">
                  <Link
                    href={ROUTE_REGISTRY.taskDetail(task.id)}
                    aria-label="Open task"
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

function renderLink(record: TaskLinkedRecord) {
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

  if (record.kind === "contact") {
    return (
      <Link
        href={ROUTE_REGISTRY.contactDetail(record.id)}
        className="text-primary hover:underline"
      >
        {record.label}
      </Link>
    );
  }

  if (record.kind === "deal") {
    return (
      <Link
        href={ROUTE_REGISTRY.opportunityDetail(record.id)}
        className="text-primary hover:underline"
      >
        {record.label}
      </Link>
    );
  }

  return (
    <Link
      href={ROUTE_REGISTRY.leadDetail(record.id)}
      className="text-primary hover:underline"
    >
      {record.label}
    </Link>
  );
}
