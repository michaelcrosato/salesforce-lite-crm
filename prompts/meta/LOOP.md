# LOOP.md — one autonomous iteration for {AGENT}

You are the {AGENT} agent on michaelcrosato/salesforce-lite-crm.
This prompt runs ONE full iteration. Re-running it = next iteration.
State carries between iterations via SUMMARY.{AGENT}.md and BLOCKERS.{AGENT}.md.

PRIMARY REFERENCE: PLAN.md (especially §§1–11, §13). Also CRM-CONTRACT.md if
present (per PLAN.md §1).

PLAN.md §2 source-of-truth order: local gate output > current prompt >
PLAN.md / CRM-CONTRACT.md > SUMMARY/BLOCKERS > docs/decisions.md.

============================================================
PHASE 0 — PRE-FLIGHT (no edits, no commits)
============================================================

Determine execution topology per PLAN.md §3:
  single-agent root → C:\dev\salesforce-lite-crm (full repo access)
  codex parallel   → C:\dev\salesforce-lite-crm-codex
  claude parallel  → C:\dev\salesforce-lite-crm-claude
  grok parallel    → C:\dev\salesforce-lite-crm-grok or /c/dev/salesforce-lite-crm-grok
  gemini parallel  → C:\dev\salesforce-lite-crm-gemini

If running from the single-agent root, ownership zones are advisory and branch
prefix is not required. If running from an agent-specific worktree, enforce
parallel-mode ownership zones and branch prefix. If the expected parallel
worktree is missing, file a `dependency` blocker per PLAN.md §10 and stop.
Otherwise run from the worktree root, sequentially, halting on the first
non-zero exit:

  git status --short
  git rev-parse --abbrev-ref HEAD
  git log --oneline -10
  npm install
  if (-not (Test-Path .env)) { Copy-Item .env.example .env }
  npx prisma generate
  npx prisma db push
  npm run seed
  npm run lint
  npm run typecheck
  npm run test
  npm run build

Pass criteria: clean tree; in parallel mode branch matches `{AGENT}/` prefix;
in single-agent root mode the current branch is acceptable; `npm run lint`,
`npm run typecheck`, `npm run test`, and `npm run build` exit 0.

Recovery cases:
  - Unexpected dirty files matching an open `gate` blocker's Evidence list
    (per PLAN.md §6 trailing paragraph): treat as carry-forward, do not
    overwrite, proceed.
  - Other unexpected dirty files: `git stash push -u -m "loop-recovery-<ts>"`.
    Do NOT `git reset --hard` or `git clean -fdx`.
  - `npm run lint`, `npm run typecheck`, `npm run test`, or `npm run build` red on baseline: this iteration's
    work unit becomes "fix the red gate." Skip Phase 2 selection; go to
    Phase 4 with the failure as the target.
  - Wrong active worktree / wrong branch prefix in parallel mode / recovery
    fails: STOP and emit "STOPPED: pre-flight unrecoverable — human
    intervention required."

============================================================
PHASE 1 — ORIENT + RECONCILE (read in full; no edits)
============================================================

Read in full:
  1. PLAN.md — §§1–11, §13, §17 minimum; skim §§12, 14–16.
  2. CRM-CONTRACT.md — if present per PLAN.md §1. If absent, follow §8
     "no invented contract" rule for this iteration.
  3. README.md
  4. SUMMARY.{AGENT}.md and BLOCKERS.{AGENT}.md
  5. The other three agents' SUMMARY.*.md and BLOCKERS.*.md (cross-agent
     coordination context)
  6. docs/decisions.md (historical reference per §17)
  7. Any docs/ or prompts/ files PLAN.md or the SUMMARY files reference

Run repo state scan:
  git diff main...HEAD --stat
  git log --oneline -30

RECONCILE before selecting work. Specifically check:
  - Does PLAN.md §4 current sprint contradict any SUMMARY's "Status: done"
    for the same feature? Per §2, the local gate is authoritative. Trust
    whichever has a recent green gate cited in commits. If unresolvable,
    flag in your SUMMARY "Discovered this prompt" section.
  - Does any SUMMARY reference a sprint id not present in PLAN.md §4
    (e.g., a "Sprint 4B" the SUMMARY claims is integrated but PLAN.md
    doesn't list)? Record the discrepancy. Do not invent §4 entries —
    SPRINT-ROLLOVER.md is the only prompt that may add sprints.
  - Are files PLAN.md says exist (CRM-CONTRACT.md per §1) actually missing?
    File a `contract` blocker per §10.

Output to chat (do NOT write to files) a 5-bullet situation report:
  - Branch / dirty files / baseline gate / current sprint per §4
  - {AGENT}'s active blockers
  - Blockers filed by other agents that may impact {AGENT}'s next move
  - Most recent {AGENT}-owned commit (sha + message)
  - Apparent next work unit candidate

============================================================
PHASE 2 — SELECT (exactly one work unit)
============================================================

Priority order:
  1. Unresolved {AGENT}-owned blocker in BLOCKERS.{AGENT}.md.
  2. In single-agent root mode, next queued feature in PLAN.md §4 that best
     advances the current prompt; in parallel mode, next queued {AGENT}-owned
     feature in PLAN.md §4 (check the Owner column; skip features owned by
     other agents).
  3. Contract drift (CRM-CONTRACT.md vs live code) where the fix is coherent
     for the current topology: anywhere in single-agent root mode, or your
     zone per §5 in parallel mode.
  4. Documentation or report-file consistency fix in your shared zone.

Unit must:
  - In single-agent root mode, touch any repo file needed for one coherent fix.
    In parallel mode, touch only files in your §5 zone, or shared coordination
    zone with documented §10 reason.
  - Be completable this iteration (one focused change).
  - Have one-or-two-sentence acceptance criteria.
  - NOT require a CRM-CONTRACT.md change (file a `contract` blocker if
    it does).
  - NOT require new dependencies, framework config changes, or any of the
    PLAN.md §4 permanent non-goals (auth, deployment, external AI, Postgres
    default, persistent forecast scenarios, dealer-order/area CRUD,
    live /deals/[id] detail route, global search expansion, geocoding).

If no valid unit exists in priorities 1–4:
  STOP. Emit "STOPPED: sprint rollover needed for {AGENT} — paste
  SPRINT-ROLLOVER.md next."

Write to chat:
  SELECTED WORK UNIT
    Title: <one line>
    Source: <PLAN.md §4 row | BLOCKERS.{AGENT}.md #N | contract-drift |
             doc-fix>
    Zone: <full repo in root mode | your §5 zone path in parallel mode>
    Files in scope: <explicit list>
    Cross-zone files needed: <list with §10 justification, or "none">
    Acceptance: <one or two sentences>
    Tests touched: <vitest path | playwright path | none>
    Required gate subset per §9: <minimum check rows for this change type>

============================================================
PHASE 3 — DESIGN (micro-plan; no edits)
============================================================

For each file you will touch, write down:
  - Specific function / component / export to change.
  - Whether a test covers the new behavior. If not, where the test goes. In
    single-agent root mode, add it directly when useful. In parallel mode,
    another agent's zone may require a coordination blocker.
  - New `data-testid` attributes (catalog for Gemini): naming
    `<entity>-<element>-<purpose>`, kebab-case.
  - Rollback path: `git reset --soft HEAD~N` before commits, or
    `git revert <sha>` after.

Plan commit boundaries (PLAN.md §7 requires atomic commits).
Plan commit messages: `[{AGENT}] <feature-id>: <subject, ≤72 chars,
imperative>`.

============================================================
PHASE 4 — IMPLEMENT (atomic commits)
============================================================

For each logical change:
  1. Edit file(s).
  2. `git add <files>`
  3. `git commit -m "[{AGENT}] <feature-id>: <subject>"`

Constraints per PLAN.md §§7, 8, 11:
  - One logical change per commit.
  - In parallel mode, no edits outside your zone unless documented per §10.
    In single-agent root mode, ownership zones are advisory.
  - No new dependencies; no new package.json scripts.
  - No `any`, `@ts-ignore`, `@ts-expect-error`, or `as unknown as` bypasses
    in files you author or edit.
  - Do not invent `format` script runs — it does not exist in package.json (§9, §11).
  - Do not commit generated DB files, build artifacts, logs, or
    screenshots.

If a cross-zone edit is unavoidable in parallel mode: keep it minimal, document
the §10 reason in SUMMARY's "Completed this prompt" entry and in BLOCKERS if
material. In single-agent root mode, summarize repo-wide scope but do not file a
blocker solely for crossing historical zones.

============================================================
PHASE 5 — VERIFY (gate + bounded fix loop)
============================================================

Run the §9 minimum check subset for your change type. When the change
type is unclear or spans multiple types, run the full §9 sequence.

Full §9 sequence (from worktree root):
  npm install
  if (-not (Test-Path .env)) { Copy-Item .env.example .env }
  npx prisma generate
  npx prisma db push
  npm run seed
  npm run lint
  npm run typecheck
  npm run test
  npm run build
  npx playwright install chromium
  npm run test:e2e

If green: go to Phase 6.

If red, bounded fix loop:
  - Attempt 1: smallest focused fix allowed by the current topology. Re-run the
    failing command; if green there, re-run the full subset.
  - Attempt 2: one more focused fix. Re-run.
  - After Attempt 2 fails: STOP fixing. Choose one path:
      (a) Revert this iteration's implementation commits
          (`git reset --soft HEAD~N`, then selectively re-commit clean
          parts), OR
      (b) Leave the failed state uncommitted in your worktree.
    Then file a `gate` blocker per §10 with:
      - failing command and exit code
      - last meaningful error block (no megabytes of trace)
      - list of files left uncommitted in worktree (per §6 trailing
        paragraph, this is required so the next iteration's Phase 0
        recovery treats the dirty state correctly)
      - hypothesized root cause
      - safe next action
    Skip Phase 6 implementation commit (per §6 step 7); still do
    Phase 6 reports.

============================================================
PHASE 6 — REPORT
============================================================

Rewrite SUMMARY.{AGENT}.md in full per PLAN.md §13 schema. `Commits this
prompt` lists implementation commit short SHAs from Phase 4 (or `none`
if Phase 5 blocked them). Does NOT list the report-only commit below.

Rewrite BLOCKERS.{AGENT}.md in full per §13 schema (empty Active blockers
table is acceptable).

Commit reports separately (PLAN.md §7 report-only commit format):
  git add SUMMARY.{AGENT}.md BLOCKERS.{AGENT}.md
  git commit -m "[{AGENT}] <feature-id>: update reports"

Push:
  git push origin <branch>

============================================================
FINAL CHAT OUTPUT (last lines)
============================================================

  STATUS:    <GREEN | RED | BLOCKED>
  WORK UNIT: <title>
  COMMITS:   <count this iteration, including the report commit>
  NEXT:      <next work unit title | SPRINT ROLLOVER NEEDED | MERGE READY>
  STOPPED:   <reason — "iteration complete" | "red gate after 2 attempts" |
              "sprint rollover needed" | "merge ready" |
              "pre-flight unrecoverable">

============================================================
GO
============================================================

Begin Phase 0 now.
