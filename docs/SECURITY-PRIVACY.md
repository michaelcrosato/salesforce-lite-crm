# Security And Privacy

This document records security and privacy guardrails for the roadmap. It is
not an implementation claim. `CRM-CONTRACT.md` and `PLAN.md` must be updated
when these guardrails become product behavior.

## Current State

- The app is local-first and has no authentication, permissions model,
  multi-tenancy, deployment configuration, or external provider integration in
  the current contract.
- SQLite remains the local default.
- Deterministic summaries, routing, forecasts, and analyst output run locally.
- Tests, builds, and e2e runs must remain hermetic.

## Promotion Rules

The following require explicit PLAN and contract promotion before
implementation:

- Auth, permissions, profile-lite, ownership, sharing, and tenant boundaries.
- Audit event model.
- External AI providers.
- Agentic writes.
- Dedicated `/search`, RAG, and record retrieval over permissioned data.
- Email, calendar, Gmail/Graph, webhooks, Salesforce import, payments, or
  other external integrations.
- Deployment and secrets policy.

## AI And Automation Rules

- No silent writes; AI mutations require preview and approval.
- AI tool actions wait for identity, authorization, audit, and approval flows.
- Tenant and RBAC filters apply before retrieval or prompt construction.
- CRM text is untrusted input and cannot override system/tool rules.
- Every AI answer should expose provenance over the CRM records, activities,
  and reports used.
- Every AI run and AI action should be auditable once the run-log model is
  promoted.
- Cost and latency telemetry are first-class roadmap requirements.

## Data Handling

- Local demo and tests should use synthetic or seeded data only.
- Recorded provider fixtures must not include secrets or private customer data.
- Imports must validate and preview rows before mutation.
- Exports must respect future ownership, tenant, and permission filters before
  deployment or multi-user use.
- Redaction and provider policy controls are required before external AI
  provider use.

## Operational Requirements

- Secrets must not be required for `test`, `build`, or `test:e2e`.
- Deployment requires an environment validation and secrets policy.
- Observability should include structured logs and request IDs before
  production use.
- Backup and restore tests are required before treating the app as a production
  system of record.
