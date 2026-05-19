# Project Control

This is the root agent entrypoint for current project state. The detailed
control document lives at `docs/PROJECT-CONTROL.md`.

## Current State

- Primary branch: `main`
- Current product surface: CRM dashboard, accounts, contacts, opportunities,
  activities, leads, dealer orders, areas, forecast, tasks, cases, campaigns,
  reports, and global Ctrl/Cmd+K command-palette search.
- Current contract: `CRM-CONTRACT.md`
- Current local gate: `LOCAL-GATE.md`
- Current demo path and seed anchors: `DEMO.md`
- Current backlog/deferred scope: `docs/FEATURE-BACKLOG.md`

## Source-Of-Truth Order

1. Local gate output.
2. Current operator prompt.
3. `PLAN.md` and `CRM-CONTRACT.md`.
4. `README.md`, `DEMO.md`, and `docs/PROJECT-CONTROL.md`.
5. Agent handoff files such as `SUMMARY.*`, `BLOCKERS.*`, and `*-NOTES.md`.

Historical prompt files under `prompts/` and old agent handoff files can be
stale. Check the working tree and the contract before using them as current
truth.

## Before Changing Code

1. Read `README.md`, `CRM-CONTRACT.md`, `PLAN.md`, and `LOCAL-GATE.md`.
2. Check `git status --short`.
3. Keep changes scoped to the current prompt.
4. Run the relevant gate subset before claiming success.

