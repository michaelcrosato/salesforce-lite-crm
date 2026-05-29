# 017 — Evaluate & gate React Compiler enablement

- **Wave:** Phase 1 — Core Upgrades
- **Status:** [ ] Todo
- **Scores:** Impact 3/5 · Feasibility 3/5 · Risk Med · Codebase Fit 4/5
- **Depends on:** 010 (component tests give a safety net for memoization changes)
- **Scope gate:** ⚠️ **Spike + decision, not guaranteed adoption** — adopting requires the `babel-plugin-react-compiler` dependency (gated) and accepting slower Babel-based builds.
- **Related:** `next.config.mjs`, React 19.2 Compiler (1.0), `docs/decisions.md`

## Description & Expected Impact
React 19's Compiler (now 1.0) auto-memoizes components, generally removing the need for hand-written `useMemo`/`useCallback` across re-render-heavy surfaces (the deal kanban, the activity timeline, the command palette). Next 16 supports it via `reactCompiler: true`. But it is Babel-based (slower builds), opt-in, **skips components that violate the Rules of Hooks**, and can't see across library boundaries — so it must be measured, not assumed.

Impact: potential render-perf + DX win (less manual memoization), but only if the build-time cost and correctness check out. This spec is the controlled experiment that produces a go/no-go.

## Definition of Done & Acceptance Criteria
- [x] On a spike branch: enable `reactCompiler: true` (+ `babel-plugin-react-compiler`), build, and **measure** build-time delta, bundle delta, and a manual render-perf check on kanban/timeline.
- [x] Run the `eslint-plugin-react-hooks` / compiler diagnostics to find Rules-of-Hooks violations the compiler would skip; record them.
- [x] A **decision is recorded in `docs/decisions.md`** (adopt / defer / reject) with the measured numbers.
- [ ] If adopted: dependency added (exact pin, approved), lint clean, full gate + e2e green, no hydration regressions.
- [x] If deferred/rejected: the spike branch is discarded and the rationale is documented — no half-enabled state on `main`.

## Implementation Approach
**Files to touch (spike):** `next.config.mjs`, `package.json` (gated dep), `docs/decisions.md`.

- Treat as a time-boxed spike; do not merge a partially-enabled compiler.
- Compare cold/warm build times against the current Turbopack baseline.

## Test Strategy
- **Build + e2e** on the spike branch to detect memoization-induced hydration/interaction regressions.
- The deliverable is the **decision record**, not necessarily a code change.
