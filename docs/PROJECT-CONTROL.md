# Project Control

## Current Status

- Branch observed this pass: `codex/sprint-4-demo-seed-tuning`.
- Current pass: Codex repo hygiene continuation active under the current
  max-YOLO prompt; full local gate, including typecheck, passed on 2026-05-19.
- Product feature work: not expanded. This pass only corrected contract drift,
  stale coordination docs, excluded-route behavior, non-contract seed/helper
  artifacts, and local safety/tooling drift.
- Contract: `CRM-CONTRACT.md` v2.0 remains the source of truth for entity names,
  statuses, routes, and adapter signatures.
- Max-YOLO policy: the current prompt can authorize one-run exceptions. Use
  repo-local evidence, SUMMARY/BLOCKERS, and the local gate instead of manual
  approval gates.

## Worktree Note

The prompt named `C:\dev\salesforce-lite-crm-codex`, but that path was not a
Git repository and contained only ignored `.next` output at the start of this
pass. The active Codex worktree for this pass is:

```text
C:/dev/salesforce-lite-crm cc19bed [codex/sprint-4-demo-seed-tuning]
```

The readiness pass therefore ran against `C:\dev\salesforce-lite-crm`, which is
also the Codex worktree path listed in `PLAN.md` and `AGENTS.md`.

As of `scripts/check-worktrees.ps1` on 2026-05-19, all four expected worktrees
are registered:

```text
C:/dev/salesforce-lite-crm        cc19bed [codex/sprint-4-demo-seed-tuning]
C:/dev/salesforce-lite-crm-claude c84d34b [claude/autonomy]
C:/dev/salesforce-lite-crm-gemini fc4f787 [gemini/autonomy]
C:/dev/salesforce-lite-crm-grok   99c92ae [grok/sprint-4-component-polish]
```

Claude has a generated `tsconfig.tsbuildinfo` file, and Gemini has extensive
local modified source, report, prompt, hook/config, test, and generated/debug
files. Do not dispatch unattended work there until those paths are cleaned or
explicitly accounted for in that agent's reports.

## Completed Readiness Scope

This pass verified the route and documentation contract, then made narrow
cleanup changes:

- Disabled the excluded command-palette UI surface while preserving top search
  as contacts-only.
- Removed non-contract dealer trophy/hype/prophecy helper code, tests, and seed
  rows.
- Updated stale worktree, route, prompt, demo, backlog, and report
  documentation.
- Preserved `/deals?deal=<id>` as the only live opportunity detail behavior.
- Confirmed `/tasks`, `/cases`, `/campaigns`, and `/reports` are live routes.
- Protected tracked `.claude` hook/config files from cleanup script deletion.
- Cleared the direct critical npm audit finding with exact dev dependency
  updates; only moderate findings remain, and npm's suggested fixes require
  breaking/downgrade paths.
- Removed Playwright-induced screenshot hydration warning noise from the local
  gate output.
- Added `npm run lint` to the local gate using the installed Next ESLint flat
  config.
- Added `npm run typecheck` to the local gate and active gate docs/prompts after
  fixing test-only TypeScript drift.
- Derived excluded-route e2e smoke paths from `EXCLUDED_ROUTES` to prevent
  route-contract drift between the feature-flag list and Playwright coverage.

## Sprint Status From PLAN.md

`PLAN.md` marks the readiness pass active by current prompt and Sprint 4 queued:

| Feature | Owner | Status |
|---|---|---|
| S4-F1 Demo seed tuning | Codex | queued |
| S4-F2 Route visual QA | Claude | queued |
| S4-F3 Component polish | Grok | queued |
| S4-F4 Demo smoke and gate hardening | Gemini | queued |

## Prepared Next Feature List

`docs/NEXT-PROMPTS.md` and `prompts/shared/s4-f*.md` are the active next-push
prompt artifacts. Older `*-SPRINT-4B.md` prompt files are historical and marked
as superseded.

## Chat Versus Repo

Chat is for current prompts, one-run exceptions, and short coordination context.
Repo docs are for durable rules, contracts, checklists, scripts, and prompts.
Do not paste raw chat history into repo files.

## PLAN.md Versus README.md Versus CRM-CONTRACT.md

- `PLAN.md`: execution protocol, sprint scope, source-of-truth hierarchy, gate,
  ownership, reports.
- `README.md`: product overview, AI-agent read-first list, local run
  instructions, implemented routes/workflows, database notes, tests,
  limitations, and roadmap.
- `CRM-CONTRACT.md`: entity names, statuses, routes, adapter signatures.
- `AGENTS.md`: short operational handoff for CLI agents.

## Exact Next Step

Continue Sprint 4 coordination from `docs/NEXT-PROMPTS.md`. Before launching
non-Codex agents, inspect their current worktree status with
`scripts/check-worktrees.ps1`; the full local gate, including lint and
typecheck, passed in the Codex worktree on 2026-05-19.
