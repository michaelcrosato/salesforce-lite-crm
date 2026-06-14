# Salesforce Lite CRM

> **Honest status (2026-06-14): research + spec only. There is no implementation yet.**
> No `src/`, no `prisma/`, no app, no tests. This repo is a clean slate with a
> strong research foundation and an AI operations engine ready to build on. The
> previous implementation was intentionally purged on 2026-06-09 and is
> recoverable from git history at tag `pre-purge-20260609` — but rebuilding
> deliberately from the research, not resurrecting the old code, is the plan.

A local-first, lightweight CRM for small-business revenue operations — accounts,
contacts, opportunities, activities, and tasks — designed to be built and
extended by autonomous AI coding agents under a deterministic quality gate.

## What this is meant to be

A small, honest, **single-tenant local-first CRM**. The intended product is
deliberately narrow: the core operating loop for one small team — manage
accounts and contacts, track opportunities through pipeline stages, log
activities and tasks, and run a handful of built-in reports. It is explicitly
**not** a Salesforce clone and not (under the current contract) a multi-tenant
SaaS.

The product contract lives in [`GOAL.md`](GOAL.md). Where this README and
`GOAL.md` disagree, `GOAL.md` is the spec — but note that `GOAL.md` itself is
mid-cleanup and still references files from the purged codebase; treat it as the
*intended direction*, not a description of current contents.

## Local-first architecture (intended)

- **Single tenant, local-first.** Runs against a local **SQLite** database by
  default. No login, no multi-tenant separation, no cloud dependency to use it.
- **Synthetic data only.** Seeded local data for development; never live customer
  data.
- **Boring, visible stack.** Schemas, migrations, routes, and tests on disk so
  an AI agent (or a human) can orient quickly and work in vertical slices
  (schema → persistence → UI → tests).

**Open architectural decision (must be made before schema work):** the salvaged
research (below) describes a *multi-tenant Postgres row-level-security* design,
which directly contradicts the local-first single-tenant SQLite contract in
`GOAL.md`. The engineering review recommends honoring `GOAL.md` (build
single-tenant SQLite; shelve the RLS material). This is recorded as the
first thing to resolve — see the review and `roadmap/DECISIONS.md`.

## Intended stack

Nothing is installed yet (`package.json` carries only the operations-engine
toolchain). The intended product stack, **to be version-verified live before
adoption** (per the freshness rule in `CLAUDE.md`):

- Next.js + React (app + UI)
- Prisma ORM over **SQLite** (`@prisma/adapter-better-sqlite3`) for the local
  runtime
- Vitest (unit/service/contract tests) + Playwright (user-visible flows)
- Biome + TypeScript (lint + typecheck), wired into the deterministic gate

## The research foundation (the real asset today)

The most valuable content in this repo is in
[`docs/research/ralph-crm-reviews/`](docs/research/ralph-crm-reviews/): three
independent, evidence-cited deep reviews of three prior CRM build attempts, plus
a synthesis. This is decision-ready material, not filler.

- [`README.md`](docs/research/ralph-crm-reviews/README.md) — synthesis: the
  eight design decisions all three attempts independently converged on, the
  shared failure mode (loops degenerating into honest busywork once the backlog
  drains), and the open SQLite-vs-Postgres product decision.
- [`codex-ralph-crm.md`](docs/research/ralph-crm-reviews/codex-ralph-crm.md) —
  the most implemented variant; a fully-specified entity schema, lead-conversion
  flow, audit pattern, and test strategy. **Start a rebuild here.**
- [`claude-ralph-crm.md`](docs/research/ralph-crm-reviews/claude-ralph-crm.md) —
  the strongest harness/process methodology (and a cautionary tale: zero product
  features in 72 cycles).
- [`agy-ralph-crm.md`](docs/research/ralph-crm-reviews/agy-ralph-crm.md) — the
  broadest feature catalog and AFK-loop skeleton; use as a reference, not a
  backlog.

## How it gets built

This is a 100% AI-coded project run by an AI operations engine. Humans plan (in
[`roadmap/ROADMAP.md`](roadmap/ROADMAP.md)) and do final QA; agents write every
line under a deterministic gate. See [`CLAUDE.md`](CLAUDE.md) for the agent
constitution and [`AI_OPERATIONS_PLAN.md`](AI_OPERATIONS_PLAN.md) for how the
factory works.

## Pointers

- **Read the honest assessment first:**
  [`docs/ENGINEERING_REVIEW.md`](docs/ENGINEERING_REVIEW.md) — full audit:
  verdict, what exists vs what's claimed, research quality, risks, and the top
  five things to do first.
- **Roadmap:** [`roadmap/ROADMAP.md`](roadmap/ROADMAP.md) — Now / Next / Later /
  Ideas, starting with the first buildable CRM slice.
- **Product contract:** [`GOAL.md`](GOAL.md) (mid-cleanup; intended direction).
- **Agent constitution:** [`CLAUDE.md`](CLAUDE.md).

## Status at a glance

| | |
|---|---|
| Product code | None yet (`src/`, `prisma/`, app all absent) |
| Tests | None yet |
| Backlog (`roadmap/features.json`) | Empty — needs grooming |
| Research/spec | Substantive — `docs/research/ralph-crm-reviews/` |
| Prior implementation | Purged 2026-06-09; recoverable at tag `pre-purge-20260609` |
| Next decision | SQLite single-tenant vs Postgres multi-tenant (recommend: SQLite) |
