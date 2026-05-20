#!/usr/bin/env node
import { readInput, emitDeny, emitAllow, logEvent } from "./_lib.mjs";

const input = await readInput();
const path = String(
  input.tool_input?.file_path || input.tool_input?.path || ""
);
const taskContext = String(
  (input.transcript || "") + (input.user_prompt || "")
);

const protectedPaths = [
  { match: /(^|\/)\.env(\.|$)/, why: ".env file" },
  { match: /(^|\/)package-lock\.json$/, why: "package-lock.json" },
  { match: /(^|\/)pnpm-lock\.yaml$/, why: "pnpm-lock.yaml" },
  { match: /(^|\/)yarn\.lock$/, why: "yarn.lock" },
  {
    match: /(^|\/)prisma\/dev\.db(-journal|-wal|-shm)?$/,
    why: "sqlite database file"
  },
  { match: /(^|\/)prisma\/schema\.prisma$/, why: "prisma schema" },
  {
    match: /(^|\/)prisma\/schema\.postgres\.prisma$/,
    why: "prisma postgres schema"
  },
  { match: /(^|\/)\.git\//, why: ".git internals" },
  {
    match: /(^|\/)next-env\.d\.ts$/,
    why: "next-env.d.ts (next generates this)"
  }
];

const seedGuard = {
  match: /(^|\/)prisma\/seed\.ts$/,
  why: "prisma/seed.ts",
  allowTag: "[SEED CHANGE]"
};

for (const p of protectedPaths) {
  if (p.match.test(path)) {
    logEvent("PreToolUse.deny", { tool: "Write/Edit", path, reason: p.why });
    emitDeny(
      `Blocked write to ${p.why} (${path}). Protected file. Requires explicit scope tag AND a docs/schema-changelog.md entry.`
    );
  }
}

if (seedGuard.match.test(path) && !taskContext.includes(seedGuard.allowTag)) {
  logEvent("PreToolUse.deny", {
    tool: "Write/Edit",
    path,
    reason: "seed.ts without [SEED CHANGE] tag"
  });
  emitDeny(
    `Blocked write to ${seedGuard.why}. Add ${seedGuard.allowTag} to the prompt to authorize. Also add a one-line entry to docs/schema-changelog.md. V5K 0A1 routing must remain deterministic.`
  );
}

emitAllow();
