# REVIEW.CODEX.md

## Readiness Verdict

PASS. The repo is locally validated and ready for the next scoped Sprint 4 push,
subject to normal human diff review before commit/push.

## Docs And Contract Drift

- Fixed stale worktree and branch topology in project-control docs.
- Clarified that `/deals/[id]` is not a live detail route; placeholder-only or
  404 behavior remains allowed for excluded routes.
- Marked old Sprint 4B prompt artifacts as historical and kept active next-push
  prompts in `docs/NEXT-PROMPTS.md` and `prompts/shared/s4-f*.md`.
- Updated backlog/demo/checklist docs to reflect live `/tasks`, `/cases`,
  `/campaigns`, and `/reports` routes.
- Confirmed package-script docs match `package.json`; `npm run lint` and
  `npm run typecheck` both exist and are part of the local gate, while the
  format script remains absent.

## Code And Test Issues

- Removed the globally mounted command palette and its unused action/component
  because the current contract excludes command-palette and expanded global
  search UI.
- Updated `/search` and `/command-palette` excluded placeholders to match the
  contract.
- Removed non-contract dealer trophy/hype/prophecy helpers, tests, and seed rows
  that were outside the CRM route/entity contract.
- Removed a stale skipped Playwright placeholder spec that referenced fake
  selectors and was not part of the active smoke coverage.
- Restored generated `next-env.d.ts` noise after `next build`.
- Added the Next ESLint flat config and wired `npm run lint` into the local
  gate.
- Added an explicit `npm run typecheck` gate and fixed test-only type drift so
  standalone `tsc --noEmit` remains green outside `next build`.
- Refactored excluded-route e2e coverage to derive its path list from
  `EXCLUDED_ROUTES`, reducing contract/test drift risk.
- Added shared query-param sanitizers for list pages and covered blank/invalid
  filter params with focused Vitest tests.
- Hardened forecast scenario query parsing so invalid multiplier or assignment
  params do not erase valid area or sibling numeric filters.
- Hardened shared date formatters so invalid values render empty-state labels
  instead of throwing or producing `NaN` relative dates.

## Remaining Risks

- `npm audit --audit-level=critical` now passes after exact dev dependency
  updates. The remaining 10 audit findings are moderate and npm's suggested
  fixes require breaking/downgrade paths for `prisma`, `next`, or `vitest`.
- Historical non-Codex report files still contain prior-session details; Codex
  added supersession notes where current tree claims would otherwise be
  misleading.

## Final Validation Results

| Command | Result |
|---|---|
| `npm install` | PASS |
| `npx prisma generate` | PASS |
| `npx prisma db push` | PASS |
| `npm run seed` | PASS |
| `npm run lint` | PASS |
| `npm run typecheck` | PASS |
| `npm run test` | PASS, 150 tests |
| `npm run build` | PASS |
| `npx playwright install chromium` | PASS |
| `npm run test:e2e` | PASS, 19 passed |
| `scripts/local-gate.ps1` | PASS |
| `npm audit --audit-level=critical` | PASS, 10 moderate findings remain |
| `git diff --check` | PASS |

## Git Status Summary

Working tree has intentional readiness changes only. Generated local artifacts
remain ignored (`.env`, `.next/`, `node_modules/`, `prisma/dev.db*`,
`test-results/`, logs).
