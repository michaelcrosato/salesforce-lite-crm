#!/usr/bin/env bash
# Working-tree + branch status, and a pointer to the next ticket.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/../.."
git status --short --branch
echo "---"
echo "open tickets:"
if ls tickets/*.md >/dev/null 2>&1; then
  for ticket in tickets/TICKET*.md; do
    status=$(node -e "const fs=require('fs');const c=fs.readFileSync(process.argv[1],'utf8');const m=/\\*\\*Status:\\*\\*:\\s*([^\\n\\r]+)/.exec(c);console.log(m?m[1].trim():'');" "$ticket")
    if [[ "$status" != *Done* ]]; then
      echo "  $ticket -> $status"
    fi
  done
else
  echo "  (none)"
fi
echo "---"
echo "read-first: GOAL.md -> docs/ai/REPO_MAP.md -> AGENTS.md -> top ticket"
