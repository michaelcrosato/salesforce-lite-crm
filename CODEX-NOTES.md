# Codex Notes

## Stack
- Next.js 16 App Router with React 19 and TypeScript.
- Prisma 7 using SQLite through `@prisma/adapter-better-sqlite3`.
- Vitest for unit tests and Playwright for e2e smoke coverage.
- Zod is available for input validation.

## Scripts
- `npm run test` runs `vitest run`.
- `npm run build` runs `next build`.
- `npm run test:e2e` runs `npm run seed && playwright test`.
- `npm run seed` runs `tsx prisma/seed.ts`.
- `npm run prisma:postgres` runs `node scripts/prisma-postgres.mjs`.

## Key Paths
- Prisma schema: `prisma/schema.prisma`.
- Prisma seed: `prisma/seed.ts`.
- App routes and server actions: `app/`.
- Existing validation helpers: `lib/validation.ts`.
- Existing business helpers: `lib/business/`.
- E2E smoke spec: `e2e/smoke.spec.ts`.

## Existing Schema
- `User`
- `Account`
- `Contact`
- `Deal`
- `Activity`
- `Area`
- `DealerOrder`
- `DealerOrderArea`
- `Lead`

## Routing Convention
- App Router pages are server components by default.
- Dynamic data routes export `dynamic = "force-dynamic"`.
- Mutations are implemented as server actions in route-local `actions.ts` files.
- Existing deal detail behavior uses the `/deals?deal=<id>` drawer pattern, not `/deals/[id]`.

## Owned Files For This Run
- `package.json`, `package-lock.json` only for baseline restoration.
- `prisma/schema.prisma`, `prisma/schema.postgres.prisma`, `prisma/migrations/*`.
- `lib/prisma.ts`.
- `CRM-CONTRACT.md`.
- `lib/crm/registry.ts`.
- `lib/crm/crmClient.ts`.
- `app/api/**`.
- `lib/services/**`.
- `lib/validation.ts`.
- `tests/api/**`.
- `CODEX-NOTES.md`, `SUMMARY.codex.md`, `BLOCKERS.codex.md`.
- `e2e/playwright.config.ts` only for baseline restoration.

## Not Owned
- `app/**/page.tsx`, `app/**/loading.tsx`, `app/**/error.tsx`, `app/layout.tsx`.
- `components/**`.
- `prisma/seed.ts` except minimal additions if needed for API tests.
- `lib/business/**`.
- `e2e/smoke.spec.ts` and other e2e specs.

## Sprint 4B Slice 0 - 2026-05-18
- Branch: `feat/codex-services-routing-and-validation`.
- Baseline HEAD after Gemini fixes: `e57e879`.
- `sprint-4b-start` tag exists and rollback archive was created at `..\salesforce-lite-crm-sprint-4b-start.zip`.
- Schema inventory confirmed in `prisma/schema.prisma`: `Task`, `Case`, `Campaign`, and `OpportunityStageHistory` are present alongside the dealer routing models.
- Service inventory: `campaigns.ts`, `cases.ts`, `listQuery.ts`, `opportunityStageHistory.ts`, `reports.ts`, `search.ts`, and `tasks.ts`.
- Contract version/status: `CRM-CONTRACT.md` is pre-Sprint-4B v1 surface; `/deals?deal=<id>` remains drawer-canonical and `/deals/[id]` remains excluded.
- Sprint 4A blocker status: previous baseline E2E blocker is resolved by Gemini commits `f909c60` and `e57e879`; the first local rerun reused a stale port-3000 dev server, and a fresh server gate passed after stopping that listener.
- Seed routing inventory: `prisma/seed.ts` creates `routing_event` Activity rows with human-readable summaries; demo postal samples include `V5K 0A1` for `area-vancouver`, `V3N 2B2` for `area-burnaby`, and `T2P 1J9` for `area-calgary`.
- Baseline gate: PASS via `pwsh scripts/local-gate.ps1` with 93 Vitest tests, build pass, and 7 Playwright tests passing.
