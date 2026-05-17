# BLOCKERS.grok.md — Grok Agent Blockers & Requests

**Status:** No active blockers. All pre-flight, rebase, and baseline gate passed cleanly after standard post-rebase setup.

---

## Pre-Flight / Setup Notes (Resolved)
- **Dirty tree pre-flight:** `grok-cli-prompt.txt` (the task prompt itself) was untracked at start. Removed via `Remove-Item` to achieve clean `git status --short`. Not a code change; workspace artifact. Tree now clean.
- **Prisma client/db after rebase:** Schema had new models (Task/Case/Campaign/OpportunityStageHistory) from Codex [UNBLOCK]. Required:
  - `cp .env.example .env`
  - `npx prisma generate`
  - `npx prisma db push --accept-data-loss`
- These made `npm run test` / build / test:e2e green. Documented in GROK-NOTES.md. No SCHEMA_REQUEST or CONTRACT_REQUEST needed yet.

---

## SCHEMA_REQUEST: (none)
If a needed field is missing from Prisma models (e.g., for Task/Campaign), log here as:
`SCHEMA_REQUEST: <field> on <Model> for <use-case> — workaround: <skip or use existing>`

---

## CONTRACT_REQUEST: (none)
If a needed function is missing from `lib/services/*` or `lib/crm/*` (e.g., for reports or CRUD), log here as:
`CONTRACT_REQUEST: <func signature> in <file> for <reason> — adapted by: <skip/helper only>`

Current reports surface (overdueTasks etc.) sufficient; reports-extra is pure augmentation only.

---

## Other Issues
- None. All owned files will be created new; no edits to forbidden paths.
- TypeScript: strict no-any discipline enforced via rg after each commit.
- E2E/UI: Claude owns; smoke passed in baseline.

*Last updated: post-slice-0 baseline.*
