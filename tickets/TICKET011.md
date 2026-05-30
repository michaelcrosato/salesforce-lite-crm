# TICKET011 — harden agent helper scripts for non-NPM environments

- **Status:** Done (2026-05-29)
- **Priority:** Medium

## Goal

Replace hard-coded npm assumptions in AFK helper scripts with package-manager-aware
detection and explicit failure/success reporting so automation works in mixed
environments.

## Context

`scripts/agent/bootstrap.sh`, `doctor.sh`, `lint.sh`, `typecheck.sh`,
`test.sh`, `check.sh`, and `format.sh` assumed npm availability and did not all
report skipped checks consistently.

## Scope

- In: `scripts/agent/bootstrap.sh`, `scripts/agent/doctor.sh`, `scripts/agent/status.sh`,
  `scripts/agent/lint.sh`, `scripts/agent/typecheck.sh`, `scripts/agent/test.sh`,
  `scripts/agent/check.sh`, `scripts/agent/format.sh`.
- Out: package manager migration, `package-lock`/`pnpm-lock` policy changes, CI
  workflow edits.

## Likely files

`scripts/agent/*.sh` (listed above), `package.json` (script names unchanged),
`AGENTS.md` (for usage docs).

## Steps

1. Add deterministic PM detection from lockfiles/environment variable overrides.
2. Keep all scripts fail-fast on missing required binaries.
3. Make `check.sh` skip absent optional checks with explicit logs and fail only on
   required missing checks.
4. Reuse package-manager commands from `agent:*` script names and keep behavior
   non-destructive.

## Acceptance criteria

- [x] `scripts/agent/*.sh` no longer hard-code `npm`/`npx` in required flows.
- [x] Missing checks are explicitly reported in `check.sh` with skip messages.
- [x] `agent:check` remains non-e2e and still includes lint, typecheck, test, build.
- [x] No behavioral code changes outside `scripts/agent`.

## Commands

```powershell
npm run agent:bootstrap
npm run agent:check
npm run agent:format
npm run agent:status
```

## Risks

Tooling behavior can mask missing `npx` in npm-only legacy steps; these scripts
still require `npm`/`node` on this branch per local setup.
