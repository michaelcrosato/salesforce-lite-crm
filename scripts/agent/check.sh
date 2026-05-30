#!/usr/bin/env bash
# Full non-e2e gate: lint + typecheck + test + build. Fails fast.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/../.."

PM="npm"
if [[ -n "${AGENT_PKG_MANAGER:-}" ]]; then
  PM="${AGENT_PKG_MANAGER}"
elif [[ -f pnpm-lock.yaml && ! -f package-lock.json ]]; then
  PM="pnpm"
fi

if ! command -v "$PM" >/dev/null 2>&1; then
  echo "check: package manager '$PM' not found" >&2
  exit 1
fi

has_script() {
  local name="$1"
  node -e "const fs=require('fs');const p=JSON.parse(fs.readFileSync('package.json','utf8'));process.exit(p.scripts&&Object.prototype.hasOwnProperty.call(p.scripts, '$name')?0:1)" >/dev/null 2>&1
}

check_script() {
  local name="$1"
  if has_script "$name"; then
    echo "check: running $name"
    "$PM" run "$name"
    return 0
  fi
  echo "check: skipped ($name not defined in package scripts)"
  return 1
}

for script in lint typecheck test build; do
  if ! check_script "$script"; then
    echo "check: required script '$script' missing; gate cannot continue."
    exit 1
  fi
done

echo "check: passed (e2e not included; run npm run test:e2e when required)"
