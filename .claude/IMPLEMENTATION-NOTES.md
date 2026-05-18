# Implementation Notes

Implemented: 2026-05-17
By: Claude Code (Opus 4.7, 1M context)

## API verification

Cross-checked against https://code.claude.com/docs/en/hooks on 2026-05-17.

- [x] `hookSpecificOutput.permissionDecision` values: allow|deny|ask|defer
- [x] PreToolUse `matcher` field
- [x] `if` field permission-rule syntax (e.g. `Bash(rm *)`, `Edit(*.ts)`)
- [ ] Stop `stop_hook_active` field — **UNDOCUMENTED in current docs**. Kept the guard anyway: `if (undefined)` is falsy and harmless if the field is absent; if it IS present we get the loop break that R23 required. Worst case: degrades to no guard, no behavior change. See `validate-stop.mjs`.
- [x] PostToolUseFailure event (tool-level matcher)
- [x] ConfigChange event + matchers (`user_settings|project_settings|local_settings|policy_settings|skills`), blockable via top-level `decision: "block"`
- [x] SessionStart matcher values: startup|resume|clear|compact
- [x] UserPromptSubmit event with no matcher support (documented as "always fires")
- [x] Hook commands via type=command + command + args[] (exec form, no shell)
- [x] Notification event

## Drift found

Only one drift: `stop_hook_active` is not in the public docs. Kept the field check as a defensive no-op (works if present, harmless if absent).

## Adaptations from R23

1. **Settings merge, not overwrite.** `.claude/settings.json` already existed with a `permissions.allow[]` block. Merged the `hooks` block in alongside it instead of replacing the file.

2. **Existing process docs PRESERVED, NOT overwritten.** R23's Phase 1 claimed `PLAN.md`, `AGENTS.md`, `CLAUDE.md`, `CRM-CONTRACT.md`, `docs/LOCAL-GATE.md`, `SUMMARY.*.md`, `BLOCKERS.*.md` did not exist. Reality on this branch:
   - `PLAN.md` — exists, version 2.9D, full R29/R30 decision log. **Stub would have destroyed substantial planning content. Kept as-is.**
   - `AGENTS.md` — exists with operating policy and roster. Kept as-is.
   - `CRM-CONTRACT.md` — exists with full entity model + adapter signatures. Kept as-is.
   - `docs/LOCAL-GATE.md` — exists. Kept as-is.
   - `SUMMARY.claude.md`, `SUMMARY.codex.md`, `SUMMARY.grok.md`, `SUMMARY.gemini.md` — exist (LOWERCASE agent names). Kept as-is.
   - `BLOCKERS.claude.md`, `BLOCKERS.codex.md`, `BLOCKERS.grok.md`, `BLOCKERS.gemini.md` — exist (LOWERCASE). Kept as-is.
   - `CLAUDE.md` — did NOT exist. Created from R23 stub.
   - `docs/schema-changelog.md` — did NOT exist. Created from R23 stub.

3. **Lowercase agent keys in `.claude/zones.json` and `.claude/active-agent`.** Existing repo convention is lowercase (`SUMMARY.claude.md`, not `SUMMARY.Claude.md`). R23 used capitalized keys ("Codex", "Claude", "Grok", "Gemini"). Switched to lowercase so that `SUMMARY.${agent}.md` lookups in `validate-stop.mjs` / `session-start.mjs` resolve to the actual files. `activeAgent()` in `_lib.mjs` normalizes to lowercase regardless of source (env var, file, default).

4. **Case-insensitive zone lookup.** `protect-agent-zones.mjs` builds a lowercased copy of the zones map so `CLAUDE_AGENT=Claude` still works even though canonical zones key is `claude`.

5. **Node `.mjs` scripts (not PowerShell .ps1).** Repo `package.json` has `"type": "module"`; existing scripts (`ensure-sqlite-db.mjs`, `prisma-postgres.mjs`) are Node ESM. Cross-platform.

6. **`scripts/local-gate.ps1` does not exist.** Confirmed. `validate-stop.mjs` runs vitest + build inline. When a real local-gate script lands, swap the inline calls.

7. **Hooks tolerate missing process docs.** `safeRead` returns null on missing files; `session-start` and `scope-guard` produce "missing" warnings rather than crashing.

8. **Quality-claim allowlist.** No `lint` / `typecheck` / `format` npm scripts exist. Hooks and CLAUDE.md only mention `npm run test`, `npm run build`, `npm run test:e2e`, `npx tsc --noEmit`.

## Files created (not in original repo)

- `.claude/settings.json` — MERGED (added hooks; kept permissions)
- `.claude/zones.json`
- `.claude/active-agent`
- `.claude/hooks/_lib.mjs`
- `.claude/hooks/block-destructive.mjs`
- `.claude/hooks/protect-files.mjs`
- `.claude/hooks/protect-agent-zones.mjs`
- `.claude/hooks/tsc-feedback.mjs`
- `.claude/hooks/validate-stop.mjs`
- `.claude/hooks/scope-guard.mjs`
- `.claude/hooks/session-start.mjs`
- `.claude/hooks/failure-log.mjs`
- `.claude/hooks/log-event.mjs`
- `.claude/hooks/notify.mjs`
- `.claude/hooks/config-change-guard.mjs`
- `.claude/logs/.gitignore`
- `.claude/IMPLEMENTATION-NOTES.md` (this file)
- `CLAUDE.md`
- `docs/schema-changelog.md`
- `.gitignore` — appended log-ignore entries
