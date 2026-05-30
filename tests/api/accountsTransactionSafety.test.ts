import { afterEach, describe, expect, it, vi } from "vitest";
import { createAccountAction, updateAccountAction } from "@/app/accounts/actions";
import { logger } from "@/lib/observability/logger";

// Define our mock transaction client
const mockTx = {
  account: {
    create: vi.fn(),
    findUniqueOrThrow: vi.fn(),
    update: vi.fn()
  },
  auditEvent: {
    create: vi.fn()
  }
};

// Mock the Next.js cache APIs
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  updateTag: vi.fn()
}));

// Mock the database client to intercept the transaction and execute with mockTx
vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: vi.fn(async (fn) => {
      return fn(mockTx);
    })
  }
}));

describe("Accounts actions transaction safety", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("createAccountAction wraps creation and audit logging in a single successful transaction", async () => {
    const fakeAccount = {
      id: "acc-123",
      name: "Transaction Test Inc",
      domain: "transaction.test",
      industry: "Technology",
      city: "San Francisco",
      region: "CA",
      status: "active",
      ownerId: "user-ava",
      healthScore: 92,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    mockTx.account.create.mockResolvedValue(fakeAccount);
    mockTx.auditEvent.create.mockResolvedValue({ id: "audit-123" });

    const formData = new FormData();
    formData.append("name", "Transaction Test Inc");
    formData.append("domain", "transaction.test");
    formData.append("industry", "Technology");
    formData.append("city", "San Francisco");
    formData.append("region", "CA");
    formData.append("status", "active");
    formData.append("ownerId", "user-ava");
    formData.append("healthScore", "92");

    const result = await createAccountAction(formData);

    expect(result).toEqual({
      ok: true,
      message: "Account created: Transaction Test Inc."
    });

    expect(mockTx.account.create).toHaveBeenCalledTimes(1);
    expect(mockTx.account.create).toHaveBeenCalledWith({
      data: {
        name: "Transaction Test Inc",
        domain: "transaction.test",
        industry: "Technology",
        city: "San Francisco",
        region: "CA",
        status: "active",
        ownerId: "user-ava",
        healthScore: 92
      }
    });

    expect(mockTx.auditEvent.create).toHaveBeenCalledTimes(1);
    expect(mockTx.auditEvent.create).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          category: "record",
          action: "created",
          entityType: "account",
          entityId: "acc-123",
          summary: "Account created: Transaction Test Inc."
        })
      })
    );
  });

  it("updateAccountAction wraps update, status history check, and audit logging in a single successful transaction", async () => {
    const existingAccount = {
      id: "acc-123",
      name: "Old Account Name",
      domain: "transaction.test",
      industry: "Technology",
      city: "San Francisco",
      region: "CA",
      status: "active", // status will be changed to paused
      ownerId: "user-ava",
      healthScore: 92,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const updatedAccount = {
      ...existingAccount,
      name: "Transaction Test Inc",
      status: "paused"
    };

    mockTx.account.findUniqueOrThrow.mockResolvedValue(existingAccount);
    mockTx.account.update.mockResolvedValue(updatedAccount);
    mockTx.auditEvent.create.mockResolvedValue({ id: "audit-123" });

    const formData = new FormData();
    formData.append("name", "Transaction Test Inc");
    formData.append("domain", "transaction.test");
    formData.append("industry", "Technology");
    formData.append("city", "San Francisco");
    formData.append("region", "CA");
    formData.append("status", "paused");
    formData.append("ownerId", "user-ava");
    formData.append("healthScore", "92");

    const result = await updateAccountAction("acc-123", formData);

    expect(result).toEqual({
      ok: true,
      message: "Account updated: Transaction Test Inc."
    });

    expect(mockTx.account.findUniqueOrThrow).toHaveBeenCalledTimes(1);
    expect(mockTx.account.findUniqueOrThrow).toHaveBeenCalledWith({
      where: { id: "acc-123" }
    });

    expect(mockTx.account.update).toHaveBeenCalledTimes(1);
    expect(mockTx.auditEvent.create).toHaveBeenCalledTimes(1);
    expect(mockTx.auditEvent.create).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          category: "record",
          action: "status_changed",
          entityType: "account",
          entityId: "acc-123",
          summary: "Account status changed from active to paused."
        })
      })
    );
  });

  it("rolls back the entire transaction if the audit event write fails", async () => {
    vi.spyOn(logger, "error").mockImplementation(() => {});

    const fakeAccount = {
      id: "acc-123",
      name: "Will Be Rolled Back",
      domain: "transaction.test",
      industry: "Technology",
      city: "San Francisco",
      region: "CA",
      status: "active",
      ownerId: "user-ava",
      healthScore: 92,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    mockTx.account.create.mockResolvedValue(fakeAccount);
    // Mock the auditEvent write to throw an error, causing transaction rollback
    mockTx.auditEvent.create.mockRejectedValue(new Error("Audit database disk full"));

    const formData = new FormData();
    formData.append("name", "Will Be Rolled Back");
    formData.append("domain", "transaction.test");
    formData.append("industry", "Technology");
    formData.append("city", "San Francisco");
    formData.append("region", "CA");
    formData.append("status", "active");
    formData.append("ownerId", "user-ava");
    formData.append("healthScore", "92");

    const result = await createAccountAction(formData);

    // Verify the error is captured and masked properly
    expect(result).toEqual({
      ok: false,
      message: "The account could not be saved."
    });

    expect(mockTx.account.create).toHaveBeenCalledTimes(1);
    expect(mockTx.auditEvent.create).toHaveBeenCalledTimes(1);
  });
});
