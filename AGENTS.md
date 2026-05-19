# AGENTS.md

This repo is prepared for autonomous CLI-agent work. `PLAN.md` and
`CRM-CONTRACT.md` are the primary coordination files; this file is the short
handoff.

## Operating Policy

- Maximum YOLO / Continuous Mode:
  - Default: the current prompt can authorize a one-run exception.
  - Continuous Mode: when PLAN.md `Continuous: ON` or the active manager prompt explicitly enables unattended operation, do not stop after one feature. Use repo-local evidence, SUMMARY/BLOCKERS, PLAN.md, CRM-CONTRACT.md, .claude hooks, .cursor rules, and the local gate as governors.
  - Token usage is unconstrained by repo policy.
  - Do not wait for human/manual approval unless a documented stop condition is hit.
  - If blocked, repair within scope; if still blocked, write BLOCKERS with exact evidence and pivot to the next independent safe task.
  - Do not pass `--max-turns`, `--max-budget-usd`, or equivalent budget/iteration caps in unattended launches unless the user explicitly requests a cap.
- Keep changes scoped. Document cross-zone or prompt-authorized exceptions.
- Do not paste raw chat history into repo docs.
- Do not create product features during readiness or cleanup passes.

## Agent Roster

| Agent | Expected worktree | Branch ownership | Report files | Current local status |
|---|---|---|---|---|
| Codex | `C:\dev\salesforce-lite-crm` | `codex/` branches or current assigned branch | `SUMMARY.codex.md`, `BLOCKERS.codex.md` | registered at `codex/sprint-4-demo-seed-tuning`; clean as of `scripts/check-worktrees.ps1` on 2026-05-19 |
| Claude | `C:\dev\salesforce-lite-crm-claude` | `claude/` branches | `SUMMARY.claude.md`, `BLOCKERS.claude.md` | registered at `claude/autonomy`; has local untracked `tsconfig.tsbuildinfo` as of `scripts/check-worktrees.ps1` on 2026-05-19 |
| Grok | `C:\dev\salesforce-lite-crm-grok` | `grok/` branches | `SUMMARY.grok.md`, `BLOCKERS.grok.md` | registered at `grok/sprint-4-component-polish`; clean as of `scripts/check-worktrees.ps1` on 2026-05-19 |
| Gemini | `C:\dev\salesforce-lite-crm-gemini` | `gemini/` branches | `SUMMARY.gemini.md`, `BLOCKERS.gemini.md` | registered at `gemini/autonomy`; has local `next-env.d.ts`, `debug-analyst.ts`, and `tsconfig.tsbuildinfo` changes as of `scripts/check-worktrees.ps1` on 2026-05-19 |

Branch naming convention from `PLAN.md`: `<prefix>sprint-<id>-<feature-slug>`.
Current Sprint 4 next-push prompts are in `docs/NEXT-PROMPTS.md` and
`prompts/shared/s4-f*.md`.

## Ownership Zones

Shared coordination zones:

- `PLAN.md`, `CRM-CONTRACT.md`, `docs/decisions.md`
- `SUMMARY.<agent>.md` and `BLOCKERS.<agent>.md` schema
- `prisma/schema.prisma`, `prisma/schema.postgres.prisma`, `prisma.config.ts`
- `lib/types/`
- `.env.example`, `.gitignore`, `package.json`, `package-lock.json`
- framework config files such as `next.config.mjs`, `tsconfig.json`, `postcss.config.mjs`

Agent zones from `PLAN.md`:

- Codex: `lib/server/`, `lib/db/`, `lib/routing/`, `lib/forecast/`, `prisma/seed.ts`
- Claude: `app/**`
- Grok: `components/**`, `app/globals.css`, `tailwind.config.ts`
- Gemini: `tests/**`, `e2e/**`, `scripts/**`, `playwright.config.ts`, `vitest.config.ts`
- Each agent owns the contents of its own `SUMMARY` and `BLOCKERS` files.

Cross-zone edits are allowed only when they are the smallest direct way to
complete the current prompt. Record the reason in SUMMARY/BLOCKERS.

## Standard Gate

Run from the repo root:

```powershell
npm install
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
npx prisma generate
npx prisma db push
npm run seed
npm run test
npm run build
npx playwright install chromium
npm run test:e2e
```

There are no `lint`, `typecheck`, or `format` package scripts unless
`package.json` later adds them.

## Blocker Protocol

Use `BLOCKERS.<agent>.md` for unresolved repo-local blockers. Include file or
module, type (`ownership`, `gate`, `contract`, `dependency`), evidence, what
needs resolution, and the safe next action. Do not duplicate an existing open
blocker if the evidence is unchanged.

## Summary Protocol

Rewrite `SUMMARY.<agent>.md` each prompt using the schema in `PLAN.md`. Include
the branch, scope, commits this prompt, gate status, completed work, next
action, and scope confirmation.

## Product Guardrails

- No `/deals/[id]` route unless a later prompt explicitly promotes it.
  Deal detail stays in the `/deals?deal=<id>` drawer flow.
- `Lead` means consumer dealer-routed lead. Do not replace it with a generic
  B2B lead-conversion flow.
- Deterministic AI-style summarization remains default. Do not add external AI
  provider integration during cleanup or readiness work.
- Do not add auth, deployment, Salesforce integration, global search expansion,
  dealer order CRUD, area CRUD, or new product routes during readiness work.
