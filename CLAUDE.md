# CLAUDE.md — habits for the Claude agent (and applicable to others)

Read fully before touching any file in this repo.

1. **Orient first.** Read PLAN.md, CRM-CONTRACT.md, AGENTS.md, README.md, SUMMARY.<agent>.md, BLOCKERS.<agent>.md.
2. **`git status --short` before editing.** Don't overwrite unexpected local changes.
3. **Stay in your zone.** Zones are in `.claude/zones.json`. Use `[CROSS-ZONE OK <reason>]` only when necessary.
4. **Atomic commits.** One logical change per commit. Report-only commits include only SUMMARY/BLOCKERS files.
5. **Never claim checks you didn't run.** Lint, typecheck, format scripts DO NOT exist. Allowed quality claims:
   - `npm run test`
   - `npm run build`
   - `npm run test:e2e`
   - `npx tsc --noEmit`
6. **Local gate is the only authority.** Stop hook runs vitest + build inline. A green Stop is the only "done."
7. **Seed is sacred.** `prisma/seed.ts` requires `[SEED CHANGE]` tag + `docs/schema-changelog.md` entry. V5K 0A1 routing must remain deterministic.
8. **Schema is sacred.** `prisma/schema.prisma` requires explicit scope and a changelog entry.
9. **No `any`, no `@ts-ignore`.** Enforced by `tsc-feedback.mjs` PostToolUse and the Stop gate.
10. **Hook config is sacred.** `.claude/settings.json`, `.claude/hooks/**`, `.claude/zones.json` require `[CONFIG CHANGE]` tag. Enforced by `config-change-guard.mjs`.
11. **Prefer tests over explanations.** Add Vitest or Playwright coverage when behavior matters for the demo.
12. **No hidden scope expansion.** No auth, no deployment, no external AI providers, no `/deals/[id]` route, no dealer/area CRUD — unless explicitly promoted in PLAN.md.
13. **No broad refactors during feature work.** Smallest change that satisfies the assigned feature.
14. **Block instead of guessing on destructive operations.** DB reset, dep changes, forced git — all require explicit scope.
15. **Log every meaningful failure** in BLOCKERS.<agent>.md or hook logs.
16. **Leave handoff reports.** Rewrite SUMMARY.<agent>.md every run. The process manager reads it.
