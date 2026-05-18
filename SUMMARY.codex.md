Agent: codex
Sprint: repo-readiness; process cleanup
Feature: Configure agent permission and instruction files
Branch: main
Status: done
Commits this prompt: fc3e998 - [codex] repo-readiness: add agent permission configs
Gate status: PASS
DoD self-check: PASS
Timestamp: 2026-05-17T18:18:22-07:00

### Completed this prompt
- Verified current Claude Code docs: shared project settings live at `.claude/settings.json`; `permissions.allow` uses rules such as `Bash(npm run *)`.
- Verified current Cursor docs: project rules now live in `.cursor/rules/*.mdc`; root `.cursorrules` is legacy/deprecated.
- Verified current GitHub Copilot docs: repository-wide instructions live at `.github/copilot-instructions.md`.
- Verified current Gemini CLI docs: workspace settings live at `.gemini/settings.json`; `tools.allowed` can bypass confirmation for command prefixes; `GEMINI.md` is the project context file.
- Added `.claude/settings.json`, `.cursor/rules/max-yolo.mdc`, `.github/copilot-instructions.md`, `.gemini/settings.json`, and `GEMINI.md`.
- Validated JSON with PowerShell `ConvertFrom-Json` and ran `git diff --cached --check`.

### Dirty inventory classification
- Intentional agent config/instruction changes: committed in `fc3e998`.
- No product source, runtime behavior, tests, or generated artifacts changed.
- `git status --short` was clean before report updates.

### Next action
Commit this report update and push `main`.

### Scope confirmation
No product scope added: YES
No source/test files changed: YES
CRM-CONTRACT.md honored: YES
