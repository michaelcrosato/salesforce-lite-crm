# S4-F3 - Grok Component Polish

## Target

- Agent: Grok
- Sprint feature: S4-F3 - Component polish
- Target branch: `grok/sprint-4-component-polish`
- Worktree: `C:\dev\salesforce-lite-crm-grok`
- Report files: `SUMMARY.grok.md`, `BLOCKERS.grok.md`

## Files And Zones In Scope

- `components/**`
- `app/globals.css`
- `tailwind.config.ts`

## Files And Zones Out Of Scope

- Server data, seed, routing, and forecast zones owned by other agents.
- Route/page ownership outside component integration already exposed through in-scope components.
- Test/e2e/supervisor-script zones owned by other agents unless the current run prompt explicitly grants a narrow exception.
- Shared coordination and planning/decision zones unless a blocker-free current prompt grants explicit scope.
- Business logic changes, schema changes, and new product routes.

## One-Run Exceptions

- None by default. If the current run prompt grants an exception, keep it minimal and record it in the Grok reports.

## Gate Commands

Run from the repo root:

```powershell
npm run build
npm run test:e2e
```

Do not claim `lint`, `typecheck`, or `format` passed unless those scripts exist in the repo and the current run prompt asks for them.

## Acceptance Criteria

Shared components used in the demo have stable spacing, readable empty states, deterministic ordering, and no broken links or orphaned actions.

## Stop Conditions

- Current branch is not under the `grok/` prefix and cannot be corrected within the current prompt.
- The required work needs another agent's zone, a shared coordination file, business logic changes, or a new route without explicit current-prompt scope.
- A gate command still fails after the same-command repair cap.
- A missing dependency, worktree mismatch, or product-contract ambiguity prevents safe repo-local progress.

## Continue Conditions

- Worktree is clean or only contains current-prompt changes.
- Branch is under the `grok/` prefix.
- All intended edits stay within the in-scope zones or are explicitly granted by the current prompt.
- Gate commands pass after any allowed repo-local repair attempts.
