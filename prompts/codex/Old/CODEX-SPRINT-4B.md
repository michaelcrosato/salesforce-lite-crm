# CODEX-SPRINT-4B

> Historical artifact. This prompt is superseded by `PLAN.md`,
> `CRM-CONTRACT.md`, `docs/NEXT-PROMPTS.md`, and
> `prompts/shared/s4-f1-codex-demo-seed-tuning.md`.
> Do not use it as the active next-push prompt.

You are Codex, working in YOLO mode (danger-full-access, never
approval) on an EXISTING Salesforce Lite CRM POC at
C:\dev\salesforce-lite-crm.

Use PowerShell-compatible commands. Do not use POSIX-only patterns
such as `|| true`.

This is Sprint 4B — the 36-hour demo-polish window after your
Sprint 4A merge. You are one of four agents:

- You (Codex): backend, schema, contract, registry, services, lib
- Claude Code: app routes (app/**/page.tsx, app/**/actions.ts),
  DEMO.md, README.md
- Grok CLI: components/**, prisma/seed.ts, lib/business/**,
  Tailwind/CSS
- Gemini CLI: tests/**, e2e/**, scripts/\*\*, Playwright/Vitest
  config, CI workflows, gate

Your Sprint 4A delivered the contract, registry, services, schema
extensions, and crmClient adapter. Sprint 4B is smaller for you —
you provide three lib-layer enablers that Claude and Grok need for
items 54, 55, 56, plus an audit pass to keep CRM-CONTRACT.md
honest. You are the UNBLOCK source again: Claude and Grok wait on
your Slice 1 commit before starting their pair work.

============================================================
OWNED FILES (whitelist)
============================================================

- prisma/schema.prisma, prisma/migrations/\*\* (additive only; no
  destructive changes this sprint)
- lib/prisma.ts
- lib/crm/\*\* (registry, crmClient, types)
- lib/services/\*\* (all service modules)
- lib/validation.ts (extend)
- lib/featureFlags.ts (you create)
- lib/postal.ts (you create — postal normalization/validation helper)
- CRM-CONTRACT.md (you maintain SSOT)
- app/api/\*\* (if any; current convention is server actions, so
  unlikely)
- CODEX-NOTES.md, SUMMARY.codex.md, BLOCKERS.codex.md

============================================================
NOT-OWNED FILES (do NOT edit)
============================================================

- app/**/page.tsx, app/**/loading.tsx, app/\*\*/error.tsx,
  app/layout.tsx (Claude)
- app/\*\*/actions.ts — Claude owns these, BUT see Slice 2 Feature
  2.3 for the one permitted insertion (routing event surfacing
  service call — single-line addition, behavior-preserving). If
  Claude has already wired the service call, skip the edit.
- components/\*\* (Grok)
- prisma/seed.ts (Grok — file blocker if you need a seed shape
  change; do not edit)
- lib/business/\*\* (Grok extends these; you may READ to understand
  shapes but do not edit)
- tests/**, e2e/**, scripts/**, .github/workflows/** (Gemini)
- README.md, DEMO.md (Claude)

============================================================
EXECUTION DISCIPLINE — STRICT
============================================================

Failure-loop rule, non-negotiable:

- After any failed command: smallest fix, rerun ONCE.
- Still red: one more focused fix attempt, rerun ONCE.
- Still red after two attempts: revert (or feature-flag), append a
  clear entry to BLOCKERS.codex.md (exact command, exact error,
  files touched, recommended next fix), move to next feature. No
  third loop.

After each feature:

- Run the gate via Gemini's script: `pwsh scripts/local-gate.ps1`.
  If Gemini hasn't shipped it yet (you started before they did),
  fall back to `npm run test && npm run build && npm run test:e2e`.
- If Playwright browsers missing: `npx playwright install chromium`.
- If gate green, commit with conventional commit message.
- Append a one-line shipped/blocked note to SUMMARY.codex.md.

TypeScript discipline:

- No `any`, no `@ts-ignore`, no `@ts-expect-error`, no
  `as unknown as` bypasses.
- After every commit:
  `rg '\bany\b|@ts-ignore|@ts-expect-error' lib`
  — must return no matches in YOUR files.

Schema discipline:

- This sprint is ADDITIVE only. No dropped columns, no renamed
  fields, no destructive migrations. Use `npx prisma db push` per
  existing convention.
- Any schema change must be documented in CRM-CONTRACT.md in the
  same commit.

============================================================
PRE-FLIGHT — Rollback safety and branch (no commit)
============================================================

1. `git status --short` — must return nothing.
2. `git log --oneline -5` — record current HEAD.
3. Confirm Sprint 4A rollback tag exists; create Sprint 4B start tag:
   `git rev-parse -q --verify refs/tags/sprint-4b-start *> $null`
   `if ($LASTEXITCODE -ne 0) { git tag sprint-4b-start }`
4. `git archive --format=zip --output ..\salesforce-lite-crm-sprint-4b-start.zip HEAD`
5. Switch to working branch:
   `$branch = git branch --list feat/codex-services-routing-and-validation`
   `if ($branch) { git switch feat/codex-services-routing-and-validation } else { git switch -c feat/codex-services-routing-and-validation }`

Do NOT commit anything in pre-flight.

============================================================
SLICE 0 — Repo state confirmation (single commit)
============================================================

1. Read your own Sprint 4A SUMMARY.codex.md. Note what shipped vs.
   what's in BLOCKERS.codex.md. If any Sprint 4A blocker affects
   Sprint 4B items below, address it first or skip the dependent
   feature.
2. Read CRM-CONTRACT.md. It is YOUR SSOT. Confirm:
   - Every entity in the contract exists in prisma/schema.prisma
     (Task, Case, Campaign, OpportunityStageHistory should all be
     there from 4A)
   - Every crmClient adapter signature documented matches the
     actual export
   - Route list still names `/deals?deal=<id>` as drawer-canonical
3. Read existing `lib/services/`. Note which Activity types are
   already supported. The `routing_event` Activity type should
   exist; you'll be exposing its details in Feature 2.3.
4. Read prisma/seed.ts (read-only — Grok's zone). Note the demo
   postal code and the expected area resolution so your postal
   normalizer's tests can assert end-to-end correctness.
5. Run baseline gate. Must be green. If red, do not proceed —
   investigate.
6. Append a Slice-0 section to CODEX-NOTES.md with: current schema,
   current service inventory, current contract version, Sprint 4A
   blockers status.
7. Commit: `chore(codex): slice 0 sprint 4b state confirmation`

============================================================
SLICE 1 — Foundation, FAST-MERGE (single commit, the UNBLOCK)
============================================================

This commit unblocks Claude and Grok for items 54, 55, 56. Make it
complete and self-consistent.

1a. (Item 54 backend) Create `lib/featureFlags.ts`: - Export a const object `FEATURE_FLAGS` with boolean entries:
`tasksUi: false`, `casesUi: false`, `campaignsUi: false`,
`dealDetailRoute: false`, `globalSearchUi: false`,
`commandPalette: false`, `dealerOrderEdit: false`,
`areaEdit: false`. - Export a typed helper `isEnabled(flag: keyof typeof FEATURE_FLAGS): boolean`. - Export `EXCLUDED_ROUTES: readonly string[]` listing the routes
that should 404 or show a placeholder: `/tasks`, `/cases`,
`/campaigns`, `/deals/[id]`, etc. (use the canonical Next.js
path format). - Document in CRM-CONTRACT.md a new section "Feature flags and
excluded routes" naming each flag, its purpose, and which
PLAN.md §4 line authorizes the exclusion. This is what
Gemini's `e2e/excluded-routes.spec.ts` will assert against.

1b. (Item 56 backend) Create `lib/postal.ts`: - `normalizePostalCode(input: string, country: 'CA' | 'US'): string | null`.
For CA: uppercase, strip whitespace, validate `A1A1A1` shape,
reformat as `A1A 1A1`. For US: strip whitespace, validate
`^\d{5}(-\d{4})?$`. Return null on invalid. - `extractPostalPrefix(normalized: string, country: 'CA' | 'US'): string`.
For CA: first 3 chars (FSA). For US: first 5 chars (ZIP). - `validatePostalCode(input: string, country: 'CA' | 'US'): { ok: true; normalized: string; prefix: string } | { ok: false; reason: string }`.
`reason` strings must be UI-suitable ("Postal code must be in
the format A1A 1A1", "Not a valid US ZIP", etc.) — Grok and
Claude will display these verbatim. - Export Zod schema `postalCodeSchema` for use in lead form
action validation. Extend `lib/validation.ts` to compose it
into the lead-creation schema.

1c. (Item 55 backend) Extend `lib/services/leads.ts` (or wherever
the routing logic lives) with: - `getRoutingDecisionForLead(leadId: string): Promise<RoutingDecision | null>`
where `RoutingDecision` is a new exported type with shape:
`       type RoutingDecision = {
        leadId: string;
        normalizedPostal: string;
        prefix: string;
        matchedAreaId: string | null;
        matchedAreaName: string | null;
        candidateOrders: Array<{ id: string; dealerName: string; paceGap: number; rank: number }>;
        selectedOrderId: string | null;
        decidedAt: Date;
        reason: string; // the existing routing_event Activity.body content, parsed
      };
      ` - Implementation reads the `routing_event` Activity tied to
that lead. If multiple, returns the most recent. If none,
returns null. Do NOT re-run routing — surface the existing
record. - Update `lib/crm/crmClient.ts` to expose this as
`crmClient.leads.getRoutingDecision(id)`. - Document the new method + return type in CRM-CONTRACT.md
under the Leads section.

1d. Run full gate. If green, commit:
`feat(codex): slice 1 feature flags postal helper and routing decision exposure [UNBLOCK]`

    The `[UNBLOCK]` tag is the signal to Claude and Grok that they
    can start items 54, 55, 56.

============================================================
SLICE 2 — Codex feature queue (sequential, commit per feature)
============================================================

---

## Feature 2.1 — Opportunity stage history audit (Item 17 FOLD-S4)

Your Sprint 4A added `OpportunityStageHistory` and wired
`moveDealAction`. Audit:

a) Read `app/deals/actions.ts` (read-only — verify the wire is
still there; do NOT edit unless the call is missing entirely,
in which case file a blocker on Claude and skip).
b) Write or verify a service-level test in tests/services/
asserting that moving a Deal stage via the service inserts a
history row. If Gemini hasn't covered this in their gap audit,
the test goes in your zone since the test is about the service
layer. (Acceptable cross-zone exception per CRM-CONTRACT — file
note in SUMMARY.)
c) Add `crmClient.deals.getStageHistory(dealId)` if not present.
Document in CRM-CONTRACT.md.

Commit: `feat(codex): opportunity stage history audit and getter`

---

## Feature 2.2 — List query helper consistency check (Item 19)

The list query helper exists (DONE per backlog). Audit:

a) For each entity in the registry (Account, Contact, Lead, Deal,
Activity, Task, Case, Campaign), verify the list adapter
accepts the standard `{ page, pageSize, sortBy, sortOrder, filters }`
shape.
b) Any entity missing standard pagination → add it. Any entity
with bespoke filter logic → document the divergence in
CRM-CONTRACT.md.
c) Add JSDoc to each list adapter naming the supported filter keys.
This is the contract Grok's component-side filter UI will read.

Commit: `feat(codex): list query helper consistency pass`

---

## Feature 2.3 — Routing event reason enrichment (supports Item 55)

The `routing_event` Activity records the routing decision today.
For Item 55's display, Claude and Grok need the reason BROKEN
DOWN into discrete steps. Update the routing service so that when
it writes a `routing_event`, the `body` is a JSON string with shape:

```
{
  "version": 1,
  "input": { "postal": "V5A1S6", "leadId": "..." },
  "steps": [
    { "step": "normalize", "result": "V5A 1S6" },
    { "step": "extract_prefix", "result": "V5A" },
    { "step": "match_area", "result": { "id": "...", "name": "Burnaby North" } },
    { "step": "filter_orders", "result": { "count": 4, "orderIds": [...] } },
    { "step": "rank_pace_gap", "result": [{ "orderId": "...", "paceGap": 12, "rank": 1 }, ...] },
    { "step": "select", "result": { "orderId": "..." } }
  ],
  "summary": "<the prior human-readable string>"
}
```

This is a content shape change, not a schema change. Existing
records (if any) without `version` → treat as legacy and surface
only the `summary` field. Forward-compatible.

Update `getRoutingDecisionForLead` from Slice 1c to parse and
return both the full `steps` array and the `summary`.

Update `lib/business/routing.ts` (read-only check) — if the routing
helper produces the reason string, file a blocker for Grok to
update it to emit the JSON shape; do NOT edit it yourself.

Commit: `feat(codex): structured routing event reason payload`

---

## Feature 2.4 — Reports query service expansion (Item 34 partial)

`lib/services/reports.ts` exists from Sprint 4A. Add the two
missing report shapes named in Item 34:

a) `leadsBySource(): Promise<Array<{ source: string; count: number; rate: number }>>`
`rate` = converted / total for that source. "Converted" in this
vertical = lead with a successful `routing_event` Activity (since
B2B conversion is excluded). Define this clearly in the JSDoc.
b) `topAccountsByDealValue(limit = 10): Promise<Array<{ accountId: string; accountName: string; totalValue: number; openDealCount: number }>>`

Tests for both.

Commit: `feat(codex): reports leads-by-source and top-accounts`

---

## Feature 2.5 — CRM-CONTRACT.md full audit and version bump

End-of-sprint audit. Walk the contract section by section:

a) Every entity listed → exists in schema.prisma OR documented as
alias/derived (Opportunity = Deal, Note = Activity type='note').
b) Every route listed in ROUTE_REGISTRY → exists in app/, OR is
in EXCLUDED_ROUTES with the exclusion noted in the contract.
c) Every crmClient signature → matches actual export (use
`rg '^export ' lib/crm/crmClient.ts` cross-checked with the
contract).
d) Every status enum → matches `lib/crm-constants.ts` exports.
e) New from this sprint:

- Feature flags section
- Routing decision return type (Item 55 support)
- leadsBySource / topAccountsByDealValue (Item 34)
- getStageHistory adapter method (Item 17)
- Postal helper signature (Item 56 support)

Bump the contract version line at the top: `v1.x → v2.0` (4A
was v1; Sprint 4B's surface area changes warrant a major bump).

Commit: `docs(codex): crm-contract v2 audit and version bump`

---

## Feature 2.6 — Final type-safety and route-consistency scan

a) `rg '\bany\b|@ts-ignore|@ts-expect-error' lib`
— must return no matches.
b) `rg '/deals/\[id\]|/deals/\$\{id\}|/deals/:id' lib`
— only matches allowed are in comments/JSDoc explicitly stating
the route is excluded. Live references → fix.
c) Run `npx tsc --noEmit` — must be clean.
d) Run `pwsh scripts/local-gate.ps1` — must be `[GATE PASS]`.
e) Finalize SUMMARY.codex.md with shipped features, deferred items,
final gate status, blockers consumed/produced.

Commit: `chore(codex): sprint 4b final audit`

============================================================
FINAL VERIFICATION — read-only
============================================================

1. `pwsh scripts/local-gate.ps1`
2. `rg '\bany\b|@ts-ignore|@ts-expect-error' lib`
3. `rg '/deals/\[id\]|/deals/\$\{id\}|/deals/:id' lib app components tests`
   (full repo scan to catch anything other agents introduced)
4. `git status --short`
5. `git log --oneline -15`
6. `git archive --format=zip --output ..\salesforce-lite-crm-sprint-4b-codex.zip HEAD`

Print final report:

- Sections completed / skipped
- Commit hashes
- Schema changes: none (additive content shape only on
  routing_event body)
- New lib modules: featureFlags, postal
- Service expansions: leads.getRoutingDecision, leads-by-source,
  top-accounts, deals.getStageHistory
- CRM-CONTRACT version: v2.0
- Type-safety scan: clean / dirty
- Route scan: clean / dirty
- Blockers: filed (for whom) / consumed (whose)

============================================================
STOPPING CONDITIONS
============================================================

Stop if:

- Slice 0 baseline gate red
- 3 consecutive failure-loop limits
- Working tree unrecoverable
- Out of features

Final SUMMARY.codex.md + BLOCKERS.codex.md, then
`STOPPED: <reason>` as the last line.

============================================================
GO
============================================================

Begin Pre-flight now. Slice 0 → Slice 1 → Slice 2 queue. No pauses
between features.

Coordination note: Slice 1 IS the unblock for Claude and Grok. Get
it merged FAST and clean — they cannot start items 54, 55, 56 until
you've shipped lib/featureFlags.ts, lib/postal.ts, and the routing
decision exposure. Target: Slice 1 complete within the first 3
hours of the 36-hour window.
