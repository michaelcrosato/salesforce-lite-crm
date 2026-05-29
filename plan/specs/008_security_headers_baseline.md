# 008 — Add a security-headers / CSP baseline

- **Wave:** Phase 0 — Quick Wins & Safety
- **Status:** [ ] Todo
- **Scores:** Impact 3/5 · Feasibility 4/5 · Risk Med · Codebase Fit 4/5
- **Depends on:** none
- **Scope gate:** In-scope (additive `next.config.mjs` config)
- **Related:** `next.config.mjs`, research: Next 16 data-security guide, CVE-2025-55183 (no secrets in Server Functions)

## Description & Expected Impact
`next.config.mjs` sets `allowedDevOrigins`, `serverExternalPackages`, and `typedRoutes` but **no response security headers and no CSP**. The 2026 baseline for any Next.js app is a header set (CSP, `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`/`frame-ancestors`, `Strict-Transport-Security` when served over TLS). Even though this app is deliberately auth-less and local-first, Server Actions are POST endpoints reachable by anything that can hit the origin — defense-in-depth headers are cheap and make the app demo-credible.

Impact: closes the most visible 2026 security-baseline gap with a single config change.

## Definition of Done & Acceptance Criteria
- [ ] `next.config.mjs` exports an `async headers()` returning a baseline set on all routes: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY` (or CSP `frame-ancestors 'none'`), and a **`Content-Security-Policy-Report-Only`** to start.
- [ ] CSP is **report-only first** to avoid breaking recharts SVG / Tailwind inline styles / Next's inline bootstrap; tighten to enforcing in a follow-up once violations are clean.
- [ ] `npm run build` green; app renders (dashboards/charts/command palette) with no console CSP-block errors in enforce-mode dry run.
- [ ] An automated check asserts the headers are present.

## Implementation Approach
**Files to touch:** `next.config.mjs` (add `headers()`).

- Keep the CSP permissive enough for Next 16 (`'self'`, `'unsafe-inline'` for styles initially given Tailwind/recharts; plan a nonce-based tightening later).
- Do not introduce `middleware.ts`/`proxy.ts` for this — `next.config.mjs` `headers()` is sufficient and avoids the deprecated-middleware surface (none exists today).

## Test Strategy
- **Integration (Playwright `request`):** assert the response carries the baseline headers on `/dashboard` and a server-action POST.
- **Manual:** load dashboard + open command palette in enforce-mode CSP dry-run; confirm charts render and no resources are blocked.
- Keep e2e green (the existing 50 specs should be unaffected by report-only CSP).
