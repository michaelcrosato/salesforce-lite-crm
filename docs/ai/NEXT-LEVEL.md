# Next Level — scaling the autonomous-coding system

Strategic assessment of what would take this repo to the next level **as a
100%-AI-coded, no-human-in-the-loop project**. Written 2026-05-28 against `main`.

## Scope (what this is, and is not)

This doc is about the **health and scalability of the agent loop and the
codebase it produces** — not product features.

- Product feature backlog → `docs/ROADMAP.md` (the B-NN items, Phases 1–8).
- AI platform/persona sequencing → `docs/AI-ROADMAP.md`.
- Architecture boundaries → `docs/ARCHITECTURE.md`.
- CSV-layer consolidation detail → `docs/ai/csv-contract-assessment.md`
  (TICKET003) and `tickets/TICKET004.md`.

Those answer *"what should the CRM do next."* This doc answers a different
question the others do not cover: *"as the agents keep building, what keeps the
loop fast and the codebase from rotting — and what breaks first if this becomes
a much larger project."*

## Thesis

The repo is green and well-governed; the contract-first discipline
(`CRM-CONTRACT.md`, ownership zones, the local gate) is the right foundation and
should be **preserved, not refactored away**. What limits the *next level* is
not missing features — it is two scaling pressures specific to an AI-only
project:

1. **The per-iteration cost of the loop is creeping up.** Every autonomous
   iteration re-reads a large orientation surface and runs a fully serialized
   test suite. Both grow with the project; neither is bounded today.
2. **The loop has one reliable failure mode, and no automated guard against
   it.** Agents default to producing read-only "review / handoff / readiness"
   contract layers. Most reach the UI — but the CSV release sub-tower (21
   modules) never did, and nothing detected that except a manual audit.

Next level = make the loop **cheaper per iteration** and **self-correcting**
against its own entropy, without weakening the contract discipline that works.

## Evidence snapshot (verified 2026-05-28)

| Signal | Measure | Source |
| --- | --- | --- |
| `lib/server` size | 63 `.ts` modules | `Glob lib/server/*.ts` |
| CSV family share | 34 / 63 = **54%** of server modules | `Glob lib/server/csv*.ts` |
| Consumer-less CSV tower | **21** test-only modules, apex `csvReleaseReadinessPackets` | `docs/ai/csv-contract-assessment.md` |
| Non-CSV packet layers | routing / fairness / approval / workflow / audit packets **do** reach `/reports` operator components | grep `{app,components}/**` |
| Prompt duplication | `LOOP.md` ×4 byte-identical (+ `meta` variant); `SPRINT-ROLLOVER.md` ×5 byte-identical | `md5sum prompts/*/…` |
| Prompt surface | 36 files under `prompts/`; 9 in `Old/` archives; ~7 removable via templating | `Glob prompts/**` |
| Test suite | 565 tests, run **`--maxWorkers=1`** (fully serialized); 50 Playwright e2e | `package.json`, `GOAL.md` |
| Gate shape | `lint && typecheck && test && build` on every `agent:check` and Stop hook | `package.json` |

Key correction to an easy misread: the "review packet" pattern is **not**
repo-wide dead weight. It is the repo's core operator-workspace architecture and
is mostly UI-backed. The gold-plating is **localized to the CSV release
sub-tower**, which is already ticketed. Do not generalize a deletion campaign
from it.

## Lever A — bound the per-iteration cost (token + wall-clock)

This is the lever that most directly governs an AI-only project's throughput:
every iteration pays orientation + gate cost before doing any work.

- **A1 — Collapse duplicated prompts to one template.** `LOOP.md` (4 identical
  copies) and `SPRINT-ROLLOVER.md` (5 identical) are maintained by hand and must
  stay in sync forever. One canonical template + runtime `{AGENT}` substitution
  removes ~7 redundant files and a whole class of drift. → **TICKET005**.
- **A2 — Retire the `prompts/**/Old/` archive.** 9 Sprint-4B files are pure
  history; they inflate every `Glob prompts/**` an agent runs at boot. Move to a
  single archive note or delete (git history retains them). → folded into
  **TICKET005**.
- **A3 — Make the test suite parallel-safe.** `--maxWorkers=1` exists almost
  certainly because tests share one SQLite file. As the suite grows past 565,
  serialized execution becomes the dominant inner-loop cost (it runs on *every*
  Stop hook). Per-worker DB isolation would unlock `maxWorkers>1`. → **TICKET007**
  (investigation-first; do not change test infra blindly).
- **A4 — Keep trimming the orientation canon.** The `PLAN.md` trim
  (3382→1465 lines) and the doc-alignment pass are the model: docs that *defer*
  to one source of truth instead of restating it. Continue opportunistically;
  no dedicated ticket.

## Lever B — a ratcheting guard against gold-plating

The CSV tower proves the loop's signature entropy: agents produce contract
layers faster than consumers for them. The fix is not a one-time cleanup — it is
an **automated reachability gate that ratchets**.

- **B1 — Add a "server-module reachability" test.** Build the import graph,
  compute the transitive closure reachable from `app/**` + `components/**`
  entrypoints, and fail if any `lib/server` module falls outside it **and** is
  not on an explicit, documented allowlist. Seed the allowlist with today's 21
  test-only modules so the gate is **green on adoption**, then require the
  allowlist to only ever shrink. This converts the manual TICKET003 audit into a
  standing invariant and would have caught the CSV tower automatically.
  → **TICKET006**.

This is the single highest-leverage change for a *larger* AI-only project: it
makes "consume before you create" a machine-checked rule instead of a hope.

## Lever C — refactor sequencing (lowest-risk first)

Order matters more than scope in a no-reviewer repo (asymmetric risk: docs are
reversible, code deletion is not).

1. **TICKET004** — resolve `csvReleaseReadinessPackets` (terminal apex; safest
   first cut). *Already open.*
2. **TICKET005** — prompt template consolidation (docs/scripts only; reversible).
3. **TICKET006** — reachability gate (adds a test; green-on-adoption ratchet).
4. **TICKET007** — test parallelization investigation (infra; highest risk —
   gated behind its own findings).
5. *Later* — the CSV shared-envelope helper and sibling-layer merges proposed in
   the assessment (separate tickets, after TICKET004 proves the pattern).

## Scaling posture for "a potentially even larger project"

- **Keep:** contract-first (`CRM-CONTRACT.md`), ownership zones, the single
  local gate as the only "done," atomic commits, sacred schema/seed rules. These
  are exactly what lets many agent iterations compose without a human reviewer.
- **Add:** the reachability ratchet (Lever B) so surface growth cannot outrun
  consumer growth unnoticed.
- **Watch:** loop cost (Lever A). Re-measure `lib/server` count, prompt-surface
  size, and test runtime each sprint rollover; treat upward drift as a signal,
  not noise.
- **Do not:** start a speculative rewrite, swap frameworks, or expand the
  permanent non-goals (auth, deployment, external AI, Postgres default, dealer/
  area CRUD, `/deals/[id]`). None are on the critical path to "next level."

## Actionable index

- `tickets/TICKET005.md` — consolidate duplicated agent prompts to one template.
- `tickets/TICKET006.md` — ratcheting server-module reachability gate.
- `tickets/TICKET007.md` — investigate parallel-safe tests (drop `maxWorkers=1`).
- `tickets/TICKET008.md` — fix the 3 CI-only e2e failures, then require `e2e`.
- `tickets/TICKET009.md` — migrate the autonomous loop to PR-based merges so it
  stops relying on admin-bypass (the CI split in PR #5 made green PR merges the
  legitimate path; the loop should use it).

These complement, and do not duplicate, the product roadmap. They are the
infrastructure that lets the product roadmap be executed by agents at larger
scale.
