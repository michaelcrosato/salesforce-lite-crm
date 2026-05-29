#!/usr/bin/env node
// Spec 011 — reachability gate.
//
// Static import-graph analysis (no runtime, no deps). Builds the transitive
// closure of internal modules reachable from the live product roots (app/** and
// components/**), then reports any lib/server/*.ts module that is reachable ONLY
// from tests/** (or from nothing) — i.e. a "test-only orphan".
//
// Ratchet: the allowed-orphan set lives in scripts/reachability-baseline.json.
// A module that becomes a NEW orphan (not in the baseline) fails the gate, so
// the dead read-only "packet tower" cannot regrow. As orphans are wired or
// deleted, lower the baseline in the same commit.
//
// Usage: `node scripts/check-reachability.mjs` (exit 0 = ok, 1 = regrowth).
// If the baseline file is missing, the script seeds it from the current state
// and exits 0 (one-time bootstrap, mirroring the gate-integrity manifest).

import {
  existsSync,
  readdirSync,
  readFileSync,
  writeFileSync
} from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const baselinePath = join(repoRoot, "scripts", "reachability-baseline.json");

const EXCLUDED_DIRS = new Set([
  "node_modules",
  ".next",
  ".git",
  "agent-runs",
  "status",
  "coverage"
]);
const SOURCE_RE = /\.(ts|tsx)$/;
const DECL_RE = /\.d\.ts$/;

const toPosix = (p) => p.split("\\").join("/");

function walk(absDir, acc) {
  for (const entry of readdirSync(absDir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (entry.name.startsWith(".") || EXCLUDED_DIRS.has(entry.name)) continue;
      walk(join(absDir, entry.name), acc);
    } else if (
      entry.isFile() &&
      SOURCE_RE.test(entry.name) &&
      !DECL_RE.test(entry.name)
    ) {
      acc.push(toPosix(relative(repoRoot, join(absDir, entry.name))));
    }
  }
  return acc;
}

const fileSet = new Set(walk(repoRoot, []));

const TRY_SUFFIXES = ["", ".ts", ".tsx", ".js", ".jsx", "/index.ts", "/index.tsx"];

function resolveSpecifier(specifier, importerRel) {
  let baseRel;
  if (specifier.startsWith("@/")) {
    baseRel = specifier.slice(2);
  } else if (specifier.startsWith(".")) {
    baseRel = toPosix(
      relative(repoRoot, resolve(repoRoot, dirname(importerRel), specifier))
    );
  } else {
    return null; // bare / external package
  }

  for (const suffix of TRY_SUFFIXES) {
    const candidate = (baseRel + suffix).replace(/\/{2,}/g, "/");
    if (fileSet.has(candidate)) return candidate;
  }
  if (baseRel.endsWith(".js")) {
    const swapped = baseRel.replace(/\.js$/, ".ts");
    if (fileSet.has(swapped)) return swapped;
  }
  return null;
}

const SPECIFIER_RES = [
  /\bfrom\s*["']([^"']+)["']/g, // import ... from "x" / export ... from "x"
  /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g, // dynamic import("x")
  /\bimport\s+["']([^"']+)["']/g // side-effect import "x"
];

const edges = new Map();
for (const rel of fileSet) {
  const content = readFileSync(join(repoRoot, rel), "utf8");
  const targets = new Set();
  for (const re of SPECIFIER_RES) {
    re.lastIndex = 0;
    let match;
    while ((match = re.exec(content)) !== null) {
      const resolved = resolveSpecifier(match[1], rel);
      if (resolved) targets.add(resolved);
    }
  }
  edges.set(rel, targets);
}

const roots = [...fileSet].filter(
  (rel) => rel.startsWith("app/") || rel.startsWith("components/")
);

const visited = new Set();
const stack = [...roots];
while (stack.length > 0) {
  const current = stack.pop();
  if (visited.has(current)) continue;
  visited.add(current);
  const outs = edges.get(current);
  if (!outs) continue;
  for (const target of outs) {
    if (!visited.has(target)) stack.push(target);
  }
}

const orphans = [...fileSet]
  .filter((rel) => rel.startsWith("lib/server/") && !visited.has(rel))
  .sort();

if (!existsSync(baselinePath)) {
  const seed = {
    note: "Spec 011 reachability ratchet. allowedOrphans may only shrink; a NEW test-only lib/server orphan fails the gate. Lower maxOrphans + prune allowedOrphans in the same commit that wires or deletes a module.",
    maxOrphans: orphans.length,
    allowedOrphans: orphans
  };
  writeFileSync(baselinePath, `${JSON.stringify(seed, null, 2)}\n`);
  console.log(
    `Seeded ${baselinePath} with ${orphans.length} test-only lib/server orphan(s):`
  );
  for (const orphan of orphans) console.log(`  ${orphan}`);
  process.exit(0);
}

const baseline = JSON.parse(readFileSync(baselinePath, "utf8"));
const allowed = new Set(baseline.allowedOrphans ?? []);
const maxOrphans = baseline.maxOrphans ?? Number.POSITIVE_INFINITY;

const newOrphans = orphans.filter((orphan) => !allowed.has(orphan));
const clearedOrphans = [...allowed]
  .filter((orphan) => !orphans.includes(orphan))
  .sort();

let failed = false;

if (newOrphans.length > 0) {
  failed = true;
  console.error(
    "Reachability gate FAILED — new test-only lib/server orphan(s) introduced:"
  );
  for (const orphan of newOrphans) console.error(`  + ${orphan}`);
  console.error(
    "A lib/server module reachable only from tests/ may not be added. Wire it into app/** or components/**, or delete the module together with its test."
  );
}

if (orphans.length > maxOrphans) {
  failed = true;
  console.error(
    `Reachability gate FAILED — orphan count ${orphans.length} exceeds ratchet max ${maxOrphans}.`
  );
}

if (clearedOrphans.length > 0) {
  console.log(
    "Progress — baseline orphan(s) no longer test-only (wired or deleted). Lower the ratchet in scripts/reachability-baseline.json:"
  );
  for (const orphan of clearedOrphans) console.log(`  - ${orphan}`);
}

console.log(
  `Reachability: ${orphans.length} test-only lib/server orphan(s); ratchet max ${maxOrphans}.`
);
process.exit(failed ? 1 : 0);
