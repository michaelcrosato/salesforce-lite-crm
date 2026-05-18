Agent: codex
Sprint: autonomous QA implementation
Feature: Automated QA layer for demo website features
Branch: chore/claude-hooks-r23
Timestamp: 2026-05-17T21:05:59-07:00
Escalation required: YES

### Active blockers

| # | File / module | Type | Description | Evidence | Awaiting | Safe next action |
|---|--------------|------|-------------|----------|---------|-----------------|
| 1 | `next-env.d.ts` | dependency | Next build regenerated the tracked auto-generated route-types reference outside this prompt's allowed files. | Final `git status --short` shows `M next-env.d.ts`; diff changes `import "./.next/dev/types/routes.d.ts";` to `import "./.next/types/routes.d.ts";`. PLAN.md says this file is auto-generated and should be treated as a dependency issue if unexpectedly modified. | decision whether to keep build-generated state, regenerate dev state, or ignore this file in the workflow | Leave it unstaged and do not include it in QA/report commits. |
| 2 | `.git/index.lock` | dependency | Git staging/commit is blocked by filesystem permissions. | `git add package.json docs/QA-AUTOMATION.md tests/qa-automation.test.ts e2e/demo-routes.spec.ts e2e/visual-smoke.spec.ts e2e/visual-smoke.spec.ts-snapshots/*.png` failed twice with `fatal: Unable to create 'C:/dev/salesforce-lite-crm/.git/index.lock': Permission denied`; `Test-Path .git/index.lock` returned `False`. | writable Git index permissions or manual staging/commit outside this sandbox | Leave implementation/report changes unstaged; do not attempt destructive Git recovery. |

### Resolved this prompt

- Resolved Playwright browser install blocker: `npx playwright install chromium` initially failed with `EPERM: operation not permitted, mkdir 'C:\Users\Michael Crosato\AppData\Local\ms-playwright\__dirlock'`; adding `package.json` config `playwright_browsers_path=0` made the exact install command use the repo-local browser cache, and the final full gate passed.
