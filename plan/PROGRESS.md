# PROGRESS — execution tracker

Status legend: `[ ] Todo` · `[~] In Progress` · `[x] Done`. One spec at a time per agent. Tick the spec's own Definition-of-Done checkboxes as you go; flip the line here only when the gate is green and the change is merged. Dependencies (`Dep`) must be `[x] Done` before a spec starts. ⚠️ = blocked pending dependency/scope approval (see `plan/AGENTS.md`).

**Overall: 1 / 24 done.** Baseline (2026-05-28): `npm install` 0 vulns · lint ✅ · `tsc --noEmit` ✅ · test **565 passed** ✅ · build ✅.

---

## Wave 0 — Quick Wins & Safety (1 / 8)

| Status | Spec | Title | Dep | Gate |
|:------:|:----|:------|:----|:----:|
| [x] Done | 001 | CI `npm audit` gate | — | |
| [ ] Todo | 002 | Zod v4 imports (`zod/v4`) | — | |
| [ ] Todo | 003 | Portable case-insensitive search | — | |
| [ ] Todo | 004 | Surface server-action errors | 009 | |
| [ ] Todo | 005 | `noUncheckedIndexedAccess` | — | |
| [ ] Todo | 006 | Vitest coverage reporting | — | ⚠️ |
| [ ] Todo | 007 | Reconcile ownership zones | — | |
| [ ] Todo | 008 | Security headers baseline | — | |

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
