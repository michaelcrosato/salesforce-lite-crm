#!/usr/bin/env node
import { readInput, emitContext, emitAllow, projectDir } from "./_lib.mjs";
import { execSync } from "node:child_process";

const input = await readInput();
const path = String(
  input.tool_input?.file_path || input.tool_input?.path || ""
);

if (!/\.(ts|tsx|mts|cts)$/.test(path)) emitAllow();

try {
  execSync("npx --no-install tsc --noEmit --pretty false", {
    cwd: projectDir(),
    stdio: "pipe",
    timeout: 90_000
  });
  emitAllow();
} catch (e) {
  const out = (e.stdout?.toString() || "") + (e.stderr?.toString() || "");
  const lines = out.split("\n").filter((l) => /error TS\d+/.test(l));
  if (lines.length === 0) emitAllow();
  const relevant = lines.filter((l) => l.includes(path)).slice(0, 20);
  const others = lines.filter((l) => !l.includes(path)).slice(0, 8);
  const summary = [
    `TypeScript check after edit to ${path}:`,
    ...(relevant.length ? relevant : ["(no errors in this file)"]),
    others.length ? "- Other errors in the project:" : "",
    ...others,
    "",
    "Fix in-file errors before continuing. `any` and `@ts-ignore` are not allowed."
  ]
    .filter(Boolean)
    .join("\n");
  emitContext(summary);
}
