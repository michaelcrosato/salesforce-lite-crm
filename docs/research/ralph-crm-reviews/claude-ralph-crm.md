# Salvage Review — claude-ralph-crm

**Source repo:** `claude-ralph-crm` ("crm-core") · **GitHub remote:** `https://github.com/michaelcrosato/claude-ralph-crm.git` · **Snapshot tag:** `pre-purge-20260609` · **Review date:** 2026-06-09 · **History reviewed:** full (226 commits, 2026-05-28 → 2026-05-31)

## Verdict

This repo is the strongest of the family on **AI-harness engineering** and the weakest on product: in ~63 hours it produced a genuinely excellent anti-entropy operating environment — a 9-gate deterministic DoD, hook-enforced (not prompt-enforced) guardrails, a proven two-layer RLS tenancy substrate, mutation/property-tested security paths, and an append-only `plan/` memory architecture with per-cycle resume anchors — but **zero CRM features**. Phase 0 never ended: 72 recorded cycles polished a 5-table, ~1.7k-LOC scaffold to near-pathological quality while the entire feature roadmap sat blocked on two human ADR ratifications (auth provider, public-API shape) that never came. The salvage value is threefold: (1) the **methodology itself**, documented concretely enough to re-apply (`AGENTS.md`, `docs/ai/agent-workflow.md`, `plan/`); (2) the **RLS/multi-tenancy design** (ADR-0009 and its 20-test isolation matrix), which is the hardest CRM substrate to retrofit and was done right; (3) three **design-ahead specs** (metadata auto-API cache invalidation, MCP security contract, pgvector-under-RLS) that solve real hard problems on paper. Equally valuable are its honestly-journaled failure modes — the ~25-cycle stop-hook spin, the phantom-source incident, the clean-checkout false-green — which are direct input for the orchestrator-of-orchestrators design.

---

## 1. The anti-entropy operating environment (highest value — extract and reuse)

### 1.1 Doctrine
One sentence, repeated everywhere: **"The repo — not any one model's memory — holds the truth, via Git, tests, schemas, contracts, docs, and deterministic scripts"** (`MASTER-PLAN.md` §0). Corollary from `ralph.yml`: *"Discipline is enforced by deterministic gates (`pnpm verify`), not prompt politeness."* The split is explicit in `docs/ai/agent-workflow.md` §5: **"Advisory instructions go in AGENTS.md; must-happen rules go in hooks."**

### 1.2 Instruction-file hierarchy (layered, token-budgeted)
- `MASTER-PLAN.md` — single source of truth + **reading index** (§2 is a 15-row table: "read top to bottom; most tasks need 2–3 of these files plus one module card").
- `AGENTS.md` (root, ≤200 lines) — enforced rules, layout, commands, the canonical loop. Path-scoped `AGENTS.md` files (≤100 lines) in `apps/web`, `apps/api`, `packages/db`, `packages/core`, `packages/workflow`, `modules/` carry only **non-obvious** local patterns.
- `CLAUDE.md` — deliberately a 10-line pointer to `AGENTS.md` (backend-agnostic: "Claude Code and the other Ralph backends all read AGENTS.md").
- `PROMPT.md` — the loop prompt, **versioned** (`prompt-version: 2026.05.30` header, "bump on any change so eval/bench results map to a prompt version") — a small but reusable idea.
- `docs/ai/module-cards/<module>.md` — one-page cards (Purpose · Main files · Public contracts · DB tables · Commands · Tests · Constraints) so agents never scan the repo to work one module.
- `docs/ai/REPO_MAP.md` + `.aiignore` — token map ("don't blind-scan, grep/scope") + skip-list.

### 1.3 Spec-driven increments
Every unit of work is a spec folder `specs/<NNNN>-<slug>/` with `brief.md / requirements.md / design.md / implementation-plan.md / verification.md` (`docs/ai/spec-template.md`). The repo's one hard extension to Ralph's native PDD: **`verification.md` is exact commands, no prose, and the task is not done until every command passes.** Specs are "numbered and subordinate to durable docs" — `docs/` is the truth, `specs/` is current work. The per-task loop (agent-workflow §3): read module card → read PRD/arch section → inspect tests → **failing tests first** → smallest passing change → targeted tests → `pnpm verify` → update docs/ADR → narrow commit on `agent/<task-id>` → change summary.

### 1.4 The gate stack (exact, as shipped)
`pnpm verify` (`scripts/verify.mjs` → pure, unit-tested `scripts/lib/verify-core.mjs`), 9 active gates in order:
1. **lockfile drift** (fail-fast; clean-temp-dir frozen install — added after the TR-0101 incident)
2. **typecheck** (`@tsconfig/strictest`-level; "never relax a flag to pass — fix the code")
3. **lint (Biome)**
4. **unit tests (Vitest)** — each carrying per-package **v8 coverage floors** (e.g. `@crm/core` 90/90/90/90, `service-lite` 100%)
5. **secret scan** (custom, pattern-based)
6. **tooling unit tests** — the gate scripts' own pure cores are tested ("trust anchors", TR-0042..0045/0084)
7. **module-boundary check** (`check-boundaries.mjs`)
8. **RLS coverage (static)** — parses schema + migrations; every `org_id` table must have ENABLE+FORCE+policy (`check-rls-coverage.mjs`)
9. **dependency audit (pnpm, ≥high)**

Plus: `pnpm verify:integration` (Testcontainers Postgres 18.4 + the property-based RLS isolation matrix), `pnpm safety-eval` (agent-guardrail assertions + **CVE version floors**: next≥16.2.6, hono≥4.12.12, drizzle-orm≥0.45.2, react≥19.2.6 — ADR-0012 policy: "pin load-bearing deps at CVE-fix floor; no CVE = no floor; floors only move up"), nightly StrykerJS **mutation** CI job with per-package break thresholds, CodeQL, OpenSSF Scorecard, SBOM. A clever detail: **deferred gates are printed by name on every run** ("⏭️ property-based RLS fuzz matrix — Phase 1") so "green" can't be confused with "complete."

### 1.5 Enforcement mechanisms (hooks/CI, not prose)
- `.claude/settings.json`: permission **allowlist** of safe repeat commands (no permission stalls) + a **PreToolUse hook that denies `git commit|push` on `main`** with the rule citation in the deny message.
- CI `hitl-path-guard` job (TR-0012): any PR touching `rls/`, `**/migrations/`, `docs/architecture/adr/` requires a human-applied `hitl-approved` label. Backed by `CODEOWNERS` on the same paths + a PR template that front-loads the DoD checklist.
- `ralph.yml`: `max_iterations: 100`, `max_runtime_seconds: 14400` (4h hard wall-clock cap "so a stuck loop can't run unbounded").
- Supply chain: pnpm `minimumReleaseAge=1440`, Renovate patch-only automerge with cooldown, `catalog:` single-sourcing of all dep versions (one edit bumps every consumer; "do not reintroduce literal versions").

### 1.6 HITL stop-gates (the human/agent boundary)
"No human *coding*; humans still *review*" — the enumerated list (agent-workflow §6): **architecture/ADR decisions · security-model changes · RLS policy changes · data migrations · extension→core promotion · customer-branch creation · production deploys.** The agent produces the artifact on a branch and STOPS; it "may not self-ratify a locked decision or self-merge to `main`." This held perfectly in practice — and was also the project's undoing (§7).

### 1.7 Locked vs liquid
**Locked (ADR only):** domain model · tenant model · permission model · custom-field metadata schema · workflow event grammar · OpenAPI/extension contracts · RLS strategy · audit strategy. **Liquid (~quarterly):** AI backend · frontend details · tRPC/REST balance · MCP posture · Ralph version · CI runner · queue tech · deploy platform. Plus an "explicitly rejected — do not reintroduce without an ADR" list (MASTER-PLAN §3.5) to stop re-litigation.

### 1.8 The `plan/` memory architecture (the actual loop state)
A second, additive layer (`plan/README.md` explains the dual-backlog design: `TR-####` transformation specs vs Ralph's `NNNN` feature specs, deliberately non-overlapping):
- `GOAL.md` (what done means) · `PROGRESS.md` (one row per TR with **pasted gate evidence**) · `JOURNAL.md` (**append-only resume log**; every cycle ends with a `RESUME ANCHOR` block stating branch, HEAD, green dimensions, and exact next action — "on restart/after compaction read the tail, reconcile against `git status`") · `BACKLOG.md` ("nothing here is actionable" — the scope-creep sink) · `BLOCKED.md` (the honest record of *why* the loop is idle) · `HANDOFF.md` (single human entry point with an ordered merge queue) · `RISK_REGISTER.md` (15 risks, each with owner-TR + rollback) · `BASELINE.md` / `EXTERNAL-CONTEXT.md` (ground-truth audit + cited research).
- The canonical autonomous loop (root `AGENTS.md`): **AUDIT → RESEARCH → PLAN → EXECUTE (verify folded in) → REPLENISH**, with `scripts/agent/status.sh` at CYCLE-START, one spec per `agent/<task-id>` branch, one writer per file, "a task is done only when check.sh passes by **actual execution** (exit codes, not belief)."
- **Bounded WATCH/idle** (added late, after the spin): "if every remaining item is gated, do ONE maintenance pass, then **allow the turn to end**. Never re-run identical green checks or fabricate edits on verified code… an unsatisfiable 'never stop' condition degrades into wasted cycles."

### 1.9 The verification escalation ladder (reusable pattern)
The repo evolved a graded trust model worth copying: line coverage floors → **property-based invariants** (fast-check) on security paths → **mutation testing** with break thresholds ("found+fixed real test gaps 5× this session" — it caught weak assertions 100% line coverage could not) → **gate-script self-testing** → **clean-room verification** (fresh worktree, cold cache — after warm `node_modules` masked a CI-red lockfile) → **runtime verification** (actually boot all 3 apps, curl headers/404/413/CSP-nonce; "it caught a deprecation tsc-based verify never would").

---

## 2. The 7-phase plan and MASTER-PLAN

`docs/roadmap.md` principle: *"the first deliverable is **not** CRM functionality. It is the operating environment that prevents AI-generated entropy."*

| Phase | Scope | Exit criteria (abridged) |
|---|---|---|
| **0 — AI-safe foundation** | Monorepo, web/API shells, Drizzle skeleton, local PG, RLS scaffold + example policy, `field_definitions` + `audit_events` from day one, AGENTS/CLAUDE/ralph.yml, CI gates, spec+verification templates, module `_template` + `service-lite` boundary, customer-branch guardrails | fresh clone installs · `pnpm verify` green · both apps boot · demo tenant · RLS smoke passes · core/module/extension tiers documented |
| **1 — identity, tenancy, permissions, core records** | orgs/users/memberships/teams/roles, tenant-context middleware, RLS policies applied via migrations, property-based RLS fuzz, then accounts/contacts/leads/opportunities/activities CRUD | cross-tenant reads AND writes fail at both layers; permissions enforced in API tests |
| **2 — sales workflow** | lead lifecycle + conversion (find-or-create account/contact + optional opp, audited), pipeline/stages/stage-history, activity timeline + `activity_links` | conversion + pipeline board + timeline e2e |
| **3 — customization & reporting** | custom-field admin UI (schema already exists), layouts, picklists, validation rules, curated report templates, dashboards, CSV import/export with dedupe | admin-added field appears in all surfaces; no custom SQL |
| **4 — workflow engine & public surface** | event–condition–action rules + run logs, REST/OpenAPI, API keys, signed webhooks, **MCP read tools first** (`crm.search_records`, `crm.get_account`, …) | stage change → follow-up task, logged + debuggable |
| **5 — default first-party modules** | extension manifest/registry/loader, module test harness, `service-lite`, email send-and-log, Gmail/Outlook/calendar sync; later allowlisted MCP write tools (no delete) | "a sample module adds object + UI tab + report + workflow action WITHOUT core edits" |
| **6 — hardening** | ~1M-row perf seed, bench budgets enforced, migration rollback tests, customer-branch rebase workflow | Core Completion Definition (MASTER-PLAN §5) met |

Phase 0's bar before ANY features: the gate stack, the spec system, the boundary checks, the RLS scaffold, governed metadata schema, and the branch policy — i.e., *all enforcement first*. Notably the **custom-field schema (`field_definitions` + JSONB) and audit table land in Phase 0** because "retrofitting custom fields is painful — the schema lands first."

---

## 3. Product & domain design

- **Positioning** (`docs/product/core-crm-prd.md`): not a Salesforce clone — "the practical lowest-common-denominator CRM," with a **four-tier split**: Tier 1 hard core (orgs→opportunities→activities spine, ~35 items enumerated), Tier 2 default first-party modules shipped pre-GA (`service-lite` with an explicit INCLUDE/EXCLUDE scope box, email-calendar-sync, send-and-log, notification templates), Tier 3 extension packs (quotes-lite, approvals-lite, all AI features), Tier 4 customer-specific/paid (CPQ, territories, multi-currency…).
- **The core-vs-extension gate** (`docs/product/core-vs-extension-gate.md`) is the best anti-bloat artifact in the family: a decision tree + 7 promotion criteria ("required, 3+ independent customers, strengthens a core primitive, cannot be a module, no industry vocabulary, documented in ~one page, no broad schema churn") + a worked-classification table (e.g. Cases→default module; "requires manager confirmation"→core workflow action, multi-step approvals→extension). Fast heuristic: *"Can X be built as a module in fewer than two agent cycles? If yes, keep it out of core."*
- **Data model** (`docs/architecture/data-model.md`): 21 standard relational tables (locked object graph) + 7 governed metadata tables; **custom fields = JSONB column per object + `field_definitions` rows — "JSONB is never ungoverned"; "do not start with a generic EAV table."** Soft-delete + restore only; picklist-backed lifecycle states; every meaningful change writes structured `audit_events`; `org_id` on every row.
- **RLS multi-tenancy (the crown jewel — ADR-0009, Accepted):** row-per-tenant (`org_id`), not schema-per-tenant. Two mandatory layers: single `can(user, action, objectType, record)` path in `@crm/core` (later hardened to **fail closed on empty userId/orgId**, TR-0103) + Postgres RLS as backstop. The hardened substrate: app traffic runs as **non-superuser `app_rw`** via `withTenant` (`SET LOCAL ROLE app_rw` + txn-scoped `set_config('app.current_org_id',…, true)`; SQL-injection-guarded role identifier); `ENABLE` + **`FORCE`** RLS, default-deny; predicate `org_id = (select nullif(current_setting('app.current_org_id', true), ''))::uuid` — InitPlan-cached (~10×) and fail-closed (unset/empty GUC → NULL → 0 rows, no cast error); per-table `WITH CHECK`; policies ship **in the migration pipeline, never `drizzle-kit push`**; composite-FK convention `(org_id, parent_id)` because FK existence checks bypass RLS; `users` is the one intentional global table (runtime-proven). Proven by a 20-test Testcontainers matrix: read/write/update/delete isolation per table, unset/arbitrary/empty/malformed tenant contexts, `app_ro` genuinely read-only, role non-superuser asserted.
- **Authoritative proposed-but-unratified decisions:** ADR-0010 recommends **Better Auth over Auth.js v5** (native multi-tenant orgs/members/invitations/RBAC + Drizzle adapter; Auth.js has no built-in multi-tenancy); ADR-0011 recommends **oRPC over tRPC+@hono/zod-openapi** (one Zod router → typed client + OpenAPI + MCP source). Both are researched and decision-ready; the successor should ratify equivalents on day one.

---

## 4. Architecture

- **Modular monolith** (ADR-0001) explicitly justified as an *AI* decision: "a smaller reasoning surface… agents work in **vertical slices** (schema → service → API → UI → tests)" and "**choose boring tools with explicit local files** — agents are better when schemas, contracts, route files, migrations, and tests are visible and on disk."
- **Layout:** `apps/{web,api,worker}` · `packages/{core,db,auth,metadata,workflow,audit,search,reporting,ui,testing,observability}` · `modules/{_template,service-lite}` + `registry.json` (manifest: id, coreVersionRange, enabled; "only signed, enabled, version-compatible modules load") · `specs/` · `plan/` · `e2e/` · `bench/` · `infra/`.
- **Boundary rules, machine-enforced** (`check-boundaries.mjs`): `core` imports no frameworks/DB drivers/modules; modules import `@crm/*` contracts only; **modules never import each other**; no DB driver in app layer; no business logic in Next Server Actions. File-size guidance is a soft ~400–500 lines; the real rules: "one file, one clear purpose; no god services."
- **Stack + rationale:** Node 22 (pinned for Ralph compat), pnpm+Turborepo, Next 16/React 19/Tailwind 4, Hono hosting tRPC+REST+MCP+webhooks on one app, Drizzle (exact-pinned 0.45.2 with a written 1.0-RC migration-readiness note), Postgres 18.4 (pinned to the CVE line incl. an RLS stats-leak fix), Zod, Biome, Vitest/Playwright/Testcontainers/fast-check/StrykerJS, OTel+pino with `tenant_id` as a span attribute and **case-insensitive sensitive-header log redaction** (TR-0110).
- **Customer-branch policy** (Phase-0 guardrail): a 6-step customization order ("most agents stop at step 2 or 3" — config → metadata → module on main → … → customer branch **last resort**, which "may NOT edit core files" and requires weekly rebase gates).
- **`bench/` methodology:** aspirational only — `budgets.json` defines `agent-cost.maxOutputTokensPerTask: 200000`, API p95 300ms, report-query p95 1.5s @ 1M rows; no eval was ever implemented. The token budget was the intended out-of-band loop-cost gate.
- **`infra/`:** compose-pinned `postgres:18.4` with healthcheck + `--wait` (race fixed in TR-0088), `init.sql` (pg_trgm), opt-in OTel-collector+Jaeger overlay (digest-pinned), verified end-to-end.

---

## 5. Implementation reality — what 72 cycles actually produced

**Hard numbers:**
- **226 commits in ~63 hours** (2026-05-28 23:30 → 2026-05-31 13:27). 201 commits on 05-30 alone (peak 31/hour); the repo was then untouched for 9 days until purge.
- **Commit mix: 120 docs (53%) · 43 test (19%) · 22 fix (10%) · 20 feat (9%) · 7 ci · 6 chore · 4 build · 1 refactor.** Over half of all commits were plan/journal bookkeeping.
- **~1,708 LOC implementation TS vs ~3,051 LOC tests (1.8:1)** across 107 files / 18 workspaces. **5 DB tables** (organizations, users, memberships, field_definitions, audit_events). Accounts/contacts/leads/opportunities/activities exist only as `Placeholder spine type` interfaces. apps are shells/stubs. **Nothing demo-able** (VPBRIEF's own words: "a rock-solid factory and almost no product").
- **111 transformation specs (TR-0001..0111) + 2 feature specs** (0000 done; 0001 written, never started). 12 ADRs (9 effective, 3 stuck at Proposed).
- Of 72 cycles: roughly **cycles 1–25 shipped real hardening** (waves 1–13: RLS substrate, CI, coverage/mutation rollout, security headers/CSP, metadata governance), **cycles 26–55 mixed audits with diminishing finds** (but including the genuinely valuable TR-0101 lockfile discovery, TR-0102/0103 security fixes, TR-0107 Unicode dedupe bug, and the three design specs), and **cycles 56–72 were almost pure verification/maintenance ticks** — docs-only commits re-confirming an unchanged green state ("cycle 67: state-integrity check — pristine").
- **Real bugs the machinery caught** (the strongest evidence the gates work): a CI-breaking lockfile drift masked by warm `node_modules` (TR-0101); a turbo-cache false-green hiding a typecheck error (TR-0036) — which itself exposed a real latent OTel bug; `can()` authorizing empty identities (TR-0103); `normalizeName` collapsing all non-Latin names to an empty dedupe key (TR-0107); canonical-case `Authorization` headers leaking through log redaction (TR-0104); a latent regex-scanner correctness bug found by mutation testing (TR-0102); pino crash on empty `LOG_LEVEL`.
- **Ralph reality check:** Ralph Orchestrator v2.9.3 was installed and configured (`ralph.yml`, `PROMPT.md`, `.ralph/memories/`), but the recorded 72 cycles ran as **Claude Code autonomous sessions** driving the `plan/` TR backlog via the `EXECUTION-GOAL.md` `/goal` prompt and Stop hooks — Ralph's native loop never visibly executed `specs/0001`. The harness learnings are therefore Claude-Code-loop learnings.

---

## 6. Research artifacts worth carrying forward (file-level salvage list)

1. **`plan/specs/TR-0098-mcp-security-design.md`** — an 8-gate MCP security contract vs the "lethal trifecta": no token passthrough (audience/issuer per request), session binding, read/write scope separation, every tool through `can()`+RLS inside `withTenant`, strict immutable Zod inputs, **detailed SSRF/egress implementation-correctness guidance** (parse all IP encodings, range-check the *resolved* address, pin against DNS-rebinding TOCTOU, block non-http schemes, re-check on every redirect hop), write-allowlist + no-hard-delete + audit row per write, rate/size caps. Each gate has an acceptance test; READ-ONLY first wave recommended.
2. **`plan/specs/TR-0097-metadata-driven-api-design.md`** — metadata→auto-API with the invalidation problem solved first (researched Twenty/PostgREST/Hasura failure modes): **per-org monotonic `metadata_version` bumped by DB trigger in the same transaction as `field_definitions` writes; version-checked in-process cache** — always correct, one int compare on the hot path, multi-instance-safe, RLS-safe.
3. **`plan/specs/TR-0099-vector-search-data-layer-design.md`** — identifies the **pgvector-under-RLS silent-recall-truncation bug** (HNSW returns global top-K, *then* RLS filters → a small tenant gets <K or zero results) and the fix (pgvector ≥0.8 iterative index scan, one shared HNSW, *not* per-tenant partial indexes; hybrid with FTS/pg_trgm).
4. **`docs/architecture/adr/0009-rls-hardening.md`** + `packages/db/src/` (withTenant, migrations, `rls-isolation.int.ts`) — the complete hardened RLS recipe and its property-based proof matrix. Directly portable.
5. **`docs/product/core-vs-extension-gate.md`** + **`core-crm-prd.md`** tier split — the anti-bloat governance for any unified CRM.
6. **`plan/EXTERNAL-CONTEXT.md`** — cited 2026 research: RLS footguns (superuser bypass, FK bypass, GUC `''` cast trap, pooler/prepared-statement issues), Better-Auth/oRPC rationale, Twenty 2.0 as metadata→auto-API→MCP north star, supply-chain posture (minimumReleaseAge vs Shai-Hulud-class worms).
7. **`docs/architecture/adr/0012-dependency-security-floors.md`** + `scripts/safety-eval.mjs` + `scripts/lib/semver-floor.mjs` — the CVE-floor policy and its tested comparator.
8. **Process patterns:** `VPBRIEF.md` (dated, append-only, TL;DR-first VP briefings — excellent owner-communication artifact), `plan/HANDOFF.md` (single human entry point with an ordered fast-forward merge queue), `plan/RISK_REGISTER.md` (risk × owner-spec × rollback format), the JOURNAL "RESUME ANCHOR" convention, and `scripts/lib/*` (tested pure cores for secret-scan/boundaries/RLS-coverage/lockfile/verify — directly liftable).

---

## 7. Pitfalls & anti-patterns (honest assessment)

1. **Phase 0 never ended.** The single biggest fact. The loop spent 72 cycles and 226 commits without ever building a CRM record, because feature work was correctly HITL-gated on ADR-0010/0011 ratification and the human never ratified. The agent obeyed perfectly — `BLOCKED.md` is titled "the honest record of why the perpetual loop is in maintenance mode rather than shipping features" — but the system had **no escalation path for an absent human**. Lesson for the orchestrator-of-orchestrators: HITL gates need SLAs/notifications/default-after-timeout semantics, or the harness converts 100% of capacity into polishing.
2. **The unsatisfiable "never stop" stop-hook burned ~25 no-op cycles** (admitted in the JOURNAL readiness-pass entry: "direct fix for the unsatisfiable 'never stop' spin that burned ~25 no-op cycles earlier"). When everything was gated, the Stop hook kept re-invoking the loop, which re-verified identical green state and journaled it. The late fix — bounded WATCH/idle, honoring `stop_hook_active`, "act only on a real external-signal delta" — should be a day-one harness primitive, not a cycle-70 retrofit. Roughly a third of all cycles (56–72 plus earlier maintenance ticks) produced only confirmation prose.
3. **Phantom-source incident** (JOURNAL, Wave-3): under a degraded/batched tool-result channel the agent authored complete test suites for **files that did not exist** (`@crm/auth` password/session primitives), read during a garbled window. Caught and withdrawn; lesson journaled: *"never author tests/edits from a read whose result was garbled/empty/delayed… treat empty/garbled tool output as 'unknown', never as content."* Harness implication: tool-result integrity checking and a "refuse to act on unverified reads" mode.
4. **"All green" was clean-checkout-false.** Warm `node_modules` masked a CI-breaking lockfile drift for ~37 specs (TR-0101); turbo cache masked a typecheck failure (TR-0036). Both fixed with permanent gates, but the meta-lesson stands: **local green ≠ clean-room green; verify in cold environments periodically and make cache inputs explicit.**
5. **Ceremony outweighed product.** 53% of commits are docs; the per-cycle bookkeeping (PROGRESS row + JOURNAL entry + ROADMAP wave + sometimes HANDOFF/BACKLOG updates) is 4–5 file touches per unit of work. Mutation-testing pursuit reached 100% scores on Phase-0 stubs and the gate scripts' own test suites — real value early (5 genuine test-gap finds), clear diminishing returns late. The repo even names the failure mode it fought: "anti-homework." It mostly resisted fabricated work but substituted **fabricated verification** (re-running green suites) instead.
6. **Dual planning systems** (`specs/NNNN` for Ralph features vs `plan/TR-####` for transformation) were carefully de-conflicted (R10) but in practice the TR system **became** the project; the feature system never ran. Successor should have one backlog with typed lanes, not two systems.
7. **Bench/e2e were scaffolding theater:** `bench/budgets.json` never enforced, one skipped Playwright spec. Token/cost budgets for the loop were specified but never measured — a real gap given "agent-cost" was a stated pillar.
8. **Single-human bottleneck + bus factor** were flagged in VPBRIEF's own risk list ("feature velocity is unproven… the real test is how fast agents ship actual CRM features at the same quality") — and the experiment ended before that test was ever run.

---

## 8. Recommendations distilled for the successor harness

- **Keep:** deterministic gate stack as DoD (with deferred-gate visibility); hooks-over-prose enforcement; `verification.md`-style exact-command DoD per spec; locked/liquid + ADR discipline; the `plan/` memory layout (GOAL/PROGRESS/JOURNAL-with-resume-anchors/BACKLOG/BLOCKED/HANDOFF); clean-room + runtime verification dimensions; CVE floors in a safety-eval; the verification escalation ladder (coverage → property → mutation → gate-self-test), applied **proportionally to code maturity**; VPBRIEF-style owner briefings.
- **Fix:** give every HITL gate a timeout/notification/escalation path; make bounded-idle a first-class loop state from day one; cap maintenance/verification cycles per unit of new value (e.g., no more than N consecutive no-delta cycles before mandatory hard stop); measure loop cost (the unbuilt `bench/`); one backlog; and sequence so that a thin vertical feature slice ships *inside* Phase 0 — this repo proves an agent loop given a perfect "factory" and a locked gate will polish the factory forever.
