# 018 — Audit-event write coverage across mutating actions

- **Wave:** Phase 1 — Core Upgrades
- **Status:** [ ] Todo
- **Scores:** Impact 3/5 · Feasibility 3/5 · Risk Low · Codebase Fit 5/5
- **Depends on:** 009 (logging), 006 (coverage to verify)
- **Scope gate:** In-scope (`AuditEvent` model + `lib/services/auditEvents.ts` already exist — no schema change)
- **Related:** `prisma/schema.prisma` (`AuditEvent`), `lib/services/auditEvents.ts`, all `app/*/actions.ts`, `lib/routing/leadRouter.ts`

## Description & Expected Impact
The schema already defines an `AuditEvent` model and there is a `lib/services/auditEvents.ts`, but the audit service appears **under-exercised** relative to the full set of mutating server actions. A CRM's audit trail is only useful if it is complete. Ensure every create/update/delete/route mutation writes a corresponding audit row, and lock that with tests.

Impact: turns the existing-but-partial audit capability into a trustworthy, complete change record — and is the data source for the spec-024 change-history UI.

## Definition of Done & Acceptance Criteria
- [ ] Every mutating server action (accounts, contacts, deals, leads, tasks, cases, campaigns, knowledge, orders) writes an `AuditEvent` with `{ entity, entityId, action, actorSummary, before/after summary }`.
- [ ] Lead routing (`leadRouter`) records a routing audit event (it already writes a `routing_event` Activity — reconcile: Activity timeline vs AuditEvent responsibilities, documented).
- [ ] No double-writes / no schema change (use the existing model + service).
- [ ] Unit tests assert an audit row is created for each mutation type; coverage (spec 006) shows `auditEvents.ts` exercised.
- [ ] Gate green; determinism preserved.

## Implementation Approach
**Files to touch:** `lib/services/auditEvents.ts` (ensure a single ergonomic `recordAudit(...)` entry), `app/*/actions.ts` (call it in each mutation after success), `lib/routing/leadRouter.ts` (routing audit), `tests/api/*`.

- Audit the current call sites first (grep for `auditEvents` usage) to find which actions already record vs which don't.
- Write audits inside the same transaction as the mutation where feasible, so a failed mutation doesn't leave an orphan audit row.

## Test Strategy
- **Unit (vitest):** for each mutating action, assert exactly one `AuditEvent` row with the expected `entity`/`action` after a successful mutation, and none on validation failure.
- **Regression:** existing action + routing tests stay green.
