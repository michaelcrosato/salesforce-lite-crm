import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  addActivityToCase,
  addActivityToTask,
  completeTask,
  createCase,
  createTask
} from "@/lib/crm/crmClient";
import { prisma } from "@/lib/prisma";

describe("activity links to tasks and cases", () => {
  beforeEach(async () => {
    await cleanupActivityLinks();
  });

  afterEach(async () => {
    await cleanupActivityLinks();
  });

  it("adds an activity to a task", async () => {
    const task = await createTask({
      title: "Activity link task"
    });

    const activity = await addActivityToTask(task.id, {
      type: "note",
      title: "Activity link task note",
      rawText: "Task activity body."
    });

    expect(activity.taskId).toBe(task.id);
    expect(activity.caseId).toBeNull();
  });

  it("adds an activity to a case", async () => {
    const crmCase = await createCase({
      subject: "Activity link case"
    });

    const activity = await addActivityToCase(crmCase.id, {
      type: "call",
      title: "Activity link case call",
      summary: "Customer called about the case."
    });

    expect(activity.caseId).toBe(crmCase.id);
    expect(activity.taskId).toBeNull();
  });

  it("writes a status change activity when a task is completed", async () => {
    const task = await createTask({
      title: "Activity link completion",
      status: "in_progress"
    });

    const completed = await completeTask(task.id);
    const activity = await prisma.activity.findFirstOrThrow({
      where: {
        taskId: task.id,
        type: "status_change"
      }
    });

    expect(completed.status).toBe("done");
    expect(activity.title).toBe("Task completed: Activity link completion");
    expect(activity.summary).toBe("Task status changed to done.");
  });
});

async function cleanupActivityLinks() {
  await prisma.activity.deleteMany({
    where: {
      OR: [
        {
          title: {
            startsWith: "Activity link"
          }
        },
        {
          title: {
            startsWith: "Task completed: Activity link"
          }
        }
      ]
    }
  });
  await prisma.task.deleteMany({
    where: {
      title: {
        startsWith: "Activity link"
      }
    }
  });
  await prisma.case.deleteMany({
    where: {
      subject: {
        startsWith: "Activity link"
      }
    }
  });
}
