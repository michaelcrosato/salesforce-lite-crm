# CSV server-contract layer — consolidation assessment (TICKET003)

**Date:** 2026-05-28 · **Status:** assessment only — nothing deleted or merged.
**Baseline:** `npm run test` green (565/565, 116 files) at time of writing.

This is the read-only dependency/consumer analysis TICKET003 asked for. It maps
who imports the ~34 `lib/server/csv*` modules, separates UI-reachable code from
test-only contract scaffolding, and proposes a phased, test-first consolidation
that a later ticket can execute. **No behavior, contract, route, or test changed
in this ticket.**

## Scope of the layer

34 modules match `lib/server/csv*.ts`. Every module has a matching
`tests/api/csv-*.test.ts`, so by the strict "has an inbound consumer" test
**none are dead code** — each is at minimum exercised by its own unit test. The
useful distinction is therefore not dead/alive but **UI-reachable vs.
test-only contract scaffolding**.

## External (UI/route) consumers

Only four modules are imported by the app at all — both in the Reports surface:

| Module | App consumer |
|---|---|
| `csvExportDeliveryPackets` | `app/reports/page.tsx` |
| `csvImportTemplates` | `app/reports/page.tsx` |
| `csvDedupeReviewBundles` | `app/reports/actions.ts` |
| `csvImportApplyExecutor` | `app/reports/actions.ts` |

No `components/**` or other route imports any `csv*` module. There is no
dedicated CSV route; the Reports page is the only product surface.

## UI-reachable transitive closure (13 modules)

Starting from the four app imports and following intra-`lib/server` imports:

```
csvExportDeliveryPackets → csvExport, csvExportReviewBundles(→csvCapabilities, csvImportPreview)
csvImportTemplates       → csvImportPreview
csvDedupeReviewBundles   → csvDedupeCandidatePackets, csvImportDryRunReceipts,
                           csvImportReviewBundles, csvImportPreflight, csvImportPreview
csvImportApplyExecutor   → csvImportApplyCapabilities, csvImportPreflight, csvImportPreview
```

Reachable set (13): `csvExportDeliveryPackets`, `csvExport`,
`csvExportReviewBundles`, `csvCapabilities`, `csvImportPreview`,
`csvImportTemplates`, `csvDedupeReviewBundles`, `csvDedupeCandidatePackets`,
`csvImportDryRunReceipts`, `csvImportReviewBundles`, `csvImportPreflight`,
`csvImportApplyExecutor`, `csvImportApplyCapabilities`.

These are the import/export building blocks that actually back the Reports UI
(export delivery, import templates/preview/preflight, dedupe review, and the
bounded contact-create apply path from Sprint 40). **Keep as-is.**

## Test-only contract scaffolding (21 modules)

The remaining 21 modules are **not reachable from any route or component**. They
import each other in a tower and are consumed only by their own tests (plus, for
some, the next layer up). This is the "handoff / operator / release" stack built
across Sprints 6–23:

`csvCompatibilityReports`, `csvFieldCoverageSummaries`, `csvHandoffIndex`,
`csvTransferManifests`, `csvContractQaChecks`, `csvContractDriftSnapshots`,
`csvContractReleaseDigest`, `csvOperatorReadinessScorecards`,
`csvOperatorRemediationRunbooks`, `csvOperatorHandoffPackets`,
`csvOperatorFixtureBundles`, `csvOperatorAcceptanceChecklists`,
`csvOperatorWalkthroughManifests`, `csvHandoffReleaseNotesPackets`,
`csvReleaseVerificationManifests`, `csvReleaseClosureScorecards`,
`csvReleaseHandoffCatalog`, `csvReleaseExceptionRegisters`,
`csvReleaseDispositionManifests`, `csvReleaseReadinessPackets`,
`csvInFlightCache` (a shared in-flight packet cache used by the release/operator
modules via `getInFlightCsvPacket`).

### Terminal modules (consumed by nothing but their own test)

Three modules are imported by **no** other `csv*` module:

- `csvImportApplyExecutor` — terminal, but **UI-wired** (Reports actions). Keep.
- `csvDedupeReviewBundles` — terminal, but **UI-wired** (Reports actions). Keep.
- `csvReleaseReadinessPackets` — terminal **and test-only**. It is the apex of
  the release tower (imports `csvContractReleaseDigest`,
  `csvReleaseClosureScorecards`, `csvReleaseDispositionManifests`,
  `csvReleaseExceptionRegisters`, `csvReleaseVerificationManifests`) and nothing
  but `tests/api/csv-release-readiness-packets.test.ts` consumes it. It exists
  purely to assemble lower layers into a "readiness packet" shape with no reader.

## Duplicated shapes / logic across the tower

The 21 test-only modules are near-isomorphic. Each module exports the same
shape:

- a `CSV_*_CONTENT_TYPE` constant,
- a builder/list function returning a record with `noWrite`/no-write safety
  flags, freshness metadata, source counts, metric keys, fixtures, and limits,
- a definition that re-aggregates the layer below it.

The operator/release layers in particular repeat the same "package the layer
below + add metadata + no-write flag" pattern (scorecards → checklists →
walkthroughs → release-notes → closure → catalog → exception registers →
disposition → readiness). This is the gold-plating noted in `REPO_MAP.md`: depth
without an external reader.

## Proposed phased consolidation (for a future ticket — not this one)

Risk posture for a 100% AI-coded, no-human-review repo: the 565-test suite is
the only safety net, so each phase must keep the **full suite green** and change
one layer at a time. Order from lowest to highest risk:

1. **Phase 0 — freeze + document (this doc).** Record the graph so a later agent
   doesn't re-derive it. No code change.
2. **Phase 1 — collapse the release apex.** `csvReleaseReadinessPackets` has no
   reader but its test. Decide explicitly: either (a) wire it into the Reports
   UI if a readiness view is actually wanted, or (b) delete the module **and its
   test together** as unreferenced scaffolding. Do not leave it half-wired.
   Smallest, safest first cut because nothing else imports it.
3. **Phase 2 — factor the shared contract envelope.** Extract the repeated
   `{ contentType, noWrite, freshness, sourceCounts, metricKeys, limits }`
   shape + builder boilerplate into one helper (e.g. `csvContractEnvelope.ts`)
   and have the operator/release modules consume it. Pure refactor; tests pin
   the output shapes, so any drift fails the suite.
4. **Phase 3 — merge sibling layers with identical consumers.** Where layer N is
   imported only by layer N+1 (e.g. parts of the operator-handoff chain),
   evaluate inlining N into N+1. Do one merge per PR, run the suite, commit.
5. **Phase 4 — re-evaluate the whole tower against product intent.** If no UI
   ever consumes the operator/release packets, raise with the owner whether the
   tower should be retired wholesale (modules **and** tests) rather than
   maintained. This is a scope decision, not a mechanical refactor.

## Risk notes

- "Unused by UI" is **not** "safe to delete." Each module is contract-tested;
  deleting a module means deleting its test in the same commit, and confirming
  no other module imports it first (see graph above).
- `csvInFlightCache` is shared infrastructure for the tower — it is not a
  contract layer and should be the last thing touched.
- Sprints 6–23 framed these as "for later UI consumption." That UI never
  arrived. The consolidation decision is ultimately a **product-scope** call
  (keep reserved scaffolding vs. retire it), which belongs to whoever sets the
  roadmap, not to a cleanup pass. Per `CLAUDE.md` §13, no broad refactor should
  happen during feature work — each phase above is its own deliberate ticket.

## Summary

- 34 `csv*` modules; all test-covered, **zero dead by the strict definition**.
- **13** are UI-reachable (import/export building blocks behind Reports) — keep.
- **21** are a test-only operator/release "handoff" tower with no external
  reader — the real consolidation target.
- `csvReleaseReadinessPackets` is the cleanest first cut (terminal, test-only).
- Recommended next ticket: **Phase 1** above (decide + execute the apex), then
  **Phase 2** (shared envelope helper). Nothing should be deleted without
  removing its test in the same atomic commit and re-running the full gate.

---

## Reachability gate + retirement plan (spec 011, 2026-05-29)

Spec 011 lands a **mechanical** reachability gate so this analysis no longer has
to be re-derived by hand, and so the dead tower cannot regrow.

- **Checker:** `scripts/check-reachability.mjs` — static import-graph analysis
  (no runtime, no deps). It builds the transitive closure from the live product
  roots (`app/**` + `components/**`), following every `from "…"` /
  `import("…")` / side-effect specifier (resolving `@/…` and relative paths),
  then flags any `lib/server/*.ts` not in that closure as a **test-only orphan**.
- **Ratchet:** `scripts/reachability-baseline.json` pins the allowed-orphan set.
  A module that becomes a **new** orphan fails the gate (CI `gate` job, fast
  static step). As orphans are wired or deleted, lower `maxOrphans` and prune
  `allowedOrphans` in the **same commit**.
- **Validation:** the checker independently reproduced this document's manual
  CSV analysis exactly — all **21** test-only CSV tower modules above — which
  corroborates both the tool and the original graph.

### Newly surfaced (non-CSV) test-only orphans — 4

Beyond the 21 CSV modules, the checker found **4** test-only `lib/server`
orphans this CSV-scoped assessment never covered (25 orphans total at baseline):

- `bulkListSelectionContracts.ts`
- `pacingSnapshotContracts.ts`
- `pacingSnapshotBuilder.ts` (imports `pacingSnapshotContracts`)
- `workflowRuleExecutionReceipts.ts`

`pacingSnapshot*` were added in **Sprint 56** (this week) with no UI consumer —
a live example of the loop re-accreting read-only packet layers faster than the
UI that would read them. The ratchet exists to stop exactly this.

### Retirement order (bottom-up from the apex; one atomic commit per cut)

Each cut deletes the module **and** its `tests/api/*.test.ts` together, lowers
the ratchet, and must keep `npm run test` + `npm run build` green:

1. `csvReleaseReadinessPackets` — release apex, terminal + test-only (assessment
   Phase 1). Safest first cut: nothing imports it.
2. The release-tower layer it aggregated, once (1) is gone and they fall to
   terminal: `csvReleaseClosureScorecards`, `csvReleaseDispositionManifests`,
   `csvReleaseExceptionRegisters`, `csvReleaseVerificationManifests`,
   `csvContractReleaseDigest`, `csvReleaseHandoffCatalog`,
   `csvHandoffReleaseNotesPackets`.
3. The operator tower: `csvOperator*` (scorecards → checklists → walkthroughs →
   remediation runbooks → fixture bundles → handoff packets).
4. Remaining contract/QA/coverage scaffolding: `csvContractQaChecks`,
   `csvContractDriftSnapshots`, `csvCompatibilityReports`,
   `csvFieldCoverageSummaries`, `csvHandoffIndex`, `csvTransferManifests`.
5. `csvInFlightCache` **last** — shared infra for the tower, only safe once its
   consumers are gone.
6. Non-CSV orphans, each verified terminal first: `pacingSnapshotBuilder` then
   `pacingSnapshotContracts`; `bulkListSelectionContracts`;
   `workflowRuleExecutionReceipts`.

After each cut, re-run `node scripts/check-reachability.mjs` — a freed inner
layer drops to terminal and becomes the next safe deletion.
