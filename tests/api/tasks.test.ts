import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createTask,
  deleteTask,
  getTask,
  listTasks,
  updateTask
} from "@/lib/services/tasks";
import { completeTask as completeTaskViaClient } from "@/lib/crm/crmClient";
import { prisma } from "@/lib/prisma";

const ownerId = "test-task-owner";
const otherOwnerId = "test-task-other-owner";

describe("tasks service", () => {
  beforeEach(async () => {
    await cleanupTasks();
    await createOwner(ownerId, "Task Owner");
    await createOwner(otherOwnerId, "Other Task Owner");
  });

  afterEach(async () => {
    await cleanupTasks();
  });

  it("creates a task with validated defaults", async () => {
    const task = await createTask({
      title: "Task service create",
      ownerId
    });

    expect(task.title).toBe("Task service create");
    expect(task.status).toBe("open");
    expect(task.priority).toBe("normal");
    expect(task.ownerId).toBe(ownerId);

    const audit = await prisma.auditEvent.findFirstOrThrow({
      where: {
        action: "created",
        entityId: task.id,
        entityType: "task"
      }
    });
    expect(audit.category).toBe("record");
    expect(audit.actorUserId).toBeNull();
    expect(audit.summary).toBe("Task created: Task service create.");
    expect(auditMetadata(audit)).toMatchObject({
      ownerId,
      priority: "normal",
      status: "open",
      title: "Task service create"
    });
  });

  it("lists tasks with status, owner, and due date filters", async () => {
    const matching = await createTask({
      title: "Task service matching",
      ownerId,
      status: "open",
      dueDate: new Date("2026-05-20T12:00:00Z")
    });
    await createTask({
      title: "Task service wrong status",
      ownerId,
      status: "done",
      dueDate: new Date("2026-05-20T12:00:00Z")
    });
    await createTask({
      title: "Task service wrong owner",
      ownerId: otherOwnerId,
      status: "open",
      dueDate: new Date("2026-05-20T12:00:00Z")
    });
    await createTask({
      title: "Task service outside due date",
      ownerId,
      status: "open",
      dueDate: new Date("2026-06-01T12:00:00Z")
    });

    const tasks = await listTasks({
      status: "open",
      ownerId,
      dueDateFrom: "2026-05-15T00:00:00Z",
      dueDateTo: "2026-05-25T23:59:59Z"
    });

    expect(tasks.map((task) => task.id)).toEqual([matching.id]);
  });

  it("gets and updates a task", async () => {
    const task = await createTask({
      title: "Task service update",
      ownerId
    });

    const updated = await updateTask(task.id, {
      title: "Task service updated",
      priority: "urgent",
      status: "in_progress"
    });
    const fetched = await getTask(task.id);

    expect(updated.title).toBe("Task service updated");
    expect(updated.priority).toBe("urgent");
    expect(fetched?.status).toBe("in_progress");

    const audit = await prisma.auditEvent.findFirstOrThrow({
      where: {
        action: "status_changed",
        entityId: task.id,
        entityType: "task"
      }
    });
    expect(audit.category).toBe("record");
    expect(audit.summary).toBe(
      "Task status changed from open to in_progress."
    );
    expect(auditMetadata(audit)).toMatchObject({
      changedFields: ["priority", "status", "title"],
      previousStatus: "open",
      status: "in_progress",
      title: "Task service updated"
    });
  });

  it("completes a task through the crmClient adapter", async () => {
    const task = await createTask({
      title: "Task service complete",
      ownerId,
      status: "in_progress"
    });

    const completed = await completeTaskViaClient(task.id);

    expect(completed.status).toBe("done");

    const audit = await prisma.auditEvent.findFirstOrThrow({
      where: {
        action: "task_completed",
        entityId: task.id,
        entityType: "task"
      }
    });
    expect(audit.category).toBe("workflow");
    expect(audit.summary).toBe("Task completed: Task service complete.");
    expect(auditMetadata(audit)).toMatchObject({
      activityCreated: true,
      previousStatus: "in_progress",
      status: "done"
    });
  });

  it("deletes a task", async () => {
    const task = await createTask({
      title: "Task service delete",
      ownerId
    });

    await deleteTask(task.id);

    expect(await getTask(task.id)).toBeNull();
  });

  it("rejects invalid create, update, and list inputs", async () => {
    await expect(
      createTask({
        title: "",
        ownerId
      })
    ).rejects.toThrow();
    await expect(
      updateTask("missing-task", {
        status: "invalid"
      })
    ).rejects.toThrow();
    await expect(
      listTasks({
        status: "invalid"
      })
    ).rejects.toThrow();
  });
});

async function createOwner(id: string, name: string) {
  await prisma.user.create({
    data: {
      id,
      name,
      email: `${id}@example.test`
    }
  });
}

async function cleanupTasks() {
  await prisma.auditEvent.deleteMany({
    where: {
      OR: [
        {
          entityType: "task",
          summary: {
            contains: "Task service"
          }
        },
        {
          entityType: "task",
          metadata: {
            contains: "Task service"
          }
        }
      ]
    }
  });
  await prisma.activity.deleteMany({
    where: {
      OR: [
        {
          taskId: {
            not: null
          }
        },
        {
          title: {
            startsWith: "Task completed: Task service"
          }
        }
      ]
    }
  });
  await prisma.task.deleteMany({
    where: {
      OR: [
        {
          title: {
            startsWith: "Task service"
          }
        },
        {
          ownerId: {
            in: [ownerId, otherOwnerId]
          }
        }
      ]
    }
  });
  await prisma.user.deleteMany({
    where: {
      id: {
        in: [ownerId, otherOwnerId]
      }
    }
  });
}

function auditMetadata(event: {
  metadata: string | null;
}): Record<string, unknown> {
  return JSON.parse(event.metadata ?? "{}") as Record<string, unknown>;
}
