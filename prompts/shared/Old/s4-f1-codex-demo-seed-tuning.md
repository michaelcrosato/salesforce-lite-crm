# S4-F1 - Codex Demo Seed Tuning

## Target

- Agent: Codex
- Sprint feature: S4-F1 - Demo seed tuning
- Target branch: `codex/sprint-4-demo-seed-tuning`
- Worktree: `C:\dev\salesforce-lite-crm-codex`
- Execution topology: parallel mode; ownership zones are mandatory.
- Report files: `SUMMARY.codex.md`, `BLOCKERS.codex.md`

## Files And Zones In Scope

- `prisma/seed.ts`
- `lib/server/**`
- `lib/db/**`
- `lib/routing/**`
- `lib/forecast/**`

## Files And Zones Out Of Scope

- Route/page UI zones owned by other agents.
- Shared component styling zones owned by other agents.
- Test/e2e/supervisor-script zones owned by other agents unless the current run prompt explicitly grants a narrow exception.
- Shared coordination and planning/decision zones unless a blocker-free current prompt grants explicit scope.
- Runtime product scope outside existing demo data, routing, forecasting, and deterministic analyst behavior.

## One-Run Exceptions

- None by default. If the current run prompt grants an exception, keep it minimal and record it in the Codex reports.

## Gate Commands

Run from the repo root:

```powershell
npx prisma generate
npx prisma db push
npm run seed
npm run test
npm run build
```

Do not claim `lint`, `typecheck`, or `format` passed unless those scripts exist in the repo and the current run prompt asks for them.

## Acceptance Criteria

Seeded data supports the README demo path: Vancouver lead routing (`V5K 0A1`), behind-pace dealer orders, stale high-value deals, low-health dealer accounts, and deterministic analyst actions. No schema expansion unless the current prompt or contract scope calls for it.

## Stop Conditions

- Current branch is not under the `codex/` prefix and cannot be corrected within the current prompt.
- The required work needs a shared coordination file, another agent's zone, schema expansion, or new product scope without explicit current-prompt scope.
- A gate command still fails after the same-command repair cap.
- A missing dependency, worktree mismatch, or product-contract ambiguity prevents safe repo-local progress.

## Continue Conditions

- Worktree is clean or only contains current-prompt changes.
- Branch is under the `codex/` prefix.
- All intended edits stay within the in-scope zones or are explicitly granted by the current prompt.
- Gate commands pass after any allowed repo-local repair attempts.
