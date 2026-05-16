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

## AI-Style Summarization

- Implemented `/lib/ai/activitySummarizer.ts` behind an interface so a real provider can replace it later.
- Kept summarization deterministic: first one or two meaningful sentences become the summary, and keyword rules produce a next step.

## Deal Movement

- Implemented drag-and-drop using native browser drag events to avoid adding another UI dependency.
- On stage movement, the app updates the stage, resets probability using stage defaults, updates last activity, and creates a `status_change` activity.

## Testing

- Kept Vitest tests focused on pure business logic.
- Added one Playwright smoke test for the critical daily loop rather than broader browser coverage.
