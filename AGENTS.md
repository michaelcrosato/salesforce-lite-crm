# Agent Handoff

- Codex owns this branch: `feat/codex-crm-contract-api`.
- Claude Code joins after the `[UNBLOCK]` commit on branch `feat/claude-crm-ui-e2e`.
- Grok CLI joins after the `[UNBLOCK]` commit on branch `feat/grok-crm-data-reports`.
- `CRM-CONTRACT.md` is the shared source of truth for entity names, statuses, routes, and adapter signatures.
- Claude should implement UI pages and e2e coverage against the contract routes, including `/tasks`, `/cases`, and `/campaigns`.
- Grok should extend seed data, factories, analytics/report helpers, CSV helpers, and helper tests against the contract and service modules.
