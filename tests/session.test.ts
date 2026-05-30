import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  getCurrentUser,
  getCurrentUserId,
  getCurrentSession,
  setMockTestUserId,
} from "@/lib/session";

describe("Developer Identity Session Utilities", () => {
  beforeEach(() => {
    // Reset any mock user ID overrides before each test
    setMockTestUserId(null);
  });

  afterEach(() => {
    // Clean up mock override after each test
    setMockTestUserId(null);
  });

  describe("getCurrentUserId", () => {
    it("defaults to user-ava if no mock is configured", async () => {
      const userId = await getCurrentUserId();
      expect(userId).toBe("user-ava");
    });

    it("respects mock custom active user ID when configured", async () => {
      setMockTestUserId("user-marcus");
      const userId = await getCurrentUserId();
      expect(userId).toBe("user-marcus");
    });
  });

  describe("getCurrentUser", () => {
    it("successfully queries Ava Patel from seeded database", async () => {
      setMockTestUserId("user-ava");
      const user = await getCurrentUser();
      expect(user).not.toBeNull();
      expect(user?.name).toBe("Ava Patel");
      expect(user?.role).toBe("sales");
    });

    it("successfully queries Elena Ramirez from seeded database", async () => {
      setMockTestUserId("user-elena");
      const user = await getCurrentUser();
      expect(user).not.toBeNull();
      expect(user?.name).toBe("Elena Ramirez");
      expect(user?.role).toBe("manager");
    });

    it("returns null for non-existent mock user IDs", async () => {
      setMockTestUserId("user-invalid");
      const user = await getCurrentUser();
      expect(user).toBeNull();
    });
  });

  describe("getCurrentSession", () => {
    it("resolves exact session details for Marcus Chen", async () => {
      setMockTestUserId("user-marcus");
      const session = await getCurrentSession();
      expect(session).not.toBeNull();
      expect(session?.userId).toBe("user-marcus");
      expect(session?.name).toBe("Marcus Chen");
      expect(session?.role).toBe("sales");
      expect(session?.email).toBe("marcus.chen@salesforcelite.local");
    });

    it("returns null when user is non-existent", async () => {
      setMockTestUserId("user-invalid");
      const session = await getCurrentSession();
      expect(session).toBeNull();
    });
  });
});
