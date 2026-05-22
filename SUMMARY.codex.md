Agent: Codex

Sprint: 5 candidate

Feature: Roadmap canon

Branch: codex/sprint-5-roadmap-canon

Status: done

Commits this prompt: eace3bb - [codex] docs: expand roadmap canon

Gate status: PASS

DoD self-check: PASS

Timestamp: 2026-05-20T00:12:55-07:00

Approximate model tokens/spend this prompt: unknown

### Completed this prompt

- Created the expanded roadmap canon with `docs/ROADMAP.md` as the product
  roadmap and new companion docs: `docs/AI-ROADMAP.md`,
  `docs/ARCHITECTURE.md`, `docs/EVALS.md`, and
  `docs/SECURITY-PRIVACY.md`.
- Updated `PLAN.md` to record Sprint 5 as the recommended next sprint while
  keeping the change proposal-only; §4 does not activate feature
  implementation.
- Extended PLAN §16 with B-NN grounded proposal entries through the roadmap
  IDs requested in the prompt and added a §17 run decision for the roadmap
  canon update.
- Updated `README.md`, `docs/FEATURE-BACKLOG.md`, and
  `docs/PROJECT-CONTROL.md` to point at the new roadmap and companion docs
  without changing shipped product scope.
- Left `CRM-CONTRACT.md` and `docs/schema-changelog.md` unchanged because no
  implemented entity, route, model, feature flag, adapter signature, schema, or
  seed behavior changed.
- Verification: `scripts/local-gate.ps1` passed in full, including
  `npm install`, Prisma generate/db push, seed, lint, typecheck, unit tests,
  build, Chromium install, and Playwright e2e.

### Next action

Review and merge the roadmap PR. Sprint 5 implementation still requires an
explicit §4 promotion or follow-up implementation prompt.

### Scope confirmation

Cross-zone edits: YES  (shared roadmap/PLAN/README/project-control docs were
explicitly in scope for this prompt)

CRM-CONTRACT.md honored:  YES
