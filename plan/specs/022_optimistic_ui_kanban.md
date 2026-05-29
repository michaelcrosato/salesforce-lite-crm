# 022 — Optimistic UI for the deal kanban

- **Wave:** Phase 2 — Major Features
- **Status:** [x] Done
- **Scores:** Impact 3/5 · Feasibility 3/5 · Risk Med · Codebase Fit 4/5
- **Depends on:** 014 (`updateTag` read-your-writes), 010 (component tests)
- **Scope gate:** In-scope (UX enhancement to existing deals kanban; no schema/route change)
- **Related:** Deals kanban `components/**`, `app/deals/actions.ts`, React 19 `useOptimistic`, Next 16 `updateTag()`

## Description & Expected Impact
Modern CRMs feel instant: dragging a deal to a new stage updates the UI immediately, then reconciles with the server. React 19's `useOptimistic` + Next 16 `updateTag()` (read-your-writes from a Server Action) make this idiomatic. Today, stage changes likely round-trip before the UI reflects them.

Impact: a noticeably snappier pipeline UX — the most-interacted-with surface in a deal-centric CRM.

## Definition of Done & Acceptance Criteria
- [x] Dragging a deal between stages applies optimistically (card moves instantly), then commits via the existing deal stage server action.
- [x] On server failure, the optimistic move **rolls back** and a toast surfaces the error (uses the existing `ToastProvider`).
- [x] The action calls `updateTag('deals')` so any cached list/board read reflects the committed state.
- [x] No regression to `OpportunityStageHistory` writes (stage changes must still record history).
- [x] Gate + e2e green; kanban drag covered by Playwright 1.60 `locator.drop()`.

## Implementation Approach
**Files to touch:** the deals kanban `components/**` (introduce `useOptimistic` reducer for card↔stage), `app/deals/actions.ts` (ensure the stage-change action is callable from the optimistic flow + tags invalidated), toast wiring.

- Keep the server action as the source of truth; optimistic state is presentation-only.
- Ensure stage-history + audit (spec 018) still record on the real mutation.

## Test Strategy
- **Component (spec 010 env):** simulate an optimistic move + a forced server rejection; assert rollback + toast.
- **e2e (Playwright 1.60):** `locator.drag`/`drop` a card to a new column; assert it stays after reload (server committed) — and a failure path if feasible.
