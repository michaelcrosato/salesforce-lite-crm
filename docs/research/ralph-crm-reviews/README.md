# Ralph-CRM Salvage Reviews — Synthesis

**Date:** 2026-06-09 · **Reviewer:** Claude (3 parallel deep-review agents + synthesis)
**Sources:** the three retired ralph-crm variants, reviewed at their `pre-purge-20260609` snapshot tags via detached git worktrees. Full source remains recoverable in each repo's git history (`git reset --hard pre-purge-20260609`) and on the GitHub remotes.

These notes exist so none of the May–June 2026 CRM research is lost when the variant repos are retired. They are input to two things: (1) the unified CRM rebuild in this repo, and (2) the design of the new orchestrator harness ("orchestrator of orchestrators").

| File | Source repo | One-line verdict |
|---|---|---|
| [agy-ralph-crm.md](agy-ralph-crm.md) | Antigravity/Gemini loop, 491 commits | Broadest feature catalog (121 tables, full marketing-sequence engine) + the best AFK loop skeleton and observability stack; mock-first persistence, thin UI |
| [claude-ralph-crm.md](claude-ralph-crm.md) | Claude Code loop, 226 commits | Best harness methodology (9-gate verify, hooks-over-prose, plan/ memory) and hardened RLS design; **zero CRM features** — Phase 0 never ended |
| [codex-ralph-crm.md](codex-ralph-crm.md) | Codex loop, 274 commits | Most implemented: working 21-table tenant-isolated CRM slice, RLS proof tests, evidence ledger; degenerated into a 185-task file-splitting spiral |

## What all three independently converged on (adopt with high confidence)

Three different models, working independently from similar briefs, arrived at the same core decisions. That convergence is the strongest design signal in this research:

1. **Tenancy = Postgres row-level security, row-per-tenant (`org_id`), dual-enforced.** All three: transaction-scoped `set_config('app.current_org_id', …, true)` set inside a wrapper (`withTenant` / `withTenantDbContext`) carried by `AsyncLocalStorage`, fail-closed when context is missing, **plus** an app-layer permission check (`can()` / `assertCan` / tenant-scoped store factory) so neither layer is load-bearing alone. Hardening details worth keeping (mostly from claude variant): run as a **non-superuser app role** (`SET LOCAL ROLE` — table owners bypass RLS), `FORCE` RLS, `NULLIF(current_setting(...), '')::uuid` predicate (fail-closed, InitPlan-cached), policies shipped in migrations (never `drizzle-kit push`), composite FKs `(org_id, parent_id)` because FK checks bypass RLS.
2. **Custom fields = governed JSONB, never EAV.** A `custom` jsonb column per object governed by `field_definitions` rows (org, object_type, api_name, data_type, validation). All three repeat the same sentence: "ungoverned JSONB is forbidden." The agy variant extends this into a full `defineObject()` custom-object SDK with dynamically generated MCP tools (Twenty's "killer feature").
3. **Same stack, same shape:** modular monolith in a pnpm+Turborepo monorepo (`apps/{web,api}` + `packages/*` + `modules/*`), Next.js 16 + Hono + Drizzle + Postgres + Zod + Biome + Vitest + Playwright + Testcontainers. Module boundary rules machine-enforced (core imports nothing app-ward; no business logic in Next Server Actions; modules never import each other).
4. **Audit events from every service mutation**, written as a closed typed union, routed through the tenant context so audit rows themselves pass RLS. The agy variant adds a SHA-256 hash-chain + Merkle WORM export — a differentiator worth keeping on the roadmap.
5. **MCP read-tools first, machine-checkably read-only.** codex: manifest safety-policy structs + `assertMcpToolsReadOnly()` inside the verify gate. claude: the TR-0098 8-gate write-tool security contract for when writes eventually come. agy: dynamic per-custom-object tools.
6. **Deterministic composite verify gate = definition of done.** 9–13 stages (typecheck, lint, tests, boundary check, RLS coverage, doc/source-of-truth checks, dependency allowlist, drift check). Evidence over claims: a task is done when named commands exit 0, and the ledger records which commands.
7. **Customization ladder** (identical in all three): tenant config → metadata/custom fields → first-party module → customer module → fork/customer branch as explicit last resort.
8. **Core-vs-extension discipline**: a small locked core spine (orgs→users→memberships→accounts→contacts→leads→opportunities→activities→tasks) with everything else (cases, quotes, approvals, marketing, AI) pushed to modules behind a promotion gate (claude's `core-vs-extension-gate.md` decision tree + codex MASTER_PLAN §10's 7 criteria).

## Where to look for what (complementary strengths)

- **Rebuild schema:** start from **codex** (21 tables fully specified with columns, FK delete semantics, indexes, lead lifecycle, stage history, outbox). Cross-check against **agy**'s 121-table catalog for the expansion surfaces (campaigns, products/pricebooks, service/SLA, sequences, forecasting) and **codex MASTER_PLAN §5** for the intended spine.
- **RLS proof testing:** **codex**'s disposable-schema + non-owner-role fixture (replays real migrations; most naive RLS tests pass vacuously because owners bypass RLS) + **claude**'s 20-test property matrix and ADR-0009 hardening recipe.
- **Harness/orchestrator design:** **claude** (gate stack, hooks-over-prose, plan/ memory with resume anchors, locked/liquid ADRs, HITL boundaries, verification escalation ladder) + **agy**'s `run-afk-loop.ps1` (pre-flight gates, two-tier post-flight verify, rollback-on-fail, retry ledger with feed-forward errors, auto-blocking after 3 failures, heartbeat state machine) + **codex**'s evidence ledger (`.agent/status.json` with command-string evidence) and T41 source-of-truth reconciliation pattern.
- **Decision-ready research:** claude ADR-0010 (**Better Auth** over Auth.js v5 for native multi-tenancy) and ADR-0011 (**oRPC** over tRPC+zod-openapi: one Zod router → typed client + OpenAPI + MCP); TR-0097 (metadata→auto-API cache invalidation via per-org `metadata_version` bumped by DB trigger); TR-0099 (pgvector-under-RLS silent recall truncation + iterative-scan fix); agy's Twenty 2.0 / Agentforce / HubSpot competitive scans; codex MASTER_PLAN §8's 14 ready-made report templates and §7's workflow-engine scope (10 triggers / 8 conditions / 9 actions).
- **Observability:** agy's docker-compose OTel-collector + Prometheus + Jaeger + Grafana (port 3010) with provisioned dashboards — drop-in; and the unrealized good idea of exporting the loop's heartbeat state machine into that same stack.

## The shared failure mode (the most important finding)

All three loops stayed honest and green — and all three, once the genuine backlog drained, **degenerated into self-generated busywork while truthfully reporting it**:

- **agy:** ~35 of 94 cycles on a self-imposed 400-line-budget/`any`-cast compliance treadmill (including splitting test files to satisfy the budget).
- **claude:** Phase 0 never ended — 72 cycles, 0 CRM features; feature work was HITL-gated on two ADR ratifications the human never gave, and an unsatisfiable "never stop" Stop hook burned ~25 no-op verification cycles before a bounded-idle fix.
- **codex:** ~185 of 247 tasks were "split file X by concern Y" — 50% of all commits — atomizing 17k LOC into 470+ files averaging ~36 lines, every one verified and ledgered.

The harnesses solved *honesty* (no fabricated claims; evidence everywhere; 0 reverts across ~990 commits). None solved *worth*. Requirements for the new orchestrator, derived directly from these failures:

1. **Value-of-work gate:** every task must name user-visible capability, a closed gap against the target spec, or carry explicit human approval (refactors especially). Hard cap on consecutive refactor-only or no-delta cycles.
2. **Standing objectives need termination criteria.** "Split large hot files" with no stop condition ran for two days. Write "until X, then re-rank" into every goal.
3. **HITL gates need timeouts, notifications, and escalation paths.** An absent human converted 100% of claude-variant capacity into polishing. Blocked-on-human must page the human, not idle-spin.
4. **Bounded idle as a first-class loop state from day one** — when everything is gated, do one maintenance pass, then stop. Never re-run identical green checks as "work."
5. **Ship a thin vertical feature slice inside Phase 0.** A loop given a perfect factory and a locked gate will polish the factory forever.
6. **Ledger statuses must distinguish `contract` / `runtime` / `wired-e2e`** — codex's "done" tasks included types-and-tests-only features, inflating apparent completeness.
7. **Clean-room + runtime verification periodically** — warm `node_modules` and turbo cache both masked real CI-red states; "boot the app and curl it" caught what typecheck could not.
8. **Treat garbled/empty tool output as unknown, never as content** (claude's phantom-source incident: tests authored for files that didn't exist).
9. **A safe push/PR lane is a harness requirement** — agy ended 115 commits ahead of origin with a CI badge that never ran; codex's hosted AFK workflow (self-re-dispatching 330-min segments) shows one workable shape.
10. **Measure loop cost.** All three specified token/cost budgets (`bench/budgets.json`); none ever measured them.
11. **Evidence should be machine-replayable check definitions**, not prose command strings with throwaway ports.
12. **One canonical doc set, machine-checked** (codex's `check-source-of-truth.ts`), one backlog with typed lanes — dual planning systems and duplicate strategy files caused every drift incident.

## Open product decision for the rebuild

The single biggest divergence is not between the three variants — it's between **all of them and this repo's current contract**. All three are multi-tenant Postgres RLS SaaS designs; salesforce-lite-crm's preserved GOAL.md declares auth, permissions, multi-tenancy, and Postgres-as-default to be **non-goals** (local-first SQLite, single tenant). Before rebuilding, decide:

- **(a) Adopt the ralph consensus** (multi-tenant RLS Postgres core) — the research above amounts to a complete, three-times-validated blueprint, and the tenancy substrate is the one thing every review says is brutal to retrofit; or
- **(b) Keep the local-first single-tenant contract** — then the salvage value narrows to the schema spine, audit pattern, verify-gate/harness designs, report templates, and customization ladder, while the RLS material stays shelved here until needed.

Either way, the harness lessons (§ above) apply unchanged.
