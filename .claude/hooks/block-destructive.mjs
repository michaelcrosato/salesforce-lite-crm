#!/usr/bin/env node
import { readInput, emitDeny, emitAllow, logEvent } from './_lib.mjs';

const input = await readInput();
const cmd = String(input.tool_input?.command || '').trim();

const patterns = [
  { re: /\brm\s+(-[a-zA-Z]*[rRf][a-zA-Z]*\s+)?\/(?!tmp\b|var\/folders\b)/, why: 'rm against root or system path' },
  { re: /\brm\s+(-[a-zA-Z]*[rRf][a-zA-Z]*\s+)?[*?]/, why: 'rm with wildcard' },
  { re: /\brm\s+-[a-zA-Z]*[rRf][a-zA-Z]*\s+(node_modules|\.git|\.next|dist|build|prisma)\b/, why: 'rm against a critical directory' },
  { re: /\bgit\s+push\s+[^|;&]*--force(-with-lease)?\b/, why: 'force push' },
  { re: /\bgit\s+push\s+[^|;&]*\s-f\b/, why: 'force push (-f)' },
  { re: /\bgit\s+reset\s+--hard\b/, why: 'hard reset (data loss risk)' },
  { re: /\bgit\s+clean\s+-[fdx]+/, why: 'git clean (data loss risk)' },
  { re: /\bgit\s+checkout\s+--\s+\./, why: 'git checkout -- . (discards changes)' },
  { re: /\bprisma\s+migrate\s+reset\b/, why: 'prisma migrate reset (destroys data)' },
  { re: /\bprisma\s+db\s+push\s+[^|;&]*--force-reset\b/, why: 'prisma force reset' },
  { re: /\bDROP\s+(DATABASE|TABLE|SCHEMA)\b/i, why: 'destructive SQL' },
  { re: /\bTRUNCATE\s+TABLE\b/i, why: 'truncate table' },
  { re: /:\(\)\s*{\s*:\s*\|\s*:\s*&\s*}\s*;\s*:/, why: 'fork bomb' },
  { re: /\bsudo\b/, why: 'sudo (out of scope for agent work)' },
  { re: /\b>\s*\/dev\/sd[a-z]/, why: 'write to raw disk' },
  { re: /\bcurl\b.*\|\s*(sudo\s+)?(bash|sh|zsh)\b/, why: 'pipe curl into shell' },
  { re: /\bnpm\s+publish\b/, why: 'npm publish' },
  { re: /\brm\s+.*\.env(\s|$)/, why: 'delete .env' }
];

for (const { re, why } of patterns) {
  if (re.test(cmd)) {
    logEvent('PreToolUse.deny', { tool: 'Bash', reason: why, command: cmd.slice(0, 200) });
    emitDeny(`Blocked destructive command (${why}). If genuinely required, add [DESTRUCTIVE OK <reason>] to the prompt referencing a PLAN.md entry, or use an approved cleanup script.`);
  }
}

emitAllow();
