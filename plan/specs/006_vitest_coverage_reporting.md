# 006 — Add Vitest coverage reporting

- **Wave:** Phase 0 — Quick Wins & Safety
- **Status:** [ ] Todo
- **Scores:** Impact 3/5 · Feasibility 5/5 · Risk Low · Codebase Fit 5/5
- **Depends on:** none
- **Scope gate:** ⚠️ **Requires dependency approval** — `@vitest/coverage-v8` is a new devDependency (CLAUDE.md §14 / LOOP §11 forbid unscoped dep additions). Get explicit sign-off, then proceed.
- **Related:** `vitest.config.ts`, `package.json` (devDeps), `.github/workflows/ci.yml`

## Description & Expected Impact
`vitest.config.ts` configures no coverage provider, so the documented gaps (zero component tests, untested action side-effects, untested `lib/prisma.ts` branch) **cannot be quantified**. Adding v8 coverage turns "we think coverage is skewed to `lib/server`" into a measurable, ratchetable number that downstream specs (010, 018) can target.

Impact: makes test-quality work data-driven and prevents silent coverage erosion.

## Definition of Done & Acceptance Criteria
- [ ] Dependency `@vitest/coverage-v8` added at an exact pin matching `vitest@4.1.7` (approval recorded).
- [ ] `vitest.config.ts` defines `coverage: { provider: "v8", reporter: ["text", "html", "lcov"], include: ["lib/**", "app/**", "components/**"], exclude: [tests, generated, scripts] }`.
- [ ] `npx vitest run --coverage` produces a report; the **measured baseline** is recorded in the PR description (don't invent thresholds — set them at/just below the measured floor to ratchet upward).
- [ ] CI optionally runs coverage in the `gate` job or a separate non-blocking step (decide based on runtime cost; 565 tests already take ~46s serially).
- [ ] Gate green.

## Implementation Approach
**Files to touch:** `package.json` (devDep — gated), `vitest.config.ts`, optionally `.github/workflows/ci.yml`, `.gitignore` (ignore `coverage/`).

- Do **not** add a new npm script (guardrail); invoke `vitest run --coverage` via CI step / docs.
- Start thresholds permissive; tighten in follow-ups as 010/018 add tests.

## Test Strategy
- The coverage run itself is the validation.
- No behavioral tests; ensure `coverage/` is gitignored so artifacts never get committed (CLAUDE.md: no build artifacts).
