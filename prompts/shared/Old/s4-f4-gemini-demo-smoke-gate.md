# S4-F4 - Gemini Demo Smoke And Gate Hardening

## Target

- Agent: Gemini
- Sprint feature: S4-F4 - Demo smoke and gate hardening
- Target branch: `gemini/sprint-4-demo-smoke-gate-hardening`
- Worktree: `C:\dev\salesforce-lite-crm-gemini`
- Execution topology: parallel mode; ownership zones are mandatory.
- Report files: `SUMMARY.gemini.md`, `BLOCKERS.gemini.md`

## Files And Zones In Scope

- `tests/**`
- `e2e/**`
- `scripts/**`
- `playwright.config.ts`
- `vitest.config.ts`

## Files And Zones Out Of Scope

- Server data, seed, routing, and forecast zones owned by other agents.
- Route/page UI zones owned by other agents.
- Shared component and styling zones owned by other agents.
- Shared coordination and planning/decision zones unless a blocker-free current prompt grants explicit scope.
- Runtime product behavior, schema changes, and new product routes.

## One-Run Exceptions

- None by default. If the current run prompt grants an exception, keep it minimal and record it in the Gemini reports.

## Gate Commands

Run from the repo root:

```powershell
npm run seed
npm run build
npx playwright install chromium
npm run test:e2e
```

Do not claim `lint`, `typecheck`, or `format` passed unless those scripts exist in the repo and the current run prompt asks for them.

## Acceptance Criteria

Tests/e2e support the README demo path, implemented CRM routes, and excluded-route guard rails. Local gate commands are documented accurately and failures are captured in `BLOCKERS.gemini.md`. Subject to §3 worktree availability.

## Stop Conditions

- Current branch is not under the `gemini/` prefix and cannot be corrected within the current prompt.
- The required work needs another agent's zone, a shared coordination file, runtime product changes, or a new route without explicit current-prompt scope.
- A gate command still fails after the same-command repair cap.
- A missing dependency, worktree mismatch, or product-contract ambiguity prevents safe repo-local progress.

## Continue Conditions

- Worktree is clean or only contains current-prompt changes.
- Branch is under the `gemini/` prefix.
- All intended edits stay within the in-scope zones or are explicitly granted by the current prompt.
- Gate commands pass after any allowed repo-local repair attempts.
