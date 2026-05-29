# Promotion Request: Spec 023 — Tailwind v4 (Oxide) Migration

## Overview
- **Spec:** 023 — Tailwind v4 (Oxide) migration
- **Wave:** Phase 2 — Major Features
- **Proposed By:** Gemini CLI Agent
- **Timestamp:** 2026-05-29T13:04:00-07:00
- **Status:** Pending Human / Operator Approval (⚠️ Scope Gate)

## Description
This is a request to approve the major version promotion of the styling toolchain in `salesforce-lite-crm` from **Tailwind v3.4.19** (JS-based configuration + classic PostCSS plugin) to **Tailwind v4.x** (Rust-based Oxide engine + `@tailwindcss/postcss` plugin).

This migration represents a significant upgrade to developer experience (DX) and build pipeline performance, offering up to **3.5× faster cold builds** and **8× faster incremental builds**. The transition will migrate configuration from JS files into a CSS-first setup using standard `@theme` directives in `app/globals.css`.

## Scope & Blast Radius
- **Proposed Dependency Upgrades:**
  - `tailwindcss` -> `4.x` (Major bump)
  - Add `@tailwindcss/postcss` (PostCSS integration plugin)
  - Re-evaluate PostCSS `postcss` override version (`8.5.15`)
- **Files to Modify:**
  - `package.json` (upgrade dependencies)
  - `postcss.config.mjs` (replace legacy tailwindcss/autoprefixer plugin with `@tailwindcss/postcss`)
  - `app/globals.css` (replace `@tailwind base;` etc. with `@import "tailwindcss";` and `@theme { ... }`)
  - `tailwind.config.ts` (trim or remove once migrated to CSS theme tokens)
- **Browser Posture Change:**
  - Tailwind v4 drops support for older browsers, targeting **Safari 16.4+, Chrome 111+, Firefox 128+**. This shift will be formally recorded in `docs/schema-changelog.md`-adjacent notes.

## Risks & Mitigation
1. **Visual Regression:** Since every styled component is compiled using a new Rust-based engine, minor utility rule shifts or missing design tokens could break layouts.
   - *Mitigation:* We will rely on our extensive suite of **591 unit/integration tests** and **52 Playwright E2E browser tests** as a regression net. We will add a render test case to assert token-dependent styles on a core component (e.g. Button) to verify styling continuity.
2. **Build and Pipeline Failures:** PostCSS integration changes can break under Next.js Turbopack compilation.
   - *Mitigation:* We will thoroughly run the local gate (`npm run build` and `npm run test`) under Turbopack to ensure error-free compilation and that the final bundle emits successfully.
3. **No Mixed Work:** In accordance with `plan/AGENTS.md` and `CLAUDE.md`, this migration will be completed inside a dedicated, isolated branch (`gemini/spec-023-tailwind-v4`) without any adjacent feature work.

## Request for Approval
Please approve this promotion request to allow checking out the feature branch, installing the required v4 packages, executing the official codemod, and stabilizing the build gate.
