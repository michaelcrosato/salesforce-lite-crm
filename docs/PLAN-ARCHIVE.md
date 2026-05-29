\# PLAN-ARCHIVE.md — Completed Sprint Detail (Sprints 4–55)

Verbatim per-sprint feature tables and per-sprint non-goals moved out of
`PLAN.md` §4 on 2026-05-28 for token efficiency (TICKET002). This is a
historical record only; live rules and the active sprint stay in `PLAN.md`.
Nothing here is binding scope unless re-promoted into `PLAN.md`.

---
\*\*Sprint 4 — Demo Data Tuning \& Visual QA\*\*



Goal: harden the five-minute demo path using existing product scope. Do not add new product features unless the current prompt or this section makes that scope explicit.



| Feature | Owner | Status | Acceptance summary |

|---|---|---|---|

| S4-F1 — Demo seed tuning | Codex | present in `main` | Seeded data supports the README demo path: Vancouver lead routing (`V5K 0A1`), behind-pace dealer orders, stale high-value deals, low-health dealer accounts, and deterministic analyst actions. |

| S4-F2 — Route visual QA | Claude | present in `main` | Demo-critical routes render coherently: `/dashboard`, `/leads`, `/orders`, `/orders/\[id]`, `/areas`, `/forecast`, `/accounts`, `/contacts`, `/deals`, `/tasks`, `/cases`, `/campaigns`, and `/reports`. |

| S4-F3 — Component polish | Grok | present in `main` | Shared components used in the demo have stable spacing, readable empty states, deterministic ordering, and no broken links or orphaned actions. |

| S4-F4 — Demo smoke and gate hardening | Gemini | present in `main` | Tests/e2e support the implemented CRM routes and local gate commands are documented in `docs/LOCAL-GATE.md`. |



\*\*Sprint 4 non-goals\*\* (do not bundle into any S4-F\* work without an explicit current prompt or §4 update):



\- No authentication, permissions, or multi-tenancy.

\- No deployment configuration.

\- No external AI provider integration. Summarizer remains deterministic.

\- No geocoding or territory polygons. Postal prefix matching stays.

\- No default switch from SQLite to Postgres.

\- No persistent forecast scenarios.

\- No dealer order or routing area create/edit flows.

\- No new `/deals/\[id]` route. The current drawer flow stays.

\- No dedicated `/search` page. Header search continues to route to contacts
only; cross-entity search is available through the global Ctrl/Cmd+K command
palette.



Acceptance details live in `CRM-CONTRACT.md` and this section. Status updates are agent-reported in SUMMARY; only the local gate (§9) authorizes a status of `done`.

\*\*Sprint 5 — Data Portability Foundation\*\*

Goal: promote a narrow server-side CSV portability foundation while preserving current routes, deterministic local behavior, and excluded-route guardrails.

| Feature | Owner | Status | Acceptance summary |
|---|---|---|---|
| S5-F1 — Server CSV export contracts | Codex | done | Server-side CSV export mapping covers current CRM list data with deterministic RFC4180 output and later-UI-ready contracts. No routes, buttons, file storage, external services, or product UI are added. |
| S5-F2 — CSV import preview validation | Codex | done | Server-side CSV import preview parses CSV text, normalizes headers, validates contact and consumer-lead rows with existing schemas/helpers, and returns row-level errors without database writes. No bulk create/update, mapping wizard, product UI, or background jobs are added. |

\*\*Sprint 5 non-goals\*\* (carry forward permanent scope boundaries plus CSV-specific exclusions):

\- No authentication, permissions, or multi-tenancy.

\- No deployment configuration.

\- No external AI provider integration.

\- No geocoding or territory polygons.

\- No default switch from SQLite to Postgres.

\- No persistent forecast scenarios.

\- No dealer order or routing area create/edit flows.

\- No new `/deals/\[id]` route.

\- No global search expansion.

\- No CSV product UI, download buttons, upload forms, mapping wizard, file storage, or background import jobs.

\- No database writes from CSV import preview.

\- No Salesforce integration.


\*\*Sprint 6 — CSV Readiness Contracts\*\*

Goal: finish the server-side CSV readiness layer needed for later UI wiring without adding routes, persistence workflows, or external integrations.

| Feature | Owner | Status | Acceptance summary |
|---|---|---|---|
| S6-F1 — CSV import template contracts | Codex | done | Server-side import templates are published for supported CSV preview entities with canonical header order, required-field metadata, aliases, and header-only CSV output suitable for later UI wiring. No routes, buttons, storage, external services, or database writes are added. |
| S6-F2 — CSV import preflight diagnostics | Codex | done | CSV import preview can run database-backed preflight diagnostics for contact and consumer-lead rows, reporting duplicate/contactability and relationship warnings without mutating data. Diagnostics are row-level and deterministic, with no routing execution or import writes. |

\*\*Sprint 6 non-goals\*\* (carry forward permanent scope boundaries plus CSV-specific exclusions):

\- No authentication, permissions, or multi-tenancy.

\- No deployment configuration.

\- No external AI provider integration.

\- No geocoding or territory polygons.

\- No default switch from SQLite to Postgres.

\- No persistent forecast scenarios.

\- No dealer order or routing area create/edit flows.

\- No new `/deals/\[id]` route.

\- No global search expansion.

\- No CSV product UI, download buttons, upload forms, mapping wizard, file storage, or background import/export jobs.

\- No database writes from CSV import preview or preflight diagnostics.

\- No bulk create/update or import apply flow.

\- No routing reassignment, external enrichment, or Salesforce integration.


\*\*Sprint 7 — CSV Handoff Manifests\*\*

Goal: make the server-side CSV readiness layer easier to consume from later UI work while preserving read-only local behavior and current route boundaries.

| Feature | Owner | Status | Acceptance summary |
|---|---|---|---|
| S7-F1 — CSV capability catalog | Codex | done | Server-side CSV capability metadata lists supported export, import preview, template, and preflight entities with routes, filenames, content types, canonical headers, required import fields, and explicit read/write safety flags. No routes, UI, upload/download actions, file storage, external services, or database writes are added. |
| S7-F2 — CSV preview issue summaries | Codex | done | CSV import preview/preflight exposes deterministic aggregate issue summaries for header, parse, row-validation, and diagnostic warnings so later UI can present counts and categories without reinterpreting row arrays. No import apply flow, routing execution, background jobs, external AI, or database writes are added. |

\*\*Sprint 7 non-goals\*\* (carry forward permanent scope boundaries plus CSV-specific exclusions):

\- No authentication, permissions, or multi-tenancy.

\- No deployment configuration.

\- No external AI provider integration.

\- No geocoding or territory polygons.

\- No default switch from SQLite to Postgres.

\- No persistent forecast scenarios.

\- No dealer order or routing area create/edit flows.

\- No new `/deals/\[id]` route.

\- No global search expansion.

\- No CSV product UI, download buttons, upload forms, mapping wizard, file storage, or background import/export jobs.

\- No database writes from CSV import preview, preflight diagnostics, catalogs, or issue summaries.

\- No bulk create/update or import apply flow.

\- No routing reassignment, external enrichment, or Salesforce integration.


\*\*Sprint 8 — CSV Consumer Readiness\*\*

Goal: add the next read-only server-side CSV handoff contracts needed by later UI work while preserving current routes, local determinism, and no-write safety.

| Feature | Owner | Status | Acceptance summary |
|---|---|---|---|
| S8-F1 — CSV import example contracts | Codex | done | Import template contracts expose deterministic example row metadata and optional one-row example CSV for supported preview entities. Examples use existing validation fields and do not perform database writes, routing, file storage, or UI work. |
| S8-F2 — CSV export preflight summaries | Codex | done | CSV export support exposes read-only preflight summaries per supported export entity, including filename/content type, canonical headers, default/max limits, and current row count for later UI confirmation. No routes, buttons, file storage, background jobs, or export writes are added. |

\*\*Sprint 8 non-goals\*\* (carry forward permanent scope boundaries plus CSV-specific exclusions):

\- No authentication, permissions, or multi-tenancy.

\- No deployment configuration.

\- No external AI provider integration.

\- No geocoding or territory polygons.

\- No default switch from SQLite to Postgres.

\- No persistent forecast scenarios.

\- No dealer order or routing area create/edit flows.

\- No new `/deals/\[id]` route.

\- No global search expansion.

\- No CSV product UI, download buttons, upload forms, mapping wizard, file storage, or background import/export jobs.

\- No database writes from CSV import examples, export preflight summaries, import preview, preflight diagnostics, catalogs, or issue summaries.

\- No bulk create/update or import apply flow.

\- No routing reassignment, external enrichment, Salesforce integration, or CSV-connected sync.

\*\*Sprint 9 — CSV Preview Readiness\*\*

Goal: turn the server-side CSV handoff contracts into read-only operator previews without adding UI, persistence workflows, or integrations.

| Feature | Owner | Status | Acceptance summary |
|---|---|---|---|
| S9-F1 — CSV import readiness plans | Codex | done | CSV import preflight exposes deterministic row readiness classifications and aggregate counts for supported preview entities, derived from existing validation and diagnostics. No database writes, import apply flow, routing execution, product UI, file storage, or external services are added. |
| S9-F2 — CSV export preview snippets | Codex | done | CSV export support exposes bounded read-only preview rows and optional CSV snippets for supported export entities, using existing column definitions, limits, and deterministic ordering. No routes, buttons, file storage, background jobs, or export writes are added. |

\*\*Sprint 9 non-goals\*\* (carry forward permanent scope boundaries plus CSV-specific exclusions):

\- No authentication, permissions, or multi-tenancy.

\- No deployment configuration.

\- No external AI provider integration.

\- No geocoding or territory polygons.

\- No default switch from SQLite to Postgres.

\- No persistent forecast scenarios.

\- No dealer order or routing area create/edit flows.

\- No new `/deals/\[id]` route.

\- No global search expansion.

\- No CSV product UI, download buttons, upload forms, mapping wizard, file storage, or background import/export jobs.

\- No database writes from CSV import readiness plans, export preview snippets, import preview, preflight diagnostics, catalogs, issue summaries, examples, or preflight summaries.

\- No bulk create/update or import apply flow.

\- No routing execution, routing reassignment, external enrichment, Salesforce integration, or CSV-connected sync.

\*\*Sprint 10 — CSV Operator Handoff Contracts\*\*

Goal: finish read-only server-side CSV handoff metadata so later UI work can present import actions and preview capabilities without reinterpreting lower-level arrays.

| Feature | Owner | Status | Acceptance summary |
|---|---|---|---|
| S10-F1 — CSV import action manifests | Codex | done | CSV import preflight exposes deterministic row action metadata and aggregate action counts for supported preview entities, derived from existing validation, readiness, and diagnostics. No database writes, import apply flow, create/update/upsert/merge logic, routing execution, product UI, file storage, or external services are added. |
| S10-F2 — CSV preview capability metadata | Codex | done | The CSV capability catalog reflects the current read-only preview surface, including import readiness/preflight and export preview/snippet availability, default/max limits where applicable, content types, filenames, and explicit no-write safety flags for later UI consumption. No routes, buttons, file storage, background jobs, CSV writes, or integrations are added. |

\*\*Sprint 10 non-goals\*\* (carry forward permanent scope boundaries plus CSV-specific exclusions):

\- No authentication, permissions, or multi-tenancy.

\- No deployment configuration.

\- No external AI provider integration.

\- No geocoding or territory polygons.

\- No default switch from SQLite to Postgres.

\- No persistent forecast scenarios.

\- No dealer order or routing area create/edit flows.

\- No new `/deals/\[id]` route.

\- No global search expansion.

\- No CSV product UI, download buttons, upload forms, mapping wizard, file storage, or background import/export jobs.

\- No database writes from CSV import action manifests, preview capability metadata, export preview snippets, import preview, preflight diagnostics, catalogs, issue summaries, examples, or preflight summaries.

\- No bulk create/update, import apply flow, contact or lead upsert, duplicate merge, or routing execution.

\- No routing reassignment, external enrichment, Salesforce integration, or CSV-connected sync.

\*\*Sprint 11 — CSV Review Bundles\*\*

Goal: package the existing read-only CSV contracts into deterministic server-side review bundles for later UI consumption without adding routes, persistence workflows, or integrations.

| Feature | Owner | Status | Acceptance summary |
|---|---|---|---|
| S11-F1 — CSV import review bundles | Codex | done | Server-side import review bundles combine template metadata, preview/preflight output, issue summaries, readiness counts, action counts, and a bounded row sample for supported import preview entities. No database writes, import apply flow, product UI, routes, file storage, routing execution, or external services are added. |
| S11-F2 — CSV export review bundles | Codex | done | Server-side export review bundles combine capability metadata, preflight row counts, limits, canonical headers, preview rows, optional CSV snippets, and deterministic empty/limit notes for supported export entities. No routes, buttons, file storage, background jobs, export writes, saved history, or integrations are added. |

\*\*Sprint 11 non-goals\*\* (carry forward permanent scope boundaries plus CSV-specific exclusions):

\- No authentication, permissions, or multi-tenancy.

\- No deployment configuration.

\- No external AI provider integration.

\- No geocoding or territory polygons.

\- No default switch from SQLite to Postgres.

\- No persistent forecast scenarios.

\- No dealer order or routing area create/edit flows.

\- No new `/deals/\[id]` route.

\- No global search expansion.

\- No CSV product UI, upload forms, download buttons, mapping wizard, route handlers, file storage, or background import/export jobs.

\- No database writes from CSV import/export review bundles, action manifests, preview capability metadata, export preview snippets, import preview, preflight diagnostics, catalogs, issue summaries, examples, or preflight summaries.

\- No bulk create/update, import apply flow, contact or lead upsert, duplicate merge, export write history, scheduled export delivery, or routing execution.

\- No routing reassignment, external enrichment, Salesforce integration, or CSV-connected sync.


\*\*Sprint 12 — CSV Transfer Packets\*\*

Goal: turn the read-only CSV review layer into deterministic server-side transfer packets for later UI wiring without adding routes, persistence workflows, or integrations.

| Feature | Owner | Status | Acceptance summary |
|---|---|---|---|
| S12-F1 — CSV export delivery packets | Codex | done | Server-side helpers produce deterministic export packets for supported export entities, combining filename, content type, generated CSV, row counts, applied limits, review notes, and explicit no-write flags. No routes, buttons, file storage, export history, scheduled delivery, background jobs, or integrations are added. |
| S12-F2 — CSV import dry-run receipts | Codex | done | Server-side helpers produce deterministic import dry-run receipts for supported import preview entities, combining source metadata, review bundle output, issue/readiness/action summaries, bounded samples, and explicit no-write safety metadata. No database writes, import apply flow, product UI, routes, file storage, routing execution, or external services are added. |

\*\*Sprint 12 non-goals\*\* (carry forward permanent scope boundaries plus CSV-specific exclusions):

\- No authentication, permissions, or multi-tenancy.

\- No deployment configuration.

\- No external AI provider integration.

\- No geocoding or territory polygons.

\- No default switch from SQLite to Postgres.

\- No persistent forecast scenarios.

\- No dealer order or routing area create/edit flows.

\- No new `/deals/\[id]` route.

\- No global search expansion.

\- No CSV product UI, upload forms, download buttons, mapping wizard, route handlers, file storage, or background import/export jobs.

\- No database writes from CSV import dry-run receipts, export delivery packets, review bundles, action manifests, preview capability metadata, export preview snippets, import preview, preflight diagnostics, catalogs, issue summaries, examples, or preflight summaries.

\- No bulk create/update, import apply flow, contact or lead upsert, duplicate merge, export write history, scheduled export delivery, or routing execution.

\- No routing reassignment, external enrichment, Salesforce integration, or CSV-connected sync.


\*\*Sprint 13 — CSV Handoff Assurance\*\*

Goal: tighten the read-only CSV handoff layer with deterministic transfer manifests and compatibility reports for later UI consumption without adding routes, persistence workflows, or integrations.

| Feature | Owner | Status | Acceptance summary |
|---|---|---|---|
| S13-F1 — CSV transfer manifest catalog | Codex | done | Server-side helpers publish deterministic transfer manifests for supported CSV export delivery and import dry-run receipt surfaces, including entity ids, operations, content types, filenames, limits, source/input metadata, and explicit read/no-write flags. No routes, product UI, database writes, file storage, background jobs, export history, or integrations are added. |
| S13-F2 — CSV compatibility reports | Codex | done | Server-side helpers publish deterministic read-only compatibility reports comparing export columns, import templates/examples, preview support, required fields, and transfer manifest coverage for overlapping entities, with warnings for one-way fields or unsupported directions. No supported-entity expansion, header remapping wizard, user-upload parsing, database writes, import apply flow, routing execution, or Salesforce sync is added. |

\*\*Sprint 13 non-goals\*\* (carry forward permanent scope boundaries plus CSV-specific exclusions):

\- No authentication, permissions, or multi-tenancy.

\- No deployment configuration.

\- No external AI provider integration.

\- No geocoding or territory polygons.

\- No default switch from SQLite to Postgres.

\- No persistent forecast scenarios.

\- No dealer order or routing area create/edit flows.

\- No new `/deals/\[id]` route.

\- No global search expansion.

\- No CSV product UI, upload forms, download buttons, mapping wizard, route handlers, file storage, or background import/export jobs.

\- No database writes from CSV transfer manifests, compatibility reports, import dry-run receipts, export delivery packets, review bundles, action manifests, preview capability metadata, export preview snippets, import preview, preflight diagnostics, catalogs, issue summaries, examples, or preflight summaries.

\- No bulk create/update, import apply flow, contact or lead upsert, duplicate merge, export write history, scheduled export delivery, or routing execution.

\- No routing reassignment, external enrichment, Salesforce integration, or CSV-connected sync.



\*\*Sprint 14 — CSV Handoff Index\*\*

Goal: consolidate the existing read-only CSV handoff contracts into deterministic server-side indexes and coverage summaries for later UI consumption without adding routes, persistence workflows, or integrations.

| Feature | Owner | Status | Acceptance summary |
|---|---|---|---|
| S14-F1 — CSV handoff index | Codex | done | Server-side helpers publish a deterministic handoff index tying existing CSV capabilities, transfer manifests, compatibility reports, templates/examples, packet surfaces, and explicit no-write flags into one later-UI-ready catalog. No routes, product UI, upload/download actions, file storage, background jobs, entity expansion, database writes, or integrations are added. |
| S14-F2 — CSV field coverage summaries | Codex | done | Server-side helpers publish deterministic per-entity and per-operation coverage summaries showing export-only, import-only, shared, required, optional, unsupported, and warning counts from the existing CSV contracts. No header remapping wizard, user-upload parsing, import apply flow, database writes, routing execution, supported-entity expansion, or Salesforce sync is added. |

\*\*Sprint 14 non-goals\*\* (carry forward permanent scope boundaries plus CSV-specific exclusions):

\- No authentication, permissions, or multi-tenancy.

\- No deployment configuration.

\- No external AI provider integration.

\- No geocoding or territory polygons.

\- No default switch from SQLite to Postgres.

\- No persistent forecast scenarios.

\- No dealer order or routing area create/edit flows.

\- No new `/deals/\[id]` route.

\- No global search expansion.

\- No CSV product UI, upload forms, download buttons, mapping wizard, route handlers, file storage, or background import/export jobs.

\- No database writes from CSV handoff indexes, field coverage summaries, transfer manifests, compatibility reports, import dry-run receipts, export delivery packets, review bundles, action manifests, preview capability metadata, export preview snippets, import preview, preflight diagnostics, catalogs, issue summaries, examples, or preflight summaries.

\- No bulk create/update, import apply flow, contact or lead upsert, duplicate merge, export write history, scheduled export delivery, or routing execution.

\- No routing reassignment, external enrichment, Salesforce integration, or CSV-connected sync.


\*\*Sprint 15 — CSV Operator Assurance\*\*

Goal: turn the existing read-only CSV handoff metadata into deterministic server-side readiness and QA signals for later UI consumption without adding routes, persistence workflows, or integrations.

| Feature | Owner | Status | Acceptance summary |
|---|---|---|---|
| S15-F1 — CSV operator readiness scorecards | Codex | done | Server-side helpers publish deterministic readiness scorecards per existing CSV entity and operation by combining the handoff index and field coverage summaries into statuses, counts, warning codes, and explicit no-write flags for later UI. No CSV product UI, upload/download routes, file storage, background jobs, import apply flow, database writes, header remapping, supported-entity expansion, routing execution, or Salesforce sync is added. |
| S15-F2 — CSV contract QA checks | Codex | done | Server-side helpers publish deterministic QA checks across existing CSV contracts, flagging inconsistent headers, missing handoff surfaces, unsupported operation gaps, and read/no-write flag drift without reinterpreting UI state. No routes, product UI, package/config changes, CI changes, file storage, background jobs, database writes, import apply flow, routing execution, or integrations are added. |

\*\*Sprint 15 non-goals\*\* (carry forward permanent scope boundaries plus CSV-specific exclusions):

\- No authentication, permissions, or multi-tenancy.

\- No deployment configuration.

\- No external AI provider integration.

\- No geocoding or territory polygons.

\- No default switch from SQLite to Postgres.

\- No persistent forecast scenarios.

\- No dealer order or routing area create/edit flows.

\- No new `/deals/\[id]` route.

\- No global search expansion.

\- No CSV product UI, upload forms, download buttons, mapping wizard, route handlers, file storage, or background import/export jobs.

\- No database writes from CSV operator readiness scorecards, contract QA checks, handoff indexes, field coverage summaries, transfer manifests, compatibility reports, import dry-run receipts, export delivery packets, review bundles, action manifests, preview capability metadata, export preview snippets, import preview, preflight diagnostics, catalogs, issue summaries, examples, or preflight summaries.

\- No bulk create/update, import apply flow, contact or lead upsert, duplicate merge, export write history, scheduled export delivery, header remapping, or routing execution.

\- No supported-entity expansion, routing reassignment, external enrichment, Salesforce integration, CSV-connected sync, package/config changes, or CI changes.


\*\*Sprint 16 — CSV Operator Runbooks\*\*

Goal: package the read-only CSV assurance layer into deterministic operator guidance and snapshot metadata for later UI handoff without adding routes, writes, or integrations.

| Feature | Owner | Status | Acceptance summary |
|---|---|---|---|
| S16-F1 — CSV operator remediation runbooks | Codex | done | Server-side helpers publish deterministic remediation runbooks from existing CSV operator readiness scorecards and contract QA checks, grouped by entity and operation with severity, explanation, next-action metadata, source content types, and explicit no-write flags. No CSV product UI, upload/download routes, file storage, background jobs, import apply flow, database writes, header remapping, supported-entity expansion, routing execution, persistent history, external AI, Salesforce sync, package/config changes, or CI changes are added. |
| S16-F2 — CSV contract drift snapshots | Codex | done | Server-side helpers publish deterministic snapshot metadata over existing CSV contracts, including stable source fingerprints, status/issue/readiness rollups, source content types, and explicit read/no-write flags for later handoff review. No persistent baselines or comparison storage, routes, product UI, package/config changes, CI changes, file storage, background jobs, database writes, import apply flow, routing execution, or integrations are added. |

\*\*Sprint 16 non-goals\*\* (carry forward permanent scope boundaries plus CSV-specific exclusions):

\- No authentication, permissions, or multi-tenancy.

\- No deployment configuration.

\- No external AI provider integration.

\- No geocoding or territory polygons.

\- No default switch from SQLite to Postgres.

\- No persistent forecast scenarios.

\- No dealer order or routing area create/edit flows.

\- No new `/deals/\[id]` route.

\- No global search expansion.

\- No CSV product UI, upload forms, download buttons, mapping wizard, route handlers, file storage, or background import/export jobs.

\- No database writes from CSV operator remediation runbooks, contract drift snapshots, contract QA checks, operator readiness scorecards, handoff indexes, field coverage summaries, transfer manifests, compatibility reports, import dry-run receipts, export delivery packets, review bundles, action manifests, preview capability metadata, export preview snippets, import preview, preflight diagnostics, catalogs, issue summaries, examples, or preflight summaries.

\- No bulk create/update, import apply flow, contact or lead upsert, duplicate merge, export write history, scheduled export delivery, header remapping, or routing execution.

\- No supported-entity expansion, persistent snapshot or baseline storage, routing reassignment, external enrichment, Salesforce integration, CSV-connected sync, package/config changes, or CI changes.


\*\*Sprint 17 — CSV Handoff Closure\*\*

Goal: package the existing read-only CSV readiness surface into deterministic handoff packets and release digests for later UI or docs consumption without adding routes, writes, storage, or integrations.

| Feature | Owner | Status | Acceptance summary |
|---|---|---|---|
| S17-F1 — CSV operator handoff packets | Codex | done | Server-side helpers publish deterministic per-entity and per-operation handoff packets that combine current CSV capabilities, handoff index, readiness scorecards, remediation runbooks, drift snapshots, source content types, and explicit no-write flags. No routes, product UI, upload/download actions, file storage, database writes, entity expansion, persistent history, package/config changes, CI changes, or integrations are added. |
| S17-F2 — CSV contract release digest | Codex | done | Server-side helpers publish a deterministic current-state digest over the CSV handoff surface, summarizing supported operations, stable/watch/blocked counts, source fingerprint rollups, warning codes, and release-note-ready metadata for later UI or docs consumption. No persistent baselines or comparison storage, routes, product UI, file storage, database writes, package/config changes, CI changes, or integrations are added. |

\*\*Sprint 17 non-goals\*\* (carry forward permanent scope boundaries plus CSV-specific exclusions):

\- No authentication, permissions, or multi-tenancy.

\- No deployment configuration.

\- No external AI provider integration.

\- No geocoding or territory polygons.

\- No default switch from SQLite to Postgres.

\- No persistent forecast scenarios.

\- No dealer order or routing area create/edit flows.

\- No new `/deals/\[id]` route.

\- No global search expansion.

\- No CSV product UI, upload forms, download buttons, mapping wizard, route handlers, file storage, or background import/export jobs.

\- No database writes from CSV operator handoff packets, contract release digests, contract drift snapshots, operator remediation runbooks, contract QA checks, operator readiness scorecards, handoff indexes, field coverage summaries, transfer manifests, compatibility reports, import dry-run receipts, export delivery packets, review bundles, action manifests, preview capability metadata, export preview snippets, import preview, preflight diagnostics, catalogs, issue summaries, examples, or preflight summaries.

\- No bulk create/update, import apply flow, contact or lead upsert, duplicate merge, export write history, scheduled export delivery, header remapping, or routing execution.

\- No supported-entity expansion, persistent CSV snapshot/baseline/history storage, routing reassignment, external enrichment, Salesforce integration, CSV-connected sync, package/config changes, or CI changes.


\*\*Sprint 18 — CSV Handoff Verification\*\*

Goal: add deterministic read-only verification and fixture metadata for the existing CSV handoff surface so later UI, docs, and tests can consume current import/export contracts without adding routes, writes, storage, or integrations.

| Feature | Owner | Status | Acceptance summary |
|---|---|---|---|
| S18-F1 — CSV release verification manifests | Codex | done | Server-side helpers publish deterministic verification manifests over the current CSV release digest and handoff packets, including source fingerprints, source content types, operation/entity coverage, warning/source-code rollups, and explicit no-write flags. No routes, product UI, upload/download actions, file storage, database writes, persistent baselines, package/config changes, CI changes, or integrations are added. |
| S18-F2 — CSV operator fixture bundles | Codex | done | Server-side helpers publish deterministic bounded fixture bundles for later UI/docs/test consumption, combining existing export delivery packet snippets, import dry-run receipt samples, handoff packet summaries, and release digest metadata per supported entity/operation. No routes, product UI, upload/download actions, file storage, user-upload parsing, import apply flow, database writes, or integrations are added. |

\*\*Sprint 18 non-goals\*\* (carry forward permanent scope boundaries plus CSV-specific exclusions):

\- No authentication, permissions, or multi-tenancy.

\- No deployment configuration.

\- No external AI provider integration.

\- No geocoding or territory polygons.

\- No default switch from SQLite to Postgres.

\- No persistent forecast scenarios.

\- No dealer order or routing area create/edit flows.

\- No new `/deals/\[id]` route.

\- No global search expansion.

\- No CSV product UI, upload forms, download buttons, mapping wizard, route handlers, file storage, or background import/export jobs.

\- No database writes from CSV release verification manifests, operator fixture bundles, operator handoff packets, contract release digests, contract drift snapshots, operator remediation runbooks, contract QA checks, operator readiness scorecards, handoff indexes, field coverage summaries, transfer manifests, compatibility reports, import dry-run receipts, export delivery packets, review bundles, action manifests, preview capability metadata, export preview snippets, import preview, preflight diagnostics, catalogs, issue summaries, examples, or preflight summaries.

\- No bulk create/update, import apply flow, contact or lead upsert, duplicate merge, export write history, scheduled export delivery, header remapping, user-upload parsing, or routing execution.

\- No supported-entity expansion, persistent CSV verification/fixture/snapshot/baseline/history storage, routing reassignment, external enrichment, Salesforce integration, CSV-connected sync, package/config changes, or CI changes.


\*\*Sprint 19 — CSV Handoff Publication\*\*

Goal: package the existing read-only CSV handoff verification surface into deterministic publication and acceptance metadata for later UI, docs, and tests without adding routes, writes, storage, or integrations.

| Feature | Owner | Status | Acceptance summary |
|---|---|---|---|
| S19-F1 — CSV handoff release notes packet | Codex | done | Server-side helpers publish a deterministic release-note packet from the current CSV release verification manifest, release digest, and operator fixture bundle, including status, source fingerprints, supported operation counts, fixture availability, warning/source-code rollups, and explicit no-write flags for later UI/docs consumption. No product UI, routes, upload/download actions, file storage, persistent history, package/config changes, CI changes, Salesforce sync, or external services are added. |
| S19-F2 — CSV operator acceptance checklists | Codex | done | Server-side helpers publish deterministic operator acceptance checklists per CSV entity and operation by combining release verification manifests, fixture bundle availability, readiness/remediation status, and QA warnings into pass/watch/block checklist items with aggregate counts. No product UI, routes, upload/download actions, file storage, persistent baselines, database writes, import apply flow, header remapping, user-upload parsing, supported-entity expansion, or integrations are added. |

\*\*Sprint 19 non-goals\*\* (carry forward permanent scope boundaries plus CSV-specific exclusions):

\- No authentication, permissions, or multi-tenancy.

\- No deployment configuration.

\- No external AI provider integration.

\- No geocoding or territory polygons.

\- No default switch from SQLite to Postgres.

\- No persistent forecast scenarios.

\- No dealer order or routing area create/edit flows.

\- No new `/deals/\[id]` route.

\- No global search expansion.

\- No CSV product UI, upload forms, download buttons, mapping wizard, route handlers, file storage, or background import/export jobs.

\- No database writes from CSV handoff release notes packets, operator acceptance checklists, release verification manifests, operator fixture bundles, operator handoff packets, contract release digests, contract drift snapshots, operator remediation runbooks, contract QA checks, operator readiness scorecards, handoff indexes, field coverage summaries, transfer manifests, compatibility reports, import dry-run receipts, export delivery packets, review bundles, action manifests, preview capability metadata, export preview snippets, import preview, preflight diagnostics, catalogs, issue summaries, examples, or preflight summaries.

\- No bulk create/update, import apply flow, contact or lead upsert, duplicate merge, export write history, scheduled export delivery, header remapping, user-upload parsing, or routing execution.

\- No supported-entity expansion, persistent CSV release-note/acceptance/verification/fixture/snapshot/baseline/history storage, routing reassignment, external enrichment, Salesforce integration, CSV-connected sync, package/config changes, or CI changes.


\*\*Sprint 20 — CSV Operator Release Readiness\*\*

Goal: turn the existing read-only CSV publication and acceptance metadata into deterministic operator workflow and closure summaries for later UI, docs, and tests without adding routes, writes, storage, or integrations.

| Feature | Owner | Status | Acceptance summary |
|---|---|---|---|
| S20-F1 — CSV operator walkthrough manifests | Codex | done | Server-side helpers publish deterministic ordered walkthrough manifests for each supported CSV operation by composing existing capability, template/example, dry-run/export packet, fixture, release-note, and acceptance-checklist surfaces. The output includes source fingerprints, step labels, blocking/watch notes, and explicit no-write flags for later UI/docs/tests. No product UI, routes, upload/download actions, file storage, background jobs, import apply flow, user-upload parsing, header remapping, database writes, persistence, supported-entity expansion, Salesforce sync, external services, package/config changes, or CI changes are added. |
| S20-F2 — CSV release closure scorecards | Codex | done | Server-side helpers aggregate S19 release notes and acceptance checklists into per-entity and per-operation closure statuses with ready/watch/block counts, release-note anchors, fixture coverage, and no-write safety metadata. The surface is deterministic and read-only. No product UI, routes, upload/download actions, file storage, persistent baselines/history, database writes, import apply flow, routing execution, supported-entity expansion, Salesforce sync, external services, package/config changes, or CI changes are added. |

\*\*Sprint 20 non-goals\*\* (carry forward permanent scope boundaries plus CSV-specific exclusions):

\- No authentication, permissions, or multi-tenancy.

\- No deployment configuration.

\- No external AI provider integration.

\- No geocoding or territory polygons.

\- No default switch from SQLite to Postgres.

\- No persistent forecast scenarios.

\- No dealer order or routing area create/edit flows.

\- No new `/deals/\[id]` route.

\- No global search expansion.

\- No CSV product UI, upload forms, download buttons, mapping wizard, route handlers, file storage, or background import/export jobs.

\- No database writes from CSV operator walkthrough manifests, release closure scorecards, handoff release notes packets, operator acceptance checklists, release verification manifests, operator fixture bundles, operator handoff packets, contract release digests, contract drift snapshots, operator remediation runbooks, contract QA checks, operator readiness scorecards, handoff indexes, field coverage summaries, transfer manifests, compatibility reports, import dry-run receipts, export delivery packets, review bundles, action manifests, preview capability metadata, export preview snippets, import preview, preflight diagnostics, catalogs, issue summaries, examples, or preflight summaries.

\- No bulk create/update, import apply flow, contact or lead upsert, duplicate merge, export write history, scheduled export delivery, header remapping, user-upload parsing, or routing execution.

\- No supported-entity expansion, persistent CSV release-note/acceptance/verification/fixture/snapshot/baseline/history/walkthrough/scorecard storage, routing reassignment, external enrichment, Salesforce integration, CSV-connected sync, package/config changes, or CI changes.


\*\*Sprint 21 — CSV Release Handoff\*\*

Goal: package the existing read-only CSV release readiness surface into deterministic handoff and exception metadata for later UI, docs, and tests without adding routes, writes, storage, or integrations.

| Feature | Owner | Status | Acceptance summary |
|---|---|---|---|
| S21-F1 — CSV release handoff catalog | Codex | done | Server-side helpers publish a deterministic release handoff catalog that indexes the existing S20 walkthrough manifests and release closure scorecards by entity and operation, with source fingerprints, status rollups, and explicit read/no-write flags. The surface is later-UI/docs/test ready but does not add routes or runtime workflow behavior. |
| S21-F2 — CSV release exception register | Codex | done | Server-side helpers publish deterministic read-only exception registers for watch/block CSV release items by composing closure scorecards, acceptance checklists, fixture coverage, and walkthrough notes into ordered remediation-ready entries. Output includes counts, severity, source anchors, and no-write safety metadata without changing import/export behavior. |

\*\*Sprint 21 non-goals\*\* (carry forward permanent scope boundaries plus CSV-specific exclusions):

\- No authentication, permissions, or multi-tenancy.

\- No deployment configuration.

\- No external AI provider integration.

\- No geocoding or territory polygons.

\- No default switch from SQLite to Postgres.

\- No persistent forecast scenarios.

\- No dealer order or routing area create/edit flows.

\- No new `/deals/\[id]` route.

\- No global search expansion.

\- No CSV product UI, upload/download buttons, route handlers, file storage, or background import/export jobs.

\- No database writes from CSV release handoff catalogs, release exception registers, operator walkthrough manifests, release closure scorecards, handoff release notes packets, operator acceptance checklists, release verification manifests, operator fixture bundles, operator handoff packets, contract release digests, contract drift snapshots, operator remediation runbooks, contract QA checks, operator readiness scorecards, handoff indexes, field coverage summaries, transfer manifests, compatibility reports, import dry-run receipts, export delivery packets, review bundles, action manifests, preview capability metadata, export preview snippets, import preview, preflight diagnostics, catalogs, issue summaries, examples, or preflight summaries.

\- No bulk create/update, import apply flow, contact or lead upsert, duplicate merge, export write history, scheduled export delivery, header remapping, user-upload parsing, or routing execution.

\- No supported-entity expansion, persistent CSV handoff/exception/release-note/acceptance/verification/fixture/snapshot/baseline/history/walkthrough/scorecard storage, routing reassignment, external enrichment, Salesforce integration, CSV-connected sync, package/config changes, or CI changes.


\*\*Sprint 22 — CSV Release Disposition\*\*

Goal: convert the read-only CSV release handoff surface into deterministic disposition and readiness packets for later UI, docs, and tests without adding routes, writes, storage, or integrations.

| Feature | Owner | Status | Acceptance summary |
|---|---|---|---|
| S22-F1 — CSV release disposition manifests | Codex | done | Server-side helpers compose the S21 release handoff catalog and exception register into deterministic per-entity and per-operation dispositions with ready/watch/block counts, source fingerprints, trace anchors, and explicit read/no-write flags. The surface is later-UI/docs/test ready but does not add routes, persistence, or runtime workflow behavior. |
| S22-F2 — CSV release readiness packets | Codex | done | Server-side helpers publish bounded release readiness packets that combine disposition manifests with the existing release digest, verification manifests, closure scorecards, and exception metadata into release-consumer summaries with pass/watch/block totals and remediation anchors. Output remains deterministic and read-only without adding approval workflows or CSV product UI. |

\*\*Sprint 22 non-goals\*\* (carry forward permanent scope boundaries plus CSV-specific exclusions):

\- No authentication, permissions, or multi-tenancy.

\- No deployment configuration.

\- No external AI provider integration.

\- No geocoding or territory polygons.

\- No default switch from SQLite to Postgres.

\- No persistent forecast scenarios.

\- No dealer order or routing area create/edit flows.

\- No new `/deals/\[id]` route.

\- No global search expansion.

\- No CSV product UI, upload/download buttons, route handlers, file storage, or background import/export jobs.

\- No database writes from CSV release disposition manifests, release readiness packets, release handoff catalogs, release exception registers, operator walkthrough manifests, release closure scorecards, handoff release notes packets, operator acceptance checklists, release verification manifests, operator fixture bundles, operator handoff packets, contract release digests, contract drift snapshots, operator remediation runbooks, contract QA checks, operator readiness scorecards, handoff indexes, field coverage summaries, transfer manifests, compatibility reports, import dry-run receipts, export delivery packets, review bundles, action manifests, preview capability metadata, export preview snippets, import preview, preflight diagnostics, catalogs, issue summaries, examples, or preflight summaries.

\- No bulk create/update, import apply flow, contact or lead upsert, duplicate merge, export write history, scheduled export delivery, header remapping, user-upload parsing, or routing execution.

\- No supported-entity expansion, persistent CSV disposition/readiness/handoff/exception/release-note/acceptance/verification/fixture/snapshot/baseline/history/walkthrough/scorecard storage, approval workflow, routing reassignment, external enrichment, Salesforce integration, CSV-connected sync, package/config changes, or CI changes.


\*\*Sprint 23 — CSV Duplicate Readiness\*\*

Goal: add read-only CSV duplicate review contracts so later import UI can explain duplicate risk without adding writes, storage, routes, or integrations.

| Feature | Owner | Status | Acceptance summary |
|---|---|---|---|
| S23-F1 — CSV dedupe candidate packets | Codex | done | Server-side helpers publish deterministic duplicate-candidate packets for supported CSV import preview entities with row anchors, matched record anchors, reason codes, severity, aggregate counts, and explicit read/no-write flags. The surface does not add routes, UI, merge/upsert behavior, or database writes. |
| S23-F2 — CSV dedupe review bundles | Codex | done | Server-side helpers combine dedupe candidate packets with existing import review, dry-run, readiness, and action metadata into bounded operator review bundles with safe/watch/block summaries. Output remains deterministic and read-only without adding import apply flows, duplicate merge, file storage, or CSV product UI. |

\*\*Sprint 23 non-goals\*\* (carry forward permanent scope boundaries plus CSV-specific exclusions):

\- No authentication, permissions, or multi-tenancy.

\- No deployment configuration.

\- No external AI provider integration.

\- No geocoding or territory polygons.

\- No default switch from SQLite to Postgres.

\- No persistent forecast scenarios.

\- No dealer order or routing area create/edit flows.

\- No new live `/deals/\[id]` detail route.

\- No global search expansion.

\- No CSV product UI, upload/download buttons, route handlers, file storage, or background import/export jobs.

\- No database writes from CSV dedupe candidate packets, CSV dedupe review bundles, or existing CSV import/export/release helpers.

\- No bulk create/update, import apply flow, contact or lead upsert, duplicate merge, header remapping, user-upload parsing, routing execution, or approval workflow.

\- No supported-entity expansion, persistent CSV dedupe/release/import/export history storage, routing reassignment, external enrichment, Salesforce integration, CSV-connected sync, package/config changes, or CI changes.


\*\*Sprint 24 — CSV Operator UI\*\*

Goal: graduate the existing read-only CSV helper contracts into narrow operator UI surfaces without adding persistence workflows, integrations, or background jobs.

| Feature | Owner | Status | Acceptance summary |
|---|---|---|---|
| S24-F1 — CSV export operator UI | Codex | done | Add a read-only export review/download surface that consumes existing server CSV export packets for supported entities. It must use deterministic helper output, current route/layout patterns, and no background delivery or history storage. |
| S24-F2 — CSV import preview UI | Codex | done | Add an upload/paste preview surface that calls existing import preview, preflight, readiness, action, and dedupe review helpers and displays row-level safe/watch/block results without mutating the database. |

\*\*Sprint 24 non-goals\*\* (carry forward permanent scope boundaries plus CSV-specific exclusions):

\- No authentication, permissions, or multi-tenancy.

\- No deployment configuration.

\- No external AI provider integration.

\- No geocoding or territory polygons.

\- No default switch from SQLite to Postgres.

\- No persistent forecast scenarios.

\- No dealer order or routing area create/edit flows.

\- No new live `/deals/\[id]` detail route.

\- No global search expansion.

\- No import apply flow, bulk create/update, contact or lead upsert, duplicate merge, routing execution, or approval workflow.

\- No scheduled export delivery, export write history, user-upload persistence, file storage, mapping wizard, or background import/export jobs.

\- No supported-entity expansion, persistent CSV release/import/export history storage, routing reassignment, external enrichment, Salesforce integration, CSV-connected sync, package/config changes, or CI changes.


\*\*Sprint 25 — CRM Safety Foundations\*\*

Goal: add narrow deterministic foundations for auditability and shared filtering so later CRM productivity work can remain testable and contract-aligned.

| Feature | Owner | Status | Acceptance summary |
|---|---|---|---|
| S25-F1 — Audit event model foundation | Codex | done | Add a first-class audit event model and TypeScript taxonomy for user, record, AI, import, routing, and workflow actions. Provide deterministic record/query helpers with focused tests while avoiding auth, permissions, external telemetry, background processing, and broad mutation rewiring. |
| S25-F2 — Filter/query compiler foundation | Codex | done | Add a shared filter AST and Prisma compiler for the current supported list-filter surface, with parity tests proving representative list/query behavior remains stable. The foundation must be reusable by lists, reports, and exports without adding natural-language filters, saved views, report-builder UI, or search expansion. |

\*\*Sprint 25 non-goals\*\* (carry forward permanent scope boundaries plus sprint-specific exclusions):

\- No authentication, permissions, or multi-tenancy.

\- No deployment configuration.

\- No external AI provider integration.

\- No geocoding or territory polygons.

\- No default switch from SQLite to Postgres.

\- No persistent forecast scenarios.

\- No dealer order or routing area create/edit flows.

\- No new live `/deals/\[id]` detail route.

\- No global search expansion.

\- No audit UI, audit reporting dashboard, external telemetry sink, request-log pipeline, or background audit processing.

\- No attempt to retrofit every existing server mutation in one pass; audit helper adoption must stay bounded to the feature acceptance.

\- No natural-language filter generation, saved views, report builder, dashboard builder, bulk actions, or dedicated `/search` page.

\- No CSV import apply flow, bulk create/update, contact or lead upsert, duplicate merge, routing execution, file storage, or Salesforce integration.


\*\*Sprint 26 — CRM Productivity Foundations\*\*

Goal: build on the audit and filter foundations with bounded operator productivity contracts while preserving current route, auth, search, and routing guardrails.

| Feature | Owner | Status | Acceptance summary |
|---|---|---|---|
| S26-F1 — Bulk action dry-run contracts | Codex | done | Add deterministic server-side dry-run planning for selected-record actions such as status/stage updates, assignment eligibility, task creation eligibility, and selected export eligibility. It must return eligible/blocked counts and audit metadata without mutating records, adding routes, or creating an approval workflow. |
| S26-F2 — Audit adoption for core mutations | Codex | done | Use the Sprint 25 audit helpers in a bounded set of existing core CRM mutations such as create/update/status/stage/complete/resolve flows. Tests must prove deterministic audit rows are written without changing user-facing behavior, request logging, routing behavior, or external telemetry. |
| S26-F3 — Saved list views foundation | Codex | deferred | Add a local saved-view model and helpers for supported CRM list pages, persisting filters, sort, and column metadata for the single-user local workflow. Current lists must keep working without saved views, and implementation must update the contract/schema documentation when the model is added. Deferred during Sprint 27 rollover because current LOOP selection forbids the required contract/schema-documentation change. |

\*\*Sprint 26 non-goals\*\* (carry forward permanent scope boundaries plus sprint-specific exclusions):

\- No authentication, permissions, or multi-tenancy.

\- No deployment configuration.

\- No external AI provider integration.

\- No geocoding or territory polygons.

\- No default switch from SQLite to Postgres.

\- No persistent forecast scenarios.

\- No dealer order or routing area create/edit flows.

\- No new live `/deals/\[id]` detail route.

\- No global search expansion.

\- No CSV import apply flow, CSV bulk create/update, contact or lead upsert, duplicate merge, file storage, or Salesforce integration.

\- No actual bulk mutation execution; S26-F1 is dry-run/planning only until a later prompt explicitly promotes apply behavior.

\- No auth-backed user/tenant permission model or sharing layer for saved views; saved-view scope remains single-user local.

\- No natural-language filters, report builder, dashboard builder, dedicated `/search` page, or command-palette expansion.

\- No routing engine changes, pacing-engine changes, routing simulator, routing reassignment, or dealer capacity rules.

\- No audit UI, audit reporting dashboard, external telemetry sink, request-log pipeline, or background audit processing.


\*\*Sprint 27 — Productivity Handoff Contracts\*\*

Goal: package the Sprint 25 and Sprint 26 productivity foundations into read-only handoff contracts without adding persistence workflows, routes, UI, or contract-changing schema.

| Feature | Owner | Status | Acceptance summary |
|---|---|---|---|
| S27-F1 — Bulk action dry-run review packets | Codex | done | Build deterministic server-side review packets around the existing bulk action dry-run output, including action/entity metadata, eligible and blocked rollups, representative reasons, and audit-planning metadata for later UI consumption. The packets must not execute mutations, add routes, create approval workflows, or alter existing dry-run behavior. |
| S27-F2 — Audit coverage manifests | Codex | done | Publish deterministic read-only manifests over the existing audit event taxonomy and audited core CRM mutations, grouping coverage by entity, action, source surface, and known gaps. Tests must prove the manifests are stable and no-write while avoiding audit UI, request logging, external telemetry, or background processing. |
| S27-F3 — List filter support catalog | Codex | done | Publish deterministic metadata for the current supported list filter and sort surface across CRM list entities so future saved-view or report-builder work can consume filter capabilities without re-reading adapter internals. The catalog must preserve current list behavior and avoid saved-view persistence, natural-language filters, search expansion, route changes, or schema changes. |

\*\*Sprint 27 non-goals\*\* (carry forward permanent scope boundaries plus sprint-specific exclusions):

\- No authentication, permissions, or multi-tenancy.

\- No deployment configuration.

\- No external AI provider integration.

\- No geocoding or territory polygons.

\- No default switch from SQLite to Postgres.

\- No persistent forecast scenarios.

\- No dealer order or routing area create/edit flows.

\- No new live `/deals/\[id]` detail route.

\- No global search expansion.

\- No saved-view persistence, saved-view model, saved-view UI, user/tenant sharing layer, or contract/schema-documentation changes for saved views.

\- No actual bulk mutation execution, apply workflow, approval workflow, import apply flow, CSV bulk create/update, contact or lead upsert, duplicate merge, file storage, routing execution, or Salesforce integration.

\- No audit UI, audit reporting dashboard, external telemetry sink, request-log pipeline, background audit processing, or auth-backed audit permissions.

\- No natural-language filters, report builder, dashboard builder, dedicated `/search` page, command-palette expansion, or query behavior rewrites.

\- No routing engine changes, pacing-engine changes, routing simulator, routing reassignment, dealer capacity rules, lead disposition state expansion, or SLA timers.


\*\*Sprint 28 — Productivity Operator Surfaces\*\*

Goal: surface the current productivity handoff contracts in read-only operator workflows without adding mutation execution, routes, schema changes, or permanent non-goal scope.

| Feature | Owner | Status | Acceptance summary |
|---|---|---|---|
| S28-F1 — Audit coverage operator panel | Codex | done | Add a read-only `/reports` panel that summarizes audit coverage manifests by entity, category, and source surface, including known gaps and safe next actions. It must use existing manifests, preserve current routes and mutation behavior, and avoid request logging, external telemetry, auth permissions, or background processing. |
| S28-F2 — List filter support explorer | Codex | done | Add a read-only `/reports` panel that exposes supported list filters and sort keys by entity from the support catalog so operators can inspect current query capabilities. It must avoid saved-view persistence, natural-language filters, search changes, schema changes, route changes, and report-builder scope. |
| S28-F3 — Bulk dry-run review operator UI | Codex | done | Add a no-write operator UI on `/reports` for building bulk action dry-run review packets from supported entity/action/record selections and target inputs. It must display eligible/blocked rollups, representative reasons, and audit-planning metadata while avoiding actual bulk mutations, approvals, import apply, routing execution, file storage, or new routes. |

\*\*Sprint 28 non-goals\*\* (carry forward permanent scope boundaries plus sprint-specific exclusions):

\- No authentication, permissions, or multi-tenancy.

\- No deployment configuration.

\- No external AI provider integration.

\- No geocoding or territory polygons.

\- No default switch from SQLite to Postgres.

\- No persistent forecast scenarios.

\- No dealer order or routing area create/edit flows.

\- No new live `/deals/\[id]` detail route.

\- No global search expansion.

\- No actual bulk mutation execution, approval workflow, CSV import apply flow, CSV bulk create/update, contact or lead upsert, duplicate merge, routing execution, file storage, or Salesforce integration.

\- No saved-view persistence, saved-view model, saved-view UI, user/tenant sharing layer, natural-language filters, report builder, dashboard builder, dedicated `/search` page, command-palette expansion, or schema/contract changes for saved views.

\- No new report detail slug or product route; S28 surfaces stay on existing `/reports`.

\- No request-log pipeline, external telemetry sink, background audit processing, auth-backed audit permissions, or audit event backfills.

\- No routing engine changes, pacing-engine changes, routing simulator, routing reassignment, dealer capacity rules, lead disposition state expansion, or SLA timers.


\*\*Sprint 29 — Saved Views And Audit Operations\*\*

Goal: turn the completed productivity handoff surfaces into bounded local operator workflows while preserving current route guardrails and deterministic local behavior.

| Feature | Owner | Status | Acceptance summary |
|---|---|---|---|
| S29-F1 — Audit event explorer | Codex | done | Add a read-only `/reports` surface over existing audit events with entity/action/source filters, recent-event rows, counts, and record links where available. It must reuse the current audit model and avoid request logging, external telemetry, background processing, auth permissions, or audit backfills. |
| S29-F2 — Saved list views foundation | Codex | done | Add a local saved-view model and server helpers for supported CRM list pages, preserving current list behavior when no saved view is selected and documenting the contract/schema change. It must support existing filters and sorts without natural-language filters, sharing, tenant scoping, or report-builder scope. |
| S29-F3 — Saved list views operator UI | Codex | done | Add save/apply/update/delete controls for saved views on supported CRM list pages using existing filters and sorts, with deterministic feedback and tests. It depends on S29-F2 and must avoid column layout builders, cross-user sharing, permissions, saved-view import/export, or search changes. |

\*\*Sprint 29 non-goals\*\* (carry forward permanent scope boundaries plus sprint-specific exclusions):

\- No authentication, permissions, or multi-tenancy.

\- No deployment configuration.

\- No external AI provider integration.

\- No geocoding or territory polygons.

\- No default switch from SQLite to Postgres.

\- No persistent forecast scenarios.

\- No dealer order or routing area create/edit flows.

\- No new live `/deals/\[id]` detail route.

\- No global search expansion.

\- No request-log pipeline, external telemetry sink, background audit processing, auth-backed audit permissions, or audit event backfills.

\- No saved-view sharing, user/tenant scoping, permissions model, natural-language filters, report builder, dashboard builder, or saved-view import/export.

\- No column layout builder, custom-field metadata, or schema changes outside the saved-view foundation.

\- No new product routes; S29 surfaces stay on existing `/reports` and supported CRM list routes.

\- No bulk mutation execution, approval workflow, CSV import apply flow, CSV bulk create/update, duplicate merge, routing execution, file storage, or Salesforce integration.


\*\*Sprint 30 — Bulk Action Execution\*\*

Goal: promote the existing dry-run bulk action surface into bounded local execution workflows with auditability and explicit operator confirmation.

| Feature | Owner | Status | Acceptance summary |
|---|---|---|---|
| S30-F1 — Selected export action packets | codex | done | Generate deterministic selected-record export packets from the existing bulk selected-export dry-run path and CSV export definitions, with bounded IDs, stable ordering, and no database writes. It must preserve current export contracts and avoid new routes, file storage, background jobs, Salesforce integration, or import apply behavior. |
| S30-F2 — Bulk action execution foundation | codex | done | Add a bounded server-side executor for eligible dry-run records covering status update, stage update, owner assignment, and task creation, with per-record results, skipped/blocked counts, and audit events. It must reuse existing validation and mutation services while avoiding approvals, async jobs, routing execution, duplicate merge, CSV import writes, or auth/permission scope. |
| S30-F3 — Bulk action execution operator UI | codex | done | Extend the existing `/reports` bulk dry-run operator with explicit confirmation, execution feedback, and tests while preserving dry-run-first behavior. It depends on S30-F2 and must avoid new product routes, list-page selection builders, approval workflows, background processing, saved-view changes, or search changes. |

\*\*Sprint 30 non-goals\*\* (carry forward permanent scope boundaries plus sprint-specific exclusions):

\- No authentication, permissions, or multi-tenancy.

\- No deployment configuration.

\- No external AI provider integration.

\- No geocoding or territory polygons.

\- No default switch from SQLite to Postgres.

\- No persistent forecast scenarios.

\- No dealer order or routing area create/edit flows.

\- No new live `/deals/\[id]` detail route.

\- No global search expansion.

\- No approval workflow, pending approvals queue, scheduled sweep, async/background job, request-log pipeline, or external telemetry sink.

\- No CSV import apply flow, CSV bulk create/update from imported rows, duplicate merge, file storage, Salesforce integration, or external CRM sync.

\- No routing execution, routing reassignment, pacing-engine changes, routing simulator, dealer capacity rules, lead disposition state expansion, or SLA timers.

\- No new product routes, list-page selection builder, report builder, dashboard builder, saved-view changes, natural-language filters, or command-palette expansion.

\*\*Sprint 31 — List Bulk Actions\*\*

Goal: bring bounded bulk actions from the reports operator into day-to-day CRM list workflows while preserving dry-run-first confirmation, auditability, and existing route boundaries.

| Feature | Owner | Status | Acceptance summary |
|---|---|---|---|
| S31-F1 — Bulk list selection contracts | codex | done | Add deterministic selected-record contracts for supported CRM list pages so visible-row IDs can be passed into existing bulk dry-run, selected-export, and execution services. Preserve existing filters, sorts, pagination, saved views, and list behavior. |
| S31-F2 — List-page selected export actions | codex | done | Add bounded selected-export controls on supported list pages that reuse S30 selected export packets, preserve stable selected-ID ordering, and expose clear blocked/missing feedback without database writes. |
| S31-F3 — List-page bulk execution actions | codex | done | Add dry-run-first confirmed bulk execution on supported list pages using the S30 executor, with per-record feedback and audit evidence. The report operator remains available and existing mutation behavior stays unchanged outside confirmed eligible records. |

\*\*Sprint 31 non-goals\*\* (carry forward permanent scope boundaries plus sprint-specific exclusions):

\- No authentication, permissions, or multi-tenancy.

\- No deployment configuration.

\- No external AI provider integration.

\- No geocoding or territory polygons.

\- No default switch from SQLite to Postgres.

\- No persistent forecast scenarios.

\- No dealer order or routing area create/edit flows.

\- No new live `/deals/\[id]` detail route.

\- No global search expansion.

\- No approval workflow, pending approvals queue, scheduled sweep, async/background job, request-log pipeline, external telemetry sink, or auth-backed audit permissions.

\- No CSV import apply flow, CSV bulk create/update from imported rows, duplicate merge, file storage, Salesforce integration, or external CRM sync.

\- No routing execution, routing reassignment, pacing-engine changes, routing simulator, dealer capacity rules, lead disposition state expansion, or SLA timers.

\- No new product routes, report builder, dashboard builder, natural-language filters, command-palette expansion, saved-view schema/model changes, saved-view sharing, user/tenant scoping, permissions model, saved-view import/export, list column builder, custom-field metadata, or search changes.

\*\*Sprint 32 — Case Service Operations\*\*

Goal: add deterministic case queue and SLA foundations to the existing service workflow without changing route boundaries or adding background infrastructure.

| Feature | Owner | Status | Acceptance summary |
|---|---|---|---|
| S32-F1 — Case queue assignment foundation | codex | done | Add deterministic service-queue assignment for Cases using repo-local data, validation, seed coverage, and audit evidence. Existing case create/update flows can assign or preserve queue state without changing Case status semantics. |
| S32-F2 — Case SLA timer contracts | codex | done | Add deterministic SLA target/due/overdue calculations for Cases with an injected clock, seeded examples, and test coverage. SLA state is computed locally and does not require scheduled jobs or external services. |
| S32-F3 — Service operations case UI | codex | done | Existing `/cases` list and drawer surfaces show queue/SLA context and support bounded queue assignment/status workflows with deterministic feedback and e2e coverage. The app keeps the existing `/cases?case=<id>` drawer pattern. |

\*\*Sprint 32 non-goals\*\* (carry forward permanent scope boundaries plus sprint-specific exclusions):

\- No authentication, permissions, or multi-tenancy.

\- No deployment configuration.

\- No external AI provider integration.

\- No geocoding or territory polygons.

\- No default switch from SQLite to Postgres.

\- No persistent forecast scenarios.

\- No dealer order or routing area create/edit flows.

\- No new live `/deals/\[id]` detail route.

\- No global search expansion.

\- No new product routes, case detail route, knowledge base, calendar/email integration, approval workflow, pending approvals queue, or service portal.

\- No background scheduler, notification delivery, external telemetry sink, SLA escalation automation, auth-backed entitlements, or multi-tenant queue rules.

\- No routing execution, routing reassignment, pacing-engine changes, routing simulator, dealer capacity rules, lead disposition state expansion, CSV import apply flow, duplicate merge, file storage, Salesforce integration, or external CRM sync.

\*\*Sprint 33 — Case Knowledge Assist\*\*

Goal: add local knowledge article foundations to the case service workflow without adding new routes, external providers, or search expansion.

| Feature | Owner | Status | Acceptance summary |
|---|---|---|---|
| S33-F1 — Knowledge article foundation | codex | done | Add a local Knowledge Article foundation for service workflows: schema, seed data, validation/service helpers, CRM contract/registry updates, audit evidence, and tests. Existing case, task, campaign, dealer, lead, and opportunity semantics stay unchanged. |
| S33-F2 — Case knowledge suggestion contracts | codex | done | Add deterministic case-to-article suggestion helpers using repo-local case fields and article metadata. Suggestions are read-only, hermetic, and avoid external AI/RAG/provider calls or case/article mutations. |
| S33-F3 — Case knowledge assist UI | codex | done | Existing `/cases` list and drawer surfaces show bounded knowledge suggestions with clear empty/loading states and e2e coverage. No new route is added; `/cases?case=<id>` remains the service operations detail flow. |

\*\*Sprint 33 non-goals\*\* (carry forward permanent scope boundaries plus sprint-specific exclusions):

\- No authentication, permissions, or multi-tenancy.

\- No deployment configuration.

\- No external AI provider integration.

\- No geocoding or territory polygons.

\- No default switch from SQLite to Postgres.

\- No persistent forecast scenarios.

\- No dealer order or routing area create/edit flows.

\- No new live `/deals/\[id]` detail route.

\- No global search expansion.

\- No service portal, external knowledge sync, RAG/vector search, AI-generated article content, or external knowledge provider.

\- No new product routes, article CRUD admin pages, article import/export, file storage, or search index expansion.

\- No case status, queue, SLA, routing, lead disposition, pacing-engine, forecast, CSV import apply, duplicate merge, Salesforce integration, or external CRM sync changes.

\*\*Sprint 34 — Dependency Modernization\*\*

Goal: reduce dependency and audit drift without weakening the local gate or adding product scope.

| Feature | Owner | Status | Acceptance summary |
|---|---|---|---|
| S34-F1 — Non-major dependency refresh | codex | done | Update only direct package patch/minor releases that do not require framework migration or new configuration, then keep install, lint, typecheck, test, build, and e2e green. Document any skipped major-version candidates in the Codex summary. |
| S34-F2 — Transitive advisory containment | codex | done | Reduce or explicitly contain npm audit moderate findings where safe through package-manager-level overrides or compatible dependency updates, with package lock integrity and the full local gate green. Any advisory that requires an unsafe downgrade or unavailable upstream fix is recorded with evidence instead of forced. |
| S34-F3 — Vitest major compatibility pass | codex | done | Attempt the Vitest/Vite advisory migration path in a bounded branch-local pass; either land a green Vitest 4-compatible test stack or leave package files reverted and file a precise gate/dependency blocker with failing command, error surface, and safe next action. |

\*\*Sprint 34 non-goals\*\* (carry forward permanent scope boundaries plus sprint-specific exclusions):

\- No authentication, permissions, or multi-tenancy.

\- No deployment configuration.

\- No external AI provider integration.

\- No geocoding or territory polygons.

\- No default switch from SQLite to Postgres.

\- No persistent forecast scenarios.

\- No dealer order or routing area create/edit flows.

\- No new live `/deals/\[id]` detail route.

\- No global search expansion.

\- No `npm audit fix --force`.

\- No package downgrade to satisfy misleading audit `fixAvailable` output.

\- No product behavior changes, product routes, schema changes, or CRM-CONTRACT.md changes unless a later prompt explicitly promotes them.

\- No replacement test runner or unrelated test rewrites.


\*\*Sprint 35 — Deterministic AI Contracts\*\*

Goal: make existing local AI-style outputs easier to govern, validate, and regression-test without adding providers, routes, or write-capable automation.

| Feature | Owner | Status | Acceptance summary |
|---|---|---|---|
| S35-F1 — Deterministic AI prompt registry | codex | done | Register existing deterministic AI-style surfaces with stable prompt IDs, versions, owners, and input/output schema references. No routes, external providers, secrets, network calls, RAG, or agentic writes are added. |
| S35-F2 — Structured deterministic output contracts | codex | done | Add Zod-backed output contracts for existing local summarizer, analyst, and case-assist outputs so invalid output can be handled deterministically and covered by tests. No provider calls, generated-content expansion, persistence workflow, or route changes are added. |
| S35-F3 — Deterministic AI eval fixtures | codex | done | Add a bounded fixture/eval harness for current deterministic outputs so regressions are caught by `npm run test` without network calls, external services, or provider credentials. No live provider evals, RAG answers, tool-plan execution, CI/deployment changes, or new product surfaces are added. |

\*\*Sprint 35 non-goals\*\* (carry forward permanent scope boundaries plus sprint-specific exclusions):

\- No authentication, permissions, or multi-tenancy.

\- No deployment configuration.

\- No external AI provider integration.

\- No geocoding or territory polygons.

\- No default switch from SQLite to Postgres.

\- No persistent forecast scenarios.

\- No dealer order or routing area create/edit flows.

\- No new live `/deals/\[id]` detail route.

\- No global search expansion.

\- No AI provider credentials, network calls, or environment-variable secrets.

\- No RAG/vector search, external knowledge provider, prompt-to-action tool execution, or agentic writes.

\- No new AI-generated content surfaces beyond validating and registering existing deterministic outputs.

\- No CRM-CONTRACT route, entity, status, or adapter changes unless a later prompt explicitly promotes them.


\*\*Sprint 36 — Local AI Governance\*\*

Goal: add read-only local governance metadata around existing deterministic AI-style outputs without adding providers, persistence workflows, routes, or write-capable automation.

| Feature | Owner | Status | Acceptance summary |
|---|---|---|---|
| S36-F1 — Deterministic AI run receipts | codex | done | Existing deterministic AI-style surfaces can produce typed, non-persistent run receipt metadata with prompt ID/version, local deterministic provider label, validation status, input/output hashes, and explicit no-write/no-network flags. Tests cover stable receipt generation and no database, network, or provider dependency. |
| S36-F2 — AI privacy and cost policy guardrails | codex | done | Local deterministic AI surfaces have policy metadata/helpers for redaction-sensitive fields, provider/secret disallowance, and zero-cost/zero-token accounting defaults. Tests verify all current deterministic surfaces are covered without adding auth/org quota enforcement or provider calls. |
| S36-F3 — AI governance review packets | codex | done | Read-only review packets compose prompt registry, output contract, eval fixture, run receipt, and policy metadata for each current deterministic AI-style surface. Tests ensure packet completeness and explicitly exclude RAG, tool-plan execution, external-provider claims, and product route changes. |

\*\*Sprint 36 non-goals\*\* (carry forward permanent scope boundaries plus sprint-specific exclusions):

\- No authentication, permissions, or multi-tenancy.

\- No deployment configuration.

\- No external AI provider integration.

\- No geocoding or territory polygons.

\- No default switch from SQLite to Postgres.

\- No persistent forecast scenarios.

\- No dealer order or routing area create/edit flows.

\- No new live `/deals/\[id]` detail route.

\- No global search expansion.

\- No AI provider credentials, network calls, environment-variable secrets, provider billing, token-metering service, or external telemetry.

\- No persistent AI run log table, audit schema, database writes, persistence workflow, or CRM-CONTRACT route/entity/status/adapter changes.

\- No RAG/vector search, external knowledge provider, prompt-to-action tool execution, agentic writes, or live provider evals.

\- No new AI-generated content surfaces, generated-content expansion, product routes, CI/deployment changes, or auth/org quota enforcement.


\*\*Sprint 37 — Workflow Rule Readiness\*\*

Goal: establish deterministic, read-only workflow-rule planning contracts without adding product routes, persistence workflows, scheduled execution, or write-capable automation.

| Feature | Owner | Status | Acceptance summary |
|---|---|---|---|
| S37-F1 — Workflow rule catalog | codex | done | Typed workflow-rule metadata lists supported draft triggers, CRM objects, condition families, and non-mutating action descriptors using current CRM constants. Tests verify the supported object/action matrix and keep unsupported permanent non-goal surfaces out of the catalog. |
| S37-F2 — Workflow dry-run evaluator | codex | done | Server-side dry-run helpers validate a draft rule against the catalog and return bounded deterministic matched record references plus proposed action summaries without mutating data. Tests cover invalid actions, empty matches, match bounds, deterministic ordering, and no write side effects. |
| S37-F3 — Workflow review packets | codex | done | Read-only workflow review packets compose catalog and dry-run output into rule metadata, affected-object counts, proposed action categories, safety flags, and operator warnings for later UI consumption. Tests ensure packet completeness and no product route, CRM-CONTRACT, persistence, or action-execution drift. |

\*\*Sprint 37 non-goals\*\* (carry forward permanent scope boundaries plus sprint-specific exclusions):

\- No authentication, permissions, or multi-tenancy.

\- No deployment configuration.

\- No external AI provider integration.

\- No geocoding or territory polygons.

\- No default switch from SQLite to Postgres.

\- No persistent forecast scenarios.

\- No dealer order or routing area create/edit flows.

\- No new live `/deals/\[id]` detail route.

\- No global search expansion.

\- No workflow builder UI, product routes, route handlers, or navigation changes.

\- No workflow rule persistence, scheduled sweeps, approval engine, background jobs, audit/event writes, action execution, agentic writes, arbitrary JavaScript, or `eval`.

\- No new CRM entities, statuses, adapter signatures, CRM-CONTRACT route/entity/status changes, or schema changes unless a later prompt explicitly promotes them.

\- No Salesforce integration, CSV import apply workflow, provider secrets, webhooks, external services, or network calls.


\*\*Sprint 38 — Workflow Operator Readiness\*\*

Goal: make the deterministic workflow-rule planning surface operator-ready while preserving read-only local behavior and avoiding persistence, scheduled execution, or write-capable automation.

| Feature | Owner | Status | Acceptance summary |
|---|---|---|---|
| S38-F1 — Workflow rule example contracts | codex | done | Server-side workflow-rule examples provide deterministic sample draft rules and fixture metadata for supported entities, triggers, conditions, and descriptor-only actions. Tests verify examples stay catalog-backed, no-write, and exclude unsupported permanent non-goal surfaces. |
| S38-F2 — Workflow dry-run operator UI | codex | done | The existing `/reports` surface can run and review bounded workflow-rule dry-runs using catalog examples, validation feedback, match counts, proposed action summaries, and safety warnings. No new product route, workflow persistence, action execution, background job, or CRM-CONTRACT route/status drift is added. |
| S38-F3 — Workflow execution readiness receipts | codex | done | Read-only readiness receipts summarize whether proposed workflow actions are eligible for a future manual executor and what audit intent would be required, without executing actions or writing audit/CRM records. Tests cover blocked/eligible action categories, no persistence, and no provider/network dependencies. |

\*\*Sprint 38 non-goals\*\* (carry forward permanent scope boundaries plus sprint-specific exclusions):

\- No authentication, permissions, or multi-tenancy.

\- No deployment configuration.

\- No external AI provider integration.

\- No geocoding or territory polygons.

\- No default switch from SQLite to Postgres.

\- No persistent forecast scenarios.

\- No dealer order or routing area create/edit flows.

\- No new live `/deals/\[id]` detail route.

\- No global search expansion.

\- No standalone workflow-builder route, saved workflow-rule model, workflow persistence, scheduled sweeps, approval engine, background jobs, or action execution.

\- No audit/event writes, CRM writes, arbitrary JavaScript, `eval`, agentic writes, provider secrets, external services, webhooks, or network calls.

\- No new CRM entities, statuses, adapter signatures, CRM-CONTRACT route/entity/status changes, routing decision changes, pacing-engine changes, CSV import apply workflow, or Salesforce integration.


\*\*Sprint 39 — Workflow Manual Execution\*\*

Goal: promote the deterministic workflow-rule planning surface into a bounded manual execution path while preserving explicit operator approval, audit evidence, and route/contract guardrails.

| Feature | Owner | Status | Acceptance summary |
|---|---|---|---|
| S39-F1 — Workflow execution capability matrix | codex | done | Server-side workflow execution capability metadata maps catalog actions to supported manual-executor paths and explicit blocked reasons. Tests prove the matrix is deterministic, catalog-backed, no-write, and excludes unsupported permanent non-goal surfaces. |
| S39-F2 — Workflow manual executor foundation | codex | done | An explicit operator-approved server-side manual executor applies eligible workflow actions through existing validation/catalog paths, records audit evidence for mutations, and blocks unsupported, empty, or truncated cases. No workflow persistence, scheduled sweep, background job, external delivery, webhook, provider call, or CRM-CONTRACT drift is added. |
| S39-F3 — Workflow execution operator UI | codex | done | The existing `/reports` workflow dry-run surface adds a confirmation-driven manual execution path with visible execution, skipped/blocked, and audit outcomes. No new route, workflow builder, saved rule model, scheduler, or global search/deal-detail expansion is added. |

\*\*Sprint 39 non-goals\*\* (carry forward permanent scope boundaries plus sprint-specific exclusions):

\- No authentication, permissions, or multi-tenancy.

\- No deployment configuration.

\- No external AI provider integration.

\- No geocoding or territory polygons.

\- No default switch from SQLite to Postgres.

\- No persistent forecast scenarios.

\- No dealer order or routing area create/edit flows.

\- No new live `/deals/\[id]` detail route.

\- No global search expansion.

\- No saved workflow-rule model, workflow builder route, scheduled sweeps, approval engine, background jobs, or agentic/autonomous writes.

\- No external message delivery, webhooks, provider secrets, external services, network calls, arbitrary JavaScript, or `eval`.

\- No new CRM entities, statuses, adapter signatures, CRM-CONTRACT route/entity/status changes, routing decision changes, pacing-engine changes, CSV import apply workflow, or Salesforce integration.

\*\*Sprint 40 — CSV Contact Import Apply\*\*

Goal: graduate the current read-only CSV import preview into a bounded, operator-approved contact-create apply path while preserving no-routing, no-storage, and integration guardrails.

| Feature | Owner | Status | Acceptance summary |
|---|---|---|---|
| S40-F1 — CSV contact import apply capability matrix | codex | done | Server-side metadata maps current contact import preview/readiness actions to explicit manual-apply eligibility and blocked reasons. The matrix is deterministic, no-write, and excludes lead routing, updates/upserts, duplicate merge, file storage, and Salesforce integration. |
| S40-F2 — CSV contact import manual apply executor | codex | done | An explicit operator-approved server-side executor creates only contact rows classified as create-safe by existing preview/preflight contracts, records audit evidence, and returns row-level created/skipped/blocked outcomes. No lead import apply, routing execution, update/upsert, duplicate merge, file storage, background job, or CRM-CONTRACT drift is added. |
| S40-F3 — CSV import apply operator UI | codex | done | The existing `/reports` CSV import preview surface adds a confirmation-driven contact apply path with visible apply, skipped/blocked, and audit outcomes. No new product route, mapping wizard, persistent upload history, lead routing, Salesforce integration, or global search/deal-detail expansion is added. |

\*\*Sprint 40 non-goals\*\* (carry forward permanent scope boundaries plus sprint-specific exclusions):

\- No authentication, permissions, or multi-tenancy.

\- No deployment configuration.

\- No external AI provider integration.

\- No geocoding or territory polygons.

\- No default switch from SQLite to Postgres.

\- No persistent forecast scenarios.

\- No dealer order or routing area create/edit flows.

\- No new live `/deals/\[id]` detail route.

\- No global search expansion.

\- No lead import apply, lead routing execution, routing reassignment, dealer-order writes, or pacing-engine changes.

\- No contact update/upsert, duplicate merge, account creation, mapping wizard, file storage, background import jobs, or persistent upload history.

\- No database writes outside the explicit operator-approved contact-create apply path and its audit evidence.

\- No Salesforce integration, external enrichment, network calls, provider secrets, or webhooks.

\- No new product route or CRM-CONTRACT route/entity/status/adapter changes.

\*\*Sprint 41 — Campaign Influence Lite\*\*

Goal: promote the campaign-member and influence-lite backlog into the existing campaign workflow without adding new routes, external integrations, or attribution automation.

| Feature | Owner | Status | Acceptance summary |
|---|---|---|---|
| S41-F1 — Campaign member model foundation | codex | done | Add an explicit CampaignMember foundation for contacts/leads participating in campaigns, keeping existing campaign create/update flows compatible and CRM contract references aligned. Tests cover member creation/query behavior and audit-safe service patterns without auth, Salesforce sync, or new routes. |
| S41-F2 — Campaign influence summaries | codex | done | Add deterministic helpers that summarize campaign member counts, related opportunity value, and influence-lite metrics from local CRM data. Output is bounded and test-covered, with no automated attribution engine, opportunity line-item work, report-builder persistence, or external enrichment. |
| S41-F3 — Campaign performance UI | codex | done | Existing `/campaigns` list and `/campaigns?campaign=<id>` drawer surfaces show member and influence summaries with focused e2e coverage. No new product route, campaign-member CRUD page, report/dashboard builder, Salesforce sync, or search expansion is added. |

\*\*Sprint 41 non-goals\*\* (carry forward permanent scope boundaries plus sprint-specific exclusions):

\- No authentication, permissions, or multi-tenancy.

\- No deployment configuration.

\- No external AI provider integration.

\- No geocoding or territory polygons.

\- No default switch from SQLite to Postgres.

\- No persistent forecast scenarios.

\- No dealer order or routing area create/edit flows.

\- No new live `/deals/\[id]` detail route.

\- No global search expansion.

\- No standalone campaign-member route, campaign-member CRUD page, or new navigation surface.

\- No Salesforce integration, external campaign sync, webhooks, external enrichment, provider secrets, or network calls.

\- No automated multi-touch attribution engine, opportunity line items, products, price books, quote generation, or transactional email.

\- No report builder, dashboard builder, persistent forecast scenario, saved report definition, or dedicated analytics route.

\- No routing execution, routing reassignment, pacing-engine changes, lead disposition state expansion, dealer capacity rules, or area/order CRUD.


\*\*Sprint 42 — Campaign Operations Completion\*\*

Goal: close the campaign influence-lite operational gaps by making campaign membership and budget-aware performance actionable inside the existing campaign workflow.

| Feature | Owner | Status | Acceptance summary |
|---|---|---|---|
| S42-F1 — Campaign member removal and availability contracts | codex | done | Server-side campaign-member helpers expose deterministic available-member lists and remove-member operations for existing contacts/leads, with audit evidence and focused tests. Existing campaign create/update behavior remains compatible; no standalone campaign-member route, bulk segmentation builder, Salesforce sync, or external enrichment is added. |
| S42-F2 — Campaign ROI rollup summaries | codex | done | Campaign influence summaries include budget-aware rollups derived from existing `Campaign.budget` and related local opportunity values, with deterministic handling for missing budget and zero-value cases. Tests cover bounded output and the existing campaign UI surfaces display the new rollups without attribution automation, opportunity line items, products, quotes, or report-builder persistence. |
| S42-F3 — Campaign member operator controls | codex | done | Existing `/campaigns` and `/campaigns?campaign=<id>` surfaces let operators add and remove existing contact/lead campaign members with bounded controls, feedback, and focused e2e coverage. No new product route, standalone campaign-member CRUD page, saved audience definition, Salesforce sync, or global search expansion is added. |

\*\*Sprint 42 non-goals\*\* (carry forward permanent scope boundaries plus sprint-specific exclusions):

\- No authentication, permissions, or multi-tenancy.

\- No deployment configuration.

\- No external AI provider integration.

\- No geocoding or territory polygons.

\- No default switch from SQLite to Postgres.

\- No persistent forecast scenarios.

\- No dealer order or routing area create/edit flows.

\- No new live `/deals/\[id]` detail route.

\- No global search expansion.

\- No standalone campaign-member route, campaign-member CRUD page, saved audience builder, or new navigation surface.

\- No Salesforce integration, external campaign sync, webhooks, external enrichment, provider secrets, or network calls.

\- No automated multi-touch attribution engine, opportunity line items, products, price books, quote generation, or transactional email.

\- No report builder, dashboard builder, persistent forecast scenario, saved report definition, or dedicated analytics route.

\- No routing execution, routing reassignment, pacing-engine changes, lead disposition state expansion, dealer capacity rules, or area/order CRUD.


\*\*Sprint 43 — Knowledge Operator Workspace\*\*

Goal: promote local service-workflow knowledge articles into a bounded operator workspace while preserving deterministic case assist behavior and external-provider guardrails.

| Feature | Owner | Status | Acceptance summary |
|---|---|---|---|
| S43-F1 — Knowledge article route contract | codex | done | Promote `KnowledgeArticle` from service-only case-assist support to an explicit `/knowledge` product route contract and registry surface, with focused tests for route metadata and excluded-route stability. Implementation updates must keep existing case assist behavior compatible and must not add global search expansion, external providers, RAG, or standalone article detail routes. |
| S43-F2 — Knowledge article operator workspace | codex | done | Add a read-oriented `/knowledge` workspace using existing knowledge article services, filters, article detail drawer context, and focused e2e coverage. The workspace surfaces local article status, audience, category, queue, keywords, and case-assist context without adding customer portals, external knowledge sources, command-palette expansion, or article write controls. |
| S43-F3 — Knowledge article lifecycle controls | codex | done | Add bounded create/update/publish/archive controls for local service-workflow articles from the existing knowledge workspace, with validation, audit feedback, and tests. No external sync, provider calls, public publishing, global search expansion, standalone article detail route, or case/routing/pacing behavior changes are added. |

\*\*Sprint 43 non-goals\*\* (carry forward permanent scope boundaries plus sprint-specific exclusions):

\- No authentication, permissions, or multi-tenancy.

\- No deployment configuration.

\- No external AI provider integration.

\- No geocoding or territory polygons.

\- No default switch from SQLite to Postgres.

\- No persistent forecast scenarios.

\- No dealer order or routing area create/edit flows.

\- No new live `/deals/\[id]` detail route.

\- No global search expansion.

\- No external knowledge provider, RAG/vector search, web crawling, provider credentials, or network calls.

\- No customer-facing knowledge portal, public article publishing workflow, email/chat/channel deflection, or Salesforce Knowledge sync.

\- No product route beyond `/knowledge` and the `/knowledge?article=<id>` drawer flow.

\- No knowledge article inclusion in header search, command-palette search, or a dedicated search page.

\- No case SLA changes, routing execution, routing reassignment, pacing-engine changes, lead disposition state expansion, dealer capacity rules, or area/order CRUD.


\*\*Sprint 44 — Responsive Accessibility Hardening\*\*

Goal: harden existing CRM surfaces for stable rendering, mobile usability, and accessible operator feedback without adding product scope.

| Feature | Owner | Status | Acceptance summary |
|---|---|---|---|
| S44-F1 — UI identity and key stability | codex | done | Existing green e2e coverage no longer emits duplicate React key warnings from current CRM surfaces, with unstable/colliding UI keys replaced by stable identifiers and focused regression coverage where practical. No product routes, search expansion, routing execution, or pacing-engine changes are added. |
| S44-F2 — Responsive CRM surface audit | codex | done | Existing high-traffic CRM surfaces are hardened for mobile and desktop layout stability, including bounded overflow, table/drawer readability, and no incoherent text overlap. The work stays on current routes and avoids new workflows, navigation surfaces, or route contract changes. |
| S44-F3 — Keyboard and accessible-state pass | codex | done | Existing forms, drawers, and operator controls expose clear accessible names, focus behavior, and deterministic feedback states with focused tests. No auth, permissions model, external accessibility service, or broad dependency change is added. |

\*\*Sprint 44 non-goals\*\* (carry forward permanent scope boundaries plus sprint-specific exclusions):

\- No authentication, permissions, or multi-tenancy.

\- No deployment configuration.

\- No external AI provider integration.

\- No geocoding or territory polygons.

\- No default switch from SQLite to Postgres.

\- No persistent forecast scenarios.

\- No dealer order or routing area create/edit flows.

\- No new live `/deals/\[id]` detail route.

\- No global search expansion.

\- No new product routes, route handlers, navigation surfaces, or route contract changes.

\- No new workflow builders, report builders, dashboard builders, saved-view schema changes, custom-field metadata, or search changes.

\- No routing execution, routing reassignment, pacing-engine changes, routing simulator, dealer capacity rules, lead disposition state expansion, or area/order CRUD.

\- No external accessibility service, browser telemetry sink, provider credentials, network calls, or broad dependency modernization.


\*\*Sprint 45 — AI Action Safety Contracts\*\*

Goal: add preview-only deterministic AI action safety contracts so future assistive workflows can describe possible CRM actions without executing writes, calling providers, or expanding product routes.

| Feature | Owner | Status | Acceptance summary |
|---|---|---|---|
| S45-F1 — AI action intent registry | codex | done | A deterministic registry describes allowed and deferred AI action intents, input/output schemas, approval needs, audit expectations, CRM object scope, and forbidden capabilities. The registry is metadata only: no executor, product UI, provider call, route change, routing execution, or database write is added. |
| S45-F2 — AI action review packets | codex | done | Server-side review packets validate proposed AI action intents against the registry, produce deterministic ready/blocked summaries, and expose approval/audit expectations for later UI. Review packet builders are no-write and do not create tasks, activities, opportunity stage changes, lead assignments, email drafts, provider requests, or background jobs. |
| S45-F3 — AI action eval fixtures | codex | done | Golden fixtures cover supported, blocked, malformed, and deferred action-plan examples with schema-validation and policy-guardrail tests. The eval surface uses deterministic local data only and adds no external AI provider, RAG, search expansion, agentic execution, auth, route, or integration behavior. |

\*\*Sprint 45 non-goals\*\* (carry forward permanent scope boundaries plus sprint-specific exclusions):

\- No authentication, permissions, or multi-tenancy.

\- No deployment configuration.

\- No external AI provider integration.

\- No geocoding or territory polygons.

\- No default switch from SQLite to Postgres.

\- No persistent forecast scenarios.

\- No dealer order or routing area create/edit flows.

\- No new live `/deals/\[id]` detail route.

\- No global search expansion.

\- No AI action executor, agentic writes, silent writes, autonomous actions, or mutation side effects.

\- No product UI, product routes, route handlers, navigation surfaces, or feature-flag promotions.

\- No routing execution, routing reassignment, pacing-engine changes, dealer capacity rules, lead disposition state expansion, or area/order CRUD.

\- No transactional email provider, email sending, calendar sync, Salesforce integration, RAG/vector search, web crawling, provider credentials, network calls, or background jobs.


\*\*Sprint 46 — AI Action Operator Preview\*\*

Goal: expose the completed AI action safety contracts through deterministic no-write readiness and review surfaces without adding execution, providers, routes, or integrations.

| Feature | Owner | Status | Acceptance summary |
|---|---|---|---|
| S46-F1 — AI action readiness digest | codex | done | Server-side readiness digest composes the S45 intent registry, review-packet audit, and eval-fixture audit into deterministic status metadata with sample proposal references and explicit no-write/no-execution flags. No product UI, action executor, audit persistence, provider call, route change, or database write is added. |
| S46-F2 — AI action review operator panel | codex | done | The existing `/reports` surface exposes a no-write AI action review panel that can preview supported, blocked, deferred, and malformed proposals, showing readiness, payload issues, approval/audit expectations, and safety flags. The panel depends on S46-F1 and must not execute actions, create records, call providers, or add new routes. |
| S46-F3 — AI action review guardrail coverage | codex | done | Focused tests and e2e coverage prove the reports panel stays no-write, displays all major review statuses, preserves excluded-route boundaries, and keeps Sprint 45 eval fixtures aligned with the operator surface. No broad visual redesign, external provider mocks, routing/pacing changes, or dealer-order/area behavior changes are added. |

\*\*Sprint 46 non-goals\*\* (carry forward permanent scope boundaries plus sprint-specific exclusions):

\- No authentication, permissions, or multi-tenancy.

\- No deployment configuration.

\- No external AI provider integration.

\- No geocoding or territory polygons.

\- No default switch from SQLite to Postgres.

\- No persistent forecast scenarios.

\- No dealer order or routing area create/edit flows.

\- No new live `/deals/\[id]` detail route.

\- No global search expansion.

\- No AI action executor, agentic writes, silent writes, autonomous actions, or mutation side effects.

\- No provider calls, RAG/vector search, web crawling, provider credentials, network calls, transactional email provider, calendar sync, Salesforce integration, or background jobs.

\- No new product routes, route handlers, feature-flag promotions, search expansion, routing execution, routing reassignment, pacing-engine changes, dealer capacity rules, or lead disposition state expansion.

\*\*Sprint 47 — Approval Readiness Foundation\*\*

Goal: add deterministic no-write approval readiness contracts for high-risk CRM and AI-action proposal classes without enforcing approvals, executing actions, or adding auth/integration scope.

| Feature | Owner | Status | Acceptance summary |
|---|---|---|---|
| S47-F1 — Approval policy registry | codex | done | A metadata-only approval policy registry defines supported approval subjects, risk levels, reviewer labels, evidence requirements, audit expectations, and explicit blocked capabilities for high-risk CRM and AI-action proposal classes. No authentication, role model, persistence, approval enforcement, executor, route, UI, external provider, or database write is added. |
| S47-F2 — Approval review packets | codex | done | Server-side review packets evaluate representative CRM and AI-action proposals against the S47-F1 registry, returning deterministic approval-needed, blocked, and not-needed summaries with evidence and audit expectations. Packets are no-write and do not approve, reject, execute, mutate records, persist approvals, call providers, or schedule jobs. |
| S47-F3 — Approval readiness operator surface | codex | done | The existing `/reports` surface exposes a no-write approval readiness view with registry coverage, sample review-packet outcomes, and guardrail messaging, backed by focused tests/e2e coverage. The surface must not add routes, approve/reject controls, mutation controls, provider calls, auth/permission behavior, or database writes. |

\*\*Sprint 47 non-goals\*\* (carry forward permanent scope boundaries plus sprint-specific exclusions):

\- No authentication, permissions, or multi-tenancy.

\- No deployment configuration.

\- No external AI provider integration.

\- No geocoding or territory polygons.

\- No default switch from SQLite to Postgres.

\- No persistent forecast scenarios.

\- No dealer order or routing area create/edit flows.

\- No new live `/deals/\[id]` detail route.

\- No global search expansion.

\- No approval persistence, approve/reject workflow, reviewer assignment workflow, role/permission model, mutation gating, stage-change enforcement, or scheduled approval sweeps.

\- No AI action executor, agentic writes, silent writes, autonomous actions, provider calls, transactional email provider, calendar sync, Salesforce integration, RAG/vector search, web crawling, provider credentials, network calls, or background jobs.

\- No new product routes, route handlers, feature-flag promotions, search expansion, routing execution, routing reassignment, pacing-engine changes, dealer capacity rules, lead disposition state expansion, or area/order CRUD.

\*\*Sprint 48 — Lead Follow-Up Readiness\*\*

Goal: add deterministic lead disposition and SLA follow-up readiness for consumer dealer-routed leads without changing routing, lead conversion, or integration scope.

| Feature | Owner | Status | Acceptance summary |
|---|---|---|---|
| S48-F1 — Lead disposition contracts | codex | done | Server-side helpers classify existing consumer leads into deterministic disposition states using current `Lead` statuses, assignment fields, timestamps, and routing-event evidence. Output is bounded and test-covered, with no lead conversion flow, lead status expansion, routing execution, reassignment, product UI, route change, external enrichment, or database writes. |
| S48-F2 — Lead SLA follow-up packets | codex | done | Server-side packets identify stale, unrouted, routed-but-uncontacted, contacted, closed, and dead lead situations with reason codes, urgency labels, clock-injected age calculations, and suggested next-action metadata for later UI. Packets depend on S48-F1 and do not create tasks, send notifications, run routing, mutate records, persist SLA policy, call providers, or schedule jobs. |
| S48-F3 — Lead follow-up operator surface | codex | done | Existing CRM surfaces expose lead disposition/SLA summary counts and representative follow-up packets with focused tests/e2e coverage. The surface depends on S48-F2 and must not add new product routes, lead mutation controls, B2B lead conversion, global search expansion, routing reassignment, pacing-engine changes, task creation, provider calls, or background jobs. |

\*\*Sprint 48 non-goals\*\* (carry forward permanent scope boundaries plus lead-follow-up-specific exclusions):

\- No authentication, permissions, or multi-tenancy.

\- No deployment configuration.

\- No external AI provider integration.

\- No geocoding or territory polygons.

\- No default switch from SQLite to Postgres.

\- No persistent forecast scenarios.

\- No dealer order or routing area create/edit flows.

\- No new live `/deals/\[id]` detail route.

\- No global search expansion.

\- No B2B `Lead` conversion to Account, Contact, and Opportunity records.

\- No lead status enum expansion or new lifecycle states beyond `CRM-CONTRACT.md`.

\- No routing execution, routing reassignment, route-decision ranking changes, pacing-engine changes, dealer capacity windows, area coverage changes, or order quota changes.

\- No task creation, notification/email/calendar sync, background jobs, escalation automation, or persistent SLA policy configuration.

\- No new product routes, dedicated SLA/admin pages, external enrichment, Salesforce integration, RAG/vector search, web crawling, provider credentials, or network calls.

\*\*Sprint 49 — Saved Report Builder Foundation\*\*

Goal: promote a bounded saved-report definition and preview foundation on the existing reports surface without adding routes, auth, provider integrations, or unrestricted query behavior.

| Feature | Owner | Status | Acceptance summary |
|---|---|---|---|
| S49-F1 — Saved report definition contracts | codex | done | Added validated server-side saved report-definition contracts for supported CRM objects, fields, filters, grouping, and chart metadata, with deterministic tests and a CRM-CONTRACT update. No UI, arbitrary SQL, custom fields, dashboard builder, new report route, external BI, scheduled delivery, or integrations were added. |
| S49-F2 — Saved report preview runner | codex | done | Added a read-only saved definition preview runner through existing list/report/filter services with bounded rows, aggregates, chart-ready data, and validation errors. The runner does not write data, use raw SQL, schedule jobs, expand search, add routes, or create import/export delivery workflows. |
| S49-F3 — Saved reports operator surface | codex | done | Extended the existing `/reports` surface with list, build, and preview controls for saved report definitions plus focused tests/e2e coverage. The surface did not add a new product route, dashboard builder, custom object model, permissions workflow, provider call, or mutation side effect. |

\*\*Sprint 49 non-goals\*\* (carry forward permanent scope boundaries plus saved-report-specific exclusions):

\- No authentication, permissions, or multi-tenancy.

\- No deployment configuration.

\- No external AI provider integration.

\- No geocoding or territory polygons.

\- No default switch from SQLite to Postgres.

\- No persistent forecast scenarios.

\- No dealer order or routing area create/edit flows.

\- No new live `/deals/\[id]` detail route.

\- No global search expansion.

\- No dashboard builder, dashboard-card persistence, or dashboard route changes.

\- No custom field metadata, custom object model, arbitrary SQL, raw Prisma query builder exposure, or natural-language report generation.

\- No external BI integration, scheduled report delivery, email/calendar/provider calls, webhooks, Salesforce integration, file storage, or background jobs.

\- No mutation-capable report actions, bulk actions, CSV import/apply changes, routing execution, routing reassignment, pacing-engine changes, or approval enforcement.

\*\*Sprint 50 — Saved Report Persistence\*\*

Goal: make saved report definitions durable and operator-manageable on the existing reports surface while preserving bounded previews, current routes, and deterministic local behavior.

| Feature | Owner | Status | Acceptance summary |
|---|---|---|---|
| S50-F1 — Saved report persistence contracts | codex | done | Persist validated saved report definitions through server-side contracts/services using the existing S49 definition schema, with deterministic tests and no raw SQL or report execution side effects. |
| S50-F2 — Saved report management surface | codex | done | The existing `/reports` surface can create, list, update, archive/delete, load, and preview persisted saved report definitions with focused e2e coverage, without adding a new route. |
| S50-F3 — Saved report audit and guardrails | codex | done | Saved-report mutations produce deterministic audit evidence, and tests cover invalid definitions, preview read-only behavior, excluded-route boundaries, and no dashboard-builder/search/provider drift. |

\*\*Sprint 50 non-goals\*\* (carry forward permanent scope boundaries plus saved-report-specific exclusions):

\- No authentication, permissions, or multi-tenancy.

\- No deployment configuration.

\- No external AI provider integration.

\- No geocoding or territory polygons.

\- No default switch from SQLite to Postgres.

\- No persistent forecast scenarios.

\- No dealer order or routing area create/edit flows.

\- No new live `/deals/\[id]` detail route.

\- No global search expansion.

\- No new product route, saved-report detail route, dashboard builder, dashboard-card persistence, or dashboard route changes.

\- No custom field metadata, custom object model, arbitrary SQL, raw Prisma query builder exposure, natural-language report generation, or unrestricted query execution.

\- No external BI integration, scheduled report delivery, email/calendar/provider calls, webhooks, Salesforce integration, file storage, or background jobs.

\- No mutation-capable report preview actions, bulk actions, CSV import/apply changes, routing execution, routing reassignment, pacing-engine changes, approval enforcement, or auth/permission policy work.

\*\*Sprint 51 — Dashboard Card Builder\*\*

Goal: promote saved reports into bounded dashboard cards on existing CRM surfaces without adding routes, provider integrations, or unrestricted query behavior.

| Feature | Owner | Status | Acceptance summary |
|---|---|---|---|
| S51-F1 — Dashboard card definition contracts | codex | done | Add validated server-side contracts for dashboard cards backed by persisted saved reports, including placement, chart/table card metadata, preview limits, and explicit guardrails. No new routes, dashboard layout designer, custom SQL, or external BI/provider integration is added. |
| S51-F2 — Dashboard card preview runner | codex | done | Build a read-only runner that turns dashboard card definitions into bounded card preview data using existing saved-report preview services, with deterministic ordering and validation errors. The runner does not mutate CRM records, schedule refreshes, run background jobs, or expose unrestricted query execution. |
| S51-F3 — Dashboard card operator surface | codex | done | Existing `/reports` and `/dashboard` surfaces can pin, list, reorder, archive/delete, and render saved-report-backed dashboard cards with focused e2e coverage. No new product route, dashboard-builder route, card sharing/permissions, or global search expansion is added. |
| S51-F4 — Dashboard audit and guardrails | codex | done | Dashboard-card mutations produce deterministic audit evidence, and tests cover invalid definitions, preview read-only behavior, route boundaries, and no provider/search/dashboard-route drift. No auth/permissions enforcement, external telemetry, approvals, routing, or pacing changes are added. |

\*\*Sprint 51 non-goals\*\* (carry forward permanent scope boundaries plus dashboard-card-specific exclusions):

\- No authentication, permissions, or multi-tenancy.

\- No deployment configuration.

\- No external AI provider integration.

\- No geocoding or territory polygons.

\- No default switch from SQLite to Postgres.

\- No persistent forecast scenarios.

\- No dealer order or routing area create/edit flows.

\- No new live `/deals/\[id]` detail route.

\- No global search expansion.

\- No new product route, dashboard-builder route, saved-report detail route, or dashboard route changes.

\- No dashboard layout designer, arbitrary drag canvas, card sharing, card permissions, user/tenant scoping, or multi-dashboard workspace.

\- No custom field metadata, custom object model, arbitrary SQL, raw Prisma query builder exposure, natural-language dashboard/report generation, or unrestricted query execution.

\- No external BI integration, scheduled report delivery, email/calendar/provider calls, webhooks, Salesforce integration, file storage, or background jobs.

\- No CRM record mutations from dashboard previews, bulk actions, CSV import/apply changes, routing execution, routing reassignment, pacing-engine changes, approval enforcement, or auth/permission policy work.

\*\*Sprint 52 — Routing Simulation Foundation\*\*

Goal: add a read-only simulator foundation for hypothetical consumer-lead routing while preserving existing live routing, pacing, and route boundaries.

| Feature | Owner | Status | Acceptance summary |
|---|---|---|---|
| S52-F1 — Routing simulator input contracts | codex | done | Publish server-side simulator input, limit, fixture, and no-write guardrail contracts for hypothetical consumer leads. The contracts validate countries/postal inputs, batch limits, and explicit safety metadata without evaluating assignments, mutating records, adding UI/routes, or changing live routing behavior. |
| S52-F2 — Routing simulator read-only evaluator | codex | done | Add a deterministic read-only evaluator that uses existing postal normalization, area matching, order eligibility, and pace-gap ranking to explain where hypothetical leads would route. The evaluator returns assignment/blocker summaries and step traces without creating leads, routing events, dealer-order changes, forecast persistence, UI/routes, geocoding, or external calls. |

\*\*Sprint 52 non-goals\*\* (carry forward permanent scope boundaries plus routing-simulator-specific exclusions):

\- No authentication, permissions, or multi-tenancy.

\- No deployment configuration.

\- No external AI provider integration.

\- No geocoding or territory polygons.

\- No default switch from SQLite to Postgres.

\- No persistent forecast scenarios.

\- No dealer order or routing area create/edit flows.

\- No new live `/deals/\[id]` detail route.

\- No global search expansion.

\- No live lead creation, lead status changes, routing-event writes, dealer-order quota/delivery mutation, or pacing-engine mutation from simulator runs.

\- No simulator product route, dashboard widget, command-palette action, CSV import/apply integration, or background batch job.

\- No routing reassignment, fairness weighting changes, dealer capacity calendar/window model, or AI narrative generation.

\*\*Sprint 53 — Routing Simulator Operator Preview\*\*

Goal: expose the completed read-only routing simulator through bounded review packets and existing operator surfaces without changing live routing, pacing, or route boundaries.

| Feature | Owner | Status | Acceptance summary |
|---|---|---|---|
| S53-F1 — Routing simulator review packets | codex | done | Server-side review packets compose S52 simulator inputs and evaluator output into deterministic assigned/blocked summaries, capacity-impact notes, issue counts, and bounded row samples. Packets remain no-write and do not add UI/routes, mutate live leads/orders, persist scenarios, alter routing decisions, or call external services. |
| S53-F2 — Routing simulator operator surface | codex | done | Existing CRM surfaces expose a small read-only hypothetical lead batch preview backed by S53-F1 packets, with clear assignment/blocker results and step-trace detail for operators. The surface adds no new product route and must not create leads, routing events, dealer-order delivery records, dashboard widgets, command-palette actions, or pacing-engine changes. |
| S53-F3 — Routing simulator guardrail coverage | codex | done | Focused unit and e2e coverage proves simulator previews stay read-only, preserve excluded-route boundaries, and do not regress live routing or dealer-order state. Coverage adds no broad visual redesign, global search expansion, external services, scenario persistence, or routing/fairness algorithm changes. |

\*\*Sprint 53 non-goals\*\* (carry forward permanent scope boundaries plus routing-simulator-specific exclusions):

\- No authentication, permissions, or multi-tenancy.

\- No deployment configuration.

\- No external AI provider integration.

\- No geocoding or territory polygons.

\- No default switch from SQLite to Postgres.

\- No persistent forecast scenarios.

\- No dealer order or routing area create/edit flows.

\- No new live `/deals/\[id]` detail route.

\- No global search expansion.

\- No live lead creation, lead status changes, routing-event writes, dealer-order quota/delivery mutation, or pacing-engine mutation from simulator previews.

\- No simulator product route, dashboard widget, command-palette action, CSV import/apply integration, background batch job, or scenario persistence.

\- No routing reassignment, fairness weighting changes, dealer capacity calendar/window model, AI narrative generation, geocoding, or external enrichment.

\*\*Sprint 54 — Routing Fairness Readiness\*\*

Goal: add deterministic read-only routing fairness and explanation packets for existing routing/simulator data without changing live assignment, pacing, or route boundaries.

| Feature | Owner | Status | Acceptance summary |
|---|---|---|---|
| S54-F1 — Routing fairness metric contracts | codex | done | Server-side contracts define deterministic fairness/explanation metrics for existing routing and simulator data, including pace gap, quota saturation, lead-quality proxy, SLA-risk indicators, and explicit no-write/no-engine-change safety flags. Metrics do not mutate records, alter live routing, persist scenarios or snapshots, call providers, or add UI/routes. |
| S54-F2 — Routing fairness review packets | codex | done | Review packets compose S54-F1 metrics into bounded aggregate and row-level summaries with deterministic issue counts, explanation reasons, and representative samples for later operator use. Packets remain read-only and do not change routing decisions, dealer-order delivery, pacing calculations, lead statuses, or external enrichment. |
| S54-F3 — Routing fairness operator surface | codex | done | Existing CRM surfaces expose the S54-F2 fairness summary and representative detail with focused unit/e2e coverage. The surface adds no new product route and must not add mutation controls, dashboard widgets, command-palette actions, global search expansion, routing execution, or pacing-engine changes. |

\*\*Sprint 54 non-goals\*\* (carry forward permanent scope boundaries plus routing-fairness-specific exclusions):

\- No authentication, permissions, or multi-tenancy.

\- No deployment configuration.

\- No external AI provider integration.

\- No geocoding or territory polygons.

\- No default switch from SQLite to Postgres.

\- No persistent forecast scenarios.

\- No dealer order or routing area create/edit flows.

\- No new live `/deals/\[id]` detail route.

\- No global search expansion.

\- No routing algorithm changes, reassignment behavior changes, fairness weighting changes, or pacing-engine mutation.

\- No dealer capacity calendar/window model, order quota edits, area coverage edits, lead status expansion, or B2B lead conversion flow.

\- No persistent routing/pacing snapshots, saved fairness history, scenario persistence, background jobs, external enrichment, Salesforce integration, RAG/vector search, AI narrative generation, provider credentials, or network calls.

\*\*Sprint 55 — Dealer Capacity Readiness\*\*

Goal: add deterministic read-only dealer capacity window planning for routing simulation without changing live assignment, pacing, persistence, or route boundaries.

| Feature | Owner | Status | Acceptance summary |
|---|---|---|---|
| S55-F1 — Dealer capacity window contracts | codex | done | Server-side contracts define deterministic hypothetical dealer capacity windows, blackout dates, and daily caps for routing simulation inputs with validation metadata and explicit no-write/no-live-routing safety flags. Contracts add no persistence, schema changes, routes, UI, dealer-order edits, area edits, or external services. |
| S55-F2 — Capacity-aware routing simulation evaluator | codex | done | The existing read-only routing simulator can apply hypothetical capacity windows to lead batches and explain capacity-related eligibility, blocking, and overflow outcomes. Evaluation must not mutate live routing decisions, dealer-order delivery, pacing calculations, lead statuses, persisted scenarios, or routing events. |
| S55-F3 — Capacity window operator surface | codex | done | Existing CRM surfaces expose the S55-F2 capacity-aware simulation result with focused unit/e2e coverage and clear no-write flags. The surface adds no new product route and must not add mutation controls, dashboard widgets, command-palette actions, global search expansion, routing execution, or pacing-engine changes. |

\*\*Sprint 55 non-goals\*\* (carry forward permanent scope boundaries plus dealer-capacity-specific exclusions):

\- No authentication, permissions, or multi-tenancy.

\- No deployment configuration.

\- No external AI provider integration.

\- No geocoding or territory polygons.

\- No default switch from SQLite to Postgres.

\- No persistent forecast scenarios.

\- No dealer order or routing area create/edit flows.

\- No new live `/deals/\[id]` detail route.

\- No global search expansion.

\- No persistent dealer capacity calendar/window model, blackout history, capacity history, routing/pacing snapshots, saved simulator scenarios, or background jobs.

\- No live routing algorithm changes, routing reassignment behavior changes, dealer-order quota/delivery mutation, lead status expansion, routing-event writes, or pacing-engine mutation.

\- No Salesforce integration, external enrichment, provider credentials, network calls, RAG/vector search, AI narrative generation, CSV import/apply integration, dashboard widgets, command-palette actions, or dedicated capacity product route.

