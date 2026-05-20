#!/usr/bin/env node
import {
  readInput,
  emitDeny,
  emitAllow,
  logEvent,
  safeRead,
  activeAgent,
  matchesGlob
} from "./_lib.mjs";

const input = await readInput();
const path = String(input.tool_input?.file_path || input.tool_input?.path || "")
  .replace(/\\/g, "/")
  .replace(/^\.\//, "");
const agent = activeAgent();
const taskContext = String(
  (input.transcript || "") + (input.user_prompt || "")
);

const zonesRaw = safeRead(".claude/zones.json");
if (!zonesRaw) {
  logEvent("PreToolUse.warn", {
    reason: "zones.json missing - zone enforcement skipped",
    path
  });
  emitAllow();
}

let zones;
try {
  zones = JSON.parse(zonesRaw);
} catch {
  logEvent("PreToolUse.warn", {
    reason: "zones.json malformed - zone enforcement skipped",
    path
  });
  emitAllow();
}

// Case-insensitive lookup so CLAUDE_AGENT=Claude and active-agent=claude both work.
const zonesLower = {};
for (const [k, v] of Object.entries(zones)) zonesLower[k.toLowerCase()] = v;

const myZone = zonesLower[agent.toLowerCase()] || [];
const sharedZone = zonesLower.shared || [];
const allowed = [...myZone, ...sharedZone];

const inAllowed = allowed.some((g) => matchesGlob(path, g));
if (inAllowed) emitAllow();

const inOtherZone = Object.entries(zonesLower)
  .filter(([k]) => k !== agent.toLowerCase() && k !== "shared")
  .some(([, globs]) => globs.some((g) => matchesGlob(path, g)));

if (inOtherZone && !taskContext.includes("[CROSS-ZONE OK")) {
  logEvent("PreToolUse.deny", {
    tool: "Write/Edit",
    path,
    agent,
    reason: "cross-zone without [CROSS-ZONE OK]"
  });
  emitDeny(
    `Agent ${agent} does not own ${path}. Add [CROSS-ZONE OK <reason>] to the prompt to override, then log in BLOCKERS.${agent}.md.`
  );
}

logEvent("PreToolUse.warn", { path, agent, reason: "unzoned path - allowed" });
emitAllow();
