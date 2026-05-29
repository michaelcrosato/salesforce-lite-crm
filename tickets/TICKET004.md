# TICKET004 — CSV layer consolidation, Phase 1 (resolve the release apex)

- **Status:** Open
- **Priority:** Low
- **Depends on:** TICKET003 (assessment) — read
  `docs/ai/csv-contract-assessment.md` first.

## Goal

Execute Phase 1 of the consolidation proposed in the TICKET003 assessment:
resolve `csvReleaseReadinessPackets`, the terminal, test-only apex of the CSV
release tower (no route or component imports it — only its own test).

## Context

The assessment found 21 of 34 `lib/server/csv*` modules form a test-only
"operator/release handoff" tower with no UI reader.
`csvReleaseReadinessPackets` sits at the top: it aggregates
`csvContractReleaseDigest`, `csvReleaseClosureScorecards`,
`csvReleaseDispositionManifests`, `csvReleaseExceptionRegisters`, and
`csvReleaseVerificationManifests`, and nothing but
`tests/api/csv-release-readiness-packets.test.ts` consumes the result. It is the
smallest, safest first cut because no other module imports it.

## Scope

- In: make an explicit decision for `csvReleaseReadinessPackets` and execute it:
  either (a) wire it into the `/reports` UI if a readiness view is genuinely
  wanted, or (b) remove the module **and its test in the same atomic commit** as
  unreferenced scaffolding. Confirm via grep that no other module imports it
  before removal.
- Out: touching the other 20 tower modules, the 13 UI-reachable modules,
  `csvInFlightCache`, or any contract/route/schema change. Later phases
  (shared envelope helper, sibling-layer merges) are separate tickets.

## Likely files

`lib/server/csvReleaseReadinessPackets.ts`,
`tests/api/csv-release-readiness-packets.test.ts`, possibly `app/reports/**`
(only if option (a) is chosen).

## Steps

1. Re-confirm the import graph for `csvReleaseReadinessPackets` (no inbound
   `csv*` importer; test-only) — see the assessment doc.
2. Decide (a) wire-in vs (b) remove. Default to (b) unless a reader is wanted.
3. Execute the smallest change; remove module + test together if removing.
4. Run the full gate; the 565-test suite is the safety net.

## Acceptance criteria

- [ ] Explicit decision recorded (wire-in or remove) with rationale.
- [ ] No half-wired state: module is either consumed by a route/test or gone.
- [ ] `npm run test` + `npm run build` green after the change.
- [ ] No change to the other 20 tower modules or the 13 UI-reachable modules.

## Commands

```powershell
npm run test ; npm run build
```

## Risks

Deleting a contract module removes its test coverage; do it deliberately and
atomically. Per CLAUDE.md §13, one layer per ticket — do not expand into the
rest of the tower here.
