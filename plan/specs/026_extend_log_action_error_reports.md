# 026 — Extend logActionError into app/reports/actions.ts

- **Wave:** Wave 3 — Autonomous Quality & Robustness
- **Status:** [ ] Todo
- **Scores:** Impact 4/5 · Feasibility 4/5 · Risk Low · Codebase Fit 5/5
- **Depends on:** 009 (structured logging), 004 (surface action errors)
- **Scope gate:** Add error logging to `catch` blocks in `app/reports/actions.ts` only. No changes to the return schema or user-facing masked messages.
- **Related:** `app/reports/actions.ts`, `lib/action-result.ts`, `lib/observability/logger.ts`

## Description & Expected Impact
Spec 004 successfully centralized error logging across standard CRM server actions to prevent silent database failure masking. However, `app/reports/actions.ts` handles complex operations (bulk executions, dry runs, CSV processing, dynamic previews) and catch blocks inside this file discard the error object completely without logging it.

Impact: Eliminates an oversight in reporting mutations and preview executions, ensuring all server throws are correctly captured in structured JSON logs.

## Definition of Done & Acceptance Criteria
- [ ] Import `logActionError` from `@/lib/action-result` into `app/reports/actions.ts`.
- [ ] Bind the exception object inside `catch` blocks of mutating or preview builder server actions in `app/reports/actions.ts` (e.g. `catch (error)`).
- [ ] Invoke `logActionError(error, { action, entity })` in each catch block, specifying descriptive action and entity fields.
- [ ] Confirm no change to the user-facing return structure or payload signatures.
- [ ] Write integration/unit tests validating that structured error logging is triggered when these actions fail.

## Implementation Approach
**Files to touch:** `app/reports/actions.ts`, `tests/api/reportsErrorLogging.test.ts` (new)

1. Find all `catch` blocks inside `app/reports/actions.ts` that lack logging.
2. Bind the error: `catch (error)`.
3. Add `logActionError(error, { action: "actionName", entity: "reports" });` at the top of each block.
4. Verify compiling and execution compatibility.

## Test Strategy
- **Unit/Integration Test**: Add a new test file `tests/api/reportsErrorLogging.test.ts` that mocks a failure inside a preview or execution module (e.g., throwing in a runner) and asserts that calling the corresponding server action logs the structured error using `logger.error`.
