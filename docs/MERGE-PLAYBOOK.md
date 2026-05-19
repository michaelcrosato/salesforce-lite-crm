# Merge Playbook

## Pre-Merge Checks

1. Confirm the source branch matches the assigned agent and feature.
2. Read that agent's latest `SUMMARY.<agent>.md` and `BLOCKERS.<agent>.md`.
3. Confirm the branch does not touch unrelated ownership zones without a documented reason.
4. Run or verify the local gate from `docs/LOCAL-GATE.md`.
5. Run the route and drift scans:

```powershell
rg -n "/deals/\[id\]|/deals/\$\{id\}|/deals/:id" .
rg -n "Lead.*B2B|B2B.*Lead|lead conversion|Lead conversion" .
rg -n "lint passed|typecheck passed|npm run lint|npm run typecheck|npm run format|prettier passed" .
```

## Merge Order

Use the order defined by the current project prompt or `PLAN.md`. When no order is defined, merge the least cross-cutting branch first and the branch with broadest tests last.

For the current handoff, the intended phase order is:

1. Codex contract/API readiness branch.
2. Claude UI/e2e branch.
3. Grok data/report helpers branch.
4. Gemini gate/e2e hardening branch when created.

## Conflict Ownership

- App route conflicts: Claude-owned unless the current prompt says otherwise.
- Component/style conflicts: Grok-owned unless the current prompt says otherwise.
- Service, adapter, routing, forecast, and seed conflicts: Codex-owned unless the current prompt says otherwise.
- Tests, e2e, helper scripts, and test config conflicts: Gemini-owned unless the current prompt says otherwise.
- Shared coordination files: resolve by `PLAN.md`, `CRM-CONTRACT.md`, current prompt, and local gate output.

## Red Feature Procedure

If a branch is red:

1. Record the failing command, exit code, and final meaningful output in that agent's blocker file.
2. Keep implementation changes unmerged unless the current prompt explicitly asks for a diagnostic merge.
3. Preserve the branch and report files for follow-up.
4. Continue with independent branches only if they do not depend on the red branch.

## Rollback And Archive Procedure

Before risky integration, create an archive:

```powershell
scripts/archive-current-head.ps1
```

Prefer `git revert <merge-sha>` for merged commits that need to be backed out. Avoid destructive reset commands unless a current prompt explicitly directs that recovery path.

## Final Gate

After all intended merges:

```powershell
npm install
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
npx prisma generate
npx prisma db push
npm run seed
npm run lint
npm run typecheck
npm run test
npm run build
npx playwright install chromium
npm run test:e2e
```

## Route Scan For Deal Detail

Docs may mention `/deals/[id]` only as deferred, excluded, or not implemented
as a live detail route. Live route links or non-placeholder app-router behavior
must not introduce `/deals/[id]` unless that feature is explicitly promoted.

## Preserving Reports

Keep every agent's latest `SUMMARY.<agent>.md` and `BLOCKERS.<agent>.md` with the branch they describe. When merging, do not overwrite another agent's report with stale content.
