# 025 — Deterministic Case SLA Seed Test

- **Wave:** Wave 3 — Autonomous Quality & Robustness
- **Status:** [ ] Todo
- **Scores:** Impact 4/5 · Feasibility 5/5 · Risk Low · Codebase Fit 5/5
- **Depends on:** —
- **Scope gate:** In-scope only to modify the test's reference clock to align dynamically with database seed time. No database schema or seed generation changes.
- **Related:** `tests/seed-integrity.test.ts`, `prisma/seed.ts`

## Description & Expected Impact
The `seeded cases cover case SLA states` test in `tests/seed-integrity.test.ts` currently constructs SLA snapshots using the wall-clock `new Date()` as the reference time. Since case creation dates are locked to the time the seed was executed, the cases naturally age over time relative to the test clock. Consequently, running tests hours/days after a seed leads to a spurious red gate because "due_soon" and "on_track" cases lapse into "overdue".

Impact: Resolves a critical time-sensitive test flakiness issue, ensuring the repository's main quality gate remains completely stable and green indefinitely.

## Definition of Done & Acceptance Criteria
- [ ] In `tests/seed-integrity.test.ts`, the `seeded cases cover case SLA states` test derives the `caseSlaSeedNow` anchor dynamically from `case-001.createdAt` (using a +12 hour offset, reversing the seed calculation `caseSlaSeedNow - 12 hours`).
- [ ] Fallback to `new Date()` is provided only if `case-001` is not found, maintaining graceful resilience.
- [ ] No behavioral or structural changes are made to the database seed script `prisma/seed.ts` or `lib/services/caseSlas.ts`.
- [ ] Quality gate passes completely.

## Implementation Approach
**Files to touch:** `tests/seed-integrity.test.ts`

Locate `seeded cases cover case SLA states` test and replace:
```typescript
    const snapshots = buildCaseSlaSnapshots(cases, {
      now: () => new Date()
    });
```
with:
```typescript
    const case1 = cases.find((c) => c.id === "case-001");
    const seedNow = case1
      ? new Date(case1.createdAt.getTime() + 12 * 60 * 60 * 1000)
      : new Date();

    const snapshots = buildCaseSlaSnapshots(cases, {
      now: () => seedNow
    });
```

## Test Strategy
- **Verification**: Run `npm run test tests/seed-integrity.test.ts` to assert that the seed integrity assertions pass cleanly. We can also simulate/test with a shifted date to verify that it remains robust regardless of the date gap.
