# Roadmap

> **Operator: this is your file.** Plain-English bullets; reorder to change priorities. Agents only ever mark items "✅ shipped (PR #n)" — they never rewrite your words. Sections mean: **Now** = working on it, **Next** = queued, **Later** = someday, **Ideas** = unscoped thoughts.

## Now

- Stand up the app skeleton: install dependencies, run `prisma db push`, seed the database, and confirm the dev server starts and the `/dashboard` route loads without errors.
- Wire the AI operations engine gate: confirm `bash scripts/init.sh` and `bash scripts/verify.sh` both pass green from a clean checkout.
- Accounts and contacts: list, detail, and creation flows working with real SQLite data from the seed — the foundation for everything else.

## Next

- Opportunities (deals): board and drawer flow, stage movement, stage-change history, and forecast value editing.
- Lead routing: consumer lead creation with postal-code normalization, area resolution, and deterministic dealer-order assignment — including routing-event activity records and failure feedback.
- Activities and tasks: timeline view, note capture on contacts, deterministic summary and next-step generation, task list with filters and drawer.

## Later

- Cases and campaigns: list, creation, and drawer flows; status updates; association with accounts and contacts.
- Reports: pipeline-by-stage, leads-by-source, activity-volume, top-accounts, stale-opportunities, overdue-tasks; CSV export review and download.
- Dealer ops dashboard: KPI cards, behind-pace focus lists, quota pacing labels, order detail with delivered leads.
- Forecast simulator: pipeline value and lead-delivery assumptions, month-end delivery projection, no persistence required.
- Command-palette search (Ctrl/Cmd+K): cross-entity search across accounts, contacts, deals, leads, tasks, cases, campaigns.
- CSV import: bounded contact-create apply path after explicit operator confirmation; preflight and dedupe review.
- Knowledge articles: local service-workflow records, read-oriented workspace, case-assist suggestion context.

## Ideas

- Mining the pre-purge implementation history for reference: the original salesforce-lite-crm codebase (tag `pre-purge-20260609` on the quarry repo) has working implementations of all the above features. Use it as a reference quarry for logic, schema decisions, and test patterns — never bulk-restore; cherry-pick ideas only.
- Postgres cutover path: the `prisma/schema.postgres.prisma` file and `npm run prisma:postgres` helper script already exist; promote only when the operator explicitly decides to move off SQLite.
- External AI provider integration (currently deferred per charter non-goals).
- Authentication and multi-tenancy (permanently deferred unless promoted by operator).
