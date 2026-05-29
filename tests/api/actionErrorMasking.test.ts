import { Prisma } from "@prisma/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { actionErrorResult, logActionError } from "@/lib/action-result";
import { logger } from "@/lib/observability/logger";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  updateTag: vi.fn()
}));

// Isolated to this file: a minimal account delegate so the server action can
// reach its catch without touching the shared SQLite database.
vi.mock("@/lib/prisma", () => ({
  prisma: {
    account: {
      create: vi.fn()
    }
  }
}));

function knownRequestError(code: string): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError("boom", {
    code,
    clientVersion: "test"
  });
}

describe("actionErrorResult / logActionError", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("masks P2002 to the shared duplicate message and logs the real code", () => {
    const errorSpy = vi.spyOn(logger, "error").mockImplementation(() => {});

    const result = actionErrorResult(knownRequestError("P2002"), {
      action: "createThing",
      entity: "thing",
      fallbackMessage: "The thing could not be saved."
    });

    expect(result).toEqual({
      ok: false,
      message: "A record with that unique value already exists."
    });
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy.mock.calls[0]?.[0]).toBe("action_error");
    expect(errorSpy.mock.calls[0]?.[1]).toMatchObject({
      action: "createThing",
      entity: "thing",
      prismaCode: "P2002",
      message: "boom"
    });
  });

  it("maps a known non-P2002 code via knownCodes", () => {
    vi.spyOn(logger, "error").mockImplementation(() => {});

    const result = actionErrorResult(knownRequestError("P2025"), {
      action: "updateThing",
      entity: "thing",
      fallbackMessage: "The thing could not be saved.",
      knownCodes: {
        P2025: "The thing could not be found."
      }
    });

    expect(result).toEqual({
      ok: false,
      message: "The thing could not be found."
    });
  });

  it("falls back to the module message for an unmapped code but still logs it", () => {
    const errorSpy = vi.spyOn(logger, "error").mockImplementation(() => {});

    const result = actionErrorResult(knownRequestError("P2003"), {
      action: "createThing",
      entity: "thing",
      fallbackMessage: "The thing could not be saved."
    });

    expect(result).toEqual({
      ok: false,
      message: "The thing could not be saved."
    });
    expect(errorSpy.mock.calls[0]?.[1]).toMatchObject({ prismaCode: "P2003" });
  });

  it("logs prismaCode null for a non-Prisma error and masks to the fallback", () => {
    const errorSpy = vi.spyOn(logger, "error").mockImplementation(() => {});

    const result = actionErrorResult(new Error("kaboom"), {
      action: "createThing",
      entity: "thing",
      fallbackMessage: "The thing could not be saved."
    });

    expect(result).toEqual({
      ok: false,
      message: "The thing could not be saved."
    });
    expect(errorSpy.mock.calls[0]?.[1]).toMatchObject({
      prismaCode: null,
      message: "kaboom"
    });
  });

  it("logActionError returns the prisma code (or null) and logs the raw message", () => {
    const errorSpy = vi.spyOn(logger, "error").mockImplementation(() => {});

    expect(
      logActionError(knownRequestError("P2002"), {
        action: "a",
        entity: "e"
      })
    ).toBe("P2002");
    expect(logActionError("plain string", { action: "a", entity: "e" })).toBeNull();
    expect(errorSpy).toHaveBeenCalledTimes(2);
    expect(errorSpy.mock.calls[1]?.[1]).toMatchObject({
      prismaCode: null,
      message: "plain string"
    });
  });
});

describe("server action error masking (end-to-end)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("masks the user message but logs the Prisma code on a real action failure", async () => {
    const { createAccountAction } = await import("@/app/accounts/actions");
    const { prisma } = await import("@/lib/prisma");
    const errorSpy = vi.spyOn(logger, "error").mockImplementation(() => {});
    vi.mocked(prisma.account.create).mockRejectedValueOnce(
      knownRequestError("P2002")
    );

    const form = new FormData();
    form.set("name", "Probe Co");
    form.set("status", "active");
    form.set("healthScore", "75");

    const result = await createAccountAction(form);

    expect(result).toEqual({
      ok: false,
      message: "A record with that unique value already exists."
    });
    expect(prisma.account.create).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy.mock.calls[0]?.[1]).toMatchObject({
      action: "createAccount",
      entity: "account",
      prismaCode: "P2002"
    });
  });
});
