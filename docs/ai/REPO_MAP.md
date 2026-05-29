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

- Unit: `tests/**/*.test.ts` (115 files, 562 tests) — `npm run test`.
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

- `PLAN.md` (~1.5k lines after the TICKET002 trim) documents the live sprint
  inline; completed-sprint detail (Sprints 4–55) is archived in
  `docs/PLAN-ARCHIVE.md`. Read §1–4 and the current sprint, not the whole file.
- `lib/server/csv*` (34 of 63 server modules) is a deep read-only contract stack
  built over Sprints 5–23. It is no-write by design. Mapped in
  `docs/ai/csv-contract-assessment.md`: 13 modules are UI-reachable (behind
  `/reports`), 21 are a test-only operator/release tower. Consolidation is
  tracked (TICKET003 assessment done; TICKET004 = Phase-1 execution).
- `docs/ai/NEXT-LEVEL.md` is the meta-level scaling assessment for the
  autonomous-coding system itself (loop cost, anti-gold-plating guardrail,
  refactor sequencing). Distinct from `docs/ROADMAP.md` (product features).
  Actionable as TICKET005 (prompt dedup), TICKET006 (reachability gate),
  TICKET007 (parallel-safe tests).
- Full local gate (incl. Playwright e2e, 50 tests) was confirmed green on
  2026-05-28. E2E is heavy (needs `npx playwright install chromium`).
