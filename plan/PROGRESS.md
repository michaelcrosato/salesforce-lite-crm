# PROGRESS — execution tracker

Status legend: `[ ] Todo` · `[~] In Progress` · `[x] Done`. One spec at a time per agent. Tick the spec's own Definition-of-Done checkboxes as you go; flip the line here only when the gate is green and the change is merged. Dependencies (`Dep`) must be `[x] Done` before a spec starts. ⚠️ = blocked pending dependency/scope approval (see `plan/AGENTS.md`).

**Overall: 5 / 24 done.** Baseline (2026-05-28): `npm install` 0 vulns · lint ✅ · `tsc --noEmit` ✅ · test **565 passed** ✅ · build ✅. Latest gate (2026-05-29, spec 008): `tsc --noEmit` ✅ · test **568 passed** ✅ · build ✅.

---

## Wave 0 — Quick Wins & Safety (5 / 8)

| Status | Spec | Title | Dep | Gate |
|:------:|:----|:------|:----|:----:|
| [x] Done | 001 | CI `npm audit` gate | — | |
| [x] Done | 002 | Zod v4 imports (`zod/v4`) | — | |
| [x] Done | 003 | Portable case-insensitive search | — | |
| [ ] Todo | 004 | Surface server-action errors | 009 | |
| [ ] Todo | 005 | `noUncheckedIndexedAccess` | — | |
| [ ] Todo | 006 | Vitest coverage reporting | — | ⚠️ |
| [x] Done | 007 | Reconcile ownership zones | — | |
| [x] Done | 008 | Security headers baseline | — | |

## Wave 1 — Core Upgrades (0 / 10)

| Status | Spec | Title | Dep | Gate |
|:------:|:----|:------|:----|:----:|
| [ ] Todo | 009 | Structured logging | — | |
| [ ] Todo | 010 | Component unit tests | 006 | ⚠️ |
| [ ] Todo | 011 | Reachability gate + retire CSV tower | — | |
| [ ] Todo | 012 | Parallel-safe tests | — | |
| [ ] Todo | 013 | Fix e2e + promote to required | — | |
| [ ] Todo | 014 | Targeted caching + revalidation | 013 | |
| [ ] Todo | 015 | Consolidate agent prompts | — | |
| [ ] Todo | 016 | Complete PR-merge migration | — | |
| [ ] Todo | 017 | React Compiler evaluation (spike) | 010 | ⚠️ |
| [ ] Todo | 018 | Audit-event write coverage | 009, 006 | |

## Wave 2 — Major Features (0 / 6)

| Status | Spec | Title | Dep | Gate |
|:------:|:----|:------|:----|:----:|
| [ ] Todo | 019 | Saved views + persisted filters | 014 | |
| [ ] Todo | 020 | Bulk actions (Leads & Deals) | 019, 018 | |
| [ ] Todo | 021 | CSV export for core entities | 019 | |
| [ ] Todo | 022 | Optimistic UI for deal kanban | 014, 010 | |
| [ ] Todo | 023 | Tailwind v4 (Oxide) migration | 008, 010 | ⚠️ |
| [ ] Todo | 024 | Audit-trail change-history UI | 018 | |

---

## Suggested first-five (unblocked, no approval needed)

In order: **001** → **002** → **003** → **007** → **009**. All are dependency-free, low-risk, and need no new deps. `009` then unblocks `004` and (with `006`) `018`. See `plan/ROADMAP.md` for the full DAG.

## Blocked / needs approval before start

- **006, 010, 017, 023** — new dependency required (CLAUDE.md §14). File a promotion request first.
- **019** — confirm against `PLAN.md` §4 (list-view expansion) before building.
- **016, 013** — branch-protection / `enforce_admins` flips are the closing, only-after-green step.

## Log

- 2026-05-28 — Blueprint generated (24 specs + ROADMAP + AGENTS + PROGRESS). Nothing executed yet; all specs `Todo`. Baseline green.
- 2026-05-28 — **001 Done** (branch `phase-0-quick-wins`). Files: `.github/workflows/ci.yml` (+`npm audit --audit-level=high` step in `gate`), `docs/LOCAL-GATE.md` (+audit line). Validated: `npm audit --audit-level=high` → 0 vulns, exit 0.
- 2026-05-28 — **002 Done** (branch `phase-0-quick-wins`, `[CROSS-ZONE OK]` — migration spans `lib/**`, `app/**`, `tests/**`). All source `from "zod"` → `from "zod/v4"`. Validated: `npm run typecheck` exit 0 · `npm run test` **565 passed** · `npm run build` exit 0 ("Compiled successfully"). **Spec premise was inaccurate** ("zero behavior change / 565 tests pass unchanged"): v4 is a real API shift. Required (a) a data-integrity fix — v4 `.partial()` injects `.default()` values for absent keys, so the 5 `*UpdateSchema` (lead/task/case/knowledgeArticle/campaign) override defaulted enums back to `.optional()` to preserve v3 update-payload behavior + protect audit `changedFields`; `.default({})`→`.prefault({})` for input-side parsing; and (b) ~30 test-assertion wording updates for changed v4 default issue messages/codes. User-facing custom validation strings unaffected. Re-score: Risk Medium, not Low. See spec 002 migration note.
- 2026-05-28 — **003 Done** (branch `phase-0-quick-wins`, `[CROSS-ZONE OK]` — touches `lib/prisma.ts`, `lib/services/search.ts`, `tests/api/search.test.ts` [gemini zone]). Added `databaseProvider()` to `lib/prisma.ts` (reused by `createPrismaClient`); `globalSearch`'s `contains` helper now returns `{ contains, mode: "insensitive" }` on Postgres and `{ contains }` on SQLite. New unit test pins case-folding (`ACME`/`acme`/`AcMe` → "Acme Insulation Co"). SQLite client lacks `mode` in `StringFilter`, so a dedicated filter type avoids `any`. Validated: `npm run typecheck` exit 0 · `npm run test` **566 passed** · `npm run build` exit 0.
- 2026-05-29 — **008 Done** (branch `phase-0-quick-wins`). Files: `next.config.mjs` (+`async headers()` → baseline `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`, `Content-Security-Policy-Report-Only` on `source: "/:path*"`), `tests/security-headers.test.ts` (new, 2 cases). **Two deliberate deviations** (see spec 008 Implementation Note): (a) automated check landed as **vitest**, not the spec's Playwright `request` — vitest is the authoritative inline gate (CLAUDE.md §6) while e2e is advisory; the test imports the `.mjs` config via a runtime `new URL(..., import.meta.url)` specifier to dodge `tsc`'s `allowJs:false` (no `any`/`@ts-ignore`), and `npm run build` independently validates the `headers()` shape. (b) `next.config.mjs` kept (not renamed `.ts`) — filename is referenced in AGENTS.md/PLAN.md/REPO_MAP/run-autonomous-loop.ps1/specs 014,017. **CSP is report-only only** (enforcing + manual browser dry-run deferred to a follow-up spec); HSTS omitted (HTTP/local-first). Validated: `npx tsc --noEmit` exit 0 · `npm run test` **568 passed** · `npm run build` exit 0.
- 2026-05-29 — **007 Done** (branch `phase-0-quick-wins`, `[CONFIG CHANGE]` for `.claude/zones.json`; also touches shared-zone `AGENTS.md` + `PLAN.md`). Removed phantom `lib/types/`/`lib/db/`/`lib/forecast/` paths; Codex zone now reads the real tree (`lib/server`, `lib/services`, `lib/business`, `lib/routing`, `lib/ai`, `lib/prisma.ts`, `prisma/seed.ts`) consistently across `AGENTS.md`, `.claude/zones.json`, and `PLAN.md` §5. PLAN.md is mixed CRLF/LF → edited byte-precisely via a one-shot Node script (verified 1 row + 1 bullet matched), not the Edit tool. Remaining `--include=*.md` phantom matches are only spec 007, the PLAN.md "Rejected:" ADR note, and sprint-4 `prompts/shared/**` (all historical). Validated: `npm run test` **566 passed** · `npm run build` exit 0.
