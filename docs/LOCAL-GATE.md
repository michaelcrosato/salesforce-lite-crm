# Local Gate

Run from the repo root in PowerShell:

```powershell
npm install
npm audit --audit-level=high   # security gate: blocks High/Critical (matches CI)
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

The helper script mirrors this sequence:

```powershell
scripts/local-gate.ps1
```

The gate fails fast on the first non-zero command. Record the failing command,
exit code, and final meaningful output in the active agent's blocker file.

## Package Scripts

Current `package.json` scripts:

```text
postinstall      node scripts/ensure-sqlite-db.mjs
dev              next dev
build            next build
lint             eslint . --max-warnings=0
typecheck        tsc --noEmit --pretty false
seed             tsx prisma/seed.ts
test             vitest run
test:e2e         npm run seed && playwright test
prisma:postgres  node scripts/prisma-postgres.mjs
autonomy:overnight  powershell -ExecutionPolicy Bypass -File scripts/autonomy-loop.ps1
autonomy:watchdog  powershell -ExecutionPolicy Bypass -File scripts/start-codex-overnight.ps1
agent:bootstrap      npm install + prisma generate/push + seed
agent:check          lint + typecheck + test + build
agent:status         status + open ticket list
agent:format         no formatter configured (lint is style gate)
```

There is no direct `format` package script; style checks are enforced by `lint`.
`agent:format` intentionally reports skip/no-op in this branch. Do not claim checks
passed unless the exact commands exist and were run.
