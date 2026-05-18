# QA Automation

This repo uses a small automated QA layer around the README demo path.

## Vitest Logic Tests

Run:

```powershell
npm run test
```

Vitest covers deterministic server-side logic: validation schemas, forecast math,
dealer pacing/order calculations, lead routing helpers, analyst ranking, and
deterministic note summarization. Add focused tests under `tests/` or
`tests/api/` when changing logic that can be verified without a browser.

## Playwright Functional E2E Tests

Run:

```powershell
npm run test:e2e
```

Playwright covers user-visible flows under `e2e/`: primary navigation, lead form
input, detail state transitions, deal drawer/query behavior, drag/drop stage
movement, forecast input changes, and toast/result feedback. Prefer
`getByRole`, `getByLabel`, and `getByText`; use CSS selectors only when the UI
has no accessible locator for the target state.

`package.json` sets `playwright_browsers_path` to `0` so
`npx playwright install chromium` installs browsers under
`node_modules/playwright-core/.local-browsers` instead of the user-level
Playwright cache.

## Screenshot Regression

Visual smoke coverage lives in `e2e/visual-smoke.spec.ts` and uses:

```ts
await expect(page).toHaveScreenshot(...)
```

The current snapshots target stable demo-critical viewports and allow
`maxDiffPixels: 200` to absorb minor antialiasing/rendering differences without
hiding layout regressions.

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
