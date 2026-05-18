#!/usr/bin/env node
import { readInput, emitBlock, emitAllow, projectDir, safeRead, activeAgent, logEvent } from './_lib.mjs';
import { execSync } from 'node:child_process';

const input = await readInput();

// Documented loop guard. CRITICAL - without this, Stop recurses on its own block reply.
// Note: stop_hook_active was undocumented as of API check in IMPLEMENTATION-NOTES; the
// guard is harmless if the field is absent (undefined is falsy and we proceed).
if (input.stop_hook_active) emitAllow();

const cwd = projectDir();

function run(cmd, timeoutMs) {
  try {
    execSync(cmd, { cwd, stdio: 'pipe', timeout: timeoutMs });
    return null;
  } catch (e) {
    const out = ((e.stdout?.toString() || '') + (e.stderr?.toString() || '')).slice(-2000);
    return out || `exited ${e.status}`;
  }
}

// 1. Vitest
const vitestErr = run('npm run test --silent', 180_000);
if (vitestErr) {
  logEvent('Stop.block', { reason: 'vitest failing' });
  emitBlock(`Cannot stop - vitest failing:\n${vitestErr}\n\nFix or add tests before completing.`);
}

// 2. Build
const buildErr = run('npm run build --silent', 240_000);
if (buildErr) {
  logEvent('Stop.block', { reason: 'build failing' });
  emitBlock(`Cannot stop - \`npm run build\` failing:\n${buildErr}`);
}

// 3. Scope scan against changed files
let changed = [];
try {
  changed = execSync('git status --porcelain', { cwd }).toString()
    .split('\n').map((l) => l.slice(3).trim()).filter(Boolean);
} catch { /* not a git repo or git unavailable */ }

const scopeChecks = [
  { re: /^app\/deals\/\[id\]\//, why: '/deals/[id] route is out of scope (current spec: drawer at /deals?deal=<id>)' },
  { re: /\b(openai|anthropic-sdk|@google\/generative-ai|gemini-pro|claude-3|gpt-4|grok-api)\b/i, why: 'external AI provider integration is out of scope' }
];

for (const f of changed) {
  for (const c of scopeChecks) {
    if (c.re.test(f)) {
      logEvent('Stop.block', { reason: 'scope', file: f, why: c.why });
      emitBlock(`Cannot stop - out-of-scope change (${c.why}): ${f}. Remove the change OR promote it into PLAN.md.`);
    }
  }
}

// 4. SUMMARY/BLOCKERS soft check
const agent = activeAgent();
if (!safeRead(`SUMMARY.${agent}.md`)) {
  logEvent('Stop.warn', { reason: `SUMMARY.${agent}.md missing` });
}

emitAllow();
