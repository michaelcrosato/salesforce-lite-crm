# 023 — Tailwind v4 (Oxide) migration

- **Wave:** Phase 2 — Major Features
- **Status:** [ ] Todo
- **Scores:** Impact 2/5 · Feasibility 3/5 · Risk Med · Codebase Fit 3/5
- **Depends on:** 008 (CSP/headers settle first so a PostCSS pipeline change is isolated), 010 (component tests give a render-regression net)
- **Scope gate:** ⚠️ **Requires dependency approval** (Tailwind 3.4.19 → 4.x is a major bump + PostCSS plugin swap). CLAUDE.md §14 / LOOP §11: no dep changes without explicit scope. File a promotion request before executing; do **not** bundle with feature work.
- **Related:** `tailwind.config.ts`, `app/globals.css`, `postcss.config.mjs`, `package.json` (tailwindcss, @tailwindcss/postcss), Radix + CVA + tailwind-merge styling layer

## Description & Expected Impact
The repo is on Tailwind **3.4.19** (JS-config + classic PostCSS plugin). Tailwind **v4** ships the Rust **Oxide** engine: CSS-first configuration via `@theme`, automatic content detection (no `content` globbing), a single `@import "tailwindcss"`, and markedly faster (full builds ~3.5×, incremental ~8×+) compilation. The official `npx @tailwindcss/upgrade` codemod handles most of the migration.

Impact is **developer-experience / build-speed**, not user-facing — hence Impact 2. The reason it is a *Major Features* wave item rather than a Quick Win is the blast radius: every styled surface re-compiles through a new engine, and v4 drops support for older browsers (targets **Safari 16.4+, Chrome 111+, Firefox 128+**). Treat as opt-in modernization, not a safety upgrade.

## Definition of Done & Acceptance Criteria
- [ ] `tailwindcss` v4 installed with `@tailwindcss/postcss` replacing the legacy plugin in `postcss.config.mjs` (and `postcss` override re-validated — see the deliberate 8.5.15 pin).
- [ ] Config migrated to CSS-first: `@import "tailwindcss";` + `@theme { … }` in `app/globals.css`; the JS `tailwind.config.ts` is removed or reduced to the minimum the codemod leaves.
- [ ] Design tokens (colors, radii, fonts) that CVA/Radix components rely on are preserved — **no visual regression** on the core surfaces (deal kanban, list pages, command palette, dialogs).
- [ ] `npm run build` green under Turbopack with the new PostCSS pipeline; bundle CSS still emitted.
- [ ] Browser-support drop (Safari 16.4+) is recorded in `docs/schema-changelog.md`-adjacent notes or a short `docs/` note (not a schema change, but a posture change worth logging).
- [ ] Gate + e2e green; component render tests (spec 010) pass unchanged.

## Implementation Approach
**Files to touch:** `package.json` (dep swap), `postcss.config.mjs` (plugin swap), `app/globals.css` (`@import` + `@theme`), `tailwind.config.ts` (remove/trim), any file with v3→v4 renamed utilities the codemod flags.

- Run `npx @tailwindcss/upgrade` on a clean working tree in a dedicated branch; review every codemod diff (it rewrites class names like `shadow-sm`→`shadow-xs`).
- Manually port custom theme extensions from `tailwind.config.ts` into `@theme`.
- Diff the built CSS and spot-check the kanban + dialogs in a browser before claiming done (UI correctness ≠ green build).
- Keep it a **standalone PR** — never fold into a feature branch (it touches every styled component and would swamp review).

## Test Strategy
- **Component (spec 010 env):** existing render tests must pass; add snapshot/assertion coverage for one token-dependent component (e.g. a Button variant) to catch theme drift.
- **e2e (Playwright 1.60):** full suite green; visually confirm kanban + command palette render in the dev server.
- **Manual:** browser smoke on the highest-traffic surfaces; confirm no missing utilities in console.
