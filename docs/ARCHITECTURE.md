# Architecture

This document summarizes the current architecture and the boundaries future
roadmap work must preserve. `CRM-CONTRACT.md` remains the source of truth for
implemented entities, routes, statuses, registries, and adapter signatures.

## Current Shape

- Framework: Next.js app router with React.
- Data layer: Prisma with SQLite as the default local runtime.
- Validation: Zod schemas in server-side adapters and form flows.
- Domain access: `lib/crm/crmClient.ts` and service modules wrap Prisma.
- Routing: implemented and excluded routes are governed by
  `lib/featureFlags.ts`, `EXCLUDED_ROUTES`, and `CRM-CONTRACT.md`.
- Determinism: routing, forecasts, summaries, and analyst output are local and
  deterministic by default.
- Service knowledge: `KnowledgeArticle` records and case suggestion packets are
  local service-workflow helpers, not a standalone route, search index, RAG
  service, or external provider integration.
- Gate: `docs/LOCAL-GATE.md` and `scripts/local-gate.ps1` define the
  authoritative local validation sequence.

## Contract Boundaries

Any future work that changes these surfaces must update `CRM-CONTRACT.md` first
or in the same commit:

- Entity names, lifecycle statuses, stages, or semantic meaning.
- Routes, excluded routes, route flags, or detail-flow conventions.
- Adapter signatures, list filters, report query shapes, or registries.
- Feature flags that promote current non-goals.
- AI provider, prompt, run-log, action, or retrieval contracts once promoted.

Schema or seed changes also update `docs/schema-changelog.md`.

## Architectural Sequencing

The roadmap should preserve this dependency order:

1. Contract and roadmap canon.
2. Gate and blocker reconciliation.
3. Deterministic scaffolds and local-only data workflows.
4. Identity, tenant boundary, permissions, ownership, and audit.
5. Productivity features that can enforce permissions and audit.
6. AI platform features with evals and deterministic fallbacks.
7. External integrations and deployment.

## Current Non-Goals

These must remain out of implementation until promoted by PLAN and contract
updates:

- Auth, permissions, and multi-tenancy.
- Deployment configuration.
- External AI provider integration.
- Salesforce integration.
- Dedicated `/search`.
- Live `/deals/[id]` detail route.
- Dealer-order and area CRUD.
- Postgres as the default runtime.
- Geocoding or territory polygons.
- Persistent forecast scenarios.
- Generic B2B lead conversion on the current `Lead` model.

## Future Architecture Notes

- Identity and tenant boundaries should come before RAG, tool actions, and
  external provider calls.
- Audit should cover user mutations, record changes, imports, routing,
  workflows, AI runs, and AI actions.
- Rule engines should use a deterministic AST and must not use `eval`.
- Scheduled work should use hermetic catch-up jobs with an injected clock, not
  a required background daemon.
- Postgres readiness should keep SQLite as the local default until runtime
  cutover is explicitly promoted.
