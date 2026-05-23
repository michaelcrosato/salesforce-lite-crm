import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createCase,
  deleteCase,
  getCase,
  listCases,
  updateCase
} from "@/lib/services/cases";
import { resolveCase as resolveCaseViaClient } from "@/lib/crm/crmClient";
import { prisma } from "@/lib/prisma";

const ownerId = "test-case-owner";
const otherOwnerId = "test-case-other-owner";
const accountId = "test-case-account";
const otherAccountId = "test-case-other-account";

describe("cases service", () => {
  beforeEach(async () => {
    await cleanupCases();
    await createOwner(ownerId, "Case Owner");
    await createOwner(otherOwnerId, "Other Case Owner");
    await createAccount(accountId, "Case Account");
    await createAccount(otherAccountId, "Other Case Account");
  });

  afterEach(async () => {
    await cleanupCases();
  });

  it("creates a case with validated defaults", async () => {
    const crmCase = await createCase({
      subject: "Case service create",
      accountId,
      ownerId
    });

    expect(crmCase.subject).toBe("Case service create");
    expect(crmCase.status).toBe("new");
    expect(crmCase.priority).toBe("normal");
    expect(crmCase.accountId).toBe(accountId);

    const audit = await prisma.auditEvent.findFirstOrThrow({
      where: {
        action: "created",
        entityId: crmCase.id,
        entityType: "case"
      }
    });
    expect(audit.category).toBe("record");
    expect(audit.actorUserId).toBeNull();
    expect(audit.summary).toBe("Case created: Case service create.");
    expect(auditMetadata(audit)).toMatchObject({
      accountId,
      ownerId,
      priority: "normal",
      status: "new",
      subject: "Case service create"
    });
  });

  it("lists cases with status, owner, and account filters", async () => {
    const matching = await createCase({
      subject: "Case service matching",
      accountId,
      ownerId,
      status: "new"
    });
    await createCase({
      subject: "Case service wrong status",
      accountId,
      ownerId,
      status: "closed"
    });
    await createCase({
      subject: "Case service wrong owner",
      accountId,
      ownerId: otherOwnerId,
      status: "new"
    });
    await createCase({
      subject: "Case service wrong account",
      accountId: otherAccountId,
      ownerId,
      status: "new"
    });

    const cases = await listCases({
      status: "new",
      ownerId,
      accountId
    });

    expect(cases.map((crmCase) => crmCase.id)).toEqual([matching.id]);
  });

  it("gets and updates a case", async () => {
    const crmCase = await createCase({
      subject: "Case service update",
      accountId,
      ownerId
    });

    const updated = await updateCase(crmCase.id, {
      subject: "Case service updated",
      priority: "urgent",
      status: "waiting"
    });
    const fetched = await getCase(crmCase.id);

    expect(updated.subject).toBe("Case service updated");
    expect(updated.priority).toBe("urgent");
    expect(fetched?.status).toBe("waiting");

    const audit = await prisma.auditEvent.findFirstOrThrow({
      where: {
        action: "status_changed",
        entityId: crmCase.id,
        entityType: "case"
      }
    });
    expect(audit.category).toBe("record");
    expect(audit.summary).toBe("Case status changed from new to waiting.");
    expect(auditMetadata(audit)).toMatchObject({
      changedFields: ["priority", "status", "subject"],
      previousStatus: "new",
      status: "waiting",
      subject: "Case service updated"
    });
  });

  it("resolves a case through the crmClient adapter", async () => {
    const crmCase = await createCase({
      subject: "Case service resolve",
      accountId,
      ownerId,
      status: "in_progress"
    });

    const resolved = await resolveCaseViaClient(crmCase.id);

    expect(resolved.status).toBe("resolved");

    const audit = await prisma.auditEvent.findFirstOrThrow({
      where: {
        action: "case_resolved",
        entityId: crmCase.id,
        entityType: "case"
      }
    });
    expect(audit.category).toBe("workflow");
    expect(audit.summary).toBe("Case resolved: Case service resolve.");
    expect(auditMetadata(audit)).toMatchObject({
      previousStatus: "in_progress",
      status: "resolved"
    });
  });

  it("deletes a case", async () => {
    const crmCase = await createCase({
      subject: "Case service delete",
      accountId,
      ownerId
    });

    await deleteCase(crmCase.id);

    expect(await getCase(crmCase.id)).toBeNull();
  });

  it("rejects invalid create, update, and list inputs", async () => {
    await expect(
      createCase({
        subject: "",
        accountId
      })
    ).rejects.toThrow();
    await expect(
      updateCase("missing-case", {
        priority: "invalid"
      })
    ).rejects.toThrow();
    await expect(
      listCases({
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

async function createAccount(id: string, name: string) {
  await prisma.account.create({
    data: {
      id,
      name,
      status: "active",
      healthScore: 80
    }
  });
}

async function cleanupCases() {
  await prisma.auditEvent.deleteMany({
    where: {
      OR: [
        {
          entityType: "case",
          summary: {
            contains: "Case service"
          }
        },
        {
          entityType: "case",
          metadata: {
            contains: "Case service"
          }
        }
      ]
    }
  });
  await prisma.case.deleteMany({
    where: {
      OR: [
        {
          subject: {
            startsWith: "Case service"
          }
        },
        {
          ownerId: {
            in: [ownerId, otherOwnerId]
          }
        },
        {
          accountId: {
            in: [accountId, otherAccountId]
          }
        }
      ]
    }
  });
  await prisma.account.deleteMany({
    where: {
      id: {
        in: [accountId, otherAccountId]
      }
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
