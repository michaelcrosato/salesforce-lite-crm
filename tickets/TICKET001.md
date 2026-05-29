# TICKET001 — Verify and record the Playwright e2e gate

- **Status:** Open
- **Priority:** High

## Goal

Run the full Playwright e2e suite and record a truthful pass/fail result, so the
local gate has all five stages verified (lint/typecheck/test/build already
green).

## Context

The maintenance pass that created this ticket ran `lint`, `typecheck`,
`test` (565/565), and `build` — all green. It did **not** run `npm run test:e2e`
because it requires `npx playwright install chromium` and a seeded DB and is
heavy/slow. The e2e specs exist under `e2e/**` (~22 specs) and are part of the
documented gate (`docs/LOCAL-GATE.md`).

## Scope

- In: install Chromium, seed, run e2e, record exact result; fix only trivial,
  high-confidence flakiness (e.g. a stale selector) if it surfaces.
- Out: rewriting specs, changing product behavior, snapshot churn.

## Likely files

`e2e/**/*.spec.ts`, `playwright.config.ts`, `prisma/seed.ts` (read-only).

## Steps

1. `npx playwright install chromium`
2. `npm run test:e2e`
3. Record pass/fail + failing spec names. If green, mark this ticket done.
4. If red, capture the failing spec and error; file a follow-up ticket if the
   fix is non-trivial.

## Acceptance criteria

- [ ] `npm run test:e2e` was actually run and its real result recorded.
- [ ] Gate status in `docs/PROJECT-CONTROL.md` / `GOAL.md` reflects the e2e result.
- [ ] No product behavior changed.

## Commands

```powershell
npx playwright install chromium
npm run test:e2e
```

## Risks

E2e may be slow or flaky on first browser install. Do not weaken the gate to
make it pass.

## Notes

Honesty rule: do not claim e2e passed unless it ran and passed.
