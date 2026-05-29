# 024 — Audit-trail change-history UI (per-entity)

- **Wave:** Phase 2 — Major Features
- **Status:** [x] Done
- **Scores:** Impact 4/5 · Feasibility 3/5 · Risk Low · Codebase Fit 4/5
- **Depends on:** 018 (complete `AuditEvent` write coverage — this is the read surface for that data)
- **Scope gate:** In-scope **as a drawer/panel only.** ⚠️ Must **not** introduce a live `/deals/[id]` route (permanent non-goal). Surface history in the existing detail drawer/dialog pattern, not a new product route.
- **Related:** `prisma/schema.prisma` (`AuditEvent`), `lib/services/auditEvents.ts`, detail drawers under `components/**`, `app/*/actions.ts` (read action for history)

## Description & Expected Impact
Spec 018 makes the `AuditEvent` trail *complete*; this spec makes it *visible*. Add a "History / Activity" panel inside the existing entity detail drawer (Deals, Leads, Accounts, Contacts) that renders the chronological audit events for that record: who changed what, when, and a human-readable before→after summary.

Impact: "who touched this and when" is a top-asked CRM question and a trust feature for an all-AI-authored system — it makes the autonomous mutation trail legible. High impact, low risk (read-only over existing data).

## Definition of Done & Acceptance Criteria
- [x] A detail drawer for each core entity shows a reverse-chronological list of its `AuditEvent` rows (`action`, `actorSummary`, `before/after` summary, timestamp).
- [x] History is fetched via a **read-only** server action / cached read keyed by `{ entity, entityId }` — no new mutating endpoint, no `/deals/[id]` route.
- [x] The read participates in the caching/tags model (spec 014): committing a mutation that writes an audit row invalidates the history view (`updateTag`/`revalidateTag`).
- [x] Empty state (no events yet) and large-history pagination/cap are handled deterministically (stable ordering with a tie-breaker on id).
- [x] Reconciles with the Activity timeline distinction documented in spec 018 (AuditEvent = system change record; Activity = user-facing timeline) — the UI labels which it shows.
- [x] Gate + e2e green.

## Implementation Approach
**Files to touch:** `lib/services/auditEvents.ts` (add a `listForEntity({ entity, entityId })` read), `app/*/actions.ts` or a shared read action (read-only fetch), detail-drawer `components/**` (History panel + tab), `lib/validation.ts` (the `{ entity, entityId }` query schema).

- Read-only and presentation-only; the source of truth stays the `AuditEvent` rows written in spec 018.
- Encode `before/after` rendering defensively — summaries are stored as structured/JSON; format, don't trust raw shape.
- Keep ordering deterministic (`createdAt desc, id desc`) so paginated history is reproducible for e2e assertions.

## Test Strategy
- **Unit (vitest):** `listForEntity` returns events for the right entity only, in deterministic order; empty-history case; cap/pagination boundary.
- **Component (spec 010 env):** History panel renders a fixture event list (actor, action, before→after) and the empty state.
- **e2e (Playwright 1.60):** mutate a deal → open its drawer → assert the new audit row appears; `data-testid` `deal-history-panel` (kebab-case) for the Gemini test zone.
