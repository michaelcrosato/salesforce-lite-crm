Implemented and committed the docs-only roadmap finalization.

Changed:
- Added canonical roadmap: [docs/ROADMAP.md](C:/dev/salesforce-lite-crm/docs/ROADMAP.md)
- Added trace artifact: [docs/roadmap/ROADMAP-IFT-R1-REVIEW.md](C:/dev/salesforce-lite-crm/docs/roadmap/ROADMAP-IFT-R1-REVIEW.md)
- Updated README, PLAN, and PROJECT-CONTROL references to point at the canonical roadmap.
- Did not create `docs/AI-ROADMAP.md` or `docs/ARCHITECTURE.md`.

Commits:
- `e579117` - `[codex] docs: finalize canonical roadmap`
- `8d6d994` - `[codex] docs: update reports`

Checks run:
- `git diff --check`
- `git diff --cached --check`
- Local roadmap link-target verification with `Test-Path`

Full runtime gate was not run because this was docs-only and made no runtime claims. `git status` is clean; branch is ahead of origin by 2 commits.