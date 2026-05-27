\# PLAN.md



\## 1. Document Control



| Field | Value |

|---|---|

| Version | 2.55B |

| Last updated | 2026-05-27 |

| Active sprint | Sprint 49 S49-F1/S49-F2/S49-F3 queued |

| CRM-CONTRACT.md version | Present at repo root on this branch. Until merged everywhere, branches without it treat `README.md`, `PLAN.md`, and `docs/decisions.md` as interim references and must not invent a replacement product contract. |

| Editor | Collaborative. Agents may edit this file when the current prompt or repo work calls for it. |

| Continuous | ON |



\## 2. Source of Truth Hierarchy



When two sources disagree, the higher wins:



1\. Local PowerShell gate output (§9)

2\. The current run prompt (authoritative for assigned feature, branch, and any explicit one-run scope exception)

3\. `PLAN.md` and `CRM-CONTRACT.md`

4\. Per-agent `SUMMARY.<agent>.md` and `BLOCKERS.<agent>.md`

5\. IFT recommendations from chat LLMs

6\. `docs/decisions.md` (historical reference; not binding unless re-promoted into §17)



If the current prompt conflicts with file ownership or a durable rule in this plan, treat the prompt as the active scope for this run, document the exception in SUMMARY/BLOCKERS when material, and keep moving. IFT can propose changes to (3). It cannot override (1). Agents may edit (3) when the prompt or repo work calls for it.



\## 3. Execution Topology And Agent Roster



The current worktree path decides whether ownership zones are mandatory:



\- `C:\\dev\\salesforce-lite-crm` is the single-agent root. If an agent is working there, assume no other implementation agent is active. The agent may edit any repo file needed for the current prompt, regardless of historical owner assignment. Product guardrails, `CRM-CONTRACT.md`, and the local gate still apply.

\- Agent-specific worktrees are parallel mode. If an agent is working from `C:\\dev\\salesforce-lite-crm-codex`, `C:\\dev\\salesforce-lite-crm-claude`, `C:\\dev\\salesforce-lite-crm-gemini`, `C:\\dev\\salesforce-lite-crm-grok`, or Git Bash path `/c/dev/salesforce-lite-crm-grok`, multiple agents may be active and §5 ownership zones are mandatory.

\- The root path is not the Codex parallel worktree. Use `C:\\dev\\salesforce-lite-crm-codex` when Codex participates in a multi-agent fleet.



This table records configured worktree paths. It is not proof that the directories currently exist on disk.



| Agent / mode | Model | Worktree | Branch prefix | Git identity | Report files |

|---|---|---|---|---|---|

| Single-agent root | active CLI agent | `C:\\dev\\salesforce-lite-crm` | current branch or prompt-specified branch | repo-configured | active agent's report files |

| Codex | GPT-5.5 (Codex CLI) | `C:\\dev\\salesforce-lite-crm-codex` | `codex/` | repo-configured | `SUMMARY.codex.md`, `BLOCKERS.codex.md` |

| Claude | Anthropic (Claude Code) | `C:\\dev\\salesforce-lite-crm-claude` | `claude/` | repo-configured | `SUMMARY.claude.md`, `BLOCKERS.claude.md` |

| Grok | xAI (Grok CLI) | `C:\\dev\\salesforce-lite-crm-grok` (`/c/dev/salesforce-lite-crm-grok` in Git Bash) | `grok/` | repo-configured | `SUMMARY.grok.md`, `BLOCKERS.grok.md` |

| Gemini | Google (Gemini CLI) | `C:\\dev\\salesforce-lite-crm-gemini` | `gemini/` | repo-configured | `SUMMARY.gemini.md`, `BLOCKERS.gemini.md` |



Roster rules:



\- In single-agent root mode, ownership zones are advisory only and the active agent may make repo-wide changes needed to keep the project coherent.

\- In parallel mode, each agent works in its own local worktree and pushes only to branches under its own prefix.

\- If a listed parallel worktree does not exist at the expected path, create it when feasible or file a `dependency` blocker per §10 with the exact missing path. Missing parallel worktrees are not blockers for a single-agent root run.

\- No agent rebases `main`, force-pushes, amends pushed commits, or merges another agent's branch.

\- Update this table in the same change that intentionally changes a worktree, branch prefix, or report filename.

\- Worktree setup, inspection, and recovery commands live in `docs/WORKTREE-SETUP.md` and `scripts/check-worktrees.ps1`. Do not create or overwrite worktrees unless branch names are defined here or passed explicitly to the helper script.



\## 4. Current Sprint



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
| S49-F1 — Saved report definition contracts | codex | queued | Add validated server-side saved report-definition contracts for supported CRM objects, fields, filters, grouping, and chart metadata, with deterministic tests and a CRM-CONTRACT update during implementation. No UI, arbitrary SQL, custom fields, dashboard builder, new report route, external BI, scheduled delivery, or integrations are added. |
| S49-F2 — Saved report preview runner | codex | queued | Run saved definitions read-only through existing list/report/filter services and return bounded rows, aggregates, chart-ready data, and validation errors. The runner depends on S49-F1 and must not write data, use raw SQL, schedule jobs, expand search, add routes, or create import/export delivery workflows. |
| S49-F3 — Saved reports operator surface | codex | queued | Extend the existing `/reports` surface with list, build, and preview controls for saved report definitions plus focused tests/e2e coverage. The surface depends on S49-F2 and must not add a new product route, dashboard builder, custom object model, permissions workflow, provider call, or mutation side effect. |

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

\## 5. File Ownership Matrix



This matrix is mandatory only in parallel worktree mode (§3). In the
single-agent root worktree `C:\\dev\\salesforce-lite-crm`, it is advisory: the
active agent may make repo-wide changes needed to solve the current prompt
coherently. Even in single-agent mode, durable product guardrails,
`CRM-CONTRACT.md`, local-gate requirements, and report hygiene still apply.



Two \*\*shared coordination zones\*\*:



\- \*\*Shared/contract zone\*\* — referenced by all agents and IFT; edit with explicit prompt scope or a documented cross-zone reason:

&#x20; - `prisma/schema.prisma` and `prisma/schema.postgres.prisma`

&#x20; - `prisma.config.ts`

&#x20; - `lib/types/` (cross-module type contracts)

&#x20; - `CRM-CONTRACT.md`

&#x20; - `.env.example`

&#x20; - `.gitignore`

&#x20; - `package.json` `dependencies`, `devDependencies`, and `scripts` blocks

&#x20; - `package-lock.json`

&#x20; - Framework configuration files: `next.config.mjs`, `tsconfig.json`, `postcss.config.mjs`

\- \*\*Planning/decision zone\*\* — edit with explicit prompt scope or a documented planning reason:

&#x20; - `PLAN.md`

&#x20; - `docs/decisions.md`

&#x20; - The schema (not the contents) of `SUMMARY.<agent>.md` and `BLOCKERS.<agent>.md` per §13



\*\*Agent zones:\*\*



| Path / module | Owner |

|---|---|

| `lib/server/`, `lib/db/`, `lib/routing/`, `lib/forecast/`, `prisma/seed.ts` | Codex |

| `app/\*\*` (Next.js routes, pages, layouts, server actions) | Claude |

| `components/\*\*` (shared UI primitives and feature components), `app/globals.css`, `tailwind.config.ts` | Grok |

| `tests/\*\*`, `e2e/\*\*`, `scripts/\*\*`, `playwright.config.ts`, `vitest.config.ts` | Gemini |

| `SUMMARY.<agent>.md` and `BLOCKERS.<agent>.md` contents (schema per §13) | Owning agent |



`next-env.d.ts` is auto-generated by Next.js, intentionally untracked, and ignored by git. Agents do not edit, stage, or commit it. If it reappears as a tracked or staged file, treat that as a `dependency` blocker per §10 (regenerated state mismatch).



If a listed framework config file does not actually exist in the repo, the zone rule is harmless — there is nothing to edit and no blocker to file. If a file appears to match multiple zones, the more restrictive rule wins.



In parallel mode, cross-cutting feature work that requires edits in two agents' zones should be decomposed in the prompt or documented in the agent report. Agents coordinate through branches, reports, and contract files.



In parallel mode, if an agent finds it cannot complete its feature without touching another zone, the correct action is: keep the edit minimal, document the cross-zone reason in SUMMARY/BLOCKERS, and proceed when the current prompt makes the need clear. See §10. In single-agent root mode, no cross-zone blocker is needed solely because files span historical owner zones.



\## 6. Execution Loop



Every CLI agent runs this on every prompt. No exceptions.



0\. Check STOP gate. If a file named `STOP` exists at the worktree root, file or update a BLOCKERS entry of type `dependency` recording the STOP, rewrite SUMMARY with Status: blocked, commit report-only per §6 step 12, push if safe, and exit. The supervisor (if used) is responsible for polling `origin/main` for a remote STOP signal; agents only check the local worktree.

1\. Read `PLAN.md` §§1–11 and `CRM-CONTRACT.md` (or its interim substitutes per §1) in full.

2\. Determine execution topology from the current worktree path per §3. If the path is `C:\\dev\\salesforce-lite-crm`, run in single-agent root mode with full repo access. If the path is one of the agent-specific worktrees, run in parallel mode and enforce §5 ownership zones.

3\. Identify your active feature in §4. If status is not `active` or `queued` for you, treat the current prompt as the run scope and note the mismatch in SUMMARY/BLOCKERS.

4\. Confirm the local worktree exists and is an allowed path from §3 for the detected topology. If a required parallel worktree is missing, create or use the best available worktree when feasible; otherwise file a BLOCKERS entry per §10 (type: `dependency`). A missing parallel worktree does not block a single-agent root run.

5\. Run `git status --short` in your worktree. If unexpected uncommitted files exist (anything not in `.gitignore` that you did not introduce in this prompt), record the listing, avoid overwriting those paths, and proceed around them when possible.

6\. In parallel mode, confirm every file you intend to touch is in your zone per §5. If any file is in another agent's zone or a shared coordination zone, keep the edit minimal, document the reason, and proceed when needed for the assigned work. In single-agent root mode, this check is advisory and should not block repo-wide fixes.

7\. Execute the assigned work.

8\. Run the local gate per §9 — full sequence or change-type subset as appropriate. If it fails, follow the gate-failure policy in §9 before deciding whether a `gate` blocker is needed.

9\. If checks pass and implementation files changed, commit the implementation work per §7. Record the implementation commit SHA(s).

10\. Rewrite `SUMMARY.<agent>.md` per the schema in §13 (full overwrite, not append). `Commits this prompt` records the implementation commit(s) from step 9, or `none`.

11\. Rewrite `BLOCKERS.<agent>.md` per the schema in §13. If no active blockers, the file still exists with an empty `Active blockers` table.

12\. Commit changed report files as a separate report-only commit per §7. This report-only commit must not list itself in `Commits this prompt`.

13\. Push to your branch.

14\. Stop after the assigned work unless the current prompt asks you to continue into the next feature.



Sprint quiescence: if your assigned feature is `done` and no further feature is queued for you in §4, rewrite SUMMARY with `Next action: idle / awaiting next PLAN scope`, leave BLOCKERS empty unless a real blocker exists, commit report-only if needed, and exit. Do not invent the next sprint.



If a gate failure remains unresolved after the §9 repair-first policy and report files can be staged without staging failed implementation changes, commit only the report files and push that report-only commit. Leave unresolved failed implementation changes uncommitted unless the current prompt explicitly instructs otherwise. If even the report-only commit/push is blocked, record why in `BLOCKERS.<agent>.md` if possible and stop.



On the next prompt, the uncommitted implementation paths from a still-open `gate` blocker satisfy step 5's "not introduced in this prompt" check when those paths match the Evidence list of the open `gate` blocker or the current prompt otherwise makes them in scope. Do not file a duplicate `gate` blocker; keep the existing one open and note in `BLOCKERS.<agent>.md` whether the dirty state changed.



Edge cases that look novel resolve to a named section when possible. If no section covers it, make the smallest reversible call, document it, and continue.


## 6A. Continuous / Unattended Mode
Default:
6 step 13 remains in force. Agents stop after assigned work unless the current prompt explicitly asks them to continue into the next feature.

Continuous Mode:
When `Continuous: ON` is present in 1 Document Control, or when the active manager prompt explicitly says `FULL AUTONOMY`, `UNATTENDED`, `OVERNIGHT`, or `CONTINUE-UNTIL-STOPPED`, 6 step 13 is replaced with:
After the required gate/checks, report rewrites, report commit, and push, select the next ready task from 4 or the active manager queue, assign it to the correct owner/worktree, and repeat the Execution Loop without asking for human confirmation.

Token usage is not a stopping condition. Do not set or respect artificial token, cost, turn, or iteration caps unless the user explicitly adds one in the current prompt.

Stop only on:
1. queue empty;
2. user turns Continuous OFF or interrupts with a stop instruction;
3. CLI/session/context/provider quota exhausted;
4. required credential, login, payment, account approval, or external service unavailable;
5. local gate remains red after documented repair attempts;
6. no independent safe task remains after a blocker;
7. next action would require destructive or irreversible work;
8. force-push, hard reset, broad deletion, secret exposure, or main-branch rewrite would be required;
9. next task would expand scope beyond PLAN.md, CRM-CONTRACT.md, or the active queue.

When a stop condition is reached, write the reason to BLOCKERS/SUMMARY. If safe, set `Continuous: OFF`; otherwise create `AUTONOMY.STOP` with the reason.

Ownership zones remain in force only for parallel worktree mode. CRM-CONTRACT.md invariants, report requirements, hook policies, and local-gate authority remain in force in every topology.



\## 7. Commit \& Branch Protocol



\*\*Branch naming:\*\* `<prefix>sprint-<id>-<feature-slug>`



Examples: `codex/sprint-4-demo-seed-tuning`, `claude/sprint-4-route-visual-qa`.



\*\*Implementation commit message format:\*\*

```text

\[<agent>] <feature-id>: <subject line, imperative, ≤72 chars>



<optional body, wrapped at 80 chars, explaining why not what>

```



Example: `\[codex] S4-F1: tune seed data for Vancouver routing demo`



When the feature claims runtime behavior, the implementation commit body records the required gate/check run line and exit code.



\*\*Report-only commit message format:\*\*

```text

\[<agent>] <feature-id>: update reports

```



A report-only commit may include only that agent's `SUMMARY.<agent>.md` and `BLOCKERS.<agent>.md`. It is made after report rewrite and after any implementation commit for the prompt.



\*\*Commit cadence:\*\* atomic. One logical implementation change per commit. Multiple implementation commits per prompt are fine and preferred over a single fat commit. Each prompt produces at most one report-only commit, ordered after the implementation commit(s) and before push.



\*\*Never:\*\*

\- Rebase or force-push `main` or any branch you do not own.

\- Amend a commit you have already pushed.

\- In parallel mode, edit a file outside your zone (§5) without documenting the
  §10 reason. In single-agent root mode, zones are advisory.

\- Merge between agent branches or into `main` without explicit current-prompt scope.

\- Make broad edits to `PLAN.md`, `CRM-CONTRACT.md`, or `docs/decisions.md` without explicit current-prompt scope.

\- Commit generated local database files, build artifacts, logs, or screenshots unless explicitly instructed.

\- Include implementation files in a report-only commit.



\## 8. Definition of Done



Every feature must satisfy all of the following before an agent may mark it `done`:



\- Local gate is green (§9). The agent has run the required check or gate subset locally and recorded the run line and exit code in the implementation commit message body.

\- `SUMMARY.<agent>.md` reflects the completed feature, and any implementation commit short SHA(s) from this prompt are recorded in its `Commits this prompt` field.

\- `BLOCKERS.<agent>.md` reflects current blocker state, even when empty.

\- Both report files are committed via the §6 step 12 report-only commit, or `BLOCKERS.<agent>.md` explains why they could not be committed.

\- In parallel mode, cross-zone or shared coordination edits are minimal and
  documented. In single-agent root mode, repo-wide scope is summarized in
  `SUMMARY.<agent>.md`.

\- `CRM-CONTRACT.md` invariants are honored (no schema drift, no removed types, no renamed exports without a contract update).

\- \*\*If `CRM-CONTRACT.md` is absent, no hidden product contract was invented in this feature's code or tests.\*\* Demo-tuning work uses existing routes, schema, and routing/forecast/analyst logic as-is; new domain rules are documented where they are introduced.

\- Test coverage matches the acceptance criteria in §4. Adding a feature without a test is not done.



An agent's self-report of `done` is supported by the local gate and remains reviewable after merge.



\## 9. Local Gate (Authoritative)



The gate is a PowerShell sequence using only scripts present in `package.json` plus standard Prisma and Playwright setup. The repo currently exposes:



```text

postinstall      -> node scripts/ensure-sqlite-db.mjs   (runs automatically via npm install)

dev              -> next dev

build            -> next build

lint             -> eslint . --max-warnings=0

typecheck        -> tsc --noEmit --pretty false

seed             -> tsx prisma/seed.ts

test             -> vitest run --maxWorkers=1

test:e2e         -> npm run seed && playwright test

prisma:postgres  -> node scripts/prisma-postgres.mjs

autonomy:overnight -> powershell -ExecutionPolicy Bypass -File scripts/autonomy-loop.ps1

autonomy:watchdog -> powershell -ExecutionPolicy Bypass -File scripts/start-codex-overnight.ps1
```



Agents may claim `lint` or `typecheck` only when the matching `package.json` scripts exist and the exact commands have run. There is no `format` script unless `package.json` later adds one.



\*\*Full local setup/gate from repo root:\*\*



```powershell

npm install

if (-not (Test-Path .env)) { Copy-Item .env.example .env }

npx prisma generate

npx prisma db push

npm run seed

npm run lint

npm run typecheck

npm run test

npm run build

npx playwright install chromium

npm run test:e2e

```



Run commands sequentially. Gate failure is not automatically a stop condition. In max-YOLO mode, first attempt reasonable repo-local fixes within the current scope. Re-run the failing command or the relevant gate subset. File a blocker only when the failure cannot be resolved without outside information, unsafe/destructive action, missing credentials, unavailable services, unclear product decisions, or broad out-of-scope changes. Same-command repair cap: a single prompt may make at most 3 repair attempts for the same failing command. After the third failure, file or update a `gate` blocker and stop. The cap is per-command, not per-prompt; multiple distinct failing commands each have their own counter.

When filing a `gate` blocker, capture the failing command, exit code, the relevant final output in `BLOCKERS.<agent>.md` (Evidence column), and the list of uncommitted implementation paths left in the worktree. Do not create or commit local log files unless the current prompt explicitly instructs it or the target path is already covered by `.gitignore`.



\*\*Minimum required checks by change type:\*\*



| Change type | Minimum checks before claiming done |

|---|---|

| Report-only update (SUMMARY/BLOCKERS) | Markdown review and `git status --short`. |

| Pure docs update (no runtime claims) | Markdown review and `git status --short`; no runtime gate unless docs claim runtime behavior. |

| UI/component visual polish | `npm run build`; run `npm run test:e2e` if demo path may be affected. |

| Route/page behavior | `npm run test`, `npm run build`; run `npm run test:e2e` if demo path is affected. |

| Business logic | `npm run test`, `npm run build`; add or update tests where practical. |

| Seed data | `npx prisma generate`, `npx prisma db push`, `npm run seed`, `npm run test`, `npm run build`; run `npm run test:e2e` if demo path is affected. |

| E2E / demo flow | `npm run seed`, `npm run build`, `npx playwright install chromium`, `npm run test:e2e`. |

| Package/config/script change | Full local setup/gate (sequence above). |



When in doubt, run the full gate. The change-type subset is a floor, not a cap — if a "UI polish" change touches business logic, escalate to the route/page or business-logic row.



\*\*This gate is the only authority that can declare a feature passed or a merge safe.\*\* Not IFT. Not any chat LLM. Not an agent self-report.



If the gate fails on `main` after a merge, handle it through a rollback, hotfix, or new IFT round as directed by the current prompt or repo workflow. Agents do not act on `main` without explicit scope. If new gate steps are added to the repo later, they are added to this section before agents start running them.



\## 10. Conflict \& Boundary Policy



In parallel mode, an agent's work hits another agent's zone, the shared/contract zone, or the planning/decision zone; in any topology, a precondition from §3 or §6 fails, or the current prompt conflicts with a durable rule in this plan. The agent does this, in order:



1\. \*\*Contain the risky edit immediately.\*\* Keep it minimal, avoid overwriting unrelated work, and prefer reversible changes.

2\. \*\*File a BLOCKERS entry\*\* per §13 with:

&#x20;  - the exact file path or precondition,

&#x20;  - the blocker type, picking exactly one of:

&#x20;    - `ownership` — in parallel mode, work requires editing another agent's zone or a shared coordination file (§5)

&#x20;    - `gate` — a local gate command or required check (§9) failed

&#x20;    - `contract` — `CRM-CONTRACT.md` is missing or ambiguous on a load-bearing product decision

&#x20;    - `dependency` — missing worktree, missing path, missing setup prerequisite, or a package, script, or config requirement not yet represented in the repo

&#x20;  - one-line description,

&#x20;  - evidence (command output, conflicting instruction text, error message, path list, or dirty-state listing for a `gate` blocker),

&#x20;  - what needs to be resolved,

&#x20;  - what the agent will work on safely while blocked.

3\. \*\*Keep work moving where safe.\*\* In parallel mode, do not silently reproduce a cross-zone change in your own zone; either make the needed edit directly with documentation or leave a blocker. In single-agent root mode, make the coherent repo-wide edit directly and document the scope in SUMMARY.

4\. \*\*Resume or continue work when the current prompt, blocker evidence, or repo state provides a workable resolution.\*\*



No inter-agent merging or agent-to-agent pull requests without explicit current-prompt scope. In parallel mode, cross-zone fixes are allowed when they are the smallest direct way to complete the assigned work and are documented. In single-agent root mode, cross-zone labels are advisory and should not split one coherent fix into artificial handoffs.



\## 11. Anti-Drift Rules



\*\*For CLI agents:\*\*



\- No new architecture patterns by accident. If the existing codebase uses Prisma + Server Actions + Tailwind, you do too. Propose or document alternatives through IFT or the current prompt.

\- No new external dependencies by accident. `package.json` is in the shared/contract zone. Need a library? Add it only with explicit prompt scope or file a blocker.

\- No hidden process invention. Every action you take resolves to a numbered step in §6 (Execution Loop), a protocol named elsewhere in §§1–10, or a documented YOLO exception from the current prompt.

\- Edits to `PLAN.md`, `CRM-CONTRACT.md`, or `docs/decisions.md` stay explicit, scoped, and documented.

\- No invented script claims. Claim `lint`, `typecheck`, `format`, or other checks only when the exact `package.json` script exists and the command was run.

\- Cleanup is repo-local and conservative. Use `scripts/clean-local-artifacts.ps1` in dry-run mode first; remove only ignored/generated/local artifacts inside this repo. Leave unknown files in place and record them in BLOCKERS.



\*\*For IFT (Track B chat LLMs):\*\*



\- No overriding the local gate. A green claim from any chat LLM is not authoritative under any circumstance.

\- No hidden repo writes. IFT outputs proposals or patches; repo changes land through the normal local workflow.

\- No re-litigating decisions already logged in §17 of this file or in `docs/decisions.md`, unless either (a) new evidence is presented in the form of gate output, code, or a measurable outcome since the decision was logged, or (b) the current prompt explicitly opens the question for the current round. Re-promotion of an archived decision into §17 counts as opening the question.



\---

\*CLI agents: §§1–11 are your complete operational reference. Consult §13 when rewriting `SUMMARY` and `BLOCKERS` per §6 steps 10–12. §§12 and 14–17 are planning and maintenance context for chat LLMs and coordinating future work.\*



\---



\## 12. Purpose, Audience \& Operating Model



This file is the bridge between two tracks.



\*\*Track A — Execution.\*\* CLI agents run under the §3 topology. In
single-agent root mode, one active agent works from
`C:\\dev\\salesforce-lite-crm` with full repo access. In parallel mode, Codex,
Claude, Grok, and Gemini run in their agent-specific worktrees with ownership
zones enforced. Each reads `PLAN.md` and `CRM-CONTRACT.md` on every prompt,
executes per §§4–6, commits per §7, and writes `SUMMARY` and `BLOCKERS` per
§13. Agents run unattended. In parallel mode, they cannot see this chat or each
other.



\*\*Track B — Planning (IFT).\*\* Five chat LLMs — Claude, ChatGPT, Grok, Gemini, Meta AI — run a structured debate loop in their respective web chat surfaces. Context is pasted into each model independently, then each model's draft circulates to the others for critique across 2–4 rounds until convergence. IFT is used for load-bearing decisions: sprint scope, architecture, contested merge order, domain-rule resolution, stress-testing PLAN.md changes before commit, and reviewing agent reports for weak reasoning.



\*\*Git and reports are the sync point.\*\* Track B converges → `PLAN.md` changes land through the normal repo workflow → Track A picks them up on the next prompt. Track A produces SUMMARY/BLOCKERS → Track B incorporates them if load-bearing.



\*\*The standard Track A prompt is minimal:\*\*

```text

Read PLAN.md and CRM-CONTRACT.md. Execute Sprint <N> Feature <id>. Begin.

```



The prompt may add a single line of inline context if a blocker resolution requires it. Anything more belongs in PLAN.md or CRM-CONTRACT.md.



\*\*IFT is advisory.\*\* It cannot declare tests passed, builds green, or merges safe. Only the local gate (§9) can.



\## 13. Reporting Templates



\*\*Cadence:\*\* rewrite both files in full every prompt. Snapshot of current state, not appended log. Historical state is preserved in git. Per §6 step 12, both files are then committed in a single report-only commit before push; the report-only commit must not list itself in its own `Commits this prompt` field.



\*\*Location:\*\* root of the active worktree. In single-agent root mode this
is `C:\\dev\\salesforce-lite-crm`; in parallel mode it is the agent-specific
worktree. Example: `C:\\dev\\salesforce-lite-crm-claude\\SUMMARY.claude.md`.



\*\*Schema\*\* is contract-controlled. Agents fill in fields and keep field names, ordering, and sections stable unless the current prompt changes the template.



\### `SUMMARY.<agent>.md`



```markdown

Agent: <agent-name>

Sprint: <sprint-id>

Feature: <feature-id-or-name>

Branch: <branch-name>

Status: queued | active | done | blocked

Commits this prompt: <short-sha> — <commit-message-one-line> | none

Gate status: PASS | FAIL | NOT RUN

DoD self-check: PASS | FAIL | N/A

Timestamp: <ISO 8601>

Approximate model tokens/spend this prompt: <number or units> | unknown



\### Completed this prompt

\- <task or feature> — <one line: what was done, not what was attempted>



\### Next action

<single sentence: what this agent does on the next prompt>



\### Scope confirmation

No cross-ownership edits: YES | NO  (if NO, see BLOCKERS)

CRM-CONTRACT.md honored:  YES | NO  (if NO, see BLOCKERS)

```



`Commits this prompt` records the implementation commit(s) from §6 step 9. The report-only commit from §6 step 12 is not listed; if no implementation commit was created (e.g. a blocker-only or report-only prompt), the field is `none`.



\### `BLOCKERS.<agent>.md`



```markdown

Agent: <agent-name>

Sprint: <sprint-id>

Feature: <feature-id-or-name>

Branch: <branch-name>

Timestamp: <ISO 8601>

Escalation required: YES | NO



\### Active blockers

| # | File / module | Type | Description | Evidence | Awaiting | Safe next action |

|---|--------------|------|-------------|----------|---------|-----------------|

| 1 | <path> | ownership / gate / contract / dependency | <one line> | <error msg, path list, or dirty-state list for a gate blocker> | resolution | <what agent does while blocked> |



\### Resolved this prompt

\- Blocker #<N> resolved: <one line how>

```



If there are no active blockers, keep the table header and remove sample data rows.



`Gate status: PASS` is an agent claim, not an authorization. A clean run of the actual gate (§9) authorizes a feature. `DoD self-check` is the agent's claim against §8 and remains reviewable. Blocker `Type` values map to the definitions in §10.



\## 14. IFT Planning Protocol



\*\*When IFT is required:\*\*

\- New sprint scope.

\- Architectural or library decisions.

\- Contested merge order across agents.

\- Resolution of a recurring BLOCKERS entry that has no obvious repo-local answer.

\- Pre-commit stress test of a non-trivial `PLAN.md` change.

\- Review of an agent SUMMARY/BLOCKERS pair where the current review flags weak or evasive reasoning.



\*\*When IFT is skipped:\*\*

\- Mechanical fixes (typo, single-file refactor inside one zone).

\- Prompt-authored corrections that don't change behavior.

\- Routine merges where the gate has run green on each branch.



\*\*Round structure:\*\*

1\. Paste context and prompt to all five models independently. No model sees another's response yet.

2\. Each model produces an independent draft.

3\. Circulate the drafts (anonymized or not) to each model for critique.

4\. Each model revises only for material improvements.

5\. Repeat steps 3–4 until convergence or the round is called.



\*\*Convergence criteria:\*\*

\- No visible peer model holds an unadopted material improvement.

\- No load-bearing claim in the recommendation remains unsupported by source material or verified evidence.

\- Remaining disagreement is not load-bearing after evidence review.



Peer-model agreement is a stopping signal only when the substance is independently grounded in the task, source material, or verified evidence. Majority across peers is not, by itself, evidence. A round may close for cost or time reasons even when these criteria are not met; doing so is recorded as a run decision in §17, not as convergence.



\*\*IFT outputs:\*\*

\- Proposed `PLAN.md` diff (or new section text).

\- Rationale paragraph.

\- Alternatives rejected.

\- Open questions remaining.



If the active IFT wrapper prompt specifies a required output schema, that wrapper takes precedence over the above for the current session.



\*\*IFT does not output by default:\*\* gate pass/fail, merge execution, agent task assignment. Those belong in the execution workflow unless the current prompt explicitly asks IFT to draft them.



\## 15. GitHub Connector Policy



Track B chat LLMs reference repo state through their respective GitHub connectors or import flows. Track A does not — CLI agents have local worktrees.



\*\*Per-session standardized protocol:\*\*



\- At the start of every IFT session, connect all five chat windows to the \*\*same repo URL and the same branch/commit\*\* before the first drafting round.

\- After import, record a one-line per-model \*\*Connector Context Checklist\*\* (template below): what URL/branch/commit was loaded, what local-only context was pasted separately, and what each platform could actually reach this session. This prevents branch-desync — models debating a feature conflict while analyzing different branches or stale `main`.

\- \*\*Platform capability note.\*\* Connector and import capabilities — live code access, branch state, commit history, PR diffs, import size limits, ability to fetch raw files — change over time and vary by account tier. Do not hard-code per-vendor capabilities in this file. Verify the current capability of each chat surface at session start and record reachability in the Checklist; anything not reachable goes through pasted context.

\- Connectors and imports are \*\*read-only\*\*. IFT references file paths, diffs where available, and code. It does not commit, PR, merge, or run the app.

\- \*\*Local-only context to paste when needed\*\* (typically not surfaced by connectors): PowerShell gate output, local build results, uncommitted local changes, merge conflicts, CLI logs, SUMMARY/BLOCKERS that have not been pushed yet.

\- \*\*Re-import cadence:\*\* before each new IFT round if any Track A agent has committed since the last import.

\- \*\*No execution authority.\*\* IFT with full repo context remains advisory. Only §9 declares pass/fail.



\*\*Connector Context Checklist (paste/fill at session start):\*\*



```markdown

| Model | Context method | Repo URL | Branch/ref | Commit SHA | Local-only context pasted | Capability limits this session |

|---|---|---|---|---|---|---|

| ChatGPT | connector / pasted | <url> | <branch/ref> | <sha> | <items or none> | <what was reachable / what wasn't> |

| Claude | connector / pasted | <url> | <branch/ref> | <sha> | <items or none> | <what was reachable / what wasn't> |

| Grok | connector / pasted | <url> | <branch/ref> | <sha> | <items or none> | <what was reachable / what wasn't> |

| Gemini | import-code / pasted | <url> | <branch/ref> | <sha> | <items or none> | <what was reachable / what wasn't> |

| Meta AI | pasted / connector if available | <url> | <branch/ref> | <sha> | <items or none> | <what was reachable / what wasn't> |

```



\## 16. Sprint Backlog



Backlog items are not active sprint work. Active sprint detail is in §4. IFT uses this section to debate scope, sequence, and feasibility before an item is promoted to active status in §4. Order in this table is not a commitment to sequence. Proposed roadmap source: `docs/ROADMAP.md`; this section remains the backlog input and does not authorize roadmap implementation by itself. B-13+ entries are roadmap proposals unless §4 or the current prompt explicitly promotes them. Unlisted B-NN IDs remain unassigned.



| Backlog ID | Candidate scope | Notes |

|---|---|---|

| B-01 | Maintain `CRM-CONTRACT.md` | Present in `main`; keep it aligned when entity names, routes, statuses, registries, or adapter signatures change. |

| B-02 | Local gate script maintenance | Present in `main` as `scripts/local-gate.ps1` and `scripts/local-gate.sh`; keep both mirrored with §9. |

| B-03 | Lint/typecheck script maintenance | Present in `main`; both scripts are part of the §9 gate. |

| B-04 | Dealer order and area CRUD | Currently seeded/browsable only. Deferred. |

| B-05 | `/deals/\[id]` detail route | Replace drawer-only deal flow with a full route while preserving board drag-and-drop. README currently lists this as a limitation. |

| B-06 | Global search expansion | Current top search routes to contacts only. Deferred. |

| B-07 | Persistent forecast scenarios | Current simulator is transparent and non-persistent. Deferred. |

| B-08 | Postgres cutover readiness | SQLite remains the local default. `lib/prisma.ts` has a DATABASE_URL-based Postgres branch and `npm run prisma:postgres` performs schema-push prep, but a default-runtime cutover and CI matrix remain deferred. |

| B-09 | External AI provider integration | Deterministic local summarizer/routing/analyst remains default. Deferred. |

| B-10 | Auth, permissions, multi-tenancy | Replaces README "no authentication" limitation. Significant scope; likely spans multiple sprints when promoted. |

| B-11 | CI mirror of local gate | CI may mirror §9 but never replaces it. The local PowerShell gate stays authoritative. |

| B-12 | Deployment configuration | No deployment target or hosting workflow is in current scope. Deferred. |

| B-13 | Roadmap principle governance | Keep contract-first, deterministic-default, hermetic-gate, feature-flag, RBAC-before-agentic-writes, and eval-before-expansion rules visible in roadmap docs. |

| B-14 | Tooling hygiene | Maintain passing `lint` and `typecheck` scripts and keep generated `*.tsbuildinfo` ignored. Present in `main`; audit during Sprint 5. |

| B-15 | Roles, permissions, ownership, and sharing | Define object/action permission matrix, owner conventions, and share conventions after B-10 promotion. |

| B-16 | Organization and tenant boundary | Add org/membership convention when multitenancy is promoted; keep single-org demo mode. |

| B-17 | Products, price books, and line items | Product, PriceBook, PriceBookEntry, OpportunityLineItem; opportunity value becomes line-item rollup. |

| B-18 | Quotes and quote export | Quote and QuoteLine, draft PDF/export, later email send through a promoted provider. |

| B-19 | Events and calendar | Event model, `/calendar`, and meeting activity links. Calendar sync remains separate deferred integration work. |

| B-20 | Validation and workflow rules | Deterministic rule AST, never `eval`; assignment/workflow rules trigger through `crmClient` and log side effects. |

| B-21 | Approval processes and scheduled sweeps | Approval steps, pending approvals, stage-change gates, and hermetic catch-up jobs with injected clock. |

| B-22 | CSV import UI | Wire existing CSV helpers into an import preview UI with validation before mutation. |

| B-23 | CSV dedupe preview | Optional read-only duplicate preview before import mutation. |

| B-24 | CSV export UI | Export list-page data through existing helpers without external dependencies. |

| B-25 | AI deterministic scaffold and eval harness | Provider port, deterministic provider, recorded provider, prompt registry skeleton, and eval harness. No live external provider calls. |

| B-26 | REST/Bulk API and webhooks | API keys, object endpoints over `crmClient`, bulk import/export, local webhook test sink, and replay fixtures. |

| B-27 | Transactional email | Stub provider default, templates, and later send/log email after explicit provider promotion. |

| B-28 | Report builder | Persist report definitions: object, fields, filters, grouping, and charts. |

| B-29 | Dashboard builder | Persist dashboard cards from saved reports. |

| B-34 | Retrieval/RAG foundation | Index allowed records only after identity/RBAC/tenant filters exist. |

| B-37 | Observability and backups | Structured logs, request IDs, AI telemetry, backup/restore tests. |

| B-38 | Responsive/mobile/accessibility | Mobile pass, accessibility checks, dashboard/table usability. |

| B-39 | Custom field metadata | `FieldDefinition` plus `customFields` JSON; core fields immutable. |

| B-40 | Record types and layout-lite | Admin-configurable field sections per object/type. |

| B-41 | Service queue assignment | Queue assignment for cases with deterministic rules and audit. |

| B-42 | Service SLA timers | SLA timers with injected clock and hermetic tests. |

| B-43 | Knowledge article model | Knowledge Article model and service workflows. |

| B-47 | Roadmap canon | Add and maintain roadmap, AI roadmap, architecture, eval, and security/privacy docs; keep PLAN updates proposal-only unless explicitly promoted. |

| B-48 | QA/blocker reconciliation | Reconcile stale SUMMARY/BLOCKERS files and verify visual/test-id/demo-path blockers after recent app/component changes. |

| B-49 | Audit event model | Audit taxonomy for user, record, AI, import, routing, and workflow actions. |

| B-50 | Saved views | Saved filters, sorts, and columns per object and user/org. |

| B-51 | Filter/query compiler | Shared filter AST compiled to Prisma and reused by lists, reports, exports, and natural-language filters. |

| B-52 | Bulk actions | Assign owner, update status/stage, create tasks, export selected, and audit every action. |

| B-53 | Routing simulator | Deterministic "what would route where?" simulator using hypothetical quotas, area coverage, and lead batches. |

| B-54 | Routing fairness and explanation | Deterministic metrics for pace gap, saturation, lead quality proxy, and SLA risk; later AI narrative. |

| B-55 | Dealer capacity windows | Dealer capacity calendars, blackout windows, and daily caps. |

| B-56 | Lead disposition and SLA | Routed, accepted, contacted, won/lost, returned, stale; escalation tasks. |

| B-57 | Pacing snapshots | Persist monthly/daily routing and pacing snapshots for trend reports. |

| B-58 | Campaign members and influence | CampaignMember, campaign ROI, and opportunity influence-lite. |

| B-59 | Prompt registry | Prompt ID, version, owner, input schema, output schema, and eval fixture IDs. |

| B-60 | Structured AI outputs | Zod validation for every AI output; invalid output is recoverable UI error. |

| B-61 | AI run log | User/org, prompt ID, provider/model, hashes, token/cost, result, and action outcome. |

| B-62 | AI action registry | Explicit CRM tools such as create task, log activity, draft email, update stage, and assign lead. |

| B-63 | RAG service | Tenant/RBAC-filtered retrieval over allowed records only. |

| B-64 | AI eval suite | Golden tests for summaries, routing explanations, scoring, natural-language filters, RAG answers, and tool plans. |

| B-65 | AI cost/privacy controls | Per-org limits, provider policy, redaction, and prompt-injection defenses. |

| B-66 | Gmail/Graph/calendar sync | Mock-only gate; token and secrets design first. |

| B-67 | Salesforce import | CSV mapping first, API sync later. |

| B-68 | Dependency and security modernization | Track future `npm audit` findings and package-major upgrade paths without weakening the local gate. Sprint 34 completed the non-major refresh, safe transitive containment, and Vitest 4 compatibility pass; current Codex evidence reports `npm audit --json` at 0 vulnerabilities. |



\## 17. Decision Log



\*\*Retention policy.\*\* PLAN.md §17 is the Recent Decision Log. It retains:



\- all decisions from the active sprint,

\- all decisions from the prior two completed sprints,

\- any still-active architectural, ownership, workflow, or contract decision that remains in force until changed.



Older decisions move to `docs/decisions.md` at the close of each sprint, when a completed sprint drops out of the prior-two window. Archived decisions are reference history only; they do not bind agents or IFT unless explicitly re-promoted into §17 as an active rule. No separate `DECISIONS-ARCHIVE.md` is created; that name is reserved for a future migration only if `docs/decisions.md` is later deprecated by explicit project decision.



\*\*Entry format:\*\*



```markdown

\### YYYY-MM-DD — IFT Round X (or "Run decision")

\*\*Decision:\*\* <one-line summary>

\*\*Rationale:\*\* <why this decision was made>

\*\*Alternatives rejected:\*\* <other options considered and why rejected>

\*\*Sections changed:\*\* <PLAN.md § references and/or CRM-CONTRACT.md references>

\*\*Open questions handled:\*\* <questions closed by this decision, or "none">

```



\---

\### 2026-05-24 — Run decision (Sprint 33 and roadmap readiness)

\*\*Decision:\*\* Record S33-F1 and S33-F2 as done, keep S33-F3 as the next queued loop target, and add B-68 for dependency/security modernization after repo-local and internet-backed audit review.

\*\*Rationale:\*\* S33-F1 has an implementation and report commit on `main`; the S33-F2 local service/test files pass the full local gate and match the queued Sprint 33 scope. `npm audit` still reports moderate transitive issues, but the available fixes involve package-major movement and should be handled as a planned modernization pass after the current feature loop rather than forced during a readiness update.

\*\*Alternatives rejected:\*\* Leaving S33-F2 as untracked dirty state before launching the loop, because the loop pre-flight would treat it as unexpected and may stash valid sprint work; running `npm audit fix --force`, because that would downgrade or major-upgrade core toolchain packages without a targeted compatibility pass.

\*\*Sections changed:\*\* §1, §4, §16, §17; `CRM-CONTRACT.md`; roadmap/control/backlog docs; Codex reports.

\*\*Open questions handled:\*\* Current Sprint 33 progress, next loop target, and how to track dependency advisories discovered during readiness review.



\### 2026-05-22 — Run decision (execution topology)

\*\*Decision:\*\* Make worktree path the topology switch: `C:\\dev\\salesforce-lite-crm` is single-agent full-repo mode, while `C:\\dev\\salesforce-lite-crm-codex`, `C:\\dev\\salesforce-lite-crm-claude`, `C:\\dev\\salesforce-lite-crm-grok`, `/c/dev/salesforce-lite-crm-grok`, and `C:\\dev\\salesforce-lite-crm-gemini` are parallel multi-agent mode with ownership zones enforced.

\*\*Rationale:\*\* Some fixes require moving across app, component, service, test, script, and documentation boundaries together. In the root worktree, serializing work through one active agent prevents parts of the same project from drifting too far ahead while preserving the existing multi-agent workflow when dedicated worktrees are used.

\*\*Alternatives rejected:\*\* Keeping Codex on the repo root in parallel mode, because it makes path-based intent ambiguous; always enforcing ownership zones, because it blocks coherent repo-wide fixes during single-agent runs; removing the ownership matrix entirely, because it is still useful when multiple agent-specific worktrees run in parallel.

\*\*Sections changed:\*\* §1, §3, §5, §6, §8, §13, §17; `AGENTS.md`; worktree, autonomy, prompt, and project-control docs/scripts.

\*\*Open questions handled:\*\* How agents decide whether ownership zones are advisory or mandatory; where parallel Codex work should run; how to avoid cross-zone blocking during single-agent root work.



\### 2026-05-20 — Run decision (roadmap canon)

\*\*Decision:\*\* Adopt the expanded roadmap canon as proposal-only planning material and make Sprint 5 the recommended next sprint without activating feature implementation.

\*\*Rationale:\*\* The roadmap consolidates contract-first rules, deterministic defaults, hermetic gate requirements, required promotion decisions, AI safety sequencing, and B-NN grounded backlog IDs while preserving `CRM-CONTRACT.md` as the shipped product contract.

\*\*Alternatives rejected:\*\* Promoting Sprint 5 implementation immediately in §4, because the current prompt asks to add roadmap material and the roadmap's own B-47 scope says PLAN updates should remain proposal-only; changing `CRM-CONTRACT.md`, because no implemented entity, route, model, feature flag, adapter signature, schema, or seed behavior changed.

\*\*Sections changed:\*\* §1, §4, §16, §17; `docs/ROADMAP.md`; `docs/AI-ROADMAP.md`; `docs/ARCHITECTURE.md`; `docs/EVALS.md`; `docs/SECURITY-PRIVACY.md`.

\*\*Open questions handled:\*\* Sprint 5 recommended scope, required promotion decisions, AI safety sequencing, and roadmap companion-document ownership.



\### 2026-05-20 — Run decision (local-gate prose)

\*\*Decision:\*\* Align PLAN local-gate prose with the current package validation scripts.

\*\*Rationale:\*\* The current prompt, `package.json`, `docs/LOCAL-GATE.md`, and `scripts/local-gate.ps1` all include `npm run lint` and `npm run typecheck`, while PLAN §9 and §11 still contained older warnings that those scripts did not exist.

\*\*Alternatives rejected:\*\* Leaving the stale warnings in place would keep future agents choosing between contradictory gate instructions; removing lint/typecheck from the actual gate would weaken current validation and conflict with higher-priority repo-local evidence.

\*\*Sections changed:\*\* §1, §9, §11, §16, §17.

\*\*Open questions handled:\*\* Whether agents may run and report `lint` and `typecheck` when the scripts exist in the current tree.



\### 2026-05-18 — Run decision

\*\*Decision:\*\* Bootstrap R8 bounded executor and R9 managed autonomy queue wrapper in one Codex run.

\*\*Rationale:\*\* The executor substrate and manager wrapper are complementary: R8 supplies bounded launches, prompt snapshots, STOP controls, status/log paths, and static Sprint 4 prompts, while R9 adds validated queue dispatch, model availability, failover handoffs, reviewer-only support, and IFT proposal drafting without automating merges or IFT approval.

\*\*Alternatives rejected:\*\* Landing R8 and R9 in separate prompts for this run, because the current prompt explicitly authorizes a combined bootstrap; automating IFT finalization or merges, because human approval remains the safety boundary; committing runtime run-state, because supervisor state belongs outside the repo or under ignored paths.

\*\*Sections changed:\*\* §6, §9, §13, §17.

\*\*Open questions handled:\*\* How unattended agents stop, how same-command repairs are bounded, how a completed sprint quiesces, how optional spend reporting is recorded, and how the combined R8/R9 bootstrap is captured without duplicate decision entries.



\### 2026-05-17 — IFT Round 9

\*\*Decision:\*\* Adopt canonical `SUMMARY.<agent>.md` and `BLOCKERS.<agent>.md` templates.

\*\*Rationale:\*\* No repo templates existed. New schemas separate gate status from agent claims, require safe next actions, and keep reports as single-prompt snapshots with history in git.

\*\*Rejected:\*\* Nonexistent prior format; append-log reports.

\*\*Sections changed:\*\* §13.

\*\*Handled:\*\* R4 §13 templates.



\### 2026-05-17 — IFT Round 9

\*\*Decision:\*\* Use tiered Decision Log retention: §17 keeps active sprint, prior two completed sprints, and active rules; older entries move to `docs/decisions.md`.

\*\*Rationale:\*\* Prevents prompt bloat while preserving full history in git.

\*\*Rejected:\*\* Append-only forever; entry-count cap; top-level `DECISIONS-ARCHIVE.md`.

\*\*Sections changed:\*\* §17, §5, §11.

\*\*Handled:\*\* R4 §17 retention.



\### 2026-05-17 — Run decision

\*\*Decision:\*\* Store `SUMMARY.<agent>.md` and `BLOCKERS.<agent>.md` at each worktree root and rewrite them every prompt.

\*\*Rationale:\*\* Root paths are consistent and visible; git preserves history.

\*\*Rejected:\*\* `reports/` subdirectory; append-with-anchors.

\*\*Sections changed:\*\* §13.

\*\*Handled:\*\* R10 §13 path/cadence.



\### 2026-05-17 — IFT Round 21 (Claude)

\*\*Decision:\*\* Add Sprint 4 non-goals to §4 and a "no invented product contract if `CRM-CONTRACT.md` is absent" rule to §8.

\*\*Rationale:\*\* Scope and contract guards needed to live in agent-critical sections.

\*\*Rejected:\*\* Relying only on §11/§16; adding a §9 gate table at this round.

\*\*Sections changed:\*\* §4, §8, §17.

\*\*Handled:\*\* Scope creep; contract-gap invention.



\### 2026-05-17 — IFT Round 23 (Claude)

\*\*Decision:\*\* Set §3 git identity to `repo-configured`; replace speculative Sprint 5–8 backlog with README-based `B-NN` IDs; keep IFT ANSWER to the PLAN.md deliverable only.

\*\*Rationale:\*\* Removes fabricated canonical details and speculative roadmap framing.

\*\*Rejected:\*\* Keeping `dealermedia.local`; dropping §16.

\*\*Sections changed:\*\* §3, §16, §17.

\*\*Handled:\*\* Fabricated identity; speculative backlog; ANSWER boundary.



\### 2026-05-17 — IFT Round 24 (Claude)

\*\*Decision:\*\* Remove stale worktree-status column; add missing-worktree blocker rule; use verified generic §4 feature names; check worktree existence before `git status`; add proportional §9 gate table; reorder §16 neutrally.

\*\*Rationale:\*\* Avoids stale state, unverifiable UI claims, ambiguous git errors, and excessive gate burden.

\*\*Rejected:\*\* Timestamped worktree status; unverifiable UI names; full gate for every change; treating reporting as Sprint 4 product work.

\*\*Sections changed:\*\* §1, §3, §4, §6, §9, §16, §17.

\*\*Handled:\*\* Worktree staleness; UI assertion risk; missing-path behavior; gate proportionality.



\### 2026-05-17 — IFT Round 25 (Claude)

\*\*Decision:\*\* Define blocker types in §10: `ownership`, `gate`, `contract`, `dependency`; map missing worktree/path/setup/package/script/config issues to `dependency`; cross-reference from §13.

\*\*Rationale:\*\* Prevents inconsistent blocker classification across agents.

\*\*Rejected:\*\* New `worktree` type; implicit mapping; moving definitions to §13.

\*\*Sections changed:\*\* §1, §3, §6, §10, §13, §17.

\*\*Handled:\*\* Blocker-type ambiguity.



\### 2026-05-17 — IFT Round 26 (Claude)

\*\*Decision:\*\* Add current-run prompt to §2 hierarchy with explicit-exception rule; expand §5 shared/contract files to include `package-lock.json` and framework configs; name `node scripts/ensure-sqlite-db.mjs` in §9; add global search as a §4 non-goal and B-12 deployment backlog item.

\*\*Rationale:\*\* Closes gaps around one-run exceptions, config ownership, postinstall clarity, and global-search drift.

\*\*Rejected:\*\* Collapsing config zones; adding prescriptive §14 IFT schema; only mentioning global search in §11.

\*\*Sections changed:\*\* §1, §2, §4, §5, §9, §10, §16, §17.

\*\*Handled:\*\* Prompt exceptions; config ownership; postinstall transparency; global-search boundary.



\### 2026-05-17 — IFT Round 27 (Claude)

\*\*Decision:\*\* Split §6 into implementation commit and separate report-only commit. Gate failures skip implementation commit but still rewrite/commit reports. §7 adds report-only commit format; §8 requires implementation SHAs in SUMMARY and report commit status; §13 clarifies `Commits this prompt` excludes the report-only commit.

\*\*Rationale:\*\* Ensures reports are committed every prompt, including failed gates, without mixing implementation and reporting changes.

\*\*Rejected:\*\* Combining implementation and report commits; pushing without report commits; changing §17 retention; collapsing §5 zones; adding §14 fallback schema.

\*\*Sections changed:\*\* §1, §6, §7, §8, §13, §17.

\*\*Handled:\*\* Report commit ordering; gate-failure report path.



\### 2026-05-17 — IFT Round 28 (Claude)

\*\*Decision:\*\* Three repo-verified corrections. Add `prisma.config.ts` to the shared/contract zone (verified present at repo root). Add `.gitignore` to the shared/contract zone. Remove the false `.\\gate-output\\` gitignored claim from §9 — verified absent from `.gitignore`, which lists only `node\_modules`, `.next`, `dist`, `coverage`, `playwright-report`, `test-results`, `.env`, `.env.local`, `dev-server.log`, and the `prisma/dev.db\*` family. Gate-failure evidence now lives directly in `BLOCKERS.<agent>.md`. Add a §5 row clarifying that report-file \*contents\* are owned by the producing agent while the \*schema\* follows §13, and a note that `next-env.d.ts` is Next.js auto-generated and not subject to ownership rules.

\*\*Rationale:\*\* Closes a real gap (a load-bearing config file with no zone) and removes a false assertion (gitignored gate-output path). The report-file contents-vs-schema distinction was previously implicit; making it explicit prevents an agent from interpreting §5 as forbidding it from writing its own reports.

\*\*Rejected:\*\* Wide-table §5 restructuring with a new "shared shell" category (introduces ambiguity over `app/layout.tsx` without a named failure mode); dropping `lib/types/`; dropping `prisma.config.ts`; restructuring §§1–11 beyond the smallest necessary change.

\*\*Sections changed:\*\* §1, §5, §6, §7, §9, §17.

\*\*Handled:\*\* Missing `prisma.config.ts` zone assignment; false gate-output gitignore claim; implicit report-contents ownership; phantom `next-env.d.ts`.



\### 2026-05-17 — IFT Round 29 (Claude)

\*\*Decision:\*\* Three named failure-mode fixes adopted from peer review. (1) \*\*§6 step 7 + trailing paragraph:\*\* the `gate` BLOCKERS entry now records the list of uncommitted implementation paths left in the worktree, and a new rule defines how step 4 on the next prompt treats that dirty state — the open `gate` blocker covers it when the current prompt explicitly references the resolution; otherwise step 4 records the unchanged state and no duplicate blocker is filed. (2) \*\*§14 Convergence criteria:\*\* replace the "three of five models converge" stopping rule with evidence-based criteria (no unadopted material peer improvement, no load-bearing unsupported claim, remaining disagreement not load-bearing); explicit note that peer agreement is a stopping signal only when the substance is independently grounded, and round termination is recorded as a run decision in §17 rather than as convergence. (3) \*\*§15 Platform capability note:\*\* remove hard-coded per-vendor connector capability claims (live code access, commit history, import size, etc.) in favor of recorded current reachability per session; the Connector Context Checklist already carries the operational load. Verified against `.gitignore`, the repo root tree, `package.json` scripts, and the README on `main` this turn; no factual claim in §§1–11 conflicts with repo state.

\*\*Rationale:\*\* §14's old criterion contradicted this PLAN's own anti-majority discipline (§11 IFT rules and the IFT prompt itself); §15's hard-coded capability claims age out as platforms change and create stale-default risk even with a session-verify hedge; §6's failed-gate path left an undefined cross-prompt state that would either trap the agent at step 4 or generate duplicate `gate` blockers.

\*\*Rejected:\*\* Dropping the R27 entry in favor of a renumbered R57/R58 label (labeling inconsistency for the Claude track); deeper restructuring of §6 or §15; per-model trust weighting at adjudication (no empirical support); adding a verbalized-confidence layer to BLOCKERS evidence (literature flags this as miscalibrated).

\*\*Sections changed:\*\* §1, §6, §10, §13, §14, §15, §17.

\*\*Handled:\*\* Cross-prompt failed-gate dirty state; §14 majority-stopping rule vs IFT anti-majority principle; §15 hard-coded capability drift.



\### 2026-05-17 — IFT Round 30 (Claude)

\*\*Decision:\*\* Single wording-consistency fix. §6 step 11 changes from "this report-only commit does not need to list itself in `Commits this prompt`" to "this report-only commit must not list itself in `Commits this prompt`"; §13's parallel cadence-paragraph clause makes the matching change from "does not list itself" to "must not list itself". The exclusion of the report-only commit from `Commits this prompt` now reads as prohibitive in both sections rather than permissive in §6 and declarative in §13.

\*\*Rationale:\*\* §11's trailing line designates §§1–11 as the CLI agent's sole operational reference. An agent reading only step 11's prior permissive wording without §13's clarification could reasonably interpret listing the report-only commit as optional and produce inconsistent SUMMARY reports across prompts. Aligning step 11 to prohibitive removes the gap at essentially zero length cost.

\*\*Alternatives rejected:\*\* ChatGPT R59's relabeling of R27/R28/R29 → R57/R58/R59 (loses Claude-track decision-log history that is load-bearing for the report-only commit split settlement). Grok R59's §14 return to majority-based convergence and §15 hard-coded per-vendor capability claims (both regressions on the R29 settlement). Gemini R59's structural reorganization of §5 with a "shared shell" category (introduces ambiguity over `app/layout.tsx` without a named failure mode). Meta AI R2's omission of `prisma.config.ts` (repo-verified false in R28). Bumping version to 3.0 (sub-version change too small; round captured in §17 instead).

\*\*Sections changed:\*\* §6, §13, §17.

\*\*Open questions handled:\*\* §6 step 11 / §13 wording parity for report-only commit exclusion.

