import { Prisma } from "@prisma/client";
import { logger } from "@/lib/observability/logger";

export type ActionResult =
  | {
      ok: true;
      message: string;
    }
  | {
      ok: false;
      message: string;
      fieldErrors?: Record<string, string[] | undefined>;
    };

const DUPLICATE_VALUE_MESSAGE =
  "A record with that unique value already exists.";

type ActionErrorContext = {
  action: string;
  entity: string;
  fallbackMessage: string;
  knownCodes?: Record<string, string>;
};

// Logs the real error (Prisma code + message) for overnight debugging, then
// returns the prismaCode (or null) so callers can map it. User-facing output
// is produced by the caller — this only captures what would otherwise be
// discarded by masking. Under NODE_ENV=test the logger is silent by default.
export function logActionError(
  error: unknown,
  context: { action: string; entity: string }
): string | null {
  const prismaCode =
    error instanceof Prisma.PrismaClientKnownRequestError ? error.code : null;
  const message = error instanceof Error ? error.message : String(error);

  logger.error("action_error", {
    action: context.action,
    entity: context.entity,
    prismaCode,
    message
  });

  return prismaCode;
}

// Logs the real error, then returns a masked ActionResult. P2002 maps to the
// shared duplicate-value message; any other known code maps via knownCodes;
// everything else falls back to the module-specific message.
export function actionErrorResult(
  error: unknown,
  context: ActionErrorContext
): ActionResult {
  const prismaCode = logActionError(error, context);

  if (prismaCode) {
    if (prismaCode === "P2002") {
      return { ok: false, message: DUPLICATE_VALUE_MESSAGE };
    }

    const mapped = context.knownCodes?.[prismaCode];
    if (mapped) {
      return { ok: false, message: mapped };
    }
  }

  return { ok: false, message: context.fallbackMessage };
}
