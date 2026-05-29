# 010 — Component/UI unit tests (command palette, drawers, forms)

- **Wave:** Phase 1 — Core Upgrades
- **Status:** [ ] Todo
- **Scores:** Impact 4/5 · Feasibility 3/5 · Risk Med · Codebase Fit 4/5
- **Depends on:** 006 (coverage to measure the gain)
- **Scope gate:** ⚠️ **Requires dependency approval** — needs a DOM test environment (`@testing-library/react` + either `jsdom` or Vitest 4 Browser Mode via `@vitest/browser` + Playwright provider). `@testing-library/jest-dom@6.9.1` is already a devDep (intent exists) but the renderer + env are missing.
- **Related:** `components/command-palette.tsx`, `components/**` (drawers, forms), `vitest.config.ts`

## Description & Expected Impact
`components/**` (~17.7k LOC) has **zero unit tests** — it is exercised only indirectly through Playwright e2e. The highest-value, most logic-bearing components (the global **command palette** with its 120ms debounce + keyboard handling, the entity drawers, and the create/edit forms) have no fast feedback loop. Add a component test layer so UI logic is covered in milliseconds, not full e2e.

Impact: catches UI regressions pre-e2e, shrinks the feedback loop, and unlocks confident refactors of the busiest components.

## Definition of Done & Acceptance Criteria
- [ ] DOM test environment wired (decision recorded: **Vitest Browser Mode** for real-browser fidelity, or **jsdom** for speed — prefer jsdom unless browser-only APIs are needed).
- [ ] A `tests/components/` (or co-located) suite covers at minimum: command-palette (debounce fires once, keyboard open/close, result navigation), one create form (validation error surfaced), one drawer (open/close + content).
- [ ] Vitest config separates the node suite from the DOM suite (projects/workspace) so existing `environment: "node"` tests are unaffected.
- [ ] Coverage (spec 006) reflects the new component lines.
- [ ] Full gate green; deps pinned exactly and approved.

## Implementation Approach
**Files to touch:** `package.json` (devDeps — gated), `vitest.config.ts` (add a DOM project), new `tests/components/*.test.tsx`.

- Use `@testing-library/react` + `@testing-library/jest-dom` (already present) matchers.
- Mock server-action calls (`searchCrmAction`) at the module boundary; assert debounce via fake timers.
- Keep determinism: fake timers for the 120ms debounce.

## Test Strategy
- **Unit/component (vitest DOM project):** the new `.test.tsx` files.
- Do not duplicate e2e coverage — component tests assert logic/branches, e2e asserts full flows.
