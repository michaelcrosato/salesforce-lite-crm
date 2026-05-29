# TICKET006 — ratcheting server-module reachability gate

- **Status:** Done (2026-05-29) — shipped as `/plan/` spec 011.
- **Priority:** Medium
- **Depends on:** none (independent of TICKET004, but they reinforce each other).
  Context: `docs/ai/NEXT-LEVEL.md` Lever B; `docs/ai/csv-contract-assessment.md`.
- **Result:** Shipped as the gate script `scripts/check-reachability.mjs` +
  `scripts/reachability-baseline.json` (allowlist + shrink-only `maxOrphans`
  ratchet), run in the local gate as `node scripts/check-reachability.mjs`
  (currently 20/20, exit 0). Static import graph of all `.ts/.tsx`, closure from
  `app/**` + `components/**` roots, fails on any NEW test-only `lib/server` orphan
  or count above the ratchet. Pure `node:fs` (no new dep). Implementation form is
  a Node gate script rather than the `tests/arch/*.test.ts` originally sketched
  here, but every acceptance criterion below holds.

## Goal

Convert the manual "is this server module actually consumed?" audit
(TICKET003) into a standing, automated invariant that **ratchets** — so the
loop's signature entropy (producing read-only contract layers faster than
consumers) is caught automatically and can only improve over time.

## Context

The CSV release sub-tower (21 `lib/server` modules, apex
`csvReleaseReadinessPackets`) reaches no `app/` or `components/` consumer — only
its own tests. Nothing detected this except a hand audit. Meanwhile the non-CSV
packet layers (routing, fairness, approval, workflow, audit) **do** reach
`/reports` operator components and are healthy. A reachability test must
distinguish "outside the UI closure" from "legitimately internal" and must not
turn the gate red on adoption.

## Scope

- In: a Vitest test that (1) builds the static import graph of `lib/server/**`,
  (2) computes the transitive closure reachable from `app/**` + `components/**`
  entrypoints, (3) fails if a `lib/server` module is outside the closure AND not
  on an explicit allowlist. Seed the allowlist with today's 21 test-only modules
  (list them from the assessment) plus a one-line rationale each. Add a
  guard/comment that the allowlist may shrink but not grow without a ticket.
- Out: deleting any module (that is TICKET004 and later phases), changing
  contract/route/schema, touching `.claude/**`.

## Likely files

`tests/arch/server-reachability.test.ts` (new), a small allowlist constant
(inline in the test or `tests/arch/server-reachability.allowlist.ts`), possibly a
tiny import-graph helper under `lib/` or `tests/`. Prefer a static parse (regex
or TS compiler API over file text) — do **not** add a new dependency (CLAUDE.md /
LOOP §4).

## Steps

1. Enumerate `lib/server/*.ts`; parse `import`/`from` specifiers statically.
2. Seed roots from `app/**` and `components/**` imports of `@/lib/server/*`.
3. Compute closure; diff against the full module set → candidate orphans.
4. Confirm candidates match the assessment's 21-module list; encode as the
   seeded allowlist with rationale.
5. Assert: every non-allowlisted server module is in the closure. Green now.
6. Add the "allowlist shrinks only" note so future agents extend the right way.

## Acceptance criteria

- [x] Test is green on first adoption (allowlist absorbs the known tower).
      — baseline seeded; gate reports 20/20, exit 0.
- [x] Removing an allowlist entry whose module is still orphaned fails the test
      (ratchet proven with a temporary local check). — `newOrphans`/`maxOrphans`
      checks fail the gate on regrowth.
- [x] No new dependency; no `any`/`@ts-ignore`. — pure `node:fs`/`node:path`.
- [x] `npm run test` + `npm run build` green. — test 562, build 0 (2026-05-29);
      reachability gate runs as `node scripts/check-reachability.mjs`.

## Commands

```powershell
npm run test ; npm run build
```

## Risks

False positives if a module is reached only dynamically or only via a route
handler the parser misses — verify the closure roots cover `app/**/route.ts`,
`actions.ts`, and `page.tsx`. Keep the parser conservative: when unsure whether
an edge exists, treat the module as reachable (avoid false red gates).
