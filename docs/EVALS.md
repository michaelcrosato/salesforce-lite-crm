# Evals

This document defines the evaluation expectations for future AI and
deterministic-assistant work. It is a roadmap contract candidate, not proof
that the harness already exists.

## Principles

- Evals come before expansion.
- Fixtures are golden, versioned, and replayable.
- Tests are hermetic and never call live providers.
- Output schemas are validated with Zod.
- Invalid AI output is a recoverable product state, not a thrown-away failure.
- Deterministic fallback behavior is always asserted.

## Required Coverage

Every promoted AI capability should include:

- Input fixtures for representative CRM records and edge cases.
- Expected structured output fixtures.
- Schema validation tests.
- Deterministic fallback tests.
- Replay tests for recorded provider responses, when recorded providers exist.
- Provenance assertions showing which CRM records, activities, or reports were
  used.
- Negative tests for untrusted CRM text attempting to override system/tool
  rules.

## Initial Eval Targets

| Capability | Backlog ID | Fixture focus |
|---|---:|---|
| Record summaries | `B-25`, `B-64` | Contacts, accounts, opportunities, cases, activities, and notes. |
| Routing explanations | `B-25`, `B-54`, `B-64` | Postal normalization, area matching, quota filtering, pace-gap ranking. |
| Forecast explanations | `B-07`, `B-64` | Scenario assumptions, deterministic month-end projections, risk narration. |
| Natural-language filters | `B-51`, `B-64` | Filter AST generation, invalid-field recovery, permission-safe query plans. |
| RAG answers | `B-34`, `B-63`, `B-64` | Tenant/RBAC-filtered retrieval, provenance, refusal on missing evidence. |
| Tool plans | `B-62`, `B-64` | Preview-only plans, approval requirements, audit metadata. |

## Gate Rules

- `npm run test`, `npm run build`, and `npm run test:e2e` must not depend on
  network, live model credentials, live email/calendar providers, geocoding,
  payments, or external CRM services.
- Recorded fixtures must be safe to commit and must not contain production
  secrets or private customer data.
- Any provider-specific snapshot must include provider/model metadata and a
  stable prompt ID/version.

## Fixture Hygiene

- Use seeded demo-style data or synthetic data.
- Keep fixture names descriptive and stable.
- Store sensitive examples as redacted synthetic cases, not real customer
  content.
- Treat imported notes, emails, transcripts, web text, and CRM free text as
  untrusted input.
