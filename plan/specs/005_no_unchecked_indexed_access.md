# 005 — Enable `noUncheckedIndexedAccess` and fix fallout

- **Wave:** Phase 0 — Quick Wins & Safety
- **Status:** [ ] Todo
- **Scores:** Impact 4/5 · Feasibility 3/5 · Risk Med · Codebase Fit 5/5
- **Depends on:** none (do **before** large refactors so new code is written against it)
- **Scope gate:** In-scope (tsconfig flag + type-guard fixes; **no `any`/`@ts-ignore`** per CLAUDE.md §9)
- **Related:** `tsconfig.json`, fallout across `lib/**`, `app/**`, `components/**`

## Description & Expected Impact
`tsconfig.json` has `strict: true` but **not** `noUncheckedIndexedAccess`. That means `rows[0]`, `arr[i]`, and `record[key]` are typed as definitely-present, hiding real "undefined at runtime" bugs in a codebase with pervasive array/record indexing (especially the ~45k-LOC `lib/server` packet layer and map-heavy services). This is the single remaining gap versus the 2026 TypeScript strictness baseline (`tsc --init` now defaults this on).

Impact: closes a whole class of latent `undefined` bugs and raises the floor for all future code.

## Definition of Done & Acceptance Criteria
- [ ] `tsconfig.json` adds `"noUncheckedIndexedAccess": true`.
- [ ] `npm run typecheck` exits 0 after all fallout is fixed with **proper guards** (`?.`, `??`, length checks, early returns) — not `!` non-null assertions where the undefined case is real, and never `any`/`@ts-ignore`.
- [ ] `npm run test` (565) and `npm run build` remain green (runtime behavior unchanged).
- [ ] Fix commits are grouped by area for reviewability (e.g., `lib/server`, `lib/services`, `app`, `components`).

## Implementation Approach
**Files to touch:** `tsconfig.json` first; then iterate the typecheck error list.

- Flip the flag, run `npm run typecheck --pretty false`, and triage the error list by directory.
- Prefer narrowing patterns: destructure with defaults, guard `if (!first) return …`, use `at()`-style guards, `Map.get` null checks.
- Reserve `!` only where an invariant is already proven nearby (and add a one-line comment stating the invariant).
- This may be large; land incrementally per directory, keeping the gate green at each commit. Each commit is independently mergeable.

## Test Strategy
- **Typecheck is the gate** for this task — it must reach 0 errors.
- The existing 565 vitest tests + build guard that the guards introduced don't change runtime behavior.
- Consider a follow-up spec for `exactOptionalPropertyTypes` (out of scope here to keep the diff bounded).
