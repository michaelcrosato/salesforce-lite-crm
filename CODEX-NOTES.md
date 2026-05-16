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
