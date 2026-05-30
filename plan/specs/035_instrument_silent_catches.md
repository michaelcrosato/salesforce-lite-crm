# Spec 035 — Instrument Silent Catch Blocks with Logger

## Description & Expected Impact

Replace the remaining silent `catch {}` blocks across the codebase with
structured error logging via the existing observability logger. This closes the
last gap in error observability that spec 004 and 026 began.

**Impact 4 · Feasibility 5 · Risk Low · Fit 5 → Score 16**

## Scope-gate

- Error logging only; no behavior changes, no new return values.
- Bind `catch (error)` and call `logActionError` or `logger.error`.

## Definition of Done

- [x] Zero `catch {}` blocks remain in `app/` production code (page.tsx and
      action files) that discard the error without logging.
- [x] `lib/services/leads.ts` catch block logs the parsing error.
- [x] `app/list-selected-export-actions.ts` three catch blocks use
      `logActionError`.
- [x] `npm run lint` · `npm run typecheck` · `npm run test` · `npm run build`
      all pass.

## Implementation Approach

Mechanical: bind `error` in each catch block, add one line of
`logActionError(error, { action, entity })` or
`logger.warn("saved_view_parse_error", { error })`.

## Test Strategy

- Gate verification; existing test suite confirms no regressions.
