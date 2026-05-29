# 009 — Introduce structured server-side logging

- **Wave:** Phase 1 — Core Upgrades
- **Status:** [ ] Todo
- **Scores:** Impact 4/5 · Feasibility 4/5 · Risk Low · Codebase Fit 5/5
- **Depends on:** none (enables 004, 018)
- **Scope gate:** In-scope (new first-party module, **no new dependency** — wrap `console` under the hood)
- **Related:** entire `app/*/actions.ts`, `lib/routing/leadRouter.ts`, `lib/action-result.ts`

## Description & Expected Impact
There is **no structured logging anywhere** — only two `console.*` calls in the whole tree (`prisma/seed.ts`, `app/error.tsx`). For a no-human-in-the-loop project running overnight, the absence of logs means failures (routing `markUnrouted`, swallowed action errors) are invisible after the fact. Introduce a thin, dependency-free logger that emits structured JSON lines with level + context, and is **test/determinism-aware** (so it never injects nondeterministic content into asserted code paths).

Impact: foundational observability — every later spec that needs to record "what happened" builds on this.

## Definition of Done & Acceptance Criteria
- [ ] New `lib/observability/logger.ts` exporting `logger.info/warn/error(event: string, fields?: Record<string, unknown>)` that writes one JSON line per call.
- [ ] No new dependency (uses `console` internally); no `any` (use `unknown`/typed fields).
- [ ] Wired into `lib/routing/leadRouter.ts` failure paths (`no_area_match`, `no_matching_active_order`, `all_orders_at_quota`) and used by spec 004's action error helper.
- [ ] **Determinism preserved:** routing's `routing_event` payload and any test-asserted output are unchanged; logging is a side-channel only. If logs must be silenced in tests, support a `LOG_LEVEL=silent` env honored by the module.
- [ ] Unit test asserts log shape + level; `npm run test`/`build` green.

## Implementation Approach
**Files to touch:** new `lib/observability/logger.ts`; `lib/routing/leadRouter.ts`; `lib/action-result.ts` (consumed by 004); `app/*/actions.ts` via the 004 helper.

- Keep it minimal: level filter from `process.env.LOG_LEVEL`, JSON serialization, ISO timestamp (omit/clock-inject when `NODE_ENV === "test"` to keep snapshots stable).
- Don't log PII beyond IDs; log entity + id + code, not full records.

## Test Strategy
- **Unit (vitest):** spy `console.error`/`info`; assert the logger emits `{ level, event, …fields }` and respects `LOG_LEVEL=silent`.
- **Regression:** routing tests must still pass byte-identically — confirm logging didn't perturb the deterministic V5K 0A1 output.
