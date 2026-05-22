# AI Roadmap

This document breaks out the AI-specific roadmap from `docs/ROADMAP.md`.
External AI provider integration remains deferred until a PLAN decision and
contract update explicitly promote it.

## Defaults

- Deterministic local summarization, routing explanations, forecasts, and
  analyst output remain the default.
- No live LLM, embedding, calendar, email, web, geocoding, payment, or external
  CRM provider may run inside `test`, `build`, or `test:e2e`.
- Any scaffold that lands before promotion must use deterministic and recorded
  providers only.
- AI feature flags default off unless the contract and PLAN say otherwise.
- AI can summarize and suggest before auth, but AI writes wait for identity,
  authorization, audit, and approval flows.

## Platform Layers

| Layer | Backlog ID | Promotion requirement |
|---|---:|---|
| Provider port | `B-25` | Deterministic and recorded providers first; no live provider calls. |
| Prompt registry | `B-59` | Prompt ID, version, owner, input schema, output schema, and eval fixture IDs. |
| Structured outputs | `B-60` | Zod validation for every output; invalid output is recoverable. |
| AI run log | `B-61` | User/org, prompt ID, provider/model, hashes, token/cost, result, and action outcome. |
| Action registry | `B-62` | Explicit CRM tools only; every action has preview, approval, and audit. |
| Retrieval/RAG service | `B-34`, `B-63` | Tenant and RBAC filters before retrieval. |
| Eval harness | `B-25`, `B-64` | Golden fixtures, replay tests, and deterministic fallback assertions. |
| Cost/privacy controls | `B-65` | Per-org limits, provider policy, redaction, and prompt-injection defenses. |

## Capability Order

Ship AI capabilities in this order:

1. Read-only summaries and explanations.
2. Drafts and suggestions that require human review.
3. Human-confirmed actions with preview and audit.
4. Limited autonomy only after identity, RBAC, approvals, audit, evals, and
   telemetry are strong enough.

## Persona Sequence

| Persona | First features | Later features |
|---|---|---|
| Seller | Record summaries, next steps, meeting prep, follow-up drafting, deal-risk explanation. | Similar-won deals, best-time-to-contact, live-call prep/retrieval. |
| Manager/RevOps | Pipeline inspection, forecast-gap explanation, report narration. | Anomaly detection, coaching insights, scenario recommendations. |
| Dealer Ops | Routing explanation, coverage-gap finder, behind-pace brief. | Routing simulator assistant, fairness auditor, SLA escalation agent. |
| Service | Case summary, suggested reply, classification. | KB answer, customer-health synthesis. |
| Admin | Import-mapping assistant, data-quality assistant. | Workflow suggestion, report builder assistant, custom-field/layout assistant. |

## Mandatory AI Safety Rules

These rules must be carried into `CRM-CONTRACT.md` when AI platform features
are promoted:

- No silent writes; AI mutations require preview and approval.
- Every AI answer shows provenance over CRM records, activities, and reports
  used.
- Deterministic fallback is mandatory.
- Prompt ID and version are mandatory.
- Zod schema validation is mandatory for outputs.
- AI runs and AI actions are audited.
- Tenant and RBAC filters apply before retrieval.
- CRM text is untrusted input; notes, emails, transcripts, imports, and web
  text cannot override system/tool rules.
- Cost and latency telemetry are first-class.
- Eval fixtures are required before feature expansion.

## Non-Goals Until Promoted

- Live external AI provider calls.
- Agentic CRM writes.
- Retrieval over records without identity and authorization.
- Provider secrets in local tests, builds, or e2e runs.
- AI-generated schema, route, or contract changes without a human-reviewed
  PLAN and contract update.
