# Salvage Review: codex-ralph-crm

- **Source repo:** `codex-ralph-crm` (reviewed via detached worktree of the snapshot tag)
- **GitHub remote:** https://github.com/michaelcrosato/codex-ralph-crm.git
- **Snapshot tag:** `pre-purge-20260609`
- **Review date:** 2026-06-09

## Verdict

This is the most implemented of the three ralph-crm variants and the one worth mining hardest. Its two highest-value assets are (1) a complete, working **tenant-isolated CRM domain slice** — 21 Drizzle/Postgres tables with RLS policies on every tenant table, a disposable-schema RLS proof-test pattern that actually demonstrates isolation under a non-owner role, an enumerated audit-event union written from every service mutation, and a clean lead→account/contact/opportunity conversion flow — and (2) a **deterministic agent-governance harness**: a 13-stage `pnpm verify` gate, boundary/MCP/source-of-truth checkers, and an evidence-ledger system (`.agent/status.json` + `plan/`) that kept ~245 task claims tied to named verification commands. The cautionary tale is equally valuable: after exhausting its real roadmap (~T62, day 3), the autonomous loop fell into a degenerate "split file X by concern Y" attractor for ~185 consecutive tasks — 138 of 274 commits are file splits — atomizing 17k LOC into 470+ files averaging ~36 lines while marking everything "completed" with passing evidence. The harness proved honesty; it did not prove usefulness. Carry the schema, the RLS test pattern, the verify-gate design, and the evidence ledger; add a value-of-work gate the loop never had.

## Domain Model (highest value — rebuild from this)

Schema lives in `packages/db/src/schema/tables/` (split by domain: `identity.ts`, `crm/accounts-contacts.ts`, `crm/leads.ts`, `crm/pipelines-opportunities.ts`, `crm/activities-tasks.ts`, `content.ts`, `metadata-reporting.ts`, `operations.ts`, `workflow.ts`), with 10 hand-reviewed SQL migrations in `packages/db/src/migrations/0000–0009`.

**Identity (no RLS — global):**
- `organizations` (id uuid pk, name, slug unique)
- `users` (id, email unique, name)
- `memberships` (org_id FK cascade, user_id FK cascade, role text default `member`, unique(org,user))

**CRM core (all have `org_id` NOT NULL FK→organizations cascade + RLS):**
- `accounts`: name, website, status (default `prospect`), owner_user_id (set null), `custom` jsonb, deleted_at (soft delete)
- `contacts`: account_id FK cascade, first/last name, email, title, custom, deleted_at
- `leads`: first/last/email/company/title/source, status default `new`, owner_user_id, custom, deleted_at, plus conversion backrefs: `converted_account_id`, `converted_contact_id`, `converted_opportunity_id` (all set-null FKs), `converted_at`. Indexes on (org,email) and (org,status)
- `pipelines`: name, unique(org,name)
- `pipeline_stages`: pipeline_id, name, `kind` (`open` | `closed_won` | `closed_lost`), `sort_order` unique per pipeline
- `opportunities`: account_id cascade, contact_id set-null, `amount_cents` integer + `currency` default USD, pipeline_id/stage_id FKs with `onDelete: restrict` (stages can't be deleted while referenced), custom, deleted_at
- `opportunity_stage_history`: opportunity_id, from_stage_id (nullable), to_stage_id, changed_by_user_id, changed_at — written on every stage change
- `activities`: account_id, contact_id, subject, body, `type` default `note`, occurred_at
- `tasks`: account_id, contact_id, subject, body, due_at, completed_at, status default `open`, owner, deleted_at; index (org, status, due_at) for follow-up queries

**Content:** `notes` and `attachments` use polymorphic `parent_type` + `parent_id` with composite index (org, parent_type, parent_id). Attachments are metadata-only but well-designed: `storage_key` unique per org, `checksum_sha256`, `byte_size`, `content_type`, `scan_status` default `pending_scan`, uploaded_by FK `restrict`.

**Metadata:** `field_definitions` (org, object_type, api_name unique-triple; data_type, required/unique/indexed bools, options jsonb, validation jsonb, field_permission_key, archived_at) — governs all `custom` jsonb columns ("ungoverned JSONB is forbidden"). `saved_views` and `report_definitions` store validated jsonb `definition` per object/report type.

**Operations:** `audit_events` (actor_user_id, event_type, target_type/target_id, metadata jsonb, nullable org_id for system events). `outbox_events` (event_type, payload jsonb, status default `pending`, attempts, available_at, locked_at, processed_at, failed_at, last_error, `idempotency_key` unique per org; partial-style index on (status, available_at)).

**Workflow:** `workflow_rules` (definition jsonb typed as `WorkflowRuleDefinition`, trigger, status, disabled_at, created/updated_by) and `workflow_rule_runs` (rule_id, event_id/event_type, record_type/record_id, status, error_message — run history).

**Lead lifecycle states:** `new` → `working` → `qualified` → `converted` / `disqualified`. Guards in `packages/core/src/crm/validation/records.ts`: cannot create as converted/disqualified; converted leads can't re-qualify/re-convert; disqualified leads are terminal. Conversion atomically creates account + contact + optional opportunity, stamps backrefs, and emits 3–4 audit events.

**RLS design:** every tenant migration appends, per table:
```sql
ALTER TABLE "x" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "x_org_select" ON "x" FOR SELECT
  USING ("org_id" = NULLIF(current_setting('app.current_org_id', true), '')::uuid);
-- + matching INSERT WITH CHECK / UPDATE USING+WITH CHECK / DELETE policies
```
Runtime side (`packages/db/src/tenant-context.ts`): an `AsyncLocalStorage<TenantContext>` carries `{orgId, actorId}`; `withTenantDbContext(db, expectedOrgId, op)` refuses to run without context (`MissingTenantContextError`), refuses org mismatch, then inside one transaction runs `SET LOCAL ROLE <CRM_DB_APP_ROLE>` (optional restricted role) and `set_config('app.current_org_id'/'app.current_actor_id', …, true)` before the operation. Migration owner vs runtime role separation is documented in `docs/architecture/permissions-and-rls.md`.

**Audit-write pattern:** `CrmAuditEvent` is a closed union of 11 event types (`crm.account.created/updated`, `crm.contact.created`, `crm.activity.created`, `crm.lead.created/qualified/converted`, `crm.opportunity.created/stage_changed`, `crm.task.created/completed`) in `packages/core/src/crm/types/audit.ts`. Every service mutation follows: `assertCan` → validate/normalize → repository call → `audit.write(...)` with structured metadata (see `packages/core/src/crm/service/leads.ts`). The DB writer (`identity-repository/audit-writer.ts`) routes tenant events through `withTenantDbContext` so audit inserts themselves pass RLS.

**Permission model** (`packages/core/src/permissions/`): single predicate `can({actor, action, objectType, record, field})` with `assertCan` (fail-closed) and `explainPermission` (returns `ruleId` + typed deny reason: `field_denied | membership_disabled | role_denied | scope_denied | tenant_mismatch`). Actions: create/read/update/delete/admin over 16 object types; roles admin/member; API scopes `crm:read|crm:write|identity:*|metadata:*|admin`. Scoped sessions without scopes are invalid — no fallback to role-only behavior.

## Architecture

**Monorepo:** pnpm + Turborepo. `apps/web` (Next.js 16), `apps/api` (Hono), `apps/worker` (shell + outbox primitives), `packages/{core,db,auth,metadata,workflow,audit,search,reporting,ui,testing}`, `modules/{_template,service-lite,email-calendar-sync}`, plus `e2e/`, `bench/`, `infra/`, `scripts/`. Web proxies `/api/*` to Hono via `CRM_API_PROXY_TARGET` (Next rewrite, guard-tested in `apps/web/proxy-target.test.ts`).

**Hard rule set that worked:** no business logic in Next Server Actions (`check-boundaries.ts` literally fails on any `"use server"` in `apps/web`); core may not import apps/modules (regex-enforced); module manifests (`extension.manifest.json`) must declare `id` matching directory, `kind: first-party|customer`, and `rlsRequired: true`.

**Dual-repository strategy (notable, reusable):** every domain service is defined against a repository interface in `@crm/core` with a full in-memory implementation (`createMemoryCrmRepository`) plus a Postgres implementation in `@crm/db`. `apps/api/src/crm/service.ts` falls back to seeded memory repos when `DATABASE_URL` is unset — so unit tests, local dev, and Playwright e2e run with zero infra, while DB/RLS suites prove the Postgres path separately. This is why the repo has 400+ fast tests.

**MCP read-tool facade** (`apps/api/src/mcp/`): HTTP-level facade (not an MCP SDK server) — `GET /mcp/health`, `GET /mcp/tools` (manifest), `POST /mcp/tools/call`. Exactly two tools: `crm.get_account_timeline` (account + contacts/activities/tasks/opportunities/stages) and `crm.global_search`. Each manifest entry carries a machine-checkable safety policy struct: `{readOnly: true, effect: "read", sideEffects: "none", requiredScopes: ["crm:read"], validation: "zod_arguments", rateLimit, idempotency, dryRun, rollback}`. `assertMcpToolsReadOnly()` throws on any violation and runs in `pnpm check:mcp` inside `verify` — write tools are structurally impossible to add silently. An audit-intent planner records tool name, outcome (allowed/denied/unknown/invalid-args), tenant/actor, and *bounded argument key/type summaries only* — never raw arguments (`docs/architecture/mcp-write-policy.md` documents requirements any future write tool must meet: allowlist, dry-run, idempotency, rollback, confirmation policy).

**OpenAPI:** not generated from zod — a hand-maintained typed document assembled from per-route-family path modules (`apps/api/src/http/contracts/{crm,search,reporting,workflow,mcp,...}.ts`), exported deterministically (recursively key-sorted JSON) by `scripts/export-openapi.ts` to ignored `.dev/openapi/openapi.json`. Companion artifacts: `routes.json` (compact route inventory for agents) and `route-security.json` (`scripts/route-security-check.ts` lints security-sensitive route contracts). Contract tests pin the document against the mounted app.

**Search/reporting read-model design** (ADR 0005, accepted): Postgres-only first — no Elasticsearch/warehouse. `saved_views` = validated metadata `{filters[{field,operator,value}], sort, visibleColumns, pageSize}` with operators `equals|contains|greater_than|less_than|is_empty|is_not_empty`; evaluated app-side over bounded row sets (no dynamic SQL). Global search = tenant-scoped `ILIKE` queries per object type (`packages/db/src/search-repository/queries.ts`) returning typed `{objectType, recordId, title, snippet, score, accountId}` where `accountId` is a navigation pointer to the parent account. Reports = whitelisted builder, single `reportType: "opportunity_pipeline_summary"` grouped by stage with `stageKind open|closed_won|closed_lost`; raw SQL explicitly rejected. ADR documents the deferral ladder (trigram → persisted `search_documents` → materialized views) with the risk for each.

## Quality Machinery Worth Stealing

**RLS proof-test pattern** (`packages/db/src/rls/*.rls.test.ts`, fixture form in `rls/crm-records/fixture.ts`) — the strongest single artifact in the repo:
1. Generate a random schema name per run (`crm_rls_<uuid>`) — parallel-safe, no shared state.
2. Replay *the real migration files*, rewriting `"public".` → `"<schema>".` and splitting on `--> statement-breakpoint` — tests prove the actual shipped policies, not a parallel test schema.
3. Create a **non-owner role** per run and grant it table DML — critical, since table owners bypass RLS; most naive RLS "tests" pass vacuously.
4. `asAppTenant(orgId, fn)` helper: `BEGIN; SET LOCAL ROLE <app_role>; SELECT set_config('app.current_org_id', $1, true); …; COMMIT`.
5. Assert: org A sees only org A rows; cross-tenant INSERT throws; missing-context INSERT throws.
6. Gating: `describe.skip` without `DATABASE_URL`, but **hard error** if `CRM_REQUIRE_RLS_TESTS=1` or `CI=true` and no URL — local runs degrade gracefully, CI cannot silently skip.

**`pnpm verify` composite gate:** `check:runtime` (Node/pnpm pin parity with CI) → `check:env` → typecheck → biome lint → vitest → `check:boundaries` → `check:modules` → `check:mcp` → `route-security:check` → `check:source-of-truth` → `check:docs` → `check:dependencies` (anti-hallucination dependency allowlist) → `db:check` (Drizzle drift). CI (`.github/workflows/verify.yml`) adds postgres:17 service with `CRM_REQUIRE_RLS_TESTS=1`, `pnpm db:migrate`, `pnpm test:e2e`, and a failure-only `pnpm ci:summary` step that emits agent-legible failure evidence.

**Playwright strategy** (`playwright.config.ts`, `e2e/tests/`): two-entry `webServer` array boots Hono API (with `CRM_ALLOW_TEST_AUTH=1` explicit opt-in header auth) and `next dev` pointing at it; per-test fixture mints a random org/actor/membership UUID session, seeds it via a pg Pool when a DB is present, and attaches the session JSON to the test report. Specs split by workflow (auth, layout, crm-records: account/lead-conversion/form-validation/keyboard/notes, search-reporting: saved-views/search-pipeline). Only 12 e2e cases — smoke depth, but each crosses web→proxy→API→service→repo. Trace/video/screenshot retained on failure.

**Migration discipline:** sequential numbered SQL files with explicit RLS blocks; `db:migrate` is gated by `check:env:migration` (refuses non-local `DATABASE_URL` unless `CRM_ALLOW_STAGING_MIGRATIONS` + `CRM_BACKUP_CONFIRMED` are set) — a simple, effective "agents can't migrate prod" interlock.

**Config choices:** Biome (not eslint+prettier) with VCS-ignore integration, 100-col, double quotes; turbo tasks make `test`/`build` depend on `^typecheck`; root `vitest run --passWithNoTests` spans workspaces; `.node-version` + `packageManager` pins with a `check:runtime` script that warns locally / fails in CI.

## The Evidence System (reusable harness pattern)

Layered source of truth, each with a distinct job:
- `GOAL.md` — stable mission + current-state summary + priority order + agent rules + definition of done.
- `.agent/current-plan.md` — active roadmap as cycles of ~5 tasks; "Do not do now" list; completion rule at the bottom: *"Only update `.agent/status.json` with completed task evidence after the listed verification commands have actually passed."*
- `.agent/status.json` — the ledger: 247 task entries `{status, title, dependencies[], spec, evidence[]}` where evidence is literal command strings (e.g. `CRM_REQUIRE_RLS_TESTS=1 DATABASE_URL=postgres://crm:crm@localhost:55441/crm_core pnpm --filter @crm/db test`). Honest to a fault — it even records tool failures as evidence lines: `"Browser plugin unavailable: iab; Playwright e2e used for browser validation"`.
- `plan/` — `PROGRESS.md` (checklist + files-touched-per-task), `JOURNAL.md` (per-cycle narrative with verification claims), `ROADMAP.md` (research notes with URLs), `BACKLOG.md` (idea→spec promotions), `BLOCKED.md` (guardrail deferrals), `plan/specs/NNN_*.md` (bounded specs with Definition of Done + Acceptance Checks).
- **The T41 reconciliation marker:** when the agent discovered the inherited planning docs contradicted repo reality ("their claim that the repo has no toolchain or runnable code conflicts with current repository evidence"), it ran a dedicated reconciliation task (T41): demote stale plans with a literal "Historical planning note" header, create GOAL/current-plan/status as the new layer, and add `scripts/check-source-of-truth.ts` to `verify` — a phrase-presence checker asserting every doc carries the reconciliation markers (`GOAL.md` must mention T40+T41, `MASTER_PLAN.md` must contain "Historical planning note", README must point at `.agent/current-plan.md`, etc.). Crude but effective: docs cannot silently drift back into authority.
- **AFK loop** (`scripts/afk-loop.ts` + `.github/workflows/afk-operation.yml`): wraps `codex exec` non-interactively against `.agent/afk-goal.md`; refuses dirty worktrees, requires each iteration to commit and leave the tree clean, retries transient failures 3×, logs under git-ignored `.dev/afk`. The GitHub Actions variant runs 330-minute segments that re-dispatch themselves to fit the 6-hour hosted-job limit across a 24-hour deadline. `.agent/afk-goal.md` is a tight loop contract (re-read sources → pick highest-priority safe task → one increment → verify → update ledger → commit → stop conditions for secrets/migrations/ambiguity).
- **Context economy** (`docs/ai/context-budget.md` + `.agent/context-packs/{platform,crm-slice}.md`): tiered reading (always-read tier 0, pick-one context pack tier 1, path-scoped AGENTS.md tier 2, `rg` slices tier 3) with an explicit hot-file list — the stated motivation for the later file-splitting campaign.

## Implementation Reality (verified against code)

**Real and wired end-to-end:** accounts, contacts, activities, tasks (create/complete), leads + qualify + convert, pipelines/stages/opportunities + stage history, saved views applied to list endpoints via `?savedViewId=`, global search, pipeline summary report, dashboard cards API+UI, admin audit-log panel, `POST /crm/leads/import` (JSON batch) and `GET /crm/accounts/export.csv` (verified in `apps/api/src/crm/routes/leads.ts:36`, `routes/accounts/export.ts:14`), MCP 2-tool facade, signed-session cookie auth with guarded test-header fallback, security headers, request-size limits, HMAC webhook verifier (Stripe-style and GitHub-style), API-key parsing/hashing/scope mapping + rate-limit decision logic.

**Numbers:** ~17,264 lines of TS/TSX across apps/packages/modules; 116 `*.test.ts` files (+68 split test-support dirs); ~401 unit/integration `it()` cases; 12 Playwright cases; 10 migrations; 21 tables. Zero TODO/FIXME comments (lint-enforced cleanliness).

**Contract-only (types + validators + tests, no runtime):** service-lite tickets, email-calendar-sync, webhook *delivery* (verifier exists; no outbound deliveries), attachment storage/upload/scan (metadata + planning contracts only), workflow action *execution* (rules evaluate to outbox/audit intents; the worker boundary modules exist but no live end-to-end automation), API-key persistence (no `api_keys` table). tRPC: planned in all strategy docs, never implemented — REST-only shipped, and nothing missed it.

**Loop behavior from git log:** 274 first-parent commits in 4 days — 2026-05-28: 1, 05-29: 17, 05-30: 86, 05-31: 170. Phase 1 (May 28–29) built the entire product slice in ~17 large commits, ending in one mega-commit `feat(T40): implement lead import, account export, and finalize crm capabilities (T32-T40)` — nine tasks in one commit, the opposite of the stated small-increment rule. Phase 2 (May 30) was governance/reconciliation (T41–T62, real value). Phase 3 (May 30–31) accelerated commit cadence ~4× while value collapsed: cycles 5–41 are almost entirely `refactor/test: split X by Y`. Commit-type distribution: 96 refactor / 54 feat / 49 test / 36 chore / 19 docs / **1 fix / 0 reverts**. No reverts and one fix across 274 commits means the verify gate kept the tree green continuously — and also that the loop never attempted anything risky enough to fail. Remote branches (`jules-*`, `chore/extract-api-state-hook-*`, `perf-optimize-saved-views-*`) show other agents (Google Jules among them) ran side experiments that were never merged.

## Research Artifacts

- **`MASTER_PLAN.md` ≡ `Ralph_CRM_Structural_Plan_MASTER.md`** — byte-identical except one blank line (keep one, delete the other). Despite the "historical" demotion, this is the best strategy document across all three variants. Genuinely reusable: §2 product boundary (hard core vs first-party modules vs backlog vs customer-paid, with explicit service-lite include/exclude lists); §5 data-model spine (the full target table list incl. teams/roles/api_keys/webhook tables this repo never built); §6 the 8-layer permission model + 9 named proof tests ("RLS prevents cross-tenant leakage even if app filtering is missing"); §7 deterministic workflow engine scope (10 triggers / 8 conditions / 9 actions; approvals deferred to `approvals-lite` with a `requires_manager_review` escape hatch); §8 the **14 core report templates** (pipeline by stage/owner, forecast by close month, won/lost, lead conversion rate, lead source performance, activity by owner, neglected accounts, open tasks, aging opportunities, stage duration…) — a ready-made reporting backlog; §10 module manifest shape + the 7-criteria core-promotion gate; §11 customization ladder (config → custom fields → first-party module → customer module → customer branch as last resort). Historical-only: §1's Ralph v2.9.3 setup with **hallucinated npm packages** (`@ralph-orchestrator/ralph-cli@2.9.3` etc. — the real mikeyobrien/ralph-orchestrator in `REFERENCES.md` is a Python tool with no such packages).
- **ADRs 0001–0006** (`docs/architecture/adr/`): modular monolith; Postgres RLS + governed JSONB custom fields; extension module contract; verification gates; search/reporting read models (0005 is the standout — includes options table with per-option risk and acceptance tests for the next increment); Postgres outbox worker runtime. All short and decision-shaped; worth carrying nearly verbatim.
- **`plan/ROADMAP.md`** research notes: May-2026 competitive scan with sources (Salesforce Agentforce, HubSpot Spring 2026 "smart deal progression", Pipedrive AI, Dynamics 365 "system of action", Zoho Zia) and a Next.js 16 security-advisory digest (proxy/middleware bypass, RSC cache poisoning, image-optimization DoS) plus the hot-file size table that motivated the splitting campaign.
- **`docs/`** — 40+ focused docs. Highest-reuse: `permissions-and-rls.md`, `mcp-write-policy.md` (future write-tool requirements checklist), `notes-attachments*.md` (storage-key isolation, signature checks, scan pipeline shape), `webhook-signing.md`, `migration-runbook.md` + `rollback-forward-fix-template.md`, `api-keys-service-accounts.md`, `context-budget.md`, `afk-operation.md`.

## Pitfalls & Anti-Patterns (for the new orchestrator)

1. **The split-task attractor.** Once genuine roadmap items ran out, "replenish cycle" generated whatever scored as safe and completable: file splits. ~185 of 247 tasks and 50% of all commits are decompositions. Each passed `verify`, each updated the ledger truthfully — and the net effect was 470+ files averaging ~36 lines (e.g. 6-line `dependencies.ts`, splitting *tests of splits* "by scenario", "by outcome", "by path"). Lesson: an evidence harness verifies *truth*, not *worth*. The successor needs a task-value gate (user-visible capability, closed gap vs target spec, or explicit human approval for refactors) and a hard cap on consecutive refactor-only cycles.
2. **Goal text actively encouraged it.** `GOAL.md` priority #2 was "Split large hot files into small agent-addressable modules" with no stop condition. The loop optimized the letter of the goal indefinitely. Write termination criteria into any standing objective ("until no file exceeds N lines", then re-rank).
3. **Mega-commit under a small-increment rule.** T32–T40 (nine features) landed as one commit; the per-task discipline only became real after the plan/ system arrived. Enforce commit-per-task mechanically (the AFK loop's clean-worktree check helped later).
4. **Plan-vs-reality drift handled well once, then re-accumulated.** The T41 demote-and-mark pattern (plus `check-source-of-truth.ts`) is the right move and is reusable. But "active" docs drifted too: `docs/architecture/data-model.md` still lists `teams`, `roles`, `role_permissions`, `api_keys`, `webhook_subscriptions`, `reports`, `dashboards` as *stable standard tables* — none exist in the schema. Treat doc table-lists as aspirational unless generated from schema.
5. **Duplicate strategy files** (`MASTER_PLAN.md` ≡ `Ralph_CRM_Structural_Plan_MASTER.md`) — two names for one artifact invited the very conflicts T41 had to fix. One canonical strategy doc.
6. **Hallucinated tooling assumptions** survive in the plan (the `@ralph-orchestrator/*` npm packages, `ralph-e2e`/`ralph-bench` commands in §13's verify list). `ralph.yml` is a draft config for an orchestrator that never ran in that form; the repo's actual loop was the homegrown `afk-loop.ts` + Codex. Verify orchestrator capabilities before encoding them in repo law (REFERENCES.md's "verify current technology assumptions" habit is the right instinct).
7. **Hollow-contract risk.** The "contract first, runtime later" pattern produced clean specs (good) but inflated the implemented-feature count in summaries — service-lite, email-calendar-sync, webhook delivery, attachment storage, and workflow execution all read as "done" in the ledger while being types+tests only. A rebuild ledger should distinguish `contract` / `runtime` / `wired-e2e` statuses.
8. **Search shipped as `ILIKE`**, while ADR/docs say "full-text" — fine for the slice, but carry the gap explicitly (trigram/FTS was consciously deferred; don't rediscover it as a bug).
9. **Evidence strings are not re-runnable.** status.json evidence like `DATABASE_URL=postgres://crm:crm@localhost:55441/...` (a different throwaway port per task) documents what was run, but nothing replays it. Successor harness: store evidence as machine-replayable check definitions, not prose.

## Shortlist to Carry Into salesforce-lite-crm

1. The full schema design above (tables/columns/FK-delete semantics/indexes) + the RLS policy template + `tenant-context.ts` (AsyncLocalStorage + `SET LOCAL ROLE` + `set_config` transaction wrapper).
2. The disposable-schema, non-owner-role RLS proof-test fixture — verbatim pattern.
3. The `verify` composite gate and the four small enforcement scripts: `check-boundaries.ts` (dir layout, core-import ban, manifest validation, Server-Action ban), `check-mcp-tools.ts` + manifest safety-policy struct, `check-source-of-truth.ts`, `check-env.ts` migration interlock.
4. The dual memory/Postgres repository strategy with demo-seed fallback for infra-free e2e.
5. The evidence-ledger trio (GOAL / current-plan / status.json with command evidence) + plan/ journal cycle — **plus** a new value-of-work gate and refactor budget.
6. MASTER_PLAN §§2,5–8,10–11 (product boundary, permission layers + proof tests, workflow scope, 14 report templates, module gate, customization ladder) and ADR 0005's deferral ladder as the successor's reporting/search roadmap.
