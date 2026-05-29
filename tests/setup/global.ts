import { execSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";

export default function setup() {
  const dbDir = join(process.cwd(), "prisma", ".test-dbs");
  
  // Clean up any old test databases
  if (existsSync(dbDir)) {
    rmSync(dbDir, { recursive: true, force: true });
  }
  mkdirSync(dbDir, { recursive: true });

  const templateDbPath = join(dbDir, "template.db");

  // Create template database schema
  execSync(`npx prisma db push --accept-data-loss --force-reset`, {
    env: { ...process.env, DATABASE_URL: `file:${templateDbPath}` },
    stdio: "ignore"
  });

  // Seed the template database
  execSync(`npx tsx prisma/seed.ts`, {
    env: { ...process.env, DATABASE_URL: `file:${templateDbPath}` },
    stdio: "ignore"
  });
}
