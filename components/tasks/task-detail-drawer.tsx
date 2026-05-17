"use client";

import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  deleteTaskAction,
  updateTaskStatusAction
} from "@/app/tasks/actions";
import {
  TaskForm,
  type TaskFormInitialValues,
  type TaskOptionItem
} from "@/components/tasks/task-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import {
  TASK_STATUSES,
  type TaskPriority,
  type TaskStatus
} from "@/lib/crm/registry";
import { formatDate } from "@/lib/formatters";

export type DrawerTask = TaskFormInitialValues & {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  ownerName: string | null;
  createdAt: string;
  updatedAt: string;
};

const STATUS_LABELS: Record<TaskStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  done: "Done",
  cancelled: "Cancelled"
};

const STATUS_VARIANT: Record<TaskStatus, "default" | "secondary" | "outline" | "success" | "warning" | "danger"> = {
  open: "default",
  in_progress: "warning",
  done: "success",
  cancelled: "outline"
};

export function TaskDetailDrawer({
  task,
  owners,
  accounts,
  contacts,
  deals,
  leads,
  onClose
}: {
  task: DrawerTask | null;
  owners: TaskOptionItem[];
  accounts: TaskOptionItem[];
  contacts: TaskOptionItem[];
  deals: TaskOptionItem[];
  leads: TaskOptionItem[];
  onClose: () => void;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!task) {
    return null;
  }

  const activeTaskId = task.id;

  function moveStatus(status: string) {
    startTransition(() => {
      void (async () => {
        const result = await updateTaskStatusAction(activeTaskId, status);
        showToast({
          title: result.ok ? "Task updated" : "Task not updated",
          description: result.message,
          variant: result.ok ? "success" : "error"
        });
        router.refresh();
      })();
    });
  }

  function handleDelete() {
    startTransition(() => {
      void (async () => {
        const result = await deleteTaskAction(activeTaskId);
        showToast({
          title: result.ok ? "Task deleted" : "Task not deleted",
          description: result.message,
          variant: result.ok ? "success" : "error"
        });
        if (result.ok) {
          onClose();
        }
        router.refresh();
      })();
    });
  }

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/30"
        aria-label="Close task detail"
        onClick={onClose}
      />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-2xl flex-col overflow-y-auto border-l bg-background shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b bg-background p-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
              Task Detail
            </p>
            <h2 className="mt-1 text-xl font-semibold">{task.title}</h2>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        <div className="space-y-5 p-5">
          {isEditing ? (
            <TaskForm
              title="Edit Task"
              submitLabel="Save task"
              owners={owners}
              accounts={accounts}
              contacts={contacts}
              deals={deals}
              leads={leads}
              initialValues={task}
              onSaved={() => setIsEditing(false)}
            />
          ) : (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Fields</CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  Edit
                </Button>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                <FieldView label="Status" value={STATUS_LABELS[task.status]} />
                <FieldView label="Priority" value={task.priority} />
                <FieldView label="Due date" value={formatDate(task.dueDate)} />
                <FieldView label="Owner" value={task.ownerName ?? "Unassigned"} />
                <FieldView label="Created" value={formatDate(task.createdAt)} />
                <FieldView label="Updated" value={formatDate(task.updatedAt)} />
                {task.description ? (
                  <div className="sm:col-span-2">
                    <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
                      Description
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm">{task.description}</p>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Update status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select
                aria-label={`Move ${task.title} status`}
                defaultValue={task.status}
                disabled={isPending}
                onChange={(event) => moveStatus(event.currentTarget.value)}
              >
                {TASK_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {STATUS_LABELS[status]}
                  </option>
                ))}
              </Select>
              <div className="flex flex-wrap gap-2">
                <Badge variant={STATUS_VARIANT[task.status]}>
                  {STATUS_LABELS[task.status]}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Danger zone</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isPending}
              >
                Delete task
              </Button>
            </CardContent>
          </Card>
        </div>
      </aside>
    </div>
  );
}

function FieldView({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-background p-3">
      <span className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
        {label}
      </span>
      <span className="mt-1 block text-sm font-medium">{value}</span>
    </div>
  );
}
