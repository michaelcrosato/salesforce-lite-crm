#!/usr/bin/env node
import { readInput, emitBlock, emitAllow, logEvent } from "./_lib.mjs";

const input = await readInput();
const target = String(input.target_file || input.file_path || input.path || "");
const newContent = String(input.new_content || input.content || "");
const taskContext = String(
  (input.transcript || "") + (input.user_prompt || "")
);

const isClaudeConfig =
  /(^|\/)\.claude\/settings\.json$/.test(target) ||
  /(^|\/)\.claude\/hooks\//.test(target) ||
  /(^|\/)\.claude\/zones\.json$/.test(target);
if (!isClaudeConfig) emitAllow();

if (!taskContext.includes("[CONFIG CHANGE]")) {
  logEvent("ConfigChange.block", { target, reason: "no [CONFIG CHANGE] tag" });
  emitBlock(
    `Blocked edit to ${target}. The hook configuration is part of the runtime safety layer. Add [CONFIG CHANGE] tag to the prompt with an explicit reason, and log in BLOCKERS.<agent>.md.`
  );
}

const weakening = [
  { re: /"PreToolUse"\s*:\s*\[\s*\]/, why: "removed all PreToolUse hooks" },
  { re: /"Stop"\s*:\s*\[\s*\]/, why: "removed Stop gate" },
  {
    re: /"ConfigChange"\s*:\s*\[\s*\]/,
    why: "removed ConfigChange self-protection"
  }
];

if (target.endsWith("settings.json") && newContent) {
  for (const w of weakening) {
    if (w.re.test(newContent)) {
      logEvent("ConfigChange.block", { target, reason: w.why });
      emitBlock(
        `Blocked: change would ${w.why}. Critical safety boundary. Operator sign-off required in BLOCKERS file before proceeding.`
      );
    }
  }
}

if (
  target.endsWith("protect-files.mjs") &&
  newContent &&
  newContent.length < 1200
) {
  logEvent("ConfigChange.block", {
    target,
    reason: "protect-files.mjs shrunk significantly"
  });
  emitBlock(
    `Blocked: protect-files.mjs change shrinks the file substantially. Review whether protected paths (.env, lockfile, dev.db, seed.ts, schema) were removed.`
  );
}

logEvent("ConfigChange.allow", { target, reason: "tagged config change" });
emitAllow();
