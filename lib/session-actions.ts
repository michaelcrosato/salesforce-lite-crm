"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

const DEV_USER_COOKIE_NAME = "dev_user_id";

/**
 * Server Action to switch the current active mock developer identity.
 * Sets the 'dev_user_id' cookie and triggers a root revalidation.
 */
export async function setCurrentUserAction(userId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(DEV_USER_COOKIE_NAME, userId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });
  revalidatePath("/");
}

/**
 * Server Action to clear the custom mock developer identity.
 * Deletes the cookie and triggers a root revalidation (defaulting back to user-ava).
 */
export async function clearCurrentUserAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(DEV_USER_COOKIE_NAME);
  revalidatePath("/");
}
