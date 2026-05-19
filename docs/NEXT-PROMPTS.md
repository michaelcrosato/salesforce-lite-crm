# Next Prompts

Status: prepared for the next Sprint 4 implementation push after the current
readiness pass.

`README.md` has been updated to reflect the current product vision: a
full-fledged, AI-adaptive Salesforce-style CRM for small business requirements,
designed for autonomous AI-agent development.

These prompts must remain subordinate to `PLAN.md` and `CRM-CONTRACT.md`. They
do not authorize product scope beyond Sprint 4. Do not add authentication,
deployment, Salesforce integration, external AI provider integration, global
search expansion, dealer order CRUD, area CRUD, a `/deals/[id]` route, or new
product routes during Sprint 4 unless a later prompt explicitly promotes that
work.

## Codex Next Prompt

Target: S4-F1 - Demo seed tuning.

Worktree and branch:

- Worktree: `C:\dev\salesforce-lite-crm`
- Branch: `codex/sprint-4-demo-seed-tuning` or the current assigned Codex
  branch from `PLAN.md`.

Scope:

- Primary zone: `prisma/seed.ts`, `lib/routing/`, `lib/forecast/`, and related
  Codex-owned server/business helpers only if needed.
- Keep schema unchanged unless the current prompt explicitly authorizes schema
  work.
- Tune existing seed data so the README reference workflow is reliable:
  Vancouver lead routing for `V5K 0A1`, behind-pace dealer orders, stale
  high-value opportunities, low-health dealer accounts, and deterministic
  analyst actions.

Required checks:

```powershell
npx prisma generate
npx prisma db push
npm run seed
npm run lint
npm run test
npm run build
npx playwright install chromium
npm run test:e2e
```

Report files:

- Rewrite `SUMMARY.codex.md`.
- Rewrite `BLOCKERS.codex.md`.

## Claude Next Prompt

Target: S4-F2 - Route visual QA.

Worktree and branch:

- Worktree: `C:\dev\salesforce-lite-crm-claude`
- Branch: `claude/sprint-4-route-visual-qa` or the current assigned Claude
  branch from `PLAN.md`.

Scope:

- Primary zone: `app/**`.
- Verify implemented routes render coherently: `/dashboard`, `/leads`,
  `/leads/<id>`, `/orders`, `/orders/<id>`, `/areas`, `/forecast`,
  `/accounts`, `/accounts/<id>`, `/contacts`, `/contacts/<id>`, `/deals`,
  `/activities`, `/tasks`, `/cases`, `/campaigns`, `/reports`, and
  representative report detail pages.
- Visual fixes must not change business logic or introduce new routes.
- Preserve the `/deals?deal=<id>` drawer flow. Do not add `/deals/[id]`.
- Confirm excluded routes remain excluded or placeholder-only: `/deals/[id]`,
  `/search`, `/command-palette`, `/orders/new`, `/orders/[id]/edit`,
  `/areas/new`, and `/areas/[id]/edit`.

Required checks:

```powershell
npm run build
npm run lint
npx playwright install chromium
npm run test:e2e
```

Report files:

- Rewrite `SUMMARY.claude.md`.
- Rewrite `BLOCKERS.claude.md`.

## Grok Next Prompt

Target: S4-F3 - Component polish.

Worktree and branch:

- Worktree: `C:\dev\salesforce-lite-crm-grok`
- Branch: `grok/sprint-4-component-polish` or the current assigned Grok branch
  from `PLAN.md`.

Scope:

- Primary zone: `components/**`, `app/globals.css`, and `tailwind.config.ts`.
- Polish shared components used by the implemented CRM workflows for stable
  spacing, readable empty states, deterministic ordering, accessible labels, and
  no broken links or orphaned actions.
- Do not change business logic, Prisma schema, or route contracts.

Required checks:

```powershell
npm run build
npm run lint
npx playwright install chromium
npm run test:e2e
```

Report files:

- Rewrite `SUMMARY.grok.md`.
- Rewrite `BLOCKERS.grok.md`.

## Gemini Next Prompt

Target: S4-F4 - Demo smoke and gate hardening.

Worktree and branch:

- Worktree: `C:\dev\salesforce-lite-crm-gemini`
- Branch: `gemini/sprint-4-demo-smoke-gate-hardening`.
- If the Gemini worktree is still missing, follow `docs/WORKTREE-SETUP.md` and
  `scripts/check-worktrees.ps1` before editing files.

Scope:

- Primary zone: `tests/**`, `e2e/**`, `scripts/**`, `playwright.config.ts`,
  and `vitest.config.ts`.
- Harden smoke coverage for the README reference workflow, implemented CRM
  routes, and excluded-route guard rails.
- Keep the local gate documented in `docs/LOCAL-GATE.md` accurate. Do not add
  package scripts unless the current prompt explicitly authorizes package
  changes.

Required checks:

```powershell
npm install
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
npx prisma generate
npx prisma db push
npm run seed
npm run lint
npm run test
npm run build
npx playwright install chromium
npm run test:e2e
```

Report files:

- Rewrite `SUMMARY.gemini.md`.
- Rewrite `BLOCKERS.gemini.md`.

## IFT Review Prompt

Use after Sprint 4 branches report their local gate status.

Review inputs:

- `PLAN.md`
- `CRM-CONTRACT.md`
- `README.md`
- `docs/PROJECT-CONTROL.md`
- `docs/MERGE-PLAYBOOK.md`
- `docs/LOCAL-GATE.md`
- Each agent's latest `SUMMARY.<agent>.md`
- Each agent's latest `BLOCKERS.<agent>.md`

Review goals:

- Confirm Sprint 4 work stayed within `PLAN.md` and `CRM-CONTRACT.md`.
- Confirm no branch introduced deferred scope such as auth, deployment,
  Salesforce integration, external AI provider integration, global search
  expansion, dealer order CRUD, area CRUD, `/deals/[id]`, or new product routes.
- Compare gate results and unresolved blockers before merge planning.
- Recommend a merge order only when supported by repo-local evidence and local
  gate output.
