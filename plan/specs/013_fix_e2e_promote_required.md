# 013 — Fix the 3 CI-only e2e failures & promote `e2e` to a required check (TICKET008)

- **Wave:** Phase 1 — Core Upgrades
- **Status:** [ ] Todo
- **Scores:** Impact 4/5 · Feasibility 3/5 · Risk Med · Codebase Fit 5/5
- **Depends on:** none
- **Scope gate:** In-scope; the **branch-protection flip is the closing step** (mirrors TICKET009's `enforce_admins` sequencing — do it last, after green is proven)
- **Related:** TICKET008, `.github/workflows/ci.yml` (advisory `e2e` job), `playwright.config.ts`, `e2e/**`

## Description & Expected Impact
The CI `e2e` job is `continue-on-error: true` (non-blocking) because three specs fail only on CI: **dashboard-cards, routing-simulator-operator, saved-reports**. That means e2e currently protects nothing on `main`. Fix the three root causes, stabilize, then promote `e2e` to a required status check so end-to-end flows actually gate merges.

Impact: real end-to-end protection for the merge flow; closes a known open ticket.

## Definition of Done & Acceptance Criteria
- [ ] Root cause of each of the 3 CI-only failures identified and fixed (likely CI timing/seed/viewport/data-order issues, not product bugs — confirm).
- [ ] All Playwright specs pass on CI **3 consecutive runs** (no flakiness).
- [ ] `.github/workflows/ci.yml` `e2e` job drops `continue-on-error: true`.
- [ ] Branch protection `required_status_checks.contexts` adds `e2e` (via `gh api`) — **only after** the 3× green streak.
- [ ] Local `npm run test:e2e` documented as reproducing CI (seed + Playwright).

## Implementation Approach
**Files to touch:** the 3 failing `e2e/*.spec.ts`, possibly `playwright.config.ts` (timeouts, retries, trace), `.github/workflows/ci.yml`, branch protection via `gh api`.

- Reproduce CI conditions locally (fresh seed, headless, CI env). Diff CI trace vs local.
- Apply 2026 Playwright hygiene: web-first auto-waiting assertions (no fixed sleeps), explicit action timeouts in CI, `trace: "retain-on-failure-and-retries"`, and `--fail-on-flaky-tests` to catch nondeterminism.
- Sequence the protection flip last (don't hard-require a check that isn't reliably green).

## Test Strategy
- The Playwright suite itself; prove stability with repeated CI runs before flipping required.
- Keep the `gate` job required throughout; `e2e` becomes a second required context only at the end.
