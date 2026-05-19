# SPRINT-ROLLOVER.md — plan the next sprint for {AGENT}

You are the {AGENT} agent on michaelcrosato/salesforce-lite-crm.
This is a planning-only iteration. Writes only to:
  PLAN.md
  docs/FEATURE-BACKLOG.md (if present)
  SUMMARY.{AGENT}.md
  BLOCKERS.{AGENT}.md

PLAN.md §5 places PLAN.md in the planning/decision zone, editable with
explicit prompt scope or documented planning reason. This prompt IS that
explicit scope.

Per PLAN.md §4 permanent non-goals: a new sprint MUST NOT queue any of
auth, deployment, external AI integration, geocoding, Postgres default,
persistent forecast scenarios, dealer-order/area CRUD, /deals/[id]
route, or global search expansion as features.

============================================================
PHASE 0 — PRE-FLIGHT
============================================================

Same as LOOP.md Phase 0. Baseline must be green; planning on a red
baseline is unsafe. If red, emit "STOPPED: baseline red — fix via LOOP.md
first."

============================================================
PHASE 1 — REVIEW CURRENT SPRINT
============================================================

Read in full:
  1. PLAN.md (all sections)
  2. CRM-CONTRACT.md (if present)
  3. README.md — Known Limitations, Next Recommended Build Step
  4. docs/decisions.md
  5. All four SUMMARY.*.md and BLOCKERS.*.md
  6. docs/FEATURE-BACKLOG.md if present
  7. `git log --oneline --since="30 days ago"`

Confirm current sprint is complete for {AGENT}:
  - All {AGENT}-owned features in PLAN.md §4 current sprint are marked
    done in their respective SUMMARY files.
  - {AGENT}'s active blockers count is zero or near-zero (any active
    blocker should be unrelated to the closing sprint).

If NOT complete:
  STOP. Emit "STOPPED: sprint rollover called but Sprint <N> still has
  open {AGENT} work: <list>. Run LOOP.md instead."

============================================================
PHASE 2 — DRAFT NEXT-SPRINT FEATURES (chat first)
============================================================

Propose 1–4 features for {AGENT}'s §5 zone in the next sprint. Source
candidates from:
  - README.md "Known Limitations" graduating to scope (check that the
    item is NOT in the permanent non-goals list above)
  - PLAN.md §16 backlog items in {AGENT}'s zone (note: B-04, B-05, B-06,
    B-09, B-10, B-12 are explicitly deferred per non-goals — do not
    promote without an IFT-led PLAN.md change)
  - CRM-CONTRACT.md routes/statuses with degraded UI
  - BLOCKERS.*.md recurring technical debt

Each feature:
  ID:                S<N+1>-F<n>
  Title:             <short>
  Owner:             {AGENT}
  Zone:              <PLAN.md §5 zone>
  Acceptance:        <1–3 sentences>
  Dependencies:      <none | other agent deliverable | contract change>
  Estimated iters:   <1 | 2 | 3>
  Non-goals:         <bullet list — explicit per-feature exclusions>

Order features by recommended iteration sequence. Prefer 1-iteration
features without cross-agent dependencies for early slots. At most one
high-risk feature per sprint (anything touching routing decision or
pacing engine).

============================================================
PHASE 3 — APPEND TO PLAN.md §4
============================================================

1. In §4, mark current-sprint features owned by {AGENT} as complete
   (replace `queued` / `active` with `done` per SUMMARY evidence).
2. Append a new sprint section below the current one:

   **Sprint <N+1> — <short name>**
   Goal: <one-sentence sprint goal>

   | Feature | Owner | Status | Acceptance summary |
   |---|---|---|---|
   | S<N+1>-F1 — <title> | {AGENT} | queued | <acceptance> |
   | ... | ... | ... | ... |

   **Sprint <N+1> non-goals** (carry forward EVERY permanent non-goal
   from PLAN.md §4 plus any sprint-specific exclusions):
   - No authentication, permissions, or multi-tenancy.
   - No deployment configuration.
   - No external AI provider integration.
   - No geocoding or territory polygons.
   - No default switch from SQLite to Postgres.
   - No persistent forecast scenarios.
   - No dealer order or routing area create/edit flows.
   - No new /deals/[id] route.
   - No global search expansion.
   - <plus any sprint-specific exclusions>

3. Update Document Control in §1: bump Version (e.g., 2.9D → 2.10A),
   update Last updated, update Active sprint.

Commit:
  git add PLAN.md
  git commit -m "[{AGENT}] sprint <N+1>: plan {AGENT} track"

If docs/FEATURE-BACKLOG.md exists, sync its active table. Commit
separately:
  git add docs/FEATURE-BACKLOG.md
  git commit -m "[{AGENT}] sprint <N+1>: backlog refresh"

============================================================
PHASE 4 — VERIFY GATE
============================================================

Planning shouldn't change runtime behavior. Run:
  npm run lint
  npm run test
  npm run build

Both must remain green. If red, investigate; if not resolvable in one
focused fix, revert the PLAN.md commit, file a `gate` blocker, stop.

============================================================
PHASE 5 — REPORT
============================================================

Rewrite SUMMARY.{AGENT}.md (Next action: "Run LOOP.md to begin
S<N+1>-F1") and BLOCKERS.{AGENT}.md per §13 schema.

Commit reports separately:
  git add SUMMARY.{AGENT}.md BLOCKERS.{AGENT}.md
  git commit -m "[{AGENT}] sprint <N+1>: planning reports"

Push.

============================================================
FINAL CHAT OUTPUT
============================================================

  STATUS:           GREEN
  SPRINT:           <N+1> planned for {AGENT}
  FEATURES QUEUED:  <count>
  NEXT:             run LOOP.md to begin S<N+1>-F1
  STOPPED:          sprint rollover complete

============================================================
GO
============================================================

Begin Phase 0 now.
