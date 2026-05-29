# 004 — Surface & log real server-action errors (de-mask `prismaErrorMessage`)

- **Wave:** Phase 0 — Quick Wins & Safety
- **Status:** [ ] Todo
- **Scores:** Impact 4/5 · Feasibility 4/5 · Risk Low · Codebase Fit 5/5
- **Depends on:** 009 (structured logger) — may land interim with `console.error`, then swap
- **Scope gate:** In-scope
- **Related:** `lib/action-result.ts`, `app/leads/actions.ts:22`, `app/deals/actions.ts:27`, all `app/*/actions.ts`

## Description & Expected Impact
Server actions wrap failures in `prismaErrorMessage`, which collapses every non-`P2002` error into a single generic string ("could not be saved") and **never logs the underlying error**. In a no-human-in-the-loop project this is the single biggest debugging blind spot: when an overnight mutation fails, the real Prisma error code and message are discarded before anyone (or any agent) can see them.

Keep the user-facing message generic (good UX), but **capture and log the real error** (code, model, operation) first. This is the observability counterpart to spec 009.

## Definition of Done & Acceptance Criteria
- [ ] Every `catch` in `app/*/actions.ts` logs structured context `{ action, entity, prismaCode, message }` before returning the masked `ActionResult`.
- [ ] User-facing `ActionResult.message` is unchanged (no leaking internals to the UI).
- [ ] `P2002` (unique constraint) and other known codes are mapped to friendly messages; unknown codes still log the raw code.
- [ ] A unit test asserts both: (a) the masked message returned, and (b) the logger/`console.error` was called with the Prisma code.
- [ ] Gate green.

## Implementation Approach
**Files to touch:** `lib/action-result.ts` (centralize an `errorResult(error, ctx)` that logs then masks), the `prismaErrorMessage` helpers in `app/leads/actions.ts`, `app/deals/actions.ts`, and the other action modules.

- Centralize: add a single helper that takes the caught error + a context tag, logs via the spec-009 logger (or `console.error` as an interim that 009 replaces), then returns the masked `ActionResult`.
- Replace per-file `prismaErrorMessage` duplication with the shared helper to kill drift.
- Preserve the existing `P2002`→friendly mapping.

## Test Strategy
- **Unit (vitest):** in `tests/api/*Actions.test.ts`, force the mocked Prisma call to throw a `PrismaClientKnownRequestError` with a code; assert the returned `ActionResult.ok === false` + generic message, and spy that the logger received the code.
- **Regression:** existing action success-path tests must remain green.
