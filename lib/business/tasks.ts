import { TASK_STATUSES } from "@/lib/crm/registry";

export type TaskForDate = {
  id?: string;
  dueDate: Date | string | null;
  status: string;
};

export type TaskWithOwner = TaskForDate & {
  ownerId: string | null;
};

export type TaskCompletionStats = {
  total: number;
  completed: number;
  completionRate: number;
  overdueCount: number;
  dueTodayCount: number;
  upcomingCount: number;
};

const DONE_STATUSES = new Set(["done", "cancelled"]);

function toDate(d: Date | string | null): Date | null {
  if (d == null) return null;
  const dt = d instanceof Date ? d : new Date(d);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function isDoneStatus(status: string): boolean {
  return DONE_STATUSES.has(status);
}

export function isOverdue(task: TaskForDate, now = new Date()): boolean {
  if (!task.dueDate) return false;
  if (isDoneStatus(task.status)) return false;
  const due = toDate(task.dueDate);
  if (!due) return false;
  return due.getTime() < now.getTime();
}

export function isDueToday(task: TaskForDate, now = new Date()): boolean {
  if (!task.dueDate) return false;
  if (isDoneStatus(task.status)) return false;
  const due = toDate(task.dueDate);
  if (!due) return false;
  const dueDay = due.toISOString().slice(0, 10);
  const nowDay = now.toISOString().slice(0, 10);
  return dueDay === nowDay;
}

export function isUpcoming(task: TaskForDate, now = new Date(), windowDays = 7): boolean {
  if (!task.dueDate) return false;
  if (isDoneStatus(task.status)) return false;
  const due = toDate(task.dueDate);
  if (!due) return false;
  if (due.getTime() <= now.getTime()) return false;
  const diffMs = due.getTime() - now.getTime();
  const diffDays = diffMs / 86400000;
  return diffDays <= windowDays;
}

export function tasksByOwner<T extends TaskWithOwner>(tasks: readonly T[]): Record<string, T[]> {
  const groups: Record<string, T[]> = {};
  for (const task of tasks) {
    const key = task.ownerId ?? "unassigned";
    if (!groups[key]) groups[key] = [];
    groups[key].push(task);
  }
  return groups;
}

export function taskCompletionStats(tasks: readonly TaskForDate[], now = new Date()): TaskCompletionStats {
  const total = tasks.length;
  let completed = 0;
  let overdueCount = 0;
  let dueTodayCount = 0;
  let upcomingCount = 0;

  for (const task of tasks) {
    if (isDoneStatus(task.status)) {
      completed += 1;
      continue;
    }
    if (isOverdue(task, now)) overdueCount += 1;
    if (isDueToday(task, now)) dueTodayCount += 1;
    if (isUpcoming(task, now, 30)) upcomingCount += 1;
  }

  const completionRate = total > 0 ? Math.round((completed / total) * 100) / 100 : 0;
  return {
    total,
    completed,
    completionRate,
    overdueCount,
    dueTodayCount,
    upcomingCount
  };
}
