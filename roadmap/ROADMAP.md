# Roadmap

> **Operator: this is your file.** Plain-English bullets; reorder to change priorities. Agents only ever mark items "✅ shipped (PR #n)" — they never rewrite your words. Sections mean: **Now** = working on it, **Next** = queued, **Later** = someday, **Ideas** = unscoped thoughts.

## Now

- **Decide the database/tenancy shape and write it down.** Single-tenant local SQLite (what GOAL.md asks for — recommended) vs multi-tenant Postgres with row-level security (what the salvaged research describes). Everything else depends on this. Record the choice in DECISIONS.md; if multi-tenancy is genuinely wanted, that's an operator call — raise it in QUESTIONS.md.
- **Make the docs match reality.** GOAL.md still describes the old, deleted CRM (it points at files like PLAN.md, CRM-CONTRACT.md, and a prisma folder that no longer exist). Bring GOAL.md in line with "research + spec, no code yet." (The README has already been fixed.)
- **Build the first real CRM slice end to end: Accounts.** One entity, working all the way through. A local SQLite database that stores accounts; a page that lists accounts; a form that creates an account; a detail page for one account. Shipped with automated tests in the same change. This is the smallest thing that proves the whole pipeline (data → storage → screen) works.
- **Add Contacts, linked to Accounts.** Same end-to-end slice — list, create, detail — with each contact belonging to an account. This proves records can relate to each other.

## Next

- **Opportunities (deals) with pipeline stages.** Create an opportunity tied to an account, move it through stages (e.g. new → qualified → won/lost), and keep a history of stage changes. This is the heart of a sales CRM.
- **Activity timeline.** Log notes, calls, emails, and meetings against accounts and contacts, shown as a chronological history on the detail pages.
- **Tasks.** A simple to-do list tied to accounts and contacts, with due dates and a done/not-done state, plus a view of what's overdue.
- **A dashboard.** One landing page with the key numbers: pipeline value by stage, recent activity, and overdue tasks.

## Later

- **Built-in reports.** A small set of read-only reports — pipeline by stage, leads by source, activity volume, top accounts, stale opportunities, overdue tasks. (The research has 14 ready-made report templates to pick from.)
- **CSV import/export.** Download records as CSV; import contacts with validation, duplicate detection, and a preview before anything is created. Keep the import path bounded and safe (create-only, confirmed).
- **Search across records.** Find accounts, contacts, and deals from one search box or a command palette.
- **Custom fields, governed.** Let a user add their own fields to records without code changes, with the field definitions stored and validated centrally (never an ungoverned free-for-all).

## Ideas

- **Multi-tenant SaaS version.** The salvaged research is a complete, three-times-validated blueprint for a multi-tenant Postgres CRM (row-level security, per-customer isolation). Only pursue if the product is meant to be sold as a hosted service — it's a much bigger build, and all three prior attempts at it struggled to finish a usable product.
- **Audit trail with tamper-evidence.** A hash-chained, append-only log of every change — a compliance differentiator from the research.
- **Marketing sequences / lead routing.** Email sequences, A/B steps, consumer-lead-to-dealer-order routing — large optional modules the research catalogs. Out of scope for a "lite" CRM unless promoted.
- **AI-assisted summaries and next steps.** Deterministic, local-first summaries of activity history and suggested next actions — no external AI provider required.
