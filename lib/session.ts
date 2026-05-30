import { cookies } from "next/headers";
import { prisma } from "./prisma";
import type { User } from "@prisma/client";

const DEV_USER_COOKIE_NAME = "dev_user_id";
const DEFAULT_USER_ID = "user-ava"; // Fallback to Ava Patel

let mockTestUserId: string | null = null;

/**
 * Set a mock user ID for test contexts where next/headers cookies are unavailable.
 */
export function setMockTestUserId(userId: string | null) {
  mockTestUserId = userId;
}

/**
 * Retrieves the current mock active user ID.
 * Defaults to "user-ava" (Ava Patel) if no cookie is set.
 */
export async function getCurrentUserId(): Promise<string> {
  if (process.env.NODE_ENV === "test" && mockTestUserId !== null) {
    return mockTestUserId;
  }

  try {
    const cookieStore = await cookies();
    const cookieValue = cookieStore.get(DEV_USER_COOKIE_NAME)?.value;
    return cookieValue || DEFAULT_USER_ID;
  } catch {
    // cookies() may throw in static build generation or headless unit tests
    return mockTestUserId || DEFAULT_USER_ID;
  }
}

/**
 * Resolves the full User object of the active session.
 */
export async function getCurrentUser(): Promise<User | null> {
  const userId = await getCurrentUserId();
  return prisma.user.findUnique({
    where: { id: userId },
  });
}

/**
 * Resolves simple metadata fields for user/role context checks.
 */
export async function getCurrentSession(): Promise<{
  userId: string;
  role: string;
  name: string;
  email: string;
} | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  return {
    userId: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
  };
}
