import { describe, expect, it } from "vitest";
import {
  isOverdue,
  isDueToday,
  isUpcoming,
  tasksByOwner,
  taskCompletionStats,
  type TaskForDate,
  type TaskWithOwner
} from "@/lib/business/tasks";

describe("task date helpers", () => {
  const now = new Date("2026-05-15T12:00:00Z");

  it("isOverdue returns true for past due open tasks", () => {
    const task: TaskForDate = {
      dueDate: "2026-05-10T10:00:00Z",
      status: "open"
    };
    expect(isOverdue(task, now)).toBe(true);
  });

  it("isOverdue returns false for done or cancelled even if past due", () => {
    expect(isOverdue({ dueDate: "2026-05-10", status: "done" }, now)).toBe(
      false
    );
    expect(isOverdue({ dueDate: "2026-05-10", status: "cancelled" }, now)).toBe(
      false
    );
  });

  it("isDueToday matches same calendar day and non-done status", () => {
    const dueToday: TaskForDate = {
      dueDate: "2026-05-15T23:59:00Z",
      status: "in_progress"
    };
    expect(isDueToday(dueToday, now)).toBe(true);
    const doneToday: TaskForDate = {
      dueDate: "2026-05-15T09:00:00Z",
      status: "done"
    };
    expect(isDueToday(doneToday, now)).toBe(false);
  });

  it("isUpcoming detects future within window and excludes past", () => {
    const soon: TaskForDate = {
      dueDate: "2026-05-18T09:00:00Z",
      status: "open"
    };
    expect(isUpcoming(soon, now, 7)).toBe(true);
    const far: TaskForDate = {
      dueDate: "2026-06-20T09:00:00Z",
      status: "open"
    };
    expect(isUpcoming(far, now, 7)).toBe(false);
    const past: TaskForDate = { dueDate: "2026-05-10", status: "open" };
    expect(isUpcoming(past, now, 7)).toBe(false);
  });

  it("handles null dueDate gracefully (never overdue/due/upcoming)", () => {
    const noDue: TaskForDate = { dueDate: null, status: "open" };
    expect(isOverdue(noDue, now)).toBe(false);
    expect(isDueToday(noDue, now)).toBe(false);
    expect(isUpcoming(noDue, now, 14)).toBe(false);
  });
});

describe("task stats and grouping", () => {
  const now = new Date("2026-05-15T12:00:00Z");
  const sample: TaskWithOwner[] = [
    { id: "t1", dueDate: "2026-05-10", status: "open", ownerId: "user-ava" },
    {
      id: "t2",
      dueDate: "2026-05-15T17:00:00Z",
      status: "in_progress",
      ownerId: "user-ava"
    },
    { id: "t3", dueDate: "2026-05-20", status: "open", ownerId: "user-marcus" },
    { id: "t4", dueDate: "2026-05-15", status: "done", ownerId: "user-elena" },
    { id: "t5", dueDate: null, status: "open", ownerId: null },
    { id: "t6", dueDate: "2026-05-10", status: "done", ownerId: "user-ava" }
  ];

  it("tasksByOwner groups by ownerId or unassigned", () => {
    const groups = tasksByOwner(sample);
    expect(groups["user-ava"]).toHaveLength(3);
    expect(groups["user-marcus"]).toHaveLength(1);
    expect(groups["unassigned"]).toHaveLength(1);
  });

  it("taskCompletionStats computes counts and rate correctly", () => {
    const stats = taskCompletionStats(sample, now);
    expect(stats.total).toBe(6);
    expect(stats.completed).toBe(2);
    expect(stats.completionRate).toBeCloseTo(0.33, 2);
    expect(stats.overdueCount).toBe(1);
    expect(stats.dueTodayCount).toBe(1);
    expect(stats.upcomingCount).toBe(2);
  });

  it("taskCompletionStats handles empty input", () => {
    const stats = taskCompletionStats([]);
    expect(stats.total).toBe(0);
    expect(stats.completionRate).toBe(0);
    expect(stats.overdueCount).toBe(0);
  });
});
