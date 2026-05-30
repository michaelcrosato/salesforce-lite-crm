import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { SessionSwitcherClient } from "./session-switcher-client";

/**
 * Server Component wrapper that reads the active user from session cookies,
 * queries all seeded users, and passes them to the interactive client session switcher.
 */
export async function SessionSwitcher() {
  const currentUserId = await getCurrentUserId();
  const users = await prisma.user.findMany({
    orderBy: { name: "asc" },
  });

  const currentUser = users.find((u) => u.id === currentUserId) || null;

  return (
    <SessionSwitcherClient
      users={users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
      }))}
      currentUser={
        currentUser
          ? {
              id: currentUser.id,
              name: currentUser.name,
              email: currentUser.email,
              role: currentUser.role,
            }
          : null
      }
    />
  );
}
