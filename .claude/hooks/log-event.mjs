#!/usr/bin/env node
import { readInput, logEvent, emitAllow } from './_lib.mjs';

const eventName = process.argv[2] || 'Unknown';
const input = await readInput();

const payload = {
  tool: input.tool_name,
  input_summary: JSON.stringify(input.tool_input || {}).slice(0, 300),
  prompt_summary: String(input.prompt || '').slice(0, 300)
};

for (const k of Object.keys(payload)) if (!payload[k] || payload[k] === '""') delete payload[k];

logEvent(eventName, payload);
emitAllow();
