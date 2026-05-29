# 004 — Surface & log real server-action errors (de-mask `prismaErrorMessage`)

- **Wave:** Phase 0 — Quick Wins & Safety
- **Status:** [x] Done
- **Scores:** Impact 4/5 · Feasibility 4/5 · Risk Low · Codebase Fit 5/5
- **Depends on:** 009 (structured logger) — may land interim with `console.error`, then swap
- **Scope gate:** In-scope
- **Related:** `lib/action-result.ts`, `app/leads/actions.ts:22`, `app/deals/actions.ts:27`, all `app/*/actions.ts`

## Description & Expected Impact
Server actions wrap failures in `prismaErrorMessage`, which collapses every non-`P2002` error into a single generic string ("could not be saved") and **never logs the underlying error**. In a no-human-in-the-loop project this is the single biggest debugging blind spot: when an overnight mutation fails, the real Prisma error code and message are discarded before anyone (or any agent) can see them.

Keep the user-facing message generic (good UX), but **capture and log the real error** (code, model, operation) first. This is the observability counterpart to spec 009.

## Definition of Done & Acceptance Criteria
- [x] Every `catch` returning the masked `ActionResult` in `app/*/actions.ts` logs structured context `{ action, entity, prismaCode, message }` before returning. (Scope note below re: `app/reports/actions.ts`.)
- [x] User-facing `ActionResult.message` is unchanged (no leaking internals to the UI).
- [x] `P2002` (unique constraint) and other known codes are mapped to friendly messages; unknown codes still log the raw code.
- [x] A unit test asserts both: (a) the masked message returned, and (b) the logger was called with the Prisma code (`tests/api/actionErrorMasking.test.ts`, 6 cases — helper branches + one end-to-end action).
- [x] Gate green.

## Implementation Note (done 2026-05-29)
- New `lib/action-result.ts` exports `logActionError(error, { action, entity })` (logs `logger.error("action_error", { action, entity, prismaCode, message })`, returns the code or `null`) and `actionErrorResult(error, ctx)` (logs then masks: `P2002` → shared duplicate message, other codes via `ctx.knownCodes`, else `ctx.fallbackMessage`). Built on the spec-009 logger, so it is silent under `NODE_ENV=test` and emits one JSON line otherwise.
- Replaced the duplicated `prismaErrorMessage` (accounts, contacts, deals, leads) and the `failureFrom`/`memberFailureFrom` P2002 branches (tasks, cases, knowledge, campaigns). The `z.ZodError` → `fieldErrors` branches were **kept** (those return non-masked, fully-visible validation detail, so there is nothing to surface). Knowledge's `P2025` → "could not be found" moved to `knownCodes`. `saved-list-views` keeps its code→string mapper (`savedViewErrorCode`) for the redirect query param but now calls `logActionError` first in each catch.
- **Action context:** the module-shared `failureFrom` helpers now take an `action` string so the log carries the precise action name (e.g. `updateTaskStatus`) rather than a single per-module label.
- **One deliberate behavior change:** campaign **member** ops (`addCampaignMember`/`removeCampaignMember`) previously collapsed *all* non-Zod errors (incl. P2002) to "Campaign members could not be updated."; they now map P2002 → the shared friendly duplicate message, consistent with every other module and on-spec ("P2002→friendly mapping"). No test depended on the old text; member adds are otherwise idempotent so P2002 is unlikely in practice.
- **Scope boundary:** `app/reports/actions.ts` returns bespoke result unions (not `ActionResult`) from preview/packet builders and never used `prismaErrorMessage`; its `catch {}` blocks were left untouched this spec. Extending `logActionError` into those ~15 catches is logged as a follow-up in `plan/BACKLOG.md`.
- Validated: `npx tsc --noEmit` exit 0 · `npm run test` **579 passed** · `npm run build` exit 0.

## Implementation Approach
**Files to touch:** `lib/action-result.ts` (centralize an `errorResult(error, ctx)` that logs then masks), the `prismaErrorMessage` helpers in `app/leads/actions.ts`, `app/deals/actions.ts`, and the other action modules.

- Centralize: add a single helper that takes the caught error + a context tag, logs via the spec-009 logger (or `console.error` as an interim that 009 replaces), then returns the masked `ActionResult`.
- Replace per-file `prismaErrorMessage` duplication with the shared helper to kill drift.
- Preserve the existing `P2002`→friendly mapping.

## Test Strategy
- **Unit (vitest):** in `tests/api/*Actions.test.ts`, force the mocked Prisma call to throw a `PrismaClientKnownRequestError` with a code; assert the returned `ActionResult.ok === false` + generic message, and spy that the logger received the code.
- **Regression:** existing action success-path tests must remain green.
