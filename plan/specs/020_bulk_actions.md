# 020 — Bulk actions for Leads & Deals lists

- **Wave:** Phase 2 — Major Features
- **Status:** [ ] Todo
- **Scores:** Impact 4/5 · Feasibility 3/5 · Risk Med · Codebase Fit 4/5
- **Depends on:** 019 (selection/filter UI), 018 (audit each bulk mutation)
- **Scope gate:** In-scope (UI + server actions over existing entities; no schema change). Confirm bulk-delete semantics against product guardrails.
- **Related:** Leads/Deals list pages, `app/leads/actions.ts`, `app/deals/actions.ts`, `app/list-selected-export-actions.ts`

## Description & Expected Impact
Every benchmark CRM supports multi-select + bulk operations (reassign, change stage/status, delete, export-selected). The repo already has a `list-selected-export-actions.ts`, implying selection plumbing exists — extend it to a general bulk-action bar. This is table-stakes that lite CRMs typically lack.

Impact: real operational efficiency for the most common list workflows (mass status/stage changes, bulk reassignment).

## Definition of Done & Acceptance Criteria
- [ ] Multi-select on Leads and Deals lists with a bulk-action bar: change status/stage, reassign owner, and delete (with confirmation).
- [ ] Each bulk mutation is transactional, Zod-validated (array of ids + the operation), and writes an `AuditEvent` per affected row (spec 018).
- [ ] Optimistic or post-action revalidation refreshes the list (ties into spec 014 tags).
- [ ] Bulk operations are bounded (cap N per call) to avoid pathological transactions.
- [ ] Gate + e2e green.

## Implementation Approach
**Files to touch:** Leads/Deals list `components/**` (selection + action bar), `app/leads/actions.ts` + `app/deals/actions.ts` (new bulk action functions), `app/list-selected-export-actions.ts` (reuse selection), `lib/validation.ts`.

- Server actions take `{ ids: string[]; op: ... }`, validate, run in a `prisma.$transaction`, audit each.
- Reuse existing selection state rather than building a parallel mechanism.

## Test Strategy
- **Unit:** bulk action validation (reject empty ids / over-cap), transactional all-or-nothing behavior, one audit row per affected entity.
- **e2e:** select rows → bulk change stage → assert list reflects it; `data-testid`s `leads-bulk-bar`, `deals-bulk-apply` (kebab-case) for Gemini.
