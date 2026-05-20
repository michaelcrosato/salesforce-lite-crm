#!/usr/bin/env node
import { readInput, logEvent, emitAllow } from "./_lib.mjs";

const input = await readInput();
logEvent("PostToolUseFailure", {
  tool: input.tool_name,
  error: String(input.error || input.tool_response?.error || "").slice(0, 800),
  input: JSON.stringify(input.tool_input || {}).slice(0, 400)
});
emitAllow();
