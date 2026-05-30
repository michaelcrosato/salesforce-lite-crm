#!/usr/bin/env bash
# No formatter is configured in this repo; lint enforces style.
set -euo pipefail
PM="npm"
if [[ -n "${AGENT_PKG_MANAGER:-}" ]]; then
  PM="${AGENT_PKG_MANAGER}"
elif [[ -f pnpm-lock.yaml && ! -f package-lock.json ]]; then
  PM="pnpm"
fi

if ! command -v "$PM" >/dev/null 2>&1; then
  echo "format: package manager '$PM' not found" >&2
  exit 1
fi

has_script() {
  local name="$1"
  node -e "const fs=require('fs');const p=JSON.parse(fs.readFileSync('package.json','utf8'));process.exit(p.scripts&&Object.prototype.hasOwnProperty.call(p.scripts, '$name')?0:1)" >/dev/null 2>&1
}

if [ -f package.json ] && has_script agent:format; then
  "$PM" run agent:format
  exit 0
fi

echo "format: no formatter configured (skipped); style is enforced by 'npm run lint'"
