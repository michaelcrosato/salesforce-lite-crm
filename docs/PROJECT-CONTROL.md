# Project Control

## Current Status

- Branch observed this pass: `main`
- Commit observed this pass: use `git rev-parse HEAD` for the current local
  commit; this file intentionally avoids freezing a SHA that stales after
  documentation-only commits.
- Current pass: repository scan and documentation drift cleanup against
  repo-local evidence.
- Product feature work: not changed during this pass.
- Contract: `CRM-CONTRACT.md` is the source of truth for entity names,
  statuses, routes, search surfaces, report services, and adapter signatures.
- Local gate: `docs/LOCAL-GATE.md` and `scripts/local-gate.ps1` are the
  authoritative setup and validation references.

## Current Product Surface

The current `main` tree includes:

- Dashboard, account, contact, opportunity, activity, lead, dealer order, area,
  forecast, task, case, campaign, and report routes.
- Drawer detail flows for opportunities, tasks, cases, and campaigns.
- Detail pages for accounts, contacts, leads, and dealer orders.
- Excluded placeholders for `/deals/[id]`, `/search`, `/command-palette`,
  dealer-order create/edit routes, and area create/edit routes.
- Global Ctrl/Cmd+K command palette search across accounts, contacts, deals,
  leads, tasks, cases, and campaigns.
- Header search routed to contacts only.
- SQLite as the default runtime database with a Postgres schema-switch helper.

## Documentation Status

This documentation pass updates durable project documentation:

- `README.md`
- `DEMO.md`
- `CRM-CONTRACT.md`
- `PLAN.md`
- `AGENTS.md`
- `docs/*.md`
- `prompts/README.md`
- `REVIEW.CODEX.md`

It also aligns supporting non-product files with those docs:

- `app/layout.tsx`
- `components/command-palette.tsx`
- `e2e/excluded-routes.spec.ts`

Historical prompt files under `prompts/<agent>/`, plus agent `SUMMARY.*`,
`BLOCKERS.*`, and `*-NOTES.md` files, are branch handoff records. They may
describe older sprint state and should not be used as current product truth
without checking `PLAN.md`, `CRM-CONTRACT.md`, and the working tree.

## Sprint 4B Status

`main` now contains the Sprint 4B demo-hardening surface:

| Feature | Owner | Current state |
|---|---|---|
| S4-F1 Demo seed tuning | Codex | Present in `main` |
| S4-F2 Route visual QA | Claude | Present in `main` |
| S4-F3 Component polish | Grok | Present in `main` |
| S4-F4 Demo smoke and gate hardening | Gemini | Present in `main` |

`docs/ROADMAP.md` recommends Sprint 5 as the next sprint, but this file does
not activate implementation scope. Use a fresh prompt plus `PLAN.md`,
`CRM-CONTRACT.md`, and `docs/FEATURE-BACKLOG.md` before starting new feature
work.

## Branch And Worktree Topology

Current branch and dirty-state details are intentionally not frozen here. Run
the repo-local helpers for live state:

```powershell
git worktree list
scripts/check-worktrees.ps1
```

Expected but missing locally:

```text
none
```

Use `docs/WORKTREE-SETUP.md` and `scripts/check-worktrees.ps1` before creating
or repairing worktrees.

## Source-Of-Truth Order

- `PLAN.md`: execution protocol, sprint scope, source-of-truth hierarchy, gate,
  ownership, and reports.
- `CRM-CONTRACT.md`: entity names, statuses, routes, search surfaces, report
  query services, and adapter signatures.
- `README.md`: product overview, local run instructions, implemented
  workflows, database notes, tests, limitations, and roadmap.
- `DEMO.md`: current seeded demo path and audited anchor values.
- `AGENTS.md`: short operational handoff for CLI agents.

## Chat Versus Repo

Chat is for current prompts, one-run exceptions, and short coordination context.
Repo docs are for durable rules, contracts, checklists, scripts, and prompts.
Do not paste raw chat history into repo files.

## Roadmap Sources

- `docs/ROADMAP.md`: canonical product roadmap, deferred promotion
  candidates, recommended Sprint 5 scope, and roadmap-source artifact link.
- `docs/AI-ROADMAP.md`: AI platform sequencing, non-goals, safety rules, and
  persona feature order.
- `docs/ARCHITECTURE.md`: current architecture boundaries and roadmap
  sequencing constraints.
- `docs/EVALS.md`: eval expectations for future deterministic and AI
  capabilities.
- `docs/SECURITY-PRIVACY.md`: roadmap security, privacy, AI, and integration
  guardrails.
- `docs/roadmap/ROADMAP-IFT-R1-REVIEW.md`: roadmap review trace artifact.
- `PLAN.md`, `CRM-CONTRACT.md`, and repo-local evidence remain higher authority
  for active execution scope and product contract details.
