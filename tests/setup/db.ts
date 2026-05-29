import { copyFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const poolId = process.env.VITEST_POOL_ID || "1";
const dbDir = join(process.cwd(), "prisma", ".test-dbs");
const templateDbPath = join(dbDir, "template.db");
const workerDbPath = join(dbDir, `worker-${poolId}.db`);

// Set DATABASE_URL for this worker thread/process
process.env.DATABASE_URL = `file:${workerDbPath}`;

// Copy template database to worker database if it doesn't exist yet
if (!existsSync(workerDbPath)) {
  if (existsSync(templateDbPath)) {
    copyFileSync(templateDbPath, workerDbPath);
  } else {
    throw new Error(`Template database not found at ${templateDbPath}. Ensure global setup runs successfully.`);
  }
}
