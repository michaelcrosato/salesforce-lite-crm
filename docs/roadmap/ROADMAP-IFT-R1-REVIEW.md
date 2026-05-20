# Roadmap IFT R1 Review

This file is the trace and source artifact for `docs/ROADMAP.md`. It preserves
the review inputs and decisions used to produce the canonical roadmap. It is
not the canonical roadmap and does not authorize feature implementation.

## Inputs Reviewed

- `CRM-CONTRACT.md` v2.0 for entity names, route contract, status values,
  feature flags, and adapter signatures.
- `README.md` for product overview, implemented workflows, current limitations,
  local gate, and the prior short roadmap section.
- `PLAN.md` section 4 for queued Sprint 4 work and non-goals.
- `PLAN.md` section 16 for deferred backlog candidates.
- `docs/FEATURE-BACKLOG.md` for verified deferred items.
- `docs/PROJECT-CONTROL.md` for readiness status and source-of-truth notes.
- `lib/crm/registry.ts` for route registry and entity registry entries.
- `lib/featureFlags.ts` for excluded routes and disabled feature flags.
- `app/` route files for implemented route presence and excluded-route
  placeholder behavior.
- `prompts/shared/s4-f*.md` for Sprint 4 per-agent acceptance details.

## Material Findings

- `docs/ROADMAP.md` and `docs/roadmap/ROADMAP-IFT-R1-REVIEW.md` were not
  present on this branch before this pass, and no matching history was found
  with `git log --all -- docs/ROADMAP.md docs/roadmap/ROADMAP-IFT-R1-REVIEW.md`.
- The current contract treats tasks, cases, campaigns, and reports as live
  routes. The roadmap can mention them as implemented because they are present
  in `CRM-CONTRACT.md`, `lib/crm/registry.ts`, and the `app/` route tree.
- Excluded routes have placeholder pages in this branch. The roadmap therefore
  describes them as excluded or placeholder-only rather than absent.
- `lib/featureFlags.ts` keeps `dealDetailRoute`, `globalSearchUi`,
  `commandPalette`, `dealerOrderEdit`, and `areaEdit` disabled.
- Current known limitations from README and PLAN remain valid roadmap
  guardrails: no auth, no external AI provider, no `/deals/[id]` live route, no
  `/search` expansion, no Postgres default, and no dealer or area CRUD.

## Canonical Decisions

- Create `docs/ROADMAP.md` as the canonical roadmap and keep this file as the
  trace artifact.
- Keep roadmap wording direct and operational. Do not frame the canonical
  roadmap as a candidate debate.
- Link companion documents from `docs/ROADMAP.md`; do not create separate
  `docs/AI-ROADMAP.md` or `docs/ARCHITECTURE.md` during this pass because the
  roadmap does not need a split AI plan or a new architecture overview.
- Keep AI-related roadmap content in the main roadmap as guardrails: local
  deterministic AI-style behavior is current, external AI provider integration
  is deferred.
- Update `PLAN.md` only to identify `docs/ROADMAP.md` as the proposed roadmap
  source while preserving section 16 as backlog input.
- Update the README roadmap section to point at `docs/ROADMAP.md` instead of
  carrying a competing roadmap.

## Guardrail Review

| Guardrail | Handling |
|---|---|
| No product features | Documentation-only change. No app or runtime code changes. |
| No auth as current work | Auth, permissions, and multi-tenancy are deferred only. |
| No external AI as current work | External AI provider integration is deferred only. |
| No `/deals/[id]` live route | Roadmap says deal detail remains `/deals?deal=<id>` until promoted. |
| No `/search` route expansion | Roadmap says top search remains contacts-only and `/search` is excluded. |
| No Postgres default | Roadmap says SQLite remains the local default. |
| No dealer or area CRUD | Roadmap marks those CRUD flows as deferred future candidates. |
| Do not claim unverified implementation | Implemented claims are limited to contract, registry, and route evidence. |

## Rejected Or Deferred Splits

- `docs/AI-ROADMAP.md`: not created. The AI content is small and is primarily a
  guardrail against external provider scope creep.
- `docs/ARCHITECTURE.md`: not created. The roadmap points to existing contract,
  gate, backlog, and plan documents; it does not depend on a new stable
  architecture overview.
- Candidate-debate transcript: not copied into the canonical roadmap. This file
  records trace decisions without raw chat history.

## Maintenance Notes

- Update `docs/ROADMAP.md` when a candidate is promoted, implemented, removed,
  or materially resequenced.
- Keep this artifact as historical trace. If a future IFT/review round changes
  roadmap direction, add a new artifact or append a clearly dated review note
  rather than turning the canonical roadmap into a debate log.
