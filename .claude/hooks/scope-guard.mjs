#!/usr/bin/env node
import { readInput, emitBlock, emitContext, safeRead, activeAgent } from './_lib.mjs';

const input = await readInput();
const prompt = String(input.prompt || '').toLowerCase();

const danger = [
  { re: /\b(go wild|refactor everything|fix whatever|clean it (all )?up|nuke|reset everything)\b/, why: 'Unbounded scope phrase' },
  { re: /\bdeploy to production\b/, why: 'Production deployment is out of scope' },
  { re: /\b(openai|anthropic api|gemini api|grok api|gpt-4|claude-3)\b/, why: 'External AI provider integration is out of scope' },
  { re: /\/deals\/\[id\]/, why: 'Out of scope - current spec is drawer at /deals?deal=<id>' },
  { re: /\b(turn off|disable|remove)\b.*\bhook/, why: 'Disabling hooks requires [CONFIG CHANGE] flow' }
];

const tagged = /\[(SCOPE EXPANSION OK|DESTRUCTIVE OK|CROSS-ZONE OK|SEED CHANGE|CONFIG CHANGE)/.test(input.prompt || '');

for (const d of danger) {
  if (d.re.test(prompt) && !tagged) {
    emitBlock(`Prompt blocked by scope guard (${d.why}). If genuinely intended: (1) update PLAN.md to promote it into scope, (2) add an explicit scope tag like [SCOPE EXPANSION OK <reason>] to the prompt.`);
  }
}

const agent = activeAgent();
const plan = safeRead('PLAN.md');
const contract = safeRead('CRM-CONTRACT.md');

const ctx = [
  `[scope-guard] Active agent: ${agent}`,
  'No npm scripts exist for lint/typecheck/format. Allowed quality claims: `npm run test`, `npm run build`, `npm run test:e2e`, `npx tsc --noEmit`.',
  plan ? `PLAN.md present (${plan.length} chars).` : 'PLAN.md missing - operating without sprint plan context.',
  contract ? 'CRM-CONTRACT.md present.' : 'CRM-CONTRACT.md missing.',
  'Out of scope: /deals/[id] route, auth, external AI providers, dealer/area CRUD, deployment.'
].join('\n');

emitContext(ctx);
