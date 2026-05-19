# Local Gate

This is the root agent entrypoint for local validation. The detailed gate
document lives at `docs/LOCAL-GATE.md`.

Run from the repo root in PowerShell:

```powershell
npm install
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
npx prisma generate
npx prisma db push
npm run seed
npm run test
npm run build
npx playwright install chromium
npm run test:e2e
```

The helper script mirrors the sequence:

```powershell
pwsh -File scripts/local-gate.ps1
```

If a gate command fails, record the failing command, exit code, and final
meaningful output in the active agent's blocker file. Do not claim `lint`,
`typecheck`, or `format` passed unless those package scripts exist and were run.

