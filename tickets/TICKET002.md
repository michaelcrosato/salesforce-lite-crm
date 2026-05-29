# TICKET002 — Reduce PLAN.md context noise (archive completed-sprint detail)

- **Status:** Done (2026-05-28)
- **Priority:** Medium
- **Result:** `PLAN.md` trimmed 3382 → 1465 lines. §4 now states the permanent
  non-goals once, indexes Sprints 4–55 in a compact table, and keeps the active
  sprint (56) inline. Completed-sprint detail (feature tables + per-sprint
  non-goals) moved verbatim to `docs/PLAN-ARCHIVE.md` (2006 lines). All live
  rules (§1–3, §5–17) preserved byte-for-byte. No code/contract/schema change;
  no broken cross-references (refs point to the still-present §4 section, not to
  removed anchors).

## Goal

Cut the agent-context cost of `PLAN.md` (~3.4k lines) by moving verbose
completed-sprint acceptance prose into an archive, leaving an active execution
core. Pure documentation hygiene — no rule or contract changes.

## Context

`PLAN.md` documents 56 sprints. Sprints 5–23 are near-duplicate read-only CSV
"handoff contract" entries, each repeating a long non-goals block. Every agent
pays to read this on orientation. The active execution rules (§1–4, source of
truth, topology, current sprint) are a small fraction of the file.

## Scope

- In: move completed-sprint tables/non-goals into `docs/PLAN-ARCHIVE.md` (or
  `docs/sprint-history.md`); keep a one-line index per sprint in `PLAN.md`;
  preserve §1–4 and all live rules verbatim.
- Out: changing any rule, contract, sprint status, or ownership zone; deleting
  history (move, don't drop).

## Likely files

`PLAN.md`, new `docs/PLAN-ARCHIVE.md`, references in `README.md` /
`docs/PROJECT-CONTROL.md`.

## Steps

1. Identify the live-rules core vs. completed-sprint detail.
2. Move completed-sprint detail to the archive doc with a header explaining it.
3. Replace moved sections with a compact index linking the archive.
4. Grep for inbound references to moved anchors; update them.
5. Run the gate (docs-only, but confirm nothing imports PLAN.md).

## Acceptance criteria

- [x] `PLAN.md` live rules (§1–4 + source-of-truth + topology) unchanged in meaning.
- [x] Completed-sprint detail preserved in an archive doc, not deleted.
- [x] No broken doc cross-references.
- [x] No code/contract/schema change.

## Commands

```powershell
npm run lint ; npm run typecheck ; npm run test ; npm run build
```

## Risks

PLAN.md is shared coordination canon (CLAUDE.md zone). Treat as a deliberate,
reviewed doc change; preserve every live rule.

## Notes

This is hygiene, not a rewrite. If unsure whether a section is "live," keep it.
