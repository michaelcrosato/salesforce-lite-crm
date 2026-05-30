#!/usr/bin/env bash
# Read-only environment diagnostics. Non-zero on missing dependency or unknown state.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/../.."

echo "node:    $(command -v node >/dev/null 2>&1 && node -v || echo 'not found')"
echo "npm:     $(command -v npm  >/dev/null 2>&1 && npm -v  || echo 'not found')"
echo "pnpm:    $(command -v pnpm >/dev/null 2>&1 && pnpm -v || echo 'not found')"
echo "npx:     $(command -v npx  >/dev/null 2>&1 && echo present || echo 'not found')"
echo "git:     $(command -v git  >/dev/null 2>&1 && git --version || echo 'not found')"
echo ".env:    $([ -f .env ] && echo present || echo 'missing (run bootstrap)')"
echo "prisma client: $([ -d node_modules/@prisma/client ] && echo generated || echo 'not generated')"

if [[ -n "${AGENT_PKG_MANAGER:-}" ]]; then
  echo "agent pkg manager override: ${AGENT_PKG_MANAGER}"
fi

if [[ -f pnpm-lock.yaml && -f package-lock.json ]]; then
  echo "pkg manager lockfiles: package-lock.json and pnpm-lock.yaml (defaulting to npm)"
elif [[ -f pnpm-lock.yaml ]]; then
  echo "pkg manager lockfile: pnpm-lock.yaml"
elif [[ -f package-lock.json ]]; then
  echo "pkg manager lockfile: package-lock.json"
else
  echo "warning: no lockfile detected" >&2
fi

if ! command -v node >/dev/null 2>&1; then
  echo "doctor: node missing" >&2
  exit 1
fi
echo "doctor: ok"
