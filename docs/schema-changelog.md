# Schema / seed changelog

Every `prisma/seed.ts` or `prisma/schema.prisma` change adds one line here.

Format: `YYYY-MM-DD | agent | tag | summary`

Example:

- `2026-05-17 | claude | [CONFIG CHANGE] | bootstrap hooks scaffolding`

Backfilled current baseline:

- `2026-05-19 | codex | [DOC AUDIT] | Current schema includes User, Account, Area, DealerOrder, DealerOrderArea, Lead, Contact, Deal, Activity, Task, Case, Campaign, and OpportunityStageHistory.`
- `2026-05-19 | codex | [DOC AUDIT] | Current seed creates deterministic demo anchors for dashboard KPIs, Vancouver lead routing, dealer order pacing, tasks, cases, campaigns, reports, and routing decision payloads.`
- `2026-05-20 | codex | [S4-F1] | add structured routing payloads to seeded routing events`
- `2026-05-23 | codex | [S29-F2] | add SavedListView for local saved CRM list filters and sort metadata`
- `2026-05-24 | codex | [S32-F1] | add deterministic case queue fields and seeded queue assignments`
- `2026-05-24 | codex | [S32-F2] | add seeded case SLA timing examples for service operations`
- `2026-05-24 | codex | [S33-F1] | add KnowledgeArticle schema, service workflow metadata, and seeded article examples`
- `2026-05-27 | codex | [REPO HEALTH] | add Activity composite index for lead routing-event lookup by lead, type, and createdAt`
- `2026-05-27 | codex | [S50-F1] | add SavedReportDefinition schema for persisted saved report definition contracts`
- `2026-05-29 | claude | [SEED CHANGE] | add type-only non-null assertions to modulo-indexed reads for noUncheckedIndexedAccess (spec 005); no data, ordering, or routing change (TS strips !, compiled JS identical)`
