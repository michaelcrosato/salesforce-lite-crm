# 008 — Add a security-headers / CSP baseline

- **Wave:** Phase 0 — Quick Wins & Safety
- **Status:** [x] Done
- **Scores:** Impact 3/5 · Feasibility 4/5 · Risk Med · Codebase Fit 4/5
- **Depends on:** none
- **Scope gate:** In-scope (additive `next.config.mjs` config)
- **Related:** `next.config.mjs`, research: Next 16 data-security guide, CVE-2025-55183 (no secrets in Server Functions)

## Description & Expected Impact
`next.config.mjs` sets `allowedDevOrigins`, `serverExternalPackages`, and `typedRoutes` but **no response security headers and no CSP**. The 2026 baseline for any Next.js app is a header set (CSP, `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`/`frame-ancestors`, `Strict-Transport-Security` when served over TLS). Even though this app is deliberately auth-less and local-first, Server Actions are POST endpoints reachable by anything that can hit the origin — defense-in-depth headers are cheap and make the app demo-credible.

Impact: closes the most visible 2026 security-baseline gap with a single config change.

## Definition of Done & Acceptance Criteria
- [x] `next.config.mjs` exports an `async headers()` returning a baseline set on all routes (`source: "/:path*"`): `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`, and a **`Content-Security-Policy-Report-Only`** (which also carries `frame-ancestors 'none'`).
- [x] CSP is **report-only first** to avoid breaking recharts SVG / Tailwind inline styles / Next's inline bootstrap; tighten to enforcing in a follow-up once violations are clean. (`script-src`/`style-src` allow `'unsafe-inline'`; `script-src` allows `'unsafe-eval'` for dev/Turbopack.)
- [x] `npm run build` green (Next validates the `headers()` shape at build; exit 0, "Compiled successfully"). Report-only is non-blocking **by construction** — no resource is blocked, so page rendering is unaffected. *Not run in this headless session: the manual enforce-mode browser dry-run (load dashboard/command palette, watch the console). Deferred to the enforcing follow-up; tracked as the next step before flipping to enforcing.*
- [x] An automated check asserts the headers are present — `tests/security-headers.test.ts` (2 cases) imports the config and asserts the exact baseline + report-only CSP directives. Runs under the authoritative vitest gate.

## Implementation Approach
**Files to touch:** `next.config.mjs` (add `headers()`).

- Keep the CSP permissive enough for Next 16 (`'self'`, `'unsafe-inline'` for styles initially given Tailwind/recharts; plan a nonce-based tightening later).
- Do not introduce `middleware.ts`/`proxy.ts` for this — `next.config.mjs` `headers()` is sufficient and avoids the deprecated-middleware surface (none exists today).

## Test Strategy
- **Integration (Playwright `request`):** assert the response carries the baseline headers on `/dashboard` and a server-action POST.
- **Manual:** load dashboard + open command palette in enforce-mode CSP dry-run; confirm charts render and no resources are blocked.
- Keep e2e green (the existing 50 specs should be unaffected by report-only CSP).

## Implementation Note (done 2026-05-29)
- **Automated check landed as vitest, not Playwright.** The DoD requires "an automated check"; I implemented it as `tests/security-headers.test.ts` (vitest) rather than an `e2e/` Playwright `request` spec, because vitest is the **authoritative inline gate** (CLAUDE.md §6: the Stop hook runs vitest + build), whereas the `e2e` CI job is advisory (`continue-on-error`, AGENTS.md). The vitest test asserts the config's `headers()` contract (exact baseline values + report-only CSP directives); `npm run build` independently validates that Next accepts the `headers()` shape. A Playwright `request` assertion on emitted response headers remains a valid future enhancement (matches the spec's primary strategy) and would prove runtime emission — not added here to keep the change minimal and to avoid claiming an unverified (server+browser) check.
- **`next.config.mjs` kept as `.mjs` (not renamed to `.ts`).** The filename is referenced by name in `AGENTS.md`, `PLAN.md`, `docs/ai/REPO_MAP.md`, `scripts/run-autonomous-loop.ps1`, and specs 014/017; a rename would ripple through all of them for no functional gain. To let a TS test import the plain-ESM config without tripping `tsc` (`allowJs: false`, so a static `import "@/next.config.mjs"` would be TS7016), the test resolves it through a runtime `new URL("../next.config.mjs", import.meta.url)` specifier — non-literal, so `tsc` does not statically resolve it — then narrows the dynamic import with a precise cast + runtime guard (no `any`, no `!`, no `@ts-ignore`).
- **HSTS intentionally omitted.** `Strict-Transport-Security` is only meaningful over TLS; this app is local-first/HTTP. Not in the DoD list. Add it at the TLS-terminating layer if the app is ever deployed behind HTTPS.
- **Enforcing CSP deferred.** Shipping `Content-Security-Policy-Report-Only` only. The follow-up (a new spec) should run the manual enforce-mode browser dry-run, confirm zero violations across dashboards/charts/command palette, then add the enforcing `Content-Security-Policy` header (ideally nonce-based to drop `'unsafe-inline'`/`'unsafe-eval'` from `script-src`).
- **Gate:** `npx tsc --noEmit` exit 0 · `npm run test` **568 passed** (566 + 2 new) · `npm run build` exit 0.
