# Local Gate

Run from the repo root in PowerShell:

```powershell
npm install
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
npx prisma generate
npx prisma db push
npm run seed
npm run lint
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
lint             eslint .
seed             tsx prisma/seed.ts
test             vitest run --maxWorkers=1 --minWorkers=1
test:e2e         npm run seed && playwright test
prisma:postgres  node scripts/prisma-postgres.mjs
autonomy:overnight  powershell -ExecutionPolicy Bypass -File scripts/autonomy-loop.ps1
```

There are no `typecheck` or `format` package scripts unless `package.json`
later adds them. Do not claim those checks passed unless the exact commands
exist and were run.
