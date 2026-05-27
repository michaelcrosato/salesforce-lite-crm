# Project Control

## Current Status

- Branch observed this pass: `main`
- Commit observed this pass: use `git rev-parse HEAD` for the current local
  commit; this file intentionally avoids freezing a SHA that stales after
  documentation-only commits.
- Current pass: Sprint 49 saved-report builder foundation loop.
- Product feature work: S48-F1, S48-F2, and S48-F3 are present in `main`;
  S49-F1, S49-F2, and S49-F3 are queued in `PLAN.md` section 4.
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
- Local service-operations knowledge foundations: `KnowledgeArticle` records,
  deterministic case queue/SLA helpers, and read-only case-to-article
  suggestion packets surfaced through the `/knowledge` operator workspace.
  There is still no customer knowledge portal, external knowledge provider,
  RAG/vector search, or article sync.

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

## Current Sprint Status

`main` contains the earlier Sprint 4B demo-hardening surface plus the
subsequent CSV, audit, bulk action, list, service-operations, AI governance,
approval readiness, and lead follow-up tracks. The active feature queue is
Sprint 49:

| Feature | Owner | Current state |
|---|---|---|
| S49-F1 Saved report definition contracts | Codex | Queued; next target when the prompt allows the required CRM contract update |
| S49-F2 Saved report preview runner | Codex | Queued; depends on S49-F1 |
| S49-F3 Saved reports operator surface | Codex | Queued; depends on S49-F2 |

This file does not activate new implementation scope beyond `PLAN.md` section
4. Work that changes entity names, routes, adapter signatures, feature flags,
or other contract surfaces still follows `CRM-CONTRACT.md`.

## Branch And Worktree Topology

Current branch and dirty-state details are intentionally not frozen here. Run
the repo-local helpers for live state:

```powershell
git worktree list
scripts/check-worktrees.ps1
```

Topology rule:

```text
C:\dev\salesforce-lite-crm        single-agent root, full-repo access
agent-specific worktrees          parallel mode, ownership zones enforced
```

Codex's parallel worktree is `C:\dev\salesforce-lite-crm-codex`. The repo root
is no longer used as Codex's parallel worktree.

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
