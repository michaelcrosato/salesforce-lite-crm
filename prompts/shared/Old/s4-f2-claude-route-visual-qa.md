# S4-F2 - Claude Route Visual QA

## Target

- Agent: Claude
- Sprint feature: S4-F2 - Route visual QA
- Target branch: `claude/sprint-4-route-visual-qa`
- Worktree: `C:\dev\salesforce-lite-crm-claude`
- Execution topology: parallel mode; ownership zones are mandatory.
- Report files: `SUMMARY.claude.md`, `BLOCKERS.claude.md`

## Files And Zones In Scope

- `app/**`

## Files And Zones Out Of Scope

- Server data, seed, routing, and forecast zones owned by other agents.
- Shared component and global styling zones owned by other agents.
- Test/e2e/supervisor-script zones owned by other agents unless the current run prompt explicitly grants a narrow exception.
- Shared coordination and planning/decision zones unless a blocker-free current prompt grants explicit scope.
- Business logic changes and new product routes.

## One-Run Exceptions

- None by default. If the current run prompt grants an exception, keep it minimal and record it in the Claude reports.

## Gate Commands

Run from the repo root:

```powershell
npm run build
npm run test:e2e
```

Do not claim `lint`, `typecheck`, or `format` passed unless those scripts exist in the repo and the current run prompt asks for them.

## Acceptance Criteria

Demo-critical routes render coherently: `/dashboard`, `/leads`, `/leads/<id>`, `/orders`, `/orders/<id>`, `/areas`, `/forecast`, `/accounts`, `/accounts/<id>`, `/contacts`, `/contacts/<id>`, `/deals`, `/activities`, `/tasks`, `/cases`, `/campaigns`, `/reports`, and representative report detail pages. Excluded routes remain placeholder-only or 404. Visual fixes must not change business logic.

## Stop Conditions

- Current branch is not under the `claude/` prefix and cannot be corrected within the current prompt.
- The required work needs another agent's zone, a shared coordination file, business logic changes, or a new route without explicit current-prompt scope.
- A gate command still fails after the same-command repair cap.
- A missing dependency, worktree mismatch, or product-contract ambiguity prevents safe repo-local progress.

## Continue Conditions

- Worktree is clean or only contains current-prompt changes.
- Branch is under the `claude/` prefix.
- All intended edits stay within `app/**` or are explicitly granted by the current prompt.
- Gate commands pass after any allowed repo-local repair attempts.
