# 027 — Dedup Calendar-Date split/UTC helpers across lib/server

- **Wave:** Wave 3 — Autonomous Quality & Robustness
- **Status:** [ ] Todo
- **Scores:** Impact 3/5 · Feasibility 5/5 · Risk Low · Codebase Fit 5/5
- **Depends on:** —
- **Scope gate:** Extract and centralize identical calendar-date parsing, validation, and serialization functions into a shared `lib/datetime.ts` file without altering date calculations.
- **Related:** `lib/server/pacingSnapshotContracts.ts`, `lib/server/pacingSnapshotBuilder.ts`, `lib/server/dealerCapacityWindowContracts.ts`, `lib/server/routingSimulatorEvaluator.ts`

## Description & Expected Impact
Multiple core contract and evaluation modules inside `lib/server/` duplicate identical helper logic to parse calendar dates (`calendarDateStart`), format dates (`calendarDateKey`), and validate calendar date patterns (`isCalendarDate`). 

Impact: Eliminates redundant, copy-pasted implementations of basic calendar date primitives, reducing structural technical debt and preventing future drift in parsing invariants.

## Definition of Done & Acceptance Criteria
- [ ] Create a centralized utility file `lib/datetime.ts` exporting:
  - `isCalendarDate(value: string): boolean`
  - `calendarDateStart(value: string): Date`
  - `calendarDateKey(value: Date): string`
- [ ] Refactor `lib/server/pacingSnapshotContracts.ts` to import `isCalendarDate` and `calendarDateKey` from `@/lib/datetime`.
- [ ] Refactor `lib/server/dealerCapacityWindowContracts.ts` to import `isCalendarDate` from `@/lib/datetime`.
- [ ] Refactor `lib/server/pacingSnapshotBuilder.ts` to import `calendarDateStart` and `calendarDateKey` from `@/lib/datetime`.
- [ ] Refactor `lib/server/routingSimulatorEvaluator.ts` to import `calendarDateStart` and `calendarDateKey` from `@/lib/datetime`.
- [ ] Ensure all 100% existing unit/integration/E2E tests pass without any modifications to date assertions.

## Implementation Approach
**Files to touch:** `lib/datetime.ts` (new), `lib/server/pacingSnapshotContracts.ts`, `lib/server/pacingSnapshotBuilder.ts`, `lib/server/dealerCapacityWindowContracts.ts`, `lib/server/routingSimulatorEvaluator.ts`, `tests/datetime.test.ts` (new)

1. Implement `lib/datetime.ts` containing the standard calendar date algorithms cleanly typed and documented.
2. Add comprehensive unit tests in `tests/datetime.test.ts` asserting format check bounds, invalid formats, leap year handling, and string conversion invariants.
3. Incrementally refactor each of the 4 consumer modules to use the centralized imports.
4. Run `npm run agent:check` to confirm zero compilation or test regression.

## Test Strategy
- **Unit (vitest)**: Add `tests/datetime.test.ts` validating format constraints (e.g. `2026-05-30` is valid, `2026/05/30` or `2026-13-40` is invalid), start bounds, UTC offsets, and edge dates (e.g. Leap Year `2024-02-29`).
- **Integration**: Running the existing full test suites for `pacing-snapshots`, `dealer-capacity`, and `routing-simulator` guarantees absolute runtime behavior-preservation.
