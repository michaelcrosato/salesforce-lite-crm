# Feature Backlog

This file records verified repo facts and deferred items only. It is not a
roadmap and does not authorize feature work. Proposed B-NN roadmap entries live
in `PLAN.md` section 16 and `docs/ROADMAP.md`.

## Recently Landed And Active Sprint Scope

| ID | Scope | Owner | Status |
|---|---|---|---|
| S4-F1 | Demo seed tuning | Codex | done |
| S4-F2 | Route visual QA | Claude | done |
| S4-F3 | Component polish | Grok | done |
| S4-F4 | Demo smoke and gate hardening | Gemini | done |
| S5-F1 | Server CSV export contracts | Codex | done |
| S5-F2 | CSV import preview validation | Codex | done |
| S6-F1 | CSV import template contracts | Codex | done |
| S6-F2 | CSV import preflight diagnostics | Codex | done |
| S7-F1 | CSV capability catalog | Codex | done |
| S7-F2 | CSV preview issue summaries | Codex | done |
| S8-F1 | CSV import example contracts | Codex | done |
| S8-F2 | CSV export preflight summaries | Codex | done |
| S9-F1 | CSV import readiness plans | Codex | done |
| S9-F2 | CSV export preview snippets | Codex | done |
| S10-F1 | CSV import action manifests | Codex | done |
| S10-F2 | CSV preview capability metadata | Codex | done |
| S11-F1 | CSV import review bundles | Codex | done |
| S11-F2 | CSV export review bundles | Codex | done |
| S12-F1 | CSV export delivery packets | Codex | done |
| S12-F2 | CSV import dry-run receipts | Codex | done |
| S13-F1 | CSV transfer manifest catalog | Codex | done |
| S13-F2 | CSV compatibility reports | Codex | done |
| S14-F1 | CSV handoff index | Codex | done |
| S14-F2 | CSV field coverage summaries | Codex | done |
| S15-F1 | CSV operator readiness scorecards | Codex | done |
| S15-F2 | CSV contract QA checks | Codex | done |
| S16-F1 | CSV operator remediation runbooks | Codex | done |
| S16-F2 | CSV contract drift snapshots | Codex | done |
| S17-F1 | CSV operator handoff packets | Codex | done |
| S17-F2 | CSV contract release digest | Codex | done |
| S18-F1 | CSV release verification manifests | Codex | done |
| S18-F2 | CSV operator fixture bundles | Codex | done |
| S19-F1 | CSV handoff release notes packet | Codex | done |
| S19-F2 | CSV operator acceptance checklists | Codex | done |
| S20-F1 | CSV operator walkthrough manifests | Codex | done |
| S20-F2 | CSV release closure scorecards | Codex | done |
| S21-F1 | CSV release handoff catalog | Codex | done |
| S21-F2 | CSV release exception register | Codex | done |
| S22-F1 | CSV release disposition manifests | Codex | done |
| S22-F2 | CSV release readiness packets | Codex | done |
| S23-F1 | CSV dedupe candidate packets | Codex | done |
| S23-F2 | CSV dedupe review bundles | Codex | done |
| S24-F1 | CSV export operator UI | Codex | done |
| S24-F2 | CSV import preview UI | Codex | done |
| S25-F1 | Audit event model foundation | Codex | done |
| S25-F2 | Filter/query compiler foundation | Codex | done |
| S26-F1 | Bulk action dry-run contracts | Codex | done |
| S26-F2 | Audit adoption for core mutations | Codex | done |
| S26-F3 | Saved list views foundation | Codex | deferred |
| S27-F1 | Bulk action dry-run review packets | Codex | done |
| S27-F2 | Audit coverage manifests | Codex | done |
| S27-F3 | List filter support catalog | Codex | done |
| S28-F1 | Audit coverage operator panel | Codex | done |
| S28-F2 | List filter support explorer | Codex | done |
| S28-F3 | Bulk dry-run review operator UI | Codex | done |
| S29-F1 | Audit event explorer | Codex | done |
| S29-F2 | Saved list views foundation | Codex | done |
| S29-F3 | Saved list views operator UI | Codex | done |
| S30-F1 | Selected export action packets | Codex | done |
| S30-F2 | Bulk action execution foundation | Codex | done |
| S30-F3 | Bulk action execution operator UI | Codex | done |
| S31-F1 | Bulk list selection contracts | Codex | done |
| S31-F2 | List-page selected export actions | Codex | done |
| S31-F3 | List-page bulk execution actions | Codex | done |
| S32-F1 | Case queue assignment foundation | Codex | done |
| S32-F2 | Case SLA timer contracts | Codex | done |
| S32-F3 | Service operations case UI | Codex | done |
| S33-F1 | Knowledge article foundation | Codex | done |
| S33-F2 | Case knowledge suggestion contracts | Codex | done |
| S33-F3 | Case knowledge assist UI | Codex | done |
| S34-F1 | Non-major dependency refresh | Codex | done |
| S34-F2 | Transitive advisory containment | Codex | done |
| S34-F3 | Vitest major compatibility pass | Codex | done |
| S35-F1 | Deterministic AI prompt registry | Codex | done |
| S35-F2 | Structured deterministic output contracts | Codex | done |
| S35-F3 | Deterministic AI eval fixtures | Codex | done |
| S36-F1 | Deterministic AI run receipts | Codex | done |
| S36-F2 | AI privacy and cost policy guardrails | Codex | done |
| S36-F3 | AI governance review packets | Codex | done |
| S37-F1 | Workflow rule catalog | Codex | queued |
| S37-F2 | Workflow dry-run evaluator | Codex | queued |
| S37-F3 | Workflow review packets | Codex | queued |

The implemented app-router surface includes `/tasks`, `/tasks/new`, `/cases`,
`/cases/new`, `/campaigns`, `/campaigns/new`, `/reports`, and
`/reports/[slug]`.

## Deferred README-Known Limitations

- Authentication, permissions, and multi-tenancy.
- Deployment configuration.
- Salesforce integration.
- External AI provider integration.
- Dedicated `/search` page. Cross-entity search currently exists through the
  global Ctrl/Cmd+K command palette.
- Live `/deals/[id]` detail route.
- Dealer order create/edit flows.
- Area create/edit flows.
- Postgres cutover as the default runtime.
- Geocoding or territory polygons.
- Persistent forecast scenarios.
- CSV bulk import writes, file storage, mapping wizard, persistent CSV
  release-note/acceptance/verification/fixture/snapshot/walkthrough/scorecard/
  handoff/exception/disposition/readiness history, and Salesforce-connected
  import/export remain deferred; server helpers exist under `lib/server` and
  `lib/business`.
- Lead to Account + Contact + Opportunity conversion. Consumer leads route to
  dealer orders in this vertical.
- Future dependency/security modernization for new audit findings and
  package-major upgrade paths (`B-68` in `PLAN.md`).

## Excluded Routes Still Guarded

These routes intentionally render placeholders or 404 responses:

- `/deals/[id]`
- `/search`
- `/command-palette`
- `/orders/new`
- `/orders/[id]/edit`
- `/areas/new`
- `/areas/[id]/edit`

## Do Not Build During Documentation Or Readiness Passes

- Product routes beyond the current contract.
- Auth or permissions.
- Deployment.
- External AI or Salesforce integration.
- New dealer order or area CRUD.
- New live `/deals/[id]` detail behavior.
- Dedicated `/search` page.
