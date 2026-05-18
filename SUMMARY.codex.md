Agent: Codex
Sprint: Sprint 4B
Feature: Slice 1 foundation unblock
Branch: feat/codex-services-routing-and-validation
Status: in progress - Slice 1 ready to commit
Commits this prompt: `1eed7a7` plus pending Slice 1 [UNBLOCK]
Gate status: PASS - Slice 1 `pwsh scripts/local-gate.ps1`
DoD self-check: PASS for Slice 1
Timestamp: 2026-05-18T01:11:30-07:00

### Slice 0 preflight
- Required Sprint 4B prompt files exist and were read in the requested order.
- Current HEAD after Gemini fixes: `e57e879`.
- `sprint-4b-start` tag exists.
- Rollback archive exists: `..\salesforce-lite-crm-sprint-4b-start.zip`.
- Branch confirmed: `feat/codex-services-routing-and-validation`.

### Repo state confirmation
- Previous baseline gate blocker is cleared by Gemini commits `f909c60` and `e57e879`.
- A stale Node dev server on port 3000 caused the first local gate reruns to reuse old app state; stopping that listener allowed the canonical gate to pass.
- `CRM-CONTRACT.md` is still the pre-Sprint-4B v1 surface and documents `/deals?deal=<id>` as drawer-canonical.
- `prisma/schema.prisma` contains `Task`, `Case`, `Campaign`, and `OpportunityStageHistory`.
- `lib/services/` contains `campaigns.ts`, `cases.ts`, `listQuery.ts`, `opportunityStageHistory.ts`, `reports.ts`, `search.ts`, and `tasks.ts`.
- Seed data includes Activity records of type `routing_event`; current seed summaries are human-readable strings.

### Completed this prompt
- Revalidated the repaired baseline with `pwsh scripts/local-gate.ps1`.
- Updated `CODEX-NOTES.md` with Slice 0 schema, service, contract, seed, and blocker status.
- Cleared the Codex blocker file for the prior baseline E2E failure.
- Slice 1 shipped feature flag and excluded-route exports in `lib/featureFlags.ts`.
- Slice 1 shipped postal normalization and validation helpers in `lib/postal.ts`, composed into lead creation validation.
- Slice 1 shipped `getRoutingDecisionForLead` in `lib/services/leads.ts` and exposed `crmClient.leads.getRoutingDecision(id)`.
- Slice 1 updated `CRM-CONTRACT.md` with feature flags, excluded routes, postal helper signatures, and routing decision shape.
- Feature 2.1 verified existing opportunity stage-history wiring and tests, then added `crmClient.deals.getStageHistory(dealId)` with contract documentation.
- Feature 2.2 standardized Task, Case, and Campaign list inputs around `{ page, pageSize, sortBy, sortOrder, filters }`, retained legacy flat service input compatibility, and added list filter-key JSDoc to crmClient adapters.

### Next action
Run gate for Feature 2.2, commit `feat(codex): list query helper consistency pass`, then continue to Feature 2.3.

### Scope confirmation
No cross-ownership edits: YES
CRM-CONTRACT.md honored: YES
No product features added: YES
