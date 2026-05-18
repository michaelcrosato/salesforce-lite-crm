Agent: codex
Sprint: repo readiness/documentation pass
Feature: README product repositioning and Sprint 4 prompt preparation
Branch: chore/claude-hooks-r23
Status: complete
Commits this prompt: none
Gate status: PASS
DoD self-check: PASS
Timestamp: 2026-05-17T21:53:51.8364345-07:00

### Completed this prompt
- Rewrote `README.md` so the project is framed as a full-fledged,
  AI-adaptive Salesforce-style CRM for small business requirements, not as a
  demo or proof-of-concept.
- Added the required AI-agent Read First list, local setup commands, local URL,
  database notes, Postgres switching notes, Dealer Revenue Command Center
  capabilities, core routes/workflows, scripts, full gate, Vitest/Playwright
  coverage, known limitations, and roadmap to `README.md`.
- Updated `docs/PROJECT-CONTROL.md` to mark the readiness/documentation pass
  complete and record that README reflects the updated product vision.
- Prepared `docs/NEXT-PROMPTS.md` for Sprint 4 while keeping the prompts aligned
  with `PLAN.md` and `CRM-CONTRACT.md`.
- Ran the full local gate successfully:
  `npm install`; `if (-not (Test-Path .env)) { Copy-Item .env.example .env }`;
  `npx prisma generate`; `npx prisma db push`; `npm run seed`;
  `npm run test`; `npm run build`; `npx playwright install chromium`;
  `npm run test:e2e`.
- Restored the `next-env.d.ts` build-generated side effect so the final diff
  remains limited to documentation and Codex report files.

### Next action
Start Sprint 4 using `docs/NEXT-PROMPTS.md`, then run the relevant local gate
before any merge.

### Scope confirmation
No cross-ownership edits: NO - the current prompt explicitly scoped README and
docs updates.
CRM-CONTRACT.md honored: YES
No product features added: YES
