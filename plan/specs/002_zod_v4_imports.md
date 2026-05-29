# 002 — Migrate Zod imports to `zod/v4`

- **Wave:** Phase 0 — Quick Wins & Safety
- **Status:** [x] Done
- **Scores:** Impact 3/5 · Feasibility 4/5 · Risk Low · Codebase Fit 5/5
- **Depends on:** none
- **Scope gate:** In-scope (**no version bump** — `zod/v4` already ships inside the installed `zod@3.25.76`; no new dependency)
- **Related:** `lib/validation.ts`, `lib/ai/outputValidation.ts`, all `app/*/actions.ts`, `lib/server/pacingSnapshot*.ts`

## Description & Expected Impact
`zod@3.25.76` already contains the Zod 4 implementation under the `zod/v4` subpath (3.25.x and 4.0.0 are code-identical per the Zod changelog). Switching imports gives ~14× faster string parsing, ~7× array, ~6.5× object, ~10× faster `tsc`, and ~57% smaller core bundle — on the hot lead/deal/form `safeParse` paths and the pacing builder — at near-zero risk and **without changing the pinned version**.

Impact: measurable validation throughput + bundle win on the busiest code path in the app (every server action validates input with Zod).

## Definition of Done & Acceptance Criteria
- [x] Every source `import … from "zod"` becomes `from "zod/v4"` (prefer `import * as z from "zod/v4"`).
- [x] Error-handling code reconciled to the v4 issue API (v4 uses `error.issues`; verify any `.flatten()` / `.format()` / `.errors` usages still behave — fix call sites if shape differs).
- [x] `npm run typecheck`, `npm run test` (565 tests), `npm run build` all green — runtime behavior preserved.
- [x] `grep -rn "from \"zod\"" --include=*.ts` returns no bare-`zod` imports in source (test fixtures excluded only if deliberate).

> **Migration note (deviation from the "zero behavior change / tests unchanged" premise):** `zod/v4` is a real API/behavior shift, not a drop-in. Two reconciliations were required and the spec's Risk/Feasibility scoring understated this:
> 1. **Data-integrity fix (runtime behavior preserved, source changed):** v4's `.partial()` still injects `.default(...)` values for absent keys (v3 omitted them). Left as-is, `*UpdateSchema` payloads would inject defaults like `status`/`priority` and corrupt audit `changedFields` diffs. Fixed by overriding the defaulted enum fields back to `.optional()` on `leadUpdateSchema`, `taskUpdateSchema`, `caseUpdateSchema`, `knowledgeArticleUpdateSchema`, `campaignUpdateSchema` — restoring v3 behavior. `.default({})` → `.prefault({})` where input-side parsing was relied on.
> 2. **Test-wording reconciliation (~30 assertions):** v4 changed default issue messages/codes (`Unrecognized key(s) in object: 'X'` → `Unrecognized key: "X"`; `invalid_literal` → `invalid_value`; `Required` → `Invalid input: expected X, received undefined`; `Number must be ≤ N` → `Too big: expected number to be <=N`; `String must contain ≥1` → `Too small: expected string to have >=1 characters`). User-facing custom messages (`.min(1, "…")`) are unaffected. Assertions updated to v4 wording; no test logic weakened.

## Implementation Approach
**Files to touch:** `lib/validation.ts` (central schemas), `lib/ai/outputValidation.ts`, the 10 `app/*/actions.ts`, `lib/server/pacingSnapshotContracts.ts` + `pacingSnapshotBuilder.ts`, plus any other importer found via grep.

- Do a mechanical import rewrite first; run `typecheck` to surface any v3→v4 API drift.
- Pay attention to error formatting: if any code reads `result.error.errors`, migrate to `result.error.issues`; verify `flatten()` output keys used by form components.
- Land as one atomic commit (one logical change) if typecheck/test stay green; if API drift requires call-site edits, keep them in the same commit since they're part of the migration.

## Test Strategy
- Existing `tests/api/*Actions.test.ts` and validation tests are the regression net — they exercise `safeParse` success/failure for every entity.
- No new tests required; the win is that the **existing 565 tests pass unchanged** against `zod/v4`.
