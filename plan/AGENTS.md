# plan/AGENTS.md — execution runtime rules

Rules for any agent executing the `plan/` blueprint. **This file does not override the repo root authorities** — `CLAUDE.md`, root `AGENTS.md`, `PLAN.md`, and `CRM-CONTRACT.md` win on every conflict. This is the short, execution-focused handoff for working the 24 specs.

---

## The loop (per spec)

1. **Pick** the top unblocked spec from `plan/PROGRESS.md` (respect the wave order + each spec's `Depends on`). Don't start a spec whose dependencies are not `[x] Done`.
2. **Read** that spec file end-to-end (`plan/specs/NNN_*.md`) and its Scope-gate. If the gate says ⚠️ (dependency/scope approval) — **stop and file a promotion request; do not execute.**
3. **`git status --short`** before editing. Never overwrite unexpected local changes.
4. **Mark** the spec `[ ] In Progress` in `plan/PROGRESS.md`.
5. **Change** — the smallest edit that satisfies the spec's Definition of Done. No scope expansion, no opportunistic refactors (CLAUDE.md §12–13).
6. **Test** — write/extend the coverage named in the spec's Test Strategy first, then run the gate.
7. **Verify** — run the **exact gate** below. A green gate is the only "done."
8. **Tick** every Definition-of-Done checkbox in the spec, set `plan/PROGRESS.md` to `[x] Done`, and rewrite `SUMMARY.<agent>.md`.
9. **Commit atomically** — one logical change per commit. Then follow the Merge Path.

---

## The verification gate (exact commands)

Only these four claims are allowed (CLAUDE.md §5). Never claim a check you didn't run.

```powershell
npm run test          # vitest run --maxWorkers=1   (565 tests green @ baseline)
npx tsc --noEmit      # zero errors; no `any`, no `@ts-ignore` (CLAUDE.md §9)
npm run build         # Next 16 / Turbopack production build
npm run test:e2e      # Playwright 1.60 — when UI/flows change
```

- `npm run lint` (`eslint . --max-warnings=0`) and `npm run typecheck` (`tsc --noEmit --pretty false`) are also real scripts and part of `npm run agent:check`.
- **`npm run agent:check`** = lint + typecheck + test + build in one shot — use it as the standard non-e2e gate.
- The **Stop hook** runs vitest + build inline; a green Stop is the authoritative local "done" (CLAUDE.md §6).
- There is **no** `format` script, no standalone lint/format step to invent (CLAUDE.md §5). Do not claim checks that don't exist.

**Full gate incl. e2e** (from `docs/LOCAL-GATE.md`, run from repo root):

```powershell
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
```

---

## Validation guardrails (hard stops)

| Surface | Rule | Authority |
|---|---|---|
| `prisma/seed.ts` | **Sacred.** Needs `[SEED CHANGE]` tag + `docs/schema-changelog.md` entry. Deterministic V5K 0A1 routing must stay stable. | CLAUDE.md §7 |
| `prisma/schema.prisma` (+ `schema.postgres.prisma`) | **Sacred.** Explicit scope + changelog entry. Prefer validated JSON in an existing column over a migration (see spec 019). | CLAUDE.md §8 |
| `.claude/settings.json`, `.claude/hooks/**`, `.claude/zones.json` | Need a `[CONFIG CHANGE]` tag. | CLAUDE.md §10 |
| Types | **No `any`, no `@ts-ignore`** — enforced by `tsc-feedback.mjs` PostToolUse + the Stop gate. | CLAUDE.md §9 |
| Dependencies / npm scripts | **No new dep or script without explicit scope.** Blocks specs 006, 010, 017, 023 until approved. | CLAUDE.md §14 / LOOP §11 |
| Destructive ops | DB reset, dep removal, forced git — **block and ask**, don't guess. | CLAUDE.md §14 |
| Hooks | Never skip (`--no-verify`) or bypass signing. Fix the underlying issue. | CLAUDE.md |
| Commits | Atomic, one logical change. Report-only commits carry only SUMMARY/BLOCKERS. | CLAUDE.md §4 |
| `PLAN.md` | Committed with **mixed CRLF/LF line endings** (`core.autocrlf=false`). The Edit tool normalizes them → corruption. Use a **byte-precise** method for any `PLAN.md` edit, not Edit. | repo trap |

---

## Merge path (the only route to `main`)

`main` is protected; it accepts changes only via a PR whose required **`gate`** check (lint + typecheck + test + build on CI) is green.

1. Work on a branch — `<prefix>sprint-<id>-<feature-slug>` (parallel mode: `<agent>/<feature>`).
2. `git push origin <branch>`.
3. `gh pr create --base main --fill`.
4. `gh pr checks <branch> --watch` — wait for the required `gate`.
5. `gh pr merge <branch> --squash --delete-branch` — **never `--admin`, never force.**

If `gate` is red: leave the PR open, file a `gate` blocker, fix on the branch, let `gate` re-run. The `e2e` CI job is currently advisory (`continue-on-error`; **spec 013 makes it required** — `enforce_admins`/branch-protection flips are the *last* step, only after green is proven, per specs 013 & 016). Full procedure: `prompts/shared/MERGE.md`.

---

## Dependency-gated specs (blocked until approved)

Blueprinted but **must not execute** without a human/promotion request clearing the new dependency:

- **006** — `@vitest/coverage-v8` (coverage provider).
- **010** — DOM test env (`@testing-library/react` + `jsdom` *or* Vitest Browser Mode). `@testing-library/jest-dom@6.9.1` is already a devDep; the renderer + env are missing.
- **017** — `babel-plugin-react-compiler` (and accepting Babel-based builds). Spike + decision, not guaranteed adoption.
- **023** — Tailwind 4 + `@tailwindcss/postcss` (major bump; standalone PR).

For all others, proceed without asking — take the safest assumption, document it in the spec + `SUMMARY.<agent>.md`, and continue (root `AGENTS.md` "Autonomous vs Ask").

---

## Non-goals (never build during execution)

Auth · deployment · external AI providers · Salesforce integration · Postgres-as-default · dealer/area CRUD · live `/deals/[id]` route (use the `/deals?deal=<id>` drawer) · dedicated `/search` page (Cmd/Ctrl+K palette is the search surface) · geocoding · persistent forecast scenarios · **CSV import-apply** beyond the bounded Sprint 40 contact-create path · background jobs.

`Lead` = consumer dealer-routed lead (not a generic B2B conversion flow). Deterministic AI-style summarization stays the default. Promotion in `PLAN.md` is required before any non-goal becomes buildable.

---

## Definition of "spec complete"

All four gate claims attempted with **real recorded results**; every Definition-of-Done checkbox in the spec ticked; `plan/PROGRESS.md` set to `[x] Done`; out-of-scope findings filed as their own spec/ticket (not a half-fix); `SUMMARY.<agent>.md` rewritten; the change merged via the gated PR path. Determinism preserved. No unexplained failures.
