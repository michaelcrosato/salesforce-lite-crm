# TICKET003 — Assess CSV server-contract layer for consolidation / dead code

- **Status:** Open
- **Priority:** Medium

## Goal

Produce a written assessment (not yet a refactor) of the ~36 `lib/server/csv*`
read-only contract modules: which are still consumed by UI/tests, which are
purely transitive, and whether layers can be consolidated without behavior change.

## Context

Sprints 5–23 produced a deep stack of read-only CSV "handoff" contracts:
capabilities → templates → preview → preflight → review bundles → dry-run
receipts → manifests → digests → scorecards → runbooks → packets → registers.
Each is no-write by design and unit-tested, but the layering is deep and much of
it exists only to feed the next layer. This is a likely consolidation target,
but ripping it out is a broad refactor and must be deliberate and test-backed.

## Scope

- In: dependency mapping (who imports what), identify modules with no inbound
  UI/test/route consumer, write findings + a proposed phased consolidation plan.
- Out: deleting or merging modules in this ticket; any contract/route change.
  Consolidation execution becomes its own ticket(s) after review.

## Likely files

`lib/server/csv*.ts`, their tests in `tests/**`, `app/reports/**` consumers.

## Steps

1. Build an import graph for `lib/server/csv*` (consumers + dependencies).
2. Flag modules consumed only by other contract modules (not UI/route/test).
3. Note duplicated shapes/logic across layers.
4. Write findings to `docs/ai/csv-contract-assessment.md` with a phased,
   test-first consolidation proposal and risk notes.

## Acceptance criteria

- [ ] Import/consumer graph captured for the CSV contract layer.
- [ ] Modules with no external consumer explicitly listed (or "none found").
- [ ] Phased consolidation proposal written; nothing deleted in this ticket.
- [ ] No behavior, contract, or test change.

## Commands

```powershell
npm run test   # baseline before any later consolidation work
```

## Risks

Deep, well-tested layer; "unused" may mean "reserved for later UI." Confirm via
tests and `app/reports/**` before proposing removal. Respect CLAUDE.md §13
(no broad refactors during feature work) — this ticket is assessment only.

## Notes

The 565 passing unit tests are the safety net for any future consolidation.
