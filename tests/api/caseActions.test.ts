import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createCaseAction,
  deleteCaseAction,
  updateCaseAction,
  updateCaseStatusAction
} from "@/app/cases/actions";
import { prisma } from "@/lib/prisma";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn()
}));

const testCaseSubject = "Test Case Action Subject";

describe("Case Actions", () => {
  beforeEach(async () => {
    await cleanup();
  });

  afterEach(async () => {
    await cleanup();
  });

  it("creates a case", async () => {
    const result = await createCaseAction(
      formData({
        subject: testCaseSubject,
        description: "Case Desc",
        status: "new",
        priority: "normal"
      })
    );

    expect(result.ok).toBe(true);
    expect(result.message).toBe("Case created.");

    const created = await prisma.case.findFirst({
      where: { subject: testCaseSubject }
    });
    expect(created).not.toBeNull();
    expect(created?.status).toBe("new");
  });

  it("validates required fields for case creation", async () => {
    const result = await createCaseAction(
      formData({
        subject: "",
        status: "invalid_status"
      })
    );

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("Expected case validation to fail");
    }
    expect(result.fieldErrors).toBeDefined();
    expect(result.fieldErrors?.subject).toBeDefined();
  });

  it("updates a case", async () => {
    const caseItem = await prisma.case.create({
      data: {
        subject: testCaseSubject,
        status: "new"
      }
    });

    const result = await updateCaseAction(
      caseItem.id,
      formData({
        subject: "Updated Subject",
        status: "in_progress",
        priority: "high"
      })
    );

    expect(result.ok).toBe(true);

    const updated = await prisma.case.findUniqueOrThrow({
      where: { id: caseItem.id }
    });
    expect(updated.subject).toBe("Updated Subject");
    expect(updated.status).toBe("in_progress");
  });

  it("updates case status", async () => {
    const caseItem = await prisma.case.create({
      data: {
        subject: testCaseSubject,
        status: "new"
      }
    });

    const result = await updateCaseStatusAction(caseItem.id, "resolved");

    expect(result.ok).toBe(true);

    const updated = await prisma.case.findUniqueOrThrow({
      where: { id: caseItem.id }
    });
    expect(updated.status).toBe("resolved");
  });

  it("rejects invalid status", async () => {
    const result = await updateCaseStatusAction("some-id", "not-real");

    expect(result.ok).toBe(false);
    expect(result.message).toContain("Invalid status");
  });

  it("deletes a case", async () => {
    const caseItem = await prisma.case.create({
      data: {
        subject: testCaseSubject,
        status: "new"
      }
    });

    const result = await deleteCaseAction(caseItem.id);

    expect(result.ok).toBe(true);

    const deleted = await prisma.case.findUnique({
      where: { id: caseItem.id }
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
    where: { case: { subject: { in: [testCaseSubject, "Updated Subject"] } } }
  });
  await prisma.case.deleteMany({
    where: { subject: { in: [testCaseSubject, "Updated Subject"] } }
  });
}
