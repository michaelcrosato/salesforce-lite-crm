# Sprint 4B — Coordination Overview

> Historical artifact. This coordination plan is superseded by `PLAN.md`,
> `CRM-CONTRACT.md`, `docs/NEXT-PROMPTS.md`, and `prompts/shared/s4-f*.md`.
> Do not use it as the active next-push prompt set.

Four prompts, one 36-hour window, four parallel agents on four
branches. This file is the air-traffic-control view. Each prompt
is self-contained; this exists so you (the human operator) can
see the dependency graph at a glance.

---

## Branches

| Agent | Branch | Status file | Blocker file |
|---|---|---|---|
| Codex | `feat/codex-services-routing-and-validation` | `SUMMARY.codex.md` | `BLOCKERS.codex.md` |
| Gemini CLI | `feat/gemini-gate-and-coverage` | `SUMMARY.gemini.md` | `BLOCKERS.gemini.md` |
| Claude Code | `feat/claude-demo-and-route-polish` | `SUMMARY.claude.md` | `BLOCKERS.claude.md` |
| Grok CLI | `feat/grok-components-and-seed-tuning` | `SUMMARY.grok.md` | `BLOCKERS.grok.md` |

Branch off `main` (or wherever Sprint 4A finalized). Each agent
tags `sprint-4b-start` at first run if not already present.

---

## Dependency graph

```
Hour 0
├── Gemini Slice 0 + Slice 1 (bootstrap + gate script) ─────► [UNBLOCK GATE]
│      Independent. Other agents adopt pwsh scripts/local-gate.ps1
│      once it's available.
│
├── Codex Slice 0 + Slice 1 (featureFlags, postal, routing) ─► [UNBLOCK LIB]
│      Independent of others. Target merge: hour 3.
│
├── Claude Slice 0 + Slice 1 (DEMO.md) ──► docs commit
│      DEMO.md is independent of everything.
│
└── Grok Slice 0 + Slice 1 Track B (seed anchors) ──► seed commit
       Seed is independent of unblocks.

Hour 3 (after Codex [UNBLOCK LIB])
├── Grok Slice 1 Track A: components ─────► [UNBLOCK COMPONENTS]
│      Imports RoutingDecision type and postal helper.
│
└── Claude Slice 2 Feature 2.4 (README + CI badge)
       Independent once Gemini's CI workflow URL is known.

Hour ~5 (after Grok [UNBLOCK COMPONENTS])
├── Claude Slice 2 Feature 2.1: page-level broken-link guard
│      Consumes <ExcludedRoutePlaceholder/>
├── Claude Slice 2 Feature 2.2: routing detail wiring
│      Consumes <RoutingDecisionDetail/> + getRoutingDecisionForLead
├── Claude Slice 2 Feature 2.3: postal validation in lead form
│      Consumes <PostalCodeInput/> + lib/postal.ts schemas
└── Grok Slice 2 Features 2.1–2.3: polish, report helpers, report cards
       Run in parallel with Claude's wiring.

Hour ~16+
└── Gemini Slice 2 Features 2.1–2.5:
       Anchor seed tests → CI mirror → test gap fills → e2e demo path → excluded routes guard
       Each layers on top of others' shipped work.

Hour ~30+
└── Final-audit features for every agent (Feature 2.6 / 2.5).
       Type-safety scan, route-consistency scan, contract audit,
       SUMMARY finalization.
```

---

## The three coordination pairs

These are the only places where two agents' files meet. Treat the
hand-off as a contract — if the contract is unclear, file a blocker
rather than guessing.

### Item 54 — Broken-link guard

| Layer | Owner | File | Output |
|---|---|---|---|
| Backend | Codex | `lib/featureFlags.ts` | `EXCLUDED_ROUTES`, `FEATURE_FLAGS`, `isEnabled()` |
| Component | Grok | `components/excluded-route-placeholder.tsx` | `<ExcludedRoutePlaceholder route={...} />` |
| Page | Claude | `app/<excluded>/page.tsx` | Imports both, renders placeholder, deletes broken links from nav |
| E2E | Gemini | `e2e/excluded-routes.spec.ts` | Asserts each excluded route 404s or shows placeholder |

### Item 55 — Routing decision detail

| Layer | Owner | File | Output |
|---|---|---|---|
| Backend | Codex | `lib/services/leads.ts` + `lib/crm/crmClient.ts` | `getRoutingDecisionForLead(id)` returns `RoutingDecision` |
| Backend | Codex | `lib/services/routing.ts` (or wherever) | `routing_event` body is structured JSON with `steps` array |
| Component | Grok | `components/routing-decision-detail.tsx` | `<RoutingDecisionDetail decision={...} />` |
| Page | Claude | `app/leads/page.tsx`, `app/orders/[id]/page.tsx` | Fetches decision, renders component with testid |
| E2E | Gemini | `e2e/demo-path.spec.ts` | Clicks toggle, asserts step rows visible |

### Item 56 — Postal validation

| Layer | Owner | File | Output |
|---|---|---|---|
| Backend | Codex | `lib/postal.ts` + `lib/validation.ts` extension | `normalizePostalCode`, `validatePostalCode`, `postalCodeSchema` |
| Component | Grok | `components/postal-code-input.tsx` | `<PostalCodeInput value onChange country error />` |
| Page | Claude | `app/leads/page.tsx` + `app/leads/actions.ts` | Form mounts component, action validates with schema, returns field errors |
| E2E | Gemini | within `e2e/demo-path.spec.ts` | Submit invalid postal → assert error appears |

---

## File ownership matrix (quick reference)

| Zone | Owner | Notes |
|---|---|---|
| `prisma/schema.prisma`, `prisma/migrations/**` | Codex | Additive only this sprint |
| `prisma/seed.ts`, seed helpers | Grok | Anchor manifest in SUMMARY.grok.md |
| `lib/prisma.ts`, `lib/crm/**`, `lib/services/**`, `lib/validation.ts`, `lib/featureFlags.ts`, `lib/postal.ts` | Codex | |
| `lib/business/**` | Grok | Pure helpers |
| `app/**/page.tsx`, `app/**/layout.tsx`, `app/**/loading.tsx`, `app/**/error.tsx`, `app/**/actions.ts` | Claude | One narrow exception: Codex may insert a single behavior-preserving service call in `app/deals/actions.ts` for stage history — coordinate via SUMMARY before doing so |
| `components/**` | Grok | |
| `tailwind.config.ts`, `app/globals.css` | Grok | |
| `tests/**`, `e2e/**`, `scripts/**`, Playwright/Vitest config | Gemini | |
| `.github/workflows/**` | Gemini | |
| `CRM-CONTRACT.md` | Codex | SSOT — read-only for others |
| `DEMO.md`, `README.md` | Claude | |
| `AGENTS.md` | All | Append-only per agent's section |
| `SUMMARY.<agent>.md`, `BLOCKERS.<agent>.md` | Respective agent | |

---

## Gate command (canonical)

Once Gemini Slice 1 lands:

```powershell
pwsh scripts/local-gate.ps1
```

Or on a *nix host:

```bash
bash scripts/local-gate.sh
```

Until then, fall back to:

```
npm run test && npm run build && npm run test:e2e
```

---

## Stop-the-line triggers

Any agent stops if:

- Slice 0 baseline gate is RED
- 3 consecutive features hit the failure-loop limit
- Working tree becomes unrecoverable
- Dependency unblock doesn't arrive within 6 hours of expected
  time (file blocker, fall back to independent work, stop on
  blocked features)

The four-agent system is robust to one agent stopping mid-sprint
as long as that agent's blocker file is complete enough for a
human (or another agent) to pick up the work.

---

## Final merge sequence (hour 32+)

When all four agents have either completed their queues or
stopped with blockers, merge order to `main`:

1. Codex first (`feat/codex-services-routing-and-validation`) —
   lib changes are the foundation; rebase others on top after.
2. Grok second (`feat/grok-components-and-seed-tuning`) — depends
   on Codex's types.
3. Claude third (`feat/claude-demo-and-route-polish`) — depends
   on both Codex's lib and Grok's components.
4. Gemini last (`feat/gemini-gate-and-coverage`) — tests assert
   against the other three's shipped work.

Each merge runs the full gate. Any red after merge → revert and
investigate before the next merge. The whole point of the four
agents working in parallel is that no one merge can take down the
others' work in flight.

---

## Hand-off when done

Final state of `main` should have:

- Green CI badge in README
- DEMO.md at root with timed walkthrough
- `pwsh scripts/local-gate.ps1` exits `[GATE PASS]`
- CRM-CONTRACT.md v2.0
- All four `SUMMARY.<agent>.md` files showing final state
- All four `BLOCKERS.<agent>.md` files either empty or
  containing only Sprint 5 candidate items
- Vitest test count: 75+ target
- Playwright spec count: existing + demo-path + excluded-routes
- No broken nav links to excluded routes
- Routing decision detail visible on leads and orders
- Postal validation surfacing inline errors

If you have all of that, the 36-hour window delivered.
