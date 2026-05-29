# 005 — Enable `noUncheckedIndexedAccess` and fix fallout

- **Wave:** Phase 0 — Quick Wins & Safety
- **Status:** [x] Done
- **Scores:** Impact 4/5 · Feasibility 3/5 · Risk Med · Codebase Fit 5/5
- **Depends on:** none (do **before** large refactors so new code is written against it)
- **Scope gate:** In-scope (tsconfig flag + type-guard fixes; **no `any`/`@ts-ignore`** per CLAUDE.md §9)
- **Related:** `tsconfig.json`, fallout across `lib/**`, `app/**`, `components/**`

## Description & Expected Impact
`tsconfig.json` has `strict: true` but **not** `noUncheckedIndexedAccess`. That means `rows[0]`, `arr[i]`, and `record[key]` are typed as definitely-present, hiding real "undefined at runtime" bugs in a codebase with pervasive array/record indexing (especially the ~45k-LOC `lib/server` packet layer and map-heavy services). This is the single remaining gap versus the 2026 TypeScript strictness baseline (`tsc --init` now defaults this on).

Impact: closes a whole class of latent `undefined` bugs and raises the floor for all future code.

## Definition of Done & Acceptance Criteria
- [x] `tsconfig.json` adds `"noUncheckedIndexedAccess": true`.
- [x] `npx tsc --noEmit` exits 0 after all fallout is fixed with **proper guards** (`?.`, `??`, length checks, early returns); `!` used only where the undefined case is provably unreachable (see note), never `any`/`@ts-ignore`.
- [x] `npm run test` (568) and `npm run build` remain green (runtime behavior unchanged).
- [x] Fix commits are grouped by area for reviewability (`lib`, `components`, `prisma/seed`, `tests`, then the `tsconfig` flag flip last).

## Implementation Note (done 2026-05-29)
- **132 fallout errors** triaged by area: `lib` 43, `tests` 66, `prisma/seed` 16, `components` 7.
- **Production code (`lib`, `components`)** fixed with behavior-preserving narrowing only: early-return/throw guards that narrow, optional chaining, and `?? null`/`?? 0` where the union already included the fallback. One `!` in `lib/routing/leadRouter.ts` on `winningOrder`, guarded by a `throw` with a comment proving the preceding `length === 0` return makes it unreachable.
- **`prisma/seed.ts`** ([SEED CHANGE], changelog entry added): `!` on modulo-indexed reads (`arr[i % arr.length]`) into non-empty constant arrays, each with a one-line invariant comment. TypeScript strips `!`, so compiled JS and all seeded rows are byte-identical — V5K 0A1 routing determinism preserved.
- **Tests**: `!` on result-array/record reads whose elements are guaranteed by each test's own setup (spec-sanctioned: the undefined case is not real). No production-path `!` added for real undefined cases.
- **Green-at-each-commit**: area fix-commits were staged without `tsconfig.json` (the guards/`!` are valid TS with the flag still off), and the flag was flipped in the final commit once all fallout was fixed — so every committed snapshot typechecks.
- **Environmental finding (not a code change):** the `seeded cases cover case SLA states` test (`tests/seed-integrity.test.ts`) compares wall-clock `new Date()` against case ages anchored to seed-time `new Date()` (`prisma/seed.ts` `caseSlaSeedNow`). A stale shared SQLite baseline makes the `due_soon` case age into `overdue`, failing the suite independent of this spec. Resolved by re-seeding (`npm run seed`, the documented bootstrap step). Logged as a hardening candidate in `plan/BACKLOG.md`.

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
