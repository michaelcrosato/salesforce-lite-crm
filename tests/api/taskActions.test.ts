import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createTaskAction,
  deleteTaskAction,
  updateTaskAction,
  updateTaskStatusAction
} from "@/app/tasks/actions";
import { prisma } from "@/lib/prisma";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn()
}));

const testTaskTitle = "Test Task Action Title";

describe("Task Actions", () => {
  beforeEach(async () => {
    await cleanup();
  });

  afterEach(async () => {
    await cleanup();
  });

  it("creates a task", async () => {
    const result = await createTaskAction(
      formData({
        title: testTaskTitle,
        description: "Desc",
        dueDate: "2026-05-20",
        status: "open",
        priority: "normal"
      })
    );

    expect(result.ok).toBe(true);
    expect(result.message).toBe("Task created.");

    const created = await prisma.task.findFirst({
      where: { title: testTaskTitle }
    });
    expect(created).not.toBeNull();
    expect(created?.status).toBe("open");
  });

  it("validates required fields for task creation", async () => {
    const result = await createTaskAction(
      formData({
        title: "",
        status: "invalid_status"
      })
    );

    expect(result.ok).toBe(false);
    expect(result.fieldErrors).toBeDefined();
    expect(result.fieldErrors?.title).toBeDefined();
  });

  it("updates a task", async () => {
    const task = await prisma.task.create({
      data: {
        title: testTaskTitle,
        status: "open"
      }
    });

    const result = await updateTaskAction(
      task.id,
      formData({
        title: "Updated Title",
        status: "in_progress",
        priority: "high"
      })
    );

    expect(result.ok).toBe(true);

    const updated = await prisma.task.findUniqueOrThrow({
      where: { id: task.id }
    });
    expect(updated.title).toBe("Updated Title");
    expect(updated.status).toBe("in_progress");
  });

  it("updates task status", async () => {
    const task = await prisma.task.create({
      data: {
        title: testTaskTitle,
        status: "open"
      }
    });

    const result = await updateTaskStatusAction(task.id, "done");

    expect(result.ok).toBe(true);

    const updated = await prisma.task.findUniqueOrThrow({
      where: { id: task.id }
    });
    expect(updated.status).toBe("done");
  });

  it("rejects invalid status", async () => {
    const result = await updateTaskStatusAction("some-id", "not-real");

    expect(result.ok).toBe(false);
    expect(result.message).toContain("Invalid status");
  });

  it("deletes a task", async () => {
    const task = await prisma.task.create({
      data: {
        title: testTaskTitle,
        status: "open"
      }
    });

    const result = await deleteTaskAction(task.id);

    expect(result.ok).toBe(true);

    const deleted = await prisma.task.findUnique({
      where: { id: task.id }
    });
    expect(deleted).toBeNull();
  });
});

function formData(values: Record<string, string>) {
  const form = new FormData();
  for (const [key, value] of Object.entries(values)) {
    form.set(key, value);
  }
  return form;
}

async function cleanup() {
  await prisma.activity.deleteMany({
    where: { task: { title: { in: [testTaskTitle, "Updated Title"] } } }
  });
  await prisma.task.deleteMany({
    where: { title: { in: [testTaskTitle, "Updated Title"] } }
  });
}
