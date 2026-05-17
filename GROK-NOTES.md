# GROK-NOTES.md — Grok Agent (Seed Data, Pure Helpers, CSV, Duplicates)

**Branch:** feat/grok-crm-data-reports  
**Role:** Seed data (Task/Case/Campaign only), pure business helpers, CSV export/import, duplicate detection, supplementary report helpers, seed integrity tests.  
**Owner of:** `prisma/seed.ts` (NEW sections only), `lib/business/tasks.ts` (new), `lib/business/csv-export.ts` (new), `lib/business/csv-import.ts` (new), `lib/business/duplicates.ts` (new), `lib/business/reports-extra.ts` (new), `tests/seed-integrity.test.ts` (new), `tests/helpers/*` (new).

---

## Pre-Flight & Rebase (Completed)
- Verified: clean tree (removed temp `grok-cli-prompt.txt` artifact), branch `feat/grok-crm-data-reports`, `Get-Location` in `C:\dev\salesforce-lite-crm-grok`, `[UNBLOCK]` commit visible on `feat/codex-crm-contract-api` (28bc34c).
- Rebase: `git rebase feat/codex-crm-contract-api` → clean fast-forward, no conflicts in non-owned files.
- Post-rebase setup for green baseline:
  - Created `.env` from `.env.example` (DATABASE_URL for SQLite).
  - `npx prisma generate` (new models: Task, Case, Campaign, OpportunityStageHistory).
  - `npx prisma db push --accept-data-loss` (sync dev.db tables).
- Baseline gate (`npm run test`, `npm run build`, `npm run test:e2e` separate): **GREEN** (82 vitest, build success, 1 e2e smoke pass).
- Current seed runs cleanly (no new entities yet; deletes for existing + FK SetNull tolerant).

---

## Domain Rules (Strict — Do NOT Violate)
- **Lead**: CONSUMER lead routed to DealerOrder via dealer-area matching (postal prefix). NOT generic B2B sales lead. No lead-conversion logic. Preserve routing story: routed leads → assignedOrderId + assignmentReason="routed"; unrouted → areaId + reason ("no_area_match", "no_matching_active_order", "all_orders_at_quota").
- **Deal**: Opportunity-equivalent. Model is `Deal` (aliased `Opportunity`). Detail route **must stay** `/deals?deal=<id>` (drawer). Never assume `/deals/[id]`.
- **Dealer Revenue Command Center**: Vertical differentiator. Demo data MUST preserve dealer-routing-and-pacing story (areas, dealerOrders with quotas, current/prior targets, lead routing events in Activity).
- Do not model Lead as generic; no B2B conversion flows.

---

## Owned Paths (Edit Only These)
- `prisma/seed.ts`: Add **NEW** Task/Case/Campaign seed sections + deleteMany at top of `main()`. **NEVER** modify existing Account/Contact/Deal/Lead/Area/DealerOrder/Activity/User seed data/arrays/functions.
- `lib/business/tasks.ts` (new file): Pure Task helpers (`isOverdue`, `isDueToday`, `isUpcoming`, `tasksByOwner`, `taskCompletionStats`).
- `lib/business/csv-export.ts` (new): `toCsv<T>()` RFC 4180 compliant.
- `lib/business/csv-import.ts` (new): `parseCsv`, `previewRows` — strict RFC 4180, error array (never throw).
- `lib/business/duplicates.ts` (new): `findDuplicateContacts`, `findDuplicateLeads` (email OR name+phone, lowercase, non-mutating).
- `lib/business/reports-extra.ts` (new): Pure augmenters for Codex's `lib/services/reports.ts` (monthlyComparison, topNByField, bucketByDateRange). Never duplicate service logic.
- `tests/seed-integrity.test.ts` (new): Post-seed DB checks (no orphans, valid enums, date sanity, no dup IDs, lead routing preserved).
- `tests/helpers/*.test.ts` (new dir/files): Unit tests for pure helpers (Vitest, 5+ cases each).

**Commit prefixes:** `feat(data):`, `test(data):`, `chore(data):`

**After every commit on owned TS files:**  
`rg '\bany\b|@ts-ignore|@ts-expect-error' <files>` — must return **no matches**.

---

## Not-Owned Paths (Do NOT Edit)
- `prisma/schema.prisma` (Codex)
- `lib/prisma.ts`, `lib/crm/**`, `lib/services/**`, `lib/validation.ts` (Codex)
- Existing `lib/business/*.ts` (dashboard.ts, deals.ts, dealerOps.ts, analyst.ts, forecast.ts) — extend only via new files.
- `app/**`, `components/**` (Claude Code)
- `e2e/**` (Claude Code)
- `package.json`, `package-lock.json`
- `tests/business.test.ts`, `tests/forecast-analyst.test.ts` (existing; add only new test files)

**If schema field missing:** Write `SCHEMA_REQUEST: <field> for <reason>` to `BLOCKERS.grok.md`, work around or skip. **Never** edit schema.
**If service func missing:** Write `CONTRACT_REQUEST: <func> for <reason>` to `BLOCKERS.grok.md`, adapt or skip. **Never** edit `lib/services` or `lib/crm`.

---

## Seed Conventions (from prisma/seed.ts)
- Deterministic IDs (e.g., `task-001`, `case-acct-northstar-1`).
- Use existing IDs from `accounts`, `contacts`, `deals`, `leads`, `users` arrays for relations (accountId, contactId, dealId, leadId, ownerId).
- Mix of statuses/priorities/dates to exercise UI and reports (overdue/due-today/upcoming/completed for Tasks; varied for Cases/Campaigns).
- Dates: use `daysFromNow`, `daysAgo`, `currentMonthDay`, `priorMonthDay` helpers.
- Preserve dealer story: ~40 Tasks linked across accounts/contacts/deals/leads; ~20 Cases; ~8 Campaigns.
- After seed: run `npx prisma db push`, `npm run seed`.
- In `main()`: Add deletes for new models **before** existing deletes (e.g., `await prisma.task.deleteMany(); ...` at top).
- No modification to `buildDealerLeads()`, `noteTemplates`, existing arrays, or createMany blocks.

**Task seed goals (~40):** overdue (dueDate past, status open/in_progress), due-today, upcoming (+1..+30d), completed (done). Link to ~10 accounts, contacts, deals, some leads.
**Case (~20):** Mix statuses (new/in_progress/resolved/closed), priorities, linked to accounts/contacts.
**Campaign (~8):** Varied statuses (planned/active/completed), date ranges, some with leads/contacts linked.

---

## Pure Helper Patterns (from lib/business/*.ts)
- **Pure functions only**: No prisma, no side effects, deterministic given inputs + optional `now = new Date()`.
- Types exported (e.g., `StaleDealCandidate`).
- Use const arrays from registry or hardcode validated strings for enums.
- Examples: `isStaleDeal`, `probabilityForStage`, `calculateWeightedForecast`, `isOpenDealStage`, `stageSortIndex` in deals.ts.
- `calculatePaceGap`, `routeLead` etc in routing (but owned by Codex?).
- Always handle null/undefined gracefully.
- Date math: `getTime() / 86_400_000` for days.

**My helpers must match:** small, tested, reusable by services/UI later.

---

## Codex Reports Service Surface (lib/services/reports.ts) — Augment, Do Not Duplicate
Pure query functions (async, hit Prisma):
- `pipelineByStage(): Promise<PipelineByStageRow[]>` — aggregates Deal by DEAL_STAGES.
- `leadsBySource(): Promise<LeadsBySourceRow[]>`
- `activityVolumeByDay(now?, days?): Promise<ActivityVolumeByDayRow[]>`
- `topAccountsByOpportunityValue(limit?): Promise<TopAccountByOpportunityValueRow[]>`
- `staleOpportunities(now?): Promise<StaleOpportunityRow[]>` (uses `isStaleDeal` from business/deals)
- `overdueTasks(now?): Promise<OverdueTaskRow[]>` (filters Task dueDate < now, status not done/cancelled; uses ROUTE_REGISTRY.taskDetail)

**My reports-extra.ts (pure sync helpers):** `monthlyComparison(records, dateField)`, `topNByField<T>(records, field, n)`, `bucketByDateRange(records, dateField, buckets)`.
Use these to post-process results from above service calls (e.g., in future UI pages or analyst).

---

## Test Patterns (Vitest)
- From `tests/business.test.ts`: `describe("...")`, `it("...")`, `expect(...)`, `beforeEach` for prisma cleanup in integration tests.
- Pure helper tests: simple, no DB (e.g., `isStaleDeal` with fixed dates).
- For my work: `tests/helpers/tasks.test.ts` etc. (5+ cases, edge dates, empty, etc.).
- Seed integrity: integration test that runs after seed, queries all new entities, asserts no orphans (e.g., Task.accountId exists in Account), valid enum values from registry, createdAt <= updatedAt, dueDate in 2020-2030 range, unique IDs, lead routing invariants (routed have assignedOrderId + "routed" reason; unrouted have reason set + no order).

---

## CSV / Duplicates / Reports-Extra Requirements (from spec)
- **csv-export.ts**: `toCsv<T>(rows, columns: {key: keyof T, label: string}[])` — RFC 4180 (quote on comma/quote/newline, \" escape), null/undef → "", Date → ISO 8601.
- **csv-import.ts**: `parseCsv(input: string): {headers: string[], rows: string[][], errors: string[]}` (never throw), `previewRows(input, limit)` tolerant trailing ws.
- **duplicates.ts**: `findDuplicateContacts(contacts): Array<{reason: string, records: Contact[]}>` — group by (email lower) OR (first+last+phone lower). Same for Leads. Non-mutating.
- **reports-extra**: Pure, composable with service output.

---

## TypeScript Discipline (Strict)
- No `any`, no `@ts-ignore`, no `@ts-expect-error`.
- After each commit touching `lib/business/*.ts` or `tests/seed-integrity.test.ts` or `tests/helpers/*`:
  ```powershell
  rg '\bany\b|@ts-ignore|@ts-expect-error' lib/business/tasks.ts lib/business/csv-export.ts ...
  ```
  Must be empty for existing files.
- Use `as const`, branded types where helpful, strict null checks.

---

## Stopping Conditions Handled
- Pre-flight: resolved dirty tree by removing prompt artifact (not code).
- Rebase: clean.
- Baseline: green after prisma setup.
- No >3 feature failure loops.
- If any SCHEMA_REQUEST or CONTRACT_REQUEST arises, log to BLOCKERS.grok.md and adapt.

---

## Next Steps (Slice 1)
G1: Task seed (~40) in seed.ts + db push/seed verify + commit `feat(data): task seed dataset`  
... (see user query for full 9 features, one commit each)

**Final:** Gate again, type scan with rg, git clean + log, append to SUMMARY.grok.md, print report. No extra commits.

---

*Grok agent started: $(date) — following execution discipline strictly.*
