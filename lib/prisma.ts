import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL ?? "file:./prisma/dev.db";

  if (
    databaseUrl.startsWith("postgres://") ||
    databaseUrl.startsWith("postgresql://")
  ) {
    return new PrismaClient({
      // @ts-expect-error - generated client for sqlite types datasources as never
      datasources: {
        db: {
          url: databaseUrl
        }
      },
      log:
        process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"]
    });
  }

  const adapter = new PrismaBetterSqlite3({
    url: databaseUrl
  } as any);

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"]
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
