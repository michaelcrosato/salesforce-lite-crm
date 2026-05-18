Agent: codex
Sprint: autonomous QA implementation
Feature: Automated QA layer for demo website features
Branch: chore/claude-hooks-r23
Status: blocked
Commits this prompt: none
Gate status: PASS
DoD self-check: FAIL
Timestamp: 2026-05-17T21:05:59-07:00

### Completed this prompt
- Scope: added automated QA coverage for the verified README/app-router demo routes and deterministic business logic. `git diff main --name-only` on this branch showed process/hook files, not app route/component changes, so coverage targets the existing demo website surface.
- Files changed: `docs/QA-AUTOMATION.md`, `tests/qa-automation.test.ts`, `e2e/demo-routes.spec.ts`, `e2e/visual-smoke.spec.ts`, `e2e/visual-smoke.spec.ts-snapshots/*.png`, `package.json`, `SUMMARY.codex.md`, and `BLOCKERS.codex.md`.
- One-run exception reason: the current prompt explicitly authorized Codex to edit Gemini-owned `tests/**` and `e2e/**` for this QA implementation.
- Added Vitest coverage for forecast math, validation normalization/rejection, dealer pacing/order focus calculations, route-link contracts, and deterministic note summary precedence.
- Added Playwright functional E2E coverage for primary navigation, `/deals?deal=<id>` drawer flow, and lead-detail status transition feedback.
- Added Playwright screenshot smoke coverage for stable demo-critical dashboard/areas desktop and mobile viewports, with `maxDiffPixels: 200` documented.
- Added `package.json` test tooling config `playwright_browsers_path=0` so the exact gate command `npx playwright install chromium` installs to the repo-local Playwright browser cache instead of the user AppData cache.
- Commands run: `git status --short`; `git diff main --name-only`; `git merge-base HEAD main`; `git diff --name-status main...HEAD`; `npm run seed`; attempted Playwright MCP navigation/inspection but the MCP tool calls returned `user cancelled MCP tool call`; `npm run test`; `npx playwright install chromium` (initially failed on AppData lock creation, then passed after the package config); `npx playwright test e2e/visual-smoke.spec.ts --update-snapshots`; `npm run test:e2e`; `git diff --check -- docs/QA-AUTOMATION.md e2e/demo-routes.spec.ts e2e/visual-smoke.spec.ts tests/qa-automation.test.ts package.json`; full gate sequence twice after final test changes: `npm install`, `.env` copy guard, `npx prisma generate`, `npx prisma db push`, `npm run seed`, `npm run test`, `npm run build`, `npx playwright install chromium`, `npm run test:e2e`; `git add ...` for the QA implementation files, which failed with `.git/index.lock` permission denied.
- Gate status: the final full local gate completed successfully. `npm install` reported existing audit findings (12 vulnerabilities) but exited 0.
- Remaining blockers: commit/report DoD is blocked by Git index lock creation permissions, and `next-env.d.ts` remains modified by the final `next build` generated state outside the allowed edit scope.

### Next action
Resolve Git index write permissions and the generated `next-env.d.ts` state, then commit the QA implementation and report files in separate commits.

### Scope confirmation
No cross-ownership edits: NO
CRM-CONTRACT.md honored: YES
