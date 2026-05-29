#!/usr/bin/env bash
# Working-tree + branch status, and a pointer to the next ticket.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/../.."
git status --short --branch
echo "---"
echo "open tickets:"
ls tickets/*.md 2>/dev/null || echo "  (none)"
echo "read-first: GOAL.md -> docs/ai/REPO_MAP.md -> AGENTS.md -> top ticket"
