# TICKET005 — consolidate duplicated agent prompts to one template

- **Status:** Open
- **Priority:** Medium
- **Depends on:** none. Context: `docs/ai/NEXT-LEVEL.md` Lever A1/A2.

## Goal

Remove the byte-identical per-agent prompt duplication so the autonomous loop's
orientation surface is smaller and cannot drift between agents.

## Context

`prompts/<agent>/LOOP.md` has 4 byte-identical copies (claude, codex, gemini,
grok — verified via `md5sum`; `meta/LOOP.md` is a legitimate variant).
`prompts/<agent>/SPRINT-ROLLOVER.md` has 5 byte-identical copies. All use the
`{AGENT}` placeholder, so the per-agent files differ only by path, not content.
Per-agent `README.md` files genuinely differ and are **out of scope**.
Separately, `prompts/**/Old/` holds 9 Sprint-4B archive files that inflate every
`Glob prompts/**` an agent runs at boot.

Maintaining N identical copies by hand guarantees future drift and costs tokens
on every iteration's Phase-1 orient.

## Scope

- In: introduce one canonical `prompts/shared/LOOP.md` and one
  `prompts/shared/SPRINT-ROLLOVER.md`; make the loop runner resolve the shared
  template and substitute `{AGENT}` at dispatch time; preserve `meta/LOOP.md` as
  its own variant; remove the redundant per-agent copies. Retire `prompts/**/Old/`
  to a single archive pointer (or delete — git history retains them).
- Out: changing prompt *content/semantics*, per-agent `README.md` files,
  `CRM-CONTRACT.md`, app/lib code, the gate.

## Likely files

`prompts/shared/LOOP.md` (new), `prompts/shared/SPRINT-ROLLOVER.md` (new), the
redundant `prompts/{claude,codex,gemini,grok}/LOOP.md` and
`prompts/{claude,codex,gemini,grok,meta}/SPRINT-ROLLOVER.md`, the loop runner
(`scripts/autonomy-loop.ps1` and/or `scripts/start-codex-overnight.ps1` — read
first to confirm how it resolves prompt paths), `prompts/README.md` (document the
new layout), `prompts/**/Old/**`.

## Steps

1. Read the loop runner scripts to confirm exactly how `prompts/<agent>/*.md` is
   located and whether substitution already happens at runtime.
2. Move one canonical copy to `prompts/shared/`; point the runner at it with
   `{AGENT}` substitution; keep `meta` overrides explicit.
3. Delete the redundant identical copies in the same commit as the runner change
   (no half-wired state).
4. Retire `Old/` archives; update `prompts/README.md`.
5. Dry-run the runner for at least two agents (e.g., claude + meta) to confirm
   the right text is produced.

## Acceptance criteria

- [ ] No two prompt files are byte-identical except by explicit shared template.
- [ ] Loop runner produces the correct per-agent text (claude and meta verified).
- [ ] `prompts/README.md` documents the shared-template layout.
- [ ] `npm run test` + `npm run build` green (no app/lib behavior changed).

## Commands

```powershell
md5sum prompts/*/LOOP.md ; md5sum prompts/*/SPRINT-ROLLOVER.md
npm run test ; npm run build
```

## Risks

The loop runner is operational infrastructure — a wrong path resolution breaks
every overnight iteration. Read the runner before editing; verify with a dry-run.
Touches `scripts/**`, not `.claude/**`, so no `[CONFIG CHANGE]` tag — but confirm
that boundary before committing.
