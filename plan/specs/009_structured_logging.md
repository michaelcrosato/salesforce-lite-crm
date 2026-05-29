# 009 — Introduce structured server-side logging

- **Wave:** Phase 1 — Core Upgrades
- **Status:** [x] Done
- **Scores:** Impact 4/5 · Feasibility 4/5 · Risk Low · Codebase Fit 5/5
- **Depends on:** none (enables 004, 018)
- **Scope gate:** In-scope (new first-party module, **no new dependency** — wrap `console` under the hood)
- **Related:** entire `app/*/actions.ts`, `lib/routing/leadRouter.ts`, `lib/action-result.ts`

## Description & Expected Impact
There is **no structured logging anywhere** — only two `console.*` calls in the whole tree (`prisma/seed.ts`, `app/error.tsx`). For a no-human-in-the-loop project running overnight, the absence of logs means failures (routing `markUnrouted`, swallowed action errors) are invisible after the fact. Introduce a thin, dependency-free logger that emits structured JSON lines with level + context, and is **test/determinism-aware** (so it never injects nondeterministic content into asserted code paths).

Impact: foundational observability — every later spec that needs to record "what happened" builds on this.

## Definition of Done & Acceptance Criteria
- [x] New `lib/observability/logger.ts` exporting `logger.debug/info/warn/error(event: string, fields?: Record<string, unknown>)` that writes one JSON line per call.
- [x] No new dependency (uses `console` internally); no `any` (typed `LogFields = Record<string, unknown>`).
- [x] Wired into `lib/routing/leadRouter.ts` failure paths — a single `logger.warn("lead_routing_unrouted", …)` at the `markUnrouted` choke point reached by all three reasons (`no_area_match`, `no_matching_active_order`, `all_orders_at_quota`). Spec 004's action error helper will consume the same module.
- [x] **Determinism preserved:** logging is a console side-channel only — it never enters the returned `RouteResult` or the `routing_event` payload. Under `NODE_ENV=test` the threshold defaults to `silent` (and the ISO timestamp is omitted), so the existing routing suite emits zero new output and stays byte-identical. `LOG_LEVEL` (`debug|info|warn|error|silent`) is resolved per call so tests can opt in.
- [x] Unit test asserts log shape + per-level channel + threshold filtering + `silent`; `npm run test` (573) and `build` green.

## Implementation Note (done 2026-05-29)
- Level threshold resolves from `process.env.LOG_LEVEL` **per call** (not cached at import) so tests flip it at runtime; unknown values fall back to the default (`info` normally, `silent` under test).
- Timestamp omitted under `NODE_ENV=test`; emitted as `time` ISO string otherwise. Core `{ level, event }` precede spread `fields`.
- Wired at `markUnrouted` rather than the three call sites: it is the one deterministic place all unrouted reasons pass through, so one call covers the whole failure surface without duplicating context assembly.

## Implementation Approach
**Files to touch:** new `lib/observability/logger.ts`; `lib/routing/leadRouter.ts`; `lib/action-result.ts` (consumed by 004); `app/*/actions.ts` via the 004 helper.

- Keep it minimal: level filter from `process.env.LOG_LEVEL`, JSON serialization, ISO timestamp (omit/clock-inject when `NODE_ENV === "test"` to keep snapshots stable).
- Don't log PII beyond IDs; log entity + id + code, not full records.

## Test Strategy
- **Unit (vitest):** spy `console.error`/`info`; assert the logger emits `{ level, event, …fields }` and respects `LOG_LEVEL=silent`.
- **Regression:** routing tests must still pass byte-identically — confirm logging didn't perturb the deterministic V5K 0A1 output.
