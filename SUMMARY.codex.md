Agent: Codex
Sprint: Sprint 4B
Feature: EXCLUDED_ROUTES reconciliation
Branch: feat/codex-services-routing-and-validation
Status: done
Commits this prompt: final fix commit at HEAD - `fix(codex): reconcile excluded routes with live sprint 4 routes`
Gate status: PASS - `pwsh scripts/local-gate.ps1`; `rg '\bany\b|@ts-ignore|@ts-expect-error' lib` found no matches; `git status --short` checked before commit
DoD self-check: PASS
Timestamp: 2026-05-18T10:58:31-07:00

### Completed this prompt

- Removed `/tasks`, `/cases`, and `/campaigns` plus their obsolete UI flags from `lib/featureFlags.ts`, leaving `EXCLUDED_ROUTES` limited to routes without live demo pages.
- Updated `CRM-CONTRACT.md` to state that `/tasks`, `/cases`, and `/campaigns` are live Sprint 4B demo routes with UI and E2E coverage, and removed their excluded-route table rows.
- Ran the canonical local gate and requested `lib` scan; both passed.

### Next action

Hand off Sprint 4B blocker #5 as resolved so integration can consume the reconciled route contract.

### Scope confirmation

No cross-ownership edits: YES
CRM-CONTRACT.md honored: YES
No product features added: YES
