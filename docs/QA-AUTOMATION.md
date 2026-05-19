# QA Automation

This repo uses a small automated QA layer around the README demo path.

## Vitest Logic Tests

Run:

```powershell
npm run test
```

Vitest covers deterministic server-side logic: validation schemas, form actions,
list query helpers, CRM adapter CRUD/list behavior, forecast math, dealer
pacing/order calculations, lead routing helpers, opportunity stage history,
search services, report services, task/case/campaign services, CSV helpers,
analyst ranking, and deterministic note summarization. Add focused tests under
`tests/` or `tests/api/` when changing logic that can be verified without a
browser.

## Playwright Functional E2E Tests

Run:

```powershell
npm run test:e2e
```

Playwright covers user-visible flows under `e2e/`: primary navigation, lead form
input, lead status transitions, deal drawer/query behavior, drag/drop stage
movement, forecast input changes, toast/result feedback, excluded-route
guardrails, command-palette search, reports, and task/case/campaign creation
plus drawer updates.
Prefer `getByRole`, `getByLabel`, and `getByText`; use CSS selectors only when
the UI has no accessible locator for the target state.

`e2e/demo-path.spec.ts` currently contains a skipped end-to-end script with
older test-id assumptions. Do not cite it as active coverage until it is
rewritten and unskipped.

`package.json` sets `playwright_browsers_path` to `0` so
`npx playwright install chromium` installs browsers under
`node_modules/playwright-core/.local-browsers` instead of the user-level
Playwright cache.

## Screenshot Regression

Visual smoke coverage lives in `e2e/visual-smoke.spec.ts` and uses:

```ts
await expect(page).toHaveScreenshot(...)
```

The current snapshots target stable demo-critical Windows viewports for
`/dashboard` and `/areas` and allow `maxDiffPixelRatio: 0.05` to absorb minor
antialiasing/rendering differences without hiding large layout regressions.

Update snapshots intentionally with:

```powershell
npx playwright test e2e/visual-smoke.spec.ts --update-snapshots
```

Review changed PNGs before committing them.

## Optional Playwright MCP Sweep

When the Playwright MCP/browser tools are available, use them for an exploratory
vision/accessibility sweep before or after writing tests: visit affected routes,
inspect the accessibility tree, click controls, fill forms, and confirm visible
state changes. MCP inspection complements committed tests; it does not replace
the local gate.
