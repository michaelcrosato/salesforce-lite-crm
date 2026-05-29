# 001 — Add `npm audit` security gate to CI

- **Wave:** Phase 0 — Quick Wins & Safety
- **Status:** [ ] Todo
- **Scores:** Impact 3/5 · Feasibility 5/5 · Risk Low · Codebase Fit 5/5
- **Depends on:** none
- **Scope gate:** In-scope (CI workflow edit only; **no new npm script** — respects LOOP §11)
- **Related:** `.github/workflows/ci.yml`, baseline `found 0 vulnerabilities`

## Description & Expected Impact
Dependencies are exact-pinned and intentionally bleeding-edge (Next 16.2.6, React 19.2.6, Prisma 7.8.0). Exact pins are reproducible but receive **no automatic security patches**, and nothing in CI surfaces new advisories. Today `npm audit` reports 0 vulnerabilities — capture that as an enforced baseline so a future transitive CVE (the project already pins `postcss` and `@hono/node-server` to dodge advisories) fails the build instead of landing silently.

Impact: turns dependency security from "manual, never" into "every PR." Cheap, high-signal.

## Definition of Done & Acceptance Criteria
- [ ] The required `gate` job in `.github/workflows/ci.yml` runs `npm audit --audit-level=high` after `npm ci`.
- [ ] The step passes on `main` today (baseline is 0 vulns).
- [ ] Threshold (`high`) documented inline; rationale: block High/Critical, don't fail on Low/Moderate noise.
- [ ] `docs/LOCAL-GATE.md` notes the audit step so local runs match CI.
- [ ] Full `gate` (lint+typecheck+test+build) remains green.

## Implementation Approach
**Files to touch:** `.github/workflows/ci.yml` (add one step to the `gate` job, after install, before lint), `docs/LOCAL-GATE.md` (one line).

- Do **not** add a `package.json` script (guardrail: no new scripts). Invoke `npm audit --audit-level=high` directly as a workflow step.
- Place it in the `gate` job so it is part of the required check that protects `main`.
- Keep `e2e` job untouched.

## Test Strategy
- No unit test (CI-config change). Validate locally: `npm audit --audit-level=high` exits 0.
- Regression target: the `gate` job must stay green on the PR that introduces this; observe the new step in the Actions run.
