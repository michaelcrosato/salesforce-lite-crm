#!/usr/bin/env node
import { readInput, emitContext, safeRead, activeAgent, projectDir } from './_lib.mjs';
import { execSync } from 'node:child_process';
import { readdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

await readInput();
const agent = activeAgent();
const cwd = projectDir();

let branch = 'unknown', status = '';
try { branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd, stdio: 'pipe' }).toString().trim(); } catch {}
try { status = execSync('git status --short', { cwd, stdio: 'pipe' }).toString().trim(); } catch {}

const docs = ['PLAN.md', 'CRM-CONTRACT.md', 'AGENTS.md', 'CLAUDE.md', 'README.md', 'docs/LOCAL-GATE.md', `SUMMARY.${agent}.md`, `BLOCKERS.${agent}.md`];
const present = docs.filter((f) => safeRead(f));
const missing = docs.filter((f) => !safeRead(f));

let recent = '';
const logDir = resolve(cwd, '.claude', 'logs');
if (existsSync(logDir)) {
  const files = readdirSync(logDir).filter((f) => f.startsWith('session-')).sort().slice(-1);
  if (files[0]) {
    const lines = (safeRead(`.claude/logs/${files[0]}`) || '').trim().split('\n').slice(-5);
    recent = lines.join('\n');
  }
}

const ctx = [
  '=== Salesforce Lite CRM - session orientation ===',
  `Active agent: ${agent}`,
  `Branch: ${branch}`,
  `Working tree: ${status ? 'DIRTY:\n' + status : 'clean'}`,
  '',
  `Process docs present: ${present.join(', ') || '(none)'}`,
  missing.length ? `Process docs MISSING: ${missing.join(', ')}` : '',
  '',
  'Scripts available: dev, build, test, test:e2e, seed, prisma:postgres.',
  'Scripts NOT available (do not claim you ran them): lint, typecheck, format.',
  'Allowed quality claims: `npm run test`, `npm run build`, `npm run test:e2e`, `npx tsc --noEmit`.',
  '',
  'Out-of-scope reminders: /deals/[id] route, auth, external AI providers, dealer/area CRUD, deployment.',
  recent ? `Recent activity (last 5 events):\n${recent}` : ''
].filter(Boolean).join('\n');

emitContext(ctx);
