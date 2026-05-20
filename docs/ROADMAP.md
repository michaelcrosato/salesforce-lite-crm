# Roadmap

`docs/ROADMAP.md` is the canonical product roadmap for this repository. It
summarizes verified product direction, deferred work, and promotion rules. It
does not authorize feature implementation by itself: active sprint work still
lives in `PLAN.md` section 4, and shipped product contracts still live in
`CRM-CONTRACT.md`.

The trace artifact for this roadmap is
[`docs/roadmap/ROADMAP-IFT-R1-REVIEW.md`](roadmap/ROADMAP-IFT-R1-REVIEW.md).

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
  persistent forecast scenarios, CSV import/export, or B2B lead-conversion
  flow in the current contract.

## Roadmap Principles

- Harden the existing CRM workflow before expanding product scope.
- Promote work through `PLAN.md` before implementation and update
  `CRM-CONTRACT.md` when routes, entities, statuses, or adapter contracts
  change.
- Keep the local gate authoritative for pass/fail claims.
- Keep deterministic local behavior as the default until a future promoted item
  explicitly changes it.
- Mark deferred items as future or promoted work. Do not imply that excluded
  routes or integrations are already implemented.

## Queued Work

Sprint 4 is queued for focused hardening of the existing product surface. These
items are coordination scope, not a broad product expansion:

| ID | Owner | Scope | Acceptance summary |
|---|---|---|---|
| S4-F1 | Codex | Demo seed tuning | Seed data supports the reference workflow, including Vancouver lead routing, behind-pace dealer orders, stale high-value opportunities, low-health dealer accounts, and deterministic analyst actions. |
| S4-F2 | Claude | Route visual QA | Implemented CRM pages render coherently. Excluded routes remain placeholder-only or unavailable. |
| S4-F3 | Grok | Component polish | Shared demo components have stable spacing, readable empty states, deterministic ordering, and no broken links or orphaned actions. |
| S4-F4 | Gemini | Demo smoke and gate hardening | Vitest, Playwright, and local validation support the README demo path and route guardrails. |

## Promotion Candidates

The following items are candidates for future promotion. They are not active
work until `PLAN.md` promotes them into a sprint or the current prompt
explicitly grants scope.

| Candidate | Current status | Promotion notes |
|---|---|---|
| Local gate and CI hardening | Partly supported by local docs and scripts | Keep the PowerShell local gate authoritative. CI may mirror it but must not replace it. |
| Postgres runtime cutover readiness | Helper path exists; SQLite remains default | Requires adapter/runtime work and gate coverage before Postgres can become a default or production path. |
| Dealer order create/edit flows | Deferred | Future CRUD must preserve seeded routing behavior and dealer-order pacing semantics. |
| Area create/edit flows | Deferred | Future CRUD must preserve postal-prefix matching and avoid introducing geocoding or territory polygons unless separately promoted. |
| `/deals/[id]` opportunity detail route | Deferred and excluded | Any future route must preserve the current board and drawer flow unless the contract changes. |
| Global search expansion | Deferred and excluded | Current top search routes to contacts only. Future search must be scoped and tested before promotion. |
| Persistent forecast scenarios | Deferred | Current scenarios are transparent and deterministic but do not persist. |
| Authentication, permissions, and multi-tenancy | Deferred | Significant scope; requires explicit contract, route, data, and test planning. |
| Deployment configuration | Deferred | No deployment target is current scope. |
| Salesforce integration | Deferred | The app is Salesforce-style, not Salesforce-connected. |
| External AI provider integration | Deferred | Deterministic local summarization and analyst output remain the default. |
| CSV import/export | Deferred | README lists this as absent from the current product. |

## Promotion Requirements

Before a candidate becomes implementation work:

- `PLAN.md` must identify the sprint item, owner, scope, and acceptance
  criteria.
- `CRM-CONTRACT.md` must change first or in the same commit when the work
  changes entity names, route contracts, status values, feature flags, or
  adapter signatures.
- The implementation prompt must name any one-run ownership exceptions.
- Tests and local-gate expectations must match the risk of the change.
- `docs/ROADMAP.md` should be updated when the change materially alters
  sequencing, defaults, or deferred scope.

## Companion Documents

- `CRM-CONTRACT.md` - implemented entities, routes, statuses, registries, and
  adapter signatures.
- `PLAN.md` - active sprint scope, agent ownership, local gate, reports, and
  backlog promotion.
- [`docs/FEATURE-BACKLOG.md`](FEATURE-BACKLOG.md) - verified backlog facts and
  deferred items.
- [`docs/LOCAL-GATE.md`](LOCAL-GATE.md) - local setup and validation sequence.
- [`docs/roadmap/ROADMAP-IFT-R1-REVIEW.md`](roadmap/ROADMAP-IFT-R1-REVIEW.md)
  - source and review trace for this roadmap.
