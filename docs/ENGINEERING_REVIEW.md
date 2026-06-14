# Engineering Review — salesforce-lite-crm

**Reviewer:** Senior engineer, top-to-bottom audit
**Date:** 2026-06-14
**Branch reviewed:** `chore/template-reset-20260614` (+ read-only inspection of `develop`, `main`, and tags)
**Scope:** product spec/research/code only. The freshly-installed AI operations engine scaffolding (`.claude/**`, `scripts/**`, `roadmap/**`, `AI_OPERATIONS_PLAN.md`, `OPERATOR_GUIDE.md`) is explicitly out of scope as a review target.

---

## Verdict

**Grade: D (as a product). B+ (as research).**

Let me be blunt about what this repository is right now: it is a **pile of high-quality research notes wrapped around an empty implementation, fronted by a README that lies.** There is no product. Not "thin product" — *zero* product. There is no `src/`, no `prisma/`, no `app/`, no `lib/`, no `package.json` dependencies beyond the ops-engine's own toolchain (Biome, ts-node, TypeScript). `roadmap/features.json` is an empty array. Five `.ts`/`.js` files exist in the whole tree and every one of them is operations-engine plumbing.

That "D" is not because the work to date is incompetent — it is because the gap between what the repo *claims* and what the repo *contains* is enormous, and that gap is itself a defect. The root `README.md` describes a "full-fledged, AI-adaptive Salesforce-style CRM" with 30+ live routes, a Prisma SQLite runtime, a 562-test Vitest suite, a 50/50 Playwright suite, dealer-order routing, forecasting, command palette, and CSV import. **None of that exists on this branch.** `GOAL.md` cites "562 tests green on 2026-05-29" and references `PLAN.md`, `CRM-CONTRACT.md`, `docs/ai/REPO_MAP.md`, `prisma/schema.prisma`, and `scripts/local-gate.ps1` — **none of which are present.** Those documents are describing a *different, deleted codebase*. An engineer who clones this repo and trusts the README will waste hours before discovering the truth. That is the single most damning finding.

The redeeming half is the research. `docs/research/ralph-crm-reviews/` (468 lines across four files) is genuinely excellent — three independent, evidence-cited deep reviews of three prior CRM build attempts, plus a synthesis that names a real, three-times-validated architectural consensus. This is not filler. It is the most valuable asset in the repo and a legitimate basis for a rebuild. But research is not a product, and the research describes a fundamentally *different* CRM (multi-tenant Postgres RLS SaaS) than the one `GOAL.md` commissions (local-first single-tenant SQLite). That unresolved contradiction sits at the center of the repo and must be decided before a single line of product code is written.

---

## What this actually is (research/spec vs code)

| Dimension | Reality |
|---|---|
| Product source files (`.ts`/`.tsx`, non-test, non-script) | **0** |
| Test files | **0** |
| `src/` / `app/` / `lib/` / `components/` | **absent** |
| `prisma/` schema or seed | **absent** (despite README/GOAL referencing them) |
| Runtime dependencies in `package.json` | **none** (devDeps are ops-engine only) |
| `roadmap/features.json` | `{ "features": [] }` — empty backlog |
| `roadmap/ROADMAP.md` Now/Next/Later | **all empty** before this review |
| Research/spec artifacts | `docs/research/ralph-crm-reviews/` (4 files, 468 lines) — substantive |
| `GOAL.md` | A spec for a CRM, but stale — references files that don't exist |
| `README.md` | **Actively wrong** — describes the deleted pre-purge codebase as if live |

**How we got here (from git history — important context):** This is not a greenfield repo that never shipped. A real CRM *did* exist. At tag `pre-purge-20260609` the tree held **280 product source files and 131 test files**, a Next.js app (`app/`, `components/`, `lib/`), a `prisma/schema.prisma`, Playwright e2e, and the full multi-agent harness (Claude/Codex/Gemini/Grok worktrees, `CRM-CONTRACT.md`, `PLAN.md`). On 2026-06-09 commit `89b155d` ("purge: reset to vision docs for repo overhaul") **deliberately deleted all of it**, reducing the tree to vision docs only, with the recovery path recorded (`git reset --hard pre-purge-20260609`). Then the AI operations engine template was dropped in on top.

So the accurate framing is: **this repo has been reset to a clean slate on purpose, and the README/GOAL.md were never updated to reflect that reset.** The old CRM is recoverable from git but is explicitly *not* the intended path — the salvage reviews exist precisely so the team can rebuild deliberately rather than resurrect the old code wholesale. The implementation gap is therefore intentional. The *documentation lie* is not — it is unfinished cleanup.

---

## Architecture assessment

There is no architecture to assess in code. There is a *proposed* architecture in two places, and they **contradict each other**:

1. **`GOAL.md`'s declared contract:** local-first **single-tenant SQLite** (Next.js + Prisma), with auth, permissions, multi-tenancy, and Postgres-as-default explicitly listed as **permanent non-goals**. Windows/PowerShell host.

2. **The salvaged research consensus** (`docs/research/.../README.md` §"What all three independently converged on"): **multi-tenant Postgres row-level security**, row-per-tenant `org_id`, dual-enforced (transaction-scoped `set_config` + app-layer `can()`), governed JSONB custom fields, modular monolith on pnpm/Turborepo with Hono + Drizzle + Postgres. This is a SaaS architecture, not a local-first app.

The synthesis README is honest about this — its closing section ("Open product decision for the rebuild") explicitly calls out that the single biggest divergence "is not between the three variants — it's between all of them and this repo's current contract," and offers two forks: (a) adopt the multi-tenant RLS Postgres consensus, or (b) keep local-first single-tenant SQLite and shelve the RLS material. **This decision is unmade and it is load-bearing.** Tenancy is the one substrate every reviewer agrees is brutal to retrofit; choosing wrong here is the most expensive possible mistake.

My assessment of the two designs on their merits:

- **Local-first single-tenant SQLite (GOAL.md):** Sound, appropriately scoped, and achievable by an autonomous loop in small slices. Prisma + better-sqlite3 is a boring, well-trodden stack. Auth/multi-tenancy as non-goals removes the hardest 40% of CRM work. This is the *buildable* design.
- **Multi-tenant Postgres RLS SaaS (research):** A genuinely strong, three-times-validated blueprint — but it is a much larger, harder product. The research itself documents that all three prior attempts that pursued it **shipped little to no usable product** (claude variant: zero CRM features in 72 cycles; agy: thin UI; codex: most-implemented but degenerated into 185 file-splitting tasks). The blueprint is excellent; the track record of *finishing* it is zero-for-three.

**My recommendation, on the evidence:** honor `GOAL.md`. Build the local-first single-tenant SQLite CRM. Treat the RLS/multi-tenancy research as a shelved Phase-N option, not the day-one substrate. Reasons: (1) it is what the standing contract says; (2) it is the only one of the two an autonomous loop has any demonstrated chance of *finishing*; (3) the schema spine, audit pattern, report templates, customization ladder, and verify-gate discipline from the research all transfer to the SQLite design unchanged — only the RLS substrate gets shelved. If multi-tenancy is genuinely required, that is an operator-level call (pricing/positioning) and belongs in `QUESTIONS.md`, not a silent agent decision.

---

## Quality of the salvaged research (useful vs filler)

This is the strong part of the repo. Verdict: **mostly genuinely useful, well-evidenced, and worth keeping. Not noise.** File by file:

- **`docs/research/ralph-crm-reviews/README.md` (synthesis, 65 lines) — HIGH value.** The "what all three converged on" section is the strongest design signal in the repo: three independent models reaching the same eight core decisions is real evidence, not opinion. The "shared failure mode" section (all three loops degenerated into honest busywork once the backlog drained) is the single most important operational lesson here and directly informs how the ops engine should gate work. The "open product decision" section correctly surfaces the SQLite-vs-Postgres contradiction. Keep verbatim.

- **`codex-ralph-crm.md` (134 lines) — HIGHEST value for a rebuild.** This is the one to mine hardest. It contains a fully-specified 21-table schema (columns, FK delete semantics, indexes, lead lifecycle states, stage history, outbox, audit union) that maps almost directly onto a SQLite Prisma schema if you strip `org_id`/RLS. The lead→account/contact/opportunity conversion flow, the closed audit-event union, the saved-views/search/report read-model design, and the disposable-schema RLS proof-test pattern are all concrete and reusable. If I were starting the build tomorrow, I'd start here.

- **`claude-ralph-crm.md` (146 lines) — HIGH value for *process*, MEDIUM for product.** Its product output was famously zero, but its documentation of the harness (9-gate DoD, hooks-over-prose, locked/liquid ADRs, the `plan/` memory layout, the verification escalation ladder, the bounded-idle lesson) is the best methodology writeup in the family and overlaps heavily with what the ops engine is trying to be. The core-vs-extension gate and the four-tier product split are reusable anti-bloat governance. Its RLS hardening recipe (ADR-0009) is only relevant if the Postgres fork is chosen.

- **`agy-ralph-crm.md` (123 lines) — MEDIUM-HIGH value, with the most filler.** Broadest feature catalog (121 tables, full marketing-sequence engine) and the best AFK-loop skeleton, observability stack, and competitive analysis. But it is also the longest and the most padded — the marketing-sequence catalog and OTel/Grafana stack are far beyond anything a "lite" CRM needs, and a chunk reads as inventory of a system that was "mock-first persistence, thin UI" (i.e., not really finished either). Useful as a reference catalog of *what's possible*; dangerous if mistaken for a backlog.

**Net:** ~80% signal, ~20% scope-inflation/filler. The research is a legitimate, decision-ready foundation. The one caveat: it is dated 2026-06-09 and makes claims about framework majors, CVE floors, and tool versions (Next.js 16, Drizzle 0.45.2, Better Auth, oRPC, pgvector iterative scan). Per the repo's own freshness rule (CLAUDE.md §5), any of those relied upon for a real build must be re-verified live before use — they are >3 months stale by the time most of them would be acted on.

---

## Tests

**Present: none.** No Vitest, no Playwright, no test runner wired beyond the ops-engine's `scripts/verify.sh` (which lints/typechecks the engine scripts themselves). The README's "562 tests" and "50/50 Playwright" are describing the deleted pre-purge codebase.

**Plan quality:** The *research* describes excellent test discipline that should be adopted when product code lands — most notably the codex variant's RLS proof-test pattern and the dual memory/DB repository strategy that lets unit tests and e2e run with zero infra. For a SQLite single-tenant build the testing story simplifies dramatically: in-memory or temp-file SQLite per test, deterministic seed, Vitest for service/validation/query logic, Playwright for the handful of user-visible flows. `docs/optional-modules.md` already gates mutation testing and an e2e/staging lane to fire when `src/` appears, which is the right posture — don't pay for heavyweight test machinery before there's code to test.

**The honest state:** tests are a documented intention, not an artifact. The first product slice must ship with tests in the same PR, or this repo will repeat the prior attempts' pattern of green gates over hollow features.

---

## Security & data handling

No product code, so no live attack surface. The security material to assess is in the research and the standing contract:

- **Multi-tenancy / RLS:** The research treats cross-tenant isolation as the dominant security concern and documents a hardened, dual-enforced design (non-superuser app role, `FORCE` RLS, fail-closed `NULLIF(current_setting(...),'')::uuid` predicate, composite FKs because FK checks bypass RLS, policies in migrations never `drizzle-kit push`, a 20-test isolation matrix, and the subtle pgvector-under-RLS recall-truncation bug). This is sophisticated, correct-looking, and directly relevant **only if the Postgres multi-tenant fork is taken.** Under the current `GOAL.md` (single-tenant local SQLite), there is no tenant boundary to enforce and this entire body of work stays shelved — which is fine, but it must be a *conscious* shelving, not an oversight, because retrofitting tenancy later is the single most expensive change per all three reviews.

- **Roles/permissions:** Same story — the codex variant's `can()`/`assertCan` fail-closed permission predicate and scope model is strong, but `GOAL.md` lists auth/permissions as non-goals. A local single-user CRM legitimately needs neither on day one.

- **Data handling (local SQLite):** The intended posture is sound and low-risk: synthetic seed data only (enforced by the ops engine's hard prohibitions — no `.env*` reads, no live customer data), local DB files git-ignored as generated artifacts. The main *practical* data-handling concern for a local-first CRM is CSV import safety (validation, dedupe, bounded create-only apply) — the research and the old README both got this right by bounding the apply path. Carry that discipline forward.

- **Operations-engine guardrails (in scope only as they touch product safety):** The hook/assertion-shield/path-guard machinery that protects against weakened test assertions, hand-edited `features.json`, and commits to `main` is a genuine asset for keeping a future autonomous build honest. Not a product control, but relevant to whether the eventual product is trustworthy.

**Net security finding:** nothing exploitable today; the only security *decision* outstanding is the tenancy fork, and it has to be made before schema design, not after.

---

## Unmerged branches

| Branch | Relationship to current | Product code? | Notes |
|---|---|---|---|
| `chore/template-reset-20260614` (current) | HEAD | No | The ops-engine reset; ahead of develop/main on engine scaffolding only |
| `develop` / `origin/develop` | Behind current | No | No `src/`. Pre-template-reset engine state. `git branch --no-merged develop` shows only the current branch as unmerged. |
| `main` / `origin/main` | Behind current | No | No `src/`. The diff vs current is ~6,900 deletions of engine scaffolding the reset removed. |

**Effective unmerged-branch count: 0** in any meaningful product sense. The only branch "ahead" is the current one, and what it carries is ops-engine plumbing, not features. There are no stranded feature branches with product work waiting to land. (There *are* archive tags — `archive/claude/autonomy`, `archive/codex/autonomy`, `archive/gemini/spec-*`, etc. — pointing at the old multi-agent CRM history, but those are deliberately-retired snapshots, not live branches.)

---

## Tech debt & risks

1. **README/GOAL.md describe a deleted codebase (CRITICAL, documentation integrity).** Highest-priority fix; addressed by this review's README rewrite. Until done, every doc in the repo points at files that don't exist (`PLAN.md`, `CRM-CONTRACT.md`, `prisma/`, `docs/ai/REPO_MAP.md`, `scripts/local-gate.ps1`).
2. **Unmade tenancy decision (CRITICAL, architecture).** SQLite-single-tenant (GOAL.md) vs Postgres-multi-tenant-RLS (research). Load-bearing, expensive to reverse, and currently silent. Must be resolved (recommend: honor GOAL.md; escalate to operator if multi-tenancy is genuinely wanted).
3. **The "honest busywork" failure mode (HIGH, process).** The research's central operational lesson: all three prior loops stayed green and truthful while degenerating into self-generated refactor/file-splitting work once the real backlog drained. This repo's ops engine must enforce a value-of-work gate and a refactor cap *before* the loop starts, or it will reproduce the exact failure documented in its own research.
4. **Empty backlog / empty roadmap (HIGH, planning).** `features.json` is empty and `roadmap/ROADMAP.md` had no Now/Next/Later content. The loop has nothing to build. Addressed by this review's ROADMAP rewrite, but the bullets still need grooming into `features.json` with acceptance criteria.
5. **Research staleness (MEDIUM).** Dated 2026-06-09; any framework/CVE/tooling claim relied upon must be re-verified live per CLAUDE.md §5 before it drives a real dependency choice.
6. **Scope-inflation risk from the research (MEDIUM).** The agy 121-table catalog and marketing-sequence engine are seductive and wildly out of scope for a "lite" CRM. The research must be used as a *reference*, not a *backlog*. Apply the core-vs-extension gate ruthlessly.
7. **No runtime dependencies chosen (LOW, expected).** `package.json` has no Next/Prisma/test deps yet — correct for a clean slate, but the first slice will need a deliberate, version-verified dependency baseline.

---

## Top 5 to do first

1. **Make the docs honest.** Rewrite `README.md` and `GOAL.md` so they describe what the repo *is* (research + spec, no implementation, prior CRM purged and recoverable from `pre-purge-20260609`) — not the deleted codebase. (README done in this pass; `GOAL.md` is out of this review's edit scope but is the next required cleanup.)
2. **Resolve the tenancy fork in writing.** Decide SQLite-single-tenant (recommended, per GOAL.md) vs Postgres-multi-tenant-RLS. Record it in `roadmap/DECISIONS.md`; if multi-tenancy is genuinely under consideration, escalate to `roadmap/QUESTIONS.md` (it's an operator-visible product/pricing call). Everything downstream depends on this.
3. **Define the first buildable vertical slice and groom it into `features.json`.** Smallest end-to-end CRM increment: one entity (Account or Contact) → SQLite persistence (Prisma schema + migration + seed) → list + create + detail UI → tests in the same PR. Derive the schema from `codex-ralph-crm.md` (stripped of `org_id`/RLS). No backlog = no work.
4. **Stand up the runtime baseline with verified versions.** Choose and *live-verify* (per freshness rule) the Next.js / Prisma / better-sqlite3 / Vitest / Playwright versions, wire `package.json`, and prove `verify.sh` flips into PRODUCT_MODE cleanly when `src/` lands (per `docs/optional-modules.md`).
5. **Encode the anti-busywork gate before the loop runs.** Adopt the research's hardest-won lesson: a value-of-work requirement (every task names user-visible capability or a closed spec gap) and a hard cap on consecutive refactor-only cycles. This is cheaper to build now than to retrofit after the loop has burned a day splitting files.
