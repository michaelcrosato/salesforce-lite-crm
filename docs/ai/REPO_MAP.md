# Repo Map (for agents)

Fast orientation for where things live. Authority for product behavior is
`CRM-CONTRACT.md`; execution rules are `PLAN.md`; operating handoff is
`AGENTS.md`. This file is navigation only.

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript 5.9 · Prisma 7 +
`@prisma/adapter-better-sqlite3` (SQLite default) · Tailwind 3 · Zod · Vitest ·
Playwright. Package manager: npm.

## Where core logic lives

| Area | Path | Notes |
|---|---|---|
| App routes / pages | `app/**/page.tsx` | App Router. Server components + form actions. Excluded routes render `ExcludedRoutePlaceholder`. |
| Shared UI | `components/**` | ~33 components, incl. `command-palette.tsx`. |
| CRM entity services | `lib/services/**` | Prisma-backed reads/writes (accounts, contacts, deals, leads, tasks, cases, campaigns, reports, search, audit). |
| Deterministic business logic | `lib/business/**` | forecast, analyst, dashboard, reports, csv-export/import math. Pure, heavily unit-tested. |
| Server contract layer | `lib/server/**` | Read-only CSV handoff contracts (~36 files), plus bulk-action, workflow-rule, routing-simulator, audit, and saved-report contracts. See note below. |
| Lead routing | `lib/routing/leadRouter.ts` | Postal-prefix → area → behind-pace dealer order assignment. |
| Deterministic "AI" | `lib/ai/**` | Local summarizer, action intent registry, governance/eval fixtures. No external AI provider. |
| CRM registry/adapter | `lib/crm/**`, `lib/crm-constants.ts` | Entity registry and shared constants. |
| Validation | `lib/validation.ts`, `lib/services/*` | Zod schemas for form actions. |
| Prisma | `prisma/schema.prisma`, `prisma/seed.ts` | SQLite default; `schema.postgres.prisma` for the helper switch. **Sacred** — see CLAUDE.md §7–8. |

## Entry points

- App: `app/page.tsx` redirects to `/dashboard`. Layout: `app/layout.tsx`.
- DB client: `lib/prisma.ts`.
- Seed: `prisma/seed.ts` (deterministic; `V5K 0A1` routing must stay stable).

## Tests

- Unit: `tests/**/*.test.ts` (116 files, 565 tests) — `npm run test`.
- E2E: `e2e/**/*.spec.ts` — `npm run test:e2e` (seeds first, needs Chromium).

## Config

`package.json`, `tsconfig.json`, `next.config.mjs`, `eslint.config.mjs`,
`tailwind.config.ts`, `postcss.config.mjs`, `vitest.config.ts`,
`playwright.config.ts`, `prisma.config.ts`, `.env` (from `.env.example`).

## What to skip

See `.aiignore`. In short: `node_modules/`, `.next/`, `agent-runs/`,
`failure-archives/`, `test-results/`, `traces/`, `*.log`, `prisma/dev.db*`,
`package-lock.json`. Per-agent `SUMMARY.*`, `BLOCKERS.*`, and `*-NOTES.md` are
handoff records — skip unless coordinating a multi-agent run.

## Notes / caveats

- `PLAN.md` is ~3.4k lines documenting 56 sprints; most of the bulk is
  near-duplicate read-only CSV "handoff contract" prose. Read §1–4 and the
  current sprint, not the whole file. Consolidation is tracked in `tickets/`.
- `lib/server/csv*` (~36 files) is a deep read-only contract stack built over
  Sprints 5–23. It is no-write by design; consolidation is a tracked ticket.
- Full local gate (incl. Playwright e2e, 50 tests) was confirmed green on
  2026-05-28. E2E is heavy (needs `npx playwright install chromium`).
