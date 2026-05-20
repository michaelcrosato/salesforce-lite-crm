import { readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const schemaPath = join(process.cwd(), "prisma", "schema.prisma");
const postgresSchemaPath = join(
  process.cwd(),
  "prisma",
  "schema.postgres.prisma"
);
const originalSchema = readFileSync(schemaPath, "utf8");
const postgresSchema = readFileSync(postgresSchemaPath, "utf8");

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    shell: true,
    stdio: "inherit"
  });

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed.`);
  }
}

try {
  writeFileSync(schemaPath, postgresSchema);
  run("npx", ["prisma", "generate"]);
  run("npx", ["prisma", "db", "push"]);
} finally {
  writeFileSync(schemaPath, originalSchema);
  run("npx", ["prisma", "generate"]);
}
