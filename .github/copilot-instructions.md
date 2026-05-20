# Repository Instructions

Follow `AGENTS.md`, `PLAN.md`, and `CRM-CONTRACT.md` as the source of truth for autonomous work in this repository.

This repository is configured for max-YOLO repo-local execution. Do not ask for manual approval before running ordinary local setup, test, build, e2e, cleanup, or git workflow commands that are already authorized by the repo instructions.

The standard local gate is:

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

Do not force-push, rewrite history, delete worktree directories, delete source files as cleanup, or add product scope unless the user explicitly requests that operation.
