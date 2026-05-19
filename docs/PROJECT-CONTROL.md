# Project Control

## Current Status

- Branch observed this pass: `main`
- Commit observed this pass: `b7e0633 chore: add shared IFT v22 prompt (#2)`
- Current pass: documentation audit against repo-local evidence.
- Product feature work: not changed during this pass. Non-product code edits
  were limited to app metadata copy, a command-palette test id, and the
  matching Playwright assertion for the existing command-palette behavior.
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

No next feature sprint is selected by this file. Use a fresh prompt plus
`PLAN.md`, `CRM-CONTRACT.md`, and `docs/FEATURE-BACKLOG.md` before starting new
feature work.

## Branch And Worktree Topology

Observed with `git worktree list` on 2026-05-19:

```text
C:/dev/salesforce-lite-crm        b7e0633 [main]
C:/dev/salesforce-lite-crm-claude a0f5372 [claude/autonomy]
C:/dev/salesforce-lite-crm-gemini 2437f87 [gemini/autonomy]
C:/dev/salesforce-lite-crm-grok   e7ea824 [grok/autonomy]
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
- `PROJECT-CONTROL.md`: root entrypoint for current state.
- `LOCAL-GATE.md`: root entrypoint for local validation.
- `README.md`: product overview, local run instructions, implemented
  workflows, database notes, tests, limitations, and roadmap.
- `DEMO.md`: current seeded demo path and audited anchor values.
- `AGENTS.md`: short operational handoff for CLI agents.

## Chat Versus Repo

Chat is for current prompts, one-run exceptions, and short coordination context.
Repo docs are for durable rules, contracts, checklists, scripts, and prompts.
Do not paste raw chat history into repo files.
