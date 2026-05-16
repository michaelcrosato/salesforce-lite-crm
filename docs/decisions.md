# Decision Log

## First Build Scope

- Kept the app to dashboard, contacts, accounts, deals, activities, seeded data, tests, README, and decision log.
- Did not add authentication, integrations, deployment configuration, or external AI calls.

## Data Modeling

- Used Prisma string fields for statuses and stages, then enforced allowed values with Zod schemas and helper functions.
- Used SQLite with `cuid()` string primary keys for a simple local proof-of-concept database.
- Treated `won` and `lost` as closed stages, so stale deal detection and open pipeline metrics apply only to `new`, `qualified`, `proposal`, and `negotiation`.

## UI and Navigation

- Used a persistent CRM shell with sidebar navigation, top search, and a main content region.
- Routed the top search to contacts because global search across all objects was beyond the stated first-build feature list.
- Used links to `/deals?deal=:id` instead of adding a deal detail page because a deal detail page was not in the requested scope.
- Account creation uses `/accounts/new`; account editing is exposed inline on the account detail page to avoid adding extra navigation.
- Toasts are hand-rolled with React context so mutation feedback stays dependency-free.
- Contact and account sorting is client-side because the lists are unpaged in this proof of concept.
- Loading states are route-level skeletons to keep async page rendering simple.

## AI-Style Summarization

- Implemented `/lib/ai/activitySummarizer.ts` behind an interface so a real provider can replace it later.
- Kept summarization deterministic: first one or two meaningful sentences become the summary, and keyword rules produce a next step.

## Deal Movement

- Implemented drag-and-drop using native browser drag events to avoid adding another UI dependency.
- Added a compact stage selector on deal cards as an accessibility and live-demo fallback that uses the same move action.
- On stage movement, the app updates the stage, resets probability using stage defaults, updates last activity, and creates a `status_change` activity.
- Deal create/edit uses the same stage/probability rules as board movement and logs a `status_change` when a deal is created or changes stage.
- Deal detail is a local drawer on `/deals` instead of a separate route to preserve the first-build navigation surface.

## Testing

- Kept Vitest tests focused on pure business logic.
- Added one Playwright smoke test for the critical daily loop rather than broader browser coverage.

## Stabilization

- Today's Focus now scores older actionable notes above fresh ones so stale follow-up rises.
- Today's Focus activity items link to the most specific available deal, contact, or account record.
- The global search placeholder says "Search contacts" because the current global form only routes to contacts.
- The Friday summarizer rule now requires "by Friday", "next Friday", or "this Friday" to avoid casual mentions.

## Postgres Migration

- Added a separate Postgres Prisma schema and kept SQLite as the default schema for local development.
- The Postgres prep script temporarily swaps schemas and restores SQLite afterward so normal local commands do not change.
- Switching for real requires a Postgres `DATABASE_URL` and replacing the SQLite adapter in `lib/prisma.ts`.
- No SQLite-specific query workarounds were found in the app queries; status and stage remain strings enforced by Zod.

## Sprint 3B Dealer Revenue Command Center

- Added Dealer Revenue Command Center after Sprint 3A was stable because the core CRM loop can now support vertical dealer workflows.
- Stored `Area.postalPrefixes` as a comma-separated string to stay SQLite-friendly and avoid premature geospatial modeling.
- Kept lead routing synchronous and deterministic in a server action; no external APIs or LLM calls participate in assignment.
- Treated active dealer order eligibility as status-based plus area-linked quota capacity; start and end dates display for operators but do not gate routing yet.
- Used `routing_event` as another string activity type so existing timeline rendering can show routing decisions without a separate event model.

## Sprint 3C Demo Hardening

- Added a deterministic analyst panel instead of a real LLM so the Tuesday demo is repeatable and key signals remain explainable.
- Kept forecast math transparent: projected delivered leads use current run rate, lead volume multiplier, assignment rate, and days in month.
- Retained drawer-based deal detail at `/deals?deal=:id`; no `/deals/[id]` route was added.
- Left dealer order and area CRUD out of scope; orders and areas remain seeded and demo-managed.
- Deferred auth, deployment, Postgres migration, and external AI until after the Tuesday demo hardening pass.
