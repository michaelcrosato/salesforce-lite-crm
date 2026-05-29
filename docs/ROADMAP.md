# Roadmap

`docs/ROADMAP.md` is the canonical product roadmap for this repository. It
summarizes verified product direction, deferred work, promotion rules, and the
recommended next sprint. It does not authorize feature implementation by
itself: active sprint work still lives in `PLAN.md` section 4, and shipped
product contracts still live in `CRM-CONTRACT.md`.

The trace artifact for the prior roadmap review is
[`docs/roadmap/ROADMAP-IFT-R1-REVIEW.md`](roadmap/ROADMAP-IFT-R1-REVIEW.md).
Companion planning documents:

- [`docs/AI-ROADMAP.md`](AI-ROADMAP.md)
- [`docs/ARCHITECTURE.md`](ARCHITECTURE.md)
- [`docs/EVALS.md`](EVALS.md)
- [`docs/SECURITY-PRIVACY.md`](SECURITY-PRIVACY.md)

## Current Baseline

The current product surface is a local-first Next.js and Prisma CRM for small
business revenue operations. Verified sources are `CRM-CONTRACT.md`,
`README.md`, `lib/crm/registry.ts`, `lib/featureFlags.ts`, and the `app/` route
tree.

Implemented CRM areas include:

- Accounts, contacts, opportunities through the existing `Deal` model,
  activities, and notes.
- Consumer leads routed to dealer orders by postal-prefix coverage and pacing.
- Dealer order and area browsing for the seeded routing workflow.
- Forecast simulation and deterministic analyst recommendations.
- Task, case, campaign, and report routes that are part of the current
  contract.
- CSV export review/download, CSV import preview, and bounded
  operator-confirmed contact import apply on the existing `/reports` surface.
- Case service foundations for queue assignment, SLA timing, local
  `KnowledgeArticle` records, and deterministic case-to-article suggestion
  contracts. Knowledge articles are surfaced in the `/knowledge` operator
  workspace, but there is still no customer knowledge portal, external
  knowledge provider, RAG/vector search, or article sync.

Current exclusions and defaults:

- Deal detail stays in the `/deals?deal=<id>` drawer flow. `/deals/[id]` is
  excluded from the live contract.
- `/search` is not a global search route. Top search remains contacts-only.
- `/command-palette`, `/orders/new`, `/orders/[id]/edit`, `/areas/new`, and
  `/areas/[id]/edit` are excluded or placeholder-only surfaces.
- SQLite is the local default. Postgres is available only through the helper
  path and is not the runtime default.
- Deterministic AI-style summaries and analyst output remain local defaults.
  There is no external AI provider integration.
- There is no authentication, permissions model, multi-tenancy, deployment
  configuration, Salesforce integration, geocoding, territory polygons,
  persistent forecast scenarios, lead import apply, CSV update/upsert or
  duplicate-merge workflow, file storage, external CSV service, or B2B
  lead-conversion flow in the current contract.

## Roadmap Principles

The roadmap is governed by seven rules:

1. Contract first. Any entity, route, model, semantic, or feature-flag change
   updates `CRM-CONTRACT.md`, the schema changelog when schema or seed data
   changes, and the PLAN decision log before code lands.
2. B-NN grounded. Extend the existing backlog numbering in `PLAN.md` instead
   of inventing free-floating horizon work.
3. Deterministic default. Routing, summaries, forecasts, analyst output, tests,
   and local demo behavior remain deterministic by default.
4. Hermetic gate. No live LLM, email, calendar, web, geocoding, payment, or
   external CRM provider is allowed inside `test`, `build`, or `test:e2e`.
5. Feature flags for promoted non-goals. Auth, external AI, deployment,
   Postgres runtime, live `/deals/[id]` detail behavior, `/search`,
   dealer/area CRUD, and persistent forecasts must be promoted intentionally.
6. RBAC before agentic writes. AI can summarize and suggest early, but AI tool
   actions must wait for identity, authorization, audit, and approval flows.
7. Evals before expansion. Every AI capability gets golden fixtures, schema
   validation, deterministic fallback, and replayable tests before broader
   rollout.

## Current Track And Next Work

`PLAN.md` §1/§4 is the authority for the active sprint and per-feature status;
this section records the track, not live per-feature state. Sprints 52–56 have
executed roadmap Phase 3 (Dealer Revenue Command Center expansion):

| Sprint | Roadmap item | Status (see `PLAN.md` for detail) |
|---|---|---|
| 52 Routing Simulation Foundation | `B-53` | complete |
| 53 Routing Simulator Operator Preview | `B-53` | complete |
| 54 Routing Fairness Readiness | `B-54` | complete |
| 55 Dealer Capacity Readiness | `B-55` | complete |
| 56 Pacing Snapshot Readiness | `B-57` | active (in progress) |

All of these stayed read-only/no-write by design (no persistence, live routing
change, or new route boundary). Remaining Phase 3 candidate `B-56` (lead
disposition/SLA) is not yet started. Confirm the live sprint state in `PLAN.md`
before planning the next track.

Future dependency/security modernization remains tracked as `B-68` before
larger AI, auth, deployment, or integration work. Do not run
`npm audit fix --force` during feature loops unless a prompt explicitly
promotes a compatibility-tested modernization pass.

## Readiness Lane

Goal: make the repo safe for the next feature sprint without tripping any
current non-goal.

Non-goals:

- No auth implementation.
- No external AI provider.
- No deployment.
- No Postgres default.
- No dealer or area CRUD.
- No live `/deals/[id]` detail route.
- No dedicated `/search`.
- No geocoding.
- No generic B2B lead conversion.

| Item | Backlog ID | Owners | Scope | Acceptance |
|---|---:|---|---|---|
| Roadmap canon | `B-47` | Shared/manager, all agents review | Add roadmap, AI roadmap, architecture, eval, and security/privacy docs. Keep PLAN 16/17 updates proposal-only. | Docs cite contract constraints and rank work by dependency, owner, gate impact, and promotion requirement. |
| QA/blocker reconciliation | `B-48` | Gemini primary; Claude/Grok support | Reconcile stale SUMMARY/BLOCKERS and verify visual/test-id/demo-path blockers after recent app/component changes. | Every root SUMMARY/BLOCKERS file is current; no stale active blocker conflicts remain. |
| Tooling scripts | `B-03`, `B-14` | Gemini + shared | Maintain `lint` and `typecheck`; keep `*.tsbuildinfo` ignored. | Scripts exist and pass, or PLAN explicitly keeps a gap deferred; local gate remains authoritative. |
| Gate/CI audit | `B-11` | Gemini | Audit `.github` workflow against `scripts/local-gate.ps1`; mark B-11 landed or tighten parity. | CI mirrors, not replaces, the PowerShell gate. |
| Dependency/security modernization | `B-68` | Codex + Gemini | Plan and execute toolchain upgrades for audit findings and current package majors. | Full local gate stays green; no forced downgrade/upgrade is accepted without compatibility evidence. |
| AI scaffold, no live provider | `B-25` | Codex + Gemini; Claude/Grok UI later | Provider port, deterministic provider, recorded provider, prompt registry skeleton, eval harness. | No external provider call; tests use deterministic/recorded fixtures; AI feature flags default off. |
| CSV import/export quick win | `B-22`, `B-24`; optional `B-23` | Claude + Grok + Codex + Gemini | Wire existing CSV helpers to import/export UI; dedupe preview can start read-only. | Import preview validates rows; export works on list pages; no external dependency. |

## Phase 1: Identity, Tenant Boundary, Ownership, Audit

Why now: this unlocks safe production work and safe AI write actions.

| Item | Backlog ID | Contract impact |
|---|---:|---|
| Auth/session/dev identity shell | `B-10` | Requires promotion from current non-goal. Add Identity/Auth section. |
| Roles, permissions, profile-lite model | `B-10`, `B-15` | Define object/action permission matrix. |
| Record ownership and sharing | `B-15` | Add owner/share conventions to CRM contract. |
| Organization/tenant boundary | `B-16` | Add `orgId`/membership convention; keep single-org demo mode. |
| Audit event model | `B-49` | Add audit event taxonomy for user, record, AI, import, routing, and workflow actions. |

Acceptance: protected routes work in flagged mode; permission service gates
server actions and UI affordances; seed supports demo users; audit rows are
created for mutations; local deterministic demo still works with auth flag off.

Research first: Auth.js/NextAuth versus a local credentials shell; row-level
`orgId` versus future schema-per-tenant; minimum viable sharing model;
server-action authorization patterns.

## Phase 2: CRM Productivity Platform

Why: the repo has breadth, but real CRM usability needs search, saved views,
filters, bulk actions, reports, and admin-grade list behavior.

| Item | Backlog ID | Scope |
|---|---:|---|
| Saved views | `B-50` | Saved filters/sorts/columns per object and user/org. |
| Filter/query compiler | `B-51` | Shared filter AST compiled to Prisma; reused by lists, reports, exports, and natural-language filter AI. |
| Bulk actions | `B-52` | Assign owner, update status/stage, create tasks, export selected, audit every action. |
| Dedicated `/search` | `B-06` | Promote `/search`; use existing `globalSearch()` as the base; enforce permissions/tenant filters. |
| Report builder | `B-28` | Persist report definitions: object, fields, filters, grouping, charts. |
| Dashboard builder | `B-29` | Persist dashboard cards from saved reports. |

Contract note: `/search` is currently an excluded route, while command palette
search is implemented. Promotion requires a PLAN decision and feature-flag
change.

## Phase 3: Dealer Revenue Command Center Expansion

Why: dealer lead routing is the strongest vertical differentiator. Keep it
separate from generic B2B sales leads.

| Item | Backlog ID | Scope |
|---|---:|---|
| DealerOrder CRUD | `B-04` | Create/edit/pause/retire dealer orders with validation and audit. |
| Area CRUD | `B-04` | Postal prefix editor, overlap/collision warnings, area coverage diagnostics. |
| Routing simulator | `B-53` | "What would route where?" simulator using hypothetical quotas, area coverage, and lead batches. |
| Routing fairness and explanation | `B-54` | Deterministic metrics: pace gap, saturation, lead quality proxy, SLA risk; later AI narrative. |
| Dealer capacity windows | `B-55` | Dealer capacity calendars, blackout windows, daily caps. |
| Lead disposition/SLA | `B-56` | Routed, accepted, contacted, won/lost, returned, stale; escalation tasks. |
| Pacing snapshots | `B-57` | Persist monthly/daily routing and pacing snapshots for trend reports. |

Contract note: dealer/area CRUD is currently deferred. Keep geocoding and
polygons out until a later provider/data/license decision.

## Phase 4: Revenue, Service, And Operations Depth

| Area | Backlog IDs | Scope |
|---|---:|---|
| Opportunity detail route | `B-05` | Promote `/deals/[id]` only if full detail page is needed for line items; keep drawer canonical or define coexistence. |
| Products/price books/line items | `B-17` | Product, PriceBook, PriceBookEntry, OpportunityLineItem; Deal value becomes line-item rollup. |
| Quote/quote PDF | `B-18` | Quote and QuoteLine, draft PDF/export, later email send. |
| Events/calendar | `B-19` | Event model, `/calendar`, meeting activity links. |
| Forecast scenarios | `B-07` | Persist forecast assumptions/scenarios once identity/audit exists. |
| Service queues/SLA/knowledge | `B-41`, `B-42`, `B-43` | Queue assignment, SLA timers with injected clock, Knowledge Article model. |
| Campaign members/influence | `B-58` | CampaignMember, campaign ROI and opportunity influence-lite. |

Contract note: `/deals/[id]` and persistent forecasts are current non-goals.
Promote explicitly before coding.

## Phase 5: Customization And Automation

| Item | Backlog ID | Scope |
|---|---:|---|
| Custom field metadata | `B-39` | `FieldDefinition` plus `customFields` JSON; core fields immutable. |
| Record types/layout-lite | `B-40` | Admin-configurable field sections per object/type. |
| Validation rules | `B-20` | Deterministic rule AST, never `eval`. |
| Assignment/workflow rules | `B-20` | Trigger on create/update through `crmClient`; side effects logged. |
| Approval processes | `B-21` | Approval steps, pending approvals, stage-change gates. |
| Scheduled job sweep | `B-21` | Hermetic catch-up jobs with injected clock; no background daemon dependency. |

Research first: JSON metadata versus EAV versus generated schema; safe
condition AST; performance on SQLite and Postgres; migration strategy for
custom fields.

## Phase 6: AI Platform Foundation

External AI provider integration remains a non-goal until promoted. The
scaffold can land with deterministic and recorded providers only.

| Layer | Backlog ID | Scope |
|---|---:|---|
| AI provider port | `B-25` | `complete`, `embed`, `stream`, tool-call adapter; deterministic and recorded providers first. |
| Prompt registry | `B-59` | Prompt ID, version, owner, input schema, output schema, eval fixture IDs. |
| Structured outputs | `B-60` | Zod validation for every AI output; invalid output is a recoverable UI error. |
| AI run log | `B-61` | User/org, prompt ID, provider/model, hashes, token/cost, result, action outcome. |
| Action registry | `B-62` | Explicit CRM tools: create task, log activity, draft email, update stage, assign lead. |
| Retrieval/RAG service | `B-34`, `B-63` | Index allowed records; RBAC and tenant filters before retrieval. |
| Eval harness | `B-25`, `B-64` | Golden tests for summaries, routing explanations, scoring, natural-language filters, RAG answers, and tool plans. |
| Cost/privacy controls | `B-65` | Per-org limits, provider policy, redaction, prompt-injection defenses. |

## Phase 7: AI Features By Persona

Ship AI in this order: read-only, draft/suggest, human-confirmed actions, then
limited autonomy after strong audit and evals.

| Persona | First features | Later features |
|---|---|---|
| Seller | Record summaries, next steps, meeting prep, follow-up drafting, deal-risk explanation. | Similar-won deals, best-time-to-contact, live-call prep/retrieval. |
| Manager/RevOps | Pipeline inspection, forecast-gap explanation, report narration. | Anomaly detection, coaching insights, scenario recommendations. |
| Dealer Ops | Routing explanation, coverage-gap finder, behind-pace brief. | Routing simulator assistant, fairness auditor, SLA escalation agent. |
| Service | Case summary, suggested reply, classification. | KB answer, customer-health synthesis. |
| Admin | Import-mapping assistant, data-quality assistant. | Workflow suggestion, report builder assistant, custom-field/layout assistant. |

## Phase 8: Integration, Deployment, And Operations

| Item | Backlog ID | Scope |
|---|---:|---|
| REST/Bulk API | `B-26` | API keys, object endpoints over `crmClient`, bulk import/export, audit. |
| Webhooks | `B-26` | Local test sink and replay fixtures; no live provider in gate. |
| Transactional email | `B-27` | Stub provider default; templates; send/log email later. |
| Gmail/Graph/calendar sync | `B-66` | Mock-only gate; token/secrets design first. |
| Salesforce import | `B-67` | CSV mapping first, API sync later. |
| Postgres readiness | `B-08` | Keep SQLite default; add migration/adapter/CI readiness. |
| Deployment | `B-12` | Vercel/Docker/Railway/Fly decision; env validation; secrets policy. |
| Observability/backups | `B-37` | Structured logs, request IDs, AI telemetry, backup/restore tests. |
| Responsive/mobile/accessibility | `B-38` | Mobile pass, accessibility checks, dashboard/table usability. |

## Required Promotion Decisions

These cannot slip into a normal sprint:

- `B-04` dealer-order and area CRUD.
- `B-05` live `/deals/[id]` detail behavior.
- `B-06` dedicated `/search`.
- `B-07` persistent forecast scenarios.
- `B-08` Postgres runtime/default path.
- `B-09` external AI provider.
- `B-10` auth/permissions/multitenancy.
- `B-12` deployment.
- Geocoding/polygons.
- Generic B2B lead conversion.

For lead conversion, do not implement `Lead -> Account + Contact +
Opportunity` against the current `Lead` model. The contract says current
`Lead` is a consumer dealer-routed object. A future generic sales-lead feature
should either introduce a new object such as `SalesLead` or `Prospect`, or
explicitly rewrite Lead semantics through a contract decision.

## Promotion Requirements

Before a candidate becomes implementation work:

- `PLAN.md` must identify the sprint item, owner, scope, and acceptance
  criteria.
- `CRM-CONTRACT.md` must change first or in the same commit when the work
  changes entity names, route contracts, status values, feature flags, or
  adapter signatures.
- Schema or seed changes must update `docs/schema-changelog.md`.
- The implementation prompt must name any one-run ownership exceptions.
- Tests and local-gate expectations must match the risk of the change.
- `docs/ROADMAP.md` should be updated when the change materially alters
  sequencing, defaults, or deferred scope.

## AI Safety Rules To Contract Later

These are roadmap requirements for future AI work and should become
contractual when AI platform features are promoted:

1. No silent writes; AI mutations require preview and approval.
2. Every AI answer shows provenance over CRM records/activities/reports used.
3. Deterministic fallback is mandatory.
4. Prompt ID and version are mandatory.
5. Zod schema validation is mandatory for outputs.
6. AI runs and AI actions are audited.
7. Tenant/RBAC filters apply before retrieval.
8. CRM text is untrusted input; notes, emails, transcripts, imports, and web
   text cannot override system/tool rules.
9. Cost and latency telemetry are first-class.
10. Eval fixtures are required before feature expansion.

## Market Context

External market direction supports the AI sequence, but it does not override
repo guardrails. The 2026-05-24 web review of official Salesforce, HubSpot,
Microsoft, and Zoho materials still points toward CRM-native agents,
assistants, summaries, record lookup, meeting prep, service automation, and
configurable agent workflows. Treat that as design pressure only. Before
implementation, re-check current vendor docs and translate any useful pattern
through `CRM-CONTRACT.md`, `PLAN.md`, deterministic fallbacks, audit, approval
flows, and hermetic tests.

Dependency/security posture is also part of roadmap readiness. The same review
checked current npm registry versions and public advisories surfaced by local
`npm audit`; moderate transitive findings should become planned B-68 work when
the feature loop has capacity.
