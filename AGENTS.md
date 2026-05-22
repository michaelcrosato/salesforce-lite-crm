# AGENTS.md

This repo is prepared for autonomous CLI-agent work. `PLAN.md` and
`CRM-CONTRACT.md` are the primary coordination files. `docs/PROJECT-CONTROL.md`
and `docs/LOCAL-GATE.md` are the current state and validation references. This
file is the short handoff.

## Operating Policy

- Maximum YOLO mode: the current prompt can authorize a one-run exception.
- Do not wait for human/manual approval as a hard blocker. Use repo-local
  evidence, the current prompt, SUMMARY/BLOCKERS, and the local gate.
- Keep changes scoped. In parallel mode, document cross-zone or
  prompt-authorized exceptions.
- Do not paste raw chat history into repo docs.
- Do not create product features during readiness or cleanup passes.

## Execution Topology

The worktree path decides whether ownership zones are mandatory.

- `C:\dev\salesforce-lite-crm` is the single-agent root. If an agent is
  working there, assume no other implementation agent is active. The agent may
  edit any repo file needed for the current prompt, regardless of historical
  owner assignment. Product guardrails, `CRM-CONTRACT.md`, and the local gate
  still apply.
- Agent-specific worktrees are parallel mode. If an agent is working from one
  of the paths in the roster below, multiple agents may be active and the
  ownership zones remain mandatory.
- The root path should not be used as a parallel Codex worktree. Use
  `C:\dev\salesforce-lite-crm-codex` for Codex when running a multi-agent
  fleet.

## Agent Roster

| Agent | Expected worktree | Branch ownership | Report files | Current local status |
|---|---|---|---|---|
| Single-agent root | `C:\dev\salesforce-lite-crm` | current branch or prompt-specified branch | active agent's report files | full-repo mode |
| Codex | `C:\dev\salesforce-lite-crm-codex` | `codex/` branches | `SUMMARY.codex.md`, `BLOCKERS.codex.md` | create when parallel Codex is needed |
| Claude | `C:\dev\salesforce-lite-crm-claude` | `claude/` branches | `SUMMARY.claude.md`, `BLOCKERS.claude.md` | `claude/autonomy` observed 2026-05-19 |
| Grok | `C:\dev\salesforce-lite-crm-grok` or `/c/dev/salesforce-lite-crm-grok` | `grok/` branches | `SUMMARY.grok.md`, `BLOCKERS.grok.md` | `grok/autonomy` observed 2026-05-19 |
| Gemini | `C:\dev\salesforce-lite-crm-gemini` | `gemini/` branches | `SUMMARY.gemini.md`, `BLOCKERS.gemini.md` | `gemini/autonomy` observed 2026-05-19 |

Branch naming convention from `PLAN.md`: `<prefix>sprint-<id>-<feature-slug>`.
Older Sprint 4B handoff branches may still exist in local history, but current
dispatch should come from a fresh prompt plus `PLAN.md` and `CRM-CONTRACT.md`.

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

In single-agent root mode, these ownership zones are advisory and do not block
repo-wide fixes. In parallel mode, cross-zone edits are allowed only when they
are the smallest direct way to complete the current prompt. Record the reason
in SUMMARY/BLOCKERS.

## Standard Gate

Run from the repo root. The same sequence is documented in
`docs/LOCAL-GATE.md`:

```powershell
npm install
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
npx prisma generate
npx prisma db push
npm run seed
npm run lint
npm run typecheck
npm run test
npm run build
npx playwright install chromium
npm run test:e2e
```

`lint` and `typecheck` are package scripts and part of the local gate. There is
no `format` package script unless `package.json` later adds one.

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

- No live `/deals/[id]` detail route unless a later prompt explicitly promotes
  it. The excluded placeholder route may exist; deal detail stays in the
  `/deals?deal=<id>` drawer flow.
- `Lead` means consumer dealer-routed lead. Do not replace it with a generic
  B2B lead-conversion flow.
- Deterministic AI-style summarization remains default. Do not add external AI
  provider integration during cleanup or readiness work.
- Do not add auth, deployment, Salesforce integration, a dedicated `/search`
  page, dealer order CRUD, area CRUD, or new product routes during readiness
  work. The Ctrl/Cmd+K command palette is already the implemented cross-entity
  search surface.
