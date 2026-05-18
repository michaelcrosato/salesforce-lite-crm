// Shared helpers. Node stdlib only.
import { readFileSync, existsSync, appendFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

export async function readInput() {
  let data = '';
  process.stdin.setEncoding('utf8');
  for await (const chunk of process.stdin) data += chunk;
  try { return JSON.parse(data); } catch { return {}; }
}

export function projectDir() {
  return process.env.CLAUDE_PROJECT_DIR || process.cwd();
}

export function emitDeny(reason, eventName = 'PreToolUse') {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: eventName,
      permissionDecision: 'deny',
      permissionDecisionReason: reason
    }
  }));
  process.exit(0);
}

export function emitBlock(reason) {
  process.stdout.write(JSON.stringify({ decision: 'block', reason }));
  process.exit(0);
}

export function emitContext(additionalContext) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { additionalContext: String(additionalContext) }
  }));
  process.exit(0);
}

export function emitAllow() { process.exit(0); }

export function logEvent(name, payload = {}) {
  try {
    const dir = resolve(projectDir(), '.claude', 'logs');
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    const date = new Date().toISOString().slice(0, 10);
    const file = resolve(dir, `session-${date}.jsonl`);
    appendFileSync(file, JSON.stringify({
      ts: new Date().toISOString(),
      event: name,
      ...payload
    }) + '\n');
  } catch { /* never let logging crash a hook */ }
}

export function safeRead(path) {
  try {
    const p = resolve(projectDir(), path);
    if (!existsSync(p)) return null;
    return readFileSync(p, 'utf8');
  } catch { return null; }
}

export function activeAgent() {
  if (process.env.CLAUDE_AGENT) return process.env.CLAUDE_AGENT.toLowerCase();
  const f = safeRead('.claude/active-agent');
  if (f) return f.trim().toLowerCase();
  return 'claude';
}

// Minimal glob: supports ** and *. POSIX paths.
export function matchesGlob(path, pattern) {
  const norm = path.replace(/\\/g, '/').replace(/^\.\//, '');
  const re = new RegExp('^' + pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '\x00')
    .replace(/\*/g, '[^/]*')
    .replace(/\x00/g, '.*') + '$');
  return re.test(norm);
}
