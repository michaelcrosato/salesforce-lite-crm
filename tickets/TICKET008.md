# TICKET008 — fix the 3 CI-only Playwright e2e failures, then require e2e

- **Status:** Open
- **Priority:** Medium
- **Depends on:** none. Context: CI split landed in PR #5
  (`.github/workflows/ci.yml`), `e2e` job is `continue-on-error` / non-required.

## Goal

Make the Playwright e2e suite pass on CI (Ubuntu runners), then promote the
`e2e` job to a required status check so merges are gated on it too.

## Context

The local gate reports 50/50 e2e green on Windows, but the same suite fails 3
tests on `ubuntu-latest` CI. Because the old CI bundled e2e into the single
`gate` job, every push went red and was merged via admin-exemption. PR #5 split
e2e into a non-blocking job so the deterministic gate (lint/typecheck/test/build)
is the green required check. These 3 must be fixed before e2e can be required:

1. **dashboard-cards** — `…cards on reports and dashboard`: `toBeChecked()`
   failed, "element(s) not found".
2. **routing-simulator-operator** — `…hypothetical capacity windows`:
   `toBeVisible()` failed, "element(s) not found".
3. **saved-reports** — `…can be managed from reports`: `locator.selectOption`
   timed out at 60000ms.

These smell like CI-environment differences (headless timing / render races, or
seed-state assumptions) rather than product regressions, but confirm per-test.

## Scope

- In: reproduce each failure (ideally locally with `CI=1` headless + a clean
  seeded DB), find root cause, fix the test or the underlying timing/selector
  issue. Once green on CI **3 consecutive runs**, add `e2e` to the required
  status-check contexts (alongside `gate`).
- Out: changing app behavior beyond what a genuine bug requires; touching the
  `gate` job; schema/seed changes (unless a seed gap is the proven root cause —
  then follow CLAUDE.md §7 `[SEED CHANGE]` rules).

## Likely files

`e2e/*.spec.ts` (the 3 specs above), `playwright.config.ts` (timeouts / retries
/ webServer readiness), possibly `prisma/seed.ts` (only if a missing seed record
is the proven cause). Branch-protection update via `gh api` once green.

## Steps

1. Pull the failing run's `error-context.md` artifacts (paths in the CI log) for
   each test to see the exact DOM state.
2. Reproduce locally headless; fix selectors/waits or the readiness race.
3. Re-run on CI until green 3× in a row.
4. `gh api -X PUT …/branches/main/protection` adding `e2e` to
   `required_status_checks.contexts`.

## Acceptance criteria

- [ ] All 3 named tests pass on CI.
- [ ] Full e2e green on CI 3 consecutive runs (no flake).
- [ ] `e2e` promoted to a required status check on `main`.
- [ ] No `gate`-job regression; no unrelated app changes.

## Commands

```powershell
npm run test:e2e            # local repro (Windows)
# CI: pushed branch triggers .github/workflows/ci.yml
```

## Risks

E2E flake is worse than slow: do not require `e2e` until it is *repeatably*
green, or it will re-block merges and re-create the admin-bypass habit this work
removed.
