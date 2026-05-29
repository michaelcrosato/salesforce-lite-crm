# GOAL

Single-page orientation. This file does **not** replace the canon: `PLAN.md`
(execution rules + sprint scope) and `CRM-CONTRACT.md` (product contract) win on
any conflict. `AGENTS.md` is the operating handoff. `docs/ai/REPO_MAP.md` is the
navigation map.

## Purpose

Salesforce Lite CRM: a local-first Next.js + Prisma CRM for small-business
revenue ops (accounts, contacts, opportunities, activities, tasks, cases,
campaigns, consumer-lead → dealer-order routing, forecasting, reports, CSV
review, command-palette search). It is a foundation that autonomous coding
agents extend while preserving the shared contract and local gate.

## Current state

- Full local gate green (2026-05-28): `lint`, `typecheck`, `test` (565/565),
  `build`, and `test:e2e` (50/50 Playwright). See `tickets/TICKET001.md`.
- Active sprint is tracked in `PLAN.md` §1/§4 — do not hardcode it here. As of
  2026-05-28 that is Sprint 56 (Pacing Snapshot Readiness, in progress); Sprints
  4–55 are complete, with detail archived in `docs/PLAN-ARCHIVE.md`.
- No auth, deployment, external AI, or Salesforce integration.

## Desired end state

A clean, green, accurately-documented foundation where any agent can orient in
minutes, run one gate command for pass/fail truth, and extend within the
contract. Docs describe what *exists*, not aspiration.

## Non-goals (permanent unless promoted in PLAN.md)

Auth/permissions/multi-tenancy · deployment config · external AI provider ·
Salesforce integration · geocoding/territory polygons · Postgres as default
runtime · persistent forecast scenarios · dealer-order/area CRUD · live
`/deals/[id]` route · dedicated `/search` page · CSV import apply beyond the
bounded contact-create path.

## Constraints / assumptions

- Windows + PowerShell host; SQLite local default.
- `prisma/schema.prisma` and `prisma/seed.ts` are sacred (CLAUDE.md §7–8):
  scope tag + `docs/schema-changelog.md` entry required.
- `.claude/**` hook config is sacred (CLAUDE.md §10).
- No `any` / `@ts-ignore`; enforced by lint + typecheck.

## Agent guidance

**Read first:** `PLAN.md` §1–4 → `CRM-CONTRACT.md` → `AGENTS.md` →
`docs/ai/REPO_MAP.md` → top open ticket in `tickets/`.

**Key commands** (PowerShell, repo root):

```powershell
npm install
npx prisma generate ; npx prisma db push ; npm run seed
npm run lint ; npm run typecheck ; npm run test ; npm run build
npx playwright install chromium ; npm run test:e2e   # heavy
scripts/local-gate.ps1                               # full sequence
```

**Follow:** smallest change that satisfies the task; tests over prose; atomic
commits. **Avoid:** product scope expansion, broad refactors during feature
work, claiming unrun checks, duplicating the existing doc canon.

## Definition of done

`lint`/`typecheck`/`test`/`build` attempted with real results recorded; docs
match actual behavior; changes are atomic and scoped; new findings beyond scope
are filed as tickets, not half-implemented.
