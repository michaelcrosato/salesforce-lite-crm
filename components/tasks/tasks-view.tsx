"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import {
  TaskDetailDrawer,
  type DrawerTask
} from "@/components/tasks/task-detail-drawer";
import { TasksTable, type TaskRow } from "@/components/tasks/tasks-table";
import { EmptyState } from "@/components/ui/empty-state";
import { type TaskOptionItem } from "@/components/tasks/task-form";

export function TasksView({
  tasks,
  drawerTask,
  owners,
  accounts,
  contacts,
  deals,
  leads
}: {
  tasks: TaskRow[];
  drawerTask: DrawerTask | null;
  owners: TaskOptionItem[];
  accounts: TaskOptionItem[];
  contacts: TaskOptionItem[];
  deals: TaskOptionItem[];
  leads: TaskOptionItem[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const closeDrawer = useCallback(() => {
    const next = new URLSearchParams(searchParams.toString());
    next.delete("task");
    const query = next.toString();
    router.replace(query.length > 0 ? `/tasks?${query}` : "/tasks");
  }, [router, searchParams]);

  if (tasks.length === 0) {
    return (
      <>
        <EmptyState
          title="No tasks found"
          description="Adjust filters or create a task to plan follow-up work."
          actionHref="/tasks/new"
          actionLabel="Create task"
        />
        <TaskDetailDrawer
          task={drawerTask}
          owners={owners}
          accounts={accounts}
          contacts={contacts}
          deals={deals}
          leads={leads}
          onClose={closeDrawer}
        />
      </>
    );
  }

  return (
    <>
      <TasksTable tasks={tasks} />
      <TaskDetailDrawer
        task={drawerTask}
        owners={owners}
        accounts={accounts}
        contacts={contacts}
        deals={deals}
        leads={leads}
        onClose={closeDrawer}
      />
    </>
  );
}
